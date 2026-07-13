import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { 
  TrendingUp, CheckCircle, Zap, ArrowRight, Star, Mail, 
  Settings, Crown, Sparkles, Shield, BarChart, Layers, 
  Download, Search, Link2, Activity, Users, Globe, 
  Beaker, Cpu, Rocket, Heart, ShieldCheck, Clock, 
  ChevronRight, Check, AlertCircle, X
} from 'lucide-react'

const STRIPE_URL = 'https://buy.stripe.com/28EbJ1aLx6Qe8vk3FG9Ve00'

function Pro() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('')
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annual'

  const handleUpgrade = () => {
    if (isAuthenticated) {
      window.open(STRIPE_URL, '_blank', 'noopener,noreferrer')
    } else {
      navigate('/login')
    }
  }

  const handleNotify = (e) => {
    e.preventDefault()
    if (email) {
      navigate('/login')
    }
  }

  const sectors = [
    { icon: <Cpu className="w-4 h-4" />, name: 'AI', color: 'text-violet-500', bg: 'bg-violet-100' },
    { icon: <Globe className="w-4 h-4" />, name: 'Climate Tech', color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { icon: <Beaker className="w-4 h-4" />, name: 'Biotech', color: 'text-cyan-500', bg: 'bg-cyan-100' },
    { icon: <Rocket className="w-4 h-4" />, name: 'SpaceTech', color: 'text-amber-500', bg: 'bg-amber-100' },
    { icon: <Shield className="w-4 h-4" />, name: 'DefenseTech', color: 'text-red-500', bg: 'bg-red-100' },
    { icon: <Heart className="w-4 h-4" />, name: 'Longevity', color: 'text-pink-500', bg: 'bg-pink-100' },
  ]

  const premiumFeatures = [
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Deep-Dive Analysis',
      desc: 'Technical breakdowns, strategic impact assessments, and actionable takeaways for every major signal.',
      gradient: 'from-amber-400 to-orange-500',
      highlight: 'Every story, every day'
    },
    {
      icon: <Link2 className="w-6 h-6" />,
      title: 'Signal Connectivity',
      desc: 'AI-identified cross-sector links — see how AI regulation reshapes Biotech or how Climate tech drives Defense R&D.',
      gradient: 'from-violet-500 to-cyan-500',
      highlight: 'Non-obvious intelligence'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Sentiment Tracking',
      desc: 'Real-time community sentiment across all 6 sectors with historical trend charts and market catalyst overlays.',
      gradient: 'from-emerald-400 to-teal-500',
      highlight: 'Bullish/bearish signals'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Data Exports',
      desc: 'Export intelligence reports as CSV, JSON, or PDF. Feed our data into your own models and workflows.',
      gradient: 'from-cyan-400 to-blue-500',
      highlight: 'CSV · JSON · PDF'
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: 'Historical Archive',
      desc: 'Full searchable archive of every daily brief, deep-dive, and signal — dating back to your subscription start.',
      gradient: 'from-purple-400 to-pink-500',
      highlight: 'Search & replay'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Priority Alerts',
      desc: 'Get notified the moment a high-impact signal breaks in your sector. Never miss a funding round or regulatory shift.',
      gradient: 'from-yellow-400 to-amber-500',
      highlight: 'Real-time notifications'
    }
  ]

  const comparisonRows = [
    { feature: 'Daily Sector Briefs', free: true, premium: true },
    { feature: '6 High-Growth Sectors', free: true, premium: true },
    { feature: 'Email Delivery', free: true, premium: true },
    { feature: 'Deep-Dive Analysis', free: false, premium: true },
    { feature: 'Signal Connectivity', free: false, premium: true },
    { feature: 'Sentiment Tracking', free: false, premium: true },
    { feature: 'Data Exports (CSV/JSON/PDF)', free: false, premium: true },
    { feature: 'Full Historical Archive', free: false, premium: true },
    { feature: 'Priority Alerts', free: false, premium: true },
    { feature: 'Cross-Sector Insights', free: false, premium: true },
  ]

  const testimonials = [
    { quote: 'NichePulse saves me 2+ hours of research every morning. The signal connectivity feature alone is worth the subscription.', name: 'Alex K.', role: 'Partner, DeepTech VC', initials: 'AK' },
    { quote: 'I\'ve tried every intelligence platform out there. Nothing comes close to the signal-to-noise ratio NichePulse delivers.', name: 'Dr. Sarah M.', role: 'CSO, Biotech Startup', initials: 'SM' },
    { quote: 'The cross-sector connections are uncanny. Our team spotted a Climate-Defense convergence 3 months before it hit mainstream news.', name: 'James R.', role: 'Director of Strategy, DefenseTech', initials: 'JR' },
  ]

  const stats = [
    { value: '12,000+', label: 'Active Readers', icon: <Users className="w-5 h-5" /> },
    { value: '500+', label: 'Sources Tracked', icon: <Globe className="w-5 h-5" /> },
    { value: '6', label: 'Sectors Covered', icon: <Layers className="w-5 h-5" /> },
    { value: '95%', label: 'Signal Accuracy', icon: <ShieldCheck className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-violet-600 p-1.5 rounded-lg">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">Niche<span className="text-violet-600">Pulse</span></span>
          <span className="ml-2 hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-display font-black uppercase rounded-full shadow-sm">
            <Crown className="w-2.5 h-2.5" />
            <span>Pro</span>
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-sm font-display font-bold text-gray-500 hover:text-violet-600 transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="text-sm font-display font-bold text-gray-500 hover:text-violet-600 transition-colors">
            Dashboard
          </Link>
          <button 
            onClick={handleUpgrade}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-display font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-xl hover:from-violet-700 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade Now</span>
          </button>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 opacity-80"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-200/30 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-full text-xs font-display font-bold uppercase tracking-wider border border-amber-200/50 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>The Intelligence Edge for Decision-Makers</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-gray-900 leading-tight tracking-tight mb-6 max-w-5xl mx-auto">
            Go Beyond the Headline.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500">
              Own the Signal.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
            Deep-dive analysis, cross-sector signal connections, sentiment tracking, and data exports — 
            everything you need to make decisions with conviction.
          </p>

          {/* CTA + Stats row */}
          <div className="flex flex-col items-center space-y-8">
            <button 
              onClick={handleUpgrade}
              className="group inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-display font-black text-xl rounded-2xl shadow-2xl shadow-violet-500/30 hover:shadow-3xl hover:from-violet-700 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95"
            >
              <Crown className="w-6 h-6" />
              <span>Start Premium — $29/mo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-gray-400 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Cancel anytime · No commitments · Instant access</span>
            </p>
          </div>

          {/* Sector badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {sectors.map((s, i) => (
              <div key={i} className={`inline-flex items-center space-x-1.5 px-3 py-1.5 ${s.bg} rounded-full text-xs font-display font-bold ${s.color}`}>
                {s.icon}
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BANNER ===== */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm mb-3 mx-auto">
                  <div className="text-violet-600">{stat.icon}</div>
                </div>
                <p className="text-2xl font-display font-black text-gray-900">{stat.value}</p>
                <p className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-black mb-4">Everything in Premium</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            The features that give founders, investors, and consultants the information advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumFeatures.map((feat, i) => (
            <div key={i} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feat.gradient} shadow-sm mb-4`}>
                <div className="text-white">{feat.icon}</div>
              </div>
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">{feat.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{feat.desc}</p>
              <div className="inline-flex items-center space-x-1 text-[10px] font-display font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{feat.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING COMPARISON ===== */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-400/10 text-amber-400 rounded-full text-xs font-display font-bold uppercase tracking-wider mb-6">
              <Star className="w-3 h-3" />
              <span>Pricing</span>
            </div>
            <h2 className="text-4xl font-display font-black mb-4">Free vs Premium</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start with free daily briefs. Upgrade when you need the full intelligence layer.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-xl text-sm font-display font-bold transition-all ${
                billing === 'monthly' 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-xl text-sm font-display font-bold transition-all ${
                billing === 'annual' 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Annual <span className="text-emerald-400 text-[10px]">Save 20%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-display font-bold mb-2">Free</h3>
              <p className="text-3xl font-display font-black mb-6">$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Daily 5-minute sector briefs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">All 6 sectors covered</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Email delivery every morning</span>
                </li>
              </ul>
              <Link
                to="/"
                className="block w-full py-3 border border-white/20 rounded-xl text-white font-display font-bold hover:bg-white/5 transition-colors text-sm text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Tier */}
            <div className="bg-violet-600/10 border-2 border-violet-500/40 rounded-3xl p-8 relative">
              <div className="absolute -top-3.5 right-8 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-display font-bold rounded-full shadow-lg flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>BEST VALUE</span>
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Premium</h3>
              <p className="text-3xl font-display font-black mb-2">
                {billing === 'monthly' ? '$29' : '$23'}
                <span className="text-sm font-normal text-gray-400">
                  /mo
                </span>
              </p>
              {billing === 'annual' && (
                <p className="text-emerald-400 text-xs font-display font-bold mb-6">Billed annually ($276/yr)</p>
              )}
              {billing === 'monthly' && <div className="mb-6"></div>}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Deep-Dive Analysis on every story</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Cross-sector Signal Connectivity</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Real-time Sentiment Tracking</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Data Exports (CSV, JSON, PDF)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Full Historical Archive</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">Priority Alerts &amp; Notifications</span>
                </li>
              </ul>
              <button
                onClick={handleUpgrade}
                className="block w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-display font-bold rounded-xl transition-all text-sm text-center shadow-xl shadow-violet-500/25 hover:shadow-2xl transform hover:scale-[1.02] active:scale-95"
              >
                {billing === 'monthly' ? 'Subscribe — $29/mo' : 'Subscribe — $23/mo'}
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-lg font-display font-bold text-center mb-6 text-gray-300">Detailed Comparison</h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {comparisonRows.map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-6 py-4 ${i % 2 === 0 ? 'bg-white/5' : ''} ${!row.free ? 'border-l-2 border-violet-500/50' : ''}`}>
                  <span className={`text-sm font-display font-bold ${row.free ? 'text-gray-300' : 'text-white'}`}>
                    {row.feature}
                    {!row.free && <span className="ml-2 text-[9px] text-violet-400 uppercase tracking-wider">Premium</span>}
                  </span>
                  <div className="flex items-center space-x-8">
                    <span className="text-xs font-display font-bold w-12 text-center">
                      {row.free 
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        : <X className="w-4 h-4 text-gray-500 mx-auto" />
                      }
                    </span>
                    <span className="text-xs font-display font-bold w-12 text-center">
                      {row.premium 
                        ? <CheckCircle className="w-4 h-4 text-violet-400 mx-auto" />
                        : <X className="w-4 h-4 text-gray-500 mx-auto" />
                      }
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-3 bg-violet-600/10 border-t border-violet-500/20">
                <span className="text-xs font-display font-bold text-gray-400"></span>
                <div className="flex items-center space-x-8">
                  <span className="text-xs font-display font-bold text-gray-400 w-12 text-center">Free</span>
                  <span className="text-xs font-display font-bold text-violet-400 w-12 text-center">Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-black mb-4">Trusted by Industry Leaders</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            From VC partners to biotech CSOs — NichePulse is the morning read for decision-makers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all duration-300">
              <div className="flex items-center space-x-1 mb-6">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-display font-black">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-display font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden py-24 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 text-white rounded-full text-xs font-display font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            <span>Your Competition Already Reads It</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-4 leading-tight">
            Ready to Own the Signal?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Join 12,000+ professionals who get their intelligence edge before 7am. 
            Start your premium subscription today.
          </p>
          
          <form onSubmit={handleNotify} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  placeholder="Enter your email..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 outline-none transition-all backdrop-blur-sm"
                />
              </div>
              <button 
                type="submit"
                className="px-8 py-4 bg-white text-violet-600 font-display font-black rounded-xl shadow-2xl hover:bg-violet-50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Get Premium</span>
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-blue-200">
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Cancel anytime</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>No commitment</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Instant access</span>
            </span>
          </div>
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
          <Link to="/" className="text-gray-400 hover:text-violet-600 transition-colors text-xs font-display font-bold uppercase tracking-wider">Home</Link>
          <Link to="/dashboard" className="text-gray-400 hover:text-violet-600 transition-colors text-xs font-display font-bold uppercase tracking-wider">Dashboard</Link>
          <Link to="/archive" className="text-gray-400 hover:text-violet-600 transition-colors text-xs font-display font-bold uppercase tracking-wider">Archive</Link>
          <Link to="/admin" className="inline-flex items-center space-x-1 text-gray-300 hover:text-blue-400 transition-colors">
            <Settings className="w-3 h-3" />
            <span className="text-[10px] font-display font-bold uppercase tracking-widest">Admin</span>
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default Pro