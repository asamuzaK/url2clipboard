/**
 * main.js
 */

import {
  getType, isObjectNotEmpty, isString, logErr,
} from "./common.js";
import {
  createNotification, getActiveTabId, getAllTabsInWindow, getEnabledTheme,
  isTab, sendMessage,
} from "./browser.js";
import formatData from "./format.js";

/* api */
const {browserAction, contextMenus, i18n, runtime, tabs} = browser;

/* constants */
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_ALL_TABS, COPY_LINK, COPY_PAGE, COPY_TAB,
  EXEC_COPY, EXEC_COPY_POPUP, EXEC_COPY_TABS, EXEC_COPY_TABS_POPUP,
  EXT_NAME, HTML_HTML, HTML_PLAIN, ICON, ICON_AUTO, ICON_BLACK, ICON_COLOR,
  ICON_DARK, ICON_DARK_ID, ICON_LIGHT, ICON_LIGHT_ID, ICON_WHITE,
  INCLUDE_TITLE_HTML_HTML, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  MARKDOWN, NOTIFY_COPY, PROMPT, THEME_DARK, THEME_LIGHT, WEBEXT_ID,
} from "./constant.js";
const {TAB_ID_NONE} = tabs;

/* variables */
export const vars = {
  iconId: "",
  includeTitleHtmlHtml: false,
  includeTitleHtmlPlain: false,
  includeTitleMarkdown: false,
  isWebExt: runtime.id === WEBEXT_ID,
  notifyOnCopy: false,
  promptContent: false,
};

/* formats */
export const formats = new Map();

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
  if (id.startsWith(COPY_ALL_TABS)) {
    id = id.replace(COPY_ALL_TABS, "");
  } else if (id.startsWith(COPY_LINK)) {
    id = id.replace(COPY_LINK, "");
  } else if (id.startsWith(COPY_PAGE)) {
    id = id.replace(COPY_PAGE, "");
  } else if (id.startsWith(COPY_TAB)) {
    id = id.replace(COPY_TAB, "");
  }
  if (formats.has(id) && enabled) {
    enabledFormats.add(id);
  } else {
    enabledFormats.delete(id);
  }
};

/**
 * set format data
 * @returns {Promise.<Array>} - result of each handler
 */
export const setFormatData = async () => {
  const items = Object.entries(formatData);
  const func = [];
  for (const [key, value] of items) {
    const {enabled} = value;
    formats.set(key, value);
    func.push(toggleEnabledFormats(key, enabled));
  }
  return Promise.all(func);
};

/**
 * get format item from menu item ID
 * @param {string} id - menu item id
 * @returns {Object} - format item
 */
export const getFormatItemFromId = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let item;
  if (id.startsWith(COPY_ALL_TABS)) {
    item = formats.get(id.replace(COPY_ALL_TABS, ""));
  } else if (id.startsWith(COPY_LINK)) {
    item = formats.get(id.replace(COPY_LINK, ""));
  } else if (id.startsWith(COPY_PAGE)) {
    item = formats.get(id.replace(COPY_PAGE, ""));
  } else if (id.startsWith(COPY_TAB)) {
    item = formats.get(id.replace(COPY_TAB, ""));
  } else {
    item = formats.get(id);
  }
  return item || null;
};

/**
 * get format template
 * @param {string} id - menu item ID
 * @returns {string} - template
 */
export const getFormatTemplate = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = await getFormatItemFromId(id);
  let template;
  if (item) {
    const {
      id: itemId, template: itemTmpl, templateWithoutTitle: itemTmplWoTitle,
    } = item;
    const {
      includeTitleHtmlHtml, includeTitleHtmlPlain, includeTitleMarkdown,
    } = vars;
    switch (itemId) {
      case HTML_HTML:
        template = includeTitleHtmlHtml && itemTmpl || itemTmplWoTitle;
        break;
      case HTML_PLAIN:
        template = includeTitleHtmlPlain && itemTmpl || itemTmplWoTitle;
        break;
      case MARKDOWN:
        template = includeTitleMarkdown && itemTmpl || itemTmplWoTitle;
        break;
      default:
        template = itemTmpl;
    }
  }
  return template || null;
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
  [COPY_ALL_TABS]: {
    id: COPY_ALL_TABS,
    contexts: ["tab"],
    key: "(&A)",
  },
};

/**
 * remove context menu
 * @returns {AsyncFunction} - contextMenus.removeAll()
 */
export const removeContextMenu = async () => contextMenus.removeAll();

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
      if (isWebExt) {
        contextMenus.create(opt);
      }
    } else {
      contextMenus.create(opt);
    }
  }
};

/**
 * create context menu items
 * @returns {Promise.<Array>} - results of each handler
 */
export const createContextMenu = async () => {
  const func = [];
  if (enabledFormats.size) {
    const {isWebExt} = vars;
    const items = Object.keys(menuItems);
    for (const item of items) {
      const {contexts, id: itemId, key: itemKey} = menuItems[item];
      const enabled = false;
      const itemData = {contexts, enabled};
      if (enabledFormats.size === 1) {
        const [key] = enabledFormats.keys();
        const {id: keyId, title: keyTitle} = formats.get(key);
        const formatTitle = i18n.getMessage(
          `${itemId}_format_key`,
          [
            keyTitle || keyId,
            isWebExt && itemKey || ` ${itemKey}`,
          ],
        );
        func.push(createMenuItem(`${itemId}${key}`, formatTitle, itemData));
      } else {
        const itemTitle = i18n.getMessage(
          `${itemId}_key`,
          isWebExt && itemKey || ` ${itemKey}`
        );
        func.push(createMenuItem(itemId, itemTitle, itemData));
        formats.forEach((value, key) => {
          const {
            enabled: formatEnabled, id: formatId, menu: formatMenuTitle,
            title: formatTitle,
          } = value;
          if (formatEnabled) {
            const subItemId = `${itemId}${key}`;
            const subItemTitle = formatMenuTitle || formatTitle || formatId;
            const subItemData = {
              contexts,
              enabled: formatEnabled,
              parentId: itemId,
            };
            func.push(createMenuItem(subItemId, subItemTitle, subItemData));
          }
        });
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
    const {isWebExt} = vars;
    const enabled = enabledTabs.get(tabId) || false;
    const items = Object.keys(menuItems);
    for (const item of items) {
      const {contexts, id: itemId} = menuItems[item];
      if (contexts.includes("tab")) {
        if (isWebExt) {
          func.push(contextMenus.update(itemId, {enabled}));
        }
      } else {
        func.push(contextMenus.update(itemId, {contexts, enabled}));
      }
      formats.forEach((value, key) => {
        const {enabled: formatEnabled} = value;
        if (formatEnabled) {
          const subItemId = `${itemId}${key}`;
          if (contexts.includes("tab")) {
            if (isWebExt) {
              func.push(contextMenus.update(subItemId, {enabled}));
            }
          } else {
            func.push(contextMenus.update(subItemId, {enabled}));
          }
        }
      });
    }
  }
  return Promise.all(func);
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
 * @returns {?AsyncFunction} - updateContextMenu()
 */
export const removeEnabledTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let func;
  const id = await getActiveTabId();
  await enabledTabs.delete(tabId);
  if (Number.isInteger(id)) {
    func = updateContextMenu(id);
  }
  return func || null;
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

/**
 * set default icon
 * @returns {void}
 */
export const setDefaultIcon = async () => {
  const items = await getEnabledTheme();
  if (Array.isArray(items) && items.length) {
    for (const item of items) {
      const {id} = item;
      switch (id) {
        case THEME_DARK:
          vars.iconId = ICON_LIGHT_ID;
          break;
        case THEME_LIGHT:
          vars.iconId = ICON_DARK_ID;
          break;
        default: {
          const {isWebExt} = vars;
          if (isWebExt) {
            vars.iconId = ICON_DARK_ID;
          } else {
            vars.iconId = "";
          }
        }
      }
    }
  } else {
    vars.iconId = "";
  }
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
  const arr = await getAllTabsInWindow();
  arr.forEach(tab => {
    const {id, title, url} = tab;
    tabsInfo.push({
      id, menuItemId, template, title, url,
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
      const {
        includeTitleHtmlHtml, includeTitleHtmlPlain, includeTitleMarkdown,
        promptContent,
      } = vars;
      const {
        canonicalUrl: contextCanonicalUrl, content: contextContent,
        selectionText: contextSelectionText, title: contextTitle,
        url: contextUrl,
      } = contextInfo;
      const {hash: tabUrlHash} = new URL(tabUrl);
      if (menuItemId.startsWith(COPY_ALL_TABS)) {
        const allTabs = await getAllTabsInfo(menuItemId);
        func.push(sendMessage(tabId, {
          [EXEC_COPY_TABS]: {
            allTabs,
            includeTitleHtmlHtml, includeTitleHtmlPlain, includeTitleMarkdown,
          },
        }));
      } else {
        const template = await getFormatTemplate(menuItemId);
        let content, title, url;
        if (menuItemId.startsWith(COPY_LINK)) {
          if (menuItemId === `${COPY_LINK}${BBCODE_URL}`) {
            content = contextUrl;
            url = contextUrl;
          } else {
            content = infoSelectionText || contextSelectionText ||
                      contextContent || contextTitle;
            title = contextTitle;
            url = contextUrl;
          }
        } else if (menuItemId.startsWith(COPY_PAGE) ||
                   menuItemId.startsWith(COPY_TAB)) {
          if (menuItemId === `${COPY_PAGE}${BBCODE_URL}` ||
              menuItemId === `${COPY_TAB}${BBCODE_URL}`) {
            content = !tabUrlHash && contextCanonicalUrl || tabUrl;
            url = !tabUrlHash && contextCanonicalUrl || tabUrl;
          } else {
            content = infoSelectionText || tabTitle;
            title = tabTitle;
            url = !tabUrlHash && contextCanonicalUrl || tabUrl;
          }
        } else if (enabledFormats.has(menuItemId)) {
          if (infoIsLink) {
            if (menuItemId === BBCODE_URL) {
              content = infoUrl;
              url = infoUrl;
            } else {
              content = infoSelectionText || infoContent || infoTitle;
              title = infoTitle;
              url = infoUrl;
            }
          } else if (menuItemId === BBCODE_URL) {
            content = !tabUrlHash && infoCanonicalUrl || tabUrl;
            url = !tabUrlHash && infoCanonicalUrl || tabUrl;
          } else {
            content = infoSelectionText || tabTitle;
            title = tabTitle;
            url = !tabUrlHash && infoCanonicalUrl || tabUrl;
          }
        }
        if (isString(content) && isString(url)) {
          func.push(sendMessage(tabId, {
            [EXEC_COPY]: {
              content, includeTitleHtmlHtml, includeTitleHtmlPlain,
              includeTitleMarkdown, menuItemId, promptContent, template,
              title, url,
            },
          }));
        }
      }
      func.push(initContextInfo());
    }
  }
  return Promise.all(func);
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
 * prepare UI
 * @returns {Promise.<Array>} - results of each handler
 */
export const prepareUI = async () => Promise.all([
  setIcon(),
  createContextMenu(),
]);

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
    if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE &&
        enabledFormats.has(format)) {
      try {
        await sendMessage(tabId, {
          [CONTEXT_INFO_GET]: {
            format, tabId,
          },
        });
      } catch (e) {
        logErr(e);
      }
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
        case EXEC_COPY:
          func.push(sendMessage(null, {
            [EXEC_COPY_POPUP]: value,
          }));
          break;
        case EXEC_COPY_TABS:
          func.push(sendMessage(null, {
            [EXEC_COPY_TABS_POPUP]: value,
          }));
          break;
        case NOTIFY_COPY: {
          const {notifyOnCopy} = vars;
          if (notifyOnCopy && value) {
            func.push(createNotification(key, {
              iconUrl: runtime.getURL(ICON),
              message: i18n.getMessage("notifyOnCopyMsg"),
              title: i18n.getMessage("extensionName"),
              type: "basic",
            }));
          }
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
              setEnabledTab(tabId, tab, value).then(handleActiveTab)
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
          if (changed) {
            func.push(setIcon());
          }
        }
        break;
      case INCLUDE_TITLE_HTML_HTML:
      case INCLUDE_TITLE_HTML_PLAIN:
      case INCLUDE_TITLE_MARKDOWN:
      case NOTIFY_COPY:
      case PROMPT:
        vars[item] = !!checked;
        break;
      default: {
        if (formats.has(item)) {
          const formatItem = formats.get(item);
          formatItem.enabled = !!checked;
          formats.set(item, formatItem);
          if (changed) {
            func.push(
              toggleEnabledFormats(item, !!checked).then(removeContextMenu)
                .then(createContextMenu)
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
