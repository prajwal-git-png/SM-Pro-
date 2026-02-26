import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Target as TargetIcon, Share2, Save, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

export function Target() {
  const { settings, targets, loadTargets, saveTarget } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const [formData, setFormData] = useState({
    dayTarget: undefined as number | undefined,
    dayAchievement: undefined as number | undefined,
    weekTarget: undefined as number | undefined,
    weekAchievement: undefined as number | undefined,
    eolTarget: undefined as number | undefined,
    eolAchieve: undefined as number | undefined,
  });

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  useEffect(() => {
    const targetForDate = targets.find(t => t.date === selectedDate);
    if (targetForDate) {
      setFormData({
        dayTarget: targetForDate.dayTarget,
        dayAchievement: targetForDate.dayAchievement,
        weekTarget: targetForDate.weekTarget,
        weekAchievement: targetForDate.weekAchievement,
        eolTarget: targetForDate.eolTarget,
        eolAchieve: targetForDate.eolAchieve,
      });
    } else {
      setFormData({
        dayTarget: undefined,
        dayAchievement: undefined,
        weekTarget: undefined,
        weekAchievement: undefined,
        eolTarget: undefined,
        eolAchieve: undefined,
      });
    }
  }, [selectedDate, targets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setFormData(prev => {
      const next = { ...prev, [name]: numValue };
      
      // Auto-calculate day target if week target is entered
      if (name === 'weekTarget' && numValue !== undefined) {
        next.dayTarget = Math.round(numValue / 7);
      }
      
      return next;
    });
  };

  const handleSave = async () => {
    await saveTarget({
      date: selectedDate,
      dayTarget: formData.dayTarget || 0,
      dayAchievement: formData.dayAchievement || 0,
      weekTarget: formData.weekTarget || 0,
      weekAchievement: formData.weekAchievement || 0,
      eolTarget: formData.eolTarget || 0,
      eolAchieve: formData.eolAchieve || 0,
    });
    toast.success('Target saved successfully');
  };

  const handleShare = () => {
    if (!settings) return;

    const message = `Date: ${format(new Date(selectedDate), 'dd-MM-yyyy')}
Name:${settings.userName}
Brand:*BAJAJ* 
Day Target: ${formData.dayTarget} 
Day achievement: ${formData.dayAchievement}
Week Target : ${formData.weekTarget}
Week achievement : ${formData.weekAchievement} 
Eol target :${formData.eolTarget}
Eol Achive :${formData.eolAchieve}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(new Date(selectedDate), { weekStartsOn: 1 }); // Sunday

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Target</h1>
          <p className="text-sm opacity-70">
            Week: {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <TargetIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 opacity-70">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass-input w-full !py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-4 h-4" /> Daily
            </h3>
            <div>
              <label className="block text-xs font-medium mb-1 opacity-70">Day Target</label>
              <input
                type="number"
                name="dayTarget"
                placeholder="0"
                value={formData.dayTarget ?? ''}
                onChange={handleChange}
                className="glass-input w-full !py-2 text-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 opacity-70">Day Achievement</label>
              <input
                type="number"
                name="dayAchievement"
                placeholder="0"
                value={formData.dayAchievement ?? ''}
                onChange={handleChange}
                className="glass-input w-full !py-2 text-lg font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <TargetIcon className="w-4 h-4" /> Weekly
            </h3>
            <div>
              <label className="block text-xs font-medium mb-1 opacity-70">Week Target</label>
              <input
                type="number"
                name="weekTarget"
                placeholder="0"
                value={formData.weekTarget ?? ''}
                onChange={handleChange}
                className="glass-input w-full !py-2 text-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 opacity-70">Week Achievement</label>
              <input
                type="number"
                name="weekAchievement"
                placeholder="0"
                value={formData.weekAchievement ?? ''}
                onChange={handleChange}
                className="glass-input w-full !py-2 text-lg font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 opacity-70">EOL Target</label>
            <input
              type="number"
              name="eolTarget"
              placeholder="0"
              value={formData.eolTarget ?? ''}
              onChange={handleChange}
              className="glass-input w-full !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 opacity-70">EOL Achieve</label>
            <input
              type="number"
              name="eolAchieve"
              placeholder="0"
              value={formData.eolAchieve ?? ''}
              onChange={handleChange}
              className="glass-input w-full !py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button 
            onClick={handleSave}
            className="glass-button flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Save
          </button>
          <button 
            onClick={handleShare}
            className="glass-button bg-blue-500/80 hover:bg-blue-500 flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

