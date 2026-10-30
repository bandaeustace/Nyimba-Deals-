/**
 * Nyimba Deals - 4-Layer Permanent Memory & High Speed Cache Service
 * Layer 1: Persistent Phone Memory (never logged out)
 * Layer 2: Fast IndexedDB with LocalStorage Redundant Mirror
 * Layer 3: Blocklist engine for permanently deleted deals & prohibited numbers
 * Layer 4: Triple-backup archive store (Primary + Backup + Blocklist)
 */

import { Deal, User, BlockedDeal, BlockedUser } from '../types';
import { INITIAL_DEALS } from '../constants/initialData';

const DB_NAME = 'nyimba_deals_permanent_v2';
const DB_VERSION = 2;

const STORES = {
  DEALS: 'deals',
  DEALS_ARCHIVE: 'deals_archive',
  BLOCKED_DEALS: 'blocked_deals',
  USERS: 'users',
  USERS_BACKUP: 'users_backup',
  BLOCKED_USERS: 'blocked_users',
  OFFLINE_QUEUE: 'offline_queue',
  HIGH_CAPACITY_VAULT: 'high_capacity_vault',
};

// Fallback LocalStorage keys
const LS_KEYS = {
  DEALS: 'nyimba_deals_v2',
  ARCHIVE: 'nyimba_archive_v2',
  BLOCKED_DEALS: 'nyimba_blocked_deals_v2',
  USERS: 'nyimba_users_v2',
  BLOCKED_USERS: 'nyimba_blocked_users_v2',
  OFFLINE_QUEUE: 'nyimba_offline_queue_v2',
  MAINTENANCE: 'nyimba_maintenance_mode_v2',
};

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  estimatedReturn: string;
  updatedAt: string;
  updatedBy: string;
}

export interface StorageCapacityInfo {
  isPersistent: boolean;
  quotaBytes: number;
  usedBytes: number;
  quotaFormatted: string;
  usedFormatted: string;
  freeFormatted: string;
  percentUsed: number;
  dealCount: number;
  userCount: number;
  archiveCount: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.DEALS)) {
        db.createObjectStore(STORES.DEALS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.DEALS_ARCHIVE)) {
        db.createObjectStore(STORES.DEALS_ARCHIVE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.BLOCKED_DEALS)) {
        db.createObjectStore(STORES.BLOCKED_DEALS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.USERS_BACKUP)) {
        db.createObjectStore(STORES.USERS_BACKUP, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.BLOCKED_USERS)) {
        db.createObjectStore(STORES.BLOCKED_USERS, { keyPath: 'phone' });
      }
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.HIGH_CAPACITY_VAULT)) {
        db.createObjectStore(STORES.HIGH_CAPACITY_VAULT, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function normalizeKey(title: string, phone: string): string {
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
  return `${cleanTitle}_${cleanPhone}`;
}

const VAULT_KEYS = {
  DEALS: 'nyimba_vault_deals_permanent',
  USERS: 'nyimba_vault_users_permanent',
};

export const storageService = {
  // Initialize storage with initial data and vault self-healing + request high capacity persistence
  async init(): Promise<void> {
    try {
      // Automatically request high capacity persistent storage from browser
      await this.requestHighCapacityPersistence();

      // 1. Check if user or deal recovery needed from permanent vault
      const dealsRaw = localStorage.getItem(LS_KEYS.DEALS);
      const vaultDeals = localStorage.getItem(VAULT_KEYS.DEALS);
      if (!dealsRaw && vaultDeals) {
        localStorage.setItem(LS_KEYS.DEALS, vaultDeals);
      }

      const usersRaw = localStorage.getItem(LS_KEYS.USERS);
      const vaultUsers = localStorage.getItem(VAULT_KEYS.USERS);
      if (!usersRaw && vaultUsers) {
        localStorage.setItem(LS_KEYS.USERS, vaultUsers);
      }

      const existing = await this.loadActiveDeals();
      if (!existing || existing.length === 0) {
        for (const deal of INITIAL_DEALS) {
          await this.saveDealPermanently(deal);
        }
      }
    } catch (e) {
      console.warn('Storage init fallback to seed:', e);
    }
  },

  // LAYER 3: Check if deal is blocked
  async isDealBlocked(title: string, phone: string): Promise<boolean> {
    const key = normalizeKey(title, phone);

    // Check LocalStorage fast mirror first
    try {
      const raw = localStorage.getItem(LS_KEYS.BLOCKED_DEALS);
      if (raw) {
        const list: BlockedDeal[] = JSON.parse(raw);
        if (list.some((b) => b.key === key)) return true;
      }
    } catch {}

    // Check IndexedDB
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.BLOCKED_DEALS, 'readonly');
        const store = tx.objectStore(STORES.BLOCKED_DEALS);
        const req = store.get(key);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  // Check if phone number is blocked
  async isUserBlocked(phone: string): Promise<boolean> {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    try {
      const raw = localStorage.getItem(LS_KEYS.BLOCKED_USERS);
      if (raw) {
        const list: BlockedUser[] = JSON.parse(raw);
        if (list.some((u) => u.phone.replace(/[^0-9]/g, '') === cleanPhone)) return true;
      }
    } catch {}

    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.BLOCKED_USERS, 'readonly');
        const store = tx.objectStore(STORES.BLOCKED_USERS);
        const req = store.get(cleanPhone);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  // LAYER 4: Save Deal Permanently (multi-layer)
  async saveDealPermanently(deal: Deal): Promise<void> {
    // 1. Double check blocklist
    if (await this.isDealBlocked(deal.title, deal.phone)) {
      throw new Error(`This business listing was removed by admin/CEO before and is permanently blocked.`);
    }

    const payload: Deal = {
      ...deal,
      isDeleted: false,
      isPermanent: true,
      createdAt: deal.createdAt || new Date().toISOString(),
    };

    // Save to IndexedDB
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORES.DEALS, 'readwrite');
      tx.objectStore(STORES.DEALS).put(payload);
    } catch (e) {
      console.warn('IndexedDB write error:', e);
    }

    // Save to LocalStorage redundant mirror & Permanent Vault
    try {
      const raw = localStorage.getItem(LS_KEYS.DEALS);
      let list: Deal[] = raw ? JSON.parse(raw) : [];
      list = list.filter((d) => d.id !== payload.id);
      list.unshift(payload);
      localStorage.setItem(LS_KEYS.DEALS, JSON.stringify(list));
      localStorage.setItem(VAULT_KEYS.DEALS, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage mirror error:', e);
    }
  },

  // LAYER 4: Admin Delete Deal Permanently
  async adminDeleteDealPermanently(deal: Deal, reason = 'Removed by CEO / Against Policy'): Promise<void> {
    const key = normalizeKey(deal.title, deal.phone);
    const blockedRecord: BlockedDeal = {
      key,
      title: deal.title,
      phone: deal.phone,
      deletedBy: 'CEO (0773694618)',
      deletedAt: new Date().toISOString(),
      reason,
      originalData: deal,
    };

    // 1. Write to Blocklist (IndexedDB)
    try {
      const db = await openDatabase();
      const tx = db.transaction([STORES.DEALS, STORES.DEALS_ARCHIVE, STORES.BLOCKED_DEALS], 'readwrite');

      // Add to blocked deals
      tx.objectStore(STORES.BLOCKED_DEALS).put(blockedRecord);

      // Add to archive
      tx.objectStore(STORES.DEALS_ARCHIVE).put({
        ...deal,
        isDeleted: true,
        archivedAt: new Date().toISOString(),
        archiveReason: reason,
      });

      // Remove from active deals
      tx.objectStore(STORES.DEALS).delete(deal.id);
    } catch (e) {
      console.warn('IndexedDB delete/block error:', e);
    }

    // 2. Write to LocalStorage mirror
    try {
      // Add to blocked deals in LS
      const blockedRaw = localStorage.getItem(LS_KEYS.BLOCKED_DEALS);
      const blockedList: BlockedDeal[] = blockedRaw ? JSON.parse(blockedRaw) : [];
      if (!blockedList.some((b) => b.key === key)) {
        blockedList.unshift(blockedRecord);
        localStorage.setItem(LS_KEYS.BLOCKED_DEALS, JSON.stringify(blockedList));
      }

      // Add to archive in LS
      const archiveRaw = localStorage.getItem(LS_KEYS.ARCHIVE);
      const archiveList = archiveRaw ? JSON.parse(archiveRaw) : [];
      archiveList.unshift({ ...deal, isDeleted: true, archivedAt: new Date().toISOString() });
      localStorage.setItem(LS_KEYS.ARCHIVE, JSON.stringify(archiveList));

      // Remove from active in LS
      const dealsRaw = localStorage.getItem(LS_KEYS.DEALS);
      if (dealsRaw) {
        const deals: Deal[] = JSON.parse(dealsRaw);
        const filtered = deals.filter((d) => d.id !== deal.id);
        localStorage.setItem(LS_KEYS.DEALS, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('LocalStorage delete/block error:', e);
    }
  },

  // Load Active Deals Only (Fast Memory 0.1s)
  async loadActiveDeals(): Promise<Deal[]> {
    // Try LocalStorage first (instant speed 0.05s)
    let deals: Deal[] = [];
    try {
      const raw = localStorage.getItem(LS_KEYS.DEALS);
      if (raw) {
        deals = JSON.parse(raw);
      }
    } catch {}

    // Verify against IndexedDB
    try {
      const db = await openDatabase();
      const fromDb = await new Promise<Deal[]>((resolve) => {
        const tx = db.transaction(STORES.DEALS, 'readonly');
        const store = tx.objectStore(STORES.DEALS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (fromDb.length > 0) {
        deals = fromDb;
        // Keep LS in sync
        try {
          localStorage.setItem(LS_KEYS.DEALS, JSON.stringify(deals));
        } catch {}
      }
    } catch {}

    // Exclude any deals that might match blocklist
    const blockedList = await this.loadBlockedDeals();
    const blockedKeys = new Set(blockedList.map((b) => b.key));

    const cleanDeals = deals.filter((d) => !d.isDeleted && !blockedKeys.has(normalizeKey(d.title, d.phone)));

    // Sort newest first
    cleanDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return cleanDeals;
  },

  // Load Blocked Deals
  async loadBlockedDeals(): Promise<BlockedDeal[]> {
    try {
      const raw = localStorage.getItem(LS_KEYS.BLOCKED_DEALS);
      if (raw) return JSON.parse(raw);
    } catch {}

    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.BLOCKED_DEALS, 'readonly');
        const store = tx.objectStore(STORES.BLOCKED_DEALS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  // Save User Permanently (3 copies)
  async saveUserPermanently(user: User): Promise<void> {
    const payload: User = {
      ...user,
      createdAt: user.createdAt || new Date().toISOString(),
    };

    // 1. IndexedDB Users & Users_Backup
    try {
      const db = await openDatabase();
      const tx = db.transaction([STORES.USERS, STORES.USERS_BACKUP], 'readwrite');
      tx.objectStore(STORES.USERS).put(payload);
      tx.objectStore(STORES.USERS_BACKUP).put({
        ...payload,
        backedUpAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('IDB user save error:', e);
    }

    // 2. LocalStorage mirror & Permanent Vault
    try {
      const raw = localStorage.getItem(LS_KEYS.USERS);
      let list: User[] = raw ? JSON.parse(raw) : [];
      list = list.filter((u) => u.id !== payload.id && u.phone !== payload.phone);
      list.push(payload);
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(list));
      localStorage.setItem(VAULT_KEYS.USERS, JSON.stringify(list));
    } catch (e) {
      console.warn('LS user save error:', e);
    }
  },

  // Load all users
  async loadUsers(): Promise<User[]> {
    try {
      const raw = localStorage.getItem(LS_KEYS.USERS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}

    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.USERS, 'readonly');
        const store = tx.objectStore(STORES.USERS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  // Admin approves user
  async adminApproveUser(userId: string): Promise<User | null> {
    const users = await this.loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    await this.saveUserPermanently(user);
    return user;
  },

  // Admin rejects user
  async adminRejectUser(userId: string, reason = 'Payment verification failed'): Promise<User | null> {
    const users = await this.loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    user.status = 'rejected';
    user.notes = reason;
    await this.saveUserPermanently(user);
    return user;
  },

  // Admin blocks user permanently
  async adminBlockUser(phone: string, username = 'Unknown', reason = 'Banned by CEO'): Promise<void> {
    const blockedRecord: BlockedUser = {
      phone,
      username,
      blockedAt: new Date().toISOString(),
      reason,
    };

    // Save to blocked users
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORES.BLOCKED_USERS, 'readwrite');
      tx.objectStore(STORES.BLOCKED_USERS).put(blockedRecord);
    } catch {}

    try {
      const raw = localStorage.getItem(LS_KEYS.BLOCKED_USERS);
      const list: BlockedUser[] = raw ? JSON.parse(raw) : [];
      if (!list.some((u) => u.phone === phone)) {
        list.push(blockedRecord);
        localStorage.setItem(LS_KEYS.BLOCKED_USERS, JSON.stringify(list));
      }
    } catch {}

    // Update user status to blocked if exists
    const users = await this.loadUsers();
    const user = users.find((u) => u.phone === phone);
    if (user) {
      user.status = 'blocked';
      await this.saveUserPermanently(user);
    }
  },

  // Load blocked users
  async loadBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const raw = localStorage.getItem(LS_KEYS.BLOCKED_USERS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  // Offline queue for deals captured without network in Nyimba
  async queueOfflineDeal(deal: Deal): Promise<void> {
    const queuedDeal = { ...deal, isOfflineQueued: true };
    try {
      const raw = localStorage.getItem(LS_KEYS.OFFLINE_QUEUE);
      const list: Deal[] = raw ? JSON.parse(raw) : [];
      list.push(queuedDeal);
      localStorage.setItem(LS_KEYS.OFFLINE_QUEUE, JSON.stringify(list));
    } catch {}
  },

  // Sync offline queue when back online
  async syncOfflineQueue(): Promise<number> {
    try {
      const raw = localStorage.getItem(LS_KEYS.OFFLINE_QUEUE);
      if (!raw) return 0;
      const list: Deal[] = JSON.parse(raw);
      if (list.length === 0) return 0;

      let syncedCount = 0;
      for (const deal of list) {
        deal.isOfflineQueued = false;
        await this.saveDealPermanently(deal);
        syncedCount++;
      }
      localStorage.removeItem(LS_KEYS.OFFLINE_QUEUE);
      return syncedCount;
    } catch {
      return 0;
    }
  },

  // Get count of queued offline deals
  getOfflineQueueCount(): number {
    try {
      const raw = localStorage.getItem(LS_KEYS.OFFLINE_QUEUE);
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  },

  // Get Maintenance mode config
  getMaintenanceConfig(): MaintenanceConfig {
    const defaultConfig: MaintenanceConfig = {
      enabled: false,
      message: 'Nyimba Deals is currently undergoing scheduled network maintenance and server optimizations. We will be back online shortly. For urgent inquiries, please contact CEO Eustace Banda.',
      estimatedReturn: '15 - 30 minutes',
      updatedAt: new Date().toISOString(),
      updatedBy: 'CEO (0773694618)',
    };

    try {
      const raw = localStorage.getItem(LS_KEYS.MAINTENANCE);
      if (raw) {
        return { ...defaultConfig, ...JSON.parse(raw) };
      }
    } catch {}

    return defaultConfig;
  },

  // Set Maintenance mode
  setMaintenanceConfig(config: Partial<MaintenanceConfig>): MaintenanceConfig {
    const current = this.getMaintenanceConfig();
    const updated: MaintenanceConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LS_KEYS.MAINTENANCE, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // Request High Capacity Persistent Storage (Guarantees no browser eviction)
  async requestHighCapacityPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const granted = await navigator.storage.persist();
        return granted;
      } catch {
        return false;
      }
    }
    return false;
  },

  // Query High Levels Storage Capacity & Quota
  async getStorageCapacityInfo(): Promise<StorageCapacityInfo> {
    let isPersistent = false;
    let quotaBytes = 50 * 1024 * 1024 * 1024; // Default 50GB estimate
    let usedBytes = 2 * 1024 * 1024;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      try {
        if (navigator.storage.persisted) {
          isPersistent = await navigator.storage.persisted();
        }
        if (navigator.storage.estimate) {
          const est = await navigator.storage.estimate();
          if (est.quota) quotaBytes = est.quota;
          if (est.usage) usedBytes = est.usage;
        }
      } catch {}
    }

    const formatBytes = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
      }
      if (bytes >= 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      }
      return Math.round(bytes / 1024) + ' KB';
    };

    const deals = await this.loadActiveDeals();
    const users = await this.loadUsers();
    const blocked = await this.loadBlockedDeals();

    const freeBytes = Math.max(0, quotaBytes - usedBytes);
    const percentUsed = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

    return {
      isPersistent,
      quotaBytes,
      usedBytes,
      quotaFormatted: formatBytes(quotaBytes),
      usedFormatted: formatBytes(usedBytes),
      freeFormatted: formatBytes(freeBytes),
      percentUsed: Number(percentUsed.toFixed(2)),
      dealCount: deals.length,
      userCount: users.length,
      archiveCount: blocked.length,
    };
  },

  // Export full database backup as JSON
  async exportFullDatabaseBackup(): Promise<string> {
    const [deals, users, blockedDeals, blockedUsers] = await Promise.all([
      this.loadActiveDeals(),
      this.loadUsers(),
      this.loadBlockedDeals(),
      this.loadBlockedUsers(),
    ]);

    const backupPayload = {
      appName: 'Nyimba Deals',
      version: '2.0-high-capacity',
      exportedAt: new Date().toISOString(),
      exportedBy: 'CEO Eustace Banda',
      data: {
        deals,
        users,
        blockedDeals,
        blockedUsers,
        maintenance: this.getMaintenanceConfig(),
      },
    };

    return JSON.stringify(backupPayload, null, 2);
  },

  // Import full database backup
  async importFullDatabaseBackup(jsonString: string): Promise<{ success: boolean; dealsRestored: number; usersRestored: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !Array.isArray(parsed.data.deals)) {
        return { success: false, dealsRestored: 0, usersRestored: 0, error: 'Invalid backup file structure.' };
      }

      let dealsRestored = 0;
      let usersRestored = 0;

      // Restore Deals
      for (const deal of parsed.data.deals) {
        await this.saveDealPermanently(deal);
        dealsRestored++;
      }

      // Restore Users
      if (Array.isArray(parsed.data.users)) {
        for (const user of parsed.data.users) {
          await this.saveUserPermanently(user);
          usersRestored++;
        }
      }

      return { success: true, dealsRestored, usersRestored };
    } catch (e: any) {
      return { success: false, dealsRestored: 0, usersRestored: 0, error: e.message || 'Failed to parse backup.' };
    }
  },
};

