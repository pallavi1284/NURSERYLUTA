/**
 * Stock management and calculation utilities
 */

import type { InventoryItem, StockStatus } from '@/types';

/**
 * Calculate stock status based on quantity
 * - Out of Stock: quantity = 0
 * - Low Stock: 1 <= quantity <= 10
 * - In Stock: quantity > 10
 */
export function calculateStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= 10) return 'low_stock';
  return 'in_stock';
}

/**
 * Get stock status display text
 */
export function getStockStatusText(status: StockStatus): string {
  const statusMap: Record<StockStatus, string> = {
    'out_of_stock': 'Out of Stock',
    'low_stock': 'Low Stock',
    'in_stock': 'In Stock'
  };
  return statusMap[status];
}

/**
 * Get stock status color for UI
 */
export function getStockStatusColor(status: StockStatus): string {
  const colorMap: Record<StockStatus, string> = {
    'out_of_stock': 'text-red-600 bg-red-50',
    'low_stock': 'text-amber-600 bg-amber-50',
    'in_stock': 'text-green-600 bg-green-50'
  };
  return colorMap[status];
}

/**
 * Check if item can be purchased
 */
export function canPurchase(inventory: InventoryItem, requestedQuantity: number): boolean {
  // Cannot purchase if out of stock
  if (inventory.quantity <= 0) return false;
  
  // Cannot purchase more than available
  if (requestedQuantity > inventory.quantity) return false;
  
  // Check minimum order quantity
  const minOrder = inventory.minOrderQuantity ?? 1;
  if (requestedQuantity < minOrder) return false;
  
  return true;
}

/**
 * Deduct stock from inventory after order confirmation
 * Returns updated inventory item or null if insufficient stock
 */
export function deductStock(
  inventory: InventoryItem,
  quantity: number
): InventoryItem | null {
  if (quantity > inventory.quantity) {
    return null;
  }

  const updated = {
    ...inventory,
    quantity: inventory.quantity - quantity,
    stockStatus: calculateStockStatus(inventory.quantity - quantity) as 'out_of_stock' | 'low_stock' | 'in_stock'
  };

  return updated;
}

/**
 * Restore stock for cancelled orders or failed payments
 */
export function restoreStock(
  inventory: InventoryItem,
  quantity: number
): InventoryItem {
  const updated = {
    ...inventory,
    quantity: Math.max(0, inventory.quantity + quantity),
    stockStatus: calculateStockStatus(inventory.quantity + quantity) as 'out_of_stock' | 'low_stock' | 'in_stock'
  };

  return updated;
}

/**
 * Validate stock reconciliation
 * Check if stock values are consistent and can be recovered
 */
export function validateStockReconciliation(
  inventory: InventoryItem,
  orderHistory: Array<{ quantity: number; status: string }>
): { valid: boolean; message: string } {
  // Calculate total deducted from orders
  const totalDeducted = orderHistory
    .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
    .reduce((sum, o) => sum + o.quantity, 0);

  // Stock should never go negative
  if (inventory.quantity < 0) {
    return {
      valid: false,
      message: 'Invalid: Negative inventory detected'
    };
  }

  // Check if current quantity makes sense given initial and orders
  if (inventory.initialQuantity !== undefined) {
    const expectedMinimum = inventory.initialQuantity - totalDeducted;
    if (inventory.quantity < 0) {
      return {
        valid: false,
        message: `Invalid: Current quantity (${inventory.quantity}) cannot be less than expected (${expectedMinimum})`
      };
    }
  }

  return {
    valid: true,
    message: 'Inventory is consistent'
  };
}

/**
 * Get stock warning message for display
 */
export function getStockWarning(inventory: InventoryItem): string | null {
  if (inventory.quantity === 0) {
    return 'This item is out of stock';
  }
  if (inventory.quantity < 5) {
    return `Only ${inventory.quantity} item(s) left!`;
  }
  if (inventory.quantity < 10) {
    return `Stock running low: ${inventory.quantity} available`;
  }
  return null;
}
