import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Search, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";

interface BankCardUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  bankCardNumber: string;
  bankCardHolderName: string;
  bankCardApprovalStatus: string;
  createdAt: Date;
}

export default function BankCardsManagement() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bankCards = [], isLoading } = useQuery<BankCardUser[]>({
    queryKey: ["/api/admin/bank-cards"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/admin/bank-cards");
      if (!response.ok) throw new Error("خطا در دریافت کارت‌های بانکی");
      return response.json();
    },
  });

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await createAuthenticatedRequest(`/api/admin/bank-cards/${userId}/approval`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("خطا در بروزرسانی وضعیت");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-cards"] });
      toast({
        title: "موفقیت",
        description: "وضعیت کارت بانکی با موفقیت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی وضعیت",
        variant: "destructive",
      });
    },
  });

  const filteredCards = bankCards.filter(card => {
    const matchesSearch = 
      card.firstName.toLowerCase().includes(search.toLowerCase()) ||
      card.lastName.toLowerCase().includes(search.toLowerCase()) ||
      card.username.toLowerCase().includes(search.toLowerCase()) ||
      card.bankCardNumber.includes(search) ||
      card.bankCardHolderName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const formatCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">رد شده</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="مدیریت کارت‌های بانکی">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="مدیریت کارت‌های بانکی">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="جستجو بر اساس نام، نام کاربری، شماره کارت..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {filteredCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {search ? "کارت بانکی مطابق با جستجو یافت نشد" : "هیچ کارت بانکی ثبت نشده است"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">کاربر</TableHead>
                        <TableHead className="text-right">شماره کارت</TableHead>
                        <TableHead className="text-right">نام صاحب کارت</TableHead>
                        <TableHead className="text-right">وضعیت</TableHead>
                        <TableHead className="text-right">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map((card) => (
                        <TableRow key={card.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{card.firstName} {card.lastName}</div>
                              <div className="text-sm text-gray-500">@{card.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded" dir="ltr">
                              {formatCardNumber(card.bankCardNumber)}
                            </code>
                          </TableCell>
                          <TableCell>{card.bankCardHolderName}</TableCell>
                          <TableCell>{getStatusBadge(card.bankCardApprovalStatus)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {card.bankCardApprovalStatus !== 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => updateApprovalMutation.mutate({ 
                                    userId: card.id, 
                                    status: 'approved' 
                                  })}
                                  disabled={updateApprovalMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 ml-1" />
                                  تایید
                                </Button>
                              )}
                              {card.bankCardApprovalStatus !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => updateApprovalMutation.mutate({ 
                                    userId: card.id, 
                                    status: 'rejected' 
                                  })}
                                  disabled={updateApprovalMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 ml-1" />
                                  رد
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
