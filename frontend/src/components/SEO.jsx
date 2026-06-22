import { useEffect } from 'react';

const SEO = ({ title, description, ogImage }) => {
  useEffect(() => {
    document.title = title ? `${title} | NichePulse` : 'NichePulse | AI-Distilled Intelligence';
    
    const updateMeta = (name, content) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    const updateProperty = (property, content) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    updateMeta('description', description || 'Automated, AI-distilled intelligence reports for high-growth industries.');
    updateProperty('og:title', title || 'NichePulse | AI-Distilled Intelligence');
    updateProperty('og:description', description || 'Automated, AI-distilled intelligence reports for high-growth industries.');
    updateProperty('og:image', ogImage || 'https://nichepulse.cto.ai/test.png');
    updateProperty('og:type', 'website');

  }, [title, description, ogImage]);

  return null;
};

export default SEO;
