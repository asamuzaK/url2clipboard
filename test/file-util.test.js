/* api */
import { strict as assert } from 'node:assert';
import fs, { promises as fsPromise } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

/* test */
import {
  createFile, getStat, isDir, isFile, mkdir, readFile, removeDir, rm
} from '../scripts/file-util.js';

/* constants */
const TMPDIR = process.env.TMP || process.env.TMPDIR || process.env.TEMP ||
               os.tmpdir();

describe('getStat', () => {
  it('should be an object', () => {
    const p = path.resolve('test', 'file', 'test.txt');
    assert.strictEqual(typeof getStat(p), 'object', 'result');
    assert.notDeepEqual(getStat(p), null, 'result');
  });

  it('should get null if given argument is not string', () => {
    assert.strictEqual(getStat(), null);
  });

  it('should get null if file does not exist', () => {
    const p = path.resolve('test', 'file', 'foo.txt');
    assert.strictEqual(getStat(p), null);
  });
});

describe('isDir', () => {
  it('should get true if dir exists', () => {
    const p = path.resolve(path.join('test', 'file'));
    assert.strictEqual(isDir(p), true);
  });

  it('should get false if dir does not exist', () => {
    const p = path.resolve(path.join('test', 'foo'));
    assert.strictEqual(isDir(p), false);
  });
});

describe('isFile', () => {
  it('should get true if file exists', () => {
    const p = path.resolve('test', 'file', 'test.txt');
    assert.strictEqual(isFile(p), true);
  });

  it('should get false if file does not exist', () => {
    const p = path.resolve('test', 'file', 'foo.txt');
    assert.strictEqual(isFile(p), false);
  });
});

describe('make directory', () => {
  it('should throw', async () => {
    await mkdir().catch(e => {
      assert.strictEqual(e instanceof TypeError, true, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });

  it('should call function', async () => {
    const stubFunc = sinon.stub(fsPromise, 'mkdir');
    const dirPath = path.join(TMPDIR, 'withexeditor');
    const res = await mkdir(dirPath, {
      recursive: true
    });
    const { calledOnce: mkdirCalled } = stubFunc;
    stubFunc.restore();
    assert.strictEqual(mkdirCalled, true, 'called');
    assert.strictEqual(res, dirPath, 'result');
  });
});

describe('remove files and directories', () => {
  it('should throw', async () => {
    await rm().catch(e => {
      assert.strictEqual(e instanceof TypeError, true, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });

  it('should call function', async () => {
    const stubFunc = sinon.stub(fsPromise, 'rm');
    const dirPath = path.join(TMPDIR, 'withexeditor');
    await rm(dirPath, {
      force: true,
      recursive: true
    });
    const { calledOnce: rmCalled } = stubFunc;
    stubFunc.restore();
    assert.strictEqual(rmCalled, true, 'called');
  });
});

describe('removeDir', () => {
  it('should throw', () => {
    const foo = path.resolve('foo');
    assert.strictEqual(isDir(foo), false);
    assert.throws(() => removeDir(foo), Error, `No such directory: ${foo}`);
  });

  it("should remove dir and it's files", async () => {
    const dirPath = path.join(TMPDIR, 'url-sanitizer');
    fs.mkdirSync(dirPath);
    const subDirPath = path.join(dirPath, 'foo');
    fs.mkdirSync(subDirPath);
    const filePath = path.join(subDirPath, 'test.txt');
    const value = 'test file.\n';
    await fsPromise.writeFile(filePath, value, {
      encoding: 'utf8', flag: 'w', mode: 0o666
    });
    const res1 = await Promise.all([
      fs.existsSync(dirPath),
      fs.existsSync(subDirPath),
      fs.existsSync(filePath)
    ]);
    removeDir(dirPath);
    const res2 = await Promise.all([
      fs.existsSync(dirPath),
      fs.existsSync(subDirPath),
      fs.existsSync(filePath)
    ]);
    assert.deepEqual(res1, [true, true, true]);
    assert.deepEqual(res2, [false, false, false]);
  });
});

describe('readFile', () => {
  it('should throw', async () => {
    await readFile('foo/bar').catch(e => {
      assert.strictEqual(e.message, 'foo/bar is not a file.');
    });
  });

  it('should get file', async () => {
    const p = path.resolve('test', 'file', 'test.txt');
    const opt = { encoding: 'utf8', flag: 'r' };
    const file = await readFile(p, opt);
    assert.strictEqual(file, 'test file\n');
  });
});

describe('createFile', () => {
  const dirPath = path.join(TMPDIR, 'withexeditor');
  beforeEach(() => {
    fs.rmSync(dirPath, { force: true, recursive: true });
  });
  afterEach(() => {
    fs.rmSync(dirPath, { force: true, recursive: true });
  });

  it('should get string', async () => {
    fs.mkdirSync(dirPath);
    const filePath = path.join(dirPath, 'test.txt');
    const value = 'test file.\n';
    const file = await createFile(filePath, value);
    assert.strictEqual(file, filePath);
  });

  it('should throw if first argument is not a string', () => {
    createFile().catch(e => {
      assert.strictEqual(e instanceof TypeError, true, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });

  it('should throw if second argument is not a string', () => {
    const file = path.join(dirPath, 'test.txt');
    createFile(file).catch(e => {
      assert.strictEqual(e instanceof TypeError, true, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });
});
