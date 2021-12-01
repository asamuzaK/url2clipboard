/**
 * index.js
 */

/* api */
import { logErr, throwErr } from './src/mjs/common.js';
import { parseCommand } from './modules/blink-compat.js';
import process from 'process';

/* process */
process.on('uncaughtException', throwErr);
process.on('unhandledRejection', logErr);

parseCommand(process.argv);
