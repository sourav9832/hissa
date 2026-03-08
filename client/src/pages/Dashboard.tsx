import { useState } from "react";
import { Link } from "wouter";
import { useGroups, useCreateGroup } from "@/hooks/use-groups";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const [newGroupName, setNewGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    await createGroup.mutateAsync({ name: newGroupName });
    setNewGroupName("");
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-secondary/20 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Your Groups</h1>
            <p className="text-muted-foreground mt-1">Manage all your shared expenses here.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-sm hover-lift pl-4 pr-5 gap-2">
                <Plus className="w-5 h-5" /> New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create a group</DialogTitle>
                <DialogDescription>
                  Start a new group to track expenses with friends.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-foreground">Group Name</label>
                  <Input 
                    id="name"
                    placeholder="e.g. Ski Trip 2024" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-12 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={!newGroupName.trim() || createGroup.isPending}>
                  {createGroup.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Create Group
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-3xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : !groups?.length ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-background rounded-3xl border border-dashed border-border">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">No groups yet</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Create a group to start tracking shared expenses with your friends, family, or housemates.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-full px-8 hover-lift">
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="group block outline-none">
                <div className="bg-background rounded-3xl p-6 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                  {/* Decorative corner */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
                    <Users className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-1 relative z-10 group-hover:text-primary transition-colors line-clamp-1">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 relative z-10">
                    Created {format(new Date(group.createdAt), 'MMM d, yyyy')}
                  </p>
                  
                  <div className="mt-auto flex items-center text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors relative z-10">
                    View details <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
