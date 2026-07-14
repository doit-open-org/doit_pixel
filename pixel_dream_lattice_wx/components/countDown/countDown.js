const light = require('../../utils/light');
let app=getApp()
Component({
  mixins: [],
  data: {
    // 倒计时定时器
    setTime: '',
    CDsw: true,
    hours: '',
    mins: '',
    index: 0,
    changePicker: '',
    showPic: true
  },
  properties: {
    lang: {
      type: Object,
      value: {}
    },
    navActive: {
      type: Number,
      value: 0
    }
  },
  attached() {
    // 添加倒计时 时间
    let hours = [];
    let mins = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    for (let i = 0; i < 60; i++) {
      mins.push(i)
    }
    this.setData({
      hours: hours,
      mins: mins
    })
    // this.$page.countDown=this;
  },
  ready() {
    this.intervalC = this.selectComponent('#intervalCom');
  },
  moved() {},
  detached() {},
  methods: {
    changePicker(e) {
      // console.log(e.detail.value);
      let pVal = e.detail.value
      this.setData({
        CDindex: pVal,
        changePicker: pVal
      })
      let time = (pVal[0] < 10 ? '0' + pVal[0] : pVal[0]) + ":" + (pVal[1] < 10 ? '0' + pVal[1] : pVal[1]) + ":00"
      console.log(time);
      if (undefined != this.intervalC) {
        this.intervalC.intervalTime(time, 'picker');
      }
    },

    countDownDo(e) {
      // console.log(e.target.dataset.n);
      // n=1取消2是确定
      let n = e.currentTarget.dataset.n;
      let sec;
      let changePicker = this.data.changePicker;
      sec = changePicker[0] * 3600 + changePicker[1] * 60;
      if(changePicker[0] == undefined || sec == 0){ return }
      light.control(light.dpid.countdown, sec).done();
      
      this.setData({showPic:false})
      // 关闭倒计时窗口
      // this.hideCountDown();
    },
    // 倒计时开关
    CDsw(e) {
      // this.setData({
      //   CDsw: e.detail.value,
      // })
      // if (!e.detail.value) {
      //   light.control(light.dpid.countdown, 0).done();
      //   this.hideCountDown();
      // }
      light.control(light.dpid.countdown, 0).done();
      this.setData({showPic:true})
    },
    // hideCountDown(){
    //   this.properties.onHideCD(false)
    // },
    countDownBack(sec){
      // this.ToSec(sec);
      if (sec != 0){
        this.setData({showPic:false})
      }
      if (this.intervalC) {
        this.intervalC.intervalTime(sec)
      }
    },
    onIntervalPicker(time){
      this.setData({
        CDindex: time
      })
    },
    onUpdateCD(){
      let changePicker = this.data.changePicker;
      this.setData({showPic:true,CDindex: changePicker})
    },
    // ToSec(sec) {
    //   let time = [];
    //   if (sec > 3599) {
    //     let hour = Math.floor(sec / 3600)
    //     let min = Math.floor((sec % 3600) / 60);
    //     time = [hour, min]
    //   } else {
    //     let min = Math.floor(sec / 60);
    //     time = [0, min]
    //   }
    //   this.setData({
    //     CDindex: time
    //   })
    //   // 倒计时转换
    //   if (sec != 0) {
    //     let that = this;
    //     clearInterval(that.data.setTime);
    //     let setTime = setInterval(() => {
    //       sec = sec - 1
    //       let res = that.formatSeconds(sec)
    //       that.setData({
    //         CDtimeHis: res
    //       })
    //       if (sec == 0) {
    //         clearInterval(setTime);
    //       }
    //     }, 1000)
    //     this.setData({ setTime: setTime })
    //   } else {
    //     clearInterval(this.data.setTime);
    //     this.setData({
    //       CDtimeHis: ''
    //     })
    //   }
    // },
    // formatSeconds(value) {
    //   var theTime = parseInt(value);
    //   var middle = 0;
    //   var hour = 0;

    //   if (theTime > 60) {
    //     middle = parseInt(theTime / 60);
    //     theTime = parseInt(theTime % 60);
    //     if (middle > 60) {
    //       hour = parseInt(middle / 60);
    //       middle = parseInt(middle % 60);
    //     }
    //   }
    //   var result = "" + parseInt(theTime);
    //   if (middle > 0) {
    //     result = "" + parseInt(middle) + ":" + result;
    //   }
    //   if (middle == 0) {
    //     result = "" + 0 + ":" + result;
    //   }
    //   if (hour > 0) {
    //     result = "" + parseInt(hour) + ":" + result;
    //   }
    //   let arr = result.split(":")
    //   let h = arr[0] < 10 ? '0' + arr[0] : arr[0]
    //   let m = arr[1] < 10 ? '0' + arr[1] : arr[1]
    //   let s = arr[2] < 10 ? '0' + arr[2] : arr[2]
    //   return h + ":" + m + ":" + s;
    // },
  },
});
