import React from 'react';
import { Phone, MessageSquare, MapPin, Trash2, ShieldCheck, Eye } from 'lucide-react';
import { Deal, User } from '../types';
import FastImage from './FastImage';
import { EXACT_CATEGORIES } from '../constants/categories';

interface DealCardProps {
  deal: Deal;
  currentUser: User | null;
  onSelectDeal: (deal: Deal) => void;
  onAdminDelete?: (deal: Deal) => void;
}

export default function DealCard({
  deal,
  currentUser,
  onSelectDeal,
  onAdminDelete,
}: DealCardProps) {
  // Find matching category def for styling
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

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Clickable Image & Badge Area */}
      <div
        onClick={() => onSelectDeal(deal)}
        className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-slate-100"
      >
        <FastImage
          src={deal.imageUrl}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs ${
              catDef?.badgeColor || 'bg-slate-900/80 text-white'
            }`}
          >
            {deal.category}
          </span>
        </div>

        {/* Price Tag Pill */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="inline-block bg-slate-950/90 text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-md border border-slate-800">
            {deal.price}
          </span>
        </div>

        {/* Admin Delete Action Button on thumbnail */}
        {currentUser?.isAdmin && onAdminDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdminDelete(deal);
            }}
            title="CEO Action: Permanently Delete & Block Deal"
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div onClick={() => onSelectDeal(deal)} className="cursor-pointer">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-medium truncate max-w-[140px]">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              {deal.location}
            </span>
            <span>{formatTimeAgo(deal.createdAt)}</span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug mb-1.5 group-hover:text-emerald-700 transition-colors">
            {deal.title}
          </h3>

          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">
            {deal.description}
          </p>
        </div>

        {/* Seller Info & Direct Zambian Action Buttons */}
        <div className="pt-2 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2.5">
            <span className="font-semibold text-slate-800 truncate max-w-[150px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {deal.sellerName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{deal.phone}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${deal.phone}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all text-center"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Call
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs text-center"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
