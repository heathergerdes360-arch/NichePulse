import json
import subprocess
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db
def analyze_user_interests():
    """
    Analyzes traffic logs to identify high-growth niches for users and score them as leads.
    """
    # Fetch real traffic logs
    logs = run_team_db("SELECT * FROM traffic_logs")
    
    # If empty, we use mock data for the initial setup/demonstration
    if not logs:
        print("No traffic logs found in database. Using demonstration data...")
        logs = [
            {"user_id": "user_8821", "action": "view_story", "category": "AI", "timestamp": "2026-06-12T10:00:00Z"},
            {"user_id": "user_8821", "action": "view_story", "category": "AI", "timestamp": "2026-06-12T10:05:00Z"},
            {"user_id": "user_8821", "action": "view_premium", "category": "AI", "timestamp": "2026-06-12T10:10:00Z"},
            {"user_id": "user_9932", "action": "view_story", "category": "Longevity", "timestamp": "2026-06-12T11:00:00Z"},
            {"user_id": "user_9932", "action": "view_story", "category": "Climate", "timestamp": "2026-06-12T11:05:00Z"},
            {"user_id": "user_9932", "action": "view_story", "category": "Longevity", "timestamp": "2026-06-12T11:10:00Z"},
            {"user_id": "user_4412", "action": "signup", "category": "General", "timestamp": "2026-06-12T12:00:00Z"}
        ]

    user_data = {}
    for log in logs:
        uid = log.get('user_id')
        if not uid: continue
        
        cat = log.get('category', 'General')
        action = log.get('action')
        
        if uid not in user_data:
            user_data[uid] = {"categories": {}, "total_actions": 0, "premium_views": 0}
            
        user_data[uid]["total_actions"] += 1
        if action == "view_premium":
            user_data[uid]["premium_views"] += 1
            
        user_data[uid]["categories"][cat] = user_data[uid]["categories"].get(cat, 0) + 1

    # Lead Scoring System
    # Points: 1 per activity, 10 per premium content interaction
    scores = []
    for uid, data in user_data.items():
        # Identify primary niche
        primary_niche = "General"
        if data["categories"]:
            primary_niche = max(data["categories"], key=data["categories"].get)
        
        score = data["total_actions"] + (data["premium_views"] * 10)
        
        # Determine outreach hook based on niche
        hooks = {
            "AI": "Focused on frontier LLM research and compute scaling.",
            "Longevity": "Interested in geroscience trials and senolytic readouts.",
            "Climate": "Tracking grid-scale energy and carbon sequestration signals.",
            "General": "Broad intelligence across high-growth sectors."
        }
        hook = hooks.get(primary_niche, hooks["General"])
        
        scores.append({
            "user_id": uid,
            "niche": primary_niche,
            "score": score,
            "activity_count": data["total_actions"],
            "outreach_hook": hook
        })

    # Sort by score descending
    scores.sort(key=lambda x: x['score'], reverse=True)
    return scores

def save_scores(scores):
    for s in scores:
        now = datetime.now().isoformat()
        # Escape single quotes in niche and hook
        niche_escaped = s['niche'].replace("'", "''")
        hook_escaped = s['outreach_hook'].replace("'", "''")
        
        # Check if outreach_hook column exists or just store as JSON in a generic field
        # Actually, let's update the table schema first
        sql = f"INSERT OR REPLACE INTO user_scores (user_id, niche, score, activity_count, outreach_hook, last_updated) VALUES ('{s['user_id']}', '{niche_escaped}', {s['score']}, {s['activity_count']}, '{hook_escaped}', '{now}')"
        run_team_db(sql)

def main():
    print("Starting User Interest Analysis...")
    scores = analyze_user_interests()
    save_scores(scores)
    
    print("""
--- Top Lead Scores ---""")
    for s in scores[:5]:
        print(f"User: {s['user_id']} | Niche: {s['niche']} | Score: {s['score']} (Activity: {s['activity_count']})")
    
    print(f"""
Analyzed {len(scores)} users and updated 'user_scores' table.""")

if __name__ == "__main__":
    main()
