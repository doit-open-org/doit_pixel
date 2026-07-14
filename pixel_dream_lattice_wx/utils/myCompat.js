const bleSession = require('./bleSession');

function normalizeStorageKey(options) {
  return typeof options === 'string' ? options : options && options.key;
}

const myCompat = {
  isIDE: false,

  call(name, payload, callback) {
    if (name === 'sendCmd') {
      bleSession.handleSendCmd(payload || {}).then((ok) => {
        if (callback) callback({ success: !!ok });
      });
      return;
    }
    if (name === 'exitApp') {
      wx.navigateBack({ delta: 1 });
      return;
    }
    if (name === 'setTitleColor') {
      return;
    }
    console.log('[myCompat.call] unsupported:', name, payload);
    if (callback) callback({ success: false, unsupported: true });
  },

  on(name, handler) {
    bleSession.on(name, handler);
  },

  showLoading(options) {
    wx.showLoading({ title: options && (options.title || options.content) || 'loading...' });
  },

  hideLoading() {
    wx.hideLoading();
  },

  showToast(options) {
    wx.showToast({
      title: options && (options.title || options.content) || '',
      icon: options && options.icon || 'none',
      duration: options && options.duration || 1600
    });
  },

  alert(options) {
    wx.showModal({
      title: options && options.title || '',
      content: options && options.content || '',
      showCancel: false,
      confirmText: options && options.buttonText || '确定'
    });
  },

  confirm(options) {
    wx.showModal({
      title: options && options.title || '',
      content: options && options.content || '',
      confirmText: options && options.confirmButtonText || '确定',
      cancelText: options && options.cancelButtonText || '取消',
      success(res) {
        if (res.confirm && options && options.confirm) options.confirm(res);
        if (res.cancel && options && options.cancel) options.cancel(res);
        if (options && options.success) options.success(res);
      }
    });
  },

  navigateTo(options) {
    wx.navigateTo(options);
  },

  navigateBack(options) {
    wx.navigateBack(options || { delta: 1 });
  },

  redirectTo(options) {
    wx.redirectTo(options);
  },

  setNavigationBar(options) {
    if (options && options.title) wx.setNavigationBarTitle({ title: options.title });
  },

  setCanPullDown() {},
  setOptionMenu() {},
  setBackgroundColor() {},
  startPullDownRefresh() {},
  stopPullDownRefresh() {},

  getSystemInfoSync() {
    return Object.assign(
      {},
      typeof wx.getDeviceInfo === 'function' ? wx.getDeviceInfo() : {},
      typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {},
      typeof wx.getAppBaseInfo === 'function' ? wx.getAppBaseInfo() : {}
    );
  },

  getNetworkType(options) {
    wx.getNetworkType({
      success(res) {
        const out = Object.assign({}, res, { networkAvailable: res.networkType !== 'none' });
        if (options && options.success) options.success(out);
      },
      fail: options && options.fail,
      complete: options && options.complete
    });
  },

  getStorageSync(options) {
    const key = normalizeStorageKey(options);
    return { data: key ? wx.getStorageSync(key) : undefined };
  },

  setStorageSync(options) {
    wx.setStorageSync(options.key, options.data);
  },

  getStorage(options) {
    const data = wx.getStorageSync(options.key);
    if (options.success) options.success({ success: data !== undefined, data: data });
    if (options.complete) options.complete({ data: data });
  },

  setStorage(options) {
    wx.setStorage({
      key: options.key,
      data: options.data,
      success: options.success,
      fail: options.fail,
      complete: options.complete
    });
  },

  clearStorageSync() {
    wx.clearStorageSync();
  },

  setClipboard(options) {
    wx.setClipboardData({
      data: options.text || options.data || '',
      success: options.success
    });
  },

  saveFile(options) {
    wx.saveFile({
      tempFilePath: options.apFilePath || options.tempFilePath,
      success: options.success,
      fail: options.fail
    });
  }
};

module.exports = myCompat;
