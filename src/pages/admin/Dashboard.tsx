import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { getRepo } from '../../lib/repo';
import { deleteImage } from '../../lib/imagekit';
import type { Item, Status, Condition } from '../../types/item';
import { categories, categoryMap } from '../../config/categories';
import { strings } from '../../config/strings';
import { Badge } from '../../components/Badge';
import {
  BroomIcon,
  TrashIcon,
  EditIcon,
  ChartIcon,
  CategoryIcon,
  ExternalLinkIcon,
  SearchIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloseIcon,
  CheckIcon,
} from '../../components/Icons';

type Tab = 'table' | 'analytics';

export function Dashboard() {
  const { user, signOutUser, getIdToken } = useAdminAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<Tab>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sold Price Modal
  const [editingPriceItem, setEditingPriceItem] = useState<Item | null>(null);
  const [modalPriceInput, setModalPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const repo = await getRepo();
      const all = await repo.listAll();
      setItems(all);
    } catch (err) {
      console.error('Failed to load admin items:', err);
      const msg = (err as Error)?.message || '';
      if (msg.includes('permission-denied') || msg.includes('insufficient permissions')) {
        setError(
          'Missing or insufficient permissions from Firestore. Please verify your User UID is updated in firestore.rules and published in the Firebase Console.'
        );
      } else {
        setError(msg || 'Failed to load items.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Quick Status change
  const handleStatusChange = async (id: string, newStatus: Status) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    // If changing to 'sold' and no sold price set, open the modal directly for price input
    if (newStatus === 'sold' && (!targetItem.soldPrice || targetItem.soldPrice <= 0)) {
      setEditingPriceItem(targetItem);
      setModalPriceInput('');
      return;
    }

    try {
      setActionLoadingId(id);
      const repo = await getRepo();
      await repo.setStatus(id, newStatus);
      setItems(prev =>
        prev.map(i => (i.id === id ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      alert((err as Error).message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open modal to update sold price manually
  const openPriceModal = (item: Item) => {
    setEditingPriceItem(item);
    setModalPriceInput(item.soldPrice !== undefined ? String(item.soldPrice) : '');
  };

  // Save manual sold price
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceItem) return;

    const trimmed = modalPriceInput.trim();
    const priceNum = trimmed !== '' ? Number(trimmed) : null;

    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
      alert('Please enter a valid price (>= 0)');
      return;
    }

    try {
      setSavingPrice(true);
      const repo = await getRepo();

      // If item was not yet sold, also set status to sold
      if (editingPriceItem.status !== 'sold') {
        await repo.setStatus(editingPriceItem.id, 'sold', priceNum !== null ? priceNum : undefined);
      } else {
        await repo.setSoldPrice(editingPriceItem.id, priceNum);
      }

      setItems(prev =>
        prev.map(i =>
          i.id === editingPriceItem.id
            ? {
                ...i,
                status: 'sold',
                soldPrice: priceNum !== null ? priceNum : undefined,
              }
            : i
        )
      );

      setEditingPriceItem(null);
    } catch (err) {
      alert((err as Error).message || 'Failed to save sold price');
    } finally {
      setSavingPrice(false);
    }
  };

  // Delete item with ImageKit cleanup
  const handleDelete = async (item: Item) => {
    if (!window.confirm(strings.confirmDelete)) return;
    try {
      setActionLoadingId(item.id);
      const repo = await getRepo();
      await repo.remove(item.id);

      const token = await getIdToken();
      for (const img of item.images) {
        if (img.fileId) {
          deleteImage(img.fileId, token).catch(() => {});
        }
      }

      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      alert((err as Error).message || 'Failed to delete item');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cleanup sold items in bulk
  const handleCleanupSold = async () => {
    const soldItems = items.filter(i => i.status === 'sold');
    if (soldItems.length === 0) {
      alert('No sold items to clean up.');
      return;
    }

    if (!window.confirm(`${strings.confirmCleanup} (${soldItems.length} items)`)) {
      return;
    }

    try {
      setCleaningUp(true);
      const repo = await getRepo();
      const token = await getIdToken();

      for (const item of soldItems) {
        await repo.remove(item.id);
        for (const img of item.images) {
          if (img.fileId) {
            deleteImage(img.fileId, token).catch(() => {});
          }
        }
      }

      setItems(prev => prev.filter(i => i.status !== 'sold'));
      alert('Sold items cleaned up successfully.');
    } catch (err) {
      alert((err as Error).message || 'Failed to clean up sold items');
    } finally {
      setCleaningUp(false);
    }
  };

  // Filtered Items for Table
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchQuery, itemsPerPage]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Analytics Computation
  const analytics = useMemo(() => {
    const totalCount = items.length;
    const availableCount = items.filter(i => i.status === 'available').length;
    const reservedCount = items.filter(i => i.status === 'reserved').length;
    const soldItems = items.filter(i => i.status === 'sold');
    const soldCount = soldItems.length;

    // Total Revenue from sold items with a soldPrice
    const soldWithPrice = soldItems.filter(i => typeof i.soldPrice === 'number' && i.soldPrice > 0);
    const totalRevenue = soldWithPrice.reduce((sum, i) => sum + (i.soldPrice || 0), 0);
    const avgSoldPrice = soldWithPrice.length > 0 ? Math.round(totalRevenue / soldWithPrice.length) : 0;
    const sellThroughRate = totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0;

    // Category breakdown
    const categoryStats = categories.map(cat => {
      const catItems = items.filter(i => i.category === cat.id);
      const catSold = catItems.filter(i => i.status === 'sold');
      const catRevenue = catSold.reduce((sum, i) => sum + (i.soldPrice || 0), 0);
      return {
        id: cat.id,
        label: cat.label,
        total: catItems.length,
        available: catItems.filter(i => i.status === 'available').length,
        reserved: catItems.filter(i => i.status === 'reserved').length,
        sold: catSold.length,
        revenue: catRevenue,
      };
    });

    // Condition distribution
    const conditionStats: Record<Condition, number> = {
      like_new: items.filter(i => i.condition === 'like_new').length,
      good: items.filter(i => i.condition === 'good').length,
      fair: items.filter(i => i.condition === 'fair').length,
      needs_repair: items.filter(i => i.condition === 'needs_repair').length,
    };

    // Recent Sales Ledger
    const recentSales = [...soldItems].sort((a, b) => b.updatedAt - a.updatedAt);

    return {
      totalCount,
      availableCount,
      reservedCount,
      soldCount,
      totalRevenue,
      avgSoldPrice,
      sellThroughRate,
      categoryStats,
      conditionStats,
      recentSales,
    };
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--fg)] tracking-tight">
              ScrapFinds Admin
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] pt-1">
            Signed in as <span className="font-semibold text-[var(--fg)]">{user?.email || 'Owner'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/items/new"
            className="min-h-[44px] px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            <span>+</span>
            <span>{strings.addItem}</span>
          </Link>
          <button
            type="button"
            onClick={signOutUser}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {strings.signOut}
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'table'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Uploaded Items Table</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeTab === 'table'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-[var(--fg)]'
            }`}
          >
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <ChartIcon className="w-4 h-4" />
          <span>Analysis Dashboard</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      {/* TAB 1: UPLOADED ITEMS TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Table Controls / Filters Toolbar */}
          <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] space-y-3.5 shadow-2xs">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-green-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'available'
                    ? 'bg-green-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                Available ({analytics.availableCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('reserved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'reserved'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                Reserved ({analytics.reservedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('sold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'sold'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                Sold ({analytics.soldCount})
              </button>

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleCleanupSold}
                  disabled={cleaningUp || analytics.soldCount === 0}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-40 flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <BroomIcon className="w-3.5 h-3.5" />
                  <span>{cleaningUp ? 'Cleaning…' : strings.cleanupSold}</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by title, ID, or category…"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/80 border border-[var(--border)] rounded-xl text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--fg)]"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-slate-800/80 border border-[var(--border)] rounded-xl text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rows per page */}
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] self-end sm:self-auto">
                <span>Rows:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-[var(--border)] rounded-lg text-xs font-bold text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="py-16 text-center text-sm text-[var(--muted)] bg-[var(--card)] rounded-2xl border border-[var(--border)]">
              Loading items from database…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted)] space-y-3 bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
              <p>No items found matching the current filters.</p>
              {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-bold text-[var(--fg)] cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50/90 dark:bg-slate-800/80 border-b border-[var(--border)] text-[var(--muted)] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Condition</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Sold Price (₹)</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedItems.map(item => {
                      const isProcessing = actionLoadingId === item.id;
                      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Item Thumbnail & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-[var(--border)]">
                                <img
                                  src={item.images[0]?.url || '/mock/placeholder-1.svg'}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 max-w-[220px] sm:max-w-xs">
                                <Link
                                  to={`/item/${item.id}`}
                                  target="_blank"
                                  className="font-bold text-[var(--fg)] hover:text-green-600 dark:hover:text-green-400 line-clamp-1 transition-colors"
                                  title={item.title}
                                >
                                  {item.title}
                                </Link>
                                <span className="text-[10px] text-[var(--muted)] font-mono block">
                                  ID: {item.id.slice(0, 10)}…
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--fg)] text-xs">
                              <CategoryIcon categoryId={item.category} className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              <span>{categoryMap[item.category]?.label || item.category}</span>
                            </div>
                          </td>

                          {/* Condition */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-xs font-semibold capitalize text-[var(--muted)]">
                              {item.condition.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Status & Quick Toggle */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  item.status === 'available'
                                    ? 'accent'
                                    : item.status === 'reserved'
                                    ? 'warning'
                                    : 'muted'
                                }
                              >
                                {item.status}
                              </Badge>

                              {/* Quick switch select */}
                              <select
                                disabled={isProcessing}
                                value={item.status}
                                onChange={e => handleStatusChange(item.id, e.target.value as Status)}
                                aria-label="Change status"
                                className="px-2 py-1 text-[11px] font-bold rounded-lg border border-[var(--border)] bg-gray-50 dark:bg-slate-800 text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                              >
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                              </select>
                            </div>
                          </td>

                          {/* Sold Price (Manual update) */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {item.status === 'sold' ? (
                              <button
                                type="button"
                                onClick={() => openPriceModal(item)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/60"
                                title="Click to update sold price"
                              >
                                {typeof item.soldPrice === 'number' && item.soldPrice >= 0 ? (
                                  <>
                                    <span>₹{item.soldPrice.toLocaleString()}</span>
                                    <EditIcon className="w-3 h-3 opacity-60" />
                                  </>
                                ) : (
                                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                                    + Add Price
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPriceModal(item)}
                                className="text-[11px] text-[var(--muted)] hover:text-green-600 transition-colors cursor-pointer"
                                title="Record price for item"
                              >
                                {typeof item.soldPrice === 'number' ? `₹${item.soldPrice}` : '—'}
                              </button>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="py-3 px-4 text-xs text-[var(--muted)] whitespace-nowrap">
                            {dateStr}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Public view */}
                              <Link
                                to={`/item/${item.id}`}
                                target="_blank"
                                aria-label="View public page"
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                              </Link>

                              {/* Edit */}
                              <Link
                                to={`/admin/items/${item.id}/edit`}
                                aria-label="Edit item"
                                className="p-1.5 rounded-lg text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 transition-colors"
                              >
                                <EditIcon className="w-3.5 h-3.5" />
                              </Link>

                              {/* Delete */}
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleDelete(item)}
                                aria-label="Delete item"
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              <div className="py-3.5 px-4 bg-gray-50/70 dark:bg-slate-800/40 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <div>
                  Showing{' '}
                  <span className="font-bold text-[var(--fg)]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-[var(--fg)]">
                    {Math.min(currentPage * itemsPerPage, filteredItems.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-[var(--fg)]">{filteredItems.length}</span>{' '}
                  items
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--fg)] font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Only show first, last, and pages close to current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-green-600 text-white shadow-2xs'
                              : 'border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="px-1 text-[var(--muted)]">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-slate-800 text-[var(--fg)] font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANALYSIS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 6 Key Performance Indicator Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Revenue */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border)] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Total Revenue
              </span>
              <div className="text-xl sm:text-2xl font-black text-[var(--fg)]">
                ₹{analytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-[10px] text-[var(--muted)]">Realized from sold items</p>
            </div>

            {/* 2. Items Sold */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border)] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Items Sold
              </span>
              <div className="text-xl sm:text-2xl font-black text-[var(--fg)]">
                {analytics.soldCount}
              </div>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                {analytics.sellThroughRate}% sell-through
              </p>
            </div>

            {/* 3. Available Stock */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border)] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 block">
                Available Stock
              </span>
              <div className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">
                {analytics.availableCount}
              </div>
              <p className="text-[10px] text-[var(--muted)]">Ready for pickup</p>
            </div>

            {/* 4. Reserved Holds */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border)] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Reserved Holds
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {analytics.reservedCount}
              </div>
              <p className="text-[10px] text-[var(--muted)]">Awaiting collection</p>
            </div>

            {/* 5. Average Sale Price */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border)] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Avg Sale Price
              </span>
              <div className="text-xl sm:text-2xl font-black text-[var(--fg)]">
                ₹{analytics.avgSoldPrice.toLocaleString()}
              </div>
              <p className="text-[10px] text-[var(--muted)]">Per sold item</p>
            </div>

            {/* 6. Total Cataloged */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--border)] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block">
                Total Cataloged
              </span>
              <div className="text-xl sm:text-2xl font-black text-[var(--fg)]">
                {analytics.totalCount}
              </div>
              <p className="text-[10px] text-[var(--muted)]">All time uploads</p>
            </div>
          </div>

          {/* Section: Category Revenue & Performance Breakdown */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[var(--fg)]">
                  Category Performance & Revenue
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Breakdown of active stock, sold items, and income generated across each scrap category
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-800/80 text-[var(--muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Total Listed</th>
                    <th className="py-2.5 px-3 text-center">Available</th>
                    <th className="py-2.5 px-3 text-center">Sold Count</th>
                    <th className="py-2.5 px-3 text-right">Revenue Realized</th>
                    <th className="py-2.5 px-3 text-right">% of Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {analytics.categoryStats.map(cat => {
                    const percentOfRevenue =
                      analytics.totalRevenue > 0
                        ? Math.round((cat.revenue / analytics.totalRevenue) * 100)
                        : 0;

                    return (
                      <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 font-bold text-[var(--fg)]">
                            <CategoryIcon categoryId={cat.id} className="w-4 h-4 text-green-600 shrink-0" />
                            <span>{cat.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[var(--fg)]">
                          {cat.total}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {cat.available}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[var(--fg)]">
                          {cat.sold}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{cat.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: `${percentOfRevenue}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[var(--muted)] min-w-[32px]">
                              {percentOfRevenue}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Condition Breakdown & Recent Sales Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Condition Distribution Card */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4 shadow-2xs">
              <div>
                <h3 className="font-black text-sm text-[var(--fg)] uppercase tracking-wider">
                  Condition Distribution
                </h3>
                <p className="text-xs text-[var(--muted)]">Quality status of inventory</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--fg)]">Like New</span>
                    <span className="text-[var(--muted)]">{analytics.conditionStats.like_new}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.totalCount ? (analytics.conditionStats.like_new / analytics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--fg)]">Good</span>
                    <span className="text-[var(--muted)]">{analytics.conditionStats.good}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.totalCount ? (analytics.conditionStats.good / analytics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--fg)]">Fair</span>
                    <span className="text-[var(--muted)]">{analytics.conditionStats.fair}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.totalCount ? (analytics.conditionStats.fair / analytics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--fg)]">Needs Repair</span>
                    <span className="text-[var(--muted)]">{analytics.conditionStats.needs_repair}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.totalCount ? (analytics.conditionStats.needs_repair / analytics.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sales Ledger */}
            <div className="lg:col-span-2 bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-[var(--fg)] uppercase tracking-wider">
                    Recent Realized Sales Ledger
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Recorded sale prices and transactions</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {analytics.recentSales.length} items sold
                </span>
              </div>

              {analytics.recentSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--muted)]">
                  No items marked as sold yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[10px] uppercase font-bold">
                        <th className="py-2 px-2">Item</th>
                        <th className="py-2 px-2">Category</th>
                        <th className="py-2 px-2 text-right">Sold Amount</th>
                        <th className="py-2 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {analytics.recentSales.slice(0, 6).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-2 font-bold text-[var(--fg)] line-clamp-1">
                            {item.title}
                          </td>
                          <td className="py-2.5 px-2 text-[var(--muted)]">
                            {categoryMap[item.category]?.label || item.category}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-emerald-700 dark:text-emerald-400">
                            {typeof item.soldPrice === 'number' && item.soldPrice > 0 ? (
                              `₹${item.soldPrice.toLocaleString()}`
                            ) : (
                              <span className="text-amber-600 font-semibold text-[11px]">Unset</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => openPriceModal(item)}
                              className="text-[11px] font-bold text-green-600 dark:text-green-400 hover:underline cursor-pointer"
                            >
                              Edit Price
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
        </div>
      )}

      {/* SOLD PRICE UPDATE MODAL */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[var(--fg)]">
                  Record Sold Price
                </h3>
                <p className="text-xs text-[var(--muted)] truncate max-w-xs">
                  {editingPriceItem.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPriceItem(null)}
                className="p-1 rounded-xl text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="modalSoldPrice"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  Sold Price in INR (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--muted)]">
                    ₹
                  </span>
                  <input
                    id="modalSoldPrice"
                    type="number"
                    min="0"
                    step="1"
                    autoFocus
                    value={modalPriceInput}
                    onChange={e => setModalPriceInput(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full min-h-[44px] pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Leave empty to clear price, or enter the final cash/UPI payment received.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[200, 500, 1000, 2000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setModalPriceInput(String(val))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-slate-800 text-[var(--fg)] hover:bg-green-50 hover:text-green-700 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingPriceItem(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>{savingPrice ? 'Saving…' : 'Save Price'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
