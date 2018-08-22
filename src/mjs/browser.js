/**
 * browser.js
 */

import {isObjectNotEmpty, isString, throwErr} from "./common.js";

/* api */
const {
  commands, management, notifications, permissions, runtime, storage, tabs,
  windows,
} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;

/* commands */
/**
 * update command
 * @param {string} id - command ID
 * @param {string} value - key value
 * @returns {void}
 */
export const updateCommand = async (id, value = "") => {
  if (typeof commands.update === "function" &&
      isString(id) && isString(value)) {
    const shortcut =
      value.trim().replace(/\+([a-z])$/, (m, c) => `+${c.toUpperCase()}`);
    if (/^(?:(?:(?:Alt|Command|(?:Mac)?Ctrl)\+(?:Shift\+)?(?:[\dA-Z]|F(?:[1-9]|1[0-2])|(?:Page)?(?:Down|Up)|Left|Right|Comma|Period|Home|End|Delete|Insert|Space))|F(?:[1-9]|1[0-2]))$/.test(shortcut)) {
      await commands.update({
        shortcut,
        name: id,
      });
    } else if (shortcut === "") {
      await commands.reset(id);
    }
  }
};

/* management */
/**
 * get enabled theme
 * @returns {Array} - array of management.ExtensionInfo
 */
export const getEnabledTheme = async () => {
  const themes = await management.getAll().then(arr => arr.filter(info =>
    info.type && info.type === "theme" && info.enabled && info
  ));
  return themes;
};

/* notifications */
/**
 * clear notification
 * @param {string} id - notification ID
 * @returns {?AsyncFunction} - notifications.clear()
 */
export const clearNotification = id => {
  let func;
  if (isString(id)) {
    func = notifications.clear(id).catch(throwErr);
  }
  return func || null;
};

/**
 * create notification
 * @param {string} id - notification ID
 * @param {Object} opt - options
 * @returns {?AsyncFunction} - notifications.create
 */
export const createNotification = async (id, opt) => {
  let func;
  if (isString(id) && notifications) {
    if (notifications.onClosed &&
        !notifications.onClosed.hasListener(clearNotification)) {
      notifications.onClosed.addListener(clearNotification);
    }
    func = notifications.create(id, opt);
  }
  return func || null;
};

/* permissions */
/**
 * remove permission
 * @param {string|Array} perm - permission
 * @returns {?AsyncFunction} - permissions.remove
 */
export const removePermission = async perm => {
  let func;
  if (isString(perm)) {
    func = permissions.remove({
      permissions: [perm],
    });
  } else if (Array.isArray(perm)) {
    func = permissions.remove({
      permissions: perm,
    });
  }
  return func || null;
};

/**
 * request permission
 * @param {string|Array} perm - permission
 * @returns {?AsyncFunction} - permissions.request
 */
export const requestPermission = async perm => {
  let func;
  if (isString(perm)) {
    func = permissions.request({
      permissions: [perm],
    });
  } else if (Array.isArray(perm)) {
    func = permissions.request({
      permissions: perm,
    });
  }
  return func || null;
};

/* runtime */
/**
 * fetch data
 * @param {string} path - data path
 * @returns {Object} - JSON data
 */
export const fetchData = async path => {
  let data;
  if (isString(path)) {
    path = await runtime.getURL(path);
    data = await fetch(path).then(res => res && res.json());
  }
  return data || null;
};

/**
 * get manifest icons
 * @returns {Object|string} - icons
 */
export const getManifestIcons = () => {
  const {icons} = runtime.getManifest();
  return icons;
};

/** send message
 * @param {number|string} id - tabId or extension ID
 * @param {*} msg - message
 * @param {Object} opt - options
 * @returns {?AsyncFunction} - tabs.sendMessage | runtime.sendMessage
 */
export const sendMessage = async (id, msg, opt) => {
  let func;
  if (msg) {
    opt = isObjectNotEmpty(opt) && opt || null;
    if (Number.isInteger(id) && id !== TAB_ID_NONE) {
      func = tabs.sendMessage(id, msg, opt);
    } else if (id && isString(id)) {
      func = runtime.sendMessage(id, msg, opt);
    } else {
      func = runtime.sendMessage(runtime.id, msg, opt);
    }
  }
  return func || null;
};

/* storage */
/**
 * get all storage
 * @returns {AsyncFunction} - storage.local.get
 */
export const getAllStorage = async () => storage.local.get();

/**
 * get storage
 * @param {*} key - key
 * @returns {AsyncFunction} - storage.local.get
 */
export const getStorage = async key => storage.local.get(key);

/**
 * remove storage
 * @param {*} key - key
 * @returns {AsyncFunction} - storage.local.remove
 */
export const removeStorage = async key => storage.local.remove(key);

/**
 * set storage
 * @param {Object} obj - object to store
 * @returns {?AsyncFunction} - storage.local.set
 */
export const setStorage = async obj =>
  obj && storage && storage.local.set(obj) || null;

/* tabs */
/**
 * create tab
 * @param {Object} opt - options
 * @returns {AsyncFunction} - tabs.create
 */
export const createTab = async (opt = {}) =>
  tabs.create(isObjectNotEmpty(opt) && opt || null);

/**
 * execute content script to existing tabs
 * @param {string} src - content script path
 * @param {boolean} frame - execute to all frames
 * @returns {Promise.<Array>} - results of each handler
 */
export const execScriptToExistingTabs = async (src, frame = false) => {
  const func = [];
  if (isString(src)) {
    const contentScript = runtime.getURL(src);
    const tabList = await tabs.query({
      windowType: "normal",
    });
    for (const tab of tabList) {
      const {id: tabId} = tab;
      func.push(tabs.executeScript(tabId, {
        allFrames: !!frame,
        file: contentScript,
      }));
    }
  }
  return Promise.all(func);
};

/**
 * get active tab
 * @param {number} windowId - window ID
 * @returns {Object} - tabs.Tab
 */
export const getActiveTab = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const arr = await tabs.query({
    windowId,
    active: true,
    windowType: "normal",
  });
  let tab;
  if (arr.length) {
    [tab] = arr;
  }
  return tab || null;
};

/**
 * get active tab ID
 * @param {number} windowId - window ID
 * @returns {number} - tab ID
 */
export const getActiveTabId = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  let tabId;
  const tab = await getActiveTab(windowId);
  if (tab) {
    tabId = tab.id;
  }
  return tabId;
};

/**
 * get all tabs in window
 * @param {number} windowId - window ID
 * @returns {Array} - tab list
 */
export const getAllTabsInWindow = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const tabList = await tabs.query({
    windowId,
    windowType: "normal",
  });
  return tabList;
};

/**
 * is tab
 * @param {*} tabId - tab ID
 * @returns {boolean} - result
 */
export const isTab = async tabId => {
  let tab;
  if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
    tab = await tabs.get(tabId).catch(throwErr);
  }
  return !!tab;
};

/* windows */
/**
 * get all windows
 * @returns {Promise.<Array>} - array of windows.Window
 */
export const getAllNormalWindows = async () => windows.getAll({
  windowTypes: ["normal"],
});

/**
 * check whether incognito window exists
 * @returns {boolean} - result
 */
export const checkIncognitoWindowExists = async () => {
  let incog;
  const winArr = await getAllNormalWindows();
  if (winArr && winArr.length) {
    for (const win of winArr) {
      incog = win.incognito;
      if (incog) {
        break;
      }
    }
  }
  return !!incog;
};
