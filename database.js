const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const initDB = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE universities (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE,
        domain TEXT UNIQUE
      )
    `);

    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        university_id INTEGER,
        reputation INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(university_id) REFERENCES universities(id)
      )
    `);

    db.run(`
      CREATE TABLE services (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        title TEXT,
        description TEXT,
        source_location TEXT,
        destination_location TEXT,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE bids (
        id INTEGER PRIMARY KEY,
        service_id INTEGER,
        bidder_id INTEGER,
        offer_text TEXT,
        accepted BOOLEAN DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(service_id) REFERENCES services(id),
        FOREIGN KEY(bidder_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE ratings (
        id INTEGER PRIMARY KEY,
        from_user_id INTEGER,
        to_user_id INTEGER,
        rating INTEGER,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(from_user_id) REFERENCES users(id),
        FOREIGN KEY(to_user_id) REFERENCES users(id)
      )
    `);
  });
};

module.exports = { db, initDB };
