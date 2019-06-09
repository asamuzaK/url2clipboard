/**
 * format.js
 */

export default {
  HTMLPlain: {
    id: "HTMLPlain",
    enabled: true,
    menu: "HTML (text/&plain)",
    template: "<a href=\"%url%\" title=\"%title%\">%content%</a>",
    templateAlt: "<a href=\"%url%\">%content%</a>",
    title: "HTML (text/plain)",
  },
  HTMLHyper: {
    id: "HTMLHyper",
    enabled: true,
    menu: "&HTML (text/html)",
    template: "<a href=\"%url%\" title=\"%title%\">%content%</a>",
    templateAlt: "<a href=\"%url%\">%content%</a>",
    title: "HTML (text/html)",
  },
  Markdown: {
    id: "Markdown",
    enabled: true,
    menu: "&Markdown",
    template: "[%content%](%url% \"%title%\")",
    templateAlt: "[%content%](%url%)",
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
    menu: "BB&Code (URL)",
    template: "[url]%content%[/url]",
    title: "BBCode (URL)",
  },
  Textile: {
    id: "Textile",
    enabled: true,
    menu: "Text&ile",
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
  TextURL: {
    id: "TextURL",
    enabled: true,
    menu: "&Text && URL",
    template: "%content% %url%",
    templateAlt: "%content%\n%url%",
  },
  TextOnly: {
    id: "TextOnly",
    enabled: true,
    menu: "Te&xt",
    template: "%content%",
    title: "Text",
  },
  URLOnly: {
    id: "URLOnly",
    enabled: true,
    menu: "&URL",
    template: "%url%",
    title: "URL",
  },
};
