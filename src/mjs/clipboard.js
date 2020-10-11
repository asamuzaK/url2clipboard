/**
 * clipboard.js
 */

import {
  getType, isString,
} from "./common.js";
import {
  serializeDomString,
} from "./serialize-dom.js";

/* constants */
import {
  MIME_HTML, MIME_PLAIN,
} from "./constant.js";
const REG_DOM_PARSE =
  /text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml/;

/* Clip */
export class Clip {
  /**
   * constructor
   *
   * @param {string} content - content
   * @param {string} mime - mime
   */
  constructor(content, mime) {
    this._content = isString(content) && content.trim() || "";
    this._mime = isString(mime) && mime.trim() || null;
    this._supportedMimeTypes = [
      "application/json",
      "application/xhtml+xml",
      "application/xml",
      "image/svg+xml",
      "text/csv",
      "text/html",
      "text/plain",
      "text/uri-list",
      "text/xml",
    ];
    Object.freeze(this._supportedMimeTypes);
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
   * copy to clipboard sync (for fallback)
   *
   * @returns {void}
   */
  _copySync() {
    /**
     * set clipboard data
     *
     * @param {object} evt - Event
     * @returns {void}
     */
    const setClipboardData = evt => {
      document.removeEventListener("copy", setClipboardData, true);
      evt.stopImmediatePropagation();
      evt.preventDefault();
      if (this._supportedMimeTypes.includes(this._mime)) {
        if (REG_DOM_PARSE.test(this._mime)) {
          const domstr = serializeDomString(this._content, this._mime);
          if (isString(domstr)) {
            evt.clipboardData.setData(this._mime, domstr);
            if (this._mime === MIME_HTML) {
              const doc = new DOMParser().parseFromString(domstr, this._mime);
              evt.clipboardData.setData(MIME_PLAIN, doc.body.textContent);
            }
          }
        } else {
          evt.clipboardData.setData(this._mime, this._content);
        }
      }
    };
    document.addEventListener("copy", setClipboardData, true);
    document.execCommand("copy");
  }

  /**
   * copy to clipboard
   *
   * @returns {void}
   */
  async copy() {
    if (!this._supportedMimeTypes.includes(this._mime)) {
      throw new Error(`Mime type of ${this._mime} is not supported.`);
    }
    if (this._content) {
      const {clipboard} = navigator;
      if (clipboard && typeof clipboard.writeText === "function" &&
          this._mime === MIME_PLAIN) {
        try {
          await clipboard.writeText(this._content);
        } catch (e) {
          this._copySync();
        }
      } else if (clipboard && typeof clipboard.write === "function" &&
                 typeof ClipboardItem === "function") {
        const data = [];
        if (REG_DOM_PARSE.test(this._mime)) {
          const domstr = serializeDomString(this._content, this._mime);
          if (isString(domstr)) {
            const blob = new Blob([domstr], {type: this._mime});
            if (this._mime === MIME_HTML) {
              const doc = new DOMParser().parseFromString(domstr, this._mime);
              const text = new Blob([doc.body.textContent], {type: MIME_PLAIN});
              data.push(new ClipboardItem({
                [this._mime]: blob,
                [MIME_PLAIN]: text,
              }));
            } else {
              data.push(new ClipboardItem({[this._mime]: blob}));
            }
          }
        } else {
          const blob = new Blob([this._content], {type: this._mime});
          data.push(new ClipboardItem({[this._mime]: blob}));
        }
        try {
          data.length && await clipboard.write(data);
        } catch (e) {
          this._copySync();
        }
      } else {
        this._copySync();
      }
    }
  }
}
