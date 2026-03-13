import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { dataService } from "@/lib/data";
import { useServers } from "@/lib/server-context";

interface GameMode {
  id: string;
  name: string;
  display_name: string;
  is_default: boolean;
  enabled: boolean;
}

interface XpMode {
  id: string;
  name: string;
  display_name: string;
  xp_multiplier: number;
  is_default: boolean;
  enabled: boolean;
}

interface Skill {
  id: string;
  name: string;
  display_name: string;
  icon_url: string;
  ordinal: number;
  enabled: boolean;
}

const HiscoresSettings = () => {
  const { selectedServer } = useServers();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hiscoresEnabled, setHiscoresEnabled] = useState(false);
  
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const [xpModes, setXpModes] = useState<XpMode[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  
  const [newGameMode, setNewGameMode] = useState({ name: "", display_name: "" });
  const [newXpMode, setNewXpMode] = useState({ name: "", display_name: "", xp_multiplier: "1" });
  const [newSkill, setNewSkill] = useState({ name: "", display_name: "", icon_url: "", ordinal: 0 });

  useEffect(() => {
    if (selectedServer) {
      loadData();
    }
  }, [selectedServer]);

  const loadData = async () => {
    if (!selectedServer) return;
    setLoading(true);
    try {
      setHiscoresEnabled(selectedServer.hiscores_enabled || false);
      const [gmData, xmData, skData] = await Promise.all([
        dataService.getHiscoresGameModes(selectedServer.id),
        dataService.getHiscoresXpModes(selectedServer.id),
        dataService.getHiscoresSkills(selectedServer.id),
      ]);
      setGameModes(gmData);
      setXpModes(xmData);
      setSkills(skData);
    } catch (error) {
      console.error("Failed to load hiscores data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHiscores = async (enabled: boolean) => {
    if (!selectedServer) return;
    try {
      await dataService.toggleServerHiscores(selectedServer.id, enabled);
      
      if (enabled) {
        await dataService.seedHiscoresDefaults(selectedServer.id);
        const [gmData, xmData, skData] = await Promise.all([
          dataService.getHiscoresGameModes(selectedServer.id),
          dataService.getHiscoresXpModes(selectedServer.id),
          dataService.getHiscoresSkills(selectedServer.id),
        ]);
        setGameModes(gmData);
        setXpModes(xmData);
        setSkills(skData);
      }
      
      setHiscoresEnabled(enabled);
      toast.success(enabled ? "Hiscores enabled with default settings" : "Hiscores disabled");
    } catch (error) {
      toast.error("Failed to toggle hiscores");
    }
  };

  const handleAddGameMode = async () => {
    if (!selectedServer || !newGameMode.name || !newGameMode.display_name) return;
    try {
      const mode = await dataService.createHiscoresGameMode({
        server_id: selectedServer.id,
        name: newGameMode.name.toUpperCase().replace(/\s+/g, "_"),
        display_name: newGameMode.display_name,
      });
      setGameModes([...gameModes, mode]);
      setNewGameMode({ name: "", display_name: "" });
      toast.success("Game mode added");
    } catch (error) {
      toast.error("Failed to add game mode");
    }
  };

  const handleToggleGameMode = async (id: string, enabled: boolean) => {
    try {
      await dataService.updateHiscoresGameMode(id, { enabled });
      setGameModes(gameModes.map(gm => gm.id === id ? { ...gm, enabled } : gm));
    } catch (error) {
      toast.error("Failed to update game mode");
    }
  };

  const handleDeleteGameMode = async (id: string) => {
    try {
      await dataService.deleteHiscoresGameMode(id);
      setGameModes(gameModes.filter(gm => gm.id !== id));
      toast.success("Game mode deleted");
    } catch (error) {
      toast.error("Failed to delete game mode");
    }
  };

  const handleAddXpMode = async () => {
    if (!selectedServer || !newXpMode.name || !newXpMode.display_name) return;
    try {
      const mode = await dataService.createHiscoresXpMode({
        server_id: selectedServer.id,
        name: newXpMode.name.toUpperCase().replace(/\s+/g, "_"),
        display_name: newXpMode.display_name,
        xp_multiplier: parseFloat(newXpMode.xp_multiplier) || 1,
      });
      setXpModes([...xpModes, mode]);
      setNewXpMode({ name: "", display_name: "", xp_multiplier: "1" });
      toast.success("XP mode added");
    } catch (error) {
      toast.error("Failed to add XP mode");
    }
  };

  const handleToggleXpMode = async (id: string, enabled: boolean) => {
    try {
      await dataService.updateHiscoresXpMode(id, { enabled });
      setXpModes(xpModes.map(xm => xm.id === id ? { ...xm, enabled } : xm));
    } catch (error) {
      toast.error("Failed to update XP mode");
    }
  };

  const handleDeleteXpMode = async (id: string) => {
    try {
      await dataService.deleteHiscoresXpMode(id);
      setXpModes(xpModes.filter(xm => xm.id !== id));
      toast.success("XP mode deleted");
    } catch (error) {
      toast.error("Failed to delete XP mode");
    }
  };

  const handleAddSkill = async () => {
    if (!selectedServer || !newSkill.name || !newSkill.display_name) return;
    try {
      const skill = await dataService.createHiscoresSkill({
        server_id: selectedServer.id,
        name: newSkill.name.toLowerCase().replace(/\s+/g, "_"),
        display_name: newSkill.display_name,
        icon_url: newSkill.icon_url || null,
        ordinal: newSkill.ordinal || skills.length + 1,
      });
      setSkills([...skills, skill]);
      setNewSkill({ name: "", display_name: "", icon_url: "", ordinal: 0 });
      toast.success("Skill added");
    } catch (error) {
      toast.error("Failed to add skill");
    }
  };

  const handleToggleSkill = async (id: string, enabled: boolean) => {
    try {
      await dataService.updateHiscoresSkill(id, { enabled });
      setSkills(skills.map(sk => sk.id === id ? { ...sk, enabled } : sk));
    } catch (error) {
      toast.error("Failed to update skill");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await dataService.deleteHiscoresSkill(id);
      setSkills(skills.filter(sk => sk.id !== id));
      toast.success("Skill deleted");
    } catch (error) {
      toast.error("Failed to delete skill");
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hiscores Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your server's hiscores system</p>
      </div>

      {/* Enable/Disable Hiscores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Hiscores System</span>
            <Switch
              checked={hiscoresEnabled}
              onCheckedChange={handleToggleHiscores}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hiscoresEnabled 
              ? "Hiscores are currently enabled and visible to players."
              : "Enable hiscores to let players view their stats on your server."}
          </p>
          {hiscoresEnabled && (
            <a 
              href={`/hiscores/${selectedServer?.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              View hiscores page →
            </a>
          )}
        </CardContent>
      </Card>

      {hiscoresEnabled && (
        <Tabs defaultValue="game-modes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="game-modes">Game Modes ({gameModes.length})</TabsTrigger>
            <TabsTrigger value="xp-modes">XP Modes ({xpModes.length})</TabsTrigger>
            <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="game-modes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Game Modes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameModes.map((mode) => (
                  <div key={mode.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mode.display_name}</p>
                        <p className="text-xs text-muted-foreground">{mode.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={mode.enabled}
                        onCheckedChange={(enabled) => handleToggleGameMode(mode.id, enabled)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGameMode(mode.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Name (e.g., IRONMAN)"
                    value={newGameMode.name}
                    onChange={(e) => setNewGameMode({ ...newGameMode, name: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Input
                    placeholder="Display Name (e.g., Ironman)"
                    value={newGameMode.display_name}
                    onChange={(e) => setNewGameMode({ ...newGameMode, display_name: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Button variant="hero" onClick={handleAddGameMode}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xp-modes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>XP Modes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {xpModes.map((mode) => (
                  <div key={mode.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mode.display_name}</p>
                        <p className="text-xs text-muted-foreground">{mode.xp_multiplier}x XP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={mode.enabled}
                        onCheckedChange={(enabled) => handleToggleXpMode(mode.id, enabled)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteXpMode(mode.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Name (e.g., 10X)"
                    value={newXpMode.name}
                    onChange={(e) => setNewXpMode({ ...newXpMode, name: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Input
                    placeholder="Display Name (e.g., 10x XP)"
                    value={newXpMode.display_name}
                    onChange={(e) => setNewXpMode({ ...newXpMode, display_name: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Input
                    placeholder="Multiplier"
                    type="number"
                    value={newXpMode.xp_multiplier}
                    onChange={(e) => setNewXpMode({ ...newXpMode, xp_multiplier: e.target.value })}
                    className="bg-muted border-border w-24"
                  />
                  <Button variant="hero" onClick={handleAddXpMode}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {skill.icon_url ? (
                        <img src={skill.icon_url} alt={skill.display_name} className="w-6 h-6" />
                      ) : (
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{skill.display_name}</p>
                        <p className="text-xs text-muted-foreground">{skill.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={skill.enabled}
                        onCheckedChange={(enabled) => handleToggleSkill(skill.id, enabled)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSkill(skill.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Name (e.g., smithing)"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Input
                    placeholder="Display Name (e.g., Smithing)"
                    value={newSkill.display_name}
                    onChange={(e) => setNewSkill({ ...newSkill, display_name: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Input
                    placeholder="Icon URL (optional)"
                    value={newSkill.icon_url}
                    onChange={(e) => setNewSkill({ ...newSkill, icon_url: e.target.value })}
                    className="bg-muted border-border"
                  />
                  <Button variant="hero" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default HiscoresSettings;
