/**
 * background.js
 */

/* shared */
import { throwErr } from './common.js';
import { getAllStorage } from './browser.js';
import {
  createContextMenu, extractClickedData, handleActiveTab, handleCmd,
  handleMenusOnShown, handleMsg, handleUpdatedTab, removeEnabledTab,
  setFormatData, setVars
} from './main.js';

/* api */
const { commands, runtime, storage, tabs } = browser;
const menus = browser.menus || browser.contextMenus;

/* listeners */
commands.onCommand.addListener(cmd =>
  handleCmd(cmd).catch(throwErr)
);
menus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
menus.onShown && menus.onShown.addListener((info, tab) =>
  handleMenusOnShown(info, tab).catch(throwErr)
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
document.addEventListener('DOMContentLoaded', () =>
  setFormatData().then(getAllStorage).then(setVars).then(createContextMenu)
    .catch(throwErr));
