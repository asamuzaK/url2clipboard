/**
 * main.test.js
 */

import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';
import { formatData } from '../src/mjs/format.js';
import sinon from 'sinon';
import * as mjs from '../src/mjs/main.js';
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO, COPY_LINK, COPY_PAGE, COPY_TAB,
  COPY_TABS_ALL, COPY_TABS_OTHER, COPY_TABS_SELECTED, EXEC_COPY, HTML_HYPER,
  HTML_PLAIN, ICON, ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_LIGHT,
  ICON_WHITE, INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN,
  INCLUDE_TITLE_MARKDOWN, JS_CONTEXT_INFO, JS_EDIT_CONTENT, NOTIFY_COPY,
  PREFER_CANONICAL, PROMPT
} from '../src/mjs/constant.js';

describe('main', () => {
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
      await func(`${COPY_PAGE}TextURL`, false);
      assert.isFalse(enabledFormats.has('TextURL'), 'result');
    });

    it('should add', async () => {
      const { enabledFormats } = mjs;
      await func(`${COPY_TAB}TextURL`, true);
      assert.isTrue(enabledFormats.has('TextURL'), 'result');
    });

    it('should add', async () => {
      const { enabledFormats } = mjs;
      await func(`${COPY_PAGE}TextURL`, true);
      assert.isTrue(enabledFormats.has('TextURL'), 'result');
    });

    it('should add', async () => {
      const { enabledFormats } = mjs;
      await func(`${COPY_LINK}TextURL`, true);
      assert.isTrue(enabledFormats.has('TextURL'), 'result');
    });

    it('should add', async () => {
      const { enabledFormats } = mjs;
      await func(`${COPY_TABS_ALL}TextURL`, true);
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

  describe('get format title', () => {
    const func = mjs.getFormatTitle;

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
      assert.strictEqual(res, 'BBCode (Text)', 'result');
    });

    it('should get value', async () => {
      const res = await func('TextURL');
      assert.strictEqual(res, 'Text & URL', 'result');
    });

    it('should get value', async () => {
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, 'Markdown', 'result');
    });
  });

  describe('remove context menu', () => {
    const func = mjs.removeContextMenu;

    it('should call function', async () => {
      const i = browser.menus.removeAll.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.removeAll.callCount, i + 1, 'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('create context menu item', () => {
    const func = mjs.createMenuItem;

    it('should not call function', async () => {
      const i = browser.menus.create.callCount;
      await func();
      assert.strictEqual(browser.menus.create.callCount, i, 'not called');
    });

    it('should not call function', async () => {
      const i = browser.menus.create.callCount;
      await func('foo');
      assert.strictEqual(browser.menus.create.callCount, i, 'not called');
    });

    it('should not call function', async () => {
      const i = browser.menus.create.callCount;
      await func('foo', 'bar');
      assert.strictEqual(browser.menus.create.callCount, i, 'not called');
    });

    it('should not call function', async () => {
      const i = browser.menus.create.callCount;
      await func('foo', 'bar', {
        contexts: 'baz'
      });
      assert.strictEqual(browser.menus.create.callCount, i, 'not called');
    });

    it('should call function', async () => {
      const i = browser.menus.create.callCount;
      await func('foo', 'bar', {
        contexts: ['baz']
      });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
    });

    it('should not call function', async () => {
      const i = browser.menus.create.callCount;
      await func('foo', 'bar', {
        contexts: ['tab']
      });
      assert.strictEqual(browser.menus.create.callCount, i, 'not called');
    });

    it('should not call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.create.callCount;
      vars.isWebExt = true;
      await func('foo', 'bar', {
        contexts: ['tab']
      });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
    });

    it('should not call function', async () => {
      const i = browser.menus.create.callCount;
      await func('foo', 'bar', {
        contexts: ['baz'],
        parentId: 'qux'
      });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
    });
  });

  describe('create single menu item', () => {
    const func = mjs.createSingleMenuItem;
    beforeEach(() => {
      const { vars } = mjs;
      vars.isWebExt = true;
    });
    afterEach(() => {
      const { vars } = mjs;
      vars.isWebExt = false;
    });

    it('should throw', async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError, 'error');
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'message');
      });
    });

    it('should throw', async () => {
      await func('foo').catch(e => {
        assert.instanceOf(e, TypeError, 'error');
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'message');
      });
    });

    it('should throw', async () => {
      await func('foo', 'bar').catch(e => {
        assert.instanceOf(e, TypeError, 'error');
        assert.strictEqual(e.message, 'Expected String but got Undefined.',
          'message');
      });
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func('TextURL', COPY_PAGE, '(&C)', {
        contexts: ['page', 'selection'],
        enabled: true
      });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = true;
      const res = await func('TextURL', COPY_PAGE, '(&C)', {
        contexts: ['page', 'selection'],
        enabled: true
      });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 1, 'called');
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func('Markdown', COPY_PAGE, '(&C)', {
        contexts: ['page', 'selection'],
        enabled: true
      });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 1, 'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('create context menu items', () => {
    const func = mjs.createContextMenu;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.isWebExt = true;
      enabledFormats.add('HTMLPlain');
      enabledFormats.add('Markdown');
      enabledFormats.add('TextURL');
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
    });

    it('should not call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.menus.create.callCount;
      enabledFormats.clear();
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i, 'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 96, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 6, 'called');
      assert.strictEqual(res.length, 96, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 32, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 6, 'called');
      assert.strictEqual(res.length, 96, 'result');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      enabledFormats.delete('HTMLPlain');
      enabledFormats.delete('Markdown');
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 6, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 6, 'called');
      assert.strictEqual(res.length, 6, 'result');
    });

    it('should call function', async () => {
      const { enabledFormats, vars } = mjs;
      const i = browser.menus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      enabledFormats.delete('HTMLPlain');
      enabledFormats.delete('Markdown');
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 2, 'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 6, 'called');
      assert.strictEqual(res.length, 6, 'result');
    });
  });

  describe('update context menu', () => {
    const func = mjs.updateContextMenu;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.isWebExt = true;
      vars.promptContent = false;
      enabledFormats.add('HTMLPlain');
      enabledFormats.add('Markdown');
      enabledFormats.add('TextURL');
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.isWebExt = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });

    it('should throw', async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, 'Expected Number but got Undefined.',
          'throw');
      });
    });

    it('should not call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.menus.update.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      enabledFormats.clear();
      const res = await func(1);
      assert.strictEqual(browser.menus.update.callCount, i, 'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should call function', async () => {
      const i = browser.menus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      const res = await func(1);
      assert.strictEqual(browser.menus.update.callCount, i + 6, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 2, 'called');
      assert.strictEqual(res.length, 6, 'result');
    });

    it('should call function', async () => {
      const i = browser.menus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      const res = await func(1);
      assert.strictEqual(browser.menus.update.callCount, i + 6, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 2, 'called');
      assert.strictEqual(res.length, 6, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      vars.promptContent = true;
      const res = await func(1);
      assert.strictEqual(browser.menus.update.callCount, i + 6, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 2, 'called');
      assert.strictEqual(res.length, 6, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      vars.promptContent = true;
      const res = await func(2);
      assert.strictEqual(browser.menus.update.callCount, i + 6, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 2, 'called');
      assert.strictEqual(res.length, 6, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      vars.isWebExt = false;
      const res = await func(1);
      assert.strictEqual(browser.menus.update.callCount, i + 2, 'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
      assert.strictEqual(browser.tabs.query.callCount, k + 2, 'called');
      assert.strictEqual(res.length, 2, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      vars.isWebExt = false;
      vars.promptContent = true;
      const res = await func(1);
      assert.strictEqual(browser.menus.update.callCount, i + 2, 'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
      assert.strictEqual(browser.tabs.query.callCount, k + 2, 'called');
      assert.strictEqual(res.length, 2, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.menus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      vars.isWebExt = false;
      vars.promptContent = true;
      const res = await func(2);
      assert.strictEqual(browser.menus.update.callCount, i + 2, 'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
      assert.strictEqual(browser.tabs.query.callCount, k + 2, 'called');
      assert.strictEqual(res.length, 2, 'result');
    });
  });

  describe('handle menus on shown', () => {
    const func = mjs.handleMenusOnShown;
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.isWebExt = true;
      enabledFormats.add('HTMLPlain');
      enabledFormats.add('Markdown');
      enabledFormats.add('TextURL');
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
    });

    it('should get null', async () => {
      const res = await func({}, {});
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func({ contexts: [] }, {});
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func({ contexts: ['tab'] }, {});
      assert.isNull(res, 'result');
    });

    it('should not call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.menus.update.callCount;
      const j = browser.menus.refresh.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      enabledFormats.clear();
      const res = await func({ contexts: ['tab'] }, { id: 1 });
      assert.strictEqual(browser.menus.update.callCount, i, 'not called');
      assert.strictEqual(browser.menus.refresh.callCount, j, 'not called');
      assert.strictEqual(browser.tabs.query.callCount, k, 'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.menus.update.callCount;
      const j = browser.menus.refresh.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: 'normal'
      }).resolves([{}, {}]);
      const res = await func({ contexts: ['tab'] }, { id: 1 });
      assert.strictEqual(browser.menus.update.callCount, i + 6, 'called');
      assert.strictEqual(browser.menus.refresh.callCount, j + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, k + 2, 'called');
      assert.isNull(res, 'result');
    });
  });

  describe('set icon', () => {
    const func = mjs.setIcon;

    it('should get result', async () => {
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, 'called');
      assert.strictEqual(browser.runtime.getURL.callCount, j + 1, 'called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k + 1,
        'called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l + 1,
        'called');
      assert.deepEqual(res, [
        [
          {
            path: 'foo/bar'
          }
        ],
        [
          {
            title: 'extensionName'
          }
        ]
      ], 'result');
    });

    it('should get result', async () => {
      const { vars } = mjs;
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      vars.iconId = '#baz';
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, 'called');
      assert.strictEqual(browser.runtime.getURL.callCount, j + 1, 'called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k + 1,
        'called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l + 1,
        'called');
      assert.deepEqual(res, [
        [
          {
            path: 'foo/bar#baz'
          }
        ],
        [
          {
            title: 'extensionName'
          }
        ]
      ], 'result');
    });
  });

  describe('set default icon', () => {
    const func = mjs.setDefaultIcon;
    beforeEach(() => {
      const { vars } = mjs;
      vars.isWebExt = false;
      vars.iconId = '';
    });
    afterEach(() => {
      const { vars } = mjs;
      vars.isWebExt = false;
      vars.iconId = '';
    });

    it('should get null', async () => {
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i, 'not called');
      assert.strictEqual(browser.runtime.getURL.callCount, j, 'not called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k,
        'not called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const { vars } = mjs;
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      vars.isWebExt = true;
      vars.iconId = '#foo';
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i, 'not called');
      assert.strictEqual(browser.runtime.getURL.callCount, j, 'not called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k,
        'not called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const { vars } = mjs;
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      vars.isWebExt = false;
      vars.iconId = '';
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i, 'not called');
      assert.strictEqual(browser.runtime.getURL.callCount, j, 'not called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k,
        'not called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const { vars } = mjs;
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      vars.isWebExt = true;
      vars.iconId = '';
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, 'called');
      assert.strictEqual(browser.runtime.getURL.callCount, j + 1, 'called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k + 1,
        'called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l + 1,
        'called');
      assert.deepEqual(res, [
        [
          {
            path: 'foo/bar#context'
          }
        ],
        [
          {
            title: 'extensionName'
          }
        ]
      ], 'result');
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
      await mjs.setFormatData();
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
      await mjs.setFormatData();
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
      await mjs.setFormatData();
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
      browser.tabs.executeScript.resolves([]);
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      browser.tabs.executeScript.rejects(new Error('error'));
      const res = await func();
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
    beforeEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
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

    it('should throw', async () => {
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
      }).resolves('foo bar');
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
        canonical: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves('foo bar');
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
      mjs.enabledFormats.add(menuItemId);
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
        canonical: null,
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves('foo bar');
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
      window.prompt.reset();
      window.prompt.returns('foo bar');
      global.window.prompt.reset();
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
        isLink: false,
        canonical: null,
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves('foo bar');
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
      mjs.enabledFormats.add(menuItemId);
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
        canonical: 'https://www.example.com/',
        content: null,
        selectionText: '',
        title: null,
        url: null
      }]);
      browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).resolves('foo bar');
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.preferCanonicalUrl = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_PLAIN;
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
        canonical: null,
        content: 'foo',
        selectionText: 'foo bar baz',
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = HTML_PLAIN;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = BBCODE_URL;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: 'https://example.com/',
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: 'https://example.com/',
        content: null,
        selectionText: 'foo bar baz',
        title: null,
        url: null
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: null,
        content: 'foo',
        selectionText: 'foo bar baz',
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_LINK}${BBCODE_URL}`;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TAB}${HTML_PLAIN}`;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TAB}${BBCODE_URL}`;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TABS_SELECTED}${HTML_PLAIN}`;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TABS_OTHER}${HTML_PLAIN}`;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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
      const i = browser.tabs.executeScript.withArgs({
        file: JS_EDIT_CONTENT
      }).callCount;
      const j = browser.tabs.query.callCount;
      const k = browser.notifications.create.callCount;
      const l = navigator.clipboard.writeText.callCount;
      const menuItemId = `${COPY_TABS_ALL}${HTML_PLAIN}`;
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
        canonical: null,
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
      mjs.enabledFormats.add(menuItemId);
      mjs.vars.notifyOnCopy = true;
      mjs.vars.preferCanonicalUrl = true;
      mjs.vars.promptContent = true;
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

    it('should call function', async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func({
        tabId: 1
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, 'called');
      assert.deepEqual(res, [], 'result');
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

    it('should not call function', async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func('foo');
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, 'not called');
    });

    it('should not call function', async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func('foo');
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, 'not called');
    });

    it('should not call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([{
        id: -1
      }]);
      enabledFormats.add('HTMLPlain');
      await func('HTMLPlain');
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, 'not called');
    });

    it('should call function', async () => {
      const { enabledFormats } = mjs;
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([{
        id: 1
      }]);
      enabledFormats.add('HTMLPlain');
      await func(`${CMD_COPY}HTMLPlain`);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, 'called');
    });

    it('should log error', async () => {
      const { enabledFormats } = mjs;
      const stub = sinon.stub(console, 'error');
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.sendMessage.rejects(new Error('error'));
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([{
        id: 1
      }]);
      enabledFormats.add('HTMLPlain');
      await func(`${CMD_COPY}HTMLPlain`);
      const { calledOnce } = stub;
      stub.restore();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1,
        'called sendMessage');
      assert.isTrue(calledOnce, 'called console');
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

    it('should call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const res = await func({
        [CONTENT_EDITED]: {
          content: 'foo',
          formatId: 'TextURL',
          mimeType: 'text/plain',
          template: '%content% %url%',
          title: 'bar',
          url: 'https://example.com/#baz'
        }
      });
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should not call function', async () => {
      const i = navigator.clipboard.writeText.callCount;
      const res = await func({
        [CONTENT_EDITED]: {}
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
      vars.iconId = '';
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.isWebExt = false;
      vars.notifyOnCopy = false;
      vars.preferCanonicalUrl = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });
    afterEach(() => {
      const { enabledFormats, vars } = mjs;
      vars.iconId = '';
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.isWebExt = false;
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
      await mjs.setFormatData();
      const res = await func('TextURL', {
        checked: false
      });
      const { enabledFormats } = mjs;
      assert.isFalse(enabledFormats.has('TextURL'), 'value');
      assert.deepEqual(res, [undefined], 'result');
    });

    it('should set variable', async () => {
      await mjs.setFormatData();
      const res = await func('TextURL', {
        checked: false
      }, true);
      const { enabledFormats } = mjs;
      assert.isFalse(enabledFormats.has('TextURL'), 'value');
      assert.strictEqual(res.length, 1, 'result');
      assert.strictEqual(res[0].length, 90, 'result');
    });

    it('should set variable', async () => {
      await mjs.setFormatData();
      const res = await func('TextURL', {
        checked: true
      });
      const { enabledFormats } = mjs;
      assert.isTrue(enabledFormats.has('TextURL'), 'value');
      assert.deepEqual(res, [undefined], 'result');
    });

    it('should set variable', async () => {
      await mjs.setFormatData();
      const res = await func('TextURL', {
        checked: true
      }, true);
      const { enabledFormats } = mjs;
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
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([{
        id: 1
      }]);
      const res = await func(PROMPT, {
        checked: true
      });
      assert.strictEqual(browser.tabs.query.callCount, i, 'not called');
      assert.isTrue(vars.promptContent, 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: 'normal'
      }).resolves([{
        id: 1
      }]);
      const res = await func(PROMPT, {
        checked: true
      }, true);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, 'called');
      assert.isTrue(vars.promptContent, 'value');
      assert.deepEqual(res, [[]], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: '#foo'
      }, true);
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should not set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_AUTO, {
        checked: false,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '', 'value');
      assert.deepEqual(res, [], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_BLACK, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_COLOR, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_DARK, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_LIGHT, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
    });

    it('should set variable', async () => {
      const { vars } = mjs;
      const res = await func(ICON_WHITE, {
        checked: true,
        value: '#foo'
      });
      assert.strictEqual(vars.iconId, '#foo', 'value');
      assert.deepEqual(res, [[undefined, undefined]], 'result');
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
      assert.deepEqual(res, [[]], 'result');
    });
  });
});
