import os
import discord
from discord import app_commands
from discord.ext import commands
from webserver import keep_alive

keep_alive()  # start Flask server for UptimeRobot

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.messages = True
intents.reactions = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

# --- Slash Command Sync ---
@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"Robo-Thrall is online as {bot.user}")


# --- /help command ---
@bot.tree.command(name="help", description="Show commands")
async def help_command(interaction: discord.Interaction):
    help_text = (
        "/attendance <meeting_info> [duration] — Create attendance poll\n"
        "Options: 🛡️ Training, 🧵 Crafting/chatting, 😢 Cannot attend\n"
        "Duration in hours is optional (default 24)\n"
        "/help — Show this help message"
    )
    await interaction.response.send_message(help_text, ephemeral=True)


# --- /attendance command ---
@bot.tree.command(name="attendance", description="Create attendance poll")
@app_commands.describe(meeting_info="Meeting info", duration="Optional duration in hours")
async def attendance(interaction: discord.Interaction, meeting_info: str, duration: int = 24):
    # Check channels
    general_chat = discord.utils.get(interaction.guild.text_channels, name="general-chat")
    announcements = discord.utils.get(interaction.guild.text_channels, name="announcements")
    if not general_chat:
        await interaction.response.send_message("Cannot find #general-chat.", ephemeral=True)
        return

    # Native Discord Poll (unstable Discord.py)
    try:
        poll_message = await general_chat.send(
            content=f"**Attendance — {meeting_info}**",
            poll=discord.Poll(
                question=f"Attendance — {meeting_info}",
                options=["🛡️ Training", "🧵 Crafting/chatting", "😢 Cannot attend"],
                multi=False,
                duration=duration
            )
        )
    except Exception as e:
        await interaction.response.send_message(f"Failed to create poll: {e}", ephemeral=True)
        return

    # Create a thread for discussion
    try:
        await poll_message.create_thread(name=f"Discussion — {meeting_info}")
    except Exception as e:
        print(f"Thread creation failed: {e}")

    # Announce poll in #announcements
    announcer_role = discord.utils.get(interaction.guild.roles, name="Announcer")
    if announcements and announcer_role in interaction.user.roles:
        try:
            await announcements.send(f"@everyone Attendance poll created: {poll_message.jump_url}")
        except discord.Forbidden:
            print("Missing permissions to post in #announcements or mention @everyone")

    await interaction.response.send_message("Attendance poll created!", ephemeral=True)


# --- Listen for forum Event tag ---
@bot.event
async def on_thread_create(thread):
    # Check if thread is from forum with Event tag
    if isinstance(thread.parent, discord.ForumChannel) and "Event" in [t.name for t in thread.applied_tags]:
        announcements = discord.utils.get(thread.guild.text_channels, name="announcements")
        if announcements:
            try:
                await announcements.send(f"@everyone New event thread created: {thread.jump_url}")
            except discord.Forbidden:
                print("Missing permissions to post in #announcements")


# --- Run bot ---
TOKEN = os.getenv("DISCORD_TOKEN")
bot.run(TOKEN)
