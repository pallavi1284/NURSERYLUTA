import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { collection, doc, setDoc, getDoc, getDocs, query, onSnapshot, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateStockStatus } from '@/lib/stock';
import type { User, CartItem, Order, Address, Nursery, Plant, InventoryItem, OrderStatus, Review, PlatformSettings, Complaint, ComplaintStatus, ComplaintResponse } from '@/types';
import { defaultPlatformSettings } from '@/lib/seed';

// Empty seed data - reviews will be added when customers make purchases
const seedReviews: Review[] = [];
const seedCustomers: User[] = [];

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  // Auth
  user: User | null;
  login: (email: string, role: User['role'], uid?: string, name?: string) => void;
  logout: () => void;
  // Data
  nurseries: Nursery[];
  plants: Plant[];
  inventory: InventoryItem[];
  orders: Order[];
  customers: User[];
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  moderateReview: (id: string, status: 'published' | 'hidden') => void;
  // Platform Settings
  platformSettings: PlatformSettings;
  updatePlatformSettings: (settings: PlatformSettings) => Promise<void>;
  loadPlatformSettings: () => Promise<void>;
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  // Orders
  placeOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'trackingHistory'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  // Addresses
  addresses: Address[];
  addAddress: (addr: Omit<Address, 'id'>) => void;
  deleteAddress: (id: string) => void;
  // Nurseries
  addNursery: (nursery: Omit<Nursery, 'id'>) => void;
  updateNursery: (id: string, updates: Partial<Nursery>) => void;
  approveNursery: (id: string) => void;
  rejectNursery: (id: string) => void;
  deleteNursery: (id: string) => void;
  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  // Plants
  addPlant: (plant: Omit<Plant, 'id'>) => string;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  // Complaints
  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses' | 'complaintId'>) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  addComplaintResponse: (complaintId: string, response: ComplaintResponse) => void;
  assignComplaintToSeller: (complaintId: string, sellerId: string) => void;
  addInternalNote: (complaintId: string, note: string) => void;
  deleteComplaint: (id: string) => void;
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Restore user from localStorage on app load
    const savedUser = localStorage.getItem('nurseryhub-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [nurseries, setNurseries] = useState<Nursery[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultPlatformSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback((email: string, role: User['role'], uid?: string, name?: string) => {
    // Generate name from email as fallback
    const nameFromEmail = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    
    // Use provided UID (Firebase UID) - MUST be consistent across sessions
    const userId = uid || `${role}-${Date.now()}`;
    
    const newUser = {
      id: userId,
      name: name || nameFromEmail || 'User',
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    
    console.log('🔑 User logged in:', { email, role, userId, name: newUser.name });
    
    setUser(newUser);
    // Persist user to localStorage for session restoration
    localStorage.setItem('nurseryhub-user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    // Clear user from localStorage on logout
    localStorage.removeItem('nurseryhub-user');
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.inventoryId === item.inventoryId);
      const updated = existing
        ? prev.map((c) =>
            c.inventoryId === item.inventoryId
              ? { ...c, quantity: c.quantity + item.quantity }
              : c
          )
        : [...prev, item];

      // Save to Firebase immediately
      if (user?.id) {
        const cartRef = doc(db, 'carts', user.id);
        setDoc(cartRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true })
          .then(() => {
            console.log('✅ Cart saved to Firebase');
          })
          .catch((err) => {
            console.error('❌ Failed to save cart to Firebase:', err.message);
            showToast('Error saving cart', 'error');
          });
      }

      return updated;
    });
  }, [user?.id, showToast]);

  const updateCartQty = useCallback((id: string, qty: number) => {
    setCart((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, qty) } : c));

      // Save to Firebase immediately
      if (user?.id) {
        const cartRef = doc(db, 'carts', user.id);
        setDoc(cartRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true })
          .then(() => {
            console.log('✅ Cart quantity updated in Firebase');
          })
          .catch((err) => {
            console.error('❌ Failed to update cart in Firebase:', err.message);
          });
      }

      return updated;
    });
  }, [user?.id]);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const updated = prev.filter((c) => c.id !== id);

      // Save to Firebase immediately
      if (user?.id) {
        const cartRef = doc(db, 'carts', user.id);
        setDoc(cartRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true })
          .then(() => {
            console.log('✅ Cart item removed from Firebase');
          })
          .catch((err) => {
            console.error('❌ Failed to remove cart item from Firebase:', err.message);
          });
      }

      return updated;
    });
  }, [user?.id]);

  const clearCart = useCallback(() => {
    setCart([]);

    // Clear from Firebase
    if (user?.id) {
      const cartRef = doc(db, 'carts', user.id);
      setDoc(cartRef, { items: [], updatedAt: new Date().toISOString() }, { merge: true })
        .then(() => {
          console.log('✅ Cart cleared in Firebase');
        })
        .catch((err) => {
          console.error('❌ Failed to clear cart in Firebase:', err.message);
        });
    }
  }, [user?.id]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = useCallback(async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'trackingHistory'>) => {
    const newOrder: Order = {
      ...orderData,
      id: Math.random().toString(36).slice(2),
      orderNumber: `PB-2024-${String(orders.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingHistory: [
        { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' },
      ],
    };
    
    // Update local state first
    setOrders((prev) => [newOrder, ...prev]);
    
    // Deduct stock from inventory based on order items
    const updatedInventory: InventoryItem[] = [];
    const inventoryToUpdate: Array<{ id: string; data: Partial<InventoryItem> }> = [];
    
    setInventory((prev) =>
      prev.map((inv) => {
        // Find matching order item for this inventory
        const orderItem = orderData.items.find((oi) => {
          const plant = plants.find(p => p.id === inv.plantId);
          return plant && oi.plantName === plant.name && oi.nurseryId === inv.nurseryId;
        });
        
        if (orderItem) {
          const newQuantity = Math.max(0, inv.quantity - orderItem.quantity);
          const updated = {
            ...inv,
            quantity: newQuantity,
            stockStatus: calculateStockStatus(newQuantity)
          };
          updatedInventory.push(updated);
          inventoryToUpdate.push({
            id: inv.id,
            data: {
              quantity: newQuantity,
              stockStatus: calculateStockStatus(newQuantity)
            }
          });
          return updated;
        }
        return inv;
      })
    );
    
    // Save order to Firebase Firestore
    try {
      const ordersRef = doc(collection(db, 'orders'), newOrder.id);
      await setDoc(ordersRef, newOrder);
      console.log('✅ Order saved to Firebase:', newOrder.orderNumber);
      
      // Update inventory in Firebase for each deducted item
      for (const update of inventoryToUpdate) {
        try {
          const invRef = doc(db, 'inventory', update.id);
          await setDoc(invRef, update.data, { merge: true });
          console.log('✅ Inventory updated in Firebase:', update.id);
        } catch (invError) {
          console.warn('⚠️ Failed to update inventory in Firebase:', update.id, invError);
          // Continue with other inventory updates even if one fails
        }
      }
      
      return newOrder;
    } catch (error) {
      console.error('❌ Failed to save order to Firebase:', error);
      // Remove from local state if Firebase save failed
      setOrders((prev) => prev.filter((o) => o.id !== newOrder.id));
      // Restore inventory if order save failed
      setInventory((prev) =>
        prev.map((inv) => {
          const updated = updatedInventory.find(u => u.id === inv.id);
          return updated ? { ...inv, quantity: inv.quantity + (updated.quantity - inv.quantity) } : inv;
        })
      );
      throw new Error('Failed to place order. Please try again.');
    }
  }, [orders.length, plants]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString(),
              trackingHistory: [
                ...o.trackingHistory,
                { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` },
              ],
            }
          : o
      )
    );

    console.log('📝 Updating order status:', { orderId, status, note });

    // Update Firebase Firestore
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updatedTracking = orders.find(o => o.id === orderId);
      if (updatedTracking) {
        const newTracking = [...updatedTracking.trackingHistory, { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` }];
        setDoc(orderRef, {
          status,
          updatedAt: new Date().toISOString(),
          trackingHistory: newTracking
        }, { merge: true }).then(() => {
          console.log('✅ Order status updated in Firebase:', orderId);
          showToast('Order status updated successfully!', 'success');
        }).catch((err) => {
          console.error('❌ Failed to update order status in Firebase:', err.message);
          showToast('Error updating order status. Please try again.', 'error');
        });
      }
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }
  }, [orders, showToast]);

  const addAddress = useCallback((addr: Omit<Address, 'id'>) => {
    setAddresses((prev) => [
      ...prev.map((a) => (addr.isDefault ? { ...a, isDefault: false } : a)),
      { ...addr, id: Math.random().toString(36).slice(2) },
    ]);
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addNursery = useCallback((nurseryData: Omit<Nursery, 'id'>) => {
    const id = doc(collection(db, 'nurseries')).id; // Generate proper Firestore ID
    const newNursery: Nursery = { ...nurseryData, id };
    
    console.log('📝 Adding nursery:', {
      nurseryName: newNursery.name,
      nurseryId: id,
      sellerUID: newNursery.sellerUID,
      status: newNursery.status
    });
    
    setNurseries((prev) => [...prev, newNursery]);

    // Save to Firebase immediately (no local-only state)
    try {
      const nurseryRef = doc(db, 'nurseries', id);
      setDoc(nurseryRef, newNursery).then(() => {
        console.log('✅ Nursery registered and saved to Firebase:', {
          name: newNursery.name,
          nurseryId: id,
          sellerUID: newNursery.sellerUID
        });
        showToast('Nursery registered successfully!', 'success');
      }).catch((err) => {
        console.error('❌ Failed to save nursery to Firebase:', err.message);
        showToast('Error saving nursery. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Error connecting to database', 'error');
    }
  }, [showToast]);

  const updateNursery = useCallback((id: string, updates: Partial<Nursery>) => {
    setNurseries((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    
    console.log('📝 Updating nursery:', { nurseryId: id, updates });
    
    // Update Firebase Firestore
    try {
      const nurseryRef = doc(db, 'nurseries', id);
      setDoc(nurseryRef, updates, { merge: true }).then(() => {
        console.log('✅ Nursery updated in Firebase:', id);
        showToast('Nursery profile updated successfully!', 'success');
      }).catch((err) => {
        console.error('❌ Failed to update nursery in Firebase:', err.message);
        showToast('Error updating nursery. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }
  }, [showToast]);

  const approveNursery = useCallback((id: string) => {
    // Find the nursery being approved
    const nursery = nurseries.find(n => n.id === id);
    if (!nursery) return;
    
    // Update local state with approved status
    const approvedNursery = { ...nursery, status: 'approved' as const, verified: true };
    setNurseries((prev) => prev.map((n) => (n.id === id ? approvedNursery : n)));
    
    // NOW save to Firebase (this is the first time it's saved to Firebase)
    try {
      const nurseryRef = doc(db, 'nurseries', id);
      setDoc(nurseryRef, approvedNursery).then(() => {
        console.log('✅ Nursery approved and saved to Firebase:', approvedNursery.name);
      }).catch((err) => {
        console.error('❌ Firebase Firestore nursery approval save failed:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase Firestore not initialized or offline:', error);
    }
  }, [nurseries]);

  const rejectNursery = useCallback((id: string) => {
    setNurseries((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'rejected' as const } : n)));
    
    // DO NOT save rejected nurseries to Firebase
    // They remain only in local state for admin to see
    console.log('🔴 Nursery rejected (not saved to Firebase)');
  }, []);

  const deleteNursery = useCallback((id: string) => {
    // Remove from local state
    setNurseries((prev) => prev.filter((n) => n.id !== id));
    
    // Delete from Firebase Firestore
    try {
      const nurseryRef = doc(db, 'nurseries', id);
      deleteDoc(nurseryRef).then(() => {
        console.log('🗑️ Nursery deleted from Firebase:', id);
      }).catch((err) => {
        console.error('❌ Failed to delete nursery from Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized or offline:', error);
    }
  }, []);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newItem: InventoryItem = {
      ...item,
      id,
      stockStatus: calculateStockStatus(item.quantity)
    };
    setInventory((prev) => [...prev, newItem]);
    
    console.log('📝 Adding inventory item:', { inventoryId: id, plantId: item.plantId, quantity: item.quantity });
    
    // Save to Firebase Firestore
    try {
      const inventoryRef = doc(collection(db, 'inventory'), id);
      setDoc(inventoryRef, newItem).then(() => {
        console.log('✅ Inventory item saved to Firebase:', { id, plantId: item.plantId });
      }).catch((err) => {
        console.error('❌ Failed to save inventory item to Firebase:', err.message);
        showToast('Error saving inventory. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }
  }, [showToast]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) => prev.map((inv) => {
      if (inv.id === id) {
        const updated = { ...inv, ...updates };
        // Auto-calculate stockStatus if quantity is being updated
        if (updates.quantity !== undefined) {
          updated.stockStatus = calculateStockStatus(updates.quantity);
        }
        return updated;
      }
      return inv;
    }));
    
    console.log('📝 Updating inventory item:', { inventoryId: id, updates });
    
    // Update Firebase Firestore
    try {
      const inventoryRef = doc(db, 'inventory', id);
      const toUpdate = { ...updates };
      // Auto-calculate stockStatus for Firebase if quantity is being updated
      if (updates.quantity !== undefined && !updates.stockStatus) {
        toUpdate.stockStatus = calculateStockStatus(updates.quantity);
      }
      setDoc(inventoryRef, toUpdate, { merge: true }).then(() => {
        console.log('✅ Inventory item updated in Firebase:', id);
      }).catch((err) => {
        console.error('❌ Failed to update inventory in Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
    }
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const addPlant = useCallback((plant: Omit<Plant, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newPlant = { ...plant, id };
    setPlants((prev) => [...prev, newPlant]);

    console.log('📝 Adding plant:', { plantId: id, name: plant.name, nurseryId: plant.nurseryId, sellerUID: plant.sellerUID });

    // Save to Firebase Firestore database
    try {
      const plantRef = doc(collection(db, 'plants'), id);
      setDoc(plantRef, newPlant).then(() => {
        console.log('✅ Plant saved to Firebase:', { id, name: plant.name });
        showToast('Plant added successfully!', 'success');
      }).catch((err) => {
        console.error('❌ Failed to save plant to Firebase:', err.message);
        showToast('Error saving plant. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }

    return id;
  }, [showToast]);

  const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
    setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    console.log('📝 Updating plant:', { plantId: id, updates });

    // Update Firebase Firestore database
    try {
      const plantRef = doc(db, 'plants', id);
      setDoc(plantRef, updates, { merge: true }).then(() => {
        console.log('✅ Plant updated in Firebase:', id);
        showToast('Plant updated successfully!', 'success');
      }).catch((err) => {
        console.error('❌ Failed to update plant in Firebase:', err.message);
        showToast('Error updating plant. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }
  }, [showToast]);

  const deletePlant = useCallback((id: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
    setInventory((prev) => prev.filter((inv) => inv.plantId !== id));
  }, []);

  const addComplaint = useCallback((complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses' | 'complaintId'>) => {
    const id = Math.random().toString(36).slice(2);
    const complaintId = `COMP-${new Date().getFullYear()}-${String(complaints.length + 1).padStart(4, '0')}`;
    const newComplaint: Complaint = {
      ...complaintData,
      id,
      complaintId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };
    setComplaints((prev) => [newComplaint, ...prev]);

    console.log('📝 Adding complaint:', { complaintId, customerId: complaintData.customerId, subject: complaintData.subject });

    // Save to Firebase - remove undefined fields to avoid Firebase error
    try {
      const complaintRef = doc(collection(db, 'complaints'), id);
      // Create a cleaned object without undefined values
      const cleanedComplaint = Object.entries(newComplaint).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<Complaint>);
      
      setDoc(complaintRef, cleanedComplaint).then(() => {
        console.log('✅ Complaint saved to Firebase:', complaintId);
        showToast('Complaint submitted successfully!', 'success');
      }).catch((err) => {
        console.error('❌ Failed to save complaint to Firebase:', err.message);
        showToast('Error saving complaint. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }
  }, [complaints.length, showToast]);

  const updateComplaint = useCallback((id: string, updates: Partial<Complaint>) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)));

    console.log('📝 Updating complaint:', { complaintId: id, updates });

    // Update Firebase Firestore
    try {
      const complaintRef = doc(db, 'complaints', id);
      setDoc(complaintRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true }).then(() => {
        console.log('✅ Complaint updated in Firebase:', id);
      }).catch((err) => {
        console.error('❌ Failed to update complaint in Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
    }
  }, []);

  const addComplaintResponse = useCallback((complaintId: string, response: ComplaintResponse) => {
    setComplaints((prev) => prev.map((c) =>
      c.id === complaintId
        ? { ...c, responses: [response, ...c.responses], updatedAt: new Date().toISOString() }
        : c
    ));

    console.log('📝 Adding complaint response:', { complaintId, responderRole: response.responderRole });

    // Update Firebase Firestore using arrayUnion for safe array operations
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      updateDoc(complaintRef, {
        responses: arrayUnion(response),
        updatedAt: new Date().toISOString()
      }).then(() => {
        console.log('✅ Complaint response saved to Firebase:', complaintId);
      }).catch((err) => {
        console.error('❌ Failed to save complaint response in Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
    }
  }, []);

  const deleteComplaint = useCallback((id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));

    console.log('📝 Deleting complaint:', id);

    // Delete from Firebase Firestore
    try {
      const complaintRef = doc(db, 'complaints', id);
      deleteDoc(complaintRef).then(() => {
        console.log('✅ Complaint deleted from Firebase:', id);
      }).catch((err) => {
        console.error('❌ Failed to delete complaint from Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
    }
  }, []);

  const assignComplaintToSeller = useCallback((complaintId: string, sellerId: string) => {
    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? { ...c, assignedToSellerId: sellerId, updatedAt: new Date().toISOString() } : c)));

    console.log('📝 Assigning complaint to seller:', { complaintId, sellerId });

    // Update Firebase
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      updateDoc(complaintRef, {
        assignedToSellerId: sellerId,
        updatedAt: new Date().toISOString()
      }).then(() => {
        console.log('✅ Complaint assigned in Firebase:', complaintId);
      }).catch((err) => {
        console.error('❌ Failed to assign complaint in Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
    }
  }, []);

  const addInternalNote = useCallback((complaintId: string, note: string) => {
    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? { ...c, internalNotes: note, updatedAt: new Date().toISOString() } : c)));

    console.log('📝 Adding internal note to complaint:', { complaintId });

    // Update Firebase
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      updateDoc(complaintRef, {
        internalNotes: note,
        updatedAt: new Date().toISOString()
      }).then(() => {
        console.log('✅ Internal note saved in Firebase:', complaintId);
      }).catch((err) => {
        console.error('❌ Failed to save internal note in Firebase:', err.message);
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
    }
  }, []);

  const addReview = useCallback((review: Omit<Review, 'id' | 'date'>) => {
    setReviews((prev) => [
      { ...review, id: Math.random().toString(36).slice(2), date: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updateReview = useCallback((id: string, updates: Partial<Review>) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const moderateReview = useCallback((id: string, status: 'published' | 'hidden') => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }, []);

  const updatePlatformSettings = useCallback(async (settings: PlatformSettings) => {
    setPlatformSettings(settings);
    
    console.log('📝 Updating platform settings');
    
    // Save to Firebase Firestore
    try {
      const settingsRef = doc(db, 'settings', 'platform');
      await setDoc(settingsRef, settings).then(() => {
        console.log('✅ Platform settings saved to Firebase');
        showToast('Platform settings updated successfully!', 'success');
      }).catch((err) => {
        console.error('❌ Failed to save platform settings to Firebase:', err.message);
        showToast('Error saving settings. Please try again.', 'error');
      });
    } catch (error) {
      console.error('❌ Firebase not initialized:', error);
      showToast('Database connection error', 'error');
    }
  }, [showToast]);

  const loadPlatformSettings = useCallback(async () => {
    try {
      const settingsRef = doc(db, 'settings', 'platform');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        console.log('📥 Platform settings loaded from Firebase');
        setPlatformSettings(settingsSnap.data() as PlatformSettings);
      } else {
        console.log('ℹ️ No platform settings found in Firebase, using defaults');
      }
    } catch (error) {
      console.error('❌ Failed to load platform settings from Firebase:', error);
    }
  }, []);

  // Load nurseries from Firebase on mount and listen for changes
  useEffect(() => {
    const nurseriesRef = collection(db, 'nurseries');
    
    const unsubscribe = onSnapshot(nurseriesRef, (snapshot) => {
      const nurseriesData: Nursery[] = [];
      snapshot.forEach((doc) => {
        nurseriesData.push(doc.data() as Nursery);
      });
      console.log('📥 Loaded nurseries from Firebase:', nurseriesData.length);
      setNurseries(nurseriesData);
    }, (error) => {
      console.warn('Firebase Firestore nurseries listener error:', error);
      // Fallback: try one-time load
      getDocs(nurseriesRef).then((snapshot) => {
        const nurseriesData: Nursery[] = [];
        snapshot.forEach((doc) => {
          nurseriesData.push(doc.data() as Nursery);
        });
        setNurseries(nurseriesData);
      }).catch((err) => {
        console.warn('Firebase Firestore nurseries load failed:', err);
      });
    });

    return () => unsubscribe();
  }, []);

  // Load plants from Firebase on mount and listen for changes
  useEffect(() => {
    const plantsRef = collection(db, 'plants');
    
    const unsubscribe = onSnapshot(plantsRef, (snapshot) => {
      const plantsData: Plant[] = [];
      snapshot.forEach((doc) => {
        plantsData.push(doc.data() as Plant);
      });
      console.log('📥 Loaded plants from Firebase:', plantsData.length);
      setPlants(plantsData);
    }, (error) => {
      console.warn('Firebase Firestore plants listener error:', error);
      // Fallback: try one-time load
      getDocs(plantsRef).then((snapshot) => {
        const plantsData: Plant[] = [];
        snapshot.forEach((doc) => {
          plantsData.push(doc.data() as Plant);
        });
        setPlants(plantsData);
      }).catch((err) => {
        console.warn('Firebase Firestore plants load failed:', err);
      });
    });

    return () => unsubscribe();
  }, []);

  // Load cart from Firebase when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      setCart([]);
      return;
    }

    setCartLoading(true);
    const cartRef = doc(db, 'carts', user.id);
    
    getDoc(cartRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.items && Array.isArray(data.items)) {
            setCart(data.items);
            console.log('✅ Cart loaded from Firebase:', data.items.length, 'items');
          }
        }
        setCartLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load cart from Firebase:', err);
        setCartLoading(false);
      });
  }, [user?.id]);

  // Load inventory from Firebase on mount and listen for changes
  useEffect(() => {
    const inventoryRef = collection(db, 'inventory');
    
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const inventoryData: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        inventoryData.push(doc.data() as InventoryItem);
      });
      console.log('📥 Loaded inventory from Firebase:', inventoryData.length);
      setInventory(inventoryData);
    }, (error) => {
      console.warn('Firebase Firestore inventory listener error:', error);
      // Fallback: try one-time load
      getDocs(inventoryRef).then((snapshot) => {
        const inventoryData: InventoryItem[] = [];
        snapshot.forEach((doc) => {
          inventoryData.push(doc.data() as InventoryItem);
        });
        setInventory(inventoryData);
      }).catch((err) => {
        console.warn('Firebase Firestore inventory load failed:', err);
      });
    });

    return () => unsubscribe();
  }, []);

  // Load orders from Firebase on mount and listen for changes
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push(doc.data() as Order);
      });
      console.log('📥 Loaded orders from Firebase:', ordersData.length);
      setOrders(ordersData);
    }, (error) => {
      console.warn('Firebase Firestore orders listener error:', error);
      // Fallback: try one-time load
      getDocs(ordersRef).then((snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach((doc) => {
          ordersData.push(doc.data() as Order);
        });
        setOrders(ordersData);
      }).catch((err) => {
        console.warn('Firebase Firestore orders load failed:', err);
      });
    });

    return () => unsubscribe();
  }, []);

  // Load complaints from Firebase on mount and listen for changes
  useEffect(() => {
    const complaintsRef = collection(db, 'complaints');
    
    const unsubscribe = onSnapshot(complaintsRef, (snapshot) => {
      const complaintsData: Complaint[] = [];
      snapshot.forEach((doc) => {
        complaintsData.push(doc.data() as Complaint);
      });
      console.log('📥 Loaded complaints from Firebase:', complaintsData.length);
      setComplaints(complaintsData);
    }, (error) => {
      console.warn('Firebase Firestore complaints listener error:', error);
      // Fallback: try one-time load
      getDocs(complaintsRef).then((snapshot) => {
        const complaintsData: Complaint[] = [];
        snapshot.forEach((doc) => {
          complaintsData.push(doc.data() as Complaint);
        });
        setComplaints(complaintsData);
      }).catch((err) => {
        console.warn('Firebase Firestore complaints load failed:', err);
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user, login, logout,
        nurseries, plants, inventory, orders, customers: seedCustomers, reviews, addReview, updateReview, moderateReview,
        complaints, addComplaint, updateComplaint, addComplaintResponse, assignComplaintToSeller, addInternalNote, deleteComplaint,
        platformSettings, updatePlatformSettings, loadPlatformSettings,
        cart, addToCart, updateCartQty, removeFromCart, clearCart, cartTotal, cartCount,
        placeOrder, updateOrderStatus,
        addresses, addAddress, deleteAddress,
        addNursery, updateNursery, approveNursery, rejectNursery, deleteNursery,
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addPlant, updatePlant, deletePlant,
        toasts, showToast, dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
