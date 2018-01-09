/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime, storage, tabs} = browser;

  /* constants */
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const COPY_ALL_TABS = "copyAllTabsURL";
  const COPY_LINK = "copyLinkURL";
  const COPY_PAGE = "copyPageURL";
  const DATA_I18N = "data-i18n";
  const EXEC_COPY = "executeCopy";
  const EXEC_COPY_TABS = "executeCopyAllTabs";
  const EXT_LOCALE = "extensionLocale";
  const LINK_BBCODE = "copyLinkBBCodeURLContent";
  const LINK_CONTENT = "copyLinkContent";
  const LINK_DETAILS = "copyLinkDetails";
  const LINK_MENU = `#${LINK_DETAILS} button,#${LINK_CONTENT},#${LINK_BBCODE}`;
  const OUTPUT_HYPER = "outputTextHtml";
  const OUTPUT_PLAIN = "outputTextPlain";
  const PAGE_BBCODE = "copyPageBBCodeURLContent";
  const PAGE_CONTENT = "copyPageContent";

  const ASCIIDOC = "AsciiDoc";
  const BBCODE_TEXT = "BBCodeText";
  const BBCODE_URL = "BBCodeURL";
  const HTML = "HTML";
  const JIRA = "Jira";
  const MARKDOWN = "Markdown";
  const MEDIAWIKI = "MediaWiki";
  const TEXT = "Text";
  const TEXTILE = "Textile";

  /* variables */
  const vars = {
    mimeType: "text/plain",
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
    arr.length && arr.forEach(tab => {
      const {id, title, url} = tab;
      tabsInfo.push({
        id, menuItemId, mimeType, title, url,
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
    const contentPage = document.getElementById(PAGE_CONTENT);
    const contentBBCode = document.getElementById(PAGE_BBCODE);
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
      const {
        canonicalUrl, title: contextTitle, url: contextUrl,
      } = contextInfo;
      let allTabs, content, title, url;
      switch (menuItemId) {
        case `${COPY_LINK}${ASCIIDOC}`:
        case `${COPY_LINK}${BBCODE_TEXT}`:
        case `${COPY_LINK}${HTML}`:
        case `${COPY_LINK}${JIRA}`:
        case `${COPY_LINK}${MARKDOWN}`:
        case `${COPY_LINK}${MEDIAWIKI}`:
        case `${COPY_LINK}${TEXT}`:
        case `${COPY_LINK}${TEXTILE}`:
          content = document.getElementById(LINK_CONTENT).value || "";
          title = contextTitle;
          url = contextUrl;
          break;
        case `${COPY_LINK}${BBCODE_URL}`:
          content = document.getElementById(LINK_BBCODE).value || "";
          url = contextUrl;
          break;
        case `${COPY_PAGE}${ASCIIDOC}`:
        case `${COPY_PAGE}${BBCODE_TEXT}`:
        case `${COPY_PAGE}${HTML}`:
        case `${COPY_PAGE}${JIRA}`:
        case `${COPY_PAGE}${MARKDOWN}`:
        case `${COPY_PAGE}${MEDIAWIKI}`:
        case `${COPY_PAGE}${TEXT}`:
        case `${COPY_PAGE}${TEXTILE}`:
          content = document.getElementById(PAGE_CONTENT).value || "";
          title = tabTitle;
          url = canonicalUrl || tabUrl;
          break;
        case `${COPY_PAGE}${BBCODE_URL}`:
          content = document.getElementById(PAGE_BBCODE).value || "";
          url = canonicalUrl || tabUrl;
          break;
        case `${COPY_ALL_TABS}${ASCIIDOC}`:
        case `${COPY_ALL_TABS}${BBCODE_TEXT}`:
        case `${COPY_ALL_TABS}${BBCODE_URL}`:
        case `${COPY_ALL_TABS}${HTML}`:
        case `${COPY_ALL_TABS}${JIRA}`:
        case `${COPY_ALL_TABS}${MARKDOWN}`:
        case `${COPY_ALL_TABS}${MEDIAWIKI}`:
        case `${COPY_ALL_TABS}${TEXT}`:
        case `${COPY_ALL_TABS}${TEXTILE}`:
          allTabs = await getAllTabsInfo(menuItemId);
          break;
        default:
      }
      if (allTabs) {
        func.push(runtime.sendMessage({
          [EXEC_COPY_TABS]: {allTabs},
        }));
      } else {
        func.push(runtime.sendMessage({
          [EXEC_COPY]: {
            content, menuItemId, title, url,
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
        node.addEventListener(
          "click",
          evt => createCopyData(evt).catch(logError),
          false
        );
      }
    }
  };

  /**
   * localize node
   * @param {Object} node - Element
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
      const contentLink = document.getElementById(LINK_CONTENT);
      const contentBBCode = document.getElementById(LINK_BBCODE);
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
        case OUTPUT_HYPER:
        case OUTPUT_PLAIN:
          if (checked) {
            vars.mimeType = value;
          }
          break;
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
  storage.onChanged.addListener(data =>
    setVars(data).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  document.addEventListener("DOMContentLoaded", () => Promise.all([
    localizeHtml(),
    addListenerToMenu(),
    getActiveTab().then(tab => Promise.all([
      requestContextInfo(tab),
      setTabInfo(tab),
    ])),
    storage.local.get().then(setVars),
  ]).catch(logError), false);
}
