'use client';

import { useState, useEffect } from 'react';
import { Copy, Trash2, Plus, Check, AlertCircle } from 'lucide-react';

interface ExtensionToken {
  id: string;
  name: string | null;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date;
}

export function ExtensionTokens() {
  const [tokens, setTokens] = useState<ExtensionToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [showNewTokenDialog, setShowNewTokenDialog] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const response = await fetch('/api/extension/token');
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  const handleGenerateToken = async () => {
    if (!newTokenName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/extension/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedToken(data.token);
        setNewTokenName('');
        await loadTokens();
      }
    } catch (error) {
      console.error('Error generating token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token? Extensions using it will stop working.')) {
      return;
    }

    try {
      const response = await fetch(`/api/extension/token?id=${tokenId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTokens();
      }
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;

    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying token:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Extension Tokens</h2>
        <p className="text-sm text-gray-600">
          Generate tokens to connect the Chrome extension to your account. Tokens expire after 90 days.
        </p>
      </div>

      {/* Generate New Token Dialog */}
      {showNewTokenDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Extension Token
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="token-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Token Name
                </label>
                <input
                  id="token-name"
                  type="text"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="e.g., Work Laptop, Personal Chrome"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewTokenDialog(false);
                    setNewTokenName('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateToken}
                  disabled={!newTokenName.trim() || loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Token Display */}
      {generatedToken && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900 mb-2">Token Generated Successfully</h4>
              <p className="text-sm text-green-800 mb-3">
                Copy this token now. For security reasons, you won&apos;t be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono break-all">
                  {generatedToken}
                </code>
                <button
                  onClick={handleCopyToken}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setGeneratedToken(null)}
            className="mt-3 text-sm text-green-700 hover:text-green-800"
          >
            I&apos;ve saved the token
          </button>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={() => setShowNewTokenDialog(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Generate New Token
      </button>

      {/* Token List */}
      <div className="space-y-3">
        {tokens.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No extension tokens yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Generate a token to connect the Chrome extension
            </p>
          </div>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{token.name || 'Unnamed Token'}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>
                    Created {new Date(token.createdAt).toLocaleDateString()}
                  </span>
                  {token.lastUsed && (
                    <span>
                      Last used {new Date(token.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                  <span>
                    Expires {new Date(token.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRevokeToken(token.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Revoke token"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
