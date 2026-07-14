const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const light = require('../../../utils/light');
let app = getApp();
let that;
Page({
  data: {
    menuList: [
      { key: 'color', bgimg: '', icon: '' },
      { key: 'effect', bgimg: '', icon: '' },
      { key: 'txt', bgimg: '', icon: '' },
      { key: 'gallery', bgimg: '', icon: '' },
      { key: 'diy', bgimg: '', icon: '' },
      { key: 'rhythm', bgimg: '', icon: '' },
      { key: 'switch', bgimg: '', icon: '' },
      { key: 'more', bgimg: '', icon: '' },
      { key: 'more', bgimg: '', icon: '' },
      { key: 'more', bgimg: '', icon: '' },
    ],
    menuIdx: 100,
    toggleDelay: false,
    bright_value: 100,
    speed_value: 100
  },
  onLoad() {
    that = this;
    comm.pageInitPro(that);
    my.setCanPullDown({
      canPullDown: false
    });
    my.setNavigationBar({
      title: that.data.lang['effect']
    });
    that.setData({
      yScale: app.globalData.yScale
    })
    // light.control(light.dpid.dream_scene_index, 60).done()
  },
  clickMenu(e) {
    let id = e.currentTarget.id;
    console.log("clickMenu", id)
    that.setData({
      menuIdx: id
    })
    light.control(light.dpid.work_mode, 1)
      .control(light.dpid.dream_scene_index, parseInt(id) + 60)
      .done()
  },
  toggleDelay() {
    that.setData({
      toggleDelay: true
    })
    setTimeout(function () {
      that.setData({
        toggleDelay: false
      })
    }, 1200)
  },
  onShow() {
    that.toggleDelay();
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    // let attr = [1, 2];
    // let datas = { 1: 1, 2: 1};
    // light.controlFast(attr, datas)
    comm.queryDevice([4,8,19])
  },
  lightSilder(e) {
    light.control(light.dpid.bright_value, e.detail.value * 10).done()
  },
  speedSilder(e) {
    light.control(light.dpid.speed_value, e.detail.value * 10).done()
  },
  //幻彩DIY场景index
  dream_scene_index(value) {
    that.setData({
      menuIdx: value - 60
    })
  },
  //修改亮度值
  bright_value(v) {
    that.setData({
      bright_value: v / 10
    })
  },
  speed_value(value) {
    that.setData({
      speed_value: parseInt(value / 10)
    })
  },
  TCPcallback(deviceData) {
    console.log('tcpcallback', deviceData)
    for (let dpid in deviceData) {

      //查找dpid对应的key
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
});
