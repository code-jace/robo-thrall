import { Client, ThreadChannel, ForumChannel } from "discord.js";
import { BOT_CONFIG } from '../config/bot';
import { logEvent } from '../services/logger';

export default (client: Client) => {
  client.on("threadCreate", async (thread: ThreadChannel) => {
    console.log('threadCreate', thread);
    logEvent('threadCreate', {
      threadId: thread.id,
      threadName: thread.name,
      guildId: thread.guildId,
      parentId: thread.parentId,
    });
    
    // Only forum threads
    if (!(thread.parent instanceof ForumChannel)) {
      logEvent('threadCreate_filtered', { reason: 'not_forum_thread', threadId: thread.id });
      return;
    }

    // Only threads in the configured forum
    if (thread.parent.name !== BOT_CONFIG.forumChannel) {
      logEvent('threadCreate_filtered', { reason: 'wrong_forum', parentName: thread.parent.name, expected: BOT_CONFIG.forumChannel, threadId: thread.id });
      return;
    }

    // Only threads with the Event tag
    const forumTags = thread.parent.availableTags; // All tags in the forum
    const hasEventTag = thread.appliedTags.some(tagId => {
      const tag = forumTags.find(t => t.id === tagId);
      return tag?.name.toLowerCase() === BOT_CONFIG.eventTagName.toLowerCase();
    });
    if (!hasEventTag) {
      logEvent('threadCreate_filtered', { reason: 'no_event_tag', appliedTags: thread.appliedTags, threadId: thread.id });
      return;
    }

    logEvent('threadCreate_qualified', {
      threadId: thread.id,
      threadName: thread.name,
      threadUrl: thread.url,
    });

    // Find announcement channel
    const announcements = thread.guild.channels.cache.find(
      ch => ch.isTextBased() && ch.name === BOT_CONFIG.announcementChannel
    );

    if (announcements?.isTextBased()) {
      try {
        await announcements.send(
          `📢 @everyone A new **Event post** has been created: ${thread.url}`
        );
        logEvent('announcement_sent', {
          threadId: thread.id,
          channelId: announcements.id,
          channelName: announcements.name,
        });
      } catch (error) {
        logEvent('announcement_failed', {
          threadId: thread.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logEvent('announcement_channel_not_found', {
        expectedChannel: BOT_CONFIG.announcementChannel,
        threadId: thread.id,
      });
    }
  });
};
