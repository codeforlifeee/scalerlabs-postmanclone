"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, Settings, LayoutGrid, Search, X, Bell, HelpCircle } from 'lucide-react';
import { useAppStore } from '@/store';

export const Navbar = () => {
  const { 
    sidebarOpen, setSidebarOpen, 
    environments, activeEnvironmentId, setActiveEnvironmentId, 
    setEnvironmentModalOpen, 
    activeNavbarTab, setActiveNavbarTab,
    searchQuery, setSearchQuery
  } = useAppStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchExpanded, setShowSearchExpanded] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navTabs = ['Home', 'Workspaces', 'API Network', 'Explore'];

  return (
    <div className="flex items-center justify-between h-12 bg-[#212121] border-b border-[#303030] px-4 shrink-0">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 hover:bg-[#303030] rounded text-gray-400 hover:text-white transition-colors"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center space-x-2 font-semibold text-sm tracking-wide text-gray-100">
          <span className="text-[#FF6C37] bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center">
            P
          </span>
          <span>API Client</span>
        </div>
        <div className="flex space-x-1 ml-4 text-xs font-medium text-gray-400">
          {navTabs.map(tab => (
            <button 
              key={tab}
              className={`px-3 py-1.5 rounded transition-colors ${activeNavbarTab === tab ? 'bg-[#303030] text-white' : 'hover:bg-[#303030] hover:text-white'}`}
              onClick={() => setActiveNavbarTab(tab)}
            >{tab}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center max-w-md mx-8">
        <div className="w-full bg-[#303030] rounded-md flex items-center px-3 h-8 text-sm text-gray-400 border border-[#404040] focus-within:border-[#FF6C37] focus-within:bg-[#2A2A2A] transition-colors">
          <Search size={14} className="text-gray-500 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search collections, requests, history..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full placeholder-gray-500 text-gray-200 text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-[#404040] rounded ml-1">
              <X size={12} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 text-gray-400">
        <div className="flex items-center px-3 border-r border-[#303030]">
          <select 
            value={activeEnvironmentId || ''}
            onChange={(e) => setActiveEnvironmentId(e.target.value ? Number(e.target.value) : null)}
            className="bg-transparent text-sm text-gray-300 outline-none border-none py-1 hover:text-white cursor-pointer pr-4 max-w-[150px]"
          >
            <option value="">No Environment</option>
            {environments.map((env: any) => (
              <option key={env.id} value={env.id} className="bg-[#2A2A2A]">{env.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setEnvironmentModalOpen(true)}
          className="p-1.5 hover:bg-[#303030] rounded transition-colors ml-1" 
          title="Manage Environments"
        >
          <Settings size={18} />
        </button>
        <button 
          className="p-1.5 hover:bg-[#303030] rounded transition-colors" 
          title="Notifications"
        >
          <Bell size={18} />
        </button>
        <button 
          className="p-1.5 hover:bg-[#303030] rounded transition-colors" 
          title="Help"
        >
          <HelpCircle size={18} />
        </button>
        
        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-7 h-7 rounded-full bg-[#FF6C37] text-white flex items-center justify-center ml-2 text-sm font-bold hover:ring-2 hover:ring-[#FF6C37]/50 transition-all"
          >
            <User size={16} />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-10 w-56 bg-[#2A2A2A] border border-[#404040] rounded-lg shadow-xl z-50 py-1 animate-in fade-in">
              <div className="px-4 py-3 border-b border-[#303030]">
                <div className="text-sm font-semibold text-gray-200">Local User</div>
                <div className="text-xs text-gray-500">Single-user mode</div>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#303030] transition-colors">
                Preferences
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#303030] transition-colors">
                Theme
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#303030] transition-colors">
                Keyboard Shortcuts
              </button>
              <div className="border-t border-[#303030] mt-1 pt-1">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-[#303030] transition-colors">
                  About Postman Clone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
