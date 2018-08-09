/**
 * browser.js
 */

import {isObjectNotEmpty, isString, throwErr} from "./common.js";

/* api */
const {runtime, storage, tabs} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;

/* runtime */
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
 * set storage
 * @param {Object} obj - object to store
 * @returns {?AsyncFunction} - storage.local.set
 */
export const setStorage = async obj =>
  obj && storage && storage.local.set(obj) || null;

/**
 * get storage
 * @param {*} key - key
 * @returns {AsyncFunction} - storage.local.get
 */
export const getStorage = async key => storage.local.get(key);

/**
 * get all storage
 * @returns {AsyncFunction} - storage.local.get
 */
export const getAllStorage = async () => storage.local.get();

/* tabs */
/**
 * get active tab
 * @returns {Object} - tabs.Tab
 */
export const getActiveTab = async () => {
  const arr = await tabs.query({
    active: true,
    currentWindow: true,
  });
  let tab;
  if (arr.length) {
    [tab] = arr;
  }
  return tab || null;
};

/**
 * get active tab ID
 * @returns {number} - tab ID
 */
export const getActiveTabId = async () => {
  let tabId;
  const tab = await getActiveTab();
  if (tab) {
    tabId = tab.id;
  }
  return tabId;
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
