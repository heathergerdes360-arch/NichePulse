import SEO from '../components/SEO'
import { useState, useEffect } from 'react'
import axios from 'axios'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useParams, Link } from 'react-router-dom'
import { TrendingUp, ArrowLeft, Calendar, Share2, Mail, ExternalLink } from 'lucide-react'

const API_BASE = `/api`

function ArchiveDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth();
  const [newsletter, setNewsletter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [referralCode, setReferralCode] = useState(null)

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_BASE}/newsletters/${id}`)
        setNewsletter(res.data)
      } catch (err) {
        console.error('Error fetching newsletter:', err)
        setError('The briefing you are looking for could not be found.')
      } finally {
        setLoading(false)
      }
    }
    fetchNewsletter()

    // Fetch user referral code if logged in
    if (isAuthenticated) {
      api.get(`/subscribers/me`)
        .then(res => setReferralCode(res.data.referral_code))
        .catch(err => console.error('Error fetching referral code:', err))
    }
  }, [id, isAuthenticated])

  const getShareUrl = () => {
    const url = new URL(window.location.href)
    if (referralCode) {
      url.searchParams.set('ref', referralCode)
    }
    return url.toString()
  }

  const shareOnTwitter = () => {
    const text = `Check out today's distilled intelligence from NichePulse: ${newsletter.title}`
    const url = getShareUrl()
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnLinkedin = () => {
    const url = getShareUrl()
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error || !newsletter) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-6">
          <Mail className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-4">{error || 'Briefing not found'}</h1>
        <Link to="/archive" className="text-violet-600 font-display font-bold hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Archive
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <SEO 
        title={newsletter ? newsletter.title : 'Newsletter Details'} 
        description={newsletter ? newsletter.summary : 'Intelligence briefing from NichePulse.'} 
      />
      {/* Detail Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/archive" className="text-gray-500 hover:text-violet-600 transition-colors flex items-center font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Archive
          </Link>
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-violet-600 p-1 rounded-lg group-hover:bg-violet-700 transition-colors">
              <TrendingUp className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">Niche<span className="text-violet-600">Pulse</span></span>
          </Link>
          <div className="flex items-center space-x-1">
            <button 
              className="p-2 text-gray-400 hover:text-[#1DA1F2] hover:bg-violet-50 rounded-full transition-all"
              onClick={shareOnTwitter}
              title="Share on Twitter"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-[#0A66C2] hover:bg-violet-50 rounded-full transition-all"
              onClick={shareOnLinkedin}
              title="Share on LinkedIn"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-full transition-all"
              onClick={() => {
                const url = getShareUrl()
                if (navigator.share) {
                  navigator.share({
                    title: newsletter.title,
                    url: url
                  })
                } else {
                  navigator.clipboard.writeText(url)
                  alert('Link copied to clipboard!')
                }
              }}
              title="Copy Link"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          {/* Cover Header */}
          <div className="bg-violet-600 px-8 py-12 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider mb-6">
                <Calendar className="w-3 h-3" />
                <span>{new Date(newsletter.publish_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-black leading-tight mb-4">{newsletter.title}</h1>
              <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl">
                Daily intelligence distilled for the fast-moving professional.
              </p>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
          </div>

          {/* Newsletter Content */}
          <div className="px-8 py-12 md:px-16 newsletter-html-content">
            <div 
              className="prose prose-lg md:prose-xl max-w-none prose-blue prose-headings:font-display font-black prose-a:text-violet-600 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: newsletter.html_content }} 
            />
          </div>

          {/* Footer CTA */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-12 md:px-16 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Enjoyed this briefing?</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get the most critical market signals delivered to your inbox every single morning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <Link 
                to="/"
                className="w-full sm:w-auto px-8 py-3 bg-violet-600 text-white font-display font-black rounded-xl hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl shadow-violet-600/20"
              >
                Subscribe Now
              </Link>
              <Link 
                to="/archive"
                className="w-full sm:w-auto px-8 py-3 bg-white text-gray-700 font-display font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Browse Archive
              </Link>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <p className="text-sm font-display font-bold text-gray-400 uppercase tracking-widest mb-4">Share this briefing</p>
              <div className="flex items-center justify-center space-x-4">
                <button 
                  onClick={shareOnTwitter}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#1DA1F2] text-white font-display font-bold rounded-lg hover:bg-[#1a8cd8] transition-all"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </button>
                <button 
                  onClick={shareOnLinkedin}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#0A66C2] text-white font-display font-bold rounded-lg hover:bg-[#084d91] transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 text-sm text-gray-400 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="bg-gray-200 p-1 rounded">
            <TrendingUp className="text-gray-400 w-4 h-4" />
          </div>
          <span className="font-display font-bold text-gray-900">NichePulse</span>
        </div>
        <p>&copy; 2026 NichePulse Intelligence. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ArchiveDetail
