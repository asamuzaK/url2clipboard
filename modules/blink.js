/**
 * blink.js
 */

/* api */
import { getType, isString } from './common.js';
import { createFile, mkdir, readFile, rm } from './file-util.js';
import path from 'path';
import process from 'process';

/* constants */
const CHAR = 'utf8';
const DIR_CWD = process.cwd();
const DIR_OUT = path.resolve(DIR_CWD, 'bundle');
const DIR_SRC = path.resolve(DIR_CWD, 'src');
const INDENT = 2;

/**
 * create blink specific manifest.json
 *
 * @param {boolean} info - console info
 * @returns {string} - file path
 */
export const createManifest = async info => {
  const srcContent = await readFile(path.join(DIR_SRC, 'manifest.json'), {
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
  const content = `${JSON.stringify(manifest, null, INDENT)}\n`;
  const filePath =
    await createFile(path.join(DIR_OUT, 'manifest.json'), content);
  if (filePath && info) {
    console.info(`Created: ${filePath}`);
  }
  return filePath;
};

/**
 * create polyfilled *.js file
 *
 * @param {string} file - file path
 * @param {boolean} info - console info
 * @returns {string} - file path
 */
export const createPolyfilledJsFile = async (file, info) => {
  if (!isString(file)) {
    throw new TypeError(`Expected String but got ${getType(file)}.`);
  }
  const srcContent = await readFile(path.join(DIR_SRC, 'mjs', file), {
    encoding: CHAR,
    flag: 'r'
  });
  const arr = srcContent.split('\n');
  const i = arr.findIndex(str => /^import\s/.test(str));
  if (i > -1) {
    const includeStr = "import '../lib/mozilla/browser-polyfill.min.js';";
    arr.splice(i, 0, includeStr);
  }
  const content = arr.join('\n');
  const dir = await mkdir(path.join(DIR_OUT, 'mjs'));
  const filePath = await createFile(path.join(dir, file), content);
  if (filePath && info) {
    console.info(`Created: ${filePath}`);
  }
  return filePath;
};

/**
 * create blink specific *.js files
 *
 * @param {boolean} info - console info
 * @returns {Promise.<Array>} - results of each handler
 */
export const createJsFiles = async info => {
  const files = [
    'background.js',
    'options.js',
    'popup.js'
  ];
  const func = [];
  for (const file of files) {
    func.push(createPolyfilledJsFile(file, info));
  }
  return Promise.all(func);
};

/**
 * create blink specific files
 *
 * @param {object} cmdOpts - command options
 * @returns {Promise.<Array>} - results of each handler
 */
export const createBlinkFiles = async (cmdOpts = {}) => {
  const { clean, info } = cmdOpts;
  if (clean) {
    await rm(DIR_OUT);
    await mkdir(DIR_OUT);
  }
  const func = [
    createManifest(info),
    createJsFiles(info)
  ];
  return Promise.all(func);
};
