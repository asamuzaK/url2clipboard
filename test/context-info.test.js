/**
 * context-info.test.js
 */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
// eslint-disable-next-line import/order
import * as cjs from '../src/js/context-info.js';

describe('context-info', () => {
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

  describe('get active element', () => {
    const func = cjs.getActiveElm;

    it('should get element', async () => {
      const btn = document.createElement('button');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      p.appendChild(btn);
      body.appendChild(p);
      btn.focus();
      const res = await func();
      assert.deepEqual(res, btn, 'result');
    });

    it('should get element', async () => {
      const range = document.createRange();
      const text = document.createTextNode('foo');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      p.appendChild(text);
      body.appendChild(p);
      range.selectNode(text);
      const res = await func();
      assert.deepEqual(res, body, 'result');
    });

    it('should get element', async () => {
      const range = document.createRange();
      const range2 = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode('foo');
      const text2 = document.createTextNode('bar');
      const text3 = document.createTextNode('baz');
      const span = document.createElement('span');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      p.appendChild(text);
      p.appendChild(document.createElement('br'));
      span.appendChild(text2);
      p.appendChild(span);
      p.appendChild(document.createElement('br'));
      p.appendChild(text3);
      body.appendChild(p);
      range.setStart(p, 0);
      range.setEndAfter(span);
      range2.selectNode(text3);
      sel.addRange(range);
      sel.addRange(range2);
      const res = await func();
      assert.deepEqual(res, p, 'result');
    });

    it('should get element', async () => {
      const range = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode('foo');
      const text2 = document.createTextNode('bar');
      const text3 = document.createTextNode('baz');
      const span = document.createElement('span');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      p.appendChild(text);
      p.appendChild(document.createElement('br'));
      span.appendChild(text2);
      p.appendChild(span);
      p.appendChild(document.createElement('br'));
      p.appendChild(text3);
      body.appendChild(p);
      range.setStart(p, 0);
      range.setEnd(span, 0);
      sel.addRange(range);
      const res = await func();
      assert.deepEqual(res, p, 'result');
    });

    it('should get element', async () => {
      const range = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode('foo');
      const text2 = document.createTextNode('bar');
      const text3 = document.createTextNode('baz');
      const span = document.createElement('span');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      p.appendChild(text);
      p.appendChild(document.createElement('br'));
      span.appendChild(text2);
      p.appendChild(span);
      p.appendChild(document.createElement('br'));
      p.appendChild(text3);
      body.appendChild(p);
      range.setStart(p, 0);
      range.setEnd(span, 0);
      range.collapse(true);
      sel.addRange(range);
      const res = await func();
      assert.deepEqual(res, body, 'result');
    });

    it('should get element', async () => {
      const range = document.createRange();
      const range2 = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode('foo bar baz');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      p.appendChild(text);
      body.appendChild(p);
      range.setStart(text, 0);
      range.setEnd(text, 2);
      range2.setStart(text, 4);
      range2.setEnd(text, text.length - 1);
      sel.addRange(range);
      sel.addRange(range2);
      const res = await func();
      assert.deepEqual(res, p, 'result');
    });
  });

  describe('create context info', () => {
    const func = cjs.createContextInfo;

    it('should get result', async () => {
      const res = await func();
      assert.deepEqual(res, {
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }, 'result');
    });

    it('should get result', async () => {
      const canonical = document.createElement('link');
      const head = document.querySelector('head');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      canonical.rel = 'canonical';
      canonical.href = 'https://example.com/';
      head.appendChild(canonical);
      body.appendChild(p);
      const res = await func(p);
      assert.deepEqual(res, {
        isLink: false,
        canonicalUrl: 'https://example.com/',
        content: null,
        selectionText: '',
        title: null,
        url: null
      }, 'result');
    });

    it('should get result', async () => {
      const a = document.createElement('a');
      const body = document.querySelector('body');
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://example.com';
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: null,
        content: 'foo bar',
        selectionText: '',
        title: '',
        url: 'https://example.com/'
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: null,
        content: 'foo bar',
        selectionText: '',
        title: 'baz qux',
        url: 'https://www.example.com/bar'
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: null,
        content: 'foo bar',
        selectionText: '',
        title: 'baz qux',
        url: 'https://www.example.com/bar'
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo\nbar');
      const a = document.createElement('a');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: null,
        content: 'foo bar',
        selectionText: '',
        title: 'baz qux',
        url: 'https://www.example.com/bar'
      }, 'result');
    });

    it('should get result', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
      const body = document.querySelector('body');
      a.href = 'foo.svg#bar';
      svg.appendChild(a);
      body.appendChild(svg);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: null,
        content: '',
        selectionText: '',
        title: undefined,
        url: 'foo.svg#bar'
      }, 'result');
    });

    it('should get result', async () => {
      const canonical = document.createElement('link');
      const head = document.querySelector('head');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
      const body = document.querySelector('body');
      canonical.rel = 'canonical';
      canonical.href = 'https://example.com/';
      head.appendChild(canonical);
      a.href = {
        baseVal: 'foo.svg#bar'
      };
      svg.appendChild(a);
      body.appendChild(svg);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: 'https://example.com/',
        content: '',
        selectionText: '',
        title: undefined,
        url: 'foo.svg#bar'
      }, 'result');
    });
  });

  describe('get context info', () => {
    const func = cjs.getContextInfo;

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      p.appendChild(a);
      body.appendChild(p);
      const res = await func(text);
      assert.deepEqual(res, {
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      p.appendChild(a);
      body.appendChild(p);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: false,
        content: null,
        canonicalUrl: null,
        selectionText: '',
        title: null,
        url: null
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      p.appendChild(a);
      body.appendChild(p);
      a.focus();
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        canonicalUrl: null,
        content: 'foo bar',
        selectionText: '',
        title: 'baz qux',
        url: 'https://www.example.com/bar'
      }, 'result');
    });

    it('should get result', async () => {
      const text = document.createTextNode('foo  bar');
      const a = document.createElement('a');
      const p = document.createElement('p');
      const body = document.querySelector('body');
      a.appendChild(text);
      a.href = 'https://www.example.com/bar';
      a.title = 'baz qux';
      p.appendChild(a);
      body.appendChild(p);
      const res = await func(p);
      assert.deepEqual(res, {
        isLink: false,
        canonicalUrl: null,
        content: null,
        selectionText: '',
        title: null,
        url: null
      }, 'result');
    });
  });
});
