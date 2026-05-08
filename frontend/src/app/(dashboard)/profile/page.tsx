"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { updateProfile } from '@/services/auth.service';
import { User, Mail, Shield, Save, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await updateProfile({ name });
      updateUser({ name: res.data.name });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
        <p className="text-slate-500">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white transition-transform group-hover:scale-105">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-3 text-blue-700 mb-2">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Security Note</h3>
            </div>
            <p className="text-xs text-blue-600/80 leading-relaxed">
              Your email address is used for authentication across all your enrolled courses and cannot be changed.
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h3 className="font-semibold text-slate-900">Personal Information</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">
                    Verified
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 ml-1">Email cannot be changed for security reasons.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || name === user.name}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
