/**
 * main.js
 */

/* shared */
import { sanitizeURL } from '../lib/url/url-sanitizer-wo-dompurify.min.js';
import {
  execScriptToTab, execScriptsToTabInOrder, executeScriptToTab, getActiveTab,
  getActiveTabId, getAllStorage, getAllTabsInWindow, getHighlightedTab,
  getStorage, isScriptingAvailable, isTab, queryTabs, removeStorage, sendMessage
} from './browser.js';
import { getType, isObjectNotEmpty, isString, logErr } from './common.js';
import { editContent } from './edit-content.js';
import { execCopy } from './exec-copy.js';
import {
  createLinkText, createTabsLinkText, enabledFormats, getFormat, getFormatId,
  getFormatsKeys, getFormatTitle, hasFormat, setFormat, setFormatData,
  toggleEnabledFormats
} from './format.js';
import { setIcon } from './icon.js';
import {
  createContextMenu, removeContextMenu, updateContextMenu
} from './menu.js';
import { notifyOnCopy } from './notify.js';
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL, COPY_TABS_OTHER,
  COPY_TABS_SELECTED, EXEC_COPY, HTML_HYPER, HTML_PLAIN,
  ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT, ICON_WHITE,
  INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  JS_CONTEXT_INFO, JS_EDIT_CONTENT, MARKDOWN, MIME_HTML, MIME_PLAIN,
  NOTIFY_COPY, OPTIONS_OPEN, PREFER_CANONICAL, PROMPT, TEXT_SEP_LINES,
  TEXT_TEXT_URL, USER_INPUT, WEBEXT_ID
} from './constant.js';

/* api */
const { i18n, runtime, tabs, windows } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;
const { WINDOW_ID_CURRENT } = windows;

/* user options */
export const userOpts = new Map();

/**
 * set user options
 *
 * @param {object} [opt] - user option
 * @returns {Promise.<object>} - userOpts
 */
export const setUserOpts = async (opt = {}) => {
  let opts;
  if (isObjectNotEmpty(opt)) {
    opts = opt;
  } else {
    opts = await getStorage([
      INCLUDE_TITLE_HTML_HYPER,
      INCLUDE_TITLE_HTML_PLAIN,
      INCLUDE_TITLE_MARKDOWN,
      NOTIFY_COPY,
      PREFER_CANONICAL,
      PROMPT,
      TEXT_SEP_LINES
    ]);
  }
  const items = Object.entries(opts);
  for (const [key, value] of items) {
    const { checked } = value;
    userOpts.set(key, !!checked);
  }
  return userOpts;
};

/**
 * set user enabled formats
 *
 * @param {object} [opt] - user option
 * @returns {Promise.<object>} - enablrfFormats
 */
export const setUserEnabledFormats = async (opt = {}) => {
  let opts;
  if (isObjectNotEmpty(opt)) {
    opts = opt;
  } else {
    const keys = getFormatsKeys(true);
    opts = await getStorage(keys);
  }
  const items = Object.entries(opts);
  const func = [];
  for (const [key, value] of items) {
    if (hasFormat(key)) {
      const { checked } = value;
      const formatItem = getFormat(key);
      formatItem.enabled = !!checked;
      setFormat(key, formatItem);
      func.push(toggleEnabledFormats(key, !!checked));
    }
  }
  await Promise.all(func);
  return enabledFormats;
};

/**
 * get format template
 *
 * @param {string} id - menu item ID
 * @returns {?string} - template
 */
export const getFormatTemplate = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = getFormat(id);
  let template;
  if (item) {
    const {
      id: itemId, template: itemTmpl, templateAlt: itemTmplAlt
    } = item;
    switch (itemId) {
      case HTML_HYPER:
        template = userOpts.get(INCLUDE_TITLE_HTML_HYPER)
          ? itemTmpl
          : itemTmplAlt;
        break;
      case HTML_PLAIN:
        template = userOpts.get(INCLUDE_TITLE_HTML_PLAIN)
          ? itemTmpl
          : itemTmplAlt;
        break;
      case MARKDOWN:
        template = userOpts.get(INCLUDE_TITLE_MARKDOWN)
          ? itemTmpl
          : itemTmplAlt;
        break;
      case TEXT_TEXT_URL:
        template = userOpts.get(TEXT_SEP_LINES)
          ? itemTmplAlt
          : itemTmpl;
        break;
      default:
        template = itemTmpl;
    }
  }
  return template || null;
};

/**
 * get all tabs info
 *
 * @param {string} menuItemId - menu item ID
 * @returns {Promise.<Array>} - tabs info
 */
export const getAllTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = getFormatTemplate(menuItemId);
  const arr = await getAllTabsInWindow(WINDOW_ID_CURRENT);
  arr.forEach(tab => {
    const { id, title, url } = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id,
      formatId,
      template,
      title,
      url,
      content: formatId === BBCODE_URL ? url : title
    });
  });
  return tabsInfo;
};

/**
 * get other tabs info
 *
 * @param {string} menuItemId - menu item ID
 * @returns {Promise.<Array>} - tabs info
 */
export const getOtherTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = getFormatTemplate(menuItemId);
  const arr = await queryTabs({
    active: false,
    highlighted: false,
    windowId: WINDOW_ID_CURRENT,
    windowType: 'normal'
  });
  arr.forEach(tab => {
    const { id, title, url } = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id,
      formatId,
      template,
      title,
      url,
      content: title
    });
  });
  return tabsInfo;
};

/**
 * get selected tabs info
 *
 * @param {string} menuItemId - menu item ID
 * @returns {Promise.<Array>} - tabs info
 */
export const getSelectedTabsInfo = async menuItemId => {
  if (!isString(menuItemId)) {
    throw new TypeError(`Expected String but got ${getType(menuItemId)}.`);
  }
  const tabsInfo = [];
  const template = getFormatTemplate(menuItemId);
  const arr = await getHighlightedTab(WINDOW_ID_CURRENT);
  arr.forEach(tab => {
    const { id, title, url } = tab;
    const formatId = getFormatId(menuItemId);
    tabsInfo.push({
      id,
      formatId,
      template,
      title,
      url,
      content: title
    });
  });
  return tabsInfo;
};

/**
 * get context info
 *
 * @param {number} [tabId] - tab ID
 * @returns {Promise.<object>} - context info
 */
export const getContextInfo = async tabId => {
  // TODO: refactoring when switching to MV3
  const useScripting = await isScriptingAvailable();
  let info;
  if (useScripting) {
    if (!Number.isInteger(tabId)) {
      tabId = await getActiveTabId();
    }
    const arr = await executeScriptToTab({
      files: [JS_CONTEXT_INFO],
      target: {
        tabId
      }
    }).catch(logErr);
    if (Array.isArray(arr)) {
      const [res] = arr;
      if (isObjectNotEmpty(res)) {
        if (Object.prototype.hasOwnProperty.call(res, 'error')) {
          throw res.error;
        }
        const { result } = res;
        info = result;
      }
    }
  } else {
    const res = await execScriptToTab({
      file: JS_CONTEXT_INFO
    });
    if (Array.isArray(res)) {
      [info] = res;
    }
  }
  return info ?? null;
};

/**
 * send context info
 *
 * @returns {?Promise} - sendMessage();
 */
export const sendContextInfo = async () => {
  const contextInfo = await getContextInfo();
  let func;
  if (isObjectNotEmpty(contextInfo)) {
    func = sendMessage(null, {
      [CONTEXT_INFO]: {
        contextInfo
      }
    });
  }
  return func || null;
};

/**
 * extract clicked data
 *
 * @param {object} [info] - clicked info
 * @param {object} [tab] - tabs.Tab
 * @returns {Promise.<Array>} - results of each handler
 */
export const extractClickedData = async (info, tab) => {
  const func = [];
  if (isObjectNotEmpty(info) && isObjectNotEmpty(tab)) {
    const { isEdited, linkText, linkUrl, menuItemId, selectionText } = info;
    const { id: tabId, title: tabTitle, url: tabUrl } = tab;
    if (menuItemId === OPTIONS_OPEN) {
      func.push(runtime.openOptionsPage());
    } else if (isString(menuItemId) &&
        Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
      if (!userOpts.size) {
        await setUserOpts();
      }
      if (!enabledFormats.size) {
        await setFormatData();
        await setUserEnabledFormats();
      }
      const { hash: tabUrlHash } = new URL(tabUrl);
      const formatId = getFormatId(menuItemId);
      const formatTitle = getFormatTitle(formatId);
      const mimeType = formatId === HTML_HYPER ? MIME_HTML : MIME_PLAIN;
      const newLine =
        !!(formatId === TEXT_TEXT_URL && userOpts.get(TEXT_SEP_LINES));
      const contextInfo = await getContextInfo(tabId);
      let contextCanonicalUrl = null;
      let contextContent = null;
      let contextIsLink = false;
      let contextSelectionText = null;
      let contextTitle = null;
      let contextUrl = null;
      if (isObjectNotEmpty(contextInfo)) {
        if (!tabUrlHash && userOpts.get(PREFER_CANONICAL)) {
          contextCanonicalUrl = contextInfo.canonicalUrl;
        }
        contextContent = contextInfo.content;
        contextIsLink = !!contextInfo.isLink;
        contextSelectionText = contextInfo.selectionText;
        contextTitle = contextInfo.title;
        contextUrl = contextInfo.url;
      }
      let text;
      if (menuItemId.startsWith(COPY_TABS_ALL)) {
        const allTabs = await getAllTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of allTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = createTabsLinkText(tmplArr, {
          mimeType,
          newLine
        });
      } else if (menuItemId.startsWith(COPY_TABS_OTHER)) {
        const otherTabs = await getOtherTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of otherTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = createTabsLinkText(tmplArr, {
          mimeType,
          newLine
        });
      } else if (menuItemId.startsWith(COPY_TABS_SELECTED)) {
        const selectedTabs = await getSelectedTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of selectedTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = createTabsLinkText(tmplArr, {
          mimeType,
          newLine
        });
      } else if (menuItemId.startsWith(COPY_TAB)) {
        const template = getFormatTemplate(formatId);
        let content;
        let title;
        let url;
        if (formatId === BBCODE_URL) {
          content = tabUrl;
          url = tabUrl;
        } else {
          content = tabTitle;
          title = tabTitle;
          url = tabUrl;
        }
        text = createLinkText({
          content, formatId, template, title, url
        });
      } else {
        const template = getFormatTemplate(formatId);
        let content;
        let title;
        let url;
        if (menuItemId.startsWith(COPY_LINK)) {
          if (formatId === BBCODE_URL) {
            content = linkUrl;
            url = linkUrl;
          } else {
            content = selectionText || linkText || contextContent;
            title = contextTitle;
            url = linkUrl;
          }
        } else if (menuItemId.startsWith(COPY_PAGE)) {
          if (formatId === BBCODE_URL) {
            content = contextCanonicalUrl || tabUrl;
            url = contextCanonicalUrl || tabUrl;
          } else {
            content = selectionText || tabTitle;
            title = tabTitle;
            url = contextCanonicalUrl || tabUrl;
          }
        } else if (enabledFormats.has(formatId)) {
          if (contextIsLink) {
            if (formatId === BBCODE_URL) {
              content = linkUrl || contextUrl;
              url = linkUrl || contextUrl;
            } else {
              content = selectionText || contextSelectionText || contextContent;
              title = contextTitle;
              url = linkUrl || contextUrl;
            }
          } else if (formatId === BBCODE_URL) {
            content = contextCanonicalUrl || tabUrl;
            url = contextCanonicalUrl || tabUrl;
          } else {
            content = selectionText || contextSelectionText || tabTitle;
            title = tabTitle;
            url = contextCanonicalUrl || tabUrl;
          }
        }
        if (formatId === BBCODE_URL && content) {
          content = await sanitizeURL(content, {
            allow: ['data', 'file'],
            remove: true
          });
        }
        if (url) {
          url = await sanitizeURL(url, {
            allow: ['data', 'file'],
            remove: true
          });
        }
        if (isString(content) && isString(url)) {
          if (userOpts.get(PROMPT) && formatId !== BBCODE_URL && !isEdited) {
            // TODO: refactoring when switching to MV3
            const useScripting = await isScriptingAvailable();
            const promptMsg = i18n.getMessage(USER_INPUT, formatTitle);
            let editedContent;
            if (useScripting) {
              const arr = await executeScriptToTab({
                args: [content, promptMsg],
                func: editContent,
                target: {
                  tabId
                }
              }).catch(logErr);
              if (Array.isArray(arr)) {
                const [res] = arr;
                if (isObjectNotEmpty(res)) {
                  if (Object.prototype.hasOwnProperty.call(res, 'error')) {
                    throw res.error;
                  }
                  const { result } = res;
                  editedContent = result;
                }
              }
            } else {
              const editData = {
                content,
                promptMsg
              };
              const res = await execScriptsToTabInOrder([
                {
                  code: `window.editContentData = ${JSON.stringify(editData)};`
                },
                {
                  file: JS_EDIT_CONTENT
                }
              ]);
              if (Array.isArray(res)) {
                [editedContent] = res;
              }
            }
            text = createLinkText({
              content: isString(editedContent) ? editedContent : content,
              formatId,
              template,
              title,
              url
            });
          } else {
            text = createLinkText({
              content, formatId, template, title, url
            });
          }
        }
      }
      if (isString(text)) {
        func.push(execCopy({
          formatTitle,
          mimeType,
          text,
          notify: userOpts.get(NOTIFY_COPY)
        }));
      }
    }
  }
  return Promise.all(func);
};

/**
 * handle active tab
 *
 * @param {object} [info] - active tab info
 * @returns {?Promise} - updateContextMenu()
 */
export const handleActiveTab = async (info = {}) => {
  const { tabId } = info;
  let func;
  if (Number.isInteger(tabId) && await isTab(tabId)) {
    func = updateContextMenu(tabId, true);
  }
  return func || null;
};

/**
 * handle updated tab
 *
 * @param {number} tabId - tab ID
 * @param {object} [info] - info
 * @param {object} [tab] - tabs.Tab
 * @returns {?Promise} - handleActiveTab()
 */
export const handleUpdatedTab = async (tabId, info = {}, tab = {}) => {
  if (!Number.isInteger(tabId)) {
    throw new TypeError(`Expected Number but got ${getType(tabId)}.`);
  }
  const { status } = info;
  const { active } = tab;
  let func;
  if (status === 'complete' && active) {
    func = handleActiveTab({ tabId });
  }
  return func || null;
};

/**
 * handle command
 *
 * @param {!string} cmd - command
 * @returns {?Promise} - extractClickedData()
 */
export const handleCmd = async cmd => {
  if (!isString(cmd)) {
    throw new TypeError(`Expected String but got ${getType(cmd)}.`);
  }
  const format = cmd.replace(CMD_COPY, '');
  let func;
  if (!enabledFormats.size) {
    await setFormatData();
    await setUserEnabledFormats();
  }
  if (enabledFormats.has(format)) {
    const tab = await getActiveTab();
    if (tab) {
      const info = {
        menuItemId: format
      };
      func = extractClickedData(info, tab);
    }
  }
  return func || null;
};

/**
 * handle message
 *
 * @param {object} [msg] - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async msg => {
  const func = [];
  if (isObjectNotEmpty(msg)) {
    const items = Object.entries(msg);
    if (!userOpts.size) {
      await setUserOpts();
    }
    for (const [key, value] of items) {
      switch (key) {
        case CONTEXT_INFO_GET: {
          if (value) {
            func.push(sendContextInfo());
          }
          break;
        }
        case EXEC_COPY: {
          const { info, tab } = value;
          func.push(extractClickedData(info, tab));
          break;
        }
        case NOTIFY_COPY: {
          if (userOpts.get(NOTIFY_COPY) && value) {
            func.push(notifyOnCopy());
          }
          break;
        }
        default:
      }
    }
  }
  return Promise.all(func);
};

/**
 * set storage value
 *
 * @param {string} item - item
 * @param {object} [obj] - value object
 * @param {boolean} [changed] - changed
 * @returns {Promise.<Array>} - results of each handler
 */
export const setStorageValue = async (item, obj, changed = false) => {
  if (!isString(item)) {
    throw new TypeError(`Expected String but got ${getType(item)}.`);
  }
  const func = [];
  if (isObjectNotEmpty(obj)) {
    const { checked, value } = obj;
    switch (item) {
      case ICON_AUTO:
      case ICON_BLACK:
      case ICON_COLOR:
      case ICON_DARK:
      case ICON_LIGHT:
      case ICON_WHITE: {
        if (runtime.id === WEBEXT_ID) {
          func.push(removeStorage(item));
        } else if (checked) {
          func.push(setIcon(value));
        }
        break;
      }
      case INCLUDE_TITLE_HTML_HYPER:
      case INCLUDE_TITLE_HTML_PLAIN:
      case INCLUDE_TITLE_MARKDOWN:
      case NOTIFY_COPY:
      case PREFER_CANONICAL:
      case PROMPT:
      case TEXT_SEP_LINES: {
        func.push(setUserOpts({
          [item]: {
            checked
          }
        }));
        break;
      }
      default: {
        if (hasFormat(item)) {
          if (changed) {
            func.push(setUserEnabledFormats({
              [item]: {
                checked
              }
            }).then(removeContextMenu).then(createContextMenu));
          } else {
            func.push(setUserEnabledFormats({
              [item]: {
                checked
              }
            }));
          }
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * handle storage
 *
 * @param {object} data - storage data
 * @param {string} area - storage area
 * @param {boolean} [changed] - storage changed
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleStorage = async (data, area = 'local', changed = false) => {
  const func = [];
  if (isObjectNotEmpty(data) && area === 'local') {
    const items = Object.entries(data);
    if (items.length) {
      if (changed) {
        if (!userOpts.size) {
          await setUserOpts();
        }
        if (!enabledFormats.size) {
          await setFormatData();
          await setUserEnabledFormats();
        }
      }
      for (const [key, value] of items) {
        const { newValue } = value;
        func.push(setStorageValue(key, newValue || value, !!newValue));
      }
    }
  }
  return Promise.all(func);
};

/**
 * startup
 *
 * @returns {Promise} - promise chain
 */
export const startup = async () => {
  await setFormatData();
  return getAllStorage().then(handleStorage).then(createContextMenu);
};

// For test
export { enabledFormats };
