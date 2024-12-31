/**
 * constant.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import * as mjs from '../src/mjs/constant.js';

describe('constants', () => {
  const items = Object.entries(mjs);
  for (const [key, value] of items) {
    it('should get string', () => {
      assert.strictEqual(typeof key, 'string');
      assert.strictEqual(typeof value, 'string');
    });
  }
});
