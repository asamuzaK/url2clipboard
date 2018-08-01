/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime, storage, tabs} = browser;

  /* constants */
  const CONTENT_LINK = "copyLinkContent";
  const CONTENT_LINK_BBCODE = "copyLinkBBCodeURLContent";
  const CONTENT_PAGE = "copyPageContent";
  const CONTENT_PAGE_BBCODE = "copyPageBBCodeURLContent";
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const COPY_ALL_TABS = "copyAllTabsURL";
  const COPY_LINK = "copyLinkURL";
  const COPY_PAGE = "copyPageURL";
  const DATA_I18N = "data-i18n";
  const EXEC_COPY = "executeCopy";
  const EXEC_COPY_TABS = "executeCopyAllTabs";
  const EXT_LOCALE = "extensionLocale";
  const INCLUDE_TITLE_HTML = "includeTitleHtml";
  const INCLUDE_TITLE_MARKDOWN = "includeTitleMarkdown";
  const LINK_DETAILS = "copyLinkDetails";
  const LINK_MENU =
    `#${LINK_DETAILS} button,#${CONTENT_LINK},#${CONTENT_LINK_BBCODE}`;
  const MIME_HTML = "text/html";
  const MIME_PLAIN = "text/plain";
  const OUTPUT_HTML_HYPER = "outputTextHtml";
  const OUTPUT_HTML_PLAIN = "outputTextPlain";
  const OUTPUT_TEXT = "text";
  const OUTPUT_TEXT_AND_URL = "text_url";
  const OUTPUT_TEXT_TEXT = "outputOnlyText";
  const OUTPUT_TEXT_TEXT_URL = "outputTextUrl";
  const OUTPUT_TEXT_URL = "outputOnlyUrl";
  const OUTPUT_URL = "url";
  const PATH_FORMAT_DATA = "data/format.json";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;

  const BBCODE_URL = "BBCodeURL";
  const HTML = "HTML";
  const MARKDOWN = "Markdown";

  /* variables */
  const vars = {
    includeTitleHtml: true,
    includeTitleMarkdown: true,
    mimeType: MIME_PLAIN,
    textOutput: OUTPUT_TEXT_AND_URL,
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

  /**
   * fetch format data
   * @returns {void}
   */
  const fetchFormatData = async () => {
    const path = await runtime.getURL(PATH_FORMAT_DATA);
    const data = await fetch(path).then(res => res && res.json());
    if (data) {
      const items = Object.entries(data);
      for (const item of items) {
        const [key, value] = item;
        formats.set(key, value);
      }
    }
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
      const {
        includeTitleHtml, includeTitleMarkdown, mimeType, textOutput,
      } = vars;
      switch (itemId) {
        case HTML: {
          template = includeTitleHtml && itemTmpl || itemTmplWoTitle;
          if (mimeType === MIME_HTML) {
            template = `${template}<br />`;
          }
          break;
        }
        case MARKDOWN: {
          template = includeTitleMarkdown && itemTmpl || itemTmplWoTitle;
          break;
        }
        default: {
          if (textOutput === OUTPUT_TEXT) {
            template = itemTmpl.replace(/%url%/g, "").trim();
          } else if (textOutput === OUTPUT_URL) {
            template = itemTmpl.replace(/%content%/g, "").trim();
          } else {
            template = itemTmpl;
          }
        }
      }
    }
    return template || null;
  };

  /**
   * get active tab
   * @returns {Object} - tabs.Tab
   */
  const getActiveTab = async () => {
    const arr = await tabs.query({
      active: true,
      currentWindow: true,
    });
    let tab;
    if (arr.length) {
      [tab] = arr;
    }
    return tab || null;
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

  /* tab info */
  const tabInfo = {
    id: null,
    title: null,
    url: null,
  };

  /**
   * init tab info
   * @returns {Object} - tab info
   */
  const initTabInfo = async () => {
    tabInfo.id = null;
    tabInfo.title = null;
    tabInfo.url = null;
    return tabInfo;
  };

  /**
   * set tab info
   * @param {Object} tab - tabs.Tab
   * @returns {void}
   */
  const setTabInfo = async tab => {
    const contentPage = document.getElementById(CONTENT_PAGE);
    const contentBBCode = document.getElementById(CONTENT_PAGE_BBCODE);
    await initTabInfo();
    if (tab) {
      const {id, title, url} = tab;
      contentPage.value = title;
      contentBBCode.value = url;
      tabInfo.id = id;
      tabInfo.title = title;
      tabInfo.url = url;
    }
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
   * create copy data
   * @param {!Object} evt - Event
   * @returns {void}
   */
  const createCopyData = async evt => {
    const {target} = evt;
    const func = [];
    if (target) {
      const {id: menuItemId} = target;
      const {title: tabTitle, url: tabUrl} = tabInfo;
      const {includeTitleHtml, includeTitleMarkdown, mimeType} = vars;
      const {
        canonicalUrl, title: contextTitle, url: contextUrl,
      } = contextInfo;
      if (menuItemId.startsWith(COPY_ALL_TABS)) {
        const allTabs = await getAllTabsInfo(menuItemId);
        func.push(runtime.sendMessage({
          [EXEC_COPY_TABS]: {
            allTabs, includeTitleHtml, includeTitleMarkdown,
          },
        }));
      } else {
        const template = await getFormatTemplate(menuItemId);
        let content, title, url;
        if (menuItemId.startsWith(COPY_LINK)) {
          if (menuItemId === `${COPY_LINK}${BBCODE_URL}`) {
            content = document.getElementById(CONTENT_LINK_BBCODE).value || "";
            url = contextUrl;
          } else {
            content = document.getElementById(CONTENT_LINK).value || "";
            title = contextTitle;
            url = contextUrl;
          }
        } else if (menuItemId.startsWith(COPY_PAGE)) {
          if (menuItemId === `${COPY_PAGE}${BBCODE_URL}`) {
            content = document.getElementById(CONTENT_PAGE_BBCODE).value || "";
            url = canonicalUrl || tabUrl;
          } else {
            content = document.getElementById(CONTENT_PAGE).value || "";
            title = tabTitle;
            url = canonicalUrl || tabUrl;
          }
        }
        func.push(runtime.sendMessage({
          [EXEC_COPY]: {
            content, includeTitleHtml, includeTitleMarkdown, menuItemId,
            mimeType, template, title, url,
          },
        }));
      }
      func.push(initContextInfo());
    }
    return Promise.all(func);
  };

  /**
   * add listener to menu
   * @returns {void}
   */
  const addListenerToMenu = async () => {
    const nodes = document.querySelectorAll("button");
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        node.addEventListener("click", evt =>
          createCopyData(evt).catch(throwErr)
        );
      }
    }
  };

  /**
   * localize node
   * @param {Object} node - element
   * @returns {void}
   */
  const localizeNode = async node => {
    const [id, ph] = node.getAttribute(DATA_I18N).split(/\s*,\s*/);
    const data = await i18n.getMessage(id, ph);
    data && node.nodeType === Node.ELEMENT_NODE && (node.textContent = data);
    return node;
  };

  /**
   * localize html
   * @returns {Promise.<Array>} - results of each handler
   */
  const localizeHtml = async () => {
    const lang = await i18n.getMessage(EXT_LOCALE);
    const func = [];
    if (lang) {
      const nodes = document.querySelectorAll(`[${DATA_I18N}]`);
      document.documentElement.setAttribute("lang", lang);
      if (nodes instanceof NodeList) {
        for (const node of nodes) {
          func.push(localizeNode(node));
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * update menu
   * @param {Object} data - context data;
   * @returns {void}
   */
  const updateMenu = async (data = {}) => {
    const {contextInfo: info} = data;
    await initContextInfo();
    if (info) {
      const {canonicalUrl, content, isLink, title, url} = info;
      const nodes = document.querySelectorAll(LINK_MENU);
      const contentLink = document.getElementById(CONTENT_LINK);
      const contentBBCode = document.getElementById(CONTENT_LINK_BBCODE);
      contextInfo.isLink = isLink;
      contextInfo.canonicalUrl = canonicalUrl;
      contextInfo.content = content;
      contextInfo.title = title;
      contextInfo.url = url;
      contentLink.value = content || "";
      contentBBCode.value = url || "";
      if (nodes instanceof NodeList) {
        for (const node of nodes) {
          const attr = "disabled";
          if (isLink) {
            node.removeAttribute(attr);
          } else {
            node.setAttribute(attr, attr);
          }
        }
      }
    }
  };

  /**
   * request context info
   * @param {Object} tab - tabs.Tab
   * @returns {void}
   */
  const requestContextInfo = async (tab = {}) => {
    const {id} = tab;
    await initContextInfo();
    if (Number.isInteger(id) && id !== tabs.TAB_ID_NONE) {
      try {
        await tabs.sendMessage(id, {
          [CONTEXT_INFO_GET]: true,
        });
      } catch (e) {
        await updateMenu({
          contextInfo: {
            isLink: false,
            content: null,
            title: null,
            url: null,
            canonicalUrl: null,
          },
        });
      }
    }
  };

  /**
   * handle message
   * @param {*} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async msg => {
    const func = [];
    const items = msg && Object.keys(msg);
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case CONTEXT_INFO:
          case "keydown":
          case "mousedown":
            func.push(updateMenu(obj));
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
  const setVar = async (item, obj) => {
    const func = [];
    if (item && obj) {
      const {checked, value} = obj;
      switch (item) {
        case INCLUDE_TITLE_HTML:
        case INCLUDE_TITLE_MARKDOWN:
          vars[item] = !!checked;
          break;
        case OUTPUT_HTML_HYPER:
        case OUTPUT_HTML_PLAIN:
          if (checked) {
            vars.mimeType = value;
          }
          break;
        case OUTPUT_TEXT_TEXT:
        case OUTPUT_TEXT_TEXT_URL:
        case OUTPUT_TEXT_URL:
          if (checked) {
            vars.textOutput = value;
          }
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
  storage.onChanged.addListener(data => setVars(data).catch(throwErr));
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(throwErr)
  );

  /* startup */
  Promise.all([
    localizeHtml(),
    addListenerToMenu(),
    getActiveTab().then(tab => Promise.all([
      requestContextInfo(tab),
      setTabInfo(tab),
    ])),
    fetchFormatData().then(() => storage.local.get()).then(setVars),
  ]).catch(throwErr);
}
