/**
 * clipboard.js
 */

import {
  getType, isString,
} from "./common.js";

/* constants */
import {
  MIME_HTML, MIME_PLAIN,
} from "./constant.js";

/* Clip */
export class Clip {
  /**
   * constructor
   * @param {string} content - content
   * @param {string} mime - mime
   */
  constructor(content, mime) {
    this._supportedMimeTypes = [
      MIME_HTML,
      MIME_PLAIN,
    ];
    this._content = isString(content) && content.trim() || "";
    this._mime = isString(mime) && mime.trim() || null;
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
        func = clipboard.writeText(this._content);
      /*
      } else if (clipboard && typeof clipboard.write === "function") {
        const data = new Blob();
        data.items.add(this._content, this._mime);
        func = clipboard.write(data);
      */
      } else {
        /**
         * copy to clipboard sync
         * @param {Object} evt - Event
         * @returns {void}
         */
        const copySync = evt => {
          document.removeEventListener("copy", copySync, true);
          evt.stopImmediatePropagation();
          evt.preventDefault();
          evt.clipboardData.setData(this._mime, this._content);
        };
        document.addEventListener("copy", copySync, true);
        document.execCommand("copy");
      }
    }
    return func || null;
  }
}
