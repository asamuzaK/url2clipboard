/**
 * popup.js
 */

/* shared */
import { throwErr } from './common.js';
import {
  handleMsg, startup
} from './popup-main.js';

/* api */
const { runtime } = browser;

/* listeners */
runtime.onMessage.addListener(msg => handleMsg(msg).catch(throwErr));

/* startup */
document.addEventListener('DOMContentLoaded', () => startup().catch(throwErr));
