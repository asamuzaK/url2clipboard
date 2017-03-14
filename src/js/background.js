/**
 * background.js
 */
"use strict";
{
  /* api */
  const {contextMenus, i18n, pageAction, runtime, tabs} = browser;

  /* constants */
  const EXT_NAME = "extensionName";
  const ICON = "./img/icon.svg";
  const KEY = "Alt + Shift + C";
  const HTML_A = "htmlAnchor";
  const MD_LINK = "markdownLink";
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
   * send data
   * @param {!Object} info - contextMenus.OnClickData
   * @param {!Object} tab - tabs.Tab
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const sendData = async (info, tab) => {
    const {id} = tab;
    const {menuItemId} = info;
    const data = {info, tab};
    const input = /\.input$/.test(menuItemId);
    const msg = {data, input, menuItemId};
    return id !== tabs.TAB_ID_NONE && tabs.sendMessage(id, msg) || null;
  };

  /* active tab info */
  const actTab = {
    info: null,
  };

  /**
   * set active tab info
   * @param {Object} info - active tab info
   * @returns {void} - Promise.<void>
   */
  const setActiveTab = async (info = {}) => {
    console.log(info);
    const {tabId} = info;
    tabId !== tabs.TAB_ID_NONE && (actTab.info = info);
  };

  /**
   * get active tab info
   * @returns {Object} - Promise.<Object>, tabs.Tab
   */
  const getActiveTab = async () => {
    const {info} = actTab;
    let tab;
    if (info) {
      const {tabId} = info;
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
  const createMenuItem = async (id, contexts) => {
    isString(id) && Array.isArray(contexts) &&
      contextMenus.create({
        id, contexts,
        enabled: false,
        title: i18n.getMessage(id),
      });
  };

  /**
   * create context menu items
   * @returns {Object} - Promise.<Array>
   */
  const createMenuItems = async () => {
    const func = [];
    for (const item of menus) {
      func.push(
        createMenuItem(item, ["all"]),
        createMenuItem(`${item}.input`, ["all"])
      );
    }
    return Promise.all(func);
  };

  /**
   * restore context menu
   * @returns {Object} - Promise.<AsyncFunction>
   */
  const restoreContextMenu = async () =>
    contextMenus.removeAll().then(createMenuItems);

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
   * @param {boolean} enabled - enabled
   * @param {Object} sender - sender info
   * @returns {void} - Promise.<void>
   */
  const showIcon = async (enabled = false, sender = {}) => {
    const {tab} = sender;
    if (tab) {
      const {id: tabId} = tab;
      if (tabId !== tabs.TAB_ID_NONE) {
        if (enabled) {
          const name = await i18n.getMessage(EXT_NAME);
          const path = `${ICON}#neutral`;
          const title = `${name} (${KEY})`;
          pageAction.setIcon({path, tabId});
          pageAction.setTitle({tabId, title});
          pageAction.show(tabId);
        } else {
          pageAction.hide(tabId);
        }
        setActiveTab({tabId});
      }
    }
  };

  /**
   * handle message
   * @param {*} msg - message
   * @param {Object} sender - sender
   * @returns {Object} - Promise.<Array>
   */
  const handleMsg = async (msg, sender) => {
    const func = [];
    const items = msg && Object.keys(msg);
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case "contextmenu":
            func.push(updateContextMenu(obj));
            break;
          case "load":
            func.push(updateContextMenu(obj), showIcon(obj, sender));
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

  /* listeners */
  contextMenus.onClicked.addListener((info, tab) =>
    sendData(info, tab).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );
  tabs.onActivated.addListener(info =>
    Promise.all([
      restoreContextMenu(),
      setActiveTab(info),
    ]).catch(logError)
  );

  /* startup */
  createMenuItems().catch(logError);
}
