/**
 * offscreen.js
 */

/* shared */
import { Clip } from './clipboard.js';
import { EXEC_COPY, MIME_HTML, MIME_PLAIN, NOTIFY_COPY } from './constant.js';

/* api */
const { runtime } = browser;

/**
 * execute copy
 *
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
 *
 * @returns {void}
 */
export const closeWindow = () => {
  window.close();
};

/**
 * handle message
 *
 * @param {object} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async msg => {
  const func = [];
  const items = msg && Object.entries(msg);
  if (items) {
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case EXEC_COPY:
          func.push(execCopy(value).then(closeWindow));
          break;
        default:
      }
    }
  }
  return Promise.all(func);
};
