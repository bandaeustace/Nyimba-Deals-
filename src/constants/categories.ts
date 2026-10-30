export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  tagline: string;
}

export const EXACT_CATEGORIES: CategoryDef[] = [
  // Core Real Estate & Vehicles (as requested by user and screenshots)
  {
    id: 'rentals-plots',
    name: 'Rentals and plots for sale',
    icon: 'Home',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    tagline: 'Houses, boarding rooms, business spaces & plots in Nyimba'
  },
  {
    id: 'home-sales',
    name: 'Home sales',
    icon: 'Building2',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-300',
    tagline: 'Residential properties, estates & completed houses'
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: 'Car',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
    tagline: 'Cars, trucks, canters, buses & motorbikes'
  },
  {
    id: 'auto-parts',
    name: 'Auto parts',
    icon: 'Wrench',
    badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-300',
    tagline: 'Tyres, batteries, engine spares & accessories'
  },
  {
    id: 'transport-logistics',
    name: 'Transport & Logistics',
    icon: 'Truck',
    badgeColor: 'bg-sky-500/10 text-sky-700 border-sky-300',
    tagline: 'Trucks, taxis, motorbike dispatch & trips to Lusaka/Chipata'
  },

  // Electronics & Mobile
  {
    id: 'mobile-phones',
    name: 'Mobile phones',
    icon: 'Smartphone',
    badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-300',
    tagline: 'Smartphones, feature phones, screen protectors & chargers'
  },
  {
    id: 'electronics-computers',
    name: 'Electronics & computers',
    icon: 'Laptop',
    badgeColor: 'bg-violet-500/10 text-violet-700 border-violet-300',
    tagline: 'Laptops, desktops, solar invertors & sound systems'
  },
  {
    id: 'accessories-electronics',
    name: 'Accessories & Electronics',
    icon: 'Cpu',
    badgeColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
    tagline: 'Cables, memory cards, solar lights & power banks'
  },
  {
    id: 'appliances',
    name: 'Appliances',
    icon: 'Tv',
    badgeColor: 'bg-stone-500/10 text-stone-700 border-stone-300',
    tagline: 'Fridges, stoves, solar freezers, blenders & kettles'
  },

  // Agriculture & Produce
  {
    id: 'agro-farm-inputs',
    name: 'Agro & Farm Inputs',
    icon: 'Sprout',
    badgeColor: 'bg-green-500/10 text-green-700 border-green-300',
    tagline: 'D-compound, Urea, certified seed, chemicals & sprayers'
  },
  {
    id: 'farm-produce-outputs',
    name: 'Farm Produce & Outputs',
    icon: 'Wheat',
    badgeColor: 'bg-lime-500/10 text-lime-700 border-lime-300',
    tagline: 'Maize grain, soya beans, groundnuts, sunflower & vegetables'
  },
  {
    id: 'livestock-market',
    name: 'Livestock Market',
    icon: 'PawPrint',
    badgeColor: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
    tagline: 'Goats, cattle, village chickens, pigs & animal feed'
  },

  // Hardware & Household
  {
    id: 'hardware-building',
    name: 'Hardware & Building',
    icon: 'Hammer',
    badgeColor: 'bg-orange-500/10 text-orange-700 border-orange-300',
    tagline: 'Cement, roofing sheets, wire fence, bricks & timber'
  },
  {
    id: 'furniture',
    name: 'Furniture',
    icon: 'Armchair',
    badgeColor: 'bg-amber-600/10 text-amber-800 border-amber-400',
    tagline: 'Mukwa beds, sofa sets, wardrobes, desks & mattresses'
  },
  {
    id: 'household',
    name: 'Household',
    icon: 'Lamp',
    badgeColor: 'bg-teal-500/10 text-teal-700 border-teal-300',
    tagline: 'Kitchen utensils, water storage, carpets & curtains'
  },
  {
    id: 'groceries-household',
    name: 'Groceries & Household',
    icon: 'ShoppingBag',
    badgeColor: 'bg-emerald-600/10 text-emerald-800 border-emerald-400',
    tagline: 'Cooking oil, sugar, soaps, salt & food essentials'
  },
  {
    id: 'wholesalers-bulk',
    name: 'Wholesalers & Bulk',
    icon: 'Boxes',
    badgeColor: 'bg-blue-600/10 text-blue-800 border-blue-400',
    tagline: 'Bales, wholesale sacks, cartons & commercial bulk goods'
  },

  // Clothing & Personal Care
  {
    id: 'mens-clothing-shoes',
    name: "Men's clothing & shoes",
    icon: 'Shirt',
    badgeColor: 'bg-slate-600/10 text-slate-800 border-slate-400',
    tagline: 'Suits, jeans, boots, sneakers & casual wear'
  },
  {
    id: 'womens-clothing-shoes',
    name: "Women's clothing & shoes",
    icon: 'Sparkles',
    badgeColor: 'bg-pink-500/10 text-pink-700 border-pink-300',
    tagline: 'Dresses, Chitenge, heels, shoes & accessories'
  },
  {
    id: 'fashion-beauty',
    name: 'Fashion & Beauty',
    icon: 'Smile',
    badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-300',
    tagline: 'Hair braids, perfumes, cosmetics, skincare & lotions'
  },
  {
    id: 'health-beauty',
    name: 'Health & beauty',
    icon: 'Heart',
    badgeColor: 'bg-red-500/10 text-red-700 border-red-300',
    tagline: 'Wellness products, soaps, vitamins & personal grooming'
  },
  {
    id: 'jewelry-accessories',
    name: 'Jewelry & Accessories',
    icon: 'Gem',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-300',
    tagline: 'Watches, rings, necklaces, bags & sunglasses'
  },

  // Food, Tools, Sports & Family
  {
    id: 'restaurants-food',
    name: 'Restaurants & Food',
    icon: 'UtensilsCrossed',
    badgeColor: 'bg-amber-600/10 text-amber-800 border-amber-400',
    tagline: 'Nshima, village chicken, fish, bakery & catering'
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: 'Wrench',
    badgeColor: 'bg-neutral-600/10 text-neutral-800 border-neutral-400',
    tagline: 'Power drills, hand tools, welding machines & equipment'
  },
  {
    id: 'sports-outdoors',
    name: 'Sports & Outdoors',
    icon: 'Activity',
    badgeColor: 'bg-green-600/10 text-green-800 border-green-400',
    tagline: 'Football boots, jerseys, camping gear & fitness'
  },
  {
    id: 'bicycles',
    name: 'Bicycles',
    icon: 'Bike',
    badgeColor: 'bg-teal-600/10 text-teal-800 border-teal-400',
    tagline: 'Mountain bikes, commuter cycles, spare parts & pumps'
  },
  {
    id: 'baby-kids',
    name: 'Baby & kids',
    icon: 'Baby',
    badgeColor: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-300',
    tagline: 'Baby clothes, diapers, strollers, cribs & baby food'
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    icon: 'Dog',
    badgeColor: 'bg-amber-700/10 text-amber-900 border-amber-500',
    tagline: 'Pet food, dog collars, veterinary care & cages'
  },

  // Services & Professional
  {
    id: 'repairs',
    name: 'Repairs',
    icon: 'Wrench',
    badgeColor: 'bg-slate-700/10 text-slate-800 border-slate-400',
    tagline: 'Phone screen repair, TV, motorbike & appliance fixing'
  },
  {
    id: 'medical-services',
    name: 'Medical services',
    icon: 'HeartPulse',
    badgeColor: 'bg-emerald-600/10 text-emerald-800 border-emerald-400',
    tagline: 'Registered pharmacies, clinic tests, optical & health supplies'
  },
  {
    id: 'legal-professional',
    name: 'Legal and professional feature',
    icon: 'Scale',
    badgeColor: 'bg-neutral-700/10 text-neutral-800 border-neutral-400',
    tagline: 'Commissioner for oaths, contracts, surveyor, tax & documentation'
  },
  {
    id: 'tuition-skills',
    name: 'Tuition & Skills',
    icon: 'GraduationCap',
    badgeColor: 'bg-purple-600/10 text-purple-800 border-purple-400',
    tagline: 'ECZ exam coaching, computer lessons, driving & trades'
  },
  {
    id: 'jobs-other-services',
    name: 'Jobs & Other Services',
    icon: 'Briefcase',
    badgeColor: 'bg-violet-600/10 text-violet-800 border-violet-400',
    tagline: 'Vacancies, casual workers, photography, welding & cleaning'
  },
  {
    id: 'musical-instruments',
    name: 'Musical Instruments',
    icon: 'Music',
    badgeColor: 'bg-rose-600/10 text-rose-800 border-rose-400',
    tagline: 'Keyboards, guitars, PA speakers, microphones & mixers'
  },
  {
    id: 'announcements-events',
    name: 'Announcements and events',
    icon: 'Megaphone',
    badgeColor: 'bg-red-600/10 text-red-800 border-red-400',
    tagline: 'Community notices, church events, sports & celebrations'
  },
  {
    id: 'garage-sale',
    name: 'Garage Sale',
    icon: 'Tags',
    badgeColor: 'bg-orange-600/10 text-orange-800 border-orange-400',
    tagline: 'Household clearance, moving sale & multi-item discounts'
  },
  {
    id: 'garden',
    name: 'Garden',
    icon: 'Flower2',
    badgeColor: 'bg-green-700/10 text-green-900 border-green-500',
    tagline: 'Plants, lawn mowers, garden hoses & decorative flowers'
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: 'MoreHorizontal',
    badgeColor: 'bg-zinc-600/10 text-zinc-800 border-zinc-400',
    tagline: 'Other unique items & community trade in Nyimba'
  }
];

export const NYIMBA_LOCATIONS = [
  'Nyimba Boma (Central)',
  'Chinambi Area',
  'Vizimumba',
  'Hofmeyr',
  'Kacholola',
  'Chassa',
  'Mombe Ward',
  'Kaliwe',
  'Great East Road Junction'
];
