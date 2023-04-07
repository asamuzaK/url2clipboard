/**
 * notify.js
 */

/* shared */
import { createNotification } from './browser.js';
import { isString } from './common.js';
import { NOTIFY_COPY } from './constant.js';

/* api */
const { i18n, runtime } = browser;

/**
 * notify on copy
 *
 * @param {string} [label] - label
 * @returns {Promise} - createNotification()
 */
export const notifyOnCopy = label => {
  const message =
    (isString(label) && label &&
     i18n.getMessage('notifyOnCopyMsg_format', label)) ||
    i18n.getMessage('notifyOnCopyMsg');
  const ext = typeof window === 'undefined' ? 'png' : 'svg';
  const msg = {
    message,
    iconUrl: runtime.getURL(`img/icon.${ext}`),
    title: i18n.getMessage('extensionName'),
    type: 'basic'
  };
  return createNotification(NOTIFY_COPY, msg);
};
