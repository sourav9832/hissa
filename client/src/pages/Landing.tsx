import { Button } from "@/components/ui/button";
import { ArrowRight, Users, ArrowRightLeft, ShieldCheck, Receipt } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import landingImage from "@assets/hissa-landing_1772987072753.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  The #1 app for splitting bills
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                  Kitna tera? <br/>
                  <span className="text-gradient">Kitna mera?</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                  Keep track of shared expenses and balances with housemates, trips, groups, friends, and family. Settle up seamlessly.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                  <Button size="lg" className="rounded-full text-base px-8 h-14 hover-lift shadow-lg shadow-primary/25" asChild>
                    <a href="/api/login">
                      Get Started <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pl-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Free forever, no credit card.
                  </div>
                </div>
              </div>
              
              <div className="relative lg:ml-auto animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <img src={landingImage} alt="Hissa App" className="w-full max-w-md mx-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Everything you need to stay organized</h2>
              <p className="text-muted-foreground text-lg">Focus on the fun stuff. We'll handle the math.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-3xl border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Group Expenses</h3>
                <p className="text-muted-foreground leading-relaxed">Create groups for trips, apartments, or events. Add everyone and start tracking instantly.</p>
              </div>
              
              <div className="bg-background p-8 rounded-3xl border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Easy Splitting</h3>
                <p className="text-muted-foreground leading-relaxed">Add a receipt, enter the total, and we'll calculate exactly who owes what down to the cent.</p>
              </div>
              
              <div className="bg-background p-8 rounded-3xl border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Clear Balances</h3>
                <p className="text-muted-foreground leading-relaxed">Always know exactly where you stand. Our dashboard shows a simple summary of who owes who.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-border/50 bg-background text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Hissa. Kitna tera? Kitna mera?</p>
      </footer>
    </div>
  );
}
