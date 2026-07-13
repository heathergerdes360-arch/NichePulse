import SEO from "../components/SEO";
import { useState, useEffect } from 'react'
import axios from 'axios'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Newspaper, Calendar, ArrowRight, TrendingUp, Search, Share2, Mail, ExternalLink, Download, Crown } from 'lucide-react'

const API_BASE = `/api`

function Archive() {
  const { user, isAuthenticated } = useAuth();
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [referralCode, setReferralCode] = useState(null)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_BASE}/newsletters`)
        setNewsletters(res.data)
      } catch (err) {
        console.error('Error fetching newsletters:', err)
        setError('Failed to fetch the intelligence archive. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchNewsletters()

    // Fetch user referral code and premium status if logged in
    if (isAuthenticated && user?.email) {
      api.get(`/subscribers/me`)
        .then(res => {
          setReferralCode(res.data.referral_code)
          setIsPremium(!!res.data.is_premium)
        })
        .catch(err => console.error('Error fetching subscriber data:', err))
    }
  }, [isAuthenticated, user])

  const handleExportCSV = () => {
    if (isAuthenticated) {
      // The api interceptor will attach the Bearer token
      api.get(`/stories/export`, { responseType: 'blob' })
        .then(res => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const a = document.createElement('a');
          a.href = url;
          a.download = `nichepulse_export_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(err => {
          console.error('Export failed:', err);
          alert('Export requires a premium subscription. Please upgrade.');
        });
    } else {
      alert('Please sign in to export data.');
    }
  };

  const getShareUrl = (newsletterId) => {
    const url = new URL(`${window.location.origin}/archive/${newsletterId}`)
    if (referralCode) {
      url.searchParams.set('ref', referralCode)
    }
    return url.toString()
  }

  const shareOnTwitter = (e, newsletter) => {
    e.preventDefault()
    e.stopPropagation()
    const text = `Check out today's distilled intelligence from NichePulse: ${newsletter.title}`
    const url = getShareUrl(newsletter.id)
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnLinkedin = (e, newsletter) => {
    e.preventDefault()
    e.stopPropagation()
    const url = getShareUrl(newsletter.id)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  const copyLink = (e, newsletterId) => {
    e.preventDefault()
    e.stopPropagation()
    const url = getShareUrl(newsletterId)
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  const filteredNewsletters = newsletters.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <SEO title="Archive" description="Explore the NichePulse intelligence archive." />
      {/* Simple Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-violet-600 p-1.5 rounded-lg group-hover:bg-violet-700 transition-colors">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">Niche<span className="text-violet-600">Pulse</span></span>
          </Link>
          <div className="hidden md:block text-sm font-medium text-gray-500">
            Intelligence Archive
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black mb-4">Intelligence Archive</h1>
          <p className="text-xl text-gray-600">
            Explore past daily briefs and see how market signals have evolved.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search past briefings..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isPremium && (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-6 py-4 bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 font-display font-bold rounded-2xl shadow-sm transition-all whitespace-nowrap"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center shadow-sm">
            <Newspaper className="mr-3 w-6 h-6" />
            {error}
          </div>
        ) : filteredNewsletters.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredNewsletters.map(n => (
              <Link 
                key={n.id} 
                to={`/archive/${n.id}`}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex justify-between items-center"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-violet-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Calendar className="text-violet-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg group-hover:text-violet-600 transition-colors">{n.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(n.publish_date).toLocaleDateString(undefined, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="hidden sm:flex items-center space-x-1 mr-4 border-r border-gray-100 pr-4">
                    <button 
                      onClick={(e) => shareOnTwitter(e, n)}
                      className="p-2 text-gray-400 hover:text-[#1DA1F2] hover:bg-violet-50 rounded-lg transition-all"
                      title="Share on Twitter"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => shareOnLinkedin(e, n)}
                      className="p-2 text-gray-400 hover:text-[#0A66C2] hover:bg-violet-50 rounded-lg transition-all"
                      title="Share on LinkedIn"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => copyLink(e, n.id)}
                      className="p-2 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-lg transition-all"
                      title="Copy Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-full group-hover:bg-violet-50 group-hover:text-violet-600 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Newspaper className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No newsletters match your search.</p>
          </div>
        )}

        <div className="mt-16 bg-violet-600 rounded-3xl p-8 text-center text-white shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold mb-4">Never miss another signal.</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Join 10,000+ professionals who start their day with NichePulse.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center px-8 py-3 bg-white text-violet-600 font-display font-black rounded-xl hover:bg-violet-50 transition-all shadow-lg hover:shadow-xl"
            >
              Get Daily Briefings
            </Link>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12 text-sm text-gray-400 text-center">
        <p>&copy; 2026 NichePulse Intelligence. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Archive
