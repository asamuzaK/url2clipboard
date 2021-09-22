/**
 * menu.test.js
 */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser } from './mocha/setup.js';
import { COPY_PAGE } from '../src/mjs/constant.js';

/* test */
import * as mjs from '../src/mjs/menu.js';

describe('menu', () => {
  beforeEach(() => {
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
    browser._sandbox.reset();
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
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
      assert.strictEqual(browser.menus.update.callCount, i + 5, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 2, 'called');
      assert.strictEqual(res.length, 5, 'result');
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
      assert.strictEqual(browser.menus.update.callCount, i + 5, 'called');
      assert.strictEqual(browser.tabs.query.callCount, j + 2, 'called');
      assert.strictEqual(res.length, 5, 'result');
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
      browser.menus.refresh.resolves(undefined);
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
      browser.menus.refresh.resolves(undefined);
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
      assert.strictEqual(browser.menus.update.callCount, i + 5, 'called');
      assert.strictEqual(browser.menus.refresh.callCount, j + 1, 'called');
      assert.strictEqual(browser.tabs.query.callCount, k + 2, 'called');
      assert.isUndefined(res, 'result');
    });
  });
});
