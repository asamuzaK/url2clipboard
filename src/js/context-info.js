/**
 * context-info.js
 */
'use strict';

(() => {
  /**
   * get active element
   *
   * @returns {object} - active element
   */
  const getActiveElm = () => {
    const sel = window.getSelection();
    const { anchorNode, focusNode, isCollapsed } = sel;
    let elm;
    if (!isCollapsed) {
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
    return elm || document.activeElement;
  };

  /**
   * get anchor element
   *
   * @param {object} node - element
   * @returns {object} - anchor element
   */
  const getAnchorElm = node => {
    const root = document.documentElement;
    let elm;
    while (node && node.parentNode && node.parentNode !== root) {
      if (node.localName === 'a') {
        elm = node;
        break;
      }
      node = node.parentNode;
    }
    return elm || null;
  };

  /**
   * create context info
   *
   * @param {object} node - element
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
      const anchor = getAnchorElm(node);
      const canonical = document.querySelector('link[rel=canonical][href]');
      if (anchor) {
        const { textContent, href, title } = anchor;
        if (href) {
          contextInfo.isLink = true;
          contextInfo.content = textContent.replace(/\s+/g, ' ').trim();
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
   *
   * @returns {object} - context info
   */
  const getContextInfo = () => {
    const elm = getActiveElm();
    const info = createContextInfo(elm);
    return info;
  };

  /* export for tests */
  if (typeof module !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(module, 'exports')) {
    module.exports = {
      createContextInfo,
      getActiveElm,
      getAnchorElm,
      getContextInfo
    };
  }

  /* execute */
  return getContextInfo();
})();
