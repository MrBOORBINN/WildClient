import { TaskConfig } from "./types";

export const TASK_CONFIGS: TaskConfig[] = [
  {
    id: 'brainstorm',
    label: 'Brainstorm Mechanics',
    icon: 'Lightbulb',
    prompt: 'I need some unique game mechanic ideas for a [GENRE] game. Can you brainstorm 3-5 innovative concepts?'
  },
  {
    id: 'code',
    label: 'Generate Code',
    icon: 'Code',
    prompt: 'Write a [LANGUAGE/ENGINE] script for [FEATURE]. Please include comments explaining the logic.'
  },
  {
    id: 'debug',
    label: 'Debug & Optimize',
    icon: 'Bug',
    prompt: 'I have this code snippet that is [ERROR/SLOW]. Can you help me fix or optimize it?\n\n```\n[CODE]\n```'
  },
  {
    id: 'level',
    label: 'Level Design',
    icon: 'Map',
    prompt: 'Help me design a level for a [GENRE] game. What should be the key beats, hazards, and rewards?'
  },
  {
    id: 'math',
    label: 'Math & Physics',
    icon: 'Calculator',
    prompt: 'What is the formula for [PHYSICS/MATH PROBLEM] in game development? Show me how to implement it.'
  },
  {
    id: 'planning',
    label: 'Project Planning',
    icon: 'ClipboardList',
    prompt: 'Create a milestone breakdown for a [GAME TYPE] project that I want to build in [TIMEFRAME].'
  },
  {
    id: 'map3d',
    label: '3D Map Generator',
    icon: 'Map',
    prompt: 'Help me design a 3D map for a [GENRE] game. What should be the layout, key landmarks, and environmental details?'
  },
  {
    id: 'platform2d',
    label: '2D Platformer Forge',
    icon: 'Layers',
    prompt: 'Help me design a 2D platformer level. What should be the flow, enemy placement, and platforming challenges?'
  }
];

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [];
