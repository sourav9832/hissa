import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get(api.groups.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const groups = await storage.getGroupsForUser(userId);
    res.json(groups);
  });

  app.post(api.groups.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const { name, imageData } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const group = await storage.createGroup(name, userId, imageData);
    res.status(201).json(group);
  });

  app.patch(api.groups.get.path, isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.id);
    const userId = req.user.id;
    const { name, imageData } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.userId === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await storage.updateGroup(groupId, name, imageData);
    res.json(updated);
  });

  app.get("/api/groups/:id/preview", async (req: any, res) => {
    const groupId = Number(req.params.id);
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const members = await storage.getGroupMembers(groupId);
    res.json({
      group: { id: group.id, name: group.name, imageData: group.imageData, createdAt: group.createdAt },
      members: members.map(m => ({ id: m.id, userId: m.userId, joinedAt: m.joinedAt })),
    });
  });

  app.get(api.groups.get.path, isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.id);
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const members = await storage.getGroupMembers(groupId);
    const rawExpenses = await storage.getGroupExpenses(groupId);
    const balances = await storage.getGroupBalances(groupId);

    const expenses = rawExpenses.map(e => ({
      ...e,
      receipt: e.receipt ? { id: e.receipt.id, fileName: e.receipt.fileName, fileType: e.receipt.fileType } : undefined,
    }));

    res.json({
      group,
      members,
      expenses,
      balances
    });
  });

  app.post(api.groups.join.path, isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.id);
    const userId = req.user.id;
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await storage.joinGroup(groupId, userId);
    res.json({ message: "Joined successfully" });
  });

  app.delete("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.id);
    const userId = req.user.id;

    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const members = await storage.getGroupMembers(groupId);
    const sorted = [...members].sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    if (sorted.length === 0 || sorted[0].userId !== userId) {
      return res.status(403).json({ message: "Only the trip creator can delete this group" });
    }

    await storage.deleteGroup(groupId);
    res.json({ message: "Group deleted" });
  });

  app.delete("/api/groups/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.id);
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const members = await storage.getGroupMembers(groupId);
    const sorted = [...members].sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    const isCreator = sorted.length > 0 && sorted[0].userId === currentUserId;

    if (!isCreator && targetUserId !== currentUserId) {
      return res.status(403).json({ message: "Only the trip creator can remove members" });
    }

    if (isCreator && targetUserId === currentUserId) {
      return res.status(400).json({ message: "Creator cannot leave the group. Delete the group instead." });
    }

    await storage.removeMember(groupId, targetUserId);
    res.json({ message: "Member removed" });
  });

  app.get("/api/groups/:groupId/expenses/:expenseId/receipt", isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.groupId);
    const expenseId = Number(req.params.expenseId);
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.userId === req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const expenseList = await storage.getGroupExpenses(groupId);
    const expense = expenseList.find(e => e.id === expenseId);
    if (!expense || !expense.receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }
    const receipt = expense.receipt;
    const buffer = Buffer.from(receipt.fileData, "base64");
    res.setHeader("Content-Type", receipt.fileType);
    res.setHeader("Content-Disposition", `inline; filename="${receipt.fileName}"`);
    res.send(buffer);
  });

  app.post(api.expenses.create.path, isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.groupId);
    const { description, amount, paidByUserId, splits, receipt } = req.body;
    
    if (!description || typeof amount !== 'number' || !paidByUserId || !splits) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const expense = await storage.createExpense(groupId, description, amount, paidByUserId, splits, receipt);
    res.status(201).json(expense);
  });

  return httpServer;
}
