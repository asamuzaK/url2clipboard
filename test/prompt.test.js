/**
 * prompt.test.js
 */
/* eslint-disable import/order */

/* api */
import sinon from 'sinon';
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import * as mjs from '../src/mjs/prompt.js';

describe('prompt', () => {
  const globalKeys = [
    'Blob',
    'ClipboardItem',
    'DOMParser',
    'DOMPurify',
    'HTMLUnknownElement',
    'Node',
    'XMLSerializer'
  ];
  let window, document;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window.document;
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    browser.storage.local.get.resolves({});
    global.browser = browser;
    global.window = window;
    global.document = document;
    for (const key of globalKeys) {
      global[key] = window[key];
    }
  });
  afterEach(() => {
    window = null;
    document = null;
    delete global.browser;
    delete global.window;
    delete global.document;
    for (const key of globalKeys) {
      delete global[key];
    }
    browser._sandbox.reset();
  });

  describe('prompt content', () => {
    const func = mjs.promptContent;

    it('should get null', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func({
        content: 'foo',
        tabId: browser.tabs.TAB_ID_NONE
      });
      assert.isNull(res, 'result');
    });

    it('should throw', async () => {
      const i = browser.scripting.executeScript.callCount;
      const j = browser.i18n.getMessage.callCount;
      browser.scripting.executeScript.resolves([{
        error: new Error('error')
      }]);
      const res = await func({
        content: 'foo',
        tabId: 1
      }).catch(e => {
        assert.instanceOf(e, Error, 'error');
        assert.strictEqual(e.message, 'error', 'message');
      });
      assert.strictEqual(browser.scripting.executeScript.callCount, i + 1,
        'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, j,
        'i18n not called');
      // should not reach
      assert.isUndefined(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.scripting.executeScript.callCount;
      const j = browser.i18n.getMessage.callCount;
      browser.scripting.executeScript.resolves([{
        result: 'foo bar'
      }]);
      const res = await func({
        content: 'foo',
        tabId: 1
      });
      assert.strictEqual(browser.scripting.executeScript.callCount, i + 1,
        'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, j,
        'i18n not called');
      assert.strictEqual(res, 'foo bar', 'result');
    });

    it('should call function', async () => {
      const i = browser.scripting.executeScript.callCount;
      const j = browser.i18n.getMessage.callCount;
      browser.scripting.executeScript.resolves([{
        result: 'foo bar'
      }]);
      browser.i18n.getMessage.returns('baz');
      const res = await func({
        content: 'foo',
        formatTitle: 'Markdown',
        tabId: 1
      });
      assert.strictEqual(browser.scripting.executeScript.callCount, i + 1,
        'called');
      assert.strictEqual(browser.i18n.getMessage.callCount, j + 1,
        'i18n called');
      assert.strictEqual(res, 'foo bar', 'result');
    });
  });
});
