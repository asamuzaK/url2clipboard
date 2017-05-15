/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime, tabs} = browser;

  /* constants */
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const DATA_I18N = "data-i18n";
  const EXT_LOCALE = "extensionLocale";
  const LINK_CONTENT = "copyLinkContent";
  const MENU_ELM = "button";
  const MENU_ITEM_ID = "menuItemId";

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
   * send menuItemId
   * @param {!Object} evt - Event
   * @returns {void}
   */
  const sendMenuItemId = async evt => {
    const {target} = evt;
    if (target) {
      const {id} = target;
      if (id) {
        await runtime.sendMessage({
          [MENU_ITEM_ID]: id,
        });
        window.close();
      }
    }
  };

  /**
   * localize node
   * @param {Object} node - Element
   * @returns {void}
   */
  const localizeNode = async node => {
    const data = await i18n.getMessage(node.getAttribute(DATA_I18N));
    data && node.nodeType === Node.ELEMENT_NODE && (node.textContent = data);
    return node;
  };

  /**
   * setup html
   * @returns {Promise.<Array>} - results of each handler
   */
  const setupHtml = async () => {
    const lang = await i18n.getMessage(EXT_LOCALE);
    const nodes = document.querySelectorAll(`[${DATA_I18N}]`);
    const func = [];
    lang && document.documentElement.setAttribute("lang", lang);
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        lang && func.push(localizeNode(node));
        node.nodeType === Node.ELEMENT_NODE && node.localName === MENU_ELM &&
          node.addEventListener(
            "click", evt => sendMenuItemId(evt).catch(logError), false
          );
      }
    }
    return Promise.all(func);
  };

  /**
   * update menu
   * @param {Object} data - context data;
   */
  const updateMenu = async (data = {}) => {
    const {isLink} = data;
    const buttons = document.querySelectorAll(`#${LINK_CONTENT} button`);
    for (const button of buttons) {
      const attr = "disabled";
      if (isLink) {
        button.removeAttribute(attr);
      } else {
        button.setAttribute(attr, attr);
      }
    }
  };

  /**
   * send get context info message
   * @returns {AsyncFunction} - send message
   */
  const getContextInfo = async () => {
    const tab = await getActiveTab();
    const {id} = tab;
    let func;
    if (Number.isInteger(id) && id !== tabs.TAB_ID_NONE) {
      const msg = {
        [CONTEXT_INFO_GET]: true,
      };
      func = tabs.sendMessage(id, msg);
    }
    return func || null;
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
        item === CONTEXT_INFO && func.push(updateMenu(obj));
      }
    }
    return Promise.all(func);
  };

  document.addEventListener(
    "DOMContentLoaded", () => Promise.all([
      setupHtml(),
      getContextInfo(),
    ]).catch(logError), false
  );

  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );
}
