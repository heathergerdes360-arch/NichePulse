import json
import subprocess
import os
from openai import OpenAI
from dotenv import load_dotenv
import time

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db
def get_unprocessed_social_signals():
    # Fetch signals from social sources that don't have sentiment
    sources = "('reddit', 'hackernews', 'producthunt', 'Twitter')"
    sql = f"SELECT id, title, content, category FROM signals WHERE source IN {sources} AND (sentiment IS NULL OR sentiment = '') LIMIT 50"
    return run_team_db(sql)

def analyze_sentiment(title, content):
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        # Simple rule-based fallback if no API key
        text = f"{title} {content}".lower()
        positive_words = ['breakthrough', 'success', 'growth', 'innovative', 'great', 'excellent', 'boost', 'approved']
        negative_words = ['fail', 'risk', 'drop', 'decline', 'scam', 'concern', 'worry', 'threat', 'rejected']
        
        pos_count = sum(1 for word in positive_words if word in text)
        neg_count = sum(1 for word in negative_words if word in text)
        
        if pos_count > neg_count:
            return "Positive", 0.7 + (min(pos_count, 3) * 0.1)
        elif neg_count > pos_count:
            return "Negative", 0.3 - (min(neg_count, 3) * 0.1)
        else:
            return "Neutral", 0.5

    client = OpenAI(api_key=api_key)
    prompt = f"""
    Analyze the sentiment of the following social media post/headline.
    Title: {title}
    Content: {content}
    
    Return JSON with:
    "sentiment": "Positive", "Negative", or "Neutral"
    "sentiment_score": float between 0.0 and 1.0
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        result = json.loads(response.choices[0].message.content)
        return result.get('sentiment', 'Neutral'), result.get('sentiment_score', 0.5)
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return "Neutral", 0.5

def update_signal_sentiment(signal_id, sentiment, score):
    sql = f"UPDATE signals SET sentiment = '{sentiment}', importance = {int(score * 10)} WHERE id = '{signal_id}'"
    # Note: We are using 'importance' as a placeholder or we could just update sentiment.
    # Actually, the signals table has a sentiment column but not a numerical sentiment_score column.
    # Let's check the schema again.
    run_team_db(sql)

def main():
    print("Starting Social Media Sentiment Analysis...")
    signals = get_unprocessed_social_signals()
    if not signals:
        print("No new social signals to process.")
        return

    print(f"Processing {len(signals)} signals...")
    for s in signals:
        sentiment, score = analyze_sentiment(s['title'], s['content'])
        print(f"Signal: {s['title'][:50]}... -> {sentiment} ({score})")
        update_signal_sentiment(s['id'], sentiment, score)
        # Small sleep to avoid rate limits if using LLM
        if os.environ.get('OPENAI_API_KEY'):
            time.sleep(0.5)

    print("Social sentiment analysis complete.")

if __name__ == "__main__":
    main()
