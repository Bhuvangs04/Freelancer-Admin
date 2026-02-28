import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink, CheckCircle, XCircle, Search, Clock } from "lucide-react";
import api from "@/lib/api";

interface SkillVerification {
  _id: string;
  userId: {
    username: string;
    profilePictureUrl?: string;
    email?: string;
  };
  skillName: string;
  verificationType: string;
  status: string;
  portfolioVerification?: {
    portfolioUrl: string;
    projectName: string;
    description: string;
    screenshotUrl?: string;
  };
  createdAt: string;
}

export const SkillVerificationsView = () => {
  const [verifications, setVerifications] = useState<SkillVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/vi/skills/admin/pending");
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error("Failed to fetch skills:", error);
      toast({
        title: "Error",
        description: "Failed to load pending skill verifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleVerify = async (id: string, approved: boolean) => {
    try {
      // Prompt for optional notes if rejecting
      let notes = "";
      if (!approved) {
        notes = window.prompt("Reason for rejection (optional):") || "";
      }

      await api.post(`/api/vi/skills/admin/${id}/verify`, {
        approved,
        notes,
      });

      toast({
        title: "Success",
        description: `Skill verification ${approved ? "approved" : "rejected"}.`,
      });

      // Remove from list
      setVerifications((prev) => prev.filter((v) => v._id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Action failed.",
        variant: "destructive",
      });
    }
  };

  const filteredVerifications = verifications.filter(
    (v) =>
      v.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.skillName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Skill Verifications
          </h2>
          <p className="text-muted-foreground text-sm">
            Review and approve pending skill verifications (Portfolios & Certificates).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                {filteredVerifications.length} pending submissions found.
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search freelancer or skill..."
                className="pl-8 bg-gray-50/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project/URL</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredVerifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 text-gray-400" />
                        <p>No pending skill verifications found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVerifications.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="font-medium">
                        {v.userId?.username || "Unknown"}
                        {v.userId?.email && (
                          <span className="block text-xs text-muted-foreground">
                            {v.userId.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {v.skillName}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{v.verificationType}</TableCell>
                      <TableCell>
                        {v.portfolioVerification ? (
                          <div className="space-y-1">
                            <span className="font-medium text-sm">
                              {v.portfolioVerification.projectName}
                            </span>
                            <div className="flex items-center gap-2">
                              {v.portfolioVerification.portfolioUrl && (
                                <a
                                  href={v.portfolioVerification.portfolioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" /> View Link
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleVerify(v._id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleVerify(v._id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
