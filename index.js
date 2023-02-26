/**
 * index.js
 */

/* api */
import process from 'node:process';
import { logErr, throwErr } from './modules/common.js';
import { parseCommand } from './modules/commander.js';

/* process */
process.on('uncaughtException', throwErr);
process.on('unhandledRejection', logErr);

parseCommand(process.argv);
