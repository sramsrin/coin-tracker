'use client';

import { useState, useEffect, useMemo } from 'react';

type Region = 'south-india' | 'related-events';

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
  partOf?: string | string[]; // supports single parent (string) or multiple parents (array)
  southIndia?: boolean; // legacy field
  region?: Region;
}

const REGION_LABELS: Record<Region, string> = {
  'south-india': 'Carnatic Lost',
  'related-events': 'Related Events',
};

function getEntryRegion(e: TimelineEntry): Region {
  if (e.region) {
    // Map legacy regions to new unified region
    if ((e.region as string) === 'north-india' || (e.region as string) === 'us') {
      return 'related-events';
    }
    return e.region;
  }
  // Legacy: entries without region field use southIndia boolean
  return e.southIndia === false ? 'related-events' : 'south-india';
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
  region: 'south-india',
};

type BookPart = 'before-part-1' | 'part-1' | 'part-2' | 'part-3' | 'part-4' | 'after-part-4';

const BOOK_PART_CONFIG: Record<BookPart, { title: string; subtitle: string; color: string }> = {
  'before-part-1': {
    title: 'Before Part 1',
    subtitle: 'Before 1690',
    color: 'bg-gray-600',
  },
  'part-1': {
    title: 'Part 1: Masters of Tamil Nadu',
    subtitle: '1690-1740',
    color: 'bg-emerald-600',
  },
  'part-2': {
    title: 'Part 2: Pawns in Battle Between Powerful External Forces',
    subtitle: '1740-1754',
    color: 'bg-blue-600',
  },
  'part-3': {
    title: 'Part 3: Paupers Drowning in Debt',
    subtitle: '1754-1787',
    color: 'bg-amber-600',
  },
  'part-4': {
    title: 'Part 4: Phantom Rulers Before the British Completely Took Over Carnatic',
    subtitle: '1787-1807',
    color: 'bg-rose-600',
  },
  'after-part-4': {
    title: 'After Part 4',
    subtitle: 'After 1807',
    color: 'bg-purple-600',
  },
};

function getBookPart(year: number): BookPart {
  if (year < 1690) return 'before-part-1';
  if (year < 1740) return 'part-1';
  if (year < 1754) return 'part-2';
  if (year < 1787) return 'part-3';
  if (year < 1807) return 'part-4';
  return 'after-part-4';
}

export default function TimelineTab({ isAuthenticated, defaultDynastyFilters }: { isAuthenticated: boolean; defaultDynastyFilters?: string[] }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<TimelineEntry, 'id'>>(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [peopleText, setPeopleText] = useState('');
  const [dynastyFilter, setDynastyFilter] = useState<string>('all');
  const [multiDynastyFilter, setMultiDynastyFilter] = useState<string[]>([]);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandedSubEvents, setExpandedSubEvents] = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('south-india');

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

  const toggleParent = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const toggleSubEvent = (subEventId: string) => {
    const newExpanded = new Set(expandedSubEvents);
    if (newExpanded.has(subEventId)) {
      newExpanded.delete(subEventId);
    } else {
      newExpanded.add(subEventId);
    }
    setExpandedSubEvents(newExpanded);
  };

  // Get unique dynasties for filter dropdown
  const dynasties = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.dynasty) e.dynasty.forEach((d) => set.add(d));
    });
    return Array.from(set).sort();
  }, [entries]);

  // Build hierarchy: separate parent events from sub-events (supports multiple parents)
  const { parentEvents, childrenMap } = useMemo(() => {
    const parents: TimelineEntry[] = [];
    const childrenByParent = new Map<string, TimelineEntry[]>();

    entries.forEach(entry => {
      // Normalize partOf to always be an array for consistent handling
      const parentIds = Array.isArray(entry.partOf)
        ? entry.partOf
        : (entry.partOf ? [entry.partOf] : []);

      // Check if any of the parent IDs are valid (exist in entries)
      const hasValidParent = parentIds.some(pId => entries.some(e => e.id === pId));

      if (hasValidParent) {
        // This is a sub-event - add it to each valid parent's children list
        parentIds.forEach(parentId => {
          if (entries.some(e => e.id === parentId)) {
            if (!childrenByParent.has(parentId)) {
              childrenByParent.set(parentId, []);
            }
            childrenByParent.get(parentId)!.push(entry);
          }
        });
      } else {
        // This is a parent event or standalone event
        parents.push(entry);
      }
    });

    // Sort children within each parent by timeStart
    childrenByParent.forEach(children => {
      children.sort((a, b) => a.timeStart - b.timeStart);
    });

    return { parentEvents: parents, childrenMap: childrenByParent };
  }, [entries]);

  const getParentEventName = (parentId: string | undefined): string | null => {
    if (!parentId) return null;
    const parent = entries.find(e => e.id === parentId);
    return parent ? parent.name : null;
  };

  const filtered = useMemo(() => {
    let result = entries;

    // Region filter
    if (regionFilter !== 'all') {
      result = result.filter((e) => getEntryRegion(e) === regionFilter);
    }

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
      const matchingIds = new Set<string>();

      // Check all entries (parents and children)
      entries.forEach(e => {
        const matches =
          e.name.toLowerCase().includes(q) ||
          e.place.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q) ||
          e.time.toLowerCase().includes(q) ||
          e.dynasty.some(d => d.toLowerCase().includes(q)) ||
          (e.sideA && e.sideA.toLowerCase().includes(q)) ||
          (e.sideB && e.sideB.toLowerCase().includes(q)) ||
          (e.victor && e.victor.toLowerCase().includes(q)) ||
          (e.people && e.people.some((p) => p.toLowerCase().includes(q)));

        if (matches) {
          matchingIds.add(e.id);

          // If parent matches, include all children
          if (childrenMap.has(e.id)) {
            childrenMap.get(e.id)!.forEach(child => matchingIds.add(child.id));
          }

          // If child matches, include all parents (supports multiple parents)
          const parentIds = Array.isArray(e.partOf) ? e.partOf : (e.partOf ? [e.partOf] : []);
          parentIds.forEach(pId => matchingIds.add(pId));
        }
      });

      result = result.filter(e => matchingIds.has(e.id));
    }

    // Final result: only parent events (children rendered under them)
    // An event is a sub-event if it has any valid parents
    result = result.filter(e => {
      const parentIds = Array.isArray(e.partOf) ? e.partOf : (e.partOf ? [e.partOf] : []);
      const hasValidParent = parentIds.some(pId => entries.some(parent => parent.id === pId));
      return !hasValidParent;
    });
    return [...result].sort((a, b) => a.timeStart - b.timeStart);
  }, [entries, search, dynastyFilter, multiDynastyFilter, regionFilter]);

  const groupedByBookPart = useMemo(() => {
    const groups: { part: BookPart; entries: TimelineEntry[] }[] = [];
    let currentPart: BookPart | null = null;
    for (const entry of filtered) {
      const part = getBookPart(entry.timeStart);
      if (part !== currentPart) {
        currentPart = part;
        groups.push({ part, entries: [entry] });
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
      region: getEntryRegion(entry),
    });
    setPeopleText((entry.people || []).join(', '));
  }

  function openAdd() {
    setEditingEntry(null);
    setFormData({ ...EMPTY_ENTRY, people: [] });
    setPeopleText('');
    setShowAddForm(true);
  }

  function closeModal() {
    setEditingEntry(null);
    setShowAddForm(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const parsedPeople = peopleText.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        ...formData,
        timeStart: Number(formData.timeStart) || 0,
        timeEnd: formData.timeEnd ? Number(formData.timeEnd) : null,
        people: parsedPeople.length ? parsedPeople : undefined,
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

          {/* Region filter */}
          <div className="flex rounded-lg border border-purple-200 overflow-hidden">
            {(['all', 'south-india', 'related-events'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-2 text-xs font-medium transition whitespace-nowrap ${
                  regionFilter === r
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {r === 'all' ? 'All' : REGION_LABELS[r]}
              </button>
            ))}
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
          Showing {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          ({Array.from(childrenMap.values()).flat().length} sub-events)
          of {entries.length} total
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mt-2">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200" />

        {groupedByBookPart.map(({ part, entries: partEntries }) => {
          const config = BOOK_PART_CONFIG[part];
          return (
            <div key={part}>
              {/* Book Part marker */}
              <div className="relative mb-6 mt-8 first:mt-0">
                <div className={`absolute left-2 w-6 h-6 rounded-full ${config.color} flex items-center justify-center z-10 shadow-lg`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                <div className={`w-full px-4 py-3 ${config.color} text-white shadow-md`}>
                  <div className="font-bold text-base">{config.title}</div>
                  <div className="text-sm opacity-90 mt-0.5">{config.subtitle}</div>
                </div>
              </div>

              {partEntries.map((entry) => {
              const battle = isBattle(entry);
              const hasChildren = childrenMap.has(entry.id);
              const childEvents = childrenMap.get(entry.id) || [];
              const isParentExpanded = expandedParents.has(entry.id);

              return (
                <div key={entry.id} className="relative ml-12 mb-3">
                  {/* Timeline connector dot */}
                  <div className={`absolute -left-[2.15rem] top-3 w-2.5 h-2.5 rounded-full border-2 border-white z-10 ${
                    battle ? 'bg-red-400' :
                    hasChildren ? 'bg-purple-500' :
                    'bg-purple-300'
                  }`} />

                  {/* Parent Event Card */}
                  <div
                    className={`border-l-4 ${
                      entry.verified ? 'border-l-green-500' :
                      battle ? 'border-l-red-400' :
                      'border-l-purple-400'
                    } bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer`}
                    onClick={() => {
                      if (hasChildren) {
                        toggleParent(entry.id);
                      } else {
                        toggleSubEvent(entry.id);
                      }
                    }}
                  >
                    {/* Parent header (always visible) */}
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        {hasChildren && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                            {childEvents.length} sub-event{childEvents.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-800 text-sm">{entry.name}</h3>
                        <span className="text-xs text-gray-400">{entry.time}</span>
                        {/* Region badge */}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          getEntryRegion(entry) === 'south-india' ? 'bg-blue-50 text-blue-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {REGION_LABELS[getEntryRegion(entry)]}
                        </span>
                        {/* Chevron */}
                        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                          (hasChildren && isParentExpanded) || (!hasChildren && expandedSubEvents.has(entry.id)) ? 'rotate-180' : ''
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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

                    {/* Expanded content for standalone/parent events */}
                    {((!hasChildren && expandedSubEvents.has(entry.id)) || (hasChildren && isParentExpanded)) && (
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

                  {/* Sub-events (indented, only shown when parent expanded) */}
                  {hasChildren && isParentExpanded && (
                    <div className="ml-6 mt-2 space-y-2 border-l-2 border-purple-200 pl-3">
                      {childEvents.map((child) => {
                        const childBattle = isBattle(child);
                        const isChildExpanded = expandedSubEvents.has(child.id);

                        return (
                          <div
                            key={child.id}
                            className={`border-l-4 ${
                              child.verified ? 'border-l-green-500' :
                              childBattle ? 'border-l-red-400' :
                              'border-l-purple-300'
                            } bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubEvent(child.id);
                            }}
                          >
                            {/* Sub-event header */}
                            <div className="flex items-center justify-between gap-2 p-2.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h4 className="font-medium text-gray-700 text-sm">{child.name}</h4>
                                <span className="text-xs text-gray-400">{child.time}</span>
                                <svg className={`w-3 h-3 text-gray-400 transition-transform ${isChildExpanded ? 'rotate-180' : ''}`}
                                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {isAuthenticated && (
                                  <button
                                    onClick={() => handleVerifiedToggle(child)}
                                    title={child.verified ? 'Mark unverified' : 'Mark verified'}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                                      child.verified
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-gray-300 text-transparent hover:border-green-400'
                                    }`}
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                                {!isAuthenticated && child.verified && (
                                  <span className="text-green-500" title="Verified">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </span>
                                )}
                                {isAuthenticated && (
                                  <button
                                    onClick={() => openEdit(child)}
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

                            {/* Sub-event expanded content */}
                            {isChildExpanded && (
                              <div className="px-2.5 pb-2.5 border-t border-gray-200 pt-2">
                                {/* Place */}
                                <div className="text-xs text-gray-500 mb-2">{child.place}</div>

                                {/* Dynasty badges */}
                                {child.dynasty.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mb-2">
                                    {child.dynasty.map((d, i) => (
                                      <span key={i} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Description */}
                                <p className="text-xs text-gray-600 leading-relaxed">{child.description}</p>

                                {/* Battle details */}
                                {childBattle && (
                                  <div className="mt-2 p-2 bg-red-50 rounded-md text-xs space-y-1">
                                    {child.sideA && (
                                      <div><span className="text-gray-500">Side A:</span> <span className="text-gray-700">{child.sideA}</span></div>
                                    )}
                                    {child.sideB && (
                                      <div><span className="text-gray-500">Side B:</span> <span className="text-gray-700">{child.sideB}</span></div>
                                    )}
                                    {child.victor && (
                                      <div><span className="text-gray-500">Victor:</span> <span className="font-semibold text-gray-800">{child.victor}</span></div>
                                    )}
                                  </div>
                                )}

                                {/* People */}
                                {child.people && child.people.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {child.people.map((p, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px]">{p}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Source */}
                                <div className="mt-2 text-[10px] text-gray-400">
                                  Source:{' '}
                                  {child.sourceUrl ? (
                                    <a
                                      href={child.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-pink-500 hover:text-pink-700 underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {child.source}
                                    </a>
                                  ) : (
                                    child.source
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          );
        })}

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
                    value={peopleText}
                    onChange={(e) => setPeopleText(e.target.value)}
                    onBlur={() => {
                      const parsed = peopleText.split(',').map((s) => s.trim()).filter(Boolean);
                      setFormData({ ...formData, people: parsed });
                      setPeopleText(parsed.join(', '));
                    }}
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

                {/* Region */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                  <select
                    value={formData.region || 'south-india'}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value as Region })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="south-india">South India</option>
                    <option value="north-india">Broader India</option>
                    <option value="us">US</option>
                  </select>
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Parent Events (optional - can select multiple)
                      </label>
                      {/* Display selected parents as chips */}
                      {(Array.isArray(formData.partOf) ? formData.partOf : (formData.partOf ? [formData.partOf] : [])).length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-2">
                          {(Array.isArray(formData.partOf) ? formData.partOf : [formData.partOf]).map((parentId) => {
                            const parent = entries.find(e => e.id === parentId);
                            return parent ? (
                              <span key={parentId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                                {parent.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData.partOf) ? formData.partOf : (formData.partOf ? [formData.partOf] : []);
                                    const updated = current.filter(id => id !== parentId);
                                    setFormData({ ...formData, partOf: updated.length === 0 ? undefined : updated.length === 1 ? updated[0] : updated });
                                  }}
                                  className="text-pink-500 hover:text-pink-800 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      {/* Parent selection dropdown */}
                      <select
                        multiple
                        value={Array.isArray(formData.partOf) ? formData.partOf : (formData.partOf ? [formData.partOf] : [])}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                          setFormData({ ...formData, partOf: selected.length === 0 ? undefined : selected.length === 1 ? selected[0] : selected });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        size={Math.min(entries.length, 6)}
                      >
                        {entries
                          .filter(e => e.id !== editingEntry?.id && (!Array.isArray(e.partOf) && e.partOf ? !entries.some(parent => parent.id === e.partOf) : true)) // Prevent self-selection and show non-sub-events
                          .sort((a, b) => a.timeStart - b.timeStart)
                          .map(e => (
                            <option key={e.id} value={e.id}>
                              {e.name} ({e.time})
                            </option>
                          ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Hold Ctrl/Cmd to select multiple parents. Event will appear under all selected parents.
                      </p>
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
