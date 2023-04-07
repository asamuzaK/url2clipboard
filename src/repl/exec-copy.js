/**
 * exec-copy.js
 */

/* shared */
import { Clip } from '../mjs/clipboard.js';
import { notifyOnCopy } from '../mjs/notify.js';
import { MIME_HTML, MIME_PLAIN } from '../mjs/constant.js';

/**
 * execute copy
 *
 * @param {object} opt - options
 * @returns {void}
 */
export const execCopy = async (opt = {}) => {
  const { formatTitle, mimeType, notify, text } = opt;
  console.log(typeof navigator.clipboard);
  if (typeof navigator.clipboard !== 'undefined' &&
      (mimeType === MIME_HTML || mimeType === MIME_PLAIN)) {
    await new Clip(text, mimeType).copy();
    if (notify) {
      await notifyOnCopy(formatTitle);
    }
  }
};
