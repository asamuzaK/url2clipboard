/**
 * options-main.js
 */

/* shared */
import {
  getStorage, removePermission, requestPermission, setStorage
} from './browser.js';
import { isObjectNotEmpty, isString, throwErr } from './common.js';
import {
  ATTR_HTML_HYPER, ATTR_HTML_PLAIN, ATTR_SAVE_HTML_HYPER, ATTR_SAVE_HTML_PLAIN,
  ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT, ICON_RADIO, ICON_WHITE,
  NOTIFY_COPY
} from './constant.js';

/**
 * create pref
 * @param {object} [elm] - element
 * @returns {Promise.<object>} - pref data
 */
export const createPref = async (elm = {}) => {
  const { checked, dataset, id, name } = elm;
  let data;
  if (id) {
    let value;
    if (name === ICON_RADIO) {
      const size = window.devicePixelRatio > 1 ? '32' : '16';
      let color;
      switch (id) {
        case ICON_COLOR:
          color = 'color';
          break;
        case ICON_DARK:
          color = 'dark';
          break;
        case ICON_LIGHT:
          color = 'light';
          break;
        case ICON_WHITE:
          color = 'white';
          break;
        case ICON_BLACK:
        default:
          color = 'black';
      }
      value = `icon-${color}-${size}.png`;
    } else {
      value = elm.value || '';
    }
    data = {
      [id]: {
        id,
        value,
        checked: !!checked,
        subItemOf: dataset?.subItemOf || null
      }
    };
  }
  return data || null;
};

/**
 * store pref
 * @param {!object} evt - Event
 * @returns {Promise.<Array>} - results of each handler
 */
export const storePref = async evt => {
  const { target } = evt;
  const { checked, id, name, type } = target;
  const func = [];
  if (type === 'radio') {
    const nodes = document.querySelectorAll(`[name=${name}]`);
    for (const node of nodes) {
      func.push(createPref(node).then(setStorage));
    }
  } else {
    switch (id) {
      case NOTIFY_COPY:
        if (checked) {
          target.checked = await requestPermission(['notifications']);
        } else {
          await removePermission(['notifications']);
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
 * handle save
 * @param {!object} evt - Event
 * @returns {?Promise} - storePref() promise chain
 */
export const handleSave = evt => {
  const { target: evtTarget } = evt;
  let func;
  if (evtTarget.id === ATTR_SAVE_HTML_HYPER) {
    const target = document.getElementById(ATTR_HTML_HYPER);
    if (target) {
      func = storePref({ target }).catch(throwErr);
    }
  } else if (evtTarget.id === ATTR_SAVE_HTML_PLAIN) {
    const target = document.getElementById(ATTR_HTML_PLAIN);
    if (target) {
      func = storePref({ target }).catch(throwErr);
    }
  }
  return func || null;
};

/**
 * add event listener to button elements
 * @returns {Promise.<void>} - void
 */
export const addButtonClickListener = async () => {
  const nodes = document.querySelectorAll('button[type=button]');
  for (const node of nodes) {
    node.addEventListener('click', handleSave);
  }
};

/**
 * handle input change
 * @param {!object} evt - Event
 * @returns {Promise} - storePref() promise chain
 */
export const handleInputChange = evt => storePref(evt).catch(throwErr);

/**
 * add event listener to input elements
 * @returns {Promise.<void>} - void
 */
export const addInputChangeListener = async () => {
  const nodes = document.querySelectorAll('input');
  for (const node of nodes) {
    const { type } = node;
    if (type !== 'text') {
      node.addEventListener('change', handleInputChange);
    }
  }
};

/**
 * set html input value
 * @param {object} [data] - storage data
 * @returns {Promise.<void>} - void
 */
export const setHtmlInputValue = async (data = {}) => {
  const { checked, id, value } = data;
  const elm = id && document.getElementById(id);
  if (elm) {
    const { type } = elm;
    switch (type) {
      case 'checkbox':
      case 'radio':
        elm.checked = !!checked;
        break;
      case 'text':
      case 'url':
        elm.value = isString(value) ? value : '';
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
