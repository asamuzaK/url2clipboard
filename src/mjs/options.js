/**
 * options.js
 */

import {
  throwErr,
} from "./common.js";
import {
  localizeHtml,
} from "./localize.js";
import {
  addInputChangeListener,
  disableIncompatItems,
  setValuesFromStorage,
} from "./options-main.js";

/* startup */
Promise.all([
  disableIncompatItems(),
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
]).catch(throwErr);
