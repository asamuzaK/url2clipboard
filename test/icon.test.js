/**
 * icon.test.js
 */
/* eslint-disable import/order */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser } from './mocha/setup.js';

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

    it('should not call function', async () => {
      const i = browser.action.setIcon.callCount;
      browser.runtime.getURL.withArgs('img/icon-color-16.png')
        .returns('foo/img/icon-color-16.png');
      browser.action.setIcon.callsFake((...args) => args);
      const res = await func();
      assert.strictEqual(browser.action.setIcon.callCount, i, 'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.action.setIcon.callCount;
      browser.runtime.getURL.withArgs('img/icon-color-16.png')
        .returns('foo/img/icon-color-16.png');
      browser.action.setIcon.callsFake((...args) => args);
      const res = await func('icon-color-16.png');
      assert.strictEqual(browser.action.setIcon.callCount, i + 1, 'called');
      assert.deepEqual(res, [
        {
          path: 'foo/img/icon-color-16.png'
        }
      ], 'result');
    });
  });
});
