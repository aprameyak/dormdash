const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { db, initDB } = require('./database');
const { seedDB } = require('./fixtures');

const app = express();
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(bodyParser.json({ limit: '10kb' }));
app.use(express.static('public'));

const sessions = new Map();

initDB();
seedDB();

const getAuthUser = (token) => {
  return sessions.get(token);
};

app.post('/api/login', (req, res) => {
  const { email } = req.body;
  if (!email.includes('.edu') || !email.includes('@')) {
    return res.status(400).json({ error: 'Must use .edu email' });
  }

  db.get(
    'SELECT u.*, un.name as university_name FROM users u JOIN universities un ON u.university_id = un.id WHERE u.email = ?',
    [email],
    (err, user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const token = Math.random().toString(36).slice(2);
      sessions.set(token, user);
      res.json({ user, token });
    }
  );
});

app.post('/api/register', (req, res) => {
  const { email, name, university } = req.body;
  if (!email.includes('.edu') || !email.includes('@')) {
    return res.status(400).json({ error: 'Must use .edu email' });
  }
  if (!name || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'Invalid name' });
  }

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
          const token = Math.random().toString(36).slice(2);
          sessions.set(token, user);
          res.json({ user, token });
        }
      );
    }
  );
});

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = getAuthUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = user;
  next();
};

// Services
app.get('/api/services', requireAuth, (req, res) => {

  db.all(
    `SELECT s.*, u.name as user_name, u.email, un.name as university_name, u.reputation
     FROM services s
     JOIN users u ON s.user_id = u.id
     JOIN universities un ON u.university_id = un.id
     WHERE s.status = 'open' AND u.university_id = ?
     ORDER BY s.created_at DESC`,
    [req.user.university_id],
    (err, services) => {
      res.json(services || []);
    }
  );
});

app.post('/api/services', requireAuth, (req, res) => {
  const { title, description, source_location, destination_location } = req.body;
  if (!title || title.length > 200 || !source_location || source_location.length > 200) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  db.run(
    `INSERT INTO services (user_id, title, description, source_location, destination_location)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, title, description || '', source_location, destination_location || ''],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create service' });
      }
      res.json({ service_id: this.lastID });
    }
  );
});

// Bids
app.post('/api/bids', requireAuth, (req, res) => {
  const { service_id, offer_text } = req.body;
  if (!offer_text || offer_text.length > 500) {
    return res.status(400).json({ error: 'Invalid offer' });
  }

  db.get(
    `SELECT u.university_id FROM services s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [service_id],
    (err, service) => {
      if (!service || service.university_id !== req.user.university_id) {
        return res.status(403).json({ error: 'Can only bid on services from your university' });
      }

      db.run(
        `INSERT INTO bids (service_id, bidder_id, offer_text)
         VALUES (?, ?, ?)`,
        [service_id, req.user.id, offer_text],
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

app.post('/api/bids/:id/accept', requireAuth, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT b.id, s.user_id FROM bids b
     JOIN services s ON b.service_id = s.id
     WHERE b.id = ?`,
    [id],
    (err, bid) => {
      if (!bid || bid.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Can only accept bids on your services' });
      }

      db.run('UPDATE bids SET accepted = 1 WHERE id = ?', [id], () => {
        db.get('SELECT service_id FROM bids WHERE id = ?', [id], (err, b) => {
          db.run('UPDATE services SET status = ? WHERE id = ?', ['in_progress', b.service_id]);
          res.json({ success: true });
        });
      });
    }
  );
});

app.post('/api/bids/:id/complete', requireAuth, (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be 1-5' });
  }

  db.get(
    `SELECT b.*, s.user_id FROM bids b
     JOIN services s ON b.service_id = s.id
     WHERE b.id = ?`,
    [id],
    (err, bid) => {
      if (!bid || bid.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Can only complete bids on your services' });
      }

      db.run('UPDATE bids SET completed = 1 WHERE id = ?', [id], () => {
        db.run('UPDATE services SET status = ? WHERE id = ?', ['completed', bid.service_id]);

        if (rating) {
          db.run(
            'INSERT INTO ratings (from_user_id, to_user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [req.user.id, bid.bidder_id, rating, comment || ''],
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
    }
  );
});

app.get('/api/user', requireAuth, (req, res) => {
  res.json(req.user);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
