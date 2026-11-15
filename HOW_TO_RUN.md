# TripPilot – How to Run Guide

Welcome to **TripPilot**! Follow these simple steps to run both the backend API and the frontend application on your machine.

---

## Prerequisites Check

Make sure you have installed:
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** & **npm**

Check versions in your terminal:
```bash
python3 --version
node --version
npm --version
```

---

## Step 1: Start the Backend Server

Open your terminal and run:

```bash
# 1. Navigate to the backend directory
cd "smart-travel-guide/backend"

# 2. (Optional) Create .env from the example template
cp .env.example .env

# 3. Run the automated test suite to ensure everything is green
python3 -m unittest discover -s tests -p "test_*.py" -v

# 4. Start the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Backend Endpoints:
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative Redoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Step 2: Start the Frontend Application

Open a **new terminal tab or window** and run:

```bash
# 1. Navigate to the frontend directory
cd "smart-travel-guide/frontend"

# 2. (First time only) Install node dependencies if not already installed
npm install

# 3. Start the React development server
npm start
```

The web app will automatically open in your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## Step 3: Explore Key Features in the App

Once both servers are running, test out the full two-phase workflow:

1. **Sign In**:
   - Go to [http://localhost:3000/login](http://localhost:3000/login).
   - Click the **"⚡ 1-Click Guest Traveler Demo"** button for instant authentication (or use Google / Email sign in).
2. **Plan Your Day-Wise Trip**:
   - Navigate to **"AI Planner"** (`/plan`).
   - Choose a destination (e.g. **Jaipur**, **Goa**, **Manali**, **Mumbai**, **Delhi**, **Agra**).
   - Select your trip duration (e.g. 3 days), budget tier (`Mid-range`), and pace (`Balanced`).
   - Click **"Generate Day-Wise Itinerary & Route"**.
3. **Explore Your Day-by-Day Itinerary & Interactive Map**:
   - You are immediately greeted with a **full day-by-day plan** (Day 1, Day 2, Day 3)!
   - **Weather & Traffic Briefing**: View temperatures, outdoor suitability advice, best hotel departure time, and rush hours to avoid.
   - **Chronological Timeline**: Step-by-step stops with activity hours (`09:30 AM – 11:30 AM`), curator badges, entry costs, and weather guidance.
   - **Real Transit Connectors**: See drive times between stops (`🚗 12 mins (3.4 km) · Clear route`).
   - **Curated Dining**: On-route lunch and dinner stops integrated right into the daily schedule.
   - **Sticky Professional Map**: High-resolution CartoDB Voyager map on the right featuring sequentially numbered pins (`#1, #2, #3, #4`), hotel pin (`🏨`), food pins (`🍴`), and a true routed polyline loop. Click any stop or pin to cross-highlight!
4. **TripAdvisor Explore Hub**:
   - Navigate to **"Explore"** (`/explore`) to browse curated Stays, Attractions, and Dining with bubble ratings.
   - Click the **Heart (❤️)** icon to save places to your Wishlist (`/saved`).
   - Open any place modal to read and post community traveler reviews.
5. **Travel Bulletins & Safety News**:
   - Check out **"Travel News"** (`/news`) for transit updates, weather advisories, and festival calendars.

---

## Step 4: Running with Docker (Alternative)

If you have Docker Desktop installed, you can launch the entire stack (PostgreSQL + FastAPI + React + Nginx) with a single command:

```bash
# From the project root:
docker compose up --build
```

To stop all services:
```bash
docker compose down
```

---

## Troubleshooting FAQ

- **Port 8000 already in use**:
  Run `lsof -i :8000` to find the process ID and `kill -9 <PID>`, or start on port 8001:
  `uvicorn app.main:app --reload --port 8001`
- **Port 3000 already in use**:
  React will prompt you: *"Would you like to run the app on another port instead? (Y/n)"* — press `Y`.
- **Database Reset**:
  To reset the local SQLite database cleanly at any time, delete `smart-travel-guide/backend/navigen.db`. The server will automatically re-create the tables on startup.

