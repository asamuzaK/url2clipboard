/**
 * blink-compat.js
 */

/* api */
import { throwErr } from '../src/mjs/common.js';
import { program as commander } from 'commander';
import fs, { promises as fsPromise } from 'fs';
import path from 'path';
import process from 'process';

/* constants */
const CHAR = 'utf8';
const DIR_CWD = process.cwd();
const PERM_FILE = 0o644;

/**
 * create blink specific manifest.json
 *
 * @returns {void}
 */
export const createBlinkManifest = async () => {
  const srcPath = path.resolve(DIR_CWD, 'src', 'manifest.json');
  const srcContent = fs.readFileSync(srcPath, {
    encoding: CHAR,
    flag: 'r'
  });
  const manifest = JSON.parse(srcContent);
  const replaceItems = {
    icons: {
      16: 'img/icon-outline-16.png',
      32: 'img/icon-outline-32.png',
      64: 'img/icon-color.png',
      128: 'img/icon-color-128.png'
    }
  };
  const items = Object.entries(replaceItems);
  for (const [key, value] of items) {
    manifest[key] = value;
  }
  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  const filePath = path.resolve(DIR_CWD, 'bundle', 'manifest.json');
  await fsPromise.writeFile(filePath, content, {
    encoding: CHAR,
    flag: 'w',
    mode: PERM_FILE
  });
};

/**
 * create blink specific files
 *
 * @returns {Promise.<Array>} - promise chain
 */
export const createBlinkFiles = () => Promise.all([
  createBlinkManifest()
]).catch(throwErr);

/**
 * parse command
 *
 * @param {Array} args - process.argv
 * @returns {void}
 */
export const parseCommand = args => {
  const reg = /^(?:(?:--)?help|-[h|v]|--version|c(?:ompat)?)$/;
  if (Array.isArray(args) && args.some(arg => reg.test(arg))) {
    commander.exitOverride();
    commander.version(process.env.npm_package_version, '-v, --version');
    commander.command('compat').alias('c')
      .description('create blink compatible files')
      .action(createBlinkFiles);
    commander.parse(args);
  }
};

/* For test */
export {
  commander
};
