/**
 * main.test.js
 */
/* eslint-disable  max-nested-callbacks, no-await-in-loop, no-magic-numbers,
                   array-bracket-newline */

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/main.js";
import formatData from "../src/mjs/format.js";
import {
  BBCODE_URL, COPY_ALL_TABS, COPY_LINK, COPY_PAGE, COPY_TAB, EXEC_COPY,
  EXEC_COPY_POPUP, EXEC_COPY_TABS, EXEC_COPY_TABS_POPUP, ICON,
  ICON_AUTO, ICON_BLACK, ICON_COLOR, ICON_DARK, ICON_DARK_ID, ICON_LIGHT,
  ICON_LIGHT_ID, ICON_WHITE, INCLUDE_TITLE_HTML, INCLUDE_TITLE_MARKDOWN,
  MIME_HTML, MIME_PLAIN, OUTPUT_HTML_HYPER, OUTPUT_HTML_PLAIN, OUTPUT_TEXT,
  OUTPUT_TEXT_AND_URL, OUTPUT_TEXT_TEXT, OUTPUT_TEXT_TEXT_URL, OUTPUT_TEXT_URL,
  OUTPUT_URL, PROMPT, THEME_DARK, THEME_LIGHT,
} from "../src/mjs/constant.js";

describe("main", () => {
  beforeEach(() => {
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("toggle enabled formats", () => {
    const func = mjs.toggleEnabledFormats;
    beforeEach(() => {
      const {formats} = mjs;
      formats.set("Text", {
        foo: "bar",
      });
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

    it("should not set map", async () => {
      const {enabledFormats} = mjs;
      await func("foo");
      assert.isFalse(enabledFormats.has("foo"), "result");
    });

    it("should not set map", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_PAGE}Text`, false);
      assert.isFalse(enabledFormats.has("Text"), "result");
    });

    it("should set map", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_TAB}Text`, true);
      assert.isTrue(enabledFormats.has("Text"), "result");
    });

    it("should set map", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_PAGE}Text`, true);
      assert.isTrue(enabledFormats.has("Text"), "result");
    });

    it("should set map", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_LINK}Text`, true);
      assert.isTrue(enabledFormats.has("Text"), "result");
    });

    it("should set map", async () => {
      const {enabledFormats} = mjs;
      await func(`${COPY_ALL_TABS}Text`, true);
      assert.isTrue(enabledFormats.has("Text"), "result");
    });
  });

  describe("set format data", () => {
    const func = mjs.setFormatData;
    beforeEach(() => {
      const {enabledFormats, formats} = mjs;
      enabledFormats.clear();
      formats.clear();
    });
    afterEach(() => {
      const {enabledFormats, formats} = mjs;
      enabledFormats.clear();
      formats.clear();
    });

    it("should set map", async () => {
      const {enabledFormats, formats} = mjs;
      const items = Object.keys(formatData);
      const res = await func();
      assert.strictEqual(res.length, items.length, "result");
      assert.strictEqual(formats.size, items.length, "formats");
      assert.strictEqual(enabledFormats.size, items.length, "enabled formats");
    });
  });

  describe("get format item from menu item ID", () => {
    const func = mjs.getFormatItemFromId;
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

    it("should get result", async () => {
      const value = formatData.Text;
      const res = await func(`${COPY_TAB}Text`);
      assert.deepEqual(res, value, "result");
    });

    it("should get result", async () => {
      const value = formatData.Text;
      const res = await func(`${COPY_PAGE}Text`);
      assert.deepEqual(res, value, "result");
    });

    it("should get result", async () => {
      const value = formatData.Text;
      const res = await func(`${COPY_LINK}Text`);
      assert.deepEqual(res, value, "result");
    });

    it("should get result", async () => {
      const value = formatData.Text;
      const res = await func(`${COPY_ALL_TABS}Text`);
      assert.deepEqual(res, value, "result");
    });
  });

  describe("get format template", () => {
    const func = mjs.getFormatTemplate;
    beforeEach(() => {
      const {formats, vars} = mjs;
      const items = Object.entries(formatData);
      for (const [key, value] of items) {
        formats.set(key, value);
      }
      vars.includeTitleHtml = false;
      vars.includeTitleMarkdown = false;
      vars.mimeType = MIME_PLAIN;
      vars.textOutput = OUTPUT_TEXT_AND_URL;
    });
    afterEach(() => {
      const {formats, vars} = mjs;
      formats.clear();
      vars.includeTitleHtml = false;
      vars.includeTitleMarkdown = false;
      vars.mimeType = MIME_PLAIN;
      vars.textOutput = OUTPUT_TEXT_AND_URL;
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
      const res = await func(`${COPY_PAGE}Text`);
      assert.strictEqual(res, "%content% %url%", "result");
    });

    it("should get value", async () => {
      const {vars} = mjs;
      vars.textOutput = OUTPUT_URL;
      const res = await func(`${COPY_PAGE}Text`);
      assert.strictEqual(res, "%url%", "result");
    });

    it("should get value", async () => {
      const {vars} = mjs;
      vars.textOutput = OUTPUT_TEXT;
      const res = await func(`${COPY_PAGE}Text`);
      assert.strictEqual(res, "%content%", "result");
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
      const res = await func(`${COPY_PAGE}HTML`);
      assert.strictEqual(res, "<a href=\"%url%\">%content%</a>", "result");
    });

    it("should get value", async () => {
      const {vars} = mjs;
      vars.includeTitleHtml = true;
      const res = await func(`${COPY_PAGE}HTML`);
      assert.strictEqual(
        res, "<a href=\"%url%\" title=\"%title%\">%content%</a>", "result"
      );
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

  describe("create context menu items", () => {
    const func = mjs.createContextMenu;
    beforeEach(() => {
      const {enabledFormats, formats, vars} = mjs;
      const items = Object.entries(formatData);
      vars.isWebExt = true;
      enabledFormats.add("HTML");
      enabledFormats.add("Markdown");
      enabledFormats.add("Text");
      for (const [key, value] of items) {
        formats.set(key, value);
      }
    });
    afterEach(() => {
      const {enabledFormats, formats, vars} = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
      formats.clear();
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
      assert.strictEqual(browser.contextMenus.create.callCount, i + 48,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 4,
                         "called");
      assert.strictEqual(res.length, 48, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 24,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 4,
                         "called");
      assert.strictEqual(res.length, 48, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      enabledFormats.delete("HTML");
      enabledFormats.delete("Markdown");
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 4,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 4,
                         "called");
      assert.strictEqual(res.length, 4, "result");
      browser.i18n.getMessage.flush();
    });

    it("should call function", async () => {
      const {enabledFormats, vars} = mjs;
      const i = browser.contextMenus.create.callCount;
      const k = browser.i18n.getMessage.callCount;
      enabledFormats.delete("HTML");
      enabledFormats.delete("Markdown");
      browser.i18n.getMessage.callsFake((...args) => args.toString());
      vars.isWebExt = false;
      const res = await func();
      assert.strictEqual(browser.contextMenus.create.callCount, i + 2,
                         "called");
      assert.strictEqual(browser.i18n.getMessage.callCount, k + 4,
                         "called");
      assert.strictEqual(res.length, 4, "result");
      browser.i18n.getMessage.flush();
    });
  });

  describe("update context menu", () => {
    const func = mjs.updateContextMenu;
    beforeEach(() => {
      const {enabledFormats, enabledTabs, formats, vars} = mjs;
      const items = Object.entries(formatData);
      vars.isWebExt = true;
      enabledFormats.add("HTML");
      enabledFormats.add("Markdown");
      enabledFormats.add("Text");
      enabledTabs.set(1, true);
      for (const [key, value] of items) {
        formats.set(key, value);
      }
    });
    afterEach(() => {
      const {enabledFormats, enabledTabs, formats, vars} = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
      enabledTabs.clear();
      formats.clear();
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
      enabledFormats.clear();
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i,
                         "not called");
      assert.deepEqual(res, [], "result");
    });

    it("should call function", async () => {
      const i = browser.contextMenus.update.callCount;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 48,
                         "called");
      assert.strictEqual(res.length, 48, "result");
      browser.management.get.flush();
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      vars.isWebExt = false;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 24,
                         "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.strictEqual(res.length, 24, "result");
    });

    it("should call function", async () => {
      const {enabledTabs} = mjs;
      const i = browser.contextMenus.update.callCount;
      const j = browser.runtime.sendMessage.callCount;
      enabledTabs.clear();
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 48,
                         "called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.strictEqual(res.length, 48, "result");
    });
  });

  describe("update context menu", () => {
    const func = mjs.updateContextMenu;
    beforeEach(() => {
      const {enabledFormats, enabledTabs, formats, vars} = mjs;
      const items = Object.entries(formatData);
      vars.isWebExt = true;
      enabledFormats.add("HTML");
      enabledFormats.add("Markdown");
      enabledFormats.add("Text");
      enabledTabs.set(1, true);
      for (const [key, value] of items) {
        formats.set(key, value);
      }
    });
    afterEach(() => {
      const {enabledFormats, enabledTabs, formats, vars} = mjs;
      vars.isWebExt = false;
      enabledFormats.clear();
      enabledTabs.clear();
      formats.clear();
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.",
                           "throw");
      });
    });

    it("should call function", async () => {
      const i = browser.contextMenus.update.callCount;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 48,
                         "called");
      assert.strictEqual(res.length, 48, "result");
    });

    it("should call function", async () => {
      const {vars} = mjs;
      const i = browser.contextMenus.update.callCount;
      vars.isWebExt = false;
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 24,
                         "called");
      assert.strictEqual(res.length, 24, "result");
      browser.management.get.flush();
    });

    it("should call function", async () => {
      const {enabledTabs} = mjs;
      const i = browser.contextMenus.update.callCount;
      enabledTabs.clear();
      const res = await func(1);
      assert.strictEqual(browser.contextMenus.update.callCount, i + 48,
                         "called");
      assert.strictEqual(res.length, 48, "result");
      browser.management.get.flush();
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
      const res = await func();
      assert.isFalse(res.isLink, "isLink");
      assert.isNull(res.content, "content");
      assert.isNull(res.title, "title");
      assert.isNull(res.url, "url");
      assert.isNull(res.canonicalUrl, "canonicalUrl");
    });
  });

  describe("update context info", () => {
    const func = mjs.updateContextInfo;
    beforeEach(() => {
      const {contextInfo} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });
    afterEach(() => {
      const {contextInfo} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
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
      const res = await func();
      assert.deepEqual(res, {
        isLink: false,
        content: null,
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
        },
      };
      const res = await func(obj);
      assert.deepEqual(res, {
        isLink: true,
        content: "foo",
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
      const res = await func(`${COPY_PAGE}Text`);
      assert.strictEqual(browser.tabs.query.callCount, i + 1, "called");
      assert.deepEqual(res, [
        {
          content: "foo",
          id: 1,
          menuItemId: "copyPageURLText",
          mimeType: "text/plain",
          template: "%content% %url%",
          title: "foo",
          url: "https://example.com",
        },
        {
          content: "bar",
          id: 2,
          menuItemId: "copyPageURLText",
          mimeType: "text/plain",
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
      const {contextInfo, formats} = mjs;
      const items = Object.entries(formatData);
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
      for (const [key, value] of items) {
        formats.set(key, value);
      }
    });
    afterEach(() => {
      const {contextInfo, formats} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
      formats.clear();
    });

    it("should get empty array", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}Text`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_PAGE}Text`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should not call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
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
      assert.deepEqual(res, [
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should not call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
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
      assert.deepEqual(res, [], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_PAGE}Text`,
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
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "bar",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_PAGE}Text`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_TAB}Text`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_TAB}Text`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
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
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/#baz",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_PAGE}${BBCODE_URL}`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
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
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_PAGE}${BBCODE_URL}`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
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
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://example.com/#baz",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_TAB}${BBCODE_URL}`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_LINK}Text`,
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
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "foo",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_LINK}Text`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
      const i = browser.tabs.sendMessage.callCount;
      const info = {
        menuItemId: `${COPY_LINK}Text`,
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
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "qux",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_LINK}Text`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const {contextInfo} = mjs;
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
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopy: {
              content: "https://www.example.com/#corge",
              includeTitleHtml: false,
              includeTitleMarkdown: false,
              menuItemId: `${COPY_LINK}${BBCODE_URL}`,
              mimeType: "text/plain",
              promptContent: false,
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
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
    });

    it("should call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      const j = browser.tabs.query.callCount;
      const info = {
        menuItemId: `${COPY_ALL_TABS}Text`,
        selectionText: "foo",
      };
      const tab = {
        id: 1,
        title: "bar",
        url: "https://example.com/#baz",
      };
      browser.tabs.sendMessage.callsFake((...args) => args);
      browser.tabs.query.withArgs({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        windowType: "normal",
      }).resolves([
        {
          id: 1,
          title: "foo",
          url: "https://example.com#baz",
        },
        {
          id: 2,
          title: "bar",
          url: "https://www.example.com",
        },
      ]);
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.strictEqual(browser.tabs.query.callCount, j + 1, "called");
      assert.deepEqual(res, [
        [
          1,
          {
            executeCopyAllTabs: {
              allTabs: [
                {
                  content: "foo",
                  id: 1,
                  menuItemId: `${COPY_ALL_TABS}Text`,
                  mimeType: "text/plain",
                  template: "%content% %url%",
                  title: "foo",
                  url: "https://example.com#baz",
                },
                {
                  content: "bar",
                  id: 2,
                  menuItemId: `${COPY_ALL_TABS}Text`,
                  mimeType: "text/plain",
                  template: "%content% %url%",
                  title: "bar",
                  url: "https://www.example.com",
                },
              ],
              includeTitleHtml: false,
              includeTitleMarkdown: false,
            },
          },
          null,
        ],
        {
          canonicalUrl: null,
          content: null,
          isLink: false,
          title: null,
          url: null,
        },
      ], "result");
      browser.tabs.sendMessage.flush();
      browser.tabs.query.flush();
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

  describe("handle message", () => {
    const func = mjs.handleMsg;
    beforeEach(() => {
      const {contextInfo} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
    });
    afterEach(() => {
      const {contextInfo} = mjs;
      contextInfo.isLink = false;
      contextInfo.content = null;
      contextInfo.title = null;
      contextInfo.url = null;
      contextInfo.canonicalUrl = null;
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
          url: "https:www.example.com",
          canonicalUrl: "https://example.com",
        },
      ], "result");
    });

    it("should get result", async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.callsFake((...args) => args);
      const res = await func({
        [EXEC_COPY_TABS]: {
          foo: "bar",
        },
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        [
          browser.runtime.id,
          {
            [EXEC_COPY_TABS_POPUP]: {
              foo: "bar",
            },
          },
          null,
        ],
      ], "result");
      browser.runtime.sendMessage.flush();
    });

    it("should get result", async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.callsFake((...args) => args);
      const res = await func({
        [EXEC_COPY]: {
          foo: "bar",
        },
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, [
        [
          browser.runtime.id,
          {
            [EXEC_COPY_POPUP]: {
              foo: "bar",
            },
          },
          null,
        ],
      ], "result");
      browser.runtime.sendMessage.flush();
    });
  });

  describe("set variable", () => {
    const func = mjs.setVar;
    beforeEach(() => {
      const {enabledFormats, formats, vars} = mjs;
      vars.iconId = "";
      vars.includeTitleHtml = false;
      vars.includeTitleMarkdown = false;
      vars.isWebExt = false;
      vars.mimeType = MIME_PLAIN;
      vars.promptContent = false;
      vars.textOutput = OUTPUT_TEXT_AND_URL;
      enabledFormats.clear();
      formats.clear();
    });
    afterEach(() => {
      const {enabledFormats, formats, vars} = mjs;
      vars.iconId = "";
      vars.includeTitleHtml = false;
      vars.includeTitleMarkdown = false;
      vars.isWebExt = false;
      vars.mimeType = MIME_PLAIN;
      vars.promptContent = false;
      vars.textOutput = OUTPUT_TEXT_AND_URL;
      enabledFormats.clear();
      formats.clear();
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
      const res = await func("Text", {
        checked: false,
      });
      const {enabledFormats} = mjs;
      assert.isFalse(enabledFormats.has("Text"), "value");
      assert.deepEqual(res, [undefined], "result");
    });

    it("should set variable", async () => {
      await mjs.setFormatData();
      const res = await func("Text", {
        checked: false,
      }, true);
      const {enabledFormats} = mjs;
      assert.isFalse(enabledFormats.has("Text"), "value");
      assert.strictEqual(res.length, 1, "result");
      assert.strictEqual(res[0].length, 44, "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(OUTPUT_TEXT_URL, {
        checked: true,
        value: OUTPUT_TEXT_URL,
      });
      assert.strictEqual(vars.textOutput, OUTPUT_TEXT_URL, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(OUTPUT_TEXT_TEXT, {
        checked: true,
        value: OUTPUT_TEXT_TEXT,
      });
      assert.strictEqual(vars.textOutput, OUTPUT_TEXT_TEXT, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should not set variable", async () => {
      const {vars} = mjs;
      vars.textOutput = OUTPUT_TEXT_TEXT;
      const res = await func(OUTPUT_TEXT_TEXT_URL, {
        checked: false,
        value: OUTPUT_TEXT_TEXT_URL,
      });
      assert.strictEqual(vars.textOutput, OUTPUT_TEXT_TEXT, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(OUTPUT_HTML_HYPER, {
        checked: true,
        value: MIME_HTML,
      });
      assert.strictEqual(vars.mimeType, MIME_HTML, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      vars.mimeType = MIME_HTML;
      const res = await func(OUTPUT_HTML_PLAIN, {
        checked: true,
        value: MIME_PLAIN,
      });
      assert.strictEqual(vars.mimeType, MIME_PLAIN, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should not set variable", async () => {
      const {vars} = mjs;
      vars.mimeType = MIME_HTML;
      const res = await func(OUTPUT_HTML_PLAIN, {
        checked: false,
        value: MIME_PLAIN,
      });
      assert.strictEqual(vars.mimeType, MIME_HTML, "value");
      assert.deepEqual(res, [], "result");
    });

    it("should set variable", async () => {
      const {vars} = mjs;
      const res = await func(INCLUDE_TITLE_HTML, {
        checked: true,
      });
      assert.isTrue(vars.includeTitleHtml, "value");
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
      const res = await func(PROMPT, {
        checked: true,
      });
      assert.isTrue(vars.promptContent, "value");
      assert.deepEqual(res, [], "result");
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
