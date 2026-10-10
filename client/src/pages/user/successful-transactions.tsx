import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function SuccessfulTransactions() {
  return (
    <DashboardLayout title="تراکنش‌ها">
      <div className="space-y-4" dir="rtl">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <Receipt className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold">مدیریت تراکنش‌ها</h2>
            <p className="text-sm text-muted-foreground">
              لیست تراکنش‌ها و واریزی‌های انجام شده.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
