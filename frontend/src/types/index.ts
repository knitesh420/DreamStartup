export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'vendor' | 'admin';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string;
  isVerified: boolean;
  savedProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BulkPricingTier {
  minQty: number;
  maxQty?: number;
  price: number;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  bulkPricingTiers: BulkPricingTier[];
  moq: number;
  stock: number;
  isActive: boolean;
  featured: boolean;
  avgRating: number;
  numReviews: number;
  specifications?: Record<string, string>;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: { _id: string; name: string; profileImage?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  moqApplied: boolean;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderItem {
  product: string;
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: 'cash' | 'online_on_call';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface StartupKit {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  startingPrice: number;
  includedServices: string[];
  image?: string;
  isActive: boolean;
}

export interface StartupApplication {
  _id: string;
  user?: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  businessType: string;
  selectedKit: string | StartupKit;
  budget?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  createdAt: string;
}

export interface ServiceProviderProfile {
  _id: string;
  user: string | User;
  profession: 'carpenter' | 'electrician' | 'plumber';
  experienceYears: number;
  serviceAreas: string[];
  skills: string[];
  isApproved: boolean;
  commissionRate: number;
  earnings: number;
  available: boolean;
  createdAt: string;
}

export interface Job {
  _id: string;
  provider: string | ServiceProviderProfile;
  customer?: string | User;
  title: string;
  description?: string;
  serviceType: string;
  location?: string;
  scheduledDate?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  commissionAmount: number;
  earningsAmount: number;
  createdAt: string;
}

export interface Enquiry {
  _id: string;
  type: 'bulk_order' | 'startup' | 'general';
  name: string;
  phone: string;
  email?: string;
  message: string;
  product?: string;
  startupKit?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface CommissionSetting {
  _id: string;
  profession: string;
  defaultCommissionRate: number;
  active: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalStartupApplications: number;
  totalProviders: number;
  pendingEnquiries: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
}

export interface PaginatedData<T> {
  [key: string]: T[] | number;
  total: number;
  page: number;
  pages: number;
}
