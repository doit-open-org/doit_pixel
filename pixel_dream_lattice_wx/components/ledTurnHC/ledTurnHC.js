const comm = require('../../utils/comm');
const light = require('../../utils/light');
let app = getApp()
Component({
  mixins: [],
  data: {
    //灯序modal是否打开
    ledTurnModalShow: false,
    //颜色
    led_turn: [
      {
        name: 'RGBTurnModal.red',
        value: 'R'
      },
      {
        name: 'RGBTurnModal.green',
        value: 'G',
      },
      {
        name: 'RGBTurnModal.blue',
        value: 'B',
      },
    ],
    senceObj: {
      23: 0,
      33: 1,
      35: 2,
      38: 3,
      39: 4
    },
    currentLedTurn: 0,
    //备份
    led_turnFull: [
      {
        name: 'RGBTurnModal.red',
        value: 'R',
      },
      {
        name: 'RGBTurnModal.green',
        value: 'G',
      },
      {
        name: 'RGBTurnModal.blue',
        value: 'B',
      },
    ],
    //设备目前的ledTurnKey
    deviceLedTurnKey: 'RGB',
    //此处操作的led turn 的顺序,例如'R'、'RB'、'RG'
    ledTurnKey: '',
    //RBG对应发送消息顺序
    ledTurnValueMapping: {
      R: 'ff000003e8ffff',
      G: 'ff007803e8ffff',
      B: 'ff00f003e8ffff',
    },
  },
  properties: {},
  attached() {
    this.setData({
      lang: app.globalData.lang_dict
    })
  },
  moved() {},
  detached() {},
  methods: {
     //显示灯序的modal
    showLedTurn(e) {
      //发送红色
      light.control(light.dpid.dream_control_data, this.data.ledTurnValueMapping[this.data.deviceLedTurnKey[0]]).done()
      this.setData({
        ledTurnModalShow: !this.data.ledTurnModalShow,
        ledTurnKey: '',
        led_turn: JSON.parse(JSON.stringify(this.data.led_turnFull)),
        currentLedTurn: 0
      })
    },
    //灯珠线序
    nextLedTurn(e) {
      // console.log(this.data.currentLedTurn)
      if (this.data.currentLedTurn == 0) return
      let data = this.data.ledTurnKey
      if (this.data.led_turn.length == this.data.ledTurnKey.length) {
        data = ''
      }
      let led_turn = this.data.led_turn
      let key = 0
      for (let item of led_turn) {
        if (this.data.currentLedTurn == item.value) {
          break;
        }
        key += 1
      }

      led_turn.splice(key, 1)
      this.setData({
        ledTurnKey: data + this.data.currentLedTurn,
        led_turn: led_turn,
        currentLedTurn: 0,
      })

      switch (this.data.ledTurnKey.length) {
        case 1:
          light.control(light.dpid.dream_control_data, this.data.ledTurnValueMapping[this.data.deviceLedTurnKey[1]]).done()
          break;
        case 2:
          light.control(light.dpid.rgb_turn, light.action.rgb_turn[this.data.ledTurnKey]).done()
          this.setData({
            ledTurnModalShow: false,
          })
          // queryDevice([11])
          comm.queryDevice([11])
          break;
      }
    },
    //关闭灯序的modal
    closeLedTurn(e) {
      this.setData({
        ledTurnModalShow: false
      })
    },
    //线序:0、1、2、3、4、5
    rgb_turn(value) {
      let index;
      for (let key in light.action.rgb_turn) {
        console.log('rgb_turn', key)
        if (value == light.action.rgb_turn[key]) {
          index = key
          break;
        }
      }
      console.log('rgb_turn.key', index)
      this.setData({
        deviceLedTurnKey: index
      })
    },
    //led颜色顺序设置
    //todo 需要发送消息
    ledTurnRadioChange(e) {
      console.log('ledTurnRadioChange', e)
      this.setData({
        currentLedTurn: e.detail.value
      })
    },
  },
});
