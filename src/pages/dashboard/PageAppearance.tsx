import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/data";
import { useServers } from "@/lib/server-context";

interface Theme {
  theme_hiscores_accent: string;
  theme_hiscores_bg: string;
  theme_store_accent: string;
  theme_store_bg: string;
  theme_vote_accent: string;
  theme_vote_bg: string;
}

const DEFAULTS: Theme = {
  theme_hiscores_accent: "#f59e0b",
  theme_hiscores_bg: "#0f0f0f",
  theme_store_accent: "#22c55e",
  theme_store_bg: "#0a0a0f",
  theme_vote_accent: "#a855f7",
  theme_vote_bg: "#0f0f0f",
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm text-muted-foreground w-36 shrink-0">{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg border border-border cursor-pointer overflow-hidden relative shrink-0"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        <span className="font-mono text-sm text-muted-foreground uppercase">{value}</span>
      </div>
    </div>
  );
}

function PagePreview({ accent, bg, label }: { accent: string; bg: string; label: string }) {
  return (
    <div
      className="rounded-lg border border-border/50 p-4 text-white text-xs overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        <span className="font-semibold" style={{ color: accent }}>{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 rounded" style={{ backgroundColor: accent, width: "60%", opacity: 0.8 }} />
        <div className="h-2 rounded bg-white/10 w-full" />
        <div className="h-2 rounded bg-white/10 w-4/5" />
        <div className="h-2 rounded bg-white/10 w-3/5" />
      </div>
      <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded text-black text-[10px] font-bold" style={{ backgroundColor: accent }}>
        Preview
      </div>
    </div>
  );
}

const PageAppearance = () => {
  const { selectedServer } = useServers();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>({ ...DEFAULTS });

  useEffect(() => {
    if (selectedServer) loadTheme();
  }, [selectedServer]);

  const loadTheme = async () => {
    if (!selectedServer) return;
    setLoading(true);
    try {
      const data = await dataService.getServerTheme(selectedServer.id);
      if (data) {
        setTheme({
          theme_hiscores_accent: data.theme_hiscores_accent ?? DEFAULTS.theme_hiscores_accent,
          theme_hiscores_bg: data.theme_hiscores_bg ?? DEFAULTS.theme_hiscores_bg,
          theme_store_accent: data.theme_store_accent ?? DEFAULTS.theme_store_accent,
          theme_store_bg: data.theme_store_bg ?? DEFAULTS.theme_store_bg,
          theme_vote_accent: data.theme_vote_accent ?? DEFAULTS.theme_vote_accent,
          theme_vote_bg: data.theme_vote_bg ?? DEFAULTS.theme_vote_bg,
        });
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedServer) return;
    setSaving(true);
    try {
      await dataService.updateServerTheme(selectedServer.id, theme);
      toast.success("Page colours saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save colours");
    } finally {
      setSaving(false);
    }
  };

  const resetPage = (page: "hiscores" | "store" | "vote") => {
    if (page === "hiscores") {
      setTheme(t => ({ ...t, theme_hiscores_accent: DEFAULTS.theme_hiscores_accent, theme_hiscores_bg: DEFAULTS.theme_hiscores_bg }));
    } else if (page === "store") {
      setTheme(t => ({ ...t, theme_store_accent: DEFAULTS.theme_store_accent, theme_store_bg: DEFAULTS.theme_store_bg }));
    } else {
      setTheme(t => ({ ...t, theme_vote_accent: DEFAULTS.theme_vote_accent, theme_vote_bg: DEFAULTS.theme_vote_bg }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Page Appearance</h1>
        <p className="text-sm text-muted-foreground">Customise colours for your public pages</p>
      </div>

      {/* Hiscores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hiscores Page</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => resetPage("hiscores")} className="text-muted-foreground gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
            <div className="space-y-4">
              <ColorField
                label="Accent colour"
                value={theme.theme_hiscores_accent}
                onChange={(v) => setTheme(t => ({ ...t, theme_hiscores_accent: v }))}
              />
              <ColorField
                label="Background colour"
                value={theme.theme_hiscores_bg}
                onChange={(v) => setTheme(t => ({ ...t, theme_hiscores_bg: v }))}
              />
              {selectedServer && (
                <a
                  href={`/hiscores/${selectedServer.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View hiscores page →
                </a>
              )}
            </div>
            <PagePreview accent={theme.theme_hiscores_accent} bg={theme.theme_hiscores_bg} label="Hiscores" />
          </div>
        </CardContent>
      </Card>

      {/* Store */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Store Page</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => resetPage("store")} className="text-muted-foreground gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
            <div className="space-y-4">
              <ColorField
                label="Accent colour"
                value={theme.theme_store_accent}
                onChange={(v) => setTheme(t => ({ ...t, theme_store_accent: v }))}
              />
              <ColorField
                label="Background colour"
                value={theme.theme_store_bg}
                onChange={(v) => setTheme(t => ({ ...t, theme_store_bg: v }))}
              />
              {selectedServer && (
                <a
                  href={`/store/${selectedServer.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View store page →
                </a>
              )}
            </div>
            <PagePreview accent={theme.theme_store_accent} bg={theme.theme_store_bg} label="Store" />
          </div>
        </CardContent>
      </Card>

      {/* Vote */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vote Page</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => resetPage("vote")} className="text-muted-foreground gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
            <div className="space-y-4">
              <ColorField
                label="Accent colour"
                value={theme.theme_vote_accent}
                onChange={(v) => setTheme(t => ({ ...t, theme_vote_accent: v }))}
              />
              <ColorField
                label="Background colour"
                value={theme.theme_vote_bg}
                onChange={(v) => setTheme(t => ({ ...t, theme_vote_bg: v }))}
              />
            </div>
            <PagePreview accent={theme.theme_vote_accent} bg={theme.theme_vote_bg} label="Vote" />
          </div>
        </CardContent>
      </Card>

      <Button variant="hero" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save Colours
      </Button>
    </div>
  );
};

export default PageAppearance;
