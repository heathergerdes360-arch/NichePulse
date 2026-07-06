import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { Newspaper, FileText, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Crown, Sparkles, Minus, ArrowRight, Activity, Settings, Check, Link2, Zap, Search, Lightbulb } from 'lucide-react'
import UpgradeModal from '../components/UpgradeModal'
import DeepDiveModal from './components/DeepDiveModal'
import SentimentTrends from './components/SentimentTrends'
import SentimentSnapshot from './components/SentimentSnapshot'
import SignalConnectivity from './components/SignalConnectivity'

const API_BASE = `/api`

function Dashboard() {
  const [activeTab, setActiveTab] = useState('stories')
  const [stories, setStories] = useState([])
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Premium States
  const [isPremium, setIsPremium] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStory, setSelectedStory] = useState(null)
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false)

  const categories = ['AI', 'Climate Tech', 'Biotech', 'SpaceTech', 'DefenseTech', 'Longevity']
  const [selectedSectors, setSelectedSectors] = useState(categories)

  const toggleSector = (sector) => {
    setSelectedSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [storiesRes, reportsRes] = await Promise.all([
          axios.get(`${API_BASE}/stories`),
          axios.get(`${API_BASE}/newsletters`)
        ])
        setStories(storiesRes.data)
        setReports(reportsRes.data)
        if (reportsRes.data.length > 0) {
          setSelectedReport(reportsRes.data[0])
        }

        // Fetch user premium status
        const email = localStorage.getItem('nichepulse_email')
        if (email) {
          try {
            const subRes = await axios.get(`${API_BASE}/subscribers/${encodeURIComponent(email)}`)
            setIsPremium(!!subRes.data.is_premium)
          } catch (err) {
            console.error('Error fetching subscriber status:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to fetch data from backend. Please ensure the backend server is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleUpgrade = async () => {
    const email = localStorage.getItem('nichepulse_email');
    if (!email) {
      alert("Please sign in to upgrade.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/create-checkout-session`, { email });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      alert("Failed to start checkout. Please try again.");
    }
  };

  const storiesByCategory = categories.reduce((acc, cat) => {
    acc[cat] = stories.filter(s => s.category?.toLowerCase() === cat.toLowerCase())
    return acc
  }, {})

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100 ring-1 ring-green-200'
      case 'negative': return 'text-red-600 bg-red-100 ring-1 ring-red-200'
      default: return 'text-gray-600 bg-gray-100 ring-1 ring-gray-200'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return <TrendingUp className="w-3.5 h-3.5 mr-1" />
      case 'negative': return <TrendingDown className="w-3.5 h-3.5 mr-1" />
      default: return <Minus className="w-3.5 h-3.5 mr-1" />
    }
  }

  // Signal Strength Bar — 5 segments matching social template visual
  const SignalStrengthBar = ({ score, size = 'sm' }) => {
    const filled = Math.min(5, Math.max(0, Math.round(score / 2)))
    const segmentSize = size === 'sm' ? 'w-3 h-1.5' : 'w-4 h-2'
    return (
      <div className="flex items-center space-x-0.5" title={`Signal Strength: ${score}/10`}>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`${segmentSize} rounded-sm transition-all duration-300 ${
              i < filled
                ? i >= 3 ? 'bg-violet-500' : i >= 2 ? 'bg-violet-600' : 'bg-violet-700'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  // Parse cross-sector links from story data (JSON string or array)
  const getCrossSectorLinks = (story) => {
    if (!story.cross_sector_links) return null
    try {
      const parsed = typeof story.cross_sector_links === 'string'
        ? JSON.parse(story.cross_sector_links)
        : story.cross_sector_links
      return Array.isArray(parsed) ? parsed : null
    } catch {
      // If it's a plain string (comma-separated sectors), split it
      return story.cross_sector_links.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  const handleDeepDive = (story) => {
    if (!isPremium) {
      setIsModalOpen(true)
    } else {
      setSelectedStory(story)
      setIsDeepDiveOpen(true)
    }
  }

  const exportData = (type, report) => {
    if (!isPremium) {
      setIsModalOpen(true)
      return
    }
    
    let content = ''
    let filename = `NichePulse_${report.date.replace(/ /g, '_')}_${report.type}`
    let mimeType = ''

    if (type === 'json') {
      content = JSON.stringify(report, null, 2)
      filename += '.json'
      mimeType = 'application/json'
    } else if (type === 'csv') {
      // Very simple mock CSV
      content = 'Date,Type,Content\n'
      content += `"${report.date}","${report.type}","${report.content.replace(/"/g, '""')}"`
      filename += '.csv'
      mimeType = 'text/csv'
    } else {
      // Mock PDF (just a text file for now as requested)
      content = `NICHEPULSE INTELLIGENCE REPORT\nDate: ${report.date}\nType: ${report.type.toUpperCase()}\n\n${report.content}`
      filename += '.pdf'
      mimeType = 'application/pdf'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-violet-600 p-1.5 rounded-lg">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-display font-bold tracking-tight">Niche<span className="text-violet-600">Pulse</span></span>
              {isPremium && (
                <span className="flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-display font-black uppercase rounded-full shadow-sm ring-1 ring-amber-600/20 animate-in zoom-in slide-in-from-left-2">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Premium</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link
              to="/archive"
              className="hidden md:flex items-center space-x-1 text-gray-500 hover:text-violet-600 transition-colors"
            >
              <Newspaper className="w-4 h-4" />
              <span className="text-sm font-display font-bold">Explore the Archive</span>
            </Link>
            <Link
              to="/archive"
              className="md:hidden p-2 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-full transition-all"
              title="Intelligence Archive"
            >
              <Newspaper className="w-5 h-5" />
            </Link>
            <Link
              to="/settings"
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-full transition-all"
              title="Account Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            {!isPremium ? (
              <button 
                onClick={handleUpgrade}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-violet-600 text-violet-600 hover:bg-violet-50 font-display font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Premium</span>
              </button>
            ) : (
              <div className="text-sm font-display font-bold text-violet-600 flex items-center space-x-1 bg-violet-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <Crown className="w-4 h-4" />
                <span>Premium Account</span>
              </div>
            )}
            <div className="hidden md:block text-sm font-medium text-gray-500">
              Intelligence Distilled.
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
              activeTab === 'stories'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Daily Intelligence</span>
          </button>
          <button
            onClick={() => {
              if (!isPremium) {
                setIsModalOpen(true)
              } else {
                setActiveTab('trends')
              }
            }}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-display font-bold transition-all relative group ${
              activeTab === 'trends'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sentiment Trends</span>
            {!isPremium && <Crown className="w-3 h-3 text-amber-400" />}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle className="mr-2 w-5 h-5" />
            {error}
          </div>
        ) : activeTab === 'trends' ? (
          <SentimentTrends />
        ) : (
          <div className="space-y-8">
            {/* Premium Banner (shown to non-premium) */}
            {!isPremium && (
              <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-8 mb-4 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Crown className="w-48 h-48 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0 lg:space-x-8">
                  <div className="space-y-3 text-center lg:text-left">
                    <h2 className="text-3xl font-display font-black flex items-center justify-center lg:justify-start tracking-tight">
                      <Sparkles className="mr-3 w-8 h-8 text-yellow-300 animate-pulse" />
                      Get the Full Intelligence Edge
                    </h2>
                    <p className="text-blue-100 text-lg max-w-2xl font-medium">
                      Unlock technical deep-dives, cross-sector signal connections, real-time sentiment alerts, and professional data exports. 
                      Join the top 1% of founders and investors who move faster with NichePulse Premium.
                    </p>
                  </div>
                  <button 
                    onClick={handleUpgrade}
                    className="px-10 py-4 bg-white text-violet-600 font-display font-black text-lg rounded-2xl shadow-2xl hover:bg-violet-50 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap flex items-center space-x-2 ring-4 ring-white/20"
                  >
                    <span>Upgrade for $29/mo</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* INTELLIGENCE LAYERS — Premium feature teaser/showcase section  */}
            {/* ============================================================ */}
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-violet-500 to-cyan-500 p-2 rounded-xl shadow-sm">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-gray-900">Intelligence Layers</h2>
                    <p className="text-xs text-gray-500 font-medium">Premium AI-powered analysis, beyond the headlines</p>
                  </div>
                </div>
                {isPremium && (
                  <div className="flex items-center space-x-1 text-[10px] font-display font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <Sparkles className="w-3 h-3" />
                    <span>ALL LAYERS ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Intelligence Layers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- LAYER 1: Signal Connectivity --- */}
                {isPremium ? (
                  <div className="lg:col-span-2">
                    <SignalConnectivity />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="bg-gradient-to-r from-violet-600/5 to-indigo-500/5 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-violet-500 to-cyan-500 p-2 rounded-xl shadow-sm opacity-50">
                          <Link2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-display font-black text-gray-900 flex items-center">
                            Signal Connectivity
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            AI-powered cross-sector intelligence
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center space-x-4 opacity-30">
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                              <Cpu className="w-6 h-6 text-violet-400" />
                            </div>
                            <ArrowRight className="w-6 h-6 text-gray-300" />
                            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                              <Beaker className="w-6 h-6 text-cyan-400" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-display font-bold text-gray-500">
                              See the hidden connections between industries
                            </p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                              AI identifies non-obvious links between disparate sectors — like how AI regulation reshapes Biotech trial protocols.
                            </p>
                          </div>
                          <button 
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-display font-bold text-sm rounded-xl hover:shadow-lg hover:from-violet-700 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Unlock with Premium</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- LAYER 2: Premium Deep Dive --- */}
                <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 ${isPremium ? '' : ''}`}>
                  <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl shadow-sm ${isPremium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-amber-400/50 to-orange-500/50'}`}>
                        <Search className={`w-5 h-5 ${isPremium ? 'text-white' : 'text-amber-300'}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-display font-black text-gray-900 flex items-center">
                          Premium Deep Dives
                          {isPremium && (
                            <span className="ml-2 text-[9px] font-display font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                              LIVE
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          Technical insight extraction & strategic impact analysis
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {isPremium ? (
                      <div className="space-y-4">
                        {/* Live Deep Dive Content */}
                        <div className="flex items-center space-x-3 p-4 bg-amber-50/80 rounded-xl border border-amber-100">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <div>
                            <p className="text-sm font-display font-bold text-gray-900">Active — Click any story to analyze</p>
                            <p className="text-xs text-gray-500 mt-0.5">Technical breakdown, strategic impact, and actionable takeaways</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Technical Extraction</div>
                            <div className="text-xs font-display font-bold text-gray-800">Deep technical analysis of every signal</div>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Strategic Impact</div>
                            <div className="text-xs font-display font-bold text-gray-800">Market positioning & competitive implications</div>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Actionable Takeaways</div>
                            <div className="text-xs font-display font-bold text-gray-800">Concrete next steps for decision-makers</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 italic flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Deep Dive modal opens when you click any story's "Deep Dive" button</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center space-y-4">
                          <div className="p-3 bg-amber-100/50 rounded-2xl inline-block mx-auto">
                            <Search className="w-8 h-8 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-display font-bold text-gray-500">
                              Go beyond the headline
                            </p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                              Get AI-powered deep dives with technical insight extraction, strategic impact analysis, and actionable takeaways for every signal.
                            </p>
                          </div>
                          <button 
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display font-bold text-sm rounded-xl hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 active:scale-95"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Unlock with Premium</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Sentiment Snapshot */}
            {isPremium && <SentimentSnapshot />}

            {/* Stories + Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
              {/* Left Column: Stories */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold flex items-center">
                    <Newspaper className="mr-2 w-5 h-5 text-violet-600" />
                    Latest Industry Stories
                  </h2>
                  {isPremium && (
                    <div className="text-xs font-display font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      Showing Premium Insights
                    </div>
                  )}
                </div>

                {/* Quick Sector Filter */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-4 bg-violet-600 rounded-full"></div>
                    <span className="text-[10px] font-display font-black text-gray-500 uppercase tracking-wider">Industry Focus</span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox"
                            checked={selectedSectors.includes(cat)}
                            onChange={() => toggleSector(cat)}
                            className="peer appearance-none w-5 h-5 rounded-md border-2 border-gray-200 checked:border-violet-600 checked:bg-violet-600 transition-all cursor-pointer"
                          />
                          <Check className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity ${selectedSectors.includes(cat) ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <span className={`text-sm font-display font-bold transition-colors ${selectedSectors.includes(cat) ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {categories.filter(cat => selectedSectors.includes(cat)).map(cat => (
                  <div key={cat} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-display font-bold text-gray-400 uppercase tracking-wider">{cat}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {storiesByCategory[cat]?.length > 0 ? (
                        storiesByCategory[cat].map(story => (
                          <div key={story.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            {isPremium && (
                              <div className="absolute top-0 right-0 p-1">
                                <Sparkles className="w-3 h-3 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                            <div className="flex justify-between items-start mb-3">
                              <span className={`text-[10px] uppercase tracking-wider font-display font-black px-2 py-1 rounded flex items-center ${getSentimentColor(story.sentiment)}`}>
                                {getSentimentIcon(story.sentiment)}
                                {story.sentiment}
                              </span>
                              <div className="flex items-center space-x-2">
                              <SignalStrengthBar score={story.importance_score} />
                              <span className="text-[10px] font-display font-bold text-gray-400 tabular-nums">{story.importance_score}/10</span>
                            </div>
                            </div>
                            <h4 className="font-display font-bold text-lg mb-2 leading-tight group-hover:text-violet-600 transition-colors">{story.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-3">
                              {story.summary}
                            </p>
                            {/* Cross-Sector Links — premium feature */}
                            {isPremium && getCrossSectorLinks(story) && getCrossSectorLinks(story).length > 0 && (
                              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                <span className="text-[9px] font-display font-black text-violet-500 uppercase tracking-wider flex items-center">
                                  <Link2 className="w-2.5 h-2.5 mr-0.5" />
                                  Links:
                                </span>
                                {getCrossSectorLinks(story).map((link, idx) => {
                                  const sectorName = typeof link === 'string' ? link : (link.sector || link.name || '')
                                  const sectorColor = typeof link === 'object' && link.color ? link.color : 'violet'
                                  return (
                                    <span
                                      key={idx}
                                      className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded-md border bg-violet-50 text-violet-700 border-violet-200 uppercase tracking-wider"
                                    >
                                      {sectorName}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                              <div className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest">
                                {new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                              <button 
                                onClick={() => handleDeepDive(story)}
                                className={`flex items-center space-x-1 text-xs font-display font-black uppercase tracking-tighter transition-all ${
                                  isPremium 
                                    ? 'text-violet-600 hover:text-violet-700' 
                                    : 'text-gray-400 hover:text-violet-600'
                                }`}
                              >
                                <span>Deep Dive</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-8 text-center text-gray-400 bg-gray-100/50 rounded-xl border border-dashed border-gray-200 font-medium">
                          No {cat} stories yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Reports */}
              <div className="space-y-8">
                <h2 className="text-xl font-display font-bold flex items-center">
                  <FileText className="mr-2 w-5 h-5 text-violet-600" />
                  Daily Briefs
                </h2>

                <div className="space-y-3">
                  {reports.map(report => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedReport?.id === report.id
                          ? 'bg-violet-50 border-blue-200 shadow-sm'
                          : 'bg-white border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-display font-bold">{report.date}</div>
                        {isPremium && <Crown className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 capitalize font-medium">{report.type} Intelligence Report</div>
                    </button>
                  ))}
                </div>

                {selectedReport && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ring-1 ring-black/5">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-display font-bold text-gray-900">Report Content</h3>
                      <div className="flex items-center space-x-3">
                        {isPremium && (
                          <>
                            <button 
                              onClick={() => exportData('csv', selectedReport)}
                              className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest hover:text-violet-600"
                            >
                              CSV
                            </button>
                            <button 
                              onClick={() => exportData('json', selectedReport)}
                              className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest hover:text-violet-600"
                            >
                              JSON
                            </button>
                          </>
                        )}
                        {isPremium && (
                          <button 
                            onClick={() => exportData('pdf', selectedReport)}
                            className="text-[10px] font-display font-bold text-violet-600 uppercase tracking-widest hover:text-violet-700"
                          >
                            Export PDF
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-6 prose prose-sm max-w-none prose-blue overflow-y-auto max-h-[600px] bg-white">
                      <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="bg-gray-100 p-1 rounded">
              <TrendingUp className="text-gray-400 w-4 h-4" />
            </div>
            <span className="font-display font-bold text-gray-900">NichePulse</span>
            <span>&copy; 2026 NichePulse Intelligence. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/admin" className="inline-flex items-center space-x-1 text-gray-300 hover:text-blue-400 transition-colors">
              <Settings className="w-3 h-3" />
              <span className="text-[10px] font-display font-bold uppercase tracking-widest">Admin</span>
            </Link>
          </div>
        </div>
      </footer>

      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUpgrade={() => setIsPremium(true)}
      />

      <DeepDiveModal 
        isOpen={isDeepDiveOpen}
        onClose={() => setIsDeepDiveOpen(false)}
        story={selectedStory}
      />
    </div>
  )
}

export default Dashboard