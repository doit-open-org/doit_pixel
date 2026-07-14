Component({
  properties: {
    visible: { type: Boolean, value: false },
    show: { type: Boolean, value: false },
    position: { type: String, value: 'bottom' }
  },
  methods: {
    showPopup() { this.setData({ visible: true, show: true }); },
    hide() { this.setData({ visible: false, show: false }); }
  }
});
