import React, { useMemo, useState } from 'react';
import { Package, Plus, Trash2, ShoppingCart, Check, X, Search, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { Game, SupplyItem, ShoppingItem } from '../types';
import { playClick, playPop, playDelete } from '../services/sound';

interface SupplyInventoryProps {
  games: Game[];
  supplies: SupplyItem[];
  shoppingList: ShoppingItem[];
  onSaveSupplies: (items: SupplyItem[]) => void;
  onSaveShopping: (items: ShoppingItem[]) => void;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const SupplyInventory: React.FC<SupplyInventoryProps> = ({ games, supplies, shoppingList, onSaveSupplies, onSaveShopping }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [type, setType] = useState<'Reusable' | 'Consumable'>('Reusable');
  const [search, setSearch] = useState('');

  const addSupply = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    const qty = Math.max(0, Number(quantity) || 0);
    if (!clean || qty <= 0) return;
    const existing = supplies.find(s => normalize(s.name) === normalize(clean));
    if (existing) {
      onSaveSupplies(supplies.map(s => s.id === existing.id ? { ...s, quantity: s.quantity + qty, type, updatedAt: Date.now() } : s));
    } else {
      onSaveSupplies([{ id: crypto.randomUUID(), name: clean, quantity: qty, type, updatedAt: Date.now() }, ...supplies]);
    }
    setName(''); setQuantity('1'); playPop();
  };

  const updateQuantity = (id: string, delta: number) => {
    onSaveSupplies(supplies.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta), updatedAt: Date.now() } : s));
  };

  const removeSupply = (id: string) => {
    if (!confirm('Remove this item from your inventory?')) return;
    playDelete();
    onSaveSupplies(supplies.filter(s => s.id !== id));
  };

  const missingByGames = useMemo(() => {
    const inventory = new Map(supplies.map(s => [normalize(s.name), s.quantity]));
    const missing = new Map<string, number>();
    games.forEach(game => {
      const text = game.materials || '';
      if (!text.trim()) return;
      const lines = text.split(/\n|,|;|•/).map(x => x.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
      lines.forEach(line => {
        const match = line.match(/^(\d+(?:\.\d+)?)\s*(?:x|×)?\s+(.+)$/i);
        const requested = match ? Number(match[1]) : 1;
        const itemName = (match ? match[2] : line).replace(/\([^)]*\)/g, '').trim();
        if (!itemName || itemName.length > 60) return;
        const key = normalize(itemName);
        const have = inventory.get(key) || 0;
        if (have < requested) missing.set(itemName, Math.max(missing.get(itemName) || 0, requested - have));
      });
    });
    return [...missing.entries()].map(([name, quantity]) => ({ name, quantity }));
  }, [games, supplies]);

  const addMissing = (item: { name: string; quantity: number }) => {
    const existing = shoppingList.find(x => normalize(x.name) === normalize(item.name) && !x.purchased);
    if (existing) {
      onSaveShopping(shoppingList.map(x => x.id === existing.id ? { ...x, quantity: Math.max(x.quantity, item.quantity) } : x));
    } else {
      onSaveShopping([{ id: crypto.randomUUID(), name: item.name, quantity: item.quantity, purchased: false, createdAt: Date.now() }, ...shoppingList]);
    }
    playClick();
  };

  const filtered = supplies.filter(s => normalize(s.name).includes(normalize(search)));

  return (
    <section className="relative z-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20"><Package className="w-6 h-6" /></div>
            <div><h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Supplies</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep track of what you have and what you need.</p></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-5">
        <div className="glass-card rounded-[2rem] p-5 sm:p-6 border border-white/70 dark:border-white/10">
          <div className="flex items-center justify-between gap-3 mb-4"><h3 className="text-lg font-black text-slate-900 dark:text-white">Inventory</h3><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" className="w-32 sm:w-44 pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white" /></div></div>
          <form onSubmit={addSupply} className="grid grid-cols-12 gap-2 mb-5">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Cones" className="col-span-12 sm:col-span-5 px-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white" />
            <input value={quantity} onChange={e=>setQuantity(e.target.value)} type="number" min="1" placeholder="Qty" className="col-span-4 sm:col-span-2 px-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white" />
            <select value={type} onChange={e=>setType(e.target.value as 'Reusable'|'Consumable')} className="col-span-8 sm:col-span-3 px-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white"><option>Reusable</option><option>Consumable</option></select>
            <button className="col-span-12 sm:col-span-2 py-3 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-black font-bold text-sm"><Plus className="w-4 h-4 inline mr-1" />Add</button>
          </form>
          <div className="space-y-2">
            {filtered.map(item => <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="min-w-0 flex-1"><div className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.name}</div><div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{item.type}</div></div>
              <div className="flex items-center gap-1"><button onClick={()=>updateQuantity(item.id,-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><Minus className="w-3.5 h-3.5"/></button><span className="w-8 text-center font-black text-sm">{item.quantity}</span><button onClick={()=>updateQuantity(item.id,1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><Plus className="w-3.5 h-3.5"/></button></div>
              <button onClick={()=>removeSupply(item.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
            </div>)}
            {!filtered.length && <div className="py-10 text-center text-sm text-slate-400">No supplies yet. Add cones, balls, buckets, or anything else you keep around.</div>}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-card rounded-[2rem] p-5 border border-white/70 dark:border-white/10">
            <div className="flex items-center justify-between mb-3"><h3 className="font-black text-slate-900 dark:text-white">Smart Check</h3><span className="text-[10px] font-black uppercase text-orange-500">{missingByGames.length} missing</span></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Based on materials listed on your games.</p>
            {missingByGames.length ? <div className="space-y-2">{missingByGames.slice(0,8).map(item=><div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10"><div className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</div><span className="text-xs font-black text-orange-600 dark:text-orange-400">Need {item.quantity}</span><button onClick={()=>addMissing(item)} className="text-[10px] font-black px-2 py-1.5 rounded-lg bg-orange-500 text-white">+ List</button></div>)}</div> : <div className="py-6 text-center text-sm text-emerald-600 dark:text-emerald-400 font-bold">You're stocked up! ✓</div>}
          </div>

          <div className="glass-card rounded-[2rem] p-5 border border-white/70 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-orange-500"/><h3 className="font-black text-slate-900 dark:text-white">Shopping List</h3></div>
            <div className="space-y-2">
              {shoppingList.map(item=><div key={item.id} className={`flex items-center gap-2 p-3 rounded-xl border ${item.purchased ? 'opacity-50 bg-slate-100/50 dark:bg-white/5' : 'bg-white/50 dark:bg-white/5'}`}><button onClick={()=>onSaveShopping(shoppingList.map(x=>x.id===item.id?{...x,purchased:!x.purchased}:x))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10">{item.purchased?<Check className="w-4 h-4 text-emerald-500"/>:<span className="w-4 h-4 block border-2 border-slate-300 rounded"/>}</button><div className={`flex-1 text-sm font-bold ${item.purchased?'line-through text-slate-400':'text-slate-700 dark:text-slate-200'}`}>{item.quantity} × {item.name}</div><button onClick={()=>onSaveShopping(shoppingList.filter(x=>x.id!==item.id))} className="p-1.5 text-slate-300 hover:text-red-500"><X className="w-4 h-4"/></button></div>)}
              {!shoppingList.length && <div className="text-sm text-slate-400 text-center py-5">Nothing on your shopping list.</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default SupplyInventory;
