import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Define local types for better DX since API returns z.any()
export interface Group {
  id: number;
  name: string;
  createdAt: string;
}

export interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
}

export interface GroupMember {
  id: number;
  userId: string;
  joinedAt: string;
  user?: UserInfo; 
}

export interface Expense {
  id: number;
  groupId: number;
  paidByUserId: string;
  description: string;
  amount: number;
  createdAt: string;
  paidBy?: UserInfo;
}

export interface GroupBalance {
  userId: string;
  netBalance: number;
}

export interface GroupDetails {
  group: Group;
  members: GroupMember[];
  expenses: Expense[];
  balances: GroupBalance[];
}

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });
}

export function useGroup(id: number) {
  return useQuery<GroupDetails>({
    queryKey: [api.groups.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.groups.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Group not found");
        throw new Error("Failed to fetch group");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch(api.groups.create.path, {
        method: api.groups.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.groups.join.path, { id });
      const res = await fetch(url, {
        method: api.groups.join.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to join group" }));
        throw new Error(error.message || "Failed to join group");
      }
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.groups.get.path, id] });
    },
  });
}
