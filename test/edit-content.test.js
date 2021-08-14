/**
 * edit-content.test.js
 */

const { assert } = require('chai');
const { afterEach, beforeEach, describe, it } = require('mocha');
const { browser, createJsdom } = require('./mocha/setup.js');
const cjs = require('../src/js/edit-content.js');

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

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('is string', () => {
    const func = cjs.isString;

    it('should get false', () => {
      const items = [[], ['foo'], {}, { foo: 'bar' }, undefined, null, 1, true];
      for (const item of items) {
        assert.isFalse(func(item), 'result');
      }
    });

    it('should get true', () => {
      const items = ['', 'foo'];
      for (const item of items) {
        assert.isTrue(func(item), 'result');
      }
    });
  });

  describe('get edited content', () => {
    const func = cjs.getEditedContent;

    it('should get null', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      window.prompt.reset();
      window.prompt.returns(null);
      global.window.prompt.reset();
      global.window.prompt.returns(null);
      const data = {
        content: 'foo',
        promptMsg: 'Edit content'
      };
      window.editContentData = data;
      global.window.editContentData = data;
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get empty string', async () => {
      window.prompt.reset();
      window.prompt.returns('');
      global.window.prompt.reset();
      global.window.prompt.returns('');
      const data = {
        content: 'foo',
        promptMsg: 'Edit content'
      };
      window.editContentData = data;
      global.window.editContentData = data;
      const res = await func();
      assert.strictEqual(res, '', 'result');
    });

    it('should get result', async () => {
      window.prompt.reset();
      window.prompt.returns('foo bar');
      global.window.prompt.reset();
      global.window.prompt.returns('foo bar');
      const data = {
        content: 'foo',
        promptMsg: null
      };
      window.editContentData = data;
      global.window.editContentData = data;
      const res = await func();
      assert.strictEqual(res, 'foo bar', 'result');
    });

    it('should get result', async () => {
      window.prompt.reset();
      window.prompt.returns('foo bar');
      global.window.prompt.reset();
      global.window.prompt.returns('foo bar');
      const data = {
        content: 'foo',
        promptMsg: 'Edit content'
      };
      window.editContentData = data;
      global.window.editContentData = data;
      const res = await func();
      assert.strictEqual(res, 'foo bar', 'result');
    });
  });
});
