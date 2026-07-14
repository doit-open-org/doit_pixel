const my = getApp().myCompat;
const light = require('../../../utils/light');
const comm = require('../../../utils/comm');
let app = getApp();
Page({
  data: {
    // run: ['固定','左移','右移','下移','上移','闪烁',"呼吸"],
    run: ['fixed','shiftLeft','shiftRight','moveDown','moveUp','flicker',"breathe"],
    diyObj:[],
    diyObjIndex:'100',//图片索引
    diyObjDtIndex:'100',//图片动态索引
    runIndex: 0,
    lightVal: 100,
    speedVal: 100,
    activeNav: 1,
    diyObj_dt: [], //动态diy数组
    itemObjArr: [],
    cells: [],
    // 发送频次限制
    frequency: Date.now(),
  },
  onLoad() {
    my.setCanPullDown({ canPullDown: false  });
    comm.pageInit(this);
    let sys = app.globalData.sysInfo;
    let winWidth = sys.windowWidth;
    let viewScreen = winWidth * 0.98;
    let viewWidth = viewScreen * 0.32;
    const cells = [];
    for (let index = 0; index < 400; index += 1) cells.push(index);
    this.setData({viewWidth: viewWidth, cells: cells})
  },
  changeNav(e){
    let i = e.currentTarget.dataset.i;
    this.setData({activeNav: i});
    if(i == 2){
      this.showDtDiy();
    }else{
      this.clearDtDiyInterval();
    }
  },
  showDtDiy(){
    let device_id = app.globalData.device_id;
    let diyObj_dt = this.data.diyObj_dt;
    if (!diyObj_dt || !diyObj_dt.length) { return }
    let len = diyObj_dt.length;
    let diyTimers = my.getStorageSync({key: device_id+'diy_timer'}).data;
    let diyTimersArr = [];
    if(diyTimers){
      diyTimersArr = diyTimers['timerNew_dt'] || [];
    }
    let itemObjArr = []
    for (let ind = 0; ind < len; ind++) {
      if (!diyObj_dt[ind] || !diyObj_dt[ind].length) { continue }
      let timer = diyTimersArr[ind];
      timer = !timer || timer == 0 ? 200 : timer;
      let n = 0;
      let itemLength =  diyObj_dt[ind].length;
      itemObjArr[ind] = diyObj_dt[ind][0];
      this.data['time'+ind] = setInterval(()=>{
          if(n == itemLength){n = 0}
          itemObjArr[ind] = diyObj_dt[ind][n]
          this.setData({itemObjArr: itemObjArr})
          n++;
      },timer)
    }
    this.setData({itemObjArr: itemObjArr})
  },
  // showDtDiy(){
  //   let device_id = app.globalData.device_id;
  //   let diyObj_dt = this.data.diyObj_dt;
  //   let len = diyObj_dt.length;
  //   let diyTimers = my.getStorageSync({key: device_id+'diy_timer'}).data;
  //   let diyTimersArr = [];
  //   if(diyTimers){
  //     diyTimersArr = diyTimers['timerNew_dt'];
  //   }
  //   let itemObjArr = []
  //   if(len == 0){ return }
  //   for (let ind = 0; ind < len; ind++) {
  //     let timer = diyTimersArr[ind];
  //     timer = timer == 0 ? 200 : timer;
  //     let n = 0;
  //     let itemLength =  diyObj_dt[ind].length;
  //     this.data['time'+ind] = setInterval(()=>{
  //         if(n == itemLength){n = 0}
  //         itemObjArr[ind] = n;
  //         this.setData({itemObjArr: itemObjArr})
  //         n++;
  //     },timer)
  //   }
  // },
  clearDtDiyInterval(){
    let diyObj_dt = this.data.diyObj_dt;
    let len = diyObj_dt.length;
    for (let ind = 0; ind < len; ind++){
      clearInterval(this.data['time'+ind]);
    }
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
    light.control(light.dpid.work_mode, 6).control(light.dpid.dir_index, i).done();
  },
  onShow(){
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    comm.queryDevice([4,8,35]);
    let device_id = app.globalData.device_id;
    // 静态diy数据
    let diyData = my.getStorageSync({key: device_id+'diy'}).data;
    let diyObj = [];
    if(diyData){
      diyObj = diyData['diyObj'] || [];
      this.setData({diyObj:diyObj})
    }
    //动态diy数据
    let diyData_dt = my.getStorageSync({key: device_id+'diy_dt'}).data;
    let diyObj_dt = [];
    if(diyData_dt){
      diyObj_dt = diyData_dt['diyObj_dt'] || [];
      console.log("diyObj_dt..",diyObj_dt);
      this.setData({diyObj_dt:diyObj_dt});
    }
    if(this.data.activeNav == 2){
      this.showDtDiy();
    }
    //清空newDiyObj
    app.globalData.newDiyObj = [];
    //添加完静态/动态图片下标赋0
    if(app.globalData.DiyJtIndex == 0){
      this.setData({diyObjIndex: 0})
    }
    if(app.globalData.DiyDtIndex != undefined){
      this.setData({diyObjDtIndex: app.globalData.DiyDtIndex})
    }
  },
  onHide(){
    this.clearDtDiyInterval();
    app.globalData.DiyDtIndex = undefined;
    app.globalData.DiyJtIndex = undefined;
  },
  onUnload(){
    this.clearDtDiyInterval();
    app.globalData.DiyDtIndex = undefined;
    app.globalData.DiyJtIndex = undefined;
  },
  lightChangeing(e){
    // 当前毫秒数 ，限制频次
    let t = Date.now();
    let et = this.data.frequency;
    if ((t - et) < 200) { return }
    let v = e.detail.value;
    this.setData({lightVal: v, lightFlag:false})
    let lightM = 6
    if(this.data.activeNav == 2){ lightM = 8 }
    light.control(light.dpid.work_mode, lightM).control(light.dpid.bright_value, v * 10 ).done();
    this.data.frequency = t;
  },
  lightChange(e){
    let v = e.detail.value;
    this.setData({lightVal: v})
    clearTimeout(this.data.lightTimer);
    this.data.lightTimer=setTimeout(() => {
      this.setData({lightFlag : true})
    }, 800);
    let lightM = 6
    if(this.data.activeNav == 2){ lightM = 8 }
    light.control(light.dpid.work_mode, lightM).control(light.dpid.bright_value, v * 10 ).done();
  },
  speedChangeing(e){
    // 当前毫秒数 ，限制频次
    let t = Date.now();
    let et = this.data.frequency;
    if ((t - et) < 200) { return }
    console.log(e.detail.value);
    let v = e.detail.value;
    this.setData({speedVal: v,speedFlag:false})
    light.control(light.dpid.work_mode, 6).control(light.dpid.speed_value, v * 10 ).done();
    this.data.frequency = t;
  },
  speedChange(e){
    let v = e.detail.value;
    this.setData({speedVal: v})
    clearTimeout(this.data.speedTimer);
    this.data.speedTimer=setTimeout(() => {
      this.setData({speedFlag : true})
    }, 800);
    light.control(light.dpid.work_mode, 6).control(light.dpid.speed_value, v * 10 ).done();
  },
  longPush(e){
    console.log(e.currentTarget.dataset.i);
    let i = e.currentTarget.dataset.i;
    let diyObj = this.data.diyObj;
    let that = this ;
    my.confirm({
      title: this.data.lang['deleteOrNot'],
      confirmButtonText: this.data.lang['determine'],
      cancelButtonText: this.data.lang['cancel'],
      success: (res) => {
        // console.log(res.confirm);
        if(res.confirm){
          diyObj.splice(i,1)
          that.setData({diyObj: diyObj})
          my.setStorageSync({
            key: app.globalData.device_id+'diy',
            data: {diyObj}
          });
          // that.sendData(diyObj)
          light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_index, i).done();
        }
      },
    });
  },
  clickDiy(e){
    my.showLoading({ content: 'loading...'});
    let i = e.currentTarget.dataset.i;
    let diyObj = this.data.diyObj;
    let item = diyObj[i];
    if (!item) { my.hideLoading(); return; }
    this.setData({diyObjIndex:i})

    //组装发送
    let index = 0;
    let k = 0;//延长每包数据发送时间
    let objkeysArr = Object.keys(item);
    let objLen =  objkeysArr.length;
    console.log("objLen...",objLen);
    let buwei = 10 - ((objLen % 10) != 0 ? (objLen % 10) :10)
    let time = Math.floor(objLen / 10);
    console.log("time..."+time+"...buwei..."+buwei);
    // 第一包以 40 开头最后一包以 8 开头 如果总共只有一包就 12 => c0
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
      my.hideLoading();
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
        this.sendSetTime(val,k,time);
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
        this.sendSetTime(val,k,time+1);
      }
    }
  },
  sendSetTime(val,k,t){
    setTimeout(() => {
      light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_point, val).done();
      console.log("uuuuuuuu....."+k,new Date().getTime())
      if(t == k){my.hideLoading();}
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
  },
  clickDtDiy(e){
    // my.showLoading({ content: 'loading...'});
    let i = e.currentTarget.dataset.i;
    if(i == this.data.diyObjDtIndex){ return }
    let diyObj_dt = this.data.diyObj_dt;
    let item = diyObj_dt[i];
    this.setData({diyObjDtIndex:i})
    app.sendDt_diy(item, false);
  },
  diyDtEdit(){
    let i =  this.data.diyObjDtIndex;
    if(i == 100){ return }
    my.navigateTo({ url: '../dynamicDiy/dynamicDiy?i='+i  });
  },
  diyDtCopy(){
    // 动态限制5个
    if(this.data.diyObj_dt.length == 5){
      my.alert({title:this.data.lang['moreThanFive']});
      return
    }
    let i =  this.data.diyObjDtIndex;
    if(i == 100){ return }
    let diyObj_dt = this.data.diyObj_dt
    let item = diyObj_dt[i];
    diyObj_dt.push(item);
    // console.log(doj)
    this.setData({diyObj_dt: diyObj_dt})
    let device_id = app.globalData.device_id;
    my.setStorageSync({
      key: device_id+'diy_dt',
      data: {diyObj_dt}
    });
    //复制定时器时间
    let diyTimers = my.getStorageSync({key: device_id+'diy_timer'}).data;
    let timerNew_dt = [];
    if(diyTimers){
      timerNew_dt = diyTimers['timerNew_dt'];
      timerNew_dt.push(timerNew_dt[i]);
    }
    my.setStorageSync({
      key: device_id+'diy_timer',
      data: {timerNew_dt}
    });
    //清除定时器
    this.clearDtDiyInterval();
    //展示
    this.showDtDiy();
  },
  longDtPush(e){
    let i =  this.data.diyObjDtIndex;
    if(i == 100){ return }
    let diyObj_dt = this.data.diyObj_dt
    let device_id = app.globalData.device_id;
    //获取定时器时间
    let diyTimers = my.getStorageSync({key: device_id+'diy_timer'}).data;
    let timerNew_dt = diyTimers['timerNew_dt'];
    let that = this ;
    my.confirm({
      title: this.data.lang['deleteOrNot'],
      confirmButtonText: this.data.lang['determine'],
      cancelButtonText: this.data.lang['cancel'],
      success: (res) => {
        if(res.confirm){
          //清除定时器
          that.clearDtDiyInterval();
          diyObj_dt.splice(i,1)
          that.setData({diyObj_dt: diyObj_dt})
          timerNew_dt.splice(i,1);
          my.setStorageSync({
            key: device_id+'diy_dt',
            data: {diyObj_dt}
          });
          my.setStorageSync({
            key: device_id+'diy_timer',
            data: {timerNew_dt}
          });
          //展示
          that.showDtDiy();
          // light.control(light.dpid.work_mode, 6).control(light.dpid.diy_2d_index, i).done();
        }
      },
    });
  },
  addDiyPic(){
    if(this.data.activeNav == 2){
      //动态限制5个
      if(this.data.diyObj_dt.length == 5){
        my.alert({title:this.data.lang['moreThanFive']});
        return
      }
    }
    let url = this.data.activeNav == 1 ? "../editDiy/editDiy" : "../dynamicDiy/dynamicDiy";
    my.navigateTo({ url: url });
  },
  TCPcallback(data,cmd){
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
      }
    }
  }
});
