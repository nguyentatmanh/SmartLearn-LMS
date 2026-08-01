'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { playNavClickSound } from '@/lib/sound';
import {
  GraduationCap, LogOut, Sun, Moon, Globe,
  UserCheck, Clock, ShieldAlert, X,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export interface NavItemIconStyle {
  activeTile: string;
  inactiveTile: string;
  activeIcon: string;
  inactiveIcon: string;
}

export interface NavItemConfig {
  id: string;
  labelKey?: string;
  label?: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: string }>;
  badge?: number;
  isActive?: boolean;
  iconStyle?: NavItemIconStyle;
}

export interface RoleSidebarProps {
  role: 'admin' | 'teacher' | 'student';
  workspaceTitleKey?: string;
  workspaceTitle?: string;
  navItems: NavItemConfig[];
  extraBottomItems?: React.ReactNode;
  hideFooterControls?: boolean;
}

/** Unified color palette for all navigation item tiles & icons */
export const GLOBAL_NAV_ICON_STYLES: Record<string, NavItemIconStyle> = {
  overview: {
    activeTile: 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/25',
    inactiveTile: 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
  },
  dashboard: {
    activeTile: 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/25',
    inactiveTile: 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
  },
  users: {
    activeTile: 'bg-sky-600 border-sky-600 shadow-md shadow-sky-500/25',
    inactiveTile: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/20 hover:bg-sky-500/20 dark:hover:bg-sky-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-sky-600 dark:text-sky-400',
  },
  students: {
    activeTile: 'bg-sky-600 border-sky-600 shadow-md shadow-sky-500/25',
    inactiveTile: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/20 hover:bg-sky-500/20 dark:hover:bg-sky-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-sky-600 dark:text-sky-400',
  },
  'teacher-approvals': {
    activeTile: 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/25',
    inactiveTile: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-amber-600 dark:text-amber-400',
  },
  courses: {
    activeTile: 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-500/25',
    inactiveTile: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-emerald-600 dark:text-emerald-400',
  },
  reports: {
    activeTile: 'bg-purple-600 border-purple-600 shadow-md shadow-purple-500/25',
    inactiveTile: 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-purple-600 dark:text-purple-400',
  },
  analytics: {
    activeTile: 'bg-purple-600 border-purple-600 shadow-md shadow-purple-500/25',
    inactiveTile: 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-purple-600 dark:text-purple-400',
  },
  'audit-logs': {
    activeTile: 'bg-cyan-600 border-cyan-600 shadow-md shadow-cyan-500/25',
    inactiveTile: 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/20 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-cyan-600 dark:text-cyan-400',
  },
  materials: {
    activeTile: 'bg-amber-600 border-amber-600 shadow-md shadow-amber-500/25',
    inactiveTile: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-amber-600 dark:text-amber-400',
  },
  settings: {
    activeTile: 'bg-pink-600 border-pink-600 shadow-md shadow-pink-500/25',
    inactiveTile: 'bg-pink-500/10 dark:bg-pink-500/15 border-pink-500/20 hover:bg-pink-500/20 dark:hover:bg-pink-500/25',
    activeIcon: 'text-white',
    inactiveIcon: 'text-pink-600 dark:text-pink-400',
  },
};

export function SidebarToggle({ className = '' }: { className?: string }) {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { t } = usePreference();

  const label = isCollapsed
    ? (t('sidebarExpand' as any) || 'Expand sidebar')
    : (t('sidebarCollapse' as any) || 'Collapse sidebar');

  return (
    <button
      onClick={() => {
        playNavClickSound();
        toggleCollapsed();
      }}
      className={`p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-150 active:scale-95 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center group ${className}`}
      aria-label={label}
      aria-expanded={!isCollapsed}
      title={label}
    >
      {isCollapsed ? (
        <PanelLeftOpen className="h-5 w-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" aria-hidden="true" />
      ) : (
        <PanelLeftClose className="h-5 w-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-200" aria-hidden="true" />
      )}
    </button>
  );
}

export function SidebarTooltip({
  text,
  children,
  show
}: {
  text: string;
  children: React.ReactNode;
  show: boolean;
}) {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group/tooltip flex items-center">
      {children}
      <div
        role="tooltip"
        className="absolute left-full ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-xl shadow-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 transition-all duration-150 z-50 whitespace-nowrap border border-border"
      >
        {text}
      </div>
    </div>
  );
}

export function RoleSidebar({
  role,
  workspaceTitleKey,
  workspaceTitle,
  navItems,
  extraBottomItems,
  hideFooterControls = false
}: RoleSidebarProps) {
  const { isCollapsed, isOpenMobile, closeMobile } = useSidebar();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpenMobile && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpenMobile]);

  const resolvedTitle = workspaceTitleKey
    ? t(workspaceTitleKey as any)
    : (workspaceTitle || (role === 'admin' ? 'Admin Workspace' : role === 'teacher' ? 'Teacher Workspace' : 'Student Panel'));

  const getDisplayName = () => {
    if (user?.full_name?.trim()) return user.full_name.trim();
    if (user?.email) {
      const part = user.email.split('@')[0];
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : user.email;
    }
    return role === 'admin' ? t('greetingFallbackAdmin') : role === 'teacher' ? t('greetingFallbackTeacher') : t('greetingFallbackStudent');
  };

  const displayName = getDisplayName();
  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';

  const renderNavContent = (isMobileView: boolean = false) => {
    const collapsed = isMobileView ? false : isCollapsed;

    return (
      <div className="flex flex-col justify-between h-full p-3.5 relative select-none">
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1.5 pt-1 min-h-[44px]">
            <Link
              href="/"
              onClick={() => {
                playNavClickSound();
                closeMobile();
              }}
              className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              title="SmartLearn LMS"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 shadow-xs">
                <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap block">
                    SmartLearn <span className="text-primary">LMS</span>
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground block truncate">
                    {resolvedTitle}
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            {isMobileView ? (
              <button
                onClick={() => {
                  playNavClickSound();
                  closeMobile();
                }}
                className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center group"
                aria-label={t('sidebarCloseNav' as any) || 'Close navigation menu'}
              >
                <X className="h-5 w-5 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-200" aria-hidden="true" />
              </button>
            ) : (
              <SidebarToggle className="hidden lg:flex" />
            )}
          </div>

          {/* Navigation Section */}
          <nav className="space-y-1" aria-label={t('sidebarMainNavigation' as any) || 'Main navigation'}>
            {!collapsed && (
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                {resolvedTitle}
              </div>
            )}

            {navItems.map((item) => {
              const labelText = item.labelKey ? t(item.labelKey as any) : (item.label || '');
              const active = item.isActive !== undefined
                ? item.isActive
                : item.href
                ? (item.href === '/dashboard/teacher' || item.href === '/dashboard/student' || item.href === '/dashboard/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href))
                : false;

              const Icon = item.icon || GraduationCap;
              const style = item.iconStyle || GLOBAL_NAV_ICON_STYLES[item.id] || GLOBAL_NAV_ICON_STYLES.overview;

              const content = (
                <div
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group cursor-pointer min-h-[48px]",
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/20 border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground active:scale-[0.97]",
                    collapsed ? "justify-center px-2" : ""
                  )}
                >
                  {/* Icon Tile with Micro-Animation on Hover */}
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-115 group-hover:rotate-6 group-hover:shadow-md",
                      active ? style.activeTile : style.inactiveTile
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      strokeWidth={2}
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 fill-none transition-transform duration-200 group-hover:scale-110",
                        active ? style.activeIcon : style.inactiveIcon
                      )}
                    />
                  </span>

                  {!collapsed && <span className="truncate transition-colors duration-150">{labelText}</span>}

                  {item.badge && item.badge > 0 ? (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full transition-all shrink-0 animate-pulse",
                        collapsed
                          ? "absolute top-1 right-1 px-1.5 py-0.2 text-[9px] bg-amber-500 text-white"
                          : active
                          ? "bg-amber-500 text-white"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              );

              if (item.href) {
                return (
                  <SidebarTooltip key={item.id} text={labelText} show={collapsed}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        playNavClickSound();
                        closeMobile();
                      }}
                      aria-current={active ? 'page' : undefined}
                      aria-label={labelText}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    >
                      {content}
                    </Link>
                  </SidebarTooltip>
                );
              }

              return (
                <SidebarTooltip key={item.id} text={labelText} show={collapsed}>
                  <button
                    type="button"
                    onClick={() => {
                      playNavClickSound();
                      if (item.onClick) item.onClick();
                      closeMobile();
                    }}
                    aria-current={active ? 'page' : undefined}
                    aria-label={labelText}
                    className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  >
                    {content}
                  </button>
                </SidebarTooltip>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        {(extraBottomItems || !hideFooterControls) && (
          <div className="space-y-2 pt-3 border-t border-border/40">
            {extraBottomItems}

            {!hideFooterControls && (
              <>
                {/* Controls row: Theme & Language */}
                <div className={`flex items-center gap-1 p-1 bg-muted/40 rounded-xl ${collapsed ? 'flex-col' : 'justify-between'}`}>
                  <button
                    onClick={() => {
                      playNavClickSound();
                      toggleTheme();
                    }}
                    className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-150 flex justify-center flex-1 w-full cursor-pointer min-h-[44px] items-center group active:scale-95"
                    aria-label={t('common.toggleTheme')}
                    title={t('common.toggleTheme')}
                  >
                    {isMounted ? (
                      theme === 'dark' ? (
                        <Sun className="h-4 w-4 text-amber-400 group-hover:scale-125 group-hover:rotate-45 transition-transform duration-200" />
                      ) : (
                        <Moon className="h-4 w-4 text-indigo-500 group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-200" />
                      )
                    ) : (
                      <span className="h-4 w-4 animate-pulse bg-muted-foreground/20 rounded-full" />
                    )}
                  </button>
                  {!collapsed && <div className="h-4 w-[1px] bg-border/40 shrink-0" />}
                  <button
                    onClick={() => {
                      playNavClickSound();
                      setLanguage(language === 'en' ? 'vi' : 'en');
                    }}
                    className="p-2 rounded-lg hover:bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center justify-center gap-1 flex-1 w-full cursor-pointer min-h-[44px] group active:scale-95"
                    aria-label={t('common.changeLanguage')}
                    title={t('common.changeLanguage')}
                  >
                    <Globe className="h-3.5 w-3.5 group-hover:scale-125 group-hover:rotate-180 transition-transform duration-300" />
                    <span>{isMounted ? (language === 'en' ? 'EN' : 'VI') : 'EN'}</span>
                  </button>
                </div>

                {/* User Profile Card */}
                <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 ${collapsed ? 'justify-center p-1.5' : ''}`}>
                  <div className="h-8 w-8 bg-primary/10 text-primary font-bold rounded-lg flex items-center justify-center uppercase shrink-0 text-xs shadow-xs">
                    {displayName.charAt(0)}
                  </div>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-foreground">{displayName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {role === 'teacher' && approvalStatus === 'approved' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <UserCheck className="h-3 w-3" /> {t('adminLabelApproved')}
                          </span>
                        )}
                        {role === 'teacher' && approvalStatus === 'pending' && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {t('adminLabelPending')}
                          </span>
                        )}
                        {role === 'teacher' && approvalStatus === 'rejected' && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                            <ShieldAlert className="h-3 w-3" /> {t('adminLabelRejected')}
                          </span>
                        )}
                        {role !== 'teacher' && (
                          <span className="text-[10px] text-muted-foreground capitalize truncate">
                            {user?.role || role}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout button */}
                <button
                  onClick={() => {
                    playNavClickSound();
                    logout();
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 text-xs font-semibold transition-all duration-150 text-muted-foreground cursor-pointer min-h-[44px] group active:scale-95 ${collapsed ? 'px-2' : ''}`}
                  aria-label={t('logout')}
                  title={t('logout')}
                >
                  <LogOut className="h-4 w-4 shrink-0 group-hover:scale-125 group-hover:-translate-x-0.5 transition-transform duration-200" aria-hidden="true" />
                  {!collapsed && <span>{t('logout')}</span>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 bg-card border-r border-border/40 z-30 transition-all duration-200 ease-out shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Off-Canvas */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={resolvedTitle}
            className="relative flex-1 bg-card w-full max-w-[320px] shadow-2xl focus:outline-none h-full z-50 transition-transform duration-200 ease-out"
          >
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardShell({
  children,
  header
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-200">
      {header}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-out lg:pl-${
          isCollapsed ? '20' : '64'
        }`}
      >
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-out ${
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
