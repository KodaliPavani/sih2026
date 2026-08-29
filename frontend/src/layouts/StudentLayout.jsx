import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  FileCheck2,
  Briefcase,
  Target,
  TrendingDown,
  BookOpen,
  RotateCcw,
  Send,
  LogOut,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/student/profile', icon: User },
    { label: 'Skill Passport', path: '/student/passport', icon: Award },
    { label: 'My Evidence', path: '/student/evidence', icon: FileCheck2 },
    { label: 'Why Not Ready?', path: '/student/blockers', icon: Target },
    { label: 'Career Simulation', path: '/student/simulation', icon: Sparkles },
    { label: 'Job Opportunities', path: '/student/jobs', icon: Briefcase },
    { label: 'Skill Gaps', path: '/student/gaps', icon: TrendingDown },
    { label: 'Learning Plan', path: '/student/learning', icon: BookOpen },
    { label: 'Reassessment', path: '/student/reassessment', icon: RotateCcw },
    { label: 'Applications', path: '/student/applications', icon: Send },
  ];


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <span className="font-bold text-white text-sm">Placement Intelligence</span>
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wide">STUDENT PORTAL</h1>
            <p className="text-[11px] text-sky-400 font-semibold">Skill Readiness Engine</p>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0] || 'S'}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs text-white truncate">{user?.name || 'Student User'}</div>
            <div className="text-[11px] text-slate-400 truncate">ID: {user?.studentId || '2300030042'}</div>
          </div>
        </div>

        {/* Navigation Items */}
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
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
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

        {/* Visible Logout Button (Section 6 & 45 Requirement) */}
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
