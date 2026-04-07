# NightShield

NightShield is a real-time emergency response web app built with React, Clerk, Socket.IO, Express, and MongoDB.

When a user triggers SOS, the app captures location, opens the active emergency flow for the sender, and alerts nearby registered users in real time. The project is split into a Vite client and a Node/Express server.

## Features

- Clerk authentication for sign-in and protected routes
- SOS trigger flow with sender and receiver handling
- Real-time emergency alerts using Socket.IO
- Nearby user alerting based on a 5 km geo query
- Live location capture with browser geolocation
- Map and route guidance with React Leaflet
- Sender-only SOS screen behavior for alarm and camera preview
- Contact management UI with local and backend sync support
- MongoDB-backed SOS, user, and contact storage

## Project Structure

```txt
NightShield/
  client/   React + Vite frontend
  server/   Express + Socket.IO backend
```

## Tech Stack

### Client

- React
- Vite
- React Router
- Clerk
- Socket.IO Client
- React Leaflet
- Leaflet Routing Machine
- Tailwind CSS

### Server

- Node.js
- Express
- Socket.IO
- MongoDB with Mongoose
- dotenv
- cors

## Current Behavior

### Sender flow

- Trigger SOS from the client
- Location is requested if enabled
- Sender is redirected to `/sos-active`
- Sender sees the active SOS screen
- Alarm and camera preview run on the sender side only

### Receiver flow

- Nearby users within 5 km can receive `SOS_ALERT`
- Receiver is redirected to `/sos-active`
- Receiver sees alert details, sender details, and route guidance
- Receiver does not open camera or sender-side SOS controls

## What Is In Scope Right Now

- Nearby-user alert delivery
- Real-time Socket.IO communication
- SOS event creation and storage
- Contact CRUD sync endpoints
- User location update endpoint

## What Is Not Fully Implemented Yet

- Real SMS/WhatsApp/email delivery to saved contacts
- Continuous live tracking after SOS starts
- Media upload/storage for captured evidence
- Push notifications when the app is closed
- Background mobile support
- Full production security hardening

## Prerequisites

Make sure these are installed:

- Node.js 18+
- npm
- MongoDB connection string
- Clerk application with a publishable key

## Environment Variables

### Client

Create `client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_USE_MOCK_API=false
```

### Server

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

## Installation

### 1. Install client dependencies

```bash
cd client
npm install
```

### 2. Install server dependencies

```bash
cd ../server
npm install
```

## Run Locally

### Start the server

```bash
cd server
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### Start the client

Open a second terminal:

```bash
cd client
npm run dev
```

The frontend runs on the Vite dev server, usually `http://localhost:5173`.

## Available Scripts

### Client

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Server

```bash
npm run dev
npm start
```

## API Routes

### SOS

- `POST /api/sos`

Creates an SOS event and notifies nearby connected users.

### Contacts

- `GET /api/contacts/:userId`
- `PUT /api/contacts/:userId`

Fetches and replaces a user's saved contacts.

### Users

- `POST /api/users/location`

Updates a user's current location for nearby SOS matching.

## Socket Events

### Client to server

- `register`

Registers a logged-in user with a socket connection.

### Server to client

- `SOS_ALERT`

Delivered to nearby users when an SOS is triggered.

## Build Status

Current local checks used during development:

```bash
cd client
npm run lint
npm run build
```

Both are passing in the current project state.

## Security Notes

- `.env` files are ignored by git
- Do not commit Clerk secrets or database credentials
- The current backend does not yet include full auth verification or rate limiting
- Review CORS, auth middleware, and abuse protection before production deployment

## Roadmap

- Contact-based alert delivery
- Real media capture upload pipeline
- Live location streaming
- Push notifications
- Admin monitoring dashboard
- Production security hardening

## Repository

GitHub: `https://github.com/alokranjan89/NightShield`
