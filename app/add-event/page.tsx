'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AddEventPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    try {
      // Parse JSON to validate it
      const eventData = JSON.parse(jsonInput);

      // Submit to API
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const created = await response.json();
        setStatus(`✓ Event added successfully! ID: ${created.id}`);
        setJsonInput('');
      } else {
        const error = await response.json();
        setStatus(`✗ Error: ${error.error || 'Failed to add event'}`);
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
      name: 'Anglo-French Neutrality Convention',
      time: '1728',
      timeStart: 1728,
      timeEnd: null,
      place: 'Paris, France',
      description: 'Britain and France agree to neutrality in India despite European conflicts.',
      source: 'Cambridge History of India, Vol. 5',
      dynasty: ['British East India Company', 'French East India Company'],
      region: 'south-india',
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
          <h1 className="text-3xl font-bold mb-2">Add Timeline Event from JSON</h1>
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
                <label className="block text-sm font-medium">Event JSON</label>
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
                rows={20}
                placeholder='{\n  "name": "Event Name",\n  "time": "1728",\n  "timeStart": 1728,\n  "description": "What happened",\n  "dynasty": ["Dynasty"],\n  "place": "Location",\n  "source": "Reference"\n}'
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white rounded px-4 py-3 font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Adding Event...' : 'Add Event'}
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
              <li>
                Describe the historical event you want to add
              </li>
              <li>Ask: "Generate JSON for this event following the timelineEvent schema"</li>
              <li>Copy the JSON output</li>
              <li>Paste it above and click "Add Event"</li>
            </ol>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
              <strong>Tip:</strong> You can also ask the AI to generate multiple events as a JSON
              array, then paste them one at a time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
