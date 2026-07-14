const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const light = require('../../../utils/light');
let app = getApp();
const staticPictures = Array.from({ length: 30 }, (_, index) => index + 1);
const dynamicPictures = Array.from({ length: 21 }, (_, index) => index + 1);
Page({
  data: {
    // run: ['固定','左移','右移','下移','上移','闪烁',"呼吸"],
    run: ['fixed','shiftLeft','shiftRight','moveDown','moveUp','flicker',"breathe"],
    runIndex: 0,
    lightVal: 100,
    speedVal: 100,
    activeNav: 1,
    staticPictures: staticPictures,
    dynamicPictures: dynamicPictures,
    // 发送频次限制
    frequency: Date.now(),
    i: 100, //图片选择下标
  },
  onLoad() {
    my.setCanPullDown({canPullDown: false});
    let sys = app.globalData.sysInfo;
    let winWidth = sys.windowWidth;
    this.setData({imgHeight: winWidth * 0.31})
    // comm.pageInit(this);
    comm.pageInitPro(this);
  },
  onShow(){
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    comm.queryDevice([4,8,35,42])
  },
  lightChangeing(e){
    // 当前毫秒数 ，限制频次
    let t = Date.now();
    let et = this.data.frequency;
    if ((t - et) < 200) { return }
    let v = e.detail.value;
    this.setData({lightVal: v, lightFlag:false})
    light.control(light.dpid.work_mode, 7).control(light.dpid.bright_value, v * 10 ).done();
    this.data.frequency = t;
  },
  lightChange(e){
    clearTimeout(this.data.lightTimer);
    this.data.lightTimer=setTimeout(() => {
      this.setData({lightFlag : true})
    }, 800);
  },
  lightChange(e){
    let v = e.detail.value;
    this.setData({lightVal: v})
    clearTimeout(this.data.lightTimer);
    this.data.lightTimer=setTimeout(() => {
      this.setData({lightFlag : true})
    }, 800);
    light.control(light.dpid.work_mode, 7).control(light.dpid.bright_value, v * 10 ).done();
  },
  speedChangeing(e){
    // 当前毫秒数 ，限制频次
    let t = Date.now();
    let et = this.data.frequency;
    if ((t - et) < 200) { return }
    console.log(e.detail.value);
    let v = e.detail.value;
    this.setData({speedVal: v,speedFlag:false})
    light.control(light.dpid.work_mode, 7).control(light.dpid.speed_value, v * 10 ).done();
    this.data.frequency = t;
  },
  speedChange(e){
    let v = e.detail.value;
    this.setData({speedVal: v})
    clearTimeout(this.data.speedTimer);
    this.data.speedTimer=setTimeout(() => {
      this.setData({speedFlag : true})
    }, 800);
    light.control(light.dpid.work_mode, 7).control(light.dpid.speed_value, v * 10 ).done();
  },
  leftRun(){
    let runIndex = this.data.runIndex;
    if(runIndex == 0){
      runIndex = 6
    }else{
      runIndex -= 1 ;
    }
    this.setData({runIndex: runIndex});
    this.runFun(runIndex);
  },
  rightRun(){
    let runIndex = this.data.runIndex;
    if(runIndex == 6){
      runIndex = 0
    }else{
      runIndex += 1 ;
    }
    this.setData({runIndex: runIndex})
    this.runFun(runIndex);
  },
  runFun(i){
    light.control(light.dpid.work_mode, 7).control(light.dpid.dir_index, i).done();
  },
  ImgTap(e){
    let i = e.currentTarget.dataset.i;
    this.setData({i: i});
    light.control(light.dpid.work_mode, 7).control(light.dpid.pincture_index, i).done();
  },
  // ImgDongTap(e){
  //   // 动图50往后
  //   let i = e.target.dataset.i;
  //   this.setData({i: i});
  //   light.control(light.dpid.work_mode, 7).control(light.dpid.pincture_index, i).done();
  // },
  changeNav(e){
    let i = e.currentTarget.dataset.i;
    this.setData({activeNav: i});
  },
  TCPcallback(data,cmd){
    if(data['4'] !=  undefined){
      this.setData({lightVal: data['4']/10})
    }
    if(data['8'] !=  undefined){
      this.setData({speedVal: data['8']/10})
    }
    if(data['42'] !=  undefined){
      let index = data['42'];
      this.setData({i: index})
    }
    if(data['35'] !=  undefined){
      if(this.data.runIndex != data['35']){
        let runIndex = data['35'];
        this.setData({runIndex: runIndex})
      }
    }
  }
});
