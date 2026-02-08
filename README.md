# cursorparks

Intelligently automated website for PARKSYSTEMS.

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (local) and Cloudflare D1 (production)
- **Deploy:** Cloudflare Pages (Wrangler)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Runs the server at `http://localhost:3000`.

### Environment

Set any required Cloudflare Pages environment variables in the Pages dashboard.

## Project Structure

```
cursorparks/
├── functions/       # API functions
├── scripts/js/      # Client-side scripts
├── migrations/      # Database migrations
├── server.js        # Express server
└── index.html       # Main app
```

## License

ISC — see [LICENSE](LICENSE) for details.
