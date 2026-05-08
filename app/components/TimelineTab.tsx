'use client';

import { useState, useEffect, useMemo } from 'react';

interface TimelineEntry {
  id: string;
  type: 'person' | 'event' | 'kingdom';
  name: string;
  time: string;
  timeStart: number;
  timeEnd: number | null;
  place: string;
  description: string;
  source: string;
  verified: boolean;
  sideA?: string;
  sideB?: string;
  victor?: string;
  partOf?: string;
  affiliations?: string[];
  relatedEntities?: string[];
}

const EMPTY_ENTRY: Omit<TimelineEntry, 'id'> = {
  type: 'event',
  name: '',
  time: '',
  timeStart: 0,
  timeEnd: null,
  place: '',
  description: '',
  source: '',
  verified: false,
};

const TYPE_COLORS: Record<TimelineEntry['type'], { border: string; bg: string; text: string }> = {
  person: { border: 'border-l-purple-500', bg: 'bg-purple-100', text: 'text-purple-700' },
  event: { border: 'border-l-pink-500', bg: 'bg-pink-100', text: 'text-pink-700' },
  kingdom: { border: 'border-l-amber-500', bg: 'bg-amber-100', text: 'text-amber-700' },
};

const TYPE_LABELS: Record<TimelineEntry['type'], string> = {
  person: 'Person',
  event: 'Event',
  kingdom: 'Kingdom',
};

function getEraLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year < 900) return `~${year} AD`;
  if (year < 1000) return '900s AD';
  if (year < 1100) return '1000s';
  if (year < 1200) return '1100s';
  if (year < 1300) return '1200s';
  if (year < 1400) return '1300s';
  if (year < 1500) return '1400s';
  if (year < 1600) return '1500s';
  if (year < 1650) return '1600-1649';
  if (year < 1700) return '1650-1699';
  if (year < 1750) return '1700-1749';
  if (year < 1800) return '1750-1799';
  if (year < 1850) return '1800-1849';
  if (year < 1900) return '1850-1899';
  return '1900+';
}

export default function TimelineTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<TimelineEntry, 'id'>>(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TimelineEntry['type'] | 'all'>('all');

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/timeline');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Failed to fetch timeline entries:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = entries;

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.place.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.time.toLowerCase().includes(q) ||
        (e.sideA && e.sideA.toLowerCase().includes(q)) ||
        (e.sideB && e.sideB.toLowerCase().includes(q)) ||
        (e.victor && e.victor.toLowerCase().includes(q)) ||
        (e.partOf && e.partOf.toLowerCase().includes(q)) ||
        (e.affiliations && e.affiliations.some((a) => a.toLowerCase().includes(q))) ||
        (e.relatedEntities && e.relatedEntities.some((r) => r.toLowerCase().includes(q)))
      );
    }

    return [...result].sort((a, b) => a.timeStart - b.timeStart);
  }, [entries, search, typeFilter]);

  // Group entries by era for year markers
  const groupedByEra = useMemo(() => {
    const groups: { era: string; entries: TimelineEntry[] }[] = [];
    let currentEra = '';
    for (const entry of filtered) {
      const era = getEraLabel(entry.timeStart);
      if (era !== currentEra) {
        currentEra = era;
        groups.push({ era, entries: [entry] });
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [filtered]);

  async function handleVerifiedToggle(entry: TimelineEntry) {
    const newVerified = !entry.verified;
    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, verified: newVerified } : e))
    );
    try {
      await fetch(`/api/timeline?id=${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: newVerified }),
      });
    } catch {
      // Revert on error
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, verified: !newVerified } : e))
      );
    }
  }

  function openEdit(entry: TimelineEntry) {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      name: entry.name,
      time: entry.time,
      timeStart: entry.timeStart,
      timeEnd: entry.timeEnd,
      place: entry.place,
      description: entry.description,
      source: entry.source,
      verified: entry.verified,
      sideA: entry.sideA || '',
      sideB: entry.sideB || '',
      victor: entry.victor || '',
      partOf: entry.partOf || '',
      affiliations: entry.affiliations || [],
      relatedEntities: entry.relatedEntities || [],
    });
  }

  function openAdd() {
    setEditingEntry(null);
    setFormData({ ...EMPTY_ENTRY });
    setShowAddForm(true);
  }

  function closeModal() {
    setEditingEntry(null);
    setShowAddForm(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        timeStart: Number(formData.timeStart) || 0,
        timeEnd: formData.timeEnd ? Number(formData.timeEnd) : null,
        affiliations: formData.affiliations?.length ? formData.affiliations : undefined,
        relatedEntities: formData.relatedEntities?.length ? formData.relatedEntities : undefined,
      };

      if (editingEntry) {
        const res = await fetch(`/api/timeline?id=${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setEntries((prev) =>
            prev.map((e) => (e.id === editingEntry.id ? updated : e))
          );
        }
      } else {
        const res = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newEntry = await res.json();
          setEntries((prev) => [...prev, newEntry]);
        }
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save entry:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingEntry) return;
    if (!confirm('Delete this timeline entry?')) return;

    try {
      await fetch(`/api/timeline?id=${editingEntry.id}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((e) => e.id !== editingEntry.id));
      closeModal();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  const showModal = editingEntry !== null || showAddForm;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search and controls */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 pb-4 pt-2">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timeline..."
              className="w-full pl-9 pr-3 py-2 border border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Type filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'person', 'event', 'kingdom'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  typeFilter === t
                    ? 'bg-pink-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
                }`}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {isAuthenticated && (
            <button
              onClick={openAdd}
              className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs font-medium transition whitespace-nowrap"
            >
              + Add Entry
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Showing {filtered.length} of {entries.length} entries
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mt-2">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200" />

        {groupedByEra.map(({ era, entries: eraEntries }) => (
          <div key={era}>
            {/* Era marker */}
            <div className="relative flex items-center mb-3 mt-6 first:mt-0">
              <div className="absolute left-2 w-5 h-5 rounded-full bg-pink-600 flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="ml-12 px-3 py-1 bg-pink-600 text-white text-xs font-bold rounded-full shadow">
                {era}
              </div>
            </div>

            {/* Entries in this era */}
            {eraEntries.map((entry) => {
              const colors = TYPE_COLORS[entry.type];
              return (
                <div key={entry.id} className="relative ml-12 mb-3">
                  {/* Connector dot */}
                  <div className="absolute -left-[2.15rem] top-3 w-2.5 h-2.5 rounded-full bg-purple-300 border-2 border-white z-10" />

                  {/* Card */}
                  <div
                    className={`border-l-4 ${entry.verified ? 'border-l-green-500' : colors.border} bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition`}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
                            {TYPE_LABELS[entry.type]}
                          </span>
                          <h3 className="font-semibold text-gray-800 text-sm">{entry.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>{entry.time}</span>
                          <span>·</span>
                          <span>{entry.place}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Verified checkbox */}
                        {isAuthenticated && (
                          <button
                            onClick={() => handleVerifiedToggle(entry)}
                            title={entry.verified ? 'Mark unverified' : 'Mark verified'}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                              entry.verified
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 text-transparent hover:border-green-400'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {!isAuthenticated && entry.verified && (
                          <span className="text-green-500" title="Verified">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}

                        {/* Edit button */}
                        {isAuthenticated && (
                          <button
                            onClick={() => openEdit(entry)}
                            className="text-gray-400 hover:text-pink-600 transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">{entry.description}</p>

                    {/* Battle details */}
                    {entry.type === 'event' && (entry.sideA || entry.sideB) && (
                      <div className="flex gap-3 mt-2 text-[10px] text-gray-500 flex-wrap">
                        {entry.sideA && <span>Side A: {entry.sideA}</span>}
                        {entry.sideB && <span>Side B: {entry.sideB}</span>}
                        {entry.victor && <span className="font-semibold">Victor: {entry.victor}</span>}
                      </div>
                    )}

                    {/* Part of */}
                    {entry.partOf && (
                      <div className="mt-1.5 text-[10px] text-purple-600">Part of: {entry.partOf}</div>
                    )}

                    {/* Affiliations */}
                    {entry.affiliations && entry.affiliations.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {entry.affiliations.map((a, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px]">{a}</span>
                        ))}
                      </div>
                    )}

                    {/* Related entities */}
                    {entry.relatedEntities && entry.relatedEntities.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {entry.relatedEntities.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{r}</span>
                        ))}
                      </div>
                    )}

                    {/* Source */}
                    <div className="mt-2 text-[10px] text-gray-400">Source: {entry.source}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            {search ? `No entries matching "${search}"` : 'No timeline entries yet'}
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h2>

              <div className="space-y-3">
                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEntry['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="person">Person</option>
                    <option value="event">Event</option>
                    <option value="kingdom">Kingdom</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Entry name"
                  />
                </div>

                {/* Time display */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time (display)</label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="~1751"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Year</label>
                    <input
                      type="number"
                      value={formData.timeStart}
                      onChange={(e) => setFormData({ ...formData, timeStart: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Year</label>
                    <input
                      type="number"
                      value={formData.timeEnd ?? ''}
                      onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="optional"
                    />
                  </div>
                </div>

                {/* Place */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Place</label>
                  <input
                    type="text"
                    value={formData.place}
                    onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Thanjavur"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source (blog post)</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                {/* Verified */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-400"
                  />
                  <span className="text-sm text-gray-700">Verified</span>
                </label>

                {/* Event-specific fields */}
                {formData.type === 'event' && (
                  <div className="border-t pt-3 mt-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">Event / Battle Details</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Side A</label>
                        <input
                          type="text"
                          value={formData.sideA || ''}
                          onChange={(e) => setFormData({ ...formData, sideA: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Side B</label>
                        <input
                          type="text"
                          value={formData.sideB || ''}
                          onChange={(e) => setFormData({ ...formData, sideB: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Victor</label>
                        <input
                          type="text"
                          value={formData.victor || ''}
                          onChange={(e) => setFormData({ ...formData, victor: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Part Of</label>
                        <input
                          type="text"
                          value={formData.partOf || ''}
                          onChange={(e) => setFormData({ ...formData, partOf: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Person-specific fields */}
                {formData.type === 'person' && (
                  <div className="border-t pt-3 mt-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">Person Details</div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Affiliations (comma-separated)</label>
                      <input
                        type="text"
                        value={(formData.affiliations || []).join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            affiliations: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="French, British, Independent"
                      />
                    </div>
                  </div>
                )}

                {/* Related entities */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Related Entities (comma-separated)</label>
                  <input
                    type="text"
                    value={(formData.relatedEntities || []).join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relatedEntities: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Chanda Sahib, Robert Clive"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-5">
                <div>
                  {editingEntry && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.name.trim()}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-sm font-medium transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
