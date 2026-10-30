import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Camera,
  Filter,
  RefreshCw,
  Search,
  PackageOpen,
  ArrowUpDown,
  ShieldCheck,
  ChevronDown,
  Layers,
  Zap,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Deal, User } from './types';
import { storageService, MaintenanceConfig } from './services/storageService';
import { authService, ADMIN_PHONE } from './services/authService';
import GatedGateScreen from './components/GatedGateScreen';
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import DealCard from './components/DealCard';
import DealDetailsModal from './components/DealDetailsModal';
import PostDealModal from './components/PostDealModal';
import AdminPortal from './components/AdminPortal';
import MaintenanceScreen from './components/MaintenanceScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  // Modals & views
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

  // Network & Cache state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);

  // Maintenance state
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig>(
    storageService.getMaintenanceConfig()
  );

  // Pagination for 2G Speed (20 deals at a time)
  const [displayLimit, setDisplayLimit] = useState(20);

  // Initialize Auth & Storage
  useEffect(() => {
    const initApp = async () => {
      await authService.init();
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      // Check maintenance status
      setMaintenanceConfig(storageService.getMaintenanceConfig());

      // Load deals from fast cache
      await loadDeals();
    };

    initApp();

    // Listen for online/offline transitions
    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await storageService.syncOfflineQueue();
      if (synced > 0) {
        setOfflineQueueCount(synced);
        await loadDeals();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDeals = async () => {
    setIsLoadingDeals(true);
    try {
      const activeDeals = await storageService.loadActiveDeals();
      setDeals(activeDeals);
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setIsLoadingDeals(false);
    }
  };

  // Handle Authentication Success
  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    // If the CEO logs in, take them straight to the unique hidden Admin Portal!
    if (user.isAdmin) {
      setIsAdminPortalOpen(true);
    }
    loadDeals();
  };

  // Handle Logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAdminPortalOpen(false);
    setSelectedDeal(null);
  };

  // Handle Admin Delete & Block Deal
  const handleAdminDeleteDeal = async (deal: Deal) => {
    try {
      await storageService.adminDeleteDealPermanently(deal, 'Deleted by CEO Eustace Banda');
      await loadDeals();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle new deal creation
  const handleDealCreated = (newDeal: Deal) => {
    setDeals((prev) => [newDeal, ...prev]);
    // Reset category to ALL or newly selected category to see it immediately
    setSelectedCategory('ALL');
  };

  // Filter and Sort deals
  const filteredDeals = useMemo(() => {
    let result = deals;

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (d) => d.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.sellerName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.phone.includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'price_low') {
        return a.priceNum - b.priceNum;
      } else if (sortBy === 'price_high') {
        return b.priceNum - a.priceNum;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [deals, selectedCategory, searchQuery, sortBy]);

  // Paginated subset for high speed 2G loading
  const paginatedDeals = useMemo(() => {
    return filteredDeals.slice(0, displayLimit);
  }, [filteredDeals, displayLimit]);

  // If maintenance mode is enabled AND user is NOT admin
  if (maintenanceConfig.enabled && !currentUser?.isAdmin) {
    return (
      <MaintenanceScreen
        config={maintenanceConfig}
        onAdminUnlock={() => {
          setMaintenanceConfig(storageService.getMaintenanceConfig());
          const admin = authService.getCurrentUser();
          if (admin) {
            setCurrentUser(admin);
            setIsAdminPortalOpen(true);
          }
        }}
      />
    );
  }

  // GATED ACCESS: If user is not authenticated or pending approval, show GatedGateScreen
  if (!currentUser || currentUser.status !== 'approved') {
    return (
      <GatedGateScreen
        onAuthenticated={handleAuthenticated}
        initialUser={currentUser}
      />
    );
  }

  // HIDDEN ADMIN PORTAL VIEW (Visible when CEO toggles or logs in)
  if (isAdminPortalOpen && currentUser.isAdmin) {
    return (
      <AdminPortal
        onBackToMarketplace={() => setIsAdminPortalOpen(false)}
        onDealsUpdated={loadDeals}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenPostModal={() => setIsPostModalOpen(true)}
        onOpenAdminPortal={currentUser.isAdmin ? () => setIsAdminPortalOpen(true) : undefined}
        onLogout={handleLogout}
        isOnline={isOnline}
        offlineCount={offlineQueueCount}
      />

      {/* 19 EXACT HORIZONTAL SCROLLING CATEGORIES */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setDisplayLimit(20); // Reset page limit
        }}
        deals={deals}
      />

      {/* Main Marketplace Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* Marketplace Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory === 'ALL' ? 'All Verified Deals' : selectedCategory}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {filteredDeals.length} listings
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant contact with local sellers across Nyimba, Chinambi &amp; Hofmeyr.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Sort Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Lowest Price (K)</option>
                <option value="price_high">Highest Price (K)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Quick Refresh */}
            <button
              onClick={loadDeals}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh listings"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDeals ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Deals Grid */}
        {isLoadingDeals && deals.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3 animate-pulse">
                <div className="aspect-4/3 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No listings found</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {searchQuery
                ? `No deals match your search for "${searchQuery}". Try different keywords.`
                : `There are currently no items in "${selectedCategory}". Be the first to post!`}
            </p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Capture &amp; Post the First Item
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {paginatedDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  currentUser={currentUser}
                  onSelectDeal={setSelectedDeal}
                  onAdminDelete={currentUser.isAdmin ? handleAdminDeleteDeal : undefined}
                />
              ))}
            </div>

            {/* Load More Pagination (20 deals per page for speed) */}
            {filteredDeals.length > displayLimit && (
              <div className="text-center pt-4 pb-8">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 20)}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-300 hover:border-emerald-500 text-slate-800 font-bold text-xs shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-emerald-600" />
                  Load More Deals ({filteredDeals.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Post Button on Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl shadow-emerald-950 active:scale-95 transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>Post Deal</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto py-8 px-4 sm:px-6 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-sm">
              ND
            </div>
            <div>
              <div className="font-bold text-white text-sm">Nyimba Deals</div>
              <div className="text-[11px] text-slate-500">
                Official Nyimba Marketplace &bull; Supervised by CEO Eustace Banda (0773694618)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <a href="tel:0773694618" className="hover:text-emerald-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Call CEO (0773694618)
            </a>
            <a
              href="https://wa.me/260773694618?text=Hello%20CEO%20Eustace%20Banda,%20I%20am%20using%20Nyimba%20Deals"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp CEO
            </a>
            <span className="text-slate-600">&bull;</span>
            <span>Eastern Province, Zambia</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedDeal && (
        <DealDetailsModal
          deal={selectedDeal}
          currentUser={currentUser}
          onClose={() => setSelectedDeal(null)}
          onAdminDelete={currentUser.isAdmin ? handleAdminDeleteDeal : undefined}
        />
      )}

      {isPostModalOpen && currentUser && (
        <PostDealModal
          currentUser={currentUser}
          onClose={() => setIsPostModalOpen(false)}
          onDealCreated={handleDealCreated}
        />
      )}
    </div>
  );
}
