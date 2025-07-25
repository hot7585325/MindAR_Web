/* global AFRAME, THREE */

/**
 * Touch and Mouse Drag-to-Rotate and Pinch-to-Scale Component for A-Frame.
 * @namespace aframe
 * @component touch-drag-rotate-scale
 * @author Gemini
 */
AFRAME.registerComponent('touch-drag-rotate-scale', {
  // ------------------ Schema: 定義組件可接受的屬性 ------------------
  schema: {
    /**
     * @property {number} rotationSpeed - 旋轉速度的靈敏度
     */
    rotationSpeed: { type: 'number', default: 0.5 },
    /**
     * @property {number} scaleSpeed - 縮放速度的靈敏度
     */
    scaleSpeed: { type: 'number', default: 0.05 },
    /**
     * @property {string} rotationCoordinate - 旋轉座標系統 ('local' 或 'world')
     * 'local': 物件會依據自身的軸向旋轉。
     * 'world': 物件會依據場景的世界軸向旋轉。
     */
    rotationCoordinate: { type: 'string', default: 'local', oneOf: ['local', 'world'] },
    /**
     * @property {boolean} enabled - 是否啟用此組件功能
     */
    enabled: { type: 'boolean', default: true }
  },

  // ------------------ Lifecycle Methods: 組件生命週期方法 ------------------

  /**
   * 組件初始化時執行的函式，只會執行一次。
   */
  init: function () {
    // ---- 狀態變數 ----
    this.isDragging = false;      // 是否正在拖曳 (滑鼠左鍵或單指觸控)
    this.isPinching = false;      // 是否正在雙指縮放
    this.previousDragPosition = { x: 0, y: 0 }; // 上一次拖曳的螢幕位置
    this.previousPinchDistance = 0; // 上一次雙指的距離

    // ---- 為了在移除監聽器時能正確引用，預先綁定 this ----
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    // ---- 取得場景的 canvas ----
    this.canvasEl = this.el.sceneEl.canvas;
  },

  /**
   * 組件啟動或更新時執行的函式。
   */
  play: function () {
    this.addEventListeners();
  },

  /**
   * 組件暫停或移除時執行的函式。
   */
  pause: function () {
    this.removeEventListeners();
  },

  /**
   * 當組件從實體上移除時執行的函式。
   */
  remove: function () {
    this.pause();
  },

  // ------------------ Event Listeners: 事件監聽管理 ------------------

  /**
   * 新增所有事件監聽器。
   */
  addEventListeners: function () {
    // 滑鼠事件
    this.canvasEl.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp); // 監聽全域以防滑鼠移出 canvas
    window.addEventListener('mousemove', this.onMouseMove);
    this.canvasEl.addEventListener('wheel', this.onMouseWheel); // 滑鼠滾輪

    // 觸控事件
    this.canvasEl.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove);
  },

  /**
   * 移除所有事件監聽器，避免記憶體洩漏。
   */
  removeEventListeners: function () {
    // 滑鼠事件
    this.canvasEl.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.canvasEl.removeEventListener('wheel', this.onMouseWheel);

    // 觸控事件
    this.canvasEl.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchmove', this.onTouchMove);
  },

  // ------------------ Event Handlers: 事件處理函式 ------------------

  // ---- 滑鼠事件處理 ----

  onMouseDown: function (event) {
    if (!this.data.enabled) return;
    // 只處理滑鼠左鍵 (button === 0)
    if (event.button === 0) {
      this.isDragging = true;
      this.previousDragPosition.x = event.clientX;
      this.previousDragPosition.y = event.clientY;
    }
  },

  onMouseUp: function () {
    if (!this.data.enabled) return;
    this.isDragging = false;
  },

  onMouseMove: function (event) {
    if (!this.data.enabled || !this.isDragging) return;

    const deltaX = event.clientX - this.previousDragPosition.x;
    const deltaY = event.clientY - this.previousDragPosition.y;

    this.rotateObject(deltaX, deltaY);

    this.previousDragPosition.x = event.clientX;
    this.previousDragPosition.y = event.clientY;
  },

  onMouseWheel: function (event) {
    if (!this.data.enabled) return;
    // event.deltaY > 0 表示向下滾動 (縮小), < 0 表示向上滾動 (放大)
    const scaleAmount = event.deltaY > 0 ? -1 : 1;
    this.scaleObject(scaleAmount);
    // 防止頁面滾動
    event.preventDefault();
  },

  // ---- 觸控事件處理 ----

  onTouchStart: function (event) {
    if (!this.data.enabled) return;
    // 單指觸控 -> 拖曳
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousDragPosition.x = event.touches[0].clientX;
      this.previousDragPosition.y = event.touches[0].clientY;
    }
    // 雙指觸控 -> 縮放
    else if (event.touches.length === 2) {
      this.isDragging = false; // 避免單指拖曳衝突
      this.isPinching = true;
      this.previousPinchDistance = this.getPinchDistance(event.touches);
    }
  },

  onTouchEnd: function (event) {
    if (!this.data.enabled) return;
    // 當手指放開時，重設所有狀態
    this.isDragging = false;
    this.isPinching = false;
  },

  onTouchMove: function (event) {
    if (!this.data.enabled) return;
    // 單指拖曳旋轉
    if (this.isDragging && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - this.previousDragPosition.x;
      const deltaY = event.touches[0].clientY - this.previousDragPosition.y;

      this.rotateObject(deltaX, deltaY);

      this.previousDragPosition.x = event.touches[0].clientX;
      this.previousDragPosition.y = event.touches[0].clientY;
    }
    // 雙指捏合縮放
    else if (this.isPinching && event.touches.length === 2) {
      const currentPinchDistance = this.getPinchDistance(event.touches);
      const deltaDistance = currentPinchDistance - this.previousPinchDistance;

      this.scaleObject(deltaDistance * 0.1); // 乘以一個係數讓縮放更平滑

      this.previousPinchDistance = currentPinchDistance;
    }
  },


  // ------------------ Core Logic: 核心功能函式 ------------------

  /**
   * 旋轉物件的核心函式
   * @param {number} deltaX - X 軸方向的移動量
   * @param {number} deltaY - Y 軸方向的移動量
   */
  rotateObject: function(deltaX, deltaY) {
    const el = this.el;
    const data = this.data;
    const object3D = el.object3D;

    // 計算旋轉量，乘以靈敏度
    const pitch = deltaY * data.rotationSpeed * (Math.PI / 180); // 繞 X 軸旋轉 (上下)
    const yaw = deltaX * data.rotationSpeed * (Math.PI / 180);   // 繞 Y 軸旋轉 (左右)

    if (data.rotationCoordinate === 'local') {
      // --- 自身座標旋轉 (Local Coordinate) ---
      // 這種方式會讓物件以自身的軸向進行旋轉，就像飛機的翻滾和偏航。
      // rotateX 是繞著物件自身的 X 軸旋轉。
      // rotateY 是繞著物件自身的 Y 軸旋轉。
      object3D.rotateX(pitch);
      object3D.rotateY(yaw);
    } else {
      // --- 世界座標旋轉 (World Coordinate) ---
      // 這種方式會讓物件繞著場景的固定軸向旋轉，想像一下地球繞著太陽公轉。
      // 我們使用四元數 (Quaternion) 來避免萬向鎖問題 (Gimbal Lock)。

      // 創建一個代表世界 Y 軸的向量
      const worldAxisY = new THREE.Vector3(0, 1, 0);
      // 創建一個代表世界 X 軸的向量
      const worldAxisX = new THREE.Vector3(1, 0, 0);

      // 讓物件繞著世界 Y 軸旋轉
      object3D.rotateOnWorldAxis(worldAxisY, yaw);
      // 讓物件繞著世界 X 軸旋轉
      object3D.rotateOnWorldAxis(worldAxisX, pitch);
    }
  },

  /**
   * 縮放物件的核心函式
   * @param {number} amount - 縮放的量
   */
  scaleObject: function(amount) {
    const el = this.el;
    const data = this.data;
    let scale = el.getAttribute('scale');

    const scaleFactor = 1 + amount * data.scaleSpeed;

    // 更新 scale 的各個分量
    scale.x *= scaleFactor;
    scale.y *= scaleFactor;
    scale.z *= scaleFactor;

    // 設置新的 scale
    el.setAttribute('scale', scale);
  },

  /**
   * 計算雙指觸控的距離
   * @param {TouchList} touches - 觸控點列表
   * @returns {number} 兩個觸控點之間的距離
   */
  getPinchDistance: function (touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
});