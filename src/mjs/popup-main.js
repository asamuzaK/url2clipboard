/**
 * popup-main.js
 */

/* shared */
import {
  closeWindow, getType, isObjectNotEmpty, isString, throwErr
} from './common.js';
import { getActiveTab, sendMessage } from './browser.js';
import {
  getFormat, getFormatId, getFormats, getFormatsKeys, hasFormat, setFormat
} from './format.js';
import {
  BBCODE_URL, CONTENT_LINK, CONTENT_PAGE, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, EXEC_COPY, LINK_MENU, PREFER_CANONICAL
} from './constant.js';

/* api */
const { runtime, tabs } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;
const OPTIONS_OPEN = 'openOptions';

/* variables */
export const vars = {
  preferCanonicalUrl: false
};

/* enabled formats */
export const enabledFormats = new Set();

/**
 * toggle enabled formats
 *
 * @param {string} id - format id
 * @param {boolean} enabled - format is enabled
 * @returns {void}
 */
export const toggleEnabledFormats = async (id, enabled) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const keys = await getFormatsKeys(true);
  const formatId = await getFormatId(id);
  if (keys.includes(formatId) && enabled) {
    enabledFormats.add(formatId);
  } else {
    enabledFormats.delete(formatId);
  }
};

/**
 * set format data
 *
 * @returns {Promise.<Array>} - result of each handler
 */
export const setFormatData = async () => {
  const items = await getFormats(true);
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
 *
 * @returns {object} - context info
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
 *
 * @param {object} tab - tabs.Tab
 * @returns {void}
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
 *
 * @param {!object} evt - Event
 * @returns {?Function} - sendMessage();
 */
export const createCopyData = async evt => {
  let func;
  if (evt) {
    const { target } = evt;
    if (target) {
      const { id: menuItemId } = target;
      const { tab } = tabInfo;
      if (tab) {
        const info = {
          isEdited: true,
          menuItemId
        };
        const { isLink, selectionText, url } = contextInfo;
        if (isLink) {
          info.linkUrl = url;
        }
        if (menuItemId.startsWith(COPY_LINK)) {
          info.selectionText = document.getElementById(CONTENT_LINK).value;
        } else if (menuItemId.startsWith(COPY_PAGE)) {
          info.selectionText = document.getElementById(CONTENT_PAGE).value;
        } else {
          info.selectionText = selectionText || '';
        }
        func = sendMessage(runtime.id, {
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
 * handle open options on click
 *
 * @returns {Function} - runtime.openOptionsPage()
 */
export const openOptionsOnClick = () => runtime.openOptionsPage();

/**
 * handle menu on click
 *
 * @param {!object} evt - Event
 * @returns {(Function|Error)} - Promise chain
 */
export const menuOnClick = evt =>
  createCopyData(evt).then(closeWindow).catch(throwErr);

/**
 * add listener to menu
 *
 * @returns {void}
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
 *
 * @returns {void}
 */
export const toggleMenuItem = async () => {
  const nodes = document.querySelectorAll('button');
  const formatsKeys = await getFormatsKeys(true);
  for (const node of nodes) {
    const { id, parentNode } = node;
    const formatId = getFormatId(id);
    if (formatsKeys.includes(formatId)) {
      if (formatId === BBCODE_URL &&
          (id.startsWith(COPY_LINK) || id.startsWith(COPY_PAGE))) {
        if (enabledFormats.has(formatId)) {
          parentNode.parentNode.removeAttribute('hidden');
        } else {
          parentNode.parentNode.setAttribute('hidden', 'hidden');
        }
      } else if (enabledFormats.has(formatId)) {
        parentNode.removeAttribute('hidden');
      } else {
        parentNode.setAttribute('hidden', 'hidden');
      }
    }
  }
};

/**
 * update menu
 *
 * @param {object} data - context data;
 * @returns {void}
 */
export const updateMenu = async data => {
  await initContextInfo();
  if (isObjectNotEmpty(data)) {
    const { contextInfo: info } = data;
    if (info) {
      const { canonicalUrl, content, isLink, title, url } = info;
      const nodes = document.querySelectorAll(LINK_MENU);
      contextInfo.canonicalUrl = canonicalUrl;
      contextInfo.content = content;
      contextInfo.isLink = !!isLink;
      contextInfo.title = title;
      contextInfo.url = url;
      if (isLink) {
        document.getElementById(CONTENT_LINK).value = content;
      }
      for (const node of nodes) {
        const attr = 'disabled';
        if (isLink) {
          node.removeAttribute(attr);
        } else {
          node.setAttribute(attr, attr);
        }
      }
    }
  }
};

/**
 * prepare tab
 *
 * @returns {Promise.<Array>} - results of each handler
 */
export const prepareTab = async () => {
  const func = [];
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
    func.push(sendMessage(runtime.id, {
      [CONTEXT_INFO_GET]: true
    }));
  }
  return Promise.all(func);
};

/**
 * handle message
 *
 * @param {*} msg - message
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
 * set variable
 *
 * @param {string} item - item
 * @param {object} obj - value object
 * @returns {?Function} - toggleEnabledFormats()
 */
export const setVar = async (item, obj) => {
  let func;
  if (item && obj) {
    const { checked } = obj;
    switch (item) {
      case PREFER_CANONICAL:
        vars[item] = !!checked;
        break;
      default: {
        if (await hasFormat(item)) {
          const formatItem = await getFormat(item);
          formatItem.enabled = !!checked;
          await setFormat(item, formatItem);
          func = toggleEnabledFormats(item, !!checked);
        }
      }
    }
  }
  return func || null;
};

/**
 * set variables
 *
 * @param {object} data - data
 * @returns {Promise.<Array>} - results of each handler
 */
export const setVars = async (data = {}) => {
  const items = Object.entries(data);
  const func = [];
  for (const [key, value] of items) {
    const { newValue } = value;
    func.push(setVar(key, newValue || value, !!newValue));
  }
  return Promise.all(func);
};
