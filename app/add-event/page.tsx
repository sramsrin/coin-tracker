'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TimelineEvent {
  id: string;
  name: string;
  time: string;
  timeStart: number;
  timeEnd: number | null;
  place: string;
  description: string;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  dynasty: string[];
  people?: string[];
  sideA?: string;
  sideB?: string;
  victor?: string;
  region?: string;
  partOf?: string | string[];
}

export default function AddEventPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedEvent, setAddedEvent] = useState<TimelineEvent | null>(null);
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [savingParents, setSavingParents] = useState(false);

  // Fetch all events for parent selection
  useEffect(() => {
    fetch('/api/timeline')
      .then(res => res.json())
      .then(data => setAllEvents(data))
      .catch(err => console.error('Failed to load events:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setIsSubmitting(true);

    try {
      // Parse JSON to validate it
      const eventData = JSON.parse(jsonInput);

      // Validate required fields
      const errors: string[] = [];
      if (!eventData.name || eventData.name.trim() === '') {
        errors.push('name is required and cannot be empty');
      }
      if (!eventData.time || eventData.time.trim() === '') {
        errors.push('time is required and cannot be empty');
      }
      if (!eventData.timeStart || eventData.timeStart === 0) {
        errors.push('timeStart is required and must be a valid year (not 0)');
      }
      if (!eventData.description || eventData.description.trim() === '') {
        errors.push('description is required and cannot be empty');
      }

      if (errors.length > 0) {
        setStatus(`✗ Validation failed:\n${errors.map(e => `• ${e}`).join('\n')}`);
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const created = await response.json();
        setStatus(`✓ Event added successfully! ID: ${created.id}`);
        setAddedEvent(created);
        setSelectedParents(
          Array.isArray(created.partOf)
            ? created.partOf
            : created.partOf
            ? [created.partOf]
            : []
        );
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

  const saveParents = async () => {
    if (!addedEvent) return;

    setSavingParents(true);
    try {
      const response = await fetch(`/api/timeline?id=${addedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partOf: selectedParents.length === 0 ? null : selectedParents.length === 1 ? selectedParents[0] : selectedParents,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setAddedEvent(updated);
        setStatus('✓ Parent events saved successfully!');
      } else {
        setStatus('✗ Failed to save parent events');
      }
    } catch (error) {
      setStatus(`✗ Error: ${error}`);
    } finally {
      setSavingParents(false);
    }
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

          {addedEvent && (
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-lg">Added Event Preview</h2>
                <button
                  onClick={() => setAddedEvent(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Clear
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                {/* Event Header */}
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mt-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{addedEvent.name}</h3>
                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                      <span className="font-medium">{addedEvent.time}</span>
                      {addedEvent.place && <span>• {addedEvent.place}</span>}
                      {addedEvent.verified && (
                        <span className="text-green-600 font-medium">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-3 ml-6 text-gray-700 text-sm leading-relaxed">
                  {addedEvent.description}
                </div>

                {/* Dynasty Tags */}
                {addedEvent.dynasty && addedEvent.dynasty.length > 0 && (
                  <div className="mt-3 ml-6 flex flex-wrap gap-2">
                    {addedEvent.dynasty.map((d, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* People */}
                {addedEvent.people && addedEvent.people.length > 0 && (
                  <div className="mt-2 ml-6 text-xs text-gray-600">
                    <strong>People:</strong> {addedEvent.people.join(', ')}
                  </div>
                )}

                {/* Battle Info */}
                {(addedEvent.sideA || addedEvent.sideB) && (
                  <div className="mt-2 ml-6 text-xs text-gray-600">
                    <strong>Battle:</strong> {addedEvent.sideA} vs {addedEvent.sideB}
                    {addedEvent.victor && ` • Victor: ${addedEvent.victor}`}
                  </div>
                )}

                {/* Source */}
                {addedEvent.source && (
                  <div className="mt-2 ml-6 text-xs text-gray-500 italic">
                    <strong>Source:</strong>{' '}
                    {addedEvent.sourceUrl ? (
                      <a
                        href={addedEvent.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {addedEvent.source}
                      </a>
                    ) : (
                      addedEvent.source
                    )}
                  </div>
                )}

                {/* Region */}
                {addedEvent.region && (
                  <div className="mt-2 ml-6 text-xs text-gray-500">
                    <strong>Region:</strong> {addedEvent.region}
                  </div>
                )}

                {/* View in Timeline Link */}
                <div className="mt-4 ml-6 pt-3 border-t border-gray-200">
                  <a
                    href={`/?tab=timeline&highlight=${addedEvent.id}`}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    View in Timeline →
                  </a>
                </div>
              </div>

              {/* Parent Event Selection */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">Select Parent Events (Optional)</h3>
                  {selectedParents.length > 0 && (
                    <button
                      onClick={() => setSelectedParents([])}
                      className="text-xs text-pink-600 hover:text-pink-800 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Selected parents as chips */}
                {selectedParents.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {selectedParents.map((parentId) => {
                      const parent = allEvents.find((e) => e.id === parentId);
                      return parent ? (
                        <span
                          key={parentId}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700"
                        >
                          {parent.name}
                          <button
                            onClick={() => setSelectedParents(selectedParents.filter((id) => id !== parentId))}
                            className="text-pink-500 hover:text-pink-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Search and select */}
                <div>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    {allEvents
                      .filter((e) => {
                        if (e.id === addedEvent.id) return false;
                        if (parentSearch) {
                          const searchLower = parentSearch.toLowerCase();
                          return (
                            e.name.toLowerCase().includes(searchLower) ||
                            e.time.toLowerCase().includes(searchLower) ||
                            e.place.toLowerCase().includes(searchLower)
                          );
                        }
                        return true;
                      })
                      .sort((a, b) => a.timeStart - b.timeStart)
                      .map((e) => {
                        const isSelected = selectedParents.includes(e.id);

                        return (
                          <div
                            key={e.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedParents(selectedParents.filter((id) => id !== e.id));
                              } else {
                                setSelectedParents([...selectedParents, e.id]);
                              }
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-pink-50 border-b border-gray-100 last:border-b-0 ${
                              isSelected ? 'bg-pink-100 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{e.name}</span>
                              <span className="text-xs text-gray-500">{e.time}</span>
                            </div>
                            {e.place && <div className="text-xs text-gray-500 mt-0.5">{e.place}</div>}
                          </div>
                        );
                      })}
                    {allEvents.filter((e) => {
                      if (e.id === addedEvent.id) return false;
                      if (parentSearch) {
                        const searchLower = parentSearch.toLowerCase();
                        return (
                          e.name.toLowerCase().includes(searchLower) ||
                          e.time.toLowerCase().includes(searchLower) ||
                          e.place.toLowerCase().includes(searchLower)
                        );
                      }
                      return true;
                    }).length === 0 && (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        {parentSearch ? 'No events found' : 'No events available'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={saveParents}
                  disabled={savingParents}
                  className="w-full mt-4 bg-pink-600 text-white rounded px-4 py-2 font-medium hover:bg-pink-700 disabled:bg-gray-400"
                >
                  {savingParents ? 'Saving...' : 'Save Parent Events'}
                </button>
              </div>
            </div>
          )}

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
