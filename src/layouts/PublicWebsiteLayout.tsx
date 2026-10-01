import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';

export function PublicWebsiteLayout() {
  const location = useLocation();

  // Scroll to top on route navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      {/* Background ambient lighting and grid patterns */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-primary/15 via-indigo-500/5 to-transparent blur-3xl opacity-60 rounded-full" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Fixed Navbar */}
      <PublicNavbar />

      {/* Main Page Content */}
      <main className="flex-1 relative z-10 pt-20">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}
