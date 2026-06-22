import json
import subprocess
import os
from datetime import datetime
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db

            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return []
        except subprocess.CalledProcessError as e:
            if "Locking error" in e.stderr or "database error" in e.stderr:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"Error: {e.stderr}")
            return []
    return []

def get_high_potential_leads():
    # Use the user_scores table (Score >= 10)
    sql = "SELECT * FROM user_scores WHERE score >= 10"
    return run_team_db(sql)

def get_latest_story(niche):
    # Try to fetch the latest high-importance story first
    sql = f"SELECT title, summary FROM stories WHERE category = '{niche}' AND importance_score >= 7 ORDER BY created_at DESC LIMIT 1"
    res = run_team_db(sql)
    if res:
        return res[0]
    
    # Fallback to any latest story
    sql = f"SELECT title, summary FROM stories WHERE category = '{niche}' ORDER BY created_at DESC LIMIT 1"
    res = run_team_db(sql)
    if res:
        return res[0]
    return None

def generate_hook(niche, story):
    if not story:
        return f"Hi! I noticed you've been deeply engaged with our {niche} intelligence. We're tracking several emerging signals in the sector right now that match your interests — thought you might want a deep dive."
    
    title = story['title']
    summary = story['summary']
    # Shorten summary if too long
    if len(summary) > 120:
        summary = summary[:117] + "..."
        
    hook = f"Hi! I saw you've been tracking {niche} trends on NichePulse. We just distilled a new signal on '{title}': {summary}. It looks like a high-signal event for the sector — thought you'd want the first look."
    return hook

def main():
    print("Generating personalized outreach hooks for high-potential leads...")
    leads = get_high_potential_leads()
    if not leads:
        print("No leads with score >= 10 found.")
        return

    output_path = "/home/team/shared/growth/personalized_lead_hooks.md"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        f.write("# Personalized Outreach Hooks for High-Potential Leads
")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

")
        
        for lead in leads:
            uid = lead['user_id']
            niche = lead['niche']
            score = lead['score']
            
            story = get_latest_story(niche)
            hook = generate_hook(niche, story)
            
            f.write(f"## User: {uid} (Score: {score})
")
            f.write(f"**Niche:** {niche}
")
            f.write(f"**Hook:** {hook}

")
            
            print(f"Generated hook for {uid} in {niche} (Score: {score})")
            
            # Update the user_scores table with the new hook
            now = datetime.now().isoformat()
            hook_escaped = hook.replace("'", "''")
            sql = f"UPDATE user_scores SET outreach_hook = '{hook_escaped}', last_updated = '{now}' WHERE user_id = '{uid}'"
            run_team_db(sql)

    print(f"
Hooks saved to {output_path}")

if __name__ == "__main__":
    main()
