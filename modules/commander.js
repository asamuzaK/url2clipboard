/**
 * commander.js
 */

/* api */
import { getType, throwErr } from './common.js';
import { createFile, isFile, mkdir, readFile, rm } from './file-util.js';
import { program as commander } from 'commander';
import path from 'path';
import process from 'process';

/* constants */
const CHAR = 'utf8';
const DIR_CWD = process.cwd();
const INDENT = 2;
const PATH_LIB = './src/lib';
const PATH_MODULE = './node_modules';

/**
 * create blink specific manifest.json
 *
 * @param {object} cmdOpts - command options
 * @returns {void}
 */
export const createBlinkManifest = async (cmdOpts = {}) => {
  const { clean, info } = cmdOpts;
  if (clean) {
    const dir = path.resolve(DIR_CWD, 'bundle');
    await rm(dir);
    await mkdir(dir);
  }
  const srcContent = await readFile(
    path.resolve(DIR_CWD, 'src', 'manifest.json'),
    {
      encoding: CHAR,
      flag: 'r'
    }
  );
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
  const filePath =
    await createFile(path.resolve(DIR_CWD, 'bundle', 'manifest.json'), content);
  if (filePath && info) {
    console.info(`Created: ${filePath}`);
  }
  return filePath;
};

/**
 * create blink specific files
 *
 * @param {object} cmdOpts - command options
 * @returns {Function} - promise chain
 */
export const createBlinkFiles = cmdOpts =>
  createBlinkManifest(cmdOpts).catch(throwErr);

/**
 * save library package info
 *
 * @param {Array} lib - library
 * @param {boolean} info - console info
 * @returns {string} - package.json file path
 */
export const saveLibraryPackage = async (lib, info) => {
  if (!Array.isArray(lib)) {
    throw new TypeError(`Expected Array but got ${getType(lib)}.`);
  }
  const [key, value] = lib;
  const {
    name: moduleName,
    origin: originUrl,
    repository,
    type,
    files
  } = value;
  const libPath = path.resolve(DIR_CWD, PATH_LIB, key);
  const modulePath = path.resolve(DIR_CWD, PATH_MODULE, moduleName);
  const pkgJsonPath = path.resolve(modulePath, 'package.json');
  const pkgJson = await readFile(pkgJsonPath, { encoding: CHAR, flag: 'r' });
  const {
    author, description, homepage, license, name, version
  } = JSON.parse(pkgJson);
  const origins = [];
  for (const item of files) {
    const {
      file,
      path: itemPath
    } = item;
    const itemFile = path.resolve(modulePath, itemPath);
    if (!isFile(itemFile)) {
      throw new Error(`${itemFile} is not a file.`);
    }
    const libFile = path.resolve(libPath, file);
    if (!isFile(libFile)) {
      throw new Error(`${libFile} is not a file.`);
    }
    origins.push({
      file,
      url: `${originUrl}@${version}/${itemPath}`
    });
  }
  const content = JSON.stringify({
    name,
    description,
    author,
    license,
    homepage,
    repository,
    type,
    version,
    origins
  }, null, INDENT);
  const filePath =
    await createFile(path.resolve(libPath, 'package.json'), content + '\n');
  if (filePath && info) {
    console.info(`Created: ${filePath}`);
  }
  return filePath;
};

/**
 * extract libraries
 *
 * @param {object} cmdOpts - command options
 * @returns {void}
 */
export const extractLibraries = async (cmdOpts = {}) => {
  const { dir, info } = cmdOpts;
  const libraries = {
    mozilla: {
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
  };
  const func = [];
  if (dir) {
    func.push(saveLibraryPackage([dir, libraries[dir]], info));
  } else {
    const items = Object.entries(libraries);
    for (const [key, value] of items) {
      func.push(saveLibraryPackage([key, value], info));
    }
  }
  const arr = await Promise.allSettled(func);
  for (const i of arr) {
    const { reason, status } = i;
    if (status === 'rejected' && reason) {
      console.trace(reason);
    }
  }
};

/**
 * include libraries
 *
 * @param {object} cmdOpts - command options
 * @returns {Function} - promise chain
 */
export const includeLibraries = cmdOpts =>
  extractLibraries(cmdOpts).catch(throwErr);

/**
 * parse command
 *
 * @param {Array} args - process.argv
 * @returns {void}
 */
export const parseCommand = args => {
  const reg = /^(?:(?:--)?help|-[h|v]|--version|c(?:ompat)?|i(?:nclude)?)$/;
  if (Array.isArray(args) && args.some(arg => reg.test(arg))) {
    commander.exitOverride();
    commander.version(process.env.npm_package_version, '-v, --version');
    commander.command('compat').alias('c')
      .description('create blink compatible files')
      .option('-c, --clean', 'clean directory')
      .option('-i, --info', 'console info')
      .action(createBlinkFiles);
    commander.command('include').alias('i')
      .description('include library packages')
      .option('-d, --dir <name>', 'specify library directory')
      .option('-i, --info', 'console info')
      .action(includeLibraries);
    commander.parse(args);
  }
};

/* For test */
export {
  commander
};
