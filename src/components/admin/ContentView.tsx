import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const contentTypes = [
  { key: "about_us", label: "About Us" },
  { key: "terms_and_conditions", label: "Terms & Conditions" },
  { key: "privacy_policy", label: "Privacy Policy" },
];

interface ContentData {
  title: string;
  body: string;
}

const ContentView = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("about_us");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contentMap, setContentMap] = useState<Record<string, ContentData>>({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          contentTypes.map((ct) =>
            axios.get(`${API}/admin/content/${ct.key}`, { withCredentials: true })
          )
        );
        const map: Record<string, ContentData> = {};
        results.forEach((res, idx) => {
          const c = res.data.content;
          map[contentTypes[idx].key] = { title: c.title || "", body: c.body || "" };
        });
        setContentMap(map);
      } catch (err) {
        console.error("Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const saveContent = async (type: string) => {
    setSaving(true);
    try {
      const data = contentMap[type];
      await axios.put(`${API}/admin/content/${type}`, data, { withCredentials: true });
      toast({ title: "Saved", description: `${type.replace(/_/g, " ")} updated` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (type: string, field: keyof ContentData, value: string) => {
    setContentMap((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
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
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-violet-600" />
        <div>
          <h2 className="text-3xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">Manage your site's static pages</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {contentTypes.map((ct) => (
            <TabsTrigger key={ct.key} value={ct.key}>{ct.label}</TabsTrigger>
          ))}
        </TabsList>

        {contentTypes.map((ct) => (
          <TabsContent key={ct.key} value={ct.key} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{ct.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={contentMap[ct.key]?.title || ""}
                    onChange={(e) => updateContent(ct.key, "title", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content (HTML / Markdown)</label>
                  <Textarea
                    value={contentMap[ct.key]?.body || ""}
                    onChange={(e) => updateContent(ct.key, "body", e.target.value)}
                    className="mt-1 min-h-[300px] font-mono text-sm"
                    placeholder="Write your content here..."
                  />
                </div>
                <Button onClick={() => saveContent(ct.key)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ContentView;
