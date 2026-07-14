import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { Hotel, Search, CheckCircle2, Utensils, MapPin, Edit3 } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const HospitalityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [arrivalStatus, setArrivalStatus] = useState<'NOT_ARRIVED' | 'CHECKED_IN' | 'DEPARTED'>('CHECKED_IN');
  const [accommodationHall, setAccommodationHall] = useState('');
  const [foodPreference, setFoodPreference] = useState<'Veg' | 'Non-Veg' | 'Jain'>('Veg');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHospitalityData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/hospitality');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalityData();
  }, []);

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/hospitality/update', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: selectedItem.institution.id,
          arrivalStatus,
          accommodationHall,
          foodPreference,
          specialRequirements,
          user
        })
      });
      if (res.success) {
        setSelectedItem(null);
        fetchHospitalityData();
      }
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  const filtered = data.filter(item => 
    item.institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.poc && item.poc.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={user?.role || 'hospitality_team'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header title="Hospitality & Student Logistics Desk" subtitle="Monitor verified college delegations, accommodation halls, and meal preferences." />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Top Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search institution, hall, or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
              />
            </div>
          </div>

          {/* Hospitality List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-christ-navy font-serif text-sm">Verified Delegations ({filtered.length})</h3>
              <span className="text-xs text-slate-500">Only VERIFIED institutions shown</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading hospitality records...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No verified delegations found yet. Complete registration verification first.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                      <th className="p-3.5 font-bold">Institution</th>
                      <th className="p-3.5 font-bold">Delegation Size</th>
                      <th className="p-3.5 font-bold">Arrival Status</th>
                      <th className="p-3.5 font-bold">Accommodation Hall</th>
                      <th className="p-3.5 font-bold">Food Pref</th>
                      <th className="p-3.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filtered.map((item) => (
                      <tr key={item.institution.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{item.institution.name}</strong>
                          <span className="text-[10px] text-slate-400">POC: {item.poc?.name} ({item.poc?.phone})</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">{item.participantsCount} Students</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.hospitality.arrivalStatus === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' :
                            item.hospitality.arrivalStatus === 'DEPARTED' ? 'bg-slate-200 text-slate-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.hospitality.arrivalStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">{item.hospitality.accommodationHall || 'Not Assigned'}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-christ-gold/20 text-christ-navy">
                            <Utensils className="w-3 h-3" />
                            <span>{item.hospitality.foodPreference}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setArrivalStatus(item.hospitality.arrivalStatus);
                              setAccommodationHall(item.hospitality.accommodationHall || '');
                              setFoodPreference(item.hospitality.foodPreference);
                              setSpecialRequirements(item.hospitality.specialRequirements || '');
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-christ-navy text-white rounded-lg text-xs font-semibold hover:bg-christ-darkNavy"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update Logistics</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Logistics Modal */}
          {selectedItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-christ-navy font-serif text-base">{selectedItem.institution.name} Logistics</h3>
                  <button onClick={() => setSelectedItem(null)} className="text-slate-400 font-bold">✕</button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Arrival Status *</label>
                    <select
                      value={arrivalStatus}
                      onChange={(e) => setArrivalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    >
                      <option value="NOT_ARRIVED">NOT ARRIVED</option>
                      <option value="CHECKED_IN">CHECKED IN</option>
                      <option value="DEPARTED">DEPARTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Accommodation Hall / Room Assignment</label>
                    <input
                      type="text"
                      placeholder="e.g. St. Kuriakose Elias Hall (Block II)"
                      value={accommodationHall}
                      onChange={(e) => setAccommodationHall(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Food Preference *</label>
                    <select
                      value={foodPreference}
                      onChange={(e) => setFoodPreference(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    >
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Jain">Jain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Special Requirements / Lockers</label>
                    <textarea
                      placeholder="e.g. Needs 2 extra sports lockers."
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button onClick={() => setSelectedItem(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold">Cancel</button>
                  <button onClick={handleUpdate} className="px-5 py-2 bg-christ-gold text-christ-navy text-xs font-bold rounded-lg hover:bg-christ-lightGold">
                    Save Logistics
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
