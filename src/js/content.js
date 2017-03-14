/**
 * content.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const HTML_A = "htmlAnchor";
  const INPUT = "userInput";
  const MD_LINK = "markdownLink";
  const NS_HTML = "http://www.w3.org/1999/xhtml";
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
   * copy to clipboard
   * @param {string} text - text to copy
   * @returns {void} - Promise.<void>
   */
  const copyToClipboard = async text => {
    if (isString(text)) {
      const root = document.querySelector("body") || document.documentElement;
      if (root) {
        const {namespaceURI} = root;
        const ns = !/^http:\/\/www\.w3\.org\/1999\/xhtml$/.test(namespaceURI) &&
                   NS_HTML || "";
        const elm = document.createElementNS(ns, "div");
        const range = document.createRange();
        const sel = window.getSelection();
        const arr = [];
        if (!sel.isCollapsed) {
          const l = sel.rangeCount;
          let i = 0;
          while (i < l) {
            arr.push(sel.getRangeAt(i));
            i++;
          }
        }
        elm.textContent = text;
        elm.setAttributeNS(
          ns, "style", "all:unset;position:absolute;width:0;height:0;"
        );
        root.append(elm);
        range.selectNodeContents(elm);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
        if (arr.length) {
          for (const i of arr) {
            sel.addRange(i);
          }
        }
        root.removeChild(elm);
      } else {
        logWarn(`url2clipboard: ${document.contentType} not supported yet.`);
      }
    } else {
      logWarn(`url2clipboard: Expected String but got ${getType(text)}.`);
    }
  };

  /**
   * get selection text
   * @param {Object} info - info
   * @returns {Object} - Promise.<string>
   */
  const getSelectionText = async (info = {}) => {
    let text;
    if (await getType(info) === "Object" && Object.keys(info).length) {
      const {selectionText} = info;
      text = selectionText;
    } else {
      const sel = window.getSelection();
      !sel.isCollapsed && (text = sel.toString());
    }
    return text || "";
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
   * @returns {Object} - Promise.<?string>
   */
  const createHtml = async (content, title, url) =>
    isString(content) && isString(title) && isString(url) &&
    `<a href="${url}" title="${title}">${content.trim()}</a>` || null;

  /**
   * create Markdown Link
   * @param {string} content - content title
   * @param {string} title - document title
   * @param {string} url - document URL
   * @returns {Object} - Promise.<?string>
   */
  const createMarkdown = async (content, title, url) =>
    isString(content) && isString(title) && isString(url) &&
    `[${content.trim()}](${url} "${title}")` || null;

  /**
   * create Text Link
   * @param {string} content - content title
   * @param {string} url - document URL
   * @returns {Object} - Promise.<?string>
   */
  const createText = async (content, url) =>
    isString(content) && isString(url) && `${content.trim()} <${url}>` || null;

  /**
   * extract message
   * @param {*} msg - message
   * @returns {Object} - Promise.<?AsyncFunction>
   */
  const extractMsg = async (msg = {}) => {
    const {data, input, menuItemId} = msg;
    let func;
    if (data) {
      const {info, tab} = data;
      if (tab) {
        const {title, url} = tab;
        const selectionText = await getSelectionText(info);
        const content = input ?
                          await getInput(selectionText || title) :
                          selectionText || title;
        switch (menuItemId) {
          case HTML_A:
          case `${HTML_A}.input`:
            func = createHtml(content, title, url).then(copyToClipboard);
            break;
          case MD_LINK:
          case `${MD_LINK}.input`:
            func = createMarkdown(content, title, url).then(copyToClipboard);
            break;
          case TXT_LINK:
          case `${TXT_LINK}.input`:
            func = createText(content, url).then(copyToClipboard);
            break;
          default:
        }
      }
    }
    return func || null;
  };

  /**
   * send status
   * @param {!Object} evt - Event
   * @returns {Object} - Promise.<?AsincFunction>
   */
  const sendStatus = async evt => {
    const enabled = /^(?:(?:(?:application\/(?:[\w\-.]+\+)?|image\/[\w\-.]+\+)x|text\/(?:ht|x))ml)$/.test(document.contentType);
    const msg = {
      [evt.type]: enabled,
    };
    return enabled && runtime.sendMessage(msg) || null;
  };

  /* listeners */
  runtime.onMessage.addListener(msg => extractMsg(msg).catch(logError));
  document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener(
      "load", evt => sendStatus(evt).catch(logError), false
    );
    window.addEventListener(
      "contextmenu", evt => sendStatus(evt).catch(logError), false
    );
  }, false);
}
