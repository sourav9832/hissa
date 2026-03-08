import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateExpense } from "@/hooks/use-expenses";
import { GroupDetails } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Loader2, SplitSquareHorizontal, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required").regex(/^\d+$/, "Invalid amount format"),
  paidByUserId: z.string().min(1, "Please select who paid"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddExpenseDialog({ group }: { group: GroupDetails }) {
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const createExpense = useCreateExpense(group.group.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      paidByUserId: user?.id || "",
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      const file = files[0];
      if (['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
        setReceipt(file);
      } else {
        toast({ title: "Invalid file", description: "Please upload a JPG, PNG, WebP, or PDF file.", variant: "destructive" });
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!group.members.length) {
      toast({ title: "Error", description: "No members in this group to split with.", variant: "destructive" });
      return;
    }

    const amountInCents = parseInt(values.amount) * 100;
    if (amountInCents <= 0) {
      form.setError("amount", { message: "Amount must be greater than 0" });
      return;
    }

    // Default to equally split among all members
    const membersCount = group.members.length;
    const baseSplit = Math.floor(amountInCents / membersCount);
    let remainder = amountInCents % membersCount;

    const splits = group.members.map((member) => {
      let amountOwed = baseSplit;
      if (remainder > 0) {
        amountOwed += 1;
        remainder -= 1;
      }
      return {
        userId: member.userId,
        amountOwed,
      };
    });

    try {
      const expenseData: any = {
        description: values.description,
        amount: amountInCents,
        paidByUserId: values.paidByUserId,
        splits,
      };

      // Add receipt if provided
      if (receipt) {
        const reader = new FileReader();
        reader.onload = async () => {
          expenseData.receipt = {
            fileName: receipt.name,
            fileType: receipt.type,
            fileData: reader.result as string, // base64
          };
          await createExpense.mutateAsync(expenseData);
          toast({ title: "Expense added", description: "Successfully split among the group." });
          setOpen(false);
          form.reset();
          setReceipt(null);
        };
        reader.readAsDataURL(receipt);
      } else {
        await createExpense.mutateAsync(expenseData);
        toast({ title: "Expense added", description: "Successfully split among the group." });
        setOpen(false);
        form.reset();
      }
    } catch (error: any) {
      toast({ title: "Failed to add expense", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover-lift shadow-md font-semibold px-6 rounded-full gap-2">
          <Receipt className="w-4 h-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add an expense</DialogTitle>
          <DialogDescription>
            Record a new shared expense. It will be split equally among all members.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-semibold">What was this for?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dinner at Mario's" className="h-12 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Amount (₹)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                        <Input placeholder="0" type="number" step="1" className="h-12 pl-8 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-lg font-medium" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidByUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Paid by</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-secondary/50 border-0 focus:ring-1 focus:ring-primary rounded-xl">
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {group.members.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.userId === user?.id ? "You" : `${m.user?.firstName || 'Unknown'} ${m.user?.lastName || ''}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-primary/5 p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <SplitSquareHorizontal className="w-4 h-4" />
                <span>Split Strategy</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Currently, expenses are split <strong>equally</strong> among all {group.members.length} members of the group.
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-colors" 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{ backgroundColor: dragActive ? "var(--secondary)" : "transparent" }}
              onClick={() => fileInputRef.current?.click()}>
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setReceipt(file);
                }}
              />
              {receipt ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Upload className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground">{receipt.name}</p>
                      <p className="text-xs text-muted-foreground">{(receipt.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setReceipt(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Drag receipt or click to upload</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or PDF (optional)</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={createExpense.isPending} className="rounded-full px-8">
                {createExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Expense
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
