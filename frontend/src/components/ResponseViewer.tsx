"use client";

import React from 'react';
import { RequestModel } from '@/store';
import { Globe, Clock, Database, Copy, Check } from 'lucide-react';

interface Props {
  request: RequestModel;
}

// JSON Syntax Highlighter — colorizes JSON strings inline
const JsonHighlighter = ({ json }: { json: string }) => {
  const colorize = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    // Regex to match JSON tokens
    const tokenRegex = /("(?:\\.|[^"\\])*")\s*:/g;    // keys
    const stringRegex = /:\s*("(?:\\.|[^"\\])*")/g;   // string values
    const numberRegex = /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g;
    const boolNullRegex = /:\s*(true|false|null)/g;

    // Simpler approach: split by lines, then colorize each line
    const lines = text.split('\n');
    lines.forEach((line, lineIdx) => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      
      // Match patterns in the line
      const allMatches: { start: number; end: number; text: string; type: string }[] = [];
      
      // Find string keys (before colon)
      let match;
      const keyRegex = /("(?:\\.|[^"\\])*")\s*:/g;
      while ((match = keyRegex.exec(line)) !== null) {
        allMatches.push({ start: match.index, end: match.index + match[1].length, text: match[1], type: 'key' });
      }
      
      // Find string values (after colon)
      const valStrRegex = /:\s*("(?:\\.|[^"\\])*")/g;
      while ((match = valStrRegex.exec(line)) !== null) {
        const valStart = match.index + match[0].indexOf(match[1]);
        allMatches.push({ start: valStart, end: valStart + match[1].length, text: match[1], type: 'string' });
      }
      
      // Find number values
      const valNumRegex = /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g;
      while ((match = valNumRegex.exec(line)) !== null) {
        const valStart = match.index + match[0].indexOf(match[1]);
        allMatches.push({ start: valStart, end: valStart + match[1].length, text: match[1], type: 'number' });
      }
      
      // Find booleans and null
      const valBoolRegex = /:\s*(true|false|null)\b/g;
      while ((match = valBoolRegex.exec(line)) !== null) {
        const valStart = match.index + match[0].indexOf(match[1]);
        allMatches.push({ start: valStart, end: valStart + match[1].length, text: match[1], type: 'boolean' });
      }
      
      // Sort by position, remove overlapping
      allMatches.sort((a, b) => a.start - b.start);
      const filtered: typeof allMatches = [];
      let lastEnd = -1;
      for (const m of allMatches) {
        if (m.start >= lastEnd) {
          filtered.push(m);
          lastEnd = m.end;
        }
      }
      
      // Build highlighted line
      let pos = 0;
      for (const m of filtered) {
        if (m.start > pos) {
          parts.push(<span key={`t-${pos}`} className="text-[#D4D4D4]">{line.substring(pos, m.start)}</span>);
        }
        const colorClass = m.type === 'key' ? 'text-[#9CDCFE]' 
          : m.type === 'string' ? 'text-[#CE9178]' 
          : m.type === 'number' ? 'text-[#B5CEA8]' 
          : 'text-[#569CD6]'; // boolean/null
        parts.push(<span key={`m-${m.start}`} className={colorClass}>{m.text}</span>);
        pos = m.end;
      }
      if (pos < line.length) {
        parts.push(<span key={`e-${pos}`} className="text-[#D4D4D4]">{line.substring(pos)}</span>);
      }
      
      result.push(
        <div key={lineIdx} className="leading-5">
          <span className="inline-block w-10 text-right pr-4 text-gray-600 select-none text-[10px]">{lineIdx + 1}</span>
          {parts}
        </div>
      );
    });
    
    return result;
  };

  return <div className="font-mono text-sm">{colorize(json)}</div>;
};

export const ResponseViewer: React.FC<Props> = ({ request }) => {
  const { response } = request;

  const [activeTab, setActiveTab] = React.useState<'Body' | 'Headers'>('Body');
  const [bodyView, setBodyView] = React.useState<'Pretty' | 'Raw'>('Pretty');
  const [copied, setCopied] = React.useState(false);

  // Loading state
  if (request.isSending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm border-t border-[#303030] bg-[#212121]">
        <svg className="animate-spin h-8 w-8 text-[#FF6C37] mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div className="text-gray-400">Sending request...</div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm border-t border-[#303030] bg-[#212121]">
        <Globe size={48} className="text-[#303030] mb-4" />
        <div>Enter the URL and click Send to get a response</div>
      </div>
    );
  }

  if (response.error && !response.status) {
    return (
      <div className="flex-1 flex flex-col border-t border-[#303030] bg-[#212121] p-4 text-sm text-red-400 font-mono">
        <div className="font-bold mb-2">Could not send request</div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">Error: {response.error}</div>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBg = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500/10';
    if (status >= 300 && status < 400) return 'bg-blue-500/10';
    if (status >= 400 && status < 500) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getStatusText = (status: number) => {
    const map: Record<number, string> = {
      200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently',
      304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
      404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 429: 'Too Many Requests',
      500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
    };
    return map[status] || '';
  };

  const formattedBody = React.useMemo(() => {
    if (bodyView === 'Raw') return response.body || '';
    try {
      if (response.body) {
        const parsed = JSON.parse(response.body);
        return JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // not json
    }
    return response.body || '';
  }, [response.body, bodyView]);

  const isJson = React.useMemo(() => {
    try {
      if (response.body) {
        JSON.parse(response.body);
        return true;
      }
    } catch (e) {}
    return false;
  }, [response.body]);

  const handleCopy = async () => {
    if (response.body) {
      await navigator.clipboard.writeText(formattedBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] border-t border-[#303030]">
      {/* Response Header Info */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#303030] shrink-0">
        <div className="flex items-center space-x-6 text-xs text-gray-400">
          <div className={`flex items-center px-2 py-0.5 rounded ${getStatusBg(response.status || 0)}`}>
            <span className="mr-1">Status:</span>
            <span className={`font-semibold ${getStatusColor(response.status || 0)}`}>
              {response.status} {getStatusText(response.status || 0)}
            </span>
          </div>
          <div className="flex items-center">
            <Clock size={12} className="mr-1 text-gray-500" />
            <span className="mr-1">Time:</span>
            <span className="text-green-500 font-semibold">{response.timeMs} ms</span>
          </div>
          <div className="flex items-center">
            <Database size={12} className="mr-1 text-gray-500" />
            <span className="mr-1">Size:</span>
            <span className="text-green-500 font-semibold">{formatSize(response.sizeBytes || 0)}</span>
          </div>
        </div>
      </div>

      {/* Response Tabs */}
      <div className="flex items-center justify-between h-9 border-b border-[#303030] px-4 shrink-0">
        <div className="flex items-center h-full">
          {['Body', 'Headers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-xs px-3 h-full font-medium ${
                activeTab === tab 
                  ? 'text-gray-200 border-b-2 border-[#FF6C37]' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
              {tab === 'Headers' && response.headers && <span className="ml-1 text-[10px] text-green-500">({Object.keys(response.headers).length})</span>}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeTab === 'Body' && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center text-[10px] px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-[#303030] rounded transition-colors"
              >
                {copied ? <Check size={10} className="mr-1 text-green-500" /> : <Copy size={10} className="mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <div className="flex items-center bg-[#303030] rounded overflow-hidden">
                <button 
                  onClick={() => setBodyView('Pretty')}
                  className={`text-[10px] px-2 py-1 ${bodyView === 'Pretty' ? 'bg-[#404040] text-gray-200' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  Pretty
                </button>
                <button 
                  onClick={() => setBodyView('Raw')}
                  className={`text-[10px] px-2 py-1 ${bodyView === 'Raw' ? 'bg-[#404040] text-gray-200' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  Raw
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 overflow-auto bg-[#1E1E1E]">
        {activeTab === 'Body' && (
          <div className="p-4">
            {bodyView === 'Pretty' && isJson ? (
              <JsonHighlighter json={formattedBody} />
            ) : (
              <pre className="text-sm text-[#D4D4D4] font-mono whitespace-pre-wrap break-words">
                {formattedBody}
              </pre>
            )}
          </div>
        )}
        {activeTab === 'Headers' && (
          <div className="w-full text-sm text-gray-300">
            {Object.entries(response.headers || {}).map(([key, value]) => (
              <div key={key} className="flex border-b border-[#303030] hover:bg-[#2A2A2A]">
                <div className="w-1/3 px-4 py-2 border-r border-[#303030] font-semibold text-[#9CDCFE]">{key}</div>
                <div className="w-2/3 px-4 py-2 break-all text-[#CE9178]">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
