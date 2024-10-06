/**
 * exec-copy.js
 */

/* shared */
import { EXEC_COPY } from '../mjs/constant.js';

/* api */
const { offscreen, runtime } = chrome;

/**
 * execute copy
 * @param {object} opt - options
 * @returns {Promise.<void>} - void
 */
export const execCopy = async opt => {
  await offscreen.createDocument({
    justification: 'Write to clipboard.',
    reasons: [offscreen.Reason.CLIPBOARD],
    url: 'html/offscreen.html'
  });
  await runtime.sendMessage({
    [EXEC_COPY]: opt
  });
};
