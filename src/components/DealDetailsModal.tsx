import React from 'react';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Calendar,
  Share2,
  Trash2,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { Deal, User } from '../types';
import FastImage from './FastImage';
import { EXACT_CATEGORIES } from '../constants/categories';

interface DealDetailsModalProps {
  deal: Deal;
  currentUser: User | null;
  onClose: () => void;
  onAdminDelete?: (deal: Deal) => void;
}

export default function DealDetailsModal({
  deal,
  currentUser,
  onClose,
  onAdminDelete,
}: DealDetailsModalProps) {
  const catDef = EXACT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === deal.category.toLowerCase()
  );

  const cleanPhoneForWa = deal.phone.replace(/[^0-9]/g, '');
  const waNumber = cleanPhoneForWa.startsWith('0')
    ? '260' + cleanPhoneForWa.slice(1)
    : cleanPhoneForWa.startsWith('260')
    ? cleanPhoneForWa
    : '260' + cleanPhoneForWa;

  const waMessage = encodeURIComponent(
    `Hello ${deal.sellerName}, I am contacting you regarding your Nyimba Deals listing: "${deal.title}" (Price: ${deal.price}). Is it still available?`
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Nyimba Deals: ${deal.title}`,
          text: `${deal.title} - ${deal.price} in ${deal.location}. Contact: ${deal.phone}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${deal.title} - ${deal.price} in ${deal.location}. Contact seller on ${deal.phone} via Nyimba Deals.`
      );
      alert('Listing summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto">
          {/* Main Photo Banner */}
          <div className="relative aspect-16/10 w-full bg-slate-900">
            <FastImage
              src={deal.imageUrl}
              alt={deal.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

            {/* Badges on banner */}
            <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
                  catDef?.badgeColor || 'bg-slate-900/80 text-white'
                }`}
              >
                {deal.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-sm">
                {deal.condition || 'Verified'}
              </span>
            </div>

            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-md">
                  {deal.price}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-white/90 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{deal.location}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white flex items-center justify-center transition-all cursor-pointer"
                title="Share deal"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">
                {deal.title}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Posted {new Date(deal.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  ID: #{deal.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Description & Details
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {deal.description}
              </p>
            </div>

            {/* Seller Contact Card */}
            <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    {deal.sellerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {deal.sellerName}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-emerald-800 font-semibold">
                      Verified Nyimba Member
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Phone</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {deal.phone}
                  </span>
                </div>
              </div>

              {/* Direct Zambian Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={`tel:${deal.phone}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all text-center"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Call Seller
                </a>
                <a
                  href={`https://wa.me/${waNumber}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Safety Tips Banner */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Trading Safely in Nyimba:</span> Meet the
                seller at a public place (like Nyimba Boma Market or Great East Road
                Junction). Never send advance money for goods before inspecting them in
                person.
              </div>
            </div>

            {/* CEO Administrative Action */}
            {currentUser?.isAdmin && onAdminDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-900 block">
                      CEO Administrative Power
                    </span>
                    <span className="text-[11px] text-red-700">
                      Delete listing and permanently block this item/phone combination
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `CEO Eustace Banda: Are you sure you want to permanently delete and block "${deal.title}"? It will never return.`
                        )
                      ) {
                        onAdminDelete(deal);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete & Block
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
