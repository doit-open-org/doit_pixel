const my = getApp().myCompat;
const comm = require('../../../utils/comm');
let app = getApp();
Page({
  data: {
    navActive:0,
    times: []
  },
  onLoad() {
    // let device = my.getStorageSync({ key: 'device' })
    // let device_id = device['data']['device_id'];
    comm.pageInit(this);
    let device_id = comm.getDeviceID()
    this.setData({
      device_id: device_id
    })
    const cachedTimerTable = comm.getTimerTable();
    if (cachedTimerTable) this.ToTimes(cachedTimerTable);

    //监听返回
    // let that = this;
    // let log;
    // my.on('getDeviceData', (res) => {
    //   let data = res.data.msg.data;
    //   // my.alert({ title: "data", content: JSON.stringify(data) });
    //   if (data['14']) {
    //     that.ToTimes(data['14']);
    //   }
    // })
    //设置设备名称
    // my.setNavigationBar({
    //   title: this.data.lang['timing'] + ' UTC+' + (0 - new Date().getTimezoneOffset() / 60) + ":00"
    // });
    
  },

  TCPcallback(data) {
    let that = this;
    console.log('timing-tcpcallback', data)
    if (data['14']) {
      comm.saveTimerTable(data['14']);
      that.ToTimes(data['14']);
    }
    if (data['13'] != undefined) {
      if (this.counter) {
        this.counter.countDownBack(data["13"])
      }
    }
  },
  ToTimes(times) {
    if (typeof times !== 'string') return;
    let allTime = [];
    let original = [];
    for (var i = 0; i < (times.length) / 10; i++) {
      let item = times.substr(i * 10, 10);
      original.push(item);
      if (item == '0000000000') {
        continue;
      }
      let on = item.substr(0, 1) == '1' ? '1' : '';
      let type = item.substr(1, 1);
      let tms = parseInt(item.substr(2, 8), 16);
      tms = this.timestampToTime(tms);
      let option = { "on": on, "tp": type, "tms": tms, "slotIndex": i }
      allTime.push(option)
    }
    this.setData({
      times: allTime,
      original: original
    })
  },
  timestampToTime(timestamp) {
    var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours();
    // var m = date.getMinutes() + ':';
    var m = date.getMinutes();
    var s = date.getSeconds();
    // return Y + M + D + h + m + s;

    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;
    return h + ":" + m + ":" + s
  },
  add() {
    let times = this.data.times;
    let lang = this.data.lang;
    if (times.length == 5) {
      my.showToast({
        type: 'none',
        content: lang['timersReachedMax'],
        duration: 3000
      });
      // my.show({
      //   content: lang['timersReachedMax'],
      //   buttonText: lang['determine']
      // });
      return;
    }
    my.navigateTo({
      url: '../publicModule/addTiming/addTiming'
    });
  },
  timedit(e) {
    let n = e.currentTarget.dataset.index
    my.navigateTo({
      url: '../publicModule/editTiming/editTiming?n=' + n
    });
  },
  swChange(e) {
    // console.log(e);
    let check = e.detail.value;
    my.showToast({
      type: 'none',
      content: check ? this.data.lang['activationTiming'] : this.data.lang['disableTiming'],
      duration: 3000
    });
    let on = check ? 1 : 0;
    let index = e.currentTarget.dataset.index;
    let original = this.data.original;
    let option = original[index];
    original[index] = on + option.substr(1, 9);
    let tt = '';
    for (let i = 0; i < original.length; i++) {
      tt = tt + original[i]
    }
    // for (let i = 0; i < times.length; i++) {
    //   tt[i]={};
    //   tt[i]['on'] = times[i]['on']
    //   tt[i]['tp'] = times[i]['tp']
    //   tt[i]['tm'] = times[i]['tms_old']
    //   if (i == index) {
    //     tt[i]['on'] = on;
    //   }
    // }
    // my.alert({ title: 'tt', content: JSON.stringify(tt) });
    let data = {
      type: "2",
      device_id: this.data.device_id,
      msg: {
        "attr": [14],
        "data": {
          "14": tt,
        }
      }
    }
    my.call('sendCmd', data, (res) => {
      if (res && res.success) {
        comm.saveTimerTable(tt);
        this.ToTimes(tt);
      }
    })
    comm.queryDevice([14])
  },
  onShow() {
    // 禁止下拉
    my.setCanPullDown({ canPullDown: false });
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    // let device_id = comm.getDeviceID();
    // 发送查询定时器
    // let data = {
    //   type: "1",
    //   device_id: device_id,
    //   msg: {
    //     "attr": [14],
    //   }
    // }
    // my.call('sendCmd', data, (res) => { })
    const cachedTimerTable = comm.getTimerTable();
    if (cachedTimerTable) this.ToTimes(cachedTimerTable);
    comm.queryDevice([14]);
  },
  changeNav(e){
    let i = e.currentTarget.dataset.i;
    this.setData({navActive:i})
    if(i == "1"){
      comm.queryDevice([13]);
    }else{
      comm.queryDevice([14]);
    }
    // let data={};
    // data['13']=2230;
    // this.TCPcallback(data);
  },
  onReady() {
    this.counter = this.selectComponent('#cdRef');
  },
  onUnload() {
  },
  onHide() {
    // 页面隐藏
  },
});
