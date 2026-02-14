import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show commands for Robo-Thrall");

const helpMessage 
= `**Robo-Thrall Commands:**
• /help — show this message`;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: helpMessage,
    ephemeral: true
  });
}
