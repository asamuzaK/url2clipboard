/**
 * main.js
 */

/* shared */
import {
  executeScriptToTab, getActiveTabId, getAllStorage, getAllTabsInWindow,
  getHighlightedTab, getStorage, isTab, queryTabs, removeStorage, sendMessage
} from './browser.js';
import { getType, isObjectNotEmpty, isString } from './common.js';
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
import { promptContent } from './prompt.js';
import { sanitizeURL } from './sanitize.js';
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL, COPY_TABS_OTHER,
  COPY_TABS_SELECTED, EXEC_COPY, HTML_HYPER, HTML_PLAIN,
  ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT, ICON_WHITE,
  INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  JS_CONTEXT_INFO, MARKDOWN, MIME_HTML, MIME_PLAIN, NOTIFY_COPY, OPTIONS_OPEN,
  PREFER_CANONICAL, PROMPT, TEXT_FRAG_HTML_HYPER, TEXT_FRAG_HTML_PLAIN,
  TEXT_SEP_LINES, TEXT_TEXT_URL, WEBEXT_ID
} from './constant.js';

/* api */
const { runtime, tabs, windows } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;
const { WINDOW_ID_CURRENT } = windows;

/* user options */
export const userOpts = new Map();

/**
 * set user options
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
      TEXT_FRAG_HTML_HYPER,
      TEXT_FRAG_HTML_PLAIN,
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
 * @param {object} [opt] - user option
 * @returns {Promise.<object>} - enabledFormats
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
  for (const tab of arr) {
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
  }
  return tabsInfo;
};

/**
 * get other tabs info
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
  for (const tab of arr) {
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
  }
  return tabsInfo;
};

/**
 * get selected tabs info
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
  for (const tab of arr) {
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
  }
  return tabsInfo;
};

/**
 * get context info
 * @param {number} [tabId] - tab ID
 * @returns {Promise.<object>} - context info
 */
export const getContextInfo = async tabId => {
  if (!Number.isInteger(tabId)) {
    tabId = await getActiveTabId();
  }
  const arr = await executeScriptToTab({
    files: [JS_CONTEXT_INFO],
    target: {
      tabId
    }
  }).catch(e => {
    // fall through
  });
  let info;
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
  return info ?? null;
};

/**
 * send context info
 * @returns {Promise} - sendMessage();
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
 * @param {object} [info] - clicked info
 * @param {object} [tab] - tabs.Tab
 * @returns {Promise} - runtime.openOptionsPage(), execCopy()
 */
export const extractClickedData = async (info, tab) => {
  let func;
  if (isObjectNotEmpty(info) && isObjectNotEmpty(tab)) {
    const {
      editedText, isEdited, linkText, linkUrl, menuItemId, selectionText
    } = info;
    const { id: tabId, title: tabTitle, url: tabUrl } = tab;
    if (menuItemId === OPTIONS_OPEN) {
      func = runtime.openOptionsPage();
    } else if (isString(menuItemId) &&
               Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
      if (!userOpts.size) {
        await setUserOpts();
      }
      if (!enabledFormats.size) {
        await setFormatData();
        await setUserEnabledFormats();
      }
      const formatId = getFormatId(menuItemId);
      const formatTitle = getFormatTitle(formatId);
      const mimeType = formatId === HTML_HYPER ? MIME_HTML : MIME_PLAIN;
      const newLine =
        !!(formatId === TEXT_TEXT_URL && userOpts.get(TEXT_SEP_LINES));
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
        const content = formatId === BBCODE_URL ? tabUrl : tabTitle;
        text = await createLinkText({
          content,
          formatId,
          template,
          title: tabTitle,
          url: tabUrl
        });
      } else {
        const template = getFormatTemplate(formatId);
        const contextInfo = await getContextInfo(tabId);
        let canonicalUrl = null;
        let contextContent = null;
        let contextIsLink = false;
        let contextSelectionText = null;
        let contextTitle = null;
        let contextUrl = null;
        if (isObjectNotEmpty(contextInfo)) {
          const { hash: tabUrlHash } = new URL(tabUrl);
          if (!tabUrlHash && userOpts.get(PREFER_CANONICAL)) {
            canonicalUrl = contextInfo.canonicalUrl;
          }
          contextContent = contextInfo.content;
          contextIsLink = !!contextInfo.isLink;
          contextSelectionText = contextInfo.selectionText;
          contextTitle = contextInfo.title;
          contextUrl = contextInfo.url;
        }
        let content;
        let title;
        let url;
        if (menuItemId.startsWith(COPY_PAGE)) {
          if (selectionText &&
              ((formatId === HTML_HYPER &&
                userOpts.get(TEXT_FRAG_HTML_HYPER)) ||
               (formatId === HTML_PLAIN &&
                userOpts.get(TEXT_FRAG_HTML_PLAIN)))) {
            const textFrag = `#:~:text=${encodeURIComponent(selectionText)}`;
            const { href: textFragUrl } = new URL(textFrag, tabUrl);
            url = await sanitizeURL(textFragUrl, {
              allow: ['data', 'file']
            });
            if (isEdited) {
              content = editedText;
            } else {
              content = selectionText;
            }
          } else {
            url = await sanitizeURL(canonicalUrl || tabUrl, {
              allow: ['data', 'file']
            });
            if (formatId === BBCODE_URL) {
              content = url;
            } else if (isEdited) {
              content = editedText;
            } else {
              content = selectionText || tabTitle;
            }
          }
          title = tabTitle;
        } else {
          if (menuItemId.startsWith(COPY_LINK)) {
            if (isEdited) {
              content = editedText;
            } else {
              content = selectionText || linkText || contextContent;
            }
            title = contextTitle;
            url = linkUrl;
          } else if (enabledFormats.has(formatId)) {
            if (contextIsLink) {
              if (isEdited) {
                content = editedText;
              } else {
                content =
                  selectionText || contextSelectionText || contextContent;
              }
              title = contextTitle;
              url = linkUrl || contextUrl;
            } else {
              if (isEdited) {
                content = editedText;
              } else {
                content = selectionText || contextSelectionText || tabTitle;
              }
              title = tabTitle;
              url = canonicalUrl || tabUrl;
            }
          }
          if (url) {
            url = await sanitizeURL(url, {
              allow: ['data', 'file']
            });
            if (formatId === BBCODE_URL) {
              content = url;
            }
          }
        }
        if (isString(content) && isString(url)) {
          if (formatId !== BBCODE_URL && !isEdited && userOpts.get(PROMPT)) {
            const editedContent = await promptContent({
              content,
              formatTitle,
              tabId
            });
            text = await createLinkText({
              content: isString(editedContent) ? editedContent : content,
              formatId,
              template,
              title,
              url
            });
          } else {
            text = await createLinkText({
              content, formatId, template, title, url
            });
          }
        }
      }
      if (isString(text)) {
        func = execCopy({
          formatTitle,
          mimeType,
          text,
          notify: userOpts.get(NOTIFY_COPY)
        });
      }
    }
  }
  return func || null;
};

/**
 * handle active tab
 * @param {object} [info] - active tab info
 * @returns {Promise} - updateContextMenu()
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
 * @param {number} tabId - tab ID
 * @param {object} [info] - info
 * @param {object} [tab] - tabs.Tab
 * @returns {Promise} - handleActiveTab()
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
 * @param {!string} cmd - command
 * @param {object} tab - tabs.Tab
 * @returns {Promise} - extractClickedData()
 */
export const handleCmd = async (cmd, tab) => {
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
    const info = {
      menuItemId: format
    };
    func = extractClickedData(info, tab);
  }
  return func || null;
};

/**
 * handle message
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
            func.push(notifyOnCopy(isString(value) ? value : null));
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
 * @param {string} item - item
 * @param {object} [obj] - value object
 * @param {boolean} [changed] - changed
 * @returns {Promise} - promise or promise chain
 */
export const setStorageValue = async (item, obj, changed = false) => {
  if (!isString(item)) {
    throw new TypeError(`Expected String but got ${getType(item)}.`);
  }
  let func;
  if (isObjectNotEmpty(obj)) {
    const { checked, value } = obj;
    switch (item) {
      case ICON_AUTO:
        func = removeStorage(item);
        break;
      case ICON_BLACK:
      case ICON_COLOR:
      case ICON_DARK:
      case ICON_LIGHT:
      case ICON_WHITE: {
        if (runtime.id === WEBEXT_ID || value.startsWith('#')) {
          func = removeStorage(item);
        } else if (checked) {
          func = setIcon(value);
        }
        break;
      }
      case INCLUDE_TITLE_HTML_HYPER:
      case INCLUDE_TITLE_HTML_PLAIN:
      case INCLUDE_TITLE_MARKDOWN:
      case NOTIFY_COPY:
      case PREFER_CANONICAL:
      case PROMPT:
      case TEXT_FRAG_HTML_HYPER:
      case TEXT_FRAG_HTML_PLAIN:
      case TEXT_SEP_LINES: {
        func = setUserOpts({
          [item]: {
            checked
          }
        });
        break;
      }
      default: {
        if (hasFormat(item)) {
          if (changed) {
            func = setUserEnabledFormats({
              [item]: {
                checked
              }
            }).then(removeContextMenu).then(createContextMenu);
          } else {
            func = setUserEnabledFormats({
              [item]: {
                checked
              }
            });
          }
        }
      }
    }
  }
  return func || null;
};

/**
 * handle storage
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
 * @returns {Promise} - promise chain
 */
export const startup = async () => {
  await setFormatData();
  return getAllStorage().then(handleStorage).then(removeContextMenu)
    .then(createContextMenu);
};

// For test
export { enabledFormats };
