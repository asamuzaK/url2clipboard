/**
 * icon.js
 */

/* shared */
import { EXT_NAME, ICON, ICON_CONTEXT_ID, WEBEXT_ID } from './constant.js';

/* api */
const { browserAction, i18n, runtime } = browser;

/* variables */
export const icon = new Map();

/**
 * set icon
 *
 * @param {string} iconId - icon ID
 * @returns {Promise.<Array>} - results of each handler
 */
export const setIcon = async (iconId = icon.get('id')) => {
  const name = i18n.getMessage(EXT_NAME);
  const iconPath = runtime.getURL(ICON);
  const path = (iconId && `${iconPath}${iconId}`) || iconPath;
  const title = name;
  icon.set('id', iconId ?? '');
  return Promise.all([
    browserAction.setIcon({ path }),
    browserAction.setTitle({ title })
  ]);
};

/**
 * set default icon
 *
 * @returns {?Function} - setIcon()
 */
export const setDefaultIcon = async () => {
  let func;
  if (!icon.get('id') && runtime.id === WEBEXT_ID) {
    icon.set('id', ICON_CONTEXT_ID);
    func = setIcon(ICON_CONTEXT_ID);
  }
  return func || null;
};
