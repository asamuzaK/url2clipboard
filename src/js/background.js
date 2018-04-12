/**
 * background.js
 */
"use strict";
/* api */
const {
  browserAction, contextMenus, i18n, runtime, storage, tabs,
} = browser;

/* constants */
const COPY_ALL_TABS = "copyAllTabsURL";
const COPY_LINK = "copyLinkURL";
const COPY_PAGE = "copyPageURL";
const COPY_TAB = "copyTabURL";
const EXEC_COPY = "executeCopy";
const EXEC_COPY_POPUP = "executeCopyPopup";
const EXEC_COPY_TABS = "executeCopyAllTabs";
const EXEC_COPY_TABS_POPUP = "executeCopyAllTabsPopup";
const EXT_NAME = "extensionName";
const HIDE_ON_LINK = "hideOnLink";
const ICON = "img/icon.svg";
const ICON_AUTO = "buttonIconAuto";
const ICON_BLACK = "buttonIconBlack";
const ICON_COLOR = "buttonIconColor";
const ICON_GRAY = "buttonIconGray";
const ICON_WHITE = "buttonIconWhite";
const KEY = "Alt+Shift+C";
const OUTPUT_HYPER = "outputTextHtml";
const OUTPUT_PLAIN = "outputTextPlain";
const PROMPT = "promptContent";
const WEBEXT_ID = "url2clipboard@asamuzak.jp";

const ASCIIDOC = "AsciiDoc";
const BBCODE = "BBCode";
const BBCODE_TEXT = "BBCodeText";
const BBCODE_URL = "BBCodeURL";
const HTML = "HTML";
const JIRA = "Jira";
const MARKDOWN = "Markdown";
const MEDIAWIKI = "MediaWiki";
const REST = "reStructuredText";
const TEXT = "Text";
const TEXTILE = "Textile";

/* variables */
const vars = {
  enabled: false,
  hideOnLink: false,
  iconId: "#context",
  isWebExt: runtime.id === WEBEXT_ID,
  mimeType: "text/plain",
  promptContent: true,
};

/**
 * throw error
 * @param {!Object} e - Error
 * @throws
 */
const throwErr = e => {
  throw e;
};

/**
 * is string
 * @param {*} o - object to check
 * @returns {boolean} - result
 */
const isString = o => typeof o === "string" || o instanceof String;

/**
 * is tab
 * @param {*} tabId - tab ID
 * @returns {boolean} - result
 */
const isTab = async tabId => {
  let tab;
  if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
    tab = await tabs.get(tabId).catch(throwErr);
  }
  return !!tab;
};

/**
 * get active tab
 * @returns {Object} - tabs.Tab
 */
const getActiveTab = async () => {
  const arr = await tabs.query({active: true});
  let tab;
  if (arr.length) {
    [tab] = arr;
  }
  return tab || null;
};

/**
 * get active tab ID
 * @returns {number} - tab ID
 */
const getActiveTabId = async () => {
  let tabId;
  const tab = await getActiveTab();
  if (tab) {
    tabId = tab.id;
  }
  return tabId;
};

/**
 * get all tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
const getAllTabsInfo = async menuItemId => {
  const tabsInfo = [];
  const arr = await tabs.query({currentWindow: true});
  const {mimeType} = vars;
  arr.length && arr.forEach(tab => {
    const {id, title, url} = tab;
    tabsInfo.push({
      id, menuItemId, mimeType, title, url,
      content: title,
    });
  });
  return tabsInfo;
};

/* enabled tabs collection */
const enabledTabs = new Map();

/* formats */
const formats = {
  [HTML]: true,
  [MARKDOWN]: true,
  [BBCODE_TEXT]: true,
  [BBCODE_URL]: true,
  [TEXTILE]: true,
  [ASCIIDOC]: true,
  [MEDIAWIKI]: true,
  [JIRA]: true,
  [REST]: true,
  [TEXT]: true,
};

/* format title */
const formatTitle = {
  [BBCODE_TEXT]: `${BBCODE} (${TEXT})`,
  [BBCODE_URL]: `${BBCODE} (URL)`,
};

/* context menu items */
const menuItems = {
  [COPY_PAGE]: {
    id: COPY_PAGE,
    contexts: ["all"],
    title: i18n.getMessage(COPY_PAGE),
  },
  [COPY_LINK]: {
    id: COPY_LINK,
    contexts: ["link"],
    title: i18n.getMessage(COPY_LINK),
  },
  [COPY_TAB]: {
    id: COPY_TAB,
    contexts: ["tab"],
    title: i18n.getMessage(COPY_TAB),
  },
  [COPY_ALL_TABS]: {
    id: COPY_ALL_TABS,
    contexts: ["tab"],
    title: i18n.getMessage(COPY_ALL_TABS),
  },
};

/**
 * toggle page contexts
 * @returns {void}
 */
const togglePageContexts = async () => {
  const {hideOnLink} = vars;
  menuItems[COPY_PAGE].contexts = hideOnLink && ["page"] || ["all"];
};

/**
 * create context menu item
 * @param {string} id - menu item ID
 * @param {string} title - menu item title
 * @param {Object} data - context data
 * @returns {void}
 */
const createMenuItem = async (id, title, data = {}) => {
  const {contexts, enabled, parentId} = data;
  const {isWebExt} = vars;
  if (isString(id) && isString(title) && Array.isArray(contexts)) {
    const opt = {
      id, contexts, title,
      enabled: !!enabled,
    };
    parentId && (opt.parentId = parentId);
    if (contexts.includes("tab")) {
      isWebExt && contextMenus.create(opt);
    } else {
      contextMenus.create(opt);
    }
  }
};

/**
 * create context menu items
 * @returns {Promise.<Array>} - results of each handler
 */
const createContextMenu = async () => {
  const func = [];
  const items = Object.keys(menuItems);
  const formatItems = Object.keys(formats);
  for (const item of items) {
    const {contexts, id, title} = menuItems[item];
    const enabled = false;
    const itemData = {contexts, enabled};
    func.push(createMenuItem(id, title, itemData));
    for (const format of formatItems) {
      if (formats[format]) {
        const subItemId = `${id}${format}`;
        const subItemTitle = formatTitle[format] || format;
        const subItemData = {
          contexts, enabled,
          parentId: id,
        };
        func.push(createMenuItem(subItemId, subItemTitle, subItemData));
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
const updateContextMenu = async tabId => {
  const {isWebExt} = vars;
  const enabled = enabledTabs.get(tabId) || false;
  const items = Object.keys(menuItems);
  const formatItems = Object.keys(formats);
  const func = [];
  for (const item of items) {
    const {contexts, id} = menuItems[item];
    if (contexts.includes("tab")) {
      isWebExt && func.push(contextMenus.update(id, {enabled}));
    } else {
      func.push(contextMenus.update(id, {contexts, enabled}));
    }
    for (const format of formatItems) {
      if (formats[format]) {
        const subItemId = `${id}${format}`;
        if (contexts.includes("tab")) {
          isWebExt && func.push(contextMenus.update(subItemId, {enabled}));
        } else {
          func.push(contextMenus.update(subItemId, {enabled}));
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * set icon
 * @returns {Promise.<Array>} - results of each handler
 */
const setIcon = async () => {
  const {enabled, iconId} = vars;
  const name = await i18n.getMessage(EXT_NAME);
  const icon = await runtime.getURL(ICON);
  const path = enabled && `${icon}${iconId}` || `${icon}#off`;
  const title = `${name} (${KEY})`;
  return Promise.all([
    browserAction.setIcon({path}),
    browserAction.setTitle({title}),
  ]);
};

/**
 * toggle enabled
 * @param {boolean} enabled - enabled
 * @returns {void}
 */
const toggleEnabled = async (enabled = false) => {
  enabled && (vars.enabled = !!enabled);
  if (!vars.enabled) {
    for (const [, value] of enabledTabs) {
      vars.enabled = !!value;
      if (vars.enabled) {
        break;
      }
    }
  }
};

/**
 * set enabled tab
 * @param {number} tabId - tab ID
 * @param {Object} tab - tabs.Tab
 * @param {Object} data - context info
 * @returns {Object} - tab ID info
 */
const setEnabledTab = async (tabId, tab, data = {}) => {
  const {enabled} = data;
  const info = {tabId, enabled};
  if (tab || await isTab(tabId)) {
    enabledTabs.set(tabId, !!enabled);
    await toggleEnabled(enabled);
  }
  return info;
};

/**
 * remove enabled tab
 * @param {number} tabId - tab ID
 * @returns {Promise.<Array>} - results of each handler
 */
const removeEnabledTab = async tabId => {
  const func = [];
  if (tabId && enabledTabs.has(tabId)) {
    const bool = enabledTabs.delete(tabId);
    if (bool) {
      const id = await getActiveTabId();
      vars.enabled = false;
      await toggleEnabled();
      func.push(setIcon(), updateContextMenu(id));
    }
  }
  return Promise.all(func);
};

/* context info */
const contextInfo = {
  isLink: false,
  content: null,
  title: null,
  url: null,
  canonicalUrl: null,
};

/**
 * init context info
 * @returns {Object} - context info
 */
const initContextInfo = async () => {
  contextInfo.isLink = false;
  contextInfo.content = null;
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
const updateContextInfo = async (data = {}) => {
  await initContextInfo();
  const {contextInfo: info} = data;
  const items = Object.keys(info);
  if (items && items.length) {
    for (const item of items) {
      const obj = info[item];
      contextInfo[item] = obj;
    }
  }
  return contextInfo;
};

/**
 * extract clicked data
 * @param {Object} data - clicked data
 * @returns {Promise.<Array>} - results of each handler
 */
const extractClickedData = async (data = {}) => {
  const {info, tab} = data;
  const {id: tabId, title: tabTitle, url: tabUrl} = tab;
  const func = [];
  if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
    const {menuItemId, selectionText} = info;
    const {mimeType, promptContent} = vars;
    const {
      canonicalUrl,
      content: contextContent, title: contextTitle, url: contextUrl,
    } = contextInfo;
    const {hash: tabUrlHash} = new URL(tabUrl);
    let allTabs, content, title, url;
    switch (menuItemId) {
      case `${COPY_LINK}${ASCIIDOC}`:
      case `${COPY_LINK}${BBCODE_TEXT}`:
      case `${COPY_LINK}${HTML}`:
      case `${COPY_LINK}${JIRA}`:
      case `${COPY_LINK}${MARKDOWN}`:
      case `${COPY_LINK}${MEDIAWIKI}`:
      case `${COPY_LINK}${REST}`:
      case `${COPY_LINK}${TEXT}`:
      case `${COPY_LINK}${TEXTILE}`:
        content = selectionText || contextContent || contextTitle;
        title = contextTitle;
        url = contextUrl;
        break;
      case `${COPY_PAGE}${ASCIIDOC}`:
      case `${COPY_PAGE}${BBCODE_TEXT}`:
      case `${COPY_PAGE}${HTML}`:
      case `${COPY_PAGE}${JIRA}`:
      case `${COPY_PAGE}${MARKDOWN}`:
      case `${COPY_PAGE}${MEDIAWIKI}`:
      case `${COPY_PAGE}${REST}`:
      case `${COPY_PAGE}${TEXT}`:
      case `${COPY_PAGE}${TEXTILE}`:
      case `${COPY_TAB}${ASCIIDOC}`:
      case `${COPY_TAB}${BBCODE_TEXT}`:
      case `${COPY_TAB}${HTML}`:
      case `${COPY_TAB}${JIRA}`:
      case `${COPY_TAB}${MARKDOWN}`:
      case `${COPY_TAB}${MEDIAWIKI}`:
      case `${COPY_TAB}${REST}`:
      case `${COPY_TAB}${TEXT}`:
      case `${COPY_TAB}${TEXTILE}`:
        content = selectionText || tabTitle;
        title = tabTitle;
        url = !tabUrlHash && canonicalUrl || tabUrl;
        break;
      case `${COPY_LINK}${BBCODE_URL}`:
        content = contextUrl;
        url = contextUrl;
        break;
      case `${COPY_PAGE}${BBCODE_URL}`:
      case `${COPY_TAB}${BBCODE_URL}`:
        content = !tabUrlHash && canonicalUrl || tabUrl;
        url = !tabUrlHash && canonicalUrl || tabUrl;
        break;
      case `${COPY_ALL_TABS}${ASCIIDOC}`:
      case `${COPY_ALL_TABS}${BBCODE_TEXT}`:
      case `${COPY_ALL_TABS}${BBCODE_URL}`:
      case `${COPY_ALL_TABS}${HTML}`:
      case `${COPY_ALL_TABS}${JIRA}`:
      case `${COPY_ALL_TABS}${MARKDOWN}`:
      case `${COPY_ALL_TABS}${MEDIAWIKI}`:
      case `${COPY_ALL_TABS}${REST}`:
      case `${COPY_ALL_TABS}${TEXT}`:
      case `${COPY_ALL_TABS}${TEXTILE}`:
        allTabs = await getAllTabsInfo(menuItemId);
        break;
      default:
    }
    if (allTabs) {
      func.push(tabs.sendMessage(tabId, {
        [EXEC_COPY_TABS]: {allTabs},
      }));
    } else {
      func.push(tabs.sendMessage(tabId, {
        [EXEC_COPY]: {
          content, menuItemId, mimeType, promptContent, title, url,
        },
      }));
    }
    func.push(initContextInfo());
  }
  return Promise.all(func);
};

/**
 * handle active tab
 * @param {Object} info - active tab info
 * @returns {Promise.<Array>} - results of each handler
 */
const handleActiveTab = async (info = {}) => {
  const {tabId} = info;
  const func = [];
  if (await isTab(tabId)) {
    const {enabled} = vars;
    enabled ?
      func.push(browserAction.enable(tabId)) :
      func.push(browserAction.disable(tabId));
    func.push(setIcon(), updateContextMenu(tabId));
  }
  return Promise.all(func);
};

/**
 * handle updated tab
 * @param {number} tabId - tab ID
 * @param {Object} tab - tab.Tab
 * @returns {?AsyncFunction} - handle active tab
 */
const handleUpdatedTab = async (tabId, tab = {}) => {
  const {active} = tab;
  const func = active && handleActiveTab({tabId});
  return func || null;
};

/**
 * handle message
 * @param {*} msg - message
 * @param {Object} sender - sender
 * @returns {Promise.<Array>} - results of each handler
 */
const handleMsg = async (msg, sender = {}) => {
  const func = [];
  const items = msg && Object.keys(msg);
  const tab = sender && sender.tab;
  const tabId = tab && tab.id;
  if (items && items.length) {
    for (const item of items) {
      const obj = msg[item];
      switch (item) {
        case EXEC_COPY:
          func.push(runtime.sendMessage({
            [EXEC_COPY_POPUP]: obj,
          }));
          break;
        case EXEC_COPY_TABS:
          func.push(runtime.sendMessage({
            [EXEC_COPY_TABS_POPUP]: obj,
          }));
          break;
        case "keydown":
        case "mousedown":
          func.push(updateContextInfo(obj));
          break;
        case "load":
          func.push(
            setEnabledTab(tabId, tab, obj).then(handleActiveTab),
            updateContextInfo(obj)
          );
          break;
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
const setVar = async (item, obj, changed = false) => {
  const func = [];
  if (item && obj) {
    const {checked, value} = obj;
    switch (item) {
      case ASCIIDOC:
      case BBCODE_TEXT:
      case BBCODE_URL:
      case HTML:
      case JIRA:
      case MARKDOWN:
      case MEDIAWIKI:
      case REST:
      case TEXT:
      case TEXTILE:
        formats[item] = !!checked;
        changed &&
          func.push(contextMenus.removeAll().then(createContextMenu));
        break;
      case HIDE_ON_LINK:
        vars[item] = !!checked;
        if (changed) {
          func.push(
            togglePageContexts().then(getActiveTabId).then(updateContextMenu)
          );
        } else {
          func.push(togglePageContexts());
        }
        break;
      case ICON_AUTO:
      case ICON_BLACK:
      case ICON_COLOR:
      case ICON_GRAY:
      case ICON_WHITE:
        if (checked) {
          vars.iconId = value;
          changed && func.push(setIcon());
        }
        break;
      case OUTPUT_HYPER:
      case OUTPUT_PLAIN:
        if (checked) {
          vars.mimeType = value;
        }
        break;
      case PROMPT:
        vars[item] = !!checked;
        break;
      default:
    }
  }
  return Promise.all(func);
};

/**
 * set variables
 * @param {Object} data - storage data
 * @returns {Promise.<Array>} - results of each handler
 */
const setVars = async (data = {}) => {
  const func = [];
  const items = Object.keys(data);
  if (items.length) {
    for (const item of items) {
      const obj = data[item];
      const {newValue} = obj;
      func.push(setVar(item, newValue || obj, !!newValue));
    }
  }
  return Promise.all(func);
};

/* listeners */
storage.onChanged.addListener(data =>
  setVars(data).then(setIcon).catch(throwErr)
);
contextMenus.onClicked.addListener((info, tab) =>
  extractClickedData({info, tab}).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
tabs.onActivated.addListener(info =>
  handleActiveTab(info).catch(throwErr)
);
tabs.onRemoved.addListener(tabId =>
  removeEnabledTab(tabId).catch(throwErr)
);
tabs.onUpdated.addListener((tabId, info, tab) =>
  handleUpdatedTab(tabId, tab).catch(throwErr)
);

/* startup */
storage.local.get().then(setVars).then(() => Promise.all([
  setIcon(),
  createContextMenu(),
])).catch(throwErr);
