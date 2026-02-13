import os
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv
from webserver import keep_alive

# ----------------- Be Cheapo ------------------
keep_alive()

# ----------------- Load Environment -----------------
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

# ----------------- Intents -----------------
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.messages = True

# ----------------- Bot -----------------
bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)

# ----------------- Configuration -----------------
GENERAL_CHAT_NAME = "general-chat"
ANNOUNCEMENTS_NAME = "announcements"
FORUM_NAME = "general-forum"
EVENT_TAG_NAME = "Event"
ANNOUNCER_ROLE_NAME = "Announcer"

# ----------------- Helper Functions -----------------
def find_text_channel(guild, name):
    return discord.utils.get(guild.text_channels, name=name)

def find_forum_channel(guild, name):
    return discord.utils.get(guild.channels, name=name, type=discord.ChannelType.forum)

def find_forum_tag(forum_channel, tag_name):
    for tag in forum_channel.available_tags:
        if tag.name.lower() == tag_name.lower():
            return tag
    return None

def bot_has_announcer_role(guild):
    bot_member = guild.me
    return any(role.name == ANNOUNCER_ROLE_NAME for role in bot_member.roles)

# ----------------- Bot Events -----------------
@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"Robo-Thrall is online as {bot.user}")

# ----------------- Slash Commands -----------------
@bot.tree.command(
    name="help",
    description="Show available Robo-Thrall commands (visible only to you)"
)
async def help(interaction: discord.Interaction):
    help_text = (
        "**Robo-Thrall — Help**\n\n"
        "**Commands:**\n"
        "`/attendance <meeting info> [duration]`\n"
        "Creates an attendance poll in #general-chat, opens a discussion thread, "
        "and posts an announcement in #announcements.\n\n"
        "**Optional Parameter:**\n"
        "- `duration` (in hours, default 48)\n\n"
        "**Example:**\n"
        "`/attendance Thursday 7pm`\n"
        "`/attendance Thursday 7pm 72`\n\n"
        "**Automatic Features:**\n"
        "- Any new forum post in #general-forum tagged **Event** will be announced "
        "in #announcements with an @everyone notification.\n\n"
        "**Poll Options:**\n"
        "- Training\n"
        "- Crafting/chatting\n"
        "- Cannot attend\n"
    )
    await interaction.response.send_message(help_text, ephemeral=True)

@bot.tree.command(
    name="attendance",
    description="Create an attendance poll for the next meeting"
)
@app_commands.describe(
    meeting_info="Description of the meeting",
    duration="Poll duration in hours (optional, default 48)"
)
async def attendance(
    interaction: discord.Interaction,
    meeting_info: str,
    duration: int = 48
):
    guild = interaction.guild
    general_chat = find_text_channel(guild, GENERAL_CHAT_NAME)
    announcements = find_text_channel(guild, ANNOUNCEMENTS_NAME)

    if not general_chat or not announcements:
        await interaction.response.send_message(
            "Error: Required channels not found.", ephemeral=True
        )
        return

    # --- Create Native Poll ---
    poll_message = await general_chat.send(
        content=f"**Attendance — {meeting_info}**",
        poll=discord.Poll(
            question=f"Attendance — {meeting_info}",
            options=["🛡️ Training", "🧵 Crafting/chatting", "❌ Cannot attend"],
            multi=False,       # one vote per person
            duration=duration  # in hours
        )
    )

    # --- Create Thread from Poll Message ---
    thread = await poll_message.create_thread(
        name=f"Meeting Discussion — {meeting_info}"
    )

    # --- Check Announcer Role Before Announcement ---
    if bot_has_announcer_role(guild):
        await announcements.send(
            f"@everyone Attendance poll is now open for **{meeting_info}**.\n"
            f"Click here to join the discussion and vote: {thread.jump_url}"
        )
    else:
        print(f"Warning: Robo-Thrall does not have the {ANNOUNCER_ROLE_NAME} role. Announcement skipped.")

    # --- Confirm to User (Ephemeral) ---
    await interaction.response.send_message(
        f"Attendance poll created successfully in {general_chat.mention} "
        f"for {duration} hours.",
        ephemeral=True
    )

# ----------------- Forum Event Listener -----------------
@bot.event
async def on_thread_create(thread):
    guild = thread.guild
    forum_channel = find_forum_channel(guild, FORUM_NAME)
    announcements = find_text_channel(guild, ANNOUNCEMENTS_NAME)

    if not forum_channel or not announcements:
        return

    # Only act if thread belongs to the forum
    if thread.parent_id != forum_channel.id:
        return

    # Find Event tag
    event_tag = find_forum_tag(forum_channel, EVENT_TAG_NAME)
    if not event_tag:
        return

    # Check applied tags
    if event_tag.id not in [t.id for t in thread.applied_tags]:
        return

    # Announce event if bot has role
    if bot_has_announcer_role(guild):
        await announcements.send(
            f"@everyone New event posted: **{thread.name}**\n"
            f"Click here to view details: {thread.jump_url}"
        )
    else:
        print(f"Warning: Robo-Thrall does not have the {ANNOUNCER_ROLE_NAME} role. Event announcement skipped.")

# ----------------- Run Bot -----------------
bot.run(TOKEN)
