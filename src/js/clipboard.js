/**
 * clipboard.js
 */
"use strict";
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
const EXEC_COPY_TABS_POPUP = "executeCopyAllTabsPopup";
const MIME_HTML = "text/html";
const MIME_PLAIN = "text/plain";
const TYPE_FROM = 8;
const TYPE_TO = -1;
const USER_INPUT = "userInput";
const USER_INPUT_DEFAULT = "Edit content text of the link";

const ASCIIDOC = "AsciiDoc";
const ASCIIDOC_TMPL = "link:%url%[%content%]";
const BBCODE_TEXT = "BBCodeText";
const BBCODE_TEXT_TMPL = "[url=%url%]%content%[/url]";
const BBCODE_URL = "BBCodeURL";
const BBCODE_URL_TMPL = "[url]%content%[/url]";
const HTML = "HTML";
const HTML_TMPL = "<a href=\"%url%\" title=\"%title%\">%content%</a>";
const JIRA = "Jira";
const JIRA_TMPL = "[%content%|%url%]";
const MARKDOWN = "Markdown";
const MARKDOWN_TMPL = "[%content%](%url% \"%title%\")";
const MEDIAWIKI = "MediaWiki";
const MEDIAWIKI_TMPL = "[%url% %content%]";
const REST = "reStructuredText";
const REST_TMPL = "`%content% <%url%>`_";
const TEXT = "Text";
const TEXT_TMPL = "%content% %url%";
const TEXTILE = "Textile";
const TEXTILE_TMPL = "\"%content%\":%url%";

/* variables */
const vars = {
  mimeType: MIME_PLAIN,
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
 * convert matching character to numeric character reference
 * @param {string} str - string
 * @param {RegExp} re - RegExp
 * @returns {?string} - string
 */
const convertNumCharRef = (str, re) =>
  isString(str) && re && re.global &&
  str.replace(re, (m, c) => `&#${c.charCodeAt(0)};`) || null;

/**
 * convert HTML specific character to character reference
 * @param {string} str - string
 * @returns {?string} - string
 */
const convertHtmlChar = str =>
  isString(str) &&
  str.replace(/&(?!(?:(?:(?:[gl]|quo)t|amp)|[\dA-Za-z]+|#(?:\d+|x[\dA-Fa-f]+));)/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") ||
  null;

/**
 * encode URL component part
 * @param {string} part - component part
 * @returns {string} - encoded component part
 */
const encodeUrlPart = part =>
  isString(part) &&
  part.replace(/([\s<>[\]'^`{|}])/g, (m, c) => encodeURIComponent(c))
    .replace(/(')/g, (m, c) => escape(c)) || "";

/**
 * encode special char in URL
 * @param {string} str - URL string
 * @returns {?string} - encoded URL
 */
const encodeUrlSpecialChar = str => {
  let encodedUrl;
  if (isString(str)) {
    const url = new URL(str);
    if (url) {
      const {
        hash: frag, origin, pathname: path, protocol, search: query,
      } = url;
      const base = protocol === "file:" && `${protocol}//` || origin;
      encodedUrl = new URL(
        `${encodeUrlPart(path)}${encodeUrlPart(query)}${encodeUrlPart(frag)}`,
        base
      );
    }
  }
  return encodedUrl && encodedUrl.href || null;
};

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
      let {mimeType: type} = vars;
      if (!isString(type) || !/^text\/(?:plain|html)$/.test(type)) {
        type = MIME_PLAIN;
      }
      document.removeEventListener("copy", setClipboardData, true);
      evt.stopImmediatePropagation();
      evt.preventDefault();
      evt.clipboardData.setData(type, text);
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
  const {content: contentText, menuItemId, mimeType, promptContent} = data;
  let {title, url} = data;
  let content =
    isString(contentText) && contentText.replace(/\s+/g, " ") || "";
  let template, text;
  if (promptContent) {
    content = await editContent(content) || "";
  }
  switch (menuItemId) {
    case `${COPY_ALL_TABS}${ASCIIDOC}`:
    case `${COPY_LINK}${ASCIIDOC}`:
    case `${COPY_PAGE}${ASCIIDOC}`:
    case `${COPY_TAB}${ASCIIDOC}`:
      content = escapeChar(content, /\[[\]]/g) || "";
      url = encodeUrlSpecialChar(url);
      template = ASCIIDOC_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${BBCODE_TEXT}`:
    case `${COPY_LINK}${BBCODE_TEXT}`:
    case `${COPY_PAGE}${BBCODE_TEXT}`:
    case `${COPY_TAB}${BBCODE_TEXT}`:
      content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
      template = BBCODE_TEXT_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${BBCODE_URL}`:
    case `${COPY_LINK}${BBCODE_URL}`:
    case `${COPY_PAGE}${BBCODE_URL}`:
    case `${COPY_TAB}${BBCODE_URL}`:
      content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
      template = BBCODE_URL_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${HTML}`:
    case `${COPY_LINK}${HTML}`:
    case `${COPY_PAGE}${HTML}`:
    case `${COPY_TAB}${HTML}`:
      content = convertHtmlChar(content) || "";
      title = convertHtmlChar(title) || "";
      if (mimeType === MIME_HTML) {
        template = `${HTML_TMPL}<br />`;
      } else {
        template = HTML_TMPL;
      }
      vars.mimeType = mimeType;
      break;
    case `${COPY_ALL_TABS}${JIRA}`:
    case `${COPY_LINK}${JIRA}`:
    case `${COPY_PAGE}${JIRA}`:
    case `${COPY_TAB}${JIRA}`:
      template = JIRA_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${MARKDOWN}`:
    case `${COPY_LINK}${MARKDOWN}`:
    case `${COPY_PAGE}${MARKDOWN}`:
    case `${COPY_TAB}${MARKDOWN}`:
      content = escapeChar(convertHtmlChar(content), /([[\]])/g) || "";
      title = escapeChar(convertHtmlChar(title), /(")/g) || "";
      template = MARKDOWN_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${MEDIAWIKI}`:
    case `${COPY_LINK}${MEDIAWIKI}`:
    case `${COPY_PAGE}${MEDIAWIKI}`:
    case `${COPY_TAB}${MEDIAWIKI}`:
      content = convertNumCharRef(content, /([[\]'~<>{}=*#;:\-|])/g) || "";
      template = MEDIAWIKI_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${REST}`:
    case `${COPY_LINK}${REST}`:
    case `${COPY_PAGE}${REST}`:
    case `${COPY_TAB}${REST}`:
      content = escapeChar(content, /([`<>])/g) || "";
      template = REST_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${TEXT}`:
    case `${COPY_LINK}${TEXT}`:
    case `${COPY_PAGE}${TEXT}`:
    case `${COPY_TAB}${TEXT}`:
      template = TEXT_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    case `${COPY_ALL_TABS}${TEXTILE}`:
    case `${COPY_LINK}${TEXTILE}`:
    case `${COPY_PAGE}${TEXTILE}`:
    case `${COPY_TAB}${TEXTILE}`:
      content = convertHtmlChar(convertNumCharRef(content, /([()])/g)) || "";
      template = TEXTILE_TMPL;
      vars.mimeType = MIME_PLAIN;
      break;
    default:
  }
  if (template) {
    text = template.replace(/%content%/g, content.trim())
      .replace(/%title%/g, title && title.trim() || "")
      .replace(/%url%/g, url.trim());
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
    for (const tabData of allTabs) {
      func.push(createLinkText(tabData));
    }
    text = await Promise.all(func).then(arr => arr.filter(i => i).join("\n"));
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
