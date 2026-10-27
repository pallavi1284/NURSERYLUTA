import { useState } from 'react';
import { Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatINR, formatDate } from '@/lib/utils';

export function AdminCustomersPage() {
  const { customers } = useApp();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Customers</h2>
        <p className="text-sm text-neutral-500 mt-1">{customers.length} registered customers</p>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Contact</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Location</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Orders</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Total Spent</th>
                <th className="text-left text-xs font-bold text-neutral-500 uppercase px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{c.name}</p>
                        <p className="text-xs text-neutral-500">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{c.city}, {c.state}</td>
                  <td className="px-4 py-3">
                    <Badge className="bg-blue-50 text-blue-700">{c.orders} orders</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-neutral-900">{formatINR(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(c.joinedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
