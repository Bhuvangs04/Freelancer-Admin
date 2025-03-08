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
import { Switch } from "@/components/ui/switch";
import { Loader2, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BanUserDialog } from "./BanUserDialog";

interface User {
  _id: number;
  username: string;
  email: string;
  isBanned: string;
  role: string;
}

export const UsersTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/get/users`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        return data.users || [];
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    // Fallback to empty array if API fails
    placeholderData: [],
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      banType,
    }: {
      userId: number;
      banType: "temporary" | "permanent";
    }) => {
      const endpoint =
        banType === "temporary"
          ? `${import.meta.env.VITE_API_URL}/admin/ban-user/true/${userId}`
          : `${
              import.meta.env.VITE_API_URL
            }/admin/ban_user/${userId}/ban_permanent`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to ban user`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User Banned",
        description: "User has been banned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Ban Failed",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/admin/relase_ban_user/${userId}/realsed/false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to unban user`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User Unbanned",
        description: "User has been unbanned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Unban Failed",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    },
  });

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleBanConfirm = (banType: "temporary" | "permanent") => {
    if (selectedUser) {
      banUserMutation.mutate({ userId: selectedUser._id, banType });
      setBanDialogOpen(false);
    }
  };

  const handleUnban = (userId: number) => {
    unbanUserMutation.mutate({ userId });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 text-red-800">
        <p className="font-semibold">Error loading users</p>
        <p className="text-sm mt-2">
          {(error as Error).message || "Please try again later"}
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">
          Users Management ({users.length})
        </h2>
        <Button>Export Users</Button>
      </div>

      {users && users.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        !user.isBanned
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {!user.isBanned ? "Active" : "Banned"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!user.isBanned ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBanClick(user)}
                          className="flex items-center gap-1"
                        >
                          <Ban className="h-4 w-4" />
                          Ban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(user._id)}
                        >
                          Unban
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

      <BanUserDialog
        isOpen={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        onConfirm={handleBanConfirm}
        username={selectedUser?.username || ""}
      />
    </div>
  );
};
