import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Settings = () => {
  const handleSave = () => toast.success("Settings saved");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your account and platform preferences</p>
      </div>

      {/* Account */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-display font-semibold">Account</h3>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input defaultValue="owner@example.com" className="bg-muted border-border" />
        </div>
        <Button variant="outline" size="sm">Change Password</Button>
      </div>

      {/* Platform Fee */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-display font-semibold">Platform Fee</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Enable platform fee</p>
            <p className="text-xs text-muted-foreground">A percentage of each sale goes to the platform</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="space-y-2">
          <Label>Fee percentage</Label>
          <Input defaultValue="5" type="number" className="bg-muted border-border w-24" />
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
