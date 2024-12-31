/**
 * sanitize-attr.test.js
 */
/* eslint-disable import-x/order */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import DOMPurify from '../src/lib/purify/purify.min.js';
import * as mjs from '../src/mjs/sanitize-attr.js';

describe('sanitize attr', () => {
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
    window.DOMPurify = DOMPurify;
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

  describe('sanitize attributes', () => {
    const func = mjs.sanitizeAttributes;

    it('should get empty string', async () => {
      const res = await func();
      assert.strictEqual(res, '', 'result');
    });

    it('should get empty string', async () => {
      const attr = 'onclick="alert(1)"';
      const res = await func(attr);
      assert.strictEqual(res, '', 'result');
    });

    it('should get empty string', async () => {
      const attr = 'title="foo bar"';
      const res = await func(attr);
      assert.strictEqual(res, '', 'result');
    });

    it('should get result', async () => {
      const attr =
        'class="foo" onclick="alert(1)" target="_blank" title="foo bar"';
      const res = await func(attr);
      assert.strictEqual(res, 'target="_blank" class="foo"', 'result');
    });

    it('should get result', async () => {
      const attr = 'class="foo"><script>alert(1)</script';
      const res = await func(attr);
      assert.strictEqual(res, 'class="foo"', 'result');
    });

    it('should get result', async () => {
      const attr = 'class="foo"><span class="bar">';
      const res = await func(attr);
      assert.strictEqual(res, 'class="foo"', 'result');
    });

    it('should get result', async () => {
      const attr = 'class="foo"<span class="bar">';
      const res = await func(attr);
      assert.strictEqual(res, 'class="foo"', 'result');
    });

    it('should get result', async () => {
      const attr = 'class="foo"><a href="#">nested anchor</a';
      const res = await func(attr);
      assert.strictEqual(res, 'class="foo"', 'result');
    });

    it('should get result', async () => {
      const attr = 'class="foo"></a><a href="#">next sibling anchor</a';
      const res = await func(attr);
      assert.strictEqual(res, 'class="foo"', 'result');
    });
  });
});
