# :shield: NightShield

NightShield is a smart emergency response and personal safety platform designed to help people act fast during danger, alert the right people instantly, and improve the chances of getting help in time.

It combines real-time SOS alerts, location sharing, nearby-user notifications, emergency contact management, live guidance, and a modern emergency-ready interface into one connected safety system.

---

## :rotating_light: What NightShield Does

NightShield is built for situations where every second matters.

When a user triggers SOS, NightShield is designed to:

- :round_pushpin: capture the user's live location
- :rotating_light: activate the emergency flow immediately
- :satellite: send alerts in real time
- :busts_in_silhouette: notify nearby users who may be able to help quickly
- :telephone_receiver: keep emergency contacts connected to the situation
- :world_map: guide responders toward the user with map support
- :camera: support emergency media capture during SOS
- :zap: keep the entire response flow fast, clear, and simple

The goal of NightShield is not just to send a message. The goal is to create a complete emergency response experience.

---

## :globe_with_meridians: End-to-End Product Vision

NightShield is planned as a full safety ecosystem with these major capabilities:

### :bust_in_silhouette: 1. User Authentication & Identity

- Secure sign-in with Clerk
- Protected personal dashboard
- User session management
- Trusted user identity for emergency workflows

### :iphone: 2. Personal Safety Dashboard

- Overview of emergency activity
- Recent alerts
- Quick access to contacts and settings
- Personalized safety controls

### :telephone_receiver: 3. Trusted Contacts Management

- Add and manage emergency contacts
- Mark a primary contact
- Keep important people ready for fast action
- Build a trusted support circle inside the app

### :rotating_light: 4. SOS Trigger System

- One-tap or hold-to-trigger emergency alert flow
- Fast transition into emergency mode
- Clear emergency state handling
- Built for urgent real-world use

### :round_pushpin: 5. Live Location Sharing

- Capture user coordinates through browser geolocation
- Share location during emergency activation
- Use location to connect the user with the nearest possible help

### :satellite: 6. Real-Time Alert Delivery

- Socket.IO powered real-time alert system
- Low-latency emergency communication
- Instant response flow between users and server

### :busts_in_silhouette: 7. Nearby Helper Alert System

- Detect nearby users in a defined radius
- Notify people close enough to help quickly
- Create a community-assisted emergency response model

### :world_map: 8. Maps, Routing & Navigation

- Display emergency location on an interactive map
- Show route support for responders
- Help nearby users move toward the person in danger
- Support external navigation tools like Google Maps

### :loud_sound: 9. Emergency Action Layer

- Alarm support during SOS
- Camera activation for emergency mode
- Media-based emergency flow support
- Dedicated SOS active screen for focused action

### :brain: 10. Real-Time Emergency State Management

- Manage sender and receiver flows separately
- Maintain clear emergency session state
- Prevent confusion between the person in danger and the nearby helper

### :cloud: 11. Backend Data Layer

- SOS events stored in MongoDB
- User location and identity linked to emergency workflows
- Contact and response-related backend APIs
- Server-side emergency coordination logic

### :lock: 12. Production Safety Direction

NightShield is intended to grow into a complete production-ready safety platform with:

- stronger API security
- verified backend auth
- contact alert integrations
- live tracking
- push notifications
- emergency media upload
- admin monitoring tools
- abuse prevention and rate limiting

---

## :sparkles: Core Features

- :lock: Authentication with Clerk
- :compass: Protected routes for signed-in users
- :rotating_light: SOS trigger flow
- :round_pushpin: Live location capture
- :satellite: Real-time socket communication
- :busts_in_silhouette: Nearby user emergency alerts
- :world_map: React Leaflet map integration
- :motorway: Route guidance for responders
- :telephone_receiver: Contact management
- :bell: Emergency alert handling UI
- :movie_camera: Sender-focused SOS active flow
- :brain: Context-based global emergency state
- :floppy_disk: MongoDB-backed backend services

---

## :building_construction: Project Architecture

```txt
NightShield/
  client/   React + Vite frontend
  server/   Express + Socket.IO backend
```

### :computer: Frontend

The client application handles:

- authentication
- routing
- SOS trigger UX
- contact management UI
- dashboard experience
- maps and navigation
- receiver alert UI
- sender SOS active flow

### :gear: Backend

The server handles:

- SOS event creation
- location update APIs
- contact APIs
- socket registration
- nearby-user alert delivery
- MongoDB persistence

---

## :hammer_and_wrench: Tech Stack

### Frontend

- React
- Vite
- React Router
- Clerk
- Socket.IO Client
- React Leaflet
- Leaflet Routing Machine
- Tailwind CSS

### Backend

- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose
- dotenv
- cors

---

## :arrows_counterclockwise: End-to-End Flow

### 1. User signs in

A user logs into NightShield and accesses their private safety dashboard.

### 2. User prepares emergency setup

The user can manage emergency contacts and configure SOS behavior.

### 3. User triggers SOS

When danger happens, the user activates the SOS flow.

### 4. System captures emergency context

NightShield gathers location and starts the emergency session.

### 5. Backend creates SOS event

The server stores the alert and prepares the response workflow.

### 6. Nearby users are notified in real time

Connected users near the incident area receive emergency alerts instantly.

### 7. Responder sees location and route

Nearby users can see where help is needed and navigate toward the sender.

### 8. Sender stays in SOS mode

The sender remains inside an active emergency screen designed for focused emergency handling.

### 9. Platform continues growing toward full emergency coverage

NightShield is designed to expand into contact alerts, richer evidence capture, push notifications, live tracking, and full production hardening.

---

## :file_folder: Main Modules

### Client Pages

- :house: Home
- :key: Login
- :bar_chart: Dashboard
- :telephone_receiver: Contacts
- :gear: Settings
- :rotating_light: SOS Active

### Backend Modules

- `SOS` controller and routes
- `Contact` controller and routes
- `User` controller and routes
- Socket store for real-time connection mapping
- MongoDB models for SOS, contacts, and users

---

## :electric_plug: API Routes

### SOS Routes

- `POST /api/sos`

### Contact Routes

- `GET /api/contacts/:userId`
- `PUT /api/contacts/:userId`

### User Routes

- `POST /api/users/location`

---

## :signal_strength: Socket Events

### Client to Server

- `register`

### Server to Client

- `SOS_ALERT`

---

## :lock: Environment Variables

### `client/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_USE_MOCK_API=false
```

### `server/.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Example files are also included:

- `client/.env.example`
- `server/.env.example`

---

## :package: Installation

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

---

## :arrow_forward: Run the Project

### Start the backend

```bash
cd server
npm run dev
```

Backend default:

```txt
http://localhost:5000
```

### Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Frontend default:

```txt
http://localhost:5173
```

---

## :scroll: Available Scripts

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

---

## :white_check_mark: Current Development Status

NightShield already includes the core structure of a modern emergency response platform:

- client and server architecture
- auth integration
- SOS flow
- real-time sockets
- nearby alert logic
- maps and route guidance
- backend persistence
- sender and receiver emergency handling

The platform is designed to keep expanding until the full product vision is complete.

---

## :rocket: Future Expansion

Planned improvements include:

- :telephone: direct emergency contact alerts
- :movie_camera: full media capture and secure upload
- :round_pushpin: continuous live tracking
- :bell: push notifications
- :office: admin monitoring dashboard
- :shield: stronger production security
- :iphone: better background/mobile emergency support

---
## :handshake: Repository

GitHub: `https://github.com/alokranjan89/NightShield`
