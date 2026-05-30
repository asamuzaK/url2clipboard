/**
 * sanitize-attr.js
 */

/* api */
const { DOMPurify } = globalThis;

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'target') {
    data.keepAttr = true;
    data.forceKeepAttr = true;
  }
});

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
    ADD_ATTR: ['target', 'class', 'rel'],
    ALLOWED_TAGS: ['a'],
    KEEP_CONTENT: false
  });
  const match = html.match(/^<a([^>]*)>/);
  if (match && match[1]) {
    return match[1].replace(/\/$/, '').trim();
  }
  return '';
};
