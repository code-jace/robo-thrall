import { Client, TextChannel } from 'discord.js';
import { BOT_CONFIG } from '../config/bot';
import { logEvent } from './logger';

export async function sendAnnouncement(client: Client, message: string, context: string) {
  try {
    const announcements = client.guilds.cache.first()?.channels.cache.find(
      ch => ch?.isTextBased() && ch.name === BOT_CONFIG.announcementChannel
    );

    if (!announcements || !announcements.isTextBased()) {
      logEvent('announcement_channel_not_found', {
        expectedChannel: BOT_CONFIG.announcementChannel,
        context,
      });
      return false;
    }

    await announcements.send(message);
    
    logEvent('announcement_sent', {
      context,
      channelId: announcements.id,
      channelName: announcements.name,
    });
    
    return true;
  } catch (error) {
    logEvent('announcement_failed', {
      context,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
