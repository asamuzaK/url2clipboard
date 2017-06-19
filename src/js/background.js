/**
 * background.js
 */
"use strict";
{
  /* api */
  const {browserAction, contextMenus, extension, i18n, runtime, tabs} = browser;

  /* constants */
  const CLIPBOARD = "js/clipboard.js";
  const COPY_LINK = "copyLinkURL";
  const COPY_PAGE = "copyPageURL";
  const COPY_TABS = "copyTabsURL";
  const EXEC_COPY = "executeCopy";
  const EXT_NAME = "extensionName";
  const FUNC_CLIPBOARD = "copyToClipboard";
  const FUNC_PROMPT = "editContent";
  const ICON = "img/icon.svg";
  const KEY = "Alt+Shift+C";
  const MENU_ITEM_ID = "menuItemId";

  const BBCODE = "BBCode";
  const BBCODE_TEXT = "BBCodeText";
  const BBCODE_URL = "BBCodeURL";
  const HTML = "HTML";
  const MARKDOWN = "Markdown";
  const TEXT = "Text";

  /**
   * log error
   * @param {!Object} e - Error
   * @returns {boolean} - false
   */
  const logError = e => {
    console.error(e);
    return false;
  };

  /**
   * is string
   * @param {*} o - object to check
   * @returns {boolean} - result
   */
  const isString = o => typeof o === "string" || o instanceof String;

  /**
   * stringify positive integer
   * @param {number} i - integer
   * @param {boolean} zero - treat 0 as a positive integer
   * @returns {?string} - stringified integer
   */
  const stringifyPositiveInt = (i, zero = false) =>
    Number.isSafeInteger(i) && (zero && i >= 0 || i > 0) && `${i}` || null;

  /**
   * is tab
   * @param {*} tabId - tab ID
   * @returns {boolean} - result
   */
  const isTab = async tabId => {
    let tab;
    if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
      tab = await tabs.get(tabId).catch(logError);
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

  /* enabled tabs collection */
  const enabledTabs = {};

  /**
   * set enabled tab
   * @param {number} tabId - tab ID
   * @param {Object} tab - tabs.Tab
   * @param {Object} data - context info
   * @returns {Object} - tab ID info
   */
  const setEnabledTab = async (tabId, tab, data = {}) => {
    const {enabled} = data;
    const info = {tabId};
    if (tab || await isTab(tabId)) {
      const id = stringifyPositiveInt(tabId);
      id && (enabledTabs[id] = !!enabled);
    }
    return info;
  };

  /**
   * remove enabled tab
   * @param {number} tabId - tab ID
   * @returns {boolean} - result
   */
  const removeEnabledTab = async tabId => {
    let bool;
    tabId = stringifyPositiveInt(tabId);
    if (tabId && enabledTabs[tabId]) {
      bool = delete enabledTabs[tabId];
    }
    return bool || false;
  };

  /**
   * get all tabs info
   * @returns {Object} - tabs info
   */
  const getAllTabsInfo = async () => {
    const tabsInfo = [];
    const arr = await tabs.query({currentWindow: true});
    arr.length && arr.forEach(tab => {
      const {id, title, url} = tab;
      tabsInfo.push({id, title, url});
    });
    return tabsInfo;
  };

  /**
   * exec copy to clipboard
   * @param {number} tabId - tab ID
   * @param {Object} text - text to copy
   * @returns {?AsyncFunction} - copy to clipboard
   */
  const execCopyToClipboard = async (tabId, text) => {
    let func;
    if (await isTab(tabId) && isString(text)) {
      const [defined] = await tabs.executeScript(tabId, {
        code: `typeof ${FUNC_CLIPBOARD} === "function";`,
      });
      if (!defined) {
        const file = await extension.getURL(CLIPBOARD);
        await tabs.executeScript(tabId, {file});
      }
      text = JSON.stringify({text});
      console.log(text);
      func = tabs.executeScript(tabId, {
        code: `${FUNC_CLIPBOARD}(${text});`,
      });
    }
    return func || null;
  };

  /**
   * send exec copy message
   * @param {Object} data - tab data
   * @returns {?AsyncFunction} - send message
   */
  const sendExecCopy = async (data = {}) => {
    const {info, tab} = data;
    const {id} = tab;
    let func;
    if (Number.isInteger(id) && id !== tabs.TAB_ID_NONE) {
      const {menuItemId, selectionText} = info;
      const msg = {
        [EXEC_COPY]: {
          menuItemId, selectionText,
        },
      };
      func = tabs.sendMessage(id, msg);
    }
    return func || null;
  };

  /**
   * create tab data
   * @param {Object} menuItemId - menuItemId
   * @returns {Object} - tab data
   */
  const createTabData = async menuItemId => {
    const info = isString(menuItemId) && {menuItemId};
    const tab = await getActiveTab();
    return info && tab && {info, tab} || null;
  };

  /* context menu items */
  const menuItems = {
    [COPY_PAGE]: {
      id: COPY_PAGE,
      contexts: ["all"],
      title: i18n.getMessage(COPY_PAGE),
      subItems: {
        [HTML]: {
          id: `${COPY_PAGE}${HTML}`,
          title: HTML,
        },
        [MARKDOWN]: {
          id: `${COPY_PAGE}${MARKDOWN}`,
          title: MARKDOWN,
        },
        [BBCODE_TEXT]: {
          id: `${COPY_PAGE}${BBCODE_TEXT}`,
          title: `${BBCODE} (${TEXT})`,
        },
        [BBCODE_URL]: {
          id: `${COPY_PAGE}${BBCODE_URL}`,
          title: `${BBCODE} (URL)`,
        },
        [TEXT]: {
          id: `${COPY_PAGE}${TEXT}`,
          title: TEXT,
        },
      },
    },
    [COPY_LINK]: {
      id: COPY_LINK,
      contexts: ["link"],
      title: i18n.getMessage(COPY_LINK),
      subItems: {
        [HTML]: {
          id: `${COPY_LINK}${HTML}`,
          title: HTML,
        },
        [MARKDOWN]: {
          id: `${COPY_LINK}${MARKDOWN}`,
          title: MARKDOWN,
        },
        [BBCODE_TEXT]: {
          id: `${COPY_LINK}${BBCODE_TEXT}`,
          title: `${BBCODE} (${TEXT})`,
        },
        [BBCODE_URL]: {
          id: `${COPY_LINK}${BBCODE_URL}`,
          title: `${BBCODE} (URL)`,
        },
        [TEXT]: {
          id: `${COPY_LINK}${TEXT}`,
          title: TEXT,
        },
      },
    },
    [COPY_TABS]: {
      id: COPY_TABS,
      contexts: ["tab"],
      title: i18n.getMessage(COPY_TABS),
      subItems: {
        [HTML]: {
          id: `${COPY_TABS}${HTML}`,
          title: HTML,
        },
        [MARKDOWN]: {
          id: `${COPY_TABS}${MARKDOWN}`,
          title: MARKDOWN,
        },
        [BBCODE_TEXT]: {
          id: `${COPY_TABS}${BBCODE_TEXT}`,
          title: `${BBCODE} (${TEXT})`,
        },
        [BBCODE_URL]: {
          id: `${COPY_TABS}${BBCODE_URL}`,
          title: `${BBCODE} (URL)`,
        },
        [TEXT]: {
          id: `${COPY_TABS}${TEXT}`,
          title: TEXT,
        },
      },
    },
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
    if (isString(id) && isString(title) && Array.isArray(contexts)) {
      const opt = {
        id, contexts, title,
        enabled: !!enabled,
      };
      parentId && (opt.parentId = parentId);
      contextMenus.create(opt);
    }
  };

  /**
   * create context menu items
   * @returns {Promise.<Array>} - results of each handler
   */
  const createContextMenu = async () => {
    const items = Object.keys(menuItems);
    const func = [];
    for (const item of items) {
      const {contexts, id, subItems, title} = menuItems[item];
      const itemData = {
        contexts,
        enabled: false,
      };
      const subMenuItems = Object.keys(subItems);
      func.push(createMenuItem(id, title, itemData));
      for (const subItem of subMenuItems) {
        const {id: subItemId, title: subItemTitle} = subItems[subItem];
        const subItemData = {
          contexts,
          enabled: false,
          parentId: id,
        };
        func.push(createMenuItem(subItemId, subItemTitle, subItemData));
      }
    }
    return Promise.all(func);
  };

  /**
   * update context menu
   * @param {Object} data - context data
   * @returns {Promise.<Array>} - results of each handler
   */
  const updateContextMenu = async (data = {}) => {
    const {enabled} = data;
    const items = Object.keys(menuItems);
    const func = [];
    for (const item of items) {
      const {id, subItems} = menuItems[item];
      const subMenuItems = Object.keys(subItems);
      func.push(contextMenus.update(id, {enabled: !!enabled}));
      for (const subItem of subMenuItems) {
        const {id: subItemId} = subItems[subItem];
        func.push(contextMenus.update(subItemId, {enabled: !!enabled}));
      }
    }
    return Promise.all(func);
  };

  /**
   * show icon
   * @param {boolean} enabled - enabled
   * @returns {Promise.<Array>} - results of each handler
   */
  const showIcon = async (enabled = false) => {
    const name = await i18n.getMessage(EXT_NAME);
    const icon = await extension.getURL(ICON);
    const path = enabled && `${icon}#gray` || `${icon}#off`;
    const title = `${name} (${KEY})`;
    return Promise.all([
      browserAction.setIcon({path}),
      browserAction.setTitle({title}),
    ]);
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
      const enabledTab = await stringifyPositiveInt(tabId);
      const enabled = enabledTab && enabledTabs[enabledTab] || false;
      func.push(
        showIcon(enabled),
        updateContextMenu({enabled})
      );
      enabled && func.push(browserAction.enable(tabId)) ||
      func.push(browserAction.disable(tabId));
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
          case "keydown":
          case "mousedown":
            func.push(updateContextMenu(obj));
            break;
          case "load":
            func.push(
              setEnabledTab(tabId, tab, obj).then(handleActiveTab),
              updateContextMenu(obj)
            );
            break;
          case MENU_ITEM_ID:
            func.push(createTabData(obj).then(sendExecCopy));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /* listeners */
  contextMenus.onClicked.addListener((info, tab) =>
    sendExecCopy({info, tab}).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );
  tabs.onActivated.addListener(info =>
    handleActiveTab(info).catch(logError)
  );
  tabs.onRemoved.addListener(tabId =>
    removeEnabledTab(tabId).catch(logError)
  );
  tabs.onUpdated.addListener((tabId, info, tab) =>
    handleUpdatedTab(tabId, tab).catch(logError)
  );

  /* startup */
  createContextMenu().catch(logError);
}
