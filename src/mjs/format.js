/**
 * format.js
 */

export default {
  HTML: {
    id: "HTML",
    enabled: true,
    menu: "&HTML",
    template: "<a href=\"%url%\" title=\"%title%\">%content%</a>",
    templateWithoutTitle: "<a href=\"%url%\">%content%</a>",
  },
  Markdown: {
    id: "Markdown",
    enabled: true,
    menu: "&Markdown",
    template: "[%content%](%url% \"%title%\")",
    templateWithoutTitle: "[%content%](%url%)",
  },
  BBCodeText: {
    id: "BBCodeText",
    enabled: true,
    menu: "&BBCode (Text)",
    template: "[url=%url%]%content%[/url]",
    title: "BBCode (Text)",
  },
  BBCodeURL: {
    id: "BBCodeURL",
    enabled: true,
    menu: "BBCode (&URL)",
    template: "[url]%content%[/url]",
    title: "BBCode (URL)",
  },
  Textile: {
    id: "Textile",
    enabled: true,
    menu: "Te&xtile",
    template: "\"%content%\":%url%",
  },
  AsciiDoc: {
    id: "AsciiDoc",
    enabled: true,
    menu: "&AsciiDoc",
    template: "link:%url%[%content%]",
  },
  MediaWiki: {
    id: "MediaWiki",
    enabled: true,
    menu: "Media&Wiki",
    template: "[%url% %content%]",
  },
  Jira: {
    id: "Jira",
    enabled: true,
    menu: "&Jira",
    template: "[%content%|%url%]",
  },
  reStructuredText: {
    id: "reStructuredText",
    enabled: true,
    menu: "&reStructuredText",
    template: "`%content% <%url%>`_",
  },
  LaTeX: {
    id: "LaTeX",
    enabled: true,
    menu: "&LaTeX",
    template: "\\href{%url%}{%content%}",
  },
  Text: {
    id: "Text",
    enabled: true,
    menu: "&Text",
    template: "%content% %url%",
  },
};
