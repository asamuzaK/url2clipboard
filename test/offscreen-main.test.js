/**
 * offscreen-main.test.js
 */
/* eslint-disable import/order */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import { EXEC_COPY, MIME_PLAIN, URL_SANITIZE } from '../src/mjs/constant.js';
import * as mjs from '../src/mjs/offscreen-main.js';

describe('offscreen-main', () => {
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

  describe('execute copy', () => {
    const func = mjs.execCopy;

    it('should not call function', async () => {
      browser.runtime.getURL.returns('foo/bar');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg_format').returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const opt = {
        formatTitle: 'Text & URL',
        mimeType: 'text/foo',
        notify: false,
        text: 'foo https://example.com'
      };
      await func(opt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
        'not called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
    });

    it('should call function', async () => {
      browser.runtime.getURL.returns('foo/bar');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg_format').returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const opt = {
        formatTitle: 'Text & URL',
        mimeType: MIME_PLAIN,
        notify: false,
        text: 'foo https://example.com'
      };
      await func(opt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
        'not called');
    });

    it('should call function', async () => {
      browser.runtime.getURL.returns('foo/bar');
      browser.i18n.getMessage.withArgs('notifyOnCopyMsg_format').returns('foo');
      browser.i18n.getMessage.withArgs('extensionName').returns('bar');
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const opt = {
        formatTitle: 'Text & URL',
        mimeType: MIME_PLAIN,
        notify: true,
        text: 'foo https://example.com'
      };
      await func(opt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
        'called');
      assert.strictEqual(browser.runtime.sendMessage.callCount, j + 1,
        'called');
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
      const res = await func({ [EXEC_COPY]: {} });
      assert.deepEqual(res, [undefined], 'result');
    });

    it('should get array', async () => {
      const res = await func({
        [URL_SANITIZE]: [
          'data:,https://example.com/#<script>alert(1);</script>',
          {
            allow: ['data', 'file'],
            remove: true
          }
        ]
      });
      assert.deepEqual(res, ['data:,https://example.com/'], 'result');
    });
  });
});
