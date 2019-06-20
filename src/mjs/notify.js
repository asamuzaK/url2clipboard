/**
 * notify.js
 */

import {
  createNotification,
} from "./browser.js";

/* api */
const {i18n, runtime} = browser;

/* constants */
import {
  ICON, NOTIFY_COPY,
} from "./constant.js";

/**
 * notify on copy
 * @returns {AsyncFunction} - createNotification()
 */
export const notifyOnCopy = async () => {
  const msg = {
    iconUrl: runtime.getURL(ICON),
    message: i18n.getMessage("notifyOnCopyMsg"),
    title: i18n.getMessage("extensionName"),
    type: "basic",
  };
  return createNotification(NOTIFY_COPY, msg);
};
