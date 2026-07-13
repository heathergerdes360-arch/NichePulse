import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Tracker = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const trackPage = async () => {
      try {
        // Only use ref if it's a valid non-empty value
        const utmSource = searchParams.get('utm_source') || '';
        const refParam = searchParams.get('ref') || '';
        const utm_source = utmSource || refParam || '';
        const referrer = document.referrer || '';
        const path = location.pathname + location.search;

        await axios.post('/api/track', {
          path,
          referrer,
          utm_source
        });
      } catch (err) {
        console.error('Failed to track page view:', err);
      }
    };

    trackPage();
  }, [location, searchParams]);

  return null;
};

export default Tracker;
