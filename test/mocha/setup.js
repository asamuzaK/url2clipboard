/**
 * setup.js
 */

"use strict";
const {JSDOM} = require("jsdom");
const {Schema} = require("webext-schema");
const sinon = require("sinon");

/**
 * create jsdom
 * @returns {Object} - jsdom instance
 */
const createJsdom = () => {
  const domstr = "<!DOCTYPE html><html><head></head><body></body></html>";
  const opt = {
    runScripts: "dangerously",
    url: "https://localhost",
    beforeParse(window) {
      window.prompt = sinon.stub().callsFake((...args) => args.toString());
    },
  };
  return new JSDOM(domstr, opt);
};

const {window} = createJsdom();
const {document} = window;

const browser = new Schema("central").mock();

browser.i18n.getMessage.callsFake((...args) => args.toString());
browser.permissions.contains.resolves(true);

global.window = window;
global.document = document;
global.browser = browser;

module.exports = {
  browser,
};
