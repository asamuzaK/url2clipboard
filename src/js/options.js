/**
 * options.js
 */
"use strict";
/* api */
const {i18n, storage} = browser;

/* constants */
const DATA_ATTR_I18N = "data-i18n";
const LANG = "extensionLocale";

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
 * set storage
 * @param {Object} obj - object to store
 * @returns {?AsyncFunction} - store object
 */
const setStorage = async obj => obj && storage.local.set(obj) || null;

/**
 * create pref
 * @param {Object} elm - element
 * @returns {Object} - pref data
 */
const createPref = async (elm = {}) => {
  const {id} = elm;
  return id && {
    [id]: {
      id,
      checked: !!elm.checked,
      value: elm.value || "",
    },
  } || null;
};

/**
 * store pref
 * @param {!Object} evt - Event
 * @returns {Promise.<Array>} - results of each handler
 */
const storePref = async evt => {
  const {target} = evt;
  const {name, type} = target;
  const func = [];
  if (type === "radio") {
    const nodes = document.querySelectorAll(`[name=${name}]`);
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        func.push(createPref(node).then(setStorage));
      }
    }
  } else {
    func.push(createPref(target).then(setStorage));
  }
  return Promise.all(func);
};

/* html */
/**
 * add event listener to input elements
 * @returns {void}
 */
const addInputChangeListener = async () => {
  const nodes = document.querySelectorAll("input");
  if (nodes instanceof NodeList) {
    for (const node of nodes) {
      node.addEventListener(
        "change", evt => storePref(evt).catch(logError), false
      );
    }
  }
};

/**
 * localize attribute value
 * @param {Object} elm - element
 * @returns {void}
 */
const localizeAttr = async elm => {
  if (elm && elm.nodeType === Node.ELEMENT_NODE && elm.hasAttributes()) {
    const attrs = {
      alt: "alt",
      ariaLabel: "aria-label",
      href: "href",
      placeholder: "placeholder",
      title: "title",
    };
    const dataAttr = elm.getAttribute(DATA_ATTR_I18N);
    const items = Object.keys(attrs);
    for (const item of items) {
      const attr = attrs[item];
      const [id] = dataAttr.split(/\s*,\s*/);
      elm.hasAttribute(attr) &&
        elm.setAttribute(attr, i18n.getMessage(`${id}_${item}`));
    }
  }
};

/**
 * localize html
 * @returns {void}
 */
const localizeHtml = async () => {
  const lang = i18n.getMessage(LANG);
  if (lang) {
    document.documentElement.setAttribute("lang", lang);
    const nodes = document.querySelectorAll(`[${DATA_ATTR_I18N}]`);
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        const [id, ph] = node.getAttribute(DATA_ATTR_I18N).split(/\s*,\s*/);
        const data = i18n.getMessage(id, ph);
        data && (node.textContent = data);
        node.hasAttributes() && localizeAttr(node);
      }
    }
  }
};

/**
 * set html input value
 * @param {Object} data - storage data
 * @returns {void}
 */
const setHtmlInputValue = async (data = {}) => {
  const {id} = data;
  const elm = id && document.getElementById(id);
  if (elm) {
    switch (elm.type) {
      case "checkbox":
      case "radio":
        elm.checked = !!data.checked;
        break;
      case "text":
        elm.value = isString(data.value) && data.value || "";
        break;
      default:
    }
  }
};

/**
 * set html input values from storage
 * @returns {Promise.<Array>} - results of each handler
 */
const setValuesFromStorage = async () => {
  const func = [];
  const pref = await storage.local.get();
  const items = pref && Object.keys(pref);
  if (items && items.length) {
    for (const item of items) {
      func.push(setHtmlInputValue(pref[item]));
    }
  }
  return Promise.all(func);
};

document.addEventListener("DOMContentLoaded", () => Promise.all([
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
]).catch(logError));
