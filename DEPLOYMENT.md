# mrMailer Vercel Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Push your code to GitHub

## Step 1: Set Up MongoDB Atlas

1. **Create a new cluster** in MongoDB Atlas
2. **Create a database user** with read/write permissions
3. **Whitelist IP addresses** (use `0.0.0.0/0` for Vercel)
4. **Get your connection string** (format: `mongodb+srv://username:password@cluster.mongodb.net/`)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DISCORD_BOT_TOKEN
vercel env add MONGODB_URI
# ... (add all variables from .env.vercel)
```

### Option B: Deploy via Vercel Dashboard

1. **Import Project**: Connect your GitHub repository to Vercel
2. **Configure Build**: Vercel will auto-detect Node.js
3. **Set Environment Variables**: Add all variables from `.env.vercel`

## Step 3: Environment Variables

Add these environment variables in Vercel dashboard:

### Required Variables:
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `MONGODB_URI` - Your MongoDB connection string
- `OPENROUTER_KEY` - Your OpenRouter API key
- `SMTP_USER` - Your Gmail address
- `SMTP_PASS` - Your Gmail app password

### Optional Variables:
- `DISCORD_CHANNEL_ID` - Restrict bot to specific channel
- `PREVIEW_ONLY` - Set to `true` to disable email sending
- `MONGODB_DATABASE` - Database name (default: `mrmailer`)

## Step 4: Update Discord Bot

1. **Update Bot URL**: In Discord Developer Portal, update your bot's webhook URL to your Vercel domain
2. **Test Commands**: Try sending `!apply` or `!pitch` commands

## Step 5: Upload CV File

Since Vercel doesn't support file uploads, you have two options:

### Option A: Use a CDN
1. Upload your CV to a CDN (like Cloudinary, AWS S3, or GitHub)
2. Update `CV_PATH` environment variable to the CDN URL

### Option B: Disable CV Attachment
1. Set `ATTACH_CV=false` in environment variables

## Database Migration

Your existing SQLite data won't automatically migrate. To migrate:

1. **Export SQLite data**:
```bash
sqlite3 agent.db "SELECT * FROM sent_emails;" > emails.csv
```

2. **Import to MongoDB** (create a migration script):
```javascript
// migration.js
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function migrate() {
  const client = new MongoClient('your_mongodb_uri');
  await client.connect();
  const db = client.db('mrmailer');
  const collection = db.collection('sent_emails');
  
  // Read and parse CSV data
  // Insert into MongoDB
  // (Implementation depends on your data format)
}
```

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Verify IP whitelist includes `0.0.0.0/0`
   - Check database user permissions

2. **Discord Bot Not Responding**
   - Verify `DISCORD_BOT_TOKEN` is correct
   - Check bot is invited to your server
   - Verify bot has proper permissions

3. **Email Sending Failed**
   - Check Gmail app password (not regular password)
   - Verify SMTP settings
   - Check `FROM_EMAIL` matches `SMTP_USER`

4. **Function Timeout**
   - Vercel has 30-second timeout for hobby plan
   - Consider upgrading to Pro plan for longer timeouts

## Monitoring

- **Vercel Dashboard**: Monitor function logs and performance
- **MongoDB Atlas**: Monitor database usage and performance
- **Discord Bot**: Check bot status in Discord Developer Portal

## Cost Considerations

- **Vercel Hobby Plan**: Free tier with limitations
- **MongoDB Atlas**: Free tier (512MB storage)
- **OpenRouter**: Pay-per-use pricing
- **Gmail**: Free for personal use

## Security Notes

- Never commit `.env` files to Git
- Use environment variables for all secrets
- Regularly rotate API keys and passwords
- Monitor for unusual activity in logs
