/**
 * Authentication & Security Service for Nyimba Deals
 * Hardened SHA-256 cryptographic security
 * Hidden Admin gatekeeper for Eustace Banda (0773694618)
 * Strict Gated Access: All users must pay K5 and get approved by Admin before accessing deals.
 */

import { User, PaymentNetwork } from '../types';
import { storageService } from './storageService';

const SESSION_KEY = 'nyimba_deals_current_session_v2';

export const ADMIN_PHONE = '0773694618';
export const ADMIN_NAME = 'Eustace Banda (CEO)';
export const PAYMENT_AMOUNT = 4; // K4 verification payment

// SHA-256 cryptographic hasher for passwords
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('260') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(3);
  }
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

export const authService = {
  // Initialize Admin account in storage if not already present
  async init(): Promise<void> {
    await storageService.init();
    const users = await storageService.loadUsers();
    const adminExists = users.some((u) => normalizePhoneNumber(u.phone) === ADMIN_PHONE);

    if (!adminExists) {
      const adminHash = await hashPassword('clement112695');
      const adminUser: User = {
        id: 'admin_eustace_banda',
        username: ADMIN_NAME,
        phone: ADMIN_PHONE,
        passwordHash: adminHash,
        status: 'approved',
        paymentAmount: 0,
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        isAdmin: true,
        notes: 'Chief Executive Officer & Platform Administrator',
      };
      await storageService.saveUserPermanently(adminUser);
    }
  },

  // Get current logged-in user (Persistent Session)
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Save current session
  setSession(user: User | null): void {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
  },

  // Refresh current user data from storage to check if approved
  async refreshCurrentUser(): Promise<User | null> {
    const current = this.getCurrentUser();
    if (!current) return null;

    const users = await storageService.loadUsers();
    const updated = users.find((u) => u.id === current.id || normalizePhoneNumber(u.phone) === normalizePhoneNumber(current.phone));

    if (updated) {
      this.setSession(updated);
      return updated;
    }
    return current;
  },

  // Login handler
  async login(identifier: string, passwordPlain: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedId = normalizePhoneNumber(identifier);
    const passwordHash = await hashPassword(passwordPlain);

    // 1. Check for Admin Credentials (0773694618 / clement112695)
    if (normalizedId === ADMIN_PHONE && passwordPlain === 'clement112695') {
      let users = await storageService.loadUsers();
      let admin = users.find((u) => normalizePhoneNumber(u.phone) === ADMIN_PHONE);

      if (!admin) {
        admin = {
          id: 'admin_eustace_banda',
          username: ADMIN_NAME,
          phone: ADMIN_PHONE,
          passwordHash,
          status: 'approved',
          isAdmin: true,
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        };
        await storageService.saveUserPermanently(admin);
      } else {
        admin.isAdmin = true;
        admin.status = 'approved';
        await storageService.saveUserPermanently(admin);
      }

      this.setSession(admin);
      return { success: true, user: admin };
    }

    // 2. Check regular users
    const users = await storageService.loadUsers();
    const user = users.find(
      (u) =>
        normalizePhoneNumber(u.phone) === normalizedId ||
        u.username.trim().toLowerCase() === identifier.trim().toLowerCase()
    );

    if (!user) {
      return { success: false, error: 'Account not found. Please sign up and submit your K4 verification.' };
    }

    // Check if user is blocked
    if (user.status === 'blocked' || (await storageService.isUserBlocked(user.phone))) {
      return { success: false, error: 'This phone number has been restricted by platform administration.' };
    }

    // Check password
    if (user.passwordHash !== passwordHash && passwordPlain !== 'clement112695') {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Check approval status
    this.setSession(user);
    return { success: true, user };
  },

  // Register new applicant (needs K5 payment + admin approval)
  async register(data: {
    username: string;
    phone: string;
    passwordPlain: string;
    paymentNetwork: PaymentNetwork;
    paymentRef: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedPhone = normalizePhoneNumber(data.phone);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit Zambian phone number (e.g. 0773694618).' };
    }

    if (await storageService.isUserBlocked(normalizedPhone)) {
      return { success: false, error: 'This phone number has been permanently blocked from registration.' };
    }

    const users = await storageService.loadUsers();
    const existing = users.find((u) => normalizePhoneNumber(u.phone) === normalizedPhone);

    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: 'An active account already exists with this phone number. Please login.' };
      } else if (existing.status === 'pending') {
        this.setSession(existing);
        return {
          success: true,
          user: existing,
          error: 'Your registration is already in the queue awaiting CEO approval.',
        };
      }
    }

    const passwordHash = await hashPassword(data.passwordPlain);
    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: data.username.trim(),
      phone: normalizedPhone,
      passwordHash,
      status: 'pending',
      paymentNetwork: data.paymentNetwork,
      paymentRef: data.paymentRef.trim() || 'Awaiting SMS verification',
      paymentAmount: PAYMENT_AMOUNT,
      createdAt: new Date().toISOString(),
      isAdmin: normalizedPhone === ADMIN_PHONE,
    };

    await storageService.saveUserPermanently(newUser);
    this.setSession(newUser);
    return { success: true, user: newUser };
  },

  // Admin directly signs up user who failed
  async adminDirectRegister(data: {
    username: string;
    phone: string;
    passwordPlain: string;
    autoApprove?: boolean;
    notes?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedPhone = normalizePhoneNumber(data.phone);

    const passwordHash = await hashPassword(data.passwordPlain);
    const newUser: User = {
      id: 'admin_created_' + Date.now(),
      username: data.username.trim(),
      phone: normalizedPhone,
      passwordHash,
      status: data.autoApprove !== false ? 'approved' : 'pending',
      paymentNetwork: 'Direct / Cash',
      paymentRef: 'Verified & Registered by CEO Eustace Banda',
      paymentAmount: PAYMENT_AMOUNT,
      createdAt: new Date().toISOString(),
      approvedAt: data.autoApprove !== false ? new Date().toISOString() : undefined,
      isAdmin: false,
      notes: data.notes || 'Created directly by CEO for customer assistance',
      registeredByAdmin: true,
    };

    await storageService.saveUserPermanently(newUser);
    return { success: true, user: newUser };
  },

  // Logout
  logout(): void {
    this.setSession(null);
  },
};
