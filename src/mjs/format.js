/**
 * format.js
 */

/* shared */
import {
  convertHtmlChar, convertLaTeXChar, convertNumCharRef, encodeUrlSpecialChar,
  escapeMatchingChars, getType, isString, stripMatchingChars
} from './common.js';
import { sanitizeAttributes } from './sanitize.js';
import {
  ASCIIDOC, BBCODE, COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL,
  COPY_TABS_OTHER, COPY_TABS_SELECTED, DOKUWIKI, HTML_HYPER, HTML_PLAIN,
  JIRA, LATEX, MARKDOWN, MEDIAWIKI, MIME_HTML, ORG_MODE, REST, TEXTILE,
  TEXT_TEXT_ONLY, TEXT_TEXT_URL, TEXT_URL_ONLY
} from './constant.js';

/* format data */
export const formatData = {
  [HTML_PLAIN]: {
    id: HTML_PLAIN,
    enabled: true,
    menu: 'HTML (text/&plain)',
    template: '<a href="%url%" title="%title%"%attr%>%content%</a>',
    templateAlt: '<a href="%url%"%attr%>%content%</a>',
    title: 'HTML (text/plain)'
  },
  [HTML_HYPER]: {
    id: HTML_HYPER,
    enabled: true,
    menu: '&HTML (text/html)',
    template: '<a href="%url%" title="%title%"%attr%>%content%</a>',
    templateAlt: '<a href="%url%"%attr%>%content%</a>',
    title: 'HTML (text/html)'
  },
  [MARKDOWN]: {
    id: MARKDOWN,
    enabled: true,
    menu: '&Markdown',
    template: '[%content%](%url% "%title%")',
    templateAlt: '[%content%](%url%)'
  },
  [BBCODE]: {
    id: BBCODE,
    enabled: true,
    menu: '&BBCode',
    template: '[url=%url%]%content%[/url]',
    title: 'BBCode'
  },
  [TEXTILE]: {
    id: TEXTILE,
    enabled: true,
    menu: 'Text&ile',
    template: '"%content%":%url%'
  },
  [ASCIIDOC]: {
    id: ASCIIDOC,
    enabled: true,
    menu: '&AsciiDoc',
    template: 'link:%url%[%content%]'
  },
  [MEDIAWIKI]: {
    id: MEDIAWIKI,
    enabled: true,
    menu: 'Media&Wiki',
    template: '[%url% %content%]'
  },
  [DOKUWIKI]: {
    id: DOKUWIKI,
    enabled: true,
    menu: '&DokuWiki',
    template: '[[%url%|%content%]]'
  },
  [JIRA]: {
    id: JIRA,
    enabled: true,
    menu: '&Jira',
    template: '[%content%|%url%]'
  },
  [REST]: {
    id: REST,
    enabled: true,
    menu: '&reStructuredText',
    template: '`%content% <%url%>`_'
  },
  [LATEX]: {
    id: LATEX,
    enabled: true,
    menu: '&LaTeX',
    template: '\\href{%url%}{%content%}'
  },
  [ORG_MODE]: {
    id: ORG_MODE,
    enabled: true,
    menu: '&Org Mode',
    template: '[[%url%]%content%]'
  },
  [TEXT_TEXT_URL]: {
    id: TEXT_TEXT_URL,
    enabled: true,
    menu: '&Text && URL',
    template: '%content% %url%',
    templateAlt: '%content%\n%url%',
    title: 'Text & URL'
  },
  [TEXT_TEXT_ONLY]: {
    id: TEXT_TEXT_ONLY,
    enabled: true,
    menu: 'Te&xt',
    template: '%content%',
    title: 'Text'
  },
  [TEXT_URL_ONLY]: {
    id: TEXT_URL_ONLY,
    enabled: true,
    menu: '&URL',
    template: '%url%',
    title: 'URL'
  }
};

/* formats */
export const formats = new Map(Object.entries(formatData));

/**
 * get formats
 * @param {boolean} [inArray] - return in an array
 * @returns {object|Array} - formats
 */
export const getFormats = (inArray = false) =>
  inArray ? [...formats.entries()] : formats.entries();

/**
 * get formats keys
 * @param {boolean} [inArray] - return in an array
 * @returns {object|Array} - formats
 */
export const getFormatsKeys = (inArray = false) =>
  inArray ? [...formats.keys()] : formats.keys();

/**
 * get format id
 * @param {string} id - id
 * @returns {?string} - format id
 */
export const getFormatId = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  if (id.startsWith(COPY_TABS_ALL)) {
    id = id.replace(COPY_TABS_ALL, '');
  } else if (id.startsWith(COPY_TABS_OTHER)) {
    id = id.replace(COPY_TABS_OTHER, '');
  } else if (id.startsWith(COPY_TABS_SELECTED)) {
    id = id.replace(COPY_TABS_SELECTED, '');
  } else if (id.startsWith(COPY_LINK)) {
    id = id.replace(COPY_LINK, '');
  } else if (id.startsWith(COPY_PAGE)) {
    id = id.replace(COPY_PAGE, '');
  } else if (id.startsWith(COPY_TAB)) {
    id = id.replace(COPY_TAB, '');
  }
  return id || null;
};

/**
 * has format
 * @param {string} id - id
 * @returns {boolean} - result
 */
export const hasFormat = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const key = getFormatId(id);
  return formats.has(key);
};

/**
 * get format
 * @param {string} id - id
 * @returns {*|null} - format item
 */
export const getFormat = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const key = getFormatId(id);
  let item;
  if (key) {
    item = formats.get(key);
  }
  return item || null;
};

/**
 * set format
 * @param {string} id - id
 * @param {*} value - value
 * @returns {void}
 */
export const setFormat = (id, value) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const key = getFormatId(id);
  if (key && formats.has(key)) {
    formats.set(key, value);
  }
};

/**
 * get format title
 * @param {string} id - menu item ID
 * @returns {?string} - title
 */
export const getFormatTitle = id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const item = getFormat(id);
  let title;
  if (item) {
    const { id: itemId, title: itemTitle } = item;
    title = itemTitle || itemId;
  }
  return title || null;
};

/* enabled formats */
export const enabledFormats = new Set();

/**
 * toggle enabled formats
 * @param {string} id - format id
 * @param {boolean} [enabled] - format is enabled
 * @returns {Promise.<object>} - enabledFormats
 */
export const toggleEnabledFormats = async (id, enabled) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const keys = getFormatsKeys(true);
  const formatId = getFormatId(id);
  if (keys.includes(formatId) && enabled) {
    enabledFormats.add(formatId);
  } else {
    enabledFormats.delete(formatId);
  }
  return enabledFormats;
};

/**
 * set format data
 * @returns {Promise.<Array>} - result of each handler
 */
export const setFormatData = async () => {
  const items = getFormats(true);
  const func = [];
  for (const [key, value] of items) {
    const { enabled } = value;
    func.push(toggleEnabledFormats(key, enabled));
  }
  return Promise.all(func);
};

/**
 * create multiple tabs link text
 * @param {Array} arr - array of link text
 * @param {object} [opt] - options
 * @param {string} [opt.mimeType] - mime type
 * @param {boolean} [opt.newLine] - new line
 * @returns {string} - joined link text
 */
export const createTabsLinkText = (arr, opt = {}) => {
  if (!Array.isArray(arr)) {
    throw new TypeError(`Expected Array but got ${getType(arr)}.`);
  }
  const { mimeType, newLine } = opt;
  let joiner;
  if (mimeType === MIME_HTML) {
    joiner = '<br />\n';
  } else if (newLine) {
    joiner = '\n\n';
  } else {
    joiner = '\n';
  }
  return arr.filter(i => i).join(joiner);
};

/**
 * create link text
 * @param {object} [data] - copy data
 * @returns {Promise.<string>} - link text
 */
export const createLinkText = async (data = {}) => {
  let {
    attr = '', content = '', formatId, template, title = '', url = ''
  } = data;
  if (!isString(formatId)) {
    throw new TypeError(`Expected String but got ${getType(formatId)}.`);
  }
  if (!isString(template)) {
    throw new TypeError(`Expected String but got ${getType(template)}.`);
  }
  attr = attr.trim();
  content = content.replace(/\s+/g, ' ').trim();
  title = title.trim();
  url = url.trim();
  switch (formatId) {
    case ASCIIDOC:
      if (content) {
        content = escapeMatchingChars(content, /(\])/g);
      }
      break;
    case BBCODE:
      if (content) {
        content = stripMatchingChars(content, /\[(?:url(?:=.*)?|\/url)\]/gi);
      }
      break;
    case HTML_HYPER:
    case HTML_PLAIN:
      if (content) {
        content = convertHtmlChar(content);
      }
      if (title) {
        title = convertHtmlChar(title);
      }
      if (url) {
        url = encodeUrlSpecialChar(url);
      }
      if (/#.*:~:/.test(url)) {
        if (/rel="?[\sa-z-]+"?/i.test(attr)) {
          let rel;
          let value;
          if (/rel=[a-z-]+/i.test(attr)) {
            [rel, value] = attr.match(/rel=([a-z-]+)/i);
          } else {
            [rel, value] = attr.match(/rel="([\sa-z-]+)"/i);
          }
          if (!value.includes('noopener')) {
            attr = attr.replace(rel, `rel="noopener ${value}"`);
          }
        } else {
          attr += ' rel="noopener"';
        }
      }
      if (attr) {
        const sanitizedAttr = await sanitizeAttributes(attr);
        attr = sanitizedAttr ? ` ${sanitizedAttr}` : '';
      }
      break;
    case LATEX:
      if (content) {
        content = convertLaTeXChar(content);
      }
      break;
    case MARKDOWN:
      if (content) {
        content = escapeMatchingChars(convertHtmlChar(content), /([[\]])/g);
      }
      if (title) {
        title = escapeMatchingChars(convertHtmlChar(title), /(")/g);
      }
      break;
    case MEDIAWIKI:
      if (content) {
        content = convertNumCharRef(content, /([[\]'~<>{}=*#;:\-|])/g);
      }
      break;
    case ORG_MODE:
      if (content) {
        content = `[${content}]`;
      }
      break;
    case REST:
      if (content) {
        content = escapeMatchingChars(content, /([`<>])/g);
      }
      break;
    case TEXTILE:
      if (content) {
        content = convertHtmlChar(convertNumCharRef(content, /([()])/g));
      }
      break;
    default:
  }
  return template.replace(/%content%/g, content).replace(/%url%/g, url)
    .replace(/%title%/g, title).replace(/%attr%/g, attr);
};
