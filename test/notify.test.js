/**
 * notify.test.js
 */

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import {ICON, NOTIFY_COPY} from "../src/mjs/constant.js";
import * as mjs from "../src/mjs/notify.js";

describe("notify", () => {
  beforeEach(() => {
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("notify on copy", () => {
    const func = mjs.notifyOnCopy;

    it("should call function", async () => {
      browser.runtime.getURL.withArgs(ICON).returns("foo/bar");
      browser.i18n.getMessage.withArgs("notifyOnCopyMsg").returns("foo");
      browser.i18n.getMessage.withArgs("extensionName").returns("bar");
      browser.notifications.create.withArgs(NOTIFY_COPY, {
        iconUrl: "foo/bar",
        message: "foo",
        title: "bar",
        type: "basic",
      }).resolves(true);
      const res = await func();
      assert.isTrue(res, "result");
      browser.runtime.getURL.flush();
      browser.i18n.getMessage.flush();
      browser.notifications.create.flush();
    });

    it("should call function", async () => {
      browser.runtime.getURL.withArgs(ICON).returns("foo/bar");
      browser.i18n.getMessage.withArgs("notifyOnCopyMsg_format", "foo")
        .returns("foo");
      browser.i18n.getMessage.withArgs("extensionName").returns("bar");
      browser.notifications.create.withArgs(NOTIFY_COPY, {
        iconUrl: "foo/bar",
        message: "foo",
        title: "bar",
        type: "basic",
      }).resolves(true);
      const res = await func("foo");
      assert.isTrue(res, "result");
      browser.runtime.getURL.flush();
      browser.i18n.getMessage.flush();
      browser.notifications.create.flush();
    });
  });
});
