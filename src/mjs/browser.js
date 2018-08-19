/**
 * browser.js
 */

import {isObjectNotEmpty, isString, throwErr} from "./common.js";

/* api */
const {management, runtime, storage, tabs} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;

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

/* runtime */
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
