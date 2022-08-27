/**
 * main.test.js
 */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';
import { editContent } from '../src/mjs/edit-content.js';
import { setFormatData } from '../src/mjs/format.js';
import sinon from 'sinon';
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO, CONTEXT_INFO_GET,
  COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL, COPY_TABS_OTHER,
  COPY_TABS_SELECTED, EXEC_COPY, HTML_HYPER, HTML_PLAIN,
  ICON, ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT,
  ICON_WHITE, INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN,
  INCLUDE_TITLE_MARKDOWN, JS_CONTEXT_INFO, JS_EDIT_CONTENT, NOTIFY_COPY,
  PREFER_CANONICAL, PROMPT, USER_INPUT_DEFAULT
} from '../src/mjs/constant.js';

/* test */
import * as mjs from '../src/mjs/main.js';

describe('main', () => {
  const globalKeys = [
    'Blob',
    'ClipboardItem',
    'DOMParser',
    'HTMLUnknownElement',
    'Node',
    'XMLSerializer'
  ];
  let window, document, navigator;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    if (document.execCommand) {
      sinon.stub(document, 'execCommand');
    } else {
      document.execCommand = sinon.fake();
    }
    navigator = window && window.navigator;
    if (navigator.clipboard) {
      sinon.stub(navigator.clipboard, 'write');
      sinon.stub(navigator.clipboard, 'writeText');
    } else {
      navigator.clipboard = {
        write: sinon.fake(),
        writeText: sinon.fake()
      };
    }
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
    global.window = window;
    global.document = document;
    global.navigator = navigator;
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
    delete global.navigator;
    for (const key of globalKeys) {
      delete global[key];
    }
    browser._sandbox.reset();
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('get format template', () => {
    const func = mjs.getFormatTemplate;
    beforeEach(() => {
      const { vars } = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.separateTextURL = false;
    });
    afterEach(() => {
      const { vars } = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.separateTextURL = false;
    });

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'throw');
      });
    });

    it('should get null', async () => {
      const res = await func('foo');
      assert.isNull(res, 'result');
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}BBCodeText`);
      assert.strictEqual(res, '[url=%url%]%content%[/url]', 'result');
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, '%content% %url%', 'result');
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, '[%content%](%url%)', 'result');
    });

    it('should get value', async () => {
      const { vars } = mjs;
      vars.includeTitleMarkdown = true;
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, '[%content%](%url% "%title%")', 'result');
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(res, '<a href="%url%">%content%</a>', 'result');
    });

    it('should get value', async () => {
      const { vars } = mjs;
      vars.includeTitleHTMLHyper = true;
      const res = await func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(
        res, '<a href="%url%" title="%title%">%content%</a>', 'result'
      );
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(res, '<a href="%url%">%content%</a>', 'result');
    });

    it('should get value', async () => {
      const { vars } = mjs;
      vars.includeTitleHTMLPlain = true;
      const res = await func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(
        res, '<a href="%url%" title="%title%">%content%</a>', 'result'
      );
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, '%content% %url%', 'result');
    });

    it('should get value', async () => {
      mjs.vars.separateTextURL = true;
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, '%content%\n%url%', 'result');
    });
  });

  describe('get all tabs info', () => {
    const func = mjs.getAllTabsInfo;

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'throw');
      });
    });

    it('should get result', async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com'
        }
      ]);
      await setFormatData();
      const res = await func(`${COPY_TABS_ALL}TextURL`);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, 'called');
      assert.deepEqual(res, [
        {
          content: 'foo',
          formatId: 'TextURL',
          id: 1,
          template: '%content% %url%',
          title: 'foo',
          url: 'https://example.com'
        },
        {
          content: 'bar',
          formatId: 'TextURL',
          id: 2,
          template: '%content% %url%',
          title: 'bar',
          url: 'https://www.example.com'
        }
      ], 'result');
    });

    it('should get result', async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com'
        }
      ]);
      await setFormatData();
      const res = await func(`${COPY_TABS_ALL}${BBCODE_URL}`);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, 'called');
      assert.deepEqual(res, [
        {
          content: 'https://example.com',
          formatId: BBCODE_URL,
          id: 1,
          template: '[url]%content%[/url]',
          title: 'foo',
          url: 'https://example.com'
        },
        {
          content: 'https://www.example.com',
          formatId: BBCODE_URL,
          id: 2,
          template: '[url]%content%[/url]',
          title: 'bar',
          url: 'https://www.example.com'
        }
      ], 'result');
    });
  });

  describe('get other tabs info', () => {
    const func = mjs.getOtherTabsInfo;

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'throw');
      });
    });

    it('should get result', async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        active: false,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com'
        }
      ]);
      await setFormatData();
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, 'called');
      assert.deepEqual(res, [
        {
          content: 'foo',
          formatId: 'TextURL',
          id: 1,
          template: '%content% %url%',
          title: 'foo',
          url: 'https://example.com'
        },
        {
          content: 'bar',
          formatId: 'TextURL',
          id: 2,
          template: '%content% %url%',
          title: 'bar',
          url: 'https://www.example.com'
        }
      ], 'result');
    });
  });

  describe('get selected tabs info', () => {
    const func = mjs.getSelectedTabsInfo;

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'throw');
      });
    });

    it('should get result', async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com'
        }
      ]);
      await setFormatData();
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, 'called');
      assert.deepEqual(res, [
        {
          content: 'foo',
          formatId: 'TextURL',
          id: 1,
          template: '%content% %url%',
          title: 'foo',
          url: 'https://example.com'
        },
        {
          content: 'bar',
          formatId: 'TextURL',
          id: 2,
          template: '%content% %url%',
          title: 'bar',
          url: 'https://www.example.com'
        }
      ], 'result');
    });
  });

  describe('get context info', () => {
    const func = mjs.getContextInfo;

    it('should get null', async () => {
      browser.scripting.executeScript.resolves(null);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      browser.scripting.executeScript.resolves([]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      browser.scripting.executeScript.resolves([undefined]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      browser.scripting.executeScript.resolves([{}]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should throw', async () => {
      browser.scripting.executeScript.rejects(new Error('error'));
      browser.tabs.query.resolves([{
        id: 1
      }]);
      await func().catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should throw', async () => {
      browser.scripting.executeScript.resolves([{
        error: new Error('error')
      }]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      await func().catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should get result', async () => {
      browser.scripting.executeScript.resolves([{
        result: {
          foo: 'bar'
        }
      }]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.deepEqual(res, {
        foo: 'bar'
      }, 'result');
    });
  });

  describe('get context info (tabs.executeScript)', () => {
    const func = mjs.getContextInfo;
    beforeEach(() => {
      browser.permissions.contains.withArgs({
        permissions: ['scripting']
      }).resolves(false);
    });

    it('should get null', async () => {
      browser.tabs.executeScript.resolves(null);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      browser.tabs.executeScript.resolves([]);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      browser.tabs.executeScript.rejects(new Error('error'));
      const stubErr = sinon.stub(console, 'error');
      const res = await func();
      const { calledOnce: errCalled } = stubErr;
      stubErr.restore();
      assert.isTrue(errCalled, 'called error');
      assert.isNull(res, 'result');
    });

    it('should get result', async () => {
      browser.tabs.executeScript.resolves([{
        foo: 'bar'
      }]);
      const res = await func();
      assert.deepEqual(res, {
        foo: 'bar'
      }, 'result');
    });
  });

  describe('send context info', () => {
    const func = mjs.sendContextInfo;

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.scripting.executeScript.resolves(null);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.scripting.executeScript.resolves([]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.scripting.executeScript.resolves(['foo']);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.scripting.executeScript.resolves([{}]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get result', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.scripting.executeScript.resolves([{
        result: {
          foo: 'bar'
        }
      }]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.deepEqual(res, {}, 'result');
    });

    it('should throw', async () => {
      browser.scripting.executeScript.resolves([{
        error: new Error('error')
      }]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      await func().catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });
  });

  describe('send context info (tabs.executeScript)', () => {
    const func = mjs.sendContextInfo;
    beforeEach(() => {
      browser.permissions.contains.withArgs({
        permissions: ['scripting']
      }).resolves(false);
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves(null);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves([]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves(['foo']);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves([{}]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get result', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves([{
        foo: 'bar'
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.deepEqual(res, {}, 'result');
    });
  });

  describe('extract clicked data', () => {
    const func = mjs.extractClickedData;
    const optEdit = {
      args: ['foo', USER_INPUT_DEFAULT],
      func: editContent,
      injectImmediately: false,
      target: {
        tabId: 1
      }
    };
    const optInfo = {
      files: [JS_CONTEXT_INFO],
      injectImmediately: false,
      target: {
        tabId: 1
      }
    };
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
      browser.i18n.getMessage.returns(USER_INPUT_DEFAULT);
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const res = await func();
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const res = await func({}, {});
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: null
      };
      const tab = {
        id: null
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: null
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: browser.tabs.TAB_ID_NONE
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should throw if tab does not contain tab url', async () => {
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1
      };
      await func(info, tab).catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should throw if url is not a valid url', async () => {
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        url: 'bar'
      };
      await func(info, tab).catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should throw if menuItemId is not included in format', async () => {
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      await func(info, tab).catch(e => {
        assert.instanceOf(e, TypeError, 'error');
        assert.strictEqual(e.message, 'Expected String but got Null',
          'message');
      });
    });

    it('should not call function if format is not enabled', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: 'TextURL'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: null,
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.write.callCount;
      const menuItemId = HTML_HYPER;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: null,
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.write.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      delete navigator.clipboard.write;
      const { enabledFormats } = mjs;
      const i = document.execCommand.callCount;
      const menuItemId = HTML_HYPER;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: null,
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(document.execCommand.callCount, i + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: 'https://www.example.com',
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      vars.preferCanonicalUrl = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/#foo'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: 'https://www.example.com',
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      vars.preferCanonicalUrl = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.tabs.query.callCount;
      const menuItemId = `${COPY_TABS_ALL}TextURL`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.tabs.query.resolves([{
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      }, {
        id: 2,
        title: 'bar',
        url: 'https://example.com/bar'
      }, {
        id: 3,
        title: 'baz',
        url: 'https://example.com/baz'
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.tabs.query.callCount;
      const menuItemId = `${COPY_TABS_OTHER}TextURL`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.tabs.query.resolves([{
        id: 2,
        title: 'bar',
        url: 'https://example.com/bar'
      }, {
        id: 3,
        title: 'baz',
        url: 'https://example.com/baz'
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.tabs.query.callCount;
      const menuItemId = `${COPY_TABS_SELECTED}TextURL`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.tabs.query.resolves([{
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      }, {
        id: 2,
        title: 'bar',
        url: 'https://example.com/bar'
      }, {
        id: 3,
        title: 'baz',
        url: 'https://example.com/baz'
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TAB}TextURL`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TAB}${BBCODE_URL}`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}TextURL`;
      const info = {
        menuItemId,
        linkText: 'bar',
        linkUrl: 'https://example.com/foo',
        selectionText: 'foo bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: 'https://www.example.com',
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}TextURL`;
      const info = {
        menuItemId,
        linkText: 'bar',
        linkUrl: 'https://example.com/foo'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: 'https://www.example.com',
          content: 'bar',
          selectionText: '',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}TextURL`;
      const info = {
        menuItemId,
        linkUrl: 'https://example.com/foo'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: 'https://www.example.com',
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${BBCODE_URL}`;
      const info = {
        menuItemId,
        linkUrl: 'https://example.com/foo'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: 'https://www.example.com',
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}TextURL`;
      const info = {
        menuItemId,
        selectionText: 'foo bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}TextURL`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      vars.preferCanonicalUrl = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}${BBCODE_URL}`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}TextURL`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      vars.preferCanonicalUrl = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId,
        selectionText: 'foo bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: null,
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: null,
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: null,
          content: 'bar',
          selectionText: '',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: true,
          canonicalUrl: null,
          content: 'bar',
          selectionText: 'foo bar baz',
          title: 'baz',
          url: 'https://example.com/foo'
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: null,
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: '',
          title: null,
          url: null
        }
      }]);
      vars.preferCanonicalUrl = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.scripting.executeScript.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.scripting.executeScript.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId,
        isEdited: true
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should throw', async () => {
      const { enabledFormats, vars } = mjs;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).rejects(
        new Error('error'));
      vars.promptContent = true;
      await func(info, tab).catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should throw', async () => {
      const { enabledFormats, vars } = mjs;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        error: new Error('error')
      }]);
      vars.promptContent = true;
      await func(info, tab).catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.scripting.executeScript.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        result: null
      }]);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.scripting.executeScript.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        result: ''
      }]);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.scripting.executeScript.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        result: 'foo bar'
      }]);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      enabledFormats.add(menuItemId);
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      vars.notifyOnCopy = true;
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });
  });

  describe('extract clicked data (tabs.executeScript)', () => {
    const func = mjs.extractClickedData;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
      browser.permissions.contains.withArgs({
        permissions: ['scripting']
      }).resolves(false);
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({}, {});
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const info = {
        menuitemId: null
      };
      const tab = {
        id: null
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const info = {
        menuitemId: 'foo'
      };
      const tab = {
        id: null
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const info = {
        menuitemId: 'foo'
      };
      const tab = {
        id: browser.tabs.TAB_ID_NONE
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const info = {
        menuitemId: 'foo'
      };
      const tab = {
        id: browser.tabs.TAB_ID_NONE
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should throw if tab does not contain tab url', async () => {
      const info = {
        menuitemId: 'foo'
      };
      const tab = {
        id: 1
      };
      await func(info, tab).catch(e => {
        assert.instanceOf(e, 'Error', 'error');
      });
    });

    it('should throw', async () => {
      const info = {
        menuitemId: 'foo'
      };
      const tab = {
        id: 1,
        url: 'bar'
      };
      await func(info, tab).catch(e => {
        assert.instanceOf(e, 'Error', 'error');
      });
    });

    it('should throw', async () => {
      const info = {
        menuitemId: 'foo'
      };
      const tab = {
        id: 1,
        url: 'https://example.com/'
      };
      await func(info, tab).catch(e => {
        assert.instanceOf(e, 'TypeError', 'error');
        assert.strictEqual(e.message, 'Expected String but got Null',
          'message');
      });
    });

    it('should get empty array', async () => {
      const info = {
        menuitemId: 'TextURL'
      };
      const tab = {
        id: 1,
        url: 'https.example.com/'
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves(false);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(['foo bar']);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k,
        'not called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(['foo bar']);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k,
        'not called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_HYPER;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(['foo bar']);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      window.prompt.returns('foo bar');
      global.window.prompt.returns('foo bar');
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l,
        'not called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_PLAIN;
      const info = {
        isEdited: true,
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(['foo bar']);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k,
        'not called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: 'https://www.example.com/',
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(['foo bar']);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.preferCanonicalUrl = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_PLAIN;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: 'foo bar baz',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: 'foo bar baz',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_PLAIN;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: 'foo bar baz',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_PLAIN;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(null);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}${HTML_PLAIN}`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: 'https://example.com/',
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(false);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}${HTML_PLAIN}`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}${BBCODE_URL}`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: 'https://example.com/',
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}${BBCODE_URL}`;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: 'foo bar baz',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: '',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k,
        'not called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves(false);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves(false);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${BBCODE_URL}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TAB}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TAB}${BBCODE_URL}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j, 'not called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TABS_SELECTED}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TABS_OTHER}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TABS_ALL}${HTML_PLAIN}`;
      const info = {
        menuItemId,
        linkText: 'baz',
        linkUrl: 'https://example.com/'
      };
      const tab = {
        id: 1,
        title: 'bar',
        url: 'https://example.com/'
      };
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.tabs.executeScript.withArgs({
        file: JS_CONTEXT_INFO
      }).resolves([{
        isLink: true,
        canonicalUrl: null,
        content: 'foo',
        selectionText: '',
        title: 'foo bar',
        url: 'https://example.com/'
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves([null]);
      browser.tabs.query.resolves([
        {
          id: 1,
          title: 'foo',
          url: 'https://example.com/'
        },
        {
          id: 2,
          title: 'bar',
          url: 'https://www.example.com/#baz'
        }
      ]);
      enabledFormats.add(menuItemId);
      vars.notifyOnCopy = true;
      vars.preferCanonicalUrl = true;
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount, i, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.strictEqual(browser.notifications.create.callCount, k + 1,
        'called');
      assert.strictEqual(navigator.clipboard.writeText.callCount, l + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });
  });

  describe('handle active tab', () => {
    const func = mjs.handleActiveTab;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should get null', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func(browser.tabs.TAB_ID_NONE);
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func({
        tabId: 1
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.get.callCount;
      const j = browser.menus.update.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}]);
      enabledFormats.add(HTML_PLAIN);
      const res = await func({
        tabId: 1
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, 'called');
      assert.strictEqual(browser.menus.update.callCount, j + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, k + 2, 'called');
      assert.deepEqual(res, [undefined], 'result');
    });
  });

  describe('handle updated tab', () => {
    const func = mjs.handleUpdatedTab;

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected Number but got Undefined.',
          'throw');
      });
    });

    it('should get null', async () => {
      const res = await func(1);
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func(1, {
        status: 'loading'
      }, {
        active: true
      });
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func(1, {
        status: 'complete'
      }, {
        active: false
      });
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func(1, {
        status: 'complete'
      }, {
        active: true
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });
  });

  describe('handle command', () => {
    const func = mjs.handleCmd;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should throw', async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError, 'error');
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'message');
      });
    });

    it('should get null', async () => {
      const res = await func('foo');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([]);
      enabledFormats.add(HTML_PLAIN);
      const res = await func(`${CMD_COPY}${HTML_PLAIN}`);
      assert.strictEqual(browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).callCount, i + 1, 'called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([{
        id: browser.tabs.TAB_ID_NONE
      }]);
      enabledFormats.add(HTML_PLAIN);
      const res = await func(`${CMD_COPY}${HTML_PLAIN}`);
      assert.strictEqual(browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).callCount, i + 1, 'called');
      assert.deepEqual(res, [], 'result');
    });
  });

  describe('handle message', () => {
    const func = mjs.handleMsg;
    beforeEach(() => {
      const { vars } = mjs;
      vars.notifyOnCopy = false;
    });
    afterEach(() => {
      const { vars } = mjs;
      vars.notifyOnCopy = false;
    });

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        foo: 'bar'
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const i = browser.scripting.executeScript.callCount;
      const j = browser.runtime.sendMessage.callCount;
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func({
        [CONTEXT_INFO_GET]: true
      });
      assert.strictEqual(browser.scripting.executeScript.callCount, i + 1,
        'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const i = browser.tabs.executeScript.callCount;
      const j = browser.runtime.sendMessage.callCount;
      browser.permissions.contains.withArgs({
        permissions: ['scripting']
      }).resolves(false);
      const res = await func({
        [CONTEXT_INFO_GET]: true
      });
      assert.strictEqual(browser.tabs.executeScript.callCount, i + 1, 'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should call function', async () => {
      const i = browser.scripting.executeScript.callCount;
      const j = browser.runtime.sendMessage.callCount;
      browser.scripting.executeScript.resolves([{
        result: {
          foo: 'bar'
        }
      }]);
      browser.runtime.sendMessage.resolves({});
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func({
        [CONTEXT_INFO_GET]: true
      });
      assert.strictEqual(browser.scripting.executeScript.callCount, i + 1,
        'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j + 1,
        'called');
      assert.deepEqual(res, [{}], 'result');
    });

    it('should call function', async () => {
      const i = browser.tabs.executeScript.callCount;
      const j = browser.runtime.sendMessage.callCount;
      browser.permissions.contains.withArgs({
        permissions: ['scripting']
      }).resolves(false);
      browser.tabs.executeScript.resolves([{
        foo: 'bar'
      }]);
      browser.runtime.sendMessage.resolves({});
      const res = await func({
        [CONTEXT_INFO_GET]: true
      });
      assert.strictEqual(browser.tabs.executeScript.callCount, i + 1,
        'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j + 1,
        'called');
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      const res = await func({
        [EXEC_COPY]: {}
      });
      assert.deepEqual(res, [[]], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        load: {
          contextInfo: {
            isLink: false,
            content: 'foo',
            title: 'bar',
            selectionText: 'baz',
            url: 'https:www.example.com'
          }
        }
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func({
        load: {
          contextInfo: {
            isLink: false,
            content: 'foo',
            title: 'bar',
            selectionText: 'baz',
            url: 'https:www.example.com'
          }
        }
      }, {
        id: 'qux',
        tab: {
          id: 1
        }
      });
      assert.strictEqual(browser.tabs.get.callCount, i, 'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        keydown: {
          contextInfo: {
            isLink: false,
            content: 'foo',
            title: 'bar',
            selectionText: 'baz',
            url: 'https:www.example.com'
          }
        }
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        mousedown: {
          contextInfo: {
            isLink: false,
            content: 'foo',
            title: 'bar',
            selectionText: 'baz',
            url: 'https:www.example.com'
          }
        }
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const res = await func({
        editedContent: {
          content: 'foo',
          formatId: 'TextURL',
          mimeType: 'text/plain',
          template: '%content% %url%',
          title: 'bar',
          url: 'https://example.com/#baz'
        }
      });
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const res = await func({
        editedContent: {}
      });
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      browser.runtime.getURL.withArgs(ICON).returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.vars.notifyOnCopy = true;
      const i = browser.notifications.create.callCount;
      browser.notifications.create.resolves(true);
      const res = await func({
        [NOTIFY_COPY]: true
      });
      assert.strictEqual(browser.notifications.create.callCount, i + 1,
        'called');
      assert.deepEqual(res, [true], 'result');
    });

    it('should not call function', async () => {
      browser.runtime.getURL.withArgs(ICON).returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.vars.notifyOnCopy = true;
      const i = browser.notifications.create.callCount;
      const res = await func({
        [NOTIFY_COPY]: false
      });
      assert.strictEqual(browser.notifications.create.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      browser.runtime.getURL.withArgs(ICON).returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.vars.notifyOnCopy = false;
      const i = browser.notifications.create.callCount;
      const res = await func({
        [NOTIFY_COPY]: true
      });
      assert.strictEqual(browser.notifications.create.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        [CONTEXT_INFO]: true
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        [CONTEXT_INFO]: {
          contextInfo: {},
          data: {}
        }
      });
      assert.deepEqual(res, [], 'result');
    });
  });

  describe('set variable', () => {
    const func = mjs.setVar;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'throw');
      });
    });

    it('should get empty array', async () => {
      const res = await func('foo');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { enabledFormats } = mjs;
      await setFormatData();
      const res = await func('TextURL', {
        checked: false
      });
      assert.isFalse(enabledFormats.has('TextURL'), 'value');
      assert.deepEqual(res, [enabledFormats], 'result');
    });

    it('should set variable', async () => {
      const { enabledFormats } = mjs;
      await setFormatData();
      const res = await func('TextURL', {
        checked: false
      }, true);
      assert.isFalse(enabledFormats.has('TextURL'), 'value');
      assert.strictEqual(res.length, 1, 'result');
      assert.strictEqual(res[0].length, 90, 'result');
    });

    it('should set variable', async () => {
      const { enabledFormats } = mjs;
      await setFormatData();
      const res = await func('TextURL', {
        checked: true
      });
      assert.isTrue(enabledFormats.has('TextURL'), 'value');
      assert.deepEqual(res, [enabledFormats], 'result');
    });

    it('should set variable', async () => {
      const { enabledFormats } = mjs;
      await setFormatData();
      const res = await func('TextURL', {
        checked: true
      }, true);
      assert.isTrue(enabledFormats.has('TextURL'), 'value');
      assert.strictEqual(res.length, 1, 'result');
      assert.strictEqual(res[0].length, 96, 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: true
      });
      assert.isTrue(vars.includeTitleHTMLHyper, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(INCLUDE_TITLE_HTML_PLAIN, {
        checked: true
      });
      assert.isTrue(vars.includeTitleHTMLPlain, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(INCLUDE_TITLE_MARKDOWN, {
        checked: true
      });
      assert.isTrue(vars.includeTitleMarkdown, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(NOTIFY_COPY, {
        checked: false
      });
      assert.isFalse(vars.notifyOnCopy, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(NOTIFY_COPY, {
        checked: true
      });
      assert.isTrue(vars.notifyOnCopy, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(PREFER_CANONICAL, {
        checked: false
      });
      assert.isFalse(vars.preferCanonicalUrl, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(PREFER_CANONICAL, {
        checked: true
      });
      assert.isTrue(vars.preferCanonicalUrl, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(PROMPT, {
        checked: false
      });
      assert.isFalse(vars.promptContent, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(PROMPT, {
        checked: true
      });
      assert.isTrue(vars.promptContent, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: '#foo'
      }, true);
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should not call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_AUTO, {
        checked: false,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_BLACK, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_COLOR, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_DARK, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_LIGHT, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should call function', async () => {
      const i = browser.browserAction.setIcon.callCount;
      const res = await func(ICON_WHITE, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.browserAction.setIcon.callCount, i + 1,
        'called');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });
  });

  describe('set variables', () => {
    const func = mjs.setVars;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });

    it('should not set variables', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should set variables', async () => {
      const res = await func({
        foo: {
          checked: true
        }
      });
      assert.deepEqual(res, [[]], 'result');
    });
  });

  describe('startup', () => {
    const func = mjs.startup;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.add('HTMLPlain');
      enabledFormats.add('Markdown');
      enabledFormats.add('TextURL');
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should get array', async () => {
      browser.storage.local.get.resolves({});
      const res = await func();
      assert.isArray(res, 'result');
      assert.strictEqual(res.length, 96, 'result');
    });
  });
});
