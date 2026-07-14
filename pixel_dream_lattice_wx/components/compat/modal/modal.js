Component({
  properties: {
    visible: { type: Boolean, value: false },
    show: { type: Boolean, value: false }
  },
  methods: {
    showModal() { this.setData({ visible: true, show: true }); },
    hide() { this.setData({ visible: false, show: false }); }
  }
});
