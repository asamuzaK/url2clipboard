/**
 * content.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const EXEC_COPY = "executeCopy";
  const LINK_BBCODE = "linkBBCode";
  const LINK_HTML = "linkHtml";
  const LINK_MD = "linkMarkdown";
  const LINK_TEXT = "linkText";
  const MOUSE_BUTTON_RIGHT = 2;
  const PAGE_BBCODE = "pageBBCode";
  const PAGE_HTML = "pageHtml";
  const PAGE_MD = "pageMarkdown";
  const PAGE_TEXT = "pageText";
  const USER_INPUT = "userInput";
  const USER_INPUT_DEFAULT = "Input Title";

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
   * send message
   * @param {*} msg - message
   * @returns {?AsyncFunction} - send message to runtime
   */
  const sendMsg = async msg => {
    const func = msg && runtime.sendMessage(msg);
    return func || null;
  };

  /**
   * get anchor element
   * @param {Object} node - element
   * @returns {Object} - anchor element
   */
  const getAnchorElm = async node => {
    const root = document.documentElement;
    let elm;
    if (root) {
      while (node && node.parentNode && node.parentNode !== root) {
        if (node.localName === "a") {
          elm = node;
          break;
        }
        node = node.parentNode;
      }
    }
    return elm || null;
  };

  /* context info */
  const contextInfo = {
    isLink: false,
    content: null,
    title: null,
    url: null,
  };

  /**
   * init context info
   * @returns {Object} - context info
   */
  const initContextInfo = async () => {
    contextInfo.isLink = false;
    contextInfo.content = document.title;
    contextInfo.title = document.title;
    contextInfo.url = document.URL;
    return contextInfo;
  };

  /**
   * create context info
   * @param {Object} node - element
   * @returns {Object} - context info
   */
  const createContextInfo = async node => {
    await initContextInfo();
    if (node.nodeType === Node.ELEMENT_NODE) {
      const anchor = await getAnchorElm(node);
      if (anchor) {
        const {textContent, href, title} = anchor;
        if (href) {
          const content = textContent.trim().replace(/\s+/g, " ");
          const url = href instanceof SVGAnimatedString && href.baseVal || href;
          contextInfo.isLink = true;
          contextInfo.content = content;
          contextInfo.title = title || content;
          contextInfo.url = url;
        }
      }
    }
    return contextInfo;
  };

  /**
   * send status
   * @param {!Object} evt - Event
   * @returns {AsyncFunction} - send message
   */
  const sendStatus = async evt => {
    const {target, type} = evt;
    const enabled = /^(?:(?:(?:application\/(?:[\w\-.]+\+)?|image\/[\w\-.]+\+)x|text\/(?:ht|x))ml)$/.test(document.contentType);
    const msg = {
      [type]: {
        enabled,
      },
    };
    await createContextInfo(target);
    return sendMsg(msg);
  };

  /**
   * copy to clipboard
   * @param {string} text - text to copy
   * @returns {void}
   */
  const copyToClipboard = async text => {
    /**
     * set clipboard data
     * @param {!Object} evt - Event
     * @returns {void}
     */
    const setClipboardData = evt => {
      document.removeEventListener("copy", setClipboardData, true);
      evt.stopImmediatePropagation();
      evt.preventDefault();
      evt.clipboardData.setData("text/plain", text);
    };

    document.addEventListener("copy", setClipboardData, true);
    document.execCommand("copy");
  };

  /**
   * create HTML link
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
   * create Markdown link
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
   * create BBCode link
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
   * create BBCode URL link
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
   * create Text link
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
   * create user input link
   * @param {Object} data - copy data
   * @returns {?string} - text
   */
  const createUserInputLink = async (data = {}) => {
    const {content: contentText, menuItemId, title, url} = data;
    const msg = await i18n.getMessage(USER_INPUT) || USER_INPUT_DEFAULT;
    const content = await window.prompt(msg, contentText || "");
    let text;
    switch (menuItemId) {
      case LINK_BBCODE:
      case PAGE_BBCODE:
        text = await createBBCode(content, url);
        break;
      case LINK_HTML:
      case PAGE_HTML:
        text = await createHtml(content, title, url);
        break;
      case LINK_MD:
      case PAGE_MD:
        text = await createMarkdown(content, title, url);
        break;
      case LINK_TEXT:
      case PAGE_TEXT:
        text = await createText(content, url);
        break;
      case `${LINK_BBCODE}_url`:
      case `${PAGE_BBCODE}_url`:
        text = await createBBCodeUrl(content);
        break;
      default:
    }
    return text || null;
  };

  /**
   * extract copy data
   * @param {Object} data - copy data
   * @returns {Promise.<Array>} - results of each handler
   */
  const extractCopyData = async (data = {}) => {
    const {menuItemId, selectionText} = data;
    const {content: contentText, title, url} = contextInfo;
    const content = (menuItemId === `${LINK_BBCODE}_url` ||
                     menuItemId === `${PAGE_BBCODE}_url`) && url ||
                    selectionText || contentText || title;
    const text = await createUserInputLink({
      content, menuItemId, title, url,
    });
    const func = [];
    text && func.push(copyToClipboard(text));
    func.push(initContextInfo());
    return Promise.all(func);
  };

  /**
   * handle message
   * @param {*} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async (msg = {}) => {
    const items = msg && Object.keys(msg);
    const func = [];
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case EXEC_COPY:
            func.push(extractCopyData(obj));
            break;
          case CONTEXT_INFO_GET:
            func.push(sendMsg({
              [CONTEXT_INFO]: contextInfo,
            }));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /* listeners */
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(logError));
  document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener(
      "load", evt => sendStatus(evt).catch(logError), false
    );
    window.addEventListener(
      "mousedown",
      evt => evt.button === MOUSE_BUTTON_RIGHT &&
               sendStatus(evt).catch(logError),
      true
    );
    window.addEventListener(
      "keydown",
      evt => (evt.altKey && evt.shiftKey && evt.key === "C" ||
              evt.ShiftKey && evt.key === "F10" ||
              evt.key === "ContextMenu") &&
               sendStatus(evt).catch(logError),
      true
    );
  }, false);
}
