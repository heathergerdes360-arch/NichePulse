import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Minus, Activity, Sparkles } from 'lucide-react';

const API_BASE = `/api`;

const SECTOR_MAP = {
  'ai': 'AI',
  'climate': 'Climate Tech',
  'biotech': 'Biotech',
  'spacetech': 'SpaceTech',
  'defensetech': 'DefenseTech',
  'longevity': 'Longevity'
};

const SentimentSnapshot = () => {
  const [snapshot, setSnapshot] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sentiment/snapshot`);
        // Filter and map only relevant sectors
        const filtered = res.data
          .filter(item => SECTOR_MAP[item.sector.toLowerCase()])
          .map(item => ({
            ...item,
            displayName: SECTOR_MAP[item.sector.toLowerCase()]
          }));
        setSnapshot(filtered);
      } catch (err) {
        console.error('Error fetching sentiment snapshot:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
  }, []);

  const getVibe = (score) => {
    if (score >= 0.7) return { label: 'Bullish', color: 'text-green-600', bg: 'bg-green-50', icon: <TrendingUp className="w-4 h-4" /> };
    if (score <= 0.4) return { label: 'Bearish', color: 'text-red-600', bg: 'bg-red-50', icon: <TrendingDown className="w-4 h-4" /> };
    return { label: 'Neutral', color: 'text-gray-600', bg: 'bg-gray-50', icon: <Minus className="w-4 h-4" /> };
  };

  if (loading) return <div className="animate-pulse flex space-x-4 mb-8"><div className="h-32 bg-gray-200 rounded-2xl w-full"></div></div>;
  if (snapshot.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-gradient-to-r from-violet-50/50 to-indigo-50/50 px-6 py-3 border-b border-blue-100 flex justify-between items-center">
        <h3 className="text-sm font-display font-black text-blue-800 uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 mr-2 text-violet-600" />
          Community Sentiment Pulse
        </h3>
        <div className="flex items-center text-[10px] font-display font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 shadow-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          PREMIUM INSIGHT
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {snapshot.map((item) => {
            const vibe = getVibe(item.avg_sentiment);
            return (
              <div key={item.sector} className="flex flex-col space-y-1.5 group">
                <span className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-tighter truncate group-hover:text-violet-600 transition-colors">
                  {item.displayName}
                </span>
                <div className={`flex items-center justify-between p-2.5 rounded-xl ${vibe.bg} border border-transparent group-hover:border-blue-200 transition-all shadow-sm`}>
                   <div className={`${vibe.color}`}>
                     {vibe.icon}
                   </div>
                   <div className={`text-sm font-display font-black ${vibe.color}`}>
                     {Math.round(item.avg_sentiment * 100)}%
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SentimentSnapshot;
