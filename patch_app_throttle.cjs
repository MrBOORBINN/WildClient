const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetLoop = `      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
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
      }`;

const replacementLoop = `      let lastUpdateTime = Date.now();
      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          const now = Date.now();
          // Throttle UI updates to roughly 60fps (~16ms) or 20fps (~50ms) to reduce re-render lag
          if (now - lastUpdateTime > 50) {
            setMessages(prev => 
              prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
            );
            lastUpdateTime = now;
          }
        } else if (chunk.type === 'sources' && chunk.sources) {
          sourcesList.push(...chunk.sources);
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, sources: [...sourcesList] } : m)
          );
        }
      }
      
      // Final catch-up state update to ensure nothing was left out in the throttle
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent, sources: [...sourcesList] } : m)
      );`;

if (content.includes(targetLoop)) {
    content = content.replace(targetLoop, replacementLoop);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Successfully patched App.tsx");
} else {
    console.error("Target string not found in App.tsx!");
}
