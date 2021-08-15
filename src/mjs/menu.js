/**
 * menu.js
 */

/* shared */
import { getType, isString } from './common.js';
import { getAllTabsInWindow, getHighlightedTab } from './browser.js';
import { enabledFormats, getFormat, getFormats } from './format.js';
import {
  COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL, COPY_TABS_OTHER,
  COPY_TABS_SELECTED, WEBEXT_ID
} from './constant.js';

/* api */
const { i18n, runtime, windows } = browser;
const menus = browser.menus || browser.contextMenus;

/* constants */
const { WINDOW_ID_CURRENT } = windows;

/* variables */
export const vars = {
  isWebExt: runtime.id === WEBEXT_ID
};

/* context menu items */
export const menuItems = {
  [COPY_PAGE]: {
    id: COPY_PAGE,
    contexts: ['page', 'selection'],
    key: '(&C)'
  },
  [COPY_LINK]: {
    id: COPY_LINK,
    contexts: ['link'],
    key: '(&C)'
  },
  [COPY_TAB]: {
    id: COPY_TAB,
    contexts: ['tab'],
    key: '(&T)'
  },
  [COPY_TABS_SELECTED]: {
    id: COPY_TABS_SELECTED,
    contexts: ['tab'],
    key: '(&S)'
  },
  [COPY_TABS_OTHER]: {
    id: COPY_TABS_OTHER,
    contexts: ['tab'],
    key: '(&O)'
  },
  [COPY_TABS_ALL]: {
    id: COPY_TABS_ALL,
    contexts: ['tab'],
    key: '(&A)'
  }
};

/**
 * remove context menu
 *
 * @returns {Function} - menus.removeAll()
 */
export const removeContextMenu = async () => menus.removeAll();

/**
 * create context menu item
 *
 * @param {string} id - menu item ID
 * @param {string} title - menu item title
 * @param {object} data - context data
 * @returns {void}
 */
export const createMenuItem = async (id, title, data = {}) => {
  const { contexts, enabled, parentId } = data;
  const { isWebExt } = vars;
  if (isString(id) && isString(title) && Array.isArray(contexts)) {
    const opt = {
      id,
      contexts,
      title,
      enabled: !!enabled
    };
    if (parentId) {
      opt.parentId = parentId;
    }
    if (contexts.includes('tab')) {
      isWebExt && menus.create(opt);
    } else {
      menus.create(opt);
    }
  }
};

/**
 * create single menu item
 *
 * @param {string} key - key
 * @param {string} itemId - item ID
 * @param {string} itemKey - item key
 * @param {object} itemData - item data
 * @returns {Function} - createMenuItem()
 */
export const createSingleMenuItem = async (key, itemId, itemKey, itemData) => {
  if (!isString(key)) {
    throw new TypeError(`Expected String but got ${getType(key)}.`);
  }
  if (!isString(itemId)) {
    throw new TypeError(`Expected String but got ${getType(itemId)}.`);
  }
  if (!isString(itemKey)) {
    throw new TypeError(`Expected String but got ${getType(itemKey)}.`);
  }
  const { isWebExt } = vars;
  const { id: keyId, title: keyTitle } = getFormat(key);
  const formatTitle = i18n.getMessage(
    `${itemId}_format_key`,
    [
      keyTitle || keyId,
      (isWebExt && itemKey) || ` ${itemKey}`
    ]
  );
  return createMenuItem(`${itemId}${key}`, formatTitle, itemData);
};

/**
 * create context menu items
 *
 * @returns {Promise.<Array>} - results of each handler
 */
export const createContextMenu = async () => {
  const func = [];
  if (enabledFormats.size) {
    const { isWebExt } = vars;
    const formats = getFormats(true);
    const items = Object.keys(menuItems);
    for (const item of items) {
      const { contexts, id: itemId, key: itemKey } = menuItems[item];
      let enabled;
      if (itemId === COPY_LINK) {
        enabled = !!isWebExt;
      } else {
        enabled = true;
      }
      const itemData = { contexts, enabled };
      if (enabledFormats.size === 1) {
        const [key] = enabledFormats.keys();
        func.push(createSingleMenuItem(key, itemId, itemKey, itemData));
      } else {
        const itemTitle = i18n.getMessage(
          `${itemId}_key`,
          (isWebExt && itemKey) || ` ${itemKey}`
        );
        func.push(createMenuItem(itemId, itemTitle, itemData));
        for (const [key, value] of formats) {
          const { enabled: formatEnabled, menu: formatMenuTitle } = value;
          if (formatEnabled) {
            const subItemId = `${itemId}${key}`;
            const subItemTitle = formatMenuTitle;
            const subItemData = {
              contexts,
              enabled: formatEnabled,
              parentId: itemId
            };
            func.push(createMenuItem(subItemId, subItemTitle, subItemData));
          }
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * update context menu
 *
 * @param {number} tabId - tab ID
 * @param {boolean} enabled - enabled
 * @returns {Promise.<Array>} - results of each handler
 */
export const updateContextMenu = async (tabId, enabled = false) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const func = [];
  if (enabledFormats.size) {
    const { isWebExt } = vars;
    const items = Object.keys(menuItems);
    const allTabs = await getAllTabsInWindow(WINDOW_ID_CURRENT);
    const highlightedTabs = await getHighlightedTab(WINDOW_ID_CURRENT);
    const isHighlighted = highlightedTabs.length > 1;
    for (const item of items) {
      const { contexts, id: itemId } = menuItems[item];
      if (itemId === COPY_LINK) {
        func.push(menus.update(itemId, { enabled }));
      } else if (contexts.includes('tab') && isWebExt) {
        let visible;
        if (itemId === COPY_TABS_ALL) {
          visible = highlightedTabs.length !== allTabs.length &&
                    allTabs.length > 1;
        } else if (itemId === COPY_TABS_OTHER) {
          visible = highlightedTabs.length !== allTabs.length;
        } else if (itemId === COPY_TABS_SELECTED) {
          visible = isHighlighted;
        } else {
          visible = !isHighlighted;
        }
        func.push(menus.update(itemId, { visible }));
      }
    }
  }
  return Promise.all(func);
};

/**
 * handle menus on shown
 *
 * @param {object} info - menu info
 * @param {object} tab - tabs.Tab
 * @returns {?Function} - menus.reflesh()
 */
export const handleMenusOnShown = async (info, tab) => {
  const { contexts } = info;
  const { id: tabId } = tab;
  let func;
  if (Array.isArray(contexts) && contexts.includes('tab') &&
      Number.isInteger(tabId) && typeof menus.refresh === 'function') {
    const arr = await updateContextMenu(tabId);
    if (Array.isArray(arr) && arr.length) {
      func = menus.refresh();
    }
  }
  return func || null;
};

// For test
export { enabledFormats };
