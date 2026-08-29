import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  AlertTriangle,
  GraduationCap,
  LogOut,
  Building2,
  Menu,
  X
} from 'lucide-react';

export default function PlacementLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/placement/dashboard', icon: LayoutDashboard },
    { label: 'Student Directory', path: '/placement/students', icon: Users },
    { label: 'JD & Requirements', path: '/placement/jobs', icon: FileText },
    { label: 'Placement Drives', path: '/placement/drives', icon: Building2 },
    { label: 'Eligible Candidates', path: '/placement/eligible', icon: UserCheck },
    { label: 'At-Risk Students', path: '/placement/at-risk', icon: AlertTriangle },
    { label: 'Training Cohorts', path: '/placement/training', icon: GraduationCap },
  ];


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-sm">Placement Intelligence Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen`}
      >
        <div className="p-5 border-b border-slate-800 hidden md:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wide">PLACEMENT CELL</h1>
            <p className="text-[11px] text-indigo-400 font-semibold">Intelligence Admin</p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs text-white truncate">{user?.name || 'Placement Cell Admin'}</div>
            <div className="text-[11px] text-indigo-400 font-semibold truncate">Role: Placement Admin</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Visible Logout Button (Section 6 Requirement) */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
