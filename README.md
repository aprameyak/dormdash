# DormDash

DormDash is a small campus marketplace prototype for students. You post a request for a delivery, errand, or other favor, and students at the same university reply with offers such as "Can do for $5" or "Happy to help for free". Payment happens outside the app.

It is one Express server with an in-memory SQLite database and a single HTML page. Everything resets when the server restarts.

## Quick start

Prerequisites: Node.js and npm.

```bash
npm install
npm start          # http://localhost:3001
```

`npm run dev` runs the same server under nodemon. No environment variables are needed, and the port is fixed at 3001 in `server.js`.

Open http://localhost:3001 and log in with one of the seeded accounts, which have no password:

- `alice@mit.edu`, `bob@mit.edu` (MIT)
- `carol@stanford.edu` (Stanford)
- `david@berkeley.edu` (UC Berkeley)
- `eve@harvard.edu` (Harvard)

If the email is not found, the page registers it using the name and university you enter. The university must be one of the four seeded names.

## Features

- Email-only login. The only check is that the address contains `@` and `.edu`; there is no password or email verification.
- Post a service request with a title, description, pickup location, and drop-off location
- The feed shows only open requests from users at your own university
- Place a free-text offer on a request. Offers on a request are visible to anyone who opens it.
- API endpoints let the requester accept an offer and then mark it complete with a 1 to 5 rating. The rating is added to the helper's reputation score.

The web page covers login, posting, browsing, and offering. Accepting and completing offers are only available through the API.

## API

All routes except login, register, and listing offers need an `Authorization: Bearer <token>` header with the token returned by login or register.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/login` | `{ email }`, returns `{ user, token }` |
| POST | `/api/register` | `{ email, name, university }`, returns `{ user, token }` |
| GET | `/api/user` | Current user |
| GET | `/api/services` | Open requests at your university |
| POST | `/api/services` | `{ title, description, source_location, destination_location }` |
| POST | `/api/bids` | `{ service_id, offer_text }`, same university only |
| GET | `/api/services/:id/bids` | Offers on a request |
| POST | `/api/bids/:id/accept` | Requester accepts an offer; the request moves to `in_progress` |
| POST | `/api/bids/:id/complete` | `{ rating, comment }`; the request moves to `completed` |

Example:

```bash
TOKEN=$(curl -s -X POST localhost:3001/api/login \
  -H "Content-Type: application/json" -d '{"email":"alice@mit.edu"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s localhost:3001/api/services -H "Authorization: Bearer $TOKEN"
```

## How it works

- `server.js`: Express app, request validation, and all routes. Session tokens are random strings kept in an in-memory `Map`.
- `database.js`: opens SQLite with `:memory:` and creates the `universities`, `users`, `services`, `bids`, and `ratings` tables.
- `fixtures.js`: seeds four universities, five users, and a few sample requests on startup.
- `public/index.html`: the whole frontend in plain HTML, CSS, and JavaScript. It calls the API with `fetch`.

## Limitations

This is a prototype, not something to deploy as is. Anyone can log in as any seeded or registered email. Sessions and data live in memory. There are no tests.

## Contributing

Issues and pull requests are welcome. There is no test suite yet, so start the server and try the change in the browser before you open a PR.

## License

MIT, see [LICENSE](LICENSE).
