"""
NichePulse Core Distillation Logic
---------------------------------
This script retrieves raw signals from the 'signals' table, groups them by category,
and distills them into 'stories' using an LLM (with a fallback for when no API key is present).
The resulting stories are stored in the 'stories' table for use in reports.
"""

import json
import subprocess
import uuid
import re
from datetime import datetime
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import time

from db_utils import run_team_db

def get_signals():
    # Retrieve signals that haven't been distilled into a story yet
    return run_team_db("SELECT * FROM signals WHERE id NOT IN (SELECT signal_id FROM story_signals)")

def insert_story(title, summary, sentiment, sentiment_score, importance_score, category, signal_ids, is_market_event=0, cross_sector_links=None):
    story_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    summary_escaped = summary.replace("'", "''")
    title_escaped = title.replace("'", "''")
    links_escaped = cross_sector_links.replace("'", "''") if cross_sector_links else ""
    
    sql = f"INSERT INTO stories (id, title, summary, sentiment, sentiment_score, importance_score, category, created_at, is_market_event, cross_sector_links) VALUES ('{story_id}', '{title_escaped}', '{summary_escaped}', '{sentiment}', {sentiment_score}, {importance_score}, '{category}', '{created_at}', {is_market_event}, '{links_escaped}')"
    run_team_db(sql)
    
    # Link signals to story
    if signal_ids:
        values = ", ".join([f"('{story_id}', '{sid}')" for sid in signal_ids])
        link_sql = f"INSERT OR IGNORE INTO story_signals (story_id, signal_id) VALUES {values}"
        run_team_db(link_sql)
    
    return story_id

def normalize_sector(sector):
    if not sector:
        return "General"
    s = sector.lower().replace(" ", "")
    if s == 'ai': return 'ai'
    if s == 'biotech': return 'biotech'
    if 'climate' in s: return 'climate'
    if 'space' in s: return 'spacetech'
    if 'defense' in s: return 'defensetech'
    if s == 'longevity': return 'longevity'
    if s == 'tech': return 'tech'
    if s == 'signal_gap': return 'signal_gap'
    return s

def distill_with_llm(sigs, category):
    api_key = os.environ.get('OPENAI_API_KEY')
    
    # Prepare signals for LLM
    signals_data = []
    for s in sigs:
        signals_data.append({
            "id": s.get('id'),
            "title": s.get('title'),
            "content": s.get('content'),
            "metadata": s.get('metadata')
        })
    
    signals_json = json.dumps(signals_data, indent=2)

    if not api_key:
        print(f"OPENAI_API_KEY not found in environment. Falling back to rule-based distillation logic for {category}.")
        
        # Define keywords for filtering noise in fallback mode
        keywords = {
            "ai": [r"\bai\b", r"intelligence", r"learning", r"gpt", r"llm", r"model", r"transformer"],
            "climate": [r"climate", r"carbon", r"renewable", r"solar", r"energy", r"emission", r"green"],
            "biotech": [r"biotech", r"fda", r"clinical", r"trial", r"gene", r"drug", r"therapy"],
            "spacetech": [r"space", r"satellite", r"rocket", r"orbit", r"nasa", r"launch"],
            "defensetech": [r"defense", r"military", r"drone", r"missile", r"radar", r"cyber"],
            "longevity": [r"aging", r"senolytic", r"longevity", r"lifespan", r"\bnad\b", r"autophagy"]
        }
        
        relevant_sigs = []
        cat_kws = keywords.get(category, [])
        for s in sigs:
            text = f"{s.get('title', '')} {s.get('content', '')}".lower()
            if any(re.search(kw, text) for kw in cat_kws):
                relevant_sigs.append(s)
            elif category == "tech": # tech is a catch-all, keep everything
                relevant_sigs.append(s)
        
        if not relevant_sigs:
            print(f"  ⚠️ No relevant signals found for {category} after filtering.")
            return []

        # Create buckets for more specific stories
        buckets = {
            "Senolytic": {"title": "Longevity: Senolytic Therapy Advances", "sigs": [], "score": 9},
            "GPT": {"title": "AI: Large Language Model Updates", "sigs": [], "score": 9},
            "Solar": {"title": "Climate: Renewable Energy Progress", "sigs": [], "score": 8},
            "General": {"title": f"{category} Industry Update", "sigs": [], "score": 6}
        }
        
        for s in relevant_sigs:
            text = f"{s.get('title', '')} {s.get('content', '')}".lower()
            if "senolytic" in text:
                buckets["Senolytic"]["sigs"].append(s)
            elif any(x in text for x in ["gpt", "llm", "transformer"]):
                buckets["GPT"]["sigs"].append(s)
            elif "solar" in text:
                buckets["Solar"]["sigs"].append(s)
            else:
                buckets["General"]["sigs"].append(s)
        
        stories = []
        for key, bucket in buckets.items():
            if not bucket["sigs"]:
                continue
                
            # If we are in Longevity and have Senolytic signals, use that title
            # Otherwise, if we are in another category, "Senolytic" might be the wrong bucket title
            title = bucket["title"]
            if category not in title and key != "General":
                title = f"{category}: {title.split(': ')[1]}" if ": " in title else f"{category} Update"

            # Priority boost for signal gaps
            base_score = bucket["score"]
            if category == "signal_gap":
                base_score += 1

            stories.append({
                "title": title,
                "summary": f"Key developments in {category}: " + "; ".join([s.get('title') for s in bucket["sigs"][:3]]),
                "sentiment": "Neutral",
                "sentiment_score": 0.5,
                "importance_score": min(10, base_score),
                "cross_sector_links": None,
                "relevant_signal_ids": [s.get('id') for s in bucket["sigs"]],
                "is_market_event": 0
            })
            
        return stories

    client = OpenAI(api_key=api_key)
    
    prompt = f"""
    You are a world-class strategic industry analyst. 
    You are given a list of signals (news, social media, technical data) for the '{category}' sector.

    Your tasks:
    1. Filter out signals that are clearly IRRELEVANT to the '{category}' sector or are low-quality noise.
    2. Cluster the remaining relevant signals into one or more distinct 'Stories'. 
       - A Story is a group of signals that discuss the same event, trend, or breakthrough.
       - If signals are unrelated, they should be in separate Stories.
       - A single signal can be its own Story if it's high impact.
    3. For each Story, provide:
       - title: A catchy, professional title.
       - summary: A concise (2-3 sentence) but high-density update for a C-suite executive.
       - sentiment: "Positive", "Negative", or "Neutral".
       - sentiment_score: 0.0 to 1.0 (1.0 is very positive).
       - importance_score: 1-10 based on:
         * Impact: Potential to disrupt the industry or move markets.
         * Novelty: How new or unexpected this information is.
         * Urgency: How quickly a professional needs to act on this.
       - cross_sector_links: Any non-obvious links or dependencies to other sectors (e.g. AI breakthrough affecting energy grids).
       - relevant_signal_ids: A list of IDs of the signals that belong to this story.
       - is_market_event: 1 if the story describes a market-moving event (funding, M&A, regulatory milestone), 0 otherwise.

    Input Signals (JSON):
    {signals_json}

    Output format: JSON object with a key "stories" containing a list of story objects.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        result = json.loads(response.choices[0].message.content)
        return result.get('stories', [])
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return []

def main():
    signals = get_signals()
    if not signals:
        print("No signals found.")
        return

    # Group signals by normalized category
    categories = {}
    for signal in signals:
        cat = normalize_sector(signal.get('category', 'General'))
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(signal)

    # Process each category
    for cat, sigs in categories.items():
        print(f"Processing category: {cat} ({len(sigs)} signals)")
        
        # Call the new cluster-aware distillation
        stories = distill_with_llm(sigs, cat)
            
        for story in stories:
            title = story.get('title')
            summary = story.get('summary')
            sentiment = story.get('sentiment', 'Neutral')
            sentiment_score = story.get('sentiment_score', 0.5)
            importance_score = story.get('importance_score', 5)
            cross_sector_links = story.get('cross_sector_links')
            signal_ids = story.get('relevant_signal_ids', [])
            is_market_event = story.get('is_market_event', 0)
            
            if not title or not summary or not signal_ids:
                continue

            print(f"Generated story: {title} (Signals: {len(signal_ids)})")
            insert_story(title, summary, sentiment, sentiment_score, importance_score, cat, signal_ids, is_market_event, cross_sector_links)

if __name__ == "__main__":
    main()
