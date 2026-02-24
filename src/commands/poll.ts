import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";

import { createAttendancePoll } from "../services/poll";

export const data = new SlashCommandBuilder()
  .setName("poll")
  .setDescription("Create a weekly attendance poll")
  .addStringOption((option) =>
    option.setName("name").setDescription("Poll name").setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("duration")
      .setDescription("Poll duration in hours")
      .setMinValue(1)
      .setMaxValue(168)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const pollName = interaction.options.getString("name", true);
  const durationHours = interaction.options.getInteger("duration") ?? 72;

  const result = await createAttendancePoll(
    interaction.client,
    interaction.guildId!,
    interaction.user.id,
    interaction.user.username,
    pollName,
    durationHours
  );

  if (!result.success) {
    await interaction.editReply("❌ Failed to create poll.");
    return;
  }

  await interaction.editReply(
    `✅ Attendance poll posted to <#${result.threadId}>`
  );
}
