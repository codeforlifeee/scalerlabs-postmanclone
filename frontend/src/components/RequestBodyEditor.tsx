"use client";

import React from 'react';
import { useAppStore, RequestModel, KeyValuePair } from '@/store';
import { KeyValueEditor } from './KeyValueEditor';

interface Props {
  request: RequestModel;
}

export const RequestBodyEditor: React.FC<Props> = ({ request }) => {
  const { updateRequest } = useAppStore();

  const bodyTypes = [
    { value: 'none', label: 'none' },
    { value: 'form-data', label: 'form-data' },
    { value: 'urlencoded', label: 'x-www-form-urlencoded' },
    { value: 'raw', label: 'raw' },
  ];

  // Parse bodyContent as KV pairs for form-data and urlencoded
  const getFormDataItems = (): KeyValuePair[] => {
    if (!request.bodyContent) return [];
    try {
      const parsed = JSON.parse(request.bodyContent);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // not JSON array
    }
    return [];
  };

  const handleFormDataChange = (items: KeyValuePair[]) => {
    updateRequest(request.id, { bodyContent: JSON.stringify(items) });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-2 border-b border-[#303030] shrink-0 space-x-4">
        {bodyTypes.map(type => (
          <label key={type.value} className="flex items-center cursor-pointer text-sm text-gray-300">
            <input 
              type="radio" 
              name={`body-type-${request.id}`}
              value={type.value}
              checked={request.bodyType === type.value}
              onChange={() => {
                const updates: any = { bodyType: type.value as any };
                // Initialize bodyContent for form types
                if ((type.value === 'form-data' || type.value === 'urlencoded') && !request.bodyContent) {
                  updates.bodyContent = '[]';
                }
                if (type.value === 'raw' && request.bodyContent) {
                  try {
                    JSON.parse(request.bodyContent);
                    // If it's a JSON array (from form data), clear it
                    if (request.bodyContent.startsWith('[')) {
                      updates.bodyContent = '';
                    }
                  } catch (e) {
                    // Keep existing raw content
                  }
                }
                updateRequest(request.id, updates);
              }}
              className="mr-2 accent-[#FF6C37]"
            />
            {type.label}
          </label>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {request.bodyType === 'none' && (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            This request does not have a body
          </div>
        )}

        {request.bodyType === 'raw' && (
          <textarea 
            value={request.bodyContent}
            onChange={(e) => updateRequest(request.id, { bodyContent: e.target.value })}
            className="w-full h-full bg-[#1E1E1E] text-[#D4D4D4] p-4 font-mono text-sm outline-none resize-none"
            spellCheck={false}
            placeholder={'{\n  "key": "value"\n}'}
          />
        )}

        {request.bodyType === 'form-data' && (
          <div className="h-full overflow-auto">
            <div className="px-4 py-2 text-[10px] text-gray-500 bg-[#1E1E1E] border-b border-[#303030]">
              Key-value pairs will be sent as multipart/form-data
            </div>
            <KeyValueEditor 
              items={getFormDataItems()} 
              onChange={handleFormDataChange}
              placeholderKey="Field Name"
            />
          </div>
        )}

        {request.bodyType === 'urlencoded' && (
          <div className="h-full overflow-auto">
            <div className="px-4 py-2 text-[10px] text-gray-500 bg-[#1E1E1E] border-b border-[#303030]">
              Key-value pairs will be sent as application/x-www-form-urlencoded
            </div>
            <KeyValueEditor 
              items={getFormDataItems()} 
              onChange={handleFormDataChange}
              placeholderKey="Field Name"
            />
          </div>
        )}
      </div>
    </div>
  );
};
