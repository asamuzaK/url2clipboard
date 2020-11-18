/**
 * browser.js
 */

/* shared */
import { getType, isObjectNotEmpty, isString, logErr } from './common.js';

/* api */
const { permissions, runtime, tabs, windows } = browser;

/**
 * check if permission is granted
 *
 * @param {string} perm - permissions.Permission
 * @returns {boolean} - result
 */
export const isPermissionGranted = async perm => {
  const bool = await permissions.contains(perm);
  return !!bool;
};

/* bookmarks */
/**
 * create bookmark
 *
 * @param {object} opt - bookmarks.CreateDetails
 * @returns {object} - bookmarks.BookmarkTreeNode
 */
export const createBookmark = async opt => {
  let node;
  const isGranted = await isPermissionGranted({
    permissions: ['bookmarks']
  });
  if (isGranted && isObjectNotEmpty(opt)) {
    const { bookmarks } = browser;
    node = await bookmarks.create(opt);
  }
  return node || null;
};

/* browserSettings */
/**
 * get closeTabsByDoubleClick user value
 *
 * @returns {object} - user value
 */
export const getCloseTabsByDoubleClickValue = async () => {
  let userValue;
  const isGranted = await isPermissionGranted({
    permissions: ['browserSettings']
  });
  if (isGranted) {
    const { browserSettings } = browser;
    const { closeTabsByDoubleClick } = browserSettings;
    userValue = await closeTabsByDoubleClick.get({});
  }
  return userValue || null;
};

/**
 * set context menu on mouseup
 *
 * @returns {boolean} - result
 */
export const setContextMenuOnMouseup = async () => {
  let res;
  const isGranted = await isPermissionGranted({
    permissions: ['browserSettings']
  });
  if (isGranted) {
    const { browserSettings } = browser;
    const { contextMenuShowEvent } = browserSettings;
    const { levelOfControl, value } = await contextMenuShowEvent.get({});
    if (value === 'mouseup') {
      res = true;
    } else if (levelOfControl === 'controllable_by_this_extension') {
      res = await contextMenuShowEvent.set({ value: 'mouseup' });
    } else {
      res = false;
    }
  }
  return !!res;
};

/**
 * clear context menu on mouseup
 *
 * @returns {boolean} - result
 */
export const clearContextMenuOnMouseup = async () => {
  let res;
  const isGranted = await isPermissionGranted({
    permissions: ['browserSettings']
  });
  if (isGranted) {
    const { browserSettings } = browser;
    const { contextMenuShowEvent } = browserSettings;
    res = await contextMenuShowEvent.clear({});
  }
  return !!res;
};

/* commands */
/**
 * is command customizable
 *
 * @returns {boolean} - result
 */
export const isCommandCustomizable = async () => {
  let bool;
  const isGranted = await isPermissionGranted({
    permissions: ['commands']
  });
  if (isGranted) {
    const { commands } = browser;
    bool = typeof commands.update === 'function' &&
           typeof commands.reset === 'function';
  }
  return !!bool;
};

/**
 * update command
 *
 * @param {string} id - command ID
 * @param {string} value - key value
 * @returns {?Function} - commands.update() | commands.reset()
 */
export const updateCommand = async (id, value = '') => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  if (!isString(value)) {
    throw new TypeError(`Expected String but got ${getType(value)}.`);
  }
  let func;
  if (await isCommandCustomizable()) {
    const { commands } = browser;
    const shortcut =
      value.trim().replace(/\+([a-z])$/, (m, c) => `+${c.toUpperCase()}`);
    if (shortcut === '') {
      func = commands.reset(id);
    } else if (/^(?:(?:(?:Alt|Command|(?:Mac)?Ctrl)(?:\+Shift)?|Alt\+(?:Command|(?:Mac)?Ctrl)|Command\+(?:Alt|MacCtrl)|Ctrl\+(?:Alt|MacCtrl)|MacCtrl\+(?:Alt|Command|Ctrl))\+(?:[\dA-Z]|F(?:[1-9]|1[0-2])|(?:Page)?(?:Down|Up)|Left|Right|Comma|Period|Home|End|Delete|Insert|Space))|F(?:[1-9]|1[0-2])|Media(?:(?:Next|Prev)Track|PlayPause|Stop)$/.test(shortcut)) {
      func = commands.update({
        shortcut,
        name: id
      });
    }
  }
  return func || null;
};

/* contextualIdentities */
/**
 * get all contextual identities
 *
 * @returns {?Array} - array of contextualIdentities.ContextualIdentity
 */
export const getAllContextualIdentities = async () => {
  let arr;
  const isGranted = await isPermissionGranted({
    permissions: ['contextualIdentities']
  });
  if (isGranted) {
    const { contextualIdentities } = browser;
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
 *
 * @param {string} cookieStoreId - cookie store ID
 * @returns {object} - contextualIdentities.ContextualIdentity
 */
export const getContextualId = async cookieStoreId => {
  if (!isString(cookieStoreId)) {
    throw new TypeError(`Expected String but got ${getType(cookieStoreId)}.`);
  }
  let id;
  const isGranted = await isPermissionGranted({
    permissions: ['contextualIdentities']
  });
  if (isGranted) {
    const { contextualIdentities } = browser;
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
 *
 * @returns {?Array} - array of management.ExtensionInfo
 */
export const getEnabledTheme = async () => {
  let res;
  const isGranted = await isPermissionGranted({
    permissions: ['management']
  });
  if (isGranted) {
    const { management } = browser;
    const arr = await management.getAll();
    if (Array.isArray(arr)) {
      res = arr.filter(info =>
        info.type && info.type === 'theme' && info.enabled && info
      );
    }
  }
  return res || null;
};

/**
 * get extension info
 *
 * @param {string} id - extension ID
 * @returns {object} - management.extensionInfo
 */
export const getExtensionInfo = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let ext;
  const isGranted = await isPermissionGranted({
    permissions: ['management']
  });
  if (isGranted) {
    const { management } = browser;
    ext = await management.get(id);
  }
  return ext || null;
};

/**
 * get external extensions
 *
 * @returns {?Array} -array of management.extensionInfo
 */
export const getExternalExtensions = async () => {
  let res;
  const isGranted = await isPermissionGranted({
    permissions: ['management']
  });
  if (isGranted) {
    const { management } = browser;
    const arr = await management.getAll();
    if (Array.isArray(arr)) {
      res = arr.filter(info => info.type && info.type === 'extension' && info);
    }
  }
  return res || null;
};

/* notifications */
/**
 * clear notification
 *
 * @param {string} id - notification ID
 * @returns {?Function} - notifications.clear()
 */
export const clearNotification = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let func;
  const isGranted = await isPermissionGranted({
    permissions: ['notifications']
  });
  if (isGranted) {
    const { notifications } = browser;
    func = notifications.clear(id);
  }
  return func || null;
};

/**
 * create notification
 *
 * @param {string} id - notification ID
 * @param {object} opt - options
 * @returns {?Function} - notifications.create()
 */
export const createNotification = async (id, opt) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let func;
  const isGranted = await isPermissionGranted({
    permissions: ['notifications']
  });
  if (isGranted) {
    const { notifications } = browser;
    !notifications.onClosed.hasListener(clearNotification) &&
      notifications.onClosed.addListener(clearNotification);
    func = notifications.create(id, opt);
  }
  return func || null;
};

/* permissions */
/**
 * remove permission
 *
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
      permissions: [perm]
    });
  } else {
    bool = await permissions.remove({
      permissions: perm
    });
  }
  return !!bool;
};

/**
 * request permission
 *
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
      permissions: [perm]
    });
  } else {
    bool = await permissions.request({
      permissions: perm
    });
  }
  return !!bool;
};

/* runtime */
/**
 * get manifest icons
 *
 * @returns {object|string} - icons
 */
export const getManifestIcons = () => {
  const { icons } = runtime.getManifest();
  return icons;
};

/**
 * get OS
 *
 * @returns {string} - OS
 */
export const getOs = async () => {
  const { os } = await runtime.getPlatformInfo();
  return os;
};

/**
 * make a connection
 *
 * @param {string} [extId] - extension ID
 * @param {object} [info] - info
 * @returns {object} - runtime.Port
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
  return port;
};

/**
 * send message
 *
 * @param {number|string} id - tabId or extension ID
 * @param {*} msg - message
 * @param {object} opt - options
 * @returns {?Function} - tabs.sendMessage() | runtime.sendMessage()
 */
export const sendMessage = async (id, msg, opt) => {
  let func;
  if (msg) {
    opt = isObjectNotEmpty(opt) ? opt : null;
    if (Number.isInteger(id)) {
      if (id !== tabs.TAB_ID_NONE) {
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
 *
 * @param {number} windowId - window ID
 * @returns {object} - tabs.Tab
 */
export const getRecentlyClosedTab = async windowId => {
  let tab;
  const isGranted = await isPermissionGranted({
    permissions: ['sessions']
  });
  if (isGranted) {
    const { sessions } = browser;
    const items = await sessions.getRecentlyClosed();
    if (Array.isArray(items) && items.length) {
      if (!Number.isInteger(windowId)) {
        windowId = windows.WINDOW_ID_CURRENT;
      }
      for (const item of items) {
        const { tab: itemTab } = item;
        if (itemTab) {
          const { windowId: itemWindowId } = itemTab;
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
 *
 * @param {string} key - key
 * @param {number} windowId - window ID
 * @returns {string} - value
 */
export const getSessionWindowValue = async (key, windowId) => {
  if (!isString(key)) {
    throw new TypeError(`Expected String but got ${getType(key)}.`);
  }
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  let value;
  const isGranted = await isPermissionGranted({
    permissions: ['sessions']
  });
  if (isGranted) {
    const { sessions } = browser;
    value = await sessions.getWindowValue(windowId, key);
  }
  return value || null;
};

/**
 * restore session
 *
 * @param {string} sessionId - session ID
 * @returns {object} - sessions.Session
 */
export const restoreSession = async sessionId => {
  if (!isString(sessionId)) {
    throw new TypeError(`Expected String but got ${getType(sessionId)}.`);
  }
  let ses;
  const isGranted = await isPermissionGranted({
    permissions: ['sessions']
  });
  if (isGranted) {
    const { sessions } = browser;
    ses = await sessions.restore(sessionId);
  }
  return ses || null;
};

/**
 * set session window value
 *
 * @param {string} key - key
 * @param {string|object} value - value
 * @param {number} windowId - window ID
 * @returns {void}
 */
export const setSessionWindowValue = async (key, value, windowId) => {
  if (!isString(key)) {
    throw new TypeError(`Expected String but got ${getType(key)}.`);
  }
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const isGranted = await isPermissionGranted({
    permissions: ['sessions']
  });
  if (isGranted) {
    const { sessions } = browser;
    await sessions.setWindowValue(windowId, key, value);
  }
};

/* storage */
/**
 * clear storage
 *
 * @returns {void}
 */
export const clearStorage = async () => {
  const isGranted = await isPermissionGranted({
    permissions: ['storage']
  });
  if (isGranted) {
    const { storage } = browser;
    await storage.local.clear();
  }
};

/**
 * get all storage
 *
 * @returns {object} - stored data
 */
export const getAllStorage = async () => {
  let data;
  const isGranted = await isPermissionGranted({
    permissions: ['storage']
  });
  if (isGranted) {
    const { storage } = browser;
    data = await storage.local.get();
  }
  return data || null;
};

/**
 * get storage
 *
 * @param {*} key - key
 * @returns {object} - stored data
 */
export const getStorage = async key => {
  let data;
  const isGranted = await isPermissionGranted({
    permissions: ['storage']
  });
  if (isGranted) {
    const { storage } = browser;
    data = await storage.local.get(key);
  }
  return data || null;
};

/**
 * remove storage
 *
 * @param {*} key - key
 * @returns {void}
 */
export const removeStorage = async key => {
  const isGranted = await isPermissionGranted({
    permissions: ['storage']
  });
  if (isGranted) {
    const { storage } = browser;
    await storage.local.remove(key);
  }
};

/**
 * set storage
 *
 * @param {object} obj - object to store
 * @returns {void}
 */
export const setStorage = async obj => {
  const isGranted = await isPermissionGranted({
    permissions: ['storage']
  });
  if (isGranted && obj) {
    const { storage } = browser;
    await storage.local.set(obj);
  }
};

/* tabs */
/**
 * create tab
 *
 * @param {object} opt - options
 * @returns {object} - tabs.Tab
 */
export const createTab = async (opt = {}) => {
  const tab = await tabs.create(isObjectNotEmpty(opt) ? opt : null);
  return tab;
};

/**
 * query tabs
 *
 * @param {object} opt - options
 * @returns {?Array} - result
 */
export const queryTabs = async opt => {
  const res = await tabs.query(opt);
  return res;
};

/**
 * execute content script to existing tab
 *
 * @param {number} tabId - tab ID
 * @param {object} opt - options
 * @returns {?(Function|boolean)} - promise chain
 */
export const execScriptToTab = async (tabId, opt = {}) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  return tabs.executeScript(tabId, opt).catch(logErr);
};

/**
 * execute content script to existing tabs
 *
 * @param {object} opt - options
 * @returns {Promise.<Array>} - results of each handler
 */
export const execScriptToTabs = async (opt = {}) => {
  const func = [];
  const tabList = await queryTabs({
    url: ['<all_urls>'],
    windowType: 'normal'
  });
  for (const tab of tabList) {
    const { id: tabId, url } = tab;
    const { protocol } = new URL(url);
    if (/^(?:data|f(?:tp|ile)|https?|wss?):/.test(protocol)) {
      func.push(execScriptToTab(tabId, opt));
    }
  }
  return Promise.all(func);
};

/**
 * get active tab
 *
 * @param {number} windowId - window ID
 * @returns {object} - tabs.Tab
 */
export const getActiveTab = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const [tab] = await queryTabs({
    windowId,
    active: true,
    windowType: 'normal'
  });
  return tab;
};

/**
 * get active tab ID
 *
 * @param {number} windowId - window ID
 * @returns {?number} - tab ID
 */
export const getActiveTabId = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const { id } = await getActiveTab(windowId);
  return id;
};

/**
 * get all tabs in window
 *
 * @param {number} windowId - window ID
 * @returns {?Array} - array of tabs.Tab
 */
export const getAllTabsInWindow = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const arr = await queryTabs({
    windowId,
    windowType: 'normal'
  });
  return arr;
};

/**
 * get highlighted tab
 *
 * @param {number} windowId - window ID
 * @returns {?Array} - array of tabs.Tab
 */
export const getHighlightedTab = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const arr = await queryTabs({
    windowId,
    highlighted: true,
    windowType: 'normal'
  });
  return arr;
};

/**
 * get tab
 *
 * @param {number} tabId - tab ID
 * @returns {object} - tabs.Tab
 */
export const getTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const tab = await tabs.get(tabId);
  return tab;
};

/**
 * highlight tab
 *
 * @param {number|Array} index - tab index
 * @param {number} windowId - window ID
 * @returns {object} - windows.Window
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
    tabs: index
  };
  const win = await tabs.highlight(opt);
  return win;
};

/**
 * move tab
 *
 * @param {number|Array} tabId - tab ID
 * @param {object} opt - options
 * @returns {?Array} - array of tabs.Tab
 */
export const moveTab = async (tabId, opt) => {
  if (!(Array.isArray(tabId) || Number.isInteger(tabId))) {
    throw new TypeError(`Expected Number or Array but got ${getType(tabId)}.`);
  }
  let arr = await tabs.move(tabId, isObjectNotEmpty(opt) ? opt : null);
  if (arr && !Array.isArray(arr)) {
    arr = [arr];
  }
  return arr || null;
};

/**
 * reload tab
 *
 * @param {number} tabId - tab ID
 * @param {object} opt - options
 * @returns {void}
 */
export const reloadTab = async (tabId, opt) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  await tabs.reload(tabId, isObjectNotEmpty(opt) ? opt : null);
};

/**
 * remove tab
 *
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
  await tabs.remove(arg);
};

/**
 * update tab
 *
 * @param {number} tabId - tab ID
 * @param {object} opt - options
 * @returns {object} - tabs.Tab
 */
export const updateTab = async (tabId, opt) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const tab = await tabs.update(tabId, isObjectNotEmpty(opt) ? opt : null);
  return tab;
};

/**
 * warmup tab
 *
 * @param {number} tabId - tab ID
 * @returns {void}
 */
export const warmupTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  typeof tabs.warmup === 'function' && await tabs.warmup(tabId);
};

/**
 * is tab
 *
 * @param {*} tabId - tab ID
 * @returns {boolean} - result
 */
export const isTab = async tabId => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  let tab;
  if (tabId !== tabs.TAB_ID_NONE) {
    try {
      tab = await tabs.get(tabId);
    } catch (e) {
      tab = false;
    }
  }
  return !!tab;
};

/* theme */
/**
 * get current theme
 *
 * @returns {object} - theme.Theme
 */
export const getCurrentTheme = async () => {
  const isGranted = await isPermissionGranted({
    permissions: ['theme']
  });
  let currentTheme;
  if (isGranted) {
    const { theme } = browser;
    currentTheme = await theme.getCurrent();
  }
  return currentTheme || null;
};

/* windows */
/**
 * create new window
 *
 * @param {object} opt - options
 * @returns {object} - windows.Window
 */
export const createNewWindow = async opt => {
  const win = await windows.create(isObjectNotEmpty(opt) ? opt : null);
  return win;
};

/**
 * get all windows
 *
 * @param {boolean} populate - populate tabs
 * @returns {Array} - array of windows.Window
 */
export const getAllNormalWindows = async (populate = false) => {
  const arr = await windows.getAll({
    populate,
    windowTypes: ['normal']
  });
  return arr;
};

/**
 * get current window
 *
 * @param {object} opt - options
 * @returns {object} - windows.Window
 */
export const getCurrentWindow = async opt => {
  const win = await windows.getCurrent(isObjectNotEmpty(opt) ? opt : null);
  return win;
};

/**
 * get window
 *
 * @param {number} windowId - window ID
 * @param {object} opt - options
 * @returns {object} - windows.Window
 */
export const getWindow = async (windowId, opt) => {
  if (!Number.isInteger(windowId)) {
    throw new TypeError(`Expected Number but got ${getType(windowId)}.`);
  }
  const win = await windows.get(windowId, isObjectNotEmpty(opt) ? opt : null);
  return win;
};

/**
 * check whether incognito window exists
 *
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
