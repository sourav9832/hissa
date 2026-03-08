import { useParams } from "wouter";
import { useGroup } from "@/hooks/use-groups";
import { Navbar } from "@/components/layout/Navbar";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { formatCurrency, getInitials, cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Receipt, Users, AlertCircle, ArrowLeft, TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function GroupDetail() {
  const params = useParams();
  const groupId = parseInt(params.id || "0", 10);
  const { data, isLoading, error } = useGroup(groupId);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/20 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-secondary/20 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Group not found</h2>
          <Button asChild variant="outline" className="mt-4"><Link href="/">Go to Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const { group, members, expenses, balances } = data;

  return (
    <div className="min-h-screen bg-secondary/20 flex flex-col pb-20">
      <Navbar />
      
      {/* Header Area */}
      <div className="bg-background border-b border-border/50">
        <div className="container mx-auto px-4 max-w-4xl pt-8 pb-6">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{group.name}</h1>
              </div>
              <p className="text-muted-foreground">
                {members.length} members • Created {format(new Date(group.createdAt), 'MMMM yyyy')}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ShareDialog groupId={groupId} groupName={group.name} />
              <AddExpenseDialog group={data} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 max-w-4xl mt-8">
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 p-1 bg-background/50 border border-border/50 rounded-2xl mb-8">
            <TabsTrigger value="expenses" className="rounded-xl font-medium">Expenses</TabsTrigger>
            <TabsTrigger value="balances" className="rounded-xl font-medium">Balances</TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl font-medium">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            {expenses.length === 0 ? (
              <div className="bg-background rounded-3xl p-12 text-center border border-dashed border-border flex flex-col items-center">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No expenses yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">No one has added any expenses to this group. Add one to start tracking!</p>
                <AddExpenseDialog group={data} />
              </div>
            ) : (
              <div className="bg-background rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                <div className="divide-y divide-border/50">
                  {expenses.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((expense) => {
                    const paidByMe = expense.paidByUserId === user?.id;
                    const payer = members.find(m => m.userId === expense.paidByUserId)?.user;
                    const payerName = paidByMe ? "You" : (payer?.firstName || payer?.email || "Someone");
                    
                    return (
                      <div key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-secondary/50 rounded-xl text-muted-foreground">
                            <span className="text-xs font-bold uppercase">{format(new Date(expense.createdAt), 'MMM')}</span>
                            <span className="text-lg font-display text-foreground leading-none">{format(new Date(expense.createdAt), 'd')}</span>
                          </div>
                          
                          <div>
                            <p className="font-semibold text-foreground text-lg mb-0.5">{expense.description}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{payerName}</span> paid {formatCurrency(expense.amount)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-display font-bold text-lg">{formatCurrency(expense.amount)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="balances" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="bg-background rounded-3xl border border-border/50 shadow-sm p-4 sm:p-6">
              <h3 className="text-xl font-display font-bold mb-6">Who owes what?</h3>
              
              {!balances || balances.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Balances are settled or no expenses exist.</p>
              ) : (
                <div className="space-y-4">
                  {balances.map((balance) => {
                    const member = members.find(m => m.userId === balance.userId)?.user;
                    const name = balance.userId === user?.id ? "You" : (member?.firstName ? `${member.firstName} ${member.lastName || ''}` : member?.email || 'Unknown');
                    const isOwed = balance.netBalance > 0;
                    const owes = balance.netBalance < 0;
                    const settled = balance.netBalance === 0;

                    return (
                      <div key={balance.userId} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarImage src={member?.profileImageUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-lg">{name}</span>
                        </div>
                        
                        <div className="text-right flex items-center gap-2">
                          {isOwed && (
                            <>
                              <div className="text-left">
                                <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider block">Gets back</span>
                                <span className="font-display font-bold text-emerald-600 text-lg">{formatCurrency(balance.netBalance)}</span>
                              </div>
                              <TrendingUp className="w-5 h-5 text-emerald-600 opacity-50" />
                            </>
                          )}
                          {owes && (
                            <>
                              <div className="text-left">
                                <span className="text-xs font-medium text-destructive uppercase tracking-wider block">Owes</span>
                                <span className="font-display font-bold text-destructive text-lg">{formatCurrency(Math.abs(balance.netBalance))}</span>
                              </div>
                              <TrendingDown className="w-5 h-5 text-destructive opacity-50" />
                            </>
                          )}
                          {settled && (
                            <>
                              <span className="font-medium text-muted-foreground">Settled up</span>
                              <CheckCircle2 className="w-5 h-5 text-muted-foreground opacity-50" />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="focus-visible:outline-none focus-visible:ring-0">
             <div className="bg-background rounded-3xl border border-border/50 shadow-sm p-4 sm:p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-display font-bold">Group Members</h3>
                 <ShareDialog groupId={groupId} groupName={group.name} />
               </div>
               
               <div className="grid sm:grid-cols-2 gap-4">
                 {members.map(m => {
                   const isMe = m.userId === user?.id;
                   const name = m.user?.firstName ? `${m.user.firstName} ${m.user.lastName || ''}` : m.user?.email || 'Unknown User';
                   
                   return (
                     <div key={m.id} className="flex items-center gap-4 p-3 rounded-2xl border border-border/40 bg-secondary/10">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={m.user?.profileImageUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{name} {isMe && <span className="text-muted-foreground text-sm font-normal ml-1">(You)</span>}</p>
                          <p className="text-xs text-muted-foreground">Joined {format(new Date(m.joinedAt), 'MMM d, yyyy')}</p>
                        </div>
                     </div>
                   )
                 })}
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
