/**
 * compat.test.js
 */

import {JSDOM} from "jsdom";
import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/compat.js";
import {WEBEXT_ID} from "../src/mjs/constant.js";

describe("compat", () => {
  /**
   * create jsdom
   * @returns {Object} - jsdom instance
   */
  const createJsdom = () => {
    const domstr = "<!DOCTYPE html><html><head></head><body></body></html>";
    const opt = {
      runScripts: "dangerously",
    };
    return new JSDOM(domstr, opt);
  };
  let window, document;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
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
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("disable input", () => {
    const func = mjs.disableInput;

    it("should not set attr if no argument given", async () => {
      const elm = document.createElement("input");
      const body = document.querySelector("body");
      elm.disabled = false;
      elm.id = "foo";
      body.appendChild(elm);
      await func();
      assert.isFalse(elm.disabled, "result");
    });

    it("should not set attr if given argument is not string", async () => {
      const elm = document.createElement("input");
      const body = document.querySelector("body");
      elm.disabled = false;
      elm.id = "foo";
      body.appendChild(elm);
      await func(1);
      assert.isFalse(elm.disabled, "result");
    });

    it("should set attr", async () => {
      const elm = document.createElement("input");
      const body = document.querySelector("body");
      elm.disabled = false;
      elm.id = "foo";
      body.appendChild(elm);
      await func("foo");
      assert.isTrue(elm.disabled, "result");
    });
  });

  describe("disable incompatible inputs", () => {
    const func = mjs.disableIncompatibleInputs;
    beforeEach(() => {
      browser.runtime.id = null;
    });
    afterEach(() => {
      browser.runtime.id = null;
    });

    it("should get empty array", async () => {
      const res = await func();
      assert.isUndefined(res, "result");
    });

    it("should get array", async () => {
      browser.runtime.id = WEBEXT_ID;
      const res = await func();
      assert.isNull(res, "result");
    });
  });
});
