/**
 * common.js
 */

/* constants */
const TYPE_FROM = 8;
const TYPE_TO = -1;

/**
 * log error
 *
 * @param {!object} e - Error
 * @returns {boolean} - false
 */
export const logErr = e => {
  if (e?.message) {
    console.error(e.message);
  } else {
    console.error(e);
  }
  return false;
};

/**
 * throw error
 *
 * @param {!object} e - Error
 * @throws
 */
export const throwErr = e => {
  logErr(e);
  throw e;
};

/**
 * log warn
 *
 * @param {*} msg - message
 * @returns {boolean} - false
 */
export const logWarn = msg => {
  if (msg) {
    console.warn(msg);
  }
  return false;
};

/**
 * log message
 *
 * @param {*} msg - message
 * @returns {object} - message
 */
export const logMsg = msg => {
  if (msg) {
    console.log(msg);
  }
  return msg;
};

/**
 * get type
 *
 * @param {*} o - object to check
 * @returns {string} - type of object
 */
export const getType = o =>
  Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);

/**
 * is string
 *
 * @param {*} o - object to check
 * @returns {boolean} - result
 */
export const isString = o => typeof o === 'string' || o instanceof String;

/**
 * is object, and not an empty object
 *
 * @param {*} o - object to check;
 * @returns {boolean} - result
 */
export const isObjectNotEmpty = o => {
  const items = /Object/i.test(getType(o)) && Object.keys(o);
  return !!(items?.length);
};

/**
 * sleep
 *
 * @param {number} msec - milisec
 * @param {boolean} doReject - reject instead of resolve
 * @returns {?Promise} - resolve / reject
 */
export const sleep = (msec = 0, doReject = false) => {
  let func;
  if (Number.isInteger(msec) && msec >= 0) {
    func = new Promise((resolve, reject) => {
      if (doReject) {
        setTimeout(reject, msec);
      } else {
        setTimeout(resolve, msec);
      }
    });
  }
  return func || null;
};

/**
 * escape all matching chars
 *
 * @param {string} str - argument
 * @param {RegExp} re - RegExp
 * @returns {?string} - string
 */
export const escapeMatchingChars = (str, re) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  if (!(re instanceof RegExp)) {
    throw new TypeError(`Expected RegExp but got ${getType(re)}.`);
  }
  return re.global ? str.replace(re, (m, c) => `\\${c}`) : null;
};

/**
 * strip all matching chars
 *
 * @param {string} str - string
 * @param {RegExp} re - RegExp
 * @returns {?string} - string
 */
export const stripMatchingChars = (str, re) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  if (!(re instanceof RegExp)) {
    throw new TypeError(`Expected RegExp but got ${getType(re)}.`);
  }
  return re.global ? str.replace(re, '') : null;
};

/**
 * convert matching character to numeric character reference
 *
 * @param {string} str - string
 * @param {RegExp} re - RegExp
 * @returns {?string} - string
 */
export const convertNumCharRef = (str, re) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  if (!(re instanceof RegExp)) {
    throw new TypeError(`Expected RegExp but got ${getType(re)}.`);
  }
  return re.global ? str.replace(re, (m, c) => `&#${c.charCodeAt(0)};`) : null;
};

/**
 * convert HTML specific character to character reference
 *
 * @param {string} str - string
 * @returns {?string} - string
 */
export const convertHtmlChar = str => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  const htmlChar = str
    .replace(/&(?!(?:[\dA-Za-z]+|#(?:\d+|x[\dA-Fa-f]+));)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return htmlChar || null;
};

/**
 * convert LaTeX special char
 *
 * @param {string} str - string
 * @returns {?string} - string
 */
export const convertLaTeXChar = str => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  const spChar = escapeMatchingChars(
    str.replace(/\\/g, '\\textbackslash[]')
      .replace(/\^/g, '\\textasciicircum[]')
      .replace(/~/g, '\\textasciitilde[]'),
    /([%$#&_{}])/g
  );
  const latexChar = spChar?.replace(
    /(\\text(?:backslash|ascii(?:circum|tilde)))\[\]/g,
    (m, c) => `${c}{}`
  );
  return latexChar || null;
};

/**
 * encode URL component part
 *
 * @param {string} part - component part
 * @returns {string} - encoded component part
 */
export const encodeUrlPart = part => {
  if (!isString(part)) {
    throw new TypeError(`Expected String but got ${getType(part)}.`);
  }
  const urlPart = part.replace(/&(?!amp)/g, '&amp;')
    .replace(/([\s<>[\]'^`{|}])/g, (m, c) => encodeURIComponent(c))
    .replace(/(')/g, (m, c) => escape(c));
  return urlPart || '';
};

/**
 * encode special char in URL
 *
 * @param {string} str - URL string
 * @returns {string|undefined} - encoded URL
 */
export const encodeUrlSpecialChar = str => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  let encUrl;
  const url = new URL(str);
  const {
    hash: frag, origin, pathname: path, protocol, search: query
  } = url;
  if (protocol === 'about:') {
    encUrl = url.href;
  } else {
    const base = protocol === 'file:' ? `${protocol}//` : origin;
    const encodedUrl = new URL(
      `${encodeUrlPart(path)}${encodeUrlPart(query)}${encodeUrlPart(frag)}`,
      base
    );
    encUrl = encodedUrl.href;
  }
  return encUrl;
};
