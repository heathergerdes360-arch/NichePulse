const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { query, escape } = require('./db');

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// --- Hardened CORS ---
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://nichepulse.ai' 
    : ['http://localhost:3000', 'https://nichepulse.ai', /\.ctonew\.app$/],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret']
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Admin Authorization Middleware ---
const adminAuth = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Admin secret required' });
  }
  next();
};

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Health Check ---
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown' },
      ai: { status: 'unknown' }
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  // Check Database
  try {
    await query('SELECT 1');
    health.services.database.status = 'ok';
  } catch (err) {
    health.status = 'error';
    health.services.database.status = 'error';
    health.services.database.message = err.message;
  }

  // Check AI (OpenAI) - basic env check for now
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      health.services.ai.status = 'degraded';
      health.services.ai.message = 'OPENAI_API_KEY not found (using fallback rule-based distillation)';
    } else {
      health.services.ai.status = 'ok';
      health.services.ai.message = 'OPENAI_API_KEY present';
    }
  } catch (err) {
    health.services.ai.status = 'error';
    health.services.ai.message = err.message;
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// --- Signals ---
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await query('SELECT * FROM signals ORDER BY timestamp DESC');
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Stories ---
app.get('/api/stories', async (req, res) => {
  try {
    const stories = await query('SELECT * FROM stories ORDER BY created_at DESC');
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Stories Export (Premium Feature) ---
app.get(['/api/stories/export', '/api/export-stories'], async (req, res) => {
  console.log('Export endpoint hit!');
  const { email, category, start_date, end_date } = req.query;

  if (!email) {
    return res.status(401).json({ error: 'Email parameter is required' });
  }

  try {
    // Check if user is premium
    const subscriber = await query(`SELECT is_premium FROM subscribers WHERE email = '${escape(email)}'`);
    if (subscriber.length === 0 || !subscriber[0].is_premium) {
      return res.status(403).json({ error: 'Premium subscription required for data export' });
    }

    // Build the query with filters
    let sql = "SELECT title, summary, sentiment, sentiment_score, importance_score, category, created_at FROM stories WHERE 1=1";
    if (category) {
      sql += ` AND category = '${escape(category)}'`;
    }
    if (start_date) {
      sql += ` AND created_at >= '${escape(start_date)}'`;
    }
    if (end_date) {
      sql += ` AND created_at <= '${escape(end_date)}'`;
    }
    sql += " ORDER BY created_at DESC";

    const stories = await query(sql);

    // Generate CSV content
    const headers = ['Title', 'Summary', 'Sentiment', 'Sentiment Score', 'Importance Score', 'Category', 'Created At'];
    const csvRows = [headers.join(',')];

    for (const story of stories) {
      const row = [
        `"${(story.title || '').replace(/"/g, '""')}"`,
        `"${(story.summary || '').replace(/"/g, '""')}"`,
        `"${(story.sentiment || '').replace(/"/g, '""')}"`,
        story.sentiment_score,
        story.importance_score,
        `"${(story.category || '').replace(/"/g, '""')}"`,
        `"${(story.created_at || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`nichepulse_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

app.get('/api/stories/:id', async (req, res) => {
  try {
    const story = await query(`SELECT * FROM stories WHERE id = '${escape(req.params.id)}'`);
    if (story.length === 0) return res.status(404).json({ error: 'Story not found' });
    res.json(story[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Subscribers ---
app.get('/api/subscribers/:email', async (req, res) => {
  try {
    const subscriber = await query(`SELECT * FROM subscribers WHERE email = '${escape(req.params.email)}'`);
    if (subscriber.length === 0) return res.status(404).json({ error: 'Subscriber not found' });
    res.json(subscriber[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/subscribers/:email', async (req, res) => {
  const { interested_sectors, sentiment_alerts } = req.body;
  try {
    let updates = [];
    if (interested_sectors) updates.push(`interested_sectors = '${escape(JSON.stringify(interested_sectors))}'`);
    if (sentiment_alerts !== undefined) updates.push(`sentiment_alerts = ${sentiment_alerts ? 1 : 0}`);
    
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    await query(`UPDATE subscribers SET ${updates.join(', ')} WHERE email = '${escape(req.params.email)}'`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subscribers/:email/referrals', async (req, res) => {
  try {
    const subscriber = await query(`SELECT referral_code FROM subscribers WHERE email = '${escape(req.params.email)}'`);
    if (subscriber.length === 0) return res.status(404).json({ error: 'Subscriber not found' });
    
    const code = subscriber[0].referral_code;
    const referrals = await query(`SELECT email, created_at FROM subscribers WHERE referred_by = '${escape(code)}'`);
    res.json({
      count: referrals.length,
      referrals: referrals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscribe', async (req, res) => {
  const { email, sectors, referredBy } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const sectorsJson = JSON.stringify(sectors || []);
    await query(`INSERT INTO subscribers (email, interested_sectors, referred_by) VALUES ('${escape(email)}', '${escape(sectorsJson)}', ${referredBy ? `'${escape(referredBy)}'` : 'NULL'})`);
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics ---
app.post('/api/track', async (req, res) => {
  const { path, referrer, utm_source } = req.body;
  const userAgent = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ipHash = crypto.createHash('md5').update(ip || '').digest('hex');

  try {
    await query(`INSERT INTO traffic_logs (path, referrer, utm_source, user_agent, ip_hash) VALUES ('${escape(path)}', '${escape(referrer)}', '${escape(utm_source)}', '${escape(userAgent)}', '${escape(ipHash)}')`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Tracking error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Sitemap ---
app.get('/sitemap.xml', async (req, res) => {
  try {
    const stories = await query('SELECT id FROM stories');
    const baseUrl = 'https://nichepulse.cto.ai'; // Placeholder
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Static pages
    sitemap += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/archive</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
    
    // Dynamic stories
    stories.forEach(story => {
      sitemap += `  <url><loc>${baseUrl}/archive/${story.id}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    });
    
    sitemap += '</urlset>';
    
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

const { STRIPE_PAYMENT_LINK } = require('./config');

// --- Stripe Integration ---
app.post('/api/create-checkout-session', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Use the real Stripe payment link
  // In a production app, we might append the email as a client_reference_id or metadata
  const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(email)}`;
  res.json({ url: paymentUrl });
});

app.post('/api/confirm-payment', async (req, res) => {
  const { email } = req.body;
  try {
    await query(`UPDATE subscribers SET is_premium = 1 WHERE email = '${escape(email)}'`);
    res.json({ success: true, message: 'User upgraded to Premium' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sentiment History ---
app.get('/api/sentiment/history', async (req, res) => {
  try {
    const history = await query('SELECT sector, avg_sentiment, created_at FROM sentiment_history ORDER BY created_at ASC');
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sentiment/snapshot', async (req, res) => {
  try {
    const snapshot = await query(`
      SELECT sector, avg_sentiment, count, created_at 
      FROM sentiment_history 
      WHERE (sector, created_at) IN (
        SELECT sector, MAX(created_at) 
        FROM sentiment_history 
        GROUP BY sector
      )
    `);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Stats ---
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [
      subscribersCount,
      growthCount,
      signalsCount,
      storiesCount,
      referralsCount,
      topReferrers,
      sectorInterests,
      trafficStats,
      topTrafficSources,
      highPotentialLeads
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM subscribers'),
      query("SELECT COUNT(*) as count FROM subscribers WHERE created_at > datetime('now', '-7 days')"),
      query('SELECT COUNT(*) as count FROM signals'),
      query('SELECT COUNT(*) as count FROM stories'),
      query('SELECT COUNT(*) as count FROM subscribers WHERE referred_by IS NOT NULL'),
      query('SELECT referred_by, COUNT(*) as count FROM subscribers WHERE referred_by IS NOT NULL GROUP BY referred_by ORDER BY count DESC LIMIT 5'),
      query('SELECT interested_sectors FROM subscribers'),
      query("SELECT COUNT(*) as total_views, COUNT(DISTINCT ip_hash) as unique_visitors FROM traffic_logs WHERE timestamp > datetime('now', '-24 hours')"),
      query("SELECT COALESCE(NULLIF(utm_source, ''), 'Direct') as source, COUNT(*) as count FROM traffic_logs WHERE timestamp > datetime('now', '-7 days') GROUP BY source ORDER BY count DESC LIMIT 5"),
      query("SELECT user_id, niche, score FROM user_scores WHERE score >= 10 ORDER BY score DESC LIMIT 5")
    ]);

    const sectorCounts = {};
    sectorInterests.forEach(row => {
      try {
        const sectors = JSON.parse(row.interested_sectors || '[]');
        sectors.forEach(s => {
          sectorCounts[s] = (sectorCounts[s] || 0) + 1;
        });
      } catch (e) {}
    });

    const formattedTopReferrers = topReferrers.map(r => {
      const parts = r.referred_by.split('@');
      const masked = parts[0].substring(0, 3) + '...' + '@' + parts[1];
      return { email: masked, count: r.count };
    });

    res.json({
      totalSubscribers: subscribersCount[0].count,
      subscriberGrowth: growthCount[0].count,
      intelligenceVolume: {
        totalSignals: signalsCount[0].count,
        totalStories: storiesCount[0].count
      },
      growthMetrics: {
        totalReferrals: referralsCount[0].count,
        referralConversionRate: subscribersCount[0].count > 0
          ? ((referralsCount[0].count / subscribersCount[0].count) * 100).toFixed(1)
          : 0,
        topReferrers: formattedTopReferrers
      },
      userActivity: {
        sectorInterests: sectorCounts,
        dailyVisitors: trafficStats[0].unique_visitors,
        dailyViews: trafficStats[0].total_views,
        topTrafficSources: topTrafficSources,
        highPotentialLeads: highPotentialLeads
      },
      premiumConversion: 12.5
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Launch Assets ---
app.get('/api/launch-teaser', async (req, res) => {
  try {
    let assets = await query("SELECT title, content as hook, category, importance FROM signals WHERE category = 'signal_gap' ORDER BY timestamp DESC LIMIT 3");
    if (assets.length < 3) {
      const needed = 3 - assets.length;
      const extra = await query(`SELECT title, summary as hook, category, importance_score as importance FROM stories WHERE category != 'signal_gap' ORDER BY importance_score DESC, created_at DESC LIMIT ${needed}`);
      assets = [...assets, ...extra];
    }
    const formattedAssets = assets.map(asset => {
      const hook = asset.hook.length > 200 ? asset.hook.substring(0, 200) + '...' : asset.hook;
      return {
        title: asset.title,
        hook: `Did you know? ${hook}\\n\\nSee the full brief on NichePulse.`,
        category: asset.category,
        importance: asset.importance
      };
    });
    res.json(formattedAssets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Newsletters ---
app.get('/api/newsletters', async (req, res) => {
  try {
    const newsletters = await query('SELECT id, title, publish_date FROM newsletters ORDER BY publish_date DESC');
    res.json(newsletters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/newsletters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const newsletters = await query(`SELECT * FROM newsletters WHERE id = '${escape(id)}'`);
    if (newsletters.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    res.json(newsletters[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Blog Posts (from reports table, type='blog') ---
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await query("SELECT id, date, metadata FROM reports WHERE type = 'blog' ORDER BY date DESC");
    // Parse metadata to extract titles
    const parsed = blogs.map(b => {
      let title = `Daily Intelligence Brief - ${b.date}`;
      let storyCount = 0;
      try {
        const meta = JSON.parse(b.metadata || '{}');
        if (meta.title) title = meta.title;
        if (meta.story_count) storyCount = meta.story_count;
      } catch (e) {}
      return {
        id: b.id,
        date: b.date,
        title,
        story_count: storyCount
      };
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blogs = await query(`SELECT * FROM reports WHERE id = '${escape(id)}' AND type = 'blog'`);
    if (blogs.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    const blog = blogs[0];
    // Extract title from metadata or date
    let title = `Daily Intelligence Brief - ${blog.date}`;
    try {
      const meta = JSON.parse(blog.metadata || '{}');
      if (meta.title) title = meta.title;
    } catch (e) {}
    
    res.json({
      id: blog.id,
      date: blog.date,
      title,
      content: blog.content,
      metadata: blog.metadata
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
});
