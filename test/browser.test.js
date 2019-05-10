/**
 * browser.test.js
 */
/* eslint-disable  max-nested-callbacks, no-await-in-loop, no-magic-numbers */

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import sinon from "sinon";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/browser.js";

describe("browser", () => {
  beforeEach(() => {
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("create bookmark", () => {
    const func = mjs.createBookmark;

    it("should get null if no argument given", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get null if argument is not object", async () => {
      const res = await func("foo");
      assert.isNull(res, "result");
    });

    it("should get null if argument is empty object", async () => {
      const res = await func({});
      assert.isNull(res, "result");
    });

    it("should get object", async () => {
      browser.bookmarks.create.withArgs({foo: "bar"}).resolves({});
      const res = await func({foo: "bar"});
      assert.deepEqual(res, {}, "result");
    });
  });

  describe("update command", () => {
    const func = mjs.updateCommand;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if first argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should throw if 2nd argument is not string", async () => {
      await func("foo", 1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should get null", async () => {
      browser.commands.reset.rejects();
      browser.commands.update.resolves(undefined);
      const res = await func("foo", "a");
      assert.isFalse(browser.commands.reset.calledOnce, "called");
      assert.isFalse(browser.commands.update.calledOnce, "not called");
      assert.isNull(res, "result");
      browser.commands.reset.flush();
      browser.commands.update.flush();
    });

    it("should call function", async () => {
      browser.commands.reset.resolves(undefined);
      browser.commands.update.rejects();
      const res = await func("foo", "");
      assert.isTrue(browser.commands.reset.calledOnce, "called");
      assert.isFalse(browser.commands.update.calledOnce, "not called");
      assert.isUndefined(res, "result");
      browser.commands.reset.flush();
      browser.commands.update.flush();
    });

    it("should call function", async () => {
      browser.commands.reset.rejects();
      browser.commands.update.resolves(undefined);
      const items = [
        "Alt+1", "Command+1", "Ctrl+1", "MacCtrl+1",
        "Alt+Shift+1", "Command+Shift+1", "Ctrl+Shift+1", "MacCtrl+Shift+1",
        "Alt+Command+1", "Alt+Ctrl+1", "Alt+MacCtrl+1",
        "Command+Alt+1", "Command+MacCtrl+1",
        "Ctrl+Alt+1", "Ctrl+MacCtrl+1",
        "MacCtrl+Alt+1", "MacCtrl+Command+1", "MacCtrl+Ctrl+1",
        "Alt+a", "Command+a", "Ctrl+a", "MacCtrl+a",
        "Alt+Shift+a", "Command+Shift+a", "Ctrl+Shift+a", "MacCtrl+Shift+a",
        "Alt+Command+a", "Alt+Ctrl+a", "Alt+MacCtrl+a",
        "Command+Alt+a", "Command+MacCtrl+a",
        "Ctrl+Alt+a", "Ctrl+MacCtrl+a",
        "MacCtrl+Alt+a", "MacCtrl+Command+a", "MacCtrl+Ctrl+a",
        "Alt+F1", "Command+F1", "Ctrl+F1", "MacCtrl+F1",
        "Alt+Shift+F1", "Command+Shift+F1", "Ctrl+Shift+F1", "MacCtrl+Shift+F1",
        "Alt+Command+F1", "Alt+Ctrl+F1", "Alt+MacCtrl+F1",
        "Command+Alt+F1", "Command+MacCtrl+F1",
        "Ctrl+Alt+F1", "Ctrl+MacCtrl+F1",
        "MacCtrl+Alt+F1", "MacCtrl+Command+F1", "MacCtrl+Ctrl+F1",
        "Alt+PageDown", "Command+PageDown", "Ctrl+PageDown", "MacCtrl+PageDown",
        "Alt+Shift+PageDown", "Command+Shift+PageDown", "Ctrl+Shift+PageDown",
        "MacCtrl+Shift+PageDown",
        "Alt+Command+PageDown", "Alt+Ctrl+PageDown", "Alt+MacCtrl+PageDown",
        "Command+Alt+PageDown", "Command+MacCtrl+PageDown",
        "Ctrl+Alt+PageDown", "Ctrl+MacCtrl+PageDown",
        "MacCtrl+Alt+PageDown", "MacCtrl+Command+PageDown",
        "MacCtrl+Ctrl+PageDown",
        "Alt+Up", "Command+Up", "Ctrl+Up", "MacCtrl+Up",
        "Alt+Shift+Up", "Command+Shift+Up", "Ctrl+Shift+Up", "MacCtrl+Shift+Up",
        "Alt+Command+Up", "Alt+Ctrl+Up", "Alt+MacCtrl+Up",
        "Command+Alt+Up", "Command+MacCtrl+Up",
        "Ctrl+Alt+Up", "Ctrl+MacCtrl+Up",
        "MacCtrl+Alt+Up", "MacCtrl+Command+Up", "MacCtrl+Ctrl+Up",
        "Alt+Left", "Command+Left", "Ctrl+Left", "MacCtrl+Left",
        "Alt+Shift+Left", "Command+Shift+Left", "Ctrl+Shift+Left",
        "MacCtrl+Shift+Left",
        "Alt+Command+Left", "Alt+Ctrl+Left", "Alt+MacCtrl+Left",
        "Command+Alt+Left", "Command+MacCtrl+Left",
        "Ctrl+Alt+Left", "Ctrl+MacCtrl+Left",
        "MacCtrl+Alt+Left", "MacCtrl+Command+Left", "MacCtrl+Ctrl+Left",
        "F1", "F12",
        "MediaNextTrack", "MediaPrevTrack", "MediaPlayPause", "MediaStop",
      ];
      for (const item of items) {
        const i = browser.commands.update.callCount;
        const res = await func("foo", item);
        assert.strictEqual(browser.commands.update.callCount, i + 1,
                           `called ${item}`);
        assert.isFalse(browser.commands.reset.calledOnce, "not called");
        assert.isUndefined(res, "result");
      }
      browser.commands.reset.flush();
      browser.commands.update.flush();
    });

    it("should call function", async () => {
      browser.commands.reset.rejects();
      browser.commands.update.resolves(undefined);
      const res = await func("foo", " Ctrl+a ");
      assert.isTrue(browser.commands.update.calledOnce, "called");
      assert.isFalse(browser.commands.reset.calledOnce, "not called");
      assert.isUndefined(res, "result");
      browser.commands.reset.flush();
      browser.commands.update.flush();
    });
  });

  describe("get all contextual identities", () => {
    const func = mjs.getAllContextualIdentities;

    it("should get null", async () => {
      const stubApi =
        sinon.stub(browser, "contextualIdentities").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get result", async () => {
      browser.contextualIdentities.query.withArgs({}).resolves([
        {
          foo: "bar",
        },
        {
          baz: "qux",
        },
      ]);
      const res = await func();
      assert.isArray(res, "array");
      assert.deepEqual(res, [{foo: "bar"}, {baz: "qux"}], "result");
      browser.contextualIdentities.query.flush();
    });

    it("should log error message", async () => {
      let msg;
      const e = new Error("error");
      const stub = sinon.stub(console, "error").callsFake(m => {
        msg = m && m.message || m;
      });
      browser.contextualIdentities.query.rejects(e);
      const res = await func();
      stub.restore();
      assert.strictEqual(msg, "error", "log");
      assert.isNull(res, "result");
      browser.contextualIdentities.query.flush();
    });
  });

  describe("get contextual identities", () => {
    const func = mjs.getContextualId;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if given argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should get null", async () => {
      const stubApi =
        sinon.stub(browser, "contextualIdentities").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get result", async () => {
      browser.contextualIdentities.get.withArgs("foo").resolves({});
      const res = await func("foo");
      assert.deepEqual(res, {}, "result");
      browser.contextualIdentities.get.flush();
    });

    it("should log error message", async () => {
      let msg;
      const e = new Error("error");
      const stub = sinon.stub(console, "error").callsFake(m => {
        msg = m && m.message || m;
      });
      browser.contextualIdentities.get.withArgs("foo").rejects(e);
      const res = await func("foo");
      stub.restore();
      assert.strictEqual(msg, "error", "log");
      assert.isNull(res, "result");
      browser.contextualIdentities.get.flush();
    });
  });

  describe("get enabled theme", () => {
    const func = mjs.getEnabledTheme;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "management").returns(undefined);
      const res = await func();
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get null", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get array", async () => {
      browser.management.getAll.resolves([
        {
          enabled: false,
          type: "theme",
        },
        {
          enabled: true,
          type: "foo",
        },
        {
          enabled: true,
          type: "theme",
        },
        {
          enabled: false,
          type: "bar",
        },
      ]);
      const res = await func();
      assert.isArray(res, "array");
      assert.deepEqual(res, [
        {
          enabled: true,
          type: "theme",
        },
      ], "result");
      browser.management.getAll.flush();
    });
  });

  describe("get extension info", () => {
    const func = mjs.getExtensionInfo;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if given argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "management").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should reject if given id is not found", async () => {
      browser.management.get.withArgs("foo").rejects(new Error("error"));
      await func("foo").catch(e => {
        assert.strictEqual(e.message, "error");
      });
      browser.management.get.flush();
    });

    it("should get object", async () => {
      browser.management.get.withArgs("foo").resolves({});
      const res = await func("foo");
      assert.deepEqual(res, {}, "result");
    });
  });

  describe("get external extensions", () => {
    const func = mjs.getExternalExtensions;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "management").returns(undefined);
      const res = await func();
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get null", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get array", async () => {
      browser.management.getAll.resolves([
        {
          type: "extension",
        },
        {
          type: "foo",
        },
        {
          type: "extension",
        },
        {
          type: "bar",
        },
      ]);
      const res = await func();
      assert.isArray(res, "array");
      assert.deepEqual(res, [
        {
          type: "extension",
        },
        {
          type: "extension",
        },
      ], "result");
      browser.management.getAll.flush();
    });
  });

  describe("clear notification", () => {
    const func = mjs.clearNotification;

    it("should throw if no argument given", () => {
      assert.throws(() => func(), "Expected String but got Undefined.");
    });

    it("should throw if argument is not string", () => {
      assert.throws(() => func(1), "Expected String but got Number.");
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "notifications").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get result", async () => {
      browser.notifications.clear.withArgs("foo").resolves(true);
      const res = await func("foo");
      assert.isTrue(res, "result");
      browser.notifications.clear.flush();
    });
  });

  describe("create notification", () => {
    const func = mjs.createNotification;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if first argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "notifications").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get message", async () => {
      browser.notifications.create.withArgs("foo", {}).resolves("bar");
      const res = await func("foo", {});
      assert.strictEqual(res, "bar", "result");
      browser.notifications.create.flush();
    });
  });

  describe("remove permission", () => {
    const func = mjs.removePermission;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message,
                           "Expected String or Array but got Undefined.");
      });
    });

    it("should throw if given argument is not string or array", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message,
                           "Expected String or Array but got Number.");
      });
    });

    it("should get result", async () => {
      browser.permissions.remove.withArgs({permissions: ["foo"]})
        .resolves(true);
      const res = await func("foo");
      assert.isTrue(res, "result");
      browser.permissions.remove.flush();
    });

    it("should get result", async () => {
      browser.permissions.remove.withArgs({permissions: ["foo"]})
        .resolves(false);
      const res = await func("foo");
      assert.isFalse(res, "result");
      browser.permissions.remove.flush();
    });

    it("should get result", async () => {
      browser.permissions.remove.withArgs({permissions: ["foo"]})
        .resolves(true);
      const res = await func(["foo"]);
      assert.isTrue(res, "result");
      browser.permissions.remove.flush();
    });
  });

  describe("request permission", () => {
    const func = mjs.requestPermission;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message,
                           "Expected String or Array but got Undefined.");
      });
    });

    it("should throw if given argument is not string or array", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message,
                           "Expected String or Array but got Number.");
      });
    });

    it("should get result", async () => {
      browser.permissions.request.withArgs({permissions: ["foo"]})
        .resolves(true);
      const res = await func("foo");
      assert.isTrue(res, "result");
      browser.permissions.request.flush();
    });

    it("should get result", async () => {
      browser.permissions.request.withArgs({permissions: ["foo"]})
        .resolves(false);
      const res = await func("foo");
      assert.isFalse(res, "result");
      browser.permissions.request.flush();
    });

    it("should get result", async () => {
      browser.permissions.request.withArgs({permissions: ["foo"]})
        .resolves(true);
      const res = await func(["foo"]);
      assert.isTrue(res, "result");
      browser.permissions.request.flush();
    });
  });

  describe("get manifest icons", () => {
    const func = mjs.getManifestIcons;

    it("should get object", () => {
      browser.runtime.getManifest.returns({icons: {foo: "bar"}});
      const res = func();
      assert.deepEqual(res, {foo: "bar"}, "result");
      browser.runtime.getManifest.flush();
    });
  });

  describe("get OS", () => {
    const func = mjs.getOs;

    it("should get string", async () => {
      browser.runtime.getPlatformInfo.resolves({os: "foo"});
      const res = await func();
      assert.strictEqual(res, "foo", "result");
    });
  });

  describe("make a connection", () => {
    const func = mjs.makeConnection;

    it("should get object", async () => {
      browser.runtime.connect.withArgs("foo").resolves({bar: "baz"});
      const res = await func("foo");
      assert.deepEqual(res, {bar: "baz"}, "result");
      browser.runtime.connect.flush();
    });

    it("should get object", async () => {
      browser.runtime.connect.withArgs("foo", {bar: "baz"}).resolves({});
      const res = await func("foo", {bar: "baz"});
      assert.deepEqual(res, {}, "result");
      browser.runtime.connect.flush();
    });

    it("should get object", async () => {
      browser.runtime.connect.withArgs({foo: "bar"}).resolves({});
      const res = await func({foo: "bar"});
      assert.deepEqual(res, {}, "result");
      browser.runtime.connect.flush();
    });

    it("should get object", async () => {
      browser.runtime.connect.withArgs({foo: "bar"}).resolves({});
      const res = await func(null, {foo: "bar"});
      assert.deepEqual(res, {}, "result");
      browser.runtime.connect.flush();
    });

    it("should get object", async () => {
      browser.runtime.connect.withArgs().resolves({});
      const res = await func();
      assert.deepEqual(res, {}, "result");
      browser.runtime.connect.flush();
    });
  });

  describe("send message", () => {
    const func = mjs.sendMessage;

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const res = await func();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      browser.runtime.sendMessage.withArgs(null, "foo", null).resolves({});
      const i = browser.runtime.sendMessage.callCount;
      const res = await func(null, "foo");
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {}, "result");
      browser.runtime.sendMessage.flush();
    });

    it("should call function", async () => {
      browser.runtime.sendMessage.withArgs(null, "foo", {bar: "baz"})
        .resolves({});
      const i = browser.runtime.sendMessage.callCount;
      const res = await func(null, "foo", {bar: "baz"});
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {}, "result");
      browser.runtime.sendMessage.flush();
    });

    it("should call function", async () => {
      browser.runtime.sendMessage.withArgs("foo", "bar", null).resolves({});
      const i = browser.runtime.sendMessage.callCount;
      const res = await func("foo", "bar");
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.deepEqual(res, {}, "result");
      browser.runtime.sendMessage.flush();
    });

    it("should call function", async () => {
      browser.tabs.sendMessage.withArgs(1, "foo", null).resolves({});
      const i = browser.tabs.sendMessage.callCount;
      const res = await func(1, "foo");
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
      assert.deepEqual(res, {}, "result");
      browser.tabs.sendMessage.flush();
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      const j = browser.runtime.sendMessage.callCount;
      const res = await func(browser.tabs.TAB_ID_NONE, "foo");
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
      assert.strictEqual(browser.runtime.sendMessage.callCount, j,
                         "not called");
      assert.isNull(res, "result");
    });
  });

  describe("get recently closed tab", () => {
    const func = mjs.getRecentlyClosedTab;

    it("should get null", async () => {
      browser.sessions.getRecentlyClosed.resolves([]);
      const res = await func();
      assert.isNull(res, "result");
      browser.sessions.getRecentlyClosed.flush();
    });

    it("should get null", async () => {
      browser.sessions.getRecentlyClosed.resolves([]);
      const res = await func(1);
      assert.isNull(res, "result");
      browser.sessions.getRecentlyClosed.flush();
    });

    it("should get null", async () => {
      browser.sessions.getRecentlyClosed.resolves([{}]);
      const res = await func();
      assert.isNull(res, "result");
      browser.sessions.getRecentlyClosed.flush();
    });

    it("should get null", async () => {
      browser.sessions.getRecentlyClosed.resolves([{tab: {windowId: 2}}]);
      const res = await func(1);
      assert.isNull(res, "result");
      browser.sessions.getRecentlyClosed.flush();
    });

    it("should get object", async () => {
      const tab = {windowId: 1};
      browser.sessions.getRecentlyClosed.resolves([{tab}]);
      const res = await func(1);
      assert.deepEqual(res, tab, "result");
      browser.sessions.getRecentlyClosed.flush();
    });

    it("should get object", async () => {
      const tab = {windowId: 1};
      browser.sessions.getRecentlyClosed.resolves([
        {tab: {windowId: 2}},
        {tab},
      ]);
      const res = await func(1);
      assert.deepEqual(res, tab, "result");
      browser.sessions.getRecentlyClosed.flush();
    });
  });

  describe("get session window value", () => {
    const func = mjs.getSessionWindowValue;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if given argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "sessions").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.sessions.getWindowValue.withArgs(1, "foo").resolves("bar");
      const res = await func("foo", 1);
      assert.strictEqual(res, "bar", "result");
      browser.sessions.getWindowValue.flush();
    });

    it("should get object", async () => {
      browser.sessions.getWindowValue
        .withArgs(browser.windows.WINDOW_ID_CURRENT, "foo").resolves("bar");
      const res = await func("foo");
      assert.strictEqual(res, "bar", "result");
      browser.sessions.getWindowValue.flush();
    });
  });

  describe("restore session", () => {
    const func = mjs.restoreSession;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if given argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "sessions").returns(undefined);
      const res = await func("foo");
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.sessions.restore.withArgs("foo").resolves({});
      const res = await func("foo");
      assert.deepEqual(res, {}, "result");
      browser.sessions.restore.flush();
    });
  });

  describe("set session window value", () => {
    const func = mjs.setSessionWindowValue;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw if given argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.");
      });
    });

    it("should call function", async () => {
      const i = browser.sessions.setWindowValue.callCount;
      await func("foo", "bar", 1);
      assert.strictEqual(browser.sessions.setWindowValue.callCount, i + 1,
                         "called");
    });

    it("should call function", async () => {
      const i = browser.sessions.setWindowValue.callCount;
      await func("foo", "bar");
      assert.strictEqual(browser.sessions.setWindowValue.callCount, i + 1,
                         "called");
    });
  });

  describe("clear storage", () => {
    const func = mjs.clearStorage;

    it("should get object", async () => {
      const i = browser.storage.local.clear.callCount;
      await func();
      assert.strictEqual(browser.storage.local.clear.callCount, i + 1,
                         "called");
    });
  });

  describe("get all storage", () => {
    const func = mjs.getAllStorage;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "storage").returns(undefined);
      const res = await func();
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.storage.local.get.resolves({foo: "bar"});
      const res = await func();
      assert.deepEqual(res, {foo: "bar"}, "result");
      browser.storage.local.get.flush();
    });
  });

  describe("get storage", () => {
    const func = mjs.getStorage;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "storage").returns(undefined);
      const res = await func();
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.storage.local.get.withArgs("foo").resolves({foo: "bar"});
      const res = await func("foo");
      assert.deepEqual(res, {foo: "bar"}, "result");
      browser.storage.local.get.flush();
    });
  });

  describe("remove storage", () => {
    const func = mjs.removeStorage;

    it("should call function", async () => {
      const i = browser.storage.local.remove.callCount;
      await func();
      assert.strictEqual(browser.storage.local.remove.callCount, i + 1,
                         "called");
    });
  });

  describe("set storage", () => {
    const func = mjs.setStorage;

    it("should not call function if no argument given", async () => {
      const i = browser.storage.local.set.callCount;
      await func();
      assert.strictEqual(browser.storage.local.set.callCount, i, "not called");
    });

    it("should call function", async () => {
      const i = browser.storage.local.set.callCount;
      await func("foo");
      assert.strictEqual(browser.storage.local.set.callCount, i + 1, "called");
    });
  });

  describe("create tab", () => {
    const func = mjs.createTab;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.tabs.create.withArgs(null).resolves({});
      const res = await func();
      assert.deepEqual(res, {}, "result");
      browser.tabs.create.flush();
    });

    it("should get object", async () => {
      browser.tabs.create.withArgs(null).resolves({});
      const res = await func({});
      assert.deepEqual(res, {}, "result");
      browser.tabs.create.flush();
    });

    it("should get object", async () => {
      const opt = {
        foo: "bar",
      };
      browser.tabs.create.withArgs(opt).resolves({});
      const res = await func(opt);
      assert.deepEqual(res, {}, "result");
      browser.tabs.create.flush();
    });
  });

  describe("execute content script to existing tab", () => {
    const func = mjs.execScriptToTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should call function", async () => {
      const stubErr = sinon.stub(console, "error");
      const file = "/foo/bar";
      const i = browser.tabs.executeScript.withArgs(1, {
        file,
      }).callCount;
      browser.tabs.executeScript.withArgs(1, {
        file,
      }).resolves([{}]);
      const res = await func(1, {file});
      const {calledOnce: errCalled} = stubErr;
      stubErr.restore();
      assert.strictEqual(browser.tabs.executeScript.withArgs(1, {
        file,
      }).callCount, i + 1, "called");
      assert.isFalse(errCalled, "error not called");
      assert.deepEqual(res, [{}], "result");
      browser.tabs.executeScript.flush();
    });

    it("should call function", async () => {
      const stubErr = sinon.stub(console, "error");
      const file = "/foo/bar";
      const i = browser.tabs.executeScript.withArgs(1, {
        file,
        allFrames: true,
      }).callCount;
      browser.tabs.executeScript.withArgs(1, {
        file,
        allFrames: true,
      }).resolves([{}]);
      const res = await func(1, {
        file,
        allFrames: true,
      });
      const {calledOnce: errCalled} = stubErr;
      stubErr.restore();
      assert.strictEqual(browser.tabs.executeScript.withArgs(1, {
        file,
        allFrames: true,
      }).callCount, i + 1, "called");
      assert.isFalse(errCalled, "error not called");
      assert.deepEqual(res, [{}], "result");
      browser.tabs.executeScript.flush();
    });

    it("should log error", async () => {
      const stubErr = sinon.stub(console, "error");
      const file = "/foo/bar";
      const i = browser.tabs.executeScript.withArgs(1, {
        file,
      }).callCount;
      browser.tabs.executeScript.withArgs(1, {
        file,
      }).rejects(new Error("error"));
      const res = await func(1, {file});
      const {calledOnce: errCalled} = stubErr;
      stubErr.restore();
      assert.strictEqual(browser.tabs.executeScript.withArgs(1, {
        file,
      }).callCount, i + 1, "called");
      assert.isTrue(errCalled, "error called");
      assert.isFalse(res, "result");
      browser.tabs.executeScript.flush();
    });
  });

  describe("execute content script to existing tabs", () => {
    const func = mjs.execScriptToTabs;

    it("should not call function", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func();
      assert.deepEqual(res, [], "result");
      stubApi.restore();
    });

    it("should call function", async () => {
      const stubErr = sinon.stub(console, "error");
      const file = "/foo/bar";
      const i = browser.tabs.executeScript.withArgs(1, {
        file,
      }).callCount;
      const j = browser.tabs.executeScript.withArgs(2, {
        file,
      }).callCount;
      browser.tabs.query.resolves([
        {
          id: 1,
          url: "https://example.com",
        },
        {
          id: 2,
          url: "https://example.net",
        },
        {
          id: 3,
          url: "about:blank",
        },
      ]);
      browser.tabs.executeScript.withArgs(1, {
        file,
      }).resolves([{}]);
      browser.tabs.executeScript.withArgs(2, {
        file,
      }).rejects(new Error("error"));
      const res = await func({file});
      const {calledOnce: errCalled} = stubErr;
      stubErr.restore();
      assert.strictEqual(browser.tabs.executeScript.withArgs(1, {
        file,
      }).callCount, i + 1, "called");
      assert.strictEqual(browser.tabs.executeScript.withArgs(2, {
        file,
      }).callCount, j + 1, "called");
      assert.isTrue(errCalled, "error called");
      assert.deepEqual(res, [[{}], false], "result");
      browser.tabs.query.flush();
      browser.tabs.executeScript.flush();
    });

    it("should get call function", async () => {
      const stubErr = sinon.stub(console, "error");
      const file = "/foo/bar";
      const i = browser.tabs.executeScript.withArgs(1, {
        file,
        allFrames: true,
      }).callCount;
      const j = browser.tabs.executeScript.withArgs(2, {
        file,
        allFrames: true,
      }).callCount;
      browser.tabs.query.resolves([
        {
          id: 1,
          url: "https://example.com",
        },
        {
          id: 2,
          url: "https://example.net",
        },
        {
          id: 3,
          url: "about:blank",
        },
      ]);
      browser.tabs.executeScript.withArgs(1, {
        file,
        allFrames: true,
      }).resolves([{}, {}]);
      browser.tabs.executeScript.withArgs(2, {
        file,
        allFrames: true,
      }).rejects(new Error("error"));
      const res = await func({
        file,
        allFrames: true,
      });
      const {calledOnce: errCalled} = stubErr;
      stubErr.restore();
      assert.strictEqual(browser.tabs.executeScript.withArgs(1, {
        file,
        allFrames: true,
      }).callCount, i + 1, "called");
      assert.strictEqual(browser.tabs.executeScript.withArgs(2, {
        file,
        allFrames: true,
      }).callCount, j + 1, "called");
      assert.isTrue(errCalled, "error called");
      assert.deepEqual(res, [[{}, {}], false], "result");
      browser.tabs.query.flush();
      browser.tabs.executeScript.flush();
    });
  });

  describe("get active tab", () => {
    const func = mjs.getActiveTab;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get number", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func(1);
      assert.deepEqual(res, {}, "result");
      browser.tabs.query.flush();
    });

    it("should get number", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func();
      assert.deepEqual(res, {}, "result");
      browser.tabs.query.flush();
    });
  });

  describe("get active tab ID", () => {
    const func = mjs.getActiveTabId;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get number", async () => {
      browser.tabs.query.resolves([
        {
          id: 1,
        },
      ]);
      const res = await func(1);
      assert.deepEqual(res, 1, "result");
      browser.tabs.query.flush();
    });

    it("should get number", async () => {
      browser.tabs.query.resolves([
        {
          id: 1,
        },
      ]);
      const res = await func();
      assert.deepEqual(res, 1, "result");
      browser.tabs.query.flush();
    });
  });

  describe("get all tabs in window", () => {
    const func = mjs.getAllTabsInWindow;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get array", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func(1);
      assert.deepEqual(res, [{}], "result");
      browser.tabs.query.flush();
    });

    it("should get array", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func();
      assert.deepEqual(res, [{}], "result");
      browser.tabs.query.flush();
    });
  });

  describe("get highlighted tab", () => {
    const func = mjs.getHighlightedTab;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get array", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func(1);
      assert.deepEqual(res, [{}], "result");
      browser.tabs.query.flush();
    });

    it("should get array", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func();
      assert.deepEqual(res, [{}], "result");
      browser.tabs.query.flush();
    });
  });

  describe("get tab", () => {
    const func = mjs.getTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.");
      });
    });

    it("should throw if argument is not number", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message, "Expected Number but got String.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func(1);
      assert.deepEqual(res, {}, "result");
      browser.tabs.get.flush();
    });
  });

  describe("highlight tab", () => {
    const func = mjs.highlightTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message,
                           "Expected Number or Array but got Undefined.");
      });
    });

    it("should throw if argument is not number", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message,
                           "Expected Number or Array but got String.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get object", async () => {
      browser.tabs.highlight.resolves({});
      const res = await func(1);
      assert.deepEqual(res, {}, "result");
      browser.tabs.highlight.flush();
    });

    it("should get object", async () => {
      browser.tabs.highlight.resolves({});
      const res = await func(1, 2);
      assert.deepEqual(res, {}, "result");
      browser.tabs.highlight.flush();
    });
  });

  describe("move tab", () => {
    const func = mjs.moveTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message,
                           "Expected Number or Array but got Undefined.");
      });
    });

    it("should throw if argument is not number", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message,
                           "Expected Number or Array but got String.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get array", async () => {
      browser.tabs.move.withArgs(1).resolves({});
      const res = await func(1);
      assert.deepEqual(res, [{}], "res");
      browser.tabs.move.flush();
    });

    it("should get array", async () => {
      browser.tabs.move.withArgs(1, {foo: "bar"}).resolves({});
      const res = await func(1, {foo: "bar"});
      assert.deepEqual(res, [{}], "res");
      browser.tabs.move.flush();
    });

    it("should get array", async () => {
      browser.tabs.move.withArgs([1, 2]).resolves([{}, {}]);
      const res = await func([1, 2]);
      assert.deepEqual(res, [{}, {}], "res");
      browser.tabs.move.flush();
    });

    it("should get array", async () => {
      browser.tabs.move.withArgs([1, 2]).resolves([]);
      const res = await func([1, 2]);
      assert.deepEqual(res, [], "res");
      browser.tabs.move.flush();
    });
  });

  describe("reload tab", () => {
    const func = mjs.reloadTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.");
      });
    });

    it("should throw if argument is not number", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message, "Expected Number but got String.");
      });
    });

    it("should call function", async () => {
      const i = browser.tabs.reload.withArgs(1, null).callCount;
      await func(1);
      assert.strictEqual(browser.tabs.reload.withArgs(1, null).callCount, i + 1,
                         "res");
    });

    it("should call function", async () => {
      const i = browser.tabs.reload.withArgs(1, {foo: "bar"}).callCount;
      await func(1, {foo: "bar"});
      assert.strictEqual(
        browser.tabs.reload.withArgs(1, {foo: "bar"}).callCount,
        i + 1, "res"
      );
    });
  });

  describe("remove tab", () => {
    const func = mjs.removeTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Array but got Undefined.");
      });
    });

    it("should throw if argument is not number or array", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message, "Expected Array but got String.");
      });
    });

    it("should call function", async () => {
      const i = browser.tabs.remove.callCount;
      await func(1);
      assert.strictEqual(browser.tabs.remove.callCount, i + 1, "res");
    });

    it("should call function", async () => {
      const i = browser.tabs.remove.callCount;
      await func([1]);
      assert.strictEqual(browser.tabs.remove.callCount, i + 1, "res");
    });
  });

  describe("update tab", () => {
    const func = mjs.updateTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.");
      });
    });

    it("should throw if argument is not number", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message, "Expected Number but got String.");
      });
    });

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should throw if tab does not exist", async () => {
      browser.tabs.update.withArgs(1).throws(new Error("error"));
      await func(1).catch(e => {
        assert.strictEqual(e.message, "error");
      });
      browser.tabs.update.flush();
    });

    it("should get object", async () => {
      browser.tabs.update.withArgs(1).resolves({});
      const i = browser.tabs.update.withArgs(1).callCount;
      const res = await func(1);
      assert.strictEqual(browser.tabs.update.withArgs(1).callCount, i + 1,
                         "called");
      assert.isObject(res, "res");
      browser.tabs.update.flush();
    });

    it("should get object", async () => {
      browser.tabs.update.withArgs(1, {foo: "bar"}).resolves({});
      const i = browser.tabs.update.withArgs(1, {foo: "bar"}).callCount;
      const res = await func(1, {foo: "bar"});
      assert.strictEqual(
        browser.tabs.update.withArgs(1, {foo: "bar"}).callCount,
        i + 1,
        "called"
      );
      assert.isObject(res, "res");
      browser.tabs.update.flush();
    });
  });

  describe("is tab", () => {
    const func = mjs.isTab;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.");
      });
    });

    it("should throw if argument is not number", async () => {
      await func("").catch(e => {
        assert.strictEqual(e.message, "Expected Number but got String.");
      });
    });

    it("should get false", async () => {
      const stubApi = sinon.stub(browser, "tabs").returns(undefined);
      const res = await func(1);
      assert.isFalse(res, "result");
      stubApi.restore();
    });

    it("should get result", async () => {
      const res = await func(-1);
      assert.isFalse(res, "res");
    });

    it("should get result", async () => {
      const e = new Error("error");
      browser.tabs.get.withArgs(1).rejects(e);
      const res = await func(1);
      assert.isFalse(res, "res");
      browser.tabs.get.flush();
    });

    it("should get result", async () => {
      browser.tabs.get.withArgs(1).resolves({});
      const res = await func(1);
      assert.isTrue(res, "res");
      browser.tabs.get.flush();
    });
  });

  describe("getCurrentTheme", () => {
    const func = mjs.getCurrentTheme;

    it("should get null", async () => {
      const stubApi = sinon.stub(browser, "theme").returns(undefined);
      const res = await func();
      assert.isNull(res, "result");
      stubApi.restore();
    });

    it("should get function called and get result", async () => {
      browser.theme.getCurrent.resolves({});
      const i = browser.theme.getCurrent.callCount;
      const res = await func();
      assert.strictEqual(browser.theme.getCurrent.callCount, i + 1, "called");
      assert.deepEqual(res, {}, "result");
      browser.theme.getCurrent.flush();
    });
  });

  describe("create new window", () => {
    const func = mjs.createNewWindow;

    it("should get function called and get result", async () => {
      browser.windows.create.withArgs(null).resolves(null);
      const i = browser.windows.create.callCount;
      const res = await func();
      assert.strictEqual(browser.windows.create.callCount, i + 1, "called");
      assert.isNull(res, "result");
      browser.windows.create.flush();
    });

    it("should get function called and get result", async () => {
      browser.windows.create.withArgs(null).resolves(null);
      const i = browser.windows.create.callCount;
      const res = await func();
      assert.strictEqual(browser.windows.create.callCount, i + 1, "called");
      assert.isNull(res, "result");
      browser.windows.create.flush();
    });

    it("should get function called and get result", async () => {
      const opt = {
        foo: "bar",
      };
      browser.windows.create.withArgs(opt).resolves(opt);
      const i = browser.windows.create.callCount;
      const res = await func(opt);
      assert.strictEqual(browser.windows.create.callCount, i + 1, "called");
      assert.deepEqual(res, opt, "result");
      browser.windows.create.flush();
    });
  });

  describe("get all normal windows", () => {
    const func = mjs.getAllNormalWindows;

    it("should get function called and get result", async () => {
      browser.windows.getAll.withArgs({
        populate: false,
        windowTypes: ["normal"],
      }).resolves([]);
      const i = browser.windows.getAll.withArgs({
        populate: false,
        windowTypes: ["normal"],
      }).callCount;
      const res = await func();
      assert.strictEqual(browser.windows.getAll.callCount, i + 1, "called");
      assert.isArray(res, "result");
      browser.windows.getAll.flush();
    });

    it("should get function called and get result", async () => {
      browser.windows.getAll.withArgs({
        populate: true,
        windowTypes: ["normal"],
      }).resolves([]);
      const i = browser.windows.getAll.withArgs({
        populate: true,
        windowTypes: ["normal"],
      }).callCount;
      const res = await func(true);
      assert.strictEqual(browser.windows.getAll.callCount, i + 1, "called");
      assert.isArray(res, "result");
      browser.windows.getAll.flush();
    });
  });

  describe("get current window", () => {
    const func = mjs.getCurrentWindow;

    it("should get function called and get result", async () => {
      browser.windows.getCurrent.withArgs(null).resolves(null);
      const i = browser.windows.getCurrent.callCount;
      const res = await func();
      assert.strictEqual(browser.windows.getCurrent.callCount, i + 1, "called");
      assert.isNull(res, "result");
      browser.windows.getCurrent.flush();
    });

    it("should get function called and get result", async () => {
      browser.windows.getCurrent.withArgs(null).resolves(null);
      const i = browser.windows.getCurrent.callCount;
      const res = await func();
      assert.strictEqual(browser.windows.getCurrent.callCount, i + 1, "called");
      assert.isNull(res, "result");
      browser.windows.getCurrent.flush();
    });

    it("should get function called and get result", async () => {
      const opt = {
        foo: "bar",
      };
      browser.windows.getCurrent.withArgs(opt).resolves({});
      const i = browser.windows.getCurrent.callCount;
      const res = await func(opt);
      assert.strictEqual(browser.windows.getCurrent.callCount, i + 1, "called");
      assert.deepEqual(res, {}, "result");
      browser.windows.getCurrent.flush();
    });
  });

  describe("get window", () => {
    const func = mjs.getWindow;

    it("should throw", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected Number but got Undefined.",
                           "throw");
      });
    });

    it("should get result", async () => {
      browser.windows.get.withArgs(1, null).resolves({});
      const i = browser.windows.get.callCount;
      const res = await func(1);
      assert.strictEqual(browser.windows.get.callCount, i + 1, "called");
      assert.deepEqual(res, {}, "result");
      browser.windows.get.flush();
    });

    it("should get result", async () => {
      browser.windows.get.withArgs(1, {
        populate: true,
      }).resolves({});
      const i = browser.windows.get.callCount;
      const res = await func(1, {
        populate: true,
      });
      assert.strictEqual(browser.windows.get.callCount, i + 1, "called");
      assert.deepEqual(res, {}, "result");
      browser.windows.get.flush();
    });
  });

  describe("check whether incognito window exists", () => {
    const func = mjs.checkIncognitoWindowExists;

    it("should get result", async () => {
      browser.windows.getAll.resolves([]);
      const res = await func();
      assert.isFalse(res, "result");
      browser.windows.getAll.flush();
    });

    it("should get result", async () => {
      browser.windows.getAll.resolves([
        {
          incognito: false,
        },
        {
          incognito: false,
        },
      ]);
      const res = await func();
      assert.isFalse(res, "result");
      browser.windows.getAll.flush();
    });

    it("should get result", async () => {
      browser.windows.getAll.resolves([
        {
          incognito: false,
        },
        {
          incognito: true,
        },
      ]);
      const res = await func();
      assert.isTrue(res, "result");
      browser.windows.getAll.flush();
    });
  });
});
