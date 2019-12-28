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
  disableIncompatibleInputs,
} from "./compat.js";
import {
  addInputChangeListener,
  setValuesFromStorage,
} from "./options-main.js";

/* startup */
Promise.all([
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
  disableIncompatibleInputs(),
]).catch(throwErr);
