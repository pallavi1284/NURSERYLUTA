import { Link } from 'react-router-dom';
import { CheckCircle2, Package, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function OrderConfirmationPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-primary-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">Order Placed Successfully!</h1>
      <p className="text-neutral-500 mb-8">Thank you for your purchase. Your plants are on their way. You'll receive updates as your order progresses.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/customer/my-orders"><Button><Package size={18} /> Track Your Order</Button></Link>
        <Link to="/"><Button variant="outline"><HomeIcon size={18} /> Back to Home</Button></Link>
      </div>
    </div>
  );
}
