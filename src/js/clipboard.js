/**
 * clipboard.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime} = browser;

  /* constants */
  const EXEC_COPY = "executeCopy";
  const EXEC_COPY_POPUP = "executeCopyPopup";
  const EXEC_COPY_TABS = "executeCopyAllTabs";
  const EXEC_COPY_TABS_POPUP = "executeCopyAllTabsPopup";
  const MIME_HTML = "text/html";
  const MIME_PLAIN = "text/plain";
  const NOTIFY_COPY = "notifyOnCopy";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;
  const USER_INPUT = "userInput";
  const USER_INPUT_DEFAULT = "Edit content text of the link";

  const ASCIIDOC = "AsciiDoc";
  const BBCODE_TEXT = "BBCodeText";
  const BBCODE_URL = "BBCodeURL";
  const HTML_HYPER = "HTMLHyper";
  const HTML_PLAIN = "HTMLPlain";
  const LATEX = "LaTeX";
  const MARKDOWN = "Markdown";
  const MEDIAWIKI = "MediaWiki";
  const REST = "reStructuredText";
  const TEXTILE = "Textile";

  /* variables */
  const vars = {
    mimeType: MIME_PLAIN,
    notifyLabel: null,
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

  /**
   * strip matching char
   * @param {string} str - string
   * @param {RegExp} re - RegExp
   * @returns {?string} - string
   */
  const stripMatchingChars = (str, re) =>
    isString(str) && re && re.global && str.replace(re, "") || null;

  /**
   * escape matching char
   * @param {string} str - string
   * @param {RegExp} re - RegExp
   * @returns {?string} - string
   */
  const escapeMatchingChars = (str, re) =>
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
   * convert LaTeX special char
   * @param {string} str - string
   * @returns {?string} - string
   */
  const convertLaTeXChar = str =>
    isString(str) && escapeMatchingChars(
      str.replace(/\\/g, "\\textbackslash[]")
        .replace(/\^/g, "\\textasciicircum[]")
        .replace(/~/g, "\\textasciitilde[]"),
      /([%$#&_{}])/g
    ).replace(
      /(\\text(?:backslash|ascii(?:circum|tilde)))\[\]/g,
      (m, c) => `${c}{}`
    ) || null;

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
        const {notifyLabel} = vars;
        let {mimeType: type} = vars;
        if (!isString(type) || !/^text\/(?:plain|html)$/.test(type)) {
          type = MIME_PLAIN;
        }
        document.removeEventListener("copy", setClipboardData, true);
        evt.stopImmediatePropagation();
        evt.preventDefault();
        evt.clipboardData.setData(type, text);
        return runtime.sendMessage({
          [NOTIFY_COPY]: notifyLabel || true,
        });
      };

      document.addEventListener("copy", setClipboardData, true);
      document.execCommand("copy");
    }
  };

  /**
   * edit content
   * @param {string} content - content to edit
   * @param {string} label - format label
   * @returns {?string} - edited content
   */
  const editContent = async (content = "", label = "") => {
    if (!isString(content)) {
      throw new TypeError(`Expected String but got ${getType(content)}.`);
    }
    if (!isString(label)) {
      throw new TypeError(`Expected String but got ${getType(label)}.`);
    }
    const msg = label && await i18n.getMessage(USER_INPUT, label) ||
                USER_INPUT_DEFAULT;
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
      content: contentText, formatId, formatTitle, promptContent, template,
      title, url,
    } = data;
    if (!isString(formatId)) {
      throw new TypeError(`Expected String but got ${getType(formatId)}.`);
    }
    if (!isString(template)) {
      throw new TypeError(`Expected String but got ${getType(template)}.`);
    }
    let linkTitle = title || "";
    let linkUrl = url || "";
    let content = isString(contentText) && contentText.replace(/\s+/g, " ") ||
                  "";
    if (promptContent) {
      content = await editContent(content, formatTitle || formatId) || "";
    }
    switch (formatId) {
      case ASCIIDOC:
        content = escapeMatchingChars(content, /([\]])/g) || "";
        linkUrl = encodeUrlSpecialChar(linkUrl);
        break;
      case BBCODE_TEXT:
      case BBCODE_URL:
        content =
          stripMatchingChars(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
        break;
      case HTML_HYPER:
      case HTML_PLAIN:
        content = convertHtmlChar(content) || "";
        linkTitle = convertHtmlChar(linkTitle) || "";
        linkUrl = encodeUrlSpecialChar(linkUrl);
        break;
      case LATEX:
        content = convertLaTeXChar(content) || "";
        break;
      case MARKDOWN:
        content = content &&
                  escapeMatchingChars(convertHtmlChar(content), /([[\]])/g) ||
                  "";
        linkTitle = linkTitle &&
                    escapeMatchingChars(convertHtmlChar(linkTitle), /(")/g) ||
                    "";
        break;
      case MEDIAWIKI:
        content = convertNumCharRef(content, /([[\]'~<>{}=*#;:\-|])/g) || "";
        break;
      case REST:
        content = escapeMatchingChars(content, /([`<>])/g) || "";
        break;
      case TEXTILE:
        content = content &&
                  convertHtmlChar(convertNumCharRef(content, /([()])/g)) || "";
        break;
      default:
    }
    vars.mimeType = formatId === HTML_HYPER && MIME_HTML || MIME_PLAIN;
    vars.notifyLabel = formatTitle || formatId;
    return template.replace(/%content%/g, content.trim())
      .replace(/%title%/g, linkTitle.trim())
      .replace(/%url%/g, linkUrl.trim());
  };

  /**
   * create all tabs link text
   * @param {Array} arr - array of link text
   * @returns {string} - joined link text
   */
  const createAllTabsLinkText = async arr => {
    const {mimeType} = vars;
    const joiner = mimeType === MIME_HTML && "<br />\n" || "\n";
    return arr.filter(i => i).join(joiner);
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
      text = await Promise.all(func).then(createAllTabsLinkText);
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
  runtime.onMessage.addListener(msg => handleMsg(msg).catch(throwErr));
}
