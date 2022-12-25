/**
 * background.js
 */

/* shared */
import { throwErr } from './common.js';
import {
  extractClickedData, handleActiveTab, handleCmd, handleMsg, handleStorage,
  handleUpdatedTab, startup
} from './main.js';
import { handleMenusOnShown } from './menu.js';

/* api */
const { commands, runtime, storage, tabs } = browser;
const menus = browser.menus ?? browser.contextMenus;

/* listeners */
commands.onCommand.addListener(cmd =>
  handleCmd(cmd).catch(throwErr)
);
menus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
menus.onShown?.addListener((info, tab) =>
  handleMenusOnShown(info, tab).catch(throwErr)
);
storage.onChanged.addListener((data, area) =>
  handleStorage(data, area, true).catch(throwErr)
);
runtime.onInstalled.addListener(() => startup().catch(throwErr));
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
runtime.onStartup.addListener(() => startup().catch(throwErr));
tabs.onActivated.addListener(info =>
  handleActiveTab(info).catch(throwErr)
);
tabs.onUpdated.addListener((tabId, info, tab) =>
  handleUpdatedTab(tabId, info, tab).catch(throwErr)
);
