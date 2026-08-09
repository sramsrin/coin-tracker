'use client';

import { useState, useEffect, useMemo } from 'react';

type Region = 'south-india' | 'related-events';
type BookPart = 'before-part-1' | 'part-1' | 'part-2' | 'part-3' | 'part-4' | 'after-part-4';

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
  partOf?: string | string[]; // supports single parent (string) or multiple parents (array)
  southIndia?: boolean; // legacy field
  region?: Region;
}

interface Theme {
  id: string;
  bookPart: BookPart;
  title?: string; // Optional for backward compatibility with old themes
  text: string;
  source?: string;
  sourceUrl?: string;
  createdAt: number;
}

const REGION_LABELS: Record<Region, string> = {
  'south-india': 'Main',
  'related-events': 'Other',
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

const BOOK_PART_CONFIG: Record<BookPart, { title: string; subtitle: string; color: string }> = {
  'before-part-1': {
    title: 'Before Part 1',
    subtitle: 'Before 1700',
    color: 'bg-gray-600',
  },
  'part-1': {
    title: 'Part 1: Masters of Carnatic',
    subtitle: '1700-1740',
    color: 'bg-emerald-600',
  },
  'part-2': {
    title: 'Part 2: Pawns of Carnatic',
    subtitle: '1740-1754',
    color: 'bg-blue-600',
  },
  'part-3': {
    title: 'Part 3: Paupers of Carnatic',
    subtitle: '1754-1787',
    color: 'bg-amber-600',
  },
  'part-4': {
    title: 'Part 4: Phantoms of Carnatic',
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
  if (year < 1700) return 'before-part-1';
  if (year < 1740) return 'part-1';
  if (year < 1754) return 'part-2';
  if (year < 1787) return 'part-3';
  if (year < 1807) return 'part-4';
  return 'after-part-4';
}

export default function TimelineTab({ isAuthenticated, defaultDynastyFilters }: { isAuthenticated: boolean; defaultDynastyFilters?: string[] }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<TimelineEntry, 'id'>>(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [peopleText, setPeopleText] = useState('');
  const [dynastyFilter, setDynastyFilter] = useState<string>('all');
  const [multiDynastyFilter, setMultiDynastyFilter] = useState<string[]>([]);
  const [peopleFilter, setPeopleFilter] = useState<string>('all');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandedSubEvents, setExpandedSubEvents] = useState<Set<string>>(new Set());
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = useState<Region>('south-india');
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showAddThemeForm, setShowAddThemeForm] = useState(false);
  const [themeFormData, setThemeFormData] = useState<{ bookPart: BookPart; title: string; text: string; source?: string; sourceUrl?: string }>({ bookPart: 'part-1', title: '', text: '', source: '', sourceUrl: '' });

  // When defaultDynastyFilters changes (e.g. navigating from Explore tab), apply multi-dynasty filter
  useEffect(() => {
    if (defaultDynastyFilters && defaultDynastyFilters.length > 0) {
      setMultiDynastyFilter(defaultDynastyFilters);
      setDynastyFilter('__multi__');
    }
  }, [defaultDynastyFilters]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [entriesRes, themesRes] = await Promise.all([
        fetch('/api/timeline'),
        fetch('/api/themes'),
      ]);

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data);
      }

      if (themesRes.ok) {
        const data = await themesRes.json();
        setThemes(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

  const toggleTheme = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  // Get unique dynasties for filter dropdown (only from Carnatic Lost / south-india region)
  const dynasties = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (getEntryRegion(e) === 'south-india' && e.dynasty) {
        e.dynasty.forEach((d) => set.add(d));
      }
    });
    return Array.from(set).sort();
  }, [entries]);

  // Get unique people for filter dropdown
  const people = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.people) e.people.forEach((p) => set.add(p));
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

    // Region filter (always applied - default is south-india)
    result = result.filter((e) => getEntryRegion(e) === regionFilter);

    // Dynasty filter - only show events tagged with the dynasty
    if (dynastyFilter === '__multi__' && multiDynastyFilter.length > 0) {
      result = result.filter((e) =>
        e.dynasty.some(d => multiDynastyFilter.includes(d))
      );
    } else if (dynastyFilter !== 'all' && dynastyFilter !== '__multi__') {
      result = result.filter((e) =>
        e.dynasty.includes(dynastyFilter)
      );
    }

    // People filter - only show events with selected person
    if (peopleFilter !== 'all') {
      result = result.filter((e) =>
        e.people && e.people.includes(peopleFilter)
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

    // Final result: separate parent events from sub-events
    // Only hide a sub-event if its parent is ALSO in the filtered result
    // (so sub-events whose parents are filtered out appear as standalone events)
    result = result.filter(e => {
      const parentIds = Array.isArray(e.partOf) ? e.partOf : (e.partOf ? [e.partOf] : []);
      const hasValidParent = parentIds.some(pId => entries.some(parent => parent.id === pId));

      if (!hasValidParent) {
        // Not a sub-event, always include
        return true;
      }

      // This is a sub-event - only exclude it if at least one parent is in the result
      const hasParentInResult = parentIds.some(pId => result.some(r => r.id === pId));
      return !hasParentInResult;
    });
    return [...result].sort((a, b) => a.timeStart - b.timeStart);
  }, [entries, search, dynastyFilter, multiDynastyFilter, peopleFilter, regionFilter, childrenMap]);

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
        partOf: formData.partOf === undefined ? null : formData.partOf, // explicitly send null to clear
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

  // Theme management functions
  function openAddTheme(bookPart: BookPart) {
    setEditingTheme(null);
    setThemeFormData({ bookPart, title: '', text: '', source: '', sourceUrl: '' });
    setShowAddThemeForm(true);
  }

  function openEditTheme(theme: Theme) {
    setEditingTheme(theme);
    // Handle backward compatibility for themes without title field
    const title = theme.title || theme.text.substring(0, 50) || '';
    setThemeFormData({ bookPart: theme.bookPart, title, text: theme.text, source: theme.source || '', sourceUrl: theme.sourceUrl || '' });
    setShowAddThemeForm(true);
  }

  function closeThemeModal() {
    setEditingTheme(null);
    setShowAddThemeForm(false);
    setThemeFormData({ bookPart: 'part-1', title: '', text: '', source: '', sourceUrl: '' });
  }

  async function handleSaveTheme() {
    setSaving(true);
    try {
      if (editingTheme) {
        const res = await fetch(`/api/themes?id=${editingTheme.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(themeFormData),
        });
        if (res.ok) {
          const updated = await res.json();
          setThemes((prev) =>
            prev.map((t) => (t.id === editingTheme.id ? updated : t))
          );
        }
      } else {
        const res = await fetch('/api/themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(themeFormData),
        });
        if (res.ok) {
          const newTheme = await res.json();
          setThemes((prev) => [...prev, newTheme]);
        }
      }
      closeThemeModal();
    } catch (err) {
      console.error('Failed to save theme:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTheme() {
    if (!editingTheme) return;
    if (!confirm('Delete this theme?')) return;
    try {
      await fetch(`/api/themes?id=${editingTheme.id}`, { method: 'DELETE' });
      setThemes((prev) => prev.filter((t) => t.id !== editingTheme.id));
      closeThemeModal();
    } catch (err) {
      console.error('Failed to delete theme:', err);
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

          {/* People filter */}
          <div className="flex items-center gap-1">
            <select
              value={peopleFilter}
              onChange={(e) => setPeopleFilter(e.target.value)}
              className="px-3 py-2 border border-purple-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">All People</option>
              {people.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {peopleFilter !== 'all' && (
              <button
                onClick={() => setPeopleFilter('all')}
                className="px-2 py-2 text-xs text-pink-600 hover:text-pink-800 font-medium"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Region filter */}
          <div className="flex rounded-lg border border-purple-200 overflow-hidden shrink-0">
            {(['south-india', 'related-events'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-2 text-xs font-medium transition whitespace-nowrap ${
                  regionFilter === r
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {REGION_LABELS[r]}
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

      {/* Timeline with Themes */}
      <div className="relative mt-2">
        {groupedByBookPart.map(({ part, entries: partEntries }) => {
          const config = BOOK_PART_CONFIG[part];
          const partThemes = themes.filter(t => t.bookPart === part);

          return (
            <div key={part} id={`section-${part}`} className="mb-8">
              {/* Book Part Header (Full Width) */}
              <div className="relative mb-6 mt-8 first:mt-0">
                <div className={`absolute left-2 w-6 h-6 rounded-full ${config.color} flex items-center justify-center z-10 shadow-lg`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                <div className={`w-full px-4 py-3 ${config.color} text-white shadow-md`}>
                  <div className="font-bold text-base">{config.title}</div>
                  <div className="text-sm opacity-90 mt-0.5">{config.subtitle}</div>
                </div>
              </div>

              {/* Two Column Layout: Events (75%) + Themes (25%) */}
              <div className="flex gap-4">
                {/* Left: Timeline Events */}
                <div className="relative flex-[3]">
                  {/* Vertical line connecting events in this section */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200" />

              {partEntries.map((entry) => {
              // Filter children based on current dynasty, region, and people filters
              const allChildEvents = childrenMap.get(entry.id) || [];
              const childEvents = allChildEvents.filter(child => {
                // Apply region filter
                if (getEntryRegion(child) !== regionFilter) {
                  return false;
                }

                // Apply dynasty filter
                if (dynastyFilter === '__multi__' && multiDynastyFilter.length > 0) {
                  if (!child.dynasty.some(d => multiDynastyFilter.includes(d))) {
                    return false;
                  }
                } else if (dynastyFilter !== 'all' && dynastyFilter !== '__multi__') {
                  if (!child.dynasty.includes(dynastyFilter)) {
                    return false;
                  }
                }

                // Apply people filter
                if (peopleFilter !== 'all') {
                  if (!child.people || !child.people.includes(peopleFilter)) {
                    return false;
                  }
                }

                return true; // Passes all filters
              });
              const hasChildren = childEvents.length > 0; // Based on filtered children
              const isParentExpanded = expandedParents.has(entry.id);

              return (
                <div key={entry.id} className="relative ml-12 mb-3">
                  {/* Timeline connector dot */}
                  <div className={`absolute -left-[2.15rem] top-3 w-2.5 h-2.5 rounded-full border-2 border-white z-10 ${
                    hasChildren ? 'bg-purple-500' : 'bg-purple-300'
                  }`} />

                  {/* Parent Event Card */}
                  <div
                    className={`border-l-4 ${
                      entry.verified ? 'border-l-green-500' : 'border-l-purple-400'
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
                        const isChildExpanded = expandedSubEvents.has(child.id);

                        return (
                          <div
                            key={child.id}
                            className={`border-l-4 ${
                              child.verified ? 'border-l-green-500' : 'border-l-purple-300'
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

                                {/* Grandchildren (3rd level) - only shown when child is expanded */}
                                {(() => {
                                  const grandchildren = (childrenMap.get(child.id) || []).filter(grandchild => {
                                    // Apply same filters as children
                                    if (getEntryRegion(grandchild) !== regionFilter) return false;
                                    if (dynastyFilter === '__multi__' && multiDynastyFilter.length > 0) {
                                      if (!grandchild.dynasty.some(d => multiDynastyFilter.includes(d))) return false;
                                    } else if (dynastyFilter !== 'all' && dynastyFilter !== '__multi__') {
                                      if (!grandchild.dynasty.includes(dynastyFilter)) return false;
                                    }
                                    if (peopleFilter !== 'all') {
                                      if (!grandchild.people || !grandchild.people.includes(peopleFilter)) return false;
                                    }
                                    return true;
                                  });

                                  if (grandchildren.length === 0) return null;

                                  return (
                                    <div className="mt-3 ml-2 space-y-2 border-l-2 border-gray-300 pl-2">
                                      {grandchildren.map((grandchild) => {
                                        const isGrandchildExpanded = expandedSubEvents.has(grandchild.id);
                                        return (
                                          <div
                                            key={grandchild.id}
                                            className="border-l-4 border-l-gray-400 bg-white rounded shadow-sm hover:shadow transition cursor-pointer text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleSubEvent(grandchild.id);
                                            }}
                                          >
                                            {/* Grandchild header */}
                                            <div className="flex items-center justify-between gap-2 p-2">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <h5 className="font-medium text-gray-600 text-xs">{grandchild.name}</h5>
                                                <span className="text-[10px] text-gray-400">{grandchild.time}</span>
                                                <svg className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isGrandchildExpanded ? 'rotate-180' : ''}`}
                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </div>
                                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                {isAuthenticated && (
                                                  <button
                                                    onClick={() => handleVerifiedToggle(grandchild)}
                                                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                      grandchild.verified
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-gray-300 hover:border-green-400'
                                                    }`}
                                                  >
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                  </button>
                                                )}
                                                {isAuthenticated && (
                                                  <button
                                                    onClick={() => openEdit(grandchild)}
                                                    className="text-gray-400 hover:text-pink-600"
                                                  >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            {/* Grandchild expanded content */}
                                            {isGrandchildExpanded && (
                                              <div className="px-2 pb-2 border-t border-gray-200 pt-2">
                                                <div className="text-[10px] text-gray-500 mb-1">{grandchild.place}</div>
                                                {grandchild.dynasty.length > 0 && (
                                                  <div className="flex gap-1 flex-wrap mb-1">
                                                    {grandchild.dynasty.map((d, i) => (
                                                      <span key={i} className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-50 text-amber-600">
                                                        {d}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                                <p className="text-[10px] text-gray-600 leading-relaxed">{grandchild.description}</p>
                                                {grandchild.people && grandchild.people.length > 0 && (
                                                  <div className="flex gap-1 mt-1 flex-wrap">
                                                    {grandchild.people.map((p, i) => (
                                                      <span key={i} className="px-1 py-0.5 bg-purple-50 text-purple-600 rounded text-[9px]">{p}</span>
                                                    ))}
                                                  </div>
                                                )}
                                                <div className="mt-1 text-[9px] text-gray-400">
                                                  Source: {grandchild.sourceUrl ? (
                                                    <a href={grandchild.sourceUrl} target="_blank" rel="noopener noreferrer"
                                                       className="text-pink-500 hover:text-pink-700 underline"
                                                       onClick={(e) => e.stopPropagation()}>
                                                      {grandchild.source}
                                                    </a>
                                                  ) : grandchild.source}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
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

                {/* Right: Themes for this part */}
                <div className="flex-1 space-y-2">
                  <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Themes</div>

                  {partThemes.map((theme) => {
                    const isExpanded = expandedThemes.has(theme.id);
                    // Handle backward compatibility for themes without title
                    const displayTitle = theme.title || theme.text.substring(0, 50) + (theme.text.length > 50 ? '...' : '');
                    return (
                      <div
                        key={theme.id}
                        className="bg-yellow-100 border-l-4 border-yellow-400 shadow-md rounded cursor-pointer hover:shadow-lg transition transform hover:-rotate-1"
                        style={{
                          boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        }}
                        onClick={() => toggleTheme(theme.id)}
                      >
                        {/* Header - always visible */}
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="font-semibold text-sm text-gray-800">{displayTitle}</div>
                            <svg className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Edit button */}
                          {isAuthenticated && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTheme(theme);
                              }}
                              className="text-gray-400 hover:text-yellow-700 transition flex-shrink-0"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-yellow-300 pt-2">
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">{theme.text}</div>

                            {/* Source */}
                            {theme.source && (
                              <div className="mt-2 pt-2 border-t border-yellow-300 text-[10px] text-gray-500">
                                Source:{' '}
                                {theme.sourceUrl ? (
                                  <a
                                    href={theme.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-yellow-700 hover:text-yellow-900 underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {theme.source}
                                  </a>
                                ) : (
                                  theme.source
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add theme button */}
                  {isAuthenticated && (
                    <button
                      onClick={() => openAddTheme(part)}
                      className="w-full py-2 px-3 bg-yellow-50 hover:bg-yellow-100 border-2 border-dashed border-yellow-300 rounded text-xs text-yellow-700 font-medium transition"
                    >
                      + Add Theme
                    </button>
                  )}
                </div>
              </div>
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
                        if (val && !(formData.dynasty || []).includes(val)) {
                          setFormData({ ...formData, dynasty: [...(formData.dynasty || []), val] });
                        }
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    onBlur={(e) => {
                      // Auto-add on blur if the value exactly matches a suggestion
                      const val = e.target.value.trim();
                      if (val && dynasties.includes(val) && !(formData.dynasty || []).includes(val)) {
                        setFormData({ ...formData, dynasty: [...(formData.dynasty || []), val] });
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
                    <option value="south-india">{REGION_LABELS['south-india']}</option>
                    <option value="related-events">{REGION_LABELS['related-events']}</option>
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

                {/* Parent Events */}
                <div className="border-t pt-3 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-600">
                      Parent Events (optional - can select multiple)
                    </label>
                    {(Array.isArray(formData.partOf) ? formData.partOf : (formData.partOf ? [formData.partOf] : [])).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, partOf: undefined })}
                        className="text-xs text-pink-600 hover:text-pink-800 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
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

      {/* Theme Modal */}
      {showAddThemeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-50 rounded-xl shadow-2xl w-full max-w-md border-4 border-yellow-300">
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingTheme ? 'Edit Theme' : 'Add Theme'}
              </h2>

              <div className="space-y-3">
                {/* Book Part */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Book Part</label>
                  <select
                    value={themeFormData.bookPart}
                    onChange={(e) => setThemeFormData({ ...themeFormData, bookPart: e.target.value as BookPart })}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  >
                    {(['before-part-1', 'part-1', 'part-2', 'part-3', 'part-4', 'after-part-4'] as const).map((part) => (
                      <option key={part} value={part}>
                        {BOOK_PART_CONFIG[part].title} ({BOOK_PART_CONFIG[part].subtitle})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Theme Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Theme Title</label>
                  <input
                    type="text"
                    value={themeFormData.title}
                    onChange={(e) => setThemeFormData({ ...themeFormData, title: e.target.value })}
                    placeholder="Short title for this theme..."
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>

                {/* Theme Text */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Theme Description</label>
                  <textarea
                    value={themeFormData.text}
                    onChange={(e) => setThemeFormData({ ...themeFormData, text: e.target.value })}
                    rows={5}
                    placeholder="Enter a detailed description of this theme..."
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>

                {/* Source */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                    <input
                      type="text"
                      value={themeFormData.source || ''}
                      onChange={(e) => setThemeFormData({ ...themeFormData, source: e.target.value })}
                      placeholder="Book, article, etc."
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Source URL</label>
                    <input
                      type="url"
                      value={themeFormData.sourceUrl || ''}
                      onChange={(e) => setThemeFormData({ ...themeFormData, sourceUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-5">
                <div>
                  {editingTheme && (
                    <button
                      onClick={handleDeleteTheme}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={closeThemeModal}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTheme}
                    disabled={saving || !themeFormData.title.trim()}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-medium transition disabled:opacity-50"
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
