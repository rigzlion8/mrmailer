const { DB } = require("./config");

// Import both database implementations
const sqliteDB = require("./db");
const mongoDB = require("./db-mongodb");

// Database adapter that switches between SQLite and MongoDB
class DatabaseAdapter {
  constructor() {
    this.dbType = DB.type;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    if (this.dbType === "mongodb") {
      await mongoDB.connectDB();
    }
    // SQLite doesn't need explicit connection
    this.isConnected = true;
  }

  async logEmail(emailData) {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      return await mongoDB.logEmail(emailData);
    } else {
      return sqliteDB.logEmail(emailData);
    }
  }

  async recentFor(email) {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      return await mongoDB.recentFor(email);
    } else {
      return sqliteDB.recentFor(email);
    }
  }

  async getAllRecent() {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      return await mongoDB.getAllRecent();
    } else {
      // For SQLite, we need to use the raw database
      const db = sqliteDB.db;
      return db.prepare('SELECT * FROM sent_emails WHERE deleted = FALSE ORDER BY created_at DESC LIMIT 20').all();
    }
  }

  async softDeleteEmail(id) {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      return await mongoDB.softDeleteEmail(id);
    } else {
      return sqliteDB.softDeleteEmail(id);
    }
  }

  async close() {
    if (this.dbType === "mongodb") {
      await mongoDB.closeDB();
    }
    this.isConnected = false;
  }

  // Get the raw database instance (for compatibility)
  get rawDB() {
    if (this.dbType === "mongodb") {
      return mongoDB.getDB();
    } else {
      return sqliteDB.db;
    }
  }
}

// Create singleton instance
const dbAdapter = new DatabaseAdapter();

module.exports = {
  // Main functions
  logEmail: (emailData) => dbAdapter.logEmail(emailData),
  recentFor: (email) => dbAdapter.recentFor(email),
  getAllRecent: () => dbAdapter.getAllRecent(),
  softDeleteEmail: (id) => dbAdapter.softDeleteEmail(id),
  
  // Connection management
  connect: () => dbAdapter.connect(),
  close: () => dbAdapter.close(),
  
  // Raw database access (for compatibility)
  get db() {
    return dbAdapter.rawDB;
  }
};
