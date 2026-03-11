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

  app.get(api.groups.get.path, isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.id);
    const group = await storage.getGroup(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const members = await storage.getGroupMembers(groupId);
    const expenses = await storage.getGroupExpenses(groupId);
    const balances = await storage.getGroupBalances(groupId);

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
