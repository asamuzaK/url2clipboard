/**
 * clipboard.test.js
 */
/* eslint-disable no-magic-numbers, max-nested-callbacks */

import {JSDOM} from "jsdom";
import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import sinon from "sinon";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/clipboard.js";

describe("clipboard", () => {
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
    navigator = window && window.navigator;
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

  describe("Clip", () => {
    const {Clip} = mjs;

    it("should create an instance", () => {
      const clip = new Clip();
      assert.instanceOf(clip, Clip);
    });

    describe("getter / setter", () => {
      it("should get value", () => {
        const clip = new Clip("foo");
        assert.strictEqual(clip.content, "foo", "value");
      });

      it("should throw", () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.content = 1;
        }, "Expected String but got Number.");
      });

      it("should set value", () => {
        const clip = new Clip();
        clip.content = "foo";
        assert.strictEqual(clip.content, "foo", "value");
      });

      it("should get vavlue", () => {
        const clip = new Clip("foo", "bar");
        assert.strictEqual(clip.mime, "bar", "value");
      });

      it("should get value", () => {
        const clip = new Clip("foo", "text/plain");
        assert.strictEqual(clip.mime, "text/plain", "value");
      });

      it("should throw", () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.mime = 1;
        }, "Expected String but got Number.");
      });

      it("should throw", () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.mime = "image/png";
        }, "Mime type of image/png is not supported.");
      });

      it("should throw", () => {
        const clip = new Clip();
        assert.throws(() => {
          clip.mime = " image/png ";
        }, "Mime type of image/png is not supported.");
      });

      it("should set value", () => {
        const clip = new Clip();
        clip.mime = "text/plain";
        assert.strictEqual(clip.mime, "text/plain", "value");
      });

      it("should set value", () => {
        const clip = new Clip();
        clip.mime = " text/plain ";
        assert.strictEqual(clip.mime, "text/plain", "value");
      });

      it("should set value", () => {
        const clip = new Clip();
        clip.mime = "text/html";
        assert.strictEqual(clip.mime, "text/html", "value");
      });
    });

    describe("copy to clipboard", () => {
      it("should throw", async () => {
        const clip = new Clip("foo", "image/png");
        await clip.copy().catch(e => {
          assert.instanceOf(e, Error);
          assert.strictEqual(e.message,
                             "Mime type of image/png is not supported.");
        });
      });

      it("should get null", async () => {
        const clip = new Clip("", "text/plain");
        const res = await clip.copy();
        assert.isNull(res, "result");
      });

      it("should call function", async () => {
        const fakeWrite = sinon.fake();
        navigator.clipboard = {
          writeText: fakeWrite,
        };
        browser.notifications.create.resolves(true);
        const i = browser.notifications.create.callCount;
        const clip = new Clip("foo", "text/plain");
        const res = await clip.copy();
        const {calledOnce: calledWrite} = fakeWrite;
        delete navigator.clipboard;
        assert.strictEqual(browser.notifications.create.callCount, i,
                           "not called");
        assert.isTrue(calledWrite, "called");
        assert.isNull(res, "result");
        browser.notifications.create.flush();
      });

      it("should call function", async () => {
        const stubAdd = sinon.stub(document, "addEventListener");
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip("foo", "text/plain");
        const res = await clip.copy();
        const {calledOnce: calledAdd} = stubAdd;
        const {calledOnce: calledExec} = fakeExec;
        stubAdd.restore();
        delete document.execCommand;
        assert.isTrue(calledAdd, "called");
        assert.isTrue(calledExec, "called");
        assert.isNull(res, "result");
      });
    });

    describe("copy to clipboard sync", () => {
      it("should call function", async () => {
        const stubPropagate = sinon.fake();
        const stubPreventDefault = sinon.fake();
        const stubSetData = sinon.fake();
        const evt = {
          stopImmediatePropagation: stubPropagate,
          preventDefault: stubPreventDefault,
          clipboardData: {
            setData: stubSetData,
          },
        };
        const stubAdd =
          sinon.stub(document, "addEventListener").callsFake((...args) => {
            const [, callback] = args;
            return callback(evt);
          });
        const stubRemove = sinon.stub(document, "removeEventListener");
        const fakeExec = sinon.fake();
        document.execCommand = fakeExec;
        const clip = new Clip("foo", "text/plain");
        await clip.copy();
        assert.isTrue(stubRemove.calledOnce, "called");
        assert.isTrue(stubPropagate.calledOnce, "called");
        assert.isTrue(stubPreventDefault.calledOnce, "called");
        assert.isTrue(stubSetData.calledOnce, "called");
        stubAdd.restore();
        stubRemove.restore();
        delete document.execCommand;
      });
    });
  });
});
