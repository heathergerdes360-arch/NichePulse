import json
import subprocess
import os
import re
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import time

from db_utils import run_team_db

def markdown_to_html(md_text):
    # Very basic markdown to HTML conversion
    html = md_text
    
    # Headers
    html = re.sub(r'^# (.*)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.*)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    
    # Bold and Italic
    html = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', html)
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # Lists and Tables
    lines = html.split('
')
    in_list = False
    in_table = False
    new_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # Table handling
        if stripped.startswith('|'):
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            
            if not in_table:
                new_lines.append('<div class="my-6 overflow-x-auto"><table class="min-w-full border border-gray-200 text-sm">')
                in_table = True
            
            # Simple row parsing
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            if all(c.startswith('---') or c.startswith(':---') for c in cells) and cells:
                # This is a separator line, skip it
                continue
            
            new_lines.append('<tr class="border-b border-gray-100">')
            for cell in cells:
                new_lines.append(f'<td class="px-4 py-2 border-r border-gray-100">{cell}</td>')
            new_lines.append('</tr>')
            continue
        elif in_table:
            new_lines.append('</table></div>')
            in_table = False

        # List handling
        if stripped.startswith('- '):
            if not in_list:
                new_lines.append('<ul class="list-disc ml-6 my-4">')
                in_list = True
            new_lines.append(f'<li>{stripped[2:]}</li>')
        else:
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            
            if stripped:
                if not any(stripped.startswith(tag) for tag in ['<h', '<ul', '<li', '<div', '<table', '<tr', '<td']):
                    new_lines.append(f'<p class="my-4">{line}</p>')
                else:
                    new_lines.append(line)
            else:
                new_lines.append('<br/>')
    
    if in_list:
        new_lines.append('</ul>')
    if in_table:
        new_lines.append('</table></div>')
        
    return '
'.join(new_lines)

def normalize_sector(sector):
    if not sector:
        return "General"
    s = sector.lower().replace(" ", "")
    if s == 'ai': return 'AI'
    if s == 'biotech': return 'Biotech'
    if 'climate' in s: return 'Climate Tech'
    if 'space' in s: return 'SpaceTech'
    if 'defense' in s: return 'DefenseTech'
    if s == 'longevity': return 'Longevity'
    if s == 'tech': return 'Tech'
    return sector.title()

def get_newsletter_data(interested_sectors=None):
    # 1. Fetch all stories from last 24 hours
    sql = """
        SELECT title, summary, sentiment, importance_score, category, created_at 
        FROM stories 
        WHERE datetime(created_at) >= datetime('now', '-24 hours')
        ORDER BY importance_score DESC
    """
    all_stories = run_team_db(sql)
    
    sector_stories = {}
    seen_titles = set()
    
    # Normalize interested_sectors list for comparison
    filter_sectors = None
    if interested_sectors and isinstance(interested_sectors, list) and len(interested_sectors) > 0:
        filter_sectors = [normalize_sector(s) for s in interested_sectors]

    for s in all_stories:
        title = s['title'].strip()
        title_lower = title.lower()
        if title_lower in seen_titles:
            continue
            
        norm_s = normalize_sector(s['category'])
        
        # Filter by sector if preference is set
        if filter_sectors and norm_s not in filter_sectors:
            continue

        if norm_s not in sector_stories:
            sector_stories[norm_s] = []
        if len(sector_stories[norm_s]) < 5: # Limit to 5 per normalized sector
            sector_stories[norm_s].append(s)
            seen_titles.add(title_lower)

    # 2. Fetch Market Events from last 24 hours
    market_events_sql = """
        SELECT title, event_type, sector, date, significance 
        FROM market_events 
        WHERE datetime(created_at) >= datetime('now', '-24 hours')
        ORDER BY significance DESC
    """
    market_events = run_team_db(market_events_sql)
    
    filtered_market_events = []
    for e in market_events:
        norm_s = normalize_sector(e['sector'])
        if filter_sectors and norm_s not in filter_sectors:
            continue
        e['normalized_sector'] = norm_s
        filtered_market_events.append(e)

    # 3. Fetch Sentiment Snapshot (latest for each normalized sector)
    all_history_sql = "SELECT sector, avg_sentiment, count, created_at FROM sentiment_history ORDER BY created_at DESC"
    all_history = run_team_db(all_history_sql)
    
    sentiment_snapshot = {}
    for h in all_history:
        norm_s = normalize_sector(h['sector'])
        
        if filter_sectors and norm_s not in filter_sectors:
            continue
            
        if norm_s not in sentiment_snapshot:
            sentiment_snapshot[norm_s] = h
            
    return sector_stories, filtered_market_events, sentiment_snapshot

def format_newsletter(sector_stories, market_events, sentiment_snapshot, interested_sectors=None):
    today_str = datetime.now().strftime('%B %d, %Y')
    
    title_suffix = ""
    if interested_sectors and isinstance(interested_sectors, list) and len(interested_sectors) > 0:
        title_suffix = f" ({', '.join(interested_sectors)})"

    md = f"# 🌐 NichePulse: Daily Intelligence Brief{title_suffix}
"
    md += f"*Automated intelligence for the fast-moving professional*
"
    md += f"**Date:** {today_str}

"
    
    md += "---

"
    
    # Market Events Section
    if market_events:
        md += "## ⚡ Market Catalysts
"
        md += "*Key funding rounds, M&A, and regulatory milestones detected in the last 24 hours.*

"
        for event in market_events:
            emoji = "💰" if event['event_type'].lower() in ['funding', 'm&a', 'investment'] else "🚀"
            md += f"- **{emoji} {event['title']}** ({event['sector']}) - *{event['event_type']}*
"
        md += "
---

"
    
    # Sector Stories
    md += "## 📈 Sector Deep-Dives

"
    if not sector_stories:
        md += "No major stories distilled in the last 24 hours.

"
    else:
        for sector, stories in sector_stories.items():
            md += f"### {sector.upper()}
"
            # Add sentiment indicator
            if sector in sentiment_snapshot:
                score = sentiment_snapshot[sector]['avg_sentiment']
                sentiment_label = "Positive" if score > 0.6 else "Neutral" if score >= 0.4 else "Negative"
                md += f"*Sector Sentiment: **{sentiment_label}** ({score:.2f})*

"
                
            for s in stories:
                md += f"#### {s['title']}
"
                md += f"{s['summary']}

"
                md += f"*Importance: {s['importance_score']}/10 | Sentiment: {s['sentiment']}*

"
            md += "
"
            
    md += "---

"
    
    # Sentiment Summary
    md += "## 📊 Sentiment Snapshot
"
    md += "| Sector | Avg Sentiment | Signal Count |
"
    md += "| :--- | :---: | :---: |
"
    for sector, data in sentiment_snapshot.items():
        md += f"| {sector.upper()} | {data['avg_sentiment']:.2f} | {data['count']} |
"
    
    md += "

"
    md += "---
"
    md += "*Generated by NichePulse AI Intelligence Pipeline.*
"
    md += "[Manage Preferences](https://nichepulse.ai/settings) | [View Dashboard](https://nichepulse.ai/dashboard)
"
    
    return md

def save_newsletter(content_md, content_html):
    output_dir = "/home/team/shared/newsletters"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    now = datetime.now()
    date_str = now.strftime('%Y%m%d_%H%M%S')
    
    # Save Markdown
    md_filename = f"daily_pulse_{date_str}.md"
    md_filepath = os.path.join(output_dir, md_filename)
    with open(md_filepath, 'w') as f:
        f.write(content_md)
    print(f"Markdown newsletter saved to {md_filepath}")
    
    # Save HTML
    html_filename = f"daily_pulse_{date_str}.html"
    html_filepath = os.path.join(output_dir, html_filename)
    with open(html_filepath, 'w') as f:
        f.write(content_html)
    print(f"HTML newsletter saved to {html_filepath}")
    
    # Update 'latest' files
    with open(os.path.join(output_dir, "latest.md"), 'w') as f:
        f.write(content_md)
    with open(os.path.join(output_dir, "latest.html"), 'w') as f:
        f.write(content_html)
        
    # Save to database for Archive
    try:
        newsletter_id = str(uuid.uuid4())
        title = f"NichePulse: Daily Intelligence Brief - {now.strftime('%B %d, %Y')}"
        publish_date = now.isoformat()
        
        # Escape single quotes for SQL
        markdown_content_escaped = content_md.replace("'", "''")
        html_content_escaped = content_html.replace("'", "''")
        title_escaped = title.replace("'", "''")
        
        sql = f"""
            INSERT INTO newsletters (id, title, markdown_content, html_content, publish_date)
            VALUES ('{newsletter_id}', '{title_escaped}', '{markdown_content_escaped}', '{html_content_escaped}', '{publish_date}')
        """
        run_team_db(sql)
        print(f"Newsletter saved to database with ID: {newsletter_id}")
    except Exception as e:
        print(f"Error saving newsletter to database: {e}")
        
    return md_filepath

def generate_personalized_newsletter(interested_sectors=None):
    sector_stories, market_events, sentiment_snapshot = get_newsletter_data(interested_sectors)
    
    newsletter_md = format_newsletter(sector_stories, market_events, sentiment_snapshot, interested_sectors)
    
    # Convert MD to HTML for extra value
    newsletter_html = markdown_to_html(newsletter_md)
    
    return newsletter_md, newsletter_html

def main():
    print("--- Starting Daily Newsletter Assembly ---")
    newsletter_md, newsletter_html = generate_personalized_newsletter(None) # None means All Sectors
    
    save_newsletter(newsletter_md, newsletter_html)
    print("--- Newsletter Assembly Completed ---")

if __name__ == "__main__":
    main()
