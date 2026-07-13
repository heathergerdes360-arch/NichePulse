import subprocess
import os
import sys
import logging
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/home/team/shared/nichepulse/pipeline.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Paths to scripts
BASE_DIR = "/home/team/shared/nichepulse"
AI_DIR = os.path.join(BASE_DIR, "ai")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Scripts
INGEST_SCRIPT = os.path.join(BACKEND_DIR, "ingest", "ingest_rss.py")
SIGNAL_GAP_SCRIPT = os.path.join(AI_DIR, "community_signal_gap.py")
DISTILL_SCRIPT = os.path.join(AI_DIR, "distill.py")
SYNTHESIZE_SCRIPT = os.path.join(AI_DIR, "synthesize.py")
SOCIAL_SENTIMENT_SCRIPT = os.path.join(AI_DIR, "social_sentiment.py")
SENTIMENT_TRACKER_SCRIPT = os.path.join(AI_DIR, "sentiment_tracker.py")
ALERT_SYSTEM_SCRIPT = os.path.join(AI_DIR, "alert_system.py")
NEWSLETTER_GENERATOR_SCRIPT = os.path.join(AI_DIR, "newsletter_generator.py")
VIRAL_INSIGHT_GENERATOR_SCRIPT = os.path.join(AI_DIR, "viral_insight_generator.py")
COMMUNITY_REPORT_SCRIPT = os.path.join(AI_DIR, "generate_community_reports.py")
SEO_BLOG_GENERATOR_SCRIPT = os.path.join(AI_DIR, "seo_blog_generator.py")
SOCIAL_POSTING_SCRIPT = "/home/team/shared/social/post_v3.py"
USER_ANALYSIS_SCRIPT = os.path.join(AI_DIR, "user_analysis.py")
GENERATE_HOOKS_SCRIPT = os.path.join(AI_DIR, "generate_outreach_hooks.py")
EVENT_PROMOTER_SCRIPT = os.path.join(AI_DIR, "event_promoter.py")
DEEP_DIVE_ORCHESTRATOR_SCRIPT = os.path.join(AI_DIR, "generate_all_deep_dives.py")
SEND_NEWSLETTER_SCRIPT = os.path.join(AI_DIR, "send_newsletter.py")

def run_script(script_path, name, retries=3, delay=5, timeout=600):
    if not os.path.exists(script_path):
        logging.warning(f"Script {name} not found at {script_path}. Skipping.")
        return False
    
    for attempt in range(retries):
        logging.info(f"Starting {name} (Attempt {attempt + 1}/{retries})...")
        try:
            script_dir = os.path.dirname(script_path)
            # We set a timeout to prevent indefinite hangs
            result = subprocess.run(["python3", script_path], capture_output=True, text=True, check=True, cwd=script_dir, timeout=timeout)
            logging.info(f"{name} completed successfully.")
            return True
        except subprocess.TimeoutExpired:
            logging.error(f"{name} timed out after {timeout} seconds.")
            if attempt < retries - 1:
                logging.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
        except subprocess.CalledProcessError as e:
            err = (e.stderr or "") + (e.stdout or "")
            is_transient = any(x in err for x in ["Locking", "sync engine operation failed", "unable to checkpoint", "database is locked"])
            if is_transient:
                logging.warning(f"{name} failed due to database lock/sync issue. Retrying...")
                if attempt < retries - 1:
                    time.sleep(delay)
                    continue
            logging.error(f"Error running {name}: {e.stderr}")
            if e.stdout:
                logging.debug(f"Stdout from {name}: {e.stdout}")
            break
    return False

def main():
    logging.info("--- NichePulse Intelligence Pipeline Started ---")
    
    # 1. Ingestion
    ingest_success = run_script(INGEST_SCRIPT, "RSS Ingestion", retries=1)
    
    # 1.1 Signal Gap Ingestion (New high-value sources)
    run_script(SIGNAL_GAP_SCRIPT, "Community Signal Gap Ingestion", retries=3)
    
    # 2. Distillation
    distill_success = run_script(DISTILL_SCRIPT, "Signal Distillation", retries=3)
    
    # 2.5 Market Event Promotion
    if distill_success:
        run_script(EVENT_PROMOTER_SCRIPT, "Market Event Promotion", retries=3)
        # 2.6 Premium Deep-Dive Generation
        run_script(DEEP_DIVE_ORCHESTRATOR_SCRIPT, "Premium Deep-Dive Generation", retries=3, timeout=1200)

    # 3. Sentiment Tracking
    if distill_success:
        run_script(SOCIAL_SENTIMENT_SCRIPT, "Social Sentiment Analysis", retries=3, timeout=1200)
        run_script(SENTIMENT_TRACKER_SCRIPT, "Sentiment Tracking", retries=3)
        # 3.1 Sentiment-Based Alerting
        run_script(ALERT_SYSTEM_SCRIPT, "Sentiment-Based Alerting", retries=3)

    # 4. Synthesis
    if distill_success:
        synthesize_success = run_script(SYNTHESIZE_SCRIPT, "Daily Brief Synthesis", retries=3)
        
        # 4.1 Newsletter Assembly
        run_script(NEWSLETTER_GENERATOR_SCRIPT, "Daily Newsletter Assembly", retries=3)
        
        # 4.2 Viral Insight Generation
        run_script(VIRAL_INSIGHT_GENERATOR_SCRIPT, "Viral Insight Generation", retries=3)

        # 4.2.1 Community Pulse Report
        run_script(COMMUNITY_REPORT_SCRIPT, "Community Pulse Report Generation", retries=3)

        # 4.2.2 SEO Blog Generation
        run_script(SEO_BLOG_GENERATOR_SCRIPT, "SEO Blog Generation", retries=3)

        # 4.2.2 Social Media Posting
        run_script(SOCIAL_POSTING_SCRIPT, "Social Media Posting", retries=3)

        # 4.3 User Interest Analysis & Lead Scoring
        run_script(USER_ANALYSIS_SCRIPT, "User Interest Analysis", retries=3)

        # 4.4 Personalized Outreach Hook Generation
        run_script(GENERATE_HOOKS_SCRIPT, "Outreach Hook Generation", retries=3)

        if synthesize_success:
            run_script(SEND_NEWSLETTER_SCRIPT, "Newsletter Delivery (Mock)", retries=1)
    else:
        logging.warning("Distillation failed. Skipping Synthesis.")
    
    logging.info("--- NichePulse Intelligence Pipeline Finished ---")

if __name__ == "__main__":
    main()
