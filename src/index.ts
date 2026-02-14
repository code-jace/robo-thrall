import { Client, GatewayIntentBits, Collection } from "discord.js";
import { TOKEN } from "./config/env";
import fs from "fs";
import path from "path";


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
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".ts"));

  for (const file of files) {
    const commandModule = await import(`./commands/${file}`);
    const command = commandModule.default || commandModule;
    client.commands.set(command.data.name, command);
  }
}

// --- Load listeners dynamically ---
async function loadListeners() {
  const listenersPath = path.join(__dirname, "listeners");
  const files = fs.readdirSync(listenersPath).filter(f => f.endsWith(".ts"));

  for (const file of files) {
    const listenerModule = await import(`./listeners/${file}`);
    const listener = listenerModule.default || listenerModule;
    listener(client);
    client.listeners.push(file.replace(".ts", ""));
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
  });

  await client.login(TOKEN);
}

main().catch(console.error);
