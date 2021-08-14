/**
 * popup-main.test.js
 */

import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';
import sinon from 'sinon';
import * as mjs from '../src/mjs/popup-main.js';
import { formatData } from '../src/mjs/format.js';
import {
  BBCODE_URL, CONTENT_LINK, CONTENT_PAGE, CONTEXT_INFO,
  COPY_LINK, COPY_PAGE, COPY_TABS_ALL, COPY_TABS_SELECTED,
  EXEC_COPY, INCLUDE_TITLE_HTML_HYPER, PREFER_CANONICAL
} from '../src/mjs/constant.js';
const OPTIONS_OPEN = 'openOptions';

describe('popup-main', () => {
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
      sinon.stub(navigator.clipboard, 'writeText');
    } else {
      navigator.clipboard = {
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
  });
  afterEach(() => {
    window = null;
    document = null;
    navigator = null;
    delete global.browser;
    delete global.window;
    delete global.document;
    delete global.navigator;
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

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'throw');
      });
    });

    it('should not add', async () => {
      const { enabledFormats } = mjs;
      await func('foo');
      assert.isFalse(enabledFormats.has('foo'), 'result');
    });

    it('should not add', async () => {
      const { enabledFormats } = mjs;
      await func('TextURL', false);
      assert.isFalse(enabledFormats.has('TextURL'), 'result');
    });

    it('should add', async () => {
      const { enabledFormats } = mjs;
      await func('TextURL', true);
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
      const { contextInfo, tabInfo, vars } = mjs;
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
      vars.preferCanonicalUrl = false;
    });
    afterEach(() => {
      const { contextInfo, tabInfo, vars } = mjs;
      contextInfo.content = null;
      contextInfo.isLink = false;
      contextInfo.selectionText = null;
      contextInfo.url = null;
      tabInfo.tab = null;
      vars.preferCanonicalUrl = false;
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
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [EXEC_COPY]: {
          info: {
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
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [EXEC_COPY]: {
          info: {
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
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [EXEC_COPY]: {
          info: {
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
      document.getElementById(CONTENT_PAGE).value = 'foo bar';
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [EXEC_COPY]: {
          info: {
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
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [EXEC_COPY]: {
          info: {
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
      document.getElementById(CONTENT_LINK).value = 'foo bar';
      mjs.contextInfo.isLink = true;
      mjs.contextInfo.url = 'https://example.com/';
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [EXEC_COPY]: {
          info: {
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
      const elm = document.createElement('button');
      const elm2 = document.createElement('button');
      const elm3 = document.createElement('input');
      const body = document.querySelector('body');
      div.id = 'copyLinkDetails';
      div.appendChild(elm);
      div.appendChild(elm2);
      elm3.id = CONTENT_LINK;
      body.appendChild(div);
      body.appendChild(elm3);
    });

    it('should not set attr', async () => {
      const items = document.querySelectorAll('button');
      await func();
      for (const item of items) {
        assert.isFalse(item.hasAttribute('disabled'), 'attr');
      }
    });

    it('should not set attr', async () => {
      const items = document.querySelectorAll('button');
      await func({
        foo: {}
      });
      for (const item of items) {
        assert.isFalse(item.hasAttribute('disabled'), 'attr');
      }
    });

    it('should set attr but not value', async () => {
      const items = document.querySelectorAll('button');
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
      for (const item of items) {
        assert.strictEqual(item.getAttribute('disabled'), 'disabled', 'attr');
      }
      assert.strictEqual(contentLink.value, '', 'value link');
    });

    it('should set attr but not value', async () => {
      const items = document.querySelectorAll('button');
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
      for (const item of items) {
        assert.strictEqual(item.getAttribute('disabled'), 'disabled', 'attr');
      }
      assert.strictEqual(contentLink.value, '', 'value link');
    });

    it('should set attr and value', async () => {
      const items = document.querySelectorAll('button');
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
      for (const item of items) {
        assert.isFalse(item.hasAttribute('disabled'), 'attr');
      }
      assert.strictEqual(contentLink.value, 'foo', 'value link');
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

    it('should get empty array', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.query.resolves([{
        id: browser.tabs.TAB_ID_NONE
      }]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.deepEqual(res, [], 'result');
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
      assert.deepEqual(res, [{}], 'result');
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

  describe('set variable', () => {
    const func = mjs.setVar;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      enabledFormats.clear();
      vars.preferCanonicalUrl = false;
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      enabledFormats.clear();
      vars.preferCanonicalUrl = false;
    });

    it('should not set variable', async () => {
      const { vars } = mjs;
      await func();
      assert.isFalse(vars.preferCanonicalUrl, 'canonical');
    });

    it('should not set variable', async () => {
      const { vars } = mjs;
      await func('foo', {});
      assert.isUndefined(vars.foo, 'vars');
    });

    it('should not set variable', async () => {
      const { vars } = mjs;
      await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: true
      });
      assert.isUndefined(vars.includeTitleHTMLHyper, 'variable');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      await func(PREFER_CANONICAL, {
        checked: true
      });
      assert.isTrue(vars.preferCanonicalUrl, 'variable');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      vars.preferCanonicalUrl = true;
      await func(PREFER_CANONICAL, {
        checked: false
      });
      assert.isFalse(vars.preferCanonicalUrl, 'variable');
    });

    it('should set variable', async () => {
      const { enabledFormats } = mjs;
      const res = await func('TextURL', {
        checked: true
      });
      assert.isTrue(enabledFormats.has('TextURL'), 'variable');
      assert.isUndefined(res, 'result');
    });

    it('should set variable', async () => {
      const { enabledFormats } = mjs;
      enabledFormats.add('TextURL');
      const res = await func('TextURL', {
        checked: false
      });
      assert.isFalse(enabledFormats.has('TextURL'), 'variable');
      assert.isUndefined(res, 'result');
    });
  });

  describe('set variables', () => {
    const func = mjs.setVars;

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
      assert.deepEqual(res, [null], 'result');
    });
  });
});
