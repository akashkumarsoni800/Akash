import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Package, Plus, Trash2, ShoppingCart, 
 TrendingUp, Archive, Activity, ShieldCheck, 
 Zap, Info, Star, ChevronRight, Layout, RefreshCw,
 Box, Search, Filter, AlertTriangle
} from 'lucide-react';

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

 if (loading && items.length === 0) {
  return (
   <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
     <div className="relative">
      <RefreshCw size={60} className="animate-spin text-amber-600/20"/>
      <Box size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-600" />
     </div>
     <p className="font-black  text-slate-400 text-[10px] mt-8 text-center px-10">Initializing Logistics List...</p>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
   <div className="max-w-full mx-auto space-y-12">
    
    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Logistics<br/>
        <span className="text-amber-500">Command</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center justify-center md:justify-start gap-2">
        <ShieldCheck size={12} className="text-amber-500" /> Paid School Asset Tracking Suite v4.2
       </p>
      </motion.div>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
       <div className="bg-white px-8 py-5 rounded-[5px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
         <div className="w-12 h-12 bg-amber-50 rounded-[5px] flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform shadow-inner">
          <Archive size={22} />
         </div>
         <div className="pr-2">
          <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none mb-1">Stock Portfolio</p>
          <p className="text-xl font-black text-slate-900 leading-none">{items.length} Units</p>
         </div>
       </div>
       <button 
        onClick={() => setShowAddModal(true)}
        className="premium-button-admin !bg-slate-900 hover:!bg-amber-600"
       >
        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> Authorize Acquisition
       </button>
      </div>
    </div>

    {/* --- ANALYTICS TIERS --- */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-10 relative overflow-hidden group">
       <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 opacity-20 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-110"></div>
       <p className="text-[9px] font-black text-slate-300  mb-10">School Valuation</p>
       <div className="space-y-2">
         <p className="text-5xl font-black text-slate-900 leading-none">₹ {items.reduce((sum, item) => sum + Number(item.total_value), 0).toLocaleString()}</p>
         <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-[8px] font-black text-slate-400 tracking-widest">Asset Capital Locked</p>
         </div>
       </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-card !bg-amber-600 !border-amber-500 p-10 shadow-2xl shadow-amber-100 relative overflow-hidden group">
       <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mb-32 transition-transform group-hover:scale-110"></div>
       <p className="text-[9px] font-black text-amber-200  mb-10">Projected Yield</p>
       <div className="space-y-2">
         <p className="text-5xl font-black text-white leading-none">₹ {items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0).toLocaleString()}</p>
         <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-white/40" />
          <p className="text-[8px] font-black text-white/40 tracking-widest">Market Value Potential</p>
         </div>
       </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card p-10 flex flex-col justify-between group">
       <div className="flex justify-between items-start">
         <h3 className="text-[10px] font-black text-slate-300  uppercase">Critical Status</h3>
         <div className="w-10 h-10 bg-rose-50 rounded-[5px] flex items-center justify-center text-rose-500 shadow-inner">
          <AlertTriangle size={20} />
         </div>
       </div>
       <div className="space-y-4">
         <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 ">{items.filter(i => i.quantity < 5).length}</span>
          <span className="text-[10px] font-black text-rose-400 tracking-widest">SKUs At Risk</span>
         </div>
         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-rose-500 h-full transition-all duration-1000" 
            style={{ width: `${(items.filter(i => i.quantity < 5).length / (items.length || 1)) * 100}%` }}
          />
         </div>
       </div>
      </motion.div>
    </div>

    {/* --- INVENTORY MASTER TABLE --- */}
    <motion.div 
     initial={{ opacity: 0, y: 40 }} 
     animate={{ opacity: 1, y: 0 }} 
     className="premium-card overflow-hidden relative group"
    >
      <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-20" />
      
      <div className="p-10 md:p-14 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/20">
       <div className="space-y-3 text-center md:text-left">
         <h2 className="text-3xl font-black text-slate-900  leading-none uppercase">Asset<br/><span className="text-amber-600 uppercase">List</span></h2>
         <p className="text-[9px] font-black text-slate-400  leading-none">Logistics Oversight </p>
       </div>
       <div className="flex flex-wrap justify-center gap-3">
         <div className="bg-white border border-slate-100 px-6 py-3 rounded-[5px] flex items-center gap-3 shadow-inner">
          <Search size={16} className="text-slate-300" />
          <input type="text" placeholder="SKU Search..." className="bg-transparent border-none focus:ring-0 text-[10px] font-black text-slate-900 tracking-widest w-32 placeholder:text-slate-200" />
         </div>
       </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
       <table className="w-full text-left">
        <thead>
         <tr className="text-[10px] font-black text-slate-300  bg-slate-50/50">
          <th className="px-12 py-8">Nomenclature & Identity</th>
          <th className="px-12 py-8 text-center">Logistics Group</th>
          <th className="px-12 py-8 text-center">Available Volume</th>
          <th className="px-12 py-8 text-center">Unit Valuation</th>
          <th className="px-12 py-8 text-right">Directives</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
         {items.map((item, idx) => (
          <tr key={item.id} className="hover:bg-slate-50/80 transition-all group/row">
           <td className="px-12 py-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-[5px] flex items-center justify-center font-black text-slate-200 border border-slate-100 shadow-inner group-hover/row:border-amber-200 group-hover/row:text-amber-600 text-xl transition-colors">
               {item.item_name ? item.item_name.charAt(0) : 'A'}
              </div>
              <div>
               <p className="font-black text-slate-900 text-sm tracking-tight">{item.item_name}</p>
               <p className="text-[8px] font-black text-slate-400 tracking-widest mt-1">ASM SKU INDEX: 00{idx + 1}</p>
              </div>
            </div>
           </td>
           <td className="px-12 py-8 text-center">
            <span className="bg-white px-5 py-2 rounded-[5px] text-[9px] font-black text-slate-400 tracking-widest border border-slate-100 group-hover/row:border-amber-100 group-hover/row:text-amber-600 transition-all ">
             {item.category}
            </span>
           </td>
           <td className="px-12 py-8 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
               <span className={`text-2xl font-black  ${item.quantity < 5 ? 'text-rose-500' : 'text-slate-900 group-hover/row:text-amber-600'}`}>{item.quantity}</span>
               <span className="text-[9px] font-black text-slate-300 tracking-widest">Units</span>
              </div>
              {item.quantity < 5 && (
               <div className="inline-flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 animate-pulse">
                 <div className="w-1 h-1 bg-rose-500 rounded-full" />
                 <p className="text-[8px] font-black text-rose-500 ">Depleting</p>
               </div>
              )}
            </div>
           </td>
           <td className="px-12 py-8 text-center">
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-900 ">₹{item.selling_price.toLocaleString()}</p>
              <p className="text-[8px] font-black text-slate-400 tracking-widest group-hover/row:text-amber-500 transition-colors">Market Rate</p>
            </div>
           </td>
           <td className="px-12 py-8 text-right">
            <button onClick={() => deleteItem(item.id)} className="inline-flex w-12 h-12 bg-slate-50 text-slate-200 rounded-[5px] items-center justify-center hover:bg-rose-600 hover:text-white transition-all hover:shadow-2xl active:scale-95 group/btn">
             <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
            </button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
      {items.length === 0 && (
       <div className="py-40 flex flex-col items-center justify-center opacity-20 bg-slate-50 text-center space-y-8">
        <Archive size={100} className="text-slate-300 mx-auto" />
        <div className="space-y-2">
         <p className="font-black text-3xl text-slate-900 leading-none">Vault Empty</p>
         <p className="font-black text-[10px] text-slate-400">No assets detected on current frequency.</p>
        </div>
       </div>
      )}
    </motion.div>

    {/* --- FOOTER DECOR --- */}
    <div className="pt-12 text-center">
      <div className="inline-flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-sm opacity-50 transition-opacity hover:opacity-100 group cursor-default">
       <ShieldCheck size={14} className="text-amber-500" />
       <p className="text-[9px] font-black text-slate-400 tracking-widest">School Standard ASM v3.0 Paid Logistics</p>
      </div>
    </div>

   </div>

   {/* --- ADD ITEM MODAL --- */}
   <AnimatePresence>
    {showAddModal && (
     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 40 }} 
        className="bg-white border border-slate-100 w-full max-w-xl p-12 md:p-16 rounded-[5px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-500 to-orange-600"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="flex items-center gap-6 mb-12 relative z-10 border-b border-slate-50 pb-8">
         <div className="w-14 h-14 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-600 shadow-inner">
           <Plus size={30} />
         </div>
         <h2 className="text-4xl font-black text-slate-900  leading-none uppercase">Asset<br/><span className="text-amber-600 uppercase">Acquisition</span></h2>
        </div>
        
        <form onSubmit={handleAddItem} className="space-y-10 relative z-10">
         <InputField 
          label="Nomenclature & Strategic ID *" 
          placeholder="Ex: Advanced Calculus Textbook" 
          required 
          icon={Layout}
          onChange={(e: any) => setNewItem({...newItem, item_name: e.target.value})} 
         />
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div className="space-y-2 group">
           <label className="text-[10px] font-black text-slate-400  ml-2 transition-colors group-focus-within:text-amber-500">Logistics Classification</label>
           <select className="premium-input bg-slate-50 border-none rounded-[5px] font-black text-[10px] outline-none focus:ring-4 focus:ring-amber-100 focus:bg-white transition-all appearance-none cursor-pointer" 
            onChange={e => setNewItem({...newItem, category: e.target.value})}>
            <option value="Books">Educational Assets</option>
            <option value="Uniform">Apparel Units</option>
            <option value="Stationery">Strategic Supplies</option>
            <option value="Others">General Utility</option>
           </select>
          </div>
          <InputField 
           label="Initial Volume *" 
           type="number" 
           placeholder="000" 
           required 
           icon={Box}
           onChange={(e: any) => setNewItem({...newItem, quantity: Number(e.target.value)})} 
          />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <InputField 
           label="Acquisition Valuation *" 
           type="number" 
           placeholder="0.00" 
           required 
           icon={ShoppingCart}
           prefix="INR"
           onChange={(e: any) => setNewItem({...newItem, cost_price: Number(e.target.value)})} 
          />
          <InputField 
           label="Market Listing Rate *" 
           type="number" 
           placeholder="0.00" 
           required 
           icon={TrendingUp}
           prefix="INR"
           accent="amber"
           onChange={(e: any) => setNewItem({...newItem, selling_price: Number(e.target.value)})} 
          />
         </div>

         <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-slate-50">
          <button type="submit" disabled={loading} className="premium-button-admin flex-1 bg-slate-900 text-white hover:bg-amber-600 border-none shadow-2xl">
           {loading ? <RefreshCw className="animate-spin" size={20} /> : <><ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" /> Authorize Entry</>}
          </button>
          <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-6 rounded-[5px] font-black  text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">Abort Protocol</button>
         </div>
        </form>
      </motion.div>
     </div>
    )}
   </AnimatePresence>
  </div>
 );
};

const InputField = ({ label, icon: Icon, prefix, accent, ...props }: any) => (
 <div className="space-y-1 group">
  <label className={`block text-[9px] font-black text-slate-400  ml-2 transition-colors ${accent === 'amber' ? 'group-focus-within:text-amber-500' : 'group-focus-within:text-slate-900'}`}>{label}</label>
  <div className="relative">
   {Icon && <Icon className={`absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${accent === 'amber' ? 'group-focus-within/input:text-amber-400' : 'group-focus-within/input:text-slate-400'}`} size={18} />}
   {prefix && <span className={`absolute ${Icon ? 'left-16' : 'left-8'} top-1/2 -translate-y-1/2 font-black text-[9px] tracking-widest ${accent === 'amber' ? 'text-amber-300' : 'text-slate-300'}`}>{prefix}</span>}
   <input className="premium-input" style={{ paddingLeft: Icon ? (prefix ? '6rem' : '4rem') : (prefix ? '4rem' : '2rem') }} {...props} />
  </div>
 </div>
);

export default ManageInventory;
