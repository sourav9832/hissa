import { useParams, useLocation } from "wouter";
import { useGroup, useJoinGroup } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, Loader2, Mountain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function JoinGroup() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const groupId = parseInt(params.id || "0", 10);
  const { data, isLoading, error } = useGroup(groupId);
  const joinGroup = useJoinGroup();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoin = async () => {
    try {
      await joinGroup.mutateAsync(groupId);
      toast({ title: "Joined successfully", description: "You are now a member of this group." });
      setLocation(`/groups/${groupId}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Group not found</h2>
          <p className="text-muted-foreground max-w-md mb-6">This invite link might be invalid or the group has been deleted.</p>
          <Button asChild className="rounded-full"><Link href="/">Go home</Link></Button>
        </div>
      </div>
    );
  }

  const isAlreadyMember = data.members.some(m => m.userId === user?.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-8 text-center relative overflow-hidden">
          {data.group.imageData ? (
            <div className="absolute top-0 left-0 w-full h-40 overflow-hidden">
              <img src={data.group.imageData} alt={data.group.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-background" />
            </div>
          ) : (
            <div className="absolute top-0 left-0 w-full h-40 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-blue-500/10 to-cyan-500/20 flex items-center justify-center">
                <Mountain className="w-16 h-16 text-primary/30" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
            </div>
          )}
          
          <div className="w-20 h-20 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 mt-20">
            <Users className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-3xl font-display font-bold mb-2 relative z-10">{data.group.name}</h1>
          <p className="text-muted-foreground mb-8 relative z-10">
            You've been invited to join this group. They currently have {data.members.length} member{data.members.length !== 1 ? 's' : ''}.
          </p>

          <div className="relative z-10">
            {isAlreadyMember ? (
              <div className="space-y-4">
                <div className="bg-secondary/50 text-foreground font-medium py-3 rounded-xl">
                  You are already a member!
                </div>
                <Button asChild className="w-full h-12 rounded-xl text-lg hover-lift">
                  <Link href={`/groups/${groupId}`}>View Group</Link>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleJoin} 
                disabled={joinGroup.isPending}
                className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover-lift"
              >
                {joinGroup.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Accept Invite & Join
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
