import React, { useRef } from 'react';
import {
  Home,
  Truck,
  Smartphone,
  UtensilsCrossed,
  Sprout,
  Wheat,
  Hammer,
  ShoppingBag,
  Boxes,
  GraduationCap,
  PawPrint,
  Sparkles,
  Briefcase,
  Music,
  Armchair,
  Megaphone,
  Wrench,
  HeartPulse,
  Scale,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { EXACT_CATEGORIES } from '../constants/categories';
import { Deal } from '../types';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  deals: Deal[];
}

export default function CategoryBar({
  selectedCategory,
  onSelectCategory,
  deals
}: CategoryBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Helper to render icon dynamically
  const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Home': return <Home className={className} />;
      case 'Building2': return <Home className={className} />;
      case 'Car': return <Truck className={className} />;
      case 'Truck': return <Truck className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Laptop': return <Smartphone className={className} />;
      case 'UtensilsCrossed': return <UtensilsCrossed className={className} />;
      case 'Sprout': return <Sprout className={className} />;
      case 'Wheat': return <Wheat className={className} />;
      case 'Hammer': return <Hammer className={className} />;
      case 'ShoppingBag': return <ShoppingBag className={className} />;
      case 'Boxes': return <Boxes className={className} />;
      case 'GraduationCap': return <GraduationCap className={className} />;
      case 'PawPrint': return <PawPrint className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Music': return <Music className={className} />;
      case 'Armchair': return <Armchair className={className} />;
      case 'Megaphone': return <Megaphone className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'HeartPulse': return <HeartPulse className={className} />;
      case 'Scale': return <Scale className={className} />;
      default: return <LayoutGrid className={className} />;
    }
  };

  const getDealCount = (categoryName: string) => {
    if (categoryName === 'ALL') return deals.length;
    return deals.filter((d) => d.category.toLowerCase() === categoryName.toLowerCase()).length;
  };

  return (
    <div className="relative bg-white border-b border-slate-200/80 shadow-xs z-20">
      <div className="max-w-7xl mx-auto px-4 relative flex items-center">
        {/* Left scroll control arrow */}
        <button
          onClick={() => scroll('left')}
          className="hidden sm:flex absolute left-1 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-emerald-600 hover:scale-105 transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable category pills list */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto py-2.5 px-1 scrollbar-none scroll-smooth w-full no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* ALL CATEGORIES BUTTON */}
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Deals</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {getDealCount('ALL')}
            </span>
          </button>

          {/* 19 EXACT CATEGORIES */}
          {EXACT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const count = getDealCount(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
                title={cat.tagline}
              >
                {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll control arrow */}
        <button
          onClick={() => scroll('right')}
          className="hidden sm:flex absolute right-1 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-emerald-600 hover:scale-105 transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
