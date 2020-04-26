/**
 * main.js
 */

import {
  Clip,
} from "./clipboard.js";
import {
  getType, isObjectNotEmpty, isString, logErr,
} from "./common.js";
import {
  getActiveTabId, getAllTabsInWindow, getHighlightedTab, isTab, queryTabs,
  sendMessage,
} from "./browser.js";
import {
  createLinkText, createTabsLinkText, getFormat, getFormatId, getFormats,
  getFormatsKeys, hasFormat, setFormat,
} from "./format.js";
import {
  notifyOnCopy,
} from "./notify.js";

/* api */
const {browserAction, i18n, runtime, tabs, windows} = browser;
const menus = browser.menus || browser.contextMenus;

/* constants */
import {
  BBCODE_URL, CMD_COPY, CONTENT_EDITED, CONTENT_EDITED_GET, CONTEXT_INFO,
  CONTEXT_INFO_GET, COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL,
  COPY_TABS_OTHER, COPY_TABS_SELECTED, EXT_NAME, HTML_HYPER, HTML_PLAIN, ICON,
  ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT, ICON_WHITE,
  INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  MARKDOWN, MIME_HTML, MIME_PLAIN, NOTIFY_COPY, PROMPT, TEXT_SEP_LINES,
  TEXT_TEXT_URL, WEBEXT_ID,
} from "./constant.js";
const {TAB_ID_NONE} = tabs;
const {WINDOW_ID_CURRENT} = windows;

/* variables */
export const vars = {
  iconId: "",
  includeTitleHTMLHyper: false,
  includeTitleHTMLPlain: false,
  includeTitleMarkdown: false,
  isWebExt: runtime.id === WEBEXT_ID,
  notifyOnCopy: false,
  promptContent: false,
  separateTextURL: false,
};

/* enabled formats */
export const enabledFormats = new Set();

/**
 * toggle enabled formats
 * @param {string} id - format id
 * @param {boolean} enabled - format is enabled
 * @returns {void}
 */
export const toggleEnabledFormats = async (id, enabled) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const keys = await getFormatsKeys(true);
  const formatId = getFormatId(id);
  if (keys.includes(formatId) && enabled) {
    enabledFormats.add(formatId);
  } else {
    enabledFormats.delete(formatId);
  }
};

/**
 * set format data
 * @returns {Promise.<Array>} - result of each handler
 */
export const setFormatData = async () => {
  const items = await getFormats(true);
  const func = [];
  for (const [key, value] of items) {
    const {enabled} = value;
    func.push(toggleEnabledFormats(key, enabled));
  }
  return Promise.all(func);
};

/**
 * get format template
 * @param {string} id - menu item ID
 * @returns {?string} - template
 */
export const getFormatTemplate = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = await getFormat(id);
  let template;
  if (item) {
    const {
      id: itemId, template: itemTmpl, templateAlt: itemTmplAlt,
    } = item;
    const {
      includeTitleHTMLHyper, includeTitleHTMLPlain, includeTitleMarkdown,
      separateTextURL,
    } = vars;
    switch (itemId) {
      case HTML_HYPER:
        template = includeTitleHTMLHyper && itemTmpl || itemTmplAlt;
        break;
      case HTML_PLAIN:
        template = includeTitleHTMLPlain && itemTmpl || itemTmplAlt;
        break;
      case MARKDOWN:
        template = includeTitleMarkdown && itemTmpl || itemTmplAlt;
        break;
      case TEXT_TEXT_URL:
        template = separateTextURL && itemTmplAlt || itemTmpl;
        break;
      default:
        template = itemTmpl;
    }
  }
  return template || null;
};

/**
 * get format title
 * @param {string} id - menu item ID
 * @returns {?string} - title
 */
export const getFormatTitle = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = await getFormat(id);
  let title;
  if (item) {
    const {id: itemId, title: itemTitle} = item;
    title = itemTitle || itemId;
  }
  return title || null;
};

/* enabled tabs collection */
export const enabledTabs = new Map();

/* context menu items */
export const menuItems = {
  [COPY_PAGE]: {
    id: COPY_PAGE,
    contexts: ["page", "selection"],
    key: "(&C)",
  },
  [COPY_LINK]: {
    id: COPY_LINK,
    contexts: ["link"],
    key: "(&C)",
  },
  [COPY_TAB]: {
    id: COPY_TAB,
    contexts: ["tab"],
    key: "(&T)",
  },
  [COPY_TABS_SELECTED]: {
    id: COPY_TABS_SELECTED,
    contexts: ["tab"],
    key: "(&S)",
  },
  [COPY_TABS_OTHER]: {
    id: COPY_TABS_OTHER,
    contexts: ["tab"],
    key: "(&O)",
  },
  [COPY_TABS_ALL]: {
    id: COPY_TABS_ALL,
    contexts: ["tab"],
    key: "(&A)",
  },
};

/**
 * remove context menu
 * @returns {AsyncFunction} - menus.removeAll()
 */
export const removeContextMenu = async () => menus.removeAll();

/**
 * create context menu item
 * @param {string} id - menu item ID
 * @param {string} title - menu item title
 * @param {Object} data - context data
 * @returns {void}
 */
export const createMenuItem = async (id, title, data = {}) => {
  const {contexts, enabled, parentId} = data;
  const {isWebExt} = vars;
  if (isString(id) && isString(title) && Array.isArray(contexts)) {
    const opt = {
      id, contexts, title,
      enabled: !!enabled,
    };
    if (parentId) {
      opt.parentId = parentId;
    }
    if (contexts.includes("tab")) {
      isWebExt && menus.create(opt);
    } else {
      menus.create(opt);
    }
  }
};

/**
 * create single menu item
 * @param {string} key - key
 * @param {string} itemId - item ID
 * @param {string} itemKey - item key
 * @param {Object} itemData - item data
 * @returns {AsyncFunction} - createMenuItem()
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
  const {isWebExt} = vars;
  const {id: keyId, title: keyTitle} = await getFormat(key);
  const formatTitle = i18n.getMessage(
    `${itemId}_format_key`,
    [
      keyTitle || keyId,
      isWebExt && itemKey || ` ${itemKey}`,
    ],
  );
  return createMenuItem(`${itemId}${key}`, formatTitle, itemData);
};

/**
 * create context menu items
 * @returns {Promise.<Array>} - results of each handler
 */
export const createContextMenu = async () => {
  const func = [];
  if (enabledFormats.size) {
    const {isWebExt, promptContent} = vars;
    const formats = await getFormats(true);
    const items = Object.keys(menuItems);
    for (const item of items) {
      const {contexts, id: itemId, key: itemKey} = menuItems[item];
      let enabled;
      switch (itemId) {
        case COPY_LINK:
          enabled = !promptContent;
          break;
        case COPY_PAGE:
          enabled = isWebExt || !promptContent;
          break;
        default:
          enabled = true;
      }
      const itemData = {contexts, enabled};
      if (enabledFormats.size === 1) {
        const [key] = enabledFormats.keys();
        func.push(createSingleMenuItem(key, itemId, itemKey, itemData));
      } else {
        const itemTitle = i18n.getMessage(
          `${itemId}_key`,
          isWebExt && itemKey || ` ${itemKey}`,
        );
        func.push(createMenuItem(itemId, itemTitle, itemData));
        for (const [key, value] of formats) {
          const {enabled: formatEnabled, menu: formatMenuTitle} = value;
          if (formatEnabled) {
            const subItemId = `${itemId}${key}`;
            const subItemTitle = formatMenuTitle;
            const subItemData = {
              contexts,
              enabled: formatEnabled,
              parentId: itemId,
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
 * @param {number} tabId - tab ID
 * @returns {Promise.<Array>} - results of each handler
 */
export const updateContextMenu = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const func = [];
  if (enabledFormats.size) {
    const {isWebExt, promptContent} = vars;
    const items = Object.keys(menuItems);
    const allTabs = await getAllTabsInWindow(WINDOW_ID_CURRENT);
    const highlightedTabs = await getHighlightedTab(WINDOW_ID_CURRENT);
    const isHighlighted = highlightedTabs.length > 1;
    for (const item of items) {
      const {contexts, id: itemId} = menuItems[item];
      switch (itemId) {
        case COPY_LINK: {
          const enabled = enabledTabs.get(tabId) || false;
          func.push(menus.update(itemId, {enabled}));
          break;
        }
        case COPY_PAGE: {
          const enabled = isWebExt || !promptContent ||
                          enabledTabs.get(tabId) || false;
          func.push(menus.update(itemId, {enabled}));
          break;
        }
        default: {
          if (contexts.includes("tab") && isWebExt) {
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
            func.push(menus.update(itemId, {visible}));
          }
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * handle menus on shown
 * @param {Object} info - menu info
 * @param {Object} tab - tabs.Tab
 * @returns {?AsyncFunction} - menus.reflesh()
 */
export const handleMenusOnShown = async (info, tab) => {
  const {contexts} = info;
  const {id: tabId} = tab;
  let func;
  if (Array.isArray(contexts) && contexts.includes("tab") &&
      Number.isInteger(tabId) && typeof menus.refresh === "function") {
    const arr = await updateContextMenu(tabId);
    if (Array.isArray(arr) && arr.length) {
      func = menus.refresh();
    }
  }
  return func || null;
};

/**
 * set enabled tab
 * @param {number} tabId - tab ID
 * @param {Object} tab - tabs.Tab
 * @param {Object} data - context info
 * @returns {Object} - tab ID info
 */
export const setEnabledTab = async (tabId, tab, data = {}) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const {enabled} = data;
  const info = {tabId, enabled};
  if (tab || await isTab(tabId)) {
    enabledTabs.set(tabId, !!enabled);
  }
  return info;
};

/**
 * remove enabled tab
 * @param {number} tabId - tab ID
 * @returns {AsyncFunction} - updateContextMenu()
 */
export const removeEnabledTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const id = await getActiveTabId();
  await enabledTabs.delete(tabId);
  return updateContextMenu(id);
};

/**
 * set icon
 * @returns {Promise.<Array>} - results of each handler
 */
export const setIcon = async () => {
  const {iconId} = vars;
  const name = i18n.getMessage(EXT_NAME);
  const icon = runtime.getURL(ICON);
  const path = iconId && `${icon}${iconId}` || icon;
  const title = name;
  return Promise.all([
    browserAction.setIcon({path}),
    browserAction.setTitle({title}),
  ]);
};

/* context info */
export const contextInfo = {
  isLink: false,
  content: null,
  selectionText: "",
  title: null,
  url: null,
  canonicalUrl: null,
};

/**
 * init context info
 * @returns {Object} - context info
 */
export const initContextInfo = async () => {
  contextInfo.isLink = false;
  contextInfo.content = null;
  contextInfo.selectionText = "";
  contextInfo.title = null;
  contextInfo.url = null;
  contextInfo.canonicalUrl = null;
  return contextInfo;
};

/**
 * update context info
 * @param {Object} data - context info data
 * @returns {Object} - context info
 */
export const updateContextInfo = async (data = {}) => {
  await initContextInfo();
  const {contextInfo: info} = data;
  if (info) {
    const items = Object.entries(info);
    for (const [key, value] of items) {
      contextInfo[key] = value;
    }
  }
  return contextInfo;
};

/**
 * get all tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
export const getAllTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = await getFormatTemplate(menuItemId);
  const arr = await getAllTabsInWindow(WINDOW_ID_CURRENT);
  arr.forEach(tab => {
    const {id, title, url} = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id, formatId, template, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/**
 * get other tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
export const getOtherTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = await getFormatTemplate(menuItemId);
  const arr = await queryTabs({
    active: false,
    windowId: WINDOW_ID_CURRENT,
    windowType: "normal",
  });
  arr.forEach(tab => {
    const {id, title, url} = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id, formatId, template, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/**
 * get selected tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
export const getSelectedTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = await getFormatTemplate(menuItemId);
  const arr = await getHighlightedTab(WINDOW_ID_CURRENT);
  arr.forEach(tab => {
    const {id, title, url} = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id, formatId, template, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/**
 * extract clicked data
 * @param {Object} info - clicked info
 * @param {Object} tab - tabs.Tab
 * @returns {Promise.<Array>} - results of each handler
 */
export const extractClickedData = async (info, tab) => {
  const func = [];
  if (isObjectNotEmpty(info) && isObjectNotEmpty(tab)) {
    const {
      menuItemId, selectionText: infoSelectionText,
      canonicalUrl: infoCanonicalUrl, content: infoContent,
      isLink: infoIsLink, title: infoTitle, url: infoUrl,
    } = info;
    const {id: tabId, title: tabTitle, url: tabUrl} = tab;
    if (isString(menuItemId) &&
        Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
      const {notifyOnCopy: notify, promptContent} = vars;
      const {
        canonicalUrl: contextCanonicalUrl, content: contextContent,
        selectionText: contextSelectionText, title: contextTitle,
        url: contextUrl,
      } = contextInfo;
      const {hash: tabUrlHash} = new URL(tabUrl);
      const formatId = getFormatId(menuItemId);
      const formatTitle = await getFormatTitle(formatId);
      const mimeType = formatId === HTML_HYPER && MIME_HTML || MIME_PLAIN;
      let text;
      if (menuItemId.startsWith(COPY_TABS_ALL)) {
        const allTabs = await getAllTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of allTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = await createTabsLinkText(tmplArr, mimeType);
      } else if (menuItemId.startsWith(COPY_TABS_OTHER)) {
        const otherTabs = await getOtherTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of otherTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = await createTabsLinkText(tmplArr, mimeType);
      } else if (menuItemId.startsWith(COPY_TABS_SELECTED)) {
        const selectedTabs = await getSelectedTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of selectedTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = await createTabsLinkText(tmplArr, mimeType);
      } else if (menuItemId.startsWith(COPY_TAB)) {
        const template = await getFormatTemplate(formatId);
        let content, title, url;
        if (formatId === BBCODE_URL) {
          content = tabUrl;
          url = tabUrl;
        } else {
          content = tabTitle;
          title = tabTitle;
          url = tabUrl;
        }
        text = await createLinkText({
          content, formatId, template, title, url,
        });
      } else {
        const template = await getFormatTemplate(formatId);
        let content, title, url;
        if (menuItemId.startsWith(COPY_LINK)) {
          if (formatId === BBCODE_URL) {
            content = contextUrl;
            url = contextUrl;
          } else {
            content = infoSelectionText || contextSelectionText ||
                      contextContent || contextTitle;
            title = contextTitle;
            url = contextUrl;
          }
        } else if (menuItemId.startsWith(COPY_PAGE)) {
          if (formatId === BBCODE_URL) {
            content = !tabUrlHash && contextCanonicalUrl || tabUrl;
            url = !tabUrlHash && contextCanonicalUrl || tabUrl;
          } else {
            content = infoSelectionText || tabTitle;
            title = tabTitle;
            url = !tabUrlHash && contextCanonicalUrl || tabUrl;
          }
        } else if (enabledFormats.has(formatId)) {
          if (infoIsLink) {
            if (formatId === BBCODE_URL) {
              content = infoUrl;
              url = infoUrl;
            } else {
              content = infoSelectionText || infoContent || infoTitle;
              title = infoTitle;
              url = infoUrl;
            }
          } else if (formatId === BBCODE_URL) {
            content = !tabUrlHash && infoCanonicalUrl || tabUrl;
            url = !tabUrlHash && infoCanonicalUrl || tabUrl;
          } else {
            content = infoSelectionText || tabTitle;
            title = tabTitle;
            url = !tabUrlHash && infoCanonicalUrl || tabUrl;
          }
        }
        if (isString(content) && isString(url)) {
          if (promptContent && enabledTabs.get(tabId)) {
            func.push(sendMessage(tabId, {
              [CONTENT_EDITED_GET]: {
                content, formatId, formatTitle, mimeType, promptContent,
                template, title, url,
              },
            }));
          } else {
            text = await createLinkText({
              content, formatId, template, title, url,
            });
          }
        }
      }
      if (isString(text)) {
        await new Clip(text, mimeType).copy();
        notify && func.push(notifyOnCopy(formatTitle));
      }
      func.push(initContextInfo());
    }
  }
  return Promise.all(func);
};

/**
 * exec copy
 * @param {Object} data - data
 * @returns {?AsyncFunction} - notifyOnCopy()
 */
export const execCopy = async (data = {}) => {
  const {content, formatId, formatTitle, mimeType, template, title, url} = data;
  const {notifyOnCopy: notify} = vars;
  if (!isString(formatId)) {
    throw new TypeError(`Expected String but got ${getType(formatId)}.`);
  }
  if (!isString(mimeType)) {
    throw new TypeError(`Expected String but got ${getType(mimeType)}.`);
  }
  if (!isString(template)) {
    throw new TypeError(`Expected String but got ${getType(template)}.`);
  }
  if (notify && !isString(formatTitle)) {
    throw new TypeError(`Expected String but got ${getType(formatTitle)}.`);
  }
  const text = await createLinkText({
    content, formatId, template, title, url,
  });
  let func;
  await new Clip(text, mimeType).copy();
  if (notify) {
    func = notifyOnCopy(formatTitle);
  }
  return func || null;
};

/**
 * handle active tab
 * @param {Object} info - active tab info
 * @returns {?AsyncFunction} - updateContextMenu()
 */
export const handleActiveTab = async (info = {}) => {
  let func;
  const {tabId} = info;
  if (Number.isInteger(tabId) && await isTab(tabId)) {
    func = updateContextMenu(tabId);
  }
  return func || null;
};

/**
 * handle updated tab
 * @param {number} tabId - tab ID
 * @param {Object} info - info
 * @param {Object} tab - tabs.Tab
 * @returns {?AsyncFunction} - handle active tab
 */
export const handleUpdatedTab = async (tabId, info = {}, tab = {}) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let func;
  const {status} = info;
  const {active} = tab;
  if (status === "complete" && active) {
    func = handleActiveTab({tabId});
  }
  return func || null;
};

/**
 * handle command
 * @param {!string} cmd - command
 * @returns {void}
 */
export const handleCmd = async cmd => {
  if (!isString(cmd)) {
    throw new TypeError(`Expected String but got ${getType(cmd)}.`);
  }
  if (cmd.startsWith(CMD_COPY)) {
    const format = cmd.replace(CMD_COPY, "");
    const tabId = await getActiveTabId();
    try {
      Number.isInteger(tabId) && tabId !== TAB_ID_NONE &&
      enabledFormats.has(format) && await sendMessage(tabId, {
        [CONTEXT_INFO_GET]: {
          format, tabId,
        },
      });
    } catch (e) {
      logErr(e);
    }
  }
};

/**
 * handle message
 * @param {*} msg - message
 * @param {Object} sender - sender
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async (msg, sender = {}) => {
  const {tab} = sender;
  const func = [];
  if (isObjectNotEmpty(msg)) {
    const items = Object.entries(msg);
    for (const [key, value] of items) {
      switch (key) {
        case CONTEXT_INFO: {
          if (isObjectNotEmpty(value)) {
            const {contextInfo: info, data} = value;
            const {format} = data;
            info.menuItemId = format;
            func.push(extractClickedData(info, tab));
          }
          break;
        }
        case CONTENT_EDITED: {
          if (isObjectNotEmpty(value)) {
            func.push(execCopy(value));
          }
          break;
        }
        case NOTIFY_COPY: {
          const {notifyOnCopy: notify} = vars;
          notify && value && func.push(notifyOnCopy());
          break;
        }
        case "keydown":
        case "mousedown":
          func.push(updateContextInfo(value));
          break;
        case "load": {
          if (tab) {
            const {id: tabId} = tab;
            func.push(
              setEnabledTab(tabId, tab, value).then(handleActiveTab),
            );
          }
          func.push(updateContextInfo(value));
          break;
        }
        default:
      }
    }
  }
  return Promise.all(func);
};

/**
 * set variable
 * @param {string} item - item
 * @param {Object} obj - value object
 * @param {boolean} changed - changed
 * @returns {Promise.<Array>} - results of each handler
 */
export const setVar = async (item, obj, changed = false) => {
  if (!isString(item)) {
    throw new TypeError(`Expected String but got ${getType(item)}.`);
  }
  const func = [];
  if (isObjectNotEmpty(obj)) {
    const {checked, value} = obj;
    switch (item) {
      case ICON_AUTO:
      case ICON_BLACK:
      case ICON_COLOR:
      case ICON_DARK:
      case ICON_LIGHT:
      case ICON_WHITE:
        if (checked) {
          vars.iconId = value;
          func.push(setIcon());
        }
        break;
      case INCLUDE_TITLE_HTML_HYPER:
      case INCLUDE_TITLE_HTML_PLAIN:
      case INCLUDE_TITLE_MARKDOWN:
      case NOTIFY_COPY:
      case TEXT_SEP_LINES:
        vars[item] = !!checked;
        break;
      case PROMPT:
        vars[item] = !!checked;
        if (changed) {
          func.push(
            removeContextMenu().then(createContextMenu).then(getActiveTabId)
              .then(updateContextMenu),
          );
        }
        break;
      default: {
        if (await hasFormat(item)) {
          const formatItem = await getFormat(item);
          formatItem.enabled = !!checked;
          setFormat(item, formatItem);
          if (changed) {
            func.push(
              toggleEnabledFormats(item, !!checked).then(removeContextMenu)
                .then(createContextMenu),
            );
          } else {
            func.push(toggleEnabledFormats(item, !!checked));
          }
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * set variables
 * @param {Object} data - storage data
 * @returns {Promise.<Array>} - results of each handler
 */
export const setVars = async (data = {}) => {
  const func = [];
  const items = Object.entries(data);
  for (const [key, value] of items) {
    const {newValue} = value;
    func.push(setVar(key, newValue || value, !!newValue));
  }
  return Promise.all(func);
};
