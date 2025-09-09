/*
  src/index.js — fixed / improved
  - clearer validation
  - preview-only mode (ENV PREVIEW_ONLY=true)
  - better error handling and graceful shutdown
  - moves payload handling into a helper for clarity
*/

const { createClient, parseCommand } = require("./discord");
const { DISCORD } = require("./config");
const { generateEmail } = require("./ai");
const { sendEmail } = require("./email");
const { logEmail, recentFor } = require("./db");
const { formatPreview } = require("./templates");

const PREVIEW_ONLY = (process.env.PREVIEW_ONLY || "false").toLowerCase() === "true";

async function handlePayload(msg, payload) {
  const { intent, to, role, jobDesc, extra } = payload;

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return msg.reply("❌ Provide a valid recipient email as the first argument (e.g. `recipient@example.com`).");
  }

  try {
    const recent = recentFor(to);
    if (recent && recent.length) {
      await msg.reply(`⚠️ Recently emailed ${to} (${recent.length}x). Proceeding anyway...`);
    }
  } catch (err) {
    console.warn("[db] could not fetch recent emails", err);
  }

  const generating = await msg.channel.send("🧠 Generating email...");

  let subject, body;
  try {
    ({ subject, body } = await generateEmail({ intent, recipient: to, role, jobDesc, extra }));
  } catch (err) {
    console.error("[ai] generation error", err);
    await generating.edit("❌ Failed to generate email. See logs.");
    throw err;
  }

  await generating.edit("✅ Generated. Preview below:");
  await msg.channel.send(formatPreview({ subject, body, to }));

  if (PREVIEW_ONLY) {
    await msg.reply("🛑 PREVIEW_ONLY is enabled — not sending. Set PREVIEW_ONLY=false in your .env to enable sending.");
    return;
  }

  await msg.channel.send("📨 Sending...");

  let info;
  try {
    info = await sendEmail({ to, subject, text: body, attachCV: true });
  } catch (err) {
    console.error("[email] send error", err);
    await msg.reply(`❌ Failed to send email: ${err.message}`);
    return;
  }

  try {
    logEmail({ to, subject, body, intent, role, jobDesc, extra, messageId: info?.messageId || null });
  } catch (err) {
    console.warn("[db] failed to log email", err);
  }

  await msg.reply(`✅ Sent to **${to}** | MessageID: ${info?.messageId || "(n/a)"}`);
}

async function run() {
  if (!DISCORD.token) {
    console.error("Missing DISCORD_BOT_TOKEN in environment");
    process.exit(1);
  }

  const client = createClient();

  client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    if (DISCORD.channelId) console.log(`Listening only on channel ${DISCORD.channelId}`);
  });

  client.on("messageCreate", async (msg) => {
    try {
      if (msg.author.bot) return;
      if (DISCORD.channelId && msg.channelId !== DISCORD.channelId) return; // restrict to channel if configured

      const payload = parseCommand(msg.content);
      if (!payload) return; // ignore non-commands

      await handlePayload(msg, payload);
    } catch (err) {
      console.error("[bot] message handler error", err);
      try { await msg.reply(`❌ Error: ${err.message}`); } catch (e) { console.error("Failed to send error reply", e); }
    }
  });

  client.on("error", e => console.error("[discord] client error", e));

  try {
    await client.login(DISCORD.token);
  } catch (err) {
    console.error("Failed to login Discord client", err);
    process.exit(1);
  }

  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    try { await client.destroy(); } catch (e) { /* no-op */ }
    process.exit(0);
  });
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
