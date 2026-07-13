import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Lock, ShieldCheck, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

const MockCheckout = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const email = searchParams.get('email');
  
  const handlePay = async () => {
    if (!email) {
      setError("No email provided. Please go back and subscribe first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Redirect to real Stripe checkout
      const res = await axios.post('/api/create-checkout-session', { email, plan: 'monthly' });
      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }
      setError('Failed to initiate checkout. Please try again.');
    } catch (err) {
      console.error('Payment failed:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-violet-600 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <CreditCard className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold">Secure Checkout</h1>
          <p className="text-blue-100 mt-2">NichePulse Premium Subscription</p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-500">Welcome to NichePulse Premium. You're being redirected to your dashboard...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start space-x-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">Plan</span>
                  <span className="text-sm font-display font-bold text-gray-900">Premium Monthly</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">Account</span>
                  <span className="text-sm font-display font-bold text-gray-900 truncate ml-4">{email || 'Not specified'}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-display font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-display font-black text-violet-600">$29.00</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Secure payment powered by NichePulse</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Encrypted data processing</span>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-display font-black rounded-2xl shadow-xl shadow-violet-600/20 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirm & Pay</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-display font-bold">
                STAGING ENVIRONMENT • SIMULATED TRANSACTION
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockCheckout;
