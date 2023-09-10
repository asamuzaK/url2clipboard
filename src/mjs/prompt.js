/**
 * prompt.js
 */

/* shared */
import { executeScriptToTab } from './browser.js';
import { isObjectNotEmpty, logErr } from './common.js';
import { editContent } from './edit-content.js';
import { USER_INPUT } from './constant.js';

/* api */
const { i18n, tabs } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;

/**
 * prompt content
 * @param {object} opt - options
 * @returns {?string} - edited content
 */
export const promptContent = async (opt = {}) => {
  const { content, formatTitle, tabId } = opt;
  let editedContent;
  if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
    const promptMsg = i18n.getMessage(USER_INPUT, formatTitle ?? '')
      .replace(/\s+/g, ' ').trim();
    const arr = await executeScriptToTab({
      args: [content, promptMsg],
      func: editContent,
      target: {
        tabId
      }
    }).catch(logErr);
    if (Array.isArray(arr)) {
      const [res] = arr;
      if (isObjectNotEmpty(res)) {
        if (Object.prototype.hasOwnProperty.call(res, 'error')) {
          throw res.error;
        }
        const { result } = res;
        editedContent = result;
      }
    }
  }
  return editedContent || null;
};
