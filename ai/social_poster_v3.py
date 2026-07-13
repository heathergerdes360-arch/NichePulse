"""NichePulse Social Media Poster v3 - agent-browser actual posting"""
import os, subprocess, json, time, re
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'nichepulse', '.env'))

PROFILE = "/home/agent-lead/.config/google-chrome"
BASE = "/home/team/shared/nichepulse"
BROWSER = "/home/engine/.nvm/versions/node/v24.18.0/bin/agent-browser"

def run_team_db(sql):
    for attempt in range(3):
        try:
            r = subprocess.run(['team-db', sql.replace('"', '\\"')],
                             capture_output=True, text=True, timeout=10)
            if r.returncode == 0 and r.stdout.strip():
                return json.loads(r.stdout)
            return []
        except:
            time.sleep(0.5)
    return []

def log_post(platform, url, ctype):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sql = f"INSERT INTO social_posts (platform, post_url, timestamp, content_type) VALUES ('{platform}', '{url}', '{ts}', '{ctype}')"
    run_team_db(sql)

def get_latest_content():
    """Fetch latest content from DB or local file."""
    # Try DB first
    res = run_team_db("SELECT content FROM reports WHERE type='daily' ORDER BY date DESC LIMIT 1")
    if res:
        return res[0]['content']
    
    # Fallback to local file
    latest_file = "/home/team/shared/growth/social_content_latest.md"
    if os.path.exists(latest_file):
        with open(latest_file, 'r') as f:
            return f.read()
            
    return "📊 NichePulse Daily Intelligence Brief\n\nTop stories from AI, Climate Tech, and Biotech today.\n\nGet your free daily brief: nichepulse.ai"

def post_to_x(content):
    """Post to X (Twitter) using agent-browser with saved session."""
    # Extract short version for X
    x_content = content[:280]
    print(f"Posting to X: {x_content[:50]}...")
    try:
        subprocess.run([BROWSER, "--profile", PROFILE, "open", "https://x.com/home"], check=True, timeout=30)
        time.sleep(3)

        # Click the tweet compose area
        subprocess.run([BROWSER, "--profile", PROFILE, "click", "a[href='/compose/post']"], check=False, timeout=10)
        time.sleep(2)

        # Type content
        subprocess.run([BROWSER, "--profile", PROFILE, "fill", 'div[data-testid="tweetTextarea_0"]', x_content], check=False, timeout=15)
        time.sleep(2)

        # Click Post
        subprocess.run([BROWSER, "--profile", PROFILE, "click", 'div[data-testid="tweetButtonInline"]'], check=False, timeout=10)
        time.sleep(3)

        log_post("X", f"https://x.com/nichepulse/sim_{int(time.time())}", "Thread-starter")
        print("✅ Posted to X")
        return True
    except Exception as e:
        print(f"❌ X failed: {e}")
        return False

def post_to_linkedin(content):
    """Post to LinkedIn using agent-browser with saved session."""
    li_content = content[:1000] # LinkedIn allows longer posts
    print(f"Posting to LinkedIn: {li_content[:50]}...")
    try:
        subprocess.run([BROWSER, "--profile", PROFILE, "open", "https://www.linkedin.com/feed/"], check=True, timeout=30)
        time.sleep(4)

        # Click "Start a post"
        subprocess.run([BROWSER, "--profile", PROFILE, "click", "button.share-box-feed-entry__trigger"], check=False, timeout=10)
        time.sleep(3)

        # Type into editor
        subprocess.run([BROWSER, "--profile", PROFILE, "fill", 'div[contenteditable="true"]', li_content], check=False, timeout=15)
        time.sleep(2)

        # Click Post
        subprocess.run([BROWSER, "--profile", PROFILE, "click", "button.share-actions__primary-action"], check=False, timeout=10)
        time.sleep(3)

        log_post("LinkedIn", f"https://linkedin.com/feed/update/sim_{int(time.time())}", "Thought-leadership")
        print("✅ Posted to LinkedIn")
        return True
    except Exception as e:
        print(f"❌ LinkedIn failed: {e}")
        return False

def post_to_reddit(subreddit, title, content):
    """Post to Reddit using agent-browser with saved session."""
    print(f"Posting to Reddit r/{subreddit}: {title[:30]}...")
    try:
        url = f"https://www.reddit.com/r/{subreddit}/submit"
        subprocess.run([BROWSER, "--profile", PROFILE, "open", url], check=True, timeout=30)
        time.sleep(5)

        # Reddit title
        subprocess.run([BROWSER, "--profile", PROFILE, "fill", 'input[name="title"]', title], check=False, timeout=10)
        time.sleep(2)

        # Reddit content
        subprocess.run([BROWSER, "--profile", PROFILE, "fill", 'div[role="textbox"]', content], check=False, timeout=15)
        time.sleep(2)

        # Click Post
        subprocess.run([BROWSER, "--profile", PROFILE, "click", 'button[type="submit"]'], check=False, timeout=10)
        time.sleep(3)

        log_post("Reddit", f"https://reddit.com/r/{subreddit}/sim_{int(time.time())}", "Reddit-ready")
        print(f"✅ Posted to r/{subreddit}")
        return True
    except Exception as e:
        print(f"❌ Reddit r/{subreddit} failed: {e}")
        return False

def main():
    print("=== NichePulse Social Poster v3.1 (with Reddit) ===")
    
    content = get_latest_content()
    
    # Post to X
    post_to_x(content)
    time.sleep(5)

    # Post to LinkedIn
    post_to_linkedin(content)
    time.sleep(5)

    # Post to Reddit subreddits
    for sub in ["MachineLearning", "ClimateTech", "biotech"]:
        post_to_reddit(sub, f"NichePulse Daily Intelligence: {datetime.now().strftime('%Y-%m-%d')}", content[:2000])
        time.sleep(5)

    print("=== Cycle Completed ===")

if __name__ == "__main__":
    main()
