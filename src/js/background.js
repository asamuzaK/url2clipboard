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
  const EXT_NAME = "extensionName";
  const FUNC_COPY = "copyToClipboard";
  const FUNC_PROMPT = "editContent";
  const ICON = "img/icon.svg";
  const KEY = "Alt+Shift+C";

  const BBCODE = "BBCode";
  const BBCODE_TEXT = "BBCodeText";
  const BBCODE_TEXT_TMPL = "[url=%url%]%content%[/url]";
  const BBCODE_URL = "BBCodeURL";
  const BBCODE_URL_TMPL = "[url]%content%[/url]";
  const HTML = "HTML";
  const HTML_TMPL = "<a href=\"%url%\" title=\"%title%\">%content%</a>";
  const MARKDOWN = "Markdown";
  const MARKDOWN_TMPL = "[%content%](%url% \"%title%\")";
  const TEXT = "Text";
  const TEXT_TMPL = "%content% %url%";

  /* variables */
  const vars = {
    enabled: false,
    usePrompt: true,
  };

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
   * strip matching char
   * @param {string} str - string
   * @param {RegExp} re - RegExp
   * @returns {?string} - string
   */
  const stripChar = (str, re) =>
    isString(str) && re && re.global && str.replace(re, "") || null;

  /**
   * escape matching char
   * @param {string} str - string
   * @param {RegExp} re - RegExp
   * @returns {?string} - string
   */
  const escapeChar = (str, re) =>
    isString(str) && re && re.global &&
    str.replace(re, (m, c) => `\\${c}`) || null;

  /**
   * convert HTML specific character to character reference
   * @param {string} str - string
   * @returns {?string} - string
   */
  const convertHtmlChar = str =>
    isString(str) &&
    str.replace(/&(?!(?:[\dA-Za-z]+|#(?:\d+|x[\dA-Fa-f]+));)/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") ||
    null;

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

  /* enabled tabs collection */
  const enabledTabs = {};

  /**
   * exec script in tab
   * @param {number} tabId - tab ID
   * @param {Object} opt - options
   * @returns {?AsyncFunction} - executed function
   */
  const execScriptInTab = async (tabId, opt = {}) => {
    let func;
    if (!enabledTabs[stringifyPositiveInt(tabId)]) {
      const items = Object.keys(enabledTabs);
      for (let item of items) {
        const obj = enabledTabs[item];
        item *= 1;
        if (obj && Number.isInteger(item)) {
          tabId = item;
          break;
        }
      }
    }
    if (await isTab(tabId)) {
      const {arg, name} = opt;
      if (isString(name)) {
        const [defined] = await tabs.executeScript(tabId, {
          code: `typeof ${name} === "function";`,
        });
        if (!defined) {
          let {file} = opt;
          file = await extension.getURL(file);
          await tabs.executeScript(tabId, {file});
        }
        func = tabs.executeScript(tabId, {
          code: `${name}(${JSON.stringify({arg})});`,
        });
      }
    }
    return func || null;
  };

  /**
   * exec copy to clipboard
   * @param {number} tabId - tab ID
   * @param {string} text - text to copy
   * @returns {?AsyncFunction} - execScriptInTab;
   */
  const execCopyToClipboard = async (tabId, text) => {
    let func;
    if (isString(text)) {
      const opt = {
        arg: text,
        name: FUNC_COPY,
        file: CLIPBOARD,
      };
      func = execScriptInTab(tabId, opt);
    }
    return func || null;
  };

  /**
   * exec edit content
   * @param {number} tabId - tab ID
   * @param {string} content - content to edit
   * @returns {?AsyncFunction} - execScriptInTab
   */
  const execEditContent = async (tabId, content) => {
    let func;
    if (isString(content)) {
      const opt = {
        arg: content,
        name: FUNC_PROMPT,
        file: CLIPBOARD,
      };
      func = execScriptInTab(tabId, opt);
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
    const func = [];
    const items = Object.keys(menuItems);
    for (const item of items) {
      const {contexts, id, subItems, title} = menuItems[item];
      const enabled = false;
      const itemData = {contexts, enabled};
      const subMenuItems = Object.keys(subItems);
      func.push(createMenuItem(id, title, itemData));
      for (const subItem of subMenuItems) {
        const {id: subItemId, title: subItemTitle} = subItems[subItem];
        const subItemData = {
          contexts, enabled,
          parentId: id,
        };
        func.push(createMenuItem(subItemId, subItemTitle, subItemData));
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
    const {enabled} = vars;
    const isHtml = Number.isInteger(tabId) &&
      enabledTabs[stringifyPositiveInt(tabId)] || false;
    const items = Object.keys(menuItems);
    const func = [];
    for (const item of items) {
      const {id, subItems} = menuItems[item];
      const subMenuItems = Object.keys(subItems);
      if (id === COPY_LINK) {
        func.push(contextMenus.update(id, {enabled: !!isHtml}));
      } else {
        func.push(contextMenus.update(id, {enabled: !!enabled}));
      }
      for (const subItem of subMenuItems) {
        const {id: subItemId} = subItems[subItem];
        switch (subItemId) {
          case `${COPY_LINK}${BBCODE_TEXT}`:
          case `${COPY_LINK}${BBCODE_URL}`:
          case `${COPY_LINK}${HTML}`:
          case `${COPY_LINK}${MARKDOWN}`:
            func.push(contextMenus.update(subItemId, {enabled: !!isHtml}));
            break;
          default:
            func.push(contextMenus.update(subItemId, {enabled: !!enabled}));
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * show icon
   * @returns {Promise.<Array>} - results of each handler
   */
  const showIcon = async () => {
    const {enabled} = vars;
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
   * toggle enabled
   * @param {boolean} enabled - enabled
   * @returns {void}
   */
  const toggleEnabled = async (enabled = false) => {
    enabled && (vars.enabled = !!enabled);
    if (!vars.enabled) {
      const items = Object.keys(enabledTabs);
      for (const item of items) {
        const obj = enabledTabs[item];
        obj && (vars.enabled = !!obj);
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
      const id = stringifyPositiveInt(tabId);
      id && (enabledTabs[id] = !!enabled);
      await toggleEnabled(!!enabled);
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
    if ((tabId = stringifyPositiveInt(tabId)) && enabledTabs[tabId]) {
      const bool = delete enabledTabs[tabId];
      if (bool) {
        const tab = await getActiveTab();
        const [id] = tab;
        vars.enabled = false;
        await toggleEnabled();
        func.push(showIcon(), updateContextMenu(id));
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
   * create link text
   * @param {Object} data - copy data
   * @returns {?string} - link text
   */
  const createLinkText = async (data = {}) => {
    const {
      content: contentText, menuItemId, tabId, title, url, usePrompt,
    } = data;
    let [content] = usePrompt ?
      await execEditContent(tabId, contentText || "") || [""] :
      [contentText || ""];
    let template, text, titleText;
    switch (menuItemId) {
      case `${COPY_LINK}${BBCODE_TEXT}`:
      case `${COPY_PAGE}${BBCODE_TEXT}`:
      case `${COPY_TABS}${BBCODE_TEXT}`:
        content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
        template = BBCODE_TEXT_TMPL;
        break;
      case `${COPY_LINK}${BBCODE_URL}`:
      case `${COPY_PAGE}${BBCODE_URL}`:
      case `${COPY_TABS}${BBCODE_URL}`:
        content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
        template = BBCODE_URL_TMPL;
        break;
      case `${COPY_LINK}${HTML}`:
      case `${COPY_PAGE}${HTML}`:
      case `${COPY_TABS}${HTML}`:
        content = convertHtmlChar(content) || "";
        titleText = convertHtmlChar(title) || "";
        template = HTML_TMPL;
        break;
      case `${COPY_LINK}${MARKDOWN}`:
      case `${COPY_PAGE}${MARKDOWN}`:
      case `${COPY_TABS}${MARKDOWN}`:
        content = escapeChar(content, /([[\]])/g) || "";
        titleText = escapeChar(title, /(")/g) || "";
        template = MARKDOWN_TMPL;
        break;
      case `${COPY_LINK}${TEXT}`:
      case `${COPY_PAGE}${TEXT}`:
      case `${COPY_TABS}${TEXT}`:
        template = TEXT_TMPL;
        break;
      default:
    }
    if (template) {
      const c = content.trim();
      const t = titleText && titleText.trim() || title && title.trim() || "";
      const u = url.trim();
      text = template.replace(/%content%/g, c).replace(/%title%/g, t)
        .replace(/%url%/g, u);
    }
    return text || null;
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
      const {usePrompt} = vars;
      const {
        content: contextContent, title: contextTitle, url: contextUrl,
      } = contextInfo;
      let content, text, title, url;
      switch (menuItemId) {
        case `${COPY_LINK}${BBCODE_TEXT}`:
        case `${COPY_LINK}${HTML}`:
        case `${COPY_LINK}${MARKDOWN}`:
        case `${COPY_LINK}${TEXT}`:
        case `${COPY_PAGE}${BBCODE_TEXT}`:
        case `${COPY_PAGE}${HTML}`:
        case `${COPY_PAGE}${MARKDOWN}`:
        case `${COPY_PAGE}${TEXT}`:
          content = selectionText || contextContent || contextTitle || tabTitle;
          title = contextTitle || tabTitle;
          url = contextUrl || tabUrl;
          text = await createLinkText({
            content, menuItemId, tabId, title, url, usePrompt,
          });
          break;
        case `${COPY_LINK}${BBCODE_URL}`:
        case `${COPY_PAGE}${BBCODE_URL}`:
          content = contextUrl || tabUrl;
          url = contextUrl || tabUrl;
          text = await createLinkText({
            content, menuItemId, tabId, url, usePrompt,
          });
          break;
        case `${COPY_TABS}${BBCODE_TEXT}`:
        case `${COPY_TABS}${HTML}`:
        case `${COPY_TABS}${MARKDOWN}`:
        case `${COPY_TABS}${TEXT}`:
        case `${COPY_TABS}${BBCODE_URL}`:
          console.log(menuItemId);
          break;
        default:
      }
      text && func.push(execCopyToClipboard(tabId, text));
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
      func.push(showIcon(), updateContextMenu(tabId));
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
            func.push(updateContextInfo(obj));
            break;
          case "load":
            func.push(
              setEnabledTab(tabId, tab, obj).then(handleActiveTab),
              updateContextInfo(obj)
            );
            break;
          case "menuItemId":
            func.push(createTabData(obj).then(extractClickedData));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /* listeners */
  contextMenus.onClicked.addListener((info, tab) =>
    extractClickedData({info, tab}).catch(logError)
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
