# DormDash

Campus-only peer delivery platform for students. Request deliveries, errands, tutoring—or offer your services to earn money, volunteer, or help for free. Connect with verified peers at your university.

Cutting out the middleman: direct student-to-student transactions with transparent pricing and reputation.

## Features

- 🎓 University verification via .edu email
- 💬 Transparent bidding system with offers visible to all
- ⭐ Reputation system based on ratings
- 🏫 Campus-scoped services
- 🤝 Honor system for payments (handled externally via Venmo, etc.)

## Quick Start

### Prerequisites
- Node.js 14+
- npm

### Installation

```bash
cd campus-bidding
npm install
```

### Running

```bash
npm start
```

Server runs on `http://localhost:3001`

Open your browser to `http://localhost:3001`

### Default Test Accounts

The app comes pre-loaded with fixtures:

- `alice@mit.edu` (MIT)
- `bob@mit.edu` (MIT)
- `carol@stanford.edu` (Stanford)
- `david@berkeley.edu` (UC Berkeley)
- `eve@harvard.edu` (Harvard)

Try logging in with any of these emails!

## Usage

1. **Login/Register** - Use your .edu email
2. **Post a Service** - Offer to help or ask for help (source → destination)
3. **Browse Services** - See what others need/offer
4. **Place Bids** - Make an offer (e.g., "Can do for $5", "Happy to volunteer")
5. **Rate** - After completion, rate the other person

## Architecture

- **Backend**: Node.js + Express + SQLite
- **Frontend**: Vanilla JavaScript
- **Auth**: Email-based (no external auth)
- **Data**: In-memory SQLite (resets on restart)

## API Endpoints

- `POST /api/login` - Login with email
- `POST /api/register` - Register new user
- `GET /api/services` - List open services
- `POST /api/services` - Post a new service
- `POST /api/bids` - Place a bid
- `GET /api/services/:id/bids` - Get bids for service
- `POST /api/bids/:id/accept` - Accept a bid
- `POST /api/bids/:id/complete` - Complete and rate

## Next Steps

- Persistence: Replace in-memory SQLite with file-based DB
- Payment integration: Add Venmo/CashApp verification
- Matching algorithm: Add ML-based bidder suggestions
- Cross-campus federation: Add university whitelisting
- Mobile app: React Native version

## License

MIT
