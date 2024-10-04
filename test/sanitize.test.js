/**
 * sanitize.test.js
 */
/* eslint-disable import-x/order */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import * as mjs from '../src/mjs/sanitize.js';

describe('sanitize', () => {
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

  describe('sanitize URL', () => {
    const func = mjs.sanitizeURL;

    it('should get null', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func('foo');
      assert.isNull(res, 'result');
    });

    it('should get result', async () => {
      const res = await func('https://example.com/"onclick="alert(1)"');
      assert.strictEqual(res, 'https://example.com/', 'result');
    });

    it('should get result', async () => {
      const res = await func('https://example.com/"onclick="alert(1)"');
      assert.strictEqual(res, 'https://example.com/', 'result');
    });

    it('should get result', async () => {
      const res =
        await func('data:,https://example.com/#<script>alert(1);</script>', {
          allow: ['data']
        });
      assert.strictEqual(res, 'data:,https://example.com/', 'result');
    });
  });
});
