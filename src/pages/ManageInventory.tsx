import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Trash2, ShoppingCart, TrendingUp, Archive, Activity } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                Global<br/>
                <span className="text-amber-500">Inventory</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center gap-2">
                <Activity size={12} className="text-amber-500" /> Logistics Hub & Asset Tracking Suite
              </p>
           </motion.div>
           
           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-slate-900 shadow-xl shadow-slate-200 text-white px-10 py-5 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95"
           >
             <Plus size={18} /> Authorize New Acquisition
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all mb-8">
              <Archive size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Portfolio</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{items.length} Units</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 opacity-20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-8 font-black text-xl">₹</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Valuation</p>
            <h2 className="text-4xl font-black text-amber-600 tracking-tighter">₹ {items.reduce((sum, item) => sum + Number(item.total_value), 0).toLocaleString()}</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500 opacity-10 blur-3xl"></div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-8">
              <TrendingUp size={24} />
            </div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Yield Projection</p>
            <h2 className="text-4xl font-black text-white tracking-tighter italic">₹ {items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0).toLocaleString()}</h2>
          </motion.div>
        </div>

        {/* Inventory Master List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-[3rem] p-0 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4">
              <Package size={20} className="text-amber-500" /> Logistics Master Manifest
            </h3>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Cloud Sync</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50/50">
                  <th className="px-10 py-6">Asset Nomenclature</th>
                  <th className="px-10 py-6">Logistics Group</th>
                  <th className="px-10 py-6">Available Stock</th>
                  <th className="px-10 py-6">Market Valuation</th>
                  <th className="px-10 py-6 text-right">System Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-8 font-black text-slate-900 tracking-tighter uppercase text-lg group-hover:text-amber-600 transition-colors">{item.item_name}</td>
                    <td className="px-10 py-8">
                      <span className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-white transition-colors">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3">
                         <span className={`text-xl font-black tracking-tighter ${item.quantity < 5 ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity} units</span>
                         {item.quantity < 5 && <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse border border-rose-100">CRITICAL LOW</span>}
                       </div>
                    </td>
                    <td className="px-10 py-8 font-black text-slate-800 tracking-tighter text-lg italic">₹{item.selling_price.toLocaleString()}</td>
                    <td className="px-10 py-8 text-right">
                       <button onClick={() => deleteItem(item.id)} className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all hover:shadow-lg hover:shadow-rose-100">
                         <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center opacity-20 bg-slate-50/20">
              <Archive size={80} className="text-slate-400" />
              <p className="mt-6 font-black uppercase text-[12px] tracking-[0.4em] text-slate-400 italic">Inventory Vault Empty</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modern Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white border border-slate-100 w-full max-w-xl p-12 md:p-16 rounded-[3.5rem] relative shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 opacity-20 rounded-full -mr-32 -mt-32"></div>
               
               <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-12 relative z-10">Asset Acquisition<br/><span className="text-amber-500">Protocol</span></h2>
               
               <form onSubmit={handleAddItem} className="space-y-10 relative z-10">
                 <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nomenclature</label>
                   <input type="text" placeholder="Strategic Item ID..." required className="premium-input w-full p-6 text-sm bg-slate-50 border-slate-100 focus:bg-white transition-all" 
                     onChange={e => setNewItem({...newItem, item_name: e.target.value})} />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Logistics Class</label>
                      <select className="premium-input w-full p-6 text-[10px] uppercase font-black bg-slate-50 border-slate-100" 
                        onChange={e => setNewItem({...newItem, category: e.target.value})}>
                        <option value="Books">Educational Assets</option>
                        <option value="Uniform">Apparel Units</option>
                        <option value="Stationery">Strategic Supplies</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Volume Count</label>
                      <input type="number" placeholder="Quantity..." required className="premium-input w-full p-6 text-sm font-black bg-slate-50 border-slate-100" 
                        onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Cost Valuation</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">INR</span>
                        <input type="number" placeholder="Value..." required className="premium-input w-full p-6 pl-16 text-sm font-black bg-slate-50 border-slate-100" 
                          onChange={e => setNewItem({...newItem, cost_price: Number(e.target.value)})} />
                     </div>
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 italic">Market Listing</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-300 font-bold text-xs uppercase">INR</span>
                        <input type="number" placeholder="Rate..." required className="premium-input w-full p-6 pl-16 text-sm font-black bg-amber-50/30 border-amber-100 text-amber-600" 
                          onChange={e => setNewItem({...newItem, selling_price: Number(e.target.value)})} />
                     </div>
                   </div>
                 </div>

                 <div className="flex gap-6 pt-8">
                   <button type="submit" className="flex-1 bg-slate-900 text-white py-6 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-amber-600 transition-all shadow-xl active:scale-95">Authorize Entry</button>
                   <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-6 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[9px] text-slate-400 hover:bg-slate-50 transition-all">Abort</button>
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
