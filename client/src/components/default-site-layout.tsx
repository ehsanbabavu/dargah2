import React from "react";
import { DefaultHeader } from "./default-header";
import { DefaultFooter } from "./default-footer";

interface DefaultSiteLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function DefaultSiteLayout({ children, showFooter = true }: DefaultSiteLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col overflow-x-hidden" dir="rtl">
      <DefaultHeader />
      <div className="flex-1 pt-20">
        {children}
      </div>
      {showFooter && <DefaultFooter />}
    </div>
  );
}

export default DefaultSiteLayout;
