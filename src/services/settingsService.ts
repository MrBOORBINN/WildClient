import { UserSettings } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DEFAULT_SETTINGS: UserSettings = {
  account: {
    displayName: 'Duckeyy / Ravi',
    email: 'ravimakwana2079@gmail.com',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
  },
  workspace: {
    name: 'Personal Workspace',
    autosave: true,
    syncFrequency: 'realtime',
    defaultExportFormat: 'markdown',
  },
  premium: {
    plan: 'free',
    status: 'active',
    credits: 70,
  },
  personalization: {
    aiStyle: 'balanced',
    language: 'english',
    responseLength: 'normal',
    customInstructions: '',
    enableEmoji: true,
    codeFirst: false,
  },
  memory: {
    enabled: true,
    autoExtract: true,
  },
  plugins: {
    webGrounding: true,
    codeSandbox: true,
    documentVision: true,
    imageStudio: true,
    minecraftEngine: true,
  },
  codex: {
    defaultLanguage: 'TypeScript',
    autoRunCode: true,
    showLineNumbers: true,
    fontSize: 13,
    tabSize: 2,
  },
  general: {
    theme: 'pure-black',
    soundEnabled: true,
    enterSendsMessage: true,
    fontSize: 'base',
    reduceMotion: false,
  },
  usage: {
    totalMessages: 42,
    flashMessages: 38,
    proMessages: 4,
    imagesGenerated: 6,
    storageUsedBytes: 1024 * 1024 * 2.4, // 2.4 MB
  },
  notifications: {
    enabled: true,
    chatDone: true,
    securityAlerts: true,
    soundAlerts: true,
  },
  voice: {
    voiceName: 'Nova',
    speechRate: 1.0,
    autoSpeakResponse: false,
    voiceInputEnabled: true,
  },
  safety: {
    filterLevel: 'standard',
    safeSearch: true,
    promptInjectionShield: true,
  },
};

const STORAGE_KEY = 'infbott_user_settings_v2';

export function getLocalSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      account: { ...DEFAULT_SETTINGS.account, ...(parsed.account || {}) },
      workspace: { ...DEFAULT_SETTINGS.workspace, ...(parsed.workspace || {}) },
      premium: { ...DEFAULT_SETTINGS.premium, ...(parsed.premium || {}) },
      personalization: { ...DEFAULT_SETTINGS.personalization, ...(parsed.personalization || {}) },
      memory: { ...DEFAULT_SETTINGS.memory, ...(parsed.memory || {}) },
      plugins: { ...DEFAULT_SETTINGS.plugins, ...(parsed.plugins || {}) },
      codex: { ...DEFAULT_SETTINGS.codex, ...(parsed.codex || {}) },
      general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
      usage: { ...DEFAULT_SETTINGS.usage, ...(parsed.usage || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      voice: { ...DEFAULT_SETTINGS.voice, ...(parsed.voice || {}) },
      safety: { ...DEFAULT_SETTINGS.safety, ...(parsed.safety || {}) },
    };
  } catch (e) {
    console.warn('Failed to parse local settings, returning default:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('infbott-settings-changed', { detail: settings }));
  } catch (e) {
    console.warn('Failed to save settings locally:', e);
  }
}

export async function syncSettingsWithFirestore(userId: string, current: UserSettings): Promise<UserSettings> {
  if (!userId || userId === 'guest') return current;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const firestoreSettings = data.settings;
      if (firestoreSettings) {
        const merged: UserSettings = {
          ...current,
          ...firestoreSettings,
          account: {
            ...current.account,
            displayName: data.displayName || current.account.displayName,
            email: data.email || current.account.email,
            avatarUrl: data.photoURL || current.account.avatarUrl,
            ...(firestoreSettings.account || {})
          }
        };
        saveLocalSettings(merged);
        return merged;
      }
    }
    // Write current settings to Firestore
    await setDoc(userRef, { settings: current }, { merge: true });
  } catch (err) {
    console.warn('Firestore settings sync notice:', err);
  }
  return current;
}

export async function updateRemoteSettingsCategory<K extends keyof UserSettings>(
  userId: string,
  category: K,
  values: Partial<UserSettings[K]>
): Promise<UserSettings> {
  const current = getLocalSettings();
  const updated: UserSettings = {
    ...current,
    [category]: {
      ...current[category],
      ...values,
    },
  };
  saveLocalSettings(updated);

  if (userId && userId !== 'guest') {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { settings: { [category]: updated[category] } }, { merge: true });
    } catch (err) {
      console.warn('Error saving setting to Firestore:', err);
    }
  }

  return updated;
}
