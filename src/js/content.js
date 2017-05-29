/**
 * content.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const COPY_LINK = "copyLinkURL";
  const COPY_PAGE = "copyPageURL";
  const EXEC_COPY = "executeCopy";
  const MOUSE_BUTTON_RIGHT = 2;
  const USER_INPUT = "userInput";
  const USER_INPUT_DEFAULT = "Input Title";

  const BBCODE_TEXT = "BBCodeText";
  const BBCODE_TEXT_TEMPLATE = "[url=%url%]%content%[/url]";
  const BBCODE_URL = "BBCodeURL";
  const BBCODE_URL_TEMPLATE = "[url]%content%[/url]";
  const HTML = "HTML";
  const HTML_TEMPLATE = "<a href=\"%url%\" title=\"%title%\">%content%</a>";
  const MARKDOWN = "Markdown";
  const MARKDOWN_TEMPLATE = "[%content%](%url% \"%title%\")";
  const TEXT = "Text";
  const TEXT_TEMPLATE = "%content% <%url%>";

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
   * send message
   * @param {*} msg - message
   * @returns {?AsyncFunction} - send message to runtime
   */
  const sendMsg = async msg => {
    const func = msg && runtime.sendMessage(msg);
    return func || null;
  };

  /**
   * get anchor element
   * @param {Object} node - element
   * @returns {Object} - anchor element
   */
  const getAnchorElm = async node => {
    const root = document.documentElement;
    let elm;
    if (root) {
      while (node && node.parentNode && node.parentNode !== root) {
        if (node.localName === "a") {
          elm = node;
          break;
        }
        node = node.parentNode;
      }
    }
    return elm || null;
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
    contextInfo.content = document.title;
    contextInfo.title = document.title;
    contextInfo.url = document.URL;
    return contextInfo;
  };

  /**
   * create context info
   * @param {Object} node - element
   * @returns {Object} - context info
   */
  const createContextInfo = async node => {
    await initContextInfo();
    if (node.nodeType === Node.ELEMENT_NODE) {
      const anchor = await getAnchorElm(node);
      if (anchor) {
        const {textContent, href, title} = anchor;
        if (href) {
          const content = textContent.trim().replace(/\s+/g, " ");
          const url = href instanceof SVGAnimatedString && href.baseVal || href;
          contextInfo.isLink = true;
          contextInfo.content = content;
          contextInfo.title = title || content;
          contextInfo.url = url;
        }
      }
    }
    return contextInfo;
  };

  /**
   * send status
   * @param {!Object} evt - Event
   * @returns {AsyncFunction} - send message
   */
  const sendStatus = async evt => {
    const {target, type} = evt;
    const enabled = /^(?:(?:(?:application\/(?:[\w\-.]+\+)?|image\/[\w\-.]+\+)x|text\/(?:ht|x))ml)$/.test(document.contentType);
    const info = await createContextInfo(target);
    const msg = {
      [type]: {
        enabled, info,
      },
    };
    return sendMsg(msg);
  };

  /**
   * copy to clipboard
   * @param {string} text - text to copy
   * @returns {void}
   */
  const copyToClipboard = async text => {
    const clipText = isString(text) && text.trim() || "";
    if (clipText) {
      /**
       * set clipboard data
       * @param {!Object} evt - Event
       * @returns {void}
       */
      const setClipboardData = evt => {
        document.removeEventListener("copy", setClipboardData, true);
        evt.stopImmediatePropagation();
        evt.preventDefault();
        evt.clipboardData.setData("text/plain", clipText);
      };
      document.addEventListener("copy", setClipboardData, true);
      document.execCommand("copy");
    }
  };

  /**
   * create link text
   * @param {Object} data - link data
   * @returns {?string} - link text
   */
  const createLink = async (data = {}) => {
    const {content, menuItemId, template, title, url} = data;
    let text;
    if (isString(menuItemId) && isString(template)) {
      const contentText = isString(content) && content.trim() || "";
      const urlText = isString(url) && url.trim() || "";
      let titleText = isString(title) && title || "";
      if (titleText) {
        switch (menuItemId) {
          case `${COPY_LINK}${HTML}`:
          case `${COPY_PAGE}${HTML}`:
            titleText = titleText.replace(/"/g, "\\\"");
            break;
          case `${COPY_LINK}${MARKDOWN}`:
          case `${COPY_PAGE}${MARKDOWN}`:
            titleText = titleText.replace(/"/g, "\\\"");
            break;
          default:
        }
        titleText = titleText.trim();
      }
      text = template.replace(/%content%/g, contentText)
               .replace(/%title%/g, titleText).replace(/%url%/g, urlText);
    }
    return text || null;
  };

  /**
   * create user input link
   * @param {Object} data - copy data
   * @returns {?string} - text
   */
  const createUserInputLink = async (data = {}) => {
    const {content: contentText, menuItemId, title, url} = data;
    const msg = await i18n.getMessage(USER_INPUT) || USER_INPUT_DEFAULT;
    const content = await window.prompt(msg, contentText || "");
    let text;
    switch (menuItemId) {
      case `${COPY_LINK}${BBCODE_TEXT}`:
      case `${COPY_PAGE}${BBCODE_TEXT}`:
        text = await createLink({
          content, menuItemId, url,
          template: BBCODE_TEXT_TEMPLATE,
        });
        break;
      case `${COPY_LINK}${BBCODE_URL}`:
      case `${COPY_PAGE}${BBCODE_URL}`:
        text = await createLink({
          content, menuItemId,
          template: BBCODE_URL_TEMPLATE,
        });
        break;
      case `${COPY_LINK}${HTML}`:
      case `${COPY_PAGE}${HTML}`:
        text = await createLink({
          content, menuItemId, title, url,
          template: HTML_TEMPLATE,
        });
        break;
      case `${COPY_LINK}${MARKDOWN}`:
      case `${COPY_PAGE}${MARKDOWN}`:
        text = await createLink({
          content, menuItemId, title, url,
          template: MARKDOWN_TEMPLATE,
        });
        break;
      case `${COPY_LINK}${TEXT}`:
      case `${COPY_PAGE}${TEXT}`:
        text = await createLink({
          content, menuItemId, url,
          template: TEXT_TEMPLATE,
        });
        break;
      default:
    }
    return text || null;
  };

  /**
   * extract copy data
   * @param {Object} data - copy data
   * @returns {Promise.<Array>} - results of each handler
   */
  const extractCopyData = async (data = {}) => {
    const {menuItemId, selectionText} = data;
    const {content: contentText, title, url} = contextInfo;
    const content = (menuItemId === `${COPY_LINK}${BBCODE_URL}` ||
                     menuItemId === `${COPY_PAGE}${BBCODE_URL}`) && url ||
                    selectionText || contentText || title;
    const text = await createUserInputLink({
      content, menuItemId, title, url,
    });
    const func = [];
    text && func.push(copyToClipboard(text));
    func.push(initContextInfo());
    return Promise.all(func);
  };

  /**
   * handle message
   * @param {*} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async (msg = {}) => {
    const items = msg && Object.keys(msg);
    const func = [];
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case EXEC_COPY:
            func.push(extractCopyData(obj));
            break;
          case CONTEXT_INFO_GET:
            func.push(sendMsg({
              [CONTEXT_INFO]: {
                info: contextInfo,
              },
            }));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /* listeners */
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(logError));

  window.addEventListener(
    "load",
    evt => sendStatus(evt).catch(logError),
    false
  );
  window.addEventListener(
    "keydown",
    evt => (evt.altKey && evt.shiftKey && evt.key === "C" ||
            evt.shiftKey && evt.key === "F10" ||
            evt.key === "ContextMenu") &&
             sendStatus(evt).catch(logError),
    true
  );
  window.addEventListener(
    "mousedown",
    evt => evt.button === MOUSE_BUTTON_RIGHT &&
             sendStatus(evt).catch(logError),
    true
  );
}
