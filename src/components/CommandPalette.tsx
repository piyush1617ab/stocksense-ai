import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookOpen, Home, MessageCircle, TrendingUp, User as UserIcon, Wallet, Star } from "lucide-react";
import { popularStocks } from "@/data/dummyData";
import { useAuth } from "@/context/AuthContext";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <Command className="rounded-lg">
          <CommandInput placeholder="Search stocks, pages, lessons…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem onSelect={() => go("/")}>
                <Home className="mr-2 h-4 w-4" /> Home
              </CommandItem>
              <CommandItem onSelect={() => go("/learn")}>
                <BookOpen className="mr-2 h-4 w-4" /> Learn
              </CommandItem>
              <CommandItem onSelect={() => go("/chatbot")}>
                <MessageCircle className="mr-2 h-4 w-4" /> AI Chatbot
              </CommandItem>
              <CommandItem onSelect={() => go("/watchlist")}>
                <Star className="mr-2 h-4 w-4" /> Watchlist
              </CommandItem>
              {user && (
                <>
                  <CommandItem onSelect={() => go("/portfolio")}>
                    <Wallet className="mr-2 h-4 w-4" /> Portfolio
                  </CommandItem>
                  <CommandItem onSelect={() => go("/profile")}>
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </CommandItem>
                </>
              )}
            </CommandGroup>
            <CommandGroup heading="Stocks">
              {popularStocks.map((s) => (
                <CommandItem key={s.symbol} value={`${s.symbol} ${s.name}`} onSelect={() => go(`/stock/${s.symbol}`)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span className="font-medium">{s.symbol}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{s.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
