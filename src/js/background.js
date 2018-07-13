/**
 * background.js
 */
"use strict";
{
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
  const INCLUDE_TITLE_HTML = "includeTitleHtml";
  const INCLUDE_TITLE_MARKDOWN = "includeTitleMarkdown";
  const KEY = "Alt+Shift+C";
  const MIME_HTML = "text/html";
  const MIME_PLAIN = "text/plain";
  const OUTPUT_HYPER = "outputTextHtml";
  const OUTPUT_PLAIN = "outputTextPlain";
  const PATH_FORMAT_DATA = "data/format.json";
  const PROMPT = "promptContent";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;
  const WEBEXT_ID = "url2clipboard@asamuzak.jp";

  const BBCODE_URL = "BBCodeURL";
  const HTML = "HTML";
  const MARKDOWN = "Markdown";

  /* variables */
  const vars = {
    enabled: false,
    hideOnLink: false,
    iconId: "#context",
    includeTitleHtml: true,
    includeTitleMarkdown: true,
    isWebExt: runtime.id === WEBEXT_ID,
    mimeType: MIME_PLAIN,
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
   * get type
   * @param {*} o - object to check
   * @returns {string} - type of object
   */
  const getType = o =>
    Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);

  /**
   * is string
   * @param {*} o - object to check
   * @returns {boolean} - result
   */
  const isString = o => typeof o === "string" || o instanceof String;

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
    const path = await runtime.getURL(PATH_FORMAT_DATA);
    const data = await fetch(path).then(res => res && res.json());
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
        id: itemId, template: itemTmpl,
        templateWithoutTitle: itemTmplWoTitle,
      } = item;
      const {includeTitleHtml, includeTitleMarkdown, mimeType} = vars;
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
          template = itemTmpl;
      }
    }
    return template || null;
  };

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

  /* enabled tabs collection */
  const enabledTabs = new Map();

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
    menuItems[COPY_PAGE].contexts =
      hideOnLink && ["page", "selection"] || ["all"];
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
          isWebExt && func.push(contextMenus.update(itemId, {enabled}));
        } else {
          func.push(contextMenus.update(itemId, {contexts, enabled}));
        }
        formats.forEach((value, key) => {
          const {enabled: formatEnabled} = value;
          if (formatEnabled) {
            const subItemId = `${itemId}${key}`;
            if (contexts.includes("tab")) {
              isWebExt && func.push(contextMenus.update(subItemId, {enabled}));
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
        func.push(tabs.sendMessage(tabId, {
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
        func.push(tabs.sendMessage(tabId, {
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
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleActiveTab = async (info = {}) => {
    const {tabId} = info;
    const func = [];
    if (await isTab(tabId)) {
      const {enabled} = vars;
      if (enabled) {
        func.push(browserAction.enable(tabId));
      } else {
        func.push(browserAction.disable(tabId));
      }
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
        case INCLUDE_TITLE_HTML:
        case INCLUDE_TITLE_MARKDOWN:
        case PROMPT:
          vars[item] = !!checked;
          break;
        case OUTPUT_HYPER:
        case OUTPUT_PLAIN:
          if (checked) {
            vars.mimeType = value;
          }
          break;
        default: {
          if (formats.has(item)) {
            const formatItem = formats.get(item);
            formatItem.enabled = !!checked;
            formats.set(item, formatItem);
            if (changed) {
              func.push(
                toggleEnabledFormats(item, !!checked)
                  .then(() => contextMenus.removeAll())
                  .then(createContextMenu)
              );
            } else {
              func.push(toggleEnabledFormats(item, !!checked));
            }
          }
          break;
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
    extractClickedData({info, tab}).catch(throwErr)
  );
  storage.onChanged.addListener(data =>
    setVars(data).then(setIcon).catch(throwErr)
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
  fetchFormatData().then(() => storage.local.get()).then(setVars).then(() =>
    Promise.all([
      setIcon(),
      createContextMenu(),
    ])
  ).catch(throwErr);
}
