/**
 * edit-content.js
 */
'use strict';

(() => {
  /* constants */
  const USER_INPUT_DEFAULT = 'Edit content text of the link';

  /**
   * is string
   *
   * @param {*} o - object to check
   * @returns {boolean} - result
   */
  const isString = o => typeof o === 'string' || o instanceof String;

  /**
   * get edited content
   *
   * @returns {?string} - content
   */
  const getEditedContent = () => {
    const data = window.editContentData;
    let editedContent;
    if (data) {
      const { content, promptMsg } = data;
      const msg = promptMsg || USER_INPUT_DEFAULT;
      editedContent = window.prompt(msg, content.replace(/\s+/g, ' ').trim());
    }
    return isString(editedContent) ? editedContent : null;
  };

  /* export for tests */
  if (typeof module !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(module, 'exports')) {
    module.exports = {
      getEditedContent,
      isString
    };
  }

  /* execute */
  return getEditedContent();
})();
