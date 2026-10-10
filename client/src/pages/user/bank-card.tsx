import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function BankCard() {
  return (
    <DashboardLayout title="کارت بانکی">
      <div className="space-y-4" dir="rtl">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold">مدیریت کارت بانکی</h2>
            <p className="text-sm text-muted-foreground">
              اطلاعات کارت بانکی و وضعیت تایید آن.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
