"use client";

import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MainWorkspace } from '@/components/MainWorkspace';
import { EnvironmentModal } from '@/components/EnvironmentModal';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/store';
import axios from 'axios';
import { 
  Globe, Compass, Network, Folder, Clock, Send, ArrowRight,
  Users, Server, FileText, Activity, Lock
} from 'lucide-react';

// --- Status Bar (Postman-style bottom bar) ---
const StatusBar = () => {
  const { openRequests, activeRequestId, collections, history } = useAppStore();
  const activeReq = openRequests.find(r => r.id === activeRequestId);

  return (
    <div className="h-6 bg-[#1A1A1A] border-t border-[#303030] flex items-center justify-between px-4 text-[10px] text-gray-500 shrink-0">
      <div className="flex items-center space-x-4">
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>Connected</span>
        <span>{collections.length} collection{collections.length !== 1 ? 's' : ''}</span>
        <span>{history.length} history item{history.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center space-x-4">
        {activeReq && (
          <span className="text-gray-400">
            {activeReq.method} {activeReq.url ? activeReq.url.substring(0, 40) : 'No URL'}
            {activeReq.url && activeReq.url.length > 40 ? '...' : ''}
          </span>
        )}
        <span>Proxy: localhost:8000</span>
      </div>
    </div>
  );
};

// --- Home Tab ---
const HomeTab = () => {
  const { collections, history, addRequestTab, setActiveNavbarTab } = useAppStore();
  
  return (
    <div className="flex-1 overflow-y-auto bg-[#1A1A1A] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Welcome Back 👋</h1>
          <p className="text-gray-400 text-sm">Start building and testing your APIs. Here&apos;s your overview.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <button 
            onClick={() => { setActiveNavbarTab('Workspaces'); addRequestTab(); }}
            className="flex items-center p-4 bg-gradient-to-br from-[#FF6C37]/20 to-[#FF6C37]/5 border border-[#FF6C37]/30 rounded-xl hover:border-[#FF6C37]/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FF6C37]/20 flex items-center justify-center mr-4 group-hover:bg-[#FF6C37]/30 transition-colors">
              <Send size={18} className="text-[#FF6C37]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-200">New Request</div>
              <div className="text-[10px] text-gray-500">Create &amp; send an API request</div>
            </div>
          </button>
          <button 
            onClick={() => setActiveNavbarTab('Workspaces')}
            className="flex items-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl hover:border-blue-500/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4 group-hover:bg-blue-500/30 transition-colors">
              <Folder size={18} className="text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-200">Workspace</div>
              <div className="text-[10px] text-gray-500">Manage your collections</div>
            </div>
          </button>
          <button 
            onClick={() => setActiveNavbarTab('Explore')}
            className="flex items-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl hover:border-purple-500/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-4 group-hover:bg-purple-500/30 transition-colors">
              <Compass size={18} className="text-purple-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-200">Explore</div>
              <div className="text-[10px] text-gray-500">Discover public APIs</div>
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-[#212121] border border-[#303030] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Collections</span>
              <Folder size={16} className="text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-100">{collections.length}</div>
          </div>
          <div className="bg-[#212121] border border-[#303030] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Requests</span>
              <Send size={16} className="text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {collections.reduce((sum, c) => sum + (c.requests?.length || 0), 0)}
            </div>
          </div>
          <div className="bg-[#212121] border border-[#303030] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">History</span>
              <Clock size={16} className="text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-100">{history.length}</div>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-[#212121] border border-[#303030] rounded-xl p-5 mb-10">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Activity</h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No recent activity. Send your first request!</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#252525] transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] font-bold w-12 ${
                      entry.method === 'GET' ? 'text-green-500' : entry.method === 'POST' ? 'text-yellow-500' : entry.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'
                    }`}>{entry.method}</span>
                    <span className="text-xs text-gray-300 truncate max-w-[300px]">{entry.url}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-[10px] text-gray-500">
                    <span className={entry.status_code >= 200 && entry.status_code < 300 ? 'text-green-500' : 'text-red-500'}>
                      {entry.status_code}
                    </span>
                    <span>{entry.response_time_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Placeholders */}
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Coming Soon</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <Users size={20} />, title: 'Team Workspaces', desc: 'Collaborate with your team in shared workspaces' },
            { icon: <Server size={20} />, title: 'Mock Servers', desc: 'Create mock servers for API prototyping' },
            { icon: <FileText size={20} />, title: 'API Documentation', desc: 'Auto-generate documentation from collections' },
            { icon: <Activity size={20} />, title: 'Monitors', desc: 'Schedule and monitor API health checks' },
          ].map(item => (
            <div key={item.title} className="flex items-center p-4 bg-[#212121] border border-[#303030] rounded-xl opacity-60">
              <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center mr-4 text-gray-500">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-400">{item.title}</div>
                <div className="text-[10px] text-gray-600">{item.desc}</div>
              </div>
              <span className="text-[9px] bg-[#303030] text-gray-500 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- API Network Tab ---
const APINetworkTab = () => {
  const sampleApis = [
    { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com', description: 'Free fake REST API for testing', method: 'GET', endpoints: ['/posts', '/users', '/comments', '/todos'] },
    { name: 'HTTPBin', url: 'https://httpbin.org', description: 'HTTP request & response service', method: 'GET', endpoints: ['/get', '/post', '/status/200', '/headers'] },
    { name: 'Dog API', url: 'https://dog.ceo/api', description: 'Random dog images API', method: 'GET', endpoints: ['/breeds/list/all', '/breed/hound/images/random'] },
    { name: 'Cat Facts', url: 'https://catfact.ninja', description: 'Random cat facts', method: 'GET', endpoints: ['/fact', '/facts', '/breeds'] },
    { name: 'PokeAPI', url: 'https://pokeapi.co/api/v2', description: 'Pokémon data API', method: 'GET', endpoints: ['/pokemon/ditto', '/type/fire', '/ability/overgrow'] },
    { name: 'REST Countries', url: 'https://restcountries.com/v3.1', description: 'Country information', method: 'GET', endpoints: ['/all', '/name/india', '/region/asia'] },
  ];

  const { addRequestTab, setActiveNavbarTab } = useAppStore();

  const tryEndpoint = (baseUrl: string, endpoint: string, method: string) => {
    setActiveNavbarTab('Workspaces');
    addRequestTab({ name: `${endpoint}`, method, url: `${baseUrl}${endpoint}` });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#1A1A1A] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2 flex items-center">
            <Network size={28} className="mr-3 text-[#FF6C37]" /> API Network
          </h1>
          <p className="text-gray-400 text-sm">Discover and try popular public APIs. Click any endpoint to open it as a new request.</p>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {sampleApis.map(apiItem => (
            <div key={apiItem.name} className="bg-[#212121] border border-[#303030] rounded-xl p-5 hover:border-[#404040] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">{apiItem.name}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">{apiItem.description}</p>
                </div>
                <Globe size={16} className="text-gray-600 shrink-0" />
              </div>
              <div className="text-[10px] text-gray-500 mb-3 font-mono break-all">{apiItem.url}</div>
              <div className="space-y-1.5">
                {apiItem.endpoints.map(ep => (
                  <button
                    key={ep}
                    onClick={() => tryEndpoint(apiItem.url, ep, apiItem.method)}
                    className="w-full flex items-center justify-between p-2 bg-[#1A1A1A] rounded-lg hover:bg-[#252525] transition-colors text-xs group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500 font-bold text-[10px]">{apiItem.method}</span>
                      <span className="text-gray-300 font-mono">{ep}</span>
                    </div>
                    <ArrowRight size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Explore Tab ---
const ExploreTab = () => {
  const { addRequestTab, setActiveNavbarTab } = useAppStore();
  const categories = [
    {
      name: 'Social Media', icon: '💬', color: 'from-pink-500/20 to-pink-500/5',
      apis: [
        { name: 'Random User', url: 'https://randomuser.me/api/', desc: 'Generate random user data' },
        { name: 'Lorem Picsum', url: 'https://picsum.photos/v2/list?limit=5', desc: 'Random placeholder images' },
      ]
    },
    {
      name: 'Science & Data', icon: '🔬', color: 'from-cyan-500/20 to-cyan-500/5',
      apis: [
        { name: 'NASA APOD', url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', desc: 'Astronomy Picture of the Day' },
        { name: 'Open Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&current_weather=true', desc: 'Weather forecast' },
      ]
    },
    {
      name: 'Fun & Games', icon: '🎮', color: 'from-yellow-500/20 to-yellow-500/5',
      apis: [
        { name: 'Trivia API', url: 'https://opentdb.com/api.php?amount=5', desc: 'Trivia questions' },
        { name: 'Bored API', url: 'https://www.boredapi.com/api/activity', desc: 'Find something to do' },
      ]
    },
    {
      name: 'Finance', icon: '💰', color: 'from-green-500/20 to-green-500/5',
      apis: [
        { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', desc: 'Cryptocurrency prices' },
        { name: 'Exchange Rates', url: 'https://open.er-api.com/v6/latest/USD', desc: 'Currency exchange rates' },
      ]
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#1A1A1A] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2 flex items-center">
            <Compass size={28} className="mr-3 text-[#FF6C37]" /> Explore APIs
          </h1>
          <p className="text-gray-400 text-sm">Browse categorized public APIs and try them out instantly.</p>
        </div>
        <div className="space-y-8">
          {categories.map(cat => (
            <div key={cat.name}>
              <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                <span className="mr-2 text-xl">{cat.icon}</span> {cat.name}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {cat.apis.map(a => (
                  <button
                    key={a.name}
                    onClick={() => { setActiveNavbarTab('Workspaces'); addRequestTab({ name: a.name, method: 'GET', url: a.url }); }}
                    className={`text-left p-5 bg-gradient-to-br ${cat.color} border border-[#303030] rounded-xl hover:border-[#505050] transition-all group`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200 mb-1">{a.name}</h3>
                        <p className="text-[10px] text-gray-500 mb-2">{a.desc}</p>
                        <div className="text-[10px] text-gray-600 font-mono break-all">{a.url.length > 50 ? a.url.substring(0, 50) + '...' : a.url}</div>
                      </div>
                      <ArrowRight size={14} className="text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Root Page ---
export default function PageRoot() {
  const { fetchCollections, fetchHistory, fetchEnvironments, activeNavbarTab } = useAppStore();

  useEffect(() => {
    const init = async () => {
      try {
        await axios.get('http://localhost:8000/seed');
      } catch (e) {
        // seed may fail if already seeded, that's ok
      }
      try {
        await fetchCollections();
        await fetchHistory();
        await fetchEnvironments();
      } catch (e) {
        console.error("Initialization failed", e);
      }
    };
    init();
  }, [fetchCollections, fetchHistory, fetchEnvironments]);

  const renderContent = () => {
    switch (activeNavbarTab) {
      case 'Home':
        return <HomeTab />;
      case 'Workspaces':
        return (
          <>
            <Sidebar />
            <MainWorkspace />
          </>
        );
      case 'API Network':
        return <APINetworkTab />;
      case 'Explore':
        return <ExploreTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-[#212121] text-gray-300 font-sans">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          {renderContent()}
        </div>
        <StatusBar />
        <EnvironmentModal />
      </div>
    </ToastProvider>
  );
}
