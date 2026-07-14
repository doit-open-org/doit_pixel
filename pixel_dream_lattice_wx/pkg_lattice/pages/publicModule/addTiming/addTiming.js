const my = getApp().myCompat;
const comm = require('../../../../utils/comm');
let app = getApp();
const EMPTY_TIMER_TABLE = '00000000000000000000000000000000000000000000000000';
Page({
  data: {
    hours: '',
    mins: '',
    changePicker: '',
    repeat: 1,
    switch: true,
    allTime: EMPTY_TIMER_TABLE,
    index: [],
    showPop: false,
    popType: 0,
    day: 0 ,
  },
  onLoad() {
    comm.pageInit(this);
    // 禁止下拉
    my.setCanPullDown({ canPullDown: false });
    let hours = [];
    let mins = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    for (let i = 0; i < 60; i++) {
      mins.push(i)
    }
    // 获取当前的时间赋值给picker
    let date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();
    // let pickerIndex = [h, m, s]
    let pickerIndex = [h, m]
    // let device = my.getStorageSync({ key: 'device' })
    // let device_id = device['data']['device_id'];
    let device_id = comm.getDeviceID()
    const cachedTimerTable = comm.getTimerTable();
    var nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    let day = nextDate.getDate();
    this.setData({
      device_id: device_id,
      hours: hours,
      mins: mins,
      index: pickerIndex,
      changePicker: pickerIndex,
      day: day,
      lan: comm.getLang(),
      allTime: cachedTimerTable || EMPTY_TIMER_TABLE
    })
    //设置设备名称
    my.setNavigationBar({
      title: this.data.lang['addTiming']
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
    comm.queryDevice([14])
  },
  TCPcallback(data) {
    let that = this;
    console.log('addTiming-tcpcallback', data)
    if (typeof data['14'] === 'string') {
      comm.saveTimerTable(data['14']);
      that.setData({
        allTime: data['14']
      })
    }
  },
  changePicker(e) {
    // console.log(e);
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
    // console.log(e.target.dataset.n);
    // n=1取消2是确定
    let n = e.currentTarget.dataset.n;
    let changePicker = this.data.changePicker;
    // 重复
    let rp = this.data.repeat;
    // 开关
    let sw = this.data.switch;
    //定时器是否开关；
    let on = 1;
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
    if (n == 2) {
      var date = new Date();
      let y = date.getFullYear(); //获取完整的年份(4位)
      let m = date.getMonth() + 1; //获取当前月份(0-11,0代表1月)
      let d = date.getDate(); //获取当前日(1-31)
      let hours = date.getHours(); //获取当前日(1-31)
      let min = date.getMinutes(); //获取当前分钟
      let sec = date.getSeconds(); //获取当前秒数
      let time;
      if (changePicker) {
        // time = y + "-" + m + "-" + d + " " + changePicker[0] + ":" + changePicker[1] + ":" + changePicker[2];
        time = y + "-" + m + "-" + d + " " + changePicker[0] + ":" + changePicker[1] + ":0";
      } else {
        time = y + "-" + m + "-" + d + " 00:00:00";
      }
      console.log(time);
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
      let unixTime = Number(guTime).toString(16);
      console.log("unixTime:" + unixTime);
      // 发送到app
      // let device = my.getStorageSync({ key: 'device' });
      // 所有定时
      let alltime = this.data.allTime;
      // let option = {"on": on, "tp": type, "tm": unixTime}
      let option = "1" + type + unixTime;
      // alltime.push(option);
      // my.alert({ title: "alltime", content: JSON.stringify(alltime)});
      let atime = []
      let f = false;
      for (let i = 0; i < (alltime.length) / 10; i++) {
        let item = alltime.substr(i * 10, 10)
        if (!f) {
          //判断是否有同一时间的定时
          if (item.substring(2, 10) == unixTime) {
            my.alert({
              title: '',
              content: this.data.lang['timing.exists'],
              buttonText: this.data.lang['determine'],
            });
            my.hideLoading();
            return
          }
          if (item == '0000000000') {
            item = option
            f = true;
          }
        }
        atime.push(item)
      }
      let tt = '';
      for (var j = 0; j < atime.length; j++) {
        tt = tt + atime[j];
      }
      if (!f) {
        my.hideLoading();
        my.showToast({
          type: 'none',
          content: this.data.lang['timersReachedMax']
        });
        return;
      }
      console.log(tt);
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

  onShow() {
    //设置头部背景
    my.call("setTitleColor", {
      color: 2041137,
      reset: false
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
