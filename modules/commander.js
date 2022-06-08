/**
 * commander.js
 */

/* api */
import { getType, throwErr } from './common.js';
import { createFile, isFile, readFile } from './file-util.js';
import { createBlinkFiles } from './blink.js';
import { program as commander } from 'commander';
import path from 'path';
import process from 'process';

/* constants */
const CHAR = 'utf8';
const DIR_CWD = process.cwd();
const INDENT = 2;

/**
 * create blink compatible files
 *
 * @param {object} cmdOpts - command options
 * @returns {Function} - promise chain
 */
export const createBlinkCompatFiles = cmdOpts =>
  createBlinkFiles(cmdOpts).catch(throwErr);

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
  const libDir = path.resolve(DIR_CWD, 'src', 'lib', key);
  const moduleDir = path.resolve(DIR_CWD, 'node_modules', moduleName);
  const pkgJsonPath = path.join(moduleDir, 'package.json');
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
    const itemFile = path.join(moduleDir, itemPath);
    if (!isFile(itemFile)) {
      throw new Error(`${itemFile} is not a file.`);
    }
    const libFile = path.join(libDir, file);
    if (!isFile(libFile)) {
      throw new Error(`${libFile} is not a file.`);
    }
    origins.push({
      file,
      url: `${originUrl}@${version}/${itemPath}`
    });
  }
  const content = `${JSON.stringify({
    name,
    description,
    author,
    license,
    homepage,
    repository,
    type,
    version,
    origins
  }, null, INDENT)}\n`;
  const filePath = await createFile(path.join(libDir, 'package.json'), content);
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
      .action(createBlinkCompatFiles);
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
