/**
 * sanitize.js
 */

/* shared */
import '../lib/purify/purify.min.js';
import { sanitizeURL } from '../lib/url/url-sanitizer-wo-dompurify.min.js';

/**
 * sanitize URL
 * @param {string} url - URL
 * @param {object} opt - options
 * @returns {?string} - sanitized URL
 */
export const sanitize = async (url, opt) => {
  const res = await sanitizeURL(url, opt);
  return res || null;
};
