/**
 * browser.js
 */

import {
  getType, isObjectNotEmpty, isString, parseVersion, throwErr,
} from "./common.js";

/* api */
const {
  commands, i18n, management, notifications, permissions, runtime, storage,
  tabs, windows,
} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;
const IS_CHROMEEXT = typeof runtime.getPackageDirectoryEntry === "function";
const IS_WEBEXT = typeof runtime.getBrowserInfo === "function";
const WEBEXT_ACCKEY_MIN = 63;

/* commands */
/**
 * is command customizable
 * @returns {boolean} - result
 */
export const isCommandCustomizable = () => {
  let bool;
  if (commands) {
    bool = typeof commands.update === "function" &&
           typeof commands.reset === "function";
  }
  return !!bool;
};

/**
 * update command
 * @param {string} id - command ID
 * @param {string} value - key value
 * @returns {?AsyncFunction} - commands.update | commands.reset
 */
export const updateCommand = async (id, value = "") => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  if (!isString(value)) {
    throw new TypeError(`Expected String but got ${getType(value)}.`);
  }
  let func;
  if (isCommandCustomizable()) {
    const shortcut =
      value.trim().replace(/\+([a-z])$/, (m, c) => `+${c.toUpperCase()}`);
    if (/^(?:(?:(?:Alt|Command|(?:Mac)?Ctrl)\+(?:Shift\+)?(?:[\dA-Z]|F(?:[1-9]|1[0-2])|(?:Page)?(?:Down|Up)|Left|Right|Comma|Period|Home|End|Delete|Insert|Space))|F(?:[1-9]|1[0-2]))$/.test(shortcut)) {
      func = commands.update({
        shortcut,
        name: id,
      });
    } else if (shortcut === "") {
      func = commands.reset(id);
    }
  }
  return func || null;
};

/* management */
/**
 * get enabled theme
 * @returns {?Array} - array of management.ExtensionInfo
 */
export const getEnabledTheme = async () => {
  let themes;
  if (management) {
    themes = await management.getAll().then(arr => arr.filter(info =>
      info.type && info.type === "theme" && info.enabled && info
    ));
  }
  return themes || null;
};

/* notifications */
/**
 * clear notification
 * @param {string} id - notification ID
 * @returns {?AsyncFunction} - notifications.clear()
 */
export const clearNotification = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let func;
  if (notifications) {
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
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let func;
  if (notifications) {
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
  if (!(isString(perm) || Array.isArray(perm))) {
    throw new TypeError(`Expected String or Array but got ${getType(perm)}.`);
  }
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
  if (!(isString(perm) || Array.isArray(perm))) {
    throw new TypeError(`Expected String or Array but got ${getType(perm)}.`);
  }
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
  if (!isString(path)) {
    throw new TypeError(`Expected String but got ${getType(path)}.`);
  }
  const data = await fetch(runtime.getURL(path)).then(res => res && res.json());
  return data;
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
 * @returns {?AsyncFunction} - storage.local.get
 */
export const getAllStorage = async () => {
  let func;
  if (storage) {
    func = storage.local.get();
  }
  return func || null;
};

/**
 * get storage
 * @param {*} key - key
 * @returns {?AsyncFunction} - storage.local.get
 */
export const getStorage = async key => {
  let func;
  if (storage) {
    func = storage.local.get(key);
  }
  return func || null;
};

/**
 * remove storage
 * @param {*} key - key
 * @returns {?AsyncFunction} - storage.local.remove
 */
export const removeStorage = async key => {
  let func;
  if (storage) {
    func = storage.local.remove(key);
  }
  return func || null;
};

/**
 * set storage
 * @param {Object} obj - object to store
 * @returns {?AsyncFunction} - storage.local.set
 */
export const setStorage = async obj => {
  let func;
  if (storage && obj) {
    func = storage.local.set(obj);
  }
  return func || null;
};

/* tabs */
/**
 * create tab
 * @param {Object} opt - options
 * @returns {AsyncFunction} - tabs.create
 */
export const createTab = async (opt = {}) => {
  let func;
  if (tabs) {
    func = tabs.create(isObjectNotEmpty(opt) && opt || null);
  }
  return func || null;
};

/**
 * execute content script to existing tabs
 * @param {string} path - content script path
 * @param {boolean} frame - execute to all frames
 * @returns {Promise.<Array>} - results of each handler
 */
export const execScriptToExistingTabs = async (path, frame = false) => {
  if (!isString(path)) {
    throw new TypeError(`Expected String but got ${getType(path)}.`);
  }
  const func = [];
  if (tabs) {
    const tabList = await tabs.query({
      windowType: "normal",
    });
    for (const tab of tabList) {
      const {id: tabId} = tab;
      func.push(tabs.executeScript(tabId, {
        allFrames: !!frame,
        file: runtime.getURL(path),
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
  let tab;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    const arr = await tabs.query({
      windowId,
      active: true,
      windowType: "normal",
    });
    if (arr.length) {
      [tab] = arr;
    }
  }
  return tab || null;
};

/**
 * get active tab ID
 * @param {number} windowId - window ID
 * @returns {?number} - tab ID
 */
export const getActiveTabId = async windowId => {
  let tabId;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    const tab = await getActiveTab(windowId);
    if (tab) {
      tabId = tab.id;
    }
  }
  return Number.isInteger(tabId) ?
    tabId :
    null;
};

/**
 * get all tabs in window
 * @param {number} windowId - window ID
 * @returns {?Array} - tab list
 */
export const getAllTabsInWindow = async windowId => {
  let tabList;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    tabList = await tabs.query({
      windowId,
      windowType: "normal",
    });
  }
  return tabList || null;
};

/**
 * is accesskey supported in context menu
 * @returns {boolean} - result
 */
export const isAccessKeySupported = async () => {
  let bool;
  if (IS_CHROMEEXT) {
    bool = true;
  } else if (IS_WEBEXT) {
    const {version} = await runtime.getBrowserInfo();
    const {major: majorVersion} = await parseVersion(version);
    // FIXME: https://bugzilla.mozilla.org/show_bug.cgi?id=1484914
    const langs = ["ja"];
    const uiLang = i18n.getUILanguage();
    if (majorVersion >= WEBEXT_ACCKEY_MIN && !langs.includes(uiLang)) {
      bool = true;
    }
  }
  return !!bool;
};

/**
 * is tab
 * @param {*} tabId - tab ID
 * @returns {boolean} - result
 */
export const isTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let tab;
  if (tabs && tabId !== TAB_ID_NONE) {
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
