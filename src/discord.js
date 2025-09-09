const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { DISCORD } = require("./config");


function createClient() {
const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
],
partials: [Partials.Channel]
});
return client;
}


function parseCommand(content) {
// Supported:
// !pitch recipient@example.com | role: Web Dev | desc: ... | extra: ...
// !apply hr@company.com | role: Frontend | desc: JD text or URL | extra: ...
const m = content.match(/^!(pitch|apply)\s+(.+)/i);
if (!m) return null;
const intent = m[1].toLowerCase();
const rest = m[2];


const parts = rest.split("|").map(s => s.trim());
const to = parts.shift();


const payload = { intent, to, role: "", jobDesc: "", extra: "" };
for (const p of parts) {
const [k, ...v] = p.split(":");
if (!k || !v.length) continue;
const key = k.trim().toLowerCase();
const val = v.join(":").trim();
if (key === "role") payload.role = val;
else if (key === "desc") payload.jobDesc = val;
else if (key === "extra") payload.extra = val;
}
return payload;
}


module.exports = { createClient, parseCommand };