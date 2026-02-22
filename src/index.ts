import { Client, GatewayIntentBits, Collection } from "discord.js";
import { TOKEN } from "./config/env";
import fs from "fs";
import path from "path";

// --- Load JSON config ---
import { BOT_CONFIG } from "./config/bot";
import { config } from 'process';

// --- Initialize client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// --- Initialize collections ---
client.commands = new Collection();
client.listeners = [];

// --- Load commands dynamically ---
async function loadCommands() {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(f => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);
    const command = commandModule.default || commandModule;

    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Skipped invalid command file: ${file}`);
    }
  }
}

// --- Load listeners dynamically ---
async function loadListeners() {
  const listenersPath = path.join(__dirname, "listeners");
  const listenerFiles = fs
    .readdirSync(listenersPath)
    .filter(f => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of listenerFiles) {
    const filePath = path.join(listenersPath, file);
    const listenerModule = await import(filePath);
    const listener = listenerModule.default || listenerModule;

    if (typeof listener === "function") {
      listener(client);
      client.listeners.push(file.replace(/\.(ts|js)$/, ""));
      console.log(`✅ Loaded listener: ${file}`);
    } else {
      console.warn(`⚠️ Skipped invalid listener file: ${file}`);
    }
  }
}

// --- Main bot startup ---
async function main() {
  await loadCommands();
  await loadListeners();

  client.once("clientReady", () => {

    console.log("⚔️ Robo-Thrall Startup Complete!");
    console.log(`Logged in as: ${client.user?.tag}`);
    console.log(`Node version: ${process.version}`);
    console.log(`Discord.js version: ${require("discord.js").version}`);
    console.log(`Commands loaded: ${[...client.commands.keys()].join(", ") || "None"}`);
    console.log(`Listeners loaded: ${client.listeners.join(", ") || "None"}`);
    // Log the config file
    const configPath = path.join(__dirname, "config", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    console.log("⚙️  Config:", config);
  });

  await client.login(TOKEN);        
}

// --- Run bot ---
main().catch(console.error);
