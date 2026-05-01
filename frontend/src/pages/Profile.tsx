import { useState } from "react";
import { User as UserIcon, Save, LogOut, Bell, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth, RiskAppetite } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SECTORS = ["Technology", "Banking", "Energy", "FMCG", "Pharma", "Auto", "Metals", "Telecom"];

const Profile = () => {
  const { user, updateProfile, updatePreferences, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  if (!user) return null;

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const toggleSector = (sector: string) => {
    const current = user.preferences.preferredSectors;
    const next = current.includes(sector) ? current.filter((s) => s !== sector) : [...current, sector];
    updatePreferences({ preferredSectors: next });
  };

  const onLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Profile info */}
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>
          <form onSubmit={onSaveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                <Save className="h-4 w-4" />
                Save changes
              </button>
            </div>
          </form>
        </section>

        {/* Personalization */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Investment Preferences</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            We use these to personalize stock suggestions and AI explanations.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground">Risk appetite</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as RiskAppetite[]).map((r) => {
                  const active = user.preferences.riskAppetite === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updatePreferences({ riskAppetite: r })}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Preferred sectors</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SECTORS.map((s) => {
                  const active = user.preferences.preferredSectors.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSector(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email notifications</p>
                  <p className="text-xs text-muted-foreground">Get alerts on watchlist movements and AI insights.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={user.preferences.notificationsEnabled}
                onClick={() => updatePreferences({ notificationsEnabled: !user.preferences.notificationsEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  user.preferences.notificationsEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-card shadow transition ${
                    user.preferences.notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
};

export default Profile;
