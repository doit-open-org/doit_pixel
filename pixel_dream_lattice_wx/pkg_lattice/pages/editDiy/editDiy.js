const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const { iconData,complement16 } = require('../../../imgData/imgdata');
const light = require('../../../utils/light');
let app = getApp();
Page({
  data: {
    divs: [],
    geshuToH: {},//格数对应的颜色
    bgc:'red',
    h: 0, //色度值
    m: 1, //放大倍数
    moveFlag: false, //移动标志位
    contentTop: '' , //点阵定位
    contentLeft: '' ,//点阵定位
    diffY:0 ,
    diffX:0 ,
    updFlg: false, //橡皮擦标识
    type: 0 //type0,1表示是静态，动态
  },
  onLoad(p) {
    my.setCanPullDown({ canPullDown: false });
    // comm.pageInit(this);
    comm.pageInitPro(this);
    let d = [];
    for (let i = 0; i < 400; i++) {
      d.push(i);
    }
    let sys = app.globalData.sysInfo;
    let winWidth = sys.windowWidth;
    let winHeight = sys.windowHeight;
    let colorViewWidth = winWidth * 0.7;
    this.setData({
      divs: d,
      geshuToH:{},
      colorViewWidth: colorViewWidth
    })
    //判断是否是动态添加
    console.log("p...",p);
    if(p.i != undefined){
      let dt_i = p.i;
      let diyObj = app.globalData.newDiyObj //添加时为空[]
      let diyObjItem = diyObj[dt_i];
      diyObjItem = diyObjItem == undefined ? {} : diyObjItem;
      console.log("diyObjItem..",diyObjItem)
      this.setData({
        geshuToH: diyObjItem,
        type: 1,
        dt_i: dt_i
      })
    }
  },
  onShow(){
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
  },
  conMoveViewStart(e){
    let pagex = e.changedTouches[0].pageX;
    let pagey = e.changedTouches[0].pageY;
    let x = pagex - e.currentTarget.offsetLeft;
    let y = pagey - e.currentTarget.offsetTop;
    console.log("conMoveViewStart.."+x +"::"+ y);
    this.data.conx = x;
    this.data.cony = y;
  },
  //放大定位移动
  conMoveView(e){
    let pagex = e.changedTouches[0].pageX;
    let pagey = e.changedTouches[0].pageY;
    let x = pagex - e.currentTarget.offsetLeft;
    let y = pagey - e.currentTarget.offsetTop;
    let moveFlag = this.data.moveFlag; //移动标志

    let diffy = this.data.diffY;
    let diffX = this.data.diffX;
    diffy -= (this.data.cony - y)/20;
    diffX -= (this.data.conx - x)/20;
    console.log("this.data.cony..",diffy);
    diffy = diffy > 200 ? 200 : diffy;
    diffy = diffy < -400 ? -400 : diffy;
    diffX = diffX > 200 ? 200 : diffX;
    diffX = diffX < -400 ? -400 : diffX;
    this.data.diffY = diffy;
    this.data.diffX = diffX;
    console.log("this.data.cony..",diffy);
    if(moveFlag){
      this.setData({
        contentTop: diffy,
        contentLeft: diffX
      })
    }
  },
  moveDiv(e){
    // console.log(e)
    //移动
    if(this.data.moveFlag){ return }
    
    let m = this.data.m //放大倍数
    let pagex = e.changedTouches[0].pageX;
    let pagey = e.changedTouches[0].pageY;
    let x = pagex - e.currentTarget.offsetLeft;
    let y = pagey - e.currentTarget.offsetTop;
    console.log(x +"::"+ y);
    let dzWidth = 300 * m ; //点阵块的宽度；
    let geWidth = 15 * m; //格子的宽度
    x = x > dzWidth ? dzWidth : x ;
    x = x < 0 ? 0 : x ;
    y = y > dzWidth ? dzWidth : y ;
    y = y < 0 ? 0 : y ;
    let gx = parseInt(Math.ceil(x / geWidth));
    let gy = parseInt(Math.ceil(y / geWidth));
    console.log(gx +"::"+ gy);
    let gs = ((gy-1)*20)+gx;
    console.log("gs::", gs);
    // let geshuArr = this.data.geshu;
    let geshuToH = this.data.geshuToH;
    let h = this.data.h;
    let gsV = gs-1;
    if(gsV < 0){ return };
    if(this.data.updFlg){
      //擦除
      delete geshuToH[gsV];
    }else{
      //绘制
      geshuToH[gsV] = h;
    }
    this.setData({geshuToH: geshuToH});
    console.log("geshuToH",geshuToH)
  },
  clearGs(){
    this.setData({geshuToH:{}})
  },
  roundColor(e){
    // console.log(e);
    let colorViewWidth = this.data.colorViewWidth;
    let x = e.touches[0].pageX;
    let offsetLeft = e.currentTarget.offsetLeft;
    let left = x - offsetLeft;
    let huafan = colorViewWidth-10
    left = left < 0 ? 0 : left;
    left = left > huafan ? huafan : left;
    let rate = 360 / huafan;
    let h = Math.round(left * rate);
    console.log(left+"::"+ h);
    this.setData({leftOffset: left , h: h})
  },
  big(){
    let m = this.data.m;
    m += 1;
    if(m > 3){ m = 3 }
    this.setData({ m: m })
  },
  small(){
    let m = this.data.m;
    m -= 1;
    if(m == 0){ m = 1 }
    this.setData({ m: m })
  },
  draw(){
    this.setData({moveFlag:false,updFlg:false})
  },
  moveBlock(){
    this.setData({moveFlag:true,updFlg:false})
  },
  updTap(){
    this.setData({moveFlag:false,updFlg:true})
  },
  //发单张数据
  save(){
    // 动态diy数据先不发送
    if(this.data.type == 1){
      let dt_i = this.data.dt_i;
      let geshuToH = this.data.geshuToH;
      let diyObj = app.globalData.newDiyObj
      diyObj[dt_i] = geshuToH;
      app.globalData.newDiyObj = diyObj;
      my.navigateBack();
      return
    }
    app.globalData.DiyJtIndex = 0
    //静态数据
    let geshuToH = this.data.geshuToH;
    if(Object.keys(geshuToH).length == 0){ console.log("没滑动");  return }
    //缓存
    let device_id = app.globalData.device_id;
    let diyData = my.getStorageSync({key: device_id+'diy'}).data;
    let diyObj = [];
    if(diyData){
      diyObj = diyData['diyObj'];
    }
    let diyImgLen = diyObj.length;
    // if(diyImgLen == 5){
    //   diyObj.splice(4,1) //删除最后一个
    // }
    diyObj.unshift(geshuToH);

    my.setStorageSync({
      key: device_id+'diy',
      data: {diyObj}
    });
    //缓存结束

    //组装发送
    let item = geshuToH;
    let index = 0;
    let k = 0;//延长每包数据发送时间
    let objkeysArr = Object.keys(item);
    let objLen =  objkeysArr.length;
    console.log("objLen...",objLen);
    let buwei = 10 - ((objLen % 10) != 0 ? (objLen % 10) :10)
    let time = Math.floor(objLen / 10);
    console.log("time..."+time+"...buwei..."+buwei);
    // 第一包以 40 开头最后一包以 8 开头 如果总共只有一包就 12 =>c0
    let head = "0"+index;
    // 不足10个点
    if(time == 0){
      // 第一包
      // if(index == 0){ head = "40" }
      // // 最后一包
      // if((diyImgNum-1) == index){
      //     head = "8" + index;
      //   }
      // //总共只有一包
      // if(diyImgNum == 1){ head = "c0" }
      head = "c0";
      let str = ''
      objkeysArr.forEach((itm,idx)=>{
        str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
      })
      let buweiPackage = this.buweiFun10(buwei);
      let val = head + str + buweiPackage;
      console.log("time00000Val....",val);
      light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
    }else{
      //循环time 整除10的次数
      for(let i = 0; i < time; i++){
        head = "0"+index;
        // 第一包
        if(i == 0){ head = "40" };
        // 最后一包
        if(buwei == 0 && (time-1) == i){
           head = "8" + index;
        }
        // 既是第一包又是最后一包
        if(time == 1 && buwei == 0){
          head = "c0";
        }
        let str = '';
        let newArr = objkeysArr.slice(i*10,(i*10+10));
        newArr.forEach((itm,idx)=>{
          str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
        })
        let val = head + str;
        console.log("timeVal....",val)
        // light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
        k++;
        this.sendSetTime(val,k);
      }
      //除10取余 补位10个点
      if(buwei > 0){
        // 最后一包
        head = "8" + index;
        let str = '';
        let no = 10 - buwei;
        let newArr = objkeysArr.splice(time*10, no);
        console.log("newArr....",newArr);
        newArr.forEach((itm,idx)=>{
          str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
        })
        let buweiPackage = this.buweiFun10(buwei);
        let val = head + str + buweiPackage;
        console.log("buweiVal....",val)
        // light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
        k++;
        this.sendSetTime(val,k);
      }
    }
    my.navigateBack();
  },
  //连发多张数据
  saveOld(){
    let geshuToH = this.data.geshuToH;
    if(Object.keys(geshuToH).length == 0){ console.log("没滑动");  return }
    //缓存
    let device_id = app.globalData.device_id;
    let diyData = my.getStorageSync({key: device_id+'diy'}).data;
    let diyObj = [];
    if(diyData){
      diyObj = diyData['diyObj'];
    }
    let diyImgLen = diyObj.length;
    if(diyImgLen == 5){
      diyObj.splice(4,1) //删除最后一个
    }
    diyObj.unshift(geshuToH);

    my.setStorageSync({
      key: device_id+'diy',
      data: {diyObj}
    });
    //缓存结束

    //图片数量
    let diyImgNum = diyObj.length;
    console.log(diyObj);
    let k = 0;//延长每包数据发送时间
    //组装数据发送
    diyObj.forEach((item,index) => {
      let objkeysArr = Object.keys(item);
      let objLen =  objkeysArr.length;
      console.log("objLen...",objLen);
      let buwei = 10 - ((objLen % 10) != 0 ? (objLen % 10) :10)
      let time = Math.floor(objLen / 10);
      console.log("time..."+time+"...buwei..."+buwei);
      // 第一包以 40 开头最后一包以 8 开头 如果总共只有一包就 12 =>c0
      let head = "0"+index;
      // 不足10个点
      if(time == 0){
        // 第一包
        if(index == 0){ head = "40" }
        // 最后一包
        if((diyImgNum-1) == index){
            head = "8" + index;
          }
        //总共只有一包
        if(diyImgNum == 1){ head = "c0" }
        let str = ''
        objkeysArr.forEach((itm,idx)=>{
          str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
        })
        let buweiPackage = this.buweiFun10(buwei);
        let val = head + str + buweiPackage;
        console.log("time00000Val....",val);
        light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
      }else{
        //循环time 整除10的次数
        for(let i = 0; i < time; i++){
          head = "0"+index;
          // 第一包
          if(index == 0 && i == 0){ head = "40" };
          // 最后一包
          if(buwei == 0 && (diyImgNum-1) == index){
            if((i+1) == time){ head = "8" + index };
          }
          // 既是第一包又是最后一包
          if(diyImgNum == 1 && time == 1 && buwei == 0){
            head = "c0";
          }
          let str = '';
          let newArr = objkeysArr.slice(i*10,(i*10+10));
          newArr.forEach((itm,idx)=>{
            str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
          })
          let val = head + str;
          console.log("timeVal....",val)
          // light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
          k++;
          this.sendSetTimeOld(index,val,k);
        }
        //除10取余 补位10个点
        if(buwei > 0){
          // 最后一包
          if((diyImgNum-1) == index){
            head = "8" + index;
          }
          let str = '';
          let no = 10 - buwei;
          let newArr = objkeysArr.splice(time*10, no);
          console.log("newArr....",newArr);
          newArr.forEach((itm,idx)=>{
            str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
          })
          let buweiPackage = this.buweiFun10(buwei);
          let val = head + str + buweiPackage;
          console.log("buweiVal....",val)
          // light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
          k++;
          this.sendSetTimeOld(index,val,k);
        }
      }
    });
    // my.navigateBack();
  },
  sendSetTimeOld(index,val,k){
    setTimeout(() => {
      console.log("old.....");
      light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
      console.log("Olduuuuuuuu....."+index,new Date().getTime())
    }, 350*k);
  },
  sendSetTime(val,k){
    setTimeout(() => {
      console.log(".....");
      light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
      console.log("uuuuuuuu....."+k,new Date().getTime())
    }, 350*k);
  },
  //转16补足4位
  buweiFun16(n){
    return (Number(n).toString(16)).padStart(4,'0');
  },
  //一包10个点位，没10个点的补足10个
  buweiFun10(n){
    let str = '';
    for(let i = 0; i < n; i++){
      // str += 'ffffffffffff';
      str += '019affffffff';
    }
    return str;
  }

});
