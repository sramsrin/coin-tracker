'use client';

import { useState, useEffect } from 'react';

interface Coin {
  id: string;
  index: string;
  section: string;
  subsection: string;
  subsubsection: string;
  issuer: string;
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
  const [formData, setFormData] = useState({
    index: '',
    section: '',
    subsection: '',
    subsubsection: '',
    issuer: '',
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
  }, []);

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
    const subsubsection = coin.subsubsection || 'Other';
    if (!groupedCoins[coin.section][coin.subsection][subsubsection]) {
      groupedCoins[coin.section][coin.subsection][subsubsection] = [];
    }
    groupedCoins[coin.section][coin.subsection][subsubsection].push(coin);
  });

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
          issuer: '',
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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/coins?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCoins();
      }
    } catch (error) {
      console.error('Error deleting coin:', error);
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
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., British India"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subsection
              </label>
              <input
                type="text"
                value={formData.subsection}
                onChange={(e) => setFormData({ ...formData, subsection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., George VI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuer
              </label>
              <input
                type="text"
                required
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., United States"
              />
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
                        {Object.keys(groupedCoins[section]).sort().map((subsection) => {
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
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-pink-300">
                    {section}
                  </h3>
                  {Object.keys(groupedCoins[section]).sort().map((subsection) => {
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
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Index</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Issuer</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Value</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Currency</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">KM#</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Numista#</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Link</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Weight</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Notes</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stateCoins.map((coin) => (
                                      <tr key={coin.id} className="border-t border-gray-200 hover:bg-pink-25">
                                        <td className="px-3 py-2 text-xs text-gray-800 font-medium">{coin.index}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.issuer}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.faceValue}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.currency}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.kmNumber}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.numistaNumber}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">
                                          {coin.numistaLink ? (
                                            <a href={coin.numistaLink} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 underline">
                                              Link
                                            </a>
                                          ) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.weight}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800 max-w-xs truncate">{coin.numberAndNotes}</td>
                                        <td className="px-3 py-2 text-xs">
                                          {isAuthenticated && (
                                            <button
                                              onClick={() => handleDelete(coin.id)}
                                              className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                              Del
                                            </button>
                                          )}
                                        </td>
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
                    <th onClick={() => handleSort('index')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Index {sortField === 'index' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('issuer')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Issuer {sortField === 'issuer' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('faceValue')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Face Value {sortField === 'faceValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('currency')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Currency {sortField === 'currency' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('kmNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      KM Number {sortField === 'kmNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numistaNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Numista # {sortField === 'numistaNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Numista Link</th>
                    <th onClick={() => handleSort('weight')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('book')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedCoins.map((coin) => (
                    <tr key={coin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-800 font-medium">{coin.index}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.issuer}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.faceValue}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.currency}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.kmNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.numistaNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">
                        {coin.numistaLink ? (
                          <a href={coin.numistaLink} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 underline">
                            Link
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.weight}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.book}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.numberAndNotes}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{coin.obverse}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{coin.reverse}</td>
                      <td className="px-4 py-3 text-xs">
                        <button
                          onClick={() => handleDelete(coin.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
