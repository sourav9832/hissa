import { db } from "./db";
import { 
  groups, groupMembers, expenses, expenseSplits, receipts, users,
  type Group, type GroupMember, type Expense, type ExpenseSplit, type User, type Receipt
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Groups
  getGroupsForUser(userId: string): Promise<Group[]>;
  createGroup(name: string, userId: string, imageData?: string): Promise<Group>;
  updateGroup(id: number, name: string, imageData?: string | null): Promise<Group | undefined>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupMembers(groupId: number): Promise<(GroupMember & { user: User })[]>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  
  deleteGroup(groupId: number): Promise<void>;
  removeMember(groupId: number, userId: string): Promise<void>;
  
  // Expenses
  createExpense(
    groupId: number, 
    description: string, 
    amount: number, 
    paidByUserId: string,
    splits: { userId: string, amountOwed: number }[],
    receipt?: { fileName: string, fileType: string, fileData: string }
  ): Promise<Expense>;
  getGroupExpenses(groupId: number): Promise<(Expense & { splits: ExpenseSplit[], receipt?: Receipt })[]>;
  getGroupBalances(groupId: number): Promise<{ userId: string; netBalance: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getGroupsForUser(userId: string): Promise<Group[]> {
    const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
    if (memberships.length === 0) return [];
    
    const groupIds = memberships.map(m => m.groupId);
    return await db.select().from(groups).where(inArray(groups.id, groupIds));
  }

  async createGroup(name: string, userId: string, imageData?: string): Promise<Group> {
    const [group] = await db.insert(groups).values({ name, imageData }).returning();
    await db.insert(groupMembers).values({ groupId: group.id, userId });
    return group;
  }

  async updateGroup(id: number, name: string, imageData?: string | null): Promise<Group | undefined> {
    const [group] = await db.update(groups).set({ name, ...(imageData !== undefined && { imageData }) }).where(eq(groups.id, id)).returning();
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupMembers(groupId: number): Promise<(GroupMember & { user: User })[]> {
    const members = await db.select({
      member: groupMembers,
      user: users
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

    return members.map(({ member, user }) => ({ ...member, user }));
  }

  async joinGroup(groupId: number, userId: string): Promise<void> {
    // Check if already joined
    const existing = await db.select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    
    if (existing.length === 0) {
      await db.insert(groupMembers).values({ groupId, userId });
    }
  }

  async deleteGroup(groupId: number): Promise<void> {
    await db.transaction(async (tx) => {
      const groupExpenses = await tx.select().from(expenses).where(eq(expenses.groupId, groupId));
      if (groupExpenses.length > 0) {
        const expenseIds = groupExpenses.map(e => e.id);
        await tx.delete(receipts).where(inArray(receipts.expenseId, expenseIds));
        await tx.delete(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds));
        await tx.delete(expenses).where(eq(expenses.groupId, groupId));
      }
      await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
      await tx.delete(groups).where(eq(groups.id, groupId));
    });
  }

  async removeMember(groupId: number, userId: string): Promise<void> {
    await db.delete(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
  }

  async createExpense(
    groupId: number, 
    description: string, 
    amount: number, 
    paidByUserId: string,
    splits: { userId: string, amountOwed: number }[],
    receipt?: { fileName: string, fileType: string, fileData: string }
  ): Promise<Expense> {
    // Need a transaction for this
    return await db.transaction(async (tx) => {
      const [expense] = await tx.insert(expenses).values({
        groupId,
        description,
        amount,
        paidByUserId
      }).returning();

      if (splits.length > 0) {
        await tx.insert(expenseSplits).values(
          splits.map(s => ({
            expenseId: expense.id,
            userId: s.userId,
            amountOwed: s.amountOwed
          }))
        );
      }

      if (receipt) {
        await tx.insert(receipts).values({
          expenseId: expense.id,
          fileName: receipt.fileName,
          fileType: receipt.fileType,
          fileData: receipt.fileData
        });
      }

      return expense;
    });
  }

  async getGroupExpenses(groupId: number): Promise<(Expense & { splits: ExpenseSplit[], receipt?: Receipt })[]> {
    const groupExpenses = await db.select().from(expenses).where(eq(expenses.groupId, groupId));
    if (groupExpenses.length === 0) return [];

    const expenseIds = groupExpenses.map(e => e.id);
    const allSplits = await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds));
    const allReceipts = await db.select().from(receipts).where(inArray(receipts.expenseId, expenseIds));

    return groupExpenses.map(expense => ({
      ...expense,
      splits: allSplits.filter(s => s.expenseId === expense.id),
      receipt: allReceipts.find(r => r.expenseId === expense.id)
    }));
  }

  async getGroupBalances(groupId: number): Promise<{ userId: string; netBalance: number }[]> {
    const groupExpenses = await this.getGroupExpenses(groupId);
    const balances: Record<string, number> = {};

    for (const expense of groupExpenses) {
      // The person who paid gets a positive balance for the amount they paid
      balances[expense.paidByUserId] = (balances[expense.paidByUserId] || 0) + expense.amount;

      // Everyone who owes gets a negative balance for the amount they owe
      for (const split of expense.splits) {
        balances[split.userId] = (balances[split.userId] || 0) - split.amountOwed;
      }
    }

    return Object.entries(balances).map(([userId, netBalance]) => ({ userId, netBalance }));
  }
}

export const storage = new DatabaseStorage();