import { Client, ThreadChannel, ForumChannel } from "discord.js";
import { BOT_CONFIG } from '../config/bot';

export default (client: Client) => {
  client.on("threadCreate", async (thread: ThreadChannel) => {
    // Only forum threads
    if (!(thread.parent instanceof ForumChannel)) return;

    // Only threads in the configured forum
    if (thread.parent.name !== BOT_CONFIG.forumChannel) return;

    // Only threads with the Event tag
    const forumTags = thread.parent.availableTags; // All tags in the forum
    const hasEventTag = thread.appliedTags.some(tagId => {
      const tag = forumTags.find(t => t.id === tagId);
      return tag?.name.toLowerCase() === BOT_CONFIG.eventTagName.toLowerCase();
    });
    if (!hasEventTag) return;

    // Find announcement channel
    const announcements = thread.guild.channels.cache.find(
      ch => ch.isTextBased() && ch.name === BOT_CONFIG.announcementChannel
    );

    if (announcements?.isTextBased()) {
      await announcements.send(
        `📢 @everyone A new **Event post** has been created: ${thread.url}`
      );
    }
  });
};
