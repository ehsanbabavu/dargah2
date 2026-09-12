/**
 * Custom hook برای محاسبه شمارنده‌های منو
 * این hook به صورت هوشمند از داده‌های کش شده استفاده می‌کنه
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  calculatePendingOrdersCount,
  calculatePendingPaymentOrdersCount,
  calculatePendingTransactionsCount,
  calculateInternalChatsUnreadCount,
  calculateCartItemsCount,
  type CartItem,
} from "@/utils/counters";
import type { Order, Transaction, InternalChat } from "@shared/schema";

/**
 * نتیجه شمارنده‌های منو
 */
export interface MenuCounters {
  pendingOrdersCount: number;
  pendingPaymentOrdersCount: number;
  pendingTransactionsCount: number;
  internalChatsUnreadCount: number;
  cartItemsCount: number;
  isLoading: boolean;
}

/**
 * Hook برای محاسبه همه شمارنده‌های منو
 * این hook به صورت هوشمند از داده‌های موجود در React Query cache استفاده می‌کنه
 */
export function useMenuCounters(): MenuCounters {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Pending Orders Count (فقط برای level 1)
  const { data: orders } = useQuery<Order[]>({
    queryKey: ['/api/received-orders'],
    enabled: !!user && user.role === "user_level_1",
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // 4. Pending Transactions Count (فقط برای level 1)
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user && user.role === "user_level_1",
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // 5. Internal Chats Unread Count
  const { data: internalChats } = useQuery<InternalChat[]>({
    queryKey: ['/api/internal-chats'],
    enabled: !!user && user.role === "user_level_1",
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // 6. Cart Items Count
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return [];
        
        const response = await fetch("/api/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
    staleTime: 3000,
    refetchInterval: 3000,
  });

  const pendingOrdersCount = orders && user
    ? calculatePendingOrdersCount(orders, user.id) 
    : 0;

  const pendingPaymentOrdersCount = 0;

  const pendingTransactionsCount = transactions && user?.role === "user_level_1"
    ? calculatePendingTransactionsCount(transactions, [])
    : 0;

  const internalChatsUnreadCount = internalChats && user
    ? calculateInternalChatsUnreadCount(internalChats, user.id)
    : 0;

  const cartItemsCount = calculateCartItemsCount(cartItems);

  // بررسی وضعیت loading
  const isLoading = !user;

  return {
    pendingOrdersCount,
    pendingPaymentOrdersCount,
    pendingTransactionsCount,
    internalChatsUnreadCount,
    cartItemsCount,
    isLoading,
  };
}

/**
 * Hook ساده‌تر که فقط از API های counter استفاده می‌کنه (fallback)
 * این hook زمانی استفاده می‌شه که داده‌های کامل موجود نیستند
 */
export function useMenuCountersSimple(): MenuCounters {
  const { user } = useAuth();

  // 2. Pending Orders Count
  const { data: pendingOrdersData } = useQuery<{ pendingOrdersCount: number }>({
    queryKey: ['/api/orders/pending-orders-count'],
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 5000,
  });

  // 4. Pending Transactions Count
  const { data: pendingTransactionsData } = useQuery<{ pendingTransactionsCount: number }>({
    queryKey: ['/api/transactions/pending-count'],
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 5000,
  });

  // 5. Internal Chats Unread Count
  const { data: internalChatsData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/internal-chats/unread-count'],
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 5000,
  });

  // 6. Cart Items
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return [];
        
        const response = await fetch("/api/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
    refetchInterval: 3000,
  });

  return {
    pendingOrdersCount: pendingOrdersData?.pendingOrdersCount || 0,
    pendingPaymentOrdersCount: 0,
    pendingTransactionsCount: pendingTransactionsData?.pendingTransactionsCount || 0,
    internalChatsUnreadCount: internalChatsData?.unreadCount || 0,
    cartItemsCount: calculateCartItemsCount(cartItems),
    isLoading: !user,
  };
}
