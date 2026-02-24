import {
  Client,
  ChannelType,
  ForumChannel,
} from "discord.js";

import { BOT_CONFIG } from "../config/bot";
import { logEvent } from "./logger";
import { sendAnnouncement } from "./announcement";

/**
 * Get the next coming Wednesday (never today).
 */
function getNextWednesday(): Date {
  const now = new Date();
  const result = new Date(now);

  const day = now.getDay(); // 0=Sun, 1=Mon ... 3=Wed
  const daysUntilWednesday = (3 - day + 7) % 7 || 7;

  result.setDate(now.getDate() + daysUntilWednesday);
  result.setHours(0, 0, 0, 0);

  return result;
}

/**
 * Format date as dd-MMM (e.g. 05-Mar)
 */
function formatDateDDMMM(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");

  const month = date.toLocaleString("en-GB", {
    month: "short",
  });

  return `${day}-${month}`;
}

/**
 * Core Poll Creation Service
 * Used by BOTH slash and prefix commands
 */
export async function createAttendancePoll(
  client: Client,
  guildId: string,
  userId: string,
  username: string,
  pollName: string,
  durationHours: number
): Promise<{ success: boolean; threadId?: string; error?: string }> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    // =========================
    // Find Forum Channel
    // =========================
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

    // =========================
    // Find Poll Thread
    // =========================
    const threads = await pollForum.threads.fetch();
    const pollThread = threads.threads.find(
      (t) => t.name === BOT_CONFIG.pollThreadName
    );

    if (!pollThread) {
      logEvent("poll_thread_not_found", {
        expectedThread: BOT_CONFIG.pollThreadName,
        userId,
        forumName: pollForum.name,
      });
      return { success: false, error: "Thread not found" };
    }

    // =========================
    // Append Next Wednesday Date
    // =========================
    const nextWednesday = getNextWednesday();
    const formattedDate = formatDateDDMMM(nextWednesday);
    const finalPollName = `${pollName} (${formattedDate})`;

    // =========================
    // Fun Poll Variants
    // =========================
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

    // =========================
    // Send Poll Message
    // =========================
    const pollMessage = await pollThread.send({
      content: `**${finalPollName}**`,
      poll: {
        question: {
          text: "What are you doing this week?",
        },
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

    // =========================
    // Logging
    // =========================
    logEvent("poll_created", {
      userId,
      username,
      pollName: finalPollName,
      durationHours,
      messageId: pollMessage.id,
      threadId: pollThread.id,
      forumName: pollForum.name,
    });

    // =========================
    // Announcement
    // =========================
    await sendAnnouncement(
      client,
      `📢 New attendance poll: **${finalPollName}** <#${pollThread.id}>`,
      "poll_created"
    );

    return {
      success: true,
      threadId: pollThread.id,
    };

  } catch (error) {
    logEvent("poll_creation_failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: "Unexpected error",
    };
  }
}
