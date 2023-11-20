/**
 * clipboard.test.js
 */

/* api */
import sinon from 'sinon';
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
// eslint-disable-next-line import/order
import * as mjs from '../src/mjs/clipboard.js';

describe('clipboard', () => {
  const globalKeys = [
    'Blob',
    'ClipboardItem',
    'DOMParser',
    'HTMLUnknownElement',
    'Node',
    'XMLSerializer'
  ];
  let window, document, navigator, globalNavigatorExists;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    navigator = window && window.navigator;
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
    global.window = window;
    global.document = document;
    if (global.navigator) {
      globalNavigatorExists = true;
    } else {
      global.navigator = navigator;
    }
    for (const key of globalKeys) {
      // Not implemented in jsdom
      if (!window[key]) {
        if (key === 'ClipboardItem') {
          window[key] = class ClipboardItem {
            constructor(obj) {
              this._items = new Map();
              this._mimetypes = [
                'application/json',
                'application/xhtml+xml',
                'application/xml',
                'image/gif',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/svg+xml',
                'text/css',
                'text/csv',
                'text/html',
                'text/plain',
                'text/uri-list',
                'text/xml'
              ];
              this._setItems(obj);
            }

            get types() {
              return Array.from(this._items.keys());
            }

            _setItems(obj) {
              const items = Object.entries(obj);
              for (const [mime, blob] of items) {
                if (this._mimetypes.includes(mime) && blob instanceof Blob) {
                  this._items.set(mime, blob);
                } else {
                  this._items.remove(mime);
                }
              }
            }

            async getType(mime) {
              const blob = this._items.get(mime);
              if (!blob) {
                throw new Error(`MIME type ${mime} is not found.`);
              }
              return blob;
            }
          };
        }
      }
      global[key] = window[key];
    }
  });
  afterEach(() => {
    window = null;
    document = null;
    navigator = null;
    delete global.browser;
    delete global.window;
    delete global.document;
    if (globalNavigatorExists) {
      globalNavigatorExists = null;
    } else {
      delete global.navigator;
    }
    for (const key of globalKeys) {
      delete global[key];
    }
    browser._sandbox.reset();
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('Clip', () => {
    const { Clip } = mjs;

    it('should create an instance', () => {
      const clip = new Clip();
      assert.instanceOf(clip, Clip);
    });

    describe('getter / setter', () => {
      it('should throw', () => {
        assert.throws(() => {
          const clip = new Clip();
          clip._supportedMimeTypes.push('text/javascript');
        });
      });

      it('should get value', () => {
        const clip = new Clip('foo');
        assert.strictEqual(clip.content, 'foo', 'value');
      });

      it('should throw', () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.content = 1;
        }, 'Expected String but got Number.');
      });

      it('should set value', () => {
        const clip = new Clip();
        clip.content = 'foo';
        assert.strictEqual(clip.content, 'foo', 'value');
      });

      it('should get vavlue', () => {
        const clip = new Clip('foo', 'bar');
        assert.strictEqual(clip.mime, 'bar', 'value');
      });

      it('should get value', () => {
        const clip = new Clip('foo', 'text/plain');
        assert.strictEqual(clip.mime, 'text/plain', 'value');
      });

      it('should throw', () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.mime = 1;
        }, 'Expected String but got Number.');
      });

      it('should throw', () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.mime = 'image/jpg';
        }, 'Mime type of image/jpg is not supported.');
      });

      it('should throw', () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.mime = ' image/jpg ';
        }, 'Mime type of image/jpg is not supported.');
      });

      it('should set value', () => {
        const clip = new Clip();
        clip.mime = 'text/plain';
        assert.strictEqual(clip.mime, 'text/plain', 'value');
      });

      it('should set value', () => {
        const clip = new Clip();
        clip.mime = ' text/plain ';
        assert.strictEqual(clip.mime, 'text/plain', 'value');
      });

      it('should set value', () => {
        const clip = new Clip();
        clip.mime = 'text/html';
        assert.strictEqual(clip.mime, 'text/html', 'value');
      });

      it('should set value', () => {
        const clip = new Clip();
        clip.mime = 'image/png';
        assert.strictEqual(clip.mime, 'image/png', 'value');
      });
    });

    describe('copy to clipboard sync (for fallback)', () => {
      it('should call function', async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.fake();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData
          }
        };
        const stubAdd =
          sinon.stub(document, 'addEventListener').callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, 'removeEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('foo', 'text/plain');
        await clip._copySync();
        assert.isTrue(stubRemove.calledOnce, 'called');
        assert.isTrue(stubPropagate.calledOnce, 'called');
        assert.isTrue(stubPreventDefault.calledOnce, 'called');
        assert.isTrue(stubSetData.calledOnce, 'called');
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });

      it('should call function', async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.stub();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData
          }
        };
        const stubAdd =
          sinon.stub(document, 'addEventListener').callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, 'removeEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip =
          new Clip('<a href="https://example.com">foo bar</a>', 'text/html');
        const i = stubSetData.withArgs('text/plain', 'foo bar').callCount;
        await clip._copySync();
        assert.isTrue(stubRemove.calledOnce, 'called');
        assert.isTrue(stubPropagate.calledOnce, 'called');
        assert.isTrue(stubPreventDefault.calledOnce, 'called');
        assert.isTrue(stubSetData.calledTwice, 'called');
        assert.strictEqual(
          stubSetData.withArgs('text/plain', 'foo bar').callCount, i + 1,
          'called'
        );
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });

      it('should not call function', async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.stub();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData
          }
        };
        const stubAdd =
          sinon.stub(document, 'addEventListener').callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, 'removeEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('<script>alert(1);</script>', 'text/html');
        const i = stubSetData.callCount;
        await clip._copySync();
        assert.isTrue(stubRemove.calledOnce, 'called');
        assert.isTrue(stubPropagate.calledOnce, 'called');
        assert.isTrue(stubPreventDefault.calledOnce, 'called');
        assert.strictEqual(stubSetData.callCount, i, 'not called');
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });

      it('should throw', async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.stub();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData
          }
        };
        const stubAdd =
          sinon.stub(document, 'addEventListener').callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, 'removeEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('', 'text/xml');
        assert.throws(() => clip._copySync());
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });

      it('should call function', async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.stub();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData
          }
        };
        const stubAdd =
          sinon.stub(document, 'addEventListener').callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, 'removeEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('<xml></xml>', 'text/xml');
        const i = stubSetData.callCount;
        await clip._copySync();
        assert.isTrue(stubRemove.calledOnce, 'called');
        assert.isTrue(stubPropagate.calledOnce, 'called');
        assert.isTrue(stubPreventDefault.calledOnce, 'called');
        assert.strictEqual(stubSetData.callCount, i + 1, 'called');
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });

      it('should not call function', async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.stub();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData
          }
        };
        const stubAdd =
          sinon.stub(document, 'addEventListener').callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, 'removeEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
        const clip = new Clip(png.toString('binary'), 'image/png');
        const i = stubSetData.callCount;
        await clip._copySync();
        assert.isTrue(stubRemove.calledOnce, 'called');
        assert.isTrue(stubPropagate.calledOnce, 'called');
        assert.isTrue(stubPreventDefault.calledOnce, 'called');
        assert.strictEqual(stubSetData.callCount, i + 1, 'called');
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });
    });

    describe('copy to clipboard', () => {
      it('should throw', async () => {
        const clip = new Clip('foo', 'image/jpg');
        await clip.copy().catch(e => {
          assert.instanceOf(e, Error);
          assert.strictEqual(e.message,
            'Mime type of image/jpg is not supported.');
        });
      });

      it('should not call function', async () => {
        const fakeWriteText = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('', 'text/plain');
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { called: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isFalse(calledExec, 'not called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const fakeWriteText = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText
        };
        global.navigator.clipboard = {
          writeText: fakeWriteText
        };
        const clip = new Clip('foo', 'text/plain');
        const res = await clip.copy();
        const { calledOnce: calledWriteText } = fakeWriteText;
        delete navigator.clipboard;
        delete global.navigator.clipboard;
        assert.isTrue(calledWriteText, 'called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const err = new Error('error');
        const fakeWriteText = sinon.fake.throws(err);
        navigator.clipboard = {
          writeText: fakeWriteText
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('foo', 'text/plain');
        const res = await clip.copy().catch(e => {
          assert.isUndefined(e, 'not thrown');
        });
        const { calledOnce: calledWriteText } = fakeWriteText;
        const { calledOnce: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isTrue(calledWriteText, 'called');
        assert.isTrue(calledExec, 'called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const stubAdd = sinon.stub(document, 'addEventListener');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('foo', 'text/plain');
        const res = await clip.copy();
        const { calledOnce: calledAdd } = stubAdd;
        const { calledOnce: calledExec } = fakeExec;
        stubAdd.restore();
        delete document.execCommand;
        assert.isTrue(calledAdd, 'called');
        assert.isTrue(calledExec, 'called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip('<p>foo</p>', 'text/html');
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { calledOnce: calledWrite } = fakeWrite;
        const { called: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isTrue(calledWrite, 'called');
        assert.isFalse(calledExec, 'not called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        delete global.ClipboardItem;
        const clip = new Clip('<p>foo</p>', 'text/html');
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { called: calledWrite } = fakeWrite;
        const { calledOnce: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isFalse(calledWrite, 'not called');
        assert.isTrue(calledExec, 'called');
        assert.isUndefined(res, 'result');
      });

      it('should not call function', async () => {
        const clip = new Clip('<script>foo</script>', 'text/html');
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { called: calledWrite } = fakeWrite;
        const { called: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isFalse(calledWrite, 'not called');
        assert.isFalse(calledExec, 'not called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const err = new Error('error');
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake.throws(err);
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const clip = new Clip('<p>foo</p>', 'text/html');
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const res = await clip.copy().catch(e => {
          assert.isUndefined(e, 'not thrown');
        });
        const { called: calledWriteText } = fakeWriteText;
        const { calledOnce: calledWrite } = fakeWrite;
        const { calledOnce: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isTrue(calledWrite, 'called');
        assert.isTrue(calledExec, 'called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const clip = new Clip('{"foo": "bar"}', 'application/json');
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { calledOnce: calledWrite } = fakeWrite;
        const { called: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isTrue(calledWrite, 'called');
        assert.isFalse(calledExec, 'not called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const clip = new Clip('<xml></xml>', 'text/xml');
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { calledOnce: calledWrite } = fakeWrite;
        const { called: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isTrue(calledWrite, 'called');
        assert.isFalse(calledExec, 'not called');
        assert.isUndefined(res, 'result');
      });

      it('should call function', async () => {
        const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
        const clip = new Clip(png.toString('binary'), 'image/png');
        const fakeWriteText = sinon.fake();
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWriteText,
          write: fakeWrite
        };
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const res = await clip.copy();
        const { called: calledWriteText } = fakeWriteText;
        const { calledOnce: calledWrite } = fakeWrite;
        const { called: calledExec } = fakeExec;
        delete navigator.clipboard;
        delete document.execCommand;
        assert.isFalse(calledWriteText, 'not called');
        assert.isTrue(calledWrite, 'called');
        assert.isFalse(calledExec, 'not called');
        assert.isUndefined(res, 'result');
      });
    });
  });
});
