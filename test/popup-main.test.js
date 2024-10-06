/**
 * popup-main.test.js
 */
/* eslint-disable import-x/order */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import {
  BBCODE_URL, CONTENT_LINK, CONTENT_PAGE, CONTEXT_INFO, COPY_LINK, COPY_PAGE,
  EXEC_COPY, OPTIONS_OPEN
} from '../src/mjs/constant.js';
import { formatData } from '../src/mjs/format.js';
import * as mjs from '../src/mjs/popup-main.js';

describe('popup-main', () => {
  let window, document, navigator, globalNavigatorExists;
  beforeEach(() => {
    const stubWrite = sinon.stub();
    const stubWriteText = sinon.stub();
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    document.execCommand = sinon.stub();
    navigator = window && window.navigator;
    navigator.clipboard = {
      write: stubWrite,
      writeText: stubWriteText
    };
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
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
    browser._sandbox.reset();
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('toggle enabled formats', () => {
    const func = mjs.toggleEnabledFormats;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should throw', () => {
      assert.throws(() => func(), 'Expected String but got Undefined.');
    });

    it('should not add', () => {
      const { enabledFormats } = mjs;
      func('foo');
      assert.isFalse(enabledFormats.has('foo'), 'result');
    });

    it('should not add', () => {
      const { enabledFormats } = mjs;
      func('TextURL', false);
      assert.isFalse(enabledFormats.has('TextURL'), 'result');
    });

    it('should add', () => {
      const { enabledFormats } = mjs;
      func('TextURL', true);
      assert.isTrue(enabledFormats.has('TextURL'), 'result');
    });
  });

  describe('set format data', () => {
    const func = mjs.setFormatData;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should set map', async () => {
      const { enabledFormats } = mjs;
      const items = Object.keys(formatData);
      const res = await func();
      assert.strictEqual(res.length, items.length, 'result');
      assert.strictEqual(enabledFormats.size, items.length, 'enabled formats');
    });
  });

  describe('init context info', () => {
    const func = mjs.initContextInfo;

    it('should init object', async () => {
      const { contextInfo } = mjs;
      contextInfo.canonicalUrl = 'https://www.example.com';
      contextInfo.content = 'foo';
      contextInfo.isLink = true;
      contextInfo.selectionText = 'foo bar';
      contextInfo.title = 'bar';
      contextInfo.url = 'https://example.com';
      const res = await func();
      assert.deepEqual(res, contextInfo, 'result');
      assert.isNull(res.canonicalUrl, 'content');
      assert.isNull(res.content, 'content');
      assert.isFalse(res.isLink, 'isLink');
      assert.isNull(res.selectionText, 'selectionText');
      assert.isNull(res.title, 'title');
      assert.isNull(res.url, 'url');
    });
  });

  describe('set tab info', () => {
    const func = mjs.setTabInfo;
    beforeEach(() => {
      const { contextInfo, tabInfo } = mjs;
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = CONTENT_PAGE;
      body.appendChild(elm);
      contextInfo.selectionText = null;
      tabInfo.tab = null;
    });
    afterEach(() => {
      const { contextInfo, tabInfo } = mjs;
      contextInfo.selectionText = null;
      tabInfo.tab = null;
    });

    it('should not set value', async () => {
      const { tabInfo } = mjs;
      const contentPage = document.getElementById(CONTENT_PAGE);
      await func();
      assert.strictEqual(contentPage.value, '', 'page value');
      assert.isNull(tabInfo.tab, 'tab');
    });

    it('should set value', async () => {
      const { tabInfo } = mjs;
      const contentPage = document.getElementById(CONTENT_PAGE);
      const arg = {
        id: 'foo',
        title: 'bar',
        url: 'https://example.com'
      };
      await func(arg);
      assert.strictEqual(contentPage.value, 'bar', 'page value');
      assert.isObject(tabInfo.tab, 'tab');
      assert.strictEqual(tabInfo.tab.id, 'foo', 'id');
      assert.strictEqual(tabInfo.tab.title, 'bar', 'title');
      assert.strictEqual(tabInfo.tab.url, 'https://example.com', 'url');
    });

    it('should set value', async () => {
      const { contextInfo, tabInfo } = mjs;
      const contentPage = document.getElementById(CONTENT_PAGE);
      const arg = {
        id: 'foo',
        title: 'bar',
        url: 'https://example.com/#baz'
      };
      contextInfo.selectionText = 'foo bar';
      await func(arg);
      assert.strictEqual(contentPage.value, 'foo bar', 'page value');
      assert.isObject(tabInfo.tab, 'tab');
      assert.strictEqual(tabInfo.tab.id, 'foo', 'id');
      assert.strictEqual(tabInfo.tab.title, 'bar', 'title');
      assert.strictEqual(tabInfo.tab.url, 'https://example.com/#baz', 'url');
    });
  });

  describe('create copy data', () => {
    const func = mjs.createCopyData;
    beforeEach(() => {
      const { contextInfo, tabInfo } = mjs;
      const elm = document.createElement('input');
      const elm2 = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = CONTENT_LINK;
      elm2.id = CONTENT_PAGE;
      body.appendChild(elm);
      body.appendChild(elm2);
      contextInfo.content = null;
      contextInfo.isLink = false;
      contextInfo.selectionText = null;
      contextInfo.url = null;
      tabInfo.tab = null;
    });
    afterEach(() => {
      const { contextInfo, tabInfo } = mjs;
      contextInfo.content = null;
      contextInfo.isLink = false;
      contextInfo.selectionText = null;
      contextInfo.url = null;
      tabInfo.tab = null;
    });

    it('should get null if no argument given', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null if given argument is empty object', async () => {
      const res = await func({});
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func({ target: {} });
      assert.isNull(res, 'result');
    });

    it('should get null if tabInfo.tab not found', async () => {
      mjs.tabInfo.tab = null;
      const res = await func({
        target: {
          id: 'foo'
        }
      });
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs({
        [EXEC_COPY]: {
          info: {
            editedText: '',
            isEdited: true,
            menuItemId: 'foo',
            selectionText: ''
          },
          tab: {}
        }
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: 'foo'
        }
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      mjs.contextInfo.selectionText = 'foo bar';
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs({
        [EXEC_COPY]: {
          info: {
            editedText: 'foo bar',
            isEdited: true,
            menuItemId: 'foo',
            selectionText: 'foo bar'
          },
          tab: {}
        }
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: 'foo'
        }
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs({
        [EXEC_COPY]: {
          info: {
            editedText: '',
            isEdited: true,
            menuItemId: `${COPY_PAGE}foo`,
            selectionText: ''
          },
          tab: {}
        }
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: `${COPY_PAGE}foo`
        }
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      document.getElementById(CONTENT_PAGE).value = 'baz qux';
      mjs.contextInfo.selectionText = 'foo bar';
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs({
        [EXEC_COPY]: {
          info: {
            editedText: 'baz qux',
            isEdited: true,
            menuItemId: `${COPY_PAGE}foo`,
            selectionText: 'foo bar'
          },
          tab: {}
        }
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: `${COPY_PAGE}foo`
        }
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      mjs.contextInfo.isLink = true;
      mjs.contextInfo.url = 'https://example.com/';
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs({
        [EXEC_COPY]: {
          info: {
            editedText: '',
            isEdited: true,
            menuItemId: `${COPY_LINK}foo`,
            linkUrl: 'https://example.com/',
            selectionText: ''
          },
          tab: {}
        }
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: `${COPY_LINK}foo`
        }
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      document.getElementById(CONTENT_LINK).value = 'baz qux';
      mjs.contextInfo.isLink = true;
      mjs.contextInfo.selectionText = 'foo bar';
      mjs.contextInfo.url = 'https://example.com/';
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs({
        [EXEC_COPY]: {
          info: {
            editedText: 'baz qux',
            isEdited: true,
            menuItemId: `${COPY_LINK}foo`,
            linkUrl: 'https://example.com/',
            selectionText: 'foo bar'
          },
          tab: {}
        }
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: `${COPY_LINK}foo`
        }
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('close window', () => {
    const func = mjs.closeWindow;

    it('should call function', async () => {
      const stubClose = sinon.stub(window, 'close');
      await func();
      const { calledOnce } = stubClose;
      stubClose.restore();
      assert.isTrue(calledOnce, 'called');
    });
  });

  describe('handle open options on click', () => {
    const func = mjs.openOptionsOnClick;

    it('should call function', async () => {
      const i = browser.runtime.openOptionsPage.callCount;
      await func();
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, i + 1,
        'called');
    });
  });

  describe('handle menu on click', () => {
    const func = mjs.menuOnClick;

    it('should call function', async () => {
      const stubClose = sinon.stub(window, 'close');
      const evt = {
        target: {
          id: 'HTMLPlain'
        }
      };
      const res = await func(evt);
      const { calledOnce } = stubClose;
      stubClose.restore();
      assert.isTrue(calledOnce, 'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('add listener to menu', () => {
    const func = mjs.addListenerToMenu;

    it('should set listener', async () => {
      const elm = document.createElement('button');
      const body = document.querySelector('body');
      const spy = sinon.spy(elm, 'addEventListener');
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, 'result');
      elm.addEventListener.restore();
    });

    it('should set listener', async () => {
      const elm = document.createElement('button');
      const body = document.querySelector('body');
      const spy = sinon.spy(elm, 'addEventListener');
      elm.id = OPTIONS_OPEN;
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, 'result');
      elm.addEventListener.restore();
    });
  });

  describe('toggle menu item', () => {
    const func = mjs.toggleMenuItem;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should not add attribute', async () => {
      const elm = document.createElement('button');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      elm.id = 'foo';
      p.appendChild(elm);
      body.appendChild(p);
      await func();
      assert.isFalse(p.hasAttribute('hidden'), 'result');
    });

    it('should add attribute', async () => {
      const elm = document.createElement('button');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      elm.id = BBCODE_URL;
      p.appendChild(elm);
      body.appendChild(p);
      await func();
      assert.isTrue(p.hasAttribute('hidden'), 'result');
    });

    it('should add attribute', async () => {
      const elm = document.createElement('button');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      elm.id = `${COPY_LINK}${BBCODE_URL}`;
      p.appendChild(elm);
      body.appendChild(p);
      await func();
      assert.isTrue(p.hasAttribute('hidden'), 'result');
    });

    it('should not add attribute', async () => {
      const elm = document.createElement('button');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      elm.id = `${COPY_LINK}${BBCODE_URL}`;
      mjs.enabledFormats.add(BBCODE_URL);
      p.appendChild(elm);
      body.appendChild(p);
      await func();
      assert.isFalse(p.hasAttribute('hidden'), 'result');
    });

    it('should remove attribute', async () => {
      const elm = document.createElement('button');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      elm.id = `${COPY_LINK}${BBCODE_URL}`;
      mjs.enabledFormats.add(BBCODE_URL);
      p.appendChild(elm);
      p.setAttribute('hidden', 'hidden');
      body.appendChild(p);
      await func();
      assert.isFalse(p.hasAttribute('hidden'), 'result');
    });
  });

  describe('update menu', () => {
    const func = mjs.updateMenu;
    beforeEach(() => {
      const div = document.createElement('div');
      const div2 = document.createElement('div');
      const button = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');
      const button4 = document.createElement('button');
      const input = document.createElement('input');
      const input2 = document.createElement('input');
      const body = document.querySelector('body');
      input.id = CONTENT_LINK;
      div.id = 'copyLinkDetails';
      div.setAttribute('hidden', 'hidden');
      div.appendChild(input);
      div.appendChild(button);
      div.appendChild(button2);
      body.appendChild(div);
      input2.id = CONTENT_PAGE;
      div2.id = 'copyPageDetails';
      div2.appendChild(input2);
      div2.appendChild(button3);
      div2.appendChild(button4);
      body.appendChild(div2);
    });

    it('should not set attr', async () => {
      const elm = document.getElementById('copyLinkDetails');
      const items = document.querySelectorAll('button');
      await func();
      assert.isTrue(elm.hidden, 'hidden');
      for (const item of items) {
        assert.isFalse(item.hasAttribute('disabled'), 'attr');
      }
    });

    it('should not set attr', async () => {
      const elm = document.getElementById('copyLinkDetails');
      const items = document.querySelectorAll('button');
      await func({
        foo: {}
      });
      assert.isTrue(elm.hidden, 'hidden');
      for (const item of items) {
        assert.isFalse(item.hasAttribute('disabled'), 'attr');
      }
    });

    it('should set attr but not value', async () => {
      const elm = document.getElementById('copyLinkDetails');
      const items = document.querySelectorAll('#copyLinkDetails button');
      const contentLink = document.getElementById(CONTENT_LINK);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: 'foo',
          isLink: false,
          title: 'bar',
          url: 'https://example.com'
        }
      };
      await func(data);
      assert.isTrue(elm.hidden, 'hidden');
      for (const item of items) {
        assert.strictEqual(item.getAttribute('disabled'), 'disabled', 'attr');
      }
      assert.strictEqual(contentLink.value, '', 'value link');
    });

    it('should set attr but not value', async () => {
      const elm = document.getElementById('copyLinkDetails');
      const items = document.querySelectorAll('#copyLinkDetails button');
      const contentLink = document.getElementById(CONTENT_LINK);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: 'bar',
          url: null
        }
      };
      await func(data);
      assert.isTrue(elm.hidden, 'hidden');
      for (const item of items) {
        assert.strictEqual(item.getAttribute('disabled'), 'disabled', 'attr');
      }
      assert.strictEqual(contentLink.value, '', 'value link');
    });

    it('should set attr and value', async () => {
      const elm = document.getElementById('copyLinkDetails');
      const items = document.querySelectorAll('#copyLinkDetails button');
      const contentLink = document.getElementById(CONTENT_LINK);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: 'foo',
          isLink: true,
          title: 'bar',
          url: 'https://example.com'
        }
      };
      for (const item of items) {
        item.setAttribute('disabled', 'disabled');
      }
      await func(data);
      assert.isFalse(elm.hidden, 'hidden');
      for (const item of items) {
        assert.isFalse(item.hasAttribute('disabled'), 'attr');
      }
      assert.strictEqual(contentLink.value, 'foo', 'value link');
    });

    it('should set value', async () => {
      const contentPage = document.getElementById(CONTENT_PAGE);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: '',
          isLink: false,
          selectionText: 'baz qux',
          title: 'bar',
          url: 'https://example.com'
        }
      };
      await func(data);
      assert.strictEqual(contentPage.value, 'baz qux', 'value pqge');
    });
  });

  describe('prepare tab', () => {
    const func = mjs.prepareTab;
    beforeEach(() => {
      const div = document.createElement('div');
      const btn = document.createElement('button');
      const btn2 = document.createElement('button');
      const elm = document.createElement('input');
      const elm2 = document.createElement('input');
      const body = document.querySelector('body');
      div.id = 'copyLinkDetails';
      div.appendChild(btn);
      div.appendChild(btn2);
      elm.id = CONTENT_PAGE;
      elm2.id = CONTENT_LINK;
      body.appendChild(div);
      body.appendChild(elm);
      body.appendChild(elm2);
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.query.resolves([{
        id: browser.tabs.TAB_ID_NONE
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.query.resolves([{
        id: 1
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.deepEqual(res, {}, 'result');
    });
  });

  describe('handle message', () => {
    const func = mjs.handleMsg;

    it('should get empty array if no arguments given', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({ foo: 'bar' });
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      const res = await func({ [CONTEXT_INFO]: {} });
      assert.deepEqual(res, [undefined], 'result');
    });
  });

  describe('set storage value', () => {
    const func = mjs.setStorageValue;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should get null', () => {
      const { enabledFormats } = mjs;
      func('foo');
      assert.isFalse(enabledFormats.has('foo'));
    });

    it('should set variable', () => {
      const { enabledFormats } = mjs;
      func('TextURL', {
        checked: true
      });
      assert.isTrue(enabledFormats.has('TextURL'), 'variable');
    });

    it('should set variable', () => {
      const { enabledFormats } = mjs;
      enabledFormats.add('TextURL');
      func('TextURL', {
        checked: false
      });
      assert.isFalse(enabledFormats.has('TextURL'), 'variable');
    });
  });

  describe('handle storage', () => {
    const func = mjs.handleStorage;

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
      assert.deepEqual(res, [undefined], 'result');
    });
  });

  describe('startup', () => {
    const func = mjs.startup;
    beforeEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.add('HTMLPlain');
      enabledFormats.add('Markdown');
      enabledFormats.add('TextURL');
      const div = document.createElement('div');
      const btn = document.createElement('button');
      const btn2 = document.createElement('button');
      const elm = document.createElement('input');
      const elm2 = document.createElement('input');
      const body = document.querySelector('body');
      div.id = 'copyLinkDetails';
      div.appendChild(btn);
      div.appendChild(btn2);
      elm.id = CONTENT_PAGE;
      elm2.id = CONTENT_LINK;
      body.appendChild(div);
      body.appendChild(elm);
      body.appendChild(elm2);
    });
    afterEach(() => {
      const { enabledFormats } = mjs;
      enabledFormats.clear();
    });

    it('should call function', async () => {
      browser.storage.local.get.resolves({});
      browser.tabs.query.resolves([{ id: 1 }]);
      const i = browser.runtime.sendMessage.callCount;
      const j = browser.storage.local.get.callCount;
      const k = browser.tabs.query.callCount;
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.strictEqual(browser.storage.local.get.callCount, j + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, k + 1, 'called');
      assert.isUndefined(res, 'result');
    });
  });
});
