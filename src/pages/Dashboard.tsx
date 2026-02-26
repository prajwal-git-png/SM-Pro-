import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Share2, Calendar as CalendarIcon, Edit2, Trash2, Image as ImageIcon, Download, Eye, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { AddSaleModal } from '../components/AddSaleModal';
import { Sale } from '../db';
import toast from 'react-hot-toast';

export function Dashboard() {
  const { settings, sales, loadSales, deleteSale } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate MTD Sales
  const mtdSales = useMemo(() => {
    return sales.filter(s => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd;
    });
  }, [sales, monthStart, monthEnd]);

  const mtdValue = mtdSales.reduce((sum, s) => sum + (s.price * s.quantity), 0);

  // Calculate Selected Date Sales
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todaysSales = sales.filter(s => s.date === selectedDateStr);
  const todayValue = todaysSales.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const todayQty = todaysSales.reduce((sum, s) => sum + s.quantity, 0);

  const handleEdit = (sale: Sale) => {
    setSaleToEdit(sale);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      await deleteSale(id);
      toast.success('Sale deleted');
    }
  };

  const handleShare = () => {
    if (!settings) return;

    // Calculate specific quantities
    const getQty = (keywords: string[]) => {
      return todaysSales.filter(s => keywords.some(k => s.productName.toLowerCase().includes(k.toLowerCase())))
        .reduce((sum, s) => sum + s.quantity, 0);
    };

    const bajajMixerQty = getQty(['bajaj mixer', 'bajaj mg']);
    const morphyMixerQty = getQty(['mr tresta', 'mr tetragrind', 'mr grindpro']);
    const storageGeyserQty = getQty(['storage geyser', 'water heater']);
    const instantGeyserQty = getQty(['instant geyser']);
    const airFryerQty = getQty(['air fryer']);
    const otg60Qty = getQty(['otg 60']);
    const otg29Qty = getQty(['otg 29']);
    const mws20Qty = getQty(['20mws', '20ms']);
    const steamIronQty = getQty(['steam iron']);
    const dryIronQty = getQty(['dry iron']);
    const inductionQty = getQty(['induction']);
    const sandwichMakerQty = getQty(['sandwich maker']);
    const collarQty = getQty(['collar']); // Assuming this is a specific product type

    const formatQty = (qty: number) => String(qty).padStart(2, '0');

    const message = `Name:${settings.userName}
Date: ${format(new Date(), 'dd/MM/yyyy')}
Store Location :${settings.storeLocation}
Today’s Sale Value:= ${todayValue.toLocaleString('en-IN')}
Today’s Sale qty=${todayQty}
Bajaj Mixer Qty: =${formatQty(bajajMixerQty)}
Morphy Mixer Qty: =${formatQty(morphyMixerQty)}
Storage geyser Qty: ${formatQty(storageGeyserQty)}
Instant geyser Qty: ${formatQty(instantGeyserQty)}
MR Air fiyar=${formatQty(airFryerQty)}
MR. OTG 60ltr =${formatQty(otg60Qty)}
MR. OTG 29ltr = ${formatQty(otg29Qty)}
MR 20MWS = ${formatQty(mws20Qty)}
Bajaj  setma  iron =${formatQty(steamIronQty)}
Bajaj dry iron=${formatQty(dryIronQty)}
Bajaj induction${formatQty(inductionQty)}
Bajaj sandwich maker=${formatQty(sandwichMakerQty)}
Bajaj collar=${formatQty(collarQty)}
MTD Sale Value = ${mtdValue.toLocaleString('en-IN')}

I checked out sir ,,,,,`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleDownloadBill = (sale: Sale) => {
    if (sale.billImage) {
      const url = URL.createObjectURL(sale.billImage);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${sale.productName}_${sale.date}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleViewBill = (sale: Sale) => {
    if (sale.billImage) {
      const url = URL.createObjectURL(sale.billImage);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm opacity-70">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Progress UI */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm font-medium opacity-70">MTD Sales Value</p>
            <p className="text-3xl font-bold">₹{mtdValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium opacity-70">Brand Target</p>
            <p className="text-sm font-bold">₹{(settings?.brandTarget || 500000).toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              (mtdValue / (settings?.brandTarget || 500000)) >= 1 
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                : (mtdValue / (settings?.brandTarget || 500000)) >= 0.5
                ? 'bg-gradient-to-r from-blue-400 to-indigo-600'
                : 'bg-gradient-to-r from-orange-400 to-rose-600'
            }`}
            style={{ width: `${Math.min((mtdValue / (settings?.brandTarget || 500000)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> Calendar Heatmap
          </h2>
          <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium opacity-50 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for start of month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {daysInMonth.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const daySales = sales.filter(s => s.date === dateStr);
            const hasSales = daySales.length > 0;
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(day);
                  if (hasSales) {
                    setIsDayDetailsOpen(true);
                  }
                }}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? 'ring-2 ring-slate-800 dark:ring-white scale-110 z-10' : 'hover:scale-105'}
                  ${hasSales ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white' : 'bg-black/5 dark:bg-white/5'}
                `}
              >
                {format(day, 'd')}
                {hasSales && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Sales List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Sales on {format(selectedDate, 'MMM d')}</h2>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-full"
          >
            <Share2 className="w-4 h-4" /> Share Report
          </button>
        </div>

        {todaysSales.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center opacity-50">
            <p>No sales recorded for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysSales.map((sale) => (
              <div key={sale.id} className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold leading-tight">{sale.productName}</h3>
                    <p className="text-xs opacity-70 mt-1">Qty: {sale.quantity} × ₹{sale.price}</p>
                    {(sale.billId || sale.billNumber) && (
                      <p className="text-[10px] opacity-50 mt-1">
                        {sale.billId && `ID: ${sale.billId}`} {sale.billNumber && `| No: ${sale.billNumber}`}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    ₹{(sale.quantity * sale.price).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="flex gap-2">
                    {sale.billImage && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                          <ImageIcon className="w-3 h-3" /> Bill Attached
                        </span>
                        <button onClick={() => handleViewBill(sale)} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300" title="View Bill">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDownloadBill(sale)} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300" title="Download Bill">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(sale)} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => sale.id && handleDelete(sale.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSaleModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSaleToEdit(null); }} 
        saleToEdit={saleToEdit}
      />

      {/* Day Details Modal */}
      {isDayDetailsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Sales on {format(selectedDate, 'MMM d, yyyy')}</h2>
              <button onClick={() => setIsDayDetailsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {todaysSales.length === 0 ? (
                <p className="text-center opacity-50 py-8">No sales recorded for this date.</p>
              ) : (
                todaysSales.map((sale) => (
                  <div key={sale.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold leading-tight">{sale.productName}</h3>
                        <p className="text-sm opacity-70 mt-1">Qty: {sale.quantity} × ₹{sale.price}</p>
                        {(sale.billId || sale.billNumber) && (
                          <p className="text-[10px] opacity-50 mt-1">
                            {sale.billId && `ID: ${sale.billId}`} {sale.billNumber && `| No: ${sale.billNumber}`}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        ₹{(sale.quantity * sale.price).toLocaleString()}
                      </p>
                    </div>
                    
                    {sale.billImage && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                          <ImageIcon className="w-3 h-3" /> Bill Attached
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => handleViewBill(sale)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button onClick={() => handleDownloadBill(sale)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

