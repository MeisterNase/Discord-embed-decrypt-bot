import 'dotenv/config';
import { InstallGlobalCommands, InstallGuildCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command to export all embed messages to a text file
const CSTART_COMMAND = {
  name: 'cstart',
  description: 'Export all embed messages from the channel to a text file',
  type: 1,
  integration_types: [0],
  contexts: [0],
};

const ALL_COMMANDS = [TEST_COMMAND, CSTART_COMMAND];

// Prefer guild registration for faster propagation during development
if (process.env.GUILD_ID) {
  InstallGuildCommands(process.env.APP_ID, process.env.GUILD_ID, ALL_COMMANDS);
} else {
  InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
}
