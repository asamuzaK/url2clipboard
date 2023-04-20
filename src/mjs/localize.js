/**
 * localize.js
 */

/* shared */
import { EXT_LOCALE } from './constant.js';

/* api */
const { i18n } = browser;

/* constant */
const DATA_I18N = 'data-i18n';

/**
 * localize attribute value
 * @param {object} [elm] - element
 * @returns {Promise.<void>} - void
 */
export const localizeAttr = async elm => {
  if (elm?.nodeType === Node.ELEMENT_NODE && elm?.hasAttribute(DATA_I18N)) {
    const [id] = elm.getAttribute(DATA_I18N).split(/\s*,\s*/);
    if (id) {
      const attrs = {
        alt: 'alt',
        ariaLabel: 'aria-label',
        href: 'href',
        placeholder: 'placeholder',
        title: 'title'
      };
      const items = Object.entries(attrs);
      for (const item of items) {
        const [key, value] = item;
        if (elm.hasAttribute(value)) {
          elm.setAttribute(value, i18n.getMessage(`${id}_${key}`));
        }
      }
    }
  }
};

/**
 * localize html
 * @returns {Promise.<void>} - void
 */
export const localizeHtml = async () => {
  const lang = i18n.getMessage(EXT_LOCALE);
  if (lang) {
    const nodes = document.querySelectorAll(`[${DATA_I18N}]`);
    for (const node of nodes) {
      const [id, ph] = node.getAttribute(DATA_I18N).split(/\s*,\s*/);
      const data = i18n.getMessage(id, ph);
      if (data) {
        node.textContent = data;
      }
      localizeAttr(node);
    }
    document.documentElement.setAttribute('lang', lang);
  }
};
