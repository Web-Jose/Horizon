"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GearIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HouseIcon,
  TagIcon,
  UserPlusIcon,
  UsersIcon,
  EnvelopeIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace } from "@/lib/types";
import {
  useCategories,
  useRooms,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  useUpdateWorkspace,
  useWorkspaceMembers,
  usePendingInvitations,
  useInviteMember,
  useCancelInvitation,
  useRemoveMember,
} from "@/lib/hooks/useShoppingQueries";

interface SpaceSettingsProps {
  activeTab: string;
  workspace?: Workspace;
  user?: SupabaseUser;
}

export function SpaceSettings({ workspace, user }: SpaceSettingsProps) {
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [workspaceZip, setWorkspaceZip] = useState(workspace?.zip || "");
  const [workspaceCurrency, setWorkspaceCurrency] = useState(
    workspace?.currency || "USD"
  );
  const [workspaceMoveInDate, setWorkspaceMoveInDate] = useState(
    workspace?.move_in_date ? workspace.move_in_date.split("T")[0] : ""
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6b7280");
  const [newRoomName, setNewRoomName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);
  const [editingRoom, setEditingRoom] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);

  const { data: categories = [] } = useCategories(workspace?.id || "");
  const { data: rooms = [] } = useRooms(workspace?.id || "");
  const { data: members = [] } = useWorkspaceMembers(workspace?.id || "");
  const { data: pendingInvitations = [] } = usePendingInvitations(
    workspace?.id || ""
  );

  // Mutations
  const updateWorkspaceMutation = useUpdateWorkspace();
  const createCategoryMutation = useCreateCategory(workspace?.id || "");
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const createRoomMutation = useCreateRoom(workspace?.id || "");
  const updateRoomMutation = useUpdateRoom();
  const deleteRoomMutation = useDeleteRoom();
  const inviteMemberMutation = useInviteMember(workspace?.id || "");
  const cancelInvitationMutation = useCancelInvitation(workspace?.id || "");
  const removeMemberMutation = useRemoveMember(workspace?.id || "");

  const handleSaveWorkspace = async () => {
    if (!workspace?.id) return;

    try {
      await updateWorkspaceMutation.mutateAsync({
        workspaceId: workspace.id,
        workspaceData: {
          name: workspaceName.trim(),
          zip: workspaceZip.trim() || undefined,
          currency: workspaceCurrency,
          move_in_date: workspaceMoveInDate || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to update workspace:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      setNewCategoryName("");
      setNewCategoryColor("#6b7280");
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: editingCategory.id,
        categoryData: {
          name: editingCategory.name.trim(),
          color: editingCategory.color,
        },
      });
      setEditingCategory(null);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      await createRoomMutation.mutateAsync({
        name: newRoomName.trim(),
      });
      setNewRoomName("");
      setIsAddingRoom(false);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      await updateRoomMutation.mutateAsync({
        roomId: editingRoom.id,
        roomData: {
          name: editingRoom.name.trim(),
        },
      });
      setEditingRoom(null);
    } catch (error) {
      console.error("Failed to update room:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this room? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteRoomMutation.mutateAsync(roomId);
    } catch (error) {
      console.error("Failed to delete room:", error);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const result = await inviteMemberMutation.mutateAsync({
        email: inviteEmail.trim(),
      });

      if (result.success) {
        setInvitationSent(true);
        setInviteEmail("");

        // Reset success message after 3 seconds
        setTimeout(() => setInvitationSent(false), 3000);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      alert("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <GearIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Space Settings</h1>
          <p className="text-gray-500">
            Manage your workspace, team, and organization
          </p>
        </div>
      </div>

      <Tabs defaultValue="workspace" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="invitations">Team</TabsTrigger>
        </TabsList>

        {/* Workspace Settings */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>
                Update your workspace details including moving date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-zip">ZIP Code</Label>
                  <Input
                    id="workspace-zip"
                    value={workspaceZip}
                    onChange={(e) => setWorkspaceZip(e.target.value)}
                    placeholder="Enter ZIP code..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-currency">Currency</Label>
                  <Input
                    id="workspace-currency"
                    value={workspaceCurrency}
                    onChange={(e) => setWorkspaceCurrency(e.target.value)}
                    placeholder="USD"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-move-date">Moving Date</Label>
                <Input
                  id="workspace-move-date"
                  type="date"
                  value={workspaceMoveInDate}
                  onChange={(e) => setWorkspaceMoveInDate(e.target.value)}
                  placeholder="Select your moving date..."
                />
              </div>
              <Button
                onClick={handleSaveWorkspace}
                disabled={updateWorkspaceMutation.isPending}
              >
                {updateWorkspaceMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>
                    Organize your items with custom categories
                  </CardDescription>
                </div>
                <Dialog
                  open={isAddingCategory}
                  onOpenChange={setIsAddingCategory}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                      <DialogDescription>
                        Create a new category to organize your items
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name..."
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddCategory()
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-color">Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="category-color"
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) =>
                              setNewCategoryColor(e.target.value)
                            }
                            className="w-16 h-10"
                          />
                          <Input
                            value={newCategoryColor}
                            onChange={(e) =>
                              setNewCategoryColor(e.target.value)
                            }
                            placeholder="#6b7280"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingCategory(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddCategory}
                        disabled={
                          createCategoryMutation.isPending ||
                          !newCategoryName.trim()
                        }
                      >
                        {createCategoryMutation.isPending
                          ? "Adding..."
                          : "Add Category"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      No categories yet. Add your first category to get started!
                    </p>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      {editingCategory?.id === category.id ? (
                        <div className="flex items-center space-x-3 flex-1">
                          <Input
                            type="color"
                            value={editingCategory.color}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                color: e.target.value,
                              })
                            }
                            className="w-12 h-8"
                          />
                          <Input
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                            className="flex-1"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleUpdateCategory()
                            }
                          />
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleUpdateCategory}
                              disabled={updateCategoryMutation.isPending}
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: category.color || "#6b7280",
                              }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingCategory({
                                  id: category.id,
                                  name: category.name,
                                  color: category.color || "#6b7280",
                                })
                              }
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteCategoryMutation.isPending}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rooms</CardTitle>
                  <CardDescription>
                    Define the rooms in your space
                  </CardDescription>
                </div>
                <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Room</DialogTitle>
                      <DialogDescription>
                        Add a room to organize items by location
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-name">Room Name</Label>
                        <Input
                          id="room-name"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Enter room name..."
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddRoom()
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingRoom(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddRoom}
                        disabled={
                          createRoomMutation.isPending || !newRoomName.trim()
                        }
                      >
                        {createRoomMutation.isPending
                          ? "Adding..."
                          : "Add Room"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HouseIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No rooms yet. Add your first room to get started!</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      {editingRoom?.id === room.id ? (
                        <div className="flex items-center space-x-3 flex-1">
                          <HouseIcon className="w-5 h-5 text-gray-500" />
                          <Input
                            value={editingRoom.name}
                            onChange={(e) =>
                              setEditingRoom({
                                ...editingRoom,
                                name: e.target.value,
                              })
                            }
                            className="flex-1"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleUpdateRoom()
                            }
                          />
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleUpdateRoom}
                              disabled={updateRoomMutation.isPending}
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRoom(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <HouseIcon className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">{room.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingRoom({ id: room.id, name: room.name })
                              }
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRoom(room.id)}
                              disabled={deleteRoomMutation.isPending}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team & Invitations */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Invite people to collaborate on your workspace
                  </CardDescription>
                </div>
                <Dialog open={false}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invite Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-2 mb-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                  <h3 className="font-medium">Invite New Member</h3>
                </div>

                {invitationSent && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm">
                      ✅ Invitation sent successfully!
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendInvitation()
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendInvitation}
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  They&apos;ll receive an email invitation to join your
                  workspace.
                </p>
              </div>

              {/* Current Members */}
              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2" />
                  Current Members
                </h3>

                <div className="space-y-2">
                  {/* Current members from database */}
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {member.user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user?.email || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.user_id === user?.id ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            You
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeMemberMutation.mutate({
                                userId: member.user_id,
                              })
                            }
                            disabled={removeMemberMutation.isPending}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Show placeholder if no members */}
                  {members.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No members yet.</p>
                      <p className="text-sm">
                        Invite people to start collaborating!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invitation Management */}
              <div>
                <h3 className="font-medium mb-3">Pending Invitations</h3>
                {pendingInvitations.length > 0 ? (
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-sm text-gray-500">
                              Sent{" "}
                              {new Date(
                                invitation.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            cancelInvitationMutation.mutate({
                              invitationId: invitation.id,
                            })
                          }
                          disabled={cancelInvitationMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <EnvelopeIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No pending invitations.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
