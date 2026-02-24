import {
  Client,
  ChannelType,
  ForumChannel,
} from "discord.js";

import { BOT_CONFIG } from "../config/bot";
import { logEvent } from "./logger";
import { sendAnnouncement } from "./announcement";

export async function createAttendancePoll(
  client: Client,
  guildId: string,
  userId: string,
  username: string,
  pollName: string,
  durationHours: number
) {
  const guild = await client.guilds.fetch(guildId);

  // Find forum
  const channels = await guild.channels.fetch();
  const pollForum = channels.find(
    (ch): ch is ForumChannel =>
      ch?.type === ChannelType.GuildForum &&
      ch.name === BOT_CONFIG.pollForumChannel
  );

  if (!pollForum) {
    logEvent("poll_forum_not_found", {
      expectedForum: BOT_CONFIG.pollForumChannel,
      userId,
    });
    return { success: false, error: "Forum not found" };
  }

  // Find poll thread
  const threads = await pollForum.threads.fetch();
  const pollThread = threads.threads.find(
    (t) => t.name === BOT_CONFIG.pollThreadName
  );

  if (!pollThread) {
    logEvent("poll_thread_not_found", {
      expectedThread: BOT_CONFIG.pollThreadName,
      userId,
    });
    return { success: false, error: "Thread not found" };
  }

  // Fun variants
  const chatVariants = [
    "Chat Chat Chat",
    "Blah Blah",
    "Wagging of the Chins",
    "Chatting",
  ];
  const trainingVariants = [
    "Fight Fight Fight",
    "Pokey Pokey",
    "Stabbing of the Pointy End",
    "Training",
  ];
  const absentVariants = [
    "Sob Sob Sob",
    "Hokey Pokey",
    "Doing of the Something Else",
    "Absent",
  ];

  const rng = Math.floor(Math.random() * chatVariants.length);

  const pollMessage = await pollThread.send({
    content: `**${pollName}**`,
    poll: {
      question: { text: "What are you doing this week?" },
      answers: [
        { text: "🫖 " + chatVariants[rng] },
        { text: "⚔️ " + trainingVariants[rng] },
        { text: "❌ " + absentVariants[rng] },
      ],
      duration: durationHours,
      allowMultiselect: true,
      layoutType: 1,
    },
  });

  logEvent("poll_created", {
    userId,
    username,
    pollName,
    durationHours,
    messageId: pollMessage.id,
    threadId: pollThread.id,
  });

  await sendAnnouncement(
    client,
    `📢 New attendance poll: **${pollName}** <#${pollThread.id}>`,
    "poll_created"
  );

  return {
    success: true,
    threadId: pollThread.id,
  };
}
