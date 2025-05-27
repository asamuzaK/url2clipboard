/**
 * context-info.js
 */
'use strict';

(() => {
  /**
   * get active element
   * @returns {object} - active element
   */
  const getActiveElm = () => {
    const sel = window.getSelection();
    const { anchorNode, focusNode, isCollapsed } = sel;
    let elm;
    if (isCollapsed) {
      elm = document.activeElement;
    } else {
      if (anchorNode === focusNode) {
        if (anchorNode.nodeType === Node.ELEMENT_NODE) {
          elm = anchorNode;
        } else {
          elm = anchorNode.parentNode;
        }
      } else {
        elm = sel.getRangeAt(0).commonAncestorContainer;
      }
    }
    return elm;
  };

  /**
   * create context info
   * @param {object} [node] - element
   * @returns {object} - context info
   */
  const createContextInfo = node => {
    const contextInfo = {
      canonicalUrl: null,
      content: null,
      isLink: false,
      selectionText: window.getSelection().toString(),
      title: null,
      url: null
    };
    if (node?.nodeType === Node.ELEMENT_NODE) {
      const anchor = node.closest('a');
      const canonical = document.querySelector('link[rel=canonical][href]');
      if (anchor) {
        const { href, innerText, textContent, title } = anchor;
        if (href) {
          const content = innerText ?? textContent;
          contextInfo.isLink = true;
          contextInfo.content = content.replace(/\s+/g, ' ').trim();
          contextInfo.title = title;
          if (href?.baseVal) {
            contextInfo.url = href.baseVal;
          } else {
            contextInfo.url = href;
          }
        }
      }
      if (canonical) {
        const { origin: docOrigin } = new URL(document.URL);
        const { href: canonicalHref } =
          new URL(canonical.getAttribute('href'), docOrigin);
        contextInfo.canonicalUrl = canonicalHref;
      }
    }
    return contextInfo;
  };

  /**
   * get context info
   * @returns {object} - context info
   */
  const getContextInfo = () => {
    const elm = getActiveElm();
    const info = createContextInfo(elm);
    return info;
  };

  /* export for tests */
  if (typeof module !== 'undefined' &&
      Object.hasOwn(module, 'exports')) {
    module.exports = {
      createContextInfo,
      getActiveElm,
      getContextInfo
    };
  }

  /* execute */
  return getContextInfo();
})();
