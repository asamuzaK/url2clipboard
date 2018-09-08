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
  const EXEC_COPY_TABS_POPUP = "executeCopyAllTabsPopup";
  const MIME_HTML = "text/html";
  const MIME_PLAIN = "text/plain";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;
  const USER_INPUT = "userInput";
  const USER_INPUT_DEFAULT = "Edit content text of the link";

  const ASCIIDOC = "AsciiDoc";
  const BBCODE_TEXT = "BBCodeText";
  const BBCODE_URL = "BBCodeURL";
  const HTML = "HTML";
  const LATEX = "LaTeX";
  const MARKDOWN = "Markdown";
  const MEDIAWIKI = "MediaWiki";
  const REST = "reStructuredText";
  const TEXTILE = "Textile";

  /* variables */
  const vars = {
    applyTbFix: false,
    mimeType: MIME_PLAIN,
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
   * convert LaTeX special char
   * @param {string} str - string
   * @returns {?string} - string
   */
  const convertLaTeXChar = str =>
    isString(str) && escapeChar(
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
        const {applyTbFix} = vars;
        let {mimeType: type} = vars;
        if (!isString(type) || !/^text\/(?:plain|html)$/.test(type)) {
          type = MIME_PLAIN;
        }
        // Temporary workaround for Thunderbird bug 554264
        if (type === MIME_HTML && applyTbFix) {
          text = `${text} `;
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
   * get format ID from menu item ID
   * @param {string} menuItemId - menu item ID
   * @returns {?string} - ID
   */
  const getFormatIdFromMenuItemId = async menuItemId => {
    let id;
    if (menuItemId.startsWith(COPY_ALL_TABS)) {
      id = menuItemId.replace(COPY_ALL_TABS, "");
    } else if (menuItemId.startsWith(COPY_LINK)) {
      id = menuItemId.replace(COPY_LINK, "");
    } else if (menuItemId.startsWith(COPY_PAGE)) {
      id = menuItemId.replace(COPY_PAGE, "");
    } else if (menuItemId.startsWith(COPY_TAB)) {
      id = menuItemId.replace(COPY_TAB, "");
    }
    return id || null;
  };

  /**
   * create link text
   * @param {Object} data - copy data
   * @returns {?string} - link text
   */
  const createLinkText = async (data = {}) => {
    const {
      content: contentText, menuItemId, mimeType, promptContent, template,
      title, url,
    } = data;
    if (!isString(template)) {
      throw new TypeError(`Expected String but got ${getType(template)}.`);
    }
    const format = await getFormatIdFromMenuItemId(menuItemId);
    let content = isString(contentText) && contentText.replace(/\s+/g, " ") ||
                  "";
    let linkTitle = title || "";
    let linkUrl = url;
    if (promptContent) {
      content = await editContent(content) || "";
    }
    switch (format) {
      case ASCIIDOC:
        content = escapeChar(content, /\[[\]]/g) || "";
        linkUrl = encodeUrlSpecialChar(url);
        break;
      case BBCODE_TEXT:
      case BBCODE_URL:
        content = stripChar(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || "";
        break;
      case HTML:
        content = convertHtmlChar(content) || "";
        linkTitle = convertHtmlChar(title) || "";
        break;
      case LATEX:
        content = convertLaTeXChar(content) || "";
        break;
      case MARKDOWN:
        content = escapeChar(convertHtmlChar(content), /([[\]])/g) || "";
        linkTitle = escapeChar(convertHtmlChar(title), /(")/g) || "";
        break;
      case MEDIAWIKI:
        content = convertNumCharRef(content, /([[\]'~<>{}=*#;:\-|])/g) || "";
        break;
      case REST:
        content = escapeChar(content, /([`<>])/g) || "";
        break;
      case TEXTILE:
        content = convertHtmlChar(convertNumCharRef(content, /([()])/g)) || "";
        break;
      default:
    }
    vars.mimeType = format === HTML && mimeType || MIME_PLAIN;
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
    const {allTabs, applyTbFix} = data;
    let text;
    vars.applyTbFix = !!applyTbFix;
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
