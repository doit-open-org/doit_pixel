const my = getApp().myCompat;
const bleSession = require('./bleSession');

function getDeviceID() {
  return getApp().globalData.device_id;
}

function getLang() {
  return getApp().globalData.lang || 'zh';
}

function applySupportedDpids(page, app) {
  if (app.globalData.typeArr !== undefined) {
    page.setData({ dpidArr: JSON.parse(app.globalData.typeArr) });
  }
}

function pageInit(page) {
  const app = getApp();
  if (!page.data.lang) {
    page.setData({
      lang: app.globalData.lang_dict,
      actual: app.globalData.actual
    });
  }
  applySupportedDpids(page, app);
}

function pageInitPro(page) {
  const app = getApp();
  if (!page.data.lang) {
    const project = (app.globalData.projectSet && app.globalData.projectSet[0]) || {};
    const data = {
      lang: app.globalData.lang_dict,
      actual: app.globalData.actual,
      device_id: getDeviceID(),
      cssFirstName: project.cssFirstName || ''
    };
    Object.assign(data, project.modules, project.modify, project.extra, project.jsmod);
    page.setData(data);
  }
  applySupportedDpids(page, app);
}

function queryDevice(attr, type) {
  my.call('sendCmd', {
    type: type || '1',
    device_id: getDeviceID(),
    msg: { attr: attr === undefined ? [0] : attr }
  }, () => {});
}

function pageShow() {
  queryDevice();
}

function pageReady(page) {
  if (typeof page.TCPcallback === 'function') {
    page.TCPcallback(getApp().globalData.actual);
  }
}

function getTimerStorageKey() {
  const state = bleSession.getState();
  const deviceInfo = state.deviceInfo || {};
  const deviceId = deviceInfo.deviceId || getDeviceID() || 'default';
  return 'lattice_timer_table_' + deviceId;
}

function isTimerTable(value) {
  return typeof value === 'string' && /^[0-9a-f]{50}$/i.test(value);
}

function getTimerTable() {
  const result = my.getStorageSync({ key: getTimerStorageKey() });
  return isTimerTable(result.data) ? result.data : '';
}

function saveTimerTable(value) {
  if (!isTimerTable(value)) return false;
  my.setStorageSync({ key: getTimerStorageKey(), data: value });
  return true;
}

module.exports = {
  getDeviceID,
  getLang,
  pageInit,
  pageInitPro,
  queryDevice,
  pageShow,
  pageReady,
  getTimerTable,
  saveTimerTable
};
