import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Deploys slash commands to Discord.
 * Run this whenever commands change.
 */
async function deployCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID; // optional (faster for testing)

  if (!token || !clientId) {
    throw new Error("Missing DISCORD_TOKEN or CLIENT_ID in .env");
  }

  const commands = [];

  // Load command files from dist/commands
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  console.log("📦 Loading commands...");

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded: ${command.data.name}`);
    } else {
      console.log(`⚠️ Skipped invalid command file: ${file}`);
    }
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("🚀 Deploying slash commands...");

    // 🔥 Guild commands update instantly
    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );

      console.log("✅ Commands deployed to guild instantly!");
    }

    // 🌍 Global commands take up to 1 hour
    else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });

      console.log("🌍 Commands deployed globally (may take time).");
    }
  } catch (error) {
    console.error("❌ Deploy failed:", error);
  }
}

deployCommands();
