"""
NichePulse Premium Deep-Dive Orchestrator
----------------------------------------
This script identifies high-importance stories that lack a deep-dive report
and triggers the deep-dive generation for each.
"""

import json
import subprocess
import os
import sys

from db_utils import run_team_db
def main():
    # Identify stories with importance_score >= 8 or is_market_event = 1
    # that don't have a record in the deep_dives table.
    sql = """
    SELECT s.id, s.title 
    FROM stories s
    LEFT JOIN deep_dives dd ON s.id = dd.story_id
    WHERE (s.importance_score >= 8 OR s.is_market_event = 1)
      AND dd.id IS NULL
    """
    
    stories_to_process = run_team_db(sql)
    
    if not stories_to_process:
        print("No new high-importance stories found for deep-dive generation.")
        return

    print(f"Found {len(stories_to_process)} stories needing deep dives.")
    
    ai_dir = os.path.dirname(os.path.abspath(__file__))
    deep_dive_script = os.path.join(ai_dir, "deep_dive.py")
    
    for story in stories_to_process:
        story_id = story['id']
        story_title = story['title']
        print(f"Triggering deep dive for: {story_title} ({story_id})")
        
        try:
            # We run deep_dive.py as a separate process for each story
            subprocess.run(["python3", deep_dive_script, story_id], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed to generate deep dive for story {story_id}: {e}")

if __name__ == "__main__":
    main()
