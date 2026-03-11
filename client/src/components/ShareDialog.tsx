import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle, Check } from "lucide-react";
import { UserPlus } from "lucide-react";

interface ShareDialogProps {
  groupId: number;
  groupName: string;
}

export function ShareDialog({ groupId, groupName }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/groups/${groupId}/join`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(`Join my group "${groupName}" on Hissa! ${shareUrl}`);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    window.location.href = `mailto:?subject=Join ${groupName} on Hissa&body=${encodeURIComponent(`Join my group "${groupName}" on Hissa!\n\n${shareUrl}`)}`;
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full shadow-sm hover:bg-secondary">
          <UserPlus className="w-4 h-4 mr-2 text-muted-foreground" /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Invite to {groupName}</DialogTitle>
          <DialogDescription>
            Share this group with others. Choose your preferred method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between gap-2">
            <code className="text-xs text-muted-foreground break-all flex-1">{shareUrl}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="rounded-lg flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <Button
            onClick={handleEmailShare}
            className="w-full rounded-full h-11 gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Mail className="w-4 h-4" /> Share via Email
          </Button>

          <Button
            onClick={handleWhatsAppShare}
            className="w-full rounded-full h-11 gap-2 bg-green-500 hover:bg-green-600 text-white"
          >
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full rounded-full h-11 gap-2"
          >
            <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
