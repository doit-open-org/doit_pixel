const my = getApp().myCompat;
const common = require('./comm');

function sendFast(attr, data, isLock) {
  const payload = {
    device_id: common.getDeviceID(),
    type: 2,
    msg: {
      attr: attr,
      data: data
    }
  };
  if (isLock) payload.isLock = true;
  my.call('sendCmd', payload, () => {});
}

const control = {
  controlData: {},

  __control() {
    if (my.isIDE) return;

    const data = this.controlData;
    const attr = Object.keys(data).map((id) => Number(id));
    sendFast(attr, data, false);
  },

  control(dpid, value, unCheck) {
    if (!unCheck) {
      if (!Object.values(this.dpid).includes(dpid)) return this;

      for (const key in this.dpid) {
        if (this.dpid[key] !== dpid) continue;
        if (this.action[key] && !Object.values(this.action[key]).includes(value)) return this;
        break;
      }

      if (this.__controlPrefix[dpid]) {
        Object.assign(this.controlData, this.__controlPrefix[dpid]);
      }
    }

    this.controlData[dpid] = value;
    return this;
  },

  done() {
    if (!Object.keys(this.controlData).length) return false;
    this.__control();
    this.controlData = {};
    return true;
  },

  controlFast(attr, data) {
    sendFast(attr, data, false);
  },

  controlAndroidFast(attr, data) {
    sendFast(attr, data, true);
  }
};

module.exports = { control };
