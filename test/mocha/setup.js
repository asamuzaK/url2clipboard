/**
 * setup.js
 */

"use strict";
const {JSDOM} = require("jsdom");
const sinon = require("sinon");
const browser = require("sinon-chrome/webextensions");

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

const {window} = createJsdom();
const {document} = window;

browser.contextMenus.create = sinon.stub();
browser.contextMenus.remove = sinon.stub();
browser.contextMenus.removeAll = sinon.stub();
browser.contextMenus.update = sinon.stub();
browser.i18n.getMessage.callsFake((...args) => args.toString());

global.browser = browser;
global.window = window;
global.document = document;

module.exports = {
  browser,
};
