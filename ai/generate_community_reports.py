import json
import subprocess
import os
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db

def get_sector_social_data(category):
    cats = [category]
    if category.lower() == 'climate tech':
        cats = ['climate', 'Climate Tech', 'ClimateTech']
    elif category.lower() == 'ai':
        cats = ['ai', 'AI']
    elif category.lower() == 'biotech':
        cats = ['biotech', 'Biotech']
    
    cat_filter = " OR ".join([f"category = '{c}'" for c in cats])
    
    sql = f"""
    SELECT source, title, sentiment, importance 
    FROM signals 
    WHERE source IN ('reddit', 'hackernews', 'producthunt', 'Twitter') 
    AND ({cat_filter})
    AND sentiment != ''
    ORDER BY timestamp DESC
    LIMIT 10
    """
    return run_team_db(sql)

def generate_report():
    api_key = os.environ.get('OPENAI_API_KEY')
    client = OpenAI(api_key=api_key) if api_key else None

    sectors = [
        {"name": "AI", "reddit": "r/MachineLearning", "hn": "AI"},
        {"name": "Climate Tech", "reddit": "r/ClimateTech", "hn": "Energy"},
        {"name": "Biotech", "reddit": "r/biotech", "hn": "Biotech"},
        {"name": "SpaceTech", "reddit": "r/spacex", "hn": "Space"},
        {"name": "DefenseTech", "reddit": "r/DefenseTech", "hn": "Defense"},
        {"name": "Longevity", "reddit": "r/longevity", "hn": "Health"}
    ]
    
    full_report = f"# 🌐 NichePulse Community Pulse - {datetime.now().strftime('%B %d, %Y')}\n\n"
    full_report += "Distilled community sentiment and emerging signals from Reddit, HN, and niche forums. 🧵👇\n\n"

    for sector in sectors:
        name = sector['name']
        data = get_sector_social_data(name)

        if not data:
            full_report += f"## #{name.replace(' ', '')} Pulse\n**Community Vibe:** Quiet ⚪\n\n*No significant community signals today.*\n\n---\n\n"
            continue

        pos_count = sum(1 for d in data if d['sentiment'] == 'Positive')
        neg_count = sum(1 for d in data if d['sentiment'] == 'Negative')

        overall = "Neutral ⚪"
        if pos_count > neg_count: overall = "Bullish 📈"
        elif neg_count > pos_count: overall = "Bearish 📉"

        hashtag = name.replace(" ", "")

        full_report += f"## #{hashtag} Pulse\n"
        full_report += f"**Community Vibe:** {overall}\n\n"

        # AI-driven summarization for signals
        signals_text = "\n".join([f"- {d['title']}" for d in data[:10]])
        
        summarized_signals = ""
        if client:
            try:
                prompt = f"""
                Summarize these community signals for the '{name}' sector into 3-5 high-signal bullet points.
                Focus on technical breakthroughs, market shifts, or community controversies.
                
                Maintain professional grammar and avoid double negatives (e.g., use "without any" instead of "without no").
                
                Signals:
                {signals_text}
                
                Format as a markdown list of bullet points with a sentiment emoji (🟢, 🔴, ⚪) at the start of each line.
                """
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}]
                )
                summarized_signals = response.choices[0].message.content
            except Exception as e:
                print(f"Error summarizing signals for {name}: {e}")
        
        if not summarized_signals:
            # Fallback to simple list
            summarized_signals = "### 💎 Top Signals\n"
            for d in data[:5]:
                sentiment_icon = "🟢" if d['sentiment'] == 'Positive' else ("🔴" if d['sentiment'] == 'Negative' else "⚪")
                summarized_signals += f"- {sentiment_icon} **{d['title']}**\n"

        full_report += summarized_signals + "\n\n"

        # Formatting for Reddit
        reddit_post = ""
        if client:
            try:
                prompt = f"""
                Create a viral-ready Reddit post for r/{sector['reddit'].split('/')[-1]} based on these signals for '{name}'.
                Goal: Engaging, authentic, not too 'corporate'.
                
                Maintain professional grammar and avoid double negatives.
                Include a link to 'https://nichepulse.ai' at the end.
                
                Signals:
                {summarized_signals}
                """
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}]
                )
                reddit_post = response.choices[0].message.content
            except Exception as e:
                print(f"Error generating Reddit post for {name}: {e}")

        if not reddit_post:
            reddit_post = f"**{name} Community Pulse: {overall}**\n\nTop signals we're tracking today:\n\n"
            for d in data[:3]:
                sentiment_icon = "✅" if d['sentiment'] == 'Positive' else ("⚠️" if d['sentiment'] == 'Negative' else "ℹ️")
                reddit_post += f"* {sentiment_icon} {d['title']}\n"
            reddit_post += f"\nGenerated by NichePulse AI. Get the full brief at https://nichepulse.ai"

        full_report += f"#### 🚀 Reddit-Ready Post ({sector['reddit']})\n```\n{reddit_post}\n```\n\n"
        full_report += "---\n\n"

    full_report += """### 🚀 Automated Intelligence for Busy Professionals
NichePulse distills thousands of signals into a 5-minute daily brief. Stay ahead of the curve without the noise.

🔗 [Join the waitlist](https://nichepulse.ai)

#AI #Biotech #ClimateTech #Space #DefenseTech #Longevity #Intelligence"""
    
    return full_report

def main():
    report = generate_report()
    output_path = "/home/team/shared/growth/community_pulse_reports.md"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        f.write(report)
    
    print(f"Community Pulse Report generated at {output_path}")

if __name__ == "__main__":
    main()
