import SEO from '../components/SEO';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, CheckCircle, Zap, ArrowRight, ShieldCheck, Star, Mail, AlertCircle, Settings, BarChart, Target, Users, Rocket, Shield, Clock, Layers } from 'lucide-react';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [recentStories, setRecentStories] = useState([]);

  useEffect(() => {
    const fetchRecentStories = async () => {
      try {
        const response = await axios.get(`/api/stories?limit=6`);
        if (response.data && response.data.length > 0) {
          setRecentStories(response.data);
        }
      } catch (err) {
        console.error('Error fetching recent stories:', err);
      }
    };
    fetchRecentStories();
  }, []);

  const refCode = searchParams.get('ref');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Build payload — only include ref if a real referral code exists
      const payload = { email };
      if (refCode) {
        payload.referredBy = refCode;
      }
      const response = await axios.post(`/api/subscribe`, payload);
      localStorage.setItem('nichepulse_email', email);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, name: "AI", desc: "LLMs, agents, policy" },
    { icon: <Rocket className="w-5 h-5 text-violet-500" />, name: "SpaceTech", desc: "Launch, satellites, policy" },
    { icon: <Shield className="w-5 h-5 text-red-500" />, name: "DefenseTech", desc: "Drones, cyber, C4ISR" },
    { icon: <Star className="w-5 h-5 text-green-500" />, name: "Climate Tech", desc: "Carbon, EVs, solar" },
    { icon: <Users className="w-5 h-5 text-purple-500" />, name: "Biotech", desc: "CRISPR, trials, FDA" },
    { icon: <Clock className="w-5 h-5 text-teal-500" />, name: "Longevity", desc: "Geroscience, aging" },
  ];

  const features = [
    { 
      icon: <Zap className="w-6 h-6 text-yellow-500" />, 
      title: "5-Minute Daily Briefs", 
      desc: "Critical news and trends across 6 high-growth sectors. Delivered every morning. No noise, just signal." 
    },
    { 
      icon: <BarChart className="w-6 h-6 text-green-500" />, 
      title: "Market Signal Alerts", 
      desc: "Funding rounds, M&A, FDA approvals, patent grants, and regulatory milestones — flagged in real-time." 
    },
    { 
      icon: <Target className="w-6 h-6 text-purple-500" />, 
      title: "Sector-Specific Focus", 
      desc: "AI, Climate Tech, Biotech, SpaceTech, DefenseTech & Longevity. Tailored intelligence for your domain." 
    }
  ];

  const premiumFeatures = [
    "Deep-Dive Analysis — Full context on every major signal",
    "Sentiment Tracking — Bullish/bearish trends per sector",
    "Historical Data Exports — CSV/JSON for your models",
    "Custom Keyword Alerts — Never miss a company or technology"
  ];

  const socialProof = [
    "Forbes", "TechCrunch", "MIT Tech Review", "Y Combinator"
  ];

  const sampleStories = [
    { category: "AI", title: "DeepSeek V4 Pro Beats GPT-5.5", summary: "New architecture reduces inference cost 60% while surpassing benchmarks on reasoning tasks." },
    { category: "Climate", title: "Next-Gen Carbon Capture", summary: "Iceland DAC pilot achieves record 90% efficiency at $150/ton — below the DOE cost target." },
    { category: "Biotech", title: "CRISPR-Based Cancer Trial", summary: "Phase 1 results show 70% solid tumor response rate. FDA breakthrough designation expected." },
    { category: "SpaceTech", title: "SpaceX Starship Milestone", summary: "First successful orbital refueling demo — unlocks deep space cargo capacity for 2027 missions." },
    { category: "DefenseTech", title: "Hypersonic Defense Test", summary: "DARPA's Glide Breaker intercepts target at Mach 7 — marks shift from concept to deployable." },
    { category: "Longevity", title: "Senolytic Trial Results", summary: "Phase 2a shows 40% reduction in aging biomarkers. Combination therapy targets two pathways." }
  ];

  const handleUpgrade = async () => {
    const storedEmail = localStorage.getItem('nichepulse_email');
    if (storedEmail) {
      try {
        const res = await axios.post(`/api/create-checkout-session`, { email: storedEmail });
        if (res.data.url) {
          window.location.href = res.data.url;
        }
      } catch (err) {
        console.error('Error creating checkout session:', err);
        alert("Failed to start checkout. Please try again.");
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setError("Please sign up for free first to upgrade your account.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-violet-600 p-1.5 rounded-lg">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">Niche<span className="text-violet-600">Pulse</span></span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/archive" className="text-sm font-display font-bold text-gray-600 hover:text-violet-600 transition-colors">
            Archive
          </Link>
          <button onClick={handleUpgrade} className="text-sm font-display font-bold text-violet-600 hover:text-violet-700 transition-colors">
            Premium
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-sm font-display font-bold text-gray-600 hover:text-violet-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-display font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
          </span>
          <span>Intelligence for 6 High-Growth Industries</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-black text-gray-900 leading-tight tracking-tight mb-6 max-w-4xl mx-auto">
          The Daily Brief for <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-600">Founders &amp; Investors</span> Who Need to Know.
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          AI. Climate Tech. Biotech. SpaceTech. DefenseTech. Longevity. <br/>
          We track the signals across 6 sectors so you can make decisions with confidence.
        </p>

        {/* Sector Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {sectors.map((s, i) => (
            <div key={i} className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-200 hover:bg-violet-50 transition-colors">
              {s.icon}
              <span>{s.name}</span>
              <span className="text-gray-400 text-xs hidden sm:inline">· {s.desc}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSignup} className="max-w-md mx-auto relative group">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                placeholder="Enter your email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading || success}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold rounded-2xl shadow-xl shadow-violet-500/20 transition-all flex items-center justify-center space-x-2 whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <>
                  <span>Get Free Access</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {success && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-display font-bold">Successfully subscribed! Redirecting...</span>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-display font-bold">{error}</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4 italic">Join 12,000+ founders, investors, and consultants who start their day with NichePulse.</p>
        </form>
      </header>

      {/* Social Proof — "As featured in" */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest mb-6">Read by professionals at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {socialProof.map((name, i) => (
              <span key={i} className="text-lg font-display font-bold text-gray-600 tracking-tight">{name}</span>
            ))}
            <span className="text-lg font-display font-bold text-gray-500">...</span>
          </div>
        </div>
      </section>

      {/* Featured Stories Section — 6 sectors */}
      <section className="bg-gray-50 border-b border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl font-display font-bold mb-4">Today's Signals Across 6 Sectors</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">This is what your daily brief looks like. Every story is curated, summarized, and categorized — ready to act on.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(recentStories.length > 0 ? recentStories : sampleStories).map((story, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  <span className="text-xs font-display font-bold text-violet-600 uppercase tracking-widest">{story.category}</span>
                </div>
                {story.importance_score && (
                  <span className="text-[10px] font-display font-bold text-gray-400">SCORE: {story.importance_score}/10</span>
                )}
              </div>
              <h3 className="text-lg font-display font-bold mb-2 leading-snug">{story.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{story.summary}</p>
              {story.created_at && (
                <div className="mt-auto pt-4 text-[10px] font-display font-bold text-gray-300 uppercase tracking-widest">
                  {new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold mb-4">How it Works</h2>
          <p className="text-gray-500 max-w-xl mx-auto">From 500+ sources to a 5-minute read. We do the filtering so you don't have to.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-yellow-400/10 text-yellow-400 rounded-full text-xs font-display font-bold uppercase tracking-wider mb-6">
              <Star className="w-3 h-3" />
              <span>Premium</span>
            </div>
            <h2 className="text-4xl font-display font-bold mb-4">Go Deeper. Move Faster.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Free gives you the headlines. Premium gives you the edge — deep-dive analysis, sentiment trends, and data you can export.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-display font-bold mb-2">Free</h3>
              <p className="text-3xl font-display font-black mb-6">$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Daily 5-minute sector briefs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">All 6 sectors covered</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Email delivery every morning</span>
                </li>
              </ul>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full py-3 border border-white/20 rounded-xl text-white font-display font-bold hover:bg-white/5 transition-colors text-sm"
              >
                Get Started
              </button>
            </div>

            {/* Premium Tier */}
            <div className="bg-violet-600/10 border border-violet-500/40 rounded-3xl p-8 relative">
              <div className="absolute -top-3 right-8 px-3 py-1 bg-violet-500 text-white text-xs font-display font-bold rounded-full">
                POPULAR
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Premium</h3>
              <p className="text-3xl font-display font-black mb-6">$29<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-4 mb-8">
                {premiumFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200 text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                className="block w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold rounded-xl transition-all text-sm text-center shadow-lg shadow-violet-500/25"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>

          {/* Premium use case examples */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <p className="text-yellow-400 font-display font-bold text-lg mb-1">$50M+</p>
              <p className="text-gray-400 text-xs">Total funding tracked across our signals in the last week</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <p className="text-green-400 font-display font-bold text-lg mb-1">7</p>
              <p className="text-gray-400 text-xs">FDA regulatory milestones flagged this month</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <p className="text-blue-400 font-display font-bold text-lg mb-1">95%</p>
              <p className="text-gray-400 text-xs">Signal accuracy rate — our AI filters out noise before you see it</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-violet-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-display font-bold mb-4">Your competition already reads it.</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Don't fall behind. Join 12,000+ professionals who get their daily signal brief before 7am.</p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-10 py-5 bg-white text-violet-600 font-display font-black text-lg rounded-2xl shadow-2xl hover:bg-violet-50 transition-colors"
          >
            Get Free Access
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="bg-gray-100 p-1 rounded">
            <TrendingUp className="text-gray-400 w-4 h-4" />
          </div>
          <span className="font-display font-bold text-gray-900">NichePulse</span>
        </div>
        <p>&copy; 2026 NichePulse Intelligence. All rights reserved.</p>
        <div className="mt-4 flex items-center justify-center space-x-6">
          <Link to="/archive" className="text-gray-400 hover:text-violet-600 transition-colors text-xs font-display font-bold uppercase tracking-wider">Explore the Archive</Link>
          <button onClick={handleUpgrade} className="text-gray-400 hover:text-violet-600 transition-colors text-xs font-display font-bold uppercase tracking-wider">Pricing</button>
          <Link to="/admin" className="inline-flex items-center space-x-1 text-gray-300 hover:text-blue-400 transition-colors">
            <Settings className="w-3 h-3" />
            <span className="text-[10px] font-display font-bold uppercase tracking-widest">Admin</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;