import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, Search, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PRODUCTS, cn } from '../utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Sale } from '../db';
import { createWorker } from 'tesseract.js';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit?: Sale | null;
}

export function AddSaleModal({ isOpen, onClose, saleToEdit }: AddSaleModalProps) {
  const { addSale, updateSale } = useStore();
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
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

  useEffect(() => {
    if (isOpen) {
      if (saleToEdit) {
        setFormData({
          date: saleToEdit.date,
          productName: saleToEdit.productName,
          quantity: saleToEdit.quantity,
          price: saleToEdit.price,
          billId: saleToEdit.billId || '',
          billNumber: saleToEdit.billNumber || '',
          customerNumber: saleToEdit.customerNumber || '',
        });
        setProductSearch(saleToEdit.productName);
        if (saleToEdit.billImage) {
          setBillImage(saleToEdit.billImage);
          setImagePreview(URL.createObjectURL(saleToEdit.billImage));
        } else {
          setBillImage(null);
          setImagePreview(null);
        }
      } else {
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          productName: '',
          quantity: 1,
          price: undefined,
          billId: '',
          billNumber: '',
          customerNumber: '',
        });
        setProductSearch('');
        setBillImage(null);
        setImagePreview(null);
      }
    }
  }, [isOpen, saleToEdit]);

  const filteredProducts = PRODUCTS.filter(p => p.toLowerCase().includes(productSearch.toLowerCase()));

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
      timestamp: saleToEdit ? saleToEdit.timestamp : Date.now(),
      billImage: billImage || undefined,
    };

    if (saleToEdit && saleToEdit.id) {
      await updateSale({ ...saleData, id: saleToEdit.id });
      toast.success('Sale updated successfully');
    } else {
      await addSale(saleData);
      toast.success('Sale added successfully');
    }
    onClose();
  };

  const handleTextExtraction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    toast.loading('Extracting text...', { id: 'extract' });

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      const text = ret.data.text.toLowerCase();
      
      // Try to find a matching product from the list
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full sm:w-[500px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">{saleToEdit ? 'Edit Sale' : 'Add New Sale'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
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
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 pb-safe">
          <button type="submit" form="sale-form" className="glass-button w-full shine-text !text-white">
            {saleToEdit ? 'Update Sale' : 'Save Sale Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
