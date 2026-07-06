# NichePulse

Automated, AI-distilled intelligence reports for high-growth industries.

## Project Structure

- `ai/`: Python-based intelligence pipeline (distillation, synthesis, newsletter generation).
- `backend/`: Node.js/Express API serving the dashboard and handling subscriptions.
- `frontend/`: React/Vite dashboard and landing page.
- `marketing/`: Brand assets and marketing materials.

## Go-Live Checklist (Action Required)

To activate the full automated social media distribution and outreach:

1. **LinkedIn Profile Capture**:
   - Manually log into your personal LinkedIn account on the team sandbox.
   - Run the initial connection requests using the hooks in `/home/team/shared/growth/priority_biotech_targets.md`.
   - This captures the session profile (`niche_live_profile`) used by the automated scripts.

2. **Social Media Automation**:
   - The production script is located at `/home/team/shared/social/post_to_social.py`.
   - It is currently configured to run in **simulation mode** until real credentials (`TWITTER_USERNAME`, `LINKEDIN_USERNAME`, `REDDIT_USERNAME`) are added to the `.env` file.

3. **Outreach Execution**:
   - Follow the step-by-step instructions in the [Owner's Outreach Action Plan](/home/team/shared/growth/owner_outreach_action_plan.md) for the first 15-20 minutes of manual high-touch outreach.

## Backend Infrastructure

### Health Check
The backend provides a health check endpoint at `/api/health` which monitors:
- Database connectivity (via Turso/team-db).
- AI service configuration status.
- System memory and uptime.

### Database Resilience
The backend and AI pipeline include built-in resilience against Turso sync engine events.
- **Node.js**: `backend/db.js` implements an exponential backoff retry mechanism.
- **Python**: `ai/db_utils.py` provides a centralized `run_team_db` function with retry logic.

## Setup & Environment

1. Copy `.env.example` to `.env`.
2. Fill in the required environment variables:
   - `OPENAI_API_KEY`: Required for high-fidelity AI distillation.
   - `STRIPE_PAYMENT_LINK`: `https://buy.stripe.com/28EbJ1aLx6Qe8vk3FG9Ve00`.
   - `PORT`: Backend port (running on **3002**).
   - `VITE_API_URL`: Set to the backend production URL.

## Deployment

The platform is configured to run on port 3000 (publicly exposed).
- **Backend**: Port 3002.
- **Frontend**: Port 3000 (via Vite proxy).
- **Pipeline**: Background daemon (`run_pipeline.sh`) runs every 4 hours.

## Handover Preparation

This project is prepared for handover with:
- Centralized database resilience.
- Comprehensive health monitoring.
- Automated AI distillation pipeline with fallback safety.
