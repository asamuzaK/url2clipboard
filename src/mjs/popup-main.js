/**
 * popup-main.js
 */

import {getType, isString, logErr, throwErr} from "./common.js";
import {sendMessage} from "./browser.js";
import formatData from "./format.js";

/* api */
const {runtime, tabs} = browser;

/* constants */
import {
  BBCODE_URL, CONTENT_LINK, CONTENT_LINK_BBCODE, CONTENT_PAGE,
  CONTENT_PAGE_BBCODE, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_ALL_TABS, COPY_LINK, COPY_PAGE, EXEC_COPY, EXEC_COPY_TABS, HTML,
  INCLUDE_TITLE_HTML, INCLUDE_TITLE_MARKDOWN, LINK_MENU,
  MARKDOWN, MIME_PLAIN, OUTPUT_HTML_HYPER, OUTPUT_HTML_PLAIN, OUTPUT_TEXT,
  OUTPUT_TEXT_AND_URL, OUTPUT_TEXT_TEXT, OUTPUT_TEXT_TEXT_URL, OUTPUT_TEXT_URL,
  OUTPUT_URL,
} from "./constant.js";
const {TAB_ID_NONE} = tabs;
const OPTIONS_OPEN = "openOptions";

/* variables */
export const vars = {
  includeTitleHtml: false,
  includeTitleMarkdown: false,
  mimeType: MIME_PLAIN,
  textOutput: OUTPUT_TEXT_AND_URL,
};

/* formats */
export const formats = new Map();

/**
 * set format data
 * @returns {void}
 */
export const setFormatData = async () => {
  const items = Object.entries(formatData);
  for (const [key, value] of items) {
    formats.set(key, value);
  }
};

/**
 * get format item from menu item ID
 * @param {string} id - menu item id
 * @returns {Object} - format item
 */
export const getFormatItemFromId = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let item;
  if (id.startsWith(COPY_ALL_TABS)) {
    item = formats.get(id.replace(COPY_ALL_TABS, ""));
  } else if (id.startsWith(COPY_LINK)) {
    item = formats.get(id.replace(COPY_LINK, ""));
  } else if (id.startsWith(COPY_PAGE)) {
    item = formats.get(id.replace(COPY_PAGE, ""));
  }
  return item || null;
};

/**
 * get format template
 * @param {string} id - menu item ID
 * @returns {string} - template
 */
export const getFormatTemplate = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = await getFormatItemFromId(id);
  let template;
  if (item) {
    const {
      id: itemId, template: itemTmpl,
      templateWithoutTitle: itemTmplWoTitle,
    } = item;
    const {
      includeTitleHtml, includeTitleMarkdown, textOutput,
    } = vars;
    switch (itemId) {
      case HTML:
        template = includeTitleHtml && itemTmpl || itemTmplWoTitle;
        break;
      case MARKDOWN:
        template = includeTitleMarkdown && itemTmpl || itemTmplWoTitle;
        break;
      default:
        if (textOutput === OUTPUT_TEXT) {
          template = itemTmpl.replace(/%url%/g, "").trim();
        } else if (textOutput === OUTPUT_URL) {
          template = itemTmpl.replace(/%content%/g, "").trim();
        } else {
          template = itemTmpl;
        }
    }
  }
  return template || null;
};

/* tab info */
export const tabInfo = {
  id: null,
  title: null,
  url: null,
};

/**
 * init tab info
 * @returns {Object} - tab info
 */
export const initTabInfo = async () => {
  tabInfo.id = null;
  tabInfo.title = null;
  tabInfo.url = null;
  return tabInfo;
};

/**
 * set tab info
 * @param {Object} tab - tabs.Tab
 * @returns {void}
 */
export const setTabInfo = async tab => {
  const contentPage = document.getElementById(CONTENT_PAGE);
  const contentBBCode = document.getElementById(CONTENT_PAGE_BBCODE);
  await initTabInfo();
  if (tab) {
    const {id, title, url} = tab;
    contentPage.value = title;
    contentBBCode.value = url;
    tabInfo.id = id;
    tabInfo.title = title;
    tabInfo.url = url;
  }
};

/* context info */
export const contextInfo = {
  isLink: false,
  content: null,
  title: null,
  url: null,
  canonicalUrl: null,
};

/**
 * init context info
 * @returns {Object} - context info
 */
export const initContextInfo = async () => {
  contextInfo.isLink = false;
  contextInfo.content = null;
  contextInfo.title = null;
  contextInfo.url = null;
  contextInfo.canonicalUrl = null;
  return contextInfo;
};

/**
 * get all tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
export const getAllTabsInfo = async menuItemId => {
  const tabsInfo = [];
  const {mimeType} = vars;
  const template = await getFormatTemplate(menuItemId);
  const arr = await tabs.query({currentWindow: true});
  arr.forEach(tab => {
    const {id, title, url} = tab;
    tabsInfo.push({
      id, menuItemId, mimeType, template, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/**
 * create copy data
 * @param {!Object} evt - Event
 * @returns {void}
 */
export const createCopyData = async evt => {
  const {target} = evt;
  const {id: menuItemId} = target;
  const {includeTitleHtml, includeTitleMarkdown, mimeType} = vars;
  const {title: tabTitle, url: tabUrl} = tabInfo;
  const {canonicalUrl, title: contextTitle, url: contextUrl} = contextInfo;
  const func = [];
  if (menuItemId.startsWith(COPY_ALL_TABS)) {
    const allTabs = await getAllTabsInfo(menuItemId);
    func.push(sendMessage(runtime.id, {
      [EXEC_COPY_TABS]: {
        allTabs, includeTitleHtml, includeTitleMarkdown,
      },
    }));
  } else {
    const template = await getFormatTemplate(menuItemId);
    let content, title, url;
    if (menuItemId.startsWith(COPY_LINK)) {
      if (menuItemId === `${COPY_LINK}${BBCODE_URL}`) {
        content = document.getElementById(CONTENT_LINK_BBCODE).value || "";
        url = contextUrl;
      } else {
        content = document.getElementById(CONTENT_LINK).value || "";
        title = contextTitle;
        url = contextUrl;
      }
    } else if (menuItemId.startsWith(COPY_PAGE)) {
      if (menuItemId === `${COPY_PAGE}${BBCODE_URL}`) {
        content = document.getElementById(CONTENT_PAGE_BBCODE).value || "";
        url = canonicalUrl || tabUrl;
      } else {
        content = document.getElementById(CONTENT_PAGE).value || "";
        title = tabTitle;
        url = canonicalUrl || tabUrl;
      }
    }
    if (url) {
      func.push(sendMessage(runtime.id, {
        [EXEC_COPY]: {
          content, includeTitleHtml, includeTitleMarkdown, menuItemId,
          mimeType, template, title, url,
        },
      }));
    }
  }
  func.push(initContextInfo());
  return Promise.all(func).catch(throwErr);
};

/**
 * handle open options on click
 * @returns {AsyncFunction} - runtime.openOptionsPage()
 */
export const openOptionsOnClick = () => runtime.openOptionsPage();

/**
 * handle menu on click
 * @param {!Object} evt - Event
 * @returns {AsyncFunction} - createCopyData()
 */
export const menuOnClick = evt => createCopyData(evt).catch(throwErr);

/**
 * add listener to menu
 * @returns {void}
 */
export const addListenerToMenu = async () => {
  const nodes = document.querySelectorAll("button");
  for (const node of nodes) {
    const {id} = node;
    if (id === OPTIONS_OPEN) {
      node.addEventListener("click", openOptionsOnClick);
    } else {
      node.addEventListener("click", menuOnClick);
    }
  }
};

/**
 * update menu
 * @param {Object} data - context data;
 * @returns {void}
 */
export const updateMenu = async (data = {}) => {
  const {contextInfo: info} = data;
  await initContextInfo();
  if (info) {
    const {canonicalUrl, content, isLink, title, url} = info;
    const nodes = document.querySelectorAll(LINK_MENU);
    const contentLink = document.getElementById(CONTENT_LINK);
    const contentBBCode = document.getElementById(CONTENT_LINK_BBCODE);
    contextInfo.isLink = isLink;
    contextInfo.canonicalUrl = canonicalUrl;
    contextInfo.content = content;
    contextInfo.title = title;
    contextInfo.url = url;
    contentLink.value = content || "";
    contentBBCode.value = url || "";
    for (const node of nodes) {
      const attr = "disabled";
      if (isLink) {
        node.removeAttribute(attr);
      } else {
        node.setAttribute(attr, attr);
      }
    }
  }
};

/**
 * request context info
 * @param {Object} tab - tabs.Tab
 * @returns {void}
 */
export const requestContextInfo = async (tab = {}) => {
  const {id} = tab;
  await initContextInfo();
  if (Number.isInteger(id) && id !== TAB_ID_NONE) {
    try {
      await sendMessage(id, {
        [CONTEXT_INFO_GET]: true,
      });
    } catch (e) {
      logErr(e);
      await updateMenu({
        contextInfo: {
          isLink: false,
          content: null,
          title: null,
          url: null,
          canonicalUrl: null,
        },
      });
    }
  }
};

/**
 * handle message
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
 * @param {string} item - item
 * @param {Object} obj - value object
 * @param {boolean} changed - changed
 * @returns {void}
 */
export const setVar = async (item, obj) => {
  if (item && obj) {
    const {checked, value} = obj;
    switch (item) {
      case INCLUDE_TITLE_HTML:
      case INCLUDE_TITLE_MARKDOWN:
        vars[item] = !!checked;
        break;
      case OUTPUT_HTML_HYPER:
      case OUTPUT_HTML_PLAIN:
        if (checked) {
          vars.mimeType = value;
        }
        break;
      case OUTPUT_TEXT_TEXT:
      case OUTPUT_TEXT_TEXT_URL:
      case OUTPUT_TEXT_URL:
        if (checked) {
          vars.textOutput = value;
        }
        break;
      default:
    }
  }
};

/**
 * set variables
 * @param {Object} data - data
 * @returns {Promise.<Array>} - results of each handler
 */
export const setVars = async (data = {}) => {
  const items = Object.entries(data);
  const func = [];
  for (const [key, value] of items) {
    const {newValue} = value;
    func.push(setVar(key, newValue || value, !!newValue));
  }
  return Promise.all(func);
};
