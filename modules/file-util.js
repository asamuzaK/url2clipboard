/**
 * file-util.js
 */

import fs, { promises as fsPromise } from 'node:fs';
import path from 'node:path';
import { getType, isString } from './common.js';

/* constants */
const CHAR = 'utf8';
const PERM_DIR = 0o755;
const PERM_FILE = 0o644;

/**
 * get stat
 *
 * @param {string} file - file path
 * @returns {object} - file stat
 */
export const getStat = file =>
  isString(file) && fs.existsSync(file) ? fs.statSync(file) : null;

/**
 * the directory is a directory
 *
 * @param {string} dir - directory path
 * @returns {boolean} - result
 */
export const isDir = dir => {
  const stat = getStat(dir);
  return stat ? stat.isDirectory() : false;
};

/**
 * the file is a file
 *
 * @param {string} file - file path
 * @returns {boolean} - result
 */
export const isFile = file => {
  const stat = getStat(file);
  return stat ? stat.isFile() : false;
};

/**
 * make directory
 *
 * @param {string} dir - directory path
 * @param {object} opt - options
 * @returns {Promise.<string>} - directory path
 */
export const mkdir = async (dir, opt = { mode: PERM_DIR, recursive: true }) => {
  if (!isString(dir)) {
    throw new TypeError(`Expected String but got ${getType(dir)}.`);
  }
  await fsPromise.mkdir(dir, opt);
  return dir;
};

/**
 * remove files and directories
 *
 * @param {string} dir - directory path
 * @param {object} opt - options
 * @returns {Promise.<void>} - void
 */
export const rm = async (dir, opt = { force: true, recursive: true }) => {
  if (!isString(dir)) {
    throw new TypeError(`Expected String but got ${getType(dir)}.`);
  }
  await fsPromise.rm(dir, opt);
};

/**
 * remove the directory and it's files synchronously
 *
 * @param {string} dir - directory path
 * @returns {void}
 */
export const removeDir = dir => {
  if (!isDir(dir)) {
    throw new Error(`No such directory: ${dir}`);
  }
  fs.rmSync(dir, {
    force: true,
    recursive: true
  });
};

/**
 * read a file
 *
 * @param {string} file - file path
 * @param {object} [opt] - options
 * @param {string} [opt.encoding] - encoding
 * @param {string} [opt.flag] - flag
 * @returns {Promise.<string|Buffer>} - file content
 */
export const readFile = async (file, opt = { encoding: null, flag: 'r' }) => {
  if (!isFile(file)) {
    throw new Error(`${file} is not a file.`);
  }
  const value = await fsPromise.readFile(file, opt);
  return value;
};

/**
 * create a file
 *
 * @param {string} file - file path to create
 * @param {string} value - value to write
 * @returns {Promise.<string>} - file path
 */
export const createFile = async (file, value) => {
  if (!isString(file)) {
    throw new TypeError(`Expected String but got ${getType(file)}.`);
  }
  if (!isString(value)) {
    throw new TypeError(`Expected String but got ${getType(value)}.`);
  }
  const filePath = path.resolve(file);
  await fsPromise.writeFile(filePath, value, {
    encoding: CHAR, flag: 'w', mode: PERM_FILE
  });
  return filePath;
};
