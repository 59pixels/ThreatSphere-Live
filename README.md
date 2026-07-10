<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io" />
  <img src="https://img.shields.io/badge/Three.js-0.182-black?style=for-the-badge&logo=three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
</p>

# 🛡️ Cyber Overwatch — Real-Time DDoS Attack Visualization

> A real-time, interactive 3D globe that visualises global DDoS attack patterns using live threat intelligence from **AlienVault OTX**, built with **Next.js**, **Three.js / react-globe.gl**, and **Socket.IO**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Screenshots](#screenshots)
- [Future Scope](#future-scope)
- [License](#license)

---

## Overview

**Cyber Overwatch** is a full-stack cybersecurity dashboard that renders a real-time 3D globe visualisation of DDoS attack traffic worldwide. The system ingests live threat intelligence feeds from the [AlienVault OTX](https://otx.alienvault.com/) platform and maps attack vectors — including source, destination, type, and intensity — onto an interactive WebGL globe.

The project was developed as a **final-year capstone project** to demonstrate practical understanding of:

- Real-time data streaming architectures (WebSockets)
- Threat intelligence feed integration and processing
- 3D data visualisation in the browser
- Full-stack application design with decoupled client-server communication

---

## Key Features

| Feature | Description |
|---|---|
| **3D Globe Visualisation** | Interactive, auto-rotating Earth rendered with city-lights texture, topology bumps, and atmospheric glow using `react-globe.gl` and Three.js. |
| **Live Threat Intelligence** | Polls the AlienVault OTX Search API every 60 seconds for the latest DDoS-related pulse signatures and maps them to geographic coordinates. |
| **Real-Time Streaming** | Socket.IO pushes attack events from the backend to all connected clients in real time — no polling from the frontend. |
| **Dual Data Modes** | Toggle between **Real Data** (OTX live feed) and **Simulated Data** (procedurally generated attack patterns) via a single UI switch. |
| **Attack Arc Animation** | Animated dashed arcs trace the path from attacker origin to target destination with colour-coded attack signatures. |
| **Impact Rings & Beacons** | Pulsing concentric rings and point beacons at target locations indicate active attack zones and their intensity. |
| **Live Threat Feed Log** | A scrolling killfeed panel displays the most recent attacks with timestamps, types, and geographic routing. |
| **Failover & Resilience** | Automatic reconnection logic with a visible countdown timer when the OTX API is unreachable or returns errors. |
| **Dashboard Statistics** | Real-time counters for total threats detected and peak attack intensity (Gbps). |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                   │
│                                                         │
│  Next.js 16 App ──► React 19 ──► react-globe.gl        │
│       │                              (Three.js)         │
│       │         Socket.IO Client                        │
│       └──────────── ▲ ──────────────────────────────────┤
│                     │  WebSocket (port 3001)             │
├─────────────────────┼───────────────────────────────────┤
│                     │                                   │
│              SERVER (Node.js)                           │
│                                                         │
│  Socket.IO Server ◄─── Attack Emitter Loop              │
│       │                    ▲                             │
│       │                    │                             │
│       │              Attack Buffer                      │
│       │                    ▲                             │
│       │                    │                             │
│       │         ┌──────────┴──────────┐                 │
│       │         │   OTX API Poller    │                 │
│       │         │  (60s interval)     │                 │
│       │         └──────────┬──────────┘                 │
│       │                    │  HTTPS                     │
│       │                    ▼                             │
│       │         AlienVault OTX API                      │
│       │         (otx.alienvault.com)                    │
│       │                                                 │
│       └─── Simulation Engine (fallback)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework with App Router, SSR, and optimised builds |
| [React 19](https://react.dev/) | Component-based UI with hooks and client-side state management |
| [react-globe.gl](https://github.com/vasturiano/react-globe.gl) | Declarative 3D globe component built on Three.js |
| [Three.js](https://threejs.org/) | Low-level WebGL rendering engine powering the globe |
| [Socket.IO Client](https://socket.io/) | Real-time bidirectional event-based communication |
| [Lucide React](https://lucide.dev/) | Icon library for UI elements |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework for rapid styling |
| [TypeScript 5](https://www.typescriptlang.org/) | Static type checking across the entire frontend |

### Backend

| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime for the server process |
| [Socket.IO](https://socket.io/) | WebSocket server for real-time event broadcasting |
| [Axios](https://axios-http.com/) | HTTP client for AlienVault OTX API requests |
| [geoip-lite](https://github.com/bluesmoon/node-geoip) | Lightweight IP-to-geolocation lookup |

### External API

| Service | Purpose |
|---|---|
| [AlienVault OTX](https://otx.alienvault.com/) | Open Threat Exchange — live DDoS pulse signatures and threat intelligence |

---

## Project Structure

```
ddosAttackMap/
├── public/                     # Static assets (SVGs, favicons)
├── server/
│   └── index.js                # Backend — Socket.IO server, OTX poller, simulation engine
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata and font configuration
│   │   ├── page.tsx            # Main dashboard page — stats, feed, controls, globe
│   │   ├── globals.css         # Global stylesheet
│   │   └── favicon.ico
│   └── components/
│       └── GlobeViz.tsx        # 3D globe visualisation component (arcs, rings, points)
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript compiler options
├── tailwind.config.*           # Tailwind CSS configuration
├── package.json                # Dependencies and scripts
└── README.md
```

---

## Prerequisites

Ensure the following are installed on your system:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (ships with Node.js)
- A modern web browser with WebGL support (Chrome, Firefox, Edge)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/ddosAttackMap.git
cd ddosAttackMap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the OTX API Key *(Optional)*

The application requires an AlienVault OTX API key for live threat data. Without it, simulated mode still works.

1. Create a free account at [AlienVault OTX](https://otx.alienvault.com/)
2. Navigate to **Settings → API Keys** and copy your key
3. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

4. Paste your key into `.env`:

```env
OTX_API_KEY=your_api_key_here
```

> **Note:** If you start the server without configuring the `.env` file, the backend will return a `403 Forbidden` error when trying to fetch real data, but the dashboard will still function perfectly in **Simulated** mode.

### 4. Start the Backend Server

```bash
node server/index.js
```

The Socket.IO server will start on **port 3001**. You should see:

```
Command Center Hub (Server) running on port 3001
📡 Polling AlienVault OTX for DDoS signals...
```

### 5. Start the Frontend Dev Server

In a **separate terminal**:

```bash
npm run dev
```

The Next.js dev server will start on **port 3000**.

### 6. Open the Dashboard

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Usage

### Toggling Data Modes

Use the toggle switch in the **top-right corner** of the dashboard:

| Mode | Behaviour |
|---|---|
| **Simulated** *(default)* | Generates randomised attack events between major global tech hubs at high frequency. Useful for demonstrations and testing. |
| **Real Data** | Streams attack events derived from live AlienVault OTX DDoS pulse signatures. Events are emitted at a controlled pace for readability. |

### Reading the Dashboard

- **Left Panel** — Aggregate statistics: total threats detected and peak intensity
- **Bottom-Right Feed** — Scrolling log of the most recent attack events with timestamp, type, source, and destination
- **Bottom-Right Legend** — Colour-coded attack signature key
- **Top-Right Status** — Connection indicator and current timestamp
- **Globe** — Animated arcs (attack paths), pulsing rings (impact zones), and hex-binned density heatmap (source concentration)

### Attack Types Tracked

| Signature | Colour |
|---|---|
| UDP Flood | 🔴 Red |
| SYN Flood | 🔵 Cyan |
| SQL Injection | 🟡 Yellow |
| Malware Beacon | 🟣 Fuchsia |
| Brute Force | 🟢 Green |

---

## How It Works

### Data Pipeline

1. **Ingestion** — The backend polls the AlienVault OTX Search API every 60 seconds, querying for the latest DDoS-tagged threat pulses.
2. **Enrichment** — Each pulse is parsed for attack type indicators and mapped to geographic source/destination coordinates using a set of known global tech hub locations.
3. **Buffering** — Enriched attack events are queued in an in-memory buffer to control emission rate and prevent UI flooding.
4. **Streaming** — The Socket.IO emitter loop dequeues events and broadcasts them to all connected clients. Real events emit at 1.5s intervals; simulated events at 300ms.
5. **Rendering** — The React client receives events via Socket.IO, batches them every 500ms, and updates the globe visualisation with new arcs, rings, and point markers.

### Failover Strategy

- If the OTX API returns an error (e.g., invalid key, rate limit, network failure), the server emits an `api_status` event with `status: "error"`.
- The frontend displays a **countdown timer** showing when the next automatic reconnection attempt will occur.
- In simulated mode, the system continues to generate synthetic traffic uninterrupted.

---

## Screenshots

*Add screenshots of the running application here.*

<!-- Example:
![Dashboard Overview](./screenshots/dashboard.png)
![Live Threat Feed](./screenshots/threat-feed.png)
-->

---

## Future Scope

- [ ] **IP Geolocation** — Resolve real IP addresses from OTX indicators using the `geoip-lite` module for accurate source mapping
- [ ] **Historical Playback** — Store attack events in a database and enable timeline-based replay
- [ ] **Attack Analytics** — Add charts and graphs for attack frequency, type distribution, and geographic heatmaps over time
- [ ] **User Authentication** — Secure the dashboard with login and role-based access control
- [ ] **Alerting System** — Email/Slack notifications when attack intensity exceeds configurable thresholds
- [ ] **Multi-Source Feeds** — Integrate additional threat intelligence providers (AbuseIPDB, Shodan, GreyNoise)
- [ ] **Docker Deployment** — Containerise the full stack for one-command deployment

---

## License

This project was developed for academic purposes as part of a final-year undergraduate programme. It is provided as-is for educational and demonstration use.

---

<p align="center">
  <sub>Built with ☕ and a healthy paranoia about network security.</sub>
</p>
