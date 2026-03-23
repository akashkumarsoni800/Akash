import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Trash2, ShoppingCart, TrendingUp, Archive } from 'lucide-react';

const ManageInventory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: 'Books',
    quantity: 0,
    cost_price: 0,
    selling_price: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const totalValue = newItem.quantity * newItem.cost_price;

    const { error } = await supabase.from('inventory').insert([{
      ...newItem,
      total_value: totalValue
    }]);

    if (!error) {
      toast.success("Item added to stock!");
      setShowAddModal(false);
      fetchInventory();
    } else {
      toast.error("Failed to add item");
    }
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) {
      toast.success("Item removed");
      fetchInventory();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase italic">📦 Inventory Management</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Stock, Sales & Records</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Add New Stock
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <Archive className="text-blue-500 mb-4" size={30} />
            <h3 className="text-gray-400 font-bold text-xs uppercase">Total Items</h3>
            <p className="text-3xl font-black">{items.length}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <TrendingUp className="text-green-500 mb-4" size={30} />
            <h3 className="text-gray-400 font-bold text-xs uppercase">Stock Value (Cost)</h3>
            <p className="text-3xl font-black text-green-600">
              ₹{items.reduce((sum, item) => sum + Number(item.total_value), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <ShoppingCart className="text-purple-500 mb-4" size={30} />
            <h3 className="text-gray-400 font-bold text-xs uppercase">Potential Revenue</h3>
            <p className="text-3xl font-black text-purple-600">
              ₹{items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Inventory Table */}
        
        <div className="bg-transparent md:bg-white md:rounded-[2.5rem] md:shadow-xl md:border md:border-gray-100 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-6">Item Name</th>
                  <th className="p-6">Category</th>
                  <th className="p-6 text-center">In Stock</th>
                  <th className="p-6">Selling Price</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-all group">
                    <td className="p-6 font-black text-gray-800 uppercase">{item.item_name}</td>
                    <td className="p-6">
                      <span className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-gray-500">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`font-black text-lg ${item.quantity < 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-6 font-bold text-indigo-600">₹{item.selling_price}</td>
                    <td className="p-6 text-right">
                      <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-8">
                    <h3 className="font-black text-gray-800 uppercase text-lg leading-tight">{item.item_name}</h3>
                    <span className="bg-gray-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-gray-500 mt-2 inline-block">
                      {item.category}
                    </span>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-xl">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                  <div>
                    <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">In Stock</span>
                    <span className={`font-black text-2xl ${item.quantity < 5 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>{item.quantity}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Selling Price</span>
                    <span className="font-black text-2xl text-emerald-600">₹{item.selling_price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && <p className="p-10 md:p-20 text-center text-gray-400 font-bold italic bg-white rounded-[2rem]">No items in inventory.</p>}
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl">
              <h2 className="text-3xl font-black text-gray-900 uppercase italic mb-8">Add Stock</h2>
              <form onSubmit={handleAddItem} className="space-y-4">
                <input type="text" placeholder="Item Name (e.g. Math Book Class 10)" required className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" 
                  onChange={e => setNewItem({...newItem, item_name: e.target.value})} />
                
                <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold uppercase text-sm" 
                  onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  <option value="Books">Books</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Stationery">Stationery</option>
                </select>

                <div className="grid grid-cols-3 gap-4">
                  <input type="number" placeholder="Qty" className="p-4 bg-gray-50 border-none rounded-2xl font-bold" 
                    onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                  <input type="number" placeholder="Cost" className="p-4 bg-gray-50 border-none rounded-2xl font-bold" 
                    onChange={e => setNewItem({...newItem, cost_price: Number(e.target.value)})} />
                  <input type="number" placeholder="Sell" className="p-4 bg-gray-50 border-none rounded-2xl font-bold" 
                    onChange={e => setNewItem({...newItem, selling_price: Number(e.target.value)})} />
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Save Item</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageInventory;
