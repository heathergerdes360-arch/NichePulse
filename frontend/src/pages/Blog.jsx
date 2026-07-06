import SEO from "../components/SEO";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight, TrendingUp, Search, ExternalLink } from 'lucide-react';

const API_BASE = `/api`;

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/blogs`);
        setBlogs(res.data);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to fetch blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <SEO title="Blog" description="NichePulse Intelligence Blog — SEO-optimized deep dives from daily market signals." />
      
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-violet-600 p-1.5 rounded-lg group-hover:bg-violet-700 transition-colors">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">Niche<span className="text-violet-600">Pulse</span></span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link to="/archive" className="text-sm font-medium text-gray-500 hover:text-violet-600 transition-colors">
              Archive
            </Link>
            <span className="text-sm font-medium text-violet-600 border-b-2 border-violet-600 pb-1">Blog</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black mb-4">Intelligence Blog</h1>
          <p className="text-xl text-gray-600">
            Long-form, SEO-optimized analysis derived from daily market signals.
          </p>
        </div>

        <div className="relative flex-1 w-full mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search blog posts..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center shadow-sm">
            <Newspaper className="mr-3 w-6 h-6" />
            {error}
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredBlogs.map(b => (
              <Link
                key={b.id}
                to={`/blog/${b.id}`}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all flex justify-between items-center"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-violet-50 p-3 rounded-xl group-hover:bg-violet-100 transition-colors">
                    <Calendar className="text-violet-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg group-hover:text-violet-600 transition-colors">{b.title}</h3>
                    <p className="text-sm text-gray-500">
                      {b.date} &middot; {b.story_count || 0} signals analyzed
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-50 p-2 rounded-full group-hover:bg-violet-50 group-hover:text-violet-600 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Newspaper className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No blog posts yet. Check back after the pipeline runs.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-violet-600 rounded-3xl p-8 text-center text-white shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold mb-4">Want these insights daily?</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Get the full intelligence brief delivered to your inbox every morning.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-3 bg-white text-violet-600 font-display font-black rounded-xl hover:bg-violet-50 transition-all shadow-lg hover:shadow-xl"
            >
              Subscribe Free
            </Link>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12 text-sm text-gray-400 text-center">
        <p>&copy; 2026 NichePulse Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Blog;
