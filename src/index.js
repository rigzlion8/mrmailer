const fs = require('fs');
const path = require('path');
const { DB } = require("./config");
const dbAdapter = require("./db-adapter");


const express = require('express');
const app = express();

const PORT = process.env.PORT || 3003;

// Serve static files from public directory
app.use(express.static('public'));

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

//app.get('/', (req, res) => res.send('mr mailer is running!'));
app.get('/', async (req, res) => {
     // Fetch recent emails for all recipients (example: last 20 sent)
  let recent;
  try {
    recent = await dbAdapter.getAllRecent();
    console.log(`[dashboard] 📊 Retrieved ${recent ? recent.length : 0} emails`);
  } catch (error) {
    console.error(`[dashboard] ❌ Failed to get recent emails:`, error);
    const errorState = `
      <div class="text-center py-12">
        <div class="text-red-400 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Database Error</h3>
        <p class="text-gray-500 mb-4">Unable to load emails. Please check the database connection.</p>
        <div class="bg-red-50 rounded-lg p-4 text-left max-w-md mx-auto">
          <code class="text-sm text-red-800">${error.message}</code>
        </div>
      </div>
    `;
    const html = require('fs').readFileSync(path.join(__dirname, '../public/dashboard.html'), 'utf8');
    const finalHtml = html.replace('<!--EMAIL_ROWS-->', errorState);
    res.send(finalHtml);
    return;
  }
  
  // Validate that recent is an array
  if (!Array.isArray(recent)) {
    console.error(`[dashboard] ❌ getAllRecent returned non-array:`, typeof recent, recent);
    const errorState = `
      <div class="text-center py-12">
        <div class="text-red-400 text-6xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Data Format Error</h3>
        <p class="text-gray-500 mb-4">Invalid data format received from database.</p>
        <div class="bg-red-50 rounded-lg p-4 text-left max-w-md mx-auto">
          <code class="text-sm text-red-800">Expected array, got ${typeof recent}</code>
        </div>
      </div>
    `;
    const html = require('fs').readFileSync(path.join(__dirname, '../public/dashboard.html'), 'utf8');
    const finalHtml = html.replace('<!--EMAIL_ROWS-->', errorState);
    res.send(finalHtml);
    return;
  }

  // Read the dashboard HTML template
  const dashboardPath = path.join(__dirname, '../public/dashboard.html');
  let html = fs.readFileSync(dashboardPath, 'utf8');

  // Handle empty state
  if (recent.length === 0) {
    const emptyState = `
      <tr>
        <td colspan="4" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No emails sent yet</h3>
            <p class="text-gray-500 text-sm max-w-sm">Start by sending a command in Discord to generate and send your first AI-powered email.</p>
            <div class="mt-4 bg-blue-50 rounded-lg p-3 max-w-md">
              <p class="text-xs text-blue-700 font-medium">Try this command in Discord:</p>
              <code class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">!apply recipient@example.com | role: Developer | desc: Job description</code>
            </div>
          </div>
        </td>
      </tr>
    `;
    html = html.replace('<!--EMAIL_ROWS-->', emptyState);
    res.send(html);
    return;
  }

  // Generate table rows with enhanced styling and show more functionality
  const rows = recent.map((email, index) => {
    const emailId = `email-${index}`;
    
    // Handle both SQLite (to_email) and MongoDB (to) data structures
    const recipientEmail = email.to_email || email.to || 'unknown@example.com';
    const emailBody = email.body || '';
    const truncatedBody = emailBody.length > 150 ? emailBody.substring(0, 150) + '...' : emailBody;
    const showMoreButton = emailBody.length > 150 ? 
      `<button onclick="toggleEmailBody(this, '${emailId}')" class="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors duration-200">Show more</button>` : '';
    
    const intentColor = email.intent === 'apply' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    const intentIcon = email.intent === 'apply' ? '📝' : '🚀';
    
    return `
      <tr class="hover:bg-gray-50 transition-colors duration-200">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              ${recipientEmail.charAt(0).toUpperCase()}
            </div>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-900">${recipientEmail}</div>
              <div class="text-xs text-gray-500">${email.role || 'No role specified'}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="max-w-md">
            <div class="text-sm font-medium text-gray-900 mb-2">${email.subject}</div>
            <div class="relative">
              <div id="email-body-${emailId}" class="email-body text-sm text-gray-600 leading-relaxed">
                ${email.body}
              </div>
              <div id="fade-${emailId}" class="fade-gradient absolute bottom-0 left-0 right-0 h-8 pointer-events-none"></div>
              ${showMoreButton}
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${intentColor}">
            <span class="mr-1">${intentIcon}</span>
            ${email.intent}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ${new Date(email.created_at).toLocaleString()}
            </div>
            <button onclick="deleteEmail('${email.id || email._id}')" class="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200" title="Delete email">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
    </tr>
    `;
  }).join('');

  // Generate mobile cards
  const mobileCards = recent.map((email, index) => {
    const emailId = `mobile-email-${index}`;
    
    // Handle both SQLite (to_email) and MongoDB (to) data structures
    const recipientEmail = email.to_email || email.to || 'unknown@example.com';
    const emailBody = email.body || '';
    const truncatedBody = emailBody.length > 150 ? emailBody.substring(0, 150) + '...' : emailBody;
    const showMoreButton = emailBody.length > 150 ? 
      `<button onclick="toggleEmailBody(this, '${emailId}')" class="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors duration-200">Show more</button>` : '';
    
    const intentColor = email.intent === 'apply' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    const intentIcon = email.intent === 'apply' ? '📝' : '🚀';
    
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-start space-x-3 mb-3">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            ${recipientEmail.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">${recipientEmail}</div>
            <div class="text-xs text-gray-500">${email.role || 'No role specified'}</div>
          </div>
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${intentColor}">
            <span class="mr-1">${intentIcon}</span>
            ${email.intent}
          </span>
        </div>
        
        <div class="mb-3">
          <div class="text-sm font-medium text-gray-900 mb-2">${email.subject}</div>
          <div class="relative">
            <div id="email-body-${emailId}" class="email-body text-sm text-gray-600 leading-relaxed">
              ${emailBody}
            </div>
            <div id="fade-${emailId}" class="fade-gradient absolute bottom-0 left-0 right-0 h-8 pointer-events-none"></div>
            ${showMoreButton}
          </div>
        </div>
        
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${new Date(email.created_at).toLocaleString()}
          </div>
          <button onclick="deleteEmail('${email.id || email._id}')" class="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200" title="Delete email">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Inject rows and mobile cards into the HTML
  html = html.replace('<!--EMAIL_ROWS-->', rows);
  html = html.replace('<!--MOBILE_EMAIL_CARDS-->', mobileCards);
  
  res.send(html);
});

// Delete endpoint for soft deleting emails
app.delete('/api/email/:id', async (req, res) => {
  try {
    const emailId = req.params.id;
    
    // For SQLite, try to parse as integer
    if (DB.type === 'sqlite') {
      const parsedId = parseInt(emailId);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Invalid email ID' });
      }
      
      const result = await dbAdapter.softDeleteEmail(parsedId);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }
    } else {
      // For MongoDB, use the string ID directly
      const result = await dbAdapter.softDeleteEmail(emailId);
      if (!result) {
        return res.status(404).json({ error: 'Email not found' });
      }
    }
    
    res.json({ success: true, message: 'Email deleted successfully' });
  } catch (err) {
    console.error('[api] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

app.listen(PORT, async () => {
  console.log(`HTTP server listening on port ${PORT}`);
  await initializeDatabase();
});

// Dashboard-only server - Discord bot runs separately on Railway
