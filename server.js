const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { db, initDB } = require('./database');
const { seedDB } = require('./fixtures');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let currentUser = null;

initDB();
seedDB();

// Auth
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  db.get(
    'SELECT u.*, un.name as university_name FROM users u JOIN universities un ON u.university_id = un.id WHERE u.email = ?',
    [email],
    (err, user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      currentUser = user;
      res.json({ user });
    }
  );
});

app.post('/api/register', (req, res) => {
  const { email, name, university } = req.body;
  db.run(
    `INSERT INTO users (email, name, university_id)
     SELECT ?, ?, id FROM universities WHERE name = ?`,
    [email, name, university],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Registration failed' });
      }
      db.get(
        'SELECT u.*, un.name as university_name FROM users u JOIN universities un ON u.university_id = un.id WHERE u.email = ?',
        [email],
        (err, user) => {
          currentUser = user;
          res.json({ user });
        }
      );
    }
  );
});

// Services
app.get('/api/services', (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.all(
    `SELECT s.*, u.name as user_name, u.email, un.name as university_name, u.reputation
     FROM services s
     JOIN users u ON s.user_id = u.id
     JOIN universities un ON u.university_id = un.id
     WHERE s.status = 'open' AND u.university_id = ?
     ORDER BY s.created_at DESC`,
    [currentUser.university_id],
    (err, services) => {
      res.json(services || []);
    }
  );
});

app.post('/api/services', (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { title, description, source_location, destination_location } = req.body;
  db.run(
    `INSERT INTO services (user_id, title, description, source_location, destination_location)
     VALUES (?, ?, ?, ?, ?)`,
    [currentUser.id, title, description, source_location, destination_location],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create service' });
      }
      res.json({ service_id: this.lastID });
    }
  );
});

// Bids
app.post('/api/bids', (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { service_id, offer_text } = req.body;

  db.get(
    `SELECT u.university_id FROM services s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [service_id],
    (err, service) => {
      if (!service || service.university_id !== currentUser.university_id) {
        return res.status(403).json({ error: 'Can only bid on services from your university' });
      }

      db.run(
        `INSERT INTO bids (service_id, bidder_id, offer_text)
         VALUES (?, ?, ?)`,
        [service_id, currentUser.id, offer_text],
        function(err) {
          if (err) {
            return res.status(400).json({ error: 'Failed to place bid' });
          }
          res.json({ bid_id: this.lastID });
        }
      );
    }
  );
});

app.get('/api/services/:id/bids', (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT b.*, u.name, u.email, u.reputation
     FROM bids b
     JOIN users u ON b.bidder_id = u.id
     WHERE b.service_id = ?
     ORDER BY b.created_at ASC`,
    [id],
    (err, bids) => {
      res.json(bids || []);
    }
  );
});

app.post('/api/bids/:id/accept', (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  db.run(
    `UPDATE bids SET accepted = 1 WHERE id = ?`,
    [id],
    () => {
      db.get('SELECT service_id FROM bids WHERE id = ?', [id], (err, bid) => {
        db.run('UPDATE services SET status = ? WHERE id = ?', ['in_progress', bid.service_id]);
        res.json({ success: true });
      });
    }
  );
});

app.post('/api/bids/:id/complete', (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const { rating, comment } = req.body;

  db.run('UPDATE bids SET completed = 1 WHERE id = ?', [id], () => {
    db.get('SELECT service_id, bidder_id FROM bids WHERE id = ?', [id], (err, bid) => {
      db.run('UPDATE services SET status = ? WHERE id = ?', ['completed', bid.service_id]);

      if (rating) {
        db.run(
          'INSERT INTO ratings (from_user_id, to_user_id, rating, comment) VALUES (?, ?, ?, ?)',
          [currentUser.id, bid.bidder_id, rating, comment],
          () => {
            db.run(
              'UPDATE users SET reputation = reputation + ? WHERE id = ?',
              [rating, bid.bidder_id]
            );
          }
        );
      }

      res.json({ success: true });
    });
  });
});

app.get('/api/user', (req, res) => {
  res.json(currentUser || null);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
