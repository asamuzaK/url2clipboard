/**
 * offscreen-main.js
 */

/* shared */
import { sanitizeURL } from '../lib/url/url-sanitizer-wo-dompurify.min.js';
import { Clip } from './clipboard.js';
import { throwErr } from './common.js';
import { editContent } from './edit-content.js';
import { sanitizeAttributes } from './sanitize-attr.js';
import {
  EXEC_COPY, MIME_HTML, MIME_PLAIN, NOTIFY_COPY, PROMPT, SANITIZE_ATTR,
  SANITIZE_URL
} from './constant.js';

/* api */
const { runtime } = browser;

/**
 * execute copy
 * @param {object} opt - options
 * @returns {?Promise} - sendMessage()
 */
export const execCopy = async (opt = {}) => {
  const { formatTitle, mimeType, notify, text } = opt;
  let func;
  if (mimeType === MIME_HTML || mimeType === MIME_PLAIN) {
    await new Clip(text, mimeType).copy();
    if (notify) {
      func = runtime.sendMessage({
        [NOTIFY_COPY]: formatTitle
      });
    }
  }
  return func || null;
};

/**
 * close window
 * @returns {void}
 */
export const closeWindow = () => {
  window.close();
};

/**
 * handle message
 * @param {object} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = msg => {
  const func = [];
  const items = msg && Object.entries(msg);
  if (items) {
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case EXEC_COPY: {
          func.push(execCopy(value).then(closeWindow));
          break;
        }
        case PROMPT: {
          func.push(editContent(...value));
          break;
        }
        case SANITIZE_ATTR: {
          func.push(sanitizeAttributes(value));
          break;
        }
        case SANITIZE_URL: {
          func.push(sanitizeURL(...value));
          break;
        }
        default:
      }
    }
  }
  return Promise.all(func).catch(throwErr);
};
