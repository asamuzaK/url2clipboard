/* api */
import { strict as assert } from 'node:assert';
import path from 'node:path';
import process from 'node:process';
import { promises as fsPromise } from 'node:fs';
import { describe, it } from 'mocha';
import sinon from 'sinon';

/* test */
import {
  createBlinkFiles, createJsFiles, createManifest, createPolyfilledJsFile
} from '../scripts/blink.js';

/* constants */
const DIR_CWD = process.cwd();

describe('create manifest file', () => {
  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createManifest();
    const { calledOnce: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'not called');
    assert.strictEqual(res, path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createManifest(true);
    const { calledOnce: writeCalled } = stubWrite;
    const { calledOnce: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.strictEqual(res, path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      'result');
  });
});

describe('create polyfilled *.js file', () => {
  it('should throw', async () => {
    await createPolyfilledJsFile().catch(e => {
      assert.strictEqual(e instanceof TypeError, true, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.',
        'message');
    });
  });

  it('should throw', async () => {
    await createPolyfilledJsFile('foo.js').catch(e => {
      const msg =
        `${path.resolve(DIR_CWD, 'src', 'mjs', 'foo.js')} is not a file.`;
      assert.strictEqual(e instanceof Error, true, 'error');
      assert.strictEqual(e.message, msg, 'message');
    });
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('background.js');
    const { calledOnce: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'not called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('background.js', true);
    const { calledOnce: writeCalled } = stubWrite;
    const { calledOnce: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('offscreen.js');
    const { calledOnce: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'not called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('offscreen.js', true);
    const { calledOnce: writeCalled } = stubWrite;
    const { calledOnce: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('options.js');
    const { calledOnce: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'not called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('options.js', true);
    const { calledOnce: writeCalled } = stubWrite;
    const { calledOnce: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('popup.js');
    const { calledOnce: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'not called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js'), 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createPolyfilledJsFile('popup.js', true);
    const { calledOnce: writeCalled } = stubWrite;
    const { calledOnce: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.strictEqual(res,
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js'), 'result');
  });
});

describe('create blink specific *.js files', () => {
  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createJsFiles();
    const { called: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'called');
    assert.deepEqual(res, [
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'),
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'),
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'),
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js')
    ], 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createJsFiles(true);
    const { called: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.deepEqual(res, [
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'),
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'),
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'),
      path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js')
    ], 'result');
  });
});

describe('create blink compatible files', () => {
  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createBlinkFiles();
    const { called: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, false, 'called');
    assert.deepEqual(res, [
      path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      [
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js')
      ]
    ], 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createBlinkFiles({
      info: true
    });
    const { called: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.deepEqual(res, [
      path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      [
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js')
      ]
    ], 'result');
  });

  it('should call function', async () => {
    const stubMkdir = sinon.stub(fsPromise, 'mkdir');
    const stubRm = sinon.stub(fsPromise, 'rm');
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createBlinkFiles({
      clean: true,
      info: true
    });
    const { called: mkdirCalled } = stubMkdir;
    const { called: rmCalled } = stubRm;
    const { called: writeCalled } = stubWrite;
    const { called: infoCalled } = stubInfo;
    stubMkdir.restore();
    stubRm.restore();
    stubWrite.restore();
    stubInfo.restore();
    assert.strictEqual(mkdirCalled, true, 'called');
    assert.strictEqual(rmCalled, true, 'called');
    assert.strictEqual(writeCalled, true, 'called');
    assert.strictEqual(infoCalled, true, 'called');
    assert.deepEqual(res, [
      path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      [
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'background.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'offscreen.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'options.js'),
        path.resolve(DIR_CWD, 'bundle', 'mjs', 'popup.js')
      ]
    ], 'result');
  });
});
