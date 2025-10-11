// 🚀 ENTERPRISE LOADING COMPONENTS - SOPHISTICATED SKELETON SCREENS
// Premium loading states dengan glassmorphism dan smooth animations

import React from 'react';
import { Spinner } from './Spinner';
import { Building2, Shield, Zap, Activity, TrendingUp } from 'lucide-react';

// Enhanced Auth Loading Screen
export function EnterpriseAuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-accent-coral/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-blue/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10 text-center">
        {/* Premium Loading Animation */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-coral to-accent-coral-dark flex items-center justify-center text-white text-3xl font-bold shadow-coral floating mx-auto mb-4">
            🏗️
          </div>
          <h1 className="text-4xl font-bold text-white gradient-text mb-2">NATA'CARA</h1>
          <p className="text-lg text-white/70 font-medium">Enterprise Project Management</p>
        </div>

        {/* Sophisticated Loading Indicator */}
        <div className="mb-8">
          <Spinner size="lg" />
        </div>

        {/* Loading Progress Steps */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 text-white/80">
            <Shield className="w-5 h-5 text-accent-emerald animate-pulse" />
            <span className="text-sm">Initializing Enterprise Security...</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/80">
            <Building2 className="w-5 h-5 text-accent-blue animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="text-sm">Loading Project Infrastructure...</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/80">
            <Zap className="w-5 h-5 text-accent-coral animate-pulse" style={{ animationDelay: '1s' }} />
            <span className="text-sm">Connecting AI Analytics Engine...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Loading with Skeleton
export function EnterpriseDashboardLoader() {
  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse"></div>
          <div>
            <div className="w-48 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="w-32 h-10 bg-gradient-to-r from-accent-coral/20 to-accent-coral-dark/20 rounded-xl animate-pulse"></div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse"></div>
              <div className="w-6 h-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <div className="w-48 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse mb-6"></div>
          <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="w-40 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse mb-6"></div>
          <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* AI Insights Skeleton */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-gradient-to-br from-accent-coral/30 to-accent-coral-dark/30 rounded animate-pulse"></div>
          <div className="w-40 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="w-full h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
          <div className="w-5/6 h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
          <div className="w-4/5 h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Project Loading Skeleton
export function EnterpriseProjectLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Animated Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-coral to-accent-coral-dark flex items-center justify-center text-white text-2xl font-bold shadow-coral floating mx-auto mb-6">
          🏗️
        </div>
        
        {/* Loading Spinner */}
        <div className="mb-6">
          <Spinner size="lg" />
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Project Data</h2>
        <p className="text-slate-600 mb-6">Preparing your enterprise dashboard with the latest project insights...</p>
        
        {/* Progress Steps */}
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 text-slate-700">
            <Activity className="w-4 h-4 text-accent-emerald animate-pulse" />
            <span className="text-sm">Fetching project metrics...</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <TrendingUp className="w-4 h-4 text-accent-blue animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="text-sm">Analyzing performance data...</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <Zap className="w-4 h-4 text-accent-coral animate-pulse" style={{ animationDelay: '1s' }} />
            <span className="text-sm">Generating AI insights...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card Skeleton Component
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-card p-6 rounded-2xl ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 bg-slate-300 rounded-lg"></div>
          <div className="w-6 h-6 bg-slate-300 rounded"></div>
        </div>
        <div className="w-16 h-6 bg-slate-300 rounded mb-2"></div>
        <div className="w-24 h-4 bg-slate-300 rounded"></div>
      </div>
    </div>
  );
}

// Text Skeleton
export function SkeletonText({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-300 rounded animate-pulse ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}