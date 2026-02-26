import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Calendar as CalendarIcon, MapPin, Clock, Share2, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

export function Attendance() {
  const { settings, attendance, loadAttendance, markAttendance } = useStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isLocating, setIsLocating] = useState(false);

  // Haversine formula to calculate distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const { monthStart, monthEnd, daysInMonth } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return {
      monthStart: start,
      monthEnd: end,
      daysInMonth: eachDayOfInterval({ start, end })
    };
  }, [currentMonth]);

  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const todaysAttendance = useMemo(() => attendance.find(a => a.date === selectedDateStr), [attendance, selectedDateStr]);

  const handleMarkAttendance = async (status: 'Present' | 'Week Off' | 'Leave') => {
    if (status === 'Present') {
      if (!settings?.storeLat || !settings?.storeLng) {
        toast.error('Store location not mapped! Please go to Settings and map your store location first.', { duration: 5000 });
        return;
      }

      setIsLocating(true);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            let locationStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            const distance = calculateDistance(latitude, longitude, settings.storeLat!, settings.storeLng!);
            if (distance > 300) { // 300 meters radius
              toast.error(`Can't mark attendance! You are not in store yet. You are ${Math.round(distance)}m away. (Allowed: 300m)`, { duration: 5000 });
              setIsLocating(false);
              return;
            }
            
            locationStr += ` (At Store, ${Math.round(distance)}m)`;
            
            await markAttendance({
              date: selectedDateStr,
              timeIn: todaysAttendance?.timeIn || format(new Date(), 'HH:mm'),
              timeOut: todaysAttendance?.timeIn ? format(new Date(), 'HH:mm') : undefined,
              location: locationStr,
              status
            });
            setIsLocating(false);
            toast.success('Attendance marked successfully');
          },
          (error) => {
            console.error(error);
            setIsLocating(false);
            toast.error('Failed to get location. Please enable GPS.');
          },
          { enableHighAccuracy: true }
        );
      } else {
        setIsLocating(false);
        toast.error('Geolocation is not supported by your browser');
      }
    } else {
      await markAttendance({
        date: selectedDateStr,
        status
      });
      toast.success(`${status} marked successfully`);
    }
  };

  const handleShare = () => {
    if (!settings) return;

    const message = `Name :${settings.userName}
Store: ${settings.storeName || ''}
Location: ${settings.storeLocation || ''}
Date : ${format(new Date(), 'dd/MM/yyyy')}    
I am in the store sir...   -`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm opacity-70">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> Calendar
          </h2>
          <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium opacity-50 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {daysInMonth.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayRecord = attendance.find(a => a.date === dateStr);
            const isSelected = isSameDay(day, selectedDate);
            
            let bgColor = 'bg-black/5 dark:bg-white/5';
            let textColor = '';
            
            if (dayRecord) {
              if (dayRecord.status === 'Present') {
                bgColor = 'bg-emerald-500';
                textColor = 'text-white';
              } else if (dayRecord.status === 'Leave') {
                bgColor = 'bg-yellow-500/20';
                textColor = 'text-yellow-700 dark:text-yellow-300';
              } else if (dayRecord.status === 'Week Off') {
                bgColor = 'bg-slate-500/20';
                textColor = 'text-slate-700 dark:text-slate-300';
              }
            }
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? 'ring-2 ring-slate-800 dark:ring-white scale-110 z-10' : 'hover:scale-105'}
                  ${bgColor} ${textColor}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-center gap-4 text-xs font-medium opacity-70 pt-2">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Present</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500/50"></div> Leave</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-500/50"></div> Week Off</div>
        </div>
      </div>

      {/* Action Area */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h2 className="font-semibold text-lg">Mark for {format(selectedDate, 'MMM d, yyyy')}</h2>
        
        {todaysAttendance && (
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-70">Status</span>
              <span className="font-semibold">{todaysAttendance.status}</span>
            </div>
            {todaysAttendance.timeIn && (
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-70 flex items-center gap-1"><Clock className="w-4 h-4"/> Time In</span>
                <span className="font-semibold">{todaysAttendance.timeIn}</span>
              </div>
            )}
            {todaysAttendance.timeOut && (
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-70 flex items-center gap-1"><Clock className="w-4 h-4"/> Time Out</span>
                <span className="font-semibold">{todaysAttendance.timeOut}</span>
              </div>
            )}
            {todaysAttendance.location && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-70 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location</span>
                  <span className="font-semibold text-xs">{todaysAttendance.location}</span>
                </div>
                {(() => {
                  const match = todaysAttendance.location?.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                  if (match) {
                    const lat = parseFloat(match[1]);
                    const lng = parseFloat(match[2]);
                    return (
                      <div className="w-full h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                        <iframe
                          title="Attendance Location Map"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.002},${lat - 0.002},${lng + 0.002},${lat + 0.002}&layer=mapnik&marker=${lat},${lng}`}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => handleMarkAttendance('Present')}
            disabled={isLocating}
            className="glass-button bg-slate-900 hover:bg-black dark:bg-white/20 dark:hover:bg-white/30 flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" /> 
            {isLocating ? 'Getting Location...' : (todaysAttendance?.timeIn ? 'Mark Time Out' : 'Mark Present (Time In)')}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleMarkAttendance('Week Off')}
              className="glass-button bg-slate-500/80 hover:bg-slate-500"
            >
              Week Off
            </button>
            <button 
              onClick={() => handleMarkAttendance('Leave')}
              className="glass-button bg-yellow-500/80 hover:bg-yellow-500"
            >
              Leave
            </button>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Share2 className="w-5 h-5" /> Share Attendance
        </button>
      </div>
    </div>
  );
}

