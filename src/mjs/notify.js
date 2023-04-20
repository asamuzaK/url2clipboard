/**
 * notify.js
 */

/* shared */
import { createNotification } from './browser.js';
import { isString } from './common.js';
import { EXT_NAME, NOTIFY_COPY } from './constant.js';

/* api */
const { i18n, runtime } = browser;

/**
 * notify on copy
 * @param {string} [label] - label
 * @returns {Promise} - createNotification()
 */
export const notifyOnCopy = label => {
  const message =
    (isString(label) && label &&
     i18n.getMessage(`${NOTIFY_COPY}Msg_format`, label)) ||
    i18n.getMessage(`${NOTIFY_COPY}Msg`);
  const ext = typeof window === 'undefined' ? 'png' : 'svg';
  const msg = {
    message,
    iconUrl: runtime.getURL(`img/icon.${ext}`),
    title: i18n.getMessage(EXT_NAME),
    type: 'basic'
  };
  return createNotification(NOTIFY_COPY, msg);
};
