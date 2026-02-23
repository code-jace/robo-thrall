import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType } from 'discord.js';
import { BOT_CONFIG } from '../config/bot';
import { logEvent } from '../services/logger';
import { sendAnnouncement } from '../services/announcement';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a weekly attendance poll')
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Poll name')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Poll duration in hours (default: 72 for 3 days)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(168) // max 1 week
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Defer the reply to acknowledge the interaction immediately
    await interaction.deferReply({ ephemeral: true });

    const pollName = interaction.options.getString('name')!;
    const durationHours = interaction.options.getInteger('duration') ?? 72;

    // Find the poll forum channel
    const channels = await interaction.guild?.channels.fetch();
    const pollForum = channels?.find(
      ch => ch?.type === ChannelType.GuildForum && ch.name === BOT_CONFIG.pollForumChannel
    );

    if (!pollForum || pollForum.type !== ChannelType.GuildForum) {
      logEvent('poll_forum_not_found', {
        expectedForum: BOT_CONFIG.pollForumChannel,
        userId: interaction.user.id,
      });
      await interaction.editReply({
        content: `❌ Could not find poll forum: **${BOT_CONFIG.pollForumChannel}**`,
      });
      return;
    }

    // Find the attendance polls thread in the forum
    const threads = await pollForum.threads.fetch();
    const pollThread = threads.threads.find(t => t.name === BOT_CONFIG.pollThreadName);

    if (!pollThread) {
      logEvent('poll_thread_not_found', {
        expectedThread: BOT_CONFIG.pollThreadName,
        userId: interaction.user.id,
        forumName: pollForum.name,
      });
      await interaction.editReply({
        content: `❌ Could not find poll thread: **${BOT_CONFIG.pollThreadName}** in **${BOT_CONFIG.pollForumChannel}**`,
      });
      return;
    }

    // Post the poll message to the thread
    const pollMessage = await pollThread.send({
      content: `**${pollName}**`,
      poll: {
        question: {
          text: 'What are you doing this week?',
        },
        answers: [
          { text: '🫖 Chatting' },
          { text: '⚔️ Training' },
          { text: '❌ Not There' },
        ],
        duration: durationHours,
        allowMultiselect: true,
        layoutType: 1, // Results layout - just shows counts without declaring winner
      },
    });

    logEvent('poll_created', {
      userId: interaction.user.id,
      username: interaction.user.username,
      pollName,
      durationHours,
      messageId: pollMessage.id,
      threadId: pollThread.id,
      threadName: pollThread.name,
      forumName: pollForum.name,
    });

    // Send announcement
    await sendAnnouncement(
      interaction.client,
      `📢 New attendance poll: **${pollName}** [View Poll](https://discord.com/channels/${interaction.guildId}/${pollThread.id}/${pollMessage.id})`,
      'poll_created'
    );

    await interaction.editReply({
      content: `✅ Attendance poll posted to **${pollThread.name}**`,
    });
  } catch (error) {
    logEvent('poll_creation_failed', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      await interaction.editReply({
        content: '❌ Failed to create poll. Check bot permissions for the forum and creating threads.',
      });
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
}
