/**
 * sanitize-attr.js
 */

/* api */
const { DOMPurify } = globalThis;

DOMPurify.addHook('afterSanitizeAttributes', node => {
  node.removeAttribute('title');
});

/**
 * sanitize attributes
 * @param {string} attr - attributes
 * @returns {string} - result
 */
export const sanitizeAttributes = (attr = '') => {
  const html = DOMPurify.sanitize(`<a ${attr}></a>`, {
    ADD_ATTR: ['target'],
    ALLOWED_TAGS: ['a'],
    KEEP_CONTENT: false
  });
  [attr] = html.replace('<a', '').replace('></a>', '').split('<a');
  return attr.trim();
};
