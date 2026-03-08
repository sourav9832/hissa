import { db } from "./db";
import { 
  groups, groupMembers, expenses, expenseSplits, users,
  type Group, type GroupMember, type Expense, type ExpenseSplit, type User 
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Groups
  getGroupsForUser(userId: string): Promise<Group[]>;
  createGroup(name: string, userId: string): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupMembers(groupId: number): Promise<(GroupMember & { user: User })[]>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  
  // Expenses
  createExpense(
    groupId: number, 
    description: string, 
    amount: number, 
    paidByUserId: string,
    splits: { userId: string, amountOwed: number }[]
  ): Promise<Expense>;
  getGroupExpenses(groupId: number): Promise<(Expense & { splits: ExpenseSplit[] })[]>;
  getGroupBalances(groupId: number): Promise<{ userId: string; netBalance: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getGroupsForUser(userId: string): Promise<Group[]> {
    const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
    if (memberships.length === 0) return [];
    
    const groupIds = memberships.map(m => m.groupId);
    return await db.select().from(groups).where(inArray(groups.id, groupIds));
  }

  async createGroup(name: string, userId: string): Promise<Group> {
    const [group] = await db.insert(groups).values({ name }).returning();
    await db.insert(groupMembers).values({ groupId: group.id, userId });
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

  async createExpense(
    groupId: number, 
    description: string, 
    amount: number, 
    paidByUserId: string,
    splits: { userId: string, amountOwed: number }[]
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
      return expense;
    });
  }

  async getGroupExpenses(groupId: number): Promise<(Expense & { splits: ExpenseSplit[] })[]> {
    const groupExpenses = await db.select().from(expenses).where(eq(expenses.groupId, groupId));
    if (groupExpenses.length === 0) return [];

    const expenseIds = groupExpenses.map(e => e.id);
    const allSplits = await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds));

    return groupExpenses.map(expense => ({
      ...expense,
      splits: allSplits.filter(s => s.expenseId === expense.id)
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