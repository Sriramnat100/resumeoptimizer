import React, { useState } from 'react';
import { Tag, Plus, Edit3, Trash2, X, AlertCircle } from 'lucide-react';

const LabelManager = ({
  labels = [],
  selectedLabel = 'all',
  documents = [],
  onLabelSelect,
  onCreateLabel,
  onDeleteLabel,
  onEditLabel,
  className = ""
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const colorOptions = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
    { name: 'pink', class: 'bg-pink-500' },
    { name: 'indigo', class: 'bg-indigo-500' },
    { name: 'teal', class: 'bg-teal-500' },
    { name: 'cyan', class: 'bg-cyan-500' }
  ];

  const getLabelColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200'
    };
    return colors[color] || colors.blue;
  };

  const getDocumentCount = (labelId) => {
    if (labelId === 'all') return documents.filter(doc => doc).length; // Add safety check
    return documents.filter(doc => doc && doc.label === labelId).length; // Add safety check
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      setError('Label name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName('');
      setNewLabelColor('blue');
      setShowCreateForm(false);
    } catch (error) {
      setError('Failed to create label. Please try again.');
      console.error('Create label error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLabel = async () => {
    if (!newLabelName.trim()) {
      setError('Label name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onEditLabel(editingLabel.id, newLabelName.trim(), newLabelColor);
      setNewLabelName('');
      setNewLabelColor('blue');
      setEditingLabel(null);
      setShowEditForm(false);
    } catch (error) {
      setError('Failed to update label. Please try again.');
      console.error('Edit label error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLabel = async (label) => {
    const documentCount = getDocumentCount(label.id);
    
    if (documentCount > 0) {
      const confirmed = window.confirm(
        `This label is used by ${documentCount} document(s). Are you sure you want to delete it? Documents will lose their label.`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(`Are you sure you want to delete "${label.name}"?`);
      if (!confirmed) return;
    }

    try {
      await onDeleteLabel(label.id);
      // Remove this line that was causing navigation to create form
      // setShowCreateForm(true);
      setError(null); // Clear any previous errors
    } catch (error) {
      setError('Failed to delete label. Please try again.');
      console.error('Delete label error:', error);
    }
  };

  const openEditForm = (label) => {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setNewLabelColor(label.color);
    setShowEditForm(true);
    setError(null);
  };

  const closeForms = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingLabel(null);
    setNewLabelName('');
    setNewLabelColor('blue');
    setError(null);
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Tag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filter Documents</h3>
            <p className="text-sm text-gray-500">Organize your resumes with labels</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          New Label
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onLabelSelect('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            selectedLabel === 'all'
              ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <div className="flex items-center gap-2">
            <Tag size={14} />
            All Documents ({getDocumentCount('all')})
          </div>
        </button>
        
        {labels.map(label => (
          <div key={label.id} className="relative group">
            <button
              onClick={() => onLabelSelect(label.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedLabel === label.id
                  ? 'shadow-md'
                  : 'hover:bg-gray-50'
              } ${getLabelColor(label.color)}`}
            >
              <div className={`w-3 h-3 rounded-full ${colorOptions.find(c => c.name === label.color)?.class}`} />
              {label.name} ({getDocumentCount(label.id)})
            </button>
            
            {/* Edit/Delete Menu */}
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-[120px]">
              <button
                onClick={() => openEditForm(label)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteLabel(label)}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {labels.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No labels created yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first label to organize documents</p>
        </div>
      )}

      {/* Create Label Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Label</h3>
              <button
                onClick={closeForms}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label Name</label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="e.g., Frontend, Backend, Data Science..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateLabel()}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setNewLabelColor(color.name)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        newLabelColor === color.name 
                          ? 'border-gray-800 scale-110 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400'
                      } ${color.class}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateLabel}
                disabled={isSubmitting || !newLabelName.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Label'}
              </button>
              <button
                onClick={closeForms}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Label Modal */}
      {showEditForm && editingLabel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Label</h3>
              <button
                onClick={closeForms}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label Name</label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="e.g., Frontend, Backend, Data Science..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleEditLabel()}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setNewLabelColor(color.name)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        newLabelColor === color.name 
                          ? 'border-gray-800 scale-110 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400'
                      } ${color.class}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditLabel}
                disabled={isSubmitting || !newLabelName.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update Label'}
              </button>
              <button
                onClick={closeForms}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelManager;
