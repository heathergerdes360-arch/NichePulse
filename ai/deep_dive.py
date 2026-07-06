import json
import subprocess
import os
import sys
import uuid
from datetime import datetime
from openai import OpenAI
import pathlib

# Ensure output directory exists
OUTPUT_DIR = "/home/team/shared/nichepulse/ai/output"
pathlib.Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

from db_utils import run_team_db
def get_story(story_id):
    sql = f"SELECT * FROM stories WHERE id = '{story_id}'"
    results = run_team_db(sql)
    return results[0] if results else None

def get_signals_for_story(story_id):
    sql = f"""
    SELECT si.*
    FROM signals si
    JOIN story_signals ss ON si.id = ss.signal_id
    WHERE ss.story_id = '{story_id}'
    ORDER BY si.importance DESC
    LIMIT 10
    """
    return run_team_db(sql)

def save_deep_dive(story_id, title, content, insight_mapping=None):
    report_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    # Store as a file and record in DB
    filename = f"deep_dive_{report_id}.md"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, "w") as f:
        f.write(content)
        
    content_escaped = content.replace("'", "''")
    title_escaped = title.replace("'", "''")
    
    sql = f"INSERT INTO deep_dives (id, story_id, content, created_at) VALUES ('{report_id}', '{story_id}', '{content_escaped}', '{created_at}')"
    run_team_db(sql)
    
    return report_id

def generate_deep_dive(story_id):
    story = get_story(story_id)
    if not story:
        print(f"Story {story_id} not found.")
        return None
        
    signals = get_signals_for_story(story_id)
    if not signals:
        print(f"No signals found for story {story_id}.")
        return None
        
    api_key = os.environ.get('OPENAI_API_KEY')
    
    # Context building
    signals_text = "\n".join([f"- {s.get('title')}: {s.get('content')} (Source: {s.get('source')})" for s in signals])
    
    if not api_key:
        print("OPENAI_API_KEY not found. Using fallback template.")
        content = f"""# Deep Dive: {story.get('title')}
        
## Executive Summary
{story.get('summary')}

## Supporting Evidence
{signals_text}

## Strategic Implications
- Technical shift detected in {story.get('category')} sector.
- Potential impact score: {story.get('importance_score')}/10.
- Supporting signals: {len(signals)}

*Note: This is an automated fallback report.*
"""
        return save_deep_dive(story_id, story.get('title'), content)

    client = OpenAI(api_key=api_key)
    
    prompt = f"""
    You are a specialized technical analyst. Provide a Deep Dive report for the following industry story.
    
    Story: {story.get('title')}
    Category: {story.get('category')}
    Summary: {story.get('summary')}
    
    Supporting Signals:
    {signals_text}
    
    The report should include:
    1. Executive Summary: High-level overview of the breakthrough or shift.
    2. Technical Breakdown: Analysis of the underlying technology or business model shift.
    3. Competitive Landscape: How this affects existing players.
    4. Strategic Recommendations: What a professional in this sector should do next.
    5. Evidence Mapping: Explicitly reference the supporting signals provided.
    
    Use professional Markdown formatting.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content
        return save_deep_dive(story_id, story.get('title'), content)
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        story_id = sys.argv[1]
        report_id = generate_deep_dive(story_id)
        if report_id:
            print(f"Deep Dive generated: {report_id}")
    else:
        print("Usage: python3 deep_dive.py <story_id>")
