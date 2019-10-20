/**
 * content.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const CONTENT_EDITED = "editedContent";
  const CONTENT_EDITED_GET = "getEditedContent";
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const MOUSE_BUTTON_RIGHT = 2;
  const NS_HTML = "http://www.w3.org/1999/xhtml";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;
  const USER_INPUT = "userInput";
  const USER_INPUT_DEFAULT = "Edit content text of the link";

  /**
   * throw error
   * @param {!Object} e - Error
   * @throws
   */
  const throwErr = e => {
    throw e;
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
   * send message
   * @param {*} msg - message
   * @returns {?AsyncFunction} - send message to runtime
   */
  const sendMsg = async msg => {
    let func;
    if (msg) {
      func = runtime.sendMessage(msg);
    }
    return func || null;
  };

  /**
   * get active element
   * @returns {Object} - active element
   */
  const getActiveElm = async () => {
    const sel = window.getSelection();
    const {anchorNode, focusNode, isCollapsed, rangeCount} = sel;
    let elm;
    if (!isCollapsed) {
      if (anchorNode === focusNode) {
        if (anchorNode.nodeType === Node.ELEMENT_NODE) {
          elm = anchorNode;
        } else {
          const root = document.documentElement;
          let parent = anchorNode.parentNode;
          while (parent && parent.parentNode && parent.parentNode !== root) {
            if (parent.nodeType === Node.ELEMENT_NODE) {
              elm = parent;
              break;
            }
            parent = parent.parentNode;
          }
        }
      } else if (rangeCount === 1) {
        const range = sel.getRangeAt(rangeCount - 1);
        if (range) {
          elm = range.commonAncestorContainer;
        }
      }
    }
    return elm || document.activeElement;
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
    selectionText: "",
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
    contextInfo.selectionText = "";
    contextInfo.url = null;
    contextInfo.canonicalUrl = null;
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
      const canonical = document.querySelector("link[rel=canonical][href]");
      if (anchor) {
        const {textContent, href, title} = anchor;
        if (href) {
          const content = textContent.replace(/\s+/g, " ").trim();
          const url = href instanceof SVGAnimatedString && href.baseVal || href;
          contextInfo.isLink = true;
          contextInfo.content = content;
          contextInfo.title = title || content;
          contextInfo.url = url;
        }
      }
      if (canonical) {
        const {origin} = new URL(document.URL);
        const url = new URL(canonical.getAttribute("href"), origin);
        if (url) {
          contextInfo.canonicalUrl = url.href;
        }
      }
      contextInfo.selectionText = window.getSelection().toString();
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
    const enabled = document.documentElement.namespaceURI === NS_HTML;
    const info = await createContextInfo(target);
    const msg = {
      [type]: {
        enabled,
        contextInfo: info,
      },
    };
    return sendMsg(msg);
  };

  /**
   * send context info
   * @param {*} data - data
   * @returns {AsyncFunction} - send message
   */
  const sendContextInfo = async data => {
    const elm = await getActiveElm();
    const info = await createContextInfo(elm);
    const msg = {
      [CONTEXT_INFO]: {
        data,
        contextInfo: info,
      },
    };
    return sendMsg(msg);
  };

  /**
   * edit content
   * @param {string} content - content to edit
   * @param {string} label - format label
   * @returns {?string} - edited content
   */
  const editContent = async (content = "", label = "") => {
    if (!isString(content)) {
      throw new TypeError(`Expected String but got ${getType(content)}.`);
    }
    if (!isString(label)) {
      throw new TypeError(`Expected String but got ${getType(label)}.`);
    }
    const msg = label && await i18n.getMessage(USER_INPUT, label) ||
                USER_INPUT_DEFAULT;
    content = window.prompt(msg, content.replace(/\s+/g, " ").trim());
    return content;
  };

  /**
   * send edited content
   * @param {string} data - data
   * @returns {AsyncFunction} - sendMsg()
   */
  const sendEditedContent = async (data = {}) => {
    const {
      content: contentText, formatId, formatTitle, mimeType, promptContent,
      template, title, url,
    } = data;
    let func;
    if (promptContent) {
      const content = await editContent(contentText, formatTitle || formatId) ||
                      "";
      func = sendMsg({
        [CONTENT_EDITED]: {
          content, formatId, formatTitle, mimeType, template, title, url,
        },
      });
    }
    return func || null;
  };

  /**
   * handle message
   * @param {*} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async (msg = {}) => {
    const items = msg && Object.entries(msg);
    const func = [];
    if (items && items.length) {
      for (const [key, value] of items) {
        switch (key) {
          case CONTENT_EDITED_GET:
            if (value) {
              func.push(sendEditedContent(value));
            }
            break;
          case CONTEXT_INFO_GET:
            if (value) {
              func.push(sendContextInfo(value));
            }
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * handle key / mouse event
   * @param {!Object} evt - Event
   * @returns {?AsyncFunction} - send status
   */
  const handleKeyMouseEvt = evt => {
    const {button, key, shiftKey, type} = evt;
    let func;
    switch (type) {
      case "keydown":
        if (shiftKey && key === "F10" || key === "ContextMenu") {
          func = sendStatus(evt).catch(throwErr);
        }
        break;
      case "mousedown":
        if (button === MOUSE_BUTTON_RIGHT) {
          func = sendStatus(evt).catch(throwErr);
        }
        break;
      default:
    }
    return func || null;
  };

  /* listeners */
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(throwErr));

  window.addEventListener("load", evt => sendStatus(evt).catch(throwErr));
  window.addEventListener("keydown", handleKeyMouseEvt, true);
  window.addEventListener("mousedown", handleKeyMouseEvt, true);
}
