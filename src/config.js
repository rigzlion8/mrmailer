require("dotenv").config();


const DISCORD = {
token: process.env.DISCORD_BOT_TOKEN,
channelId: process.env.DISCORD_CHANNEL_ID || null
};


const SMTP = {
host: process.env.SMTP_HOST,
port: parseInt(process.env.SMTP_PORT || "587", 10),
user: process.env.SMTP_USER,
pass: process.env.SMTP_PASS,
from: process.env.SMTP_FROM
};


// OpenRouter config
const OPENAI_CONFIG = {
apiKey: process.env.OPENROUTER_KEY,
model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
};


const PROFILE = {
name: process.env.PROFILE_NAME || "John Doe",
title: process.env.PROFILE_TITLE || "Fullstack Developer",
location: process.env.PROFILE_LOCATION || "Remote",
links: process.env.PROFILE_LINKS || "https://portfolio.example.com"
};


module.exports = {
DISCORD,
SMTP,
OPENAI_CONFIG,
PROFILE
};