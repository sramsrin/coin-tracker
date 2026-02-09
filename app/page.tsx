'use client';

import { useState, useEffect } from 'react';

interface Coin {
  id: string;
  index: string;
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
  const [formData, setFormData] = useState({
    index: '',
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCoins = [...coins].sort((a, b) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Clear form
        setFormData({
          index: '',
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
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          💰 Lavender Coin Collection
        </h1>

        {/* Add Coin Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Coin</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Index
              </label>
              <input
                type="text"
                value={formData.index}
                onChange={(e) => setFormData({ ...formData, index: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 1.100"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Description of reverse side..."
                rows={2}
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Add Coin
              </button>
            </div>
          </form>
        </div>

        {/* Coins Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <h2 className="text-2xl font-semibold text-gray-700 p-6 pb-4">Your Collection</h2>
          {coins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No coins in your collection yet. Add one above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th onClick={() => handleSort('index')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Index {sortField === 'index' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('issuer')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Issuer {sortField === 'issuer' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('faceValue')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Face Value {sortField === 'faceValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('currency')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Currency {sortField === 'currency' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('kmNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      KM Number {sortField === 'kmNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numistaNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Numista # {sortField === 'numistaNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Numista Link</th>
                    <th onClick={() => handleSort('weight')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('book')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Book {sortField === 'book' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numberAndNotes')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Number & Notes {sortField === 'numberAndNotes' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('obverse')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
                      Obverse {sortField === 'obverse' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('reverse')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-200">
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
                          <a href={coin.numistaLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 underline">
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
