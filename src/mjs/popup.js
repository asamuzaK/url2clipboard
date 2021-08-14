/**
 * popup.js
 */

/* shared */
import { throwErr } from './common.js';
import { getAllStorage } from './browser.js';
import { localizeHtml } from './localize.js';
import {
  addListenerToMenu, handleMsg, prepareTab, setFormatData, setVars,
  toggleMenuItem
} from './popup-main.js';

/* api */
const { runtime, storage } = browser;

/* listeners */
storage.onChanged.addListener(data =>
  setVars(data).then(toggleMenuItem).catch(throwErr)
);
runtime.onMessage.addListener(msg => handleMsg(msg).catch(throwErr));

/* startup */
Promise.all([
  localizeHtml(),
  addListenerToMenu(),
  prepareTab(),
  setFormatData().then(getAllStorage).then(setVars).then(toggleMenuItem)
]).catch(throwErr);
