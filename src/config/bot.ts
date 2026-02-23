import fs from "fs";
import path from "path";

// Read JSON config
const configPath = path.join(__dirname, "config.json");
const raw = fs.readFileSync(configPath, "utf-8");

console.log('Loaded config', raw);

export const BOT_CONFIG = JSON.parse(raw) as {
  announcementChannel: string;
  forumChannel: string;
  eventTagName: string;
  loggingEnabled: boolean;
};
