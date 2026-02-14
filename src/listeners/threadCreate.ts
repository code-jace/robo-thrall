import { Client, ThreadChannel, ForumChannel } from "discord.js";

export default (client: Client) => {
  client.on("threadCreate", async (thread: ThreadChannel) => {
    if (!(thread.parent instanceof ForumChannel)) return;

    const announcements = thread.guild.channels.cache.find(ch => ch.isTextBased() && ch.name === "announcements");
    if (announcements?.isTextBased()) {
      await announcements.send(`📯 @everyone A new **Event post** has been created: ${thread.url}`);
    }
  });
};
