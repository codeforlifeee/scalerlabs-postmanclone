import React from 'react';
import { KeyValuePair } from '@/store';
import { Trash2 } from 'lucide-react';

interface Props {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  placeholderKey?: string;
}

export const KeyValueEditor: React.FC<Props> = ({ items, onChange, placeholderKey = 'Key' }) => {
  // Always keep an empty row at the end
  const displayItems = [...items];
  if (displayItems.length === 0 || displayItems[displayItems.length - 1].key !== '' || displayItems[displayItems.length - 1].value !== '') {
    displayItems.push({ id: `temp_${Date.now()}`, key: '', value: '', isActive: true });
  }

  const handleChange = (id: string, field: 'key' | 'value' | 'isActive', value: string | boolean) => {
    let newItems = [...displayItems];
    const index = newItems.findIndex(i => i.id === id);
    if (index !== -1) {
      newItems[index] = { ...newItems[index], [field]: value };
      
      // If we typed in the last empty row, it's no longer the temporary row
      // We will just update it. The next render will add a new empty row.
    }
    
    // Filter out rows that are completely empty (except the last one which might be empty)
    // Actually, we should let them be empty until blur, but for simplicity we just remove empty rows that are not the last one
    newItems = newItems.filter((item, i) => {
      if (i === newItems.length - 1) return true; // keep the last one always (it will be stripped before saving)
      return item.key !== '' || item.value !== '';
    });

    // When passing up, remove the empty rows
    const cleanItems = newItems.filter(item => item.key !== '' || item.value !== '');
    onChange(cleanItems);
  };

  const handleDelete = (id: string) => {
    const cleanItems = items.filter(item => item.id !== id);
    onChange(cleanItems);
  };

  return (
    <div className="w-full text-sm">
      <div className="flex border-b border-[#303030] text-gray-400 font-semibold text-xs py-2 px-4">
        <div className="w-8 shrink-0"></div>
        <div className="flex-1 px-2 border-r border-[#303030]">KEY</div>
        <div className="flex-1 px-2">VALUE</div>
        <div className="w-10 shrink-0"></div>
      </div>
      
      {displayItems.map((item, i) => (
        <div key={item.id} className="flex border-b border-[#303030] group hover:bg-[#2A2A2A] items-stretch">
          <div className="w-8 shrink-0 flex items-center justify-center border-r border-[#303030]">
            {(item.key || item.value) && (
              <input 
                type="checkbox" 
                checked={item.isActive} 
                onChange={(e) => handleChange(item.id, 'isActive', e.target.checked)}
                className="accent-[#FF6C37]"
              />
            )}
          </div>
          <div className="flex-1 border-r border-[#303030]">
            <input 
              type="text" 
              value={item.key}
              onChange={(e) => handleChange(item.id, 'key', e.target.value)}
              placeholder={placeholderKey}
              className="w-full h-full bg-transparent outline-none px-3 py-2 text-gray-200 placeholder-gray-600 focus:bg-[#303030]"
            />
          </div>
          <div className="flex-1">
            <input 
              type="text" 
              value={item.value}
              onChange={(e) => handleChange(item.id, 'value', e.target.value)}
              placeholder="Value"
              className="w-full h-full bg-transparent outline-none px-3 py-2 text-gray-200 placeholder-gray-600 focus:bg-[#303030]"
            />
          </div>
          <div className="w-10 shrink-0 flex items-center justify-center">
            {(item.key || item.value) && (
              <button 
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#404040] rounded text-gray-400 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
