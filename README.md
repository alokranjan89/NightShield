# NightShield

NightShield is a full-stack personal safety app for sending SOS alerts with location context. A user can trigger an SOS without creating an account, while signed-in users get saved contacts, alert history, protected account data, and cloud evidence support.

This project is built as a practical emergency workflow demo, not a replacement for local emergency services.

## What It Does

- Sends an SOS from the browser with a press-and-hold interaction.
- Captures the user's current location when browser permission is available.
- Stores SOS sessions in MongoDB.
- Notifies nearby connected users in real time with Socket.IO.
- Shows responders the alert location and a route view.
- Lets signed-in users manage emergency contacts and settings.
- Lets signed-in users upload SOS photo/video evidence through Cloudinary.
- Keeps account-specific APIs protected with Clerk authentication and user ownership checks.

## Guest And Signed-In Behavior

Guest users can:

- trigger SOS immediately
- include one-time browser location in the alert
- enter the active SOS screen
- notify connected nearby users

Signed-in users can also:

- save contacts
- save settings
- view SOS history
- sync their latest location for nearby matching
- upload camera evidence during SOS
- resolve SOS sessions with account ownership checks

## Tech Stack

Frontend:

- React
- Vite
- React Router
- Clerk
- Socket.IO Client
- React Leaflet
- Tailwind CSS

Backend:

- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose
- Clerk Express middleware
- Cloudinary
- Helmet, CORS, and rate limiting

## Project Structure

```txt
NightShield/
  client/   React + Vite frontend
  server/   Express + Socket.IO backend
```

## API

SOS:

- `POST /api/sos` - creates an SOS session. Allows guest IDs and authenticated user IDs.
- `GET /api/sos/history/:userId` - authenticated user history.
- `PATCH /api/sos/:id/resolve` - authenticated sender resolves an SOS.
- `POST /api/sos/evidence` - authenticated evidence upload.

Contacts:

- `POST /api/contacts`
- `GET /api/contacts/:userId`
- `PUT /api/contacts/:userId`

Users:

- `POST /api/users/location`

Socket events:

- Server emits `SOS_ALERT` to nearby connected users.
- Server emits `SOS_RESOLVED` when an authenticated sender ends a session.

## Environment Variables

Create `client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_USE_MOCK_API=false
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
SOS_RATE_LIMIT_WINDOW_MS=60000
SOS_RATE_LIMIT_MAX_REQUESTS=20
```

Example files are included:

- `client/.env.example`
- `server/.env.example`

## Run Locally

Install dependencies:

```bash
cd client
npm install

cd ../server
npm install
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/healthz`

## Verification

Run these checks before sharing or deploying:

```bash
cd client
npm run lint
npm run build
npm audit --audit-level=moderate
```

```bash
cd ../server
node --check server.js
npm audit --audit-level=moderate
```

## Deployment Notes

The backend is prepared for Render through `render.yaml`. Configure all required secrets in Render, especially:

- `MONGO_URI`
- `CLERK_SECRET_KEY`
- `CORS_ORIGIN`
- `CLIENT_URL`
- `CLOUD_NAME`
- `API_KEY`
- `API_SECRET`

The frontend can be deployed to Vercel. Set the Vite environment variables to point to the deployed backend.

## Current Status

Implemented:

- guest SOS creation
- Clerk authentication
- protected contact, history, location, resolve, and evidence APIs
- MongoDB persistence
- nearby helper matching
- real-time alerts
- SOS active screen
- map and routing support
- Cloudinary evidence upload for authenticated users
- basic security middleware and rate limiting
- dedicated rate limiting on SOS creation

Planned:

- SMS/WhatsApp or email contact alerts
- push notifications
- stronger abuse prevention for guest SOS
- admin monitoring dashboard
- better mobile background behavior
- test coverage for API and SOS flows

## Repository

GitHub: `https://github.com/alokranjan89/NightShield`
