let locked = false;
let lockTime = null;
Component({
  mixins: [],
  properties: {
    yScale: { type: Number, value: 1 },
    type: { type: Number, value: 1 },
    banWidth: { type: Number, value: 260 },
    banHeight: { type: Number, value: 150 },
    banYuan: { type: Number, value: 10 },
    marTop: { type: Number, value: 40 }
  },
  data: {
    ceilingColorMod: 1,
    ceilingYuanTop: 0,
    ceilingYuanLeft: 0,
    mutWid: 1,////x y最大值
    mutHei: 1,////x y最大值
  },
  attached() {
    this.setData({
      mutWid: this.properties.banWidth * this.properties.yScale - this.properties.banYuan * this.properties.yScale - 4,
      mutHei: this.properties.banHeight * this.properties.yScale - this.properties.banYuan * this.properties.yScale - 4
    })
    // 延迟查询元素位置，确保布局已完成
    setTimeout(() => { this.queryBanRect(); }, 200);
  },
  moved() {

  },
  detached() {

  },
  methods: {
    queryBanRect() {
      const query = this.createSelectorQuery();
      query.select('.ceilingBan').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          this._banRect = res[0];
        }
      });
    },
    ceilingChooseMod(e) {
      let type = 2
      if (this.data.ceilingColorMod == 2) {
        type = 1
      }

      this.setData({
        ceilingColorMod: type
      })

      this.triggerEvent('colorbanchange', { type: type, touch: false });
    },
    ceilingTouchMove(e,t=true) {
      console.log(e)
      let x = e.touches[0].clientX != null ? e.touches[0].clientX : e.touches[0].pageX;
      let y = e.touches[0].clientY != null ? e.touches[0].clientY : e.touches[0].pageY;
      let offsetTop, offsetLeft;
      if (this._banRect) {
        offsetTop = this._banRect.top;
        offsetLeft = this._banRect.left;
      } else {
        offsetTop = e.currentTarget.offsetTop;
        offsetLeft = e.currentTarget.offsetLeft;
      }
      let left = x - offsetLeft - this.properties.banYuan * this.properties.yScale + 2;
      let top = y - offsetTop - this.properties.banYuan * this.properties.yScale + 2;

      left = left < 0 ? 0 : left;
      left = left > this.data.mutWid ? this.data.mutWid : left;
      top = top < 0 ? 0 : top;
      top = top > this.data.mutHei ? this.data.mutHei : top;
      console.log("left：" + left + "---top:" + top);
      this.setData({
        ceilingYuanLeft: left,
        ceilingYuanTop: top
      })

      this.triggerEvent('colorbanchange', { type: this.data.ceilingColorMod, touch: t });
      locked = true;
      clearTimeout(lockTime)
      lockTime = setTimeout(function () {
        locked = false;
      }, 800)
    },
    ceilingTouchEnd(e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const fakeEvent = {
        touches: [e.changedTouches[0]],
        currentTarget: e.currentTarget
      };
      this.ceilingTouchMove(fakeEvent, false);
    },
    //获取冷暖值
    getWarm() {
      return parseInt((this.data.ceilingYuanLeft) / (this.data.mutWid) * 1000)
    },
    //获取h、s
    getHS() {
      return [
        parseInt((this.data.ceilingYuanLeft) / (this.data.mutWid) * 360),
        parseInt((this.data.ceilingYuanTop) / (this.data.mutHei) * 100),
      ]
    },
    move2color(h, s) {
      if (locked) return
      if (65535 == h && 65535 == s) {
        return
      }
      this.setData({
        ceilingYuanLeft: (h / 360) * (this.data.mutWid),
        ceilingYuanTop: (s / 100) * (this.data.mutHei),
        ceilingColorMod: 1
      })
    },
    modTo(e) {
      this.setData({
        ceilingColorMod: e
      })
    },
    //设备返回冷暖值
    temp_value(value) {
      if (locked) return
      this.setData({
        ceilingYuanLeft: (value / 1000) * (this.data.mutWid),
        ceilingColorMod: 2
      })
    },
    getLocked() {
      return locked
    }
  },
});
