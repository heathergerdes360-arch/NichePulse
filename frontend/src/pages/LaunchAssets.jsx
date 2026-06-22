import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Copy, Check, Share2, Rocket, ExternalLink, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_BASE = `/api`

function LaunchAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE}/launch-teaser`)
      setAssets(res.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching launch assets:', err)
      setError('Failed to fetch launch assets. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <h1 className="text-xl font-display font-bold">Launch <span className="text-violet-600">Assets</span></h1>
          </div>
          <div className="flex items-center space-x-2 text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
            <Rocket className="w-4 h-4 text-violet-500" />
            <span>Growth Tools</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-display font-black text-gray-900 mb-4">Viral Signal Snippets</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            High-impact "hooks" based on our latest under-reported intelligence. 
            Copy and paste these onto LinkedIn, X, or niche forums to drive immediate traffic.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            {error}
          </div>
        ) : assets.length > 0 ? (
          <div className="space-y-8">
            {assets.map((asset, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-display font-black uppercase px-2 py-1 bg-blue-100 text-violet-700 rounded-md tracking-tighter">
                      {asset.category}
                    </span>
                    <h3 className="font-display font-bold text-sm text-gray-700 truncate max-w-md">{asset.title}</h3>
                  </div>
                  <div className="flex items-center text-amber-500">
                    <Zap className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-display font-bold ml-1">Rank {asset.importance}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-gray-900 text-gray-100 p-6 rounded-xl font-mono text-sm leading-relaxed mb-6 relative group">
                    <pre className="whitespace-pre-wrap break-words">{asset.hook}</pre>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => copyToClipboard(asset.hook, index)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-display font-bold transition-all ${
                        copiedIndex === index 
                        ? 'bg-green-500 text-white shadow-green-100' 
                        : 'bg-violet-600 text-white hover:bg-violet-700 shadow-blue-100'
                      } shadow-lg active:transform active:scale-95`}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span>Copy Social Snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-cyan-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-indigo-100 mt-12">
              <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
                <h4 className="text-xl font-display font-bold mb-2">Want to automate this?</h4>
                <p className="text-indigo-100 text-sm">
                  Our AI Engineer is working on a direct X/LinkedIn API integration to schedule these posts automatically.
                </p>
              </div>
              <button className="whitespace-nowrap bg-white text-cyan-600 px-6 py-3 rounded-xl font-display font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                View Roadmap
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 font-medium italic">
            No intelligence stories found to generate snippets.
          </div>
        )}
        
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 font-medium italic">
            Best practices: Post these snippets with a relevant high-resolution image or chart to maximize engagement.
          </p>
        </div>
      </main>
    </div>
  )
}

export default LaunchAssets
