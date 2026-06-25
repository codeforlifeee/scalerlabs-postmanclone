"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { useToast } from '@/components/Toast';
import { 
  Folder, History, Plus, MoreVertical, ChevronRight, ChevronDown, 
  Trash2, Edit3, X, FolderPlus
} from 'lucide-react';

// Small context menu component
const ContextMenu = ({ 
  x, y, items, onClose 
}: { 
  x: number; y: number; 
  items: { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[]; 
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div 
      ref={ref}
      className="fixed bg-[#2A2A2A] border border-[#404040] rounded-lg shadow-xl z-50 py-1 min-w-[160px] animate-in fade-in"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 transition-colors ${
            item.danger 
              ? 'text-red-400 hover:bg-red-500/10' 
              : 'text-gray-300 hover:bg-[#303030]'
          }`}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export const Sidebar = () => {
  const { 
    sidebarOpen, 
    activeSidebarTab, 
    setActiveSidebarTab,
    collections,
    history,
    fetchCollections,
    fetchHistory,
    addRequestTab,
    createCollection,
    renameCollection,
    deleteCollection,
    deleteRequest,
    clearHistory,
    deleteHistoryEntry,
    searchQuery,
    expandedCollections,
    toggleCollectionExpanded,
  } = useAppStore();

  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [renamingCollectionId, setRenamingCollectionId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id: number; collectionId?: number } | null>(null);
  
  const newCollInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCollections();
    fetchHistory();
  }, [fetchCollections, fetchHistory]);

  useEffect(() => {
    if (isCreatingCollection && newCollInputRef.current) {
      newCollInputRef.current.focus();
    }
  }, [isCreatingCollection]);

  useEffect(() => {
    if (renamingCollectionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingCollectionId]);

  if (!sidebarOpen) return null;

  const handleRequestClick = (req: any, collectionId?: number) => {
    addRequestTab({
      id: `db_${req.id}`,
      dbId: req.id,
      collectionId: collectionId,
      name: req.name || 'History Request',
      method: req.method,
      url: req.url,
      headers: req.headers || [],
      queryParams: req.query_params || [],
      bodyType: req.body_type || 'none',
      bodyContent: req.body_content || req.body || '',
      auth: req.auth_config || { type: 'none' },
    });
  };

  const handleCreateCollection = async () => {
    if (newCollectionName.trim()) {
      await createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setIsCreatingCollection(false);
    }
  };

  const handleRenameCollection = async () => {
    if (renamingCollectionId && renameValue.trim()) {
      await renameCollection(renamingCollectionId, renameValue.trim());
      setRenamingCollectionId(null);
      setRenameValue('');
    }
  };

  const handleCollectionContextMenu = (e: React.MouseEvent, colId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'collection', id: colId });
  };

  const handleRequestContextMenu = (e: React.MouseEvent, reqId: number, colId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'request', id: reqId, collectionId: colId });
  };

  // Search filtering
  const lowerSearch = searchQuery.toLowerCase();
  const filteredCollections = collections.map(col => ({
    ...col,
    requests: col.requests?.filter((req: any) => 
      !searchQuery || req.name?.toLowerCase().includes(lowerSearch) || req.url?.toLowerCase().includes(lowerSearch)
    ) || []
  })).filter(col => 
    !searchQuery || col.name.toLowerCase().includes(lowerSearch) || col.requests.length > 0
  );

  const filteredHistory = history.filter(entry =>
    !searchQuery || entry.url.toLowerCase().includes(lowerSearch) || entry.method.toLowerCase().includes(lowerSearch)
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-500';
      case 'POST': return 'text-yellow-500';
      case 'PUT': return 'text-blue-500';
      case 'PATCH': return 'text-purple-500';
      case 'DELETE': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="w-64 flex flex-col bg-[#212121] border-r border-[#303030] h-full overflow-hidden shrink-0">
      <div className="flex border-b border-[#303030]">
        <button
          className={`flex-1 py-2 text-xs font-semibold ${activeSidebarTab === 'collections' ? 'text-gray-100 border-b-2 border-[#FF6C37]' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveSidebarTab('collections')}
        >
          Collections
        </button>
        <button
          className={`flex-1 py-2 text-xs font-semibold ${activeSidebarTab === 'history' ? 'text-gray-100 border-b-2 border-[#FF6C37]' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveSidebarTab('history')}
        >
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {activeSidebarTab === 'collections' && (
          <div className="p-2 space-y-1">
            {/* New Collection Button / Inline Input */}
            {isCreatingCollection ? (
              <div className="flex items-center p-1.5 space-x-1">
                <FolderPlus size={14} className="text-[#FF6C37] shrink-0" />
                <input
                  ref={newCollInputRef}
                  type="text"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateCollection();
                    if (e.key === 'Escape') { setIsCreatingCollection(false); setNewCollectionName(''); }
                  }}
                  onBlur={() => { if (!newCollectionName.trim()) { setIsCreatingCollection(false); } }}
                  placeholder="Collection name"
                  className="flex-1 bg-[#303030] border border-[#FF6C37] rounded px-2 py-1 text-xs text-gray-200 outline-none"
                />
                <button 
                  onClick={handleCreateCollection}
                  className="p-1 bg-[#FF6C37] rounded text-white hover:bg-[#e66132]"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={() => { setIsCreatingCollection(false); setNewCollectionName(''); }}
                  className="p-1 hover:bg-[#303030] rounded text-gray-400"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button 
                className="flex items-center w-full p-2 text-gray-400 hover:text-white cursor-pointer hover:bg-[#303030] rounded transition-colors"
                onClick={() => setIsCreatingCollection(true)}
              >
                <Plus size={14} className="mr-1" />
                <span className="text-xs font-semibold tracking-wide">New Collection</span>
              </button>
            )}
            
            {filteredCollections.map(col => (
              <div key={col.id} className="text-sm">
                <div 
                  className="flex items-center p-1.5 hover:bg-[#303030] rounded cursor-pointer group text-gray-300"
                  onClick={() => toggleCollectionExpanded(col.id)}
                  onContextMenu={(e) => handleCollectionContextMenu(e, col.id)}
                >
                  {expandedCollections[col.id] ? (
                    <ChevronDown size={16} className="text-gray-500 mr-1 shrink-0 transition-transform" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500 mr-1 shrink-0 transition-transform" />
                  )}
                  <Folder size={16} className="text-gray-400 mr-2 shrink-0" />
                  
                  {renamingCollectionId === col.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') handleRenameCollection();
                        if (e.key === 'Escape') { setRenamingCollectionId(null); setRenameValue(''); }
                      }}
                      onClick={e => e.stopPropagation()}
                      onBlur={handleRenameCollection}
                      className="flex-1 bg-[#303030] border border-[#FF6C37] rounded px-1 py-0.5 text-xs text-gray-200 outline-none"
                    />
                  ) : (
                    <span className="truncate flex-1">{col.name}</span>
                  )}

                  <button 
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#404040] rounded"
                    onClick={(e) => handleCollectionContextMenu(e, col.id)}
                  >
                    <MoreVertical size={14} className="text-gray-400" />
                  </button>
                </div>
                
                {/* Requests */}
                {expandedCollections[col.id] && (
                  <div className="ml-6 space-y-0.5">
                    {col.requests?.map((req: any) => (
                      <div 
                        key={req.id} 
                        className="flex items-center p-1.5 hover:bg-[#303030] rounded cursor-pointer group text-gray-400 hover:text-gray-200"
                        onClick={() => handleRequestClick(req, col.id)}
                        onContextMenu={(e) => handleRequestContextMenu(e, req.id, col.id)}
                      >
                        <span className={`text-[10px] font-bold w-10 shrink-0 ${getMethodColor(req.method)}`}>
                          {req.method}
                        </span>
                        <span className="truncate flex-1 text-xs">{req.name}</span>
                        <button 
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#404040] rounded"
                          onClick={(e) => handleRequestContextMenu(e, req.id, col.id)}
                        >
                          <MoreVertical size={12} className="text-gray-400" />
                        </button>
                      </div>
                    ))}
                    {col.requests?.length === 0 && (
                      <div className="text-[10px] text-gray-600 px-2 py-1 italic">No requests</div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredCollections.length === 0 && searchQuery && (
              <div className="text-xs text-gray-500 p-4 text-center">No collections match "{searchQuery}"</div>
            )}
          </div>
        )}

        {activeSidebarTab === 'history' && (
          <div className="p-2 space-y-1">
            {/* Clear History */}
            {filteredHistory.length > 0 && (
              <div className="flex items-center justify-between p-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Recent</span>
                <button 
                  onClick={() => clearHistory()}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center space-x-1 transition-colors"
                >
                  <Trash2 size={10} />
                  <span>Clear All</span>
                </button>
              </div>
            )}

            {filteredHistory.map(entry => (
              <div 
                key={entry.id} 
                className="p-2 hover:bg-[#303030] rounded cursor-pointer group border-l-2 border-transparent hover:border-[#FF6C37] relative"
                onClick={() => handleRequestClick(entry)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className={`text-[10px] font-bold shrink-0 ${getMethodColor(entry.method)}`}>
                      {entry.method}
                    </span>
                    <span className="truncate text-xs text-gray-300">{entry.url}</span>
                  </div>
                  <button 
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#404040] rounded shrink-0 ml-1"
                    onClick={(e) => { e.stopPropagation(); deleteHistoryEntry(entry.id); }}
                    title="Delete entry"
                  >
                    <X size={12} className="text-gray-400 hover:text-red-400" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                  <span className={`${entry.status_code >= 200 && entry.status_code < 300 ? 'text-green-500' : 'text-red-500'}`}>
                    {entry.status_code || 'Err'}
                  </span>
                </div>
              </div>
            ))}

            {filteredHistory.length === 0 && !searchQuery && (
              <div className="text-xs text-gray-500 p-4 text-center">No history yet</div>
            )}
            {filteredHistory.length === 0 && searchQuery && (
              <div className="text-xs text-gray-500 p-4 text-center">No history matches "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && contextMenu.type === 'collection' && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { 
              label: 'Add Request', 
              icon: <Plus size={12} />,
              onClick: () => {
                addRequestTab({ collectionId: contextMenu.id });
              }
            },
            { 
              label: 'Rename', 
              icon: <Edit3 size={12} />,
              onClick: () => {
                const col = collections.find(c => c.id === contextMenu.id);
                setRenamingCollectionId(contextMenu.id);
                setRenameValue(col?.name || '');
              }
            },
            { 
              label: 'Delete', 
              icon: <Trash2 size={12} />,
              danger: true,
              onClick: () => {
                deleteCollection(contextMenu.id);
              }
            },
          ]}
        />
      )}

      {contextMenu && contextMenu.type === 'request' && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Open in New Tab',
              icon: <Plus size={12} />,
              onClick: () => {
                const col = collections.find(c => c.id === contextMenu.collectionId);
                const req = col?.requests?.find((r: any) => r.id === contextMenu.id);
                if (req) handleRequestClick(req, contextMenu.collectionId);
              }
            },
            { 
              label: 'Delete', 
              icon: <Trash2 size={12} />,
              danger: true,
              onClick: () => {
                deleteRequest(contextMenu.id);
              }
            },
          ]}
        />
      )}
    </div>
  );
};
