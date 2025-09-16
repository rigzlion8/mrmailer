# Railway Deployment Guide for Discord Bot

This guide will help you deploy the Discord bot to Railway while keeping the dashboard on Vercel.

## 🚀 Quick Setup

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### 2. Deploy from GitHub
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `mrmailer` repository
4. Railway will automatically detect the `railway.json` config

### 3. Set Environment Variables
In the Railway dashboard, go to your project → Variables tab and add:

```bash
# Copy all variables from .env.railway file
NODE_ENV=production
DISCORD_BOT_TOKEN=your_discord_bot_token_here
OPENROUTER_KEY=your_openrouter_key_here
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password_here
MONGODB_URI=your_mongodb_connection_string_here
# ... (see .env.railway for complete list)
```

### 4. Deploy
1. Railway will automatically build and deploy
2. The bot will start running immediately
3. Check the logs to ensure it's working

## 🔑 **Environment Values for Railway**

**Important:** The actual environment values are stored in a separate file for security. 

**To get your environment values:**
1. Check the `.env` file in your local project
2. Copy the values from there to Railway dashboard
3. Or contact the project owner for the values

**Required variables:**
- `DISCORD_BOT_TOKEN`
- `OPENROUTER_KEY` 
- `SMTP_USER` and `SMTP_PASS`
- `MONGODB_URI`
- `DISCORD_GUILD_ID`
- `FROM_NAME` and `FROM_EMAIL`
- `PROFILE_*` variables
- `DB_TYPE` and `MONGODB_DATABASE`

## 🔧 Configuration

### Railway Settings
- **Start Command**: `node src/bot.js` (automatically set by railway.json)
- **Port**: Railway assigns automatically
- **Restart Policy**: ON_FAILURE with 10 retries

### Environment Variables Required
All variables from `.env.railway` must be set in Railway dashboard.

## 📊 Monitoring

### View Logs
1. Go to Railway dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on latest deployment
5. View real-time logs

### Bot Status
Look for these log messages:
- `🤖 Logged in as mrmailer#8411`
- `🚀 Bot is ready to receive commands!`
- `[discord] 📨 Message received from...`

## 🔄 Updates

### Automatic Updates
Railway automatically redeploys when you push to the main branch.

### Manual Updates
1. Push changes to GitHub
2. Railway will detect changes
3. New deployment will start automatically

## 🐛 Troubleshooting

### Bot Not Responding
1. Check Railway logs for errors
2. Verify Discord bot token is correct
3. Ensure bot has proper permissions in Discord server
4. Check if bot is online in Discord

### Database Connection Issues
1. Verify MongoDB URI is correct
2. Check MongoDB Atlas IP whitelist
3. Ensure database user has proper permissions

### Email Sending Issues
1. Verify SMTP credentials
2. Check Gmail app password (not regular password)
3. Ensure 2FA is enabled on Gmail account

## 📈 Scaling

### Railway Plans
- **Hobby**: $5/month - Perfect for Discord bots
- **Pro**: $20/month - For high-traffic bots
- **Team**: $99/month - For enterprise use

### Resource Usage
- **Memory**: ~100MB typical usage
- **CPU**: Low usage for Discord bots
- **Storage**: Minimal (logs only)

## 🔐 Security

### Environment Variables
- Never commit `.env` files to Git
- Use Railway's secure environment variable storage
- Rotate API keys regularly

### Discord Bot Security
- Use minimal required permissions
- Regularly audit bot permissions
- Monitor for unusual activity

## 📞 Support

### Railway Support
- Documentation: [docs.railway.app](https://docs.railway.app)
- Discord: [Railway Discord](https://discord.gg/railway)
- GitHub: [Railway GitHub](https://github.com/railwayapp)

### This Project
- GitHub Issues: [mrmailer/issues](https://github.com/rigzlion8/mrmailer/issues)
- Discord: Contact the bot owner

## ✅ Success Checklist

- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] Environment variables set
- [ ] Bot deployed successfully
- [ ] Bot appears online in Discord
- [ ] Test command works (`!pitch test@example.com`)
- [ ] Email sent successfully
- [ ] Database logging works
- [ ] Dashboard shows sent emails

## 🎉 You're Done!

Your Discord bot is now running on Railway and your dashboard is on Vercel. Both share the same MongoDB database, so everything is connected!

**Next Steps:**
1. Test the bot with a real command
2. Monitor the logs for any issues
3. Set up monitoring/alerting if needed
4. Enjoy your fully functional mrMailer system!
