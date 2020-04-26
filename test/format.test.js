/**
 * format.test.js
 */
/* eslint-disable max-nested-callbacks */

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/format.js";
import {
  ASCIIDOC, BBCODE_TEXT, BBCODE_URL,
  COPY_LINK, COPY_PAGE, COPY_TAB,
  COPY_TABS_ALL, COPY_TABS_OTHER, COPY_TABS_SELECTED,
  HTML_HYPER, HTML_PLAIN, JIRA, LATEX, MARKDOWN, MEDIAWIKI,
  MIME_HTML, MIME_PLAIN, ORG_MODE, REST, TEXTILE,
  TEXT_TEXT_ONLY, TEXT_TEXT_URL, TEXT_URL_ONLY,
} from "../src/mjs/constant.js";

describe("format", () => {
  const itemKeys = [
    ASCIIDOC, BBCODE_TEXT, BBCODE_URL, HTML_HYPER, HTML_PLAIN, JIRA, LATEX,
    MARKDOWN, MEDIAWIKI, ORG_MODE, REST, TEXTILE, TEXT_TEXT_ONLY, TEXT_TEXT_URL,
    TEXT_URL_ONLY,
  ];
  beforeEach(() => {
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
    browser._sandbox.reset();
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("keys", () => {
    const items = Object.entries(mjs.formatData);

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

  describe("get format id", () => {
    const func = mjs.getFormatId;

    it("should throw", async () => {
      assert.throws(() => func(), "Expected String but got Undefined.");
    });

    it("should get null", async () => {
      const res = func("");
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = func(COPY_LINK);
      assert.isNull(res, "result");
    });

    it("should get result", async () => {
      const res = func("foo");
      assert.strictEqual(res, "foo", "result");
    });

    it("should get result", async () => {
      const res = func(`${COPY_TABS_ALL}foo`);
      assert.strictEqual(res, "foo", "result");
    });

    it("should get result", async () => {
      const res = func(`${COPY_TABS_OTHER}foo`);
      assert.strictEqual(res, "foo", "result");
    });

    it("should get result", async () => {
      const res = func(`${COPY_TABS_SELECTED}foo`);
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

    it("should get result", async () => {
      const res = func(`${COPY_TAB}foo`);
      assert.strictEqual(res, "foo", "result");
    });
  });

  describe("formats", () => {
    const {formats} = mjs;

    it("should have entries", () => {
      const items = formats.entries();
      assert.strictEqual(formats.size, itemKeys.length, "size");
      for (const [key, value] of items) {
        assert.isTrue(itemKeys.includes(key), "key");
        assert.isObject(value, "value");
      }
    });
  });

  describe("get formats", () => {
    const {formats} = mjs;
    const func = mjs.getFormats;

    it("should get entries", async () => {
      const res = await func();
      const data = new Map(res);
      const items = data.entries();
      assert.strictEqual(data.size, formats.size, "size");
      for (const [key, value] of items) {
        assert.isTrue(itemKeys.includes(key), "key");
        assert.isObject(value, "value");
      }
    });

    it("should get entries", async () => {
      const res = await func(true);
      assert.isTrue(Array.isArray(res), "result");
      for (const [key, value] of res) {
        assert.isTrue(itemKeys.includes(key), "key");
        assert.isObject(value, "value");
      }
    });
  });

  describe("get formats keys", () => {
    const {formats} = mjs;
    const func = mjs.getFormatsKeys;

    it("should get keys", async () => {
      const res = await func();
      const data = new Set(res);
      const items = data.keys();
      assert.strictEqual(data.size, formats.size, "size");
      for (const key of items) {
        assert.isTrue(itemKeys.includes(key), "key");
      }
    });

    it("should get keys", async () => {
      const res = await func(true);
      assert.isTrue(Array.isArray(res), "result");
      for (const key of res) {
        assert.isTrue(itemKeys.includes(key), "key");
      }
    });
  });

  describe("has format", () => {
    const func = mjs.hasFormat;

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should get result", async () => {
      const res = await func("foo");
      assert.isFalse(res, "result");
    });

    it("should get result", async () => {
      const res = await func(TEXT_TEXT_URL);
      assert.isTrue(res, "result");
    });

    it("should get result", async () => {
      const res = await func(`${COPY_PAGE}${TEXT_TEXT_URL}`);
      assert.isTrue(res, "result");
    });
  });

  describe("get format", () => {
    const func = mjs.getFormat;

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should get null", async () => {
      const res = await func("");
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = await func("foo");
      assert.isNull(res, "result");
    });

    it("should get result", async () => {
      const res = await func(TEXT_TEXT_URL);
      assert.isObject(res, "result");
    });

    it("should get result", async () => {
      const res = await func(`${COPY_PAGE}${TEXT_TEXT_URL}`);
      assert.isObject(res, "result");
    });
  });

  describe("set format", () => {
    const {formats} = mjs;
    const func = mjs.setFormat;
    beforeEach(() => {
      formats.clear();
    });
    afterEach(() => {
      const items = Object.entries(mjs.formatData);
      for (const [key, value] of items) {
        formats.set(key, value);
      }
    });

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should not set key/value", async () => {
      await func("foo");
      assert.isFalse(formats.has("foo"), "result");
    });

    it("should set key/value", async () => {
      formats.set(TEXT_TEXT_URL, {
        foo: "bar",
      });
      await func(TEXT_TEXT_URL, {
        foo: "baz",
      });
      assert.isTrue(formats.has(TEXT_TEXT_URL), "key");
      assert.deepEqual(formats.get(TEXT_TEXT_URL), {
        foo: "baz",
      }, "value");
    });

    it("should set key/value", async () => {
      formats.set(TEXT_TEXT_URL, {
        foo: "bar",
      });
      await func(`${COPY_PAGE}${TEXT_TEXT_URL}`, {
        foo: "baz",
      });
      assert.isTrue(formats.has(TEXT_TEXT_URL), "key");
      assert.deepEqual(formats.get(TEXT_TEXT_URL), {
        foo: "baz",
      }, "value");
    });
  });

  describe("create multiple tabs link text", () => {
    const func = mjs.createTabsLinkText;

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected Array but got Undefined.");
      });
    });

    it("should get string", async () => {
      const res = await func(["foo", "bar"]);
      assert.strictEqual(res, "foo\nbar", "result");
    });

    it("should get string", async () => {
      const res = await func(["foo", "bar"], MIME_PLAIN);
      assert.strictEqual(res, "foo\nbar", "result");
    });

    it("should get string", async () => {
      const res = await func(["foo", "bar"], MIME_HTML);
      assert.strictEqual(res, "foo<br />\nbar", "result");
    });
  });

  describe("create link text", () => {
    const {createLinkText: func, formatData} = mjs;

    it("should throw", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should throw", async () => {
      await func({formatId: "foo"}).catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should get string", async () => {
      const res = await func({
        formatId: "foo",
        template: "%content%%title%%url%",
      });
      assert.strictEqual(res, "", "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo [bar] baz",
        formatId: ASCIIDOC,
        template: formatData[ASCIIDOC].template,
        url: "https://example.com/foo bar",
      };
      const res = await func(data);
      assert.strictEqual(res,
                         "link:https://example.com/foo%20bar[foo [bar\\] baz]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        formatId: ASCIIDOC,
        template: formatData[ASCIIDOC].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "link:https://example.com/foo[]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo [bar] baz",
        formatId: BBCODE_TEXT,
        template: formatData[BBCODE_TEXT].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res,
                         "[url=https://example.com/foo]foo [bar] baz[/url]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "",
        formatId: BBCODE_TEXT,
        template: formatData[BBCODE_TEXT].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "[url=https://example.com/foo][/url]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "https://example.com/foo",
        formatId: BBCODE_URL,
        template: formatData[BBCODE_URL].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "[url]https://example.com/foo[/url]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" baz",
        formatId: HTML_HYPER,
        template: formatData[HTML_HYPER].template,
        title: "foo&bar",
        url: "https://example.com/foo?key=1&key2=2",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo?key=1&amp;key2=2\" title=\"foo&amp;bar\">foo &quot;bar&quot; baz</a>",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" baz",
        formatId: HTML_HYPER,
        template: formatData[HTML_HYPER].templateAlt,
        url: "https://example.com/foo?key=1&amp;key2=2",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo?key=1&amp;key2=2\">foo &quot;bar&quot; baz</a>",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "",
        formatId: HTML_HYPER,
        template: formatData[HTML_HYPER].templateAlt,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "<a href=\"https://example.com/foo\"></a>",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" baz",
        formatId: HTML_PLAIN,
        template: formatData[HTML_PLAIN].template,
        title: "foo&bar",
        url: "https://example.com/foo?key=1&key2=2",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo?key=1&amp;key2=2\" title=\"foo&amp;bar\">foo &quot;bar&quot; baz</a>",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" baz",
        formatId: HTML_PLAIN,
        template: formatData[HTML_PLAIN].templateAlt,
        url: "https://example.com/foo?key=1&amp;key2=2",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo?key=1&amp;key2=2\">foo &quot;bar&quot; baz</a>",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "\\backslash",
        formatId: LATEX,
        template: formatData[LATEX].template,
        title: "foobar",
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "\\href{https://example.com/foo}{\\textbackslash{}backslash}",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "",
        formatId: LATEX,
        template: formatData[LATEX].template,
        title: "foobar",
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "\\href{https://example.com/foo}{}", "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" [baz]",
        formatId: MARKDOWN,
        template: formatData[MARKDOWN].template,
        title: "foo&\"bar\"",
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "[foo &quot;bar&quot; \\[baz\\]](https://example.com/foo \"foo&amp;&quot;bar&quot;\")",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" [baz]",
        formatId: MARKDOWN,
        template: formatData[MARKDOWN].templateAlt,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "[foo &quot;bar&quot; \\[baz\\]](https://example.com/foo)",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        formatId: MARKDOWN,
        template: formatData[MARKDOWN].templateAlt,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "[](https://example.com/foo)", "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo [bar] baz",
        formatId: MEDIAWIKI,
        template: formatData[MEDIAWIKI].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res,
                         "[https://example.com/foo foo &#91;bar&#93; baz]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "",
        formatId: MEDIAWIKI,
        template: formatData[MEDIAWIKI].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res,
                         "[https://example.com/foo ]",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo `bar` <baz>",
        formatId: REST,
        template: formatData[REST].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res,
                         "`foo \\`bar\\` \\<baz\\> <https://example.com/foo>`_",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "",
        formatId: REST,
        template: formatData[REST].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res,
                         "` <https://example.com/foo>`_",
                         "result");
    });

    it("should get string", async () => {
      const data = {
        content: "foo (bar) <baz>",
        formatId: TEXTILE,
        template: formatData[TEXTILE].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "\"foo &#40;bar&#41; &lt;baz&gt;\":https://example.com/foo",
        "result",
      );
    });

    it("should get string", async () => {
      const data = {
        content: "",
        formatId: TEXTILE,
        template: formatData[TEXTILE].template,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(res, "\"\":https://example.com/foo", "result");
    });
  });
});
