/**
 * content.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

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
   * copy to clipboard
   * @param {str} text - text
   * @returns {void} - Promise.<void>
   */
  const copyToClipboard = async text => {
    if (await isString(text)) {
      const body = document.querySelector("body");
      const elm = document.createElement("div");
      const range = document.createRange();
      const selection = window.getSelection();
      elm.textContent = text;
      elm.style.all = "unset";
      elm.style.appearance = "none";
      elm.style.width = "0";
      elm.style.height = "0";
      elm.style.position = "absolute";
      body.append(elm);
      range.selectNodeContents(elm);
      selection.addRange(range);
      document.execCommand("copy");
      selection.removeRange(selection.getRangeAt(selection.rangeCount - 1));
      body.removeChild(elm);
    }
  };

  /**
   * get user input
   * @param {string} value - value
   * @returns {string} - input value
   */
  const getInput = async (value = "") => {
    const msg = await i18n.getMessage("userInput");
    value = await window.prompt(msg, value);
    return value;
  };

  /**
   * create HTML Anchor
   * @param {string} content - content
   * @param {string} title - title
   * @param {string} url - title
   * @returns {Object} - Promise.<?string>
   */
  const createHtml = async (content, title, url) =>
    await isString(content) && await isString(title) && await isString(url) &&
    `<a href="${url}" title="${title}">${content}</a>` || null;

  /**
   * create Markdown
   * @param {string} content - content
   * @param {string} title - title
   * @param {string} url - title
   * @returns {Object} - Promise.<string>
   */
  const createMarkDown = async (content, title, url) =>
    await isString(content) && await isString(title) && await isString(url) &&
    `[${content}](${url} "${title}")` || null;

  /**
   * create Text
   * @param {string} content - content
   * @param {string} url - title
   * @returns {Object} - Promise.<?string>
   */
  const createText = async (content, url) =>
    await isString(content) && await isString(url) &&
    `${content} <${url}>` || null;

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
      if (info && tab) {
        const {selectionText} = info;
        const {title, url} = tab;
        const content = input && await getInput(selectionText || title) ||
                        selectionText || title;
        switch (menuItemId) {
          case "htmlAnchor":
          case "htmlAnchor.input":
            func = createHtml(content, title, url).then(copyToClipboard);
            break;
          case "markdownLink":
          case "markdownLink.input":
            func = createMarkdown(content, title, url).then(copyToClipboard);
            break;
          case "textLink":
          case "textLink.input":
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
   * @param {!Object} evt - event
   * @returns {Object} - Promise.<AsincFunction>
   */
  const sendStatus = async evt => {
    const msg = {
      [evt.type]: true,
    };
    return runtime.sendMessage(msg);
  };

  /* listeners */
  runtime.onMessage.addListener(msg => extractMsg(msg).catch(logError));
  document.addEventListener(
    "DOMContentLoaded", evt => sendStatus(evt).catch(logError), false
  );
  window.addEventListener(
    "contextmenu", evt => sendStatus(evt).catch(logError), false
  );
}
