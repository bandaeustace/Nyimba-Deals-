import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Lock,
  PlusCircle,
  Wrench,
  Search,
  AlertTriangle,
  RefreshCw,
  Phone,
  CreditCard,
  Ban,
  ArrowLeft,
  DollarSign,
  Package,
  Clock,
  Send,
  EyeOff,
  HardDrive,
  Download,
  Upload,
  ShieldCheck,
  Database
} from 'lucide-react';
import { User, Deal, BlockedDeal, BlockedUser } from '../types';
import { storageService, MaintenanceConfig, StorageCapacityInfo } from '../services/storageService';
import { authService, ADMIN_PHONE, ADMIN_NAME } from '../services/authService';

interface AdminPortalProps {
  onBackToMarketplace: () => void;
  onDealsUpdated: () => void;
}

export default function AdminPortal({
  onBackToMarketplace,
  onDealsUpdated,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<
    'approvals' | 'deals' | 'direct_signup' | 'maintenance' | 'users' | 'blocklist' | 'storage'
  >('approvals');
  const [capacityInfo, setCapacityInfo] = useState<StorageCapacityInfo | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [blockedDeals, setBlockedDeals] = useState<BlockedDeal[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(
    storageService.getMaintenanceConfig()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dealSearch, setDealSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Maintenance form state
  const [maintEnabled, setMaintEnabled] = useState(maintenance.enabled);
  const [maintMessage, setMaintMessage] = useState(maintenance.message);
  const [maintTime, setMaintTime] = useState(maintenance.estimatedReturn);
  const [maintSaveSuccess, setMaintSaveSuccess] = useState(false);

  // Direct signup form state (Admin registers for people who failed)
  const [directUsername, setDirectUsername] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directPassword, setDirectPassword] = useState('123456');
  const [directNotes, setDirectNotes] = useState('');
  const [directSuccessMsg, setDirectSuccessMsg] = useState('');
  const [directErrorMsg, setDirectErrorMsg] = useState('');
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  // Load all admin data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allDeals, allBlockedDeals, allBlockedUsers] = await Promise.all([
        storageService.loadUsers(),
        storageService.loadActiveDeals(),
        storageService.loadBlockedDeals(),
        storageService.loadBlockedUsers(),
      ]);
      setUsers(allUsers);
      setDeals(allDeals);
      setBlockedDeals(allBlockedDeals);
      setBlockedUsers(allBlockedUsers);
      setMaintenance(storageService.getMaintenanceConfig());
      const cap = await storageService.getStorageCapacityInfo();
      setCapacityInfo(cap);
      setIsPersisted(cap.isPersistent);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');

  // Handle Approve User
  const handleApprove = async (user: User) => {
    try {
      await storageService.adminApproveUser(user.id);
      await loadData();
    } catch (e) {
      alert('Failed to approve user.');
    }
  };

  // Handle Reject User
  const handleReject = async (user: User) => {
    const reason = prompt(`Enter rejection reason for ${user.username}:`, 'Payment reference invalid / Not received');
    if (reason !== null) {
      await storageService.adminRejectUser(user.id, reason);
      await loadData();
    }
  };

  // Handle Delete and Block Deal Permanently
  const handleDeleteAndBlockDeal = async (deal: Deal) => {
    const reason = prompt(
      `CEO Action: Permanently delete and block "${deal.title}"?\n\nReason:`,
      'Against community guidelines / Unverified business'
    );
    if (reason !== null) {
      await storageService.adminDeleteDealPermanently(deal, reason);
      alert(`Deal "${deal.title}" deleted and blocked forever. It will never appear again.`);
      await loadData();
      onDealsUpdated();
    }
  };

  // Handle Block User Number
  const handleBlockUserNumber = async (user: User) => {
    const reason = prompt(`Permanently block phone number ${user.phone}?`, 'Violated platform rules');
    if (reason !== null) {
      await storageService.adminBlockUser(user.phone, user.username, reason);
      alert(`Phone number ${user.phone} has been blocked permanently.`);
      await loadData();
    }
  };

  // Handle Save Maintenance Settings
  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.setMaintenanceConfig({
      enabled: maintEnabled,
      message: maintMessage.trim(),
      estimatedReturn: maintTime.trim(),
      updatedBy: ADMIN_NAME,
    });
    setMaintenance(updated);
    setMaintSaveSuccess(true);
    setTimeout(() => setMaintSaveSuccess(false), 3000);
  };

  // Handle Admin Direct Sign Up for customer
  const handleDirectSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectSuccessMsg('');
    setDirectErrorMsg('');

    if (!directUsername.trim() || !directPhone.trim() || !directPassword.trim()) {
      setDirectErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmittingDirect(true);
    try {
      const res = await authService.adminDirectRegister({
        username: directUsername,
        phone: directPhone,
        passwordPlain: directPassword,
        autoApprove: true,
        notes: directNotes || 'Registered manually by CEO Eustace Banda',
      });

      if (!res.success || !res.user) {
        setDirectErrorMsg(res.error || 'Failed to create user account.');
      } else {
        setDirectSuccessMsg(
          `Successfully registered and approved account for ${res.user.username} (${res.user.phone})! They can now log in immediately with password: "${directPassword}".`
        );
        setDirectUsername('');
        setDirectPhone('');
        setDirectNotes('');
        await loadData();
      }
    } catch {
      setDirectErrorMsg('Unexpected error creating account.');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.title.toLowerCase().includes(dealSearch.toLowerCase()) ||
      d.sellerName.toLowerCase().includes(dealSearch.toLowerCase()) ||
      d.phone.includes(dealSearch) ||
      d.category.toLowerCase().includes(dealSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMarketplace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                <span>CEO Command Center</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  0773694618
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {maintenance.enabled && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                <Wrench className="w-3.5 h-3.5" />
                APP CLOSED FOR MAINTENANCE
              </span>
            )}
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh admin records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{pendingUsers.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Awaiting K4 verification</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Approved Members</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{approvedUsers.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Active verified users</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Listings</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400">{deals.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Live deals in Nyimba</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Blocked Forever</span>
              <Ban className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400">{blockedDeals.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Excluded by blocklist</div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-800/60 rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
              <span>K4 Reg Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              K {approvedUsers.filter((u) => !u.isAdmin).length * 4}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">Collected to 0773694618</div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'maintenance'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Close App / Maintenance</span>
            {maintenance.enabled && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('direct_signup')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'direct_signup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Sign Up for People (Assistance)</span>
          </button>

          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'deals'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Deals & Constitution Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('blocklist')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'blocklist'
                ? 'bg-slate-800 text-red-400 border border-red-500/40 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Blocklist Archive ({blockedDeals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>High Capacity Storage</span>
            {capacityInfo && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 text-[10px] font-mono">
                {capacityInfo.quotaFormatted}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: PENDING APPROVALS QUEUE */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Pending Sign-Up Approvals</h2>
                <p className="text-xs text-slate-400">
                  Applicants who submitted K4 payment to 0773694618. Review SMS reference and approve.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {pendingUsers.length} waiting
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">All caught up!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  There are no pending accounts waiting for approval. New registrations will show here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">{user.username}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                        Pending K4
                      </span>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-3 text-xs space-y-1.5 border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Network:</span>
                        <span className="font-bold text-white">{user.paymentNetwork || 'Mobile Money'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SMS Transaction Ref:</span>
                        <span className="font-mono font-bold text-amber-300 truncate max-w-[190px]">
                          {user.paymentRef}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-bold text-emerald-400">K4.00</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-500">
                        <span>Submitted:</span>
                        <span>{new Date(user.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(user)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve (Grant Access)
                      </button>
                      <button
                        onClick={() => handleReject(user)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLOSE APP FOR MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">App Maintenance Control</h2>
                <p className="text-xs text-slate-400">
                  Power to temporarily close Nyimba Deals to regular visitors during upgrades or database fixes.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-5">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white text-sm">Close Platform for Maintenance</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    When enabled, all regular users will see the Maintenance Screen. CEO can still access.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintEnabled}
                    onChange={(e) => setMaintEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Announcement Message Shown to Users
                </label>
                <textarea
                  rows={3}
                  value={maintMessage}
                  onChange={(e) => setMaintMessage(e.target.value)}
                  placeholder="Explain reason for temporary closure..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Estimated Time of Return
                </label>
                <input
                  type="text"
                  value={maintTime}
                  onChange={(e) => setMaintTime(e.target.value)}
                  placeholder="e.g. 20 minutes, or Today 18:00 hrs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {maintSaveSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Maintenance configuration updated successfully!
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-xl shadow-red-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Wrench className="w-4 h-4" />
                {maintEnabled ? 'Apply & Close App Now' : 'Save & Keep App Open (Live)'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ADMIN DIRECT SIGN UP FOR PEOPLE */}
        {activeTab === 'direct_signup' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sign Up for Customers (Assistance)</h2>
                <p className="text-xs text-slate-400">
                  Allow admin to register and instantly approve an account for people who failed or paid cash in person.
                </p>
              </div>
            </div>

            <form onSubmit={handleDirectSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Customer Name / Business
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kondwani Tembo"
                  value={directUsername}
                  onChange={(e) => setDirectUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 097xxxxxxx or 077xxxxxxx"
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Set Initial Password for User
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={directPassword}
                  onChange={(e) => setDirectPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Give this password to the customer so they can log in directly.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Notes / Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid K4 cash at Boma or called on phone"
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {directSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300">
                  {directSuccessMsg}
                </div>
              )}
              {directErrorMsg && (
                <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300">
                  {directErrorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingDirect}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmittingDirect ? 'Creating Account...' : 'Register & Instantly Approve User'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: DEALS & CONSTITUTION MODERATION */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Listing Moderation & Constitution Rules</h2>
                <p className="text-xs text-slate-400">
                  Remove items that do not fit or violate community laws. Deleted deals are blocked from ever returning!
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={dealSearch}
                  onChange={(e) => setDealSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-16/9 bg-slate-950">
                    <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-white">
                      {deal.category}
                    </span>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-xs font-black text-white">
                      {deal.price}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{deal.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{deal.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Seller: {deal.sellerName}</span>
                      <span className="font-mono">{deal.phone}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteAndBlockDeal(deal)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 hover:text-white text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Permanently Delete & Block Deal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REGISTERED USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">All Registered Users</h2>
                <p className="text-xs text-slate-400">Manage user accounts and restriction status.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Network / Ref</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                        {u.isAdmin ? '👑 ' : ''}
                        {u.username}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : u.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">
                        {u.paymentRef || u.paymentNetwork || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleBlockUserNumber(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                            title="Block phone number"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: BLOCKLIST ARCHIVE */}
        {activeTab === 'blocklist' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Permanent Blocklist & Protection Engine</h2>
              <p className="text-xs text-slate-400">
                Layer 3 Memory: Deals and phone numbers listed here are blocked permanently and cannot be re-added.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blockedDeals.map((b) => (
                <div key={b.key} className="bg-slate-900 border border-red-950 p-4 rounded-2xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{b.title}</h4>
                      <span className="text-xs font-mono text-red-400">{b.phone}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-red-950 border border-red-800 text-[10px] font-bold text-red-300">
                      Blocked Forever
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">Reason:</span> {b.reason}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
                    <span>Deleted By: {b.deletedBy}</span>
                    <span>{new Date(b.deletedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {blockedDeals.length === 0 && (
                <div className="col-span-2 text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No deals currently in blocklist. When you delete a deal from Moderation, it will be saved here forever.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: HIGH CAPACITY STORAGE ENGINE */}
        {activeTab === 'storage' && (
          <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">High Capacity Storage Engine</h2>
                  <p className="text-xs text-slate-400">
                    Unlimited permanent storage with multi-layer vault, disk quota allocation, and eviction immunity.
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isPersisted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isPersisted ? 'Eviction Immune' : 'Standard Quota'}
              </span>
            </div>

            {/* Storage Quota Card */}
            {capacityInfo && (
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Device Storage Allocation</span>
                  <span className="text-white font-bold">{capacityInfo.quotaFormatted} Total Quota</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(capacityInfo.percentUsed, 1)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Used Storage</span>
                    <span className="font-bold text-white text-sm">{capacityInfo.usedFormatted}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Free Capacity</span>
                    <span className="font-bold text-emerald-400 text-sm">{capacityInfo.freeFormatted}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Permanent Records</span>
                    <span className="font-bold text-white text-sm">
                      {capacityInfo.dealCount} Deals &bull; {capacityInfo.userCount} Users
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Persistence & Action Controls */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Permanent Storage Protection
              </h3>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Lock Permanent Memory (Eviction Immunity)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Instructs your mobile browser never to delete Nyimba Deals cache or accounts, even when device disk space is low.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const granted = await storageService.requestHighCapacityPersistence();
                    setIsPersisted(granted);
                    const cap = await storageService.getStorageCapacityInfo();
                    setCapacityInfo(cap);
                    alert(granted ? 'High capacity storage granted! Browser will never auto-delete your data.' : 'Persistent storage active.');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md"
                >
                  Request Eviction Immunity
                </button>
              </div>
            </div>

            {/* Offline Database Backup & Restore */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Database Backup &amp; Device Export
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const json = await storageService.exportFullDatabaseBackup();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `nyimba_deals_backup_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setBackupMsg('Platform backup successfully downloaded to your device!');
                    setTimeout(() => setBackupMsg(''), 4000);
                  }}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left transition-all flex items-start gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Download Full Backup</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Save complete database (listings, users, blocklists) as a secure JSON file.
                    </div>
                  </div>
                </button>

                <div
                  onClick={() => backupFileInputRef.current?.click()}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left transition-all flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={backupFileInputRef}
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const text = event.target?.result as string;
                          const res = await storageService.importFullDatabaseBackup(text);
                          if (res.success) {
                            alert(`Backup restored successfully! ${res.dealsRestored} listings and ${res.usersRestored} users recovered.`);
                            await loadData();
                            onDealsUpdated();
                          } else {
                            alert(`Restore failed: ${res.error}`);
                          }
                        } catch {
                          alert('Failed to read backup file.');
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Restore from Backup</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Restore all marketplace listings and accounts from a saved backup file.
                    </div>
                  </div>
                </div>
              </div>

              {backupMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {backupMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
