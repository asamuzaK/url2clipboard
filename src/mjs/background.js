/**
 * background.js
 */

import {
  BBCODE_URL, COPY_ALL_TABS, COPY_LINK, COPY_PAGE, COPY_TAB, EXEC_COPY,
  EXEC_COPY_POPUP, EXEC_COPY_TABS, EXEC_COPY_TABS_POPUP, EXT_NAME, HTML,
  ICON, ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_DARK_ID, ICON_LIGHT,
  ICON_LIGHT_ID, ICON_WHITE, INCLUDE_TITLE_HTML, INCLUDE_TITLE_MARKDOWN, KEY,
  MARKDOWN, MIME_HTML, MIME_PLAIN, OUTPUT_HTML_HYPER, OUTPUT_HTML_PLAIN,
  OUTPUT_TEXT, OUTPUT_TEXT_AND_URL, OUTPUT_TEXT_TEXT, OUTPUT_TEXT_TEXT_URL,
  OUTPUT_TEXT_URL, OUTPUT_URL, PATH_FORMAT_DATA, PROMPT, THEME_DARK,
  THEME_LIGHT, WEBEXT_ID,
} from "./constant.js";
import {getType, isObjectNotEmpty, isString, throwErr} from "./common.js";
import {
  fetchData, getActiveTabId, getAllStorage, getAllTabsInWindow, getEnabledTheme,
  getManifestIcons, isTab, sendMessage,
} from "./browser.js";

/* api */
const {
  browserAction, contextMenus, i18n, management, runtime, storage, tabs,
} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;
const WEBEXT_TST = "treestyletab@piro.sakura.ne.jp";

/* variables */
const vars = {
  iconId: "",
  includeTitleHtml: false,
  includeTitleMarkdown: false,
  isWebExt: runtime.id === WEBEXT_ID,
  mimeType: MIME_PLAIN,
  promptContent: false,
  textOutput: OUTPUT_TEXT_AND_URL,
};

/* external extensions */
const externalExts = new Set();

/**
 * remove external extension
 * @param {string} id - extension ID
 * @returns {void}
 */
const removeExternalExt = async id => {
  id && externalExts.has(id) && externalExts.delete(id);
};

/**
 * add external extension
 * @param {string} id - extension ID
 * @returns {void}
 */
const addExternalExt = async id => {
  const exts = [WEBEXT_TST];
  id && exts.includes(id) && externalExts.add(id);
};

/**
 * set external extensions
 * @returns {Promise.<Array>} - results of each handler
 */
const setExternalExts = async () => {
  const items = await management.getAll();
  const func = [];
  for (const item of items) {
    const {enabled, id} = item;
    if (enabled) {
      func.push(addExternalExt(id));
    } else {
      func.push(removeExternalExt(id));
    }
  }
  return Promise.all(func);
};

/** send message
 * @param {number|string} id - tabId or extension ID
 * @param {*} msg - message
 * @param {Object} opt - options
 * @returns {Promise.<Array>} - results of each handler
 */
const sendMsg = async (id, msg, opt) => {
  const func = [];
  if (msg) {
    opt = isObjectNotEmpty(opt) && opt || null;
    if (Number.isInteger(id) && id !== TAB_ID_NONE) {
      func.push(sendMessage(id, msg, opt));
    } else if (id && isString(id)) {
      const ext = await management.get(id);
      if (ext) {
        const {enabled} = ext;
        if (enabled) {
          func.push(sendMessage(id, msg, opt));
          !externalExts.has(id) && func.push(addExternalExt(id));
        } else {
          func.push(removeExternalExt(id));
        }
      } else {
        func.push(removeExternalExt(id));
      }
    } else {
      func.push(sendMessage(null, msg, opt));
    }
  }
  return Promise.all(func);
};

/* formats */
const formats = new Map();

/* enabled formats */
const enabledFormats = new Set();

/**
 * toggle enabled formats
 * @param {string} id - format id
 * @param {boolean} enabled - format is enabled
 * @returns {void}
 */
const toggleEnabledFormats = async (id, enabled) => {
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
  if (formats.has(id)) {
    if (enabled) {
      enabledFormats.add(id);
    } else {
      enabledFormats.delete(id);
    }
  }
};

/**
 * fetch format data
 * @returns {Promise.<Array>} - result of each handler
 */
const fetchFormatData = async () => {
  const data = await fetchData(PATH_FORMAT_DATA);
  const func = [];
  if (data) {
    const items = Object.entries(data);
    for (const item of items) {
      const [key, value] = item;
      const {enabled} = value;
      formats.set(key, value);
      func.push(toggleEnabledFormats(key, enabled));
    }
  }
  return Promise.all(func);
};

/**
 * get format item from menu item ID
 * @param {string} id - menu item id
 * @returns {Object} - format item
 */
const getFormatItemFromId = async id => {
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
  }
  return item || null;
};

/**
 * get format template
 * @param {string} id - menu item ID
 * @returns {string} - template
 */
const getFormatTemplate = async id => {
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
      includeTitleHtml, includeTitleMarkdown, mimeType, textOutput,
    } = vars;
    switch (itemId) {
      case HTML:
        template = includeTitleHtml && itemTmpl || itemTmplWoTitle;
        if (mimeType === MIME_HTML) {
          template = `${template}<br />`;
        }
        break;
      case MARKDOWN:
        template = includeTitleMarkdown && itemTmpl || itemTmplWoTitle;
        break;
      default:
        if (textOutput === OUTPUT_TEXT) {
          template = itemTmpl.replace(/%url%/g, "").trim();
        } else if (textOutput === OUTPUT_URL) {
          template = itemTmpl.replace(/%content%/g, "").trim();
        } else {
          template = itemTmpl;
        }
    }
  }
  return template || null;
};

/* enabled tabs collection */
const enabledTabs = new Map();

/* context menu items */
const menuItems = {
  [COPY_PAGE]: {
    id: COPY_PAGE,
    contexts: ["page", "selection"],
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
 * remove context menu
 * @returns {Promise.<Array>} - results of each handler
 */
const removeContextMenu = async () => {
  const func = [contextMenus.removeAll()];
  // Tree Style Tab
  if (externalExts.has(WEBEXT_TST)) {
    func.push(sendMsg(WEBEXT_TST, {
      type: "fake-contextMenu-removeAll",
    }));
  }
  return Promise.all(func);
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
  if (enabledFormats.size) {
    const items = Object.keys(menuItems);
    for (const item of items) {
      const {contexts, id: itemId, title: itemTitle} = menuItems[item];
      const enabled = false;
      const itemData = {contexts, enabled};
      if (enabledFormats.size === 1) {
        const [key] = enabledFormats.keys();
        const {id: keyId, title: keyTitle} = formats.get(key);
        const formatTitle =
          i18n.getMessage(`${itemId}_format`, keyTitle || keyId);
        func.push(createMenuItem(`${itemId}${key}`, formatTitle, itemData));
      } else {
        func.push(createMenuItem(itemId, itemTitle, itemData));
        formats.forEach((value, key) => {
          const {
            enabled: formatEnabled, id: formatId, title: formatTitle,
          } = value;
          if (formatEnabled) {
            const subItemId = `${itemId}${key}`;
            const subItemTitle = formatTitle || formatId;
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
const updateContextMenu = async tabId => {
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
          // Tree Style Tab
          if (externalExts.has(WEBEXT_TST)) {
            func.push(sendMsg(WEBEXT_TST, {
              type: "fake-contextMenu-update",
              params: [itemId, {enabled}],
            }));
          }
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
              // Tree Style Tab
              if (externalExts.has(WEBEXT_TST)) {
                func.push(sendMsg(WEBEXT_TST, {
                  type: "fake-contextMenu-update",
                  params: [subItemId, {enabled}],
                }));
              }
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
 * set icon
 * @returns {Promise.<Array>} - results of each handler
 */
const setIcon = async () => {
  const {iconId} = vars;
  const name = await i18n.getMessage(EXT_NAME);
  const icon = await runtime.getURL(ICON);
  const path = iconId && `${icon}${iconId}` || icon;
  const title = `${name} (${KEY})`;
  return Promise.all([
    browserAction.setIcon({path}),
    browserAction.setTitle({title}),
  ]);
};

/**
 * set default icon
 * @returns {void}
 */
const setDefaultIcon = async () => {
  const items = await getEnabledTheme();
  if (Array.isArray(items) && items.length) {
    for (const item of items) {
      const {id: themeId} = item;
      switch (themeId) {
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
  }
  return info;
};

/**
 * remove enabled tab
 * @param {number} tabId - tab ID
 * @returns {?AsyncFunction} - updateContextMenu()
 */
const removeEnabledTab = async tabId => {
  let func;
  if (tabId && enabledTabs.has(tabId)) {
    const bool = enabledTabs.delete(tabId);
    if (bool) {
      const id = await getActiveTabId();
      if (Number.isInteger(id)) {
        func = updateContextMenu(id);
      }
    }
  }
  return func || null;
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
 * get all tabs info
 * @param {string} menuItemId - menu item ID
 * @returns {Array} - tabs info
 */
const getAllTabsInfo = async menuItemId => {
  const tabsInfo = [];
  const arr = await getAllTabsInWindow();
  const {mimeType} = vars;
  const template = await getFormatTemplate(menuItemId);
  arr.length && arr.forEach(tab => {
    const {id, title, url} = tab;
    tabsInfo.push({
      id, menuItemId, mimeType, template, title, url,
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
const extractClickedData = async (info, tab) => {
  const {id: tabId, title: tabTitle, url: tabUrl} = tab;
  const func = [];
  if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
    const {menuItemId, selectionText} = info;
    const {
      includeTitleHtml, includeTitleMarkdown, mimeType, promptContent,
    } = vars;
    const {
      canonicalUrl,
      content: contextContent, title: contextTitle, url: contextUrl,
    } = contextInfo;
    const {hash: tabUrlHash} = new URL(tabUrl);
    if (isString(menuItemId) && menuItemId.startsWith(COPY_ALL_TABS)) {
      const allTabs = await getAllTabsInfo(menuItemId);
      func.push(sendMsg(tabId, {
        [EXEC_COPY_TABS]: {
          allTabs, includeTitleHtml, includeTitleMarkdown,
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
          content = selectionText || contextContent || contextTitle;
          title = contextTitle;
          url = contextUrl;
        }
      } else if (menuItemId.startsWith(COPY_PAGE) ||
                 menuItemId.startsWith(COPY_TAB)) {
        if (menuItemId === `${COPY_PAGE}${BBCODE_URL}` ||
            menuItemId === `${COPY_TAB}${BBCODE_URL}`) {
          content = !tabUrlHash && canonicalUrl || tabUrl;
          url = !tabUrlHash && canonicalUrl || tabUrl;
        } else {
          content = selectionText || tabTitle;
          title = tabTitle;
          url = !tabUrlHash && canonicalUrl || tabUrl;
        }
      }
      func.push(sendMsg(tabId, {
        [EXEC_COPY]: {
          content, includeTitleHtml, includeTitleMarkdown, menuItemId,
          mimeType, promptContent, template, title, url,
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
 * @returns {?AsyncFunction} - updateContextMenu()
 */
const handleActiveTab = async (info = {}) => {
  const {tabId} = info;
  let func;
  if (await isTab(tabId)) {
    func = updateContextMenu(tabId);
  }
  return func || null;
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
 * handle external extension
 * @returns {Promise.<Array>} - results of each handler
 */
const handleExternalExts = async () => {
  const func = [];
  // Tree Style Tab
  if (externalExts.has(WEBEXT_TST)) {
    func.push(sendMsg(WEBEXT_TST, {
      type: "register-self",
      name: i18n.getMessage(EXT_NAME),
      icons: getManifestIcons(),
      listeningTypes: ["ready", "fake-contextMenu-click"],
    }));
    if (enabledFormats.size) {
      const items = Object.keys(menuItems);
      for (const item of items) {
        const {contexts, id: itemId, title: itemTitle} = menuItems[item];
        const enabled = false;
        if (contexts.includes("tab")) {
          if (enabledFormats.size === 1) {
            const [key] = enabledFormats.keys();
            const {id: keyId, title: keyTitle} = formats.get(key);
            const formatTitle =
              i18n.getMessage(`${itemId}_format`, keyTitle || keyId);
            func.push(sendMsg(WEBEXT_TST, {
              type: "fake-contextMenu-create",
              params: {
                enabled,
                id: `${itemId}${key}`,
                title: formatTitle,
                contexts: ["tab"],
              },
            }));
          } else {
            func.push(sendMsg(WEBEXT_TST, {
              type: "fake-contextMenu-create",
              params: {
                enabled,
                id: itemId,
                title: itemTitle,
                contexts: ["tab"],
              },
            }));
            formats.forEach((value, key) => {
              const {
                enabled: formatEnabled, id: formatId, title: formatTitle,
              } = value;
              if (formatEnabled) {
                const subItemId = `${itemId}${key}`;
                const subItemTitle = formatTitle || formatId;
                func.push(sendMsg(WEBEXT_TST, {
                  type: "fake-contextMenu-create",
                  params: {
                    enabled,
                    id: subItemId,
                    title: subItemTitle,
                    contexts: ["tab"],
                    parentId: itemId,
                  },
                }));
              }
            });
          }
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * prepare menu
 * @returns {Promise.<Array>} - results of each handler
 */
const prepareContextMenu = () => Promise.all([
  createContextMenu(),
  handleExternalExts(),
]);

/**
 * prepare UI
 * @returns {Promise.<Array>} - results of each handler
 */
const prepareUI = async () => Promise.all([
  setIcon(),
  prepareContextMenu(),
]);

/**
 * handle message
 * @param {*} msg - message
 * @param {Object} sender - sender
 * @returns {Promise.<Array>} - results of each handler
 */
const handleMsg = async (msg, sender = {}) => {
  const {id: senderId} = sender;
  const func = [];
  // Tree Style Tab
  if (senderId === WEBEXT_TST) {
    const {info, tab, type} = msg;
    switch (type) {
      case "ready": {
        func.push(addExternalExt(WEBEXT_TST).then(handleExternalExts));
        break;
      }
      case "fake-contextMenu-click": {
        func.push(extractClickedData(info, tab));
        break;
      }
      default:
    }
  } else {
    const items = msg && Object.keys(msg);
    const tab = sender && sender.tab;
    const tabId = tab && tab.id;
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case EXEC_COPY:
            func.push(sendMsg(null, {
              [EXEC_COPY_POPUP]: obj,
            }));
            break;
          case EXEC_COPY_TABS:
            func.push(sendMsg(null, {
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
              updateContextInfo(obj),
            );
            break;
          default:
        }
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
      case ICON_AUTO:
      case ICON_BLACK:
      case ICON_COLOR:
      case ICON_DARK:
      case ICON_LIGHT:
      case ICON_WHITE:
        if (checked) {
          vars.iconId = value;
          changed && func.push(setIcon());
        }
        break;
      case INCLUDE_TITLE_HTML:
      case INCLUDE_TITLE_MARKDOWN:
      case PROMPT:
        vars[item] = !!checked;
        break;
      case OUTPUT_HTML_HYPER:
      case OUTPUT_HTML_PLAIN:
        if (checked) {
          vars.mimeType = value;
        }
        break;
      case OUTPUT_TEXT_TEXT_URL:
      case OUTPUT_TEXT_TEXT:
      case OUTPUT_TEXT_URL:
        if (checked) {
          vars.textOutput = value;
        }
        break;
      default: {
        if (formats.has(item)) {
          const formatItem = formats.get(item);
          formatItem.enabled = !!checked;
          formats.set(item, formatItem);
          if (changed) {
            func.push(
              toggleEnabledFormats(item, !!checked).then(removeContextMenu)
                .then(prepareContextMenu)
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
contextMenus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
storage.onChanged.addListener(data =>
  setVars(data).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
runtime.onMessageExternal.addListener((msg, sender) =>
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
Promise.all([
  fetchFormatData(),
  setDefaultIcon(),
  setExternalExts(),
]).then(getAllStorage).then(setVars).then(prepareUI).catch(throwErr);
