const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const { iconData,complement16 } = require('../../../imgData/imgdata');
const light = require('../../../utils/light');
let app = getApp();
Page({
  data: {
    // zimu:{
    //   p:"2,3,4,5,6,7,17,27,37,36,35,34,33,32,2,12,22,32,42,52,62,72,82,92",
    //   v:"94, 95, 83, 86, 76, 73, 62, 52, 41, 31, 20, 10, 10, 67, 57, 38, 48, 29, 19,0,9",
    //   c:"7, 6, 15, 14, 23, 32, 41, 51, 62, 73, 84, 85, 96, 97",
    // },
    offsetLeft: 0,
    offsetT: 2,
    arrNum: 0, //点阵字符个数
    opacity: 1,
    h: 0, //色度值
    direction: "" ,//移动方向
    newIndexArr:[],
    charBack:[],
    newColorArr:[0,0,0,0,0,0,0,0,0,0],
    newColorArrBack:[0,0,0,0,0,0,0,0,0,0],
    // run: ['固定','左移','右移','下移','上移','闪烁',"呼吸"],
    run: ['fixed','shiftLeft','shiftRight','moveDown','moveUp','flicker',"breathe"],
    runIndex: 0,
    frequencyT: Date.now(),// 发送频次限制
    fontSw:'ed', //字符开关
    bgSw:'ed',  //背景开关
    bgI: 0,  //背景模式下标
    lightVal: 100 ,
    speedVal: 100,
    colorType: 0 ,
    hbg: 0, //背景色度值
    hbgLight: 0, //背景色度值
    bgPreviewStyle: 'top:0;background:hsl(0,80%,0%)',

  },
  onLoad() {
    my.setCanPullDown({ canPullDown: false });
    // comm.pageInit(this);
    comm.pageInitPro(this);
    let sys = app.globalData.sysInfo;
    let winWidth = sys.windowWidth;
    let winHeight = sys.windowHeight;
    let moveScreen = winWidth * 0.95;
    // let controlHeight = winHeight * 0.75 - 70 - 4; //4是border
    let contentHeight = winHeight * 0.70;
    let controlHeight = winHeight * 0.70 - 70 - 4; //4是border
    let controlHeight100 = Math.floor((controlHeight/contentHeight *100)-2)//百分比
    console.log("controlHeight100.."+controlHeight100);
    let colorStr = ''
    for (let i = 360; i > 0; i--) {
      colorStr +=  ',hsl('+i+', 100%, 50%)';
    }
    let rate = winWidth / 750;
    let roundColor = 260 * rate;//外圆
    let circlePos = roundColor / 2  //圆心或半径;
    // console.log('colorStr:' +  colorStr.substr(1));
    this.setData({
      winWidth: winWidth,
      moveScreen: moveScreen,
      controlHeight: controlHeight,
      controlHeight100: controlHeight100,
      colorStr: colorStr.substr(1),//色环颜色
      roundColor: roundColor,
      circlePos: circlePos
    })
    // let v = ["0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000"];
    // this.sing(v)

    // let bg = "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
    // let bgArr=[]
    // for (let i = 0; i < 8; i++) {
    //   bgArr.push(bg);
    // }
    // this.sing(bgArr,true);
  },
  onShow(){
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    //重置模式
    this.setData({runIndex: 0})
    //获取缓存
    let newIndexArrData = my.getStorageSync({key: app.globalData.device_id+'newIndexArr'}).data;
    let newIndexArr = '';
    if(newIndexArrData){
      newIndexArr = newIndexArrData['newIndexArr']
      this.setData({newIndexArr: newIndexArr});
    }
    let newColorArrData = my.getStorageSync({key: app.globalData.device_id+'newColorArr'}).data;
    let newColorArr = '';
    if(newColorArrData){
      newColorArr = newColorArrData['newColorArr']
      this.setData({newColorArr: newColorArr,newColorArrBack:newColorArr})
    }
    let charBackData = my.getStorageSync({key: app.globalData.device_id+'charBack'}).data;
    let charBack = '';
    if(charBackData){
      charBack = charBackData['charBack'];
      this.setData({charBack: charBack})
    }
    console.log("charBack...",charBack);
    this.showDianzhen();
    comm.queryDevice([4,8,35])
  },
  showDianzhen(){
    let newIndexArr = this.data.newIndexArr;
    let charBack = this.data.charBack;
    if(newIndexArr.length == 0){ return };
    let charStr = [];
    newIndexArr.forEach((itm,i)=>{
        let arrS = charBack[itm]
        if(arrS != undefined){
          charStr.push(arrS.join(""))
        }
    })
    //显示点阵
    this.sing(charStr)
  },
  onHide(){
    this.clear();
  },
  onUnload(){
    this.clear();
  },
  leftMove(){
    let that = this;
    let arrNum = that.data.arrNum
    let moveScreen = this.data.moveScreen;
    let arrNumMarginRight = arrNum * 10; //右边距
    let offset = arrNum * 64 + moveScreen + arrNumMarginRight;
    let offsetOld = arrNum * 64 + moveScreen + arrNumMarginRight;
    this.clear();
    this.setData({offsetLeft: moveScreen,direction:"left" })
    let moveTime = 0;
    this.data.leftTimer=setInterval(function(){
      let offsetLeft = that.data.offsetLeft;
      moveTime += 3;
      if(offset > 0){
        offset -= 3
        offsetLeft -= 3;
        that.setData({offsetLeft: offsetLeft});
      }else{
        that.setData({offsetLeft: moveScreen });
        offset = offsetOld;
        moveTime = 0;
      }
      // that.setData({moveTime: moveTime});
    },100);
  },
  rightMove(){
    let that = this;
    let arrNum = that.data.arrNum
    console.log(arrNum);
    let moveScreen = this.data.moveScreen;
    let arrNumMarginRight = arrNum * 10; //右边距
    let offset = arrNum * 64 + moveScreen + arrNumMarginRight;
    let offsetOld = arrNum * 64 + moveScreen + arrNumMarginRight;
    this.clear();
    let initOffsetLeft = 0 - (arrNum * 64 + arrNumMarginRight)
    this.setData({offsetLeft: initOffsetLeft,direction:"right"})
    let moveTime = 0;
    this.data.rightTimer=setInterval(function(){
      let offsetLeft = that.data.offsetLeft;
      moveTime += 3;
      if(offset > 0){
        offset -= 3
        offsetLeft += 3;
        that.setData({offsetLeft: offsetLeft});
      }else{
        moveTime = 0;
        that.setData({offsetLeft: initOffsetLeft });
        offset = offsetOld;
      }
      console.log("moveTime...",moveTime)
      // that.setData({moveTime: moveTime});
    },100);
  },
  topMove(){
    let that = this;
    this.clear();
    this.data.topTimer=setInterval(function(){
      let offsetT = that.data.offsetT;
      // moveTime += 3;
      offsetT -= 3;
      that.setData({offsetT: offsetT});
      if(offsetT < -70){
        that.setData({offsetT: 70});
      }
    },100);
  },
  bottomMove(){
    let that = this;
    this.clear();
    this.data.bottomTimer=setInterval(function(){
      let offsetT = that.data.offsetT;
      // moveTime += 3;
      offsetT += 3;
      that.setData({offsetT: offsetT});
      if(offsetT > 70){
        that.setData({offsetT: -70});
      }
    },100);
  },
  clear(){
    this.setData({offsetLeft: 0,offsetT: 2,});
    this.clearTimer();
  },
  clearTimer(){
    this.setData({moveTime:0, opacity: 1,direction:""})
    clearInterval(this.data.leftTimer);
    clearInterval(this.data.rightTimer);
    clearInterval(this.data.topTimer);
    clearInterval(this.data.bottomTimer);
    clearInterval(this.data.frequency);
    clearInterval(this.data.frequencyPS);
  },
  frequency(){
    console.log("frequency..........");
    this.clear();
    let that = this;
    let i = 1;
    let f = true;
    this.data.frequency = setInterval(function(){
      console.log("frequency.........")
      if(f){
        i -= 0.1;
      }else{
        i += 0.1;
      }
      that.setData({opacity:i})
      if(i > 1){ f = true }
      if(i < 0){ f = false;}
    },100)
  },
  frequencyPS(){
    console.log("frequency..........");
    this.clear();
    let that = this;
    let i =0
    this.data.frequencyPS = setInterval(function(){
      console.log("frequencyPS.........")
      if(i == 1){
        i = 0;
      }else{
        i = 1;
      }
      that.setData({opacity:i})
    },300)
  },
  inpt(e){
    console.log(e.detail.value);
    let v = e.detail.value;
    this.lattice(v);
  },

  pointStyle(left, top, hue) {
    return 'left:' + left + 'px;top:' + top + 'px;background:hsl(' + hue + ',100%,50%)';
  },
  buildPoint(left, top, c, index, count) {
    const staticHue = (this.data.newColorArr && this.data.newColorArr[index]) || 0;
    return {
      left: left,
      top: top,
      c: c,
      style0: this.pointStyle(left, top, staticHue),
      style2: this.pointStyle(left, top, 360 - (index * 64 + left)),
      style3: this.pointStyle(left, top, 360 - (index * 64 + left - top)),
      style4: this.pointStyle(left, top, (count / 2) < (index + 1) ? ((count - index) * 64 - left) : (index * 64 + left)),
      style5: this.pointStyle(left, top, (top - 4) * (360 / 64))
    };
  },
  refreshTextPointStyles(colors) {
    const colorArr = colors || this.data.newColorArr || [];
    const arrStr = (this.data.arrStr || []).map((points, index) => {
      return points.map((point) => {
        return Object.assign({}, point, {
          style0: this.pointStyle(point.left, point.top, colorArr[index] || 0)
        });
      });
    });
    this.setData({ arrStr: arrStr });
  },
  bgStyle(hue, light) {
    return 'top:0;background:hsl(' + (hue || 0) + ',80%,' + (light || 0) + '%)';
  },
  sing(s,f=false){
    let arrStr = []
    s.forEach((item,index) => {
      let arr= item;
      console.log(arr);
      var resView = [];
      for(let i =0 ;i < 256; i++){
          if(arr[i] > 0){
            let j = i % 16;
            let t = Math.floor(i / 16);
            resView.push(this.buildPoint(j * 4, t * 4, arr[i], index, s.length))
          }
      }
      arrStr.push(resView)
    });
    if(f){
      this.setData({arrStrBg: arrStr})
    }else{
      this.setData({arrStr: arrStr,arrNum: arrStr.length,arrStrBg: arrStr})
    }
    console.log("arrStr::",arrStr)
  },
  roundColor(e) {
    let type = e.currentTarget.dataset.type
    let x = e.touches[0].pageX;
    let y = e.touches[0].pageY;
    console.log("x..."+x+"..y.."+y);
    let offsetTop = e.currentTarget.offsetTop;//距离顶部偏离距离
    let offsetLeft = e.currentTarget.offsetLeft;
    let left = x - offsetLeft;
    let top = y - offsetTop;
    app.globalData.timeStamp=e.timeStamp;
    // 当前毫秒数 ，限制频次
    let t = Date.now();
    let et = this.data.frequencyT;
    if ((t - et) < 200) { return }
    this.posHandler(left, top, type);
    this.data.frequencyT = t
  },
    roundEndTap(e) {
      console.log("roundEndTap:", e)
      let type = e.currentTarget.dataset.type;
      let x = e.changedTouches[0].pageX;
      let y = e.changedTouches[0].pageY;
      let offsetTop = e.currentTarget.offsetTop;//距离顶部偏离距离
      let offsetLeft = e.currentTarget.offsetLeft;
      let left = Math.round(x - offsetLeft);
      let top = Math.round(y - offsetTop);
      this.posHandler(left, top, type);
      my.setStorage({
        key: app.globalData.device_id + 'colorPos',
        data: { "x": left, "y": top }
      });
      // app.globalData.timeStamp=e.timeStamp
    },
    posHandler(x, y,type) {
      let circlePos = this.data.circlePos;
      let diffX = x - circlePos;
      let diffy = y - circlePos;
      let j = this.computerAngel(diffX, diffy);
      let degJ = Math.ceil(j)
      j = 360 - j;
      console.log("93:",Math.ceil(j));
      if(type == "font"){
        //遍历颜色数组，赋值
        let newColorArr = this.data.newColorArr
        let arr = [];
        newColorArr.forEach((item)=>{
          arr.push(j);
        })
        this.setData({degJ: degJ,h: Math.ceil(j),newColorArr:arr,colorType:0});
        this.refreshTextPointStyles(arr);
      }else{
        this.setData({degJBg: degJ,hbg:Math.ceil(j),hbgLight:30,bgPreviewStyle:this.bgStyle(Math.ceil(j), 30)})
      }
      
      // this.hsvToXY(j, dis);
      // 发送数据
      this.sendDataToApp(j,type)
    },
    sendDataToApp(j,type){
      // 当前毫秒数 ，限制频次
      // let t = Date.now();
      // let et = this.data.frequencyT;
      // if ((t - et) < 200) { return }
      let h = complement16(Math.round(j).toString(16),4);
      let val = "01"+h+"03e8ffff";
      let bgi = this.data.bgI ? this.data.bgI : 4;
      let valBg = "0"+bgi+h+"03e8ffff";
      if(type == "font"){
        light.control(light.dpid.work_mode, 5).control(light.dpid.text_char_modecolor, val).done();
      }else{
        light.control(light.dpid.work_mode, 5).control(light.dpid.text_border_color, valBg).done();
      }
      // let attr = [1, 2, 3, 5, 6];
      // let data = {"3": 65535, "5": Math.round(j), "6": this.data.saturation * 10 }
      // light.controlFast(attr, data);
      // this.data.frequencyT = t
    },
    computerAngel(x, y) {
      let j = 0;
      if (x > 0 && y > 0) {
        let angel = Math.atan(y / x)
        j = this.htoj(angel);
      }
      if (x < 0 && y > 0) {
        let angel = Math.PI - Math.abs(Math.atan(y / x))
        j = this.htoj(angel);
      }
      if (x < 0 && y < 0) {
        let angel = Math.PI + Math.abs(Math.atan(y / x))
        j = this.htoj(angel);
      }
      if (x > 0 && y < 0) {
        let angel = 2 * Math.PI - Math.abs(Math.atan(y / x))
        j = this.htoj(angel);
      }
      if (x < 0 && y == 0) {
        j = 180;
      }
      return j;
    },
    htoj(h) {
      let j = h * 180 / Math.PI;
      return j;
    },
    jtoh(j) {
      let h = j * Math.PI / 180;
      return h;
    },
    jumpTxtPage(){
      console.log("..........")
      my.navigateTo({
        url: '../editTxt/editTxt'
      });
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
      light.control(light.dpid.work_mode, 5).control(light.dpid.dir_index, runIndex).done();
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
      light.control(light.dpid.work_mode, 5).control(light.dpid.dir_index, runIndex).done();
    },
    runFun(i){
      this.clearTimer();
      // ['固定','左移','右移','下移','上移','闪烁',"呼吸"],;
      switch (i) {
        case 0:
          this.clear();
          break;
        case 1:
          this.leftMove();
          break;
        case 2:
          this.rightMove();
          break;
        case 3:
          this.bottomMove();
          break;
        case 4:
          // this.clear();
          this.topMove();
          break;
        case 5:
          this.frequencyPS();
          break;
        case 6:
          this.frequency();
          break;
        default:
          break;
      }
      // light.control(light.dpid.work_mode, 5).control(light.dpid.dir_index, i).done();
    },
    colorSwitch(e){
      let type = e.currentTarget.dataset.type
      console.log("type..."+type);
      let j = this.data.h;
      let h = complement16(Math.round(j).toString(16),4);
      let hbg = complement16((this.data.hbg).toString(16),4)
      let val = '';
      if(type == "font"){
        val = "00"+h+"03e8ffff";
        let newColorArrBack =this.data.newColorArrBack;
        this.setData({newColorArr: newColorArrBack,colorType:0});
        this.refreshTextPointStyles(newColorArrBack);
        light.control(light.dpid.work_mode, 5).control(light.dpid.text_char_modecolor, val).done();
      }else{
        this.setData({hbgLight:0,bgI:0,bgPreviewStyle:this.bgStyle(this.data.hbg, 0)})
        val = "00"+hbg+"03e80000";
        light.control(light.dpid.work_mode, 5).control(light.dpid.text_border_color, val).done();
      }
    },
    changeModel(e){
      let type = e.currentTarget.dataset.type
      let i = e.currentTarget.dataset.i
      let j = this.data.h;
      let h = complement16(Math.round(j).toString(16),4);
      let val = "0"+i+h+"03e8ffff";
      let bgVal =  "0"+i+"008a03e80000";
      console.log("val..."+val);
      if(type == "font"){
        this.setData({colorType:i})
        light.control(light.dpid.work_mode, 5).control(light.dpid.text_char_modecolor, val).done();
      }else{
        this.setData({hbgLight:0,bgI:i,bgPreviewStyle:this.bgStyle(this.data.hbg, 0)})
        light.control(light.dpid.work_mode, 5).control(light.dpid.text_border_color, bgVal).done();
      }
    },
    lightChangeing(e){
      // 当前毫秒数 ，限制频次
      let t = Date.now();
      let et = this.data.frequencyT;
      if ((t - et) < 200) { return }
      console.log(e.detail.value);
      let v = e.detail.value;
      this.setData({lightVal: v, lightFlag:false})
      light.control(light.dpid.work_mode, 5).control(light.dpid.bright_value, v * 10 ).done();
      this.data.frequencyT = t;
    },
    lightChange(e){
      let v = e.detail.value;
      this.setData({lightVal: v})
      clearTimeout(this.data.lightTimer);
      this.data.lightTimer=setTimeout(() => {
        this.setData({lightFlag : true})
      }, 800);
      light.control(light.dpid.work_mode, 5).control(light.dpid.bright_value, v * 10 ).done();
    },
    speedChangeing(e){
      // 当前毫秒数 ，限制频次
      let t = Date.now();
      let et = this.data.frequencyT;
      if ((t - et) < 200) { return }
      console.log(e.detail.value);
      let v = e.detail.value;
      this.setData({speedVal: v,speedFlag:false})
      light.control(light.dpid.work_mode, 5).control(light.dpid.speed_value, v * 10 ).done();
      this.data.frequencyT = t;
    },
    speedChange(e){
      clearTimeout(this.data.speedTimer);
      this.data.speedTimer=setTimeout(() => {
        this.setData({speedFlag : true})
      }, 800);
      let v = e.detail.value;
      this.setData({speedVal: v })
      light.control(light.dpid.work_mode, 5).control(light.dpid.speed_value, v * 10 ).done();
    },
    TCPcallback(data,cmd){
      if(data['38'] !=  undefined){
         let v = data['38'].substr(0,2)
         if(v == "00" ){
            this.setData({fontSw: ''})
         }else{
            this.setData({fontSw: 'ed'})
         }
      }
      if(data['39'] !=  undefined){
        let v = data['39'].substr(0,2)
        if(v == "00" ){
          this.setData({bgSw: ''})
        }else{
          this.setData({bgSw:'ed'})
        }
      }
      if(data['4'] !=  undefined){
        this.setData({lightVal: data['4']/10})
      }
      if(data['8'] !=  undefined){
        this.setData({speedVal: data['8']/10})
      }
      if(data['35'] !=  undefined){
        if(this.data.runIndex != data['35']){
          let runIndex = data['35'];
          this.setData({runIndex: runIndex})
          this.runFun(runIndex);
        }
      }
    }

});
