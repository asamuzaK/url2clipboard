/**
 * setup.js
 */

"use strict";
const {JSDOM} = require("jsdom");
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

global.browser = browser;
global.window = window;
global.document = document;

module.exports = {
  browser,
};
