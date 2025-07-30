// glb模型動畫名稱打印
AFRAME.registerComponent('log-clip-names', {
  init: function () {
    this.el.addEventListener('model-loaded', (evt) => {
      const animations = evt.detail.model.animations || [];
      if (!animations.length) {
        console.warn('此模型沒有動畫');
        return;
      }
      console.log('=== Animation Clips ===');
      animations.forEach((clip, idx) => {
        console.log(`${idx}: ${clip.name}`);
      });
    });
  }
});





// 點擊觸發glb模型動畫
AFRAME.registerComponent('toggle-glb-animation', {
  schema: {
    clip: { type: 'string', default: '' },    // 要播放的 clip 名稱，預設第一支
    playOnInit: { type: 'boolean', default: false } // 初始化完成後是否自動播放
  },

  init: function () {
    this.mixer = null;
    this.action = null;
    this.playing = false;

    // 等待模型載入完成
    this.el.addEventListener('model-loaded', (evt) => {
      const model = evt.detail.model;            // THREE.Group
      const animations = model.animations || [];
      if (!animations.length) {
        console.warn('toggle-glb-animation：此模型沒有動畫');
        return;
      }

      // 建立 AnimationMixer 並綁定指定 clip
      this.mixer = new THREE.AnimationMixer(model);
      const clipName = this.data.clip || animations[0].name;
      const clip = animations.find(c => c.name === clipName);
      if (!clip) {
        console.warn(`toggle-glb-animation：找不到 clip "${clipName}"`);
        return;
      }
      this.action = this.mixer.clipAction(clip);
      this.action.play();
      this.playing = true;

      // 如果不想一載入就播放
      if (!this.data.playOnInit) {
        this.pause();
      }
    });

    // 點擊或觸控時切換播放狀態
    this.el.addEventListener('click', this.toggle.bind(this));
    this.el.addEventListener('touchstart', this.toggle.bind(this));
  },

  tick: function (time, delta) {
    if (this.mixer) {
      this.mixer.update(delta / 1000);
    }
  },

  play: function () {
    if (!this.mixer) { return; }
    this.mixer.timeScale = 1;
    this.playing = true;
  },

  pause: function () {
    if (!this.mixer) { return; }
    this.mixer.timeScale = 0;
    this.playing = false;
  },

  toggle: function () {
    if (!this.mixer) { return; }
    this.playing ? this.pause() : this.play();
  }
});




//觸控觸發動畫
AFRAME.registerComponent('js-ani', {
  schema:
  {
    IsActive: { type: 'boolean', default: false } // 初始化完成後是否自動播放
  },
  init: function () {

    this.el.setAttribute("animation-mixer", { clip: "Character1_Reference|Take 001|BaseLayer", duration: 10, timeScale: 0 })  //把其他組件加入
    window.addEventListener("click", this.activeAni.bind(this))
    window.addEventListener("touchstart", this.activeAni.bind(this))
  },

  //控制開關
  activeAni: function () {
    const mixer = this.el.components['animation-mixer']
    this.data.IsActive = !this.data.IsActive;
    this.el.setAttribute("animation-mixer", {
      timeScale: this.data.IsActive ? 1 : 0
    });

  }
});


//重製旋轉
AFRAME.registerComponent('js-reset', {
  init: function () {
    this.resetRotate = this.resetRotate.bind(this);
    window.addEventListener('touchstart', this.resetRotate);
  },
  remove: function () {
    window.removeEventListener('touchstart', this.resetRotate);
  },
  resetRotate: function (event) {
    if (event.touches.length === 3) {
      this.el.object3D.rotation.set(0, 0, 0);
    }
  }
});
