import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, ArrowRight, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const MAIN_DOMAIN = "scapepulse.com";

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
};

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = generateSlug(serverName);
  const subdomain = slug ? `${slug}.${MAIN_DOMAIN}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!serverName.trim()) {
      toast.error("Please enter your server name");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (slug.length < 3) {
      toast.error("Server name must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      const { data: existingServer } = await supabase
        .from("servers")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingServer) {
        toast.error("This server name is already taken");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          email,
        });
        if (userError) console.error("User insert error:", userError);

        const { error: serverError } = await supabase.from("servers").insert({
          id: `srv-${Date.now()}`,
          name: serverName,
          slug: slug,
          game_type: "rsps",
          description: `Welcome to ${serverName}`,
          subdomain: subdomain,
          api_key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
          status: "online",
          players_online: 0,
          user_id: authData.user.id,
        });

        if (serverError) throw serverError;
      }

      toast.success("Account created! Check your email to verify.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute right-1/3 top-1/3 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">
              Game<span className="text-primary">Store</span>
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start monetizing your game server</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-card border-border" />
          </div>
          
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-sm text-muted-foreground mb-3">Your first server (required)</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serverName">Server Name</Label>
            <Input id="serverName" placeholder="My Awesome Server" value={serverName} onChange={(e) => setServerName(e.target.value)} className="bg-card border-border" />
          </div>
          
          {serverName && (
            <div className="space-y-2">
              <Label>Your Store URL (auto-generated)</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{subdomain || "..."}</span>
              </div>
            </div>
          )}
          
          <Button type="submit" variant="hero" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
