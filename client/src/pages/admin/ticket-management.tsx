import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function TicketManagement() {
  return (
    <DashboardLayout title="مدیریت تیکت‌ها">
      <div className="space-y-4" dir="rtl">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <Ticket className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold">مدیریت تیکت‌های پشتیبانی</h2>
            <p className="text-sm text-muted-foreground">
              تیکت‌های ارسالی کاربران از طریق بخش تیکت‌های پشتیبانی قابل مدیریت هستند.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
