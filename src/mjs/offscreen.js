/**
 * offscreen.js
 */

/* shared */
import { handleMsg } from './offscreen-main.js';

/* api */
const { runtime } = browser;

/* listener */
runtime.onMessage.addListener(handleMsg);
