export type UserStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export type PaymentNetwork = 'Airtel Money' | 'MTN MoMo' | 'Zamtel Kwacha' | 'Direct / Cash';

export interface User {
  id: string;
  username: string;
  phone: string;
  passwordHash: string;
  status: UserStatus;
  paymentNetwork?: PaymentNetwork;
  paymentRef?: string;
  paymentAmount?: number; // default K5
  createdAt: string;
  approvedAt?: string;
  isAdmin: boolean;
  notes?: string;
  registeredByAdmin?: boolean;
}

export interface Deal {
  id: string;
  title: string;
  category: string;
  price: string; // e.g. "K 350" or "Negotiable" or "K 15,000"
  priceNum: number;
  location: string; // e.g. "Nyimba Boma", "Chinambi", "Vizimumba", "Kacholola", "Hofmeyr"
  phone: string;
  sellerName: string;
  sellerId: string;
  description: string;
  imageUrl: string;
  compressedSizeKb?: number;
  originalSizeKb?: number;
  condition: 'Brand New' | 'Used - Like New' | 'Good' | 'Service / Event';
  createdAt: string;
  isDeleted: boolean;
  isPermanent?: boolean;
  views?: number;
  isOfflineQueued?: boolean;
}

export interface BlockedDeal {
  key: string; // `${title.toLowerCase()}_${phone}`
  title: string;
  phone: string;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  originalData?: Partial<Deal>;
}

export interface BlockedUser {
  phone: string;
  username: string;
  blockedAt: string;
  reason: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  color: string;
  description: string;
}
