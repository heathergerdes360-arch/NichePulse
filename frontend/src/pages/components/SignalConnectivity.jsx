import { useState, useEffect } from 'react'
import axios from 'axios'
import { Share2, ArrowRight, Zap, Sparkles, AlertTriangle, Loader2, Link2, Beaker, Globe, Rocket, Shield, Heart, Cpu, TrendingUp } from 'lucide-react'

const API_BASE = `/api`

const SECTOR_ICONS = {
  'AI': <Cpu className="w-4 h-4" />,
  'Climate Tech': <Globe className="w-4 h-4" />,
  'Biotech': <Beaker className="w-4 h-4" />,
  'SpaceTech': <Rocket className="w-4 h-4" />,
  'DefenseTech': <Shield className="w-4 h-4" />,
  'Longevity': <Heart className="w-4 h-4" />
}

const SECTOR_COLORS = {
  'AI': '#7C3AED',
  'Climate Tech': '#00D68F',
  'Biotech': '#06B6D4',
  'SpaceTech': '#F59E0B',
  'DefenseTech': '#EF4444',
  'Longevity': '#EC4899'
}

function SignalConnectivity() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_BASE}/signal-connections`)
        setConnections(res.data)
      } catch (err) {
        console.error('Error fetching signal connections:', err)
        // Fallback to mock data if API not available
        setConnections([
          {
            id: 'conn-1',
            source_sector: 'AI',
            target_sector: 'Biotech',
            title: 'AI Regulation Reshapes Biotech Trial Protocols',
            description: 'New FDA guidance on AI-assisted clinical trial design is forcing biotech firms to restructure their validation pipelines — a direct regulatory cascade from the AI safety movement.',
            strength: 8.5,
            type: 'regulatory_cascade',
            created_at: new Date().toISOString()
          },
          {
            id: 'conn-2',
            source_sector: 'Climate Tech',
            target_sector: 'DefenseTech',
            title: 'Climate Adaptation Driving Defense Sensor R&D',
            description: 'Extreme weather monitoring tech developed for climate resilience is being repurposed for military surveillance networks — a dual-use technology convergence.',
            strength: 7.2,
            type: 'tech_convergence',
            created_at: new Date().toISOString()
          },
          {
            id: 'conn-3',
            source_sector: 'SpaceTech',
            target_sector: 'Longevity',
            title: 'Microgravity Research Yields Breakthrough in Cellular Aging',
            description: 'Space-based protein crystallization experiments have produced unexpected insights into telomere lengthening — now being fast-tracked by longevity researchers.',
            strength: 9.1,
            type: 'research_spillover',
            created_at: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchConnections()
  }, [])

  const getConnectionTypeLabel = (type) => {
    switch(type) {
      case 'regulatory_cascade': return 'Regulatory Cascade'
      case 'tech_convergence': return 'Tech Convergence'
      case 'research_spillover': return 'Research Spillover'
      case 'market_mirror': return 'Market Mirror'
      default: return 'Cross-Sector Link'
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'regulatory_cascade': return 'bg-violet-100 text-violet-700 border-violet-200'
      case 'tech_convergence': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      case 'research_spillover': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'market_mirror': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStrengthColor = (strength) => {
    if (strength >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (strength >= 6) return 'text-violet-600 bg-violet-50 border-violet-200'
    return 'text-amber-600 bg-amber-50 border-amber-200'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-100"></div>
      </div>
    )
  }

  if (error && connections.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/5 via-indigo-500/5 to-cyan-500/5 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-violet-500 to-cyan-500 p-2 rounded-xl shadow-sm">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-display font-black text-gray-900 flex items-center">
              Signal Connectivity
              <span className="ml-2 text-[9px] font-display font-black text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 uppercase tracking-wider">
                AI-Powered
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Non-obvious links between disparate industry shifts
            </p>
          </div>
        </div>
        <div className="flex items-center text-[10px] font-display font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 shadow-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          PREMIUM INSIGHT
        </div>
      </div>

      {/* Connection Cards */}
      <div className="p-6 space-y-4">
        {connections.map((conn) => (
          <div 
            key={conn.id}
            className="group relative p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-violet-200 hover:shadow-md transition-all duration-300"
          >
            {/* Connection Type Badge */}
            <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-display font-black uppercase tracking-wider border ${getTypeColor(conn.type)} mb-3`}>
              <Zap className="w-2.5 h-2.5" />
              <span>{getConnectionTypeLabel(conn.type)}</span>
            </div>

            {/* Sector Link Visualization */}
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-bold text-white shadow-sm"
                style={{ backgroundColor: SECTOR_COLORS[conn.source_sector] || '#7C3AED' }}
              >
                {SECTOR_ICONS[conn.source_sector]}
                <span>{conn.source_sector}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-8 h-px bg-gradient-to-r from-violet-400 to-cyan-400"></div>
                <ArrowRight className="w-4 h-4 text-violet-400 -ml-1" />
                <div className="w-8 h-px bg-gradient-to-r from-cyan-400 to-violet-400"></div>
              </div>
              <div 
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-bold text-white shadow-sm"
                style={{ backgroundColor: SECTOR_COLORS[conn.target_sector] || '#06B6D4' }}
              >
                {SECTOR_ICONS[conn.target_sector]}
                <span>{conn.target_sector}</span>
              </div>
            </div>

            {/* Title & Description */}
            <h4 className="font-display font-bold text-gray-900 mb-1.5 group-hover:text-violet-600 transition-colors leading-tight">
              {conn.title}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {conn.description}
            </p>

            {/* Footer: Signal Strength + Date */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100/50">
              <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-display font-black border ${getStrengthColor(conn.strength)}`}>
                <TrendingUp className="w-3 h-3" />
                <span>Signal Strength: {conn.strength}/10</span>
              </div>
              <div className="text-[10px] font-display font-bold text-gray-400">
                {new Date(conn.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            AI actively analyzing cross-sector signals
          </div>
          <button className="text-xs font-display font-bold text-violet-600 hover:text-violet-700 transition-colors flex items-center space-x-1">
            <span>View All Connections</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignalConnectivity