/**
 * format.test.js
 */
/* eslint-disable  max-nested-callbacks, no-await-in-loop, no-magic-numbers */

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import format from "../src/mjs/format.js";

describe("format", () => {
  beforeEach(() => {
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("keys", () => {
    const itemKeys = [
      "HTMLHyper", "HTMLPlain", "Markdown", "BBCodeText", "BBCodeURL",
      "Textile", "AsciiDoc", "MediaWiki", "Jira", "reStructuredText", "LaTeX",
      "TextURL", "TextOnly", "URLOnly",
    ];
    const items = Object.entries(format);

    it("should get equal length", () => {
      assert.isTrue(items.length === itemKeys.length, "length");
    });

    it("should get string and object", () => {
      for (const [key, value] of items) {
        assert.isTrue(itemKeys.includes(key), "item");
        assert.isString(key, "key");
        assert.isObject(value, "value");
      }
    });
  });
});
