/**
 * popup.js
 */

import {
  BBCODE_URL, CONTENT_LINK, CONTENT_LINK_BBCODE, CONTENT_PAGE,
  CONTENT_PAGE_BBCODE, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_ALL_TABS, COPY_LINK, COPY_PAGE, EXEC_COPY, EXEC_COPY_TABS, HTML,
  INCLUDE_TITLE_HTML, INCLUDE_TITLE_MARKDOWN, LINK_MENU,
  MARKDOWN, MIME_HTML, MIME_PLAIN, OUTPUT_HTML_HYPER, OUTPUT_HTML_PLAIN,
  OUTPUT_TEXT, OUTPUT_TEXT_AND_URL, OUTPUT_TEXT_TEXT, OUTPUT_TEXT_TEXT_URL,
  OUTPUT_TEXT_URL, OUTPUT_URL, PATH_FORMAT_DATA,
} from "./constant.js";
import {getType, isString, throwErr} from "./common.js";
import {
  fetchData, getActiveTab, getAllStorage, sendMessage,
} from "./browser.js";
import {localizeHtml} from "./localize.js";

/* api */
const {runtime, storage, tabs} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;

/* variables */
const vars = {
  includeTitleHtml: true,
  includeTitleMarkdown: true,
  mimeType: MIME_PLAIN,
  textOutput: OUTPUT_TEXT_AND_URL,
};

/* formats */
const formats = new Map();

/**
 * fetch format data
 * @returns {void}
 */
const fetchFormatData = async () => {
  const data = await fetchData(PATH_FORMAT_DATA);
  if (data) {
    const items = Object.entries(data);
    for (const item of items) {
      const [key, value] = item;
      formats.set(key, value);
    }
  }
};

/**
 * get format item from menu item ID
 * @param {string} id - menu item id
 * @returns {Object} - format item
 */
const getFormatItemFromId = async id => {
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
const getFormatTemplate = async id => {
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
      includeTitleHtml, includeTitleMarkdown, mimeType, textOutput,
    } = vars;
    switch (itemId) {
      case HTML:
        template = includeTitleHtml && itemTmpl || itemTmplWoTitle;
        if (mimeType === MIME_HTML) {
          template = `${template}<br />`;
        }
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
const tabInfo = {
  id: null,
  title: null,
  url: null,
};

/**
 * init tab info
 * @returns {Object} - tab info
 */
const initTabInfo = async () => {
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
const setTabInfo = async tab => {
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
const contextInfo = {
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
const initContextInfo = async () => {
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
const getAllTabsInfo = async menuItemId => {
  const tabsInfo = [];
  const arr = await tabs.query({currentWindow: true});
  const {mimeType} = vars;
  const template = await getFormatTemplate(menuItemId);
  arr.length && arr.forEach(tab => {
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
const createCopyData = async evt => {
  const {target} = evt;
  const func = [];
  if (target) {
    const {id: menuItemId} = target;
    const {title: tabTitle, url: tabUrl} = tabInfo;
    const {includeTitleHtml, includeTitleMarkdown, mimeType} = vars;
    const {
      canonicalUrl, title: contextTitle, url: contextUrl,
    } = contextInfo;
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
      func.push(sendMessage(runtime.id, {
        [EXEC_COPY]: {
          content, includeTitleHtml, includeTitleMarkdown, menuItemId,
          mimeType, template, title, url,
        },
      }));
    }
    func.push(initContextInfo());
  }
  return Promise.all(func);
};

/**
 * add listener to menu
 * @returns {void}
 */
const addListenerToMenu = async () => {
  const nodes = document.querySelectorAll("button");
  if (nodes instanceof NodeList) {
    for (const node of nodes) {
      node.addEventListener("click", evt =>
        createCopyData(evt).catch(throwErr)
      );
    }
  }
};

/**
 * update menu
 * @param {Object} data - context data;
 * @returns {void}
 */
const updateMenu = async (data = {}) => {
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
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        const attr = "disabled";
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
 * request context info
 * @param {Object} tab - tabs.Tab
 * @returns {void}
 */
const requestContextInfo = async (tab = {}) => {
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
const handleMsg = async msg => {
  const func = [];
  const items = msg && Object.keys(msg);
  if (items && items.length) {
    for (const item of items) {
      const obj = msg[item];
      switch (item) {
        case CONTEXT_INFO:
        case "keydown":
        case "mousedown":
          func.push(updateMenu(obj));
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
 * @returns {Promise.<Array>} - results of each handler
 */
const setVar = async (item, obj) => {
  const func = [];
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
  return Promise.all(func);
};

/**
 * set variables
 * @param {Object} data - storage data
 * @returns {Promise.<Array>} - results of each handler
 */
const setVars = async (data = {}) => {
  const func = [];
  const items = Object.keys(data);
  if (items.length) {
    for (const item of items) {
      const obj = data[item];
      const {newValue} = obj;
      func.push(setVar(item, newValue || obj, !!newValue));
    }
  }
  return Promise.all(func);
};

/* listeners */
storage.onChanged.addListener(data => setVars(data).catch(throwErr));
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);

/* startup */
Promise.all([
  localizeHtml(),
  addListenerToMenu(),
  getActiveTab().then(tab => Promise.all([
    requestContextInfo(tab),
    setTabInfo(tab),
  ])),
  fetchFormatData().then(getAllStorage).then(setVars),
]).catch(throwErr);
