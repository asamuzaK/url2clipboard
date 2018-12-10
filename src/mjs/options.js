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
  setValuesFromStorage,
} from "./options-main.js";

/* startup */
Promise.all([
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
]).catch(throwErr);
