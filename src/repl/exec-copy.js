/**
 * exec-copy.js
 */

/* shared */
import { EXEC_COPY } from '../mjs/constant.js';

/* api */
const { offscreen, runtime } = chrome;

/**
 * execute copy
 *
 * @param {object} opt - options
 * @returns {void}
 */
export const execCopy = async opt => {
  await offscreen.createDocument({
    url: 'html/offscreen.html',
    reasons: [offscreen.Reason.CLIPBOARD],
    justification: 'Write to clipboard.'
  });
  await runtime.sendMessage({
    [EXEC_COPY]: opt
  });
};
