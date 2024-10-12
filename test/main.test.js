/**
 * main.test.js
 */
/* eslint-disable import-x/order */

/* api */
import sinon from 'sinon';
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import {
  ATTR_HTML_HYPER, ATTR_HTML_PLAIN, BBCODE_URL, CMD_COPY, CONTEXT_INFO,
  CONTEXT_INFO_GET, COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL,
  COPY_TABS_OTHER, COPY_TABS_SELECTED, EXEC_COPY, HTML_HYPER, HTML_PLAIN,
  ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT, ICON_WHITE,
  INCLUDE_ATTR_HTML_HYPER, INCLUDE_ATTR_HTML_PLAIN, INCLUDE_TITLE_HTML_HYPER,
  INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN, JS_CONTEXT_INFO, MARKDOWN,
  NOTIFY_COPY, OPTIONS_OPEN, PREFER_CANONICAL, PROMPT, TEXT_FRAG_HTML_HYPER,
  TEXT_FRAG_HTML_PLAIN, TEXT_SEP_LINES, USER_INPUT_DEFAULT, WEBEXT_ID
} from '../src/mjs/constant.js';
import { editContent } from '../src/mjs/edit-content.js';
import {
  getFormat, getFormatsKeys, setFormat, setFormatData
} from '../src/mjs/format.js';
import * as mjs from '../src/mjs/main.js';

describe('main', () => {
  const globalKeys = [
    'Blob',
    'ClipboardItem',
    'DOMParser',
    'DOMPurify',
    'HTMLUnknownElement',
    'Node',
    'XMLSerializer'
  ];
  let window, document, navigator, globalNavigatorExists;
  beforeEach(() => {
    const stubWrite = sinon.stub();
    const stubWriteText = sinon.stub();
    const dom = createJsdom();
    window = dom && dom.window;
    document = window.document;
    document.execCommand = sinon.stub();
    navigator = window.navigator;
    navigator.clipboard = {
      write: stubWrite,
      writeText: stubWriteText
    };
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    browser.storage.local.get.resolves({});
    global.browser = browser;
    global.window = window;
    global.document = document;
    if (global.navigator) {
      globalNavigatorExists = true;
      global.navigator.clipboard = {
        write: stubWrite,
        writeText: stubWriteText
      };
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
      delete global.navigator.clipboard;
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

  it('should get DOMPurify', () => {
    assert.isFunction(window.DOMPurify, 'DOMPurify');
  });

  describe('set user options', () => {
    const func = mjs.setUserOpts;
    beforeEach(() => {
      mjs.userOpts.clear();
    });
    afterEach(() => {
      mjs.userOpts.clear();
    });

    it('should set user option', async () => {
      const res = await func({
        foo: {
          checked: true
        }
      });
      assert.deepEqual(res, mjs.userOpts, 'result');
      assert.strictEqual(res.size, 1, 'size');
      assert.isTrue(res.has('foo'), 'key');
      assert.isTrue(res.get('foo'), 'value');
    });

    it('should call function', async () => {
      const res = await func();
      assert.deepEqual(res, mjs.userOpts, 'result');
      assert.strictEqual(res.size, 0, 'size');
    });

    it('should call function', async () => {
      browser.storage.local.get.resolves({
        [INCLUDE_TITLE_HTML_HYPER]: {
          checked: true
        },
        [PROMPT]: {
          checked: false
        }
      });
      const res = await func();
      assert.deepEqual(res, mjs.userOpts, 'result');
      assert.strictEqual(res.size, 2, 'size');
      assert.isTrue(res.has(INCLUDE_TITLE_HTML_HYPER), 'key');
      assert.isTrue(res.get(INCLUDE_TITLE_HTML_HYPER), 'value');
      assert.isTrue(res.has(PROMPT), 'key');
      assert.isFalse(res.get(PROMPT), 'value');
    });

    it('should call function', async () => {
      browser.storage.local.get.resolves({
        [INCLUDE_ATTR_HTML_HYPER]: {
          checked: true
        },
        [ATTR_HTML_HYPER]: {
          value: 'class="foo bar" target="_blank"'
        },
        [INCLUDE_ATTR_HTML_PLAIN]: {
          checked: false
        },
        [ATTR_HTML_PLAIN]: {
          value: ''
        }
      });
      const res = await func();
      assert.deepEqual(res, mjs.userOpts, 'result');
      assert.strictEqual(res.size, 4, 'size');
      assert.isTrue(res.has(INCLUDE_ATTR_HTML_HYPER), 'key');
      assert.isTrue(res.get(INCLUDE_ATTR_HTML_HYPER), 'value');
      assert.isTrue(res.has(ATTR_HTML_HYPER), 'key');
      assert.strictEqual(res.get(ATTR_HTML_HYPER),
        'class="foo bar" target="_blank"', 'value');
      assert.isTrue(res.has(INCLUDE_ATTR_HTML_PLAIN), 'key');
      assert.isFalse(res.get(INCLUDE_ATTR_HTML_PLAIN), 'value');
      assert.isTrue(res.has(ATTR_HTML_PLAIN), 'key');
      assert.strictEqual(res.get(ATTR_HTML_PLAIN), '', 'value');
    });
  });

  describe('set user enabled formats', () => {
    const func = mjs.setUserEnabledFormats;
    beforeEach(() => {
      const keys = getFormatsKeys(true);
      for (const key of keys) {
        const formatItem = getFormat(key);
        formatItem.enabled = true;
        setFormat(key, formatItem);
      }
      mjs.enabledFormats.clear();
    });
    afterEach(() => {
      const keys = getFormatsKeys(true);
      for (const key of keys) {
        const formatItem = getFormat(key);
        formatItem.enabled = true;
        setFormat(key, formatItem);
      }
      mjs.enabledFormats.clear();
    });

    it('should not set format', async () => {
      const res = await func({
        foo: {
          checked: true
        }
      });
      assert.deepEqual(res, mjs.enabledFormats, 'result');
      assert.strictEqual(res.size, 0, 'size');
    });

    it('should set format', async () => {
      const res = await func({
        [HTML_PLAIN]: {
          checked: true
        }
      });
      assert.deepEqual(res, mjs.enabledFormats, 'result');
      assert.strictEqual(res.size, 1, 'size');
      assert.isTrue(res.has(HTML_PLAIN), 'key');
    });

    it('should call function', async () => {
      const res = await func();
      assert.deepEqual(res, mjs.enabledFormats, 'result');
      assert.strictEqual(res.size, 0, 'size');
    });

    it('should call function', async () => {
      browser.storage.local.get.resolves({
        [HTML_PLAIN]: {
          checked: true
        },
        [HTML_HYPER]: {
          checked: false
        },
        [MARKDOWN]: {
          checked: true
        }
      });
      const res = await func();
      assert.deepEqual(res, mjs.enabledFormats, 'result');
      assert.strictEqual(res.size, 2, 'size');
      assert.isTrue(res.has(HTML_PLAIN), 'key');
      assert.isFalse(res.has(HTML_HYPER), 'key');
      assert.isTrue(res.has(MARKDOWN), 'key');
    });
  });

  describe('get format template', () => {
    const func = mjs.getFormatTemplate;
    beforeEach(() => {
      mjs.userOpts.clear();
    });
    afterEach(() => {
      mjs.userOpts.clear();
    });

    it('should throw', () => {
      assert.throws(() => func(), 'Expected String but got Undefined.');
    });

    it('should get null', () => {
      const res = func('foo');
      assert.isNull(res, 'result');
    });

    it('should get value', () => {
      const res = func(`${COPY_PAGE}BBCodeText`);
      assert.strictEqual(res, '[url=%url%]%content%[/url]', 'result');
    });

    it('should get value', () => {
      const res = func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, '%content% %url%', 'result');
    });

    it('should get value', () => {
      const res = func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, '[%content%](%url%)', 'result');
    });

    it('should get value', () => {
      mjs.userOpts.set(INCLUDE_TITLE_MARKDOWN, true);
      const res = func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, '[%content%](%url% "%title%")', 'result');
    });

    it('should get value', () => {
      const res = func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(res, '<a href="%url%"%attr%>%content%</a>', 'result');
    });

    it('should get value', () => {
      mjs.userOpts.set(INCLUDE_TITLE_HTML_HYPER, true);
      const res = func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(res,
        '<a href="%url%" title="%title%"%attr%>%content%</a>', 'result');
    });

    it('should get value', () => {
      const res = func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(res, '<a href="%url%"%attr%>%content%</a>', 'result');
    });

    it('should get value', () => {
      mjs.userOpts.set(INCLUDE_TITLE_HTML_PLAIN, true);
      const res = func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(res,
        '<a href="%url%" title="%title%"%attr%>%content%</a>', 'result');
    });

    it('should get value', () => {
      const res = func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, '%content% %url%', 'result');
    });

    it('should get value', () => {
      mjs.userOpts.set(TEXT_SEP_LINES, true);
      const res = func(`${COPY_PAGE}TextURL`);
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
        highlighted: false,
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

    it('should not log error', async () => {
      const stubErr = sinon.stub(console, 'error');
      browser.scripting.executeScript.rejects(new Error('error'));
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      const { called: errCalled } = stubErr;
      stubErr.restore();
      assert.isFalse(errCalled, 'error called');
      assert.isNull(res, 'result');
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

    it('should throw', async () => {
      browser.scripting.executeScript.resolves([{
        error: null
      }]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      await func().catch(e => {
        assert.isNull(e, 'error');
      });
    });

    it('should throw', async () => {
      browser.scripting.executeScript.resolves([{
        error: false
      }]);
      browser.tabs.query.resolves([{
        id: 1
      }]);
      await func().catch(e => {
        assert.isFalse(e, 'error');
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
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
      browser.i18n.getMessage.returns(USER_INPUT_DEFAULT);
      browser.storage.local.get.resolves({});
    });
    afterEach(() => {
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.openOptionsPage.callCount;
      const res = await func();
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, j,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.openOptionsPage.callCount;
      const res = await func({}, {});
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, j,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.openOptionsPage.callCount;
      const info = {
        menuItemId: null
      };
      const tab = {
        id: null
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, j,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.openOptionsPage.callCount;
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: null
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, j,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.openOptionsPage.callCount;
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: browser.tabs.TAB_ID_NONE
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, j,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      browser.runtime.openOptionsPage.resolves(undefined);
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: OPTIONS_OPEN
      };
      const tab = {
        id: 1
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.isTrue(browser.runtime.openOptionsPage.calledOnce, 'called');
      assert.isUndefined(res, 'result');
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
      mjs.enabledFormats.add(HTML_PLAIN);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.write.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      delete navigator.clipboard.write;
      delete global.navigator.clipboard.write;
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(document.execCommand.callCount, i + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PREFER_CANONICAL, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PREFER_CANONICAL, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_SEP_LINES, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_SEP_LINES, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_SEP_LINES, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}TextURL`;
      const info = {
        menuItemId,
        editedText: 'bar',
        isEdited: true,
        linkUrl: 'https://example.com/foo',
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PREFER_CANONICAL, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PREFER_CANONICAL, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.write.callCount;
      const menuItemId = `${COPY_PAGE}HTMLHyper`;
      const info = {
        menuItemId,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_FRAG_HTML_HYPER, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.write.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.write.callCount;
      const menuItemId = `${COPY_PAGE}HTMLHyper`;
      const info = {
        menuItemId,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(ATTR_HTML_HYPER, 'class="foo"');
      mjs.userOpts.set(INCLUDE_ATTR_HTML_HYPER, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.write.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.write.callCount;
      const menuItemId = `${COPY_PAGE}HTMLHyper`;
      const info = {
        menuItemId,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(INCLUDE_ATTR_HTML_HYPER, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.write.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}HTMLPlain`;
      const info = {
        menuItemId,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_FRAG_HTML_PLAIN, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}HTMLPlain`;
      const info = {
        menuItemId,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(ATTR_HTML_PLAIN, 'class="foo"');
      mjs.userOpts.set(INCLUDE_ATTR_HTML_PLAIN, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}HTMLPlain`;
      const info = {
        menuItemId,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(INCLUDE_ATTR_HTML_PLAIN, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}HTMLPlain`;
      const info = {
        menuItemId,
        editedText: 'qux quux',
        isEdited: true,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: 'bar baz',
          title: null,
          url: null
        }
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_FRAG_HTML_PLAIN, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_PAGE}HTMLPlain`;
      const info = {
        menuItemId,
        editedText: 'qux quux',
        isEdited: true,
        selectionText: 'bar baz'
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {
          isLink: false,
          canonicalUrl: 'https://www.example.com',
          content: null,
          selectionText: 'bar baz',
          title: null,
          url: null
        }
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(TEXT_FRAG_HTML_PLAIN, false);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId,
        editedText: 'qux',
        isEdited: true
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PREFER_CANONICAL, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PREFER_CANONICAL, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.scripting.executeScript.callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId,
        editedText: 'bar',
        isEdited: true
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should log error', async () => {
      const stubErr = sinon.stub(console, 'error');
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).rejects(
        new Error('error'));
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      const res = await func(info, tab);
      const { called: errCalled } = stubErr;
      stubErr.restore();
      assert.isTrue(errCalled, 'called error');
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should throw', async () => {
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        error: new Error('error')
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      await func(info, tab).catch(e => {
        assert.instanceOf(e, Error, 'error');
      });
    });

    it('should throw', async () => {
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        error: null
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      await func(info, tab).catch(e => {
        assert.isNull(e, 'error');
      });
    });

    it('should throw', async () => {
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/'
      };
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        error: false
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      await func(info, tab).catch(e => {
        assert.isFalse(e, 'error');
      });
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([undefined]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        result: null
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        result: ''
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      browser.scripting.executeScript.withArgs(optEdit).resolves([{
        result: 'foo bar'
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(PROMPT, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.scripting.executeScript.callCount, j + 2,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
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
      browser.scripting.executeScript.withArgs(optInfo).resolves([{
        result: {}
      }]);
      mjs.enabledFormats.add(menuItemId);
      mjs.userOpts.set(NOTIFY_COPY, true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText
        .withArgs('[url]https://example.com/[/url]').callCount;
      const menuItemId = BBCODE_URL;
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/"onclick="alert(1)"'
      };
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText
        .withArgs('[url]https://example.com/[/url]').callCount, i + 1,
      'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText
        .withArgs('foo https://example.com/').callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'https://example.com/"onclick="alert(1)"'
      };
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText
        .withArgs('foo https://example.com/').callCount, i + 1,
      'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = navigator.clipboard.writeText
        .withArgs('foo data:,https://example.com/').callCount;
      const menuItemId = 'TextURL';
      const info = {
        menuItemId
      };
      const tab = {
        id: 1,
        title: 'foo',
        url: 'data:,https://example.com/#<script>alert(1);</script>'
      };
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
      mjs.enabledFormats.add(menuItemId);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText
        .withArgs('foo data:,https://example.com/').callCount, i + 1,
      'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('handle active tab', () => {
    const func = mjs.handleActiveTab;
    beforeEach(() => {
      mjs.enabledFormats.clear();
    });
    afterEach(() => {
      mjs.enabledFormats.clear();
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
      mjs.enabledFormats.add(HTML_PLAIN);
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
      mjs.enabledFormats.clear();
    });
    afterEach(() => {
      mjs.enabledFormats.clear();
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
      mjs.enabledFormats.add(HTML_PLAIN);
      const res = await func(`${CMD_COPY}${HTML_HYPER}`);
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      mjs.enabledFormats.add(HTML_PLAIN);
      const res = await func(`${CMD_COPY}${HTML_PLAIN}`, {
        id: 1,
        title: 'Example Domain',
        url: 'https://example.com',
      });
      assert.isUndefined(res, 'result');
    });
  });

  describe('handle message', () => {
    const func = mjs.handleMsg;
    beforeEach(() => {
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
    });
    afterEach(() => {
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
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

    it('should get array', async () => {
      const menuItemId = `${COPY_PAGE}HTMLPlain`;
      mjs.enabledFormats.add('HTMLPlain');
      const res = await func({
        [EXEC_COPY]: {
          info: {
            menuItemId,
          },
          tab: {
            id: 1,
            title: 'Example Domain',
            url: 'https://example.com'
          }
        }
      });
      assert.deepEqual(res, [undefined], 'result');
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
      browser.runtime.getURL.returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.userOpts.set(NOTIFY_COPY, true);
      const i = browser.notifications.create.callCount;
      browser.notifications.create.resolves(true);
      const res = await func({
        [NOTIFY_COPY]: true
      });
      assert.strictEqual(browser.notifications.create.callCount, i + 1,
        'called');
      assert.deepEqual(res, [true], 'result');
    });

    it('should call function', async () => {
      browser.runtime.getURL.returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.userOpts.set(NOTIFY_COPY, true);
      const i = browser.notifications.create.callCount;
      browser.notifications.create.resolves(true);
      const res = await func({
        [NOTIFY_COPY]: 'foo'
      });
      assert.strictEqual(browser.notifications.create.callCount, i + 1,
        'called');
      assert.deepEqual(res, [true], 'result');
    });

    it('should not call function', async () => {
      browser.runtime.getURL.returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.userOpts.set(NOTIFY_COPY, true);
      const i = browser.notifications.create.callCount;
      const res = await func({
        [NOTIFY_COPY]: false
      });
      assert.strictEqual(browser.notifications.create.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should not call function', async () => {
      browser.runtime.getURL.returns('/foo/bar');
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.userOpts.set(NOTIFY_COPY, false);
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

  describe('set storage value', () => {
    const func = mjs.setStorageValue;
    beforeEach(() => {
      browser.runtime.id = null;
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
    });
    afterEach(() => {
      browser.runtime.id = null;
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
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

    it('should get null', async () => {
      const res = await func('foo', {
        checked: true
      });
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func('foo', {
        checked: true
      }, true);
      assert.isNull(res, 'result');
    });

    it('should set variable', async () => {
      await setFormatData();
      const res = await func('TextURL', {
        checked: false
      });
      assert.isFalse(mjs.enabledFormats.has('TextURL'), 'value');
      assert.deepEqual(res, mjs.enabledFormats, 'result');
    });

    it('should set variable', async () => {
      await setFormatData();
      const res = await func('TextURL', {
        checked: true
      });
      assert.isTrue(mjs.enabledFormats.has('TextURL'), 'value');
      assert.deepEqual(res, mjs.enabledFormats, 'result');
    });

    it('should set variable', async () => {
      await setFormatData();
      const res = await func('TextURL', {
        checked: false
      }, true);
      assert.isFalse(mjs.enabledFormats.has('TextURL'), 'value');
      assert.isTrue(Array.isArray(res), 'result');
      assert.strictEqual(res.length, 97, 'result');
    });

    it('should set variable', async () => {
      await setFormatData();
      const res = await func('TextURL', {
        checked: true
      }, true);
      assert.isTrue(mjs.enabledFormats.has('TextURL'), 'value');
      assert.isTrue(Array.isArray(res), 'result');
      assert.strictEqual(res.length, 103, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(INCLUDE_TITLE_HTML_HYPER), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(INCLUDE_TITLE_HTML_HYPER), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_TITLE_HTML_PLAIN, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(INCLUDE_TITLE_HTML_PLAIN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_TITLE_HTML_PLAIN, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(INCLUDE_TITLE_HTML_PLAIN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_TITLE_MARKDOWN, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(INCLUDE_TITLE_MARKDOWN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_TITLE_MARKDOWN, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(INCLUDE_TITLE_MARKDOWN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(NOTIFY_COPY, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(NOTIFY_COPY), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(NOTIFY_COPY, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(NOTIFY_COPY), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(PREFER_CANONICAL, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(PREFER_CANONICAL), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(PREFER_CANONICAL, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(PREFER_CANONICAL), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(PROMPT, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(PROMPT), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(PROMPT, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(PROMPT), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(TEXT_FRAG_HTML_HYPER, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(TEXT_FRAG_HTML_HYPER), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(TEXT_FRAG_HTML_HYPER, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(TEXT_FRAG_HTML_HYPER), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(TEXT_FRAG_HTML_PLAIN, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(TEXT_FRAG_HTML_PLAIN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(TEXT_FRAG_HTML_PLAIN, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(TEXT_FRAG_HTML_PLAIN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(TEXT_SEP_LINES, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(TEXT_SEP_LINES), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(TEXT_SEP_LINES, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(TEXT_SEP_LINES), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(ATTR_HTML_HYPER, {
        value: 'foo'
      });
      assert.strictEqual(mjs.userOpts.get(ATTR_HTML_HYPER), 'foo', 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(ATTR_HTML_HYPER, {
        value: ''
      });
      assert.strictEqual(mjs.userOpts.get(ATTR_HTML_HYPER), '', 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(ATTR_HTML_PLAIN, {
        value: 'foo'
      });
      assert.strictEqual(mjs.userOpts.get(ATTR_HTML_PLAIN), 'foo', 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(ATTR_HTML_PLAIN, {
        value: ''
      });
      assert.strictEqual(mjs.userOpts.get(ATTR_HTML_PLAIN), '', 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_ATTR_HTML_HYPER, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(INCLUDE_ATTR_HTML_HYPER), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_ATTR_HTML_HYPER, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(INCLUDE_ATTR_HTML_HYPER), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_ATTR_HTML_PLAIN, {
        checked: true
      });
      assert.isTrue(mjs.userOpts.get(INCLUDE_ATTR_HTML_PLAIN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should set variable', async () => {
      const res = await func(INCLUDE_ATTR_HTML_PLAIN, {
        checked: false
      });
      assert.isFalse(mjs.userOpts.get(INCLUDE_ATTR_HTML_PLAIN), 'value');
      assert.deepEqual(res, mjs.userOpts, 'result');
    });

    it('should call function', async () => {
      browser.runtime.id = WEBEXT_ID;
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i + 1,
        'called');
      assert.strictEqual(browser.action.setIcon.callCount, j, 'not called');
      assert.deepEqual(res, undefined, 'result');
    });

    it('should call function', async () => {
      browser.runtime.id = WEBEXT_ID;
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_BLACK, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i + 1,
        'called');
      assert.strictEqual(browser.action.setIcon.callCount, j, 'not called');
      assert.deepEqual(res, undefined, 'result');
    });

    it('should call function', async () => {
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_BLACK, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i + 1,
        'called');
      assert.strictEqual(browser.action.setIcon.callCount, j, 'not called');
      assert.deepEqual(res, undefined, 'result');
    });

    it('should not call function', async () => {
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_BLACK, {
        checked: false,
        value: 'icon-black-32.png'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i,
        'not called');
      assert.strictEqual(browser.action.setIcon.callCount, j, 'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      browser.action.setIcon.resolves(undefined);
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_BLACK, {
        checked: true,
        value: 'icon-black-32.png'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i,
        'not called');
      assert.strictEqual(browser.action.setIcon.callCount, j + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      browser.action.setIcon.resolves(undefined);
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_COLOR, {
        checked: true,
        value: 'icon-color-32.png'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i,
        'not called');
      assert.strictEqual(browser.action.setIcon.callCount, j + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      browser.action.setIcon.resolves(undefined);
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_DARK, {
        checked: true,
        value: 'icon-dark-32.png'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i,
        'not called');
      assert.strictEqual(browser.action.setIcon.callCount, j + 1,
        'called');
      assert.isUndefined(res, [null], 'result');
    });

    it('should call function', async () => {
      browser.action.setIcon.resolves(undefined);
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_LIGHT, {
        checked: true,
        value: 'icon-light-32.png'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i,
        'not called');
      assert.strictEqual(browser.action.setIcon.callCount, j + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      browser.action.setIcon.resolves(undefined);
      const i = browser.storage.local.remove.callCount;
      const j = browser.action.setIcon.callCount;
      const res = await func(ICON_WHITE, {
        checked: true,
        value: 'icon-white-32.png'
      });
      assert.strictEqual(browser.storage.local.remove.callCount, i,
        'not called');
      assert.strictEqual(browser.action.setIcon.callCount, j + 1,
        'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('handle storage', () => {
    const func = mjs.handleStorage;
    beforeEach(() => {
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
    });
    afterEach(() => {
      mjs.enabledFormats.clear();
      mjs.userOpts.clear();
    });

    it('should not set variables', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should not set variables', async () => {
      const res = await func({
        foo: {
          checked: true
        }
      }, 'bar');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variables', async () => {
      const res = await func({
        foo: {
          checked: true
        }
      });
      assert.deepEqual(res, [null], 'result');
    });

    it('should set variables', async () => {
      const res = await func({
        foo: {
          checked: true
        }
      }, 'local');
      assert.deepEqual(res, [null], 'result');
    });

    it('should set variables', async () => {
      const res = await func({
        foo: {
          newValue: {
            checked: true
          }
        }
      }, 'local');
      assert.deepEqual(res, [null], 'result');
    });

    it('should set variables', async () => {
      const res = await func({
        foo: {
          newValue: {
            checked: true
          }
        }
      }, 'local', true);
      assert.deepEqual(res, [null], 'result');
    });
  });

  describe('startup', () => {
    const func = mjs.startup;
    beforeEach(() => {
      mjs.enabledFormats.add('HTMLPlain');
      mjs.enabledFormats.add('Markdown');
      mjs.enabledFormats.add('TextURL');
    });
    afterEach(() => {
      mjs.enabledFormats.clear();
    });

    it('should get array', async () => {
      browser.storage.local.get.resolves({});
      const res = await func();
      assert.isArray(res, 'result');
      assert.strictEqual(res.length, 103, 'result');
    });
  });
});
