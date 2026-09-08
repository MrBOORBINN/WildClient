const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      sources: []
    };`;

const replacement1 = `const startTime = Date.now();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: startTime,
      sources: []
    };`;

content = content.replace(target1, replacement1);

const target2 = `        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
          );
        } else if (chunk.type === 'sources' && chunk.sources) {
          sourcesList.push(...chunk.sources);
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, sources: [...sourcesList] } : m)
          );
        }
      }

      // Save assistant message to Firestore`;

const replacement2 = `        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
          );
        } else if (chunk.type === 'sources' && chunk.sources) {
          sourcesList.push(...chunk.sources);
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, sources: [...sourcesList] } : m)
          );
        }
      }
      const endTime = Date.now();
      const genTime = endTime - startTime;
      
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? { ...m, generationTimeMs: genTime } : m)
      );

      // Save assistant message to Firestore`;

content = content.replace(target2, replacement2);

const target3 = `            ...assistantMessage,
            content: fullContent,
            sources: sourcesList
          });`;

const replacement3 = `            ...assistantMessage,
            content: fullContent,
            sources: sourcesList,
            generationTimeMs: genTime
          });`;

content = content.replace(target3, replacement3);

fs.writeFileSync('src/App.tsx', content);
