/**
 * compat.test.js
 */
/* eslint-disable import-x/order */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';

/* test */
import { OPTIONS_ICON_TOOLBAR, WEBEXT_ID } from '../src/mjs/constant.js';
import * as mjs from '../src/mjs/compat.js';

describe('compat', () => {
  let window, document;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
    global.window = window;
    global.document = document;
  });
  afterEach(() => {
    window = null;
    document = null;
    delete global.browser;
    delete global.window;
    delete global.document;
    browser._sandbox.reset();
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('show toolbar icon options', () => {
    const func = mjs.showToolbarIconOptions;
    beforeEach(() => {
      browser.runtime.id = null;
    });
    afterEach(() => {
      browser.runtime.id = null;
    });

    it('should not show options', async () => {
      const elm = document.createElement('fieldset');
      const body = document.querySelector('body');
      elm.hidden = true;
      elm.id = 'foo';
      body.appendChild(elm);
      await func();
      assert.isTrue(elm.hidden, 'result');
    });

    it('should not show options', async () => {
      const elm = document.createElement('fieldset');
      const body = document.querySelector('body');
      browser.runtime.id = WEBEXT_ID;
      elm.hidden = true;
      elm.id = OPTIONS_ICON_TOOLBAR;
      body.appendChild(elm);
      await func();
      assert.isTrue(elm.hidden, 'result');
    });

    it('should show options', async () => {
      const elm = document.createElement('fieldset');
      const body = document.querySelector('body');
      elm.hidden = true;
      elm.id = OPTIONS_ICON_TOOLBAR;
      body.appendChild(elm);
      await func();
      assert.isFalse(elm.hidden, 'result');
    });
  });
});
