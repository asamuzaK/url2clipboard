/**
 * background.js
 */

import {
  throwErr,
} from "./common.js";
import {
  getAllStorage,
} from "./browser.js";
import {
  extractClickedData, handleActiveTab, handleMsg, handleUpdatedTab,
  prepareUI, removeEnabledTab, setDefaultIcon, setFormatData, setVars,
} from "./main.js";

/* api */
const {contextMenus, runtime, storage, tabs} = browser;

contextMenus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
storage.onChanged.addListener(data =>
  setVars(data).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
tabs.onActivated.addListener(info =>
  handleActiveTab(info).catch(throwErr)
);
tabs.onRemoved.addListener(tabId =>
  removeEnabledTab(tabId).catch(throwErr)
);
tabs.onUpdated.addListener((tabId, info, tab) =>
  handleUpdatedTab(tabId, info, tab).catch(throwErr)
);

/* startup */
document.addEventListener("DOMContentLoaded", () => Promise.all([
  setFormatData(),
  setDefaultIcon(),
]).then(getAllStorage).then(setVars).then(prepareUI).catch(throwErr));
