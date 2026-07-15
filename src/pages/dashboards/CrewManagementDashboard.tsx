import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { Users, Trash2, Shield, Plus, Mail, User, AlertCircle, RefreshCw, Key, Eye, EyeOff, Check, X, Edit } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const CrewManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Password states
  const [passwordsList, setPasswordsList] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPasswordVal, setEditingPasswordVal] = useState('');
  const [visibleRoles, setVisibleRoles] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; role: string; password: string } | null>(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('registration_team');
  const [newEmail, setNewEmail] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<{ success: boolean; users: any[] }>('/admin/overview');
      if (res.success) {
        setUsersList(res.users);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch crew accounts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswords = async () => {
    try {
      const res = await apiFetch<{ success: boolean; passwords: any[] }>('/admin/passwords');
      if (res.success) {
        setPasswordsList(res.passwords);
      }
    } catch (err: any) {
      console.error('Failed to fetch passwords:', err);
    }
  };

  const handleSavePassword = async (role: string, password: string) => {
    setErrorMsg(null);
    setActionMsg(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/admin/passwords/update', {
        method: 'POST',
        body: JSON.stringify({ role, password })
      });
      if (res.success) {
        setActionMsg(`Password for role '${role}' updated successfully.`);
        setPasswordsList(prev => prev.map(p => p.role === role ? { ...p, password } : p));
        setEditingRole(null);
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setErrorMsg(null);
    setActionMsg(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/admin/users/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.success) {
        setActionMsg('Crew member role updated successfully.');
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        setErrorMsg(res.message || 'Failed to update user role.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPasswords();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newEmail.trim()) return;
    setErrorMsg(null);
    setActionMsg(null);

    try {
      const res = await apiFetch<{ success: boolean; user: any }>('/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          role: newRole,
          email: newEmail.trim()
        })
      });
      if (res.success) {
        setActionMsg(`Crew account '${newUsername}' created successfully!`);
        setNewUsername('');
        setNewName('');
        setNewEmail('');
        fetchUsers();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'User creation failed.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the crew account for '${userName}'? This action cannot be undone.`);
    if (!confirmDelete) return;
    setErrorMsg(null);
    setActionMsg(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setActionMsg(`Crew account '${userName}' deleted successfully.`);
        fetchUsers();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'User deletion failed.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole="admin" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header 
          title="Crew & User Accounts Management" 
          subtitle="Manage credentials, access permissions, event assignment roles, and system logins." 
        />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {actionMsg && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-medium rounded-r-xl flex justify-between items-center">
              <span>{actionMsg}</span>
              <button onClick={() => setActionMsg(null)} className="font-bold">Dismiss</button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-medium rounded-r-xl flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="font-bold">Dismiss</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column configuration cards */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* User account creation form card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Shield className="w-5 h-5 text-christ-navy" />
                  <h3 className="font-bold text-sm text-slate-800 font-serif">Add New Crew Account</h3>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold text-slate-700">
                  <div>
                    <label className="block mb-1 text-[10px] uppercase font-bold text-slate-400">Username *</label>
                    <input 
                      type="text" 
                      required 
                      value={newUsername} 
                      onChange={(e) => setNewUsername(e.target.value)} 
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 text-xs" 
                      placeholder="e.g. football_coordinator" 
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] uppercase font-bold text-slate-400">Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 text-xs" 
                      placeholder="Prof. Maria D'Souza" 
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] uppercase font-bold text-slate-400">Role *</label>
                    <select 
                      value={newRole} 
                      onChange={(e) => setNewRole(e.target.value)} 
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50 font-bold text-xs"
                    >
                      <option value="admin">Chief Admin</option>
                      <option value="registration_team">Registration Team</option>
                      <option value="hospitality_team">Hospitality Team</option>
                      <option value="faculty_football_boys">Faculty Coordinator (Football Boys)</option>
                      <option value="faculty_volleyball_boys">Faculty Coordinator (Volleyball Boys)</option>
                      <option value="faculty_volleyball_girls">Faculty Coordinator (Volleyball Girls)</option>
                      <option value="faculty_tug_of_war_boys">Faculty Coordinator (Tug of War Boys)</option>
                      <option value="faculty_tug_of_war_girls">Faculty Coordinator (Tug of War Girls)</option>
                      <option value="faculty_dance">Faculty Coordinator (Group Dance)</option>
                      <option value="faculty_music">Faculty Coordinator (Group Music)</option>
                      <option value="faculty_debate">Faculty Coordinator (Debate)</option>
                      <option value="faculty_fun_activities">Faculty Coordinator (Fun Activities)</option>
                      <option value="certificate_team">Certificate Team</option>
                      <option value="officials">University Officials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] uppercase font-bold text-slate-400">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 text-xs" 
                      placeholder="coordinator@christ.edu.in" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Create User Account
                  </button>
                </form>
              </div>

              {/* Team Login Passwords Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Key className="w-5 h-5 text-christ-navy" />
                  <h3 className="font-bold text-sm text-slate-800 font-serif">Team Login Passwords</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Set a single common password for all users under each role. Updating a password takes effect immediately.
                </p>

                <div className="space-y-3 pt-1">
                  {passwordsList.map((p) => {
                    const isEditing = editingRole === p.role;
                    const isVisible = visibleRoles[p.role];

                    return (
                      <div key={p.role} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1.5 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                            {p.role.replace(/_/g, ' ')}
                          </span>
                          
                          {!isEditing && (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setVisibleRoles(prev => ({ ...prev, [p.role]: !prev[p.role] }))}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                title={isVisible ? "Hide Password" : "Show Password"}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRole(p.role);
                                  setEditingPasswordVal(p.password);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-christ-navy transition-colors"
                                title="Edit Password"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingPasswordVal}
                              onChange={(e) => setEditingPasswordVal(e.target.value)}
                              className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingPasswordVal.trim()) return;
                                setConfirmDialog({ isOpen: true, role: p.role, password: editingPasswordVal });
                              }}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRole(null)}
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-mono font-bold text-slate-700">
                            {isVisible ? p.password : '••••••••••••'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Crew Accounts List Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-christ-navy" />
                    <h3 className="font-bold text-sm text-slate-800 font-serif">Registered Crew Members ({usersList.length})</h3>
                  </div>

                  <button 
                    onClick={fetchUsers}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"
                    title="Refresh Accounts"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar Input */}
                <div className="p-3 bg-slate-50 border-b border-slate-150">
                  <input
                    type="text"
                    placeholder="Search crew by name, username, email or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-white font-medium shadow-sm"
                  />
                </div>

                {loading ? (
                  <div className="p-10 text-center text-xs text-slate-500">Loading accounts ledger...</div>
                ) : usersList.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">No crew member accounts created yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {usersList.filter(u => 
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.role.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((u: any) => (
                      <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-1 min-w-0 flex-1 mr-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">({u.username})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                        </div>
                        
                        <div className="flex items-center space-x-3 shrink-0">
                          {u.id !== 'usr_admin_2' ? (
                            <select
                              disabled={updatingUserId === u.id}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-christ-navy bg-slate-50 focus:outline-none focus:ring-1 focus:ring-christ-navy disabled:opacity-50"
                            >
                              <option value="admin">Chief Admin</option>
                              <option value="registration_team">Registration Team</option>
                              <option value="hospitality_team">Hospitality Team</option>
                              <option value="faculty_football_boys">Faculty (Football Boys)</option>
                              <option value="faculty_volleyball_boys">Faculty (Volleyball Boys)</option>
                              <option value="faculty_volleyball_girls">Faculty (Volleyball Girls)</option>
                              <option value="faculty_tug_of_war_boys">Faculty (Tug of War Boys)</option>
                              <option value="faculty_tug_of_war_girls">Faculty (Tug of War Girls)</option>
                              <option value="faculty_dance">Faculty (Group Dance)</option>
                              <option value="faculty_music">Faculty (Group Music)</option>
                              <option value="faculty_debate">Faculty (Debate)</option>
                              <option value="faculty_fun_activities">Faculty (Fun Activities)</option>
                              <option value="certificate_team">Certificate Team</option>
                              <option value="officials">University Officials</option>
                            </select>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-christ-navy/10 text-christ-navy font-bold uppercase text-[9px] tracking-wide">
                              Main Admin
                            </span>
                          )}
                          
                          {u.id !== 'usr_admin_2' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="w-12 h-12 rounded-full bg-christ-gold/10 flex items-center justify-center mx-auto text-christ-gold">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="font-bold text-slate-900 text-sm font-serif">Confirm Password Change</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to change the password for the <strong className="text-slate-800 uppercase font-mono">{confirmDialog.role.replace(/_/g, ' ')}</strong> team to:
              </p>
              <div className="py-2 px-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs font-bold text-christ-navy select-all">
                {confirmDialog.password}
              </div>
              <p className="text-[10px] text-rose-500 font-semibold leading-relaxed">
                ⚠️ This will immediately affect all user logins under this role. Active sessions will require the new password.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  handleSavePassword(confirmDialog.role, confirmDialog.password);
                  setConfirmDialog(null);
                }}
                className="flex-1 py-2 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Confirm Update
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
