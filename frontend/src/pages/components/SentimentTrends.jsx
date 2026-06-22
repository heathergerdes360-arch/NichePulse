import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts'
import { TrendingUp, Activity, AlertTriangle, Zap } from 'lucide-react'

const API_BASE = `/api`

const COLORS = {
  'AI': '#3b82f6',
  'Climate Tech': '#10b981',
  'Biotech': '#8b5cf6',
  'SpaceTech': '#f59e0b',
  'DefenseTech': '#ef4444',
  'Longevity': '#ec4899'
}

function SentimentTrends() {
  const [data, setData] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEvents, setShowEvents] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [historyRes, eventsRes] = await Promise.all([
          axios.get(`${API_BASE}/sentiment/history`),
          axios.get(`${API_BASE}/market-events`)
        ])
        
        // Group data by date for Recharts
        const grouped = historyRes.data.reduce((acc, curr) => {
          const date = new Date(curr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          if (!acc[date]) acc[date] = { date }
          acc[date][curr.sector] = parseFloat(curr.avg_sentiment.toFixed(2))
          return acc
        }, {})
        
        setData(Object.values(grouped))

        // Format events to match chart dates
        const formattedEvents = eventsRes.data.map(e => ({
          ...e,
          chartDate: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }))
        setEvents(formattedEvents)

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load trend data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center"><AlertTriangle className="mr-2 w-4 h-4" />{error}</div>

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-display font-bold flex items-center">
            <Activity className="mr-2 w-5 h-5 text-violet-600" />
            Sector Sentiment Trends
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">Daily average sentiment scores with major market catalysts</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showEvents} 
              onChange={() => setShowEvents(!showEvents)}
              className="rounded text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs font-display font-bold text-gray-600 uppercase">Overlay Events</span>
          </label>
          <div className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-display font-bold rounded-full border border-green-100">
            <TrendingUp className="w-3 h-3" />
            <span>REAL-TIME ANALYSIS</span>
          </div>
        </div>
      </div>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              domain={[0, 1]} 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ marginBottom: '8px', fontWeight: 'black', color: '#111827' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }}
            />
            
            {showEvents && events.map((event, idx) => (
              <ReferenceLine 
                key={event.id} 
                x={event.chartDate} 
                stroke="#6366f1" 
                strokeDasharray="3 3"
                strokeWidth={2}
              >
                <Label 
                  value={event.title} 
                  position="top" 
                  fill="#4f46e5" 
                  fontSize={10} 
                  fontWeight="bold"
                  offset={10}
                />
              </ReferenceLine>
            ))}

            {Object.keys(COLORS).map(sector => (
              <Line 
                key={sector}
                type="monotone" 
                dataKey={sector} 
                stroke={COLORS[sector]} 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Overall Status</div>
          <div className="text-sm font-display font-bold text-green-600 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Bullish
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Highest Momentum</div>
          <div className="text-sm font-display font-bold text-violet-600">AI Sector</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Key Catalyst</div>
          <div className="text-sm font-display font-bold text-cyan-600 truncate">{events[0]?.title || 'Earnings'}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-display font-black text-gray-400 uppercase tracking-widest mb-1">Signal Strength</div>
          <div className="text-sm font-display font-bold text-gray-900">High (8.4/10)</div>
        </div>
      </div>

      {/* Events List */}
      {showEvents && events.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h4 className="text-sm font-display font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
            Major Market Catalysts
          </h4>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[event.sector] || '#cbd5e1' }}></div>
                  <span className="text-xs font-display font-bold text-gray-400 uppercase w-20">{event.sector}</span>
                  <span className="text-sm font-display font-bold text-gray-800">{event.title}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-display font-black px-2 py-1 bg-gray-100 text-gray-500 rounded uppercase">{event.event_type}</span>
                  <span className="text-xs font-medium text-gray-500">{event.chartDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SentimentTrends
