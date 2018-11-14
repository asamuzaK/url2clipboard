/**
 * browser.js
 */

import {
  getType, isObjectNotEmpty, isString, logErr, parseVersion, throwErr,
} from "./common.js";

/* api */
const {
  bookmarks, commands, contextualIdentities, management, notifications,
  permissions, runtime, sessions, storage, tabs, windows,
} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;
const IS_CHROMEEXT = typeof runtime.getPackageDirectoryEntry === "function";
const IS_WEBEXT = typeof runtime.getBrowserInfo === "function";
const WEBEXT_ACCKEY_MIN = 63;
const WEBEXT_MENU_VISIBLE_MIN = 63;

/* compat */
/**
 * is accesskey supported in context menu
 * @returns {boolean} - result
 */
export const isAccessKeySupported = async () => {
  let bool;
  if (IS_WEBEXT) {
    const info = await runtime.getBrowserInfo();
    if (isObjectNotEmpty(info)) {
      const {version} = info;
      if (isString(version)) {
        const {major: majorVersion} = await parseVersion(version);
        if (majorVersion >= WEBEXT_ACCKEY_MIN) {
          bool = true;
        }
      }
    }
  } else if (IS_CHROMEEXT) {
    bool = true;
  }
  return !!bool;
};

/**
 * is visible supported in context menu
 * @returns {boolean} - result
 */
export const isVisibleInMenuSupported = async () => {
  let bool;
  if (IS_WEBEXT) {
    const info = await runtime.getBrowserInfo();
    if (isObjectNotEmpty(info)) {
      const {version} = info;
      if (isString(version)) {
        const {major: majorVersion} = await parseVersion(version);
        if (majorVersion >= WEBEXT_MENU_VISIBLE_MIN) {
          bool = true;
        }
      }
    }
  } else if (IS_CHROMEEXT) {
    bool = true;
  }
  return !!bool;
};

/* bookmarks */
/**
 * create bookmark
 * @param {Object} opt - bookmarks.CreateDetails
 * @returns {Object} - bookmarks.BookmarkTreeNode
 */
export const createBookmark = async opt => {
  let node;
  if (bookmarks && isObjectNotEmpty(opt)) {
    node = await bookmarks.create(opt);
  }
  return node || null;
};

/* commands */
/**
 * is command customizable
 * @returns {boolean} - result
 */
export const isCommandCustomizable = () => {
  let bool;
  if (commands) {
    bool = typeof commands.update === "function" &&
           typeof commands.reset === "function";
  }
  return !!bool;
};

/**
 * update command
 * @param {string} id - command ID
 * @param {string} value - key value
 * @returns {?AsyncFunction} - commands.update | commands.reset
 */
export const updateCommand = async (id, value = "") => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  if (!isString(value)) {
    throw new TypeError(`Expected String but got ${getType(value)}.`);
  }
  let func;
  if (isCommandCustomizable()) {
    const shortcut =
      value.trim().replace(/\+([a-z])$/, (m, c) => `+${c.toUpperCase()}`);
    if (shortcut === "") {
      func = commands.reset(id);
    } else if (/^(?:(?:(?:Alt|Command|(?:Mac)?Ctrl)(?:\+Shift)?|Alt\+(?:Command|(?:Mac)?Ctrl)|Command\+(?:Alt|MacCtrl)|Ctrl\+(?:Alt|MacCtrl)|MacCtrl\+(?:Alt|Command|Ctrl))\+(?:[\dA-Z]|F(?:[1-9]|1[0-2])|(?:Page)?(?:Down|Up)|Left|Right|Comma|Period|Home|End|Delete|Insert|Space))|F(?:[1-9]|1[0-2])|Media(?:(?:Next|Prev)Track|PlayPause|Stop)$/.test(shortcut)) {
      func = commands.update({
        shortcut,
        name: id,
      });
    }
  }
  return func || null;
};

/* contextualIdentities */
/**
 * get all contextual identities
 * @returns {?Array} - array of contextualIdentities.ContextualIdentity
 */
export const getAllContextualIdentities = async () => {
  let arr;
  if (contextualIdentities) {
    try {
      arr = await contextualIdentities.query({});
    } catch (e) {
      logErr(e);
    }
  }
  return arr || null;
};

/**
 * get contextual identities
 * @param {string} cookieStoreId - cookie store ID
 * @returns {Object} - contextualIdentities.ContextualIdentity
 */
export const getContextualId = async cookieStoreId => {
  if (!isString(cookieStoreId)) {
    throw new TypeError(`Expected String but got ${getType(cookieStoreId)}.`);
  }
  let id;
  if (contextualIdentities) {
    try {
      id = await contextualIdentities.get(cookieStoreId);
    } catch (e) {
      logErr(e);
    }
  }
  return id || null;
};

/* management */
/**
 * get enabled theme
 * @returns {?Array} - array of management.ExtensionInfo
 */
export const getEnabledTheme = async () => {
  let res;
  if (management) {
    const arr = await management.getAll();
    if (Array.isArray(arr)) {
      res = arr.filter(info =>
        info.type && info.type === "theme" && info.enabled && info
      );
    }
  }
  return res || null;
};

/**
 * get extension info
 * @param {string} id - extension ID
 * @returns {Object} - management.extensionInfo
 */
export const getExtensionInfo = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let ext;
  if (management) {
    ext = await management.get(id);
  }
  return ext || null;
};

/**
 * get external extensions
 * @returns {?Array} -array of management.extensionInfo
 */
export const getExternalExtensions = async () => {
  let res;
  if (management) {
    const arr = await management.getAll();
    if (Array.isArray(arr)) {
      res = arr.filter(info => info.type && info.type === "extension" && info);
    }
  }
  return res || null;
};

/* notifications */
/**
 * clear notification
 * @param {string} id - notification ID
 * @returns {?AsyncFunction} - notifications.clear()
 */
export const clearNotification = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let func;
  if (notifications) {
    func = notifications.clear(id).catch(throwErr);
  }
  return func || null;
};

/**
 * create notification
 * @param {string} id - notification ID
 * @param {Object} opt - options
 * @returns {?AsyncFunction} - notifications.create
 */
export const createNotification = async (id, opt) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let func;
  if (notifications) {
    if (notifications.onClosed &&
        !notifications.onClosed.hasListener(clearNotification)) {
      notifications.onClosed.addListener(clearNotification);
    }
    func = notifications.create(id, opt);
  }
  return func || null;
};

/* permissions */
/**
 * remove permission
 * @param {string|Array} perm - permission
 * @returns {boolean} - result
 */
export const removePermission = async perm => {
  if (!(isString(perm) || Array.isArray(perm))) {
    throw new TypeError(`Expected String or Array but got ${getType(perm)}.`);
  }
  let bool;
  if (isString(perm)) {
    bool = await permissions.remove({
      permissions: [perm],
    });
  } else if (Array.isArray(perm)) {
    bool = await permissions.remove({
      permissions: perm,
    });
  }
  return !!bool;
};

/**
 * request permission
 * @param {string|Array} perm - permission
 * @returns {boolean} - result
 */
export const requestPermission = async perm => {
  if (!(isString(perm) || Array.isArray(perm))) {
    throw new TypeError(`Expected String or Array but got ${getType(perm)}.`);
  }
  let bool;
  if (isString(perm)) {
    bool = await permissions.request({
      permissions: [perm],
    });
  } else if (Array.isArray(perm)) {
    bool = await permissions.request({
      permissions: perm,
    });
  }
  return !!bool;
};

/* runtime */
/**
 * get manifest icons
 * @returns {Object|string} - icons
 */
export const getManifestIcons = () => {
  const {icons} = runtime.getManifest();
  return icons;
};

/**
 * get OS
 * @returns {string} - OS
 */
export const getOs = async () => {
  const {os} = await runtime.getPlatformInfo();
  return os;
};

/**
 * make a connection
 * @param {string} [extId] - extension ID
 * @param {Object} [info] - info
 * @returns {Object} - runtime.Port
 */
export const makeConnection = async (extId, info) => {
  let port;
  if (isString(extId)) {
    if (isObjectNotEmpty(info)) {
      port = await runtime.connect(extId, info);
    } else {
      port = await runtime.connect(extId);
    }
  } else if (isObjectNotEmpty(extId)) {
    port = await runtime.connect(extId);
  } else if (!extId && isObjectNotEmpty(info)) {
    port = await runtime.connect(info);
  } else {
    port = await runtime.connect();
  }
  return port || null;
};

/** send message
 * @param {number|string} id - tabId or extension ID
 * @param {*} msg - message
 * @param {Object} opt - options
 * @returns {?AsyncFunction} - tabs.sendMessage | runtime.sendMessage
 */
export const sendMessage = async (id, msg, opt) => {
  let func;
  if (msg) {
    opt = isObjectNotEmpty(opt) && opt || null;
    if (Number.isInteger(id)) {
      if (id !== TAB_ID_NONE) {
        func = tabs.sendMessage(id, msg, opt);
      }
    } else if (id && isString(id)) {
      func = runtime.sendMessage(id, msg, opt);
    } else {
      func = runtime.sendMessage(runtime.id, msg, opt);
    }
  }
  return func || null;
};

/* sessions */
/**
 * get recently closed tab
 * @param {number} windowId - window ID
 * @returns {Object} - tabs.Tab
 */
export const getRecentlyClosedTab = async windowId => {
  let tab;
  if (sessions) {
    const items = await sessions.getRecentlyClosed();
    if (Array.isArray(items) && items.length) {
      if (!Number.isInteger(windowId)) {
        windowId = windows.WINDOW_ID_CURRENT;
      }
      for (const item of items) {
        const {tab: itemTab} = item;
        if (itemTab) {
          const {windowId: itemWindowId} = itemTab;
          if (itemWindowId === windowId) {
            tab = itemTab;
            break;
          }
        }
      }
    }
  }
  return tab || null;
};

/**
 * get session window value
 * @param {string} key - key
 * @param {number} windowId - window ID
 * @returns {string} - value
 */
export const getSessionWindowValue = async (key, windowId) => {
  if (!isString(key)) {
    throw new TypeError(`Expected String but got ${getType(key)}.`);
  }
  let value;
  if (sessions && typeof sessions.getWindowValue === "function") {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    value = await sessions.getWindowValue(windowId, key);
  }
  return value || null;
};

/**
 * restore session
 * @param {string} sessionId - session ID
 * @returns {Object} - sessions.Session
 */
export const restoreSession = async sessionId => {
  if (!isString(sessionId)) {
    throw new TypeError(`Expected String but got ${getType(sessionId)}.`);
  }
  let ses;
  if (sessions) {
    ses = await sessions.restore(sessionId);
  }
  return ses || null;
};

/**
 * set session window value
 * @param {string} key - key
 * @param {string|Object} value - value
 * @param {number} windowId - window ID
 * @returns {void}
 */
export const setSessionWindowValue = async (key, value, windowId) => {
  if (!isString(key)) {
    throw new TypeError(`Expected String but got ${getType(key)}.`);
  }
  if (sessions && typeof sessions.setWindowValue === "function") {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    await sessions.setWindowValue(windowId, key, value);
  }
};

/* storage */
/**
 * clear storage
 * @returns {void}
 */
export const clearStorage = async () => {
  if (storage) {
    await storage.local.clear();
  }
};

/**
 * get all storage
 * @returns {Object} - stored data
 */
export const getAllStorage = async () => {
  let data;
  if (storage) {
    data = await storage.local.get();
  }
  return data || null;
};

/**
 * get storage
 * @param {*} key - key
 * @returns {Object} - stored data
 */
export const getStorage = async key => {
  let data;
  if (storage) {
    data = await storage.local.get(key);
  }
  return data || null;
};

/**
 * remove storage
 * @param {*} key - key
 * @returns {void}
 */
export const removeStorage = async key => {
  if (storage) {
    await storage.local.remove(key);
  }
};

/**
 * set storage
 * @param {Object} obj - object to store
 * @returns {void}
 */
export const setStorage = async obj => {
  if (storage && obj) {
    await storage.local.set(obj);
  }
};

/* tabs */
/**
 * create tab
 * @param {Object} opt - options
 * @returns {Object} - tabs.Tab
 */
export const createTab = async (opt = {}) => {
  let tab;
  if (tabs) {
    tab = await tabs.create(isObjectNotEmpty(opt) && opt || null);
  }
  return tab || null;
};

/**
 * execute content script to existing tabs
 * @param {string} path - content script path
 * @param {boolean} frame - execute to all frames
 * @returns {Promise.<Array>} - results of each handler
 */
export const execScriptToExistingTabs = async (path, frame = false) => {
  if (!isString(path)) {
    throw new TypeError(`Expected String but got ${getType(path)}.`);
  }
  const func = [];
  if (tabs) {
    const tabList = await tabs.query({
      windowType: "normal",
    });
    for (const tab of tabList) {
      const {id: tabId} = tab;
      func.push(tabs.executeScript(tabId, {
        allFrames: !!frame,
        file: runtime.getURL(path),
      }));
    }
  }
  return Promise.all(func);
};

/**
 * get active tab
 * @param {number} windowId - window ID
 * @returns {Object} - tabs.Tab
 */
export const getActiveTab = async windowId => {
  let tab;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    const arr = await tabs.query({
      windowId,
      active: true,
      windowType: "normal",
    });
    if (arr.length) {
      [tab] = arr;
    }
  }
  return tab || null;
};

/**
 * get active tab ID
 * @param {number} windowId - window ID
 * @returns {?number} - tab ID
 */
export const getActiveTabId = async windowId => {
  let tabId;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    const tab = await getActiveTab(windowId);
    if (tab) {
      tabId = tab.id;
    }
  }
  return Number.isInteger(tabId) ?
    tabId :
    null;
};

/**
 * get all tabs in window
 * @param {number} windowId - window ID
 * @returns {?Array} - array of tabs.Tab
 */
export const getAllTabsInWindow = async windowId => {
  let arr;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    arr = await tabs.query({
      windowId,
      windowType: "normal",
    });
  }
  return arr || null;
};

/**
 * get highlighted tab
 * @param {number} windowId - window ID
 * @returns {?Array} - array of tabs.Tab
 */
export const getHighlightedTab = async windowId => {
  let arr;
  if (tabs) {
    if (!Number.isInteger(windowId)) {
      windowId = windows.WINDOW_ID_CURRENT;
    }
    arr = await tabs.query({
      windowId,
      highlighted: true,
      windowType: "normal",
    });
  }
  return arr || null;
};

/**
 * get tab
 * @param {number} tabId - tab ID
 * @returns {Object} - tabs.Tab
 */
export const getTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let tab;
  if (tabs) {
    tab = await tabs.get(tabId);
  }
  return tab || null;
};

/**
 * highlight tab
 * @param {number|Array} index - tab index
 * @param {number} windowId - window ID
 * @returns {Object} - windows.Window
 */
export const highlightTab = async (index, windowId) => {
  if (!(Array.isArray(index) || Number.isInteger(index))) {
    throw new TypeError(`Expected Number or Array but got ${getType(index)}.`);
  }
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const opt = {
    windowId,
    tabs: index,
  };
  const win = await tabs.highlight(opt);
  return win || null;
};

/**
 * move tab
 * @param {number|Array} tabId - tab ID
 * @param {Object} opt - options
 * @returns {?Array} - array of tabs.Tab
 */
export const moveTab = async (tabId, opt) => {
  if (!(Array.isArray(tabId) || Number.isInteger(tabId))) {
    throw new TypeError(`Expected Number or Array but got ${getType(tabId)}.`);
  }
  let arr;
  if (tabs) {
    arr = await tabs.move(tabId, isObjectNotEmpty(opt) && opt || null);
    if (arr && !Array.isArray(arr)) {
      arr = [arr];
    }
  }
  return arr || null;
};

/**
 * reload tab
 * @param {number} tabId - tab ID
 * @param {Object} opt - options
 * @returns {void}
 */
export const reloadTab = async (tabId, opt) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  if (tabs) {
    await tabs.reload(tabId, isObjectNotEmpty(opt) && opt || null);
  }
};

/**
 * remove tab
 * @param {number|Array} arg - tab ID or array of tab ID
 * @returns {void}
 */
export const removeTab = async arg => {
  if (Number.isInteger(arg)) {
    arg = [arg];
  }
  if (!Array.isArray(arg)) {
    throw new TypeError(`Expected Array but got ${getType(arg)}.`);
  }
  if (tabs) {
    await tabs.remove(arg);
  }
};

/**
 * update tab
 * @param {number} tabId - tab ID
 * @param {Object} opt - options
 * @returns {Object} - tabs.Tab
 */
export const updateTab = async (tabId, opt) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let tab;
  if (tabs) {
    tab = await tabs.update(tabId, isObjectNotEmpty(opt) && opt || null);
  }
  return tab || null;
};

/**
 * is tab
 * @param {*} tabId - tab ID
 * @returns {boolean} - result
 */
export const isTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let tab;
  if (tabs && tabId !== TAB_ID_NONE) {
    tab = await tabs.get(tabId).catch(() => false);
  }
  return !!tab;
};

/* windows */
/**
 * create new window
 * @param {Object} opt - options
 * @returns {Object} - windows.Window
 */
export const createNewWindow = async opt => {
  const win = await windows.create(isObjectNotEmpty(opt) && opt || null);
  return win;
};

/**
 * get all windows
 * @returns {Array} - array of windows.Window
 */
export const getAllNormalWindows = async () => {
  const arr = await windows.getAll({
    windowTypes: ["normal"],
  });
  return arr;
};

/**
 * get current window
 * @param {Object} opt - options
 * @returns {Object} - windows.Window
 */
export const getCurrentWindow = async opt => {
  const win = await windows.getCurrent(isObjectNotEmpty(opt) && opt || null);
  return win;
};

/**
 * check whether incognito window exists
 * @returns {boolean} - result
 */
export const checkIncognitoWindowExists = async () => {
  const arr = await getAllNormalWindows();
  let bool;
  if (arr && arr.length) {
    for (const win of arr) {
      bool = win.incognito;
      if (bool) {
        break;
      }
    }
  }
  return !!bool;
};
