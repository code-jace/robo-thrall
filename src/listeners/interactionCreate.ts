import { Client, Interaction, MessageFlags } from "discord.js";
import { logEvent } from "../services/logger";


// handles user triggered actions with bot
export default (client: Client) => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    logEvent('interaction_created', {
      commandName: interaction.commandName,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });

    // handle / commands
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logEvent('command_not_found', {
        commandName: interaction.commandName,
        userId: interaction.user.id,
      });
      return;
    }

    try {
      await command.execute(interaction);
      logEvent('command_executed_success', {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        username: interaction.user.username,
      });
    } catch (err) {
      console.error(err);
      logEvent('command_execution_error', {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      await interaction.reply({ content: "❌ Error executing command", flags: MessageFlags.Ephemeral });
    }
  });
};
