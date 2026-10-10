import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";

export default function AdminLandingPage() {
  return (
    <DashboardLayout title="مدیریت لندینگ">
      <div className="space-y-4" dir="rtl">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <LayoutTemplate className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold">مدیریت لندینگ پیج</h2>
            <p className="text-sm text-muted-foreground">
              تنظیمات و محتوای صفحه اصلی و لندینگ پیج.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
