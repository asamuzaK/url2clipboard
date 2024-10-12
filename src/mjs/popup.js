/**
 * popup.js
 */

/* shared */
import { throwErr } from './common.js';
import { handleMsg, startup } from './popup-main.js';

/* api */
const { runtime } = browser;

/* listeners */
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);

/* startup */
Promise.all([
  startup()
]).catch(throwErr);
