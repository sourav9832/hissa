import { useState, useRef } from "react";
import { Link } from "wouter";
import { useGroups, useCreateGroup } from "@/hooks/use-groups";
import { Navbar } from "@/components/layout/Navbar";
import { EditGroupDialog } from "@/components/EditGroupDialog";
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
import { Users, Plus, Loader2, ArrowRight, Upload, X, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-cyan-500', 'bg-red-500', 'bg-indigo-500'];

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > 600) {
          height = Math.round((height * 600) / width);
          width = 600;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

export default function Dashboard() {
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const [newGroupName, setNewGroupName] = useState("");
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const compressed = await compressImage(file);
      setGroupImage(compressed);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    await createGroup.mutateAsync({ name: newGroupName, imageData: groupImage || undefined });
    setNewGroupName("");
    setGroupImage(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Your Trips</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage all your shared expenses here.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-sm hover-lift pl-4 pr-5 gap-2">
                <Plus className="w-5 h-5" /> New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create a trip</DialogTitle>
                <DialogDescription>
                  Start a new trip to track expenses with friends.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-foreground">Trip Name</label>
                  <Input 
                    id="name"
                    placeholder="e.g. Ski Trip 2024" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-12 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Trip Image (Optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {groupImage ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-secondary/50">
                      <img src={groupImage} alt="Trip preview" className="w-full h-32 object-cover" />
                      <button
                        type="button"
                        onClick={() => setGroupImage(null)}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-border rounded-xl text-center hover:border-primary/50 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload an image</span>
                    </button>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={!newGroupName.trim() || createGroup.isPending}>
                  {createGroup.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Create Trip
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => {
              const initials = group.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
              return (
                <Link key={group.id} href={`/groups/${group.id}`} className="group block outline-none">
                  <div className={`rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative h-56 flex flex-col ${
                    group.imageData ? '' : `${COLORS[idx % COLORS.length]}`
                  }`}>
                    {/* Background image or color */}
                    {group.imageData && (
                      <img
                        src={group.imageData}
                        alt={group.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                    
                    {/* Content */}
                    <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                      <div className="flex items-start justify-between">
                        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <span className="text-lg sm:text-xl font-bold text-white">{initials}</span>
                        </div>
                        {!group.isCreator && (
                          <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Invited
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-2">{group.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-white/80 text-xs sm:text-sm">
                          {(group.totalExpenses ?? 0) > 0 ? (
                            <>
                              <span>Total: {formatCurrency(group.totalExpenses!)}</span>
                              <span>You paid: {formatCurrency(group.yourContribution ?? 0)}</span>
                            </>
                          ) : (
                            <span>No expenses yet</span>
                          )}
                        </div>
                      </div>

                      <Button className="rounded-full hover-lift gap-2 w-full">
                        Manage <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
