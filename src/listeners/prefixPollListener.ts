import { Client, Message } from "discord.js";
import { createAttendancePoll } from "../services/poll";

export default (client: Client) => {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (!message.content.toLowerCase().startsWith("!rt poll"))
      return;

    const argsString = message.content
      .slice("!rt poll".length)
      .trim();

    const nameMatch = argsString.match(/name:(.+?)(?=\s+\w+:|$)/i);
    if (!nameMatch) {
      await message.reply(
        "❌ You must provide a poll name using `name:`"
      );
      return;
    }

    const pollName = nameMatch[1].trim();
    const durationMatch = argsString.match(/duration:(\d+)/i);
    const durationHours = durationMatch
      ? parseInt(durationMatch[1], 10)
      : 72;

    const result = await createAttendancePoll(
      client,
      message.guildId!,
      message.author.id,
      message.author.username,
      pollName,
      durationHours
    );

    if (!result.success) {
      await message.reply("❌ Failed to create poll.");
      return;
    }

    await message.reply(
      `✅ Attendance poll posted to <#${result.threadId}>`
    );
  });
};
