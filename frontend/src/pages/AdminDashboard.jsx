import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Users, TrendingUp, Zap, PieChart, Activity, RefreshCw, Share2, Award, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_BASE = `/api`

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE}/admin/stats`)
      setStats(res.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching admin stats:', err)
      setError('Failed to fetch KPI metrics. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <h1 className="text-xl font-display font-bold">Admin <span className="text-violet-600">KPI Dashboard</span></h1>
          </div>
          <button 
            onClick={fetchStats}
            className="flex items-center space-x-2 px-3 py-1.5 bg-violet-50 text-violet-600 hover:bg-blue-100 rounded-lg text-sm font-display font-bold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-violet-50 rounded-lg">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                  <span className="text-[10px] font-display font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">All Time</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Subscribers</h3>
                <div className="text-3xl font-display font-bold mt-1">{stats.totalSubscribers}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-[10px] font-display font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full uppercase">Last 7 Days</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">New Signups</h3>
                <div className="text-3xl font-display font-bold mt-1">+{stats.subscriberGrowth}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <PieChart className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-display font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Estimate</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Premium Conversion</h3>
                <div className="text-3xl font-display font-bold mt-1">{stats.premiumConversion}%</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-display font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">Pipeline</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Intelligence Velocity</h3>
                <div className="text-3xl font-display font-bold mt-1">
                  {stats.intelligenceVolume.totalSignals > 0 
                    ? ((stats.intelligenceVolume.totalStories / stats.intelligenceVolume.totalSignals) * 100).toFixed(1) 
                    : 0}%
                </div>
              </div>
            </div>

            {/* Detailed Pipeline Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-display font-bold flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-violet-600" />
                    Pipeline Volume Metrics
                  </h3>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Raw Signals</div>
                      <div className="text-4xl font-display font-black text-gray-800">{stats.intelligenceVolume.totalSignals}</div>
                    </div>
                    <ArrowLeft className="w-6 h-6 text-gray-200 rotate-180" />
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">AI Stories</div>
                      <div className="text-4xl font-display font-black text-violet-600">{stats.intelligenceVolume.totalStories}</div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex justify-between text-xs font-display font-bold uppercase tracking-tighter mb-2">
                      <span className="text-gray-400">Signal-to-Story Distillation Rate</span>
                      <span className="text-violet-600">
                        {stats.intelligenceVolume.totalSignals > 0 
                          ? ((stats.intelligenceVolume.totalStories / stats.intelligenceVolume.totalSignals) * 100).toFixed(1) 
                          : 0}% efficiency
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-violet-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${stats.intelligenceVolume.totalSignals > 0 ? (stats.intelligenceVolume.totalStories / stats.intelligenceVolume.totalSignals) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Traffic & Audience */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-display font-bold flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-violet-600" />
                  Audience & Traffic (Last 24h)
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-violet-50 rounded-2xl border border-blue-100">
                    <div className="text-xs font-display font-bold text-blue-400 uppercase tracking-widest mb-1">Visitors</div>
                    <div className="text-2xl font-display font-black text-blue-900">{stats.userActivity.dailyVisitors || 0}</div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="text-xs font-display font-bold text-indigo-400 uppercase tracking-widest mb-1">Page Views</div>
                    <div className="text-2xl font-display font-black text-indigo-900">{stats.userActivity.dailyViews || 0}</div>
                  </div>
                </div>
                
                <div className="text-sm font-display font-bold text-gray-400 uppercase tracking-widest mb-4">Top Traffic Sources</div>
                <div className="space-y-3">
                  {stats.userActivity.topTrafficSources && stats.userActivity.topTrafficSources.length > 0 ? (
                    stats.userActivity.topTrafficSources.map((s, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">{s.source}</span>
                        <span className="font-display font-bold text-gray-900">{s.count} hits</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic">No traffic sources logged yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Scoring */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-display font-bold flex items-center">
                  <Users className="w-4 h-4 mr-2 text-amber-600" />
                  High-Potential Leads
                </h3>
                <span className="text-[10px] font-display font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">AI-Ranked</span>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {stats.userActivity.highPotentialLeads && stats.userActivity.highPotentialLeads.length > 0 ? (
                    stats.userActivity.highPotentialLeads.map((lead, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-gray-500">{lead.user_id}</span>
                          <span className="text-sm font-display font-bold text-gray-800">{lead.niche}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-display font-black text-amber-600">{lead.score}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-display font-bold">Signal Score</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 italic text-sm">No high-potential leads identified yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* User Interest Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-display font-bold flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-red-500" />
                  User Interest Activity
                </h3>
              </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {Object.keys(stats.userActivity.sectorInterests).length > 0 ? (
                      Object.entries(stats.userActivity.sectorInterests)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([sector, count]) => (
                          <div key={sector}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-display font-bold text-gray-700">{sector}</span>
                              <span className="text-gray-500 font-medium">{count} users</span>
                            </div>
                            <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-violet-500 h-full rounded-full"
                                style={{ width: `${stats.totalSubscribers > 0 ? (count / stats.totalSubscribers) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 font-medium italic">
                        No user activity data available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Growth & Virality */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-display font-bold flex items-center">
                  <Share2 className="w-4 h-4 mr-2 text-cyan-600" />
                  Growth & Virality Analytics
                </h3>
                <div className="text-xs font-display font-bold text-cyan-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                  Referral Program Live
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Referrals</div>
                    <div className="text-4xl font-display font-black text-gray-800">{stats.growthMetrics.totalReferrals}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Conversion Rate</div>
                    <div className="text-4xl font-display font-black text-cyan-600">{stats.growthMetrics.referralConversionRate}%</div>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Percent of users who joined via referral</p>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-display font-bold text-gray-400 uppercase tracking-widest flex items-center">
                      <Award className="w-4 h-4 mr-2 text-amber-500" />
                      Top Growth Champions
                    </div>
                    <Link 
                      to="/launch-assets" 
                      className="text-xs font-display font-bold text-violet-600 hover:text-violet-700 flex items-center bg-violet-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Social Snippets
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {stats.growthMetrics.topReferrers.length > 0 ? (
                      stats.growthMetrics.topReferrers.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-display font-bold text-violet-600 shadow-sm">
                              #{i + 1}
                            </div>
                            <span className="font-mono text-sm text-gray-600">{r.email}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-display font-black text-gray-900">{r.count}</span>
                            <span className="text-[10px] text-gray-400 ml-1 uppercase font-display font-bold">Referrals</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 font-medium italic">
                        No referrals recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 font-medium pb-8">
              Confidential Business Intelligence Dashboard • © 2026 NichePulse
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default AdminDashboard
