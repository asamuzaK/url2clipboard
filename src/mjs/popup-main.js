/**
 * popup-main.js
 */

/* shared */
import { getActiveTab, getAllStorage, sendMessage } from './browser.js';
import { getType, isObjectNotEmpty, isString, throwErr } from './common.js';
import {
  getFormat, getFormatId, getFormats, getFormatsKeys, hasFormat, setFormat
} from './format.js';
import { localizeHtml } from './localize.js';
import {
  CONTENT_LINK, CONTENT_PAGE, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, EXEC_COPY, LINK_DETAILS, LINK_MENU, OPTIONS_OPEN
} from './constant.js';

/* api */
const { runtime, tabs } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;
const ATTR_DISABLED = 'disabled';
const ATTR_HIDDEN = 'hidden';

/* enabled formats */
export const enabledFormats = new Set();

/**
 * toggle enabled formats
 * @param {string} id - format id
 * @param {boolean} [enabled] - format is enabled
 * @returns {void}
 */
export const toggleEnabledFormats = (id, enabled) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const keys = getFormatsKeys(true);
  const formatId = getFormatId(id);
  if (keys.includes(formatId) && enabled) {
    enabledFormats.add(formatId);
  } else {
    enabledFormats.delete(formatId);
  }
};

/**
 * set format data
 * @returns {Promise.<Array>} - result of each handler
 */
export const setFormatData = async () => {
  const items = getFormats(true);
  const func = [];
  for (const [key, value] of items) {
    const { enabled } = value;
    func.push(toggleEnabledFormats(key, enabled));
  }
  return Promise.all(func);
};

/* context info */
export const contextInfo = {
  canonicalUrl: null,
  content: null,
  isLink: false,
  selectionText: null,
  title: null,
  url: null
};

/**
 * init context info
 * @returns {Promise.<object>} - context info
 */
export const initContextInfo = async () => {
  contextInfo.canonicalUrl = null;
  contextInfo.content = null;
  contextInfo.isLink = false;
  contextInfo.selectionText = null;
  contextInfo.title = null;
  contextInfo.url = null;
  return contextInfo;
};

/* tab info */
export const tabInfo = {
  tab: null
};

/**
 * set tab info
 * @param {object} [tab] - tabs.Tab
 * @returns {Promise.<void>} - void
 */
export const setTabInfo = async tab => {
  if (isObjectNotEmpty(tab)) {
    const { title } = tab;
    const { selectionText } = contextInfo;
    tabInfo.tab = tab;
    document.getElementById(CONTENT_PAGE).value = selectionText || title;
  } else {
    tabInfo.tab = null;
    document.getElementById(CONTENT_PAGE).value = '';
  }
};

/**
 * create copy data
 * @param {object} [evt] - Event
 * @returns {Promise} - sendMessage();
 */
export const createCopyData = async evt => {
  let func;
  if (evt) {
    const { target } = evt;
    if (target) {
      const { id: menuItemId } = target;
      const { tab } = tabInfo;
      if (tab) {
        const { isLink, selectionText, url } = contextInfo;
        const info = {
          menuItemId,
          isEdited: true,
          selectionText: selectionText || ''
        };
        if (isLink) {
          info.linkUrl = url;
        }
        if (menuItemId.startsWith(COPY_LINK)) {
          info.editedText = document.getElementById(CONTENT_LINK).value;
        } else if (menuItemId.startsWith(COPY_PAGE)) {
          info.editedText = document.getElementById(CONTENT_PAGE).value;
        } else {
          info.editedText = selectionText || '';
        }
        func = sendMessage(null, {
          [EXEC_COPY]: {
            info, tab
          }
        });
      }
    }
  }
  return func || null;
};

/**
 * close window
 * @returns {void}
 */
export const closeWindow = () => {
  window.close();
};

/**
 * handle open options on click
 * @returns {Promise} - runtime.openOptionsPage()
 */
export const openOptionsOnClick = () => runtime.openOptionsPage();

/**
 * handle menu on click
 * @param {object} [evt] - Event
 * @returns {Promise} - Promise chain
 */
export const menuOnClick = evt =>
  createCopyData(evt).then(closeWindow).catch(throwErr);

/**
 * add listener to menu
 * @returns {Promise.<void>} - void
 */
export const addListenerToMenu = async () => {
  const nodes = document.querySelectorAll('button');
  for (const node of nodes) {
    const { id } = node;
    if (id === OPTIONS_OPEN) {
      node.addEventListener('click', openOptionsOnClick);
    } else {
      node.addEventListener('click', menuOnClick);
    }
  }
};

/**
 * toggle menu item
 * @returns {Promise.<void>} - void
 */
export const toggleMenuItem = async () => {
  const nodes = document.querySelectorAll('button');
  const formatsKeys = getFormatsKeys(true);
  for (const node of nodes) {
    const { id, parentNode } = node;
    const formatId = getFormatId(id);
    if (formatsKeys.includes(formatId)) {
      if (enabledFormats.has(formatId)) {
        parentNode.removeAttribute(ATTR_HIDDEN);
      } else {
        parentNode.setAttribute(ATTR_HIDDEN, ATTR_HIDDEN);
      }
    }
  }
};

/**
 * update menu
 * @param {object} [data] - context data;
 * @returns {Promise.<void>} - void
 */
export const updateMenu = async data => {
  await initContextInfo();
  if (isObjectNotEmpty(data)) {
    const { contextInfo: info } = data;
    if (info) {
      const { canonicalUrl, content, isLink, selectionText, title, url } = info;
      contextInfo.canonicalUrl = canonicalUrl;
      contextInfo.content = content;
      contextInfo.isLink = !!isLink;
      contextInfo.selectionText = selectionText;
      contextInfo.title = title;
      contextInfo.url = url;
      const elm = document.getElementById(LINK_DETAILS);
      if (isLink) {
        elm.removeAttribute(ATTR_HIDDEN);
        document.getElementById(CONTENT_LINK).value = content;
      } else {
        elm.setAttribute(ATTR_HIDDEN, ATTR_HIDDEN);
      }
      if (selectionText) {
        document.getElementById(CONTENT_PAGE).value = selectionText;
      }
      const nodes = document.querySelectorAll(LINK_MENU);
      for (const node of nodes) {
        if (isLink) {
          node.removeAttribute(ATTR_DISABLED);
        } else {
          node.setAttribute(ATTR_DISABLED, ATTR_DISABLED);
        }
      }
    }
  }
};

/**
 * prepare tab
 * @returns {Promise} - sendMessage()
 */
export const prepareTab = async () => {
  let func;
  const tab = await getActiveTab();
  const { id } = tab;
  await updateMenu({
    contextInfo: {
      canonicalUrl: null,
      content: null,
      isLink: false,
      selectionText: null,
      title: null,
      url: null
    }
  });
  await setTabInfo(tab);
  if (Number.isInteger(id) && id !== TAB_ID_NONE) {
    func = sendMessage(null, {
      [CONTEXT_INFO_GET]: true
    });
  }
  return func || null;
};

/**
 * handle message
 * @param {object} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async msg => {
  const func = [];
  const items = msg && Object.entries(msg);
  if (items) {
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case CONTEXT_INFO:
          func.push(updateMenu(value));
          break;
        default:
      }
    }
  }
  return Promise.all(func);
};

/**
 * set storage value
 * @param {string} item - item
 * @param {object} obj - value object
 * @returns {void}
 */
export const setStorageValue = (item, obj) => {
  if (item && obj) {
    const { checked } = obj;
    if (hasFormat(item)) {
      const formatItem = getFormat(item);
      formatItem.enabled = !!checked;
      setFormat(item, formatItem);
      toggleEnabledFormats(item, !!checked);
    }
  }
};

/**
 * handle storage
 * @param {object} data - data
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleStorage = async (data = {}) => {
  const items = Object.entries(data);
  const func = [];
  for (const [key, value] of items) {
    const { newValue } = value;
    func.push(setStorageValue(key, newValue || value));
  }
  return Promise.all(func);
};

/**
 * startup
 * @returns {Promise} - promise chain
 */
export const startup = async () => {
  await Promise.all([
    localizeHtml(),
    addListenerToMenu(),
    prepareTab(),
    setFormatData()
  ]);
  return getAllStorage().then(handleStorage).then(toggleMenuItem);
};
