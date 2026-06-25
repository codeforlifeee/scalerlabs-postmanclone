"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { RequestUrlBar } from './RequestUrlBar';
import { KeyValueEditor } from './KeyValueEditor';
import { RequestBodyEditor } from './RequestBodyEditor';
import { ResponseViewer } from './ResponseViewer';
import { Plus, X, GripHorizontal } from 'lucide-react';

export const MainWorkspace = () => {
  const { 
    openRequests, 
    activeRequestId, 
    setActiveRequestId, 
    closeRequestTab,
    addRequestTab,
    updateRequest
  } = useAppStore();

  const activeRequest = openRequests.find(r => r.id === activeRequestId);

  const [activeSubTab, setActiveSubTab] = useState<'Params' | 'Headers' | 'Body' | 'Auth'>('Params');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Resizable panels
  const [splitRatio, setSplitRatio] = useState(0.5); // 0.0 to 1.0 — portion for request panel
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = Math.max(0.15, Math.min(0.85, y / rect.height));
      setSplitRatio(ratio);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleStartRename = (reqId: string, currentName: string) => {
    setEditingTabId(reqId);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingTabId && editingName.trim()) {
      updateRequest(editingTabId, { name: editingName.trim() });
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-500';
      case 'POST': return 'text-yellow-500';
      case 'PUT': return 'text-blue-500';
      case 'PATCH': return 'text-purple-500';
      case 'DELETE': return 'text-red-500';
      case 'HEAD': return 'text-cyan-500';
      case 'OPTIONS': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  if (openRequests.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#212121]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6C37]/10 flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-[#FF6C37]" />
          </div>
          <div className="text-gray-400 mb-2 text-sm font-medium">No open requests</div>
          <div className="text-gray-600 mb-6 text-xs">Create a new request or select one from the sidebar</div>
          <button 
            onClick={() => addRequestTab()}
            className="flex items-center px-6 py-2.5 bg-[#FF6C37] text-white rounded-lg font-medium text-sm hover:bg-[#e66132] transition-colors mx-auto"
          >
            <Plus size={16} className="mr-2" />
            Create New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#212121] min-w-0">
      {/* Tabs Row */}
      <div className="flex items-center h-10 border-b border-[#303030] overflow-x-auto shrink-0 scrollbar-hide">
        {openRequests.map(req => (
          <div 
            key={req.id}
            onClick={() => setActiveRequestId(req.id)}
            className={`flex items-center h-full px-4 border-r border-[#303030] min-w-[150px] max-w-[200px] cursor-pointer group ${
              activeRequestId === req.id 
                ? 'bg-[#2A2A2A] text-gray-100 border-t-2 border-t-[#FF6C37]' 
                : 'text-gray-400 hover:bg-[#252525] hover:text-gray-300 border-t-2 border-t-transparent'
            }`}
          >
            <span className={`text-[10px] font-bold mr-2 shrink-0 ${getMethodColor(req.method)}`}>
              {req.method}
            </span>
            
            {editingTabId === req.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') { setEditingTabId(null); setEditingName(''); }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="flex-1 bg-[#303030] border border-[#FF6C37] rounded px-1 py-0.5 text-xs text-gray-200 outline-none min-w-0"
              />
            ) : (
              <span 
                className="truncate flex-1 text-xs"
                onDoubleClick={(e) => { e.stopPropagation(); handleStartRename(req.id, req.name); }}
                title="Double-click to rename"
              >
                {req.name}
              </span>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); closeRequestTab(req.id); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#404040] rounded ml-2 shrink-0"
            >
              <X size={12} className="text-gray-400 hover:text-white" />
            </button>
          </div>
        ))}
        <button 
          onClick={() => addRequestTab()}
          className="h-full px-3 text-gray-400 hover:text-gray-200 hover:bg-[#252525] shrink-0"
          title="New Request"
        >
          <Plus size={16} />
        </button>
      </div>

      {activeRequest && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* URL Bar */}
          <RequestUrlBar request={activeRequest} />

          {/* Resizable panels container */}
          <div ref={containerRef} className="flex-1 flex flex-col min-h-0 relative">
            {/* Request Builder Panel */}
            <div 
              className="flex flex-col overflow-hidden"
              style={{ height: `${splitRatio * 100}%` }}
            >
              {/* Request Subtabs */}
              <div className="flex items-center h-9 border-b border-[#303030] px-4 shrink-0">
                {(['Params', 'Headers', 'Body', 'Auth'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`text-xs px-3 h-full font-medium ${
                      activeSubTab === tab 
                        ? 'text-gray-200 border-b-2 border-[#FF6C37]' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                    {tab === 'Params' && activeRequest.queryParams.length > 0 && <span className="ml-1 text-[10px] text-green-500">({activeRequest.queryParams.length})</span>}
                    {tab === 'Headers' && activeRequest.headers.length > 0 && <span className="ml-1 text-[10px] text-green-500">({activeRequest.headers.length})</span>}
                  </button>
                ))}
              </div>

              {/* Request Editors */}
              <div className="flex-1 overflow-y-auto">
                {activeSubTab === 'Params' && (
                  <KeyValueEditor 
                    items={activeRequest.queryParams} 
                    onChange={(newParams) => updateRequest(activeRequest.id, { queryParams: newParams })}
                    placeholderKey="Query Param"
                  />
                )}
                {activeSubTab === 'Headers' && (
                  <KeyValueEditor 
                    items={activeRequest.headers} 
                    onChange={(newHeaders) => updateRequest(activeRequest.id, { headers: newHeaders })}
                    placeholderKey="Header"
                  />
                )}
                {activeSubTab === 'Body' && (
                  <RequestBodyEditor request={activeRequest} />
                )}
                {activeSubTab === 'Auth' && (
                  <div className="p-4 text-sm text-gray-400">
                    <div className="mb-4">
                      <label className="mr-4">Type</label>
                      <select 
                        value={activeRequest.auth.type}
                        onChange={(e) => updateRequest(activeRequest.id, { auth: { ...activeRequest.auth, type: e.target.value as any } })}
                        className="bg-[#303030] text-gray-200 border border-[#404040] rounded px-2 py-1 outline-none text-xs focus:border-[#FF6C37]"
                      >
                        <option value="none">No Auth</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="basic">Basic Auth</option>
                      </select>
                    </div>
                    {activeRequest.auth.type === 'bearer' && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Token</label>
                        <input 
                          type="text" 
                          value={activeRequest.auth.token || ''}
                          onChange={(e) => updateRequest(activeRequest.id, { auth: { ...activeRequest.auth, token: e.target.value } })}
                          placeholder="Enter your bearer token"
                          className="w-full bg-[#303030] border border-[#404040] rounded px-3 py-1.5 text-sm outline-none focus:border-[#FF6C37] text-gray-200"
                        />
                      </div>
                    )}
                    {activeRequest.auth.type === 'basic' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Username</label>
                          <input 
                            type="text" 
                            value={activeRequest.auth.username || ''}
                            onChange={(e) => updateRequest(activeRequest.id, { auth: { ...activeRequest.auth, username: e.target.value } })}
                            placeholder="Username"
                            className="w-full bg-[#303030] border border-[#404040] rounded px-3 py-1.5 text-sm outline-none focus:border-[#FF6C37] text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Password</label>
                          <input 
                            type="password" 
                            value={activeRequest.auth.password || ''}
                            onChange={(e) => updateRequest(activeRequest.id, { auth: { ...activeRequest.auth, password: e.target.value } })}
                            placeholder="Password"
                            className="w-full bg-[#303030] border border-[#404040] rounded px-3 py-1.5 text-sm outline-none focus:border-[#FF6C37] text-gray-200"
                          />
                        </div>
                      </div>
                    )}
                    {activeRequest.auth.type === 'none' && (
                      <div className="text-xs text-gray-600 text-center mt-8">
                        This request does not use any authorization.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drag Handle */}
            <div 
              className="h-1.5 bg-[#303030] hover:bg-[#FF6C37]/40 cursor-row-resize flex items-center justify-center shrink-0 transition-colors group"
              onMouseDown={handleMouseDown}
            >
              <GripHorizontal size={12} className="text-gray-600 group-hover:text-[#FF6C37] transition-colors" />
            </div>

            {/* Response Viewer Panel */}
            <div 
              className="flex flex-col overflow-hidden"
              style={{ height: `${(1 - splitRatio) * 100}%` }}
            >
              <ResponseViewer request={activeRequest} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
