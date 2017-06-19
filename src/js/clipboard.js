/**
 * clipboard.js
 */
"use strict";
/* api */
const {i18n} = browser;

/* constants */
const TYPE_FROM = 8;
const TYPE_TO = -1;
const USER_INPUT = "userInput";
const USER_INPUT_DEFAULT = "Input Title";

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
 * @param {Object} data - copy data
 * @returns {void}
 */
const copyToClipboard = async (data = {}) => {
  const {text} = data;
  if (!isString(text)) {
    throw new TypeError(`Expected String but got ${getType(text)}.`);
  }
  const clipText = text.trim() || "";
  if (clipText) {
    /**
     * set clipboard data
     * @param {!Object} evt - Event
     * @returns {void}
     */
    const setClipboardData = evt => {
      document.removeEventListener("copy", setClipboardData, true);
      evt.stopImmediatePropagation();
      evt.preventDefault();
      evt.clipboardData.setData("text/plain", clipText);
    };

    if (typeof document.execCommand === "function") {
      document.addEventListener("copy", setClipboardData, true);
      document.execCommand("copy");
    } else {
      // FIXME: throw?
    }
  }
};

/**
 * edit content
 * @param {Object} data - content data
 * @returns {?string} - edited content
 */
const editContent = async (data ={}) => {
  const {content} = data;
  if (!isString(content)) {
    throw new TypeError(`Expected String but got ${getType(content)}.`);
  }
  const msg = await i18n.getMessage(USER_INPUT) || USER_INPUT_DEFAULT;
  content = window.prompt(msg, content);
  return content;
};
