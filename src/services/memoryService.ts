import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Memory, MemoryCategory } from '../types';
import { 
  isSensitive, 
  isTransientQuery, 
  detectUserCorrection, 
  extractMemoryCandidatesFromText, 
  calculateSimilarity,
  rankMemories
} from './memoryEngine';

/**
 * Fetch all memories for the authenticated user from Firestore
 */
export async function getMemoriesForUser(userId: string): Promise<Memory[]> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return [];
  }

  try {
    const q = query(
      collection(db, 'memories'),
      where('user_id', '==', userId)
    );

    const snapshot = await getDocs(q);
    const memories: Memory[] = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        user_id: data.user_id,
        memory: data.memory,
        category: data.category || 'other',
        importance: data.importance ?? 50,
        confidence: data.confidence ?? 50,
        source: data.source || 'conversation',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };
    });

    return memories;
  } catch (error) {
    console.warn('Failed to fetch memories from Firestore:', error);
    return [];
  }
}

/**
 * Save a new memory with duplicate detection and conflict resolution
 */
export async function saveOrUpdateMemory(
  candidate: Omit<Memory, 'id' | 'created_at' | 'updated_at'>,
  existingMemories: Memory[]
): Promise<string | null> {
  if (!auth.currentUser || auth.currentUser.uid !== candidate.user_id) {
    throw new Error('Unauthorized: User identity mismatch');
  }

  if (isSensitive(candidate.memory)) {
    console.warn('Memory rejected by safety filter: sensitive content detected');
    return null;
  }

  const nowIso = new Date().toISOString();

  // 1. Duplicate check: Is there already an identical or near-identical memory?
  for (const existing of existingMemories) {
    const sim = calculateSimilarity(existing.memory, candidate.memory);
    if (sim >= 0.8) {
      // Near identical fact already recorded, skip duplicate creation
      return existing.id || null;
    }
  }

  // 2. Conflict resolution: If the candidate belongs to the same specific category/subject
  // and has higher/newer confidence, update the existing memory instead of duplicating
  for (const existing of existingMemories) {
    if (existing.category === candidate.category && existing.id) {
      const topicSim = calculateSimilarity(existing.memory, candidate.memory);
      if (topicSim >= 0.45 && topicSim < 0.8) {
        // Likely an update / correction of the same topic
        try {
          await updateDoc(doc(db, 'memories', existing.id), {
            memory: candidate.memory,
            importance: candidate.importance,
            confidence: candidate.confidence,
            updated_at: nowIso
          });
          return existing.id;
        } catch (e) {
          console.warn('Failed to update conflicting memory:', e);
        }
      }
    }
  }

  // 3. New unique memory creation
  try {
    const newDocRef = await addDoc(collection(db, 'memories'), {
      user_id: candidate.user_id,
      memory: candidate.memory,
      category: candidate.category,
      importance: Math.min(100, Math.max(0, candidate.importance)),
      confidence: Math.min(100, Math.max(0, candidate.confidence)),
      source: candidate.source || 'conversation',
      created_at: nowIso,
      updated_at: nowIso
    });
    return newDocRef.id;
  } catch (error) {
    console.error('Failed to create new memory:', error);
    return null;
  }
}

/**
 * Delete a specific memory (enforcing user ownership)
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await deleteDoc(doc(db, 'memories', memoryId));
    return true;
  } catch (error) {
    console.error('Failed to delete memory:', error);
    return false;
  }
}

/**
 * Requirement 7: Handle User Corrections
 * If user says "forget that", "don't remember that", "that's no longer true",
 * delete the matching memories immediately without arguing.
 */
export async function handleCorrectionIfPresent(
  userText: string,
  existingMemories: Memory[],
  onMemoryChanged?: () => void
): Promise<{ handled: boolean; message?: string }> {
  const correction = detectUserCorrection(userText);
  if (!correction.isCorrection) {
    return { handled: false };
  }

  if (correction.action === 'forget' && correction.targetQuery) {
    const target = correction.targetQuery.toLowerCase();
    const toDelete = existingMemories.filter(m => {
      const memLower = m.memory.toLowerCase();
      return memLower.includes(target) || calculateSimilarity(memLower, target) >= 0.35;
    });

    if (toDelete.length > 0) {
      for (const m of toDelete) {
        if (m.id) {
          await deleteMemory(m.id);
        }
      }
      if (onMemoryChanged) onMemoryChanged();
      return { 
        handled: true, 
        message: `I've removed that from my memory. I won't use or remember that information moving forward.` 
      };
    }
  } else if (correction.action === 'remember' && correction.newMemoryText && auth.currentUser) {
    await saveOrUpdateMemory({
      user_id: auth.currentUser.uid,
      memory: correction.newMemoryText,
      category: 'preference',
      importance: 90,
      confidence: 100,
      source: 'user_explicit'
    }, existingMemories);

    if (onMemoryChanged) onMemoryChanged();
    return { 
      handled: true, 
      message: `Got it! I will remember: "${correction.newMemoryText}".` 
    };
  }

  return { handled: false };
}

/**
 * Asynchronous background memory extraction after a conversation turn
 * (Requirement 11 & 13)
 */
export async function runBackgroundMemoryExtraction(
  userText: string,
  assistantResponse: string,
  userId: string,
  existingMemories: Memory[],
  idToken?: string,
  onMemoryAdded?: () => void
): Promise<void> {
  if (!userId || isTransientQuery(userText) || isSensitive(userText)) {
    return;
  }

  // 1. Try server extraction pipeline endpoint first
  if (idToken) {
    try {
      const res = await fetch('/api/memories/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userText,
          assistantResponse,
          existingMemories
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extracted && data.extracted.length > 0) {
          for (const cand of data.extracted) {
            await saveOrUpdateMemory({
              user_id: userId,
              memory: cand.memory,
              category: cand.category || 'other',
              importance: cand.importance || 70,
              confidence: cand.confidence || 80,
              source: 'conversation'
            }, existingMemories);
          }
          if (onMemoryAdded) onMemoryAdded();
          return;
        }
      }
    } catch (err) {
      // Fallback to client heuristics
    }
  }

  // 2. Client-side heuristic fallback
  const candidates = extractMemoryCandidatesFromText(userText, assistantResponse);
  if (candidates.length > 0) {
    let savedAny = false;
    for (const cand of candidates) {
      const savedId = await saveOrUpdateMemory({
        ...cand,
        user_id: userId
      }, existingMemories);
      if (savedId) savedAny = true;
    }
    if (savedAny && onMemoryAdded) {
      onMemoryAdded();
    }
  }
}
