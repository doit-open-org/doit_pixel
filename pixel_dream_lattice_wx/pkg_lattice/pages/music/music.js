const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const light = require('../../../utils/light');
let locked = false;
let lockfun = null;
let that;
Page({
  data: {
    musicItems: [
      { name: '经典', value: 0, },
      { name: '柔和', value: 1 },
      { name: '动感', value: 2 },
      { name: '迪斯科', value: 3 },
    ],
    musicIndex: 0,
    musicdB: 10
  },
  onLoad() {
    that = this;
    comm.pageInitPro(that);
    my.setCanPullDown({
      canPullDown: false
    });
    my.setNavigationBar({
      title: that.data.lang['rhythm']
    });
    that.enterDeviceMusicMode();
  },
  onShow() {
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
  },
  enterDeviceMusicMode() {
    light.control(light.dpid.work_mode, 2)
      .control(light.dpid.music_index, this.data.musicIndex)
      .done();
  },
  TCPcallback(deviceData) {
    console.log('tcpcallback', deviceData)
    for (let dpid in deviceData) {
      for (let key in light.dpid) {
        if (light.dpid[key] == dpid) {
          console.log('tcpcallback', key)
          if (that[key]) {
            that[key](deviceData[dpid])
          }
          break
        }
      }
    }
  },
  micSilder(e) {
    console.log('slider 改变后的值:', e, e.detail.value)
    that.setData({
      musicdB: e.detail.value,
    })
    light.control(light.dpid.sensitivity_value, e.detail.value).done()

    locked = true
    clearTimeout(lockfun)
    lockfun = setTimeout(() => {
      locked = false
    }, 666);
  },
  sensitivity_value(e) {
    if (locked) return
    that.setData({
      musicdB: e
    })
  },
  music_index(e) {
    that.setData({
      musicIndex: e
    })
  },
  //修改音乐模式
  radioChange(e) {
    light.control(light.dpid.work_mode, 2).control(light.dpid.music_index, Number(e.detail.value)).done();
  },
});
