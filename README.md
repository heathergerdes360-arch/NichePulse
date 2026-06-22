# NichePulse

Automated, AI-distilled intelligence reports for high-growth industries.

## Project Structure

- `ai/`: Python-based intelligence pipeline (distillation, synthesis, newsletter generation).
- `backend/`: Node.js/Express API serving the dashboard and handling subscriptions.
- `frontend/`: React/Vite dashboard and landing page.
- `marketing/`: Brand assets and marketing materials.

## Backend Infrastructure

### Health Check
The backend provides a health check endpoint at `/api/health` which monitors:
- Database connectivity (via Turso/team-db).
- AI service configuration status.
- System memory and uptime.

### Database Resilience
The backend and AI pipeline include built-in resilience against Turso sync engine "GenericFailure" and "Locking error" events.
- **Node.js**: `backend/db.js` implements an exponential backoff retry mechanism (up to 5 retries).
- **Python**: `ai/db_utils.py` provides a centralized `run_team_db` function with similar retry logic for all AI scripts.

## Setup & Environment

1. Copy `.env.example` to `.env`.
2. Fill in the required environment variables:
   - `OPENAI_API_KEY`: Required for high-fidelity AI distillation (falls back to rule-based logic if missing).
   - `STRIPE_PAYMENT_LINK`: The active Stripe checkout link for Premium upgrades.
   - `PORT`: Backend port (defaults to 3001).

## Deployment

The platform is configured to run on port 3000 (publicly exposed).
- Backend runs on port 3001 (proxied or internal).
- Frontend serves the static build or runs via Vite.

## Handover Preparation

This project is prepared for handover with:
- Centralized database resilience.
- Comprehensive health monitoring.
- Automated AI distillation pipeline with fallback safety.
