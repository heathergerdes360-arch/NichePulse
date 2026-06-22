#!/usr/bin/env python3
"""Test single RSS feed ingestion."""
import feedparser, urllib.request, hashlib, subprocess, sys, time, datetime, re

url = "https://hnrss.org/frontpage"
print(f"Fetching {url}...", flush=True)
req = urllib.request.Request(url, headers={"User-Agent": "NichePulse/1.0"})
resp = urllib.request.urlopen(req, timeout=20)
raw = resp.read()
print(f"Read {len(raw)} bytes", flush=True)
parsed = feedparser.parse(raw)
print(f"Entries: {len(parsed.entries)}", flush=True)

count = 0
for e in parsed.entries[:10]:
    title = (e.get("title") or "").strip()
    link = (e.get("link") or "").strip()
    summary = re.sub(r"<[^>]+>", "", (e.get("summary") or e.get("description") or ""))[:200]
    print(f"  [{count}] {title[:60]}", flush=True)
    
    sid = hashlib.sha256(f"hackernews|{link}|{title}".encode()).hexdigest()[:32]
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    esc = lambda s: s.replace("'", "''")
    sql = (
        f"INSERT OR IGNORE INTO signals "
        f"(id, source, title, content, url, timestamp, category) VALUES ("
        f"'{esc(sid)}', 'hackernews', '{esc(title[:200])}', '{esc(summary[:500])}', "
        f"'{esc(link)}', '{esc(ts)}', 'tech'"
        f")"
    )
    
    r = subprocess.run(["team-db", sql], capture_output=True, text=True, timeout=15)
    if r.returncode == 0:
        print(f"    ✅ Inserted", flush=True)
        count += 1
    else:
        err = r.stderr[:100] if r.stderr else str(r.stdout)[:100]
        if "UNIQUE" in err or "already exists" in err:
            print(f"    ⏭️  Duplicate", flush=True)
        else:
            print(f"    ❌ {err}", flush=True)
    time.sleep(0.3)

print(f"\n✅ Test complete: {count} new signals inserted from HN", flush=True)