/**
 * clipboard.js
 */

import {
  getType, isString, throwErr,
} from "./common.js";
import {
  createNotification,
} from "./browser.js";

/* api */
const {i18n, runtime} = browser;

/* constants */
import {
  ICON, MIME_PLAIN, NOTIFY_COPY,
} from "./constant.js";

/**
 * notify on copy
 * @returns {AsyncFunction} - createNotification()
 */
export const notifyOnCopy = async () => {
  const msg = {
    iconUrl: runtime.getURL(ICON),
    message: i18n.getMessage("notifyOnCopyMsg"),
    title: i18n.getMessage("extensionName"),
    type: "basic",
  };
  return createNotification(NOTIFY_COPY, msg);
};

/* Clip */
export class Clip {
  /**
   * constructor
   * @param {string} content - content
   * @param {string} mime - mime
   * @param {boolean} notify - notify on copy
   */
  constructor(content, mime, notify) {
    this._supportedMimeTypes = [
      "text/html",
      "text/plain",
    ];
    this._content = isString(content) && content.trim() || "";
    this._mime = isString(mime) && mime.trim() || null;
    this._notify = !!notify;
  }

  /* getter / setter */
  get content() {
    return this._content;
  }
  set content(data) {
    if (!isString(data)) {
      throw new TypeError(`Expected String but got ${getType(data)}.`);
    }
    this._content = data.trim();
  }

  get mime() {
    return this._mime;
  }
  set mime(type) {
    if (!isString(type)) {
      throw new TypeError(`Expected String but got ${getType(type)}.`);
    }
    type = type.trim();
    if (!this._supportedMimeTypes.includes(type)) {
      throw new Error(`Mime type of ${type} is not supported.`);
    }
    this._mime = type;
  }

  get notify() {
    return this._notify;
  }
  set notify(bool) {
    this._notify = !!bool;
  }

  /**
   * copy to clipboard sync
   * @param {Object} evt - Event
   * @returns {?AsyncFunction} - notifyOnCopy()
   */
  _copySync(evt) {
    let func;
    document.removeEventListener("copy", this._copySync, true);
    evt.stopImmediatePropagation();
    evt.preventDefault();
    evt.clipboardData.setData(this._mime, this._content);
    if (this._notify) {
      func = notifyOnCopy().catch(throwErr);
    }
    return func || null;
  }

  /**
   * copy to clipboard
   * @returns {?AsyncFunction} - notifyOnCopy()
   */
  async copy() {
    if (!this._supportedMimeTypes.includes(this._mime)) {
      throw new Error(`Mime type of ${this._mime} is not supported.`);
    }
    let func;
    if (this._content) {
      const {clipboard} = navigator;
      if (clipboard && typeof clipboard.writeText === "function" &&
          this._mime === MIME_PLAIN) {
        await clipboard.writeText(this._content);
        if (this._notify) {
          func = notifyOnCopy();
        }
      /*
      } else if (clipboard && typeof clipboard.write === "function") {
        const data = new DataTransfer();
        data.items.add(this._content, this._mime);
        await clipboard.write(data);
        if (this._notify) {
          func = notifyOnCopy();
        }
      */
      } else {
        document.addEventListener("copy", this._copySync, true);
        document.execCommand("copy");
      }
    }
    return func || null;
  }
}
