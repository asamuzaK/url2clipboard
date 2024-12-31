/**
 * serialize-dom.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { createJsdom } from './mocha/setup.js';

/* test */
// eslint-disable-next-line import-x/order
import * as mjs from '../src/mjs/dom-util.js';

describe('serialize-dom', () => {
  let window, document;
  const globalKeys = [
    'DOMParser',
    'HTMLUnknownElement',
    'Node',
    'XMLSerializer'
  ];

  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    global.window = window;
    global.document = document;
    for (const key of globalKeys) {
      global[key] = window[key];
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

  describe('get namespace of node from ancestor', () => {
    const func = mjs.getNodeNS;

    it('should get result', () => {
      const p = document.createElement('p');
      const body = document.querySelector('body');
      body.appendChild(p);
      const res = func(p);
      assert.deepEqual(res.node, p, 'node');
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', () => {
      const p = document.createElementNS('http://www.w3.org/1999/xhtml', 'p');
      const body = document.querySelector('body');
      body.appendChild(p);
      const res = func(p);
      assert.deepEqual(res.node, p, 'node');
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', () => {
      const p = document.createElement('p');
      const text = document.createTextNode('foo');
      const body = document.querySelector('body');
      p.appendChild(text);
      body.appendChild(p);
      const res = func(text);
      assert.deepEqual(res.node, p, 'node');
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const body = document.querySelector('body');
      body.appendChild(svg);
      const res = await func(svg);
      assert.deepEqual(res.node, svg, 'node');
      assert.strictEqual(res.localName, 'svg', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/2000/svg',
        'namespace');
    });

    it('should get result', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const text = document.createTextNode('foo');
      const body = document.querySelector('body');
      svg.appendChild(text);
      body.appendChild(svg);
      const res = func(text);
      assert.deepEqual(res.node, svg, 'node');
      assert.strictEqual(res.localName, 'svg', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/2000/svg',
        'namespace');
    });

    it('should get result', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const fo =
        document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      const p = document.createElement('p');
      const text = document.createTextNode('foo');
      const body = document.querySelector('body');
      fo.setAttributeNS('http://www.w3.org/2000/svg', 'requiredExtensions',
        'http://www.w3.org/1999/xhtml');
      p.appendChild(text);
      fo.appendChild(p);
      svg.appendChild(body);
      const res = func(text);
      assert.deepEqual(res.node, p, 'node');
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', () => {
      const page = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'page'
      );
      const vbox = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'vbox'
      );
      const div = document.createElementNS('http://www.w3.org/1999/xhtml',
        'html:div');
      const text = document.createTextNode('foo');
      page.setAttributeNS('http://www.w3.org/2000/xmlns',
        'html', 'http://www.w3.org/1999/xhtml');
      div.appendChild(text);
      vbox.appendChild(div);
      page.appendChild(vbox);
      const res = func(text);
      assert.deepEqual(res.node, div, 'node');
      assert.strictEqual(res.localName, 'div', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', () => {
      const page = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'page'
      );
      const vbox = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'vbox'
      );
      const div = document.createElement('html:div');
      const text = document.createTextNode('foo');
      page.setAttributeNS('http://www.w3.org/2000/xmlns',
        'html', 'http://www.w3.org/1999/xhtml');
      div.appendChild(text);
      vbox.appendChild(div);
      page.appendChild(vbox);
      const res = func(text);
      assert.deepEqual(res.node, div, 'node');
      assert.strictEqual(res.localName, 'html:div', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', () => {
      const html = document.querySelector('html');
      const text = document.createTextNode('foo');
      html.appendChild(text);
      const res = func(text);
      assert.deepEqual(res.node, html, 'node');
      assert.strictEqual(res.localName, 'html', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });

    it('should get result', () => {
      const html = document.querySelector('html');
      html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      const res = func(html);
      assert.deepEqual(res.node, html, 'node');
      assert.strictEqual(res.localName, 'html', 'localName');
      assert.strictEqual(res.namespaceURI, 'http://www.w3.org/1999/xhtml',
        'namespace');
    });
  });

  describe('set namespaced attribute', () => {
    const func = mjs.setAttributeNS;

    it('should not set attributes', async () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('p');
      elm2.setAttribute('data-foo', 'bar');
      func(elm);
      assert.strictEqual(elm.hasAttribute('data-foo'), false, 'attr');
    });

    it('should not set attributes', async () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('p');
      elm2.setAttribute('data-foo', 'bar');
      func(null, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), false, 'attr');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('p');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('onclick', 'return false');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('onclick'), false, 'func');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length - 1,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('p');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('onclick', 'alert(1)');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('onclick'), false, 'func');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length - 1,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('object');
      const elm2 = document.createElement('object');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('data', 'https://example.com');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('data'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('object');
      const elm2 = document.createElement('object');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('data', '../baz');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('data'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('object');
      const elm2 = document.createElement('object');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('data', 'javascript:void(0)');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('data'), false, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length - 1,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('a');
      const elm2 = document.createElement('a');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('href', 'https://example.com');
      elm2.setAttribute('ping', 'https://example.com https://example.net');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('href'), true, 'url');
      assert.strictEqual(elm.hasAttribute('ping'), true, 'ping url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('a');
      const elm2 = document.createElement('a');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('href', '../');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('href'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('a');
      const elm2 = document.createElement('a');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('href', 'javascript:void(0)');
      elm2.setAttribute(
        'ping',
        'https://example.com javascript:void(0)   https://example.net'
      );
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('href'), false, 'url');
      assert.strictEqual(elm.hasAttribute('ping'), false, 'ping url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length - 2,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('video');
      const elm2 = document.createElement('video');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('poster', 'https://example.com');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('poster'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('video');
      const elm2 = document.createElement('video');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('poster', '../baz');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('poster'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('video');
      const elm2 = document.createElement('video');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('poster', 'javascript:void(0)');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('poster'), false, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length - 1,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('img');
      const elm2 = document.createElement('img');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('src', 'https://example.com');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('src'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('img');
      const elm2 = document.createElement('img');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('src', '../baz');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('src'), true, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('img');
      const elm2 = document.createElement('img');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('src', 'javascript:void(0)');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('src'), false, 'url');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length - 1,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('input');
      const elm2 = document.createElement('input');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('value', 'foo bar');
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('value'), true, 'attr');
      assert.strictEqual(elm2.getAttribute('value'), 'foo bar',
        'original attr value');
      assert.strictEqual(elm.getAttribute('value'), '', 'cloned attr value');
      assert.strictEqual(elm2.value, 'foo bar', 'original value');
      assert.strictEqual(elm.value, '', 'cloned value');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const elm = document.createElement('input');
      const elm2 = document.createElement('input');
      const body = document.querySelector('body');
      elm2.setAttribute('data-foo', 'bar');
      elm2.setAttribute('value', '');
      elm2.value = 'foo bar';
      body.appendChild(elm2);
      func(elm, elm2);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.hasAttribute('value'), true, 'attr');
      assert.strictEqual(elm2.getAttribute('value'), '', 'original attr value');
      assert.strictEqual(elm.getAttribute('value'), '', 'cloned attr value');
      assert.strictEqual(elm2.value, 'foo bar', 'original value');
      assert.strictEqual(elm.value, '', 'cloned value');
      assert.strictEqual(elm.attributes.length, elm2.attributes.length,
        'length');
    });

    it('should set attributes', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const svg2 =
        document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const html = document.querySelector('html');
      const body = document.querySelector('body');
      html.setAttribute('xmlns', 'http://www.w3.org/2000/xmlns/');
      svg2.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:html',
        'http://www.w3.org/1999/xhtml');
      svg2.setAttributeNS('http://www.w3.org/1999/xhtml', 'html:data-foo',
        'bar');
      body.appendChild(svg2);
      func(svg, svg2);
      assert.strictEqual(svg.hasAttribute('xmlns:html'), true, 'attr');
      assert.strictEqual(svg.hasAttribute('html:data-foo'), true, 'attr');
      assert.strictEqual(svg.attributes.length, svg2.attributes.length,
        'length');
    });

    it('should get result', () => {
      const page = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'page'
      );
      const vbox = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'vbox'
      );
      const div = document.createElementNS('http://www.w3.org/1999/xhtml',
        'html:div');
      page.setAttributeNS('http://www.w3.org/2000/xmlns',
        'html', 'http://www.w3.org/1999/xhtml');
      div.setAttribute('data-foo', 'bar');
      vbox.appendChild(div);
      page.appendChild(vbox);
      const elm = document.createElementNS('http://www.w3.org/1999/xhtml',
        'html:div');
      func(elm, div);
      assert.strictEqual(elm.hasAttribute('data-foo'), true, 'attr');
      assert.strictEqual(elm.getAttribute('data-foo'), 'bar', 'value');
      assert.strictEqual(elm.attributes.length, div.attributes.length,
        'length');
    });

    it('should get result', () => {
      const page = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'page'
      );
      const vbox = document.createElementNS(
        'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
        'vbox'
      );
      const div = document.createElementNS('http://www.w3.org/1999/xhtml',
        'html:div');
      div.setAttributeNS('http://www.w3.org/1999/xhtml', 'html:data-foo',
        'bar');
      vbox.appendChild(div);
      page.appendChild(vbox);
      const elm = document.createElementNS('http://www.w3.org/1999/xhtml',
        'html:div');
      func(elm, div);
      assert.strictEqual(elm.hasAttribute('html:data-foo'), true, 'attr');
      assert.strictEqual(elm.getAttribute('html:data-foo'), 'bar', 'value');
      assert.strictEqual(elm.attributes.length, div.attributes.length,
        'length');
    });
  });

  describe('create namespaced element', () => {
    const func = mjs.createElement;

    it('should get null', () => {
      const res = func();
      assert.strictEqual(res, null, 'result');
    });

    it('should get null', () => {
      const elm = document.createElement('script');
      const body = document.querySelector('body');
      body.appendChild(elm);
      const res = func(elm);
      assert.strictEqual(res, null, 'result');
    });

    it('should get result', () => {
      const elm = document.createElement('p');
      const body = document.querySelector('body');
      body.appendChild(elm);
      const res = func(elm);
      assert.strictEqual(res.nodeType, Node.ELEMENT_NODE, 'nodeType');
      assert.strictEqual(res.localName, 'p', 'localName');
    });

    it('should get result', () => {
      const elm =
        document.createElementNS('http://www.w3.org/1999/xhtml', 'html:div');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const html = document.querySelector('html');
      const body = document.querySelector('body');
      html.setAttribute('xmlns', 'http://www.w3.org/2000/xmlns');
      svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:html',
        'http://www.w3.org/1999/xhtml');
      elm.setAttribute('data-foo', 'bar');
      svg.appendChild(elm);
      body.appendChild(svg);
      const res = func(elm);
      assert.strictEqual(res.nodeType, Node.ELEMENT_NODE, 'nodeType');
      assert.strictEqual(res.localName, 'div', 'localName');
      assert.strictEqual(res.hasAttribute('data-foo'), true, 'attr');
    });

    it('should get result', () => {
      const elm = document.createElement('foo');
      const body = document.querySelector('body');
      elm.setAttribute('bar', 'baz');
      body.appendChild(elm);
      const res = func(elm);
      assert.strictEqual(res instanceof HTMLUnknownElement, true, 'instance');
      assert.strictEqual(res.localName, 'foo', 'localName');
      assert.strictEqual(res.hasAttribute('bar'), false, 'attr');
    });

    it('should throw', async () => {
      const dom =
        new DOMParser().parseFromString('<foo@example.com>', 'text/html');
      const { body: domBody } = dom;
      const { firstElementChild: elm } = domBody;
      const body = document.querySelector('body');
      body.appendChild(elm);
      assert.throws(() => func(elm));
    });
  });

  describe('create document fragment from nodes array', () => {
    const func = mjs.createFragment;

    it('should get document fragment', () => {
      const res = func();
      assert.strictEqual(res.nodeType, Node.DOCUMENT_FRAGMENT_NODE, 'nodeType');
      assert.strictEqual(res.hasChildNodes(), false, 'hasChildNodes');
    });

    it('should get document fragment', () => {
      const arr = [];
      arr.push(
        document.createTextNode('\n'),
        document.createComment('foo'),
        null,
        document.createElement('p')
      );
      const res = func(arr);
      assert.strictEqual(res.nodeType, Node.DOCUMENT_FRAGMENT_NODE, 'nodeType');
      assert.strictEqual(res.childNodes.length, 2, 'childNodes');
      assert.strictEqual(res.childNodes[0].nodeType, Node.TEXT_NODE,
        'nodeType');
      assert.strictEqual(res.childNodes[1].nodeType, Node.ELEMENT_NODE,
        'nodeType');
    });
  });

  describe('append child nodes', () => {
    const func = mjs.appendChildNodes;

    it('should get element', () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('div');
      const res = func(elm, elm2);
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.hasChildNodes(), false, 'child');
    });

    it('should get element', () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('div');
      elm2.textContent = 'foo';
      const res = func(elm, elm2);
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.hasChildNodes(), true, 'child');
      assert.strictEqual(res.childNodes.length, 1, 'length');
    });

    it('should get element', () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('div');
      elm2.appendChild(document.createComment('foo'));
      const res = func(elm, elm2);
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.hasChildNodes(), false, 'child');
    });

    it('should get element', () => {
      const elm = document.createElement('p');
      const elm2 = document.createElement('div');
      const elm3 = document.createElement('span');
      const elm4 = document.createElement('span');
      elm3.textContent = 'foo';
      elm2.appendChild(elm3);
      elm2.appendChild(document.createTextNode('bar'));
      elm4.textContent = 'baz';
      elm2.appendChild(elm4);
      const res = func(elm, elm2);
      assert.strictEqual(res.localName, 'p', 'localName');
      assert.strictEqual(res.hasChildNodes(), true, 'child');
      assert.strictEqual(res.childNodes.length, 5, 'length');
    });
  });

  describe('serialize DOM string', () => {
    const func = mjs.serializeDomString;

    it('should throw', () => {
      assert.throws(() => func(), TypeError,
        'Expected String but got Undefined.');
    });

    it('should throw', () => {
      assert.throws(() => func('foo'), TypeError,
        'Expected String but got Undefined.');
    });

    it('should throw', () => {
      assert.throws(() => func('foo', 'image/png'), Error,
        'Unsupported MIME type image/png.');
    });

    it('should get null', () => {
      const res = func('<html></html>', 'text/html');
      assert.strictEqual(res, null, 'result');
    });

    it('should get result', () => {
      const res = func('<xml></xml>', 'text/xml');
      assert.strictEqual(res,
        '<xml xmlns="http://www.w3.org/1999/xhtml"></xml>', 'result');
    });

    it('should get result', () => {
      const res = func('<xml></xml>', 'application/xml');
      assert.strictEqual(res,
        '<xml xmlns="http://www.w3.org/1999/xhtml"></xml>', 'result');
    });

    it('should get result', () => {
      const res = func('<html></html>', 'application/xhtml+xml');
      assert.strictEqual(res,
        '<html xmlns="http://www.w3.org/1999/xhtml"></html>', 'result');
    });

    it('should get result', () => {
      const res = func('<html xmlns="http://www.w3.org/1999/xhtml"></html>',
        'application/xhtml+xml');
      assert.strictEqual(res,
        '<html xmlns="http://www.w3.org/1999/xhtml"></html>', 'result');
    });

    it('should get result', () => {
      const res = func('<svg></svg>', 'image/svg+xml');
      assert.strictEqual(res,
        '<svg xmlns="http://www.w3.org/1999/xhtml"></svg>', 'result');
    });

    it('should get result', () => {
      const res = func('<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        'image/svg+xml');
      assert.strictEqual(res,
        '<svg xmlns="http://www.w3.org/2000/svg"/>', 'result');
    });

    it('should throw', () => {
      assert.throws(() => func('<', 'text/xml'), Error,
        'Error while parsing DOM string.');
    });

    it('should throw', () => {
      assert.throws(() => func('</>', 'text/xml'), Error,
        'Error while parsing DOM string.');
    });

    it('should throw', () => {
      assert.throws(() => func('', 'text/xml'), Error,
        'Error while parsing DOM string.');
    });

    it('should throw', () => {
      assert.throws(() => func('<xml></xml><xml></xml>', 'text/xml'), Error,
        'Error while parsing DOM string.');
    });

    it('should throw', () => {
      assert.throws(() => func('foo <em>bar</em>', 'application/xhtml+xml'),
        Error, 'Error while parsing DOM string.');
    });

    it('should get null', () => {
      const res = func('', 'text/html');
      assert.strictEqual(res, null, 'result');
    });

    it('should get null', () => {
      const res = func('', 'text/html', true);
      assert.strictEqual(res, null, 'result');
    });

    it('should get null', () => {
      const stubErr = sinon.stub(console, 'error');
      const res = func('Example <foo@example.dom> wrote:\nfoo', 'text/html');
      const { calledOnce } = stubErr;
      stubErr.restore();
      assert.strictEqual(calledOnce, true, 'error');
      assert.strictEqual(res, null, 'result');
    });

    it('should get null', () => {
      const stubErr = sinon.stub(console, 'error');
      const res =
        func('Example <foo@example.dom> wrote:\nfoo', 'text/html', true);
      const { calledOnce } = stubErr;
      stubErr.restore();
      assert.strictEqual(calledOnce, true, 'error');
      assert.strictEqual(res, null, 'result');
    });

    it('should get result', () => {
      const res = func('foo bar\nbaz', 'text/html');
      assert.strictEqual(res, 'foo bar\nbaz', 'result');
    });

    it('should get null', () => {
      const res = func('foo bar\nbaz', 'text/html', true);
      assert.strictEqual(res, null, 'result');
    });

    it('should get result', () => {
      const res = func('<<foo>>', 'text/html');
      assert.strictEqual(res,
        '&lt;<foo xmlns="http://www.w3.org/1999/xhtml">&gt;</foo>', 'result');
    });

    it('should get result', () => {
      const res = func('<<foo>>', 'text/html', true);
      assert.strictEqual(res,
        '&lt;<foo xmlns="http://www.w3.org/1999/xhtml">&gt;</foo>', 'result');
    });

    it('should get result', () => {
      const res = func('<<script>>', 'text/html');
      assert.strictEqual(res, '&lt;', 'result');
    });

    it('should get result', () => {
      const res =
        func('<div>foo <bar foobar="foobar">baz</bar>\nqux</div>', 'text/html');
      assert.strictEqual(res,
        '<div xmlns="http://www.w3.org/1999/xhtml">foo <bar>baz</bar>\nqux</div>',
        'result');
    });

    it('should get result', () => {
      const res = func('foo <em>bar</em>\nbaz', 'text/html');
      assert.strictEqual(res,
        'foo <em xmlns="http://www.w3.org/1999/xhtml">bar</em>\nbaz',
        'result');
    });

    it('should get result', () => {
      const res = func('foo <em onclick="alert(1)">bar</em>\nbaz', 'text/html');
      assert.strictEqual(res,
        'foo <em xmlns="http://www.w3.org/1999/xhtml">bar</em>\nbaz', 'result');
    });

    it('should get result', () => {
      const res = func('foo <script>alert(1)</script>\nbar', 'text/html');
      assert.strictEqual(res, 'foo \nbar', 'result');
    });

    it('should get result', () => {
      const res =
        func('foo <div><script>alert(1)</script></div>\nbar', 'text/html');
      assert.strictEqual(res,
        'foo <div xmlns="http://www.w3.org/1999/xhtml">\n\n</div>\nbar',
        'result');
    });

    it('should get result', () => {
      const res =
        func('<div>foo</div>\n<div>bar</div>\n', 'text/html');
      assert.strictEqual(res,
        '<div xmlns="http://www.w3.org/1999/xhtml">foo</div>\n<div xmlns="http://www.w3.org/1999/xhtml">bar</div>\n',
        'result');
    });

    it('should get result', () => {
      const res = func('<foo/>', 'text/xml');
      assert.strictEqual(res,
        '<foo xmlns="http://www.w3.org/1999/xhtml"></foo>', 'result');
    });

    it('should get result', () => {
      const res = func('<em>foo</em>\n', 'application/xhtml+xml');
      assert.strictEqual(res,
        '<em xmlns="http://www.w3.org/1999/xhtml">foo</em>', 'result');
    });

    it('should get result', () => {
      const res =
        func('<div><em>foo</em> bar</div>\n', 'application/xhtml+xml');
      assert.strictEqual(res,
        '<div xmlns="http://www.w3.org/1999/xhtml">\n<em>foo</em> bar</div>',
        'result');
    });

    it('should get result', () => {
      const res = func('<div><em onclick="alert(1)">foo</em> bar</div>\n', 'application/xhtml+xml');
      assert.strictEqual(res,
        '<div xmlns="http://www.w3.org/1999/xhtml">\n<em>foo</em> bar</div>',
        'result');
    });

    it('should get result', () => {
      const res = func('<div><script>alert(1)</script> foo</div>\n', 'application/xhtml+xml');
      assert.strictEqual(res,
        '<div xmlns="http://www.w3.org/1999/xhtml">\n foo</div>',
        'result');
    });
  });
});
