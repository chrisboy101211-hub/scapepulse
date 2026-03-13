import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { dataService } from "@/lib/data";

interface UserSettings {
  id: string;
  email: string;
  paypal_email: string | null;
  paypal_enabled: boolean;
  crypto_enabled: boolean;
}

const Settings = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [formData, setFormData] = useState({
    paypal_email: "",
    paypal_enabled: true,
    crypto_enabled: false,
  })

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await dataService.getUserSettings(user.id)
      if (data) {
        setSettings(data)
        setFormData({
          paypal_email: data.paypal_email || "",
          paypal_enabled: data.paypal_enabled ?? true,
          crypto_enabled: data.crypto_enabled ?? false,
        })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await dataService.updateUserSettings(user.id, {
        paypal_email: formData.paypal_email || null,
        paypal_enabled: formData.paypal_enabled,
        crypto_enabled: formData.crypto_enabled,
      })
      toast.success("Settings saved")
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
          <Input value={user?.email || ""} className="bg-muted border-border" disabled />
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
        <h3 className="font-display font-semibold">Payment Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">PayPal</p>
            <p className="text-xs text-muted-foreground">Accept PayPal payments</p>
          </div>
          <Switch 
            checked={formData.paypal_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, paypal_enabled: checked })}
          />
        </div>
        {formData.paypal_enabled && (
          <div className="space-y-2">
            <Label>PayPal Email</Label>
            <Input 
              placeholder="paypal@example.com" 
              className="bg-muted border-border"
              value={formData.paypal_email}
              onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Cryptocurrency</p>
            <p className="text-xs text-muted-foreground">Accept crypto payments</p>
          </div>
          <Switch 
            checked={formData.crypto_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, crypto_enabled: checked })}
          />
        </div>
      </div>

      <Button variant="hero" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save Settings
      </Button>
    </div>
  );
};

export default Settings;
