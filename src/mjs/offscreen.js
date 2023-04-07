/**
 * offscreen.js
 */

/* shared */
import { throwErr } from './common.js';
import { handleMsg } from './offscreen-main.js';

/* api */
const { runtime } = browser;

/* listener */
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
