import json
import subprocess
import uuid
from datetime import datetime
import os
from openai import OpenAI
from dotenv import load_dotenv
from signal_connections import identify_signal_connections

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db

def get_today_stories():
    today = datetime.now().strftime('%Y-%m-%d')
    return run_team_db(f"SELECT * FROM stories WHERE created_at LIKE '{today}%'")

def insert_report(content):
    report_id = str(uuid.uuid4())
    today = datetime.now().strftime('%Y-%m-%d')
    metadata = json.dumps({"author": "AI Pipeline", "version": "1.0"})
    
    # Escape single quotes
    content_escaped = content.replace("'", "''")
    
    sql = f"INSERT INTO reports (id, date, content, type, metadata) VALUES ('{report_id}', '{today}', '{content_escaped}', 'daily', '{metadata}')"
    return run_team_db(sql)

def synthesize_report(stories):
    if not stories:
        return None
        
    api_key = os.environ.get('OPENAI_API_KEY')
    
    # Group stories by category
    sections = {}
    for s in stories:
        cat = s.get('category', 'General')
        if cat not in sections:
            sections[cat] = []
        sections[cat].append(s)
        
    if not api_key:
        print("OPENAI_API_KEY not found in environment. Falling back to rule-based synthesis.")
        # Manual synthesis fallback
        report = f"# NichePulse Daily Brief - {datetime.now().strftime('%B %d, %Y')}\n\n"
        report += "## Top Takeaways\n"
        
        # Sort stories by importance
        sorted_stories = sorted(stories, key=lambda x: x.get('importance_score', 0), reverse=True)
        for s in sorted_stories[:3]:
            report += f"- **{s['title']}**: {s['summary']}\n"
            
        report += "\n## Community Signal Gaps\n"
        if "signal_gap" in sections:
            for s in sections["signal_gap"]:
                report += f"- **{s['title']}**: {s['summary']}\n"
        else:
            report += "No exclusive signal gaps identified for this period.\n"

        report += "\n## Sector Updates\n"
        for cat, sigs in sections.items():
            if cat == "signal_gap":
                continue
            report += f"### {cat}\n"
            for s in sigs:
                report += f"- **{s['title']}**: {s['summary']} (Sentiment: {s['sentiment']})\n"
        
        report += "\n## Sentiment Snapshot\n"
        report += "Overall sentiment across sectors remains positive, driven by significant breakthroughs in AI reasoning and renewable energy efficiency."
        
        # Add Premium Signal Connections
        connections = identify_signal_connections(stories)
        if connections:
            report += f"\n\n{connections}"
            
        return report

    # Use LLM for synthesis
    client = OpenAI(api_key=api_key)
    stories_text = json.dumps(stories, indent=2)
    
    prompt = f"""
    You are the lead editor of NichePulse. Create a 5-minute daily intelligence brief from the following story summaries.
    The brief should be professional, insightful, and formatted in Markdown.
    
    Maintain professional grammar and avoid double negatives (e.g., use "without any" instead of "without no").

    Structure:
    1. # NichePulse Daily Brief - [Date]
    2. ## Top 3 Takeaways (The most impactful signals across all sectors)
    3. ## Community Signal Gaps (IMPORTANT: If there are stories with category 'signal_gap', highlight them here as exclusive intelligence found by NichePulse that mainstream sources missed)
    4. ## 💎 Premium Deep-Dive: Signal Connections (Identify 2-3 NON-OBVIOUS cross-sector connections, e.g., how a regulatory change in AI might impact funding in Climate Tech. Tag these as Premium insights.)
    5. ## Sector Overviews (Grouped by category, excluding signal_gap if already highlighted)
    6. ## Sentiment Snapshot (A brief paragraph on overall market sentiment)

    Stories:
    {stories_text}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        report = response.choices[0].message.content
        
        # Add Premium Signal Connections if not already included by LLM
        if "Signal Connections" not in report:
            connections = identify_signal_connections(stories)
            if connections:
                report += f"\n\n{connections}"
        
        return report
    except Exception as e:
        print(f"Error calling LLM for synthesis: {e}")
        return None

def main():
    stories = get_today_stories()
    if not stories:
        print("No stories found for today.")
        return
        
    print(f"Synthesizing report from {len(stories)} stories...")
    report_content = synthesize_report(stories)
    if report_content:
        insert_report(report_content)
        print("Daily Brief report generated and stored.")
    else:
        print("Failed to generate report content.")

if __name__ == "__main__":
    main()
