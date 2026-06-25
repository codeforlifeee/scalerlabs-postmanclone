"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, RequestModel } from '@/store';
import { Save, Send, ChevronDown, Folder, Check } from 'lucide-react';

interface Props {
  request: RequestModel;
}

export const RequestUrlBar: React.FC<Props> = ({ request }) => {
  const { updateRequest, sendActiveRequest, saveActiveRequest, collections } = useAppStore();
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSaveDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = async () => {
    await sendActiveRequest();
  };

  const handleSaveToCollection = async (collectionId: number) => {
    await saveActiveRequest(collectionId);
    setShowSaveDropdown(false);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#10B981';
      case 'POST': return '#F59E0B';
      case 'PUT': return '#3B82F6';
      case 'PATCH': return '#8B5CF6';
      case 'DELETE': return '#EF4444';
      case 'HEAD': return '#06B6D4';
      case 'OPTIONS': return '#EC4899';
      default: return '#9CA3AF';
    }
  };

  return (
    <div className="flex items-center p-3 border-b border-[#303030] bg-[#212121] shrink-0">
      <div className="flex flex-1 items-center border border-[#404040] rounded focus-within:border-[#FF6C37] bg-[#2A2A2A] h-10 transition-colors mr-3">
        <select 
          value={request.method}
          onChange={(e) => updateRequest(request.id, { method: e.target.value })}
          className="bg-transparent text-sm font-semibold text-gray-200 outline-none border-r border-[#404040] h-full px-3 cursor-pointer appearance-none w-24"
          style={{ color: getMethodColor(request.method) }}
        >
          {methods.map(m => (
            <option key={m} value={m} className="bg-[#2A2A2A] text-gray-200">{m}</option>
          ))}
        </select>
        <input 
          type="text" 
          value={request.url}
          onChange={(e) => updateRequest(request.id, { url: e.target.value })}
          placeholder="Enter request URL"
          className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-200 placeholder-gray-500 h-full"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
      </div>

      <div className="flex items-center space-x-2 shrink-0 h-10">
        <button 
          onClick={handleSend}
          disabled={request.isSending}
          className="flex items-center px-6 h-full bg-[#FF6C37] text-white rounded font-medium text-sm hover:bg-[#e66132] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {request.isSending ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              Send
              <Send size={14} className="ml-2" />
            </>
          )}
        </button>
        
        {/* Save Button with Collection Picker Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex h-full">
            <button 
              onClick={() => {
                if (request.collectionId) {
                  handleSaveToCollection(request.collectionId);
                } else {
                  setShowSaveDropdown(!showSaveDropdown);
                }
              }}
              className="flex items-center px-3 h-10 bg-[#303030] text-gray-200 rounded-l font-medium text-sm hover:bg-[#404040] transition-colors border border-[#404040] border-r-0"
              title={request.collectionId ? `Save to current collection` : 'Save to collection'}
            >
              <Save size={16} className="mr-2" />
              Save
            </button>
            <button
              onClick={() => setShowSaveDropdown(!showSaveDropdown)}
              className="flex items-center px-1.5 h-10 bg-[#303030] text-gray-200 rounded-r font-medium text-sm hover:bg-[#404040] transition-colors border border-[#404040] border-l-[#505050]"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {showSaveDropdown && (
            <div className="absolute right-0 top-12 w-56 bg-[#2A2A2A] border border-[#404040] rounded-lg shadow-xl z-50 py-1">
              <div className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-b border-[#303030]">
                Save to Collection
              </div>
              {collections.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-500 text-center">
                  No collections yet. Create one first!
                </div>
              ) : (
                collections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => handleSaveToCollection(col.id)}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-gray-300 hover:bg-[#303030] transition-colors"
                  >
                    <Folder size={12} className="text-gray-500 shrink-0" />
                    <span className="truncate flex-1">{col.name}</span>
                    {request.collectionId === col.id && (
                      <Check size={12} className="text-[#FF6C37] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
