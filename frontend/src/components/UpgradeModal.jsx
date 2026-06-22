import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Zap, ShieldCheck, CreditCard, Star, Mail } from 'lucide-react';
import axios from 'axios';

const API_BASE = `/api`;

const UpgradeModal = ({ isOpen, onClose, onUpgrade }) => {
  const [step, setStep] = useState(1); // 1: Benefits, 2: Email (if missing)
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('nichepulse_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    const savedEmail = localStorage.getItem('nichepulse_email');
    if (!savedEmail && !email) {
      setStep(2);
      return;
    }

    const targetEmail = savedEmail || email;
    if (!targetEmail) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/checkout-session?email=${encodeURIComponent(targetEmail)}`);
      // Redirect to mock checkout URL
      window.location.href = res.data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('nichepulse_email', email);
    handleUpgradeClick();
  };

  const benefits = [
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, title: "Deep-Dive Analysis", desc: "Get detailed technical breakdowns of every signal." },
    { icon: <ShieldCheck className="w-5 h-5 text-green-500" />, title: "Sentiment Tracking", desc: "Monitor market mood with real-time sentiment signals." },
    { icon: <Star className="w-5 h-5 text-purple-500" />, title: "Historical Data Exports", desc: "Export intelligence reports for your own analysis." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-gray-900">Unlock NichePulse Premium</h2>
                <p className="text-gray-500 mt-1">Get the intelligence edge you need.</p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="mt-1">{benefit.icon}</div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleUpgradeClick}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Upgrade for $29/mo"
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3 italic">Cancel anytime. No strings attached.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-gray-900">One Last Step</h2>
                <p className="text-gray-500 mt-1">Please enter your email to continue.</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-display font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 py-3 px-8 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
