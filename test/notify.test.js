/**
 * notify.test.js
 */
/* eslint-disable import-x/order */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import { NOTIFY_COPY } from '../src/mjs/constant.js';
import * as mjs from '../src/mjs/notify.js';

describe('notify', () => {
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

  describe('notify on copy', () => {
    const func = mjs.notifyOnCopy;

    it('should call function', async () => {
      browser.runtime.getURL.withArgs('img/icon.png').returns('img/icon.png');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg').returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      browser.notifications.create.withArgs(NOTIFY_COPY, {
        iconUrl: 'img/icon.png',
        message: 'foo',
        title: 'bar',
        type: 'basic'
      }).resolves(true);
      const res = await func();
      assert.strictEqual(res, true, 'result');
    });

    it('should call function', async () => {
      browser.runtime.getURL.withArgs('img/icon.png').returns('img/icon.png');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg_format', 'foo')
        .returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      browser.notifications.create.withArgs(NOTIFY_COPY, {
        iconUrl: 'img/icon.png',
        message: 'foo',
        title: 'bar',
        type: 'basic'
      }).resolves(true);
      const res = await func('foo');
      assert.strictEqual(res, true, 'result');
    });

    it('should call function', async () => {
      const { window } = createJsdom();
      global.window = window;
      browser.runtime.getURL.withArgs('img/icon.svg').returns('img/icon.svg');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg').returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      browser.notifications.create.withArgs(NOTIFY_COPY, {
        iconUrl: 'img/icon.svg',
        message: 'foo',
        title: 'bar',
        type: 'basic'
      }).resolves(true);
      const res = await func();
      delete global.window;
      assert.strictEqual(res, true, 'result');
    });

    it('should call function', async () => {
      const { window } = createJsdom();
      global.window = window;
      browser.runtime.getURL.withArgs('img/icon.svg').returns('img/icon.svg');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg_format', 'foo')
        .returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      browser.notifications.create.withArgs(NOTIFY_COPY, {
        iconUrl: 'img/icon.svg',
        message: 'foo',
        title: 'bar',
        type: 'basic'
      }).resolves(true);
      const res = await func('foo');
      delete global.window;
      assert.strictEqual(res, true, 'result');
    });
  });
});
