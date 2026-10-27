import type { Plant, InventoryItem, Nursery, Category } from '@/types';

export const DEFAULT_PLANT_IMAGE = 'https://images.pexels.com/photos/4505144/pexels-photo-4505144.jpeg?auto=compress&cs=tinysrgb&h=500&w=700';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStockStatus(quantity: number): { label: string; color: string } {
  if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
  if (quantity < 10) return { label: 'Low Stock', color: 'bg-accent-100 text-accent-700' };
  return { label: 'In Stock', color: 'bg-primary-100 text-primary-700' };
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-accent-100 text-accent-700',
    confirmed: 'bg-blue-100 text-blue-700',
    packed: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-primary-100 text-primary-700',
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-neutral-100 text-neutral-700';
}

export function getPaymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    paid: 'bg-primary-100 text-primary-700',
    pending: 'bg-accent-100 text-accent-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-neutral-100 text-neutral-700',
  };
  return map[status] || 'bg-neutral-100 text-neutral-700';
}

export function buildPlantWithInventory(
  plant: Plant,
  allInventory: InventoryItem[],
  allNurseries: Nursery[],
  allCategories: Category[]
) {
  const plantInventory = allInventory
    .filter((inv) => inv.plantId === plant.id)
    .map((inv) => ({
      ...inv,
      nursery: allNurseries.find((n) => n.id === inv.nurseryId)!,
    }))
    .filter((inv) => inv.nursery);

  const category = allCategories.find((c) => c.id === plant.categoryId) || { id: plant.categoryId, name: plant.categoryId };
  const prices = plantInventory.map((inv) => inv.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const totalQuantity = plantInventory.reduce((sum, inv) => sum + inv.quantity, 0);

  return {
    ...plant,
    inventory: plantInventory,
    category,
    minPrice,
    totalQuantity,
  };
}
