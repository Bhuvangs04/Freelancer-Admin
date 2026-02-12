import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const SettingsView = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform settings
  const [commission, setCommission] = useState(10);
  const [minBudget, setMinBudget] = useState(500);
  const [maxBudget, setMaxBudget] = useState(1000000);

  // Site settings
  const [siteName, setSiteName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [platformRes, siteRes] = await Promise.all([
          axios.get(`${API}/admin/settings/platform`, { withCredentials: true }),
          axios.get(`${API}/admin/settings/site`, { withCredentials: true }),
        ]);
        const p = platformRes.data;
        const s = siteRes.data;
        setCommission(p.platformCommissionPercent);
        setMinBudget(p.minimumProjectBudget);
        setMaxBudget(p.maximumProjectBudget);
        setSiteName(s.siteName);
        setSupportEmail(s.supportEmail);
        setLogoUrl(s.logoUrl);
        setMaintenance(s.maintenanceMode);
        setMaintenanceMsg(s.maintenanceMessage);
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const savePlatform = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/platform`, {
        platformCommissionPercent: commission,
        minimumProjectBudget: minBudget,
        maximumProjectBudget: maxBudget,
      }, { withCredentials: true });
      toast({ title: "Saved", description: "Platform settings updated" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveSite = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/site`, {
        siteName,
        supportEmail,
        maintenanceMode: maintenance,
        maintenanceMessage: maintenanceMsg,
      }, { withCredentials: true });
      toast({ title: "Saved", description: "Site settings updated" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Settings</h2>

      <Tabs defaultValue="platform">
        <TabsList>
          <TabsTrigger value="platform">Commission & Budget</TabsTrigger>
          <TabsTrigger value="site">Site Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Commission & Budget</CardTitle>
              <CardDescription>Configure platform-wide financial settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Commission (%)</label>
                  <Input type="number" min={0} max={100} value={commission}
                    onChange={(e) => setCommission(parseFloat(e.target.value))} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Percentage taken from each transaction</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Min Budget (₹)</label>
                  <Input type="number" min={0} value={minBudget}
                    onChange={(e) => setMinBudget(parseFloat(e.target.value))} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Minimum allowed project budget</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Budget (₹)</label>
                  <Input type="number" min={0} value={maxBudget}
                    onChange={(e) => setMaxBudget(parseFloat(e.target.value))} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Maximum allowed project budget</p>
                </div>
              </div>
              <Button onClick={savePlatform} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Platform Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>Configure site identity and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Support Email</label>
                  <Input type="email" value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)} className="mt-1" />
                </div>
              </div>

              {logoUrl && (
                <div>
                  <label className="text-sm font-medium">Current Logo</label>
                  <img src={logoUrl} alt="Site Logo" className="h-16 mt-2 rounded border p-1" />
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenance ? "Site is currently in maintenance mode" : "Site is live"}
                  </p>
                </div>
                <Switch checked={maintenance} onCheckedChange={setMaintenance} />
              </div>

              {maintenance && (
                <div>
                  <label className="text-sm font-medium">Maintenance Message</label>
                  <Input value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} className="mt-1" />
                </div>
              )}

              <Button onClick={saveSite} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Site Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsView;
