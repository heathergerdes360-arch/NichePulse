import json
import subprocess
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db

def get_high_potential_leads():
    # Only target leads with score >= 10
    sql = "SELECT user_id, niche, score FROM user_scores WHERE score >= 10 ORDER BY score DESC"
    return run_team_db(sql)

def get_latest_story(niche):
    sql = f"SELECT title FROM stories WHERE category = '{niche}' ORDER BY created_at DESC LIMIT 1"
    res = run_team_db(sql)
    if res:
        return res[0]['title']
    return "recent breakthroughs"

def generate_hook(niche, story):
    # Rule-based generation since we are in fallback mode
    if niche.lower() == 'ai':
        return f"Saw you're tracking AI shifts. Our latest brief on {story} might have some signals your team missed."
    elif niche.lower() == 'biotech':
        return f"The recent {story} in biotech caught our eye. I've distilled the technical impact for our premium members—thought you'd find it useful."
    elif niche.lower() == 'climate tech':
        return f"With {story} hitting the news, climate tech funding is pivoting. We've mapped the primary movers."
    elif niche.lower() == 'spacetech':
        return f"SpaceTech launch schedules are shifting after {story}. We've updated our orbital delivery models."
    elif niche.lower() == 'defensetech':
        return f"Defense procurement is reacting to {story}. Our AI distilled the non-obvious regulatory spillover."
    elif niche.lower() == 'longevity':
        return f"Longevity research just hit a milestone with {story}. We've analyzed the clinical trial data for signal."
    else:
        return f"Thought you might be interested in the latest {niche} distillation, especially regarding {story}."

def main():
    print("Generating personalized outreach hooks for high-potential leads...")
    leads = get_high_potential_leads()
    if not leads:
        print("No leads with score >= 10 found.")
        return

    output_path = "/home/team/shared/growth/personalized_lead_hooks.md"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        f.write("# Personalized Outreach Hooks for High-Potential Leads\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for lead in leads:
            uid = lead['user_id']
            niche = lead['niche']
            score = lead['score']
            
            story = get_latest_story(niche)
            hook = generate_hook(niche, story)
            
            f.write(f"## User: {uid} (Score: {score})\n")
            f.write(f"**Niche:** {niche}\n")
            f.write(f"**Hook:** {hook}\n\n")
            
            print(f"Generated hook for {uid} in {niche} (Score: {score})")
            
            # Update the user_scores table with the new hook
            now = datetime.now().isoformat()
            hook_escaped = hook.replace("'", "''")
            sql = f"UPDATE user_scores SET outreach_hook = '{hook_escaped}', last_updated = '{now}' WHERE user_id = '{uid}'"
            run_team_db(sql)

    print(f"\nHooks saved to {output_path}")

if __name__ == "__main__":
    main()
