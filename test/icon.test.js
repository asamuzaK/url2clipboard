/**
 * icon.test.js
 */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser } from './mocha/setup.js';
import { ICON, WEBEXT_ID } from '../src/mjs/constant.js';

/* test */
import * as mjs from '../src/mjs/icon.js';

describe('icon', () => {
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

  describe('set icon', () => {
    const func = mjs.setIcon;
    beforeEach(() => {
      mjs.icon.clear();
    });
    afterEach(() => {
      mjs.icon.clear();
    });

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
      assert.strictEqual(mjs.icon.size, 1, 'size');
      assert.strictEqual(mjs.icon.get('id'), '', 'value');
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
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      const res = await func('#baz');
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, 'called');
      assert.strictEqual(browser.runtime.getURL.callCount, j + 1, 'called');
      assert.strictEqual(browser.browserAction.setIcon.callCount, k + 1,
        'called');
      assert.strictEqual(browser.browserAction.setTitle.callCount, l + 1,
        'called');
      assert.strictEqual(mjs.icon.size, 1, 'size');
      assert.strictEqual(mjs.icon.get('id'), '#baz', 'value');
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
      browser.runtime.id = null;
      mjs.icon.clear();
    });
    afterEach(() => {
      browser.runtime.id = null;
      mjs.icon.clear();
    });

    it('should not call function', async () => {
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

    it('should not call function', async () => {
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.runtime.id = WEBEXT_ID;
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      mjs.icon.set('id', '#foo');
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
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns('foo/bar');
      browser.runtime.id = WEBEXT_ID;
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
});
