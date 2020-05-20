/**
 * common.js
 */

/* constants */
const TYPE_FROM = 8;
const TYPE_TO = -1;
const VERSION_PART =
  "(?:0|[1-9]\\d{0,3}|[1-5]\\d{4}|6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5]))))";
const PRE_PART = "(?:e(\\d+)?[A-z]+|[A-df-z][A-z]*)(?:-?[A-z\\d]+)*|[A-z]+";
const VERSION_TOOLKIT =
  `(${VERSION_PART}(?:\\.${VERSION_PART}){0,3})(${PRE_PART})?`;
const VERSION_TOOLKIT_REGEXP = new RegExp(`^(?:${VERSION_TOOLKIT})$`);

/**
 * log error
 *
 * @param {!object} e - Error
 * @returns {boolean} - false
 */
export const logErr = e => {
  if (e && e.message) {
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
export const isString = o => typeof o === "string" || o instanceof String;

/**
 * is object, and not an empty object
 *
 * @param {*} o - object to check;
 * @returns {boolean} - result
 */
export const isObjectNotEmpty = o => {
  const items = /Object/i.test(getType(o)) && Object.keys(o);
  return !!(items && items.length);
};

/**
 * stringify positive integer
 *
 * @param {number} i - integer
 * @param {boolean} zero - treat 0 as a positive integer
 * @returns {?string} - stringified integer
 */
export const stringifyPositiveInt = (i, zero = false) => {
  let str;
  if (Number.isSafeInteger(i) && (i > 0 || zero && i === 0)) {
    str = `${i}`;
  }
  return str || null;
};

/**
 * parse stringified integer
 *
 * @param {string} i - stringified integer
 * @param {boolean} [zero] - accept leading zero
 * @returns {number} - integer
 */
export const parseStringifiedInt = (i, zero = false) => {
  if (!isString(i)) {
    throw new TypeError(`Expected String but got ${getType(i)}.`);
  }
  if (!zero && !/^-?(?:0|[1-9]\d*)$/.test(i)) {
    throw new Error(`${i} is not a stringified integer.`);
  }
  return parseInt(i);
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
  return re.global && str.replace(re, (m, c) => `\\${c}`) || null;
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
  return re.global && str.replace(re, "") || null;
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
  return re.global && str.replace(re, (m, c) => `&#${c.charCodeAt(0)};`) ||
         null;
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
  return str.replace(/&(?!(?:(?:(?:[gl]|quo)t|amp)|[\dA-Za-z]+|#(?:\d+|x[\dA-Fa-f]+));)/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") ||
    null;
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
    str.replace(/\\/g, "\\textbackslash[]")
      .replace(/\^/g, "\\textasciicircum[]")
      .replace(/~/g, "\\textasciitilde[]"),
    /([%$#&_{}])/g,
  );
  return spChar && spChar.replace(
    /(\\text(?:backslash|ascii(?:circum|tilde)))\[\]/g,
    (m, c) => `${c}{}`,
  ) || null;
};

/**
 * is valid Toolkit version string
 *
 * @param {string} version - version string
 * @returns {boolean} - result
 */
export const isValidToolkitVersion = version => {
  if (!isString(version)) {
    throw new TypeError(`Expected String but got ${getType(version)}.`);
  }
  return VERSION_TOOLKIT_REGEXP.test(version);
};

/**
 * parse version string
 *
 * @param {string} version - version string
 * @returns {object}
 *   - result which contains properties below
 *     version {string} - given version string
 *     major {number} - major version
 *     minor {number|undefined} - minor version
 *     patch {number|undefined} - patch version
 *     build {number|undefined} - build version
 *     pre {Array<string|number>|undefined} - pre release version in array
 */
export const parseVersion = version => {
  if (!isString(version)) {
    throw new TypeError(`Expected String but got ${getType(version)}.`);
  }
  if (!isValidToolkitVersion(version)) {
    throw new Error(`${version} does not match toolkit format.`);
  }
  const [, vRelease, vPre] = version.match(VERSION_TOOLKIT_REGEXP);
  const [major, minor, patch, build] =
    vRelease.split(".").map(parseStringifiedInt);
  let pre;
  if (vPre) {
    pre = [vPre];
  }
  return {
    version, major, minor, patch, build, pre,
  };
};

/**
 * remove query string from URI
 *
 * @param {string} uri - URI
 * @returns {string} - replaced URI
 */
export const removeQueryFromURI = uri => {
  if (isString(uri)) {
    const query = /\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-F]{2})*/;
    uri = uri.replace(query, "");
  }
  return uri;
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
  return part.replace(/&(?!amp)/g, "&amp;")
    .replace(/([\s<>[\]'^`{|}])/g, (m, c) => encodeURIComponent(c))
    .replace(/(')/g, (m, c) => escape(c)) || "";
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
    hash: frag, origin, pathname: path, protocol, search: query,
  } = url;
  if (protocol === "about:") {
    encUrl = url.href;
  } else {
    const base = protocol === "file:" && `${protocol}//` || origin;
    const encodedUrl = new URL(
      `${encodeUrlPart(path)}${encodeUrlPart(query)}${encodeUrlPart(frag)}`,
      base,
    );
    encUrl = encodedUrl.href;
  }
  return encUrl;
};

/**
 * sleep
 *
 * @param {number} msec - milisec
 * @param {boolean} doReject - reject instead of resolve
 * @returns {?Function} - resolve / reject
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
 * dispatch keyboard event
 *
 * @param {object} elm - element
 * @param {string} type - event type
 * @param {object} keyOpt - key options
 * @returns {void}
 */
export const dispatchKeyboardEvt = (elm, type, keyOpt) => {
  if (elm && elm.nodeType === Node.ELEMENT_NODE &&
      isString(type) && /^key(?:down|press|up)$/.test(type) &&
      isObjectNotEmpty(keyOpt)) {
    const {altKey, code, ctrlKey, key, shiftKey, metaKey} = keyOpt;
    if (isString(key) && isString(code)) {
      const opt = {
        code, key,
        altKey: !!altKey,
        ctrlKey: !!ctrlKey,
        locale: "",
        location: 0,
        metaKey: !!metaKey,
        repeat: false,
        shiftKey: !!shiftKey,
      };
      const evt = new KeyboardEvent(type, opt);
      elm.dispatchEvent(evt);
    }
  }
};

/**
 * dispatch change event
 *
 * @param {object} elm - element
 * @returns {void}
 */
export const dispatchChangeEvt = elm => {
  if (elm && elm.nodeType === Node.ELEMENT_NODE) {
    const opt = {
      bubbles: true,
      cancelable: false,
    };
    const evt = new Event("change", opt);
    elm.dispatchEvent(evt);
  }
};

/**
 * dispatch input event
 *
 * @param {object} elm - element
 * @returns {void}
 */
export const dispatchInputEvt = elm => {
  if (elm && elm.nodeType === Node.ELEMENT_NODE) {
    const opt = {
      bubbles: true,
      cancelable: false,
    };
    const evt = new InputEvent("input", opt);
    elm.dispatchEvent(evt);
  }
};

/**
 * focus element
 *
 * @param {!object} evt - Event
 * @returns {object} - element
 */
export const focusElement = evt => {
  const {target} = evt;
  if (target) {
    target.focus();
  }
  return target || null;
};

/**
 * close window
 *
 * @returns {void}
 */
export const closeWindow = () => {
  window.close();
};
