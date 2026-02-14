import { Client, GatewayIntentBits, Collection } from "discord.js";
import { TOKEN } from "./config/env";
import fs from "fs";
import path from "path";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// --- Commands Collection ---
client.commands = new Collection();

// --- Load commands dynamically ---
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath)
  .filter(file => file.endsWith(".ts"))
  .forEach(file => {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  });

// --- Load listeners dynamically ---
const listenersPath = path.join(__dirname, "listeners");
fs.readdirSync(listenersPath)
  .filter(file => file.endsWith(".ts"))
  .forEach(file => {
    require(path.join(listenersPath, file))(client);
  });

// --- Login ---
client.login(TOKEN);
