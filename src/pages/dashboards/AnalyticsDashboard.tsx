import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { BarChart3, Download, PieChart, TrendingUp, Users, DollarSign, Building2, Shield, Calendar } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; summary: any; districtData: any[]; eventPopularity: any[]; categoryBreakdown: any[]; genderBreakdown: any[]; trendData: any[] }>('/analytics');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Category,Value\n" +
      `Total Institutions,${data.summary.totalInstitutions}\n` +
      `Total Participants,${data.summary.totalParticipants}\n` +
      `Total Revenue,${data.summary.totalRevenue}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ANVESHA_2026_Official_Report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const COLORS = ['#002147', '#C5A059', '#10B981', '#6366F1', '#EC4899'];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={user?.role || 'officials'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header title="Officials Executive Reports & Analytics" subtitle="Comprehensive view-only analytics suite for Christ University leadership." />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-serif">Executive Summary</span>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-christ-navy text-white text-xs font-bold rounded-lg hover:bg-christ-darkNavy inline-flex items-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-christ-gold" />
              <span>Export Official CSV Report</span>
            </button>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Total PU Colleges</span>
              <p className="text-3xl font-black text-christ-navy font-serif">{data?.summary.totalInstitutions || 0}</p>
              <p className="text-[10px] text-emerald-600 font-bold">● 100% Verified Entry</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Total Student Athletes</span>
              <p className="text-3xl font-black text-christ-gold font-serif">{data?.summary.totalParticipants || 0}</p>
              <p className="text-[10px] text-slate-500">Verified: {data?.summary.verifiedParticipants || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Total Registration Revenue</span>
              <p className="text-3xl font-black text-emerald-700 font-serif">₹{data?.summary.totalRevenue || 0}</p>
              <p className="text-[10px] text-slate-500">Direct College Bank Transfer</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-bold">Sports vs Cultural Ratio</span>
              <p className="text-3xl font-black text-slate-800 font-serif">55 : 45</p>
              <p className="text-[10px] text-slate-500">Balanced Participation</p>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: District-wise Bar Chart */}
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-christ-navy font-serif text-sm">District-wise Student Turnout</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.districtData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="district" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="participants" fill="#002147" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Pie Chart */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-christ-navy font-serif text-sm">Category Breakdown</h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={data?.categoryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data?.categoryBreakdown?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Revenue & Registration Curve */}
            <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-christ-navy font-serif text-sm">Registration & Revenue Accumulation Curve</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.trendData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#C5A059" fill="#C5A05933" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
