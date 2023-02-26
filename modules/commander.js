/**
 * commander.js
 */

/* api */
import path from 'node:path';
import process from 'node:process';
import { program as commander } from 'commander';
import { createBlinkFiles } from './blink.js';
import { getType, throwErr } from './common.js';
import { createFile, isDir, isFile, readFile, removeDir } from './file-util.js';

/* constants */
const CHAR = 'utf8';
const DIR_CWD = process.cwd();
const INDENT = 2;

/**
 * create blink compatible files
 *
 * @param {object} cmdOpts - command options
 * @returns {Promise} - promise chain
 */
export const createBlinkCompatFiles = cmdOpts =>
  createBlinkFiles(cmdOpts).catch(throwErr);

/**
 * save library package info
 *
 * @param {Array} lib - library
 * @param {boolean} info - console info
 * @returns {Promise.<string>} - package.json file path
 */
export const saveLibraryPackage = async (lib, info) => {
  if (!Array.isArray(lib)) {
    throw new TypeError(`Expected Array but got ${getType(lib)}.`);
  }
  const [key, value] = lib;
  const {
    files,
    repository,
    type,
    vPrefix,
    cdn: cdnUrl,
    name: moduleName,
    raw: rawUrl
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
    const fileMap = new Map();
    fileMap.set('file', file);
    if (rawUrl) {
      fileMap.set('raw', `${rawUrl}${vPrefix || ''}${version}/${itemPath}`);
    }
    fileMap.set('cdn', `${cdnUrl}@${version}/${itemPath}`);
    origins.push(Object.fromEntries(fileMap));
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
 * @returns {Promise.<void>} - void
 */
export const extractLibraries = async (cmdOpts = {}) => {
  const { dir, info } = cmdOpts;
  const libraries = {
    mozilla: {
      name: 'webextension-polyfill',
      cdn: 'https://unpkg.com/webextension-polyfill',
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
    },
    purify: {
      name: 'dompurify',
      raw: 'https://raw.githubusercontent.com/cure53/DOMPurify/',
      cdn: 'https://unpkg.com/dompurify',
      repository: {
        type: 'git',
        url: 'git://github.com/cure53/DOMPurify.git'
      },
      files: [
        {
          file: 'LICENSE',
          path: 'LICENSE'
        },
        {
          file: 'purify.min.js',
          path: 'dist/purify.min.js'
        },
        {
          file: 'purify.min.js.map',
          path: 'dist/purify.min.js.map'
        }
      ]
    },
    url: {
      name: 'url-sanitizer',
      raw: 'https://raw.githubusercontent.com/asamuzaK/urlSanitizer/',
      vPrefix: 'v',
      cdn: 'https://unpkg.com/url-sanitizer',
      repository: {
        type: 'git',
        url: 'https://github.com/asamuzaK/urlSanitizer.git'
      },
      type: 'module',
      files: [
        {
          file: 'LICENSE',
          path: 'LICENSE'
        },
        {
          file: 'url-sanitizer-wo-dompurify.min.js',
          path: 'dist/url-sanitizer-wo-dompurify.min.js'
        },
        {
          file: 'url-sanitizer-wo-dompurify.min.js.map',
          path: 'dist/url-sanitizer-wo-dompurify.min.js.map'
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
 * @returns {Promise} - promise chain
 */
export const includeLibraries = cmdOpts =>
  extractLibraries(cmdOpts).catch(throwErr);

/**
 * clean directory
 *
 * @param {object} cmdOpts - command options
 * @returns {void}
 */
export const cleanDirectory = (cmdOpts = {}) => {
  const { dir, info } = cmdOpts;
  if (isDir(dir)) {
    removeDir(dir);
    if (info) {
      console.info(`Removed: ${path.resolve(dir)}`);
    }
  }
};

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
    commander.command('clean')
      .description('clean directory')
      .option('-d, --dir <name>', 'specify directory')
      .option('-i, --info', 'console info')
      .action(cleanDirectory);
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
