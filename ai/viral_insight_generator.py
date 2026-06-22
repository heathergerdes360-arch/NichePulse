import json
import subprocess
import os
from datetime import datetime, timedelta
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Paths
TEAM_DB_PATH = '/home/agent-ai-engineer/.local/bin/team-db'
OUTPUT_DIR = "/home/team/shared/growth"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "social_content_latest.md")

from db_utils import run_team_db

def get_insights():
    insights = []
    
    # 1. Market events in last 24h
    events = run_team_db("SELECT * FROM market_events WHERE datetime(created_at) >= datetime('now', '-24 hours') ORDER BY significance DESC")
    if events:
        insights.append({"type": "Market Event", "data": events[0]})
        if len(events) > 1:
            insights.append({"type": "Market Summary", "data": events[:3]})
        
    # 2. Highest importance story in last 24h
    stories = run_team_db("SELECT * FROM stories WHERE datetime(created_at) >= datetime('now', '-24 hours') ORDER BY importance_score DESC LIMIT 1")
    if stories:
        insights.append({"type": "Key Story", "data": stories[0]})
        
    # 3. Biggest sentiment swing
    sectors_res = run_team_db("SELECT DISTINCT sector FROM sentiment_history")
    sectors = [s['sector'] for s in sectors_res]
    
    max_swing = -1
    best_swing_data = None
    
    for sector in sectors:
        history = run_team_db(f"SELECT * FROM sentiment_history WHERE sector = '{sector}' ORDER BY created_at DESC LIMIT 2")
        if len(history) == 2:
            swing = abs(history[0]['avg_sentiment'] - history[1]['avg_sentiment'])
            if swing > max_swing:
                max_swing = swing
                best_swing_data = {
                    "sector": sector,
                    "current": history[0]['avg_sentiment'],
                    "previous": history[1]['avg_sentiment'],
                    "swing": swing
                }
    
    if best_swing_data and max_swing > 0.05: # Lowered threshold for demo
        insights.append({"type": "Sentiment Swing", "data": best_swing_data})
        
    # 4. Latest Premium Deep Dive
    deep_dives = run_team_db("SELECT * FROM deep_dives ORDER BY created_at DESC LIMIT 1")
    if deep_dives:
        insights.append({"type": "Premium Deep Dive", "data": deep_dives[0]})
        
    return insights

def generate_mock_content(insights):
    today = datetime.now().strftime('%B %d, %Y')
    md = f"# AI-Generated Viral Insights Content - {today}

"
    md += "*Note: This content was generated using rule-based fallback because no LLM API key was available.*

"
    
    for i, insight in enumerate(insights):
        title = insight['type']
        data = insight['data']
        
        md += f"## Insight {i+1}: {title}
"
        
        if insight['type'] == "Market Event" or insight['type'] == "Latest Market Event (Fallback)":
            event_name = data.get('title', 'Market Move')
            sector = data.get('sector', 'Tech')
            md += f"### Twitter Thread-starter
"
            md += f"🚨 BIG MOVE in {sector}: {event_name} just happened. Here is why this changes everything for the industry. 🧵(1/5) #NichePulse #{sector}

"
            md += f"### LinkedIn Post
"
            md += f"The recent {event_name} in the {sector} sector is a significant milestone. Our AI analysis shows that this signal indicates a shift in market dynamics... #ThoughtLeadership #BusinessIntelligence

"
            md += f"### Reddit Prompt
"
            md += f"How do you think {event_name} will affect small players in {sector}? (Post to r/{sector.lower().replace(' ', '')})

"
            
        elif insight['type'] == "Market Summary":
            event_titles = [e.get('title', 'Market Move') for e in data]
            summary_text = " | ".join(event_titles)
            md += f"### Twitter Thread-starter
"
            md += f"📊 24H MARKET ROUNDUP: {summary_text}. The industry is moving fast. Here are the 3 things you need to know today. 🧵 #MarketWrap #NichePulse

"
            md += f"### LinkedIn Post
"
            md += f"A busy 24 hours in the markets: we've seen {len(data)} major shifts including {summary_text}. Here's our take on the combined impact of these catalysts... #MarketIntelligence #BusinessSummary

"
            md += f"### Reddit Prompt
"
            md += f"Big day for the industry with {len(data)} major events. Which one do you think has the longest tail? (Post to r/nichecommunities)

"

        elif insight['type'] == "Key Story":
            story_title = data.get('title', 'Industry Update')
            category = data.get('category', 'Tech')
            md += f"### Twitter Thread-starter
"
            md += f"📈 Intelligence Alert: {story_title}. We've distilled the noise so you don't have to. Here's the 5-minute brief. 🧵 #NichePulse #{category}

"
            md += f"### LinkedIn Post
"
            md += f"Distilling the latest trends in {category}: {story_title}. Professionals need to stay ahead of these shifts to remain competitive. #Intelligence #Strategy

"
            md += f"### Reddit Prompt
"
            md += f"What is your take on the latest {category} developments? Does {story_title} align with what you are seeing on the ground? (Post to r/nichecommunities)

"
            
        elif insight['type'] == "Sentiment Swing":
            sector = data.get('sector', 'Market')
            swing = data.get('swing', 0)
            direction = "UP" if data.get('current', 0) > data.get('previous', 0) else "DOWN"
            md += f"### Twitter Thread-starter
"
            md += f"⚠️ SENTIMENT SHIFT: {sector} sentiment is {direction} by {swing*100:.1f}% in the last 24 hours. What's driving the change? Let's dive in. 🧵 #MarketSentiment #{sector}

"
            md += f"### LinkedIn Post
"
            md += f"Quantitative sentiment tracking for {sector} shows a significant {direction.lower()}swing. This kind of volatility often precedes major market movements. #DataScience #MarketAnalysis

"
            md += f"### Reddit Prompt
"
            md += f"Anyone else feeling a vibe shift in {sector} lately? Our data shows a big sentiment swing. (Post to r/investing)

"
            
        elif insight['type'] == "Premium Deep Dive":
            # Extract title from the markdown content (it's the first line starting with #)
            content = data.get('content', '# Industry Analysis')
            title_line = content.split('
')[0].replace('#', '').replace('Premium Deep Dive:', '').strip()
            md += f"### Twitter Thread-starter
"
            md += f"🔓 UNLOCKED: Our latest Premium Deep-Dive on {title_line}. This is the intelligence that founders and investors are using to stay ahead. 🧵 #DeepDive #Intelligence

"
            md += f"### LinkedIn Post
"
            md += f"We just released a comprehensive analysis of {title_line}. In this premium brief, we explore the strategic implications and recommended actions for industry leaders. #Strategy #BusinessIntelligence

"
            md += f"### Reddit Prompt
"
            md += f"I just read a deep-dive on {title_line} - the data suggests some really interesting shifts. What are you seeing in this space? (Post to r/nichecommunities)

"
            
        md += "---

"
        
    return md

def generate_social_content(insights):
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("OPENAI_API_KEY not found in environment. Falling back to rule-based social content generation.")
        return generate_mock_content(insights)

    client = OpenAI(api_key=api_key)
    
    prompt = f"""
    You are a viral growth marketer for NichePulse, an AI-distilled intelligence platform.
    Your goal is to turn technical/industry insights into highly engaging social media content.
    
    Insights from the last 24 hours:
    {json.dumps(insights, indent=2)}
    
    For EACH insight provided, generate:
    1. A 'Thread-starter' for Twitter: Hook-driven, using emojis, designed to lead into a thread about the topic.
    2. A 'Thought-leadership' post for LinkedIn: Professional yet provocative, providing an analysis of WHY this matters for the industry.
    3. A 'Niche Discussion' prompt for Reddit: Designed to spark a debate or request for experiences in a relevant subreddit (mention which one).
    
    If the insight is a 'Premium Deep Dive', treat it as a high-value 'NichePulse Exclusive' to drive newsletter signups.
    
    Format the entire output as a single Markdown file.
    Use clear headers for each insight and each social platform.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "You are a social media growth expert."}, {"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return generate_mock_content(insights)

def main():
    print("Gathering surprising insights...")
    insights = get_insights()
    
    if not insights:
        print("No significant insights found in the last 24 hours.")
        # Fallback to some generic data if available
        events = run_team_db("SELECT * FROM market_events ORDER BY significance DESC LIMIT 1")
        if events:
            insights.append({"type": "Latest Market Event (Fallback)", "data": events[0]})
        else:
            print("No fallback data found.")
            return

    print(f"Generating social content for {len(insights)} insights...")
    content = generate_social_content(insights)
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
        
    print(f"Content saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
