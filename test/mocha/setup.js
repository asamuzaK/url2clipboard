/**
 * setup.js
 */
"use script";
const browser = require("sinon-chrome/webextensions");
global.browser = browser;
module.exports = {
  browser,
};
