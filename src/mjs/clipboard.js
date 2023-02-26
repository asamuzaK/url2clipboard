/**
 * clipboard.js
 */

/* shared */
import { getType, isString } from './common.js';
import { serializeDomString } from './dom-util.js';
import { MIME_HTML, MIME_PLAIN } from './constant.js';

/* constant */
const REG_DOM_PARSE =
  /text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml/;

/* Clip */
export class Clip {
  /* private fields */
  #content;
  #mime;
  #supportedMimeTypes;

  /**
   * constructor
   *
   * @param {string} content - content
   * @param {string} mime - mime
   */
  constructor(content, mime) {
    this.#content = isString(content) ? content.trim() : '';
    this.#mime = isString(mime) ? mime.trim() : null;
    this.#supportedMimeTypes = [
      'application/json',
      'application/xhtml+xml',
      'application/xml',
      'image/svg+xml',
      'text/csv',
      'text/html',
      'text/plain',
      'text/uri-list',
      'text/xml'
    ];
  }

  /* getter / setter */
  get content() {
    return this.#content;
  }

  set content(data) {
    if (!isString(data)) {
      throw new TypeError(`Expected String but got ${getType(data)}.`);
    }
    this.#content = data.trim();
  }

  get mime() {
    return this.#mime;
  }

  set mime(type) {
    if (!isString(type)) {
      throw new TypeError(`Expected String but got ${getType(type)}.`);
    }
    type = type.trim();
    if (!this.#supportedMimeTypes.includes(type)) {
      throw new Error(`Mime type of ${type} is not supported.`);
    }
    this.#mime = type;
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
      document.removeEventListener('copy', setClipboardData, true);
      evt.stopImmediatePropagation();
      evt.preventDefault();
      if (this.#supportedMimeTypes.includes(this.#mime)) {
        if (REG_DOM_PARSE.test(this.#mime)) {
          const domstr = serializeDomString(this.#content, this.#mime);
          if (isString(domstr)) {
            evt.clipboardData.setData(this.#mime, domstr);
            if (this.#mime === MIME_HTML) {
              const doc = new DOMParser().parseFromString(domstr, this.#mime);
              evt.clipboardData.setData(MIME_PLAIN, doc.body.textContent);
            }
          }
        } else {
          evt.clipboardData.setData(this.#mime, this.#content);
        }
      }
    };
    document.addEventListener('copy', setClipboardData, true);
    document.execCommand('copy');
  }

  /**
   * copy to clipboard
   *
   * @returns {Promise.<void>} - void
   */
  async copy() {
    if (!this.#supportedMimeTypes.includes(this.#mime)) {
      throw new Error(`Mime type of ${this.#mime} is not supported.`);
    }
    if (this.#content) {
      console.log(this.#content)
      const { clipboard } = navigator;
      if (typeof clipboard?.writeText === 'function' &&
          this.#mime === MIME_PLAIN) {
        try {
          await clipboard.writeText(this.#content);
        } catch (e) {
          this._copySync();
        }
      } else if (typeof clipboard?.write === 'function' &&
                 typeof ClipboardItem === 'function') {
        const data = [];
        if (REG_DOM_PARSE.test(this.#mime)) {
          const domstr = serializeDomString(this.#content, this.#mime);
          if (isString(domstr)) {
            const blob = new Blob([domstr], { type: this.#mime });
            if (this.#mime === MIME_HTML) {
              const doc = new DOMParser().parseFromString(domstr, this.#mime);
              const text = new Blob([doc.body.textContent], {
                type: MIME_PLAIN
              });
              data.push(new ClipboardItem({
                [this.#mime]: blob,
                [MIME_PLAIN]: text
              }));
            } else {
              data.push(new ClipboardItem({ [this.#mime]: blob }));
            }
          }
        } else {
          const blob = new Blob([this.#content], { type: this.#mime });
          data.push(new ClipboardItem({ [this.#mime]: blob }));
        }
        try {
          if (data.length) {
            await clipboard.write(data);
          }
        } catch (e) {
          this._copySync();
        }
      } else {
        this._copySync();
      }
    }
  }
}
