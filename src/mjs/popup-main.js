/**
 * popup-main.js
 */

import {
  Clip,
} from "./clipboard.js";
import {
  closeWindow, getType, isString, throwErr,
} from "./common.js";
import {
  getAllTabsInWindow, getHighlightedTab, sendMessage,
} from "./browser.js";
import {
  createTabsLinkText, createLinkText, getFormat, getFormatId, getFormats,
  getFormatsKeys, hasFormat, setFormat,
} from "./format.js";
import {
  notifyOnCopy,
} from "./notify.js";

/* api */
const {runtime, tabs, windows} = browser;

/* constants */
import {
  BBCODE_URL, CONTENT_LINK, CONTENT_LINK_BBCODE, CONTENT_PAGE,
  CONTENT_PAGE_BBCODE, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, COPY_TABS_ALL, COPY_TABS_SELECTED,
  HTML_HYPER, HTML_PLAIN,
  INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  LINK_MENU, MARKDOWN, MIME_HTML, MIME_PLAIN, NOTIFY_COPY,
  TEXT_SEP_LINES, TEXT_TEXT_URL,
} from "./constant.js";
const {TAB_ID_NONE} = tabs;
const {WINDOW_ID_CURRENT} = windows;
const OPTIONS_OPEN = "openOptions";

/* variables */
export const vars = {
  includeTitleHTMLHyper: false,
  includeTitleHTMLPlain: false,
  includeTitleMarkdown: false,
  notifyOnCopy: false,
  separateTextURL: false,
};

/* enabled formats */
export const enabledFormats = new Set();

/**
 * toggle enabled formats
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
 * @returns {Promise.<Array>} - result of each handler
 */
export const setFormatData = async () => {
  const items = await getFormats(true);
  const func = [];
  for (const [key, value] of items) {
    const {enabled} = value;
    func.push(toggleEnabledFormats(key, enabled));
  }
  return Promise.all(func);
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
  const item = await getFormat(id);
  let template;
  if (item) {
    const {
      id: itemId, template: itemTmpl, templateAlt: itemTmplAlt,
    } = item;
    const {
      includeTitleHTMLHyper, includeTitleHTMLPlain, includeTitleMarkdown,
      separateTextURL,
    } = vars;
    switch (itemId) {
      case HTML_HYPER:
        template = includeTitleHTMLHyper && itemTmpl || itemTmplAlt;
        break;
      case HTML_PLAIN:
        template = includeTitleHTMLPlain && itemTmpl || itemTmplAlt;
        break;
      case MARKDOWN:
        template = includeTitleMarkdown && itemTmpl || itemTmplAlt;
        break;
      case TEXT_TEXT_URL:
        template = separateTextURL && itemTmplAlt || itemTmpl;
        break;
      default:
        template = itemTmpl;
    }
  }
  return template || null;
};

/**
 * get format title
 * @param {string} id - menu item ID
 * @returns {?string} - title
 */
export const getFormatTitle = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = await getFormat(id);
  let title;
  if (item) {
    const {id: itemId, title: itemTitle} = item;
    title = itemTitle || itemId;
  }
  return title || null;
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
  const template = await getFormatTemplate(menuItemId);
  const arr = await getAllTabsInWindow(WINDOW_ID_CURRENT);
  arr.forEach(tab => {
    const {id, title, url} = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id, formatId, template, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/**
 * get selected tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
export const getSelectedTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = await getFormatTemplate(menuItemId);
  const arr = await getHighlightedTab(WINDOW_ID_CURRENT);
  arr.forEach(tab => {
    const {id, title, url} = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id, formatId, template, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/**
 * create copy data
 * @param {!Object} evt - Event
 * @returns {Promise} - Promise chain
 */
export const createCopyData = async evt => {
  const {target} = evt;
  const {id: menuItemId} = target;
  const {notifyOnCopy: notify} = vars;
  const {title: tabTitle, url: tabUrl} = tabInfo;
  const {canonicalUrl, title: contextTitle, url: contextUrl} = contextInfo;
  const formatId = getFormatId(menuItemId);
  const formatTitle = await getFormatTitle(formatId);
  const mimeType = formatId === HTML_HYPER && MIME_HTML || MIME_PLAIN;
  const func = [];
  let text;
  if (menuItemId.startsWith(COPY_TABS_ALL)) {
    const allTabs = await getAllTabsInfo(menuItemId);
    const arr = [];
    for (const tabData of allTabs) {
      arr.push(createLinkText(tabData));
    }
    const tmplArr = await Promise.all(arr);
    text = await createTabsLinkText(tmplArr, mimeType);
  } else if (menuItemId.startsWith(COPY_TABS_SELECTED)) {
    const selectedTabs = await getSelectedTabsInfo(menuItemId);
    const arr = [];
    for (const tabData of selectedTabs) {
      arr.push(createLinkText(tabData));
    }
    const tmplArr = await Promise.all(arr);
    text = await createTabsLinkText(tmplArr, mimeType);
  } else {
    const template = await getFormatTemplate(formatId);
    let content, title, url;
    if (menuItemId.startsWith(COPY_LINK)) {
      if (formatId === BBCODE_URL) {
        content = document.getElementById(CONTENT_LINK_BBCODE).value || "";
        url = contextUrl;
      } else {
        content = document.getElementById(CONTENT_LINK).value || "";
        title = contextTitle;
        url = contextUrl;
      }
    } else if (menuItemId.startsWith(COPY_PAGE)) {
      if (formatId === BBCODE_URL) {
        content = document.getElementById(CONTENT_PAGE_BBCODE).value || "";
        url = canonicalUrl || tabUrl;
      } else {
        content = document.getElementById(CONTENT_PAGE).value || "";
        title = tabTitle;
        url = canonicalUrl || tabUrl;
      }
    }
    if (isString(content) && isString(url)) {
      text = await createLinkText({
        content, formatId, template, title, url,
      });
    }
  }
  if (isString(text)) {
    await (new Clip(text, mimeType)).copy();
    notify && func.push(notifyOnCopy(formatTitle));
  }
  func.push(initContextInfo());
  return Promise.all(func);
};

/**
 * handle open options on click
 * @returns {AsyncFunction} - runtime.openOptionsPage()
 */
export const openOptionsOnClick = () => runtime.openOptionsPage();

/**
 * handle menu on click
 * @param {!Object} evt - Event
 * @returns {Promise} - Promise chain
 */
export const menuOnClick = evt =>
  createCopyData(evt).then(closeWindow).catch(throwErr);

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
 * toggle menu item
 * @returns {void}
 */
export const toggleMenuItem = async () => {
  const nodes = document.querySelectorAll("button");
  const formatsKeys = await getFormatsKeys(true);
  for (const node of nodes) {
    const {id, parentNode} = node;
    const formatId = getFormatId(id);
    if (formatsKeys.includes(formatId)) {
      if (formatId === BBCODE_URL &&
          (id.startsWith(COPY_LINK) || id.startsWith(COPY_PAGE))) {
        if (enabledFormats.has(formatId)) {
          parentNode.parentNode.removeAttribute("hidden");
        } else {
          parentNode.parentNode.setAttribute("hidden", "hidden");
        }
      } else if (enabledFormats.has(formatId)) {
        parentNode.removeAttribute("hidden");
      } else {
        parentNode.setAttribute("hidden", "hidden");
      }
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
 * @returns {?AsyncFunction} - toggleEnabledFormats()
 */
export const setVar = async (item, obj) => {
  let func;
  if (item && obj) {
    const {checked} = obj;
    switch (item) {
      case INCLUDE_TITLE_HTML_HYPER:
      case INCLUDE_TITLE_HTML_PLAIN:
      case INCLUDE_TITLE_MARKDOWN:
      case NOTIFY_COPY:
      case TEXT_SEP_LINES:
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
