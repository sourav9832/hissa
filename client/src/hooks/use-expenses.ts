import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export interface CreateExpensePayload {
  description: string;
  amount: number; // in cents
  paidByUserId: string;
  splits: {
    userId: string;
    amountOwed: number; // in cents
  }[];
}

export function useCreateExpense(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpensePayload) => {
      const url = buildUrl(api.expenses.create.path, { groupId });
      const res = await fetch(url, {
        method: api.expenses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create expense" }));
        throw new Error(error.message || "Failed to create expense");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the group details query so expenses and balances refresh
      queryClient.invalidateQueries({ queryKey: [api.groups.get.path, groupId] });
    },
  });
}
