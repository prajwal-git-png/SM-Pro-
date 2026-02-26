import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Moon, Sun, Save, Download, Upload, FileText, LogOut, Camera, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbPromise } from '../db';
import { format } from 'date-fns';

export function Settings() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState(settings || {
    userName: '',
    empId: '',
    storeName: '',
    storeLocation: '',
    theme: 'dark' as 'dark' | 'light',
    brandWebsite: '',
    demoLink: '',
    tollFree: '',
    aiApiKey: '',
    isLoggedIn: false,
    brandTarget: 500000,
    profilePhoto: '',
    storeLat: undefined as number | undefined,
    storeLng: undefined as number | undefined,
  });
  const [reportStartDate, setReportStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [reportEndDate, setReportEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (!settings) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapLocation = () => {
    if ('geolocation' in navigator) {
      toast.loading('Getting location...', { id: 'location' });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const updatedData = { ...formData, storeLat: latitude, storeLng: longitude };
          setFormData(updatedData);
          
          // Auto-save location to ensure persistence
          await updateSettings({ storeLat: latitude, storeLng: longitude });
          
          toast.success('Location mapped and saved successfully!', { id: 'location', duration: 4000 });
        },
        (error) => {
          console.error(error);
          toast.error('Failed to get location. Please enable GPS.', { id: 'location' });
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleSave = async () => {
    if (formData.aiApiKey && !formData.aiApiKey.startsWith('AIza')) {
      toast.error('Invalid Gemini API Key format. It should start with "AIza".');
      return;
    }
    await updateSettings(formData);
    toast.success('Settings saved successfully!');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await updateSettings({ isLoggedIn: false });
      toast.success('Logged out successfully');
    }
  };

  const toggleTheme = async () => {
    const newTheme = formData.theme === 'dark' ? 'light' : 'dark';
    setFormData({ ...formData, theme: newTheme });
    await updateSettings({ theme: newTheme });
  };

  const handleExport = async () => {
    try {
      const db = await dbPromise;
      const sales = await db.getAll('sales');
      const attendance = await db.getAll('attendance');
      const targets = await db.getAll('targets');
      const crm = await db.getAll('crm');
      const settingsData = await db.getAll('settings');

      // Convert Blobs to base64 for JSON export
      const salesWithBase64 = await Promise.all(sales.map(async (sale) => {
        if (sale.billImage) {
          const buffer = await sale.billImage.arrayBuffer();
          const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
          return { ...sale, billImageBase64: base64, billImageType: sale.billImage.type };
        }
        return sale;
      }));

      const exportData = {
        sales: salesWithBase64,
        attendance,
        targets,
        crm,
        settings: settingsData,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `sales_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const db = await dbPromise;

        // Clear existing data (optional, or just overwrite/append)
        await db.clear('sales');
        await db.clear('attendance');
        await db.clear('targets');
        await db.clear('crm');
        await db.clear('settings');

        // Restore data
        if (data.settings) {
          for (const s of data.settings) await db.put('settings', s);
        }
        if (data.attendance) {
          for (const a of data.attendance) await db.put('attendance', a);
        }
        if (data.targets) {
          for (const t of data.targets) await db.put('targets', t);
        }
        if (data.crm) {
          for (const c of data.crm) await db.put('crm', c);
        }
        if (data.sales) {
          for (const s of data.sales) {
            const saleToSave = { ...s };
            if (s.billImageBase64) {
              const byteCharacters = atob(s.billImageBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              saleToSave.billImage = new Blob([byteArray], { type: s.billImageType || 'image/jpeg' });
              delete saleToSave.billImageBase64;
              delete saleToSave.billImageType;
            }
            await db.put('sales', saleToSave);
          }
        }
        
        toast.success('Data imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const generateReport = async () => {
    try {
      const db = await dbPromise;
      const allSales = await db.getAll('sales');
      
      const filteredSales = allSales.filter(s => s.date >= reportStartDate && s.date <= reportEndDate);
      
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Monthly Sales Report', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Name: ${settings.userName}`, 14, 32);
      doc.text(`Store: ${settings.storeLocation}`, 14, 40);
      doc.text(`Period: ${reportStartDate} to ${reportEndDate}`, 14, 48);

      let yPos = 60;
      doc.setFontSize(10);
      doc.text('Date', 14, yPos);
      doc.text('Product', 45, yPos);
      doc.text('Qty', 150, yPos);
      doc.text('Price', 170, yPos);
      
      yPos += 5;
      doc.line(14, yPos, 196, yPos);
      yPos += 10;

      let totalValue = 0;
      let totalQty = 0;

      filteredSales.forEach(sale => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(sale.date, 14, yPos);
        const productName = sale.productName.length > 40 ? sale.productName.substring(0, 40) + '...' : sale.productName;
        doc.text(productName, 45, yPos);
        doc.text(sale.quantity.toString(), 150, yPos);
        doc.text(sale.price.toString(), 170, yPos);
        
        totalValue += (sale.price * sale.quantity);
        totalQty += sale.quantity;
        yPos += 10;
      });

      yPos += 5;
      doc.line(14, yPos, 196, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Total Quantity: ${totalQty}`, 14, yPos);
      doc.text(`Total Value: ${totalValue}`, 100, yPos);

      doc.save(`Sales_Report_${reportStartDate}_to_${reportEndDate}.pdf`);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to generate report.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full glass-panel hover:bg-slate-900/10 dark:hover:bg-white/20 transition-colors"
        >
          {formData.theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Profile</h2>
        
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg">
              {formData.profilePhoto ? (
                <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors">
              <Upload className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">User Name</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Employee ID</label>
            <input
              type="text"
              name="empId"
              value={formData.empId || ''}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName || ''}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Store Location</label>
            <input
              type="text"
              name="storeLocation"
              value={formData.storeLocation}
              onChange={handleChange}
              className="glass-input w-full mb-2"
            />
            <button 
              onClick={handleMapLocation}
              className="w-full py-2 rounded-xl border border-blue-500/50 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <MapPin className="w-4 h-4" /> 
              {formData.storeLat && formData.storeLng ? 'Update Mapped Location' : 'Map Current Location'}
            </button>
            {formData.storeLat && formData.storeLng && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-emerald-500 text-center">
                  Location mapped: {formData.storeLat.toFixed(4)}, {formData.storeLng.toFixed(4)}
                </p>
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                  <iframe
                    title="Store Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.storeLng - 0.005},${formData.storeLat - 0.005},${formData.storeLng + 0.005},${formData.storeLat + 0.005}&layer=mapnik&marker=${formData.storeLat},${formData.storeLng}`}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Monthly Brand Target</label>
            <input
              type="number"
              name="brandTarget"
              value={formData.brandTarget || ''}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold border-b border-white/10 pb-2 mt-8">Brand Links & API</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Brand Website Link</label>
            <input
              type="url"
              name="brandWebsite"
              value={formData.brandWebsite}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Installation Demo Link</label>
            <input
              type="url"
              name="demoLink"
              value={formData.demoLink}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Toll-Free Number</label>
            <input
              type="tel"
              name="tollFree"
              value={formData.tollFree}
              onChange={handleChange}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">AI Assistant API Key (Gemini)</label>
            <input
              type="password"
              name="aiApiKey"
              value={formData.aiApiKey}
              onChange={handleChange}
              className="glass-input w-full"
              placeholder="Enter API Key for CRM Chatbot"
            />
          </div>
        </div>

        <button onClick={handleSave} className="glass-button w-full flex items-center justify-center gap-2 mt-6">
          <Save className="w-5 h-5" /> Save Settings
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Data Management</h2>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleExport} className="glass-button flex items-center justify-center gap-2 bg-blue-500/80 hover:bg-blue-500">
            <Download className="w-5 h-5" /> Export Data
          </button>
          <label className="glass-button flex items-center justify-center gap-2 bg-purple-500/80 hover:bg-purple-500 cursor-pointer">
            <Upload className="w-5 h-5" /> Import Data
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Monthly Report</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Start Date</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">End Date</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="glass-input w-full"
            />
          </div>
        </div>
        <button onClick={generateReport} className="glass-button w-full flex items-center justify-center gap-2 bg-orange-500/80 hover:bg-orange-500">
          <FileText className="w-5 h-5" /> Generate PDF Report
        </button>
      </div>

      <div className="glass-panel p-4 rounded-2xl space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2 text-red-500">Danger Zone</h2>
        <button onClick={handleLogout} className="glass-button w-full flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 py-2">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}

