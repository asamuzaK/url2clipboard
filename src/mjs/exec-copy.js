/**
 * exec-copy.js
 */

/* shared */
import { Clip } from './clipboard.js';
import { notifyOnCopy } from './notify.js';
import { MIME_HTML, MIME_PLAIN } from './constant.js';

/**
 * execute copy
 * @param {object} opt - options
 * @returns {Promise.<void>} - void
 */
export const execCopy = async (opt = {}) => {
  const { formatTitle, mimeType, notify, text } = opt;
  if (typeof navigator.clipboard !== 'undefined' &&
      (mimeType === MIME_HTML || mimeType === MIME_PLAIN)) {
    await new Clip(text, mimeType).copy();
    if (notify) {
      await notifyOnCopy(formatTitle);
    }
  }
};
