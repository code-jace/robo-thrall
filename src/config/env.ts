import * as dotenv from "dotenv";
dotenv.config();

export const TOKEN = process.env.DISCORD_TOKEN!;
if (!TOKEN) throw new Error("DISCORD_TOKEN is not set in .env");
