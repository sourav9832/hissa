import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildUrl } from "@shared/routes";

interface EditGroupDialogProps {
  groupId: number;
  groupName: string;
  currentImage?: string;
}

export function EditGroupDialog({ groupId, groupName, currentImage }: EditGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(groupName);
  const [imageData, setImageData] = useState<string | null>(currentImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(buildUrl('/api/groups/:id', { id: groupId }), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, imageData }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to update group');
      
      toast({ title: 'Group updated', description: 'Changes saved successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2">
          <Settings className="w-4 h-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit trip</DialogTitle>
          <DialogDescription>
            Update trip name or add/change the image.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-foreground">Trip Name</label>
            <Input
              id="name"
              placeholder="e.g. Ski Trip 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
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
            {imageData ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-secondary/50">
                <img src={imageData} alt="Trip preview" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageData(null)}
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading} className="rounded-full px-8">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
