import React, { useState } from 'react';
import { Wrench, Phone, MessageSquare, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { MaintenanceConfig } from '../services/storageService';
import { authService, ADMIN_PHONE } from '../services/authService';

interface MaintenanceScreenProps {
  config: MaintenanceConfig;
  onAdminUnlock: () => void;
}

export default function MaintenanceScreen({ config, onAdminUnlock }: MaintenanceScreenProps) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAdminBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setLoginError('');

    try {
      const res = await authService.login(ADMIN_PHONE, adminPassword);
      if (res.success && res.user?.isAdmin) {
        onAdminUnlock();
      } else {
        setLoginError('Invalid CEO credentials.');
      }
    } catch {
      setLoginError('Authorization failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-md mx-auto w-full pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide uppercase mb-6">
          <Wrench className="w-4 h-4 animate-spin text-amber-400" />
          Scheduled System Maintenance
        </div>

        <div className="w-20 h-20 bg-slate-800/80 border border-slate-700 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6 relative">
          <ShieldAlert className="w-10 h-10 text-amber-400" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <span className="w-2 h-2 bg-slate-900 rounded-full animate-ping" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          Nyimba Deals is Temporarily Closed
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {config.message || 'The platform is currently undergoing scheduled network maintenance and server optimizations. We will be back online shortly.'}
        </p>

        {/* Estimated Recovery Card */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl p-4 text-left mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expected Time to Restore</span>
            <span className="text-emerald-400 font-medium">Under active work</span>
          </div>
          <div className="text-lg font-bold text-white">
            {config.estimatedReturn || '15 - 30 minutes'}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span>Authorized by CEO Eustace Banda</span>
          </div>
        </div>

        {/* Urgent Contact Actions */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Need urgent assistance or trade verification?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:0773694618"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-sm transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              Call CEO
            </a>
            <a
              href="https://wa.me/260773694618?text=Hello%20CEO%20Eustace%20Banda,%20I%20need%20assistance%20regarding%20Nyimba%20Deals"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Admin Emergency Bypass Section */}
      <div className="max-w-md mx-auto w-full pt-8 pb-4 text-center">
        {!showAdminLogin ? (
          <button
            onClick={() => setShowAdminLogin(true)}
            className="text-xs text-slate-600 hover:text-slate-400 flex items-center justify-center gap-1.5 mx-auto py-2 px-3 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>CEO Maintenance Access</span>
          </button>
        ) : (
          <form onSubmit={handleAdminBypass} className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                CEO Emergency Portal Unlock
              </span>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Enter CEO password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              {loginError && <p className="text-xs text-red-400">{loginError}</p>}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isVerifying ? 'Authenticating...' : 'Unlock & Re-open App'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
