'use client';
// Test commit - responsive design updates

import { useState, useEffect, useRef } from 'react';

// Single Blog Card Component
function BlogCard({ url }: { url: string }) {
  const [metadata, setMetadata] = useState<{ title: string; description: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract domain for display
  let domain = '';
  let isBlogger = false;
  try {
    const urlObject = new URL(url);
    domain = urlObject.hostname;
    isBlogger = domain.includes('blogspot.com') || domain.includes('blogger.com');
  } catch {
    domain = '';
  }

  // Fetch metadata when component mounts
  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="border border-purple-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center p-2 gap-1 min-w-0"
    >
      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
        {isBlogger ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.976 24H2.026C.9 24 0 23.1 0 21.976V2.026C0 .9.9 0 2.025 0H22.05C23.1 0 24 .9 24 2.025v19.95C24 23.1 23.1 24 21.976 24zM12 3.975H9c-2.775 0-5.025 2.25-5.025 5.025v6c0 2.774 2.25 5.024 5.025 5.024h6c2.774 0 5.024-2.25 5.024-5.024v-3.975c0-.6-.45-1.05-1.05-1.05H18c-.524 0-.976-.45-.976-.976 0-2.776-2.25-5.026-5.024-5.026zm3.074 12h-6c-.525 0-.976-.45-.976-.975s.45-.976.976-.976h6c.525 0 .976.45.976.976s-.45.976-.976.976zm-2.55-3.024h-3.45c-.525 0-.976-.45-.976-.976s.45-.975.975-.975h3.45c.526 0 .976.45.976.975s-.45.976-.975.976z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </div>
      <span className="text-[10px] font-medium text-gray-800 line-clamp-2 text-center leading-tight min-w-0">
        {isLoading ? (
          <span className="text-gray-400 italic">...</span>
        ) : (
          metadata?.title || 'Blog Post'
        )}
      </span>
      <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
    </a>
  );
}

// BlogPreview Component for section introductions
function BlogPreview({ url }: { url: string }) {
  if (!url || url.trim() === '') {
    return null;
  }

  // Check if it contains multiple URLs (separated by newlines or commas)
  const urls = url.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 0);

  // Check if any of them are valid URLs
  const validUrls = urls.filter(u => {
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    // If no valid URLs, show as plain text (backwards compatibility)
    return (
      <div
        className="text-gray-600 whitespace-pre-wrap leading-relaxed"
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          lineHeight: '1.8',
          fontSize: '1.05rem',
          letterSpacing: '0.01em'
        }}
      >
        {url}
      </div>
    );
  }

  // Limit to 5 posts
  const displayUrls = validUrls.slice(0, 5);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {displayUrls.map((blogUrl, index) => (
        <BlogCard key={index} url={blogUrl} />
      ))}
    </div>
  );
}

/** Book slot is page.slot (e.g. 3.7). Coins not yet shelved use this exact string. */
const IN_TRANSIT_INDEX = 'In Transit';

function parseBookIndex(index: string): { page: number; slot: number } | null {
  const parts = index.trim().split('.');
  if (parts.length !== 2) return null;
  const page = parseInt(parts[0], 10);
  const slot = parseInt(parts[1], 10);
  if (Number.isNaN(page) || Number.isNaN(slot)) return null;
  return { page, slot };
}

function isInTransitIndex(index: string): boolean {
  return index.trim() === IN_TRANSIT_INDEX;
}

function CoinIndexDisplay({ index }: { index: string }) {
  if (isInTransitIndex(index)) {
    return <span className="text-amber-800 font-semibold">{index}</span>;
  }
  return <>{index}</>;
}

function compareIndexForSort(a: string, b: string): number {
  const aTransit = isInTransitIndex(a);
  const bTransit = isInTransitIndex(b);
  if (aTransit && bTransit) return 0;
  if (aTransit) return 1;
  if (bTransit) return -1;
  const ap = parseBookIndex(a);
  const bp = parseBookIndex(b);
  if (ap && bp) {
    if (ap.page !== bp.page) return ap.page - bp.page;
    return ap.slot - bp.slot;
  }
  return a.localeCompare(b);
}

const TARGET_STATES_BY_AGENCY: Record<string, string[]> = {
  'Rajputana Agency': ['Dholpur', 'Dungarpur', 'Jaisalmer', 'Kotah', 'Sirohi'],
  'Central India Agency': ['Bajranggarh', 'Bijawar', 'Chhatarpur', 'Datia', 'Indergadh', 'Jhabua', 'Orchha', 'Panna', 'Rewa'],
  'Western India States Agency': [
    'Ambliara', 'Bajana', 'Balwan', 'Baria', 'Bilkha', 'Bindraban', 'Broach', 'Chhota-Udaipur',
    'Gondal', 'Jasdan', 'Khadal', 'Mangrol', 'Mengani', 'Muli', 'Palitana', 'Rajkot', 'Sayala',
    'Vithalgadh', 'Wankaner', 'Cooch-Behar',
  ],
  'Punjab States Agency': ['Faridkot', 'Jind', 'Kapurthala', 'Malerkotla', 'Patiala'],
  'Punjab Hill States': ['Chamba', 'Jubbal', 'Sirmur'],
  'Deccan States Agency': ['Jamkhandi', 'Kolhapur', 'Miraj Senior'],
  'Eastern States Agency': ['Bamra'],
  'Kashmir Residency': ['Jammu and Kashmir'],
  'North-East/Bengal Context': ['Manipur', 'Tripura'],
  'Baluchistan/Sind Frontier': ['Kalat', 'Khairpur'],
  'Mixed/Uncertain Classification': [
    'Farrukhabad', 'Garhwal', 'Janjira', 'Kaithal', 'Nagpur', 'Nawalgarh', 'Rampur', 'Rohilkhand',
    'Chuda', 'Coorg',
  ],
};

function normalizeStateKey(value: string): string {
  const lower = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    awadh: 'oudh',
    coochbehar: 'coochbehar',
    'cooch-behar': 'coochbehar',
    bikanir: 'bikaner',
    sivaganga: 'sivagangai',
    pratabgarh: 'pratapgarh',
    pudukkottai: 'pudukottai',
  };
  const raw = lower.replace(/[^a-z0-9]/g, '');
  return aliases[raw] || raw;
}

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
  date: string;
  matchConfidence: 'High' | 'Medium' | 'Low' | 'None';
  purchasePrice: string;
  purchaseSource: string;
  purchaseDate: string;
  dateVerified?: string;
  image1Url?: string;
  image2Url?: string;
}

type SortField = keyof Coin;
type SortDirection = 'asc' | 'desc';

// British Royal Family Tree Data & Component
interface Monarch {
  name: string;
  reign: string;
  note?: string;
  hasCoin?: boolean;
  coinCount?: number;
  children?: Monarch[];
}

const ROYAL_TREE: Monarch = {
  name: 'George III',
  reign: '1760 - 1820',
  note: 'King during early British India',
  children: [
    { name: 'George IV', reign: '1820 - 1830' },
    { name: 'William IV', reign: '1830 - 1837', note: 'Uniform Coinage Act 1835', hasCoin: true, coinCount: 6 },
    {
      name: 'Edward, Duke of Kent',
      reign: '',
      note: 'Father of Victoria',
      children: [
        {
          name: 'Victoria',
          reign: '1837 - 1901',
          note: 'Empress of India from 1876',
          hasCoin: true,
          coinCount: 17,
          children: [
            {
              name: 'Edward VII',
              reign: '1901 - 1910',
              hasCoin: true,
              coinCount: 11,
              children: [
                {
                  name: 'George V',
                  reign: '1910 - 1936',
                  note: 'House name changed to Windsor 1917',
                  hasCoin: true,
                  coinCount: 13,
                  children: [
                    { name: 'Edward VIII', reign: '1936', note: 'Abdicated' },
                    {
                      name: 'George VI',
                      reign: '1936 - 1952',
                      note: 'Last Emperor of India (until 1947)',
                      hasCoin: true,
                      coinCount: 26,
                      children: [
                        { name: 'Elizabeth II', reign: '1952 - 2022' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function MonarchNode({ monarch }: { monarch: Monarch }) {
  return (
    <div className="relative">
      <div className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs sm:text-sm border-l-3 ${
        monarch.hasCoin
          ? 'bg-amber-50 border-amber-400'
          : 'bg-white border-purple-300'
      }`}>
        {monarch.hasCoin && <span className="text-amber-500 text-[10px]">&#x1FA99;</span>}
        <span className={`font-semibold ${monarch.hasCoin ? 'text-amber-900' : 'text-gray-800'}`}>{monarch.name}</span>
        {monarch.reign && <span className="text-gray-400 text-[10px] sm:text-xs">{monarch.reign}</span>}
        {monarch.hasCoin && monarch.coinCount && (
          <span className="text-amber-600 text-[10px] font-semibold">{monarch.coinCount} coins</span>
        )}
        {monarch.note && <span className="text-purple-500 text-[10px] italic hidden sm:inline">{monarch.note}</span>}
      </div>
      {monarch.children && monarch.children.length > 0 && (
        <div className="ml-3 sm:ml-5 mt-0.5 pl-3 sm:pl-4 border-l-2 border-purple-200 space-y-0.5">
          {monarch.children.map((child) => (
            <div key={child.name} className="relative">
              <div className="absolute -left-[14px] sm:-left-[18px] top-2 w-3 sm:w-4 border-t-2 border-purple-200"></div>
              <MonarchNode monarch={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BritishFamilyTree() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6">
      <div className="border-t border-purple-100 pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
            <span className="font-semibold text-sm">British Royal Family Tree</span>
            <span className="text-purple-200 text-xs hidden sm:inline">&middot; Hanover to Windsor</span>
          </div>
          <svg
            className={`w-4 h-4 text-purple-200 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-purple-100 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3 text-[10px] sm:text-xs text-gray-400">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-300 rounded text-amber-700 font-medium">&#x1FA99; In collection</span>
            </div>
            <MonarchNode monarch={ROYAL_TREE} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupBySection, setGroupBySection] = useState(true);
  const [showTOC, setShowTOC] = useState(true);
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [deletingCoin, setDeletingCoin] = useState<Coin | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Coin>>({});
  const [activeTab, setActiveTab] = useState<'collection' | 'map' | 'targets'>('map');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [colorMappings, setColorMappings] = useState<{state: string, color: string}[]>([]);
  const [mapCanvas, setMapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<{state: string, color: string} | null>(null);
  const [mappingFormState, setMappingFormState] = useState('');
  const [ambiguousStates, setAmbiguousStates] = useState<{color: string, states: string[]} | null>(null);
  // Zoom and pan removed - using simple pointer cursor instead
  // Pan state removed - using simple pointer cursor instead
  const [mapMode, setMapMode] = useState<'princely' | 'european' | 'presidencies'>('princely');
  const [europeanColorMappings, setEuropeanColorMappings] = useState<{state: string, color: string}[]>([]);
  const [europeanMapCanvas, setEuropeanMapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [europeanOriginalImageData, setEuropeanOriginalImageData] = useState<ImageData | null>(null);
  const [presidenciesColorMappings, setPresidenciesColorMappings] = useState<{state: string, color: string}[]>([]);
  const [presidenciesMapCanvas, setPresidenciesMapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [presidenciesOriginalImageData, setPresidenciesOriginalImageData] = useState<ImageData | null>(null);
  const [selectedPresidency, setSelectedPresidency] = useState<string | null>(null);
  const [textBoxValue, setTextBoxValue] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isTextLoadedRef = useRef(false);
  const initialTextRef = useRef('');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollPct, setTableScrollPct] = useState(0);
  const previousSelectionRef = useRef<{section: string | null, subsection: string | null, subsubsection: string | null}>({
    section: null,
    subsection: null,
    subsubsection: null
  });
  const [selectedEuropeanPower, setSelectedEuropeanPower] = useState<string | null>(null);
  const [selectedEuropeanCategory, setSelectedEuropeanCategory] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showAddCoinForm, setShowAddCoinForm] = useState(false);
  const [addCoinInTransit, setAddCoinInTransit] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [recentBlogUrls, setRecentBlogUrls] = useState<string[]>([]);
  const [lotDescription, setLotDescription] = useState('');
  const [lotDescriptionInitial, setLotDescriptionInitial] = useState('');
  const [lotDescriptionSaving, setLotDescriptionSaving] = useState(false);
  const [lotDescriptionSaveSuccess, setLotDescriptionSaveSuccess] = useState(false);
  // Image upload state for add form
  const [addImage1File, setAddImage1File] = useState<File | null>(null);
  const [addImage2File, setAddImage2File] = useState<File | null>(null);
  const [addImage1Preview, setAddImage1Preview] = useState<string | null>(null);
  const [addImage2Preview, setAddImage2Preview] = useState<string | null>(null);
  // Image upload state for edit form
  const [editImage1File, setEditImage1File] = useState<File | null>(null);
  const [editImage2File, setEditImage2File] = useState<File | null>(null);
  const [editImage1Preview, setEditImage1Preview] = useState<string | null>(null);
  const [editImage2Preview, setEditImage2Preview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
    date: '',
    matchConfidence: 'High' as 'High' | 'Medium' | 'Low' | 'None',
    purchasePrice: '',
    purchaseSource: '',
    purchaseDate: '',
    dateVerified: '',
  });

  // Load coins on mount and restore authentication
  useEffect(() => {
    fetchCoins();
    fetchColorMappings();
    fetchEuropeanColorMappings();
    fetchPresidenciesColorMappings();
    fetchTextNote();

    // Restore authentication from localStorage
    const savedAuth = localStorage.getItem('isAuthenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Restore state from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const sectionParam = params.get('section');
    const subsectionParam = params.get('subsection');
    const stateParam = params.get('state');

    if (tabParam === 'collection' || tabParam === 'map' || tabParam === 'targets') {
      setActiveTab(tabParam);
    }
    if (sectionParam) {
      setSelectedSection(sectionParam);
      if (sectionParam === 'British India Princely States') setMapMode('princely');
      else if (sectionParam === 'European Trading Companies') setMapMode('european');
      else if (sectionParam === 'British India Presidencies') setMapMode('presidencies');
    }
    if (subsectionParam) setSelectedSubsection(subsectionParam);
    if (stateParam) setSelectedState(stateParam);
    if (params.get('view') === 'all') {
      setGroupBySection(false);
      setActiveTab('collection');
    }

    // Fetch 3 most recent blog posts (excluding the fixed intro ones)
    const fetchRecentBlogs = async () => {
      try {
        const response = await fetch('/api/recent-blogs?count=3&exclude=about-our-coin-collection,how-did-joint-stock-limited-company');
        if (response.ok) {
          const data = await response.json();
          setRecentBlogUrls(data.posts.map((p: { url: string }) => p.url));
        }
      } catch (error) {
        console.error('Error fetching recent blogs:', error);
      }
    };
    fetchRecentBlogs();
  }, []);

  // Sync state to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'map') params.set('tab', activeTab);
    if (selectedSection) params.set('section', selectedSection);
    if (selectedSubsection) params.set('subsection', selectedSubsection);
    if (selectedState) params.set('state', selectedState);
    if (!groupBySection) params.set('view', 'all');

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [activeTab, selectedSection, selectedSubsection, selectedState, groupBySection]);

  // Fetch text note when selection changes (with auto-save)
  useEffect(() => {
    // Only fetch after initial load
    if (isTextLoadedRef.current) {
      // Auto-save current text before switching if there are unsaved changes
      const autoSaveAndFetch = async () => {
        if (hasUnsavedChanges && textBoxValue !== initialTextRef.current) {
          // Save to the PREVIOUS selection context
          await saveTextNote(textBoxValue, previousSelectionRef.current);
        }
        // Update the previous selection ref to current selection
        previousSelectionRef.current = getCurrentSelectionContext();
        // Fetch text for the new selection
        fetchTextNote();
      };
      autoSaveAndFetch();
    } else {
      // On first load, just update the previous selection ref
      previousSelectionRef.current = getCurrentSelectionContext();
    }
  }, [selectedSection, selectedSubsection, selectedState, selectedEuropeanCategory, selectedEuropeanPower, selectedPresidency]);

  // Auto-scroll to top when filters are applied and switching to collection tab
  useEffect(() => {
    if (activeTab === 'collection' && (selectedSection || selectedSubsection || selectedState)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, selectedSection, selectedSubsection, selectedState]);

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

  const fetchEuropeanColorMappings = async () => {
    try {
      const response = await fetch('/api/european-map-points');
      if (response.ok) {
        const data = await response.json();
        setEuropeanColorMappings(data);
      }
    } catch (error) {
      console.error('Error fetching European color mappings:', error);
    }
  };

  const fetchPresidenciesColorMappings = async () => {
    try {
      const response = await fetch('/api/presidencies-map-points');
      if (response.ok) {
        const data = await response.json();
        setPresidenciesColorMappings(data);
      }
    } catch (error) {
      console.error('Error fetching presidencies color mappings:', error);
    }
  };

  // Helper to get current selection context
  const getCurrentSelectionContext = () => {
    let section = selectedSection;
    let subsection = selectedSubsection || selectedEuropeanCategory || selectedPresidency;
    let subsubsection = selectedState || selectedEuropeanPower;

    return { section, subsection, subsubsection };
  };

  const fetchTextNote = async () => {
    try {
      const { section, subsection, subsubsection } = getCurrentSelectionContext();

      const params = new URLSearchParams();
      if (section) params.append('section', section);
      if (subsection) params.append('subsection', subsection);
      if (subsubsection) params.append('subsubsection', subsubsection);

      const response = await fetch(`/api/section-notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const text = data.text || '';
        setTextBoxValue(text);
        initialTextRef.current = text;
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error fetching text note:', error);
    } finally {
      // Mark as loaded regardless of success/failure
      isTextLoadedRef.current = true;
    }
  };

  const saveTextNote = async (text: string, context?: {section: string | null, subsection: string | null, subsubsection: string | null}) => {
    try {
      const { section, subsection, subsubsection } = context || getCurrentSelectionContext();

      await fetch('/api/section-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: section || undefined,
          subsection: subsection || undefined,
          subsubsection: subsubsection || undefined,
          text
        }),
      });
    } catch (error) {
      console.error('Error saving text note:', error);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveTextNote(textBoxValue);
      initialTextRef.current = textBoxValue;
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextChange = (newText: string) => {
    setTextBoxValue(newText);
    setHasUnsavedChanges(newText !== initialTextRef.current);
    setSaveSuccess(false);
  };

  // Lot description fetch/save for Indeterminate section
  const fetchLotDescription = async (subsection: string) => {
    try {
      const params = new URLSearchParams();
      params.append('section', 'Indeterminate');
      params.append('subsection', subsection);
      const response = await fetch(`/api/section-notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const text = data.text || '';
        setLotDescription(text);
        setLotDescriptionInitial(text);
      }
    } catch (error) {
      console.error('Error fetching lot description:', error);
    }
  };

  const saveLotDescription = async (subsection: string) => {
    setLotDescriptionSaving(true);
    setLotDescriptionSaveSuccess(false);
    try {
      await fetch('/api/section-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'Indeterminate',
          subsection,
          text: lotDescription,
        }),
      });
      setLotDescriptionInitial(lotDescription);
      setLotDescriptionSaveSuccess(true);
      setTimeout(() => setLotDescriptionSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving lot description:', error);
    } finally {
      setLotDescriptionSaving(false);
    }
  };

  const highlightEuropeanOnMap = (categoryNames: string[] | null) => {
    if (!europeanMapCanvas || !europeanOriginalImageData) return;

    const ctx = europeanMapCanvas.getContext('2d');
    if (!ctx) return;

    // Start with a copy of the original image data
    const imageData = ctx.createImageData(europeanOriginalImageData);
    imageData.data.set(europeanOriginalImageData.data);

    if (!categoryNames || categoryNames.length === 0) {
      // No selection - show original map
      ctx.putImageData(imageData, 0, 0);
      return;
    }

    // Get colors for selected trading company
    const selectedColors = categoryNames
      .map(name => {
        const mapping = europeanColorMappings.find(m => m.state === name);
        if (!mapping) return null;
        const [r, g, b] = mapping.color.split(',').map(Number);
        return { r, g, b };
      })
      .filter(Boolean) as { r: number; g: number; b: number }[];

    console.log('Selected regions:', categoryNames);
    console.log('Selected colors:', selectedColors);

    if (selectedColors.length === 0) {
      console.log('No colors mapped for selected regions');
      ctx.putImageData(imageData, 0, 0);
      return;
    }

    const data = imageData.data;
    const width = europeanMapCanvas.width;
    let keptCount = 0;
    let hiddenCount = 0;
    const coloredPixels: {x: number, y: number, r: number, g: number, b: number}[] = [];

    // First pass: hide everything except selected colors, black borders, and shared trading posts
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if this pixel matches the selected trading company's color
      const isSelectedColor = selectedColors.some(
        color => color.r === r && color.g === g && color.b === b
      );

      // Check if this pixel is black (borders) - pure black
      const isBlack = r < 30 && g < 30 && b < 30;

      // Check if this pixel is dark grey/near-black (shared trading posts)
      // Looking for dark colors that are close to black but not quite
      const isSharedTradingPost = !isBlack && (
        (r >= 30 && r <= 80 && g >= 30 && g <= 80 && b >= 30 && b <= 80) ||
        (r < 100 && g < 100 && b < 100 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20)
      );

      if (!isSelectedColor && !isBlack && !isSharedTradingPost) {
        // Hide everything that's not the selected color, black borders, or shared trading posts
        data[i] = 255;     // R - white
        data[i + 1] = 255; // G - white
        data[i + 2] = 255; // B - white
        hiddenCount++;
      } else {
        keptCount++;
        if (isSelectedColor) {
          // Store colored pixel positions for enlarging
          const pixelIndex = i / 4;
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          coloredPixels.push({x, y, r, g, b});
        }
      }
    }

    // Apply the hidden pixels first
    ctx.putImageData(imageData, 0, 0);

    // Second pass: enhance and enlarge the colored dots
    coloredPixels.forEach(pixel => {
      // Make colors pop more by increasing saturation and brightness
      const popR = Math.min(255, Math.floor(pixel.r * 1.3));
      const popG = Math.min(255, Math.floor(pixel.g * 1.3));
      const popB = Math.min(255, Math.floor(pixel.b * 1.3));

      ctx.fillStyle = `rgb(${popR},${popG},${popB})`;

      // Draw a small circle to make it 1.5x larger (radius ~1 pixel)
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 1, 0, 2 * Math.PI);
      ctx.fill();
    });

    console.log('Kept pixels:', keptCount);
    console.log('Hidden pixels:', hiddenCount);
    console.log('Enhanced dots:', coloredPixels.length);
  };

  // Highlight European trading company when selection changes
  useEffect(() => {
    if (activeTab === 'map' && mapMode === 'european') {
      let regionsToHighlight: string[] = [];

      if (selectedEuropeanCategory) {
        // Get all regions in this subsection that have color mappings
        // When subsubsection is empty, use the subsection name itself
        const subsectionRegions = Array.from(new Set(
          coins
            .filter(c => c.section === 'European Trading Companies' && c.subsection === selectedEuropeanCategory)
            .map(c => c.subsubsection || c.subsection)
        ));

        // Only include regions that have been mapped to colors
        regionsToHighlight = subsectionRegions.filter(region =>
          europeanColorMappings.some(m => m.state === region)
        );
      }

      highlightEuropeanOnMap(regionsToHighlight.length > 0 ? regionsToHighlight : null);
    }
  }, [selectedEuropeanPower, selectedEuropeanCategory, europeanColorMappings, europeanMapCanvas, europeanOriginalImageData, coins, activeTab, mapMode]);

  const highlightStateOnMap = (stateNames: string[] | null) => {
    if (!mapCanvas || !originalImageData) return;

    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;

    // Restore original image
    ctx.putImageData(originalImageData, 0, 0);

    if (!stateNames || stateNames.length === 0) {
      setIsHighlighting(false);
      return;
    }

    // Show loading spinner
    setIsHighlighting(true);

    // Use setTimeout to allow UI to update with loading spinner
    setTimeout(() => {
      // Get all colors for the states to highlight (including stripe/boundary variants)
      const targetColors = stateNames
        .flatMap(stateName => {
          const mappings = colorMappings.filter(m => m.state === stateName);
          return mappings.map(mapping => {
            const [r, g, b] = mapping.color.split(',').map(Number);
            return { r, g, b };
          });
        });

      if (targetColors.length === 0) {
        setIsHighlighting(false);
        return;
      }

      // Get image data and highlight the matching colors
      const imageData = ctx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if this pixel matches any target color
        const matchesTarget = targetColors.some(
          target => target.r === r && target.g === g && target.b === b
        );

        if (matchesTarget) {
          // Highlighted state - turn white for clarity
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          // Non-highlighted area - dim it (reduce brightness by 60%)
          data[i] = Math.floor(r * 0.4);
          data[i + 1] = Math.floor(g * 0.4);
          data[i + 2] = Math.floor(b * 0.4);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setIsHighlighting(false);
    }, 50);
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
          .filter(c => c.section === 'British India Princely States' && c.subsection === selectedSubsection)
          .map(c => c.subsubsection)
          .filter(Boolean);
      }

      highlightStateOnMap(statesToHighlight.length > 0 ? statesToHighlight : null);
    }
  }, [selectedState, selectedSubsection, colorMappings, mapCanvas, originalImageData, coins, activeTab]);

  const highlightPresidencyOnMap = (presidencyNames: string[] | null) => {
    if (!presidenciesMapCanvas || !presidenciesOriginalImageData) return;

    const ctx = presidenciesMapCanvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(presidenciesOriginalImageData, 0, 0);

    if (!presidencyNames || presidencyNames.length === 0) {
      setIsHighlighting(false);
      return;
    }

    setIsHighlighting(true);

    setTimeout(() => {
      const targetColors = presidencyNames
        .flatMap(name => {
          const mappings = presidenciesColorMappings.filter(m => m.state === name);
          return mappings.map(mapping => {
            const [r, g, b] = mapping.color.split(',').map(Number);
            return { r, g, b };
          });
        });

      if (targetColors.length === 0) {
        setIsHighlighting(false);
        return;
      }

      // Annexed district colors (Arcot, Madurai, Sivagangai, Tanjore) - turn white when highlighted
      const annexedColors = [
        {r:0,g:190,b:180}, {r:0,g:140,b:130}, {r:0,g:100,b:95},       // Arcot
        {r:220,g:120,b:50}, {r:170,g:85,b:30}, {r:160,g:80,b:30},     // Madurai
        {r:50,g:140,b:220}, {r:30,g:100,b:170}, {r:30,g:90,b:160},    // Ramnad/Sivagangai
        {r:255,g:50,b:120}, {r:200,g:35,b:90}, {r:155,g:25,b:65},     // Tanjore
      ];

      const imageData = ctx.getImageData(0, 0, presidenciesMapCanvas.width, presidenciesMapCanvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isAnnexed = annexedColors.some(
          c => c.r === r && c.g === g && c.b === b
        );

        const matchesTarget = targetColors.some(
          target => target.r === r && target.g === g && target.b === b
        );

        if (isAnnexed && matchesTarget) {
          // Annexed districts → white
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (matchesTarget) {
          // Presidency fill/border → brighten
          data[i] = Math.min(255, Math.floor(r * 1.5));
          data[i + 1] = Math.min(255, Math.floor(g * 1.5));
          data[i + 2] = Math.min(255, Math.floor(b * 1.5));
        } else {
          // Everything else → dim
          data[i] = Math.floor(r * 0.4);
          data[i + 1] = Math.floor(g * 0.4);
          data[i + 2] = Math.floor(b * 0.4);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setIsHighlighting(false);
    }, 50);
  };

  useEffect(() => {
    if (activeTab === 'map' && mapMode === 'presidencies') {
      if (selectedPresidency) {
        highlightPresidencyOnMap([selectedPresidency]);
      } else {
        highlightPresidencyOnMap(null);
      }
    }
  }, [selectedPresidency, presidenciesColorMappings, presidenciesMapCanvas, presidenciesOriginalImageData, activeTab, mapMode]);

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

  // Next book slot (page.slot). Ignores "In Transit" and any non-numeric index.
  const getNextIndex = () => {
    const bookCoins = coins.filter((c) => parseBookIndex(c.index) !== null);
    if (bookCoins.length === 0) return '1.1';

    const indices = bookCoins.map((coin) => parseBookIndex(coin.index)!);

    const maxIndex = indices.reduce((max, current) => {
      if (current.page > max.page) return current;
      if (current.page === max.page && current.slot > max.slot) return current;
      return max;
    }, { page: 0, slot: 0 });

    if (maxIndex.slot < 12) {
      return `${maxIndex.page}.${maxIndex.slot + 1}`;
    }
    return `${maxIndex.page + 1}.1`;
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

    // Special handling for index field (page.slot format; in-transit sorts after shelved coins)
    if (sortField === 'index') {
      const ia = String(aValue);
      const ib = String(bValue);
      const aTransit = isInTransitIndex(ia);
      const bTransit = isInTransitIndex(ib);
      if (aTransit && bTransit) return 0;
      if (aTransit) return sortDirection === 'asc' ? 1 : -1;
      if (bTransit) return sortDirection === 'asc' ? -1 : 1;
      const aParsed = parseBookIndex(ia);
      const bParsed = parseBookIndex(ib);
      if (aParsed && bParsed) {
        if (aParsed.page !== bParsed.page) {
          return sortDirection === 'asc' ? aParsed.page - bParsed.page : bParsed.page - aParsed.page;
        }
        return sortDirection === 'asc' ? aParsed.slot - bParsed.slot : bParsed.slot - aParsed.slot;
      }
      return sortDirection === 'asc' ? ia.localeCompare(ib) : ib.localeCompare(ia);
    }

    // Special handling for date field (numeric year sorting)
    if (sortField === 'date') {
      const aYear = parseInt(aValue) || 0;
      const bYear = parseInt(bValue) || 0;
      return sortDirection === 'asc' ? aYear - bYear : bYear - aYear;
    }

    // Special handling for purchaseDate (parse as date for chronological sorting)
    if (sortField === 'purchaseDate' || sortField === 'dateVerified') {
      const aTime = aValue ? new Date(aValue).getTime() : 0;
      const bTime = bValue ? new Date(bValue).getTime() : 0;
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    }

    // Special handling for purchasePrice (strip $ sign for numeric sorting)
    if (sortField === 'purchasePrice') {
      const aNum = parseFloat(aValue.replace(/[$,]/g, '')) || 0;
      const bNum = parseFloat(bValue.replace(/[$,]/g, '')) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
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
  // Falls back to earliest coin date in the subsection if no year in the name
  const extractYear = (subsection: string, coins?: Coin[]): number => {
    const match = subsection.match(/\((\d{4})/);
    if (match) return parseInt(match[1]);
    if (coins && coins.length > 0) {
      const years = coins.map(c => parseInt(c.date)).filter(y => !isNaN(y));
      if (years.length > 0) return Math.min(...years);
    }
    return 9999;
  };

  // Helper function to sort subsections (by date for British India, alphabetically for others)
  const sortSubsections = (section: string, subsections: string[], sectionData?: Record<string, Record<string, Coin[]>>): string[] => {
    if (section.startsWith('British India')) {
      return subsections.sort((a, b) => {
        const coinsA = sectionData ? Object.values(sectionData[a] || {}).flat() : [];
        const coinsB = sectionData ? Object.values(sectionData[b] || {}).flat() : [];
        return extractYear(a, coinsA) - extractYear(b, coinsB);
      });
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

    // If password input isn't shown yet, just show it
    if (!showPasswordInput) {
      setShowPasswordInput(true);
      return;
    }

    // Simple password check - in production, this should be done server-side
    if (password === 'SRMPv7006@') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setPassword('');
      setShowPasswordError(false);
      setShowPasswordInput(false);
    } else {
      setShowPasswordError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setPassword('');
    setShowPasswordError(false);
    setShowPasswordInput(false);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coinData = {
      ...formData,
      index: addCoinInTransit ? IN_TRANSIT_INDEX : (formData.index?.trim() || getNextIndex()),
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
        const newCoin = await response.json();

        // Upload images if selected
        if (addImage1File || addImage2File) {
          setIsUploading(true);
          const imageUpdates: Record<string, string> = {};
          if (addImage1File) {
            const url = await uploadImage(addImage1File);
            if (url) imageUpdates.image1Url = url;
          }
          if (addImage2File) {
            const url = await uploadImage(addImage2File);
            if (url) imageUpdates.image2Url = url;
          }
          if (Object.keys(imageUpdates).length > 0) {
            await fetch(`/api/coins?id=${newCoin.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newCoin, ...imageUpdates }),
            });
          }
          setIsUploading(false);
        }

        // Clear form
        setAddCoinInTransit(false);
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
          date: '',
          matchConfidence: 'High' as 'High' | 'Medium' | 'Low' | 'None',
          purchasePrice: '',
          purchaseSource: '',
          purchaseDate: '',
          dateVerified: '',
        });
        // Clear image state
        setAddImage1File(null);
        setAddImage2File(null);
        setAddImage1Preview(null);
        setAddImage2Preview(null);
        // Refresh coins list
        fetchCoins();
      }
    } catch (error) {
      console.error('Error adding coin:', error);
    }
  };

  const handleEditClick = (coin: Coin) => {
    setEditingCoin(coin);
    setEditImage1File(null);
    setEditImage2File(null);
    setEditImage1Preview(null);
    setEditImage2Preview(null);
    setEditFormData({
      index: coin.index,
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
      matchConfidence: coin.matchConfidence,
      purchasePrice: coin.purchasePrice,
      purchaseSource: coin.purchaseSource,
      purchaseDate: coin.purchaseDate,
      dateVerified: coin.dateVerified,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingCoin) return;

    try {
      // Upload new images if selected
      setIsUploading(true);
      const imageUpdates: Record<string, string> = {};
      if (editImage1File) {
        const url = await uploadImage(editImage1File);
        if (url) imageUpdates.image1Url = url;
      }
      if (editImage2File) {
        const url = await uploadImage(editImage2File);
        if (url) imageUpdates.image2Url = url;
      }
      setIsUploading(false);

      const response = await fetch(`/api/coins?id=${editingCoin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingCoin,
          ...editFormData,
          // Preserve existing image URLs, override with new uploads
          image1Url: imageUpdates.image1Url || editingCoin.image1Url || '',
          image2Url: imageUpdates.image2Url || editingCoin.image2Url || '',
        }),
      });

      if (response.ok) {
        fetchCoins();
        setEditingCoin(null);
        setEditFormData({});
        setEditImage1File(null);
        setEditImage2File(null);
        setEditImage1Preview(null);
        setEditImage2Preview(null);
      }
    } catch (error) {
      console.error('Error updating coin:', error);
      setIsUploading(false);
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

  const handleSaveEuropeanMapping = async () => {
    if (!editingMapping || !mappingFormState.trim()) return;

    try {
      if (editingMapping.state !== mappingFormState.trim()) {
        await fetch(`/api/european-map-points?state=${encodeURIComponent(editingMapping.state)}`, {
          method: 'DELETE',
        });
      }

      await fetch('/api/european-map-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: mappingFormState.trim(),
          color: editingMapping.color
        })
      });

      await fetchEuropeanColorMappings();
      setShowMappingModal(false);
      setEditingMapping(null);
      setMappingFormState('');
    } catch (error) {
      console.error('Error saving European mapping:', error);
    }
  };

  const handleDeleteEuropeanMapping = async (state: string) => {
    if (!confirm(`Delete mapping for ${state}?`)) return;

    try {
      await fetch(`/api/european-map-points?state=${encodeURIComponent(state)}`, {
        method: 'DELETE',
      });
      await fetchEuropeanColorMappings();
    } catch (error) {
      console.error('Error deleting European mapping:', error);
    }
  };

  const handleSavePresidenciesMapping = async () => {
    if (!editingMapping || !mappingFormState.trim()) return;

    try {
      if (editingMapping.state !== mappingFormState.trim()) {
        await fetch(`/api/presidencies-map-points?state=${encodeURIComponent(editingMapping.state)}`, {
          method: 'DELETE',
        });
      }

      await fetch('/api/presidencies-map-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: mappingFormState.trim(),
          color: editingMapping.color
        })
      });

      await fetchPresidenciesColorMappings();
      setShowMappingModal(false);
      setEditingMapping(null);
      setMappingFormState('');
    } catch (error) {
      console.error('Error saving presidencies mapping:', error);
    }
  };

  const handleDeletePresidenciesMapping = async (state: string) => {
    if (!confirm(`Delete mapping for ${state}?`)) return;

    try {
      await fetch(`/api/presidencies-map-points?state=${encodeURIComponent(state)}`, {
        method: 'DELETE',
      });
      await fetchPresidenciesColorMappings();
    } catch (error) {
      console.error('Error deleting presidencies mapping:', error);
    }
  };

  const indeterminateCount = coins.filter((c) => c.section === 'Indeterminate').length;
  const inTransitCount = coins.filter((c) => isInTransitIndex(c.index)).length;
  const onNumistaCount = coins.filter((c) => c.numistaLink && !isInTransitIndex(c.index)).length;
  const ownedPrincelyStateKeys = new Set(
    coins
      .filter((coin) => coin.section === 'British India Princely States')
      .flatMap((coin) => [coin.subsubsection, coin.subsection])
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => normalizeStateKey(value))
  );
  const unresolvedTargetsByAgency = Object.entries(TARGET_STATES_BY_AGENCY)
    .map(([agency, states]) => ({
      agency,
      states: states.filter((state) => !ownedPrincelyStateKeys.has(normalizeStateKey(state))),
    }))
    .filter((entry) => entry.states.length > 0);
  const totalRemainingTargets = unresolvedTargetsByAgency.reduce((sum, entry) => sum + entry.states.length, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              Ram & Dhruvan Coin Collection
            </h1>

            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm ${
                  activeTab === 'map'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-pink-50'
                }`}
              >
                🗺️ Explore
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm ${
                  activeTab === 'collection'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-pink-50'
                }`}
              >
                📊 Collection
              </button>
              <button
                onClick={() => setActiveTab('targets')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm ${
                  activeTab === 'targets'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-pink-50'
                }`}
              >
                🎯 Targets
              </button>
            </div>
          </div>

          {/* Admin Login / Logout */}
          {!isAuthenticated ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {showPasswordInput && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setShowPasswordError(false);
                  }}
                  placeholder="Admin password"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm w-full sm:w-auto"
                  autoFocus
                />
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md transition duration-200 text-sm whitespace-nowrap"
              >
                Login
              </button>
              {showPasswordError && (
                <span className="text-red-600 text-xs">Incorrect password</span>
              )}
            </form>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAddCoinForm(!showAddCoinForm)}
                className="px-3 sm:px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap"
              >
                {showAddCoinForm ? 'Hide' : 'Add Coin'}
              </button>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-xs sm:text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {activeTab === 'collection' && (
          <>
        {/* Add Coin Form - Admin Only */}
        {isAuthenticated && showAddCoinForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Coin</h2>
          <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-md space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addCoinInTransit}
                onChange={(e) => {
                  const on = e.target.checked;
                  setAddCoinInTransit(on);
                  setFormData((fd) => ({ ...fd, index: on ? IN_TRANSIT_INDEX : '' }));
                }}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span>In transit — use index &quot;{IN_TRANSIT_INDEX}&quot; until the coin is shelved</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Index:</span>
              <input
                type="text"
                disabled={addCoinInTransit}
                value={addCoinInTransit ? IN_TRANSIT_INDEX : (formData.index || getNextIndex())}
                onChange={(e) => setFormData({ ...formData, index: e.target.value })}
                className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm font-bold text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-amber-50 disabled:text-amber-900"
              />
              {!addCoinInTransit && (
                <span className="text-gray-500 text-xs">(next free slot: {getNextIndex()})</span>
              )}
            </div>
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
                Date
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., 1850, 1800-1820, 19th century"
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
                Reference Number
              </label>
              <input
                type="text"
                value={formData.numistaNumber}
                onChange={(e) => setFormData({ ...formData, numistaNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., N12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Link
              </label>
              <input
                type="url"
                value={formData.numistaLink}
                onChange={(e) => {
                  const link = e.target.value;
                  const updates: Partial<typeof formData> = { numistaLink: link };
                  // Extract Numista number from URL and prefix with N
                  const match = link.match(/pieces(\d+)/);
                  if (match) {
                    updates.numistaNumber = `N${match[1]}`;
                  }
                  setFormData({ ...formData, ...updates });
                }}
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
                Match Confidence
              </label>
              <select
                value={formData.matchConfidence}
                onChange={(e) => setFormData({ ...formData, matchConfidence: e.target.value as 'High' | 'Medium' | 'Low' | 'None' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="None">None</option>
              </select>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price
              </label>
              <input
                type="text"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g. $10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Source
              </label>
              <input
                type="text"
                value={formData.purchaseSource}
                onChange={(e) => setFormData({ ...formData, purchaseSource: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g. eBay, dealer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                type="text"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g. March 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Verified
              </label>
              <input
                type="text"
                value={formData.dateVerified}
                onChange={(e) => setFormData({ ...formData, dateVerified: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g. 2024-03-31"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Coin Images</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Image 1 (Obverse)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAddImage1File(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAddImage1Preview(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setAddImage1Preview(null);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  />
                  {addImage1Preview && (
                    <img src={addImage1Preview} alt="Preview 1" className="mt-2 h-24 rounded border border-gray-200 object-contain" />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Image 2 (Reverse)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAddImage2File(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAddImage2Preview(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setAddImage2Preview(null);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  />
                  {addImage2Preview && (
                    <img src={addImage2Preview} alt="Preview 2" className="mt-2 h-24 rounded border border-gray-200 object-contain" />
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                {isUploading ? 'Uploading...' : 'Add Coin'}
              </button>
            </div>
          </form>
            </div>
        </div>
        )}

        {/* Table of Contents */}
        {groupBySection && coins.length > 0 && !selectedSection && !selectedSubsection && !selectedState && (
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
                        {sortSubsections(section, Object.keys(groupedCoins[section]), groupedCoins[section]).map((subsection) => {
                          const agencyKey = `${section}-${subsection}`;
                          const isExpanded = expandedAgencies.has(agencyKey);
                          const isPrincelyStates = section === 'British India Princely States';
                          const isMadrasPresidencyTerritories = section === 'Older Indian Kingdoms';
                          const subsubsections = Object.keys(groupedCoins[section][subsection]);
                          const hasMultipleStates = subsubsections.length > 1 || (subsubsections.length === 1 && subsubsections[0] !== 'Other');
                          const agencyCoins = Object.values(groupedCoins[section][subsection]).reduce((s, coins) => s + coins.length, 0);

                          return (
                            <li key={subsection}>
                              <div className="flex items-center">
                                {(isPrincelyStates || isMadrasPresidencyTerritories) && hasMultipleStates && (
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
                              {(isPrincelyStates || isMadrasPresidencyTerritories) && hasMultipleStates && isExpanded && (
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
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-gray-700">
                Your Collection ({coins.length} coins)
              </h2>
              <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  On Numista:{' '}
                  <a
                    href="https://en.numista.com/echanges/profil.php?id=403952"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-pink-700 hover:text-pink-800 underline"
                  >
                    {onNumistaCount}
                  </a>
                </span>
                <span>
                  Indeterminate: <span className="font-semibold text-gray-700">{indeterminateCount}</span>
                </span>
                <span>
                  In transit: <span className="font-semibold text-gray-700">{inTransitCount}</span>
                </span>
              </div>
            </div>
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
              {/* Active Filters Banner */}
              {(selectedSection || selectedSubsection || selectedState) && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-blue-800">Filtered view: </span>
                      <span className="text-blue-700">
                        {selectedSection && `${selectedSection}`}
                        {selectedSubsection && ` > ${selectedSubsection}`}
                        {selectedState && ` > ${selectedState}`}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                        setSelectedState(null);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                    >
                      Clear Filter
                    </button>
                  </div>
                </div>
              )}
              {(() => {
                console.log('Collection view filters - Section:', selectedSection, 'Subsection:', selectedSubsection, 'State:', selectedState);
                const sectionsToShow = Object.keys(groupedCoins).sort().filter(section => !selectedSection || section === selectedSection);
                console.log('Sections to show:', sectionsToShow);
                return sectionsToShow;
              })().map((section) => (
                <div
                  key={section}
                  id={`section-${section.replace(/\s+/g, '-').toLowerCase()}`}
                  className="mb-8 scroll-mt-4"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-pink-300">
                    {section}
                  </h3>
                  {(() => {
                    const allSubsections = sortSubsections(section, Object.keys(groupedCoins[section]), groupedCoins[section]);
                    const filteredSubsections = allSubsections.filter(subsection => !selectedSubsection || subsection === selectedSubsection);
                    console.log('Section:', section, '| All subsections:', allSubsections, '| Filtered subsections:', filteredSubsections, '| Filter value:', selectedSubsection);
                    return filteredSubsections;
                  })().map((subsection) => {
                    const agencyCoins = Object.values(groupedCoins[section][subsection]).reduce((s, coins) => s + coins.length, 0);
                    return (
                      <div
                        key={subsection}
                        id={`subsection-${section.replace(/\s+/g, '-').toLowerCase()}-${subsection.replace(/\s+/g, '-').toLowerCase()}`}
                        className="mb-6 ml-4 scroll-mt-4"
                      >
                        <div className="mb-3 hidden">
                          <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                            <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                            {subsection} ({agencyCoins} coins)
                          </h4>
                        </div>
                        {(() => {
                          const allSubsubsections = Object.keys(groupedCoins[section][subsection]).sort();
                          const filteredSubsubsections = allSubsubsections.filter(subsubsection => !selectedState || subsubsection === selectedState);
                          console.log('Subsection:', subsection, '| All subsubsections:', allSubsubsections, '| Filtered:', filteredSubsubsections, '| Filter value:', selectedState);
                          return filteredSubsubsections;
                        })().map((subsubsection) => {
                          const stateCoins = groupedCoins[section][subsection][subsubsection];
                          const isPrincelyStates = section === 'British India Princely States';
                          const isMadrasPresidencyTerritories = section === 'Older Indian Kingdoms';
                          const showStateHeader = (isPrincelyStates || isMadrasPresidencyTerritories) && subsubsection !== 'Other';

                          return (
                            <div
                              key={subsubsection}
                              id={`subsubsection-${section.replace(/\s+/g, '-').toLowerCase()}-${subsection.replace(/\s+/g, '-').toLowerCase()}-${subsubsection.replace(/\s+/g, '-').toLowerCase()}`}
                              className="mb-4 ml-4 scroll-mt-4"
                            >
                              <div className="mb-2">
                                <h5 className="text-md font-medium text-gray-600 flex items-center">
                                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></span>
                                  {subsubsection === 'All' ? subsection : subsubsection} ({stateCoins.length} coins)
                                </h5>
                                {(subsubsection === 'Kishangarh/Jaipur' || (subsubsection === 'All' && subsection === 'Kishangarh/Jaipur')) && (
                                  <div className="ml-4 mt-1 text-xs italic text-gray-400 max-w-2xl leading-relaxed">
                                    Kishangarh issued coins that imitated Jaipur. So its hard to determine if these are Jaipur or Kishangarh.
                                  </div>
                                )}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full border border-gray-200 rounded">
                                  <thead className="bg-pink-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-20">Index</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Value</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Currency</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Date</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Reference#</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Weight</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-20">
                                        <span className="relative group">
                                          Confidence
                                          <span className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-[9px] font-bold cursor-pointer">?</span>
                                          <span className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 w-56 p-2 bg-gray-800 text-white text-[10px] font-normal rounded shadow-lg leading-relaxed">
                                            <b>High:</b> Issuer and coin match.<br/>
                                            <b>Medium:</b> Issuer matches but exact coin is uncertain.<br/>
                                            <b>Low:</b> Even issuer is uncertain.
                                          </span>
                                        </span>
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Verified</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Images</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Obverse</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Reverse</th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">KM#</th>
                                      {isAuthenticated && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-20">Price</th>}
                                      {isAuthenticated && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-20">Source</th>}
                                      {isAuthenticated && (
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Purchased</th>
                                      )}
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Book & Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stateCoins.map((coin) => (
                                      <tr key={coin.id} className="border-t border-gray-200 hover:bg-pink-25">
                                        <td
                                          className={`px-3 py-2 text-xs text-gray-800 font-medium ${isAuthenticated ? 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline' : ''}`}
                                          onClick={() => isAuthenticated && handleEditClick(coin)}
                                        >
                                          <CoinIndexDisplay index={coin.index} />
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.faceValue}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.currency}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.date}</td>
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
                                        <td className="px-3 py-2 text-xs text-gray-800">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${coin.matchConfidence === 'High' ? 'bg-green-100 text-green-800' : coin.matchConfidence === 'Medium' ? 'bg-blue-100 text-blue-800' : coin.matchConfidence === 'None' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {coin.matchConfidence}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.dateVerified}</td>
                                        <td className="px-3 py-2 text-xs">
                                          <div className="flex gap-1">
                                            {coin.image1Url && (
                                              <a href={coin.image1Url} target="_blank" rel="noopener noreferrer">
                                                <img src={coin.image1Url} alt="Obverse" className="h-10 w-10 object-cover rounded border border-gray-200 hover:border-pink-400 transition" />
                                              </a>
                                            )}
                                            {coin.image2Url && (
                                              <a href={coin.image2Url} target="_blank" rel="noopener noreferrer">
                                                <img src={coin.image2Url} alt="Reverse" className="h-10 w-10 object-cover rounded border border-gray-200 hover:border-pink-400 transition" />
                                              </a>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-800 max-w-xs truncate">{coin.obverse}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800 max-w-xs truncate">{coin.reverse}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800">{coin.kmNumber}</td>
                                        {isAuthenticated && <td className="px-3 py-2 text-xs text-gray-800">{coin.purchasePrice}</td>}
                                        {isAuthenticated && <td className="px-3 py-2 text-xs text-gray-800">{coin.purchaseSource}</td>}
                                        {isAuthenticated && <td className="px-3 py-2 text-xs text-gray-800">{coin.purchaseDate}</td>}
                                        <td className="px-3 py-2 text-xs text-gray-800 max-w-xs truncate">{[coin.book, coin.numberAndNotes].filter(Boolean).join(' - ')}</td>
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
            <>
            {/* Top scroll slider that syncs with the table */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs text-gray-400 select-none">←</span>
              <input
                type="range"
                min={0}
                max={100}
                value={tableScrollPct}
                onChange={(e) => {
                  const el = tableScrollRef.current;
                  if (el) {
                    const pct = Number(e.target.value) / 100;
                    el.scrollLeft = pct * (el.scrollWidth - el.clientWidth);
                    setTableScrollPct(Number(e.target.value));
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-xs text-gray-400 select-none">→</span>
            </div>
            <div
              ref={tableScrollRef}
              onScroll={() => {
                const el = tableScrollRef.current;
                if (el && el.scrollWidth > el.clientWidth) {
                  setTableScrollPct((el.scrollLeft / (el.scrollWidth - el.clientWidth)) * 100);
                }
              }}
              className="overflow-x-auto max-h-[80vh] overflow-y-auto border border-gray-200 rounded-lg"
            >
              <table className="min-w-[1400px] w-full">
                <thead className="bg-pink-100 sticky top-0 z-10">
                  <tr>
                    <th onClick={() => handleSort('index')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-20">
                      Index {sortField === 'index' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('subsubsection')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      State {sortField === 'subsubsection' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('faceValue')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Face Value {sortField === 'faceValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('currency')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Currency {sortField === 'currency' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('date')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('numistaNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Reference # {sortField === 'numistaNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('weight')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('matchConfidence')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      <span className="relative group">
                        Match Confidence {sortField === 'matchConfidence' && (sortDirection === 'asc' ? '↑' : '↓')}
                        <span className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-[9px] font-bold cursor-pointer">?</span>
                        <span className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 w-56 p-2 bg-gray-800 text-white text-[10px] font-normal rounded shadow-lg leading-relaxed">
                          <b>High:</b> Issuer and coin match.<br/>
                          <b>Medium:</b> Issuer matches but exact coin is uncertain.<br/>
                          <b>Low:</b> Even issuer is uncertain.
                        </span>
                      </span>
                    </th>
                    <th onClick={() => handleSort('dateVerified')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      Verified {sortField === 'dateVerified' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Images
                    </th>
                    <th onClick={() => handleSort('obverse')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Obverse {sortField === 'obverse' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('reverse')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Reverse {sortField === 'reverse' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('kmNumber')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                      KM Number {sortField === 'kmNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    {isAuthenticated && (
                      <th onClick={() => handleSort('purchasePrice')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                        Price {sortField === 'purchasePrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {isAuthenticated && (
                      <th onClick={() => handleSort('purchaseSource')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                        Source {sortField === 'purchaseSource' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}
                    {isAuthenticated && (
                      <th onClick={() => handleSort('purchaseDate')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200 w-24">
                        Purchased {sortField === 'purchaseDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    )}

                    <th onClick={() => handleSort('book')} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-pink-200">
                      Book & Notes {sortField === 'book' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                        <CoinIndexDisplay index={coin.index} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.subsubsection || coin.subsection}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.faceValue}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.currency}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.date}</td>
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
                      <td className="px-4 py-3 text-xs text-gray-800">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${coin.matchConfidence === 'High' ? 'bg-green-100 text-green-800' : coin.matchConfidence === 'Medium' ? 'bg-blue-100 text-blue-800' : coin.matchConfidence === 'None' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {coin.matchConfidence}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.dateVerified}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex gap-1">
                          {coin.image1Url && (
                            <a href={coin.image1Url} target="_blank" rel="noopener noreferrer">
                              <img src={coin.image1Url} alt="Obverse" className="h-10 w-10 object-cover rounded border border-gray-200 hover:border-pink-400 transition" />
                            </a>
                          )}
                          {coin.image2Url && (
                            <a href={coin.image2Url} target="_blank" rel="noopener noreferrer">
                              <img src={coin.image2Url} alt="Reverse" className="h-10 w-10 object-cover rounded border border-gray-200 hover:border-pink-400 transition" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{coin.obverse}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{coin.reverse}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{coin.kmNumber}</td>
                      {isAuthenticated && <td className="px-4 py-3 text-xs text-gray-800">{coin.purchasePrice}</td>}
                      {isAuthenticated && <td className="px-4 py-3 text-xs text-gray-800">{coin.purchaseSource}</td>}
                      {isAuthenticated && <td className="px-4 py-3 text-xs text-gray-800">{coin.purchaseDate}</td>}

                      <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{[coin.book, coin.numberAndNotes].filter(Boolean).join(' - ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
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
                {isInTransitIndex(editFormData.index || '') && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-amber-900">
                      This coin is marked in transit. When you have it in hand, assign the next book slot.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({ ...editFormData, index: getNextIndex() })
                      }
                      className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-md transition"
                    >
                      Assign next index ({getNextIndex()})
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Index</label>
                    <input
                      type="text"
                      value={editFormData.index ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, index: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                      placeholder="e.g. 3.7 or In Transit"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Type <span className="font-medium">{IN_TRANSIT_INDEX}</span> to mark in transit, or use the button above when receiving.
                    </p>
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="text"
                      value={editFormData.date || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      placeholder="e.g., 1850, 1800-1820, 19th century"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                    <input
                      type="text"
                      value={editFormData.numistaNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, numistaNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Link</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Match Confidence</label>
                    <select
                      value={editFormData.matchConfidence || 'High'}
                      onChange={(e) => setEditFormData({ ...editFormData, matchConfidence: e.target.value as 'High' | 'Medium' | 'Low' | 'None' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="None">None</option>
                    </select>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                    <input
                      type="text"
                      value={editFormData.purchasePrice || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, purchasePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. $10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Source</label>
                    <input
                      type="text"
                      value={editFormData.purchaseSource || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, purchaseSource: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. eBay, dealer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <input
                      type="text"
                      value={editFormData.purchaseDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. March 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Verified</label>
                    <input
                      type="text"
                      value={editFormData.dateVerified || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dateVerified: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. 2024-03-31"
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
                  {/* Image Upload */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coin Images</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Image 1 (Obverse)</label>
                        {editingCoin.image1Url && !editImage1Preview && (
                          <div className="mb-2">
                            <img src={editingCoin.image1Url} alt="Current obverse" className="h-24 rounded border border-gray-200 object-contain" />
                            <span className="text-xs text-gray-400 block mt-1">Current image</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setEditImage1File(file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setEditImage1Preview(reader.result as string);
                              reader.readAsDataURL(file);
                            } else {
                              setEditImage1Preview(null);
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                        />
                        {editImage1Preview && (
                          <img src={editImage1Preview} alt="New preview 1" className="mt-2 h-24 rounded border border-gray-200 object-contain" />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Image 2 (Reverse)</label>
                        {editingCoin.image2Url && !editImage2Preview && (
                          <div className="mb-2">
                            <img src={editingCoin.image2Url} alt="Current reverse" className="h-24 rounded border border-gray-200 object-contain" />
                            <span className="text-xs text-gray-400 block mt-1">Current image</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setEditImage2File(file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setEditImage2Preview(reader.result as string);
                              reader.readAsDataURL(file);
                            } else {
                              setEditImage2Preview(null);
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                        />
                        {editImage2Preview && (
                          <img src={editImage2Preview} alt="New preview 2" className="mt-2 h-24 rounded border border-gray-200 object-contain" />
                        )}
                      </div>
                    </div>
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
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-semibold rounded-md transition"
                  >
                    {isUploading ? 'Uploading...' : 'Save Changes'}
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

        {activeTab === 'targets' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">Princely States Target Tracker</h2>
              <p className="text-sm text-gray-500 mt-1">
                Remaining states from your agency target list. This updates automatically when you add a coin in
                <span className="font-medium text-gray-700"> British India Princely States</span>.
              </p>
              <p className="text-sm text-pink-700 font-semibold mt-2">
                Remaining targets: {totalRemainingTargets}
              </p>
            </div>

            {unresolvedTargetsByAgency.length === 0 ? (
              <div className="p-6 rounded-lg border border-green-200 bg-green-50 text-green-800 font-medium">
                All target states completed. Great work!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unresolvedTargetsByAgency.map((group) => (
                  <div key={group.agency} className="border border-pink-100 rounded-lg p-4 bg-pink-50/30">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {group.agency} ({group.states.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.states
                        .sort((a, b) => a.localeCompare(b))
                        .map((state) => (
                          <span
                            key={`${group.agency}-${state}`}
                            className="px-2 py-1 rounded-md bg-white border border-pink-200 text-xs text-gray-700"
                          >
                            {state}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Context Label - sticky */}
            <div className="sticky top-0 z-50 bg-white py-2 px-2 -mt-6 -mx-6 px-6 pt-4 pb-2 shadow-sm">
              <div className="text-sm font-semibold text-gray-700 flex items-center gap-3">
                  {(() => {
                    const { section, subsection, subsubsection } = getCurrentSelectionContext();
                    if (!section) {
                      return <span className="text-purple-600">📝 Introduction</span>;
                    }
                    let parts = [section];
                    if (subsection) {
                      parts.push(subsection);
                    }
                    if (subsubsection) {
                      parts.push(subsubsection);
                    }
                    return <span className="text-purple-600">📝 {parts.join(' → ')}</span>;
                  })()}
                  {(() => {
                    const { section, subsection, subsubsection } = getCurrentSelectionContext();

                    // Calculate coin count for current context
                    const filteredCoins = coins.filter(coin => {
                      if (section && coin.section !== section) return false;
                      if (subsection && coin.subsection !== subsection) return false;
                      if (subsubsection && coin.subsubsection !== subsubsection) return false;
                      return true;
                    });

                    return (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          // Clear all selections first
                          setSelectedSection(null);
                          setSelectedSubsection(null);
                          setSelectedState(null);
                          setSelectedEuropeanCategory(null);
                          setSelectedEuropeanPower(null);
                          // Then set the specific context if not Introduction
                          setTimeout(() => {
                            if (section) {
                              setSelectedSection(section);
                              if (subsection) {
                                if (section === 'British India Princely States') {
                                  setSelectedSubsection(subsection);
                                } else if (section === 'European Trading Companies') {
                                  setSelectedEuropeanCategory(subsection);
                                } else {
                                  setSelectedSubsection(subsection);
                                }
                              }
                              if (subsubsection) {
                                if (section === 'British India Princely States') {
                                  setSelectedState(subsubsection);
                                } else if (section === 'European Trading Companies') {
                                  setSelectedEuropeanPower(subsubsection);
                                }
                              }
                            }
                            setActiveTab('collection');
                            setGroupBySection(true);
                          }, 0);
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded shadow-sm transition-colors duration-200"
                      >
                        View {filteredCoins.length} coin{filteredCoins.length !== 1 ? 's' : ''}
                      </a>
                    );
                  })()}
                </div>
            </div>

            {/* Text display/edit area */}
            <div className="pb-6 mb-2 pt-4">
              {isAuthenticated ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blog Links (up to 5, one per line or comma-separated)
                  </label>
                  <textarea
                    value={textBoxValue}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="https://yourblog.blogspot.com/post1&#10;https://yourblog.blogspot.com/post2&#10;https://yourblog.blogspot.com/post3"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 border-purple-200 bg-white bg-opacity-50 text-gray-700 placeholder-gray-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 resize-none"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: '0.95rem'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1 italic">
                    💡 Tip: Enter one URL per line, or separate with commas. Maximum 5 posts.
                  </p>
                  {textBoxValue && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <BlogPreview url={textBoxValue} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleManualSave}
                      disabled={!hasUnsavedChanges || isSaving}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        hasUnsavedChanges && !isSaving
                          ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    {saveSuccess && (
                      <span className="text-green-600 text-sm italic">✓ Saved successfully</span>
                    )}
                    {hasUnsavedChanges && !isSaving && (
                      <span className="text-orange-500 text-sm italic">Unsaved changes</span>
                    )}
                  </div>
                </div>
              ) : (
                (() => {
                  const isIntro = !getCurrentSelectionContext().section;
                  if (isIntro && (textBoxValue || recentBlogUrls.length > 0)) {
                    // Introduction: show fixed intro blogs + 3 most recent from blog
                    const introUrls = textBoxValue
                      ? textBoxValue.split(/[\n,]/).map(u => u.trim()).filter(u => { try { new URL(u); return true; } catch { return false; } })
                      : [];
                    const combined = [...introUrls, ...recentBlogUrls];
                    return (
                      <div className="flex gap-2 overflow-x-auto">
                        {combined.map((blogUrl, index) => (
                          <div key={`${blogUrl}-${index}`} className="flex-shrink-0 w-28">
                            <BlogCard url={blogUrl} />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return textBoxValue ? (
                    <div className="prose prose-lg max-w-none">
                      <BlogPreview url={textBoxValue} />
                    </div>
                  ) : (
                    <div className="text-gray-400 italic text-center py-6">
                      No description available for this selection.
                    </div>
                  );
                })()
              )}
            </div>

            {/* Section Selector */}
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Select Section</h3>

              {(() => {
                const allSections = Array.from(new Set(coins.map(c => c.section).filter(Boolean))).sort();
                const colonialSections = [
                  'British India Presidencies',
                  'British India Princely States',
                  'British India Uniform Coinage',
                  'European Trading Companies'
                ];
                const otherGroupSections = [
                  'European Overseas',
                  'Older Indian Kingdoms',
                  'Other',
                  'Indeterminate'
                ];
                const remainingSections = allSections.filter(s =>
                  !colonialSections.includes(s) && !otherGroupSections.includes(s)
                );

                const renderSectionButton = (section: string) => (
                  <button
                    key={section}
                    onClick={() => {
                      if (selectedSection === section) {
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                        setSelectedState(null);
                        setSelectedEuropeanCategory(null);
                        setSelectedEuropeanPower(null);
                        setSelectedPresidency(null);
                      } else {
                        setSelectedSection(section);
                        setSelectedSubsection(null);
                        setSelectedState(null);
                        setSelectedEuropeanCategory(null);
                        setSelectedEuropeanPower(null);
                        setSelectedPresidency(null);
                        // Set map mode based on section
                        if (section === 'British India Princely States') {
                          setMapMode('princely');
                        } else if (section === 'European Trading Companies') {
                          setMapMode('european');
                        } else if (section === 'British India Presidencies') {
                          setMapMode('presidencies');
                        }
                      }
                    }}
                    className={`px-4 py-3 rounded-lg transition text-left ${
                      selectedSection === section
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-semibold">{section}</div>
                  </button>
                );

                return (
                  <div className="space-y-4">
                    {/* India: 1600-1947 Colonial Era Box */}
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {colonialSections.filter(s => allSections.includes(s)).map(renderSectionButton)}
                      </div>
                    </div>

                    {/* Other Box */}
                    {otherGroupSections.some(s => allSections.includes(s)) && (
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {otherGroupSections.filter(s => allSections.includes(s)).map(renderSectionButton)}
                        </div>
                      </div>
                    )}

                    {/* Remaining Sections (if any) */}
                    {remainingSections.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {remainingSections.map(renderSectionButton)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Main Content */}
            <div>

            {/* Princely States Mode */}
            {selectedSection === 'British India Princely States' && (<>

            {/* Agency Selector and Selected State */}
            <div className="mb-6">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Select Agency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from(new Set(
                    coins
                      .filter(c => c.section === 'British India Princely States')
                      .map(c => c.subsection)
                      .filter(Boolean)
                  )).sort().map(subsection => {
                    const subsectionStates = Array.from(new Set(
                      coins
                        .filter(c => c.section === 'British India Princely States' && c.subsection === subsection)
                        .map(c => c.subsubsection)
                        .filter(Boolean)
                    ));
                    const coinCount = coins.filter(c => c.section === 'British India Princely States' && c.subsection === subsection).length;

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
                        </button>

                    );
                  })}
                </div>
              </div>

              {/* State Selector - Only shown when a subsection is selected */}
              {selectedSubsection && (
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                    Select State - {selectedSubsection}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from(new Set(
                      coins
                        .filter(c => c.section === 'British India Princely States' && c.subsection === selectedSubsection)
                        .map(c => c.subsubsection)
                        .filter(Boolean)
                    )).sort().map(state => {
                      const stateCoins = coins.filter(
                        c => c.section === 'British India Princely States' && c.subsubsection === state
                      );
                      const isMapped = colorMappings.some(m => m.state === state);

                      return (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(selectedState === state ? null : state);
                          }}
                          className={`px-4 py-3 rounded-lg transition text-left ${
                            selectedState === state
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                          }`}
                        >
                          <div className="text-sm font-semibold">{state}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Map Section */}
            <div className="mb-6">
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                  {/* Loading Spinner Overlay */}
                  {isHighlighting && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white font-semibold">Loading map...</p>
                      </div>
                    </div>
                  )}
                  {/* Zoom controls removed - using simple pointer cursor */}
                  <div className="relative overflow-hidden">
                    <canvas
                      key="princely-map-canvas"
                      ref={(canvas) => {
                        if (canvas && !canvas.dataset.princelyInitialized) {
                          canvas.dataset.princelyInitialized = 'true';
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
                          img.onerror = () => {
                            console.error('Failed to load Princely States map image');
                          };
                          img.src = '/maps/princely-states.png';
                        }
                      }}
                      onClick={(e) => {
                        const canvas = e.currentTarget;
                        const rect = canvas.getBoundingClientRect();

                        // Simple coordinate conversion - no zoom/pan transforms
                        const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
                        const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

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
                      style={{ cursor: 'pointer' }}
                      className="w-full h-auto"
                    />
                  </div>
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
                    .filter(m => coins.some(c => c.section === 'British India Princely States' && c.subsubsection === m.state))
                    .filter((m, i, arr) => arr.findIndex(a => a.state === m.state) === i)
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

            </>)}

            {/* European Trading Companies Mode */}
            {selectedSection === 'European Trading Companies' && (<>

            {/* Trading Company Selector */}
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Select Trading Company</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from(new Set(
                  coins
                    .filter(c => c.section === 'European Trading Companies')
                    .map(c => c.subsection)
                    .filter(Boolean)
                )).sort().map(subsection => {
                  const coinCount = coins.filter(c =>
                    c.section === 'European Trading Companies' &&
                    c.subsection === subsection
                  ).length;

                  return (
                    <button
                      key={subsection}
                      onClick={() => {
                        setSelectedEuropeanCategory(selectedEuropeanCategory === subsection ? null : subsection);
                        setSelectedEuropeanPower(null);
                      }}
                      className={`px-4 py-3 rounded-lg transition text-left ${
                        selectedEuropeanCategory === subsection
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{subsection}</div>
                      </button>

                  );
                })}
              </div>
            </div>
              {/* European Map Section */}
              <div>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                  {/* Zoom controls removed - using simple pointer cursor */}
                  <div className="relative overflow-hidden">
                    <canvas
                      key="european-map-canvas"
                      ref={(canvas) => {
                        if (canvas && !canvas.dataset.europeanInitialized) {
                          canvas.dataset.europeanInitialized = 'true';
                          setEuropeanMapCanvas(canvas);
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx?.drawImage(img, 0, 0);
                            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                            if (imageData) {
                              setEuropeanOriginalImageData(imageData);
                            }
                          };
                          img.onerror = () => {
                            console.error('Failed to load European map image');
                          };
                          img.src = '/maps/european-trading-posts-1600-1750.png';
                        }
                      }}
                      onClick={(e) => {
                        const canvas = e.currentTarget;
                        const rect = canvas.getBoundingClientRect();

                        // Simple coordinate conversion - no zoom/pan transforms
                        const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
                        const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

                        const ctx = canvas.getContext('2d');
                        if (ctx && europeanOriginalImageData) {
                          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                            const index = (y * canvas.width + x) * 4;
                            const pixel = europeanOriginalImageData.data;
                            const color = `${pixel[index]},${pixel[index + 1]},${pixel[index + 2]}`;

                            const mappings = europeanColorMappings.filter(m => m.color === color);

                            if (mappings.length === 1) {
                              setSelectedEuropeanPower(mappings[0].state);
                            } else if (mappings.length > 1) {
                              setAmbiguousStates({
                                color,
                                states: mappings.map(m => m.state)
                              });
                            } else {
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
                      style={{ cursor: 'pointer' }}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

            {/* European Mapping Management - Admin Only */}
            {isAuthenticated && (
              <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🔧 Manage European Trading Company Mappings</h3>
                {/* Color Conflicts Warning */}
                {(() => {
                  const colorGroups = europeanColorMappings.reduce((acc, m) => {
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
                          {conflicts.length} color{conflicts.length !== 1 ? 's are' : ' is'} shared by multiple regions:
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
                  {europeanColorMappings
                    .sort((a, b) => a.state.localeCompare(b.state))
                    .map(mapping => {
                      const hasDuplicate = europeanColorMappings.filter(m => m.color === mapping.color).length > 1;
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
                            onClick={() => handleDeleteEuropeanMapping(mapping.state)}
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

            </>)}

            {/* British India Presidencies Mode */}
            {selectedSection === 'British India Presidencies' && (<>

            {/* Presidency Selector */}
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Select Presidency</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from(new Set(
                  coins
                    .filter(c => c.section === 'British India Presidencies')
                    .map(c => c.subsection)
                    .filter(Boolean)
                )).sort().map(subsection => {
                  const coinCount = coins.filter(c =>
                    c.section === 'British India Presidencies' &&
                    c.subsection === subsection
                  ).length;
                  const isMapped = presidenciesColorMappings.some(m => m.state === subsection);

                  return (
                    <button
                      key={subsection}
                      onClick={() => {
                        setSelectedPresidency(selectedPresidency === subsection ? null : subsection);
                      }}
                      className={`px-4 py-3 rounded-lg transition text-left ${
                        selectedPresidency === subsection
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{subsection}</div>
                      </button>

                  );
                })}
              </div>
            </div>

            {/* Presidencies Map Section */}
            <div className="mb-6">
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                  {isHighlighting && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white font-semibold">Loading map...</p>
                      </div>
                    </div>
                  )}
                  <div className="relative overflow-hidden">
                    <canvas
                      key="presidencies-map-canvas"
                      ref={(canvas) => {
                        if (canvas && !canvas.dataset.presidenciesInitialized) {
                          canvas.dataset.presidenciesInitialized = 'true';
                          setPresidenciesMapCanvas(canvas);
                          const ctx = canvas.getContext('2d');
                          const img = new window.Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx?.drawImage(img, 0, 0);
                            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                            if (imageData) {
                              setPresidenciesOriginalImageData(imageData);
                            }
                          };
                          img.onerror = () => {
                            console.error('Failed to load Presidencies map image');
                          };
                          img.src = '/maps/presidencies-map.png';
                        }
                      }}
                      onClick={(e) => {
                        const canvas = e.currentTarget;
                        const rect = canvas.getBoundingClientRect();
                        const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
                        const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

                        const ctx = canvas.getContext('2d');
                        if (ctx && presidenciesOriginalImageData) {
                          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                            const index = (y * canvas.width + x) * 4;
                            const pixel = presidenciesOriginalImageData.data;
                            const color = `${pixel[index]},${pixel[index + 1]},${pixel[index + 2]}`;

                            const mappings = presidenciesColorMappings.filter(m => m.color === color);

                            if (mappings.length >= 1) {
                              // Select the presidency (use first match since multiple colors map to same presidency)
                              setSelectedPresidency(mappings[0].state);
                            } else {
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
                      style={{ cursor: 'pointer' }}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

            {/* Presidencies Mapping Management - Admin Only */}
            {isAuthenticated && (
              <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Manage Presidency Mappings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {presidenciesColorMappings
                    .filter((m, i, arr) => arr.findIndex(a => a.state === m.state) === i)
                    .sort((a, b) => a.state.localeCompare(b.state))
                    .map(mapping => (
                      <div key={mapping.state} className="border rounded p-3 flex items-center justify-between border-gray-300">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{mapping.state}</div>
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
                            onClick={() => handleDeletePresidenciesMapping(mapping.state)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            </>)}

            {/* Indeterminate / Older Indian Kingdoms - image-focused sections */}
            {(selectedSection === 'Indeterminate' || selectedSection === 'Older Indian Kingdoms') && (
              <div className="mb-6">
                {/* Subsection selector */}
                {(() => {
                  const subsections = Array.from(new Set(
                    coins
                      .filter(c => c.section === selectedSection)
                      .map(c => c.subsection)
                      .filter(Boolean)
                  )).sort();
                  return subsections.length > 1 ? (
                    <div className="mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Select Subsection</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {subsections.map(sub => {
                          const subCoinCount = coins.filter(c => c.section === selectedSection && c.subsection === sub).length;
                          return (
                            <button
                              key={sub}
                              onClick={() => setSelectedSubsection(selectedSubsection === sub ? null : sub)}
                              className={`px-4 py-3 rounded-lg transition text-left ${
                                selectedSubsection === sub
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                              }`}
                            >
                              <div className="text-sm font-semibold">{sub}</div>
                              <div className={`text-xs ${selectedSubsection === sub ? 'text-purple-200' : 'text-gray-500'}`}>
                                {subCoinCount} coin{subCoinCount !== 1 ? 's' : ''}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Coin cards */}
                <div className="space-y-8">
                  {coins
                    .filter(c => c.section === selectedSection && (!selectedSubsection || c.subsection === selectedSubsection))
                    .sort((a, b) => compareIndexForSort(a.index, b.index))
                    .map(coin => (
                      <div key={coin.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        {/* Images */}
                        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50 justify-center items-center">
                          {coin.image1Url && (
                            <a href={coin.image1Url} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={coin.image1Url} alt="Obverse" className="rounded-lg shadow-md max-h-72 object-contain hover:opacity-90 transition" />
                            </a>
                          )}
                          {coin.image2Url && (
                            <a href={coin.image2Url} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={coin.image2Url} alt="Reverse" className="rounded-lg shadow-md max-h-72 object-contain hover:opacity-90 transition" />
                            </a>
                          )}
                        </div>
                        {/* Details */}
                        <div className="p-6 space-y-2">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-lg font-bold text-gray-800">#<CoinIndexDisplay index={coin.index} /></span>
                            {coin.subsection && <span className="text-sm text-purple-600 font-medium">{coin.subsection}</span>}
                            <span className="text-sm text-gray-500">{coin.faceValue} {coin.currency}</span>
                            {coin.date && <span className="text-sm text-gray-500">({coin.date})</span>}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${coin.matchConfidence === 'High' ? 'bg-green-100 text-green-800' : coin.matchConfidence === 'Medium' ? 'bg-blue-100 text-blue-800' : coin.matchConfidence === 'None' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {coin.matchConfidence}
                            </span>
                          </div>
                          {coin.obverse && (
                            <div className="text-sm"><span className="font-semibold text-gray-700">Obverse:</span> <span className="text-gray-600">{coin.obverse}</span></div>
                          )}
                          {coin.reverse && (
                            <div className="text-sm"><span className="font-semibold text-gray-700">Reverse:</span> <span className="text-gray-600">{coin.reverse}</span></div>
                          )}
                          {coin.weight && (
                            <div className="text-sm"><span className="font-semibold text-gray-700">Weight:</span> <span className="text-gray-600">{coin.weight}g</span></div>
                          )}
                          {coin.numistaLink && (
                            <div className="text-sm"><span className="font-semibold text-gray-700">Reference:</span> <a href={coin.numistaLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{coin.numistaNumber || 'View'}</a></div>
                          )}
                          {coin.numberAndNotes && (
                            <div className="text-sm mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200"><span className="font-semibold text-amber-800">Notes:</span> <span className="text-amber-700">{coin.numberAndNotes}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Other Sections Mode (no map, just subsections) */}
            {selectedSection && selectedSection !== 'British India Princely States' && selectedSection !== 'European Trading Companies' && selectedSection !== 'British India Presidencies' && selectedSection !== 'Indeterminate' && selectedSection !== 'Older Indian Kingdoms' && (
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">{selectedSection} - Subsections</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(() => {
                    const subsections = Array.from(new Set(
                      coins
                        .filter(c => c.section === selectedSection)
                        .map(c => c.subsection)
                        .filter(Boolean)
                    ));
                    return sortSubsections(selectedSection, subsections, groupedCoins[selectedSection]);
                  })().map(subsection => {
                    const subsectionCoins = coins.filter(c =>
                      c.section === selectedSection && c.subsection === subsection
                    ).length;

                    return (
                      <button
                        key={subsection}
                        onClick={() => {
                          setSelectedSubsection(selectedSubsection === subsection ? null : subsection);
                        }}
                        className={`w-full px-4 py-3 rounded-lg text-left transition ${
                          selectedSubsection === subsection
                            ? 'bg-purple-600 text-white shadow-lg border-2 border-purple-600'
                            : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-semibold">{subsection}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            </div>

            {/* British Royal Family Tree - only for Uniform Coinage */}
            {selectedSection === 'British India Uniform Coinage' && <BritishFamilyTree />}

            {/* End Main Content */}
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
                      c => c.section === 'British India Princely States' && c.subsubsection === state
                    );
                    return (
                      <button
                        key={state}
                        onClick={() => {
                          if (mapMode === 'european') {
                            setSelectedEuropeanPower(state);
                          } else {
                            setSelectedState(state);
                          }
                          setAmbiguousStates(null);
                        }}
                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-pink-50 rounded-lg border border-gray-200 transition"
                      >
                        <div className="font-medium text-gray-800">{state}</div>
                        {mapMode === 'princely' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAmbiguousStates(null);
                            setActiveTab('collection');
                            setTimeout(() => {
                              const element = document.getElementById(
                                `subsubsection-indian-princely-states-${coins.find(c => c.subsubsection === state)?.subsection.replace(/\s+/g, '-').toLowerCase()}-${state.replace(/\s+/g, '-').toLowerCase()}`
                              );
                              element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                          }}
                          className="text-sm text-pink-600 hover:text-pink-800 underline hover:no-underline"
                        >
                          {stateCoins.length} coin{stateCoins.length !== 1 ? 's' : ''} →
                        </button>
                        )}
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
                {mapMode === 'european' && <span className="text-sm font-normal text-gray-500 ml-2">(European Map)</span>}
                {mapMode === 'presidencies' && <span className="text-sm font-normal text-gray-500 ml-2">(Presidencies Map)</span>}
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
                  {mapMode === 'european' ? 'Region Name' : mapMode === 'presidencies' ? 'Presidency Name' : 'State Name'}
                </label>
                <input
                  list="all-states-list"
                  value={mappingFormState}
                  onChange={(e) => setMappingFormState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder={mapMode === 'european' ? 'Select or type region name...' : mapMode === 'presidencies' ? 'Select or type presidency name...' : 'Select or type state name...'}
                  autoFocus
                />
                {mapMode === 'princely' && (
                  <datalist id="all-states-list">
                    {Array.from(new Set(
                      coins
                        .filter(c => c.section === 'British India Princely States')
                        .map(c => c.subsubsection)
                        .filter(Boolean)
                    )).sort().map(state => (
                      <option key={state} value={state} />
                    ))}
                  </datalist>
                )}
                {mapMode === 'european' && (
                  <datalist id="all-states-list">
                    {Array.from(new Set([
                      // Show both actual subsubsections and subsection names
                      ...coins
                        .filter(c => c.section === 'European Trading Companies' && c.subsubsection)
                        .map(c => c.subsubsection),
                      ...coins
                        .filter(c => c.section === 'European Trading Companies')
                        .map(c => c.subsection)
                    ])).sort().map(region => (
                      <option key={region} value={region} />
                    ))}
                  </datalist>
                )}
                {mapMode === 'presidencies' && (
                  <datalist id="all-states-list">
                    {Array.from(new Set(
                      coins
                        .filter(c => c.section === 'British India Presidencies')
                        .map(c => c.subsection)
                        .filter(Boolean)
                    )).sort().map(presidency => (
                      <option key={presidency} value={presidency} />
                    ))}
                  </datalist>
                )}
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
                  onClick={mapMode === 'european' ? handleSaveEuropeanMapping : mapMode === 'presidencies' ? handleSavePresidenciesMapping : handleSaveMapping}
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
