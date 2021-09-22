/**
 * setup.js
 */

import { JSDOM } from 'jsdom';
import { Schema } from 'webext-schema';
import sinon from 'sinon';

/**
 * create jsdom
 *
 * @returns {object} - jsdom instance
 */
export const createJsdom = () => {
  const domstr = '<!DOCTYPE html><html><head></head><body></body></html>';
  const opt = {
    runScripts: 'dangerously',
    url: 'https://localhost',
    beforeParse(window) {
      window.prompt = sinon.stub().callsFake((...args) => args.toString());
    }
  };
  return new JSDOM(domstr, opt);
};

const { window } = createJsdom();
const { document } = window;

/**
 * get channel
 *
 * @returns {string} - channel
 */
const getChannel = () => {
  let ch;
  const reg = /(?<=--channel=)[a-z]+/;
  const args = process.argv.filter(arg => reg.test(arg));
  if (args.length) {
    [ch] = reg.exec(args);
  } else {
    ch = 'beta';
  }
  return ch;
};

const channel = getChannel();

console.log(`Channel: ${channel}`);

export const browser = new Schema(channel).mock();

browser.i18n.getMessage.callsFake((...args) => args.toString());
browser.permissions.contains.resolves(true);

global.window = window;
global.document = document;
global.browser = browser;

const globalKeys = ['Node'];
for (const key of globalKeys) {
  if (window[key] && !global[key]) {
    global[key] = window[key];
  }
}
