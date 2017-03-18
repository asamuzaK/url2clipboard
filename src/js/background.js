/**
 * background.js
 */
"use strict";
{
  /* api */
  const {contextMenus, extension, i18n, pageAction, runtime, tabs} = browser;

  /* constants */
  const CLIP_ELEMENT = "clipboard";
  const CLIP_TEXT = "clipboardText";
  const EXT_NAME = "extensionName";
  const HTML_A = "htmlAnchor";
  const ICON = "img/icon.svg";
  const INPUT = "userInput";
  const KEY = "Alt + Shift + C";
  const MD_LINK = "markdownLink";
  const POPUP = "html/popup.html";
  const TXT_LINK = "textLink";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;

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

  /* background */
  /**
   * is tabId
   * @param {*} tabId - tabId
   * @returns {boolean} - result
   */
  const isTabId = tabId =>
    Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE;

  // NOTE: not working yet. issue #1
  /**
   * copy to clipboard
   * @param {string} text - text to copy
   * @returns {void} - Promise.<void>
   */
  const copyToClipboard = async text => {
    const elm = document.getElementById(CLIP_ELEMENT);
    if (elm) {
      if (isString(text)) {
        const range = document.createRange();
        const sel = window.getSelection();
        elm.textContent = text;
        range.selectNodeContents(elm);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
      } else {
        logWarn(`url2clipboard: Expected String but got ${getType(text)}.`);
      }
    } else {
      logWarn(`url2clipboard: Element#${CLIP_ELEMENT} not found.`);
    }
  };

  /**
   * send text
   * @param {number} tabId - tab ID
   * @param {string} text - text to clip
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const sendText = async (tabId, text) => {
    let func;
    if (isTabId(tabId) && isString(text)) {
      const msg = {
        [CLIP_TEXT]: text,
      };
      func = tabs.sendMessage(tabId, msg);
    }
    return func || null;
  };

  /**
   * get user input
   * @param {string} text - default text
   * @returns {string} - user input text
   */
  const getInput = async (text = "") => {
    const msg = await i18n.getMessage(INPUT);
    text = await window.prompt(msg, text);
    return text || "";
  };

  /**
   * create HTML Anchor
   * @param {string} content - content title
   * @param {string} title - document title
   * @param {string} url - document URL
   * @returns {?string} - HTML Anchor
   */
  const createHtml = async (content, title, url) =>
    isString(content) && isString(title) && isString(url) &&
    `<a href="${url}" title="${title}">${content.trim()}</a>` || null;

  /**
   * create Markdown Link
   * @param {string} content - content title
   * @param {string} title - document title
   * @param {string} url - document URL
   * @returns {?string} - Markdown Link
   */
  const createMarkdown = async (content, title, url) =>
    isString(content) && isString(title) && isString(url) &&
    `[${content.trim()}](${url} "${title}")` || null;

  /**
   * create Text Link
   * @param {string} content - content title
   * @param {string} url - document URL
   * @returns {?string} - Text Link
   */
  const createText = async (content, url) =>
    isString(content) && isString(url) && `${content.trim()} <${url}>` || null;

  /**
   * extract data
   * @param {Object} data - tab data
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const extractData = async (data = {}) => {
    const {info, tab} = data;
    let func;
    if (info && tab) {
      const {id: tabId, title, url} = tab;
      if (isTabId(tabId)) {
        const {menuItemId, selectionText} = info;
        const input = /\.input$/.test(menuItemId);
        const content = input ?
                          await getInput(selectionText || title) :
                          selectionText || title;
        let text;
        switch (menuItemId) {
          case HTML_A:
          case `${HTML_A}.input`:
            text = await createHtml(content, title, url);
            text && (func = sendText(tabId, text));
            break;
          case MD_LINK:
          case `${MD_LINK}.input`:
            text = await createMarkdown(content, title, url);
            text && (func = sendText(tabId, text));
            break;
          case TXT_LINK:
          case `${TXT_LINK}.input`:
            text = await createText(content, url);
            text && (func = sendText(tabId, text));
            break;
          default:
        }
      }
    }
    return func || null;
  };

  /* tabs */
  /* enabled tabs collection */
  const enabledTabs = {
    active: null,
  };

  /**
   * set enabled tab
   * @param {number} tabId - tab ID
   * @param {boolean} enabled - enabled
   * @returns {void} - Promise.<void>
   */
  const setEnabledTab = async (tabId, enabled = false) => {
    if (isTabId(tabId)) {
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
    const {active: tabId} = enabledTabs;
    let tab;
    if (isTabId(tabId)) {
      tab = await tabs.get(tabId);
    }
    return tab || null;
  };

  /**
   * create data
   * @param {Object} menuItemId - menuItemId
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const createData = async menuItemId => {
    const info = isString(menuItemId) && {menuItemId};
    const tab = await getActiveTab();
    return info && tab && extractData({info, tab}) || null;
  };

  /* context menu */
  const menus = [HTML_A, MD_LINK, TXT_LINK];

  /**
   * create context menu item
   * @param {string} id - menu item ID
   * @param {Array} contexts - contexts
   * @param {boolean} enabled - enabled
   * @returns {void} - Promise.<void>
   */
  const createMenuItem = async (id, contexts, enabled = false) => {
    isString(id) && Array.isArray(contexts) &&
      contextMenus.create({
        id, contexts,
        enabled: !!enabled,
        title: i18n.getMessage(id),
      });
  };

  /**
   * create context menu items
   * @param {boolean} enabled - enabled
   * @returns {Object} - Promise.<Array>
   */
  const createMenuItems = async enabled => {
    const func = [];
    for (const item of menus) {
      func.push(
        createMenuItem(item, ["all"], enabled),
        createMenuItem(`${item}.input`, ["all"], enabled)
      );
    }
    return Promise.all(func);
  };

  /**
   * update context menu
   * @param {boolean} enabled - enabled
   * @returns {Object} - Promise.<Array>
   */
  const updateContextMenu = async (enabled = false) => {
    const func = [];
    for (const item of menus) {
      func.push(
        contextMenus.update(item, {enabled}),
        contextMenus.update(`${item}.input`, {enabled})
      );
    }
    return Promise.all(func);
  };

  /* page action*/
  /**
   * show icon
   * @param {number} tabId - tab ID
   * @param {boolean} enabled - enabled
   * @returns {Object} - Promise.<Array>
   */
  const showIcon = async (tabId, enabled = false) => {
    const func = [];
    if (isTabId(tabId)) {
      if (enabled) {
        const name = await i18n.getMessage(EXT_NAME);
        const icon = await extension.getURL(ICON);
        const path = `${icon}#neutral`;
        const popup = await extension.getURL(POPUP);
        const title = `${name} (${KEY})`;
        func.push(
          pageAction.setIcon({path, tabId}),
          pageAction.setPopup({popup, tabId}),
          pageAction.setTitle({tabId, title}),
          pageAction.show(tabId)
        );
      } else {
        func.push(pageAction.hide(tabId));
      }
    }
    return Promise.all(func);
  };

  /* handlers */
  /**
   * handle message
   * @param {*} msg - message
   * @param {Object} sender - sender
   * @returns {Object} - Promise.<Array>
   */
  const handleMsg = async (msg, sender = {}) => {
    const func = [];
    const items = msg && Object.keys(msg);
    const tabId = sender && sender.tab && sender.tab.id;
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case "contextmenu":
            func.push(updateContextMenu(obj));
            break;
          case "load":
            func.push(
              setEnabledTab(tabId, obj),
              showIcon(tabId, obj),
              updateContextMenu(obj)
            );
            break;
          case "menuItemId":
            func.push(createData(obj));
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
   * @returns {Object} - Promise.<Array>
   */
  const handleActiveTab = async (info = {}) => {
    const {tabId} = info;
    const func = [];
    enabledTabs.active = tabId;
    if (isTabId(tabId)) {
      const enabledTab = await stringifyPositiveInt(tabId);
      const enabled = enabledTab && enabledTabs[enabledTab] || false;
      func.push(updateContextMenu(enabled), showIcon(tabId, enabled));
    }
    return Promise.all(func);
  };

  /**
   * handle updated tab
   * @param {number} tabId - tab ID
   * @param {Object} tab - tab.Tab
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const handleUpdatedTab = async (tabId, tab = {}) => {
    const {active} = tab;
    const func = active && handleActiveTab({tabId});
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
