import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Wallet, Landmark, Check, MapPin, ArrowLeft } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, addresses, addAddress, placeOrder, clearCart, showToast, user, inventory } = useApp();

  const [selectedAddr, setSelectedAddr] = useState(addresses[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showNewAddr, setShowNewAddr] = useState(!addresses.length);
  const [newAddr, setNewAddr] = useState({ label: '', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });

  const shipping = cartTotal > 500 ? 0 : 50;
  const total = cartTotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-neutral-700">Your cart is empty</p>
        <Link to="/plants" className="text-primary-600 hover:underline mt-2 inline-block">Browse plants</Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    const addr = addresses.find((a) => a.id === selectedAddr) || {
      ...newAddr,
      id: 'new',
      isDefault: true,
    } as const;

    if (!addr.fullName || !addr.line1 || !addr.city || !addr.pincode) {
      showToast('Please complete your delivery address', 'error');
      return;
    }

    if (showNewAddr && newAddr.fullName) {
      addAddress({ ...newAddr, isDefault: true });
    }

    try {
      // Validate stock availability before placing order
      const outOfStockItems: Array<{ plantName: string; requested: number; available: number }> = [];
      
      cart.forEach((cartItem) => {
        // Find the inventory item for this cart item
        const invItem = inventory.find((inv) => inv.id === cartItem.inventoryId);
        
        if (!invItem) {
          outOfStockItems.push({
            plantName: cartItem.plant.name,
            requested: cartItem.quantity,
            available: 0,
          });
        } else if (invItem.quantity < cartItem.quantity) {
          outOfStockItems.push({
            plantName: cartItem.plant.name,
            requested: cartItem.quantity,
            available: invItem.quantity,
          });
        }
      });

      // If any items are out of stock or insufficient, show error and stop
      if (outOfStockItems.length > 0) {
        let errorMsg = 'Insufficient stock for some items:\n\n';
        outOfStockItems.forEach((item) => {
          errorMsg += `• ${item.plantName}: ${item.available} available, ${item.requested} requested\n`;
        });
        showToast(errorMsg, 'error');
        return;
      }

      // Group cart items by nursery
      const byNursery = new Map<string, typeof cart>();
      cart.forEach((item) => {
        const arr = byNursery.get(item.nursery.id) || [];
        arr.push(item);
        byNursery.set(item.nursery.id, arr);
      });

      // Place order for each nursery and wait for all to complete
      const orderPromises = Array.from(byNursery.entries()).map(([, items]) => {
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const ship = subtotal > 500 ? 0 : 50;
        const nursery = items[0].nursery;
        
        return placeOrder({
          customerId: user?.id || 'cust1',
          customerName: user?.name || addr.fullName,
          customerEmail: user?.email || 'guest@email.com',
          items: items.map((item) => ({
            id: Math.random().toString(36).slice(2),
            plantName: item.plant.name,
            variety: item.plant.variety,
            plantImage: item.plant.image,
            nurseryName: item.nursery.name,
            nurseryId: item.nursery.id,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
          subtotal,
          shipping: ship,
          total: subtotal + ship,
          status: 'pending',
          paymentMethod,
          paymentStatus: 'paid',
          address: addr,
          nurseryId: nursery.id,
          nurseryName: nursery.name,
          sellerUid: nursery.sellerUID, // Add seller UID for order filtering
        });
      });

      // Wait for all orders to be saved to Firebase
      await Promise.all(orderPromises);
      
      clearCart();
      showToast('Order placed successfully!');
      navigate('/customer/order-confirmation');
    } catch (error) {
      console.error('Error placing order:', error);
      showToast(error instanceof Error ? error.message : 'Failed to place order', 'error');
    }
  };

  const paymentOptions = [
    { id: 'UPI', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Wallet },
    { id: 'Card', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'NetBanking', label: 'Net Banking', desc: 'All major banks', icon: Landmark },
    { id: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/customer/my-cart" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ArrowLeft size={16} /> Back to cart
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Delivery Address</h3>
            {addresses.length > 0 && !showNewAddr && (
              <div className="space-y-2.5 mb-4">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddr(addr.id)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${selectedAddr === addr.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${selectedAddr === addr.id ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'}`}>
                      {selectedAddr === addr.id && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{addr.label} · {addr.fullName}</p>
                      <p className="text-sm text-neutral-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{addr.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showNewAddr && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Label (Home/Work)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} placeholder="Home" />
                  <Input label="Full Name" value={newAddr.fullName} onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })} placeholder="John Doe" />
                </div>
                <Input label="Phone" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="+91 98765 43210" />
                <Input label="Address Line 1" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} placeholder="Flat / House no." />
                <Input label="Address Line 2 (optional)" value={newAddr.line2} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} placeholder="Street / Area" />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                  <Input label="State" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
                  <Input label="Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
                </div>
              </div>
            )}
            <button onClick={() => setShowNewAddr(!showNewAddr)} className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              {showNewAddr ? 'Use saved address' : '+ Add new address'}
            </button>
          </Card>

          {/* Payment */}
          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Payment Method</h3>
            <div className="space-y-2.5">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${paymentMethod === opt.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${paymentMethod === opt.id ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'}`}>
                      {paymentMethod === opt.id && <Check size={12} className="text-white" />}
                    </div>
                    <Icon size={20} className="text-neutral-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{opt.label}</p>
                      <p className="text-xs text-neutral-500">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {paymentMethod === 'Card' && (
              <div className="mt-4 space-y-3 p-4 bg-neutral-50 rounded-xl">
                <Input label="Card Number" placeholder="1234 5678 9012 3456" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" />
                  <Input label="CVV" placeholder="123" />
                </div>
              </div>
            )}
            {paymentMethod === 'UPI' && (
              <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
                <Input label="UPI ID" placeholder="yourname@upi" />
              </div>
            )}
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="p-5 sticky top-20">
            <h3 className="font-bold text-neutral-900 mb-4">Order Summary</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                    <img src={item.plant.image} alt={item.plant.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{item.plant.name}</p>
                    <p className="text-xs text-neutral-500">{item.quantity} × {formatINR(item.price)}</p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-neutral-200 pt-3">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-semibold">{formatINR(cartTotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-semibold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</span></div>
              <div className="border-t border-neutral-200 pt-2 flex justify-between"><span className="font-bold text-neutral-900">Total</span><span className="font-bold text-xl text-neutral-900">{formatINR(total)}</span></div>
            </div>
            <Button fullWidth size="lg" className="mt-5" onClick={handlePlaceOrder}>
              Place Order · {formatINR(total)}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
