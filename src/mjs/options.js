/**
 * options.js
 */

/* shared */
import { throwErr } from './common.js';
import { localizeHtml } from './localize.js';
import { showToolbarIconOptions } from './compat.js';
import {
  addInputChangeListener, setValuesFromStorage
} from './options-main.js';

/* startup */
Promise.all([
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
  showToolbarIconOptions()
]).catch(throwErr);
