/**
 * content.js
 */
"use strict";
{
  /* api */
  const {runtime} = browser;

  /* constants */
  const CLIP_TEXT = "clipboardText";
  const NS_HTML = "http://www.w3.org/1999/xhtml";
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
   * handle message
   * @param {*} msg - message
   * @returns {Object} - Promise.<Array>
   */
  const handleMsg = async (msg = {}) => {
    const items = msg && Object.keys(msg);
    const func = [];
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case CLIP_TEXT:
            func.push(copyToClipboard(obj));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
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
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(logError));
  document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener(
      "load", evt => sendStatus(evt).catch(logError), false
    );
    window.addEventListener(
      "contextmenu", evt => sendStatus(evt).catch(logError), false
    );
  }, false);
}
