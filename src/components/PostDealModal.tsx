import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  MapPin,
  Tag,
  DollarSign,
  Phone,
  FileText,
  Zap,
  WifiOff
} from 'lucide-react';
import { Deal, User } from '../types';
import { EXACT_CATEGORIES, NYIMBA_LOCATIONS } from '../constants/categories';
import { compressImage, CompressionResult } from '../services/imageCompression';
import { storageService } from '../services/storageService';

interface PostDealModalProps {
  currentUser: User;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

export default function PostDealModal({
  currentUser,
  onClose,
  onDealCreated,
}: PostDealModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXACT_CATEGORIES[0].name);
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState(NYIMBA_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<Deal['condition']>('Good');

  // Photo & Compression state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Hidden inputs for Camera and Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = async (file: File) => {
    setIsCompressing(true);
    setErrorMessage('');
    try {
      // Run high speed client-side compression
      const result = await compressImage(file, 1200, 1200, 0.78);
      setImagePreview(result.dataUrl);
      setCompressionStats(result);
    } catch {
      setErrorMessage('Failed to process image. Please try another photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelected(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter a listing title.');
      return;
    }
    if (!price.trim()) {
      setErrorMessage('Please specify the price (e.g. K 450 or Negotiable).');
      return;
    }
    if (!imagePreview) {
      setErrorMessage('Please capture or upload at least one photo of the item.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter contact phone number.');
      return;
    }

    // Format price with Zambian Kwacha K prefix if number only
    let formattedPrice = price.trim();
    if (!formattedPrice.toLowerCase().startsWith('k') && !formattedPrice.toLowerCase().includes('neg')) {
      formattedPrice = `K ${formattedPrice}`;
    }

    const priceNumeric = parseFloat(formattedPrice.replace(/[^0-9.]/g, '')) || 0;
    const finalLocation = location === 'Other Location' && customLocation.trim()
      ? customLocation.trim()
      : location;

    // LAYER 3: CHECK BLOCKLIST LOGIC
    // Check if this title + phone was deleted & blocked by Admin before
    const isBlocked = await storageService.isDealBlocked(title, phone);
    if (isBlocked) {
      setErrorMessage(
        'This business listing was removed by the CEO before and is permanently blocked from being added again.'
      );
      return;
    }

    setIsSubmitting(true);

    const newDeal: Deal = {
      id: 'deal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      category,
      price: formattedPrice,
      priceNum: priceNumeric,
      location: finalLocation,
      phone: phone.trim(),
      sellerName: currentUser.username,
      sellerId: currentUser.id,
      description: description.trim() || `Clean ${title} available in ${finalLocation}. Contact seller for details.`,
      imageUrl: imagePreview,
      compressedSizeKb: compressionStats?.compressedSizeKb,
      originalSizeKb: compressionStats?.originalSizeKb,
      condition,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      isPermanent: true,
      views: 1,
    };

    try {
      if (navigator.onLine) {
        await storageService.saveDealPermanently(newDeal);
      } else {
        // Stand firm offline: save to offline sync queue
        await storageService.queueOfflineDeal(newDeal);
      }
      onDealCreated(newDeal);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Capture & Post Listing</h2>
              <p className="text-[11px] text-emerald-400">Post directly to Nyimba Deals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-900">
          {/* CAMERA CAPTURE & PHOTO UPLOAD AREA */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Item Photo (Instant 2G Compression)
            </label>

            {/* Hidden native inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!imagePreview ? (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex justify-center gap-3 mb-3">
                  {/* DIRECT CAMERA BUTTON */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </button>
                  {/* GALLERY UPLOAD BUTTON */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Gallery
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Photos are automatically compressed to save your internet bundle
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                <img
                  src={imagePreview}
                  alt="Listing preview"
                  className="w-full h-48 object-cover"
                />

                {/* Retake buttons */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bundle Savings Metric Card */}
                {compressionStats && (
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      Compressed: {compressionStats.originalSizeKb} KB &rarr; {compressionStats.compressedSizeKb} KB
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                      Saved {compressionStats.reductionPercentage}% Data!
                    </span>
                  </div>
                )}
              </div>
            )}
            {isCompressing && (
              <p className="text-xs text-emerald-600 font-medium mt-1 animate-pulse">
                Optimizing image for fast 2G loading...
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title / Business Headline
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 50kg Bags of White Maize or Plot in Chinambi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
                required
              />
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Category Dropdown (All 19 exact categories) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category (Select Exact Match)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {EXACT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Price in Kwacha (K)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. K 450 or Negotiable"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-8 font-semibold"
                  required
                />
                <span className="font-bold text-emerald-600 text-sm absolute left-3 top-2.5">K</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as Deal['condition'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Brand New">Brand New</option>
                <option value="Used - Like New">Used - Like New</option>
                <option value="Good">Good / Working</option>
                <option value="Service / Event">Service / Event</option>
              </select>
            </div>
          </div>

          {/* Location in Nyimba */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location in Nyimba
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {NYIMBA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="Other Location">Other Area</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 097xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-8 font-mono"
                  required
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {location === 'Other Location' && (
            <div>
              <input
                type="text"
                placeholder="Specify area (e.g. Nyimba Mission, Mombe, etc.)"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Key Features
            </label>
            <textarea
              rows={3}
              placeholder="Describe condition, quantity, warranty, or inspection instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              'Publishing Listing...'
            ) : !navigator.onLine ? (
              <>
                <WifiOff className="w-4 h-4" />
                Save & Queue Offline
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publish Deal to Nyimba
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
