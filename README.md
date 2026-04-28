# NightShield

NightShield is a full-stack personal safety application for sending SOS alerts with location context. Guests can trigger an SOS immediately, while signed-in users get saved contacts, SOS history, account-protected actions, real-time nearby alerts, and cloud evidence uploads.

> NightShield is a practical emergency workflow demo. It is not a replacement for local emergency services.

## Live Demo

Live demo: https://nightshield09.vercel.app/

Backend health check after deployment:

```txt
https://your-backend.onrender.com/healthz
```

## Problem Statement

During unsafe or emergency situations, people need a fast way to ask for help without navigating a complex app. A useful safety workflow should capture location, alert trusted or nearby users, preserve evidence when possible, and keep sensitive account data protected.

NightShield addresses these needs by providing a browser-based SOS flow that works for guests immediately and adds stronger saved-data features for authenticated users.

## Solution

NightShield provides a press-and-hold SOS experience that creates an emergency session, captures browser location when permission is available, stores the SOS in MongoDB, and broadcasts real-time alerts through Socket.IO.

Signed-in users can manage emergency contacts, sync their latest location for nearby matching, review SOS history, resolve active SOS sessions, and upload photo or video evidence to Cloudinary. Clerk protects account-specific APIs so users can only access their own contacts, history, location updates, and evidence uploads.

## Architecture

```txt
                         +----------------------+
                         |      Clerk Auth      |
                         |  user identity/JWTs  |
                         +----------+-----------+
                                    |
                                    v
+-------------------+       +-------+--------+       +------------------+
| React + Vite app  | <---> | Express API    | <---> | MongoDB Atlas    |
| Tailwind UI       | REST  | Node.js        |       | Users/Contacts   |
| React Leaflet     |       | Helmet/CORS    |       | SOS sessions     |
+---------+---------+       +-------+--------+       +------------------+
          |                         |
          | Socket.IO client        | Socket.IO server
          v                         v
+-------------------+       +----------------+
| Browser location  |       | Nearby users   |
| SOS active screen |       | SOS broadcasts |
+-------------------+       +----------------+
                                    |
                                    v
                            +---------------+
                            | Cloudinary    |
                            | SOS evidence  |
                            +---------------+
```

## Tech Stack

Frontend:

- React
- Vite
- React Router
- Clerk React
- Socket.IO Client
- React Leaflet
- Tailwind CSS
- Vercel Analytics

Backend:

- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose
- Clerk Express middleware
- Cloudinary
- Multer
- Helmet
- CORS
- Express Rate Limit

Deployment:

- Frontend: Vercel-ready
- Backend: Render-ready through `render.yaml`
- Database: MongoDB Atlas or another MongoDB-compatible host

## Features

- Guest SOS creation without signup.
- Press-and-hold emergency trigger.
- Browser location capture when permission is granted.
- MongoDB-backed SOS session storage.
- Real-time Socket.IO SOS alerts to nearby connected users.
- Fallback alerting to connected users when no stored nearby location is found.
- SOS active screen with map and routing support.
- Clerk authentication for signed-in workflows.
- Protected contact management.
- Protected SOS history.
- Protected location sync for nearby matching.
- Protected SOS resolution by the original sender.
- Photo and video evidence upload through Cloudinary.
- API rate limiting and dedicated SOS creation rate limiting.
- Helmet, CORS, and request size limits for safer backend defaults.

## API Endpoints

Base API path:

```txt
/api
```

Health:

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Confirms the backend is running. |
| `GET` | `/healthz` | No | Deployment health check endpoint. |

SOS:

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/sos` | Optional | Creates an SOS session. Allows guest IDs or the authenticated user's own ID. |
| `GET` | `/api/sos/history/:userId` | Required | Returns the authenticated user's latest SOS history. |
| `PATCH` | `/api/sos/:id/resolve` | Required | Resolves an SOS session. Only the sender can resolve it. |
| `POST` | `/api/sos/evidence` | Required | Uploads SOS photo or video evidence with multipart field `file`. |

Contacts:

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/contacts` | Required | Adds one contact for the authenticated user. |
| `GET` | `/api/contacts/:userId` | Required | Gets contacts for the authenticated user. |
| `PUT` | `/api/contacts/:userId` | Required | Replaces contacts for the authenticated user. |

Users:

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/users/location` | Required | Saves the authenticated user's latest location for nearby SOS matching. |

Socket.IO:

| Event | Direction | Description |
| --- | --- | --- |
| `SOS_ALERT` | Server to client | Sent to nearby connected users when an SOS is created. |
| `SOS_RESOLVED` | Server to client | Sent to notified users when the sender resolves the SOS. |

Socket connections require a Clerk token in `socket.handshake.auth.token`.

## Project Structure

```txt
NightShield/
  client/   React + Vite frontend
  server/   Express + Socket.IO backend
```

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
CORS_ORIGIN=http://localhost:5173
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
SOS_RATE_LIMIT_WINDOW_MS=60000
SOS_RATE_LIMIT_MAX_REQUESTS=20
SOS_NEARBY_RADIUS_METERS=20000
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

The frontend can be deployed to Vercel. Set these Vite variables in Vercel:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`
- `VITE_USE_MOCK_API=false`

After deployment, update the Live Demo section at the top of this README with the real Vercel URL.

## Repository

GitHub: `https://github.com/alokranjan89/NightShield`
