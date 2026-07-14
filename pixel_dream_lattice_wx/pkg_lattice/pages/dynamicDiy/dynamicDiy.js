const my = getApp().myCompat;
const light = require('../../../utils/light');
const comm = require('../../../utils/comm');
let app = getApp();
Page({
  data: {
    changeStatus: false,
    itmObj: '',
    speedHeight: 80,
    frequency: Date.now(),
    diyObj_dt:[],
    cells: [],
    dt_index: 1000,//动态diy组元素下标，添加为1000
    interValTimer: 1000 ,//默认1000毫秒
    diyIndex: 1000,//动态复制删除下标
  },
  onLoad(p) {
    my.setCanPullDown({ canPullDown: false  });
    comm.pageInit(this);
    let sys = app.globalData.sysInfo;
    let winWidth = sys.windowWidth;
    let viewScreen = winWidth * 0.98;
    let viewWidth = viewScreen * 0.32;
    const cells = [];
    for (let index = 0; index < 400; index += 1) cells.push(index);
    this.setData({viewWidth: viewWidth, diyObj_dt: [], cells: cells})
    //判断是否添加
    console.log("p...",p);
    if(p.i != undefined){
      let dt_index = p.i;
      this.setData({ dt_index: dt_index })
    }
  },

  onShow(){
    //动态图编辑后
    if(app.globalData.newDiyObj.length){
      console.log("1.....");
      this.setData({ diyObj_dt: app.globalData.newDiyObj });
      // 循环展示
      this.setDiyItemTime();
      return;
    }
    //首次进来
    let device_id = app.globalData.device_id;
    let diyData_dt = my.getStorageSync({key: device_id+'diy_dt'}).data;
    let diyTimers = my.getStorageSync({key: device_id+'diy_timer'}).data;
    let diyObj_dt = [];
    if(diyData_dt){
      let dt_index = this.data.dt_index;
      if(dt_index == 1000){ return } //添加
      diyObj_dt = diyData_dt['diyObj_dt'][dt_index];
      diyObj_dt = diyObj_dt == undefined ? [] : diyObj_dt;
      this.setData({diyObj_dt:diyObj_dt})
      app.globalData.newDiyObj = diyObj_dt;
      let timerNew_dt = diyTimers['timerNew_dt'];
      console.log("timer.....",timerNew_dt[dt_index]);
      let sh = Math.round(timerNew_dt[dt_index] / 200 * 16)
      this.setData({
        speedHeight: sh,
        interValTimer:timerNew_dt[dt_index]
      });
      // 循环展示
      let time = timerNew_dt[dt_index];
      time = time == 0 ? 200 : time;
      this.setDiyItemTime(time);
    }
  },
  onHide(){
    clearInterval(this.data.diyTimer);
  },
  onUnload(){
    clearInterval(this.data.diyTimer);
    //清除
    app.globalData.newDiyObj = [];
  },
  setDiyItemTime(time = 1000){
    let diyObj_dt = this.data.diyObj_dt;
    let len = diyObj_dt.length;
    if(len == 0) return;
    let n = 0 ;
    let that = this ;
    clearInterval(this.data.diyTimer);
    this.data.diyTimer = setInterval(()=>{
       if(n == len){n = 0}
       that.setData({itmObj: diyObj_dt[n]})
       n++;
    },time)
  },
  changeStatus(){
    let changeStatus = false;
    if(!this.data.changeStatus){ changeStatus = true }
    this.setData({changeStatus: changeStatus})
  },
  diySpeedMove(e){
    // 当前毫秒数,限制频次
    let t = Date.now();
    let et = this.data.frequency;
    if ((t - et) < 200) { return }
    let top = e.currentTarget.offsetTop;
    let y = e.touches[0].pageY;
    let speedHeight = y - top;
    let speedH = this.setSpeedHeight(speedHeight);
    //发送速度值
    this.sendSpeedVal(speedH)
    this.data.frequency = t
  },
  diySpeedMoveEnd(e){
    let top = e.currentTarget.offsetTop;
    let y = e.changedTouches[0].pageY;
    let speedHeight = y - top;
    let speedH = this.setSpeedHeight(speedHeight);
    let speedHVal = Math.round(speedH / 16);
    console.log(speedHVal);
    console.log(speedHVal * 200);
    this.setData({interValTimer: speedHVal * 200}) //0-2000毫秒
    // 循环展示2000
    let time = speedHVal * 200;
    time = time == 0 ? 200 : time
    this.setDiyItemTime(time);
    //发送速度值
    this.sendSpeedVal(speedH)
  },
  setSpeedHeight(speedHeight){
    speedHeight = speedHeight < 0 ? 0 : speedHeight;
    speedHeight = speedHeight > 160 ? 160 : speedHeight;
    this.setData({speedHeight: speedHeight});
    return speedHeight;
  },
  sendSpeedVal(sv){
    let speedV = 10-Math.round(sv / 16);
    speedV = speedV == 0 ? 10 : speedV * 100;
    console.log("speedV...",speedV);
    light.control(light.dpid.work_mode, 8).control(light.dpid.speed_value, speedV ).done();
  },
  addDiy(){
    let diyObj_dt = this.data.diyObj_dt;
    // console.log("diyObj_dtLength..",diyObj_dt.length);
    if(diyObj_dt.length == 21){
      my.alert({title: this.data.lang['moreThan21']});
      return
    }
    let newObj = {};
    diyObj_dt.push(newObj);
    this.setData({diyObj_dt: diyObj_dt})
  },
  clickDiy(e){
    let i = e.currentTarget.dataset.i;
    this.setData({diyIndex: i});
    if(this.data.changeStatus){ return }//复制或删除
    console.log("i.......",i)
    my.navigateTo({
      url: '../editDiy/editDiy?i='+ i
    });
  },
  saveDt(){
    let device_id = app.globalData.device_id;
    let diyData_dt = my.getStorageSync({key: device_id+'diy_dt'}).data;
    let diyTimers = my.getStorageSync({key: device_id+'diy_timer'}).data;
    let diyObj_dt = [];
    let timerNew_dt = []; //变化时间
    let interValTimer = this.data.interValTimer;
    let data = app.globalData.newDiyObj;
    if(diyData_dt){
      let dt_index = this.data.dt_index;
      let newTimerNew_dt = diyTimers['timerNew_dt'];
      if(dt_index < 1000){
        diyData_dt['diyObj_dt'][dt_index] = data;
        newTimerNew_dt[dt_index] = interValTimer;
      }else{
        diyData_dt['diyObj_dt'].push(data);
        newTimerNew_dt.push(interValTimer);
      }
      diyObj_dt = diyData_dt['diyObj_dt'];
      timerNew_dt = newTimerNew_dt;
    }else{
      diyObj_dt.push(data);
      timerNew_dt.push(interValTimer);
    }
    console.log("diyObj_dt...",diyObj_dt)
    my.setStorageSync({
      key: device_id+'diy_dt',
      data: {diyObj_dt}
    });
    my.setStorageSync({
      key: device_id+'diy_timer',
      data: {timerNew_dt}
    });
    app.globalData.DiyDtIndex = diyObj_dt.length-1;
    //发送。。
    // this.sendDt_diy(data)
    app.sendDt_diy(data);
  },
  diyCopy(){
    let diyIndex = this.data.diyIndex;
    let diyObj_dt = this.data.diyObj_dt;
    if(diyObj_dt.length == 21){
      my.alert({title: this.data.lang['moreThan21']});
      return
    }
    let item = this.clone(diyObj_dt[diyIndex])
    diyObj_dt.push(item);
    app.globalData.newDiyObj = diyObj_dt;
    this.setData({diyObj_dt: diyObj_dt})
    this.setDiyItemTime(this.data.interValTimer);
  },
  clone(Obj){
    var buf;
    if(Obj instanceof Array){
      buf=[];
      var i=Obj.length;
      while(i--){
        buf[i]=this.clone(Obj[i]);
      }
      return buf;
    }
    else if(Obj instanceof Object){
      buf={};
      for(var k in Obj){
        buf[k]=this.clone(Obj[k]);
      }
      return buf;
    }else{
      return Obj;
    }
  },
  diyDel(){
    let diyIndex = this.data.diyIndex;
    let diyObj_dt = this.data.diyObj_dt;
    diyObj_dt.splice(diyIndex,1);
    app.globalData.newDiyObj = diyObj_dt;
    this.setData({diyObj_dt: diyObj_dt})
    this.setDiyItemTime(this.data.interValTimer);
  },
  sendDt_diy(diyObj){//转移到app.js
    my.showLoading({ content: 'waiting...' });
    //图片数量
    let diyImgNum = diyObj.length;
    console.log(diyObj);
    let k = 0;//延长每包数据发送时间
    let diyLastFlag = false;
    //组装数据发送
    diyObj.forEach((item,index) => {
      let objkeysArr = Object.keys(item);
      let objLen =  objkeysArr.length;
      console.log("objLen...",objLen);
      let buwei = 10 - ((objLen % 10) != 0 ? (objLen % 10) :10)
      let time = Math.floor(objLen / 10);
      console.log("time..."+time+"...buwei..."+buwei);
      let indTo16 = (Number(index).toString(16)).padStart(2,'0')  //index的16进制
      // 第一包以 40 开头最后一包以 8 开头 如果总共只有一张图一包数据就c0
      // let head = "0"+index;
      let head = indTo16;
      let lastHead = Number(128+parseInt(index)).toString(16) //最后一包的head
      // 不足10个点
      if(time == 0){
        // 第一包
        if(index == 0){  head = "40" }
        // 最后一包
        if((diyImgNum-1) == index){
          head = lastHead;
          diyLastFlag = true ;
        }
        //总共只有一包
        if(diyImgNum == 1){
          head = "c0";
          diyLastFlag = true
        }
        let str = ''
        objkeysArr.forEach((itm,idx)=>{
          str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
        })
        let buweiPackage = this.buweiFun10(buwei);
        let val = head + str + buweiPackage;
        console.log("time00000Val....",val);
        // light.control(light.dpid.work_mode, 8).control(light.dpid.diy_2d_point, val).done();
        k++;
        this.sendSetTimeOld(index,val,k,diyImgNum,diyLastFlag);
      }else{
        //循环time 整除10的次数
        for(let i = 0; i < time; i++){
          // head = "0"+index;
          head = indTo16;
          // 第一包
          if(index == 0 && i == 0){ head = "40" };
          console.log("hhh111......",head)
          // 最后一包
          if(buwei == 0 && (diyImgNum-1) == index){
            if((i+1) == time){ 
              // head = "8" + index 
              head = lastHead;
              diyLastFlag = true 
            };
          }
          // 既是第一包又是最后一包
          if(diyImgNum == 1 && time == 1 && buwei == 0){
            head = "c0";
            diyLastFlag = true 
          }
          // console.log("head...."+i,head)
          let str = '';
          let newArr = objkeysArr.slice(i*10,(i*10+10));
          newArr.forEach((itm,idx)=>{
            str += this.buweiFun16(itm)+ this.buweiFun16(item[itm])+"03e8";
          })
          let val = head + str;
          // console.log("timeVal....",val)
          k++;
          this.sendSetTimeOld(index,val,k,diyImgNum,diyLastFlag);
        }
        //除10取余 补位10个点
        if(buwei > 0){
          head = indTo16;
          // 最后一包
          if((diyImgNum-1) == index){
            // head = "8" + index;
            head = lastHead
            diyLastFlag = true 
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
          k++;
          this.sendSetTimeOld(index,val,k,diyImgNum,diyLastFlag);
        }
      }
    });
  },
  sendSetTimeOld(index,val,k,diyImgNum,diyLastFlag){
    let that = this;
    setTimeout(() => {
      console.log("old.....",val);
      light.control(light.dpid.work_mode, 8).control(light.dpid.diy_2d_point, val).done();
      console.log("Olduuuuuuuu....."+index,new Date().getTime())
      if(index == (diyImgNum-1) && diyLastFlag){
          console.log("hideLoading.....")
          my.hideLoading();
          my.navigateBack();
      }
    }, 350*k);
  },
   //转16补足4位
  buweiFun16(n){
    return (Number(n).toString(16)).padStart(4,'0');
  },
  //一包10个点位，没10个点的补足10个
  buweiFun10(n){
    let str = '';
    for(let i = 0; i < n; i++){ str += '019affffffff' }
    return str;
  },
});
