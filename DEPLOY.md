# Deployment Guide

## Push to GitHub

1. Create a new repository on GitHub (https://github.com/new) named `dormdash`

2. In your terminal, run:

```bash
cd /Users/aprameyakannan/Documents/dormdash
git remote add origin https://github.com/YOUR_USERNAME/dormdash.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Run Locally

```bash
npm install
npm start
```

Visit `http://localhost:3001`

## Deploy to Production

### Option 1: Heroku (Free tier)

```bash
npm install -g heroku
heroku login
heroku create dormdash-yourname
git push heroku main
```

Then visit your app at: `https://dormdash-yourname.herokuapp.com`

### Option 2: Railway (Simple, with persistent DB)

1. Sign up at https://railway.app
2. Connect your GitHub repo
3. Set environment variables as needed
4. Auto-deploys on push to main

### Option 3: Render (Free tier with limitations)

1. Sign up at https://render.com
2. Create new Web Service from GitHub
3. Build command: `npm install`
4. Start command: `npm start`
5. Add SQLite persistence volume

## Make Database Persistent

Currently the app uses in-memory SQLite. For production, update `database.js`:

```javascript
// Change from:
const db = new sqlite3.Database(':memory:');

// To:
const db = new sqlite3.Database('./campus.db');
```

Then add to `.gitignore`:
```
campus.db
```

## Environment Variables

For multi-university setup, add `ALLOWED_UNIVERSITIES` env var:

```bash
export ALLOWED_UNIVERSITIES="mit.edu,stanford.edu,berkeley.edu"
```

## Cross-Campus Federation

To enable cross-campus interaction, add this to server.js:

```javascript
const CROSS_CAMPUS_ENABLED = process.env.CROSS_CAMPUS === 'true';
```

Then filter services by university or allow all based on this flag.
