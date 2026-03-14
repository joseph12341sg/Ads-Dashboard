# Ads Performance Dashboard

A hosted web application for tracking daily ad performance metrics.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite via better-sqlite3
- **Charts**: Chart.js via react-chartjs-2

## Setup

### Server
```bash
cd server
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

## Environment Variables

**server/.env**
```
PORT=3001
DB_PATH=./data/dashboard.db
```

**client/.env**
```
VITE_API_URL=http://localhost:3001
```
