/**
 * sanitize.js
 */

/* shared */
import {
  sanitizeURL as sanitize
} from '../lib/url/url-sanitizer-wo-dompurify.min.js';
import { isString } from '../mjs/common.js';
import { URL_SANITIZE } from '../mjs/constant.js';

/* api */
const { offscreen, runtime } = chrome;

/**
 * sanitize URL
 * @param {string} url - URL
 * @param {object} opt - options
 * @returns {Promise.<?string>} - sanitized URL
 */
export const sanitizeURL = async (url, opt) => {
  let res;
  if (url && isString(url)) {
    const { protocol } = new URL(url);
    if (protocol === 'data:') {
      await offscreen.createDocument({
        justification: 'Sanitize URL',
        reasons: [offscreen.Reason.DOM_PARSER],
        url: 'html/offscreen.html'
      });
      [res] = await runtime.sendMessage({
        [URL_SANITIZE]: [
          url,
          opt
        ]
      });
      await offscreen.closeDocument();
    } else {
      res = await sanitize(url, opt);
    }
  }
  return res || null;
};
