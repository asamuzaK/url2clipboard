/**
 * options.js
 */

import {isString, throwErr} from "./common.js";
import {getStorage, setStorage} from "./browser.js";
import {localizeHtml} from "./localize.js";

/**
 * create pref
 * @param {Object} elm - element
 * @returns {Object} - pref data
 */
const createPref = async (elm = {}) => {
  const {dataset, id} = elm;
  return id && {
    [id]: {
      id,
      checked: !!elm.checked,
      value: elm.value || "",
      subItemOf: dataset && dataset.subItemOf || null,
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
      node.addEventListener("change", evt => storePref(evt).catch(throwErr));
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
  const pref = await getStorage();
  const items = pref && Object.keys(pref);
  if (items && items.length) {
    for (const item of items) {
      func.push(setHtmlInputValue(pref[item]));
    }
  }
  return Promise.all(func);
};

/* startup */
Promise.all([
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
]).catch(throwErr);
