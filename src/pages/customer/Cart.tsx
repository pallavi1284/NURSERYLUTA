import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus, Truck } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, inventory, updateCartQty, removeFromCart, cartTotal, clearCart, showToast } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const shipping = cartTotal > 500 ? 0 : 50;
  const total = cartTotal + shipping;

  // Check for stock issues
  const stockIssues = cart.filter((item) => {
    const inv = inventory.find((i) => i.id === item.inventoryId);
    return !inv || inv.quantity < item.quantity;
  });

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title="Your cart is empty"
          description="Browse our collection of plants from nurseries across India and add your favourites to the cart."
          action={<Link to="/customer/browse-plants"><Button>Browse Plants</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Shopping Cart ({cart.length} items)</h1>
        <button onClick={() => setConfirmClear(true)} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
          <Trash2 size={15} /> Clear cart
        </button>
      </div>

      {/* Stock warning */}
      {stockIssues.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-900 mb-2">⚠️ Stock availability changed</p>
          <p className="text-sm text-amber-700">
            {stockIssues.length} item{stockIssues.length !== 1 ? 's have' : ' has'} insufficient stock. Please review before checkout:
          </p>
          <div className="mt-2 space-y-1">
            {stockIssues.map((item) => {
              const inv = inventory.find((i) => i.id === item.inventoryId);
              return (
                <p key={item.id} className="text-xs text-amber-700">
                  • {item.plant.name}: {inv?.quantity || 0} available, {item.quantity} in cart
                </p>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-neutral-200 card-shadow p-4 flex gap-4">
              <Link to={`/plants/${item.plant.id}`} className="shrink-0">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-100">
                  <img src={item.plant.image} alt={item.plant.name} className="w-full h-full object-cover" />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/plants/${item.plant.id}`}>
                  <h3 className="font-bold text-neutral-900 text-base">{item.plant.name}</h3>
                  <p className="text-sm text-neutral-500">{item.plant.variety}</p>
                </Link>
                <Link to={`/nurseries/${item.nursery.id}`} className="text-xs text-neutral-500 hover:text-primary-700 mt-1 inline-block">
                  from {item.nursery.name} · {item.nursery.city}
                </Link>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => updateCartQty(item.id, item.quantity - 1)} 
                      className="w-8 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        const inv = inventory.find((i) => i.id === item.inventoryId);
                        const maxQty = inv?.quantity || 0;
                        if (item.quantity >= maxQty) {
                          showToast(`Maximum available: ${maxQty} units`, 'error');
                          return;
                        }
                        updateCartQty(item.id, item.quantity + 1);
                      }} 
                      className="w-8 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-neutral-900">{formatINR(item.price * item.quantity)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-neutral-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-neutral-200 card-shadow p-5 sticky top-20">
            <h3 className="font-bold text-neutral-900 mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal ({cart.length} items)</span><span className="font-semibold">{formatINR(cartTotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-semibold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</span></div>
              {shipping > 0 && (
                <p className="text-xs text-primary-600 bg-primary-50 rounded-lg p-2 flex items-center gap-1.5">
                  <Truck size={13} /> Add {formatINR(500 - cartTotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-neutral-200 pt-3 flex justify-between">
                <span className="font-bold text-neutral-900">Total</span>
                <span className="font-bold text-xl text-neutral-900">{formatINR(total)}</span>
              </div>
            </div>
            <Button fullWidth size="lg" className="mt-5" onClick={() => navigate('/customer/checkout')}>
              Proceed to Checkout <ArrowRight size={18} />
            </Button>
            <Link to="/customer/browse-plants" className="block text-center text-sm text-neutral-500 hover:text-primary-700 mt-3">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clearCart(); showToast('Cart cleared'); }}
        title="Clear cart?"
        message="This will remove all items from your cart. This action cannot be undone."
        confirmLabel="Clear cart"
        danger
      />
    </div>
  );
}
