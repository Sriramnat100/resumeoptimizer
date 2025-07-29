import React, { useState } from 'react';
import { Tag, ChevronDown, Check } from 'lucide-react';

const DocumentLabelSelector = ({ 
  document, 
  labels, 
  onLabelChange, 
  getLabelColor,
  className = "",
  onDropdownToggle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentLabel = labels.find(l => l.id === document.label);
  
  const handleLabelChange = async (labelId) => {
    try {
      setIsUpdating(true);
      await onLabelChange(document.id, labelId);
      setIsOpen(false);
      if (onDropdownToggle) {
        onDropdownToggle(document.id, false);
      }
    } catch (error) {
      console.error('Failed to update document label:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const removeLabel = async () => {
    console.log('🗑️ [REMOVE] removeLabel function called!');
    console.log('🗑️ [REMOVE] Document:', document);
    console.log('🗑️ [REMOVE] Document ID:', document.id);
    console.log('🗑️ [REMOVE] Current document label:', document.label);
    console.log('🗑️ [REMOVE] Labels array:', labels);
    console.log('🗑️ [REMOVE] Current label object:', currentLabel);
    console.log('🗑️ [REMOVE] onLabelChange function type:', typeof onLabelChange);
    console.log('🗑️ [REMOVE] onLabelChange function:', onLabelChange);
    
    if (!onLabelChange) {
      console.error('❌ [REMOVE] onLabelChange is not provided!');
      alert('Error: Label change handler not available');
      return;
    }
    
    try {
      console.log('🗑️ [REMOVE] Setting isUpdating to true...');
      setIsUpdating(true);
      console.log('🗑️ [REMOVE] Calling onLabelChange with document.id:', document.id, 'and null label...');
      
      const result = await onLabelChange(document.id, null);
      
      console.log('✅ [REMOVE] onLabelChange completed successfully!');
      console.log('✅ [REMOVE] Result:', result);
      
      console.log('🗑️ [REMOVE] Closing dropdown...');
      setIsOpen(false);
      if (onDropdownToggle) {
        onDropdownToggle(document.id, false);
      }
      console.log('✅ [REMOVE] Label removal process completed!');
    } catch (error) {
      console.error('❌ [REMOVE] Failed to remove document label:', error);
      console.error('❌ [REMOVE] Error name:', error.name);
      console.error('❌ [REMOVE] Error message:', error.message);
      console.error('❌ [REMOVE] Error stack:', error.stack);
      console.error('❌ [REMOVE] Error response:', error.response);
      console.error('❌ [REMOVE] Error response data:', error.response?.data);
      console.error('❌ [REMOVE] Error response status:', error.response?.status);
      
      // Show user-friendly error message
      alert(`Failed to remove label: ${error.message}`);
    } finally {
      console.log('🗑️ [REMOVE] Setting isUpdating to false...');
      setIsUpdating(false);
      console.log('🗑️ [REMOVE] removeLabel function completed');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          if (onDropdownToggle) {
            onDropdownToggle(document.id, newIsOpen);
          }
        }}
        disabled={isUpdating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
          currentLabel 
            ? `${getLabelColor(currentLabel.color)} hover:opacity-80` 
            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Tag size={14} />
        <span className="text-xs font-medium">
          {currentLabel ? currentLabel.name : 'Add Label'}
        </span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-2">
            {/* Available Labels */}
            {labels.length > 0 ? (
              <div className="space-y-1">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelChange(label.id)}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-left text-sm transition-colors ${
                      document.label === label.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${label.color}-500`}></div>
                      <span>{label.name}</span>
                    </div>
                    {document.label === label.id && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No labels available
              </div>
            )}
            
            {/* Divider */}
            {labels.length > 0 && (
              <div className="border-t border-gray-200 my-2"></div>
            )}
            
            {/* Remove Label Option */}
            {document.label && (
              <button
                onClick={(e) => {
                  console.log('🗑️ [CLICK] Remove Label button clicked!', e);
                  e.preventDefault();
                  e.stopPropagation();
                  removeLabel();
                }}
                disabled={isUpdating}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm text-red-600 hover:bg-red-50 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                Remove Label
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default DocumentLabelSelector;
