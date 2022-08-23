/**
 * format.js
 */

/* shared */
import {
  convertHtmlChar, convertLaTeXChar, convertNumCharRef,
  encodeUrlSpecialChar, escapeMatchingChars, getType, isString,
  stripMatchingChars
} from './common.js';
import {
  ASCIIDOC, BBCODE_TEXT, BBCODE_URL,
  COPY_LINK, COPY_PAGE, COPY_TAB,
  COPY_TABS_ALL, COPY_TABS_OTHER, COPY_TABS_SELECTED,
  HTML_HYPER, HTML_PLAIN, JIRA, LATEX, MARKDOWN, MEDIAWIKI,
  MIME_HTML, MIME_PLAIN, ORG_MODE, REST, TEXTILE,
  TEXT_TEXT_ONLY, TEXT_TEXT_URL, TEXT_URL_ONLY
} from './constant.js';

/* format data */
export const formatData = {
  [HTML_PLAIN]: {
    id: HTML_PLAIN,
    enabled: true,
    menu: 'HTML (text/&plain)',
    template: '<a href="%url%" title="%title%">%content%</a>',
    templateAlt: '<a href="%url%">%content%</a>',
    title: 'HTML (text/plain)'
  },
  [HTML_HYPER]: {
    id: HTML_HYPER,
    enabled: true,
    menu: '&HTML (text/html)',
    template: '<a href="%url%" title="%title%">%content%</a>',
    templateAlt: '<a href="%url%">%content%</a>',
    title: 'HTML (text/html)'
  },
  [MARKDOWN]: {
    id: MARKDOWN,
    enabled: true,
    menu: '&Markdown',
    template: '[%content%](%url% "%title%")',
    templateAlt: '[%content%](%url%)'
  },
  [BBCODE_TEXT]: {
    id: BBCODE_TEXT,
    enabled: true,
    menu: '&BBCode (Text)',
    template: '[url=%url%]%content%[/url]',
    title: 'BBCode (Text)'
  },
  [BBCODE_URL]: {
    id: BBCODE_URL,
    enabled: true,
    menu: 'BB&Code (URL)',
    template: '[url]%content%[/url]',
    title: 'BBCode (URL)'
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
    template: '[[%url%][%content%]]'
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
 *
 * @param {boolean} inArray - return in an array
 * @returns {object|Array} - formats
 */
export const getFormats = (inArray = false) =>
  inArray ? [...formats.entries()] : formats.entries();

/**
 * get formats keys
 *
 * @param {boolean} inArray - return in an array
 * @returns {object|Array} - formats
 */
export const getFormatsKeys = (inArray = false) =>
  inArray ? [...formats.keys()] : formats.keys();

/**
 * get format id
 *
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
 *
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
 *
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
 *
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
 *
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
 *
 * @param {string} id - format id
 * @param {boolean} enabled - format is enabled
 * @returns {object} - enabledFormats
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
 *
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
 *
 * @param {Array} arr - array of link text
 * @param {string} mime - mime type
 * @returns {string} - joined link text
 */
export const createTabsLinkText = (arr, mime = MIME_PLAIN) => {
  if (!Array.isArray(arr)) {
    throw new TypeError(`Expected Array but got ${getType(arr)}.`);
  }
  const joiner = mime === MIME_HTML ? '<br />\n' : '\n';
  return arr.filter(i => i).join(joiner);
};

/**
 * create link text
 *
 * @param {object} data - copy data
 * @returns {string} - link text
 */
export const createLinkText = (data = {}) => {
  const { content: contentText, formatId, template, title, url } = data;
  if (!isString(formatId)) {
    throw new TypeError(`Expected String but got ${getType(formatId)}.`);
  }
  if (!isString(template)) {
    throw new TypeError(`Expected String but got ${getType(template)}.`);
  }
  let content = isString(contentText) ? contentText.replace(/\s+/g, ' ') : '';
  let linkTitle = title || '';
  let linkUrl = url || '';
  switch (formatId) {
    case ASCIIDOC:
      content = escapeMatchingChars(content, /([\]])/g) || '';
      linkUrl = encodeUrlSpecialChar(linkUrl);
      break;
    case BBCODE_TEXT:
      content =
        stripMatchingChars(content, /\[(?:url(?:=.*)?|\/url)\]/ig) || '';
      linkUrl = encodeUrlSpecialChar(linkUrl);
      break;
    case BBCODE_URL:
      content = encodeUrlSpecialChar(content);
      break;
    case HTML_HYPER:
    case HTML_PLAIN:
      content = convertHtmlChar(content) || '';
      linkTitle = convertHtmlChar(linkTitle) || '';
      linkUrl = encodeUrlSpecialChar(linkUrl);
      break;
    case LATEX:
      content = convertLaTeXChar(content) || '';
      break;
    case MARKDOWN:
      content =
        (content &&
         escapeMatchingChars(convertHtmlChar(content), /([[\]])/g)) ||
        '';
      linkTitle =
        (linkTitle &&
         escapeMatchingChars(convertHtmlChar(linkTitle), /(")/g)) ||
        '';
      break;
    case MEDIAWIKI:
      content = convertNumCharRef(content, /([[\]'~<>{}=*#;:\-|])/g) || '';
      break;
    case REST:
      content = escapeMatchingChars(content, /([`<>])/g) || '';
      break;
    case TEXTILE:
      content =
        (content && convertHtmlChar(convertNumCharRef(content, /([()])/g))) ||
        '';
      break;
    default:
  }
  return template.replace(/%content%/g, content.trim())
    .replace(/%title%/g, linkTitle.trim())
    .replace(/%url%/g, linkUrl.trim());
};
