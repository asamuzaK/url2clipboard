/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { promises as fsPromise } from 'fs';
import sinon from 'sinon';

/* test */
import {
  commander, createBlinkFiles, createBlinkManifest, parseCommand
} from '../modules/blink-compat.js';

describe('createBlinkManifest', () => {
  it('should throw', async () => {
    const stubFunc =
      sinon.stub(fsPromise, 'writeFile').rejects(new Error('error'));
    await createBlinkManifest().catch(e => {
      assert.instanceOf(e, Error, 'error');
      assert.strictEqual(e.message, 'error', 'message');
    });
    stubFunc.restore();
  });

  it('should throw', async () => {
    const stubFunc = sinon.stub(fsPromise, 'writeFile');
    const i = stubFunc.callCount;
    await createBlinkManifest();
    assert.strictEqual(stubFunc.callCount, i + 1, 'called');
    stubFunc.restore();
  });
});

describe('create blink compat files', () => {
  it('should throw', async () => {
    const stubFunc =
      sinon.stub(fsPromise, 'writeFile').rejects(new Error('error'));
    await createBlinkFiles().catch(e => {
      assert.instanceOf(e, Error, 'error');
      assert.strictEqual(e.message, 'error', 'message');
    });
    stubFunc.restore();
  });

  it('should get result', async () => {
    const stubFunc = sinon.stub(fsPromise, 'writeFile');
    const i = stubFunc.callCount;
    const res = await createBlinkFiles();
    assert.strictEqual(stubFunc.callCount, i + 1, 'called');
    assert.deepEqual(res, [undefined], 'result');
    stubFunc.restore();
  });
});

describe('parse command', () => {
  it('should not parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const i = stubParse.callCount;
    parseCommand();
    assert.strictEqual(stubParse.callCount, i, 'not called');
    stubParse.restore();
  });

  it('should not parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const i = stubParse.callCount;
    parseCommand([]);
    assert.strictEqual(stubParse.callCount, i, 'not called');
    stubParse.restore();
  });

  it('should not parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const i = stubParse.callCount;
    parseCommand(['foo', 'bar', 'baz']);
    assert.strictEqual(stubParse.callCount, i, 'not called');
    stubParse.restore();
  });

  it('should parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const stubVer = sinon.stub(commander, 'version');
    const i = stubParse.callCount;
    const j = stubVer.callCount;
    parseCommand(['foo', 'bar', '-v']);
    assert.strictEqual(stubParse.callCount, i + 1, 'called');
    assert.strictEqual(stubVer.callCount, j + 1, 'called');
    stubParse.restore();
    stubVer.restore();
  });

  it('should parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const stubVer = sinon.stub(commander, 'version');
    const i = stubParse.callCount;
    const j = stubVer.callCount;
    parseCommand(['foo', 'bar', 'c']);
    assert.strictEqual(stubParse.callCount, i + 1, 'called');
    assert.strictEqual(stubVer.callCount, j + 1, 'called');
    stubParse.restore();
    stubVer.restore();
  });

  it('should parse', () => {
    const stubParse = sinon.stub(commander, 'parse');
    const stubVer = sinon.stub(commander, 'version');
    const i = stubParse.callCount;
    const j = stubVer.callCount;
    parseCommand(['foo', 'bar', 'compat']);
    assert.strictEqual(stubParse.callCount, i + 1, 'called');
    assert.strictEqual(stubVer.callCount, j + 1, 'called');
    stubParse.restore();
    stubVer.restore();
  });
});
