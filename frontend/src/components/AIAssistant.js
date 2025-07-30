import React from 'react';
import { Bot, Send, Sparkles, Zap, Award, Users, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAI } from '../hooks/useAI';

const AIAssistant = ({ 
  currentDocument, 
  onEditApply, 
  onEditReject,
  className = "" 
}) => {
  // Use the AI hook with the same parameters as before
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    handleEditAction,
    handleSuggestionClick
  } = useAI(currentDocument, onEditApply, onEditReject);

  return (
    <div className={`bg-white shadow-lg border border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <h3 className="font-semibold text-lg">AI Resume Assistant</h3>
            <p className="text-blue-100 text-sm">Powered by Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-3`}>
              <div className="flex items-start gap-2">
                {message.type === 'ai' && <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Suggestions for AI messages */}
                  {message.type === 'ai' && message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 font-medium">Quick suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Edits for AI messages */}
                  {message.type === 'ai' && message.edits && message.edits.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 font-medium">Suggested improvements:</p>
                      {message.edits.map((edit, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="text-xs text-gray-600 mb-2">{edit.reason}</div>
                          
                          {edit.action === 'replace' && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">Replace:</div>
                              <div className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-300 font-mono">
                                {edit.find}
                              </div>
                              <div className="text-xs text-gray-600">With:</div>
                              <div className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-300 font-mono">
                                {edit.replace}
                              </div>
                            </div>
                          )}
                          
                          {edit.action === 'add' && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Add:</div>
                              <div className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-300 font-mono">
                                {edit.addition}
                              </div>
                            </div>
                          )}
                          
                          {edit.action === 'remove' && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Remove:</div>
                              <div className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-300 font-mono">
                                {edit.find}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleEditAction(edit, 'accept')}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleEditAction(edit, 'reject')}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && !messages.some(msg => msg.isTyping) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm text-red-700">
                  <div className="font-medium">AI Service Unavailable</div>
                  <div className="text-xs">Please try again later or use the suggestions below.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask me anything about your resume..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden"
            style={{
              minHeight: '36px',
              maxHeight: '100px',
              height: 'auto'
            }}
                          onInput={(e) => {
                // Auto-resize the textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            disabled={loading}
            rows={1}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-1 self-end"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
