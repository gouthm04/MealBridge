# MealBridge

Frontend (React + Vite) and backend (Express + Supabase) for the MealBridge food redistribution portal.

## Project Structure

- `src/` React frontend
- `backend/` Express API pulled from `feature-person2`

## Backend Setup

1. Copy env template:
   - `cp backend/.env.example backend/.env`
2. Fill values in `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PORT` (default `5000`)
3. Install and run backend:
   - `cd backend`
   - `npm install`
   - `node server.js`

## Frontend Setup

1. Copy env template:
   - `cp .env.example .env`
2. Fill values in `.env`:
   - `VITE_API_BASE_URL` (default `http://localhost:5000`)
   - `VITE_DONOR_ID`
   - `VITE_NGO_ID`
3. Install and run frontend:
   - `npm install`
   - `npm run dev`

## Integrated API Endpoints

- Auth:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
- Food:
  - `POST /api/food/add`
  - `GET /api/food/available`
  - `GET /api/food/donor-analytics/:donorId`
  - `GET /api/food/donor-listings/:donorId`
  - `GET /api/food/ngo-analytics/:ngoId`

