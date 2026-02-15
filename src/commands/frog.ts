import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName("frog")
    .setDescription("frog time");

const frogMessages = [
    "🐸 Ribbit!",
    "🐸 Croak croak!",
    "🐸 Hop hop!",
    "🐸 I'm a happy frog!",
    "F R O G T I M E ! 🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸"
];

export async function execute(interaction: ChatInputCommandInteraction) {
    const randomIndex = Math.floor(Math.random() * frogMessages.length);
    const randomMessage = frogMessages[randomIndex];
    
    await interaction.reply({
        content: randomMessage,
        ephemeral: true
    });
}