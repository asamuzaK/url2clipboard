/**
 * index.js
 */

/* api */
import { logErr, throwErr } from './modules/common.js';
import { parseCommand } from './modules/commander.js';
import process from 'node:process';

/* process */
process.on('uncaughtException', throwErr);
process.on('unhandledRejection', logErr);

parseCommand(process.argv);
