'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Theme {
  id: string;
  bookPart: string;
  title?: string;
  text: string;
  source?: string;
  sourceUrl?: string;
}

const BOOK_PART_LABELS: Record<string, string> = {
  'before-part-1': 'Before Part 1 (Before 1690)',
  'part-1': 'Part 1: Masters of Tamil Nadu (1690-1740)',
  'part-2': 'Part 2: Pawns in Battle (1740-1754)',
  'part-3': 'Part 3: Paupers Drowning in Debt (1754-1787)',
  'part-4': 'Part 4: Phantom Rulers (1787-1807)',
  'after-part-4': 'After Part 4 (After 1807)',
};

export default function AddThemePage() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedTheme, setAddedTheme] = useState<Theme | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    try {
      // Parse JSON to validate it
      const themeData = JSON.parse(jsonInput);

      // Validate required fields
      const errors: string[] = [];
      if (!themeData.bookPart) {
        errors.push('bookPart is required');
      } else if (!['before-part-1', 'part-1', 'part-2', 'part-3', 'part-4', 'after-part-4'].includes(themeData.bookPart)) {
        errors.push('bookPart must be one of: before-part-1, part-1, part-2, part-3, part-4, after-part-4');
      }
      if (!themeData.text || themeData.text.trim() === '') {
        errors.push('text is required and cannot be empty');
      }

      if (errors.length > 0) {
        setStatus(`✗ Validation failed:\n${errors.map(e => `• ${e}`).join('\n')}`);
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeData),
      });

      if (response.ok) {
        const created = await response.json();
        setStatus(`✓ Theme added successfully! ID: ${created.id}`);
        setAddedTheme(created);
        setJsonInput('');
      } else {
        const error = await response.json();
        setStatus(`✗ Error: ${error.error || 'Failed to add theme'}`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setStatus('✗ Invalid JSON format. Please check your syntax.');
      } else {
        setStatus(`✗ Error: ${error}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExample = () => {
    const example = {
      bookPart: 'part-1',
      title: 'Consolidation of Control',
      text: 'During this period, the British East India Company consolidated power through strategic alliances with local rulers.',
      source: 'Chapter 3',
    };
    setJsonInput(JSON.stringify(example, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Timeline
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-2">Add Book Part Theme from JSON</h1>
          <p className="text-gray-600 mb-6">
            Paste JSON from ChatGPT/Gemini below. They can read the schema at{' '}
            <a
              href="/api/timeline/schema"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              /api/timeline/schema
            </a>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Theme JSON</label>
                <button
                  type="button"
                  onClick={loadExample}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Load Example
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full border rounded px-3 py-2 font-mono text-sm"
                rows={15}
                placeholder='{\n  "bookPart": "part-1",\n  "title": "Theme Title",\n  "text": "Theme content...",\n  "source": "Reference"\n}'
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white rounded px-4 py-3 font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Adding Theme...' : 'Add Theme'}
            </button>

            {status && (
              <div
                className={`p-4 rounded ${
                  status.startsWith('✓')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {status}
              </div>
            )}
          </form>

          {addedTheme && (
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-lg">Added Theme Preview</h2>
                <button
                  onClick={() => setAddedTheme(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Clear
                </button>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-5 shadow-sm">
                {/* Book Part Badge */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-semibold">
                    {BOOK_PART_LABELS[addedTheme.bookPart] || addedTheme.bookPart}
                  </span>
                </div>

                {/* Title */}
                {addedTheme.title && (
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {addedTheme.title}
                  </h3>
                )}

                {/* Text Content */}
                <div className="text-gray-700 text-sm leading-relaxed italic">
                  {addedTheme.text}
                </div>

                {/* Source */}
                {addedTheme.source && (
                  <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-gray-600">
                    <strong>Source:</strong>{' '}
                    {addedTheme.sourceUrl ? (
                      <a
                        href={addedTheme.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {addedTheme.source}
                      </a>
                    ) : (
                      addedTheme.source
                    )}
                  </div>
                )}

                {/* View in Timeline Link */}
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <a
                    href="/?tab=timeline"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    View in Timeline →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

          <div className="mt-8 pt-6 border-t space-y-4">
            <h2 className="font-semibold text-lg">How to Use with ChatGPT/Gemini</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Tell the AI: "Read the schema at{' '}
                <code className="bg-gray-100 px-1 rounded">
                  https://coin-tracker-snowy.vercel.app/api/timeline/schema
                </code>
                "
              </li>
              <li>Describe the theme or narrative you want to add</li>
              <li>Ask: "Generate JSON for this theme following the theme schema"</li>
              <li>Copy the JSON output</li>
              <li>Paste it above and click "Add Theme"</li>
            </ol>

            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm">
              <strong>Book Part Options:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• <code>before-part-1</code> - Before 1690</li>
                <li>• <code>part-1</code> - Part 1: Masters of Tamil Nadu (1690-1740)</li>
                <li>• <code>part-2</code> - Part 2: Pawns in Battle (1740-1754)</li>
                <li>• <code>part-3</code> - Part 3: Paupers Drowning in Debt (1754-1787)</li>
                <li>• <code>part-4</code> - Part 4: Phantom Rulers (1787-1807)</li>
                <li>• <code>after-part-4</code> - After 1807</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
