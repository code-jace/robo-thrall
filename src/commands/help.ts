import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show commands for Robo-Thrall");

const helpMessage = `**Robo-Thrall Commands:**\n• /help — show this message\n• /attendance <info> — create attendance poll`;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: helpMessage,
    ephemeral: true
  });
}
