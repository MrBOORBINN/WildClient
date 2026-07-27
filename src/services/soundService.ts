
class SoundService {
  private sounds: Record<string, HTMLAudioElement> = {};
  private isMuted: boolean = false;

  constructor() {
    // Initialize sounds with reliable CDN links
    this.sounds = {
      click: new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3'),
      pop: new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3'),
      success: new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3'),
      error: new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3'),
      xp: new Audio('https://www.soundjay.com/buttons/sounds/button-11.mp3'),
    };

    // Preload
    Object.values(this.sounds).forEach(audio => {
      audio.load();
      audio.volume = 0.3;
    });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  play(soundName: 'click' | 'pop' | 'success' | 'error' | 'xp') {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore errors from browsers blocking autoplay
      });
    }
  }
}

export const soundService = new SoundService();
