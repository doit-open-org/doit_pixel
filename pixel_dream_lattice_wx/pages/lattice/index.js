const my = getApp().myCompat;
const comm = require('../../utils/comm');
const light = require('../../utils/light');
const bleSession = require('../../utils/bleSession');
let app = getApp();
let that;

function ensureBleControlReady() {
  const state = bleSession.getState();
  if (state.connected && state.controlReady) return true;
  wx.showToast({ title: '请先连接设备', icon: 'error' });
  wx.switchTab({ url: '/pages/device/index' });
  return false;
}

Page({
  data: {
    network: "00",
    footIndex: 1,
    deviceIndex: 1,
    yScale: 1,
    closeFlag: false,
    myfoot_scene: false,
    scene_diy: false,
    menuList: [
      { key: 'color', bgimg: '', icon: '' },
      { key: 'effect', bgimg: '', icon: '' },
      { key: 'txt', bgimg: '', icon: '' },
      { key: 'gallery', bgimg: '', icon: '' },
      { key: 'diy', bgimg: '', icon: '' },
      { key: 'rhythm', bgimg: '', icon: '' },
      { key: 'switch', bgimg: '', icon: '' },
      { key: 'more', bgimg: '', icon: '' },
    ],
    toggleDelay: false,
    rotate: 0 ,
    jxFlag: false,
  },
  onLoad() {
    that = this;
    comm.pageInitPro(that);
    const sysinfo = app.globalData.sysInfo || {};
    const windowWidth = sysinfo.windowWidth || 375;
    const windowHeight = sysinfo.windowHeight || 667;
    const yScale = (750 / 1334) / (windowWidth / windowHeight) * 1.15;

    my.setCanPullDown({ canPullDown: false });
    that.setData({
      xScale: windowWidth / 750,
      yScale: yScale,
      network: app.globalData.network
    });
    app.globalData.yScale = yScale;
  },
  clickMenu(e) {
    const page = that || this;
    let id = e.currentTarget.id;
    console.log("clickMenu", id)
    if (!ensureBleControlReady()) return
    if (page.data.closeFlag && id != 6) return
    if (id == 6) {
      page.lightSwitch();
    } else if (id == 5) {
      my.navigateTo({ url: '/pkg_lattice/pages/music/music'  });
    } else if (id == 0) {
      my.navigateTo({ url: '/pkg_lattice/pages/colorset/colorset' });
    } else if (id == 1) {
      my.navigateTo({ url: '/pkg_lattice/pages/effect/effect' });
    } else if (id == 2) {
      my.navigateTo({ url: '/pkg_lattice/pages/txt/txt' });
    } else if (id == 3) {
      my.navigateTo({ url: '/pkg_lattice/pages/picture/picture' });
    } else if (id == 4) {
      my.navigateTo({ url: '/pkg_lattice/pages/diy/diy' });
    } else if (id == 7) {
      my.navigateTo({ url: '/pkg_lattice/pages/time/time' });
    }
  },
  toggleDelay() {
    const page = that || this;
    page.setData({
      toggleDelay: true
    })
    setTimeout(function () {
      page.setData({
        toggleDelay: false
      })
    }, 1000)
  },
  // 开关控制
  lightSwitch() {
    const page = that || this;
    let status = 1;
    if (!page.data.closeFlag) {
      status = 0;
    }
    light.control(light.dpid.switch_led, status).done()
    // waitToBackData();
  },
  onReady(){
    this.ledturnRef = this.selectComponent('#ledturnRef');
    comm.pageReady(this)
  },
  onShow() {
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    this.toggleDelay()
    // 页面显示
    comm.pageShow(this)
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
  TCPMusicCallback(data) {
    console.log("index95", data)
  },
  //开关
  switch_led(value) {
    that.setData({
      closeFlag: 0 == value
    })
  },
  rgb_turn(v){
    this.ledturnRef.rgb_turn(v);
  },
  righting(){
    this.setData({rotate: 0})
    // light.control(43, 0).done()
    let attr = [43];
    let data = {"43": 0 }
    light.controlAndroidFast(attr, data);
  },
  rotate(){
    let rotate = this.data.rotate;
    let newRotate = rotate + 90;
    newRotate = newRotate == 360 ? 0 : newRotate;
    this.setData({rotate: newRotate})
    // light.control(43, newRotate/90).done()
    let attr = [43];
    let data = {"43": newRotate/90 }
    light.controlAndroidFast(attr, data);
  },
  jxChange(){
    let jxFlag = this.data.jxFlag
    this.setData({jxFlag: !jxFlag})
    let attr = [45];
    let data = {"45": Number(!jxFlag) }
    light.controlAndroidFast(attr, data);
  },
  ledturnRef(ref){
    this.ledturnRef = ref;
  },
  calibration(){
    this.ledturnRef.showLedTurn();
  },
});
