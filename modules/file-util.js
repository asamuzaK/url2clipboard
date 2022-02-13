/**
 * file-util.js
 */

import { getType, isString } from './common.js';
import fs, { promises as fsPromise } from 'fs';
import path from 'path';

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
 * make directory
 *
 * @param {string} dir - directory path
 * @param {object} opt - options
 * @returns {string} - directory path
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
 * @returns {void}
 */
export const rm = async (dir, opt = { force: true, recursive: true }) => {
  if (!isString(dir)) {
    throw new TypeError(`Expected String but got ${getType(dir)}.`);
  }
  await fsPromise.rm(dir, opt);
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
 * read a file
 *
 * @param {string} file - file path
 * @param {object} [opt] - options
 * @param {string} [opt.encoding] - encoding
 * @param {string} [opt.flag] - flag
 * @returns {string|Buffer} - file content
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
 * @returns {string} - file path
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
