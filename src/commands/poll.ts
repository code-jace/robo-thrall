import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType, MessageFlags, ForumChannel } from 'discord.js';
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
  let deferred = false;

  try {
    // Try to defer the reply immediately to acknowledge the interaction
    // Use flags instead of ephemeral (deprecated)
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      deferred = true;
    } catch (deferError) {
      logEvent('poll_defer_failed', {
        userId: interaction.user.id,
        error: deferError instanceof Error ? deferError.message : String(deferError),
      });
      // If defer fails, we'll attempt to reply later if possible
    }

    const pollName = interaction.options.getString('name')!;
    const durationHours = interaction.options.getInteger('duration') ?? 72;

    // Find the poll forum channel - check cache first, then fetch if needed
    let pollForum = interaction.guild?.channels.cache.find(
      (ch): ch is ForumChannel => ch?.type === ChannelType.GuildForum && ch.name === BOT_CONFIG.pollForumChannel
    );

    if (!pollForum) {
      const channels = await interaction.guild?.channels.fetch();
      pollForum = channels?.find(
        (ch): ch is ForumChannel => ch?.type === ChannelType.GuildForum && ch.name === BOT_CONFIG.pollForumChannel
      );
    }

    if (!pollForum || pollForum.type !== ChannelType.GuildForum) {
      logEvent('poll_forum_not_found', {
        expectedForum: BOT_CONFIG.pollForumChannel,
        userId: interaction.user.id,
      });
      // Do not surface this error to the user; just log and stop
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
      // Do not surface this error to the user; just log and stop
      return;
    }

    // Post the poll message to the thread
    // the poll options will be the same each week but we can randomize the text a bit for fun (they should match up across the 3 options)
    const chatVariants = [
      'Chat Chat Chat',
      'Blah Blah',
      'Wagging of the Chins',
      'Chatting'
    ];
    const trainingVariants = [
      'Fight Fight Fight',
      'Pokey Pokey',
      'Stabbing of the Pointy End',      
      'Training'
    ];
    const absentVariants = [
      'Sob Sob Sob',
      'Hokey Pokey',
      'Doing of the Something Else',
      'Absent'
    ];
    // between 0 and max chat variants.length -1 inclusive
    const rng = Math.floor(Math.random() * chatVariants.length);    

    const pollMessage = await pollThread.send({
      content: `**${pollName}**`,
      poll: {
        question: {
          text: 'What are you doing this week?',
        },
        answers: [
          { text: '🫖 ' + chatVariants[rng] },
          { text: '⚔️ ' + trainingVariants[rng] },
          { text: '❌ ' + absentVariants[rng] },
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
      `📢 New attendance poll: **${pollName}** <#${pollThread.id}>`,
      'poll_created'
    );

    const successContent = `✅ Attendance poll posted to <#${pollThread.id}>`;
    if (deferred) {
      await interaction.editReply({ content: successContent });
    } else if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: successContent, flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    logEvent('poll_creation_failed', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      if (deferred) {
        await interaction.editReply({
          content: '❌ Failed to create poll. Check bot permissions for the forum and creating threads.',
        });
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Failed to create poll. Check bot permissions for the forum and creating threads.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
}
