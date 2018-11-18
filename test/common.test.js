/**
 * common.test.js
 */
/* eslint-disable no-magic-numbers */

import {JSDOM} from "jsdom";
import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import sinon from "sinon";
import * as mjs from "../src/mjs/common.js";

describe("common", () => {
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
    global.window = window;
    global.document = document;
  });
  afterEach(() => {
    window = null;
    document = null;
    delete global.window;
    delete global.document;
  });

  describe("throw error", () => {
    const func = mjs.throwErr;

    it("should throw", () => {
      const e = new Error("error");
      assert.throws(() => func(e), "error");
    });
  });

  describe("log error", () => {
    const func = mjs.logErr;

    it("should log error message", () => {
      let msg;
      const stub = sinon.stub(console, "error").callsFake(m => {
        msg = m && m.message || m;
      });
      const e = new Error("error");
      const res = func(e);
      const {calledOnce} = stub;
      stub.restore();
      assert.strictEqual(msg, "error");
      assert.isTrue(calledOnce);
      assert.isFalse(res);
    });

    it("should log error message", () => {
      let msg;
      const stub = sinon.stub(console, "error").callsFake(m => {
        msg = m && m.message || m;
      });
      const e = "error";
      const res = func(e);
      const {calledOnce} = stub;
      stub.restore();
      assert.strictEqual(msg, "error");
      assert.isTrue(calledOnce);
      assert.isFalse(res);
    });
  });

  describe("log warn", () => {
    const func = mjs.logWarn;

    it("should not log warn message if argument is falsy", () => {
      let msg;
      const stub = sinon.stub(console, "warn").callsFake(m => {
        msg = m;
      });
      const res = func();
      const {calledOnce} = stub;
      stub.restore();
      assert.isUndefined(msg);
      assert.isFalse(calledOnce);
      assert.isFalse(res);
    });

    it("should log warn message", () => {
      let msg;
      const stub = sinon.stub(console, "warn").callsFake(m => {
        msg = m;
      });
      const res = func("foo");
      const {calledOnce} = stub;
      stub.restore();
      assert.strictEqual(msg, "foo");
      assert.isTrue(calledOnce);
      assert.isFalse(res);
    });
  });

  describe("log message", () => {
    const func = mjs.logMsg;

    it("should not log message if argument is falsy", () => {
      let msg;
      const stub = sinon.stub(console, "log").callsFake(m => {
        msg = m;
      });
      const res = func();
      const {calledOnce} = stub;
      stub.restore();
      assert.isUndefined(msg);
      assert.isFalse(calledOnce);
      assert.isUndefined(res);
    });

    it("should log message", () => {
      let msg;
      const stub = sinon.stub(console, "log").callsFake(m => {
        msg = m;
      });
      const res = func("foo");
      const {calledOnce} = stub;
      stub.restore();
      assert.strictEqual(msg, "foo");
      assert.isTrue(calledOnce);
      assert.strictEqual(res, msg);
    });
  });

  describe("get type", () => {
    const func = mjs.getType;

    it("should get Array", () => {
      const res = func([]);
      assert.deepEqual(res, "Array");
    });

    it("should get Object", () => {
      const res = func({});
      assert.deepEqual(res, "Object");
    });

    it("should get String", () => {
      const res = func("");
      assert.deepEqual(res, "String");
    });

    it("should get Number", () => {
      const res = func(1);
      assert.deepEqual(res, "Number");
    });

    it("should get Boolean", () => {
      const res = func(true);
      assert.deepEqual(res, "Boolean");
    });

    it("should get Undefined", () => {
      const res = func();
      assert.deepEqual(res, "Undefined");
    });

    it("should get Null", () => {
      const res = func(null);
      assert.deepEqual(res, "Null");
    });
  });

  describe("is string", () => {
    const func = mjs.isString;

    it("should get false", () => {
      const items = [[], ["foo"], {}, {foo: "bar"}, undefined, null, 1, true];
      for (const item of items) {
        assert.isFalse(func(item));
      }
    });

    it("should get true", () => {
      const items = ["", "foo"];
      for (const item of items) {
        assert.isTrue(func(item));
      }
    });
  });

  describe("is object, and not an empty object", () => {
    const func = mjs.isObjectNotEmpty;

    it("should get false", () => {
      const items = [{}, [], ["foo"], "", "foo", undefined, null, 1, true];
      for (const item of items) {
        assert.isFalse(func(item));
      }
    });

    it("should get true", () => {
      const item = {
        foo: "bar",
      };
      assert.isTrue(func(item));
    });
  });

  describe("stringify positive integer", () => {
    const func = mjs.stringifyPositiveInt;

    it("should get null if no argument given", () => {
      assert.isNull(func());
    });

    it("should get null if given argument exceeds max safe integer", () => {
      const i = Number.MAX_SAFE_INTEGER + 1;
      assert.isNull(func(i));
    });

    it("should get null if given argument is not positive integer", () => {
      assert.isNull(func(""));
    });

    it("should get null if given argument is not positive integer", () => {
      assert.isNull(func(-1));
    });

    it("should get null if 1st argument is 0 but 2nd argument is falsy", () => {
      assert.isNull(func(0));
    });

    it("should get string", () => {
      const i = 0;
      const res = func(i, true);
      assert.strictEqual(res, "0");
    });

    it("should get string", () => {
      const i = 1;
      const res = func(i);
      assert.strictEqual(res, "1");
    });
  });

  describe("parse stringified integer", () => {
    const func = mjs.parseStringifiedInt;

    it("should throw", () => {
      assert.throws(() => func(), "Expexted String but got Undefined");
    });

    it("should throw", () => {
      assert.throws(() => func("foo"), "foo is not a stringified integer.");
    });

    it("should throw", () => {
      assert.throws(() => func("01"), "01 is not a stringified integer.");
    });

    it("should get integer", () => {
      const i = "1";
      const res = func(i);
      assert.strictEqual(res, 1);
    });

    it("should get integer", () => {
      const i = "-1";
      const res = func(i);
      assert.strictEqual(res, -1);
    });

    it("should get integer", () => {
      const i = "01";
      const res = func(i, true);
      assert.strictEqual(res, 1);
    });

    it("should get integer", () => {
      const i = "-01";
      const res = func(i, true);
      assert.strictEqual(res, -1);
    });

    it("should get integer", () => {
      const i = "01a";
      const res = func(i, true);
      assert.strictEqual(res, 1);
    });
  });

  describe("escape all matching chars", () => {
    const func = mjs.escapeMatchingChars;

    it("should throw", () => {
      assert.throws(() => func(), "Expexted String but got Undefined");
    });

    it("should throw", () => {
      assert.throws(() => func("foo", "bar"),
                    "Expexted RegExp but got String");
    });

    it("should get null", () => {
      const str = "[foo][bar][baz]";
      const re = /([[\]])/;
      const res = func(str, re);
      assert.isNull(res);
    });

    it("should get string", () => {
      const str = "[foo][bar][baz]";
      const re = /([[\]])/g;
      const res = func(str, re);
      assert.strictEqual(res, "\\[foo\\]\\[bar\\]\\[baz\\]");
    });
  });

  describe("is valid Toolkit version string", () => {
    const func = mjs.isValidToolkitVersion;

    it("should throw", () => {
      assert.throws(() => func(), "Expected String but got Undefined");
    });

    it("should get true", () => {
      const versions = [
        "0", "1", "10", "0.1", "1.0", "1.0.0", "1.0.0.0", "1.0.0a", "1.0.0a1",
        "1.0.0.0beta2", "3.1.2.65535", "4.1pre1", "4.1.1.2pre3",
        "0.1.12dev-cb31c51",
      ];
      for (const version of versions) {
        const res = func(version);
        assert.isTrue(res, version);
      }
    });

    it("should get false", () => {
      const versions = [
        "01", "1.0.01", ".", ".1", "1.", "65536", "1.0.0.65536",
        "1.0.0.0.0", "1.0.0-a", "1.0.0-0", "1.0.0+20130313144700",
        "123e5", "1.123e5", "1.a", "a.b.c.d", "2.99999",
      ];
      for (const version of versions) {
        const res = func(version);
        assert.isFalse(res, version);
      }
    });
  });

  describe("parse version string", () => {
    const func = mjs.parseVersion;

    it("should throw", () => {
      assert.throws(() => func(), "Expected String but got Undefined");
    });

    it("should throw", () => {
      assert.throws(() => func(".1"), ".1 does not match toolkit format.");
    });

    it("should get object", () => {
      const version = "1.2.3";
      const res = func(version);
      assert.deepEqual(res, {
        version,
        major: 1,
        minor: 2,
        patch: 3,
        build: undefined,
        pre: undefined,
      });
    });

    it("should get object", () => {
      const version = "1.2.3.4a1";
      const res = func(version);
      assert.deepEqual(res, {
        version,
        major: 1,
        minor: 2,
        patch: 3,
        build: 4,
        pre: ["a1"],
      });
    });
  });

  describe("remove query string from URI", () => {
    const func = mjs.removeQueryFromURI;

    it("should get same value", () => {
      const res = func();
      assert.isUndefined(res);
    });

    it("should get same value", () => {
      const arg = [];
      const res = func(arg);
      assert.deepEqual(res, arg);
    });

    it("should get same value", () => {
      const arg = "";
      const res = func(arg);
      assert.strictEqual(res, arg);
    });

    it("should get same value", () => {
      const arg = "foo/bar";
      const res = func(arg);
      assert.strictEqual(res, arg);
    });

    it("should get same value", () => {
      const arg = "https://example.com";
      const res = func(arg);
      assert.strictEqual(res, arg);
    });

    it("should get query stripped", () => {
      const arg = "https://example.com#foo?bar=baz";
      const res = func(arg);
      assert.strictEqual(res, "https://example.com#foo");
    });

    it("should get query stripped", () => {
      const arg = "https://example.com#foo?bar=baz%20qux";
      const res = func(arg);
      assert.strictEqual(res, "https://example.com#foo");
    });
  });

  describe("sleep", () => {
    const func = mjs.sleep;

    it("should resolve even if no argument given", async () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      await func().then(fake).catch(fake2);
      assert.strictEqual(fake.callCount, 1);
      assert.strictEqual(fake2.callCount, 0);
    });

    it("should get null if 1st argument is not integer", async () => {
      const res = await func("foo");
      assert.isNull(res);
    });

    it("should get null if 1st argument is not positive integer", async () => {
      const res = await func(-1);
      assert.isNull(res);
    });

    it("should resolve", async () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      await func(1).then(fake).catch(fake2);
      assert.strictEqual(fake.callCount, 1);
      assert.strictEqual(fake2.callCount, 0);
    });

    it("should reject", async () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      await func(1, true).then(fake).catch(fake2);
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 1);
    });
  });

  describe("dispatch keyboard event", () => {
    const func = mjs.dispatchKeyboardEvt;
    const globalKeys = ["KeyboardEvent", "Node"];
    beforeEach(() => {
      for (const key of globalKeys) {
        global[key] = window[key];
      }
    });
    afterEach(() => {
      for (const key of globalKeys) {
        delete global[key];
      }
    });

    it("should not dispach event if no argument given", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func();
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should not dispach event if given argument is not an element", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const text = document.createTextNode("foo");
      const body = document.querySelector("body");
      body.appendChild(text);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(text);
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should not dispach event if type is one of key(down|press|up)", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(p, "foo");
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should not dispach event if key option is not an object", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(p, "keydown");
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should not dispach event if key option does not have key, code", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      const opt = {
        foo: "bar",
      };
      body.appendChild(p);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(p, "keydown", opt);
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should dispach event", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      const opt = {
        key: "a",
        code: "KeyA",
      };
      body.appendChild(p);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(p, "keydown", opt);
      assert.strictEqual(fake.callCount, 1);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should dispach event", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      const opt = {
        key: "a",
        code: "KeyA",
      };
      body.appendChild(p);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(p, "keypress", opt);
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 1);
      assert.strictEqual(fake3.callCount, 0);
    });

    it("should dispach event", () => {
      const fake = sinon.fake();
      const fake2 = sinon.fake();
      const fake3 = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      const opt = {
        key: "a",
        code: "KeyA",
      };
      body.appendChild(p);
      window.addEventListener("keydown", fake, true);
      window.addEventListener("keypress", fake2, true);
      window.addEventListener("keyup", fake3, true);
      func(p, "keyup", opt);
      assert.strictEqual(fake.callCount, 0);
      assert.strictEqual(fake2.callCount, 0);
      assert.strictEqual(fake3.callCount, 1);
    });
  });

  describe("dispatch change event", () => {
    const func = mjs.dispatchChangeEvt;
    const globalKeys = ["Event", "Node"];
    beforeEach(() => {
      for (const key of globalKeys) {
        global[key] = window[key];
      }
    });
    afterEach(() => {
      for (const key of globalKeys) {
        delete global[key];
      }
    });

    it("should not dispach event if no argument given", () => {
      const fake = sinon.fake();
      window.addEventListener("change", fake, true);
      func();
      assert.strictEqual(fake.callCount, 0);
    });

    it("should not dispach event if given argument is not an element", () => {
      const fake = sinon.fake();
      const text = document.createTextNode("foo");
      const body = document.querySelector("body");
      body.appendChild(text);
      window.addEventListener("change", fake, true);
      func(text);
      assert.strictEqual(fake.callCount, 0);
    });

    it("should dispach event", () => {
      const fake = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      window.addEventListener("change", fake, true);
      func(p);
      assert.strictEqual(fake.callCount, 1);
    });
  });

  describe("dispatch input event", () => {
    const func = mjs.dispatchInputEvt;
    const globalKeys = ["InputEvent", "Node"];
    beforeEach(() => {
      for (const key of globalKeys) {
        global[key] = window[key];
      }
    });
    afterEach(() => {
      for (const key of globalKeys) {
        delete global[key];
      }
    });

    it("should not dispach event if no argument given", () => {
      const fake = sinon.fake();
      window.addEventListener("input", fake, true);
      func();
      assert.strictEqual(fake.callCount, 0);
    });

    it("should not dispach event if given argument is not an element", () => {
      const fake = sinon.fake();
      const text = document.createTextNode("foo");
      const body = document.querySelector("body");
      body.appendChild(text);
      window.addEventListener("input", fake, true);
      func(text);
      assert.strictEqual(fake.callCount, 0);
    });

    it("should dispach event", () => {
      const fake = sinon.fake();
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      window.addEventListener("input", fake, true);
      func(p);
      assert.strictEqual(fake.callCount, 1);
    });
  });

  describe("focus element", () => {
    const func = mjs.focusElement;

    it("should throw if no argument given", () => {
      assert.throws(() => func());
    });

    it("should get null if given argument is not an object", () => {
      assert.isNull(func(""));
    });

    it("should get null if given argument is empty object", () => {
      assert.isNull(func({}));
    });

    it("should get target", () => {
      const fake = sinon.fake();
      const target = {
        focus: fake,
      };
      const evt = {target};
      const res = func(evt);
      assert.isObject(res);
      assert.deepEqual(res, target);
      assert.strictEqual(fake.callCount, 1);
    });
  });
});
