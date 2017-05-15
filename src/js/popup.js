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
  const ELM_MENU = "button";
  const EXT_LOCALE = "extensionLocale";
  const LINK_CONTENT = "copyLinkContent";
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
   * add listener to menu
   * @returns {void}
   */
  const addListenerToMenu = async () => {
    const nodes = document.querySelectorAll(ELM_MENU);
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        node.addEventListener(
          "click", evt => sendMenuItemId(evt).catch(logError), false
        );
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
   * localize html
   * @returns {Promise.<Array>} - results of each handler
   */
  const localizeHtml = async () => {
    const lang = await i18n.getMessage(EXT_LOCALE);
    const func = [];
    if (lang) {
      const nodes = document.querySelectorAll(`[${DATA_I18N}]`);
      document.documentElement.setAttribute("lang", lang);
      if (nodes instanceof NodeList) {
        for (const node of nodes) {
          func.push(localizeNode(node));
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * update menu
   * @param {Object} data - context data;
   * @returns {void}
   */
  const updateMenu = async (data = {}) => {
    const {info} = data;
    console.log(data);
    if (info) {
      const {isLink} = info;
      const nodes = document.querySelectorAll(`#${LINK_CONTENT} ${ELM_MENU}`);
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
   * @returns {AsyncFunction} - send message
   */
  const requestContextInfo = async () => {
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

  document.addEventListener(
    "DOMContentLoaded", () => Promise.all([
      localizeHtml(),
      addListenerToMenu(),
      requestContextInfo(),
    ]).catch(logError), false
  );

  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );
}
