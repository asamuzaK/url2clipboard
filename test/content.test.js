/**
 * content.test.js
 */
/* eslint-disable no-magic-numbers */

const {JSDOM} = require("jsdom");
const {assert} = require("chai");
const {afterEach, beforeEach, describe, it} = require("mocha");
const {browser} = require("./mocha/setup.js");
const sinon = require("sinon");
const cjs = require("../src/js/content.js");

describe("content", () => {
  /**
   * create jsdom
   * @returns {Object} - jsdom instance
   */
  const createJsdom = () => {
    const domstr = "<!DOCTYPE html><html><head></head><body></body></html>";
    const opt = {
      runScripts: "dangerously",
      url: "https://localhost",
      beforeParse(window) {
        window.prompt = sinon.stub().callsFake((...args) => args.toString());
      },
    };
    return new JSDOM(domstr, opt);
  };
  let window, document;
  const globalKeys = ["Node"];
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

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("throw error", () => {
    const func = cjs.throwErr;

    it("should throw", () => {
      const e = new Error("error");
      assert.throws(() => func(e), "error");
    });
  });

  describe("get type", () => {
    const func = cjs.getType;

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
    const func = cjs.isString;

    it("should get false", () => {
      const items = [[], ["foo"], {}, {foo: "bar"}, undefined, null, 1, true];
      for (const item of items) {
        assert.isFalse(func(item), "result");
      }
    });

    it("should get true", () => {
      const items = ["", "foo"];
      for (const item of items) {
        assert.isTrue(func(item), "result");
      }
    });
  });

  describe("send message", () => {
    const func = cjs.sendMsg;

    it("should not call function", async () => {
      const i = browser.runtime.sendMessage.callCount;
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.callsFake(msg => msg);
      const res = await func("foo");
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.strictEqual(res, "foo", "result");
    });
  });

  describe("get active element", () => {
    const func = cjs.getActiveElm;

    it("should get element", async () => {
      const btn = document.createElement("button");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      p.appendChild(btn);
      body.appendChild(p);
      btn.focus();
      const res = await func();
      assert.deepEqual(res, btn, "result");
    });

    it("should get element", async () => {
      const range = document.createRange();
      const text = document.createTextNode("foo");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      p.appendChild(text);
      body.appendChild(p);
      range.selectNode(text);
      const res = await func();
      assert.deepEqual(res, body, "result");
    });

    it("should get element", async () => {
      const range = document.createRange();
      const range2 = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode("foo");
      const text2 = document.createTextNode("bar");
      const text3 = document.createTextNode("baz");
      const span = document.createElement("span");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      p.appendChild(text);
      p.appendChild(document.createElement("br"));
      span.appendChild(text2);
      p.appendChild(span);
      p.appendChild(document.createElement("br"));
      p.appendChild(text3);
      body.appendChild(p);
      range.setStart(p, 0);
      range.setEndAfter(span);
      range2.selectNode(text3);
      sel.addRange(range);
      sel.addRange(range2);
      const res = await func();
      assert.deepEqual(res, p, "result");
    });

    it("should get element", async () => {
      const range = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode("foo");
      const text2 = document.createTextNode("bar");
      const text3 = document.createTextNode("baz");
      const span = document.createElement("span");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      p.appendChild(text);
      p.appendChild(document.createElement("br"));
      span.appendChild(text2);
      p.appendChild(span);
      p.appendChild(document.createElement("br"));
      p.appendChild(text3);
      body.appendChild(p);
      range.setStart(p, 0);
      range.setEnd(span, 0);
      sel.addRange(range);
      const res = await func();
      assert.deepEqual(res, p, "result");
    });

    it("should get element", async () => {
      const range = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode("foo");
      const text2 = document.createTextNode("bar");
      const text3 = document.createTextNode("baz");
      const span = document.createElement("span");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      p.appendChild(text);
      p.appendChild(document.createElement("br"));
      span.appendChild(text2);
      p.appendChild(span);
      p.appendChild(document.createElement("br"));
      p.appendChild(text3);
      body.appendChild(p);
      range.setStart(p, 0);
      range.setEnd(span, 0);
      range.collapse(true);
      sel.addRange(range);
      const res = await func();
      assert.deepEqual(res, body, "result");
    });

    it("should get element", async () => {
      const range = document.createRange();
      const range2 = document.createRange();
      const sel = window.getSelection();
      const text = document.createTextNode("foo bar baz");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      p.appendChild(text);
      body.appendChild(p);
      range.setStart(text, 0);
      range.setEnd(text, 2);
      range2.setStart(text, 4);
      range2.setEnd(text, text.length - 1);
      sel.addRange(range);
      sel.addRange(range2);
      const res = await func();
      assert.deepEqual(res, p, "result");
    });
  });

  describe("get anchor element", () => {
    const func = cjs.getAnchorElm;

    it("should get null", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get element", async () => {
      const text = document.createTextNode("foo");
      const a = document.createElement("a");
      const span = document.createElement("span");
      const p = document.createElement("p");
      const body = document.querySelector("body");
      span.appendChild(text);
      a.appendChild(span);
      p.appendChild(a);
      body.appendChild(p);
      const res = await func(text);
      assert.deepEqual(res, a, "result");
    });
  });

  describe("init context info", () => {
    const func = cjs.initContextInfo;
    beforeEach(() => {
      const {contextInfo} = cjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.selectionText = "";
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });
    afterEach(() => {
      const {contextInfo} = cjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.selectionText = "";
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });

    it("should get result", async () => {
      const {contextInfo} = cjs;
      contextInfo.isLink = true;
      contextInfo.content = "foo";
      contextInfo.title = "bar";
      contextInfo.selectionText = "baz";
      contextInfo.url = "https://example.com";
      contextInfo.canonicalUrl = "https://example.com";
      const res = await func();
      assert.deepEqual(res, {
        isLink: false,
        content: null,
        selectionText: "",
        title: null,
        url: null,
        canonicalUrl: null,
      }, "result");
    });
  });

  describe("create context info", () => {
    const func = cjs.createContextInfo;
    beforeEach(() => {
      const {contextInfo} = cjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.selectionText = "";
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });
    afterEach(() => {
      const {contextInfo} = cjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.selectionText = "";
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });

    it("should get result", async () => {
      const res = await func();
      assert.deepEqual(res, {
        isLink: false,
        content: null,
        selectionText: "",
        title: null,
        url: null,
        canonicalUrl: null,
      }, "result");
    });

    it("should get result", async () => {
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      const res = await func(p);
      assert.deepEqual(res, {
        isLink: false,
        content: null,
        selectionText: "",
        title: null,
        url: null,
        canonicalUrl: null,
      }, "result");
    });

    it("should get result", async () => {
      const a = document.createElement("a");
      const body = document.querySelector("body");
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: false,
        content: null,
        selectionText: "",
        title: null,
        url: null,
        canonicalUrl: null,
      }, "result");
    });

    it("should get result", async () => {
      const text = document.createTextNode("foo  bar");
      const a = document.createElement("a");
      const body = document.querySelector("body");
      a.appendChild(text);
      a.href = "https://example.com";
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        content: "foo bar",
        selectionText: "",
        title: "foo bar",
        url: "https://example.com/",
        canonicalUrl: null,
      }, "result");
    });

    it("should get result", async () => {
      const text = document.createTextNode("foo  bar");
      const a = document.createElement("a");
      const link = document.createElement("link");
      const head = document.querySelector("head");
      const body = document.querySelector("body");
      link.href = "https://example.com/foo";
      link.rel = "canonical";
      head.appendChild(link);
      a.appendChild(text);
      a.href = "https://www.example.com/bar";
      a.title = "baz qux";
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        content: "foo bar",
        selectionText: "",
        title: "baz qux",
        url: "https://www.example.com/bar",
        canonicalUrl: "https://example.com/foo",
      }, "result");
    });

    it("should get result", async () => {
      const text = document.createTextNode("foo  bar");
      const a = document.createElement("a");
      const link = document.createElement("link");
      const head = document.querySelector("head");
      const body = document.querySelector("body");
      link.href = "/foo";
      link.rel = "canonical";
      head.appendChild(link);
      a.appendChild(text);
      a.href = "https://www.example.com/bar";
      a.title = "baz qux";
      body.appendChild(a);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        content: "foo bar",
        selectionText: "",
        title: "baz qux",
        url: "https://www.example.com/bar",
        canonicalUrl: "https://localhost/foo",
      }, "result");
    });

    it("should get result", async () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const a = document.createElementNS("http://www.w3.org/2000/svg", "a");
      const body = document.querySelector("body");
      a.href = "foo.svg#bar";
      svg.appendChild(a);
      body.appendChild(svg);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        content: "",
        selectionText: "",
        title: "",
        url: "foo.svg#bar",
        canonicalUrl: null,
      }, "result");
    });

    it("should get result", async () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const a = document.createElementNS("http://www.w3.org/2000/svg", "a");
      const body = document.querySelector("body");
      a.href = {
        baseVal: "foo.svg#bar",
      };
      svg.appendChild(a);
      body.appendChild(svg);
      const res = await func(a);
      assert.deepEqual(res, {
        isLink: true,
        content: "",
        selectionText: "",
        title: "",
        url: "foo.svg#bar",
        canonicalUrl: null,
      }, "result");
    });
  });

  describe("send status", () => {
    const func = cjs.sendStatus;

    it("should call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      const evt = {
        target: p,
        type: "foo",
      };
      const res = await func(evt);
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {
        foo: {
          enabled: true,
          contextInfo: cjs.contextInfo,
        },
      }, "result");
    });
  });

  describe("send context info", () => {
    const func = cjs.sendContextInfo;

    it("should call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const p = document.createElement("p");
      const body = document.querySelector("body");
      body.appendChild(p);
      const res = await func("foo");
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {
        contextInfo: {
          data: "foo",
          contextInfo: cjs.contextInfo,
        },
      }, "result");
    });
  });

  describe("edit content", () => {
    const func = cjs.editContent;

    it("should throw", async () => {
      await func(1).catch(e => {
        assert.instanceOf(e, TypeError, "error");
        assert.strictEqual(e.message, "Expected String but got Number.",
                           "message");
      });
    });

    it("should throw", async () => {
      await func("", 1).catch(e => {
        assert.instanceOf(e, TypeError, "error");
        assert.strictEqual(e.message, "Expected String but got Number.",
                           "message");
      });
    });

    it("should get result", async () => {
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const i = browser.i18n.getMessage.callCount;
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i, "not called");
      assert.strictEqual(res, "Edit content text of the link,", "result");
    });

    it("should get result", async () => {
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const i = browser.i18n.getMessage.callCount;
      const res = await func("foo", "bar");
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, "called");
      assert.strictEqual(res, "userInput,bar,foo", "result");
    });
  });

  describe("send edited content", () => {
    const func = cjs.sendEditedContent;

    it("should not call function", async () => {
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i, "not called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should not call function", async () => {
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const data = {
        content: "foo",
        formatId: "bar",
        formatTitle: "baz",
        mimeType: "text/plain",
        promptContent: false,
        template: "qux",
        title: "foobar",
        url: "https://example.com",
      };
      const res = await func(data);
      assert.strictEqual(browser.i18n.getMessage.callCount, i, "not called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const data = {
        content: "foo",
        formatId: "bar",
        formatTitle: "baz",
        mimeType: "text/plain",
        promptContent: true,
        template: "qux",
        title: "foobar",
        url: "https://example.com",
      };
      const res = await func(data);
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j + 1,
                         "called");
      assert.deepEqual(res, {
        editedContent: {
          content: "userInput,baz,foo",
          formatId: "bar",
          formatTitle: "baz",
          mimeType: "text/plain",
          template: "qux",
          title: "foobar",
          url: "https://example.com",
        },
      }, "result");
    });

    it("should call function", async () => {
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const data = {
        content: "foo",
        formatId: "bar",
        mimeType: "text/plain",
        promptContent: true,
        template: "qux",
        title: "foobar",
        url: "https://example.com",
      };
      const res = await func(data);
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j + 1,
                         "called");
      assert.deepEqual(res, {
        editedContent: {
          content: "userInput,bar,foo",
          formatId: "bar",
          formatTitle: undefined,
          mimeType: "text/plain",
          template: "qux",
          title: "foobar",
          url: "https://example.com",
        },
      }, "result");
    });

    it("should call function", async () => {
      const tmpDom = new JSDOM(
        "<!DOCTYPE html><html><head></head><body></body></html>",
        {
          runScripts: "dangerously",
          url: "https://localhost",
          beforeParse(window) {
            window.prompt = sinon.stub().returns(null);
          },
        },
      );
      window = tmpDom && tmpDom.window;
      document = window && window.document;
      global.window = window;
      global.document = document;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const data = {
        content: "foo",
        formatId: "bar",
        formatTitle: "baz",
        mimeType: "text/plain",
        promptContent: true,
        template: "qux",
        title: "foobar",
        url: "https://example.com",
      };
      const res = await func(data);
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j + 1,
                         "called");
      assert.deepEqual(res, {
        editedContent: {
          content: "",
          formatId: "bar",
          formatTitle: "baz",
          mimeType: "text/plain",
          template: "qux",
          title: "foobar",
          url: "https://example.com",
        },
      }, "result");
    });
  });

  describe("handle message", () => {
    const func = cjs.handleMsg;

    it("should get empty array", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({
        foo: "bar",
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get array", async () => {
      const res = await func({
        getContextInfo: {},
      });
      assert.deepEqual(res, [{
        contextInfo: {
          contextInfo: {
            canonicalUrl: null,
            content: null,
            isLink: false,
            selectionText: "",
            title: null,
            url: null,
          },
          data: {},
        },
      }], "result");
    });

    it("should get array", async () => {
      const res = await func({
        getEditedContent: {},
      });
      assert.deepEqual(res, [null], "result");
    });
  });

  describe("handle UI event", () => {
    const func = cjs.handleUIEvt;

    it("should not call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({});
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should not call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        type: "foo",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should not call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        key: "foo",
        type: "keydown",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should not call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        key: "foo",
        shiftKey: true,
        type: "keydown",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const target = document.querySelector("body");
      const res = await func({
        target,
        key: "F10",
        shiftKey: true,
        type: "keydown",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {
        keydown: {
          contextInfo: {
            canonicalUrl: null,
            content: null,
            isLink: false,
            selectionText: "",
            title: null,
            url: null,
          },
          enabled: true,
        },
      }, "result");
    });

    it("should call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const target = document.querySelector("body");
      const res = await func({
        target,
        key: "ContextMenu",
        type: "keydown",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {
        keydown: {
          contextInfo: {
            canonicalUrl: null,
            content: null,
            isLink: false,
            selectionText: "",
            title: null,
            url: null,
          },
          enabled: true,
        },
      }, "result");
    });

    it("should not call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        button: 1,
        type: "mousedown",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      browser.runtime.sendMessage.callsFake(msg => msg);
      const i = browser.runtime.sendMessage.callCount;
      const target = document.querySelector("body");
      const res = await func({
        target,
        button: 2,
        type: "mousedown",
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {
        mousedown: {
          contextInfo: {
            canonicalUrl: null,
            content: null,
            isLink: false,
            selectionText: "",
            title: null,
            url: null,
          },
          enabled: true,
        },
      }, "result");
    });
  });
});
