import json
import subprocess
import uuid
from datetime import datetime
import time
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db
def get_unpromoted_market_stories():
    sql = "SELECT * FROM stories WHERE is_market_event = 1 AND promoted_to_event = 0"
    return run_team_db(sql)

def promote_story(story):
    story_id = story['id']
    title = story['title']
    summary = story['summary'].lower()
    sector = story['category']
    date = story['created_at']
    significance = story['importance_score']
    
    # Simple event type extraction
    event_type = 'Catalyst'
    if 'funding' in summary or 'raised' in summary or 'round' in summary:
        event_type = 'Funding'
    elif 'launch' in summary or 'announced' in summary or 'released' in summary:
        event_type = 'Launch'
    elif 'm&a' in summary or 'acquisition' in summary or 'acquired' in summary or 'merger' in summary:
        event_type = 'M&A'
    elif 'ipo' in summary or 'public' in summary:
        event_type = 'IPO'
    
    event_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    # Escape quotes
    title_esc = title.replace("'", "''")
    
    insert_sql = f"""
    INSERT INTO market_events (id, title, event_type, sector, date, significance, created_at)
    VALUES ('{event_id}', '{title_esc}', '{event_type}', '{sector}', '{date}', {significance}, '{created_at}')
    """
    run_team_db(insert_sql)
    
    update_sql = f"UPDATE stories SET promoted_to_event = 1 WHERE id = '{story_id}'"
    run_team_db(update_sql)
    
    print(f"Promoted story '{title}' as {event_type}")

def main():
    stories = get_unpromoted_market_stories()
    if not stories:
        print("No new market events to promote.")
        return
        
    for story in stories:
        promote_story(story)

if __name__ == "__main__":
    main()
