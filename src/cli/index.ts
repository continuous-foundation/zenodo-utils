#!/usr/bin/env node
import { Command } from 'commander';
import version from '../version.js';
import { addDepositCLI } from './deposit.js';

const program = new Command();

addDepositCLI(program);

program.version(`v${version}`, '-v, --version', 'Print the current version of zenodo-utils');
program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);
