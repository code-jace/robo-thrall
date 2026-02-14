import os
import discord
from discord import app_commands
from discord.ext import commands
from webserver import keep_alive

keep_alive()  # Start Flask web server for uptime

# --- Intents ---
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.messages = True
intents.reactions = True
intents.members = True

# --- Bot without prefix (slash commands only) ---
bot = commands.Bot(command_prefix=None, intents=intents)


# --- Ready Event ---
@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"⚔️ Robo-Thrall stands ready! Logged in as {bot.user}")


# --- /help command ---
@bot.tree.command(name="help", description="Show commands for Robo-Thrall")
async def help_command(interaction: discord.Interaction):
    help_text = (
        "🪓 **Robo-Thrall Commands:**\n"
        #"• `/attendance <meeting_info> [duration]` — summon an attendance poll in #general-chat\n"
        #"  Options: 🛡️ Training, 🧵 Crafting/chatting, 😢 Cannot attend\n"
        #"  Duration is optional (in hours, default 24)\n"
        "• `/help` — show this help message\n\n"
        "Robo-Thrall will announce Event posts in #announcements!"
    )
    await interaction.response.send_message(help_text, ephemeral=True)


# --- /attendance command (COMMENTED OUT for now) ---
"""
@bot.tree.command(name="attendance", description="Create an attendance poll for a meeting")
@app_commands.describe(meeting_info="Info about the next gathering", duration="Optional duration in hours")
async def attendance(interaction: discord.Interaction, meeting_info: str, duration: int = 24):
    general_chat = discord.utils.get(interaction.guild.text_channels, name="general-chat")
    announcements = discord.utils.get(interaction.guild.text_channels, name="announcements")

    if not general_chat:
        await interaction.response.send_message("⚔️ I cannot find #general-chat. Summoning failed!", ephemeral=True)
        return

    try:
        # Native Discord Poll
        poll = discord.Poll(
            question=f"⚔️ Attendance — {meeting_info}",
            choices=[
                discord.PollOption("🛡️ Training"),
                discord.PollOption("🧵 Crafting/chatting"),
                discord.PollOption("😢 Cannot attend")
            ],
            multi=False,
            duration=duration*60*60  # convert hours to seconds
        )
        poll_message = await general_chat.send(poll=poll)

        # Create discussion thread
        await poll_message.create_thread(name=f"Discussion — {meeting_info}")

        # Announce poll in #announcements
        announcer_role = discord.utils.get(interaction.guild.roles, name="Announcer")
        if announcements and announcer_role in interaction.user.roles:
            try:
                await announcements.send(
                    f"📣 @everyone An attendance poll has been raised for: **{meeting_info}**\n"
                    f"Join the thread here: {poll_message.jump_url}"
                )
            except discord.Forbidden:
                print("❌ Robo-Thrall cannot announce in #announcements!")

        await interaction.response.send_message(f"✅ Poll created for **{meeting_info}**!", ephemeral=True)

    except Exception as e:
        await interaction.response.send_message(f"❌ Failed to create poll: {e}", ephemeral=True)
"""


# --- Event posts listener ---
@bot.event
async def on_thread_create(thread):
    # Check if thread is from a forum with "Event" tag
    if isinstance(thread.parent, discord.ForumChannel) and "Event" in [t.name for t in thread.applied_tags]:
        announcements = discord.utils.get(thread.guild.text_channels, name="announcements")
        if announcements:
            try:
                await announcements.send(
                    f"📯 @everyone A new **Event post** has been created: {thread.jump_url}"
                )
            except discord.Forbidden:
                print("❌ Cannot announce Event post in #announcements")


# --- Run bot ---
TOKEN = os.getenv("DISCORD_TOKEN")
bot.run(TOKEN)
