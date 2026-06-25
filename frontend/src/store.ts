import { create } from 'zustand';
import { api } from './api';
import { toast } from './components/Toast';

export type KeyValuePair = {
  id: string;
  key: string;
  value: string;
  isActive: boolean;
};

export type AuthConfig = {
  type: 'none' | 'bearer' | 'basic';
  token?: string;
  username?: string;
  password?: string;
};

export type RequestModel = {
  id: string; // Used for UI tabs (can be 'req_...' or db id)
  dbId?: number; // Actual DB ID if saved
  collectionId?: number;
  name: string;
  method: string;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyType: 'none' | 'raw' | 'form-data' | 'urlencoded';
  bodyContent: string;
  auth: AuthConfig;
  isSending?: boolean;
  response?: {
    status?: number;
    timeMs?: number;
    sizeBytes?: number;
    headers?: Record<string, string>;
    body?: string;
    error?: string;
  };
};

export type Collection = {
  id: number;
  name: string;
  description?: string;
  requests: any[];
};

export type HistoryEntry = {
  id: number;
  method: string;
  url: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
};

type AppState = {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeSidebarTab: 'collections' | 'history';
  setActiveSidebarTab: (tab: 'collections' | 'history') => void;

  activeNavbarTab: string;
  setActiveNavbarTab: (tab: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Requests State (Tabs)
  openRequests: RequestModel[];
  activeRequestId: string | null;
  addRequestTab: (request?: Partial<RequestModel>) => void;
  closeRequestTab: (id: string) => void;
  setActiveRequestId: (id: string) => void;
  updateRequest: (id: string, updates: Partial<RequestModel>) => void;

  // Data State
  collections: Collection[];
  history: HistoryEntry[];
  environments: any[];
  activeEnvironmentId: number | null;
  setActiveEnvironmentId: (id: number | null) => void;

  isEnvironmentModalOpen: boolean;
  setEnvironmentModalOpen: (open: boolean) => void;

  // Collection expandedState
  expandedCollections: Record<number, boolean>;
  toggleCollectionExpanded: (id: number) => void;
  
  // Actions
  fetchCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<void>;
  renameCollection: (id: number, name: string) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  deleteRequest: (requestId: number) => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteHistoryEntry: (id: number) => Promise<void>;
  fetchEnvironments: () => Promise<void>;
  deleteEnvironment: (id: number) => Promise<void>;
  sendActiveRequest: () => Promise<void>;
  saveActiveRequest: (collectionId: number) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  activeSidebarTab: 'collections',
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  activeNavbarTab: 'Workspaces',
  setActiveNavbarTab: (tab) => set({ activeNavbarTab: tab }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  openRequests: [],
  activeRequestId: null,

  addRequestTab: (request) => set((state) => {
    // Duplicate detection: if this request is from the DB, check if a tab with same dbId is already open
    if (request?.dbId) {
      const existingTab = state.openRequests.find(r => r.dbId === request.dbId);
      if (existingTab) {
        return { activeRequestId: existingTab.id };
      }
    }

    const newId = request?.id || `req_${Date.now()}`;
    const newReq: RequestModel = {
      id: newId,
      dbId: request?.dbId,
      collectionId: request?.collectionId,
      name: request?.name || 'Untitled Request',
      method: request?.method || 'GET',
      url: request?.url || '',
      headers: request?.headers || [],
      queryParams: request?.queryParams || [],
      bodyType: request?.bodyType || 'none',
      bodyContent: request?.bodyContent || '',
      auth: request?.auth || { type: 'none' },
    };
    return {
      openRequests: [...state.openRequests, newReq],
      activeRequestId: newId,
    };
  }),

  closeRequestTab: (id) => set((state) => {
    const filtered = state.openRequests.filter((r) => r.id !== id);
    let nextActive = state.activeRequestId;
    if (nextActive === id) {
      nextActive = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
    }
    return {
      openRequests: filtered,
      activeRequestId: nextActive,
    };
  }),

  setActiveRequestId: (id) => set({ activeRequestId: id }),

  updateRequest: (id, updates) => set((state) => {
    return {
      openRequests: state.openRequests.map((req) => {
        if (req.id !== id) return req;
        
        let newReq = { ...req, ...updates };
        
        // Sync URL and Query Params
        if ('url' in updates) {
          try {
            const urlString = newReq.url.startsWith('http') ? newReq.url : `http://dummy.com${newReq.url.startsWith('/') ? newReq.url : '/' + newReq.url}`;
            const urlObj = new URL(urlString);
            const searchParams = urlObj.searchParams;
            const newQueryParams: KeyValuePair[] = [];
            searchParams.forEach((value, key) => {
              newQueryParams.push({ id: `qp_${Date.now()}_${Math.random()}`, key, value, isActive: true });
            });
            newReq.queryParams = newQueryParams;
          } catch(e) {
            // invalid URL, ignore sync
          }
        } else if ('queryParams' in updates) {
          try {
            const urlString = newReq.url.startsWith('http') ? newReq.url : `http://dummy.com${newReq.url.startsWith('/') ? newReq.url : '/' + newReq.url}`;
            const urlObj = new URL(urlString);
            
            // clear existing
            const keys = Array.from(urlObj.searchParams.keys());
            keys.forEach(k => urlObj.searchParams.delete(k));
            
            newReq.queryParams.filter((qp: KeyValuePair) => qp.isActive && qp.key).forEach((qp: KeyValuePair) => {
              urlObj.searchParams.append(qp.key, qp.value);
            });
            
            let newUrlString = urlObj.toString();
            if (!newReq.url.startsWith('http')) {
               newUrlString = newUrlString.replace('http://dummy.com', '');
               if (newUrlString === '/' && !newReq.url.startsWith('/')) {
                   newUrlString = ''; // Handle empty
               }
            }
            newReq.url = newUrlString;
          } catch(e) {
            // invalid URL
          }
        }
        
        return newReq;
      })
    };
  }),

  collections: [],
  history: [],
  environments: [],
  activeEnvironmentId: null,
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),

  isEnvironmentModalOpen: false,
  setEnvironmentModalOpen: (open) => set({ isEnvironmentModalOpen: open }),

  expandedCollections: {},
  toggleCollectionExpanded: (id) => set((state) => ({
    expandedCollections: {
      ...state.expandedCollections,
      [id]: !state.expandedCollections[id],
    }
  })),

  fetchCollections: async () => {
    try {
      const data = await api.getCollections();
      set({ collections: data });
      // Auto-expand all collections on first fetch
      const expanded: Record<number, boolean> = {};
      data.forEach((c: Collection) => {
        const current = get().expandedCollections[c.id];
        expanded[c.id] = current !== undefined ? current : true;
      });
      set({ expandedCollections: expanded });
    } catch (e) {
      console.error("Failed to fetch collections", e);
    }
  },

  createCollection: async (name: string, description?: string) => {
    try {
      await api.createCollection(name, description);
      get().fetchCollections();
      toast.success(`Collection "${name}" created`);
    } catch (e) {
      console.error("Failed to create collection", e);
      toast.error('Failed to create collection');
    }
  },

  renameCollection: async (id: number, name: string) => {
    try {
      await api.updateCollection(id, name);
      get().fetchCollections();
      toast.success(`Collection renamed to "${name}"`);
    } catch (e) {
      console.error("Failed to rename collection", e);
      toast.error('Failed to rename collection');
    }
  },

  deleteCollection: async (id: number) => {
    try {
      await api.deleteCollection(id);
      get().fetchCollections();
      toast.success('Collection deleted');
    } catch (e) {
      console.error("Failed to delete collection", e);
      toast.error('Failed to delete collection');
    }
  },

  deleteRequest: async (requestId: number) => {
    try {
      await api.deleteRequest(requestId);
      // Close the tab if it's open
      const { openRequests, closeRequestTab } = get();
      const openTab = openRequests.find(r => r.dbId === requestId);
      if (openTab) {
        closeRequestTab(openTab.id);
      }
      get().fetchCollections();
      toast.success('Request deleted');
    } catch (e) {
      console.error("Failed to delete request", e);
      toast.error('Failed to delete request');
    }
  },

  fetchHistory: async () => {
    try {
      const data = await api.getHistory();
      set({ history: data });
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  },

  clearHistory: async () => {
    try {
      await api.clearHistory();
      set({ history: [] });
      toast.success('History cleared');
    } catch (e) {
      console.error("Failed to clear history", e);
      toast.error('Failed to clear history');
    }
  },

  deleteHistoryEntry: async (id: number) => {
    try {
      await api.deleteHistoryEntry(id);
      set((state) => ({ history: state.history.filter(h => h.id !== id) }));
    } catch (e) {
      console.error("Failed to delete history entry", e);
    }
  },

  fetchEnvironments: async () => {
    try {
      const data = await api.getEnvironments();
      set({ environments: data });
    } catch (e) {
      console.error("Failed to fetch environments", e);
    }
  },

  deleteEnvironment: async (id: number) => {
    try {
      await api.deleteEnvironment(id);
      const { activeEnvironmentId } = get();
      if (activeEnvironmentId === id) {
        set({ activeEnvironmentId: null });
      }
      get().fetchEnvironments();
      toast.success('Environment deleted');
    } catch (e) {
      console.error("Failed to delete environment", e);
      toast.error('Failed to delete environment');
    }
  },

  sendActiveRequest: async () => {
    const { activeRequestId, openRequests, updateRequest, fetchHistory, environments, activeEnvironmentId } = get();
    const req = openRequests.find((r) => r.id === activeRequestId);
    if (!req) return;

    updateRequest(req.id, { isSending: true });

    // Helper to resolve variables
    const activeEnv = environments.find(e => e.id === activeEnvironmentId);
    const resolveVars = (text: string) => {
      if (!text) return text;
      if (!activeEnv) return text;
      let resolved = text;
      activeEnv.variables.forEach((v: any) => {
        if (v.is_active && v.key) {
          const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
          resolved = resolved.replace(regex, v.value);
        }
      });
      return resolved;
    };

    // Create a copy of the request with resolved variables for sending
    const resolvedReq = {
      ...req,
      url: resolveVars(req.url),
      headers: req.headers.map(h => ({ ...h, value: resolveVars(h.value) })),
      bodyContent: resolveVars(req.bodyContent)
    };

    try {
      const res = await api.sendRequest(resolvedReq);
      updateRequest(req.id, {
        isSending: false,
        response: {
          status: res.status,
          timeMs: res.time_ms,
          sizeBytes: res.size_bytes,
          headers: res.headers,
          body: res.body,
          error: res.error,
        }
      });
      // Refresh history after sending
      fetchHistory();
      if (res.status && res.status >= 200 && res.status < 300) {
        toast.success(`${req.method} ${res.status} — ${res.time_ms}ms`);
      } else if (res.status) {
        toast.warning(`${req.method} ${res.status} — ${res.time_ms}ms`);
      }
    } catch (e: any) {
      updateRequest(req.id, {
        isSending: false,
        response: {
          error: e.message || 'Network error',
        }
      });
      toast.error(`Request failed: ${e.message || 'Network error'}`);
    }
  },

  saveActiveRequest: async (collectionId: number) => {
    const { activeRequestId, openRequests, updateRequest, fetchCollections } = get();
    const req = openRequests.find((r) => r.id === activeRequestId);
    if (!req) return;

    try {
      if (req.dbId) {
        // Update
        const res = await api.updateRequest(req.dbId, req);
        updateRequest(req.id, { name: res.name });
        toast.success('Request updated');
      } else {
        // Create
        const res = await api.saveRequest(collectionId, req);
        updateRequest(req.id, { dbId: res.id, collectionId: collectionId, name: res.name });
        toast.success('Request saved to collection');
      }
      fetchCollections();
    } catch (e) {
      console.error("Failed to save request", e);
      toast.error('Failed to save request');
    }
  }
}));
