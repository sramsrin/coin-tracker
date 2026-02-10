'use client';

import { useState, useEffect } from 'react';

interface Coin {
  id: string;
  index: string;
  section: string;
  subsection: string;
  subsubsection: string;
  faceValue: string;
  currency: string;
  kmNumber: string;
  numistaNumber: string;
  numistaLink: string;
  weight: string;
  book: string;
  numberAndNotes: string;
  obverse: string;
  reverse: string;
}

type SortField = keyof Coin;
type SortDirection = 'asc' | 'desc';

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupBySection, setGroupBySection] = useState(true);
  const [showTOC, setShowTOC] = useState(true);
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [deletingCoin, setDeletingCoin] = useState<Coin | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Coin>>({});
  const [activeTab, setActiveTab] = useState<'collection' | 'map'>('collection');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [colorMappings, setColorMappings] = useState<{state: string, color: string}[]>([]);
  const [mapCanvas, setMapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<{state: string, color: string} | null>(null);
  const [mappingFormState, setMappingFormState] = useState('');
  const [ambiguousStates, setAmbiguousStates] = useState<{color: string, states: string[]} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    index: '',
    section: '',
    subsection: '',
    subsubsection: '',
    faceValue: '',
    currency: '',
    kmNumber: '',
    numistaNumber: '',
    numistaLink: '',
    weight: '',
    book: '',
    numberAndNotes: '',
    obverse: '',
    reverse: '',
  });

  // Load coins on mount
  useEffect(() => {
    fetchCoins();
    fetchColorMappings();
  }, []);

  const fetchColorMappings = async () => {
    try {
      const response = await fetch('/api/map-points');
      if (response.ok) {
        const data = await response.json();
        setColorMappings(data);
      }
    } catch (error) {
      console.error('Error fetching color mappings:', error);
    }
  };

  const highlightStateOnMap = (stateNames: string[] | null) => {
    if (!mapCanvas || !originalImageData) return;

    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;

    // Restore original image
    ctx.putImageData(originalImageData, 0, 0);

    if (!stateNames || stateNames.length === 0) return;

    // Get all colors for the states to highlight
    const targetColors = stateNames
      .map(stateName => {
        const mapping = colorMappings.find(m => m.state === stateName);
        if (!mapping) return null;
        const [r, g, b] = mapping.color.split(',').map(Number);
        return { r, g, b };
      })
      .filter(Boolean) as { r: number; g: number; b: number }[];

    if (targetColors.length === 0) return;

    // Get image data and highlight the matching colors with stripes
    const imageData = ctx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
    const data = imageData.data;
    const width = mapCanvas.width;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if this pixel matches any target color
      const matchesTarget = targetColors.some(
        target => target.r === r && target.g === g && target.b === b
      );

      if (matchesTarget) {
        // Calculate pixel position for stripe pattern
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        // Create diagonal stripes (every 6 pixels for visibility)
        const isStripe = (x + y) % 12 < 6;

        if (isStripe) {
          // Black stripes for maximum visibility
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else {
          // Keep original color
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Highlight state(s) when selection changes
  useEffect(() => {
    if (activeTab === 'map') {
      let statesToHighlight: string[] = [];

      if (selectedState) {
        // Just highlight the single selected state
        statesToHighlight = [selectedState];
      } else if (selectedSubsection) {
        // Get all states in this subsection (when "All" is selected)
        statesToHighlight = coins
          .filter(c => c.section === 'Indian Princely States' && c.subsection === selectedSubsection)
          .map(c => c.subsubsection)
          .filter(Boolean);
      }

      highlightStateOnMap(statesToHighlight.length > 0 ? statesToHighlight : null);
    }
  }, [selectedState, selectedSubsection, colorMappings, mapCanvas, originalImageData, coins, activeTab]);

  const fetchCoins = async () => {
    try {
      const response = await fetch('/api/coins');
      if (response.ok) {
        const data = await response.json();
        setCoins(data);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
    }
  };

  // Get unique sections and subsections
  const uniqueSections = Array.from(new Set(coins.map(c => c.section).filter(Boolean))).sort();

  // Get subsections for a specific section
  const getSubsectionsForSection = (section: string) => {
    if (!section) return [];
    return Array.from(new Set(
      coins
        .filter(c => c.section === section)
        .map(c => c.subsection)
        .filter(Boolean)
    )).sort();
  };

  // Get subsubsections for a specific section and subsection
  const getSubsubsectionsForSubsection = (section: string, subsection: string) => {
    if (!section || !subsection) return [];
    return Array.from(new Set(
      coins
        .filter(c => c.section === section && c.subsection === subsection)
        .map(c => c.subsubsection)
        .filter(Boolean)
    )).sort();
  };

  // Get subsections for the selected section in add form
  const availableSubsections = getSubsectionsForSection(formData.section);

  // Get subsections for the selected section in edit form
  const availableEditSubsections = getSubsectionsForSection(editFormData.section || '');

  // Get subsubsections for add form
  const availableSubsubsections = getSubsubsectionsForSubsection(formData.section, formData.subsection);

  // Get subsubsections for edit form
  const availableEditSubsubsections = getSubsubsectionsForSubsection(editFormData.section || '', editFormData.subsection || '');

  // Calculate next available index
  const getNextIndex = () => {
    if (coins.length === 0) return '1.1';

    // Find the highest index
    const indices = coins.map(coin => {
      const parts = coin.index.split('.');
      const page = parseInt(parts[0]) || 0;
      const slot = parseInt(parts[1]) || 0;
      return { page, slot };
    });

    const maxIndex = indices.reduce((max, current) => {
      if (current.page > max.page) return current;
      if (current.page === max.page && current.slot > max.slot) return current;
      return max;
    }, { page: 0, slot: 0 });

    // Calculate next index
    if (maxIndex.slot < 12) {
      return `${maxIndex.page}.${maxIndex.slot + 1}`;
    } else {
      return `${maxIndex.page + 1}.1`;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCoins = [...coins].sort((a, b) => {
    // First sort by section and subsection if grouping is enabled
    if (groupBySection) {
      const sectionCompare = a.section.localeCompare(b.section);
      if (sectionCompare !== 0) return sectionCompare;

      const subsectionCompare = a.subsection.localeCompare(b.subsection);
      if (subsectionCompare !== 0) return subsectionCompare;

      const subsubsectionCompare = (a.subsubsection || '').localeCompare(b.subsubsection || '');
      if (subsubsectionCompare !== 0) return subsubsectionCompare;
    }

    // Then sort by the selected field
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';

    // Special handling for index field (page.slot format)
    if (sortField === 'index') {
      const aParts = aValue.split('.');
      const bParts = bValue.split('.');
      const aPage = parseInt(aParts[0]) || 0;
      const bPage = parseInt(bParts[0]) || 0;
      const aSlot = parseInt(aParts[1]) || 0;
      const bSlot = parseInt(bParts[1]) || 0;

      if (aPage !== bPage) {
        return sortDirection === 'asc' ? aPage - bPage : bPage - aPage;
      }
      return sortDirection === 'asc' ? aSlot - bSlot : bSlot - aSlot;
    }

    // Try to parse as numbers for numeric sorting
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // String sorting
    return sortDirection === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Group coins by section, subsection, and subsubsection
  const groupedCoins: { [section: string]: { [subsection: string]: { [subsubsection: string]: Coin[] } } } = {};
  sortedCoins.forEach(coin => {
    if (!groupedCoins[coin.section]) {
      groupedCoins[coin.section] = {};
    }
    if (!groupedCoins[coin.section][coin.subsection]) {
      groupedCoins[coin.section][coin.subsection] = {};
    }
    // If subsubsection is empty, use 'All' as the default grouping
    const subsubsection = coin.subsubsection || 'All';
    if (!groupedCoins[coin.section][coin.subsection][subsubsection]) {
      groupedCoins[coin.section][coin.subsection][subsubsection] = [];
    }
    groupedCoins[coin.section][coin.subsection][subsubsection].push(coin);
  });

  // Helper function to extract start year from subsection name (e.g., "William IV (1830-1837)" -> 1830)
  const extractYear = (subsection: string): number => {
    const match = subsection.match(/\((\d{4})/);
    return match ? parseInt(match[1]) : 9999; // Return high number if no year found
  };

  // Helper function to sort subsections (by date for British India, alphabetically for others)
  const sortSubsections = (section: string, subsections: string[]): string[] => {
    if (section === 'British India') {
      return subsections.sort((a, b) => extractYear(a) - extractYear(b));
    }
    return subsections.sort();
  };

  const toggleAgency = (agencyKey: string) => {
    const newExpanded = new Set(expandedAgencies);
    if (newExpanded.has(agencyKey)) {
      newExpanded.delete(agencyKey);
    } else {
      newExpanded.add(agencyKey);
    }
    setExpandedAgencies(newExpanded);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production, this should be done server-side
    if (password === 'SRMPv7006@') {
      setIsAuthenticated(true);
      setPassword('');
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setShowPasswordError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-assign the next index
    const nextIndex = getNextIndex();
    const coinData = {
      ...formData,
      index: nextIndex
    };

    try {
      const response = await fetch('/api/coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coinData),
      });

      if (response.ok) {
        // Clear form (index will be auto-assigned on next submission)
        setFormData({
          index: '',
          section: '',
          subsection: '',
          subsubsection: '',
          faceValue: '',
          currency: '',
          kmNumber: '',
          numistaNumber: '',
          numistaLink: '',
          weight: '',
          book: '',
          numberAndNotes: '',
          obverse: '',
          reverse: '',
        });
        // Refresh coins list
        fetchCoins();
      }
    } catch (error) {
      console.error('Error adding coin:', error);
    }
  };

  const handleEditClick = (coin: Coin) => {
    setEditingCoin(coin);
    setEditFormData({
      section: coin.section,
      subsection: coin.subsection,
      subsubsection: coin.subsubsection,
      faceValue: coin.faceValue,
      currency: coin.currency,
      kmNumber: coin.kmNumber,
      numistaNumber: coin.numistaNumber,
      numistaLink: coin.numistaLink,
      weight: coin.weight,
      book: coin.book,
      numberAndNotes: coin.numberAndNotes,
      obverse: coin.obverse,
      reverse: coin.reverse,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingCoin) return;

    try {
      const response = await fetch(`/api/coins?id=${editingCoin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingCoin,
          ...editFormData,
        }),
      });

      if (response.ok) {
        fetchCoins();
        setEditingCoin(null);
        setEditFormData({});
      }
    } catch (error) {
      console.error('Error updating coin:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingCoin(null);
    setEditFormData({});
  };

  const handleDeleteClick = (coin: Coin) => {
    setDeletingCoin(coin);
    setDeletePassword('');
    setDeletePasswordError(false);
  };

  const handleDeleteConfirm = async () => {
    if (deletePassword !== 'SRMPv7006@') {
      setDeletePasswordError(true);
      return;
    }

    if (!deletingCoin) return;

    try {
      const response = await fetch(`/api/coins?id=${deletingCoin.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCoins();
        setDeletingCoin(null);
        setDeletePassword('');
        setDeletePasswordError(false);
        setEditingCoin(null);
      }
    } catch (error) {
      console.error('Error deleting coin:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingCoin(null);
    setDeletePassword('');
    setDeletePasswordError(false);
  };

  const handleSaveMapping = async () => {
    if (!editingMapping || !mappingFormState.trim()) return;

    try {
      // Delete old mapping if state name changed
      if (editingMapping.state !== mappingFormState.trim()) {
        await fetch(`/api/map-points?state=${encodeURIComponent(editingMapping.state)}`, {
          method: 'DELETE',
        });
      }

      // Save new/updated mapping
      await fetch('/api/map-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: mappingFormState.trim(),
          color: editingMapping.color
        })
      });

      await fetchColorMappings();
      setShowMappingModal(false);
      setEditingMapping(null);
      setMappingFormState('');
    } catch (error) {
      console.error('Error saving mapping:', error);
    }
  };

  const handleDeleteMapping = async (state: string) => {
    if (!confirm(`Delete mapping for ${state}?`)) return;

    try {
      await fetch(`/api/map-points?state=${encodeURIComponent(state)}`, {
        method: 'DELETE',
      });
      await fetchColorMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            💰 Ram & Dhruvan Coin Collection
          </h1>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'collection'
                ? 'bg-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-pink-50'
            }`}
          >
            📊 Collection
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'map'
                ? 'bg-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-pink-50'
            }`}
          >
            🗺️ Explore Princely States
          </button>
        </div>

        {activeTab === 'collection' && (
          <>
        {/* Password Protection / Add Coin Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {!isAuthenticated ? (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Admin Access Required</h2>
              <p className="text-gray-600 mb-4">Enter password to add or delete coins from the collection.</p>
              <form onSubmit={handlePasswordSubmit} className="max-w-md">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setShowPasswordError(false);
                    }}
                    placeholder="Enter password"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md transition duration-200"
                  >
                    Login
                  </button>
                </div>
                {showPasswordError && (
                  <p className="text-red-600 text-sm mt-2">Incorrect password. Please try again.</p>
                )}
              </form>
            </div>
          ) : (
            <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Coin</h2>
          <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Next Index:</span>{' '}
              <span className="text-pink-700 font-bold">{getNextIndex()}</span>
              <span className="text-gray-500 text-xs ml-2">(Page {getNextIndex().split('.')[0]}, Slot {getNextIndex().split('.')[1]})</span>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                list="sections-list"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value, subsection: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Select or type new section..."
                required
              />
              <datalist id="sections-list">
                {uniqueSections.map(section => (
                  <option key={section} value={section} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subsection
              </label>
              <input
                list="subsections-list"
                value={formData.subsection}
                onChange={(e) => setFormData({ ...formData, subsection: e.target.value, subsubsection: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Select or type new subsection..."
                required
              />
              <datalist id="subsections-list">
                {availableSubsections.map(subsection => (
                  <option key={subsection} value={subsection} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subsubsection (State) <span className="text-xs text-gray-500">- optional</span>
              </label>
              <input
                list="subsubsections-list"
                value={formData.subsubsection}
                onChange={(e) => setFormData({ ...formData, subsubsection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="None (will use Issuer) or type new..."
              />
              <datalist id="subsubsections-list">
                {availableSubsubsections.map(subsubsection => (
                  <option key={subsubsection} value={subsubsection} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Face Value
              </label>
              <input
                type="text"
                required
                value={formData.faceValue}
                onChange={(e) => setFormData({ ...formData, faceValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., 1 Cent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., USD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM Number
              </label>
              <input
                type="text"
                value={formData.kmNumber}
                onChange={(e) => setFormData({ ...formData, kmNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., KM# 132"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numista Number
              </label>
              <input
                type="text"
                value={formData.numistaNumber}
                onChange={(e) => setFormData({ ...formData, numistaNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numista Link
              </label>
              <input
                type="url"
                value={formData.numistaLink}
                onChange={(e) => setFormData({ ...formData, numistaLink: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="https://en.numista.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., 3.11g"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book
              </label>
              <input
                type="text"
                value={formData.book}
                onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., Red Book"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number & Notes
              </label>
              <input
                type="text"
                value={formData.numberAndNotes}
                onChange={(e) => setFormData({ ...formData, numberAndNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Notes..."
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obverse
              </label>
              <textarea
                value={formData.obverse}
                onChange={(e) => setFormData({ ...formData, obverse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Description of obverse side..."
                rows={2}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reverse
              </label>
              <textarea
                value={formData.reverse}
                onChange={(e) => setFormData({ ...formData, reverse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Description of reverse side..."
                rows={2}
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Add Coin
              </button>
            </div>
          </form>
            </div>
          )}
        </div>

        {/* Table of Contents */}
        {groupBySection && coins.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">Table of Contents</h2>
              <button
                onClick={() => setShowTOC(!showTOC)}
                className="px-3 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-md text-sm font-medium transition"
              >
                {showTOC ? 'Hide' : 'Show'}
              </button>
            </div>
            {showTOC && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(groupedCoins).sort().map((section) => {
                  const totalCoins = Object.values(groupedCoins[section]).reduce(
                    (sum, subsectionData) => sum + Object.values(subsectionData).reduce((s, coins) => s + coins.length, 0),
                    0
                  );
                  return (
                    <div key={section} className="border border-pink-200 rounded-lg p-4 hover:shadow-md transition">
                      <a
                        href={`#section-${section.replace(/\s+/g, '-').toLowerCase()}`}
                        className="text-lg font-bold text-pink-700 hover:text-pink-900 block mb-3"
                      >
                        {section}
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({totalCoins})
                        </span>
                      </a>
                      <ul className="space-y-2">
                        {sortSubsections(section, Object.keys(groupedCoins[section])).map((subsection) => {
                          const agencyKey = `${section}-${subsection}`;
                          const isExpanded = expandedAgencies.has(agencyKey);
                          const isPrincelyStates = section === 'Indian Princely States';
                          const subsubsections = Object.keys(groupedCoins[section][subsection]);
                          const hasMultipleStates = subsubsections.length > 1 || (subsubsections.length === 1 && subsubsections[0] !== 'Other');
                          const agencyCoins = Object.values(groupedCoins[section][subsection]).reduce((s, coins) => s + coins.length, 0);

                          return (
                            <li key={subsection}>
                              <div className="flex items-center">
                                {isPrincelyStates && hasMultipleStates && (
                                  <button
                                    onClick={() => toggleAgency(agencyKey)}
                                    className="mr-1 text-pink-600 hover:text-pink-800 focus:outline-none"
                                  >
                                    {isExpanded ? '▼' : '▶'}
                                  </button>
                                )}
                                <a
                                  href={`#subsection-${section.replace(/\s+/g, '-').toLowerCase()}-${subsection.replace(/\s+/g, '-').toLowerCase()}`}
                                  className="text-sm text-gray-700 hover:text-pink-700 hover:underline flex items-center flex-1"
                                >
                                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></span>
                                  {subsection}
                                  <span className="text-xs text-gray-500 ml-auto">
                                    ({agencyCoins})
                                  </span>
                                </a>
                              </div>
                              {isPrincelyStates && hasMultipleStates && isExpanded && (
                                <ul className="ml-6 mt-1 space-y-1">
                                  {Object.keys(groupedCoins[section][subsection]).sort().map((subsubsection) => {
                                    if (subsubsection === 'Other') return null;
                                    const stateCoins = groupedCoins[section][subsection][subsubsection].length;
                                    return (
                                      <li key={subsubsection}>
                                        <a
                                          href={`#subsubsection-${section.replace(/\s+/g, '-').toLowerCase()}-${subsection.replace(/\s+/g, '-').toLowerCase()}-${subsubsection.replace(/\s+/g, '-').toLowerCase()}`}
                                          className="text-xs text-gray-600 hover:text-pink-600 hover:underline flex items-center"
                                        >
                                          <span className="w-1 h-1 bg-pink-300 rounded-full mr-2"></span>
                                          {subsubsection}
                                          <span className="text-xs text-gray-400 ml-auto">
                                            ({stateCoins})
                                          </span>
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Coins Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-6 pb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Your Collection ({coins.length} coins)</h2>
            <button
              onClick={() => setGroupBySection(!groupBySection)}
              className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-md text-sm font-medium transition"
            >
              {groupBySection ? 'Show All' : 'Group by Section'}
            </button>
          </div>
          {coins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No coins in your collection yet. Add one above!</p>
          ) : groupBySection ? (
            <div className="p-6 pt-0">
              {Object.keys(groupedCoins).sort().map((section) => (
                <div
                  key={section}
                  id={`section-${section.replace(/\s+/g, '-').toLowerCase()}`}
                  className="mb-8 scroll-mt-4"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-pink-300">
                    {section}
                  </h3>
                  {sortSubsections(section, Object.keys(groupedCoins[section])).map((subsection) => {
                    const agencyCoins = Object.values(groupedCoins[section][subsection]).reduce((s, coins) => s + coins.length, 0);
                    return (
                      <div
                        key={subsection}
                        id={`subsection-${section.replace(/\s+/g, '-').toLowerCase()}-${subsection.replace(/\s+/g, '-').toLowerCase()}`}
                        className="mb-6 ml-4 scroll-mt-4"
                      >
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                          {subsection} ({agencyCoins} coins)
                        </h4>
                        {Object.keys(groupedCoins[section][subsection]).sort().map((subsubsection) => {
                          const stateCoins = groupedCoins[section][subsection][subsubsection];
                          const isPrincelyStates = section === 'Indian Princely States';
                          const showStateHeader = isPrincelyStates && subsubsection !== 'Other';

                          return (
                            <div
                              key={subsubsection}
                              id={showStateHeader ? `subsubsection-${section.replace(/\s+/g, '-').toLowerCase()}-${subsection.replace(/\s+/g, '-').toLowerCase()}-${subsubsection.replace(/\s+/g, '-').toLowerCase()}` : undefined}
                              className={showStateHeader ? "mb-4 ml-6 scroll-mt-4" : "mb-4"}
                            >
                              {showStateHeader && (
                                <h5 className="text-md font-medium text-gray-600 mb-2 flex items-center">
                                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></span>
                                  {subsubsection} ({stateCoins.length} coins)
                                </h5>
                              )}
                              <div className="overflow-x-auto">
                                <table className="w-full border border-gray-200 rounded">
                                  <thead className="bg-pink-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-20">Index</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Value</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Currency</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">KM#</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Numista#</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Weight</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stateCoins.map((coin) => (
                                      <tr key={coin.id} className="border-t border-gray-200 hover:bg-pink-25">
                                        <td
                                          className={`px-3 py-2 text-xs text-gray-800 font-medium ${isAuthenticated ? 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline' : ''}`}
                                          onClick={() => isAuthenticated && handleEditClick(coin)}
                                        >
                                          {coin.index}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.faceValue}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.currency}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.kmNumber}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">
                                          {coin.numistaLink ? (
                                            <a href={coin.numistaLink} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 underline">
                                              {coin.numistaNumber || 'Link'}
                                            </a>
                                          ) : (
                                            coin.numistaNumber || '-'
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.weight}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800 max-w-xs truncate">{coin.numberAndNotes}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-pink-100">
                  <tr>
                    <th onClick={() => handleSort('index')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-20">
                      Index {sortField === 'index' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('faceValue')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Face Value {sortField === 'faceValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('currency')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Currency {sortField === 'currency' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('kmNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      KM Number {sortField === 'kmNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numistaNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Numista # {sortField === 'numistaNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('weight')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('book')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-20">
                      Book {sortField === 'book' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numberAndNotes')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Number & Notes {sortField === 'numberAndNotes' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('obverse')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Obverse {sortField === 'obverse' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('reverse')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Reverse {sortField === 'reverse' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedCoins.map((coin) => (
                    <tr key={coin.id} className="hover:bg-gray-50">
                      <td
                        className={`px-4 py-3 text-xs text-gray-800 font-medium ${isAuthenticated ? 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline' : ''}`}
                        onClick={() => isAuthenticated && handleEditClick(coin)}
                      >
                        {coin.index}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.faceValue}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.currency}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.kmNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">
                        {coin.numistaLink ? (
                          <a href={coin.numistaLink} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 underline">
                            {coin.numistaNumber || 'Link'}
                          </a>
                        ) : (
                          coin.numistaNumber || '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.weight}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.book}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.numberAndNotes}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{coin.obverse}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{coin.reverse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Coin Modal */}
        {editingCoin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Coin - Index {editingCoin.index}
                </h3>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <input
                      list="edit-sections-list"
                      value={editFormData.section || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value, subsection: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Select or type new section..."
                    />
                    <datalist id="edit-sections-list">
                      {uniqueSections.map(section => (
                        <option key={section} value={section} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subsection</label>
                    <input
                      list="edit-subsections-list"
                      value={editFormData.subsection || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, subsection: e.target.value, subsubsection: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Select or type new subsection..."
                    />
                    <datalist id="edit-subsections-list">
                      {availableEditSubsections.map(subsection => (
                        <option key={subsection} value={subsection} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subsubsection (State) <span className="text-xs text-gray-500">- optional</span>
                    </label>
                    <input
                      list="edit-subsubsections-list"
                      value={editFormData.subsubsection || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, subsubsection: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="None (will use Issuer) or type new..."
                    />
                    <datalist id="edit-subsubsections-list">
                      {availableEditSubsubsections.map(subsubsection => (
                        <option key={subsubsection} value={subsubsection} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Face Value</label>
                    <input
                      type="text"
                      value={editFormData.faceValue || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, faceValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={editFormData.currency || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KM Number</label>
                    <input
                      type="text"
                      value={editFormData.kmNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, kmNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numista Number</label>
                    <input
                      type="text"
                      value={editFormData.numistaNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, numistaNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numista Link</label>
                    <input
                      type="url"
                      value={editFormData.numistaLink || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, numistaLink: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <input
                      type="text"
                      value={editFormData.weight || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                    <input
                      type="text"
                      value={editFormData.book || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, book: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number & Notes</label>
                    <input
                      type="text"
                      value={editFormData.numberAndNotes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, numberAndNotes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Obverse Description</label>
                    <textarea
                      value={editFormData.obverse || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, obverse: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reverse Description</label>
                    <textarea
                      value={editFormData.reverse || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, reverse: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleEditCancel}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setDeletingCoin(editingCoin);
                      setEditingCoin(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition"
                  >
                    Delete Coin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCoin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this coin?
              </p>
              <div className="bg-pink-50 border border-pink-200 rounded p-3 mb-4">
                <p className="text-sm"><span className="font-semibold">Index:</span> {deletingCoin.index}</p>
                <p className="text-sm"><span className="font-semibold">Section:</span> {deletingCoin.section} - {deletingCoin.subsection}</p>
                <p className="text-sm"><span className="font-semibold">Value:</span> {deletingCoin.faceValue} {deletingCoin.currency}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter password to confirm deletion:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeleteConfirm()}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
                {deletePasswordError && (
                  <p className="text-red-600 text-sm mt-2">Incorrect password. Deletion cancelled.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Explore Princely States</h2>

            {/* Agency Selector */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Agency</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from(new Set(
                  coins
                    .filter(c => c.section === 'Indian Princely States')
                    .map(c => c.subsection)
                    .filter(Boolean)
                )).sort().map(subsection => {
                  const subsectionStates = Array.from(new Set(
                    coins
                      .filter(c => c.section === 'Indian Princely States' && c.subsection === subsection)
                      .map(c => c.subsubsection)
                      .filter(Boolean)
                  ));
                  const mappedCount = subsectionStates.filter(state =>
                    colorMappings.some(m => m.state === state)
                  ).length;

                  return (
                    <button
                      key={subsection}
                      onClick={() => {
                        setSelectedSubsection(selectedSubsection === subsection ? null : subsection);
                        setSelectedState(null);
                      }}
                      className={`px-4 py-3 rounded-lg transition text-left ${
                        selectedSubsection === subsection
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{subsection}</div>
                      <div className={`text-xs mt-1 ${selectedSubsection === subsection ? 'text-purple-200' : 'text-gray-500'}`}>
                        {mappedCount}/{subsectionStates.length} mapped
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Map Section */}
              <div className="lg:col-span-3">
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                  {/* Zoom Controls - Only in View Mode */}
                  {!isAuthenticated && (
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      <button
                        onClick={() => setZoom(Math.min(zoom * 1.2, 5))}
                        className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center font-bold text-xl border border-gray-300"
                        title="Zoom In"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}
                        className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center font-bold text-xl border border-gray-300"
                        title="Zoom Out"
                      >
                        −
                      </button>
                      <button
                        onClick={() => {
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        }}
                        className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center text-xs border border-gray-300"
                        title="Reset Zoom"
                      >
                        ⟲
                      </button>
                      <div className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-xs border border-gray-300">
                        {Math.round(zoom * 100)}%
                      </div>
                    </div>
                  )}
                  <div className="relative overflow-hidden" style={{ cursor: !isAuthenticated && isPanning ? 'grabbing' : !isAuthenticated ? 'grab' : 'pointer' }}>
                    <canvas
                      ref={(canvas) => {
                        if (canvas && !canvas.dataset.initialized) {
                          canvas.dataset.initialized = 'true';
                          setMapCanvas(canvas);
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx?.drawImage(img, 0, 0);
                            // Save original image data for highlighting
                            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                            if (imageData) {
                              setOriginalImageData(imageData);
                            }
                          };
                          img.src = '/maps/princely-states.png';
                        }
                      }}
                      onClick={(e) => {
                        if (!isAuthenticated && isPanning) return; // Don't click while panning in view mode

                        const canvas = e.currentTarget;
                        const rect = canvas.getBoundingClientRect();

                        let x, y;
                        if (isAuthenticated) {
                          // Admin mode - simple click without zoom adjustment
                          x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
                          y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
                        } else {
                          // View mode - adjust for zoom and pan
                          const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
                          const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
                          x = Math.floor((clickX - pan.x) / zoom);
                          y = Math.floor((clickY - pan.y) / zoom);
                        }

                        const ctx = canvas.getContext('2d');
                        if (ctx && originalImageData) {
                          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                            const index = (y * canvas.width + x) * 4;
                            const pixel = originalImageData.data;
                            const color = `${pixel[index]},${pixel[index + 1]},${pixel[index + 2]}`;

                            // Find all states with this color
                            const mappings = colorMappings.filter(m => m.color === color);

                            if (mappings.length === 1) {
                              // Single state - select it
                              setSelectedState(mappings[0].state);
                            } else if (mappings.length > 1) {
                              // Multiple states share this color - show disambiguation
                              setAmbiguousStates({
                                color,
                                states: mappings.map(m => m.state)
                              });
                            } else {
                              // No mapping for this color
                              console.log('Clicked color:', color, 'at', x, y);
                              if (isAuthenticated) {
                                setEditingMapping({ state: '', color });
                                setMappingFormState('');
                                setShowMappingModal(true);
                              }
                            }
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        if (!isAuthenticated) {
                          setIsPanning(true);
                          setLastPanPosition({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (!isAuthenticated && isPanning) {
                          const dx = e.clientX - lastPanPosition.x;
                          const dy = e.clientY - lastPanPosition.y;
                          setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                          setLastPanPosition({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseUp={() => {
                        if (!isAuthenticated) setIsPanning(false);
                      }}
                      onMouseLeave={() => {
                        if (!isAuthenticated) setIsPanning(false);
                      }}
                      onWheel={(e) => {
                        if (!isAuthenticated) {
                          e.preventDefault();
                          const delta = e.deltaY > 0 ? 0.9 : 1.1;
                          setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
                        }
                      }}
                      style={!isAuthenticated ? {
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        transformOrigin: '0 0',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                      } : {}}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                {selectedState && (
                  <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Selected: {selectedState}</h3>
                    <p className="text-sm text-gray-600">
                      {coins.filter(c => c.section === 'Indian Princely States' && c.subsubsection === selectedState).length} coins in collection
                    </p>
                  </div>
                )}
              </div>

              {/* States List */}
              <div className="border-2 border-gray-300 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                {!selectedSubsection ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">👆 Select an agency above</p>
                    <p className="text-sm text-gray-400">to view its princely states</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-800 mb-4">
                      {selectedSubsection}
                    </h3>

                    {/* All States Button */}
                    <div className="mb-4">
                      <button
                        onClick={() => setSelectedState(null)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition font-semibold ${
                          !selectedState
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>🗺️ All States</span>
                          <span className="text-sm font-normal">
                            {Array.from(new Set(
                              coins
                                .filter(c => c.section === 'Indian Princely States' && c.subsection === selectedSubsection)
                                .map(c => c.subsubsection)
                                .filter(Boolean)
                            )).length} states
                          </span>
                        </div>
                      </button>
                    </div>

                {/* Mapped States */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                    <span className="mr-2">✓</span> Mapped on Map ({colorMappings.filter(m =>
                      coins.some(c =>
                        c.section === 'Indian Princely States' &&
                        c.subsubsection === m.state &&
                        (!selectedSubsection || c.subsection === selectedSubsection)
                      )
                    ).length})
                  </h4>
                  <div className="space-y-2">
                    {Array.from(new Set(
                      coins
                        .filter(c =>
                          c.section === 'Indian Princely States' &&
                          (!selectedSubsection || c.subsection === selectedSubsection)
                        )
                        .map(c => c.subsubsection)
                        .filter(Boolean)
                    )).sort().filter(state => colorMappings.some(m => m.state === state)).map(state => {
                      const stateCoins = coins.filter(
                        c => c.section === 'Indian Princely States' && c.subsubsection === state
                      );
                      return (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(selectedState === state ? null : state);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition ${
                            selectedState === state
                              ? 'bg-pink-600 text-white shadow-md'
                              : 'bg-green-50 hover:bg-pink-50 text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{state}</div>
                          <div className={`text-sm ${selectedState === state ? 'text-pink-100' : 'text-gray-500'}`}>
                            {stateCoins.length} coin{stateCoins.length !== 1 ? 's' : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unmapped States */}
                <div>
                  <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center">
                    <span className="mr-2">⚠</span> Not Mapped Yet ({Array.from(new Set(
                      coins
                        .filter(c =>
                          c.section === 'Indian Princely States' &&
                          (!selectedSubsection || c.subsection === selectedSubsection)
                        )
                        .map(c => c.subsubsection)
                        .filter(Boolean)
                    )).filter(state => !colorMappings.some(m => m.state === state)).length})
                  </h4>
                  <div className="space-y-2">
                    {Array.from(new Set(
                      coins
                        .filter(c =>
                          c.section === 'Indian Princely States' &&
                          (!selectedSubsection || c.subsection === selectedSubsection)
                        )
                        .map(c => c.subsubsection)
                        .filter(Boolean)
                    )).sort().filter(state => !colorMappings.some(m => m.state === state)).map(state => {
                      const stateCoins = coins.filter(
                        c => c.section === 'Indian Princely States' && c.subsubsection === state
                      );
                      return (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(selectedState === state ? null : state);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition ${
                            selectedState === state
                              ? 'bg-pink-600 text-white shadow-md'
                              : 'bg-orange-50 hover:bg-pink-50 text-gray-700 border border-orange-200'
                          }`}
                        >
                          <div className="font-medium">{state}</div>
                          <div className={`text-sm ${selectedState === state ? 'text-pink-100' : 'text-gray-500'}`}>
                            {stateCoins.length} coin{stateCoins.length !== 1 ? 's' : ''} • Click map to mark
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                  </>
                )}
              </div>
            </div>

            {/* Mapping Management - Admin Only */}
            {isAuthenticated && (
              <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🔧 Manage Color Mappings</h3>
                {/* Color Conflicts Warning */}
                {(() => {
                  const colorGroups = colorMappings.reduce((acc, m) => {
                    if (!acc[m.color]) acc[m.color] = [];
                    acc[m.color].push(m.state);
                    return acc;
                  }, {} as Record<string, string[]>);
                  const conflicts = Object.entries(colorGroups).filter(([_, states]) => states.length > 1);

                  if (conflicts.length > 0) {
                    return (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Color Conflicts Detected</h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          {conflicts.length} color{conflicts.length !== 1 ? 's are' : ' is'} shared by multiple states:
                        </p>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {conflicts.map(([color, states]) => (
                            <li key={color}>
                              <span className="font-mono">RGB({color})</span>: {states.join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {colorMappings
                    .filter(m => coins.some(c => c.section === 'Indian Princely States' && c.subsubsection === m.state))
                    .sort((a, b) => a.state.localeCompare(b.state))
                    .map(mapping => {
                      const hasDuplicate = colorMappings.filter(m => m.color === mapping.color).length > 1;
                      return (
                      <div key={mapping.state} className={`border rounded p-3 flex items-center justify-between ${
                        hasDuplicate ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                      }`}>
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {mapping.state}
                            {hasDuplicate && <span className="text-yellow-600 text-xs">⚠️</span>}
                          </div>
                          <div className="text-xs text-gray-500">RGB({mapping.color})</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingMapping(mapping);
                              setMappingFormState(mapping.state);
                              setShowMappingModal(true);
                            }}
                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMapping(mapping.state)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disambiguation Modal for Shared Colors */}
        {ambiguousStates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Multiple States Share This Color</h3>
              <div className="mb-4">
                <div className="h-12 rounded border border-gray-300 mb-3" style={{
                  backgroundColor: `rgb(${ambiguousStates.color})`
                }}></div>
                <p className="text-sm text-gray-600 mb-3">
                  This color is mapped to {ambiguousStates.states.length} states. Which state did you click on?
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ambiguousStates.states.map(state => {
                    const stateCoins = coins.filter(
                      c => c.section === 'Indian Princely States' && c.subsubsection === state
                    );
                    return (
                      <button
                        key={state}
                        onClick={() => {
                          setSelectedState(state);
                          setAmbiguousStates(null);
                        }}
                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-pink-50 rounded-lg border border-gray-200 transition"
                      >
                        <div className="font-medium text-gray-800">{state}</div>
                        <div className="text-sm text-gray-500">{stateCoins.length} coin{stateCoins.length !== 1 ? 's' : ''}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => setAmbiguousStates(null)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mapping Edit Modal */}
        {showMappingModal && editingMapping && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingMapping.state ? 'Edit Mapping' : 'Add New Mapping'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color: RGB({editingMapping.color})
                </label>
                <div className="h-8 rounded border border-gray-300" style={{
                  backgroundColor: `rgb(${editingMapping.color})`
                }}></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State Name
                </label>
                <input
                  list="all-states-list"
                  value={mappingFormState}
                  onChange={(e) => setMappingFormState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Select or type state name..."
                  autoFocus
                />
                <datalist id="all-states-list">
                  {Array.from(new Set(
                    coins
                      .filter(c => c.section === 'Indian Princely States')
                      .map(c => c.subsubsection)
                      .filter(Boolean)
                  )).sort().map(state => (
                    <option key={state} value={state} />
                  ))}
                </datalist>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMappingModal(false);
                    setEditingMapping(null);
                    setMappingFormState('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMapping}
                  disabled={!mappingFormState.trim()}
                  className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
