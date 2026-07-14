let app = getApp();
Component({
  mixins: [],
  data: {
    CDtimeHis: "00:00:00"
  },
  properties: {},
  attached() {
    let sysInfo = app.globalData.sysInfo
    let winWith = sysInfo.windowWidth;
    let rate = winWith / 750;
    let canvasSize = 500 * rate;
    let offset = (winWith - canvasSize) / 2 ;
    this.setData({offset:offset})
    // console.log("didMount");
    // this.$page.intervalCom = this;
  },
  moved() { },
  detached() {
    console.log("didUnmount");
    clearInterval(this.data.setTime);
  },
  methods: {
    intervalTime(sec, picker='') {
      if (picker) {
        this.setData({ CDtimeHis: sec });
        return;
      }
      let sec1 = sec;
      // 倒计时转换
      console.log("interval:" + sec);
      if (sec != 0) {
        let that = this;
        let timeOld = [];
        clearInterval(that.data.setTime);
        that.setData({ CDtimeHis: app.formatSeconds(sec) });
        let setTime = setInterval(() => {
          sec = sec - 1;
          // let res = that.formatSeconds(sec);
          let res = app.formatSeconds(sec);
          that.setData({ CDtimeHis: res });
          if (sec == 0) {
            clearInterval(setTime);
          }
          //调整picker的值
          let time = [];
          if (sec > 3599) {
            let hour = Math.floor(sec / 3600);
            let min = Math.floor((sec % 3600) / 60);
            time = [hour, min];
          } else {
            let min = Math.floor(sec / 60);
            time = [0, min];
          }
          if (sec1 == sec + 1) {
            this.triggerEvent('intervalpicker', time);
          }
          if (timeOld[1] != time[1] || timeOld[2] != time[2]) {
            this.triggerEvent('intervalpicker', time);
            timeOld = time;
          }
          //调整picker的值
        }, 1000);
        this.setData({ setTime: setTime });
      } else {
        clearInterval(this.data.setTime);
        this.setData({
          CDtimeHis: "00:00:00"
        });
      }
    },
    updateCD(){
      this.triggerEvent('updatecd');
    },
  }
});
