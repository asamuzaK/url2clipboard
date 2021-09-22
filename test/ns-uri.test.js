/**
 * ns-uri.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import nsUri from '../src/mjs/ns-uri.js';

describe('ns-uri', () => {
  it('should get string', () => {
    const items = Object.entries(nsUri);
    for (const [key, value] of items) {
      assert.isString(key);
      assert.isString(value);
    }
  });
});
