const { DB } = require("./config");

// Import database implementations conditionally
let sqliteDB = null;
let mongoDB = null;

// Only import SQLite if we're using it
if (DB.type === "sqlite") {
  try {
    sqliteDB = require("./db");
  } catch (error) {
    console.error("Failed to load SQLite database:", error.message);
  }
}

// Only import MongoDB if we're using it
if (DB.type === "mongodb") {
  try {
    mongoDB = require("./db-mongodb");
  } catch (error) {
    console.error("Failed to load MongoDB database:", error.message);
  }
}

// Database adapter that switches between SQLite and MongoDB
class DatabaseAdapter {
  constructor() {
    this.dbType = DB.type;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    if (this.dbType === "mongodb") {
      if (!mongoDB) {
        throw new Error("MongoDB module not loaded. Check your environment variables.");
      }
      await mongoDB.connectDB();
    } else if (this.dbType === "sqlite") {
      if (!sqliteDB) {
        throw new Error("SQLite module not loaded. Check your environment variables.");
      }
      // SQLite doesn't need explicit connection
    } else {
      throw new Error(`Unsupported database type: ${this.dbType}. Use 'sqlite' or 'mongodb'.`);
    }
    this.isConnected = true;
  }

  async logEmail(emailData) {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      if (!mongoDB) throw new Error("MongoDB not available");
      return await mongoDB.logEmail(emailData);
    } else {
      if (!sqliteDB) throw new Error("SQLite not available");
      return sqliteDB.logEmail(emailData);
    }
  }

  async recentFor(email) {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      if (!mongoDB) throw new Error("MongoDB not available");
      return await mongoDB.recentFor(email);
    } else {
      if (!sqliteDB) throw new Error("SQLite not available");
      return sqliteDB.recentFor(email);
    }
  }

  async getAllRecent() {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      if (!mongoDB) throw new Error("MongoDB not available");
      return await mongoDB.getAllRecent();
    } else {
      if (!sqliteDB) throw new Error("SQLite not available");
      // For SQLite, we need to use the raw database
      const db = sqliteDB.db;
      return db.prepare('SELECT * FROM sent_emails WHERE deleted = FALSE ORDER BY created_at DESC LIMIT 20').all();
    }
  }

  async softDeleteEmail(id) {
    await this.connect();
    
    if (this.dbType === "mongodb") {
      if (!mongoDB) throw new Error("MongoDB not available");
      return await mongoDB.softDeleteEmail(id);
    } else {
      if (!sqliteDB) throw new Error("SQLite not available");
      return sqliteDB.softDeleteEmail(id);
    }
  }

  async close() {
    if (this.dbType === "mongodb" && mongoDB) {
      await mongoDB.closeDB();
    }
    this.isConnected = false;
  }

  // Get the raw database instance (for compatibility)
  get rawDB() {
    if (this.dbType === "mongodb") {
      if (!mongoDB) throw new Error("MongoDB not available");
      return mongoDB.getDB();
    } else {
      if (!sqliteDB) throw new Error("SQLite not available");
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
