/**
 * background.js
 */
"use strict";
{
  /* api */
  const {contextMenus, extension, i18n, pageAction, runtime, tabs} = browser;

  /* constants */
  const EXT_NAME = "extensionName";
  const HTML_A = "htmlAnchor";
  const ICON = "img/icon.svg";
  const KEY = "Alt + Shift + C";
  const MD_LINK = "markdownLink";
  const POPUP = "html/popup.html";
  const TXT_LINK = "textLink";

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

  /* tabs */
  /**
   * send data
   * @param {!Object} info - contextMenus.OnClickData
   * @param {!Object} tab - tabs.Tab
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const sendData = async (info, tab) => {
    const {id: tabId} = tab;
    let func;
    if (tabId !== tabs.TAB_ID_NONE) {
      const {menuItemId} = info;
      const data = {info, tab};
      const input = /\.input$/.test(menuItemId);
      const msg = {data, input, menuItemId};
      func = tabs.sendMessage(tabId, msg);
    }
    return func || null;
  };

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
    if (tabId !== tabs.TAB_ID_NONE) {
      tabId = stringifyPositiveInt(tabId);
      tabId && (enabledTabs[tabId] = !!enabled);
    }
  };

  /**
   * get active tab
   * @returns {Object} - Promise.<Object>, tabs.Tab
   */
  const getActiveTab = async () => {
    const {active: tabId} = enabledTabs;
    let tab;
    if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
      tab = await tabs.get(tabId);
    }
    return tab || null;
  };

  /**
   * remove enabled tab
   * @param {number} tabId - tab ID
   * @returns {boolean} - Promise.<boolean>, result
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
   * create data
   * @param {Object} menuItemId - menuItemId
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const createData = async menuItemId => {
    const info = isString(menuItemId) && {menuItemId};
    const tab = await getActiveTab();
    return info && tab && sendData(info, tab) || null;
  };

  /* context menu */
  const menus = [HTML_A, MD_LINK, TXT_LINK];

  /**
   * create context menu item
   * @param {string} id - menu item ID
   * @param {Array} contexts - contexts
   * @returns {void} - Promise.<void>
   */
  const createMenuItem = async (id, contexts, enabled) => {
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
   * @returns {void} - Promise.<void>
   */
  const showIcon = async (tabId, enabled = false) => {
    if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
      if (enabled) {
        const name = await i18n.getMessage(EXT_NAME);
        const icon = await extension.getURL(ICON);
        const path = `${icon}#neutral`;
        const popup = await extension.getURL(POPUP);
        const title = `${name} (${KEY})`;
        pageAction.setIcon({path, tabId});
        pageAction.setPopup({popup, tabId});
        pageAction.setTitle({tabId, title});
        pageAction.show(tabId);
      } else {
        pageAction.hide(tabId);
      }
    }
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
    await contextMenus.removeAll();
    if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
      const enabledTab = await stringifyPositiveInt(tabId);
      const enabled = enabledTab && enabledTabs[enabledTab] || false;
      func.push(createMenuItems(enabled), showIcon(tabId, enabled));
    }
    return Promise.all(func);
  };

  /* listeners */
  contextMenus.onClicked.addListener((info, tab) =>
    sendData(info, tab).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );
  tabs.onActivated.addListener(info =>
    handleActiveTab(info).catch(logError)
  );
  tabs.onRemoved.addListener(tabId => {
    removeEnabledTab(tabId).catch(logError);
  });
  tabs.onUpdated.addListener((tabId, info, tab) => {
    const {active} = tab;
    const func = active && handleActiveTab({tabId}).catch(logError);
    return func || null;
  });

  /* startup */
  createMenuItems().catch(logError);
}
