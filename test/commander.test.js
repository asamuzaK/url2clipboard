/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { promises as fsPromise } from 'fs';
import path from 'path';
import process from 'process';
import sinon from 'sinon';

/* test */
import {
  commander, createBlinkFiles, createBlinkManifest, extractLibraries,
  includeLibraries, parseCommand, saveLibraryPackage
} from '../modules/commander.js';

/* constants */
const DIR_CWD = process.cwd();
const PATH_LIB = './src/lib';
const PATH_MODULE = './node_modules';

describe('createBlinkManifest', () => {
  it('should call function', async () => {
    const stubFunc = sinon.stub(fsPromise, 'writeFile');
    const stubMkdir = sinon.stub(fsPromise, 'mkdir');
    const stubRm = sinon.stub(fsPromise, 'rm');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createBlinkManifest();
    const { calledOnce: writeCalled } = stubFunc;
    const { called: mkdirCalled } = stubMkdir;
    const { called: rmCalled } = stubRm;
    const { called: infoCalled } = stubInfo;
    stubFunc.restore();
    stubMkdir.restore();
    stubRm.restore();
    stubInfo.restore();
    assert.isTrue(writeCalled, 'called');
    assert.isFalse(mkdirCalled, 'not called');
    assert.isFalse(rmCalled, 'not called');
    assert.isFalse(infoCalled, 'not called');
    assert.strictEqual(res, path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      'result');
  });

  it('should call function', async () => {
    const stubFunc = sinon.stub(fsPromise, 'writeFile');
    const stubMkdir = sinon.stub(fsPromise, 'mkdir');
    const stubRm = sinon.stub(fsPromise, 'rm');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createBlinkManifest({
      clean: true,
      info: true
    });
    const { calledOnce: writeCalled } = stubFunc;
    const { calledOnce: mkdirCalled } = stubMkdir;
    const { calledOnce: rmCalled } = stubRm;
    const { calledOnce: infoCalled } = stubInfo;
    stubFunc.restore();
    stubMkdir.restore();
    stubRm.restore();
    stubInfo.restore();
    assert.isTrue(writeCalled, 'called');
    assert.isTrue(mkdirCalled, 'not called');
    assert.isTrue(rmCalled, 'not called');
    assert.isTrue(infoCalled, 'called');
    assert.strictEqual(res, path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      'result');
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

  it('should call function', async () => {
    const stubFunc = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const res = await createBlinkManifest();
    const { calledOnce: writeCalled } = stubFunc;
    const { called: infoCalled } = stubInfo;
    stubFunc.restore();
    stubInfo.restore();
    assert.isTrue(writeCalled, 'called');
    assert.isFalse(infoCalled, 'called');
    assert.strictEqual(res, path.resolve(DIR_CWD, 'bundle', 'manifest.json'),
      'result');
  });
});

describe('save library package info', () => {
  it('should throw', async () => {
    await saveLibraryPackage().catch(e => {
      assert.instanceOf(e, TypeError);
      assert.strictEqual(e.message, 'Expected Array but got Undefined.');
    });
  });

  it('should throw', async () => {
    await saveLibraryPackage([]).catch(e => {
      assert.instanceOf(e, Error);
    });
  });

  it('should throw', async () => {
    await saveLibraryPackage([
      'foo'
    ]).catch(e => {
      assert.instanceOf(e, Error);
    });
  });

  it('should throw', async () => {
    await saveLibraryPackage([
      'foo',
      {
        name: 'foo'
      }
    ]).catch(e => {
      assert.instanceOf(e, Error);
    });
  });

  it('should throw', async () => {
    await saveLibraryPackage([
      'mozilla',
      {
        name: 'webextension-polyfill',
        origin: 'https://unpkg.com/webextension-polyfill',
        repository: {
          type: 'git',
          url: 'git+https://github.com/mozilla/webextension-polyfill.git'
        },
        type: 'commonjs',
        files: [
          {
            file: 'foo',
            path: 'foo.txt'
          }
        ]
      }
    ]).catch(e => {
      const filePath =
        path.resolve(DIR_CWD, PATH_MODULE, 'webextension-polyfill', 'foo.txt');
      assert.instanceOf(e, Error);
      assert.strictEqual(e.message, `${filePath} is not a file.`);
    });
  });

  it('should throw', async () => {
    await saveLibraryPackage([
      'mozilla',
      {
        name: 'webextension-polyfill',
        origin: 'https://unpkg.com/webextension-polyfill',
        repository: {
          type: 'git',
          url: 'git+https://github.com/mozilla/webextension-polyfill.git'
        },
        type: 'commonjs',
        files: [
          {
            file: 'foo',
            path: 'LICENSE'
          }
        ]
      }
    ]).catch(e => {
      const filePath = path.resolve(DIR_CWD, PATH_LIB, 'mozilla', 'foo');
      assert.instanceOf(e, Error);
      assert.strictEqual(e.message, `${filePath} is not a file.`);
    });
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const filePath = path.resolve(DIR_CWD, PATH_LIB, 'mozilla', 'package.json');
    const res = await saveLibraryPackage([
      'mozilla',
      {
        name: 'webextension-polyfill',
        origin: 'https://unpkg.com/webextension-polyfill',
        repository: {
          type: 'git',
          url: 'git+https://github.com/mozilla/webextension-polyfill.git'
        },
        type: 'commonjs',
        files: [
          {
            file: 'LICENSE',
            path: 'LICENSE'
          },
          {
            file: 'browser-polyfill.min.js',
            path: 'dist/browser-polyfill.min.js'
          },
          {
            file: 'browser-polyfill.min.js.map',
            path: 'dist/browser-polyfill.min.js.map'
          }
        ]
      }
    ]);
    const { called: infoCalled } = stubInfo;
    const { calledOnce: writeCalled } = stubWrite;
    stubInfo.restore();
    stubWrite.restore();
    assert.isTrue(writeCalled, 'called');
    assert.isFalse(infoCalled, 'not called');
    assert.strictEqual(res, filePath, 'result');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubInfo = sinon.stub(console, 'info');
    const filePath = path.resolve(DIR_CWD, PATH_LIB, 'mozilla', 'package.json');
    const res = await saveLibraryPackage([
      'mozilla',
      {
        name: 'webextension-polyfill',
        origin: 'https://unpkg.com/webextension-polyfill',
        repository: {
          type: 'git',
          url: 'git+https://github.com/mozilla/webextension-polyfill.git'
        },
        type: 'commonjs',
        files: [
          {
            file: 'LICENSE',
            path: 'LICENSE'
          },
          {
            file: 'browser-polyfill.min.js',
            path: 'dist/browser-polyfill.min.js'
          },
          {
            file: 'browser-polyfill.min.js.map',
            path: 'dist/browser-polyfill.min.js.map'
          }
        ]
      }
    ], true);
    const { calledOnce: writeCalled } = stubWrite;
    const { calledOnce: infoCalled } = stubInfo;
    stubWrite.restore();
    stubInfo.restore();
    assert.isTrue(writeCalled, 'called');
    assert.isTrue(infoCalled, 'called');
    assert.strictEqual(res, filePath, 'result');
  });
});

describe('extract libraries', () => {
  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubAll = sinon.stub(Promise, 'allSettled').resolves([
      {
        reason: new Error('error'),
        status: 'rejected'
      }
    ]);
    const stubTrace = sinon.stub(console, 'trace');
    const i = stubTrace.callCount;
    const j = stubWrite.callCount;
    await extractLibraries();
    const { callCount: traceCallCount } = stubTrace;
    const { callCount: writeCallCount } = stubWrite;
    stubAll.restore();
    stubTrace.restore();
    stubWrite.restore();
    assert.strictEqual(traceCallCount, i + 1, 'trace');
    assert.strictEqual(writeCallCount, j, 'write');
  });

  it('should not call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubAll = sinon.stub(Promise, 'allSettled').resolves([
      {
        status: 'resolved'
      }
    ]);
    const stubTrace = sinon.stub(console, 'trace');
    const i = stubTrace.callCount;
    const j = stubWrite.callCount;
    await extractLibraries();
    const { callCount: traceCallCount } = stubTrace;
    const { callCount: writeCallCount } = stubWrite;
    stubAll.restore();
    stubTrace.restore();
    stubWrite.restore();
    assert.strictEqual(traceCallCount, i, 'trace');
    assert.strictEqual(writeCallCount, j, 'write');
  });

  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubAll = sinon.stub(Promise, 'allSettled').resolves([
      {
        reason: new Error('error'),
        status: 'rejected'
      }
    ]);
    const stubTrace = sinon.stub(console, 'trace');
    const i = stubTrace.callCount;
    const j = stubWrite.callCount;
    const opt = {
      dir: 'mozilla'
    };
    await extractLibraries(opt);
    const { callCount: traceCallCount } = stubTrace;
    const { callCount: writeCallCount } = stubWrite;
    stubAll.restore();
    stubTrace.restore();
    stubWrite.restore();
    assert.strictEqual(traceCallCount, i + 1, 'trace');
    assert.strictEqual(writeCallCount, j, 'write');
  });

  it('should not call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubAll = sinon.stub(Promise, 'allSettled').resolves([
      {
        status: 'resolved'
      }
    ]);
    const stubTrace = sinon.stub(console, 'trace');
    const i = stubTrace.callCount;
    const j = stubWrite.callCount;
    const opt = {
      dir: 'mozilla'
    };
    await extractLibraries(opt);
    const { callCount: traceCallCount } = stubTrace;
    const { callCount: writeCallCount } = stubWrite;
    stubAll.restore();
    stubTrace.restore();
    stubWrite.restore();
    assert.strictEqual(traceCallCount, i, 'trace');
    assert.strictEqual(writeCallCount, j, 'write');
  });
});

describe('include libraries', () => {
  it('should call function', async () => {
    const stubWrite = sinon.stub(fsPromise, 'writeFile');
    const stubAll = sinon.stub(Promise, 'allSettled').resolves([
      {
        reason: new Error('error'),
        status: 'rejected'
      }
    ]);
    const stubTrace = sinon.stub(console, 'trace');
    const i = stubTrace.callCount;
    const j = stubWrite.callCount;
    const res = await includeLibraries();
    const { callCount: traceCallCount } = stubTrace;
    const { callCount: writeCallCount } = stubWrite;
    stubAll.restore();
    stubTrace.restore();
    stubWrite.restore();
    assert.strictEqual(traceCallCount, i + 1, 'trace');
    assert.strictEqual(writeCallCount, j, 'write');
    assert.isUndefined(res, 'result');
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
});
