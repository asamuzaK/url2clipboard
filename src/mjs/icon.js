/**
 * icon.js
 */

/* shared */
import { isString } from './common.js';

/* api */
const { runtime } = browser;
const action = browser.action ?? browser.browserAction;

/**
 * set icon
 *
 * @param {string} icon - icon
 * @returns {Promise} - action.setIcon()
 */
export const setIcon = async icon => {
  let func;
  if (isString(icon) && /^icon-[a-z]+-(?:16|32).png$/.test(icon)) {
    const path = runtime.getURL(`img/${icon}`);
    func = action.setIcon({ path });
  }
  return func || null;
};
