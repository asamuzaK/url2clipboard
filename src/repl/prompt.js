/**
 * prompt.js
 */

/* shared */
import { PROMPT, USER_INPUT } from '../mjs/constant.js';

/* api */
const { i18n, offscreen, runtime, tabs } = chrome;

/* constants */
const { TAB_ID_NONE } = tabs;

/**
 * prompt content
 * @param {object} opt - options
 * @returns {?string} - edited content
 */
export const promptContent = async (opt = {}) => {
  const { content, formatTitle, tabId } = opt;
  let res;
  if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
    const promptMsg = i18n.getMessage(USER_INPUT, formatTitle ?? '')
      .replace(/\s+/g, ' ').trim();
    await offscreen.createDocument({
      justification: 'Edit content of the link',
      reasons: [offscreen.Reason.DOM_PARSER],
      url: 'html/offscreen.html'
    });
    [res] = await runtime.sendMessage({
      [PROMPT]: [
        content,
        promptMsg
      ]
    });
    await offscreen.closeDocument();
  }
  return res || null;
};
