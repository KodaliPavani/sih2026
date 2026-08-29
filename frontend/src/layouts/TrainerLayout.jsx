import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  Award,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function TrainerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/trainer/dashboard', label: 'Trainer Dashboard', icon: LayoutDashboard },
    { to: '/trainer/cohorts', label: 'Assigned Cohorts & Modules', icon: BookOpen },
    { to: '/trainer/grading', label: 'Evaluation & Endorsements', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Portal Identity */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-white uppercase">
                  TalentProof
                </h1>
                <p className="text-[11px] font-bold text-indigo-400">Faculty Trainer Portal</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  {user?.name ? user.name[0] : 'T'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.name || 'Faculty Trainer'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Instructor
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
