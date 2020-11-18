/**
 * compat.js
 */

/* shared */
import { isString } from './common.js';
import { ICON_AUTO, WEBEXT_ID } from './constant.js';

/* api */
const { runtime } = browser;

/**
 * disable input
 *
 * @param {string} id - ID
 * @returns {void}
 */
export const disableInput = async id => {
  if (isString(id)) {
    const elm = document.getElementById(id);
    if (elm) {
      elm.disabled = true;
    }
  }
};

/**
 * disable incompatible inputs
 *
 * @returns {?Function} - disableInput()
 */
export const disableIncompatibleInputs = async () => {
  let func;
  if (runtime.id !== WEBEXT_ID) {
    func = disableInput(ICON_AUTO);
  }
  return func || null;
};
