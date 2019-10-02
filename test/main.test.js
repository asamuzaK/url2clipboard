/**
 * main.test.js
 */
/* eslint-disable array-bracket-newline, no-magic-numbers */

import {JSDOM} from "jsdom";
import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import sinon from "sinon";
import * as mjs from "../src/mjs/main.js";
import {formatData} from "../src/mjs/format.js";
import {
  BBCODE_URL, CMD_COPY, CONTEXT_INFO,
  COPY_LINK, COPY_PAGE, COPY_TAB, COPY_TABS_ALL, COPY_TABS_SELECTED,
  ICON, ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_DARK_ID, ICON_LIGHT,
  ICON_LIGHT_ID, ICON_WHITE,
  INCLUDE_TITLE_HTML_HYPER, INCLUDE_TITLE_HTML_PLAIN, INCLUDE_TITLE_MARKDOWN,
  NOTIFY_COPY, PROMPT, THEME_DARK, THEME_LIGHT,
} from "../src/mjs/constant.js";

describe("main", () => {
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

  describe("toggle enabled formats", () => {
    const func = mjs.toggleEnabledFormats;
    beforeEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should not add", async () => {
      const {enabledFormats} = mjs;
      await func("foo");
      assert.isFalse(enabledFormats.has("foo"), "result");
    });

    it("should not add", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_PAGE}TextURL`, false);
      assert.isFalse(enabledFormats.has("TextURL"), "result");
    });

    it("should add", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_TAB}TextURL`, true);
      assert.isTrue(enabledFormats.has("TextURL"), "result");
    });

    it("should add", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_PAGE}TextURL`, true);
      assert.isTrue(enabledFormats.has("TextURL"), "result");
    });

    it("should add", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_LINK}TextURL`, true);
      assert.isTrue(enabledFormats.has("TextURL"), "result");
    });

    it("should add", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_TABS_ALL}TextURL`, true);
      assert.isTrue(enabledFormats.has("TextURL"), "result");
    });
  });

  describe("set format data", () => {
    const func = mjs.setFormatData;
    beforeEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });

    it("should set map", async () => {
      const {enabledFormats} = mjs;
      const items = Object.keys(formatData);
      const res = await func();
      assert.strictEqual(res.length, items.length, "result");
      assert.strictEqual(enabledFormats.size, items.length, "enabled formats");
    });
  });

  describe("get format template", () => {
    const func = mjs.getFormatTemplate;
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
      assert.strictEqual(res, "[url=%url%]%content%[/url]", "result");
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, "%content% %url%", "result");
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, "[%content%](%url%)", "result");
    });

    it("should get value", async () => {
      const {vars} = mjs;
      vars.includeTitleMarkdown = true;
      const res = await func(`${COPY_PAGE}Markdown`);
      assert.strictEqual(res, "[%content%](%url% \"%title%\")", "result");
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(res, "<a href=\"%url%\">%content%</a>", "result");
    });

    it("should get value", async () => {
      const {vars} = mjs;
      vars.includeTitleHTMLHyper = true;
      const res = await func(`${COPY_PAGE}HTMLHyper`);
      assert.strictEqual(
        res, "<a href=\"%url%\" title=\"%title%\">%content%</a>", "result"
      );
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(res, "<a href=\"%url%\">%content%</a>", "result");
    });

    it("should get value", async () => {
      const {vars} = mjs;
      vars.includeTitleHTMLPlain = true;
      const res = await func(`${COPY_PAGE}HTMLPlain`);
      assert.strictEqual(
        res, "<a href=\"%url%\" title=\"%title%\">%content%</a>", "result"
      );
    });

    it("should get value", async () => {
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, "%content% %url%", "result");
    });

    it("should get value", async () => {
      mjs.vars.separateTextURL = true;
      const res = await func(`${COPY_PAGE}TextURL`);
      assert.strictEqual(res, "%content%\n%url%", "result");
    });
  });

  describe("get format title", () => {
    const func = mjs.getFormatTitle;

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

  describe("remove context menu", () => {
    const func = mjs.removeContextMenu;

    it("should call function", async () => {
      const i = browser.contextMenus.removeAll.callCount;
      const res = await func();
      assert.strictEqual(browser.contextMenus.removeAll.callCount, i + 1,
                         "called");
      assert.isUndefined(res, "result");
    });
  });

  describe("create context menu item", () => {
    const func = mjs.createMenuItem;

    it("should not call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i,
                         "not called");
    });

    it("should not call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func("foo");
      assert.strictEqual(browser.contextMenus.create.callCount, i,
                         "not called");
    });

    it("should not call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func("foo", "bar");
      assert.strictEqual(browser.contextMenus.create.callCount, i,
                         "not called");
    });

    it("should not call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func("foo", "bar", {
        contexts: "baz",
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i,
                         "not called");
    });

    it("should call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func("foo", "bar", {
        contexts: ["baz"],
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i + 1,
                         "called");
    });

    it("should not call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func("foo", "bar", {
        contexts: ["tab"],
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i,
                         "not called");
    });

    it("should not call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      vars.isWebExt = true;
      await func("foo", "bar", {
        contexts: ["tab"],
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i + 1,
                         "called");
    });

    it("should not call function", async () => {
      const i = browser.contextMenus.create.callCount;
      await func("foo", "bar", {
        contexts: ["baz"],
        parentId: "qux",
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i + 1,
                         "called");
    });
  });

  describe("create single menu item", () => {
    const func = mjs.createSingleMenuItem;
    beforeEach(() => {
      const {vars} = mjs;
      vars.isWebExt = true;
    });
    afterEach(() => {
      const {vars} = mjs;
      vars.isWebExt = false;
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError, "error");
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "message");
      });
    });

    it("should throw", async () => {
      await func("foo").catch(e => {
        assert.instanceOf(e, TypeError, "error");
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "message");
      });
    });

    it("should throw", async () => {
      await func("foo", "bar").catch(e => {
        assert.instanceOf(e, TypeError, "error");
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "message");
      });
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func("TextURL", COPY_PAGE, "(&C)", {
        contexts: ["page", "selection"],
        enabled: true,
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 1,
                         "called");
      assert.isUndefined(res, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = true;
      const res = await func("TextURL", COPY_PAGE, "(&C)", {
        contexts: ["page", "selection"],
        enabled: true,
      });
      assert.strictEqual(browser.contextMenus.create.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 1,
                         "called");
      assert.isUndefined(res, "result");
      browser.i18n.getMessage.flush();
    });
  });

  describe("create context menu items", () => {
    const func = mjs.createContextMenu;
    beforeEach(() => {
      const {enabledFormats, vars} = mjs;
      vars.isWebExt = true;
      enabledFormats.add("HTMLPlain");
      enabledFormats.add("Markdown");
      enabledFormats.add("TextURL");
    });
    afterEach(() => {
      const {enabledFormats, vars} = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
    });

    it("should not call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.contextMenus.create.callCount;
      enabledFormats.clear();
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i,
                         "not called");
      assert.deepEqual(res, [], "result");
    });

    it("should call function", async () => {
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 75,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 5,
                         "called");
      assert.strictEqual(res.length, 75, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 30,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 5,
                         "called");
      assert.strictEqual(res.length, 75, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      enabledFormats.delete("HTMLPlain");
      enabledFormats.delete("Markdown");
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 5,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 5,
                         "called");
      assert.strictEqual(res.length, 5, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      enabledFormats.delete("HTMLPlain");
      enabledFormats.delete("Markdown");
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 2,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 5,
                         "called");
      assert.strictEqual(res.length, 5, "result");
      browser.i18n.getMessage.flush();
    });
  });

  describe("update context menu", () => {
    const func = mjs.updateContextMenu;
    beforeEach(() => {
      const {enabledFormats, enabledTabs, vars} = mjs;
      vars.isWebExt = true;
      vars.promptContent = false;
      enabledFormats.add("HTMLPlain");
      enabledFormats.add("Markdown");
      enabledFormats.add("TextURL");
      enabledTabs.set(1, true);
    });
    afterEach(() => {
      const {enabledFormats, enabledTabs, vars} = mjs;
      vars.isWebExt = false;
      vars.promptContent = false;
      enabledFormats.clear();
      enabledTabs.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.",
                           "throw");
      });
    });

    it("should not call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.contextMenus.update.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      enabledFormats.clear();
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i,
                         "not called");
      assert.deepEqual(res, [], "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const i = browser.contextMenus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 5,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 2,
                         "called");
      assert.strictEqual(res.length, 5, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const i = browser.contextMenus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 5,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 2,
                         "called");
      assert.strictEqual(res.length, 5, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      vars.promptContent = true;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 5,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 2,
                         "called");
      assert.strictEqual(res.length, 5, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      vars.promptContent = true;
      const res = await func(2);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 5,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 2,
                         "called");
      assert.strictEqual(res.length, 5, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      vars.isWebExt = false;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 2,
                         "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.strictEqual(browser.tabs.query.callCount, k + 2,
                         "called");
      assert.strictEqual(res.length, 2, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      vars.isWebExt = false;
      vars.promptContent = true;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 2,
                         "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.strictEqual(browser.tabs.query.callCount, k + 2,
                         "called");
      assert.strictEqual(res.length, 2, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      vars.isWebExt = false;
      vars.promptContent = true;
      const res = await func(2);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 2,
                         "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.strictEqual(browser.tabs.query.callCount, k + 2,
                         "called");
      assert.strictEqual(res.length, 2, "result");
      browser.tabs.query.flush();
    });
  });

  describe("handle menus on shown", () => {
    const func = mjs.handleMenusOnShown;
    beforeEach(() => {
      const {enabledFormats, enabledTabs, vars} = mjs;
      vars.isWebExt = true;
      enabledFormats.add("HTMLPlain");
      enabledFormats.add("Markdown");
      enabledFormats.add("TextURL");
      enabledTabs.set(1, true);
    });
    afterEach(() => {
      const {enabledFormats, enabledTabs, vars} = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
      enabledTabs.clear();
    });

    it("should get null", async () => {
      const res = await func({}, {});
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = await func({contexts: []}, {});
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = await func({contexts: ["tab"]}, {});
      assert.isNull(res, "result");
    });

    it("should not call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.contextMenus.refresh.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      enabledFormats.clear();
      const res = await func({contexts: ["tab"]}, {id: 1});
      assert.strictEqual(browser.contextMenus.update.callCount, i,
                         "not called");
      assert.strictEqual(browser.contextMenus.refresh.callCount, j,
                         "not called");
      assert.strictEqual(browser.tabs.query.callCount, k,
                         "not called");
      assert.isNull(res, "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const i = browser.contextMenus.update.callCount;
      const j = browser.contextMenus.refresh.callCount;
      const k = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}, {}]);
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([{}, {}]);
      const res = await func({contexts: ["tab"]}, {id: 1});
      assert.strictEqual(browser.contextMenus.update.callCount, i + 5,
                         "called");
      assert.strictEqual(browser.contextMenus.refresh.callCount, j + 1,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, k + 2,
                         "called");
      assert.isNull(res, "result");
      browser.tabs.query.flush();
    });
  });

  describe("set enabled tab", () => {
    const func = mjs.setEnabledTab;
    beforeEach(() => {
      const {enabledTabs} = mjs;
      enabledTabs.clear();
    });
    afterEach(() => {
      const {enabledTabs} = mjs;
      enabledTabs.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.",
                           "throw");
      });
    });

    it("should set map", async () => {
      const {enabledTabs} = mjs;
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func(1);
      assert.strictEqual(browser.tabs.get.callCount, i + 1, "called");
      assert.isTrue(enabledTabs.has(1), "has");
      assert.isFalse(enabledTabs.get(1), "value");
      assert.deepEqual(res, {
        tabId: 1,
        enabled: undefined,
      }, "result");
      browser.tabs.get.flush();
    });

    it("should set map", async () => {
      const {enabledTabs} = mjs;
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func(1, {
        id: 1,
      }, {
        enabled: true,
      });
      assert.strictEqual(browser.tabs.get.callCount, i, "not called");
      assert.isTrue(enabledTabs.has(1), "has");
      assert.isTrue(enabledTabs.get(1), "value");
      assert.deepEqual(res, {
        tabId: 1,
        enabled: true,
      }, "result");
      browser.tabs.get.flush();
    });

    it("should set map", async () => {
      const {enabledTabs} = mjs;
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).rejects();
      const res = await func(1);
      assert.strictEqual(browser.tabs.get.callCount, i + 1, "called");
      assert.isFalse(enabledTabs.has(1), "has");
      assert.isUndefined(enabledTabs.get(1), "value");
      assert.deepEqual(res, {
        tabId: 1,
        enabled: undefined,
      }, "result");
      browser.tabs.get.flush();
    });
  });

  describe("remove enabled tab", () => {
    const func = mjs.removeEnabledTab;

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.",
                           "throw");
      });
    });

    it("should get null", async () => {
      const res = await func(1);
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      const {enabledTabs} = mjs;
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: "normal",
      }).resolves([{
        id: 2,
      }]);
      enabledTabs.set(1, true);
      const res = await func(1);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, "called");
      assert.isFalse(enabledTabs.has(1));
      assert.deepEqual(res, [], "result");
    });
  });

  describe("set icon", () => {
    const func = mjs.setIcon;

    it("should get result", async () => {
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns("foo/bar");
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, "called");
      assert.strictEqual(browser.runtime.getURL.callCount, j + 1, "called");
      assert.strictEqual(browser.browserAction.setIcon.callCount, k + 1,
                         "called");
      assert.strictEqual(browser.browserAction.setTitle.callCount, l + 1,
                         "called");
      assert.deepEqual(res, [
        [
          {
            path: "foo/bar",
          },
        ],
        [
          {
            title: "extensionName",
          },
        ],
      ], "result");
      browser.i18n.getMessage.flush();
      browser.runtime.getURL.flush();
      browser.browserAction.setIcon.flush();
      browser.browserAction.setTitle.flush();
    });

    it("should get result", async () => {
      const {vars} = mjs;
      const i = browser.i18n.getMessage.callCount;
      const j = browser.runtime.getURL.callCount;
      const k = browser.browserAction.setIcon.callCount;
      const l = browser.browserAction.setTitle.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      browser.runtime.getURL.withArgs(ICON).returns("foo/bar");
      browser.browserAction.setIcon.callsFake((...args) => args);
      browser.browserAction.setTitle.callsFake((...args) => args);
      vars.iconId = "#baz";
      const res = await func();
      assert.strictEqual(browser.i18n.getMessage.callCount, i + 1, "called");
      assert.strictEqual(browser.runtime.getURL.callCount, j + 1, "called");
      assert.strictEqual(browser.browserAction.setIcon.callCount, k + 1,
                         "called");
      assert.strictEqual(browser.browserAction.setTitle.callCount, l + 1,
                         "called");
      assert.deepEqual(res, [
        [
          {
            path: "foo/bar#baz",
          },
        ],
        [
          {
            title: "extensionName",
          },
        ],
      ], "result");
      browser.i18n.getMessage.flush();
      browser.runtime.getURL.flush();
      browser.browserAction.setIcon.flush();
      browser.browserAction.setTitle.flush();
    });
  });

  describe("set default icon", () => {
    const func = mjs.setDefaultIcon;
    beforeEach(() => {
      const {vars} = mjs;
      vars.iconId = "#foo";
    });
    afterEach(() => {
      const {vars} = mjs;
      vars.iconId = "";
    });

    it("should set value", async () => {
      const {vars} = mjs;
      const i = browser.management.getAll.callCount;
      browser.management.getAll.resolves([]);
      await func();
      assert.strictEqual(browser.management.getAll.callCount, i + 1, "called");
      assert.strictEqual(vars.iconId, "", "value");
      browser.management.getAll.flush();
    });

    it("should set value", async () => {
      const {vars} = mjs;
      const i = browser.management.getAll.callCount;
      browser.management.getAll.resolves([
        {
          type: "theme",
          enabled: true,
          id: "bar",
        },
        {
          type: "theme",
          enabled: false,
          id: THEME_DARK,
        },
        {
          type: "theme",
          enabled: false,
          id: THEME_LIGHT,
        },
      ]);
      await func();
      assert.strictEqual(browser.management.getAll.callCount, i + 1, "called");
      assert.strictEqual(vars.iconId, "", "value");
      browser.management.getAll.flush();
    });

    it("should set value", async () => {
      const {vars} = mjs;
      const i = browser.management.getAll.callCount;
      browser.management.getAll.resolves([
        {
          type: "theme",
          enabled: true,
          id: "bar",
        },
        {
          type: "theme",
          enabled: false,
          id: THEME_DARK,
        },
        {
          type: "theme",
          enabled: false,
          id: THEME_LIGHT,
        },
      ]);
      vars.isWebExt = true;
      await func();
      assert.strictEqual(browser.management.getAll.callCount, i + 1, "called");
      assert.strictEqual(vars.iconId, ICON_DARK_ID, "value");
      browser.management.getAll.flush();
    });

    it("should set value", async () => {
      const {vars} = mjs;
      const i = browser.management.getAll.callCount;
      browser.management.getAll.resolves([
        {
          type: "theme",
          enabled: false,
          id: "bar",
        },
        {
          type: "theme",
          enabled: true,
          id: THEME_DARK,
        },
        {
          type: "theme",
          enabled: false,
          id: THEME_LIGHT,
        },
      ]);
      await func();
      assert.strictEqual(browser.management.getAll.callCount, i + 1, "called");
      assert.strictEqual(vars.iconId, ICON_LIGHT_ID, "value");
      browser.management.getAll.flush();
    });

    it("should set value", async () => {
      const {vars} = mjs;
      const i = browser.management.getAll.callCount;
      browser.management.getAll.resolves([
        {
          type: "theme",
          enabled: false,
          id: "bar",
        },
        {
          type: "theme",
          enabled: false,
          id: THEME_DARK,
        },
        {
          type: "theme",
          enabled: true,
          id: THEME_LIGHT,
        },
      ]);
      await func();
      assert.strictEqual(browser.management.getAll.callCount, i + 1, "called");
      assert.strictEqual(vars.iconId, ICON_DARK_ID, "value");
      browser.management.getAll.flush();
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
      contextInfo.selectionText = "quux";
      const res = await func();
      assert.isFalse(res.isLink, "isLink");
      assert.isNull(res.content, "content");
      assert.isNull(res.title, "title");
      assert.isNull(res.url, "url");
      assert.isNull(res.canonicalUrl, "canonicalUrl");
      assert.strictEqual(res.selectionText, "");
    });
  });

  describe("update context info", () => {
    const func = mjs.updateContextInfo;
    beforeEach(() => {
      const {contextInfo} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.selectionText = "";
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });
    afterEach(() => {
      const {contextInfo} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.selectionText = "";
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });

    it("should init object", async () => {
      const {contextInfo} = mjs;
      contextInfo.isLink = true;
      contextInfo.content = "foo";
      contextInfo.title = "bar";
      contextInfo.url = "baz";
      contextInfo.canonicalUrl = "qux";
      contextInfo.selectionText = "quux";
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

    it("should update object", async () => {
      const obj = {
        contextInfo: {
          isLink: true,
          content: "foo",
          title: "bar",
          url: "baz",
          canonicalUrl: "qux",
          selectionText: "quux",
        },
      };
      const res = await func(obj);
      assert.deepEqual(res, {
        isLink: true,
        content: "foo",
        selectionText: "quux",
        title: "bar",
        url: "baz",
        canonicalUrl: "qux",
      }, "result");
    });
  });

  describe("get all tabs info", () => {
    const func = mjs.getAllTabsInfo;

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should get result", async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
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
          content: "foo",
          formatId: "TextURL",
          id: 1,
          template: "%content% %url%",
          title: "foo",
          url: "https://example.com",
        },
        {
          content: "bar",
          formatId: "TextURL",
          id: 2,
          template: "%content% %url%",
          title: "bar",
          url: "https://www.example.com",
        },
      ], "result");
    });
  });

  describe("get selected tabs info", () => {
    const func = mjs.getSelectedTabsInfo;

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should get result", async () => {
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
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
          content: "foo",
          formatId: "TextURL",
          id: 1,
          template: "%content% %url%",
          title: "foo",
          url: "https://example.com",
        },
        {
          content: "bar",
          formatId: "TextURL",
          id: 2,
          template: "%content% %url%",
          title: "bar",
          url: "https://www.example.com",
        },
      ], "result");
    });
  });

  describe("extract clicked data", () => {
    const func = mjs.extractClickedData;
    beforeEach(() => {
      const {contextInfo, enabledFormats, enabledTabs, vars} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.selectionText = "";
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
      vars.notifyOnCopy = false;
      vars.promptContent = false;
      enabledFormats.clear();
      enabledTabs.set(1, true);
    });
    afterEach(() => {
      const {contextInfo, enabledFormats, enabledTabs, vars} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.selectionText = "";
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
      vars.notifyOnCopy = false;
      vars.promptContent = false;
      enabledFormats.clear();
      enabledTabs.clear();
    });

    it("should get empty array", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should call function", async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.notifications.create.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      vars.notifyOnCopy = true;
      browser.notifications.create.resolves(true);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.notifications.create.callCount, j + 1,
                         "called");
      assert.deepEqual(res, [
        true,
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.notifications.create.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledTabs, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      vars.promptContent = true;
      enabledTabs.set(1, false);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 2,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should not call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const j = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: "foo",
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://www.example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/";
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.strictEqual(navigator.clipboard.writeText.callCount, j,
                         "not called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should not call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const j = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: "foo",
        selectionText: "",
      };
      const tab = {
        id: browser.tabs.TAB_ID_NONE,
        title: "bar",
        url: "https://www.example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/";
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.strictEqual(navigator.clipboard.writeText.callCount, j,
                         "not called");
      assert.deepEqual(res, [], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://www.example.com/",
      };
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/";
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}TextURL`,
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://www.example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/";
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "bar",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_TAB}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_TAB}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}${BBCODE_URL}`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}${BBCODE_URL}`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/#baz",
              formatId: BBCODE_URL,
              formatTitle: "BBCode (URL)",
              promptContent: true,
              template: "[url]%content%[/url]",
              title: undefined,
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}${BBCODE_URL}`,
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://www.example.com/",
      };
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/";
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {contextInfo, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}${BBCODE_URL}`,
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://www.example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/";
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/",
              formatId: BBCODE_URL,
              formatTitle: "BBCode (URL)",
              promptContent: true,
              template: "[url]%content%[/url]",
              title: undefined,
              url: "https://example.com/",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_TAB}${BBCODE_URL}`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_TAB}${BBCODE_URL}`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_LINK}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/#corge";
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {contextInfo, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_LINK}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/#corge";
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "quux",
              url: "https://www.example.com/#corge",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_LINK}TextURL`,
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/#corge";
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {contextInfo, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_LINK}TextURL`,
        selectionText: "",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/#corge";
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "qux",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "quux",
              url: "https://www.example.com/#corge",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        menuItemId: `${COPY_LINK}${BBCODE_URL}`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/#corge";
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {contextInfo, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_LINK}${BBCODE_URL}`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      contextInfo.canonicalUrl = "https://example.com/";
      contextInfo.content = "qux";
      contextInfo.title = "quux";
      contextInfo.url = "https://www.example.com/#corge";
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://www.example.com/#corge",
              formatId: BBCODE_URL,
              formatTitle: "BBCode (URL)",
              promptContent: true,
              template: "[url]%content%[/url]",
              title: undefined,
              url: "https://www.example.com/#corge",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.tabs.query.callCount;
      const info = {
        menuItemId: `${COPY_TABS_ALL}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com/#baz",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 1, "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const i = document.execCommand.callCount;
      const j = browser.tabs.query.callCount;
      const info = {
        menuItemId: `${COPY_TABS_ALL}HTMLHyper`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com/#baz",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      const res = await func(info, tab);
      assert.strictEqual(document.execCommand.callCount, i + 1, "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 1, "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const i = navigator.clipboard.writeText.callCount;
      const j = browser.tabs.query.callCount;
      const info = {
        menuItemId: `${COPY_TABS_SELECTED}TextURL`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com/#baz",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 1, "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const i = document.execCommand.callCount;
      const j = browser.tabs.query.callCount;
      const info = {
        menuItemId: `${COPY_TABS_SELECTED}HTMLHyper`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.query.withArgs({
        highlighted: true,
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com/#baz",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      const res = await func(info, tab);
      assert.strictEqual(document.execCommand.callCount, i + 1, "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 1, "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.query.flush();
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: "TextURL",
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: false,
        menuItemId: "TextURL",
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      enabledFormats.add("TextURL");
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: false,
        menuItemId: "TextURL",
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add("TextURL");
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: false,
        menuItemId: "TextURL",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/",
      };
      enabledFormats.add("TextURL");
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: false,
        menuItemId: "TextURL",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add("TextURL");
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "bar",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: false,
        menuItemId: BBCODE_URL,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      enabledFormats.add(BBCODE_URL);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: false,
        menuItemId: BBCODE_URL,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add(BBCODE_URL);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/#baz",
              formatId: BBCODE_URL,
              formatTitle: "BBCode (URL)",
              promptContent: true,
              template: "[url]%content%[/url]",
              title: undefined,
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: false,
        menuItemId: BBCODE_URL,
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/",
      };
      enabledFormats.add(BBCODE_URL);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: false,
        menuItemId: BBCODE_URL,
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add(BBCODE_URL);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/",
              formatId: BBCODE_URL,
              formatTitle: "BBCode (URL)",
              promptContent: true,
              template: "[url]%content%[/url]",
              title: undefined,
              url: "https://example.com/",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: true,
        menuItemId: "TextURL",
        selectionText: "foo",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      enabledFormats.add("TextURL");
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: true,
        menuItemId: "TextURL",
        selectionText: "foo",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add("TextURL");
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: true,
        menuItemId: "TextURL",
        content: "foo",
        selectionText: "",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      enabledFormats.add("TextURL");
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: true,
        menuItemId: "TextURL",
        content: "foo",
        selectionText: "",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add("TextURL");
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: true,
        menuItemId: "TextURL",
        content: "",
        selectionText: "",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      enabledFormats.add("TextURL");
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: true,
        menuItemId: "TextURL",
        content: "",
        selectionText: "",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add("TextURL");
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "bar",
              formatId: "TextURL",
              formatTitle: "Text & URL",
              promptContent: true,
              template: "%content% %url%",
              title: "bar",
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = navigator.clipboard.writeText.callCount;
      const info = {
        isLink: true,
        menuItemId: BBCODE_URL,
        content: "",
        selectionText: "",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      enabledFormats.add(BBCODE_URL);
      const res = await func(info, tab);
      assert.strictEqual(navigator.clipboard.writeText.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        isLink: true,
        menuItemId: BBCODE_URL,
        content: "",
        selectionText: "",
        title: "bar",
        url: "https://example.com/#baz",
      };
      const tab = {
        id: 1,
        title: "qux",
        url: "https://example.com/",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      enabledFormats.add(BBCODE_URL);
      vars.promptContent = true;
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/#baz",
              formatId: BBCODE_URL,
              formatTitle: "BBCode (URL)",
              promptContent: true,
              template: "[url]%content%[/url]",
              title: undefined,
              url: "https://example.com/#baz",
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          selectionText: "",
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });
  });

  describe("handle active tab", () => {
    const func = mjs.handleActiveTab;
    beforeEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });

    it("should get null", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func({
        tabId: 1,
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, "called");
      assert.deepEqual(res, [], "result");
      browser.tabs.get.flush();
    });
  });

  describe("handle updated tab", () => {
    const func = mjs.handleUpdatedTab;

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.",
                           "throw");
      });
    });

    it("should get null", async () => {
      const res = await func(1);
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = await func(1, {
        status: "loading",
      }, {
        active: true,
      });
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = await func(1, {
        status: "complete",
      }, {
        active: false,
      });
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func(1, {
        status: "complete",
      }, {
        active: true,
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, "called");
      assert.deepEqual(res, [], "result");
      browser.tabs.get.flush();
    });
  });

  describe("prepare UI", () => {
    const func = mjs.prepareUI;

    it("should call function", async () => {
      const res = await func();
      assert.deepEqual(res, [[undefined, undefined], []], "result");
    });
  });

  describe("handle command", () => {
    const func = mjs.handleCmd;
    beforeEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });
    afterEach(() => {
      const {enabledFormats} = mjs;
      enabledFormats.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError, "error");
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "message");
      });
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func("foo");
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func("foo");
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
    });

    it("should not call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: "normal",
      }).resolves([{
        id: -1,
      }]);
      enabledFormats.add("HTMLPlain");
      await func("HTMLPlain");
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      browser.tabs.query.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: "normal",
      }).resolves([{
        id: 1,
      }]);
      enabledFormats.add("HTMLPlain");
      await func(`${CMD_COPY}HTMLPlain`);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      browser.tabs.query.flush();
    });

    it("should log error", async () => {
      const {enabledFormats} = mjs;
      const stub = sinon.stub(console, "error");
      const i = browser.tabs.sendMessage.callCount;
      browser.tabs.sendMessage.rejects(new Error("error"));
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: "normal",
      }).resolves([{
        id: 1,
      }]);
      enabledFormats.add("HTMLPlain");
      await func(`${CMD_COPY}HTMLPlain`);
      const {calledOnce} = stub;
      stub.restore();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1,
                         "called sendMessage");
      assert.isTrue(calledOnce, "called console");
      browser.tabs.query.flush();
      browser.tabs.sendMessage.flush();
    });
  });

  describe("handle message", () => {
    const func = mjs.handleMsg;
    beforeEach(() => {
      const {contextInfo, vars} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.selectionText = "";
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
      vars.notifyOnCopy = false;
    });
    afterEach(() => {
      const {contextInfo, vars} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.selectionText = "";
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
      vars.notifyOnCopy = false;
    });

    it("should get empty object", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty object", async () => {
      const res = await func({
        foo: "bar",
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get result", async () => {
      const res = await func({
        load: {
          contextInfo: {
            isLink: false,
            content: "foo",
            title: "bar",
            selectionText: "baz",
            url: "https:www.example.com",
            canonicalUrl: "https://example.com",
          },
        },
      });
      assert.deepEqual(res, [
        {
          isLink: false,
          content: "foo",
          title: "bar",
          selectionText: "baz",
          url: "https:www.example.com",
          canonicalUrl: "https://example.com",
        },
      ], "result");
    });

    it("should get result", async () => {
      const i = browser.tabs.get.callCount;
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func({
        load: {
          contextInfo: {
            isLink: false,
            content: "foo",
            title: "bar",
            selectionText: "baz",
            url: "https:www.example.com",
            canonicalUrl: "https://example.com",
          },
        },
      }, {
        id: "qux",
        tab: {
          id: 1,
        },
      });
      assert.strictEqual(browser.tabs.get.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [],
        {
          isLink: false,
          content: "foo",
          title: "bar",
          selectionText: "baz",
          url: "https:www.example.com",
          canonicalUrl: "https://example.com",
        },
      ], "result");
      browser.tabs.get.flush();
    });

    it("should get result", async () => {
      const res = await func({
        keydown: {
          contextInfo: {
            isLink: false,
            content: "foo",
            title: "bar",
            selectionText: "baz",
            url: "https:www.example.com",
            canonicalUrl: "https://example.com",
          },
        },
      });
      assert.deepEqual(res, [
        {
          isLink: false,
          content: "foo",
          title: "bar",
          selectionText: "baz",
          url: "https:www.example.com",
          canonicalUrl: "https://example.com",
        },
      ], "result");
    });

    it("should get result", async () => {
      const res = await func({
        mousedown: {
          contextInfo: {
            isLink: false,
            content: "foo",
            title: "bar",
            selectionText: "baz",
            url: "https:www.example.com",
            canonicalUrl: "https://example.com",
          },
        },
      });
      assert.deepEqual(res, [
        {
          isLink: false,
          content: "foo",
          title: "bar",
          selectionText: "baz",
          url: "https:www.example.com",
          canonicalUrl: "https://example.com",
        },
      ], "result");
    });

    it("should call function", async () => {
      browser.runtime.getURL.withArgs(ICON).returns("/foo/bar");
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.vars.notifyOnCopy = true;
      const i = browser.notifications.create.callCount;
      browser.notifications.create.resolves(true);
      const res = await func({
        [NOTIFY_COPY]: true,
      });
      assert.strictEqual(browser.notifications.create.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [true], "result");
      browser.runtime.getURL.flush();
      browser.i18n.getMessage.flush();
      browser.notifications.create.flush();
    });

    it("should not call function", async () => {
      browser.runtime.getURL.withArgs(ICON).returns("/foo/bar");
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.vars.notifyOnCopy = true;
      const i = browser.notifications.create.callCount;
      const res = await func({
        [NOTIFY_COPY]: false,
      });
      assert.strictEqual(browser.notifications.create.callCount, i,
                         "not called");
      assert.deepEqual(res, [], "result");
      browser.runtime.getURL.flush();
      browser.i18n.getMessage.flush();
    });

    it("should not call function", async () => {
      browser.runtime.getURL.withArgs(ICON).returns("/foo/bar");
      browser.i18n.getMessage.callsFake(msg => msg);
      mjs.vars.notifyOnCopy = false;
      const i = browser.notifications.create.callCount;
      const res = await func({
        [NOTIFY_COPY]: true,
      });
      assert.strictEqual(browser.notifications.create.callCount, i,
                         "not called");
      assert.deepEqual(res, [], "result");
      browser.runtime.getURL.flush();
      browser.i18n.getMessage.flush();
    });

    it("should get empty array", async () => {
      const res = await func({
        [CONTEXT_INFO]: true,
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get result", async () => {
      const res = await func({
        [CONTEXT_INFO]: {
          contextInfo: {},
          data: {},
        },
      });
      assert.deepEqual(res, [[]], "result");
    });
  });

  describe("set variable", () => {
    const func = mjs.setVar;
    beforeEach(() => {
      const {enabledFormats, vars} = mjs;
      vars.iconId = "";
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.isWebExt = false;
      vars.notifyOnCopy = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });
    afterEach(() => {
      const {enabledFormats, vars} = mjs;
      vars.iconId = "";
      vars.includeTitleHTMLHyper = false;
      vars.includeTitleHTMLPlain = false;
      vars.includeTitleMarkdown = false;
      vars.isWebExt = false;
      vars.notifyOnCopy = false;
      vars.promptContent = false;
      enabledFormats.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throw");
      });
    });

    it("should get empty array", async () => {
      const res = await func("foo");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      await mjs.setFormatData();
      const res = await func("TextURL", {
        checked: false,
      });
      const {enabledFormats} = mjs;
      assert.isFalse(enabledFormats.has("TextURL"), "value");
      assert.deepEqual(res, [undefined], "result");
    });

    it("should set variable", async () => {
      await mjs.setFormatData();
      const res = await func("TextURL", {
        checked: false,
      }, true);
      const {enabledFormats} = mjs;
      assert.isFalse(enabledFormats.has("TextURL"), "value");
      assert.strictEqual(res.length, 1, "result");
      assert.strictEqual(res[0].length, 70, "result");
    });

    it("should set variable", async () => {
      await mjs.setFormatData();
      const res = await func("TextURL", {
        checked: true,
      });
      const {enabledFormats} = mjs;
      assert.isTrue(enabledFormats.has("TextURL"), "value");
      assert.deepEqual(res, [undefined], "result");
    });

    it("should set variable", async () => {
      await mjs.setFormatData();
      const res = await func("TextURL", {
        checked: true,
      }, true);
      const {enabledFormats} = mjs;
      assert.isTrue(enabledFormats.has("TextURL"), "value");
      assert.strictEqual(res.length, 1, "result");
      assert.strictEqual(res[0].length, 75, "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(INCLUDE_TITLE_HTML_HYPER, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleHTMLHyper, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(INCLUDE_TITLE_HTML_PLAIN, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleHTMLPlain, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(INCLUDE_TITLE_MARKDOWN, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleMarkdown, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(NOTIFY_COPY, {
        checked: false,
      });
      assert.isFalse(vars.notifyOnCopy, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(NOTIFY_COPY, {
        checked: true,
      });
      assert.isTrue(vars.notifyOnCopy, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: "normal",
      }).resolves([{
        id: 1,
      }]);
      const res = await func(PROMPT, {
        checked: true,
      });
      assert.strictEqual(browser.tabs.query.callCount, i, "not called");
      assert.isTrue(vars.promptContent, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const i = browser.tabs.query.callCount;
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        active: true,
        windowType: "normal",
      }).resolves([{
        id: 1,
      }]);
      const res = await func(PROMPT, {
        checked: true,
      }, true);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, "called");
      assert.isTrue(vars.promptContent, "value");
      assert.deepEqual(res, [[]], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_AUTO, {
        checked: true,
        value: "#foo",
      }, true);
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [[undefined, undefined]], "result");
    });

    it("should not set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_AUTO, {
        checked: false,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "", "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_BLACK, {
        checked: true,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_COLOR, {
        checked: true,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_DARK, {
        checked: true,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_LIGHT, {
        checked: true,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(ICON_WHITE, {
        checked: true,
        value: "#foo",
      });
      assert.strictEqual(vars.iconId, "#foo", "value");
      assert.deepEqual(res, [], "result");
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
      assert.deepEqual(res, [[]], "result");
    });
  });
});
