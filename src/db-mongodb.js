const { MongoClient } = require("mongodb");
const { DB } = require("./config");

let client;
let db;

// MongoDB connection
async function connectDB() {
  if (client && db) return client;
  
  try {
    console.log(`[db] 🔌 Connecting to MongoDB...`);
    console.log(`[db] 📋 Connection string: ${DB.connectionString ? 'Set' : 'Not set'}`);
    console.log(`[db] 📋 Database name: ${DB.databaseName || 'mrmailer'}`);
    
    if (!DB.connectionString) {
      throw new Error("MongoDB connection string not provided");
    }
    
    client = new MongoClient(DB.connectionString);
    await client.connect();
    
    // Test the connection
    await client.db("admin").command({ ping: 1 });
    console.log(`[db] ✅ MongoDB ping successful`);
    
    db = client.db(DB.databaseName || 'mrmailer');
    console.log(`[db] ✅ Connected to MongoDB database: ${db.databaseName}`);
    return client;
  } catch (error) {
    console.error(`[db] ❌ MongoDB connection failed:`, error);
    client = null;
    db = null;
    throw error;
  }
}

// Get database instance
async function getDB() {
  if (!db) {
    await connectDB();
  }
  if (!db) {
    throw new Error("Failed to establish database connection");
  }
  return db;
}

// Get collection
async function getCollection(name) {
  const database = await getDB();
  if (!database) {
    throw new Error("Database instance is null");
  }
  return database.collection(name);
}

// Log email to database
async function logEmail(emailData) {
  console.log(`[db] 💾 Logging email to MongoDB for ${emailData.to}`);
  console.log(`[db] 📋 Details: intent=${emailData.intent}, role=${emailData.role}, messageId=${emailData.messageId}`);
  
  try {
    const collection = await getCollection('sent_emails');
    const result = await collection.insertOne({
      ...emailData,
      created_at: new Date(),
      deleted: false
    });
    
    console.log(`[db] ✅ Email logged with ID: ${result.insertedId}`);
    return result;
  } catch (error) {
    console.error(`[db] ❌ Failed to log email:`, error);
    throw error;
  }
}

// Get recent emails for a specific email address
async function recentFor(email) {
  console.log(`[db] 🔍 Checking recent emails for ${email}`);
  
  try {
    const collection = await getCollection('sent_emails');
    const result = await collection
      .find({ 
        to_email: email, 
        deleted: false 
      })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    console.log(`[db] 📊 Found ${result.length} recent emails for ${email}`);
    return result;
  } catch (error) {
    console.error(`[db] ❌ Failed to fetch recent emails:`, error);
    throw error;
  }
}

// Get all recent emails (for dashboard)
async function getAllRecent() {
  console.log(`[db] 🔍 Fetching all recent emails`);
  
  try {
    const collection = await getCollection('sent_emails');
    const result = await collection
      .find({ deleted: false })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    
    console.log(`[db] 📊 Found ${result.length} recent emails`);
    return result;
  } catch (error) {
    console.error(`[db] ❌ Failed to fetch all recent emails:`, error);
    throw error;
  }
}

// Soft delete email
async function softDeleteEmail(id) {
  console.log(`[db] 🗑️ Soft deleting email with ID: ${id}`);
  
  try {
    const collection = await getCollection('sent_emails');
    const { ObjectId } = require('mongodb');
    
    // Handle both string and ObjectId formats
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const result = await collection.updateOne(
      { _id: queryId },
      { $set: { deleted: true } }
    );
    
    console.log(`[db] ✅ Email soft deleted, modified count: ${result.modifiedCount}`);
    return result;
  } catch (error) {
    console.error(`[db] ❌ Failed to soft delete email:`, error);
    throw error;
  }
}

// Close database connection
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log(`[db] 🔌 MongoDB connection closed`);
  }
}

module.exports = { 
  connectDB, 
  getDB, 
  getCollection, 
  logEmail, 
  recentFor, 
  getAllRecent, 
  softDeleteEmail, 
  closeDB 
};
