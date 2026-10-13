# 🏛️ Civion — AI-Powered Civic Issue Reporting & Municipal Command Platform

> **Signal · Context · Action** — A next-generation civic promise ledger connecting citizens, municipal authorities, and on-ground field workers through AI deduplication, geospatial telemetry, and multilingual voice assistance.

---

## 🌟 Overview

**Civion** is a full-stack smart city governance platform designed to bridge the transparency gap between residents and municipal departments. Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **AI-assisted triage**, Civion transforms scattered civic complaints into verified, SLA-tracked work orders with citizen sign-off.

---

## 🚀 Key Features

### 1. 👥 Three Role-Based Portals
- **Resident Portal**: Report civic issues with photo evidence & GPS coordinates, track live SLA countdowns, upvote neighborhood issues, and verify completed repairs through the **3-Step Citizen Sign-Off & Feedback Portal**.
- **Authority Command Center**: Department-isolated dashboards with AI-clustered heatmaps, SLA breach monitoring, automated priority scoring, and one-click contractor dispatch.
- **Field Worker Dashboard**: Category-specific task queues (`Potholes & Road Safety`, `Water Leakage & Drainage`, `Streetlight & Electrical`) with before/after photo verification and GPS check-in.

### 2. 🤖 Multilingual AI Copilot & Voice Search
- **6 Supported Languages**: English (`en-IN`), Hindi (`हिन्दी`), Kannada (`ಕನ್ನಡ`), Tamil (`தமிழ்`), Telugu (`తెలుగు`), and Bengali (`বাংলা`).
- **Speech-to-Text Audio Search**: Real-time voice query recognition powered by the Web Speech API.
- **Text-to-Speech (TTS) Read-Aloud**: Instant audio playback for AI responses in the user's selected regional language.

### 3. 🧠 AI Deduplication & Smart Department Routing
- Automatically clusters duplicate reports within a 100m geospatial radius into a single master work order.
- Routes issues directly to specialized municipal divisions and field engineers.

### 4. ⭐ Citizen Verification & Civic Karma Ledger
- Residents audit completed work orders on 3 metrics:
  1. **Resolution Confirmation** (*Yes / No — disputes automatically reopen & escalate the ticket*)
  2. **Quality of Work** (*1 to 5 scale*)
  3. **5-Star Rating** (*Interactive star rating modal*)
- Earn **Civic Karma** points and unlock trust tiers (*Bronze Citizen → Silver Advocate → Gold Inspector → Platinum Sentinel*).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Role-based Credentials, Google & GitHub OAuth)
- **Maps & Telemetry**: [Leaflet](https://leafletjs.com/) & React-Leaflet + Recharts Analytics
- **Voice & Speech**: Browser Native Web Speech API (`SpeechRecognition` & `speechSynthesis`)

---

## 📦 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+`
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/civion.git
cd civion

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** (or **[https://localhost:3000](https://localhost:3000)** using `npm run start:https`) in your browser.

---

## 🔐 Demo Credentials

### Municipal Authority Accounts
| Department | Email | Password |
|---|---|---|
| **Potholes & Road Safety** | `kaushkipriya2006@gmail.com` | `kaushiki@2006` |
| **Water Leakage & Drainage** | `civion00@gmail.com` | `civion2026` |
| **Streetlight & Electrical** | `petalspines3@gmail.com` | `PETALS2006` |

### Field Worker Accounts
| Assigned Category | Email | Password |
|---|---|---|
| **Potholes & Road Safety** | `deeshukumar975@gmail.com` | `deeshu` |
| **Water Leakage & Drainage** | `likeplease8989@gmail.com` | `likeplz` |
| **Streetlight & Electrical** | `anishsharma3672@gmail.com` | `anish` |

---

## 🌐 Deployment on Vercel

This repository is pre-configured for zero-config deployment on **[Vercel](https://vercel.com)**:

1. Push this repository to GitHub.
2. Import the project at **[vercel.com/new](https://vercel.com/new)**.
3. Add the following environment variables:
   - `NEXTAUTH_SECRET`: Your secret string
   - `NEXTAUTH_URL`: Your production Vercel URL
4. Click **Deploy**.
