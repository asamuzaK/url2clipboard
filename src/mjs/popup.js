/**
 * popup.js
 */

import {
  throwErr,
} from "./common.js";
import {
  getActiveTab,
  getAllStorage,
} from "./browser.js";
import {localizeHtml} from "./localize.js";
import {
  addListenerToMenu, handleMsg, requestContextInfo, setFormatData, setTabInfo,
  setVars, toggleMenuItem,
} from "./popup-main.js";

/* api */
const {runtime, storage} = browser;

/* listeners */
storage.onChanged.addListener(data =>
  setVars(data).then(toggleMenuItem).catch(throwErr),
);
runtime.onMessage.addListener(msg => handleMsg(msg).catch(throwErr));

/* startup */
Promise.all([
  localizeHtml(),
  addListenerToMenu(),
  getActiveTab().then(tab => Promise.all([
    requestContextInfo(tab),
    setTabInfo(tab),
  ])),
  setFormatData().then(getAllStorage).then(setVars).then(toggleMenuItem),
]).catch(throwErr);
