import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Settings as SettingsIcon, ChevronLeft, Save, Bell, Globe, Crown, ShieldCheck, Check, Share2, Copy, Users, Gift } from 'lucide-react';

const API_BASE = `/api`;

const SECTORS = ['AI', 'Climate Tech', 'Biotech', 'SpaceTech', 'DefenseTech', 'Longevity'];

const Settings = () => {
  const [subscriber, setSubscriber] = useState(null);
  const [referrals, setReferrals] = useState({ count: 0, referrals: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);
  
  const [interestedSectors, setInterestedSectors] = useState([]);
  const [sentimentAlerts, setSentimentAlerts] = useState(false);
  
  const navigate = useNavigate();
  const email = localStorage.getItem('nichepulse_email');

  useEffect(() => {
    if (!email) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [subRes, refRes] = await Promise.all([
          axios.get(`${API_BASE}/subscribers/${encodeURIComponent(email)}`),
          axios.get(`${API_BASE}/subscribers/${encodeURIComponent(email)}/referrals`)
        ]);
        setSubscriber(subRes.data);
        setReferrals(refRes.data);
        setInterestedSectors(JSON.parse(subRes.data.interested_sectors || '[]'));
        setSentimentAlerts(!!subRes.data.sentiment_alerts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ type: 'error', text: 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, navigate]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?ref=${subscriber?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSectorToggle = (sector) => {
    setInterestedSectors(prev => 
      prev.includes(sector) 
        ? prev.filter(s => s !== sector) 
        : [...prev, sector]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.patch(`${API_BASE}/subscribers/${encodeURIComponent(email)}`, {
        interested_sectors: interestedSectors,
        sentiment_alerts: sentimentAlerts
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/?ref=${subscriber?.referral_code}`;
  const milestoneProgress = Math.min((referrals.count / 3) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </Link>
            <div className="flex items-center space-x-2">
              <SettingsIcon className="w-6 h-6 text-violet-600" />
              <h1 className="text-xl font-display font-bold">Account Settings</h1>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        {message.text && (
          <div className={`p-4 rounded-xl border flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-display font-bold">Subscription Plan</h2>
              <p className="text-sm text-gray-500">Manage your current subscription and billing.</p>
            </div>
            {subscriber?.is_premium ? (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-xl font-display font-black uppercase text-xs shadow-md">
                <Crown className="w-4 h-4" />
                <span>Premium Plan</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-display font-bold text-xs">
                <span>Free Plan</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                <p className="font-display font-bold text-gray-700">{subscriber?.email}</p>
              </div>
              {!subscriber?.is_premium && (
                <button 
                  onClick={handleUpgrade}
                  className="text-sm font-display font-bold text-violet-600 hover:text-violet-700 underline"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Gift className="w-6 h-6 text-purple-600" />
              <div className="space-y-1">
                <h2 className="text-lg font-display font-bold">Referral Program</h2>
                <p className="text-sm text-gray-500">Invite friends and earn rewards.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="font-display font-bold text-purple-900 mb-2">Your Milestone</h3>
                  <div className="flex justify-between text-xs font-display font-bold text-purple-600 uppercase mb-2">
                    <span>{referrals.count} Referrals</span>
                    <span>3 Needed</span>
                  </div>
                  <div className="h-3 w-full bg-purple-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm text-purple-700">
                    {referrals.count >= 3 
                      ? "Congratulations! You've unlocked Premium status." 
                      : `Refer ${3 - referrals.count} more friend${3 - referrals.count === 1 ? '' : 's'} to get 1 month of Premium free!`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-display font-bold text-gray-700">Share your unique link</label>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 rounded-xl font-display font-bold transition-all flex items-center space-x-2 ${
                      copied ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex justify-center space-x-4 pt-2">
                  <button className="p-3 bg-blue-100 text-violet-600 rounded-full hover:bg-blue-200 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 transition-colors">
                    <Users className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sectors Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-violet-500" />
            <div className="space-y-1">
              <h2 className="text-lg font-display font-bold">Interested Sectors</h2>
              <p className="text-sm text-gray-500">Choose the industries you want to prioritize in your dashboard.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SECTORS.map(sector => (
              <button
                key={sector}
                onClick={() => handleSectorToggle(sector)}
                className={`p-4 rounded-xl border-2 transition-all text-left group ${
                  interestedSectors.includes(sector)
                    ? 'border-violet-600 bg-violet-50/50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-display font-bold ${interestedSectors.includes(sector) ? 'text-violet-700' : 'text-gray-600'}`}>
                    {sector}
                  </span>
                  {interestedSectors.includes(sector) && (
                    <div className="bg-violet-600 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className={`w-6 h-6 ${subscriber?.is_premium ? 'text-purple-500' : 'text-gray-300'}`} />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-display font-bold">Sentiment Shift Alerts</h2>
                  {!subscriber?.is_premium && <Crown className="w-3 h-3 text-amber-400" />}
                </div>
                <p className="text-sm text-gray-500">Receive email notifications when market sentiment shifts significantly.</p>
              </div>
            </div>
            
            <button
              onClick={() => subscriber?.is_premium && setSentimentAlerts(!sentimentAlerts)}
              disabled={!subscriber?.is_premium}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                !subscriber?.is_premium ? 'bg-gray-100 cursor-not-allowed' : (sentimentAlerts ? 'bg-violet-600' : 'bg-gray-200')
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  sentimentAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {!subscriber?.is_premium && (
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-3">
              <Crown className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-display font-bold text-amber-800">Premium Only Feature</p>
                <p className="text-xs text-amber-700 mt-1">Upgrade your account to enable real-time sentiment alerts and stay ahead of market moves.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
