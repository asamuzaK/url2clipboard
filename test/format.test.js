/**
 * format.test.js
 */
/* eslint-disable  max-nested-callbacks, no-await-in-loop, no-magic-numbers */

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/format.js";
import {
  ASCIIDOC, BBCODE_TEXT, BBCODE_URL, HTML_HYPER, HTML_PLAIN, JIRA, LATEX,
  MARKDOWN, MEDIAWIKI, MIME_HTML, MIME_PLAIN, REST, TEXTILE,
  TEXT_TEXT_ONLY, TEXT_TEXT_URL, TEXT_URL_ONLY,
} from "../src/mjs/constant.js";

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
      ASCIIDOC, BBCODE_TEXT, BBCODE_URL, HTML_HYPER, HTML_PLAIN, JIRA, LATEX,
      MARKDOWN, MEDIAWIKI, REST, TEXTILE, TEXT_TEXT_ONLY, TEXT_TEXT_URL,
      TEXT_URL_ONLY,
    ];
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

  describe("create all tabs link text", () => {
    const func = mjs.createAllTabsLinkText;

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
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo\" title=\"foo&amp;bar\">foo &quot;bar&quot; baz</a>",
        "result"
      );
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" baz",
        formatId: HTML_HYPER,
        template: formatData[HTML_HYPER].templateAlt,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo\">foo &quot;bar&quot; baz</a>",
        "result"
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
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo\" title=\"foo&amp;bar\">foo &quot;bar&quot; baz</a>",
        "result"
      );
    });

    it("should get string", async () => {
      const data = {
        content: "foo \"bar\" baz",
        formatId: HTML_PLAIN,
        template: formatData[HTML_PLAIN].templateAlt,
        url: "https://example.com/foo",
      };
      const res = await func(data);
      assert.strictEqual(
        res,
        "<a href=\"https://example.com/foo\">foo &quot;bar&quot; baz</a>",
        "result"
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
        "result"
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
        "result"
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
        "result"
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
        "result"
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
