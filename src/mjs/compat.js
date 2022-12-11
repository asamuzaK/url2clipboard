/**
 * compat.js
 */

/* shared */
import { OPTIONS_ICON_TOOLBAR, WEBEXT_ID } from './constant.js';

/* api */
const { runtime } = browser;

/**
 * show toolbar icon options
 *
 * @returns {void}
 */
export const showToolbarIconOptions = async () => {
  if (runtime.id !== WEBEXT_ID) {
    const elm = document.getElementById(OPTIONS_ICON_TOOLBAR);
    if (elm) {
      elm.hidden = false;
    }
  }
};
