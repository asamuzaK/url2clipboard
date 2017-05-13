/**
 * background.js
 */
"use strict";
{
  /* api */
  const {browserAction, contextMenus, extension, i18n, runtime, tabs} = browser;

  /* constants */
  const CLIP_ELEMENT = "clipboard";
  const CLIP_TEXT = "clipboardText";
  const COPY_LINK = "copyLinkUrl";
  const COPY_PAGE = "copyPageUrl";
  const EXT_NAME = "extensionName";
  const ICON = "img/icon.svg";
  const ID_WEBEXT = "url2clipboard@asamuzak.jp";
  const KEY = "Alt+Shift+C";
  const LINK_BBCODE = "linkBBCode";
  const LINK_HTML = "linkHtml";
  const LINK_MD = "linkMarkdown";
  const LINK_TEXT = "linkText";
  const MENU_BBCODE = "menuBBCode";
  const MENU_HTML = "menuHtml";
  const MENU_ITEM_ID = "menuItemId";
  const MENU_MD = "menuMarkdown";
  const MENU_TEXT = "menuText";
  const PAGE_BBCODE = "pageBBCode";
  const PAGE_HTML = "pageHtml";
  const PAGE_MD = "pageMarkdown";
  const PAGE_TEXT = "pageText";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;
  const USER_INPUT_GET = "userInputGet";
  const USER_INPUT_RES = "userInputRes";

  /**
   * log error
   * @param {!Object} e - Error
   * @returns {boolean} - false
   */
  const logError = e => {
    console.error(e);
    return false;
  };

  /**
   * log warn
   * @param {*} msg - message
   * @returns {boolean} - false
   */
  const logWarn = msg => {
    msg && console.warn(msg);
    return false;
  };

  /**
   * get type
   * @param {*} o - object to check
   * @returns {string} - type of object
   */
  const getType = o =>
    Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);

  /**
   * is string
   * @param {*} o - object to check
   * @returns {boolean} - result
   */
  const isString = o => typeof o === "string" || o instanceof String;

  /**
   * stringify positive integer
   * @param {number} i - integer
   * @param {boolean} zero - treat 0 as a positive integer
   * @returns {?string} - stringified integer
   */
  const stringifyPositiveInt = (i, zero = false) =>
    Number.isSafeInteger(i) && (zero && i >= 0 || i > 0) && `${i}` || null;

  /**
   * is tab
   * @param {*} tabId - tab ID
   * @returns {boolean} - result
   */
  const isTab = async tabId => {
    let tab;
    if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
      tab = await tabs.get(tabId).catch(logError);
    }
    return !!tab;
  };

  // NOTE: not working yet in WebExtensions. issue #1
  /**
   * copy to clipboard
   * @param {string} text - text to copy
   * @returns {void}
   */
  const copyToClipboard = async text => {
    const elm = document.getElementById(CLIP_ELEMENT);
    if (elm) {
      if (isString(text)) {
        elm.textContent = text;
        elm.select();
        document.execCommand("copy");
      } else {
        logWarn(`url2clipboard: Expected String but got ${getType(text)}.`);
      }
    } else {
      logWarn(`url2clipboard: Element#${CLIP_ELEMENT} not found.`);
    }
  };

  /**
   * send text to copy
   * @param {number} tabId - tab ID
   * @param {Object} tab - tabs.Tab
   * @param {string} text - text to clip
   * @returns {?AsyncFunction} - send message
   */
  const sendText = async (tabId, tab, text) => {
    let func;
    if ((tab || await isTab(tabId)) && isString(text)) {
      const msg = {
        [CLIP_TEXT]: text,
      };
      func = tabs.sendMessage(tabId, msg);
    }
    return func || null;
  };

  /**
   * send user input request
   * @param {number} tabId - tab ID
   * @param {Object} tab - tabs.Tab
   * @param {Object} data - input data
   * @returns {?AsyncFunction} - send message
   */
  const requestInput = async (tabId, tab, data) => {
    let func;
    if (tab || await isTab(tabId)) {
      const msg = {
        [USER_INPUT_GET]: data,
      };
      func = tabs.sendMessage(tabId, msg);
    }
    return func || null;
  };

  /**
   * create HTML Anchor
   * @param {string} content - content title
   * @param {string} title - document title
   * @param {string} url - document URL
   * @returns {?string} - HTML Anchor format
   */
  const createHtml = async (content, title, url) => {
    let text;
    if (isString(content) && isString(title) && isString(url)) {
      content = content.trim();
      title = title.replace(/"/g, "&quot;");
      text = `<a href="${url}" title="${title}">${content}</a>`;
    }
    return text || null;
  };

  /**
   * create Markdown Link
   * @param {string} content - content title
   * @param {string} title - document title
   * @param {string} url - document URL
   * @returns {?string} - Markdown Link format
   */
  const createMarkdown = async (content, title, url) => {
    let text;
    if (isString(content) && isString(title) && isString(url)) {
      content = content.trim();
      title = title.replace(/"/g, "\\\"");
      text = `[${content}](${url} "${title}")`;
    }
    return text || null;
  };

  /**
   * create BBCode Link
   * @param {string} content - content title
   * @param {string} url - document URL
   * @returns {?string} - BBCode Link format
   */
  const createBBCode = async (content, url) => {
    let text;
    if (isString(content) && isString(url)) {
      content = content.trim();
      text = `[url=${url}]${content}[/url]`;
    }
    return text || null;
  };

  /**
   * create BBCode URL Link
   * @param {string} url - document URL
   * @returns {?string} - BBCode Link format
   */
  const createBBCodeUrl = async url => {
    let text;
    if (isString(url)) {
      text = `[url]${url}[/url]`;
    }
    return text || null;
  };

  /**
   * create Text Link
   * @param {string} content - content title
   * @param {string} url - document URL
   * @returns {?string} - Text Link format
   */
  const createText = async (content, url) => {
    let text;
    if (isString(content) && isString(url)) {
      content = content.trim();
      text = `${content} <${url}>`;
    }
    return text || null;
  };

  /**
   * extract data
   * @param {Object} data - tab data
   * @returns {?AsyncFunction} - send text / request input
   */
  const extractData = async (data = {}) => {
    const {info, tab} = data;
    const isWebExt = runtime.id === ID_WEBEXT;
    let func;
    if (info && tab) {
      const {id: tabId, title, url} = tab;
      if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
        const {menuItemId, selectionText} = info;
        const content = selectionText || title;
        let text;
        switch (menuItemId) {
          case MENU_BBCODE:
            text = await createBBCode(content, url);
            break;
          case MENU_HTML:
            text = await createHtml(content, title, url);
            break;
          case MENU_MD:
            text = await createMarkdown(content, title, url);
            break;
          case MENU_TEXT:
            text = await createText(content, url);
            break;
          case `${MENU_BBCODE}_url`:
            text = await createBBCodeUrl(url);
            break;
          case `${MENU_BBCODE}_input`:
          case `${MENU_HTML}_input`:
          case `${MENU_MD}_input`:
          case `${MENU_TEXT}_input`:
            func = requestInput(tabId, tab, {
              content, menuItemId, tabId, title, url,
            });
            break;
          default:
        }
        if (!func && text) {
          func = isWebExt ?
                   sendText(tabId, tab, text) :
                   copyToClipboard(text);
        }
      }
    }
    return func || null;
  };

  /**
   * extract user input data
   * @param {Object} data - tab data
   * @returns {?AsyncFunction} - send text
   */
  const extractInput = async (data = {}) => {
    const {content, menuItemId, tabId, title, url} = data;
    const tab = await tabs.get(tabId).catch(logError);
    const isWebExt = runtime.id === ID_WEBEXT;
    let func;
    if (tab) {
      let text;
      switch (menuItemId) {
        case `${MENU_BBCODE}_input`:
          text = await createBBCode(content, url);
          break;
        case `${MENU_HTML}_input`:
          text = await createHtml(content, title, url);
          break;
        case `${MENU_MD}_input`:
          text = await createMarkdown(content, title, url);
          break;
        case `${MENU_TEXT}_input`:
          text = await createText(content, url);
          break;
        default:
      }
      if (text) {
        func = isWebExt ?
                 sendText(tabId, tab, text) :
                 copyToClipboard(text);
      }
    }
    return func || null;
  };

  /* enabled tabs collection */
  const enabledTabs = {};

  /**
   * set enabled tab
   * @param {number} tabId - tab ID
   * @param {Object} tab - tabs.Tab
   * @param {Object} data - context info
   * @returns {void}
   */
  const setEnabledTab = async (tabId, tab, data = {}) => {
    const {enabled} = data;
    if (tab || await isTab(tabId)) {
      tabId = stringifyPositiveInt(tabId);
      tabId && (enabledTabs[tabId] = !!enabled);
    }
  };

  /**
   * remove enabled tab
   * @param {number} tabId - tab ID
   * @returns {boolean} - result
   */
  const removeEnabledTab = async tabId => {
    let bool;
    tabId = stringifyPositiveInt(tabId);
    if (tabId && enabledTabs[tabId]) {
      bool = delete enabledTabs[tabId];
    }
    return bool || false;
  };

  /**
   * get active tab
   * @returns {Object} - tabs.Tab
   */
  const getActiveTab = async () => {
    const arr = await tabs.query({active: true});
    let tab;
    if (arr.length) {
      [tab] = arr;
    }
    return tab || null;
  };

  /**
   * create data
   * @param {Object} menuItemId - menuItemId
   * @returns {?AsyncFunction} - extract data
   */
  const createData = async menuItemId => {
    const info = isString(menuItemId) && {menuItemId};
    const tab = await getActiveTab();
    return info && tab && extractData({info, tab}) || null;
  };

  /* context menu */
  const menus = [MENU_HTML, MENU_MD, MENU_BBCODE, MENU_TEXT];

  /**
   * create context menu item
   * @param {string} id - menu item ID
   * @param {Array} contexts - contexts
   * @param {Object} data - context data
   * @returns {void}
   */
  const createMenuItem = async (id, contexts, data = {}) => {
    const {enabled} = data;
    isString(id) && Array.isArray(contexts) &&
      contextMenus.create({
        id, contexts,
        enabled: !!enabled,
        title: i18n.getMessage(id),
      });
  };

  /**
   * create context menu items
   * @param {Object} data - context data
   * @returns {Promise.<Array>} - results of each handler
   */
  const createMenuItems = async data => {
    const func = [];
    for (const item of menus) {
      func.push(createMenuItem(item, ["all"], data));
      item === MENU_BBCODE &&
        func.push(createMenuItem(`${item}_url`, ["all"], data));
      func.push(createMenuItem(`${item}_input`, ["all"], data));
    }
    return Promise.all(func);
  };

  /**
   * update context menu
   * @param {Object} data - context data
   * @returns {Promise.<Array>} - results of each handler
   */
  const updateContextMenu = async (data = {}) => {
    const {enabled} = data;
    const func = [];
    for (const item of menus) {
      func.push(
        contextMenus.update(item, {enabled: !!enabled}),
        contextMenus.update(`${item}_input`, {enabled: !!enabled})
      );
      item === MENU_BBCODE &&
        func.push(contextMenus.update(`${item}_url`, {enabled: !!enabled}));
    }
    return Promise.all(func);
  };

  /**
   * show icon
   * @param {Object} data - context data
   * @returns {Promise.<Array>} - results of each handler
   */
  const showIcon = async (data = {}) => {
    const {enabled} = data;
    const name = await i18n.getMessage(EXT_NAME);
    const icon = await extension.getURL(ICON);
    const path = enabled && `${icon}#gray` || `${icon}#off`;
    const title = `${name} (${KEY})`;
    return Promise.all([
      browserAction.setIcon({path}),
      browserAction.setTitle({title}),
    ]);
  };

  /**
   * handle message
   * @param {*} msg - message
   * @param {Object} sender - sender
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async (msg, sender = {}) => {
    const func = [];
    const items = msg && Object.keys(msg);
    const tab = sender && sender.tab;
    const tabId = tab && tab.id;
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case "mousedown":
            func.push(updateContextMenu(obj));
            break;
          case "load":
            func.push(
              setEnabledTab(tabId, tab, obj),
              showIcon(obj),
              updateContextMenu(obj)
            );
            break;
          case MENU_ITEM_ID:
            func.push(createData(obj));
            break;
          case USER_INPUT_RES:
            func.push(extractInput(obj));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * handle active tab
   * @param {Object} info - active tab info
   * @param {Object} tab - tabs.Tab
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleActiveTab = async (info = {}, tab = null) => {
    const {tabId} = info;
    const func = [];
    if (tab || await isTab(tabId)) {
      const enabledTab = await stringifyPositiveInt(tabId);
      const enabled = enabledTab && enabledTabs[enabledTab] || false;
      func.push(
        updateContextMenu({enabled}),
        showIcon({enabled})
      );
    }
    return Promise.all(func);
  };

  /**
   * handle updated tab
   * @param {number} tabId - tab ID
   * @param {Object} tab - tab.Tab
   * @returns {?AsyncFunction} - handle active tab
   */
  const handleUpdatedTab = async (tabId, tab = {}) => {
    const {active} = tab;
    const func = active && handleActiveTab({tabId}, tab);
    return func || null;
  };

  /* listeners */
  contextMenus.onClicked.addListener((info, tab) =>
    extractData({info, tab}).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );
  tabs.onActivated.addListener(info =>
    handleActiveTab(info).catch(logError)
  );
  tabs.onRemoved.addListener(tabId =>
    removeEnabledTab(tabId).catch(logError)
  );
  tabs.onUpdated.addListener((tabId, info, tab) =>
    handleUpdatedTab(tabId, tab).catch(logError)
  );

  /* startup */
  createMenuItems().catch(logError);
}
