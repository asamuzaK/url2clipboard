/**
 * format.js
 */

import {
  convertHtmlChar, convertLaTeXChar, convertNumCharRef,
  encodeUrlSpecialChar, escapeMatchingChars, getType, isString,
  stripMatchingChars,
} from "./common.js";

/* constants */
import {
  ASCIIDOC, BBCODE_TEXT, BBCODE_URL, HTML_HYPER, HTML_PLAIN, JIRA, LATEX,
  MARKDOWN, MEDIAWIKI, MIME_HTML, MIME_PLAIN, REST, TEXTILE,
  TEXT_TEXT_ONLY, TEXT_TEXT_URL, TEXT_URL_ONLY,
} from "./constant.js";

export const formatData = {
  [HTML_PLAIN]: {
    id: HTML_PLAIN,
    enabled: true,
    menu: "HTML (text/&plain)",
    template: "<a href=\"%url%\" title=\"%title%\">%content%</a>",
    templateAlt: "<a href=\"%url%\">%content%</a>",
    title: "HTML (text/plain)",
  },
  [HTML_HYPER]: {
    id: HTML_HYPER,
    enabled: true,
    menu: "&HTML (text/html)",
    template: "<a href=\"%url%\" title=\"%title%\">%content%</a>",
    templateAlt: "<a href=\"%url%\">%content%</a>",
    title: "HTML (text/html)",
  },
  [MARKDOWN]: {
    id: MARKDOWN,
    enabled: true,
    menu: "&Markdown",
    template: "[%content%](%url% \"%title%\")",
    templateAlt: "[%content%](%url%)",
  },
  [BBCODE_TEXT]: {
    id: BBCODE_TEXT,
    enabled: true,
    menu: "&BBCode (Text)",
    template: "[url=%url%]%content%[/url]",
    title: "BBCode (Text)",
  },
  [BBCODE_URL]: {
    id: BBCODE_URL,
    enabled: true,
    menu: "BB&Code (URL)",
    template: "[url]%content%[/url]",
    title: "BBCode (URL)",
  },
  [TEXTILE]: {
    id: TEXTILE,
    enabled: true,
    menu: "Text&ile",
    template: "\"%content%\":%url%",
  },
  [ASCIIDOC]: {
    id: ASCIIDOC,
    enabled: true,
    menu: "&AsciiDoc",
    template: "link:%url%[%content%]",
  },
  [MEDIAWIKI]: {
    id: MEDIAWIKI,
    enabled: true,
    menu: "Media&Wiki",
    template: "[%url% %content%]",
  },
  [JIRA]: {
    id: JIRA,
    enabled: true,
    menu: "&Jira",
    template: "[%content%|%url%]",
  },
  [REST]: {
    id: REST,
    enabled: true,
    menu: "&reStructuredText",
    template: "`%content% <%url%>`_",
  },
  [LATEX]: {
    id: LATEX,
    enabled: true,
    menu: "&LaTeX",
    template: "\\href{%url%}{%content%}",
  },
  [TEXT_TEXT_URL]: {
    id: TEXT_TEXT_URL,
    enabled: true,
    menu: "&Text && URL",
    template: "%content% %url%",
    templateAlt: "%content%\n%url%",
  },
  [TEXT_TEXT_ONLY]: {
    id: TEXT_TEXT_ONLY,
    enabled: true,
    menu: "Te&xt",
    template: "%content%",
    title: "Text",
  },
  [TEXT_URL_ONLY]: {
    id: TEXT_URL_ONLY,
    enabled: true,
    menu: "&URL",
    template: "%url%",
    title: "URL",
  },
};

/**
 * create all tabs link text
 * @param {Array} arr - array of link text
 * @param {string} mime - mime type
 * @returns {string} - joined link text
 */
export const createAllTabsLinkText = async (arr, mime = MIME_PLAIN) => {
  if (!Array.isArray(arr)) {
    throw new TypeError(`Expected Array but got ${getType(arr)}.`);
  }
  const joiner = mime === MIME_HTML && "<br />\n" || "\n";
  return arr.filter(i => i).join(joiner);
};

/**
 * create link text
 * @param {Object} data - copy data
 * @returns {?string} - link text
 */
export const createLinkText = async (data = {}) => {
  const {content: contentText, formatId, template, title, url} = data;
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
      break;
    case LATEX:
      content = convertLaTeXChar(content) || "";
      break;
    case MARKDOWN:
      content = content &&
                escapeMatchingChars(convertHtmlChar(content), /([[\]])/g) || "";
      linkTitle = linkTitle &&
                  escapeMatchingChars(convertHtmlChar(linkTitle), /(")/g) || "";
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
  return template.replace(/%content%/g, content.trim())
    .replace(/%title%/g, linkTitle.trim())
    .replace(/%url%/g, linkUrl.trim());
};
