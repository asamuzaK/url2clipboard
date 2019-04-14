/**
 * options-main.js
 */

import {
  isObjectNotEmpty, isString, throwErr,
} from "./common.js";
import {
  getStorage, setStorage, removePermission, requestPermission,
} from "./browser.js";
import {
  NOTIFY_COPY,
} from "./constant.js";

/**
 * create pref
 * @param {Object} elm - element
 * @returns {Object} - pref data
 */
export const createPref = async (elm = {}) => {
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
export const storePref = async evt => {
  const {target} = evt;
  const {checked, id, name, type} = target;
  const func = [];
  if (type === "radio") {
    const nodes = document.querySelectorAll(`[name=${name}]`);
    for (const node of nodes) {
      func.push(createPref(node).then(setStorage));
    }
  } else {
    switch (id) {
      case NOTIFY_COPY:
        if (checked) {
          target.checked = await requestPermission(["notifications"]);
        } else {
          await removePermission(["notifications"]);
        }
        func.push(createPref(target).then(setStorage));
        break;
      default:
        func.push(createPref(target).then(setStorage));
    }
  }
  return Promise.all(func);
};

/* html */
/**
 * handle input change
 * @param {!Object} evt - Event
 * @returns {AsyncFunction} - storePref()
 */
export const handleInputChange = evt => storePref(evt).catch(throwErr);

/**
 * add event listener to input elements
 * @returns {void}
 */
export const addInputChangeListener = async () => {
  const nodes = document.querySelectorAll("input");
  for (const node of nodes) {
    node.addEventListener("change", handleInputChange);
  }
};

/**
 * set html input value
 * @param {Object} data - storage data
 * @returns {void}
 */
export const setHtmlInputValue = async (data = {}) => {
  const {checked, id, value} = data;
  const elm = id && document.getElementById(id);
  if (elm) {
    const {type} = elm;
    switch (type) {
      case "checkbox":
      case "radio":
        elm.checked = !!checked;
        break;
      case "text":
      case "url":
        elm.value = isString(value) && value || "";
        break;
      default:
    }
  }
};

/**
 * set html input values from storage
 * @returns {Promise.<Array>} - results of each handler
 */
export const setValuesFromStorage = async () => {
  const func = [];
  const pref = await getStorage();
  if (isObjectNotEmpty(pref)) {
    const items = Object.values(pref);
    for (const item of items) {
      if (isObjectNotEmpty(item)) {
        func.push(setHtmlInputValue(item));
      }
    }
  }
  return Promise.all(func);
};
