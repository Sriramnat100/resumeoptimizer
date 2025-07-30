import React, { useState, useEffect } from 'react';
import { Save, X, RotateCcw, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { formatResumeContent } from '../utils/resumeUtils';

const EditableSection = ({ 
  section, 
  onSave, 
  onCancel, 
  getDefaultContent,
  className = "" 
}) => {
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Initialize content when component mounts or section changes
  useEffect(() => {
    const initialContent = section.content?.text || getDefaultContent(section.title);
    setContent(initialContent);
    setHasChanges(false);
    setError(null);
  }, [section, getDefaultContent]);

  // Track changes
  useEffect(() => {
    const originalContent = section.content?.text || getDefaultContent(section.title);
    setHasChanges(content !== originalContent);
  }, [content, section, getDefaultContent]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(section.id, content);
      setHasChanges(false);
    } catch (error) {
      setError('Failed to save changes. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        const originalContent = section.content?.text || getDefaultContent(section.title);
        setContent(originalContent);
        setHasChanges(false);
        setError(null);
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleReset = () => {
    if (window.confirm('This will reset the content to the default template. Are you sure?')) {
      const defaultContent = getDefaultContent(section.title);
      setContent(defaultContent);
      setHasChanges(true);
      setError(null);
    }
  };

  const formatContent = (text) => {
    return formatResumeContent(text);
  };

  const getSectionIcon = (title) => {
    const icons = {
      'Personal Information': '👤',
      'Skills': '⚡',
      'Education': '🎓',
      'Experience': '💼',
      'Projects': '🚀',
      'Leadership & Community': '👥',
      'Awards & Honors': '🏆',
      'Certifications': '📜'
    };
    return icons[title] || '📝';
  };

  const getCharacterCount = () => {
    return content.length;
  };

  const getWordCount = () => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getSectionIcon(section.title)}</span>
            <div>
              <h3 className="font-semibold text-lg">Edit {section.title}</h3>
              <p className="text-blue-100 text-sm">Make your changes below</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
              title={isPreview ? "Switch to edit mode" : "Preview changes"}
            >
              {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-6">
        {isPreview ? (
          /* Preview Mode */
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-700 mb-3">Preview:</h4>
              <div className="prose prose-sm max-w-none">
                {formatContent(content)}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Characters: {getCharacterCount()}</span>
              <span>Words: {getWordCount()}</span>
              {hasChanges && (
                <span className="text-orange-600 font-medium">• Unsaved changes</span>
              )}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setError(null);
                }}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                placeholder={`Enter your ${section.title.toLowerCase()}...\n\nUse bullet points (•) for lists\nUse **bold** for emphasis\nKeep professional formatting`}
                autoFocus
              />
              
              {/* Character counter */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {getCharacterCount()} chars
              </div>
            </div>

            {/* Formatting Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Formatting Tips:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                <div>• Use <code className="bg-blue-100 px-1 rounded">-</code> for bullet points</div>
                <div>• Use <code className="bg-blue-100 px-1 rounded">**text**</code> for bold</div>
                <div>• Keep consistent spacing</div>
                <div>• Use professional language</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-sm"
              title="Reset to default template"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Status */}
        {hasChanges && !isSaving && (
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
            <AlertCircle size={14} />
            <span>You have unsaved changes</span>
          </div>
        )}
        
        {!hasChanges && !isSaving && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle size={14} />
            <span>All changes saved</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableSection;
