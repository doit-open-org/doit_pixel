const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const light = require('../../../utils/light');
let app = getApp();
let that;
Page({
  data: {
    yScale: 1,
    lastSendTime: 0,
    hs: [360, 100],
    bright_value: 100
  },
  onLoad() {
    that = this;
    comm.pageInitPro(that);
    my.setCanPullDown({
      canPullDown: false
    });
    my.setNavigationBar({
      title: that.data.lang['color']
    });
    that.setData({
      yScale: app.globalData.yScale
    })

    // let attr = [1, 2, 16];
    // let datas = { 1: 1, 2: 0, 16: "000003e8ffff" };
    let attr = [1, 2];
    let datas = { 1: 1, 2: 0};
    light.controlFast(attr, datas)
    comm.queryDevice([16])
  },
  onReady() {
    this.colorBan = this.selectComponent('#colorBan');
  },
  onShow(){
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
  },
  
  lightSilder(e) {
    light.control(light.dpid.bright_value, e.detail.value * 10).done()
  },
  //修改亮度值
  bright_value(v) {
    that.setData({
      bright_value: v / 10
    })
  },
  //colorBan颜色改变调用
  onColorBanChange(e,t) {
    let type = e;
    if (e && e.detail) {
      type = e.detail.type;
      t = e.detail.touch;
    }
    //判断时间毫秒
    let dateTmp = (new Date()).getTime();
    if (200 > (dateTmp - that.data.lastSendTime) && t) {
      return
    }
    let str = ""
    that.data.lastSendTime = dateTmp;
    let [h, s] = that.getHS()
    that.setData({
      hs: [h, s]
    })
    // console.log("sendHS", that.data.hs)
    s = 65535 == s ? s : s * 10
    str += h.toString(16).padStart(4, '0') + s.toString(16).padStart(4, 0)
    str += that.getColorTemp()
    console.log(str);
    let attr = [1, 2, 16];
    let data = { 1: 1, 2: 0, 16: str };
    light.controlFast(attr, data)

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
  //幻彩静态颜色
  dream_static_color(value) {
    if (that.colorBan && that.colorBan.getLocked()) return
    if (typeof value !== 'string' || value.length < 8) return
    let h = parseInt(value.substr(0, 4), 16)
    let s = parseInt(value.substr(4, 4), 16) / 10

    that.setData({
      hs: [h, s]
    })

    console.log('dream_static_color', h, s)
    if (that.colorBan) that.colorBan.move2color(h, s)


  },
  //获取色温
  getColorTemp() {
    return 'ffff'
  },
  //获取hs
  getHS() {
    if (!that.colorBan) that.colorBan = that.selectComponent('#colorBan');
    return that.colorBan.getHS()
  },
});
