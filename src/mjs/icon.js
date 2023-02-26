/**
 * icon.js
 */

/* shared */
import { ICON } from './constant.js';

/* api */
const { runtime } = browser;
const action = browser.action ?? browser.browserAction;

/* variables */
export const icon = new Map();

/**
 * set icon
 *
 * @param {string} iconId - icon ID
 * @returns {Promise} - action.setIcon()
 */
export const setIcon = async (iconId = icon.get('id')) => {
  const iconPath = runtime.getURL(ICON);
  const path = (iconId && `${iconPath}${iconId}`) || iconPath;
  icon.set('id', iconId ?? '');
  return action.setIcon({ path });
};
