/**
 * edit-content.js
 */

/**
 * edit content
 * @param {string} [content] - content
 * @param {string} [msg] - prompt message
 * @returns {?string} - edited content
 */
export const editContent = (content = '', msg = '') => {
  const editedContent =
    window?.prompt(msg, content.replace(/\s+/g, ' ').trim());
  return editedContent;
};
