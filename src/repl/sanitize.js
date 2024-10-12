/**
 * sanitize.js
 */

/* shared */
import {
  sanitizeURL as sanitizeUrl
} from '../lib/url/url-sanitizer-wo-dompurify.min.js';
import { isString } from '../mjs/common.js';
import { SANITIZE_ATTR, SANITIZE_URL } from '../mjs/constant.js';

/* api */
const { offscreen, runtime } = chrome;

/**
 * sanitize attributes
 * @param {string} attr - attributes
 * @returns {Promise.<string>} - sanitized attributes
 */
export const sanitizeAttributes = async attr => {
  let res;
  if (attr && isString(attr)) {
    await offscreen.createDocument({
      justification: 'Sanitize attributes',
      reasons: [offscreen.Reason.DOM_PARSER],
      url: 'html/offscreen.html'
    });
    [res] = await runtime.sendMessage({
      [SANITIZE_ATTR]: attr
    });
    await offscreen.closeDocument();
  }
  return res || '';
};

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
        [SANITIZE_URL]: [
          url,
          opt
        ]
      });
      await offscreen.closeDocument();
    } else {
      res = await sanitizeUrl(url, opt);
    }
  }
  return res || null;
};
