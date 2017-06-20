/**
 * clipboard.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const COPY_ALL_TABS = "copyAllTabsURL";
  const COPY_LINK = "copyLinkURL";
  const COPY_PAGE = "copyPageURL";
  const COPY_TAB = "copyTabURL";
  const EXEC_COPY = "executeCopy";
  const EXEC_COPY_POPUP = "executeCopyPopup";
  const EXEC_COPY_TABS = "executeCopyAllTabs";
  const EXEC_COPY_TABS_POPUP = "executeCopyAllTabs";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;
  const USER_INPUT = "userInput";
  const USER_INPUT_DEFAULT = "Input Title";

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
   * close window
   * @returns {void}
   */
  const closeWindow = () => {
    window.close();
  };

  /**
   * copy to clipboard
   * @param {string} text - text to copy
   * @returns {void}
   */
  const copyToClipboard = async (text = "") => {
    if (!isString(text)) {
      throw new TypeError(`Expected String but got ${getType(text)}.`);
    }
    text = text.trim() || "";
    if (text) {
      /**
       * set clipboard data
       * @param {!Object} evt - Event
       * @returns {void}
       */
      const setClipboardData = evt => {
        document.removeEventListener("copy", setClipboardData, true);
        evt.stopImmediatePropagation();
        evt.preventDefault();
        evt.clipboardData.setData("text/plain", text);
      };

      document.addEventListener("copy", setClipboardData, true);
      document.execCommand("copy");
    }
  };

  /**
   * edit content
   * @param {string} content - content to edit
   * @returns {?string} - edited content
   */
  const editContent = async (content = "") => {
    if (!isString(content)) {
      throw new TypeError(`Expected String but got ${getType(content)}.`);
    }
    const msg = await i18n.getMessage(USER_INPUT) || USER_INPUT_DEFAULT;
    content = window.prompt(msg, content.trim());
    return content;
  };

  /**
   * create link text
   * @param {Object} data - copy data
   * @returns {?string} - link text
   */
  const createLinkText = async (data = {}) => {
    const {
      content: contentText, menuItemId, url, promptContent,
    } = data;
    let {title} = data;
    let content = promptContent ?
      await editContent(contentText || "") || "" :
      contentText || "";
    let template, text;
    switch (menuItemId) {
      case `${COPY_ALL_TABS}${BBCODE_TEXT}`:
      case `${COPY_LINK}${BBCODE_TEXT}`:
      case `${COPY_PAGE}${BBCODE_TEXT}`:
      case `${COPY_TAB}${BBCODE_TEXT}`:
        content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
        template = BBCODE_TEXT_TMPL;
        break;
      case `${COPY_ALL_TABS}${BBCODE_URL}`:
      case `${COPY_LINK}${BBCODE_URL}`:
      case `${COPY_PAGE}${BBCODE_URL}`:
      case `${COPY_TAB}${BBCODE_URL}`:
        content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
        template = BBCODE_URL_TMPL;
        break;
      case `${COPY_ALL_TABS}${HTML}`:
      case `${COPY_LINK}${HTML}`:
      case `${COPY_PAGE}${HTML}`:
      case `${COPY_TAB}${HTML}`:
        content = convertHtmlChar(content) || "";
        title = convertHtmlChar(title) || "";
        template = HTML_TMPL;
        break;
      case `${COPY_ALL_TABS}${MARKDOWN}`:
      case `${COPY_LINK}${MARKDOWN}`:
      case `${COPY_PAGE}${MARKDOWN}`:
      case `${COPY_TAB}${MARKDOWN}`:
        content = escapeChar(content, /([[\]])/g) || "";
        title = escapeChar(title, /(")/g) || "";
        template = MARKDOWN_TMPL;
        break;
      case `${COPY_ALL_TABS}${TEXT}`:
      case `${COPY_LINK}${TEXT}`:
      case `${COPY_PAGE}${TEXT}`:
      case `${COPY_TAB}${TEXT}`:
        template = TEXT_TMPL;
        break;
      default:
    }
    if (template) {
      const c = content.trim();
      const t = title && title.trim() || "";
      const u = url.trim();
      text = template.replace(/%content%/g, c).replace(/%title%/g, t)
        .replace(/%url%/g, u);
    }
    return text || null;
  };

  /**
   * extract copy data
   * @param {Object} data - copy data
   * @returns {?string} - link text
   */
  const extractCopyData = async (data = {}) => {
    const {allTabs} = data;
    let text;
    if (Array.isArray(allTabs)) {
      const func = [];
      for (const tab of allTabs) {
        func.push(createLinkText(tab));
      }
      text = await Promise.all(func).then(arr => arr.join("\n"));
    } else {
      text = await createLinkText(data);
    }
    return text || null;
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
          case EXEC_COPY_TABS:
            func.push(extractCopyData(obj).then(copyToClipboard));
            break;
          case EXEC_COPY_POPUP:
          case EXEC_COPY_TABS_POPUP:
            func.push(
              extractCopyData(obj).then(copyToClipboard).then(closeWindow)
            );
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /* listener */
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(logError));
}
