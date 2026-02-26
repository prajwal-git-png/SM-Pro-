import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Upload, Search, FileText, X, History, Eye, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PRODUCTS } from '../utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Sale } from '../db';

export function NewEntry() {
  const { addSale, sales, loadSales } = useStore();
  const navigate = useNavigate();
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const recentSales = sales.slice(0, 5);

  const handleViewBill = (sale: Sale) => {
    if (sale.billImage) {
      const url = URL.createObjectURL(sale.billImage);
      window.open(url, '_blank');
    }
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
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    productName: '',
    quantity: 1,
    price: undefined as number | undefined,
    billId: '',
    billNumber: '',
    customerNumber: '',
  });
  
  const [billImage, setBillImage] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const filteredProducts = useMemo(() => 
    PRODUCTS.filter(p => p.toLowerCase().includes(productSearch.toLowerCase())),
  [productSearch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName) {
      toast.error('Please select a product');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter a valid price greater than 0');
      return;
    }
    if (formData.quantity <= 0) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const saleData = {
      ...formData,
      price: formData.price || 0,
      timestamp: Date.now(),
      billImage: billImage || undefined,
    };

    await addSale(saleData);
    toast.success('Sale added successfully');
    navigate('/');
  };

  const handleTextExtraction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    toast.loading('Extracting text...', { id: 'extract' });

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      const text = ret.data.text.toLowerCase();
      
      let matchedProduct = '';
      for (const product of PRODUCTS) {
        if (text.includes(product.toLowerCase())) {
          matchedProduct = product;
          break;
        }
      }

      if (matchedProduct) {
        setProductSearch(matchedProduct);
        setFormData(prev => ({ ...prev, productName: matchedProduct }));
        toast.success(`Found: ${matchedProduct}`, { id: 'extract' });
      } else {
        toast.error('No matching product found in image.', { id: 'extract' });
      }
      
      await worker.terminate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to extract text.', { id: 'extract' });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">New Entry</h1>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <form id="sale-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="glass-input w-full !bg-slate-100 dark:!bg-slate-800 !border-none"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Product</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setFormData({ ...formData, productName: e.target.value });
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="glass-input w-full pl-10 !bg-slate-100 dark:!bg-slate-800 !border-none"
                  placeholder="Search product..."
                  required
                />
              </div>
              <label className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}>
                <FileText className="w-6 h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleTextExtraction} disabled={isExtracting} />
              </label>
            </div>

            {showDropdown && productSearch && (
              <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                {filteredProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
                    onClick={() => {
                      setProductSearch(product);
                      setFormData({ ...formData, productName: product });
                      setShowDropdown(false);
                    }}
                  >
                    {product}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, quantity: isNaN(val) ? 1 : Math.max(1, val) });
                }}
                className="glass-input w-full !bg-slate-100 dark:!bg-slate-800 !border-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter price"
                value={formData.price ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, price: val });
                }}
                className="glass-input w-full !bg-slate-100 dark:!bg-slate-800 !border-none"
                required
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-medium">Bill Details (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Bill ID</label>
                <input
                  type="text"
                  value={formData.billId}
                  onChange={(e) => setFormData({ ...formData, billId: e.target.value })}
                  className="glass-input w-full !py-2 !text-sm !bg-slate-100 dark:!bg-slate-800 !border-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Bill Number</label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  className="glass-input w-full !py-2 !text-sm !bg-slate-100 dark:!bg-slate-800 !border-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-70">Customer Number</label>
              <input
                type="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Please enter exactly 10 digits"
                value={formData.customerNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) {
                    setFormData({ ...formData, customerNumber: val });
                  }
                }}
                className="glass-input w-full !py-2 !text-sm !bg-slate-100 dark:!bg-slate-800 !border-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 opacity-70">Bill Image (Original Size)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Upload className="w-6 h-6 mb-2 opacity-50" />
                  <span className="text-xs opacity-70">Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Camera className="w-6 h-6 mb-2 opacity-50" />
                  <span className="text-xs opacity-70">Take Photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {imagePreview && (
                <div className="mt-4 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={imagePreview} alt="Bill Preview" className="w-full h-auto max-h-48 object-contain bg-black/5" />
                  <button
                    type="button"
                    onClick={() => { setBillImage(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="submit" form="sale-form" className="glass-button w-full shine-text !text-white">
            Save Sale Entry
          </button>
        </div>
      </div>

      {/* Recent Entries Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="w-5 h-5 opacity-70" />
          <h2 className="text-xl font-bold">Recent Entries</h2>
        </div>
        
        <div className="space-y-3">
          {recentSales.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl text-center opacity-50">
              <p>No recent entries found.</p>
            </div>
          ) : (
            recentSales.map((sale) => (
              <div key={sale.id} className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold leading-tight">{sale.productName}</h3>
                    <p className="text-xs opacity-70 mt-1">{format(new Date(sale.date), 'MMM d, yyyy')} • Qty: {sale.quantity}</p>
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
                  <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-40">Bill Attached</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewBill(sale)} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10" title="View Bill">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownloadBill(sale)} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10" title="Download Bill">
                        <Download className="w-4 h-4" />
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
  );
}
