/**
 * edit-content-mjs.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { createJsdom } from './mocha/setup.js';

/* test */
// eslint-disable-next-line import-x/order
import * as mjs from '../src/mjs/edit-content.js';

describe('edit-content', () => {
  let window, document;
  const globalKeys = ['Node'];
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    global.window = window;
    global.document = document;
    for (const key of globalKeys) {
      if (window[key] && !global[key]) {
        global[key] = window[key];
      }
    }
  });
  afterEach(() => {
    window = null;
    document = null;
    delete global.window;
    delete global.document;
    for (const key of globalKeys) {
      delete global[key];
    }
  });

  describe('edit content', () => {
    const func = mjs.editContent;

    it('should get null', async () => {
      window.prompt.returns(null);
      global.window.prompt.returns(null);
      const res = await func();
      assert.strictEqual(res, null, 'result');
    });

    it('should get null', async () => {
      window.prompt.returns(null);
      global.window.prompt.returns(null);
      const res = await func('foo', 'Edit content');
      assert.strictEqual(res, null, 'result');
    });

    it('should get empty string', async () => {
      window.prompt.returns('');
      global.window.prompt.returns('');
      const res = await func();
      assert.strictEqual(res, '', 'result');
    });

    it('should get empty string', async () => {
      window.prompt.returns('');
      global.window.prompt.returns('');
      const res = await func('foo', 'Edit content');
      assert.strictEqual(res, '', 'result');
    });

    it('should get result', async () => {
      window.prompt.returns('foo bar');
      global.window.prompt.returns('foo bar');
      const res = await func();
      assert.strictEqual(res, 'foo bar', 'result');
    });

    it('should get result', async () => {
      window.prompt.returns('foo bar');
      global.window.prompt.returns('foo bar');
      const res = await func('foo', 'Edit content');
      assert.strictEqual(res, 'foo bar', 'result');
    });
  });
});
