/**
 * setup.js
 */

"use strict";
const {JSDOM} = require("jsdom");
const {Schema} = require("webext-schema");
const Api = require("sinon-chrome/api");
const sinon = require("sinon");

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

const schema = new Schema("central").arrange({name: "sinon-chrome"});
const browser = new Api(schema).create();

/* mock runtime.Port */
class Port {
  /**
   * Create stubbed object
   * @param {Object} opt - options
   */
  constructor(opt = {}) {
    this.name = opt.name;
    this.sender = opt.sender;
    this.error = {
      message: sinon.stub(),
    };
    this.onDisconnect = {
      addListener: sinon.stub(),
      removeListener: sinon.stub(),
    };
    this.onMessage = {
      addListener: sinon.stub(),
      removeListener: sinon.stub(),
    };
    this.disconnect = sinon.stub();
    this.postMessage = sinon.stub();
  }
}

browser.runtime.Port = Port;
browser.runtime.connect.returns(new Port());
browser.runtime.connectNative.callsFake(name => new Port({name}));
browser.i18n.getMessage.callsFake((...args) => args.toString());

global.window = window;
global.document = document;
global.browser = browser;

module.exports = {
  browser,
};
