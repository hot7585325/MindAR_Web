AFRAME.registerComponent('is-active-component', {
  schema: {
    IsActive: { type: 'boolean', default: false }
  },

  init: function () {
    if (this.data.IsActive) {
      console.log("開啟");
    }
  },

  update: function () {
    // Do something when component's data is updated.
  },

  remove: function () {
    // Do something when the component or its entity is detached.
  },

  tick: function (time, timeDelta) {
    console.log("狀態=" + this.data.IsActive);
  }
});