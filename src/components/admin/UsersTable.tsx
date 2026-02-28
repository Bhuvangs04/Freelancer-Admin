import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Ban, Search, ShieldOff, Snowflake, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BanUserDialog } from "./BanUserDialog";
import { WalletFreezeDialog } from "./WalletFreezeDialog";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface User {
  _id: string;
  username: string;
  email: string;
  isBanned: boolean;
  role: string;
  status: string;
  createdAt: string;
  wallet?: { withdrawalsBlocked?: boolean; withdrawalBlockedReason?: string };
}

export const UsersTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  // Track optimistic wallet freeze state per userId
  const [frozenUsers, setFrozenUsers] = useState<Record<string, boolean>>({});

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await axios.get(`${API}/admin/users?${params}`, {
        withCredentials: true,
      });
      return res.data;
    },
    placeholderData: { users: [], pagination: { total: 0, pages: 1 } },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: string; reason: string; duration?: number }) => {
      const res = await axios.put(
        `${API}/admin/users/${userId}/block`,
        { reason, duration },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User Blocked", description: "User has been blocked successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await axios.put(
        `${API}/admin/users/${userId}/unblock`,
        {},
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User Unblocked", description: "User has been unblocked successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await axios.post(
        `${API}/admin/users/${userId}/wallet/freeze`,
        { reason },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      setFrozenUsers((prev) => ({ ...prev, [vars.userId]: true }));
      setFreezeDialogOpen(false);
      toast({ title: "🧊 Wallet Frozen", description: "Withdrawals blocked for this user." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await axios.post(
        `${API}/admin/users/${userId}/wallet/unfreeze`,
        {},
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (_, userId) => {
      setFrozenUsers((prev) => ({ ...prev, [userId]: false }));
      toast({ title: "🔥 Wallet Unfrozen", description: "Withdrawals re-enabled for this user." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
    },
  });

  const isWalletFrozen = (user: User) => {
    if (frozenUsers[user._id] !== undefined) return frozenUsers[user._id];
    return user.wallet?.withdrawalsBlocked ?? false;
  };

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleFreezeClick = (user: User) => {
    setSelectedUser(user);
    setFreezeDialogOpen(true);
  };

  const handleBanConfirm = (banType: "temporary" | "permanent") => {
    if (selectedUser) {
      blockMutation.mutate({
        userId: selectedUser._id,
        reason: "Admin action",
        duration: banType === "temporary" ? 7 : undefined,
      });
      setBanDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 text-red-800">
        <p className="font-semibold">Error loading users</p>
        <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}>
          Retry
        </Button>
      </div>
    );
  }

  const { users = [], pagination = { total: 0, pages: 1, page: 1 } } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Users Management</h2>
          <p className="text-muted-foreground">{pagination.total} total users</p>
        </div>
        <a
          href={`${API}/admin/reports/users/excel`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">Export Excel</Button>
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "freelancer"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                      }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${!user.isBanned
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}>
                      {!user.isBanned ? "Active" : "Blocked"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Account block / unblock */}
                      {!user.isBanned ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBanClick(user)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Block
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                            onClick={() => unblockMutation.mutate(user._id)}
                        >
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Unblock
                        </Button>
                      )}

                      {/* Wallet withdrawal freeze / unfreeze */}
                      {isWalletFrozen(user) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => unfreezeMutation.mutate(user._id)}
                          disabled={unfreezeMutation.isPending}
                        >
                          <Flame className="h-3 w-3 mr-1" />
                          Unfreeze
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleFreezeClick(user)}
                        >
                          <Snowflake className="h-3 w-3 mr-1" />
                          Freeze
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <BanUserDialog
        isOpen={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        onConfirm={handleBanConfirm}
        username={selectedUser?.username || ""}
      />

      <WalletFreezeDialog
        isOpen={freezeDialogOpen}
        username={selectedUser?.username || ""}
        onClose={() => setFreezeDialogOpen(false)}
        onConfirm={(reason) => {
          if (selectedUser) {
            freezeMutation.mutate({ userId: selectedUser._id, reason });
          }
        }}
        isLoading={freezeMutation.isPending}
      />
    </div>
  );
};
