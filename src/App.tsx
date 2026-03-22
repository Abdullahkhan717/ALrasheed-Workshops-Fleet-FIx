/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  status: 'available' | 'in-use' | 'maintenance';
  lastUsed: string;
}

const initialVehicles: Vehicle[] = [
  { id: '1', name: 'Table Saw', status: 'available', lastUsed: '2026-03-10' },
  { id: '2', name: 'Drill Press', status: 'in-use', lastUsed: '2026-03-14' },
  { id: '3', name: 'Band Saw', status: 'maintenance', lastUsed: '2026-03-01' },
];

export default function App() {
  const [vehicles] = useState<Vehicle[]>(initialVehicles);

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in-use': return <Package className="w-5 h-5 text-blue-500" />;
      case 'maintenance': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900">Workshop Vehicles</h1>
        <button className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800">
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4"
      >
        {vehicles.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
            <div className="flex items-center gap-4">
              {getStatusIcon(item.status)}
              <div>
                <h2 className="font-semibold text-zinc-900">{item.name}</h2>
                <p className="text-sm text-zinc-500">Last used: {item.lastUsed}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              item.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
              item.status === 'in-use' ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {item.status}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
