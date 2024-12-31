/**
 * ns-uri.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import nsUri from '../src/mjs/ns-uri.js';

describe('ns-uri', () => {
  it('should get string', () => {
    const items = Object.entries(nsUri);
    for (const [key, value] of items) {
      assert.strictEqual(typeof key, 'string');
      assert.strictEqual(typeof value, 'string');
    }
  });
});
