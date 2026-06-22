import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Crown, Loader2, ArrowRight } from 'lucide-react';

const API_BASE = `/api`;

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const email = searchParams.get('email') || localStorage.getItem('nichepulse_email');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!email) {
        setStatus('error');
        return;
      }

      try {
        await axios.post(`${API_BASE}/confirm-payment`, { email });
        setStatus('success');
        // Update local storage just in case
        localStorage.setItem('nichepulse_premium', 'true');
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setStatus('error');
      }
    };

    confirmPayment();
  }, [email]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-violet-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-black text-gray-900">Verifying your upgrade...</h1>
            <p className="text-gray-500">We're finalizing your Premium access. Just a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="w-20 h-16 text-green-500" />
                <Crown className="absolute -top-2 -right-2 w-8 h-8 text-amber-400 fill-amber-400 rotate-12" />
              </div>
            </div>
            <h1 className="text-3xl font-display font-black text-gray-900">You're Premium!</h1>
            <p className="text-gray-600 font-medium">
              Welcome to the inner circle. Your account {email} has been upgraded to NichePulse Premium.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold rounded-2xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-red-600 rotate-180" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-black text-gray-900">Something went wrong</h1>
            <p className="text-gray-500">
              We couldn't verify your upgrade automatically. If you've completed the payment, please contact support or try refreshing.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-display font-bold rounded-xl transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Success;
