"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusIcon } from "@phosphor-icons/react";
import {
  useCreateItem,
  useCategories,
  useRooms,
  useCompanies,
} from "@/lib/hooks/useShoppingQueries";

interface CreateItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function CreateItemSheet({
  open,
  onOpenChange,
  workspaceId,
}: CreateItemSheetProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const createItemMutation = useCreateItem(workspaceId);
  const { data: categories = [] } = useCategories(workspaceId);
  const { data: rooms = [] } = useRooms(workspaceId);
  const { data: companies = [] } = useCompanies(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      await createItemMutation.mutateAsync({
        name: name.trim(),
        category_id: categoryId || undefined,
        room_id: roomId || undefined,
        company_id: companyId || undefined,
        est_unit_cents: estimatedPrice
          ? Math.round(parseFloat(estimatedPrice) * 100)
          : 0,
        quantity: parseInt(quantity) || 1,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setName("");
      setCategoryId("");
      setRoomId("");
      setCompanyId("");
      setEstimatedPrice("");
      setQuantity("1");
      setNotes("");
      setIsUrgent(false);

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                <h2 className="text-xl font-bold text-gray-900">Add Item</h2>
                <p className="text-sm text-gray-500">
                  Add a new item to your shopping list
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId || "none"}
                onValueChange={(value) =>
                  setCategoryId(value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Select
                value={roomId || "none"}
                onValueChange={(value) =>
                  setRoomId(value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No room</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={companyId || "none"}
              onValueChange={(value) =>
                setCompanyId(value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select company (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated-price">Estimated Price</Label>
              <Input
                id="estimated-price"
                type="number"
                step="0.01"
                min="0"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="urgent"
              checked={isUrgent}
              onCheckedChange={setIsUrgent}
            />
            <Label htmlFor="urgent" className="text-sm">
              Mark as urgent
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createItemMutation.isPending}
            >
              {createItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
