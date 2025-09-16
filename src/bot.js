const fs = require('fs');
const path = require('path');
const { createClient, parseCommand } = require("./discord");
const { DISCORD, DB } = require("./config");
const { generateEmail } = require("./ai");
const { sendEmail } = require("./email");
const dbAdapter = require("./db-adapter");
const { formatPreview } = require("./templates");

// Initialize database connection
async function initializeDatabase() {
  try {
    if (DB.type === 'mongodb') {
      await dbAdapter.connect();
      console.log('[db] ✅ Database connection initialized');
    }
  } catch (error) {
    console.error('[db] ❌ Failed to initialize database:', error);
  }
}

// Discord bot logic
async function handlePayload(msg, payload) {
  console.log(`[bot] 🚀 Processing ${payload.intent} command for ${payload.to}`);
  
  try {
    // Generate email content
    console.log(`[ai] 🤖 Generating email content...`);
    const emailContent = await generateEmail(payload);
    console.log(`[ai] ✅ Email content generated successfully`);
    
    // Send email
    console.log(`[email] 📧 Sending email to ${payload.to}...`);
    const emailResult = await sendEmail({
      to: payload.to,
      subject: emailContent.subject,
      text: emailContent.body,
      html: emailContent.html
    });
    console.log(`[email] ✅ Email sent successfully:`, emailResult.messageId);
    
    // Log to database
    console.log(`[db] 💾 Logging email to database...`);
    const dbResult = await dbAdapter.logEmail({
      to: payload.to,
      subject: emailContent.subject,
      body: emailContent.body,
      intent: payload.intent,
      role: payload.role,
      jobDesc: payload.jobDesc,
      extra: payload.extra,
      messageId: emailResult.messageId,
      timestamp: new Date().toISOString()
    });
    console.log(`[db] ✅ Email logged to database with ID:`, dbResult);
    
    // Send confirmation to Discord
    const preview = formatPreview(emailContent, payload);
    await msg.reply(`✅ **Email sent successfully!**\n\n${preview}`);
    console.log(`[discord] ✅ Confirmation sent to Discord`);
    
  } catch (error) {
    console.error(`[bot] ❌ Error processing command:`, error);
    await msg.reply(`❌ **Error:** ${error.message}`);
  }
}

async function run() {
  if (!DISCORD.token) {
    console.error("Missing DISCORD_BOT_TOKEN in environment");
    process.exit(1);
  }

  // Initialize database
  await initializeDatabase();

  const client = createClient();

  client.once("clientReady", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    console.log(`📋 Configuration:`);
    console.log(`   - Channel restriction: ${DISCORD.channelId ? `Channel ${DISCORD.channelId}` : 'All channels'}`);
    console.log(`   - AI Model: ${process.env.OPENROUTER_MODEL}`);
    console.log(`   - SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`   - CV Attachment: ${process.env.ATTACH_CV === 'true' ? 'YES' : 'NO'}`);
    console.log(`   - Database: ${DB.type.toUpperCase()}`);
    console.log(`🚀 Bot is ready to receive commands!`);
  });

  client.on("messageCreate", async (msg) => {
    try {
      console.log(`[discord] 📨 Message received from ${msg.author.tag} in #${msg.channel.name}: "${msg.content}"`);
      
      if (msg.author.bot) {
        console.log("[discord] 🤖 Ignoring bot message");
        return;
      }
      
      if (DISCORD.channelId && msg.channelId !== DISCORD.channelId) {
        console.log(`[discord] 🚫 Message not in configured channel (${DISCORD.channelId}), ignoring`);
        return; // restrict to channel if configured
      }

      const payload = parseCommand(msg.content);
      console.log("[discord] 🔍 Parsed payload:", payload);
      
      if (!payload) {
        console.log("[discord] ❌ No valid command found, ignoring message");
        return; // ignore non-commands
      }

      console.log(`[discord] ✅ Valid command detected: ${payload.intent} for ${payload.to}`);
      await handlePayload(msg, payload);
    } catch (err) {
      console.error("[bot] ❌ Message handler error", err);
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
