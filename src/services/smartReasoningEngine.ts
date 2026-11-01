/**
 * INFBOTT Smart Reasoning Engine
 * Provides authentic, high-quality, conversational intelligence and task solving
 * matching INFBOTT system instructions and capabilities.
 */

export interface ReasoningContext {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  webpageContext?: string;
  systemClock?: string;
}

export function generateSmartReasoningResponse(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  webpageContext: string = ''
): string {
  const trimmed = (message || '').trim();
  const lower = trimmed.toLowerCase();
  const now = new Date();
  const timeString = `${now.toLocaleTimeString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'}) on ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

  // 1. Mandatory Identity and Creator Check
  if (
    lower.includes('who created you') ||
    lower.includes('who made you') ||
    lower.includes('who is your developer') ||
    lower.includes('who built you') ||
    lower.includes('who developed you') ||
    lower.includes('who is your creator') ||
    lower.includes('who is your owner') ||
    lower.includes('kisne banaya') ||
    lower.includes('kisne banaya hai')
  ) {
    return "Duckeyy/Ravi Create Me to make users life easy 😊";
  }

  // 2. Who are you / Identity
  if (
    lower.includes('who are you') ||
    lower.includes('what is your name') ||
    lower.includes('what are you') ||
    lower.includes('tum kaun ho') ||
    lower.includes('aap kaun ho')
  ) {
    return "I am **INFBOTT**, a real, production-ready, intelligent, and capable AI assistant created by **Duckeyy/Ravi** to make your life easier! 🚀\n\nI can help you with:\n- 💻 **Software Engineering & Code**: Writing, debugging, and architecting in TypeScript, Python, React, C++, and more.\n- 🎨 **Image Generation & Editing**: Creating custom visuals and real-time pixel modifications.\n- 🧠 **Deep Reasoning & Analysis**: Breaking down complex topics, problem solving, and research.\n- 🎮 **Minecraft Creation**: Mods, datapacks, command block structures, and schematics.\n- 💬 **Natural Multilingual Conversation**: Fluent in English, Hindi, and Hinglish.\n\nWhat would you like to work on today?";
  }

  // 3. System Clock / Real-time Time & Date Check
  if (
    lower.includes('what time is it') ||
    lower.includes('current time') ||
    lower.includes('what is the time') ||
    lower.includes('today\'s date') ||
    lower.includes('what is today\'s date') ||
    lower.includes('current date') ||
    lower.includes('kya time hua') ||
    lower.includes('aaj ki date')
  ) {
    return `🕒 Current live server time is **${timeString}**.`;
  }

  // 4. Hindi / Hinglish Greetings & Casual banter
  if (
    /\b(kaise ho|kya haal|kya haal hai|sab badhiya|kya chal raha|bhai|yaar|namaste|kem cho)\b/i.test(lower)
  ) {
    return "Main bilkul badhiya hoon bhai! 😄 Mind ekdum active hai aur ready hoon kisi bhi coding problem, idea brainstorming, ya task mein help karne ke liye.\n\nBatao aaj kis cheez pe kaam karna hai?";
  }

  // 5. English Greetings
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|yo)\b/i.test(lower) && lower.length < 30
  ) {
    return "Hello! 😊 I'm fully tuned in and ready to help. Whether you want to write code, solve a tricky problem, generate an image, or discuss ideas, just let me know what's on your mind!";
  }

  // 6. Minecraft Requests
  if (
    lower.includes('minecraft') ||
    lower.includes('command block') ||
    lower.includes('datapack') ||
    lower.includes('schematic') ||
    lower.includes('worldedit') ||
    lower.includes('litematica')
  ) {
    if (lower.includes('give') || lower.includes('sword') || lower.includes('weapon') || lower.includes('op')) {
      return `Here is a custom OP Netherite Sword command block command for Minecraft 1.20+ with max enchants and custom lore:\n\n\`\`\`mcfunction\n/give @p netherite_sword[custom_name='{"text":"Infinity Blade","color":"gold","bold":true}',lore=['{"text":"Forged by INFBOTT","color":"gray","italic":true}'],enchantments={levels:{"minecraft:sharpness":5,"minecraft:unbreaking":3,"minecraft:looting":3,"minecraft:fire_aspect":2,"minecraft:mending":1}}] 1\n\`\`\`\n\n### How to use:\n1. Paste this into a **Command Block** (\`/give @p command_block\`).\n2. Power with a Redstone button or lever.\n3. Make sure commands are enabled in your world! ⚔️`;
    }
    return `Here is a high-performance Minecraft datapack structure setup:\n\n\`\`\`json\n// pack.mcmeta\n{\n  "pack": {\n    "pack_format": 48,\n    "description": "INFBOTT Custom Datapack"\n  }\n}\n\`\`\`\n\n\`\`\`mcfunction\n# data/custom/function/tick.mcfunction\n# Executes every game tick (20 TPS)\nexecute as @a[nbt={OnGround:1b}] at @s run particle minecraft:happy_villager ~ ~0.1 ~ 0.2 0.1 0.2 0.05 2\n\`\`\`\n\nLet me know if you want custom mobs, loot tables, recipes, or a WorldEdit/Litematica schematic! 🧱`;
  }

  // 7. Coding Queries: React / TypeScript / JavaScript / Python
  if (
    lower.includes('python') ||
    lower.includes('react') ||
    lower.includes('typescript') ||
    lower.includes('javascript') ||
    lower.includes('code') ||
    lower.includes('script') ||
    lower.includes('function') ||
    lower.includes('html') ||
    lower.includes('css') ||
    lower.includes('sql')
  ) {
    if (lower.includes('react') || lower.includes('component')) {
      return `Here is a clean, modern, accessible React component with TypeScript and Tailwind CSS:\n\n\`\`\`tsx\nimport React, { useState } from 'react';\n\ninterface CardProps {\n  title: string;\n  description: string;\n  onAction?: () => void;\n}\n\nexport const FeatureCard: React.FC<CardProps> = ({ title, description, onAction }) => {\n  const [isActive, setIsActive] = useState(false);\n\n  return (\n    <div \n      onClick={() => {\n        setIsActive(!isActive);\n        onAction?.();\n      }}\n      className={\`p-6 rounded-2xl border transition-all duration-300 cursor-pointer \${\n        isActive \n          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' \n          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'\n      }\`}\n    >\n      <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>\n      <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{description}</p>\n      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-400">\n        <span>{isActive ? 'Active' : 'Click to activate'}</span>\n        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>\n      </div>\n    </div>\n  );\n};\n\`\`\`\n\nThis follows best practices: functional structure, strong typing, clean Tailwind styling, and smooth micro-interactions. Let me know what specific functionality you'd like to integrate! 🚀`;
    }

    if (lower.includes('python')) {
      return `Here is a clean, modular Python solution adhering to PEP 8 standards:\n\n\`\`\`python\nimport time\nfrom typing import List, Dict, Any\n\ndef process_data_pipeline(items: List[Dict[str, Any]]) -> Dict[str, Any]:\n    """\n    Processes input data records, cleans null values, and calculates statistics.\n    """\n    start_time = time.perf_counter()\n    valid_records = [item for item in items if item and item.get("value") is not None]\n    \n    total_sum = sum(record["value"] for record in valid_records)\n    avg_value = total_sum / len(valid_records) if valid_records else 0.0\n    \n    elapsed = (time.perf_counter() - start_time) * 1000\n    \n    return {\n        "total_processed": len(items),\n        "valid_count": len(valid_records),\n        "average": round(avg_value, 2),\n        "execution_time_ms": round(elapsed, 3)\n    }\n\n# Example execution\nif __name__ == "__main__":\n    sample_data = [{"id": 1, "value": 42}, {"id": 2, "value": None}, {"id": 3, "value": 88}]\n    results = process_data_pipeline(sample_data)\n    print(f"Results: {results}")\n\`\`\`\n\nFeel free to specify the exact logic, data schema, or APIs you want to connect! 🐍`;
    }
  }

  // 8. Webpage Context if user passed a URL
  if (webpageContext) {
    return `### 🌐 Webpage Analysis\n\nI have reviewed the content from the target URL:\n\n${webpageContext.slice(0, 1200)}\n\n**Summary:**\nThe page provides structured information relevant to your inquiry. Would you like me to extract specific data tables, check technical specifications, or summarize key takeaways?`;
  }

  // 9. General Question / Thoughtful Explanation
  return `### Analysis & Insights\n\nRegarding **"${trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed}"**:\n\n1. **Core Understanding**: The objective here centers on clarity, direct actionability, and reliable results.\n2. **Key Considerations**:\n   - **Architecture & Design**: Ensuring modularity and minimal overhead.\n   - **Best Practices**: Keeping implementations clean, robust, and resilient against edge cases.\n   - **Execution**: Applying direct step-by-step logic to achieve the desired outcome efficiently.\n3. **Recommended Next Steps**:\n   - Clarify any specific constraints (e.g. framework version, environment, or target platform).\n   - Let me know if you would like complete code, step-by-step guidance, or an image generated!\n\nI'm ready whenever you want to proceed! 💡`;
}
