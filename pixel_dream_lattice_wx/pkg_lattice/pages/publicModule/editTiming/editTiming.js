const my = getApp().myCompat;
const comm = require('../../../../utils/comm');
const light = require('../../../../utils/light');
let app = getApp();
Page({
  data: {
    hours: '',
    mins: '',
    changePicker: [],
    repeat: '',
    switch: true,
    // index,为数组索引值
    index: [],
    // 所有定时器
    allTime: '',
    showPop: false,
    popType: 0,
    timersLoaded: false,
    day: 0 ,
    enableF: 1 ,//默认当前定时开启
  },
  onLoad(e) {
    comm.pageInit(this);
    // 禁止下拉
    my.setCanPullDown({ canPullDown: false });
    //定时器下标；
    let n = e.n;
    // let device = my.getStorageSync({ key: 'device' })
    // let device_id = device['data']['device_id'];
    let device_id = comm.getDeviceID();
    let hours = [];
    let mins = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    for (let i = 0; i < 60; i++) {
      mins.push(i)
    }
    let date = new Date();
    this.setData({
      n: n,
      hours: hours,
      mins: mins,
      device_id: device_id,
      day: date.getDate(),
      lan: comm.getLang()
    })
    //设置设备名称
    my.setNavigationBar({
      title: this.data.lang['modifyTiming']
    });
    // 请求所有定时器
    // let data = {
    //   type: "1",
    //   device_id: device_id,
    //   msg: {
    //     "attr": [14],
    //   }
    // }
    // my.call('sendCmd', data, (res) => { })
    const cachedTimerTable = comm.getTimerTable();
    if (cachedTimerTable) {
      this.getCheckIndex(cachedTimerTable);
      this.setData({ allTime: cachedTimerTable, timersLoaded: true });
    }
    comm.queryDevice([14])
  },
  TCPcallback(data) {
    let that = this;
    console.log('editTiming-tcpcallback', data)
    if (typeof data['14'] === 'string') {
      comm.saveTimerTable(data['14']);
      that.getCheckIndex(data["14"]);
      that.setData({
        allTime: data["14"],
        timersLoaded: true
      })
    }
  },
  getCheckIndex(arr) {
    if (typeof arr !== 'string') return;
    let n = this.data.n;
    let allTime = []
    for (var i = 0; i < (arr.length) / 10; i++) {
      allTime.push(arr.substr(i * 10, 10))
    }
    let timestamp = allTime[n]
    timestamp = parseInt(timestamp.substr(2, 8), 16)
    let tm = this.timestampToTime(timestamp);
    let array = tm.split(":");
    array[0] = parseInt(array[0]);
    array[1] = parseInt(array[1]);
    // array[2] = parseInt(array[2]);
    let type = allTime[n].substr(1, 1)
    let enableF = Number(allTime[n].substr(0, 1))
    let repeat;
    let sw;
    if (type == 0) {
      repeat = 1;
      sw = false;
    }
    if (type == 1) {
      repeat = 1;
      sw = true;
    }
    if (type == 2) {
      repeat = 2;
      sw = false;
    }
    if (type == 3) {
      repeat = 2;
      sw = true;
    }
    this.setData({
      index: array,
      changePicker: array,
      repeat: repeat,
      switch: sw,
      enableF: enableF
    })
    this.countTime()
  },
  changePicker(e) {
    console.log(e);
    this.setData({
      index: e.detail.value,
      changePicker: e.detail.value
    })
    this.countTime()
  },
  countTime(){
    let date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    let changePicker = this.data.changePicker;
    // console.log((changePicker[0]*60 + changePicker[1])+";;;"+(h*60 + m))
    // console.log(changePicker[0]+";;;"+changePicker[1])
    if((changePicker[0]*60 + changePicker[1]) <= ((h*60 + m))){
      var nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      let day = nextDate.getDate();
      console.log("day..",day);
      this.setData({day:day})
    }else{
      this.setData({day:date.getDate()})
    }
  },
  pickerDo(e) {
    my.showLoading({content: this.data.lang['loading']});
    console.log(e);
    // num=1取消2是确定
    let num = e.currentTarget.dataset.n;
    if (num == 2 && !this.data.timersLoaded) {
      my.hideLoading();
      my.showToast({
        type: 'none',
        content: this.data.lang['loading']
      });
      return;
    }
    // 获取修改的定时器
    let changePicker = this.data.changePicker;
    // 获取所有定时器
    let allTime = []
    let aTime = this.data.allTime;
    for (var i = 0; i < (aTime.length) / 10; i++) {
      allTime.push(aTime.substr(i * 10, 10))
    }
    // 要修改的定时器下标
    let n = this.data.n;
    // 重复
    let rp = this.data.repeat;
    // 开关
    let sw = this.data.switch;
    let type;
    if (rp == 1 && !sw) {
      type = 0;
    }
    if (rp == 1 && sw) {
      type = 1;
    }
    if (rp == 2 && !sw) {
      type = 2;
    }
    if (rp == 2 && sw) {
      type = 3;
    }
    if (num == 2) {
      var date = new Date();
      let y = date.getFullYear(); //获取完整的年份(4位)
      let m = date.getMonth() + 1; //获取当前月份(0-11,0代表1月)
      let d = date.getDate(); //获取当前日(1-31)
      let hours = date.getHours(); //获取当前日(1-31)
      let min = date.getMinutes(); //获取当前分钟
      let sec = date.getSeconds(); //获取当前秒数
      let time;
      let unixTime;
      if (changePicker) {
        // time = y + "-" + m + "-" + d + " " + changePicker[0] + ":" + changePicker[1] + ":" + changePicker[2];
        time = y + "-" + m + "-" + d + " " + changePicker[0] + ":" + changePicker[1] + ":0";
        // unixTime = Number(this.getUnixTime(time));
        // let nowTime = y + "-" + m + "-" + d + " " + hours + ":" + min + ":" + sec;
        let nowTime = y + "-" + m + "-" + d + " " + hours + ":" + min + ":0";
        // 转换成时间戳
        let guTime = this.getUnixTime(time)
        let nowUnixTime = this.getUnixTime(nowTime)
        //单次定时，判断选择的时间是否大于当前时间,如果不大于就加一天
        if (rp == 1) {
          if(nowUnixTime >= guTime){
            guTime = Number(guTime) + 86400
          }
        }
        // 将获取的时间戳转16进制
        unixTime = Number(guTime).toString(16);
      } else {
        let timestamp = allTime[n];
        unixTime = timestamp.substr(2, 8);
        // unixTime = allTime[n]["tm"];
      }

      // let on = allTime[n]["on"];
      let option = "1" + type + unixTime;
      allTime[n] = option;
      let tt = '';
      for (let i = 0; i < allTime.length; i++) {
        tt = tt + allTime[i];
      }
      console.log(tt);
      // my.alert({ title: 'allTime', content: JSON.stringify(tt) });
      // return;
      // 发送到app
      // let device = my.getStorageSync({ key: 'device' });
      // let data = {
      //   type: "2",
      //   device_id: this.data.device_id,
      //   msg: {
      //     "attr": [14],
      //     "data": {
      //       "14": tt,
      //     }
      //   }
      // }
      // my.call('sendCmd', data, (res) => { })
      this.saveTimer(tt);
      return;
    }
    my.hideLoading();
    my.navigateBack({
      delta: 1
    });
  },
  saveTimer(timer) {
    my.call('sendCmd', {
      type: 2,
      device_id: this.data.device_id,
      msg: {
        attr: [14],
        data: { '14': timer }
      }
    }, (res) => {
      my.hideLoading();
      if (!res || !res.success) {
        my.showToast({ type: 'none', content: this.data.lang['offline.title'] });
        return;
      }
      comm.saveTimerTable(timer);
      my.navigateBack({ delta: 1 });
    });
  },
  changeRepeat(e) {
    this.setData({
      repeat: e.detail.value,
      showPop: false
    })
  },
  switchStatus(e) {
    // console.log(e.detail.value);
    this.setData({
      switch: e.detail.value === 'on',
      showPop: false
    })
  },

  getUnixTime(dateStr) {
    var newstr = dateStr.replace(/-/g, '/');
    var date = new Date(newstr);
    var time_str = date.getTime().toString();
    return time_str.substr(0, 10);
  },
  timestampToTime(timestamp) {
    var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours() + ':';
    // var m = date.getMinutes() + ':';
    var m = date.getMinutes() + ':';
    var s = date.getSeconds();
    // return Y + M + D + h + m + s;

    return h + m + s
  },
  delBtn() {
    let that = this;
    let lang = this.data.lang
    my.confirm({
      title: lang['deleteOrNot'],
      confirmButtonText: lang['determine'],
      cancelButtonText: lang['cancel'],
      success: (res) => {
        if (res.confirm) {
          that.delOption();
        }
      }
    });
  },
  delOption() {
    my.showLoading({content: this.data.lang['loading']});
    let n = this.data.n;
    let allTime = [];
    let aTime = this.data.allTime;
    for (var i = 0; i < (aTime.length) / 10; i++) {
      allTime.push(aTime.substr(i * 10, 10))
    }
    let tt = '';
    for (var j = 0; j < allTime.length; j++) {
      if (n != j) {
        tt = tt + allTime[j];
      }
    }
    tt = tt + "0000000000";
    light.control(light.dpid.normal_timer, tt).done()
    setTimeout(() => {
      my.hideLoading();
      my.navigateBack({
        delta: 1
      });
    }, 500);
  },

  onShow() {
    //设置头部背景
    my.call("setTitleColor", {
      color: 2041137,
      reset: false
    })

    // let device = my.getStorageSync({ key: 'device' })
    // let device_id = device['data']['device_id'];
    let device_id = comm.getDeviceID();
    this.setData({
      device_id: device_id
    })
  },
  showModal(e){
    this.setData({
      showPop: true,
      popType: e.currentTarget.id
    })
  },
  hideModal(){
    this.setData({showPop: false})
  },
  howWork(){
    my.showToast({
      type: 'none',
      content: '本地版不支持在线帮助'
    });
  }
});
