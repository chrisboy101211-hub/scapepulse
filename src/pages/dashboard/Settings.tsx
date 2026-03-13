import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const Settings = () => {
  const { user } = useAuth()
  
  const handleSave = () => toast.success("Settings saved");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your account and payment settings</p>
      </div>

      {/* Account */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-display font-semibold">Account</h3>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input defaultValue={user?.email || ""} className="bg-muted border-border" disabled />
        </div>
        <p className="text-xs text-muted-foreground">Contact support to change your email</p>
      </div>

      {/* Platform Fee Notice */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-display font-semibold">Platform Fee</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Platform fee (5%)</p>
            <p className="text-xs text-muted-foreground">A 5% fee is applied to all sales to maintain the platform</p>
          </div>
          <span className="text-lg font-bold text-neon-green">5%</span>
        </div>
      </div>

      {/* Payment */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-display font-semibold">Payment Methods</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">PayPal</p>
            <p className="text-xs text-muted-foreground">Accept PayPal payments</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="space-y-2">
          <Label>PayPal Email</Label>
          <Input placeholder="paypal@example.com" className="bg-muted border-border" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Cryptocurrency</p>
            <p className="text-xs text-muted-foreground">Accept crypto payments</p>
          </div>
          <Switch />
        </div>
      </div>

      <Button variant="hero" onClick={handleSave}>Save Settings</Button>
    </div>
  );
};

export default Settings;
