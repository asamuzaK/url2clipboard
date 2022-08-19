/**
 * main.js
 */

/* shared */
import { Clip } from './clipboard.js';
import { getType, isObjectNotEmpty, isString } from './common.js';
import {
  execScriptToTab, execScriptsToTabInOrder, executeScriptToTab, getActiveTab,
  getActiveTabId, getAllStorage, getAllTabsInWindow, getHighlightedTab,
  isScriptingAvailable, isTab, queryTabs, sendMessage
} from './browser.js';
import { editContent } from './edit-content.js';
import {
  createLinkText, createTabsLinkText, enabledFormats, getFormat, getFormatId,
  getFormatTitle, hasFormat, setFormat, setFormatData, toggleEnabledFormats
} from './format.js';
import {
  createContextMenu, removeContextMenu, updateContextMenu
} from './menu.js';
import { notifyOnCopy } from './notify.js';
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL, COPY_TABS_OTHER,
  COPY_TABS_SELECTED, EXEC_COPY, EXT_NAME, HTML_HYPER, HTML_PLAIN,
  ICON, ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_CONTEXT_ID, ICON_DARK,
  ICON_LIGHT, ICON_WHITE, INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN,
  INCLUDE_TITLE_MARKDOWN, JS_CONTEXT_INFO, JS_EDIT_CONTENT, MARKDOWN,
  MIME_HTML, MIME_PLAIN, NOTIFY_COPY, PREFER_CANONICAL, PROMPT, TEXT_SEP_LINES,
  TEXT_TEXT_URL, USER_INPUT, WEBEXT_ID
} from './constant.js';

/* api */
const { browserAction, i18n, runtime, tabs, windows } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;
const { WINDOW_ID_CURRENT } = windows;

/* variables */
export const vars = {
  iconId: '',
  includeTitleHTMLHyper: false,
  includeTitleHTMLPlain: false,
  includeTitleMarkdown: false,
  isWebExt: runtime.id === WEBEXT_ID,
  notifyOnCopy: false,
  preferCanonicalUrl: false,
  promptContent: false,
  separateTextURL: false
};

/**
 * get format template
 *
 * @param {string} id - menu item ID
 * @returns {?string} - template
 */
export const getFormatTemplate = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = getFormat(id);
  let template;
  if (item) {
    const {
      id: itemId, template: itemTmpl, templateAlt: itemTmplAlt
    } = item;
    const {
      includeTitleHTMLHyper, includeTitleHTMLPlain, includeTitleMarkdown,
      separateTextURL
    } = vars;
    switch (itemId) {
      case HTML_HYPER:
        template = includeTitleHTMLHyper ? itemTmpl : itemTmplAlt;
        break;
      case HTML_PLAIN:
        template = includeTitleHTMLPlain ? itemTmpl : itemTmplAlt;
        break;
      case MARKDOWN:
        template = includeTitleMarkdown ? itemTmpl : itemTmplAlt;
        break;
      case TEXT_TEXT_URL:
        template = separateTextURL ? itemTmplAlt : itemTmpl;
        break;
      default:
        template = itemTmpl;
    }
  }
  return template || null;
};

/**
 * set icon
 *
 * @returns {Promise.<Array>} - results of each handler
 */
export const setIcon = async () => {
  const { iconId } = vars;
  const name = i18n.getMessage(EXT_NAME);
  const icon = runtime.getURL(ICON);
  const path = (iconId && `${icon}${iconId}`) || icon;
  const title = name;
  return Promise.all([
    browserAction.setIcon({ path }),
    browserAction.setTitle({ title })
  ]);
};

/**
 * set default icon
 *
 * @returns {?Function} - setIcon()
 */
export const setDefaultIcon = async () => {
  let func;
  if (vars.isWebExt && !vars.iconId) {
    vars.iconId = ICON_CONTEXT_ID;
    func = setIcon();
  }
  return func || null;
};

/**
 * get all tabs info
 *
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
 * get other tabs info
 *
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
 * @param {number} tabId - tab ID
 * @returns {object} - context info
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
    });
    if (Array.isArray(arr) && arr.length) {
      const [{ error, result }] = arr;
      if (error) {
        throw new Error(error.message);
      }
      info = result;
    }
  } else {
    const arr = await execScriptToTab({
      file: JS_CONTEXT_INFO
    });
    if (Array.isArray(arr)) {
      [info] = arr;
    }
  }
  return info ?? null;
};

/**
 * send context info
 *
 * @returns {?Function} - sendMessage();
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
 * @param {object} info - clicked info
 * @param {object} tab - tabs.Tab
 * @returns {Promise.<Array>} - results of each handler
 */
export const extractClickedData = async (info, tab) => {
  const func = [];
  if (isObjectNotEmpty(info) && isObjectNotEmpty(tab)) {
    const { isEdited, linkText, linkUrl, menuItemId, selectionText } = info;
    const { id: tabId, title: tabTitle, url: tabUrl } = tab;
    if (isString(menuItemId) &&
        Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
      const { notifyOnCopy: notify, preferCanonicalUrl, promptContent } = vars;
      const { hash: tabUrlHash } = new URL(tabUrl);
      const formatId = getFormatId(menuItemId);
      const formatTitle = getFormatTitle(formatId);
      const mimeType = formatId === HTML_HYPER ? MIME_HTML : MIME_PLAIN;
      const contextInfo = await getContextInfo(tabId);
      let contextCanonicalUrl = null;
      let contextContent = null;
      let contextIsLink = false;
      let contextSelectionText = null;
      let contextTitle = null;
      let contextUrl = null;
      if (isObjectNotEmpty(contextInfo)) {
        if (!tabUrlHash && preferCanonicalUrl) {
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
        text = createTabsLinkText(tmplArr, mimeType);
      } else if (menuItemId.startsWith(COPY_TABS_OTHER)) {
        const otherTabs = await getOtherTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of otherTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = createTabsLinkText(tmplArr, mimeType);
      } else if (menuItemId.startsWith(COPY_TABS_SELECTED)) {
        const selectedTabs = await getSelectedTabsInfo(menuItemId);
        const arr = [];
        for (const tabData of selectedTabs) {
          arr.push(createLinkText(tabData));
        }
        const tmplArr = await Promise.all(arr);
        text = createTabsLinkText(tmplArr, mimeType);
      } else if (menuItemId.startsWith(COPY_TAB)) {
        const template = await getFormatTemplate(formatId);
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
        const template = await getFormatTemplate(formatId);
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
        if (isString(content) && isString(url)) {
          if (promptContent && formatId !== BBCODE_URL && !isEdited) {
            // TODO: refactoring when switching to MV3
            const useScripting = await isScriptingAvailable();
            const promptMsg = i18n.getMessage(USER_INPUT, formatTitle);
            let editedContent;
            if (useScripting) {
              const promptRes = await executeScriptToTab({
                args: [content, promptMsg],
                func: editContent,
                target: {
                  tabId
                }
              });
              if (Array.isArray(promptRes)) {
                const [{ error, result }] = promptRes;
                if (error) {
                  throw new Error(error.message);
                }
                editedContent = result;
              }
            } else {
              const editData = {
                content,
                promptMsg
              };
              const promptRes = await execScriptsToTabInOrder([
                {
                  code: `window.editContentData = ${JSON.stringify(editData)};`
                },
                {
                  file: JS_EDIT_CONTENT
                }
              ]);
              if (Array.isArray(promptRes)) {
                [editedContent] = promptRes;
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
        await new Clip(text, mimeType).copy();
        if (notify) {
          func.push(notifyOnCopy(formatTitle));
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * handle active tab
 *
 * @param {object} info - active tab info
 * @returns {?Function} - updateContextMenu()
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
 * @param {object} info - info
 * @param {object} tab - tabs.Tab
 * @returns {?Function} - handleActiveTab()
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
 * @returns {?Function} - extractClickedData()
 */
export const handleCmd = async cmd => {
  if (!isString(cmd)) {
    throw new TypeError(`Expected String but got ${getType(cmd)}.`);
  }
  const format = cmd.replace(CMD_COPY, '');
  let func;
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
 * @param {*} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async msg => {
  const func = [];
  if (isObjectNotEmpty(msg)) {
    const items = Object.entries(msg);
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
          const { notifyOnCopy: notify } = vars;
          if (notify && value) {
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
 * set variable
 *
 * @param {string} item - item
 * @param {object} obj - value object
 * @param {boolean} changed - changed
 * @returns {Promise.<Array>} - results of each handler
 */
export const setVar = async (item, obj, changed = false) => {
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
        if (checked) {
          vars.iconId = value;
          func.push(setIcon());
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
        vars[item] = !!checked;
        break;
      }
      default: {
        if (hasFormat(item)) {
          const formatItem = getFormat(item);
          formatItem.enabled = !!checked;
          setFormat(item, formatItem);
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
 *
 * @param {object} data - storage data
 * @returns {Promise.<Array>} - results of each handler
 */
export const setVars = async (data = {}) => {
  const func = [];
  const items = Object.entries(data);
  for (const [key, value] of items) {
    const { newValue } = value;
    func.push(setVar(key, newValue || value, !!newValue));
  }
  return Promise.all(func);
};

/**
 * startup
 *
 * @returns {Function} - promise chain
 */
export const startup = async () => {
  await setFormatData();
  return getAllStorage().then(setVars).then(setDefaultIcon)
    .then(createContextMenu);
};

// For test
export { enabledFormats };
