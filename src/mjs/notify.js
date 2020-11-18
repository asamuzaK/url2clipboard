/**
 * notify.js
 */

/* shared */
import { isString } from './common.js';
import { createNotification } from './browser.js';
import { ICON, NOTIFY_COPY } from './constant.js';

/* api */
const { i18n, runtime } = browser;

/**
 * notify on copy
 *
 * @param {string} label - label
 * @returns {Function} - createNotification()
 */
export const notifyOnCopy = async label => {
  const message =
    (isString(label) && label &&
     i18n.getMessage('notifyOnCopyMsg_format', label)) ||
    i18n.getMessage('notifyOnCopyMsg');
  const msg = {
    message,
    iconUrl: runtime.getURL(ICON),
    title: i18n.getMessage('extensionName'),
    type: 'basic'
  };
  return createNotification(NOTIFY_COPY, msg);
};
