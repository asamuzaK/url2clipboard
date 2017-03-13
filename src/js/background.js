/**
 * background.js
 */
"use strict";
{
  const {contextMenus, i18n, runtime, tabs} = browser;

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

  /* context menu */
  const menus = ["htmlAnchor", "markdownLink", "textLink"];

  /**
   * send context menu clicked data
   * @param {!Object} info - contextMenus.OnClickData
   * @param {!Object} tab - tabs.Tab
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const sendContextMenuClickedData = async (info, tab) => {
    const {id} = tab;
    const {menuItemId} = info;
    const data = {info, tab};
    const input = /\.input$/.test(menuItemId);
    const msg = {data, input, menuItemId};
    return id !== tabs.TAB_ID_NONE && tabs.sendMessage(id, msg) || null;
  };

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

  /**
   * handle message
   * @param {*} msg - message
   * @returns {Object} - Promise.<Array>
   */
  const handleMsg = async msg => {
    const func = [];
    const items = msg && Object.keys(msg);
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case "contextmenu":
            func.push(updateContextMenu(obj));
            break;
          case "DOMContentLoaded":
            func.push(updateContextMenu(obj));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /* listeners */
  contextMenus.onClicked.addListener((info, tab) =>
    sendContextMenuClickedData(info, tab).catch(logError)
  );
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(logError));
  tabs.onActivated.addListener(() => restoreContextMenu().catch(logError));

  /* startup */
  createMenuItems().catch(logError);
}
