/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const DATA_I18N = "data-i18n";
  const EXT_LOCALE = "extensionLocale";
  const MENU_ELM = "button";

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
   * send menuItemId
   * @param {!Object} evt - Event
   * @returns {void}
   */
  const sendMenuItemId = async evt => {
    const {target} = evt;
    if (target) {
      const menuItemId = target.getAttribute(DATA_I18N);
      if (isString(menuItemId)) {
        await runtime.sendMessage({menuItemId});
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

  document.addEventListener(
    "DOMContentLoaded", () => setupHtml().catch(logError), false
  );
}
