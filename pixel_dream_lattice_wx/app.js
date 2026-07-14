
const myCompat = require('./utils/myCompat');
const langLocal = require('./utils/lang');

function transLang(lang, key) {
  const out = {};
  const langKey = key || 'zh';
  (lang || []).forEach((item) => {
    out[item.key] = item[langKey] || item.en || item.zh || item.key;
  });
  return out;
}

function u16Hex(value) {
  const number = Number(value);
  const normalized = Number.isFinite(number) ? number & 0xffff : 0;
  return normalized.toString(16).padStart(4, '0');
}

function buildDynamicDiyPackets(diyFrames) {
  const frames = (Array.isArray(diyFrames) ? diyFrames : []).filter((frame) => {
    return frame && typeof frame === 'object' && Object.keys(frame).length > 0;
  });
  const groups = [];

  frames.forEach((frame, frameIndex) => {
    const keys = Object.keys(frame);
    for (let offset = 0; offset < keys.length; offset += 10) {
      const pointKeys = keys.slice(offset, offset + 10);
      let body = '';
      pointKeys.forEach((point) => {
        body += u16Hex(point) + u16Hex(frame[point]) + '03e8';
      });
      for (let pad = pointKeys.length; pad < 10; pad += 1) body += '019affffffff';
      groups.push({ frameIndex: frameIndex, body: body });
    }
  });

  return groups.map((group, index) => {
    let header = group.frameIndex;
    if (groups.length === 1) header = 0xc0;
    else if (index === 0) header = 0x40;
    else if (index === groups.length - 1) header = 0x80 | group.frameIndex;
    return ('00' + header.toString(16)).slice(-2) + group.body;
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

App({
  myCompat,
  globalData: {
    device_id: '',
    device_name: 'TT',
    pid: '',
    lightVal: 0,
    isOnline: '1',
    onlineStatus: true,
    actual: {},
    appActionArr: '',
    newDiyObj: [],
    lang: 'zh',
    projectSet: [{
      name: 'tempelte',
      modules: { navbar: true, color: true, scene: true, music: true, myfoot: true },
      modify: { txtRed: false },
      extra: {},
      jsmod: {},
      cssFirstName: ''
    }]
  },
  onLaunch() {
    const sysInfo = Object.assign(
      {},
      typeof wx.getDeviceInfo === 'function' ? wx.getDeviceInfo() : {},
      typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {},
      typeof wx.getAppBaseInfo === 'function' ? wx.getAppBaseInfo() : {}
    );
    this.globalData.sysInfo = sysInfo;
    this.globalData.lang_dict = transLang(langLocal || [], this.globalData.lang);
    globalThis.my = myCompat;
  },
  formatSeconds(value) {
    const total = Math.max(0, parseInt(value, 10) || 0);
    const hour = Math.floor(total / 3600);
    const minute = Math.floor((total % 3600) / 60);
    const second = total % 60;
    const pad = (number) => String(number).padStart(2, '0');
    return pad(hour) + ':' + pad(minute) + ':' + pad(second);
  },
  async sendDt_diy(diyObj, flag = true) {
    const bleSession = require('./utils/bleSession');
    const packets = buildDynamicDiyPackets(diyObj);
    bleSession.log('sendDt_diy called, frames=' + (diyObj || []).length + ', packets=' + packets.length);

    if (!packets.length) {
      wx.showToast({ title: '没有可发送的动态帧', icon: 'none' });
      return false;
    }

    wx.showLoading({ title: '发送动态 DIY...' });
    try {
      for (let index = 0; index < packets.length; index += 1) {
        const rawFrame = packets[index];
        bleSession.log('dynamic DIY packet ' + (index + 1) + '/' + packets.length + ': ' + rawFrame);
        const ok = await bleSession.sendDpData([2, 40], { '2': 8, '40': rawFrame });
        if (!ok) {
          bleSession.log('dynamic DIY stopped at packet ' + (index + 1));
          return false;
        }
        if (index < packets.length - 1) await wait(150);
      }
      bleSession.log('dynamic DIY completed, packets=' + packets.length);
      if (flag) wx.navigateBack();
      return true;
    } catch (err) {
      bleSession.log('dynamic DIY failed: ' + JSON.stringify(err));
      wx.showToast({ title: '动态 DIY 发送失败', icon: 'none' });
      return false;
    } finally {
      wx.hideLoading();
    }
  },
  buweiFun16(n) {
    return (Number(n).toString(16)).padStart(4, '0');
  },
  buweiFun10(n) {
    let str = '';
    for (let i = 0; i < n; i += 1) str += '019affffffff';
    return str;
  }
});
