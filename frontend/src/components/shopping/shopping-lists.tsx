"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  MapPinIcon,
  GridFourIcon,
  PencilSimpleIcon,
  TrashIcon,
  SpinnerGapIcon,
  LinkSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace, ItemWithDetails } from "@/lib/types";
import {
  useItems,
  useCategories,
  useRooms,
  useCompanies,
  useCreateItem,
  useUpdateItem,
  useUpdateItemPurchased,
  useDeleteItem,
} from "@/lib/hooks/useShoppingQueries";

interface ShoppingListsProps {
  activeTab?: string;
  viewMode?: "category" | "room";
  workspace?: Workspace;
  user?: SupabaseUser;
}

export function ShoppingLists({
  viewMode = "category",
  workspace,
}: ShoppingListsProps) {
  // TanStack Query hooks
  const {
    data: items = [],
    isLoading: loading,
    isFetching,
  } = useItems(workspace?.id || "");
  const { data: availableCategories = [] } = useCategories(workspace?.id || "");
  const { data: availableRooms = [] } = useRooms(workspace?.id || "");
  const { data: availableCompanies = [] } = useCompanies(workspace?.id || "");

  // Mutations
  const createItemMutation = useCreateItem(workspace?.id || "");
  const updateItemMutation = useUpdateItem();
  const updateItemPurchasedMutation = useUpdateItemPurchased();
  const deleteItemMutation = useDeleteItem();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(
    null
  );
  const [actualPrice, setActualPrice] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    link: "",
    category_id: "",
    room_id: "",
    company_id: "",
    quantity: 1,
    priority: 2,
    notes: "",
    est_unit_cents: 0,
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    link: "",
    category_id: "",
    room_id: "",
    company_id: "",
    quantity: 1,
    priority: 2,
    notes: "",
    est_unit_cents: 0,
  });

  // Loading states from mutations
  const isSubmitting = createItemMutation.isPending;
  const isEditSubmitting = updateItemMutation.isPending;
  const isUpdating =
    updateItemPurchasedMutation.isPending || deleteItemMutation.isPending;

  // Get unique categories and rooms from items for grouping
  const categories = [
    ...new Set(items.map((item) => item.category?.name).filter(Boolean)),
  ];
  const rooms = [
    ...new Set(items.map((item) => item.room?.name).filter(Boolean)),
  ];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.room?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    // Map purchased status to our status filter
    const itemStatus = item.purchased ? "purchased" : "pending";
    const matchesStatus = filterStatus === "all" || itemStatus === filterStatus;

    // Map priority number to string
    const priorityMap: Record<number, string> = {
      1: "high",
      2: "medium",
      3: "low",
    };
    const itemPriority = priorityMap[item.priority] || "medium";
    const matchesPriority =
      filterPriority === "all" || itemPriority === filterPriority;

    // Price range filtering
    const itemPrice =
      (item.actual_price || item.estimated_price || 0) * item.quantity;
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    const matchesPriceRange = itemPrice >= minPrice && itemPrice <= maxPrice;

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesPriceRange
    );
  });

  const groupedItems =
    viewMode === "category"
      ? categories.reduce((acc, category) => {
          if (category) {
            acc[category] = filteredItems.filter(
              (item) => item.category?.name === category
            );
          }
          return acc;
        }, {} as Record<string, ItemWithDetails[]>)
      : rooms.reduce((acc, room) => {
          if (room) {
            acc[room] = filteredItems.filter(
              (item) => item.room?.name === room
            );
          }
          return acc;
        }, {} as Record<string, ItemWithDetails[]>);

  const totalEstimated = items.reduce(
    (sum, item) => sum + (item.estimated_price || 0) * item.quantity,
    0
  );
  const totalSpent = items.reduce(
    (sum, item) =>
      sum + (item.actual_price || item.estimated_price || 0) * item.quantity,
    0
  );
  const pendingItems = items.filter((item) => !item.purchased).length;
  const purchasedItems = items.filter((item) => item.purchased).length;

  // Form handling functions
  const resetForm = () => {
    setFormData({
      name: "",
      link: "",
      category_id: "",
      room_id: "",
      company_id: "",
      quantity: 1,
      priority: 2,
      notes: "",
      est_unit_cents: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspace?.id || !formData.name.trim()) {
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        name: formData.name.trim(),
        link: formData.link || undefined,
        category_id: formData.category_id || undefined,
        room_id: formData.room_id || undefined,
        company_id: formData.company_id || undefined,
        quantity: formData.quantity,
        priority: formData.priority,
        notes: formData.notes || undefined,
        est_unit_cents: formData.est_unit_cents,
      });

      // Close dialog and reset form
      setIsAddItemOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating item:", error);
      // You could add toast notification here
    }
  };

  // Handler functions for item actions
  const handleMarkAsPurchased = async () => {
    if (!selectedItem) return;

    try {
      let finalActualPrice;

      if (!selectedItem.purchased) {
        // Marking as purchased
        if (actualPrice && actualPrice.trim() !== "") {
          // User entered an actual price
          finalActualPrice = parseFloat(actualPrice);
        } else {
          // No actual price entered, use estimated price
          finalActualPrice = selectedItem.estimated_price || 0;
        }
      } else {
        // Marking as not purchased (removing actual price to go back to estimated)
        finalActualPrice = undefined;
      }

      await updateItemPurchasedMutation.mutateAsync({
        itemId: selectedItem.id,
        purchased: !selectedItem.purchased,
        actualPrice: finalActualPrice,
      });

      // Close the drawer if marking as purchased
      if (!selectedItem.purchased) {
        setSelectedItem(null);
      }
      setActualPrice("");
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteItemMutation.mutateAsync(selectedItem.id);

      // Close all drawers
      setIsDeleteConfirmOpen(false);
      setSelectedItem(null);
      setIsEditItemOpen(false);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleEditItem = () => {
    if (!selectedItem) return;

    // Populate edit form with current item data
    setEditFormData({
      name: selectedItem.name || "",
      link: selectedItem.link || "",
      category_id: selectedItem.category?.id || "",
      room_id: selectedItem.room?.id || "",
      company_id: selectedItem.company?.id || "",
      quantity: selectedItem.quantity || 1,
      priority: selectedItem.priority || 2,
      notes: selectedItem.notes || "",
      est_unit_cents: Math.round((selectedItem.estimated_price || 0) * 100),
    });

    setIsEditItemOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || !workspace?.id || !editFormData.name.trim()) {
      return;
    }

    try {
      await updateItemMutation.mutateAsync({
        itemId: selectedItem.id,
        updates: {
          name: editFormData.name.trim(),
          link: editFormData.link || undefined,
          category_id: editFormData.category_id || undefined,
          room_id: editFormData.room_id || undefined,
          company_id: editFormData.company_id || undefined,
          quantity: editFormData.quantity,
          priority: editFormData.priority,
          notes: editFormData.notes || undefined,
          est_unit_cents: editFormData.est_unit_cents,
        },
      });

      // Close dialogs
      setIsEditItemOpen(false);
      setSelectedItem(null);

      // Reset edit form
      setEditFormData({
        name: "",
        link: "",
        category_id: "",
        room_id: "",
        company_id: "",
        quantity: 1,
        priority: 2,
        notes: "",
        est_unit_cents: 0,
      });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  // Empty State Component
  const EmptyState = ({ onAddItem }: { onAddItem: () => void }) => (
    <Card className="text-center py-12">
      <CardContent>
        <ShoppingCartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No shopping items yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start building your shopping lists by adding items for your new home.
          You can organize them by room or category to stay organized.
        </p>
        <Button onClick={onAddItem} className="mx-auto">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Your First Item
        </Button>
      </CardContent>
    </Card>
  );

  // No Results State Component
  const NoResultsState = ({
    onClearFilters,
  }: {
    onClearFilters: () => void;
  }) => (
    <Card className="text-center py-12">
      <CardContent>
        <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No items match your filters
        </h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your search terms or clearing the filters to see more
          results.
        </p>
        <Button onClick={onClearFilters} variant="outline">
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );

  // Item Card Component
  const ItemCard = ({
    item,
    onClick,
  }: {
    item: ItemWithDetails;
    onClick: () => void;
  }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              <Badge
                variant={item.purchased ? "default" : "secondary"}
                className="text-xs"
              >
                {item.purchased ? "Done" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Qty: {item.quantity}</span>
              <span>
                Priority:{" "}
                {item.priority === 1
                  ? "High"
                  : item.priority === 2
                  ? "Med"
                  : "Low"}
              </span>
              {item.category?.name && <span>{item.category.name}</span>}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="font-bold text-gray-900">
              $
              {(
                (item.actual_price || item.estimated_price || 0) * item.quantity
              ).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {item.actual_price ? "actual" : "estimated"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Mobile-First Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shopping</h1>
          <p className="text-sm text-gray-600">
            {items.length} items • {viewMode}
          </p>
        </div>
        <Sheet open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Add Shopping Item</SheetTitle>
              <SheetDescription>
                Add a new item to your shopping list
              </SheetDescription>
            </SheetHeader>

            {/* Header with drag indicator */}
            <div className="flex flex-col items-center pb-4 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Item
                    </h2>
                    <p className="text-sm text-gray-500">
                      Add a new item to your shopping list
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto space-y-6"
            >
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">📝</span>
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name *</Label>
                    <Input
                      id="item-name"
                      placeholder="Enter item name..."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-link">Product Link (optional)</Label>
                    <Input
                      id="item-link"
                      type="url"
                      placeholder="https://..."
                      value={formData.link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          link: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">🗂️</span>
                  Organization
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category_id: value }))
                      }
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select
                      value={formData.room_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, room_id: value }))
                      }
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, company_id: value }))
                    }
                  >
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Item Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">📦</span>
                  Item Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select
                      value={formData.priority.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">🔥 High Priority</SelectItem>
                        <SelectItem value="2">⚡ Medium Priority</SelectItem>
                        <SelectItem value="3">📋 Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-green-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-green-900 flex items-center">
                  <span className="mr-2 text-lg">💰</span>
                  Pricing Information
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="estimated-price" className="text-green-800">
                    Estimated Price per Unit
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="estimated-price"
                      type="text"
                      placeholder="0.00"
                      value={(formData.est_unit_cents / 100).toFixed(2)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, "");
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) || value === "" || value === ".") {
                          setFormData((prev) => ({
                            ...prev,
                            est_unit_cents: Math.round(
                              (parseFloat(value) || 0) * 100
                            ),
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value);
                        if (!isNaN(numValue)) {
                          setFormData((prev) => ({
                            ...prev,
                            est_unit_cents: Math.round(numValue * 100),
                          }));
                        }
                      }}
                      className="bg-white pl-8"
                    />
                  </div>
                  {formData.quantity > 1 && formData.est_unit_cents > 0 && (
                    <div className="text-sm text-green-700 bg-green-100 rounded-lg p-2">
                      Total estimated: $
                      {(
                        (formData.est_unit_cents / 100) *
                        formData.quantity
                      ).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">📋</span>
                  Notes
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any additional notes about this item..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="pt-6 border-t bg-white space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Item
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddItemOpen(false);
                  resetForm();
                }}
                className="w-full py-3 text-base font-medium"
              >
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Edit Item Drawer */}
      <Sheet open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Edit Item</SheetTitle>
            <SheetDescription>
              Update the details of your shopping item
            </SheetDescription>
          </SheetHeader>

          {/* Header with drag indicator */}
          <div className="flex flex-col items-center pb-4 -mt-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center">
                  <PencilSimpleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
                  <p className="text-sm text-gray-500">
                    Update your shopping item details
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleEditSubmit}
            className="flex-1 overflow-y-auto space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">📝</span>
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-name">Item Name *</Label>
                  <Input
                    id="edit-item-name"
                    placeholder="Enter item name..."
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-link">
                    Product Link (optional)
                  </Label>
                  <Input
                    id="edit-item-link"
                    type="url"
                    placeholder="https://..."
                    value={editFormData.link}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        link: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">🗂️</span>
                Organization
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editFormData.category_id}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        category_id: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={editFormData.room_id}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({ ...prev, room_id: value }))
                    }
                  >
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={editFormData.company_id}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, company_id: value }))
                  }
                >
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Item Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">�</span>
                Item Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={editFormData.quantity}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select
                    value={editFormData.priority.toString()}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        priority: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">🔥 High Priority</SelectItem>
                      <SelectItem value="2">⚡ Medium Priority</SelectItem>
                      <SelectItem value="3">📋 Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-green-900 flex items-center">
                <span className="mr-2 text-lg">💰</span>
                Pricing Information
              </h3>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-estimated-price"
                  className="text-green-800"
                >
                  Estimated Price per Unit
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="edit-estimated-price"
                    type="text"
                    placeholder="0.00"
                    value={(editFormData.est_unit_cents / 100).toFixed(2)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "");
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) || value === "" || value === ".") {
                        setEditFormData((prev) => ({
                          ...prev,
                          est_unit_cents: Math.round(
                            (parseFloat(value) || 0) * 100
                          ),
                        }));
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = parseFloat(e.target.value);
                      if (!isNaN(numValue)) {
                        setEditFormData((prev) => ({
                          ...prev,
                          est_unit_cents: Math.round(numValue * 100),
                        }));
                      }
                    }}
                    className="bg-white pl-8"
                  />
                </div>
                {editFormData.quantity > 1 &&
                  editFormData.est_unit_cents > 0 && (
                    <div className="text-sm text-green-700 bg-green-100 rounded-lg p-2">
                      Total estimated: $
                      {(
                        (editFormData.est_unit_cents / 100) *
                        editFormData.quantity
                      ).toFixed(2)}
                    </div>
                  )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">📋</span>
                Notes
              </h3>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Additional Notes (optional)</Label>
                <Input
                  id="edit-notes"
                  placeholder="Any additional notes about this item..."
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="bg-white"
                />
              </div>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="pt-6 border-t bg-white space-y-3">
            <Button
              onClick={handleEditSubmit}
              disabled={isEditSubmitting}
              className="w-full py-3 text-base font-medium"
            >
              {isEditSubmitting ? (
                <>
                  <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Update Item
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditItemOpen(false)}
              className="w-full py-3 text-base font-medium"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Drawer */}
      <Sheet open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[60vh] min-h-[400px] rounded-t-xl p-6 flex flex-col"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Confirm Delete</SheetTitle>
            <SheetDescription>
              Confirm that you want to delete this item
            </SheetDescription>
          </SheetHeader>

          {/* Header with drag indicator */}
          <div className="flex flex-col items-center pb-4 -mt-2 flex-shrink-0">
            <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete Item
                  </h2>
                  <p className="text-sm text-gray-500">
                    Confirm deletion of this item
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* Warning Message */}
            <div className="bg-red-50 rounded-xl p-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Delete &ldquo;{selectedItem?.name}&rdquo;?
                </h3>
                <p className="text-red-700 text-sm">
                  This action cannot be undone. This item will be permanently
                  removed from your shopping list.
                </p>
              </div>

              {/* Item details for confirmation */}
              {selectedItem && (
                <div className="bg-red-100 rounded-lg p-3 text-left">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-800">Quantity:</span>
                    <span className="font-medium text-red-900">
                      {selectedItem.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-800">Category:</span>
                    <span className="font-medium text-red-900">
                      {selectedItem.category?.name || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-800">Estimated Total:</span>
                    <span className="font-medium text-red-900">
                      $
                      {(
                        (selectedItem.estimated_price || 0) *
                        selectedItem.quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="pt-4 border-t bg-white space-y-3 flex-shrink-0 mt-auto">
            <Button
              onClick={handleConfirmDelete}
              disabled={isUpdating}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-medium"
            >
              {isUpdating ? (
                <>
                  <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5 mr-2" />
                  Yes, Delete Item
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="w-full py-3 text-base font-medium"
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Compact Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-green-50 rounded-lg p-3 text-center relative">
          {isFetching && !loading && (
            <div className="absolute top-1 right-1">
              <SpinnerGapIcon className="w-3 h-3 animate-spin text-green-600" />
            </div>
          )}
          <div className="text-lg font-bold text-green-900">
            ${Math.round(totalEstimated / 1000)}k
          </div>
          <div className="text-xs text-green-700">Budget</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-900">
            ${Math.round(totalSpent / 1000)}k
          </div>
          <div className="text-xs text-blue-700">Spent</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-900">
            {pendingItems}
          </div>
          <div className="text-xs text-orange-700">Pending</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-900">
            {purchasedItems}
          </div>
          <div className="text-xs text-purple-700">Done</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <FunnelIcon className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Filter Items</SheetTitle>
              <SheetDescription>
                Filter your shopping items by status, priority, and price
              </SheetDescription>
            </SheetHeader>

            {/* Header with drag indicator */}
            <div className="flex flex-col items-center pb-4 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <FunnelIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                    <p className="text-sm text-gray-500">
                      Refine your shopping list view
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex-shrink-0">
                  {filteredItems.length} results
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Status Filter */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                  Status Filter
                </h3>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="purchased">Purchased</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Badge variant="secondary" className="mr-2 text-xs">
                    !
                  </Badge>
                  Priority Filter
                </h3>
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">🔥 High Priority</SelectItem>
                    <SelectItem value="medium">⚡ Medium Priority</SelectItem>
                    <SelectItem value="low">📋 Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">💰</span>
                  Price Range Filter
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Set price limits
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        placeholder="0.00"
                        type="text"
                        value={priceRange.min}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          const numValue = parseFloat(value);
                          if (
                            !isNaN(numValue) ||
                            value === "" ||
                            value === "."
                          ) {
                            setPriceRange((prev) => ({
                              ...prev,
                              min: value,
                            }));
                          }
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            setPriceRange((prev) => ({
                              ...prev,
                              min: numValue.toFixed(2),
                            }));
                          }
                        }}
                        className="bg-white pl-8"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        placeholder="0.00"
                        type="text"
                        value={priceRange.max}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          const numValue = parseFloat(value);
                          if (
                            !isNaN(numValue) ||
                            value === "" ||
                            value === "."
                          ) {
                            setPriceRange((prev) => ({
                              ...prev,
                              max: value,
                            }));
                          }
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            setPriceRange((prev) => ({
                              ...prev,
                              max: numValue.toFixed(2),
                            }));
                          }
                        }}
                        className="bg-white pl-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Filters Summary */}
              {(filterStatus !== "all" ||
                filterPriority !== "all" ||
                priceRange.min ||
                priceRange.max ||
                searchTerm) && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-blue-900">
                    Active Filters
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="outline" className="bg-white">
                        Search: &ldquo;{searchTerm}&rdquo;
                      </Badge>
                    )}
                    {filterStatus !== "all" && (
                      <Badge variant="outline" className="bg-white">
                        Status: {filterStatus}
                      </Badge>
                    )}
                    {filterPriority !== "all" && (
                      <Badge variant="outline" className="bg-white">
                        Priority: {filterPriority}
                      </Badge>
                    )}
                    {(priceRange.min || priceRange.max) && (
                      <Badge variant="outline" className="bg-white">
                        Price: ${priceRange.min || "0"} - $
                        {priceRange.max || "∞"}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t bg-white space-y-3">
              <Button
                variant="outline"
                className="w-full py-3 text-base font-medium"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterPriority("all");
                  setPriceRange({ min: "", max: "" });
                }}
              >
                <XIcon className="w-5 h-5 mr-2" />
                Clear All Filters
              </Button>
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3 text-base font-medium"
              >
                Apply Filters ({filteredItems.length} results)
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Shopping Lists by Category/Room */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerGapIcon className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading shopping items...</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState onAddItem={() => setIsAddItemOpen(true)} />
      ) : Object.keys(groupedItems).length === 0 ? (
        <NoResultsState
          onClearFilters={() => {
            setSearchTerm("");
            setFilterStatus("all");
            setFilterPriority("all");
          }}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filteredItems.filter((item) => !item.purchased).length})
            </TabsTrigger>
            <TabsTrigger value="purchased">
              Done ({filteredItems.filter((item) => item.purchased).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {Object.entries(groupedItems).map(([groupName, groupItems]) => (
              <div key={groupName}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {viewMode === "category" ? (
                      <GridFourIcon className="w-4 h-4 text-blue-600" />
                    ) : (
                      <MapPinIcon className="w-4 h-4 text-green-600" />
                    )}
                    <h3 className="font-medium text-gray-900">{groupName}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {groupItems.length}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    $
                    {groupItems
                      .reduce(
                        (sum, item) =>
                          sum + (item.estimated_price || 0) * item.quantity,
                        0
                      )
                      .toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  {groupItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-2 mt-4">
            {filteredItems
              .filter((item) => !item.purchased)
              .map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
          </TabsContent>

          <TabsContent value="purchased" className="space-y-2 mt-4">
            {filteredItems
              .filter((item) => item.purchased)
              .map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Modern Bottom Drawer */}
      <Sheet
        open={selectedItem !== null}
        onOpenChange={() => {
          setSelectedItem(null);
          setActualPrice("");
        }}
      >
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>{selectedItem?.name || "Item Details"}</SheetTitle>
            <SheetDescription>View and manage item details</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <>
              {/* Header with drag indicator */}
              <div className="flex flex-col items-center pb-4 -mt-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedItem.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                        {selectedItem.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedItem.category?.name || "No category"} •{" "}
                        {selectedItem.room?.name || "No room"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={selectedItem.purchased ? "default" : "secondary"}
                    className="flex-shrink-0"
                  >
                    {selectedItem.purchased ? "✓ Done" : "Pending"}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Image */}
                {selectedItem.image_url && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 relative shadow-sm">
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      fill
                    />
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedItem.quantity}
                    </div>
                    <div className="text-xs text-blue-700">Quantity</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-900">
                      {selectedItem.priority === 1
                        ? "🔥"
                        : selectedItem.priority === 2
                        ? "⚡"
                        : "📋"}
                    </div>
                    <div className="text-xs text-purple-700">
                      {selectedItem.priority === 1
                        ? "High"
                        : selectedItem.priority === 2
                        ? "Medium"
                        : "Low"}{" "}
                      Priority
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">
                      $
                      {(
                        (selectedItem.actual_price ||
                          selectedItem.estimated_price ||
                          0) * selectedItem.quantity
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-700">
                      {selectedItem.actual_price ? "Actual" : "Estimated"}
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Pricing</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Estimated (per unit)
                      </span>
                      <span className="font-medium">
                        ${selectedItem.estimated_price || 0}
                      </span>
                    </div>
                    {selectedItem.actual_price && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Actual (per unit)</span>
                        <span className="font-medium text-green-600">
                          ${selectedItem.actual_price}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between items-center font-semibold">
                      <span>Total ({selectedItem.quantity}x)</span>
                      <span
                        className={
                          selectedItem.actual_price ? "text-green-600" : ""
                        }
                      >
                        $
                        {(
                          (selectedItem.actual_price ||
                            selectedItem.estimated_price ||
                            0) * selectedItem.quantity
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Status Section */}
                {!selectedItem.purchased ? (
                  <div className="bg-green-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-green-900 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Ready to Purchase?
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      Enter the actual price if different from estimate, or
                      leave blank to use estimated price.
                    </p>
                    <div className="space-y-2">
                      <Label
                        htmlFor="actual-price"
                        className="text-sm text-green-700"
                      >
                        Actual price per unit (optional)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id="actual-price"
                          type="text"
                          placeholder={`${
                            selectedItem.estimated_price || 0
                          } (estimated)`}
                          value={actualPrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(
                              /[^0-9.]/g,
                              ""
                            );
                            const numValue = parseFloat(value);
                            if (
                              !isNaN(numValue) ||
                              value === "" ||
                              value === "."
                            ) {
                              setActualPrice(value);
                            }
                          }}
                          onBlur={(e) => {
                            const numValue = parseFloat(e.target.value);
                            if (!isNaN(numValue)) {
                              setActualPrice(numValue.toFixed(2));
                            }
                          }}
                          className="bg-white pl-8"
                        />
                      </div>
                      {actualPrice && (
                        <div className="text-xs text-green-600 bg-green-100 rounded p-2">
                          Total: $
                          {(
                            parseFloat(actualPrice) * selectedItem.quantity
                          ).toFixed(2)}
                          {parseFloat(actualPrice) !==
                            (selectedItem.estimated_price || 0) && (
                            <span className="ml-2">
                              (vs $
                              {(
                                (selectedItem.estimated_price || 0) *
                                selectedItem.quantity
                              ).toFixed(2)}{" "}
                              estimated)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-blue-900 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Purchase Complete
                    </h3>
                    <p className="text-sm text-blue-700">
                      This item has been marked as purchased with an actual
                      price of $
                      {selectedItem.actual_price ||
                        selectedItem.estimated_price ||
                        0}{" "}
                      per unit.
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                <div className="space-y-4">
                  {selectedItem.company && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Company
                      </Label>
                      <p className="text-gray-900">
                        {selectedItem.company.name}
                      </p>
                    </div>
                  )}

                  {selectedItem.link && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Product Link
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 justify-start"
                        asChild
                      >
                        <a
                          href={selectedItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkSimpleIcon className="w-4 h-4 mr-2" />
                          View Product Page
                        </a>
                      </Button>
                    </div>
                  )}

                  {selectedItem.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Notes
                      </Label>
                      <p className="text-gray-900 bg-gray-50 rounded-lg p-3 mt-1">
                        {selectedItem.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t bg-white space-y-3">
                {!selectedItem.purchased ? (
                  <Button
                    onClick={handleMarkAsPurchased}
                    disabled={isUpdating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
                  >
                    {isUpdating ? (
                      <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                    )}
                    Mark as Purchased
                  </Button>
                ) : (
                  <Button
                    onClick={handleMarkAsPurchased}
                    disabled={isUpdating}
                    variant="outline"
                    className="w-full py-3 text-base font-medium"
                  >
                    {isUpdating ? (
                      <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XIcon className="w-5 h-5 mr-2" />
                    )}
                    Mark as Pending
                  </Button>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleEditItem}
                    variant="outline"
                    className="flex-1 py-3"
                    disabled={isUpdating}
                  >
                    <PencilSimpleIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDeleteItem}
                    variant="outline"
                    className="flex-1 py-3 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isUpdating}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
