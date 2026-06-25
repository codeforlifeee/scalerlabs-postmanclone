"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { X, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { api } from '@/api';

export const EnvironmentModal = () => {
  const { isEnvironmentModalOpen, setEnvironmentModalOpen, environments, fetchEnvironments, deleteEnvironment } = useAppStore();
  const [newEnvName, setNewEnvName] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [renamingEnvId, setRenamingEnvId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for variables of the selected environment
  // We track which are from DB (have 'id') and which are new
  const [variables, setVariables] = useState<Array<{ id?: number; key: string; value: string; isActive: boolean; _deleted?: boolean }>>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load variables when a different env is selected
  React.useEffect(() => {
    if (selectedEnvId) {
      const env = environments.find(e => e.id === selectedEnvId);
      if (env) {
        const vars = env.variables.map((v: any) => ({
          id: v.id,
          key: v.key,
          value: v.value,
          isActive: v.is_active,
        }));
        setVariables([...vars, { key: '', value: '', isActive: true }]);
        setHasChanges(false);
      }
    } else {
      setVariables([]);
      setHasChanges(false);
    }
  }, [selectedEnvId, environments]);

  if (!isEnvironmentModalOpen) return null;

  const handleCreateEnv = async () => {
    if (!newEnvName.trim()) return;
    try {
      const newEnv = await api.createEnvironment(newEnvName.trim());
      setNewEnvName('');
      await fetchEnvironments();
      setSelectedEnvId(newEnv.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameEnv = async (envId: number) => {
    if (!renameValue.trim()) return;
    try {
      await api.updateEnvironment(envId, renameValue.trim());
      setRenamingEnvId(null);
      setRenameValue('');
      await fetchEnvironments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEnv = async (envId: number) => {
    if (!window.confirm('Delete this environment and all its variables?')) return;
    try {
      if (selectedEnvId === envId) {
        setSelectedEnvId(null);
      }
      await deleteEnvironment(envId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVariables = async () => {
    if (!selectedEnvId) return;
    setIsSaving(true);
    
    try {
      const env = environments.find(e => e.id === selectedEnvId);
      const existingVarIds = new Set((env?.variables || []).map((v: any) => v.id));
      
      // Process each variable
      for (const v of variables) {
        if (v._deleted && v.id) {
          // Delete from backend
          await api.deleteEnvironmentVariable(selectedEnvId, v.id);
        } else if (v.id && existingVarIds.has(v.id) && v.key.trim()) {
          // Update existing
          await api.updateEnvironmentVariable(selectedEnvId, v.id, {
            key: v.key,
            value: v.value,
            is_active: v.isActive,
          });
        } else if (!v.id && v.key.trim()) {
          // Create new
          await api.createEnvironmentVariable(selectedEnvId, v.key, v.value, v.isActive);
        }
      }
      
      await fetchEnvironments();
      setHasChanges(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    // Add empty row if last is filled
    if (index === newVars.length - 1 && (newVars[index].key || newVars[index].value)) {
      newVars.push({ key: '', value: '', isActive: true });
    }
    setVariables(newVars);
    setHasChanges(true);
  };

  const handleDelete = (index: number) => {
    const v = variables[index];
    if (v.id) {
      // Mark as deleted instead of removing (so we can delete from backend on save)
      const newVars = [...variables];
      newVars[index] = { ...newVars[index], _deleted: true };
      setVariables(newVars);
    } else {
      // Just remove new vars
      const newVars = [...variables];
      newVars.splice(index, 1);
      setVariables(newVars);
    }
    setHasChanges(true);
  };

  const visibleVariables = variables.filter(v => !v._deleted);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEnvironmentModalOpen(false)}>
      <div className="bg-[#212121] border border-[#303030] rounded-lg shadow-xl w-full max-w-3xl flex flex-col h-[500px]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#303030]">
          <h2 className="text-gray-100 font-semibold text-lg">Manage Environments</h2>
          <button onClick={() => setEnvironmentModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: List of environments */}
          <div className="w-1/3 border-r border-[#303030] flex flex-col">
            <div className="p-4 border-b border-[#303030]">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New Environment"
                  value={newEnvName}
                  onChange={e => setNewEnvName(e.target.value)}
                  className="flex-1 bg-[#303030] border border-[#404040] rounded px-2 py-1 text-sm text-gray-200 outline-none focus:border-[#FF6C37]"
                  onKeyDown={e => e.key === 'Enter' && handleCreateEnv()}
                />
                <button onClick={handleCreateEnv} className="p-1 bg-[#FF6C37] rounded text-white hover:bg-[#e66132] transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {environments.map(env => (
                <div
                  key={env.id}
                  className={`flex items-center p-2 rounded cursor-pointer text-sm mb-1 group ${selectedEnvId === env.id ? 'bg-[#303030] text-gray-100' : 'text-gray-400 hover:bg-[#2A2A2A]'}`}
                >
                  {renamingEnvId === env.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameEnv(env.id);
                        if (e.key === 'Escape') { setRenamingEnvId(null); setRenameValue(''); }
                      }}
                      onBlur={() => handleRenameEnv(env.id)}
                      autoFocus
                      className="flex-1 bg-[#303030] border border-[#FF6C37] rounded px-1 py-0.5 text-xs text-gray-200 outline-none"
                    />
                  ) : (
                    <span className="flex-1 truncate" onClick={() => setSelectedEnvId(env.id)}>{env.name}</span>
                  )}
                  <div className="flex items-center space-x-0.5 ml-1 opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRenamingEnvId(env.id); setRenameValue(env.name); }}
                      className="p-1 hover:bg-[#404040] rounded text-gray-400 hover:text-gray-200"
                      title="Rename"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteEnv(env.id); }}
                      className="p-1 hover:bg-[#404040] rounded text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {environments.length === 0 && (
                <div className="text-xs text-gray-500 p-4 text-center">No environments yet</div>
              )}
            </div>
          </div>

          {/* Main: Edit selected environment */}
          <div className="w-2/3 flex flex-col">
            {selectedEnvId ? (
              <>
                <div className="p-4 text-sm font-semibold text-gray-300 border-b border-[#303030] flex justify-between items-center">
                  <span>Variables for {environments.find(e => e.id === selectedEnvId)?.name}</span>
                  <button 
                    onClick={handleSaveVariables} 
                    disabled={!hasChanges || isSaving}
                    className={`px-3 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${
                      hasChanges 
                        ? 'bg-[#FF6C37] text-white hover:bg-[#e66132]' 
                        : 'bg-[#303030] text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? (
                      <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : hasChanges ? (
                      <Check size={12} />
                    ) : null}
                    <span>{isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="flex border-b border-[#303030] text-gray-400 font-semibold text-xs py-2 px-4">
                    <div className="w-8 shrink-0"></div>
                    <div className="flex-1 px-2 border-r border-[#303030]">VARIABLE</div>
                    <div className="flex-1 px-2">VALUE</div>
                    <div className="w-8 shrink-0"></div>
                  </div>
                  {visibleVariables.map((item, i) => {
                    // Find the real index in the full (unfiltered) array
                    const realIndex = variables.indexOf(item);
                    return (
                      <div key={`${item.id || 'new'}_${i}`} className="flex border-b border-[#303030] group hover:bg-[#2A2A2A] items-stretch text-sm">
                        <div className="w-8 shrink-0 flex items-center justify-center border-r border-[#303030]">
                          {(item.key || item.value) && (
                            <input 
                              type="checkbox" 
                              checked={item.isActive} 
                              onChange={(e) => handleChange(realIndex, 'isActive', e.target.checked)}
                              className="accent-[#FF6C37]"
                            />
                          )}
                        </div>
                        <div className="flex-1 border-r border-[#303030]">
                          <input 
                            type="text" 
                            value={item.key}
                            onChange={(e) => handleChange(realIndex, 'key', e.target.value)}
                            placeholder="variable_name"
                            className="w-full h-full bg-transparent outline-none px-3 py-2 text-gray-200 placeholder-gray-600 focus:bg-[#303030]"
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={item.value}
                            onChange={(e) => handleChange(realIndex, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-full h-full bg-transparent outline-none px-3 py-2 text-gray-200 placeholder-gray-600 focus:bg-[#303030]"
                          />
                        </div>
                        <div className="w-8 shrink-0 flex items-center justify-center">
                          {(item.key || item.value) && (
                            <button 
                              onClick={() => handleDelete(realIndex)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#404040] rounded text-gray-400 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Select an environment to edit its variables.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
