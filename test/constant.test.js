/**
 * constant.test.js
 */

import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as mjs from '../src/mjs/constant.js';

describe('constants', () => {
  const items = Object.entries(mjs);
  for (const [key, value] of items) {
    it('should get string', () => {
      assert.isString(key);
      assert.isString(value);
    });
  }
});
