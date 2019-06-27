/**
 * popup-main.test.js
 */
/* eslint-disable  max-nested-callbacks, no-await-in-loop, no-magic-numbers,
                   require-atomic-updates */

import {JSDOM} from "jsdom";
import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import sinon from "sinon";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/popup-main.js";
import {formatData} from "../src/mjs/format.js";
import {
  CONTENT_LINK, CONTENT_LINK_BBCODE, CONTENT_PAGE, CONTENT_PAGE_BBCODE,
  CONTEXT_INFO, COPY_ALL_TABS, COPY_LINK, COPY_PAGE,
  INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  TEXT_SEP_LINES,
} from "../src/mjs/constant.js";
const OPTIONS_OPEN = "openOptions";

describe("popup-main", () => {
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
  let window, document, navigator;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    if (document.execCommand) {
      sinon.stub(document, "execCommand");
    } else {
      document.execCommand = sinon.fake();
    }
    navigator = window && window.navigator;
    if (navigator.clipboard) {
      sinon.stub(navigator.clipboard, "writeText");
    } else {
      navigator.clipboard = {
        writeText: sinon.fake(),
      };
    }
    global.browser = browser;
    global.window = window;
    global.document = document;
    global.navigator = navigator;
  });
  afterEach(() => {
    window = null;
    document = null;
    navigator = null;
    delete global.browser;
    delete global.window;
    delete global.document;
    delete global.navigator;
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("send notify", () => {
    const func = mjs.sendNotify;

    it("should not call function", async () => {
      const i = browser.runtime.sendMessage.callCount;
      await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
                         "not called");
    });

    it("should call function", async () => {
      const i = browser.runtime.sendMessage.callCount;
      await func(true);
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
    });

    it("should call function", async () => {
      const i = browser.runtime.sendMessage.callCount;
      await func("foo");
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
    });
  });

  describe("set format data", () => {
    const func = mjs.setFormatData;
    beforeEach(() => {
      const {formats} = mjs;
      formats.clear();
    });
    afterEach(() => {
      const {formats} = mjs;
      formats.clear();
    });

    it("should set map", async () => {
      const {formats} = mjs;
      const items = Object.entries(formatData);
      await func();
      assert.strictEqual(formats.size, items.length, "size");
      for (const [key, value] of items) {
        const item = formats.get(key);
        assert.isTrue(formats.has(key), "key");
        assert.deepEqual(item, value, "value");
      }
    });
  });

  describe("get format id", () => {
    const func = mjs.getFormatId;

    it("should throw", async () => {
      assert.throws(() => func(), "Expected String but got Undefined.");
    });

    it("should get result", async () => {
      const res = func("foo");
      assert.strictEqual(res, "foo", "result");
    });

    it("should get result", async () => {
      const res = func(`${COPY_ALL_TABS}foo`);
      assert.strictEqual(res, "foo", "result");
    });

    it("should get result", async () => {
      const res = func(`${COPY_LINK}foo`);
      assert.strictEqual(res, "foo", "result");
    });

    it("should get result", async () => {
      const res = func(`${COPY_PAGE}foo`);
      assert.strictEqual(res, "foo", "result");
    });
  });

  describe("get format item from menu item ID", () => {
    const func = mjs.getFormatItemFromId;
    beforeEach(() => {
      const {formats} = mjs;
      formats.clear();
    });
    afterEach(() => {
      const {formats} = mjs;
      formats.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should get null", async () => {
      await mjs.setFormatData();
      const res = await func("foo");
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_ALL_TABS}foo`);
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_LINK}foo`);
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}foo`);
      assert.isNull(res, "result");
    });

    it("should get value", async () => {
      const value = formatData.TextURL;
      await mjs.setFormatData();
      const res = await func(`${COPY_ALL_TABS}TextURL`);
      assert.deepEqual(res, value, "result");
    });

    it("should get value", async () => {
      const value = formatData.TextURL;
      await mjs.setFormatData();
      const res = await func(`${COPY_LINK}TextURL`);
      assert.deepEqual(res, value, "result");
    });

    it("should get value", async () => {
      const value = formatData.TextURL;
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.deepEqual(res, value, "result");
    });
  });

  describe("get format template", () => {
    const func = mjs.getFormatTemplate;
    beforeEach(() => {
      const {formats, vars} = mjs;
      formats.clear();
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.separateTextURL = false;
    });
    afterEach(() => {
      const {formats, vars} = mjs;
      formats.clear();
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.separateTextURL = false;
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should get null", async () => {
      await mjs.setFormatData();
      const res = await func("foo");
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}foo`);
      assert.isNull(res, "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, "%content% %url%", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}URLOnly`);
      assert.strictEqual(res, "%url%", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}TextOnly`);
      assert.strictEqual(res, "%content%", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, "[%content%](%url%)", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      mjs.vars.includeTitleMarkdown = true;
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, "[%content%](%url% \"%title%\")", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(res, "<a href=\"%url%\">%content%</a>", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      mjs.vars.includeTitleHTMLHyper = true;
      const res = await func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(
        res, "<a href=\"%url%\" title=\"%title%\">%content%</a>", "result"
      );
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(res, "<a href=\"%url%\">%content%</a>", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      mjs.vars.includeTitleHTMLPlain = true;
      const res = await func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(
        res, "<a href=\"%url%\" title=\"%title%\">%content%</a>", "result"
      );
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, "%content% %url%", "result");
    });

    it("should get value", async () => {
      await mjs.setFormatData();
      mjs.vars.separateTextURL = true;
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, "%content%\n%url%", "result");
    });
  });

  describe("get format title", () => {
    const func = mjs.getFormatTitle;
    beforeEach(() => {
      const {formats} = mjs;
      const items = Object.entries(formatData);
      for (const [key, value] of items) {
        formats.set(key, value);
      }
    });
    afterEach(() => {
      const {formats} = mjs;
      formats.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should get null", async () => {
      const res = await func("foo");
      assert.isNull(res, "result");
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}BBCodeText`);
      assert.strictEqual(res, "BBCode (Text)", "result");
    });

    it("should get value", async () => {
      const res = await func("TextURL");
      assert.strictEqual(res, "Text & URL", "result");
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, "Markdown", "result");
    });
  });

  describe("init tab info", () => {
    const func = mjs.initTabInfo;

    it("should init object", async () => {
      const {tabInfo} = mjs;
      tabInfo.id = "foo";
      tabInfo.title = "bar";
      tabInfo.url = "baz";
      const res = await func();
      assert.isNull(res.id, "id");
      assert.isNull(res.title, "title");
      assert.isNull(res.url, "url");
    });
  });

  describe("set tab info", () => {
    const func = mjs.setTabInfo;
    beforeEach(() => {
      const elm = document.createElement("input");
      const elm2 = document.createElement("input");
      const body = document.querySelector("body");
      elm.id = CONTENT_PAGE;
      elm2.id = CONTENT_PAGE_BBCODE;
      body.appendChild(elm);
      body.appendChild(elm2);
    });

    it("should not set value", async () => {
      const contentPage = document.getElementById(CONTENT_PAGE);
      const contentBBCode = document.getElementById(CONTENT_PAGE_BBCODE);
      await func();
      assert.strictEqual(contentPage.value, "", "page value");
      assert.strictEqual(contentBBCode.value, "", "BBCode value");
    });

    it("should set value", async () => {
      const {tabInfo} = mjs;
      const contentPage = document.getElementById(CONTENT_PAGE);
      const contentBBCode = document.getElementById(CONTENT_PAGE_BBCODE);
      const arg = {
        id: "foo",
        title: "bar",
        url: "baz",
      };
      await func(arg);
      assert.strictEqual(contentPage.value, "bar", "page value");
      assert.strictEqual(contentBBCode.value, "baz", "BBCode value");
      assert.strictEqual(tabInfo.id, "foo", "id");
      assert.strictEqual(tabInfo.title, "bar", "title");
      assert.strictEqual(tabInfo.url, "baz", "url");
    });
  });

  describe("init context info", () => {
    const func = mjs.initContextInfo;

    it("should init object", async () => {
      const {contextInfo} = mjs;
      contextInfo.isLink = true;
      contextInfo.content = "foo";
      contextInfo.title = "bar";
      contextInfo.url = "baz";
      contextInfo.canonicalUrl = "qux";
      const res = await func();
      assert.isFalse(res.isLink, "isLink");
      assert.isNull(res.content, "content");
      assert.isNull(res.title, "title");
      assert.isNull(res.url, "url");
      assert.isNull(res.canonicalUrl, "canonicalUrl");
    });
  });

  describe("get all tabs info", () => {
    const func = mjs.getAllTabsInfo;

    it("should get result", async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({currentWindow: true}).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      await mjs.setFormatData();
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, "called");
      assert.deepEqual(res, [
        {
          id: 1,
          formatId: "TextURL",
          template: "%content% %url%",
          title: "foo",
          url: "https://example.com",
          content: "foo",
        },
        {
          id: 2,
          formatId: "TextURL",
          template: "%content% %url%",
          title: "bar",
          url: "https://www.example.com",
          content: "bar",
        },
      ], "result");
      browser.tabs.query.flush();
    });
  });

  describe("create copy data", () => {
    const func = mjs.createCopyData;
    beforeEach(() => {
      const {contextInfo, tabInfo, vars} = mjs;
      tabInfo.title = "foo";
      tabInfo.url = "https://www.example.com";
      contextInfo.canonicalUrl = "https://example.com";
      contextInfo.title = "bar";
      contextInfo.url = "https://www.example.com/baz";
      vars.notifyOnCopy = false;
      const elm = document.createElement("input");
      const elm2 = document.createElement("input");
      const elm3 = document.createElement("input");
      const elm4 = document.createElement("input");
      const body = document.querySelector("body");
      elm.id = CONTENT_LINK_BBCODE;
      elm2.id = CONTENT_LINK;
      elm3.id = CONTENT_PAGE_BBCODE;
      elm4.id = CONTENT_PAGE;
      body.appendChild(elm);
      body.appendChild(elm2);
      body.appendChild(elm3);
      body.appendChild(elm4);
    });
    afterEach(() => {
      const {contextInfo, tabInfo, vars} = mjs;
      tabInfo.id = null;
      tabInfo.title = null;
      tabInfo.url = null;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.canonicalUrl = null;
      contextInfo.title = null;
      contextInfo.url = null;
      vars.notifyOnCopy = false;
    });

    it("should not call function", async () => {
      const evt = {
        target: {
          id: "foo",
        },
      };
      const i = navigator.clipboard.writeText.callCount;
      const j = document.execCommand.callCount;
      await mjs.setFormatData();
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i,
                         "not called");
      assert.strictEqual(document.execCommand.callCount, j, "not called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_PAGE);
      elm.value = "qux";
      const evt = {
        target: {
          id: `${COPY_PAGE}TextURL`,
        },
      };
      const i = navigator.clipboard.writeText.callCount;
      await mjs.setFormatData();
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_PAGE);
      elm.value = "qux";
      const evt = {
        target: {
          id: `${COPY_PAGE}TextURL`,
        },
      };
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.notifications.create.callCount;
      await mjs.setFormatData();
      mjs.vars.notifyOnCopy = true;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.notifications.create.callCount, j + 1,
                         "called");
      assert.strictEqual(res.length, 2, "result");
      assert.deepEqual(res, [
        null,
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_PAGE);
      elm.value = "";
      const evt = {
        target: {
          id: `${COPY_PAGE}TextURL`,
        },
      };
      await mjs.setFormatData();
      mjs.contextInfo.canonicalUrl = null;
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_PAGE);
      elm.value = "";
      const evt = {
        target: {
          id: `${COPY_PAGE}HTMLHyper`,
        },
      };
      await mjs.setFormatData();
      mjs.contextInfo.canonicalUrl = null;
      const i = document.execCommand.callCount;
      const res = await func(evt);
      assert.strictEqual(document.execCommand.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_PAGE_BBCODE);
      elm.value = "https://www.example.com";
      const evt = {
        target: {
          id: `${COPY_PAGE}BBCodeURL`,
        },
      };
      await mjs.setFormatData();
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_PAGE_BBCODE);
      elm.value = "";
      const evt = {
        target: {
          id: `${COPY_PAGE}BBCodeURL`,
        },
      };
      await mjs.setFormatData();
      mjs.contextInfo.canonicalUrl = null;
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_LINK);
      elm.value = "qux";
      const evt = {
        target: {
          id: `${COPY_LINK}TextURL`,
        },
      };
      await mjs.setFormatData();
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_LINK);
      elm.value = "";
      const evt = {
        target: {
          id: `${COPY_LINK}TextURL`,
        },
      };
      await mjs.setFormatData();
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_LINK_BBCODE);
      elm.value = "https://www.example.com/baz";
      const evt = {
        target: {
          id: `${COPY_LINK}BBCodeURL`,
        },
      };
      await mjs.setFormatData();
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const elm = document.getElementById(CONTENT_LINK_BBCODE);
      elm.value = "";
      const evt = {
        target: {
          id: `${COPY_LINK}BBCodeURL`,
        },
      };
      await mjs.setFormatData();
      const i = navigator.clipboard.writeText.callCount;
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const evt = {
        target: {
          id: `${COPY_ALL_TABS}TextURL`,
        },
      };
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({currentWindow: true}).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      await mjs.setFormatData();
      const res = await func(evt);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 1, "called");
      assert.strictEqual(res.length, 1, "result");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.query.flush();
    });
  });

  describe("handle open options on click", () => {
    const func = mjs.openOptionsOnClick;

    it("should call function", async () => {
      const i = browser.runtime.openOptionsPage.callCount;
      await func();
      assert.strictEqual(browser.runtime.openOptionsPage.callCount, i + 1,
                         "called");
    });
  });

  describe("handle menu on click", () => {
    const func = mjs.menuOnClick;
    beforeEach(() => {
      const {formats} = mjs;
      formats.clear();
    });
    afterEach(() => {
      const {formats} = mjs;
      formats.clear();
    });

    it("should call function", async () => {
      const stubClose = sinon.stub(window, "close");
      const evt = {
        target: {
          id: "HTMLPlain",
        },
      };
      await mjs.setFormatData();
      const res = await func(evt);
      const {calledOnce} = stubClose;
      stubClose.restore();
      assert.isTrue(calledOnce, "called");
      assert.isUndefined(res, "result");
    });
  });

  describe("add listener to menu", () => {
    const func = mjs.addListenerToMenu;

    it("should set listener", async () => {
      const elm = document.createElement("button");
      const body = document.querySelector("body");
      const spy = sinon.spy(elm, "addEventListener");
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, "result");
      elm.addEventListener.restore();
    });

    it("should set listener", async () => {
      const elm = document.createElement("button");
      const body = document.querySelector("body");
      const spy = sinon.spy(elm, "addEventListener");
      elm.id = OPTIONS_OPEN;
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, "result");
      elm.addEventListener.restore();
    });
  });

  describe("update menu", () => {
    const func = mjs.updateMenu;
    beforeEach(() => {
      const div = document.createElement("div");
      const elm = document.createElement("button");
      const elm2 = document.createElement("button");
      const elm3 = document.createElement("input");
      const elm4 = document.createElement("input");
      const body = document.querySelector("body");
      div.id = "copyLinkDetails";
      div.appendChild(elm);
      div.appendChild(elm2);
      elm3.id = CONTENT_LINK;
      elm4.id = CONTENT_LINK_BBCODE;
      body.appendChild(div);
      body.appendChild(elm3);
      body.appendChild(elm4);
    });

    it("should not set attr", async () => {
      const items = document.querySelectorAll("button");
      await func();
      for (const item of items) {
        assert.isFalse(item.hasAttribute("disabled"), "attr");
      }
    });

    it("should set attr and value", async () => {
      const items = document.querySelectorAll("button");
      const contentLink = document.getElementById(CONTENT_LINK);
      const contentBBCode = document.getElementById(CONTENT_LINK_BBCODE);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: "foo",
          isLink: false,
          title: "bar",
          url: "https://example.com",
        },
      };
      await func(data);
      for (const item of items) {
        assert.strictEqual(item.getAttribute("disabled"), "disabled", "attr");
      }
      assert.strictEqual(contentLink.value, "foo", "value link");
      assert.strictEqual(contentBBCode.value, "https://example.com",
                         "value link");
    });

    it("should set attr and value", async () => {
      const items = document.querySelectorAll("button");
      const contentLink = document.getElementById(CONTENT_LINK);
      const contentBBCode = document.getElementById(CONTENT_LINK_BBCODE);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: "bar",
          url: null,
        },
      };
      await func(data);
      for (const item of items) {
        assert.strictEqual(item.getAttribute("disabled"), "disabled", "attr");
      }
      assert.strictEqual(contentLink.value, "", "value link");
      assert.strictEqual(contentBBCode.value, "", "value link");
    });

    it("should set attr and value", async () => {
      const items = document.querySelectorAll("button");
      const contentLink = document.getElementById(CONTENT_LINK);
      const contentBBCode = document.getElementById(CONTENT_LINK_BBCODE);
      const data = {
        contextInfo: {
          canonicalUrl: null,
          content: "foo",
          isLink: true,
          title: "bar",
          url: "https://example.com",
        },
      };
      for (const item of items) {
        item.setAttribute("disabled", "disabled");
      }
      await func(data);
      for (const item of items) {
        assert.isFalse(item.hasAttribute("disabled"), "attr");
      }
      assert.strictEqual(contentLink.value, "foo", "value link");
      assert.strictEqual(contentBBCode.value, "https://example.com",
                         "value link");
    });
  });

  describe("request context info", () => {
    const func = mjs.requestContextInfo;
    beforeEach(() => {
      const div = document.createElement("div");
      const elm = document.createElement("button");
      const elm2 = document.createElement("button");
      const elm3 = document.createElement("input");
      const elm4 = document.createElement("input");
      const body = document.querySelector("body");
      div.id = "copyLinkDetails";
      div.appendChild(elm);
      div.appendChild(elm2);
      elm3.id = CONTENT_LINK;
      elm4.id = CONTENT_LINK_BBCODE;
      body.appendChild(div);
      body.appendChild(elm3);
      body.appendChild(elm4);
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func({
        id: browser.tabs.TAB_ID_NONE,
      });
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
    });

    it("should call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func({
        id: 1,
      });
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
    });

    it("should call function", async () => {
      const spy = sinon.spy(document, "querySelectorAll");
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.sendMessage.rejects(new Error("error"));
      await func({
        id: 1,
      });
      const {calledOnce} = spy;
      spy.restore();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1,
                         "called sendMessage");
      assert.isTrue(calledOnce, "called console");
      browser.tabs.sendMessage.flush();
    });
  });

  describe("handle message", () => {
    const func = mjs.handleMsg;

    it("should get empty array if no arguments given", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({foo: "bar"});
      assert.deepEqual(res, [], "result");
    });

    it("should get array", async () => {
      const res = await func({[CONTEXT_INFO]: {}});
      assert.deepEqual(res, [undefined], "result");
    });
  });

  describe("set variable", () => {
    const func = mjs.setVar;
    beforeEach(() => {
      const {vars} = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.separateTextURL = false;
    });
    afterEach(() => {
      const {vars} = mjs;
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.separateTextURL = false;
    });

    it("should not set variable", async () => {
      const {vars} = mjs;
      await func();
      assert.isFalse(vars.includeTitleHTMLHyper, "html");
      assert.isFalse(vars.includeTitleHTMLPlain, "html");
      assert.isFalse(vars.includeTitleMarkdown, "markdown");
    });

    it("should not set variable", async () => {
      const {vars} = mjs;
      await func("foo", {});
      assert.isFalse(vars.includeTitleHTMLHyper, "html");
      assert.isFalse(vars.includeTitleHTMLPlain, "html");
      assert.isFalse(vars.includeTitleMarkdown, "markdown");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleHTMLHyper, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: false,
      });
      assert.isFalse(vars.includeTitleHTMLHyper, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(INCLUDE_TITLE_HTML_PLAIN, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleHTMLPlain, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(INCLUDE_TITLE_HTML_PLAIN, {
        checked: false,
      });
      assert.isFalse(vars.includeTitleHTMLPlain, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(INCLUDE_TITLE_MARKDOWN, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleMarkdown, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(INCLUDE_TITLE_MARKDOWN, {
        checked: false,
      });
      assert.isFalse(vars.includeTitleMarkdown, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(TEXT_SEP_LINES, {
        checked: true,
      });
      assert.isTrue(vars.separateTextURL, "variable");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      await func(TEXT_SEP_LINES, {
        checked: false,
      });
      assert.isFalse(vars.separateTextURL, "variable");
    });
  });

  describe("set variables", () => {
    const func = mjs.setVars;

    it("should not set variables", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should set variables", async () => {
      const res = await func({
        foo: {
          checked: true,
        },
      });
      assert.deepEqual(res, [undefined], "result");
    });
  });
});
