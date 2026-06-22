#!/usr/bin/env python3
"""
NichePulse — RSS Ingestion Pipeline v3
Fetches, deduplicates, and batches inserts into signals table.
Uses multi-row INSERT to minimize Turso sync contention.
"""
import feedparser, hashlib, json, os, re, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone
from xml.etree import ElementTree

def p(*a, **kw):
    kw.setdefault('flush', True); print(*a, **kw)

UA = "NichePulse/1.0"
TIMEOUT = 20

FEEDS = [
    # Original sector feeds
    ("https://hnrss.org/frontpage", "hackernews", "tech", "news", "HN Frontpage"),
    ("http://export.arxiv.org/rss/cs.AI", "arxiv", "ai", "research", "ArXiv AI"),
    ("http://export.arxiv.org/rss/cs.CL", "arxiv", "ai", "research", "ArXiv NLP"),
    ("http://export.arxiv.org/rss/cs.LG", "arxiv", "ai", "research", "ArXiv ML"),
    ("https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "theverge", "ai", "news", "The Verge AI"),
    ("https://www.technologyreview.com/feed/", "mit_tech_review", "ai", "news", "MIT Tech Review"),
    ("https://openai.com/news/rss.xml", "openai", "ai", "news", "OpenAI News"),
    ("https://www.canarymedia.com/feeds/all", "canary_media", "climate", "news", "Canary Media"),
    ("https://electrek.co/feed/", "electrek", "climate", "news", "Electrek"),
    ("https://www.carbonbrief.org/feed/", "carbon_brief", "climate", "news", "Carbon Brief"),
    ("https://www.statnews.com/feed/", "stat_news", "biotech", "news", "STAT News"),
    ("https://www.fiercebiotech.com/rss.xml", "fierce_biotech", "biotech", "news", "Fierce Biotech"),
    ("https://www.nature.com/nbt.rss", "nature_biotech", "biotech", "research", "Nature Biotech"),
    ("https://techcrunch.com/feed/", "techcrunch", "tech", "news", "TechCrunch"),
    ("https://spacenews.com/feed/", "spacenews", "SpaceTech", "news", "SpaceNews"),
    ("https://www.space.com/feeds/all", "space_com", "SpaceTech", "news", "Space.com"),
    ("https://arstechnica.com/space/feed/", "ars_space", "SpaceTech", "news", "Ars Technica Space"),
    ("https://payloadspace.com/feed/", "payload_space", "SpaceTech", "news", "Payload Space"),
    ("https://www.twz.com/feed", "twz", "DefenseTech", "news", "The War Zone"),
    ("https://longevity.technology/feed/", "longevity_tech", "Longevity", "news", "Longevity Technology"),
    ("https://www.fightaging.org/feed/", "fight_aging", "Longevity", "news", "Fight Aging!"),
    ("https://www.lifespan.io/feed/", "lifespan_io", "Longevity", "news", "Lifespan.io"),
    # Market signal feeds
    ("https://techcrunch.com/tag/funding/feed/", "tc_funding", "tech", "market", "TC Funding"),
    ("https://siliconangle.com/feed/", "siliconangle", "tech", "market", "SiliconAngle"),
    ("https://www.prnewswire.com/rss/news-releases-list.rss", "prnewswire", "tech", "market", "PR Newswire"),
    ("https://www.globenewswire.com/RssFeed/industry/1", "globenewswire", "tech", "market", "GlobeNewswire"),
    ("https://feeds.feedburner.com/ProductHunt", "producthunt", "tech", "market", "Product Hunt"),
    # Social Media / Community Feeds
    ("https://www.reddit.com/r/MachineLearning/.rss", "reddit", "ai", "social", "Reddit MachineLearning"),
    ("https://www.reddit.com/r/biotech/.rss", "reddit", "biotech", "social", "Reddit Biotech"),
    ("https://www.reddit.com/r/longevity/.rss", "reddit", "Longevity", "social", "Reddit Longevity"),
    ("https://www.reddit.com/r/ClimateTech/.rss", "reddit", "climate", "social", "Reddit ClimateTech"),
    ("https://www.reddit.com/r/spacex/.rss", "reddit", "SpaceTech", "social", "Reddit SpaceX"),
]

def esc(s):
    return (s or "").replace("'", "''")

def gen_id(source, url, title):
    return hashlib.sha256(f"{source}|{url}|{title}".encode()).hexdigest()[:32]

def classify(feed_cat, title, summary):
    text = f"{title} {summary}".lower()
    
    # Define keywords with word boundaries to avoid partial matches (e.g., "nad" in "Canada")
    ai_kw = [r"\bai\b", r"artificial intelligence", r"machine learning", r"deep learning", r"neural",
             r"transformer", r"gpt", r"llm", r"large language", r"diffusion", r"openai", r"anthropic", r"gemini", r"llama"]
    cl_kw = [r"climate", r"carbon", r"renewable", r"solar", r"battery", r"electric vehicle", r"ev",
             r"emission", r"greenhouse", r"clean energy", r"sustainable", r"hydrogen", r"wind"]
    bi_kw = [r"biotech", r"clinical trial", r"fda", r"crispr", r"gene therapy", r"antibody",
             r"mrna", r"phase 1", r"phase 2", r"drug discovery", r"genomics", r"therapeutic", r"vaccine"]
    st_kw = [r"launch", r"satellite", r"rocket", r"orbit", r"spacex", r"nasa", r"space station", r"lunar", r"mars", r"starlink"]
    dt_kw = [r"drone", r"missile", r"radar", r"cyber", r"electronic warfare", r"hypersonic", r"stealth", r"c4isr"]
    lo_kw = [r"aging", r"senolytic", r"telomere", r"\bnad\b", r"sirtuin", r"geroscience", r"epigenetic", r"autophagy", r"lifespan"]
    
    categories_kw = {
        "ai": ai_kw,
        "climate": cl_kw,
        "biotech": bi_kw,
        "SpaceTech": st_kw,
        "DefenseTech": dt_kw,
        "Longevity": lo_kw
    }
    
    scores = {}
    for cat, kws in categories_kw.items():
        score = 0
        for kw in kws:
            if re.search(kw, text):
                score += 1
        scores[cat] = score
    
    if feed_cat == "tech":
        # Sort categories by score descending, then return the best one if score > 0
        best_cat = max(scores, key=scores.get)
        if scores[best_cat] > 0:
            return best_cat
            
    return feed_cat

def fetch_feed(url, label):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        resp = urllib.request.urlopen(req, timeout=TIMEOUT)
        raw = resp.read()
        parsed = feedparser.parse(raw)
        if parsed.bozo and not parsed.entries:
            p(f"  ⚠️ {label}: bozo error"); return []
        entries = []
        for entry in parsed.entries[:50]:
            title = (entry.get("title") or "").strip()
            link = (entry.get("link") or "").strip()
            if not title or not link: continue
            summary = re.sub(r"<[^>]+>", "", (entry.get("summary") or entry.get("description") or ""))[:500]
            published = (entry.get("published") or entry.get("updated") or "")
            entries.append(dict(title=title, url=link, summary=summary, published=published))
        p(f"  ✅ {label}: {len(entries)} entries")
        return entries
    except urllib.error.HTTPError as e:
        p(f"  ❌ {label}: HTTP {e.code}"); return []
    except urllib.error.URLError as e:
        p(f"  ❌ {label}: URL error"); return []
    except Exception as e:
        p(f"  ❌ {label}: {type(e).__name__}"); return []

def insert_batch(rows, sig_type="news"):
    """Insert multiple rows in a single team-db call using multi-row VALUES."""
    if not rows: return 0
    meta = f'{{"type":"{sig_type}"}}'
    values = []
    for sid, source, title, content, url, ts, category in rows:
        v = f"('{esc(sid)}','{esc(source)}','{esc(title[:200])}','{esc(content[:500])}','{esc(url)}','{esc(ts)}','{esc(category)}','',0,'{esc(meta)}')"
        values.append(v)
    
    sql = (
        "INSERT OR IGNORE INTO signals "
        "(id, source, title, content, url, timestamp, category, sentiment, importance, metadata) VALUES " +
        ",".join(values)
    )
    
    for attempt in range(3):
        try:
            r = subprocess.run(["team-db", sql], capture_output=True, text=True, timeout=30)
            if r.returncode == 0:
                return len(rows)
            err = r.stderr or r.stdout or ""
            if "UNIQUE" in err or "already exists" in err:
                return insert_single(rows, sig_type)
            
            # Transient/retryable errors
            is_transient = any(x in err for x in ["Locking", "sync engine operation failed", "unable to checkpoint", "database is locked"])
            
            if is_transient:
                p(f"  🔒 Transient DB error (attempt {attempt+1}/3), waiting...")
                time.sleep(2 ** attempt)
                continue
            p(f"  ❌ DB error: {err[:200]}")
            return 0
        except Exception as e:
            p(f"  ❌ DB exception: {e}")
            if attempt < 2: time.sleep(2)
            else: return 0
    return 0

def insert_single(rows, sig_type="news"):
    """Fallback: insert one by one with backoff."""
    count = 0
    meta = f'{{"type":"{sig_type}"}}'
    for row in rows:
        sid, source, title, content, url, ts, category = row
        sql = (
            f"INSERT OR IGNORE INTO signals "
            f"(id, source, title, content, url, timestamp, category, sentiment, importance, metadata) VALUES ("
            f"'{esc(sid)}','{esc(source)}','{esc(title[:200])}','{esc(content[:500])}','{esc(url)}','{esc(ts)}','{esc(category)}','',0,'{esc(meta)}')"
        )
        for attempt in range(3):
            try:
                r = subprocess.run(["team-db", sql], capture_output=True, text=True, timeout=30)
                if r.returncode == 0:
                    count += 1
                    break
                err = r.stderr or r.stdout or ""
                is_transient = any(x in err for x in ["Locking", "sync engine operation failed", "unable to checkpoint", "database is locked"])
                if is_transient:
                    time.sleep(1 * (attempt + 1))
                    continue
                break
            except:
                time.sleep(1)
                continue
    return count

def run():
    p(f"\n{'='*55}")
    p(f"NichePulse RSS Ingestion Pipeline v3")
    p(f"Started: {datetime.now(timezone.utc).isoformat()}")
    p(f"{'='*55}")
    
    total_fetched = 0
    total_inserted = 0
    
    for url, source, category, sig_type, label in FEEDS:
        p(f"\n📡 {label}")
        entries = fetch_feed(url, label)
        if not entries:
            continue
        
        rows = []
        for e in entries:
            sid = gen_id(source, e["url"], e["title"])
            cat = classify(category, e["title"], e["summary"])
            ts = e["published"] or datetime.now(timezone.utc).isoformat()
            rows.append((sid, source, e["title"], e["summary"], e["url"], ts, cat))
            total_fetched += 1
        
        p(f"  💾 Inserting {len(rows)} signals (type: {sig_type})...")
        for i in range(0, len(rows), 10):
            batch = rows[i:i+10]
            ins = insert_batch(batch, sig_type)
            total_inserted += ins
            if ins < len(batch):
                p(f"     Batch {i//10 + 1}: {ins}/{len(batch)} inserted (some duplicates)")
            else:
                p(f"     Batch {i//10 + 1}: {ins} inserted")
            time.sleep(0.3)
    
    p(f"\n{'='*55}")
    p(f"✅ Complete: {total_fetched} fetched, {total_inserted} inserted")
    p(f"{'='*55}")

if __name__ == "__main__":
    run()