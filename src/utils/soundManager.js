// Sound Manager
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.loadEnabled();
  }

  loadEnabled() {
    const saved = localStorage.getItem('lottery_soundEnabled');
    this.enabled = saved !== null ? JSON.parse(saved) : true;
  }

  saveEnabled() {
    localStorage.setItem('lottery_soundEnabled', JSON.stringify(this.enabled));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveEnabled();
  }

  isEnabled() {
    return this.enabled;
  }

  // Pre-load or create sound placeholders
  preloadSounds() {
    // Sound effects that would be added later:
    const soundNames = [
      'click', 'gameStart', 'reward', 'levelUp',
      'mineReveal', 'mineExplosion', 'cardDeal',
      'wheelSpin', 'wheelStop', 'plinkoDrop'
    ];
    
    soundNames.forEach(name => {
      this.sounds[name] = null; // Placeholder for actual audio elements
    });
  }

  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) {
      return;
    }
    
    try {
      if (this.sounds[soundName] && typeof this.sounds[soundName].play === 'function') {
        this.sounds[soundName].play().catch(() => {
          // Silently fail if audio can't play
        });
      }
    } catch (e) {
      console.error('Sound play error:', e);
    }
  }
}

export const soundManager = new SoundManager();
soundManager.preloadSounds();
