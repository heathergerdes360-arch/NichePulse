const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');
const { query, escape } = require('./db');

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

if (!stripe) {
  console.warn('WARNING: STRIPE_SECRET_KEY not set — Stripe checkout will use static payment link fallback');
}

// --- Magic Auth ---
const { Magic } = require('@magic-sdk/admin');
const magic = process.env.MAGIC_SECRET_KEY 
  ? new Magic(process.env.MAGIC_SECRET_KEY) 
  : null;

if (!magic) {
  console.warn('WARNING: MAGIC_SECRET_KEY not set — Magic Auth will return 500 on requireAuth endpoints');
}

// Magic Auth Middleware — verifies DID tokens via Magic SDK
const requireAuth = async (req, res, next) => {
  if (!magic) {
    return res.status(500).json({ error: 'Authentication not configured' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  try {
    const metadata = await magic.users.getMetadataByToken(token);
    if (!metadata.email) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    req.userEmail = metadata.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

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

// --- Premium Authorization Middleware ---
const requirePremium = async (req, res, next) => {
  const email = req.query.email || req.body?.email;
  if (!email) {
    return res.status(401).json({ error: 'Email parameter required for premium access' });
  }
  try {
    const subscribers = await query(`SELECT is_premium FROM subscribers WHERE email = ${escape(email)}`);
    if (subscribers.length === 0 || !subscribers[0].is_premium) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify premium status' });
  }
};

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// GET /api/auth/me — Get current user from Magic DID token
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const subscriber = await query(`SELECT * FROM subscribers WHERE email = ${escape(req.userEmail)}`);
    res.json({
      authenticated: true,
      email: req.userEmail,
      user: subscriber.length > 0 ? {
        email: subscriber[0].email,
        isPremium: !!subscriber[0].is_premium,
        subscriptionTier: subscriber[0].subscription_tier,
        referralCode: subscriber[0].referral_code,
        interestedSectors: subscriber[0].interested_sectors
      } : { email: req.userEmail }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
app.get(['/api/stories/export', '/api/export-stories'], requireAuth, async (req, res) => {
  console.log('Export endpoint hit!');
  const { category, start_date, end_date } = req.query;
  const email = req.userEmail;

  try {
    // Check if user is premium
    const subscriber = await query(`SELECT is_premium FROM subscribers WHERE email = ${escape(email)}`);
    if (subscriber.length === 0 || !subscriber[0].is_premium) {
      return res.status(403).json({ error: 'Premium subscription required for data export' });
    }

    // Build the query with filters
    let sql = "SELECT title, summary, sentiment, sentiment_score, importance_score, category, created_at FROM stories WHERE 1=1";
    if (category) {
      sql += ` AND category = ${escape(category)}`;
    }
    if (start_date) {
      sql += ` AND created_at >= ${escape(start_date)}`;
    }
    if (end_date) {
      sql += ` AND created_at <= ${escape(end_date)}`;
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
    const story = await query(`SELECT * FROM stories WHERE id = ${escape(req.params.id)}`);
    if (story.length === 0) return res.status(404).json({ error: 'Story not found' });
    res.json(story[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Subscribers ---
app.get('/api/subscribers/me', requireAuth, async (req, res) => {
  try {
    const subscriber = await query(`SELECT * FROM subscribers WHERE email = ${escape(req.userEmail)}`);
    if (subscriber.length === 0) return res.status(404).json({ error: 'Subscriber not found' });
    res.json(subscriber[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/subscribers/me', requireAuth, async (req, res) => {
  const { interested_sectors, sentiment_alerts } = req.body;
  try {
    let updates = [];
    if (interested_sectors) updates.push(`interested_sectors = ${escape(JSON.stringify(interested_sectors))}`);
    if (sentiment_alerts !== undefined) updates.push(`sentiment_alerts = ${sentiment_alerts ? 1 : 0}`);
    
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    await query(`UPDATE subscribers SET ${updates.join(', ')} WHERE email = ${escape(req.userEmail)}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subscribers/me/referrals', requireAuth, async (req, res) => {
  try {
    const subscriber = await query(`SELECT referral_code FROM subscribers WHERE email = ${escape(req.userEmail)}`);
    if (subscriber.length === 0) return res.status(404).json({ error: 'Subscriber not found' });
    
    const code = subscriber[0].referral_code;
    const referrals = await query(`SELECT email, created_at FROM subscribers WHERE referred_by = ${escape(code)}`);
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
    // Generate a unique referral code for the new subscriber
    const referralCode = crypto.randomBytes(4).toString('hex');
    const sectorsJson = JSON.stringify(sectors || []);
    
    // Only use referredBy if it's truthy and doesn't look like 'null' or 'undefined'
    const validReferral = referredBy && referredBy !== 'null' && referredBy !== 'undefined' 
      ? escape(referredBy) 
      : 'NULL';
    
    const subscriberId = crypto.randomUUID();
    await query(`INSERT INTO subscribers (id, email, interested_sectors, referred_by, referral_code) VALUES (${escape(subscriberId)}, ${escape(email)}, ${escape(sectorsJson)}, ${validReferral}, ${escape(referralCode)})`);
    
    // If referred by someone, log the referral
    if (validReferral !== 'NULL') {
      await query(`INSERT INTO referrals (referrer_email, referred_email, status) VALUES (${escape(referredBy)}, ${escape(email)}, 'pending')`);
    }
    
    res.status(201).json({ message: 'Subscribed successfully', referralCode });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }
    if (err.message.includes('no such table')) {
      // referrals table might not exist in older schemas
      console.warn('Referrals table not found, skipping referral logging:', err.message);
      return res.status(201).json({ message: 'Subscribed successfully', referralCode });
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
    await query(`INSERT INTO traffic_logs (path, referrer, utm_source, user_agent, ip_hash) VALUES (${escape(path)}, ${escape(referrer)}, ${escape(utm_source)}, ${escape(userAgent)}, ${escape(ipHash)})`);
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
// POST /api/create-checkout-session — Creates a Stripe Checkout Session (or falls back to static link)
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  const { plan } = req.body;
  const email = req.userEmail;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const successUrl = process.env.STRIPE_SUCCESS_URL || 'https://nichepulse.ai/dashboard';
  const cancelUrl = process.env.STRIPE_CANCEL_URL || 'https://nichepulse.ai/pricing';
  const priceId = plan === 'annual' 
    ? (process.env.STRIPE_ANNUAL_PRICE_ID || process.env.STRIPE_PRICE_ID)
    : process.env.STRIPE_PRICE_ID;

  if (stripe && priceId) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: email,
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: { email, plan: plan || 'monthly' },
      });
      return res.json({ url: session.url, sessionId: session.id, plan: plan || 'monthly' });
    } catch (err) {
      console.error('Stripe session creation error:', err.message);
      // Fall back to static link on error
    }
  }

  // Fallback: static payment link with prefilled email
  const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(email)}`;
  res.json({ url: paymentUrl, plan: plan || 'monthly' });
});

// POST /api/stripe-webhook — Handles Stripe webhook events
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(200).json({ received: true, note: 'Webhook not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const email = session.metadata?.email || session.customer_email;
      if (email) {
        try {
          await query(`UPDATE subscribers SET is_premium = 1, subscription_tier = ${escape(session.metadata?.plan || 'monthly')}, premium_expires_at = datetime('now', '+1 month') WHERE email = ${escape(email)}`);
          console.log(`Premium activated for ${email} via webhook`);

          // Check if this user was referred by someone
          const subscriber = await query(`SELECT referred_by FROM subscribers WHERE email = ${escape(email)}`);
          if (subscriber.length > 0 && subscriber[0].referred_by) {
            await query(`UPDATE referrals SET status = 'converted', converted_at = datetime('now') WHERE referred_email = ${escape(email)} AND status = 'pending'`);
          }
        } catch (dbErr) {
          console.error('Webhook DB update error:', dbErr.message);
        }
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      try {
        // Get email from subscription metadata first, then fall back to customer lookup
        let subscriberEmail = subscription.metadata?.email;

        if (!subscriberEmail && subscription.customer) {
          const customer = await stripe.customers.retrieve(subscription.customer);
          subscriberEmail = customer.email;
        }

        if (subscriberEmail) {
          if (event.type === 'customer.subscription.deleted' || subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
            await query(`UPDATE subscribers SET is_premium = 0, premium_expires_at = datetime('now') WHERE email = ${escape(subscriberEmail)}`);
            console.log(`Premium deactivated for ${subscriberEmail} via webhook (${event.type}, status=${subscription.status})`);
          } else if (subscription.status === 'active' || subscription.status === 'trialing') {
            // Map Stripe interval to our plan name
            const interval = subscription.items?.data?.[0]?.plan?.interval || 'month';
            const plan = interval === 'year' ? 'annual' : 'monthly';
            await query(`UPDATE subscribers SET is_premium = 1, subscription_tier = ${escape(plan)}, premium_expires_at = datetime('now', '+1 month') WHERE email = ${escape(subscriberEmail)}`);
            console.log(`Premium reactivated for ${subscriberEmail} via webhook (${event.type}, status=${subscription.status})`);
          }
        } else {
          console.log(`Subscription ${event.type}: no email found for customer ${subscription.customer}`);
        }
      } catch (err) {
        console.error(`Webhook subscription handler error (${event.type}):`, err.message);
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
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
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    // Run queries sequentially to avoid Turso locking errors
    const subscribersCount = await query("SELECT COUNT(*) as count FROM subscribers");
    const growthCount = await query("SELECT COUNT(*) as count FROM subscribers WHERE created_at > datetime('now', '-7 days')");
    const signalsCount = await query("SELECT COUNT(*) as count FROM signals");
    const storiesCount = await query("SELECT COUNT(*) as count FROM stories");
    const referralsCount = await query("SELECT COUNT(*) as count FROM subscribers WHERE referred_by IS NOT NULL");
    const topReferrers = await query("SELECT referred_by, COUNT(*) as count FROM subscribers WHERE referred_by IS NOT NULL GROUP BY referred_by ORDER BY count DESC LIMIT 5");
    const sectorInterests = await query("SELECT interested_sectors FROM subscribers");
    const trafficStats = await query("SELECT COUNT(*) as total_views, COUNT(DISTINCT ip_hash) as unique_visitors FROM traffic_logs WHERE timestamp > datetime('now', '-24 hours')");
    const topTrafficSources = await query("SELECT COALESCE(NULLIF(utm_source, ''), 'Direct') as source, COUNT(*) as count FROM traffic_logs WHERE timestamp > datetime('now', '-7 days') GROUP BY source ORDER BY count DESC LIMIT 5");
    const highPotentialLeads = await query("SELECT user_id, niche, score FROM user_scores WHERE score >= 10 ORDER BY score DESC LIMIT 5");
    const premiumCount = await query("SELECT COUNT(*) as count FROM subscribers WHERE is_premium = 1");

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
      // Handle non-email referral codes (like hex codes)
      if (!r.referred_by || !r.referred_by.includes('@')) {
        return { email: r.referred_by || 'unknown', count: r.count };
      }
      const parts = r.referred_by.split('@');
      const masked = parts[0].substring(0, 3) + '...@' + parts[1];
      return { email: masked, count: r.count };
    });

    const totalSubs = subscribersCount[0].count;

    res.json({
      totalSubscribers: totalSubs,
      subscriberGrowth: growthCount[0].count,
      premiumUsers: premiumCount[0].count,
      premiumConversion: totalSubs > 0 ? ((premiumCount[0].count / totalSubs) * 100).toFixed(1) : '0.0',
      intelligenceVolume: {
        totalSignals: signalsCount[0].count,
        totalStories: storiesCount[0].count
      },
      growthMetrics: {
        totalReferrals: referralsCount[0].count,
        referralConversionRate: totalSubs > 0
          ? ((referralsCount[0].count / totalSubs) * 100).toFixed(1)
          : 0,
        topReferrers: formattedTopReferrers
      },
      userActivity: {
        sectorInterests: sectorCounts,
        dailyVisitors: trafficStats[0].unique_visitors,
        dailyViews: trafficStats[0].total_views,
        topTrafficSources: topTrafficSources,
        highPotentialLeads: highPotentialLeads
      }
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
    const newsletters = await query(`SELECT * FROM newsletters WHERE id = ${escape(id)}`);
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
    const blogs = await query(`SELECT * FROM reports WHERE id = ${escape(id)} AND type = 'blog'`);
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
