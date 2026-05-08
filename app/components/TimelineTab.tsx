'use client';

import { useState, useEffect, useMemo } from 'react';

interface TimelineEntry {
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
  partOf?: string;
}

const EMPTY_ENTRY: Omit<TimelineEntry, 'id'> = {
  name: '',
  time: '',
  timeStart: 0,
  timeEnd: null,
  place: '',
  description: '',
  source: '',
  sourceUrl: '',
  verified: false,
  dynasty: [],
  people: [],
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

export default function TimelineTab({ isAuthenticated, defaultDynastyFilters }: { isAuthenticated: boolean; defaultDynastyFilters?: string[] }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<TimelineEntry, 'id'>>(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [dynastyFilter, setDynastyFilter] = useState<string>('all');
  const [multiDynastyFilter, setMultiDynastyFilter] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // When defaultDynastyFilters changes (e.g. navigating from Explore tab), apply multi-dynasty filter
  useEffect(() => {
    if (defaultDynastyFilters && defaultDynastyFilters.length > 0) {
      setMultiDynastyFilter(defaultDynastyFilters);
      setDynastyFilter('__multi__');
    }
  }, [defaultDynastyFilters]);

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

  // Get unique dynasties for filter dropdown
  const dynasties = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.dynasty) e.dynasty.forEach((d) => set.add(d));
    });
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;

    if (dynastyFilter === '__multi__' && multiDynastyFilter.length > 0) {
      result = result.filter((e) =>
        e.dynasty.some(d => multiDynastyFilter.includes(d)) ||
        (e.sideA && multiDynastyFilter.some(d => e.sideA!.includes(d))) ||
        (e.sideB && multiDynastyFilter.some(d => e.sideB!.includes(d)))
      );
    } else if (dynastyFilter !== 'all' && dynastyFilter !== '__multi__') {
      result = result.filter((e) =>
        e.dynasty.includes(dynastyFilter) ||
        e.sideA?.includes(dynastyFilter) ||
        e.sideB?.includes(dynastyFilter)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.place.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.time.toLowerCase().includes(q) ||
        e.dynasty.some(d => d.toLowerCase().includes(q)) ||
        (e.sideA && e.sideA.toLowerCase().includes(q)) ||
        (e.sideB && e.sideB.toLowerCase().includes(q)) ||
        (e.victor && e.victor.toLowerCase().includes(q)) ||
        (e.partOf && e.partOf.toLowerCase().includes(q)) ||
        (e.people && e.people.some((p) => p.toLowerCase().includes(q)))
      );
    }

    return [...result].sort((a, b) => a.timeStart - b.timeStart);
  }, [entries, search, dynastyFilter, multiDynastyFilter]);

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
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, verified: !newVerified } : e))
      );
    }
  }

  function openEdit(entry: TimelineEntry) {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      time: entry.time,
      timeStart: entry.timeStart,
      timeEnd: entry.timeEnd,
      place: entry.place,
      description: entry.description,
      source: entry.source,
      sourceUrl: entry.sourceUrl || '',
      verified: entry.verified,
      dynasty: entry.dynasty || [],
      people: entry.people || [],
      sideA: entry.sideA || '',
      sideB: entry.sideB || '',
      victor: entry.victor || '',
      partOf: entry.partOf || '',
    });
  }

  function openAdd() {
    setEditingEntry(null);
    setFormData({ ...EMPTY_ENTRY, people: [] });
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
        people: formData.people?.length ? formData.people : undefined,
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

  const isBattle = (e: TimelineEntry) => !!(e.sideA || e.sideB);
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
              placeholder="Search events, people, dynasties..."
              className="w-full pl-9 pr-3 py-2 border border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Dynasty filter */}
          <div className="flex items-center gap-1">
            <select
              value={dynastyFilter}
              onChange={(e) => {
                setDynastyFilter(e.target.value);
                if (e.target.value !== '__multi__') {
                  setMultiDynastyFilter([]);
                }
              }}
              className="px-3 py-2 border border-purple-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">All Dynasties</option>
              {dynastyFilter === '__multi__' && (
                <option value="__multi__">Filtered ({multiDynastyFilter.length} {multiDynastyFilter.length === 1 ? 'dynasty' : 'dynasties'})</option>
              )}
              {dynasties.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {dynastyFilter !== 'all' && (
              <button
                onClick={() => { setDynastyFilter('all'); setMultiDynastyFilter([]); }}
                className="px-2 py-2 text-xs text-pink-600 hover:text-pink-800 font-medium"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          {isAuthenticated && (
            <button
              onClick={openAdd}
              className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs font-medium transition whitespace-nowrap"
            >
              + Add Event
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Showing {filtered.length} of {entries.length} events
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

            {eraEntries.map((entry) => {
              const battle = isBattle(entry);
              return (
                <div key={entry.id} className="relative ml-12 mb-3">
                  {/* Connector dot */}
                  <div className={`absolute -left-[2.15rem] top-3 w-2.5 h-2.5 rounded-full border-2 border-white z-10 ${
                    battle ? 'bg-red-400' : 'bg-purple-300'
                  }`} />

                  {/* Card */}
                  <div
                    className={`border-l-4 ${
                      entry.verified ? 'border-l-green-500' : battle ? 'border-l-red-400' : 'border-l-purple-400'
                    } bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer`}
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    {/* Collapsed header - always visible */}
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        {battle && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 flex-shrink-0">
                            Battle
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-800 text-sm">{entry.name}</h3>
                        <span className="text-xs text-gray-400">{entry.time}</span>
                        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${expandedId === entry.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

                    {/* Expanded content */}
                    {expandedId === entry.id && (
                      <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                        {/* Place */}
                        <div className="text-xs text-gray-500 mb-2">{entry.place}</div>

                        {/* Dynasty badges */}
                        {entry.dynasty.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-2">
                            {entry.dynasty.map((d, i) => (
                              <span key={i} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-gray-600 leading-relaxed">{entry.description}</p>

                        {/* Battle details */}
                        {battle && (
                          <div className="mt-2 p-2 bg-red-50 rounded-md text-xs space-y-1">
                            {entry.sideA && (
                              <div><span className="text-gray-500">Side A:</span> <span className="text-gray-700">{entry.sideA}</span></div>
                            )}
                            {entry.sideB && (
                              <div><span className="text-gray-500">Side B:</span> <span className="text-gray-700">{entry.sideB}</span></div>
                            )}
                            {entry.victor && (
                              <div><span className="text-gray-500">Victor:</span> <span className="font-semibold text-gray-800">{entry.victor}</span></div>
                            )}
                          </div>
                        )}

                        {/* Part of */}
                        {entry.partOf && (
                          <div className="mt-1.5 text-[10px] text-purple-600">Part of: {entry.partOf}</div>
                        )}

                        {/* People */}
                        {entry.people && entry.people.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {entry.people.map((p, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px]">{p}</span>
                            ))}
                          </div>
                        )}

                        {/* Source */}
                        <div className="mt-2 text-[10px] text-gray-400">
                          Source:{' '}
                          {entry.sourceUrl ? (
                            <a
                              href={entry.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-500 hover:text-pink-700 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {entry.source}
                            </a>
                          ) : (
                            entry.source
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            {search ? `No events matching "${search}"` : 'No timeline events yet'}
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingEntry ? 'Edit Event' : 'Add New Event'}
              </h2>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                {/* Dynasties */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dynasties / Kingdoms</label>
                  {/* Selected dynasty chips */}
                  <div className="flex gap-1 flex-wrap mb-2">
                    {(formData.dynasty || []).map((d, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {d}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dynasty: formData.dynasty.filter((_, j) => j !== i) })}
                          className="text-amber-500 hover:text-amber-800 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Add dynasty input with suggestions */}
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Type to add dynasty..."
                    list="dynasty-suggestions"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !formData.dynasty.includes(val)) {
                          setFormData({ ...formData, dynasty: [...formData.dynasty, val] });
                        }
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    onChange={(e) => {
                      // Auto-add if the value exactly matches a suggestion (datalist selection)
                      const val = e.target.value.trim();
                      if (val && dynasties.includes(val) && !formData.dynasty.includes(val)) {
                        setFormData({ ...formData, dynasty: [...formData.dynasty, val] });
                        e.target.value = '';
                      }
                    }}
                  />
                  <datalist id="dynasty-suggestions">
                    {dynasties.filter(d => !formData.dynasty.includes(d)).map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-gray-400 mt-1">Select from suggestions or type and press Enter</p>
                </div>

                {/* Time */}
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

                {/* People */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">People Involved (comma-separated)</label>
                  <input
                    type="text"
                    value={(formData.people || []).join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        people: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Rajaraja Cholan, Rajendra Chola"
                  />
                </div>

                {/* Source */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Source (blog post)</label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Source URL</label>
                    <input
                      type="url"
                      value={formData.sourceUrl || ''}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="https://..."
                    />
                  </div>
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

                {/* Battle fields */}
                <div className="border-t pt-3 mt-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Battle Details (optional)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Side A (dynasty)</label>
                      <input
                        type="text"
                        value={formData.sideA || ''}
                        onChange={(e) => setFormData({ ...formData, sideA: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Side B (dynasty)</label>
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
