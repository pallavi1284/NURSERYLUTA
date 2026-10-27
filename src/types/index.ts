export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface Nursery {
  id: string;
  sellerUID: string; // Firebase Auth UID of seller who owns this nursery
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logo: string;
  banner: string;
  profilePicture?: string; // Nursery profile picture URL (Cloudinary)
  profilePicturePublicId?: string; // For secure deletion
  description: string;
  specializations?: string[]; // Array of category IDs
  rating: number;
  reviewCount: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  joinedDate: string;
  totalPlants: number;
}

export interface Plant {
  id: string;
  sellerUID: string; // Firebase Auth UID of seller who owns this plant
  nurseryId: string; // Nursery this plant belongs to
  name: string;
  variety: string;
  categoryId: string;
  description: string;
  image: string;
  cloudinaryPublicId?: string; // Cloudinary public_id for secure deletion
  sunlight?: 'Full Sun' | 'Partial Shade' | 'Full Shade';
  watering?: 'Low' | 'Medium' | 'High';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  height?: string;
  heightUnit?: 'cm' | 'm' | 'ft';
  plantType?: string;
  
  // Plant Quality & Specifications
  subtype?: string;
  propagationMethod?: string;
  age?: string;
  ageUnit?: 'Months' | 'Years';
  rootType?: string;
  rootstock?: string;
  condition?: 'Healthy' | 'Good' | 'Needs Attention';
  
  // Growing Information
  soilRequirement?: string;
  climate?: string;
  plantingSeason?: string;
  maturityPeriod?: string;
  careInstructions?: string;
}

export interface InventoryItem {
  id: string;
  sellerUID: string; // Firebase Auth UID of seller who owns this inventory
  plantId: string;
  nurseryId: string;
  price: number;
  quantity: number;
  sku: string;
  minOrderQuantity?: number;
  status?: 'active' | 'archived'; // for soft delete
  stockStatus?: 'out_of_stock' | 'low_stock' | 'in_stock'; // Auto-calculated
  initialQuantity?: number; // For reconciliation and tracking
}

export interface PlantWithInventory extends Plant {
  inventory: (InventoryItem & { nursery: Nursery })[];
  category: Category;
  minPrice: number;
  totalQuantity: number;
}

export interface CartItem {
  id: string;
  inventoryId: string;
  plant: Plant;
  nursery: Nursery;
  price: number;
  quantity: number;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  plantName: string;
  variety: string;
  plantImage: string;
  nurseryName: string;
  nurseryId: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  address: Address;
  createdAt: string;
  updatedAt: string;
  nurseryId: string;
  nurseryName: string;
  sellerUid: string; // Firebase Auth UID of seller (for seller panel filtering)
  trackingHistory: { status: OrderStatus; timestamp: string; note: string }[];
}

export interface Review {
  id: string;
  plantId: string;
  nurseryId: string;
  customerId: string;
  customerName: string;
  orderId?: string; // Links review to a specific order
  orderItemId?: string; // Links review to a specific item
  rating: number; // 1-5 Plant rating
  nurseryRating?: number; // 1-5 Nursery rating
  comment: string;
  date: string;
  verifiedPurchase: boolean; // Only true if order delivered
  
  // Optional aspects
  plantQualityRating?: number;
  packagingRating?: number;
  deliveryRating?: number;
  sellerExperienceRating?: number;
  
  status: 'published' | 'hidden'; // For Admin moderation
}

export interface PlatformSettings {
  siteName: string;
  supportEmail: string;
  contactPhone: string;
  address: string;
  commission: string;
  minOrder: string;
  currency: string;
  autoApprove: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export type ComplaintStatus = 'open' | 'under_review' | 'waiting_for_customer' | 'resolved' | 'rejected';
export type ComplaintCategory = 'damaged_plant' | 'wrong_plant' | 'missing_items' | 'delivery_delay' | 'payment_issue' | 'refund_request' | 'other';

export interface Complaint {
  id: string;
  complaintId: string; // Unique complaint number (COMP-2024-0001)
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderId?: string; // Related order
  orderNumber?: string;
  nurseryId?: string; // Related nursery (for seller filtering)
  nurseryName?: string; // Nursery name for display
  sellerUid?: string; // Seller UID (for seller access)
  category: ComplaintCategory;
  subject: string;
  description: string;
  attachments?: string[]; // Image URLs from Cloudinary
  status: ComplaintStatus;
  priority?: 'low' | 'medium' | 'high';
  assignedToSellerId?: string; // Admin can assign to a specific seller
  internalNotes?: string; // Admin-only notes (not visible to customers/sellers)
  createdAt: string;
  updatedAt: string;
  responses: ComplaintResponse[];
}

export interface ComplaintResponse {
  responderId: string;
  responderName: string;
  responderRole: UserRole;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export type StockStatus = 'out_of_stock' | 'low_stock' | 'in_stock';

