"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OnboardingData, DEFAULT_CATEGORIES, DEFAULT_ROOMS } from "@/lib/types";
import { Package, Home, Check } from "lucide-react";

interface CategoriesRoomsStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onComplete: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function CategoriesRoomsStep({
  data,
  onUpdate,
  onComplete,
  onPrevious,
  isSubmitting,
}: CategoriesRoomsStepProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    data.selectedCategories.length > 0
      ? data.selectedCategories
      : DEFAULT_CATEGORIES.map((c) => c.name)
  );
  const [selectedRooms, setSelectedRooms] = useState<string[]>(
    data.selectedRooms.length > 0 ? data.selectedRooms : DEFAULT_ROOMS
  );

  const toggleCategory = (categoryName: string) => {
    const updated = selectedCategories.includes(categoryName)
      ? selectedCategories.filter((name) => name !== categoryName)
      : [...selectedCategories, categoryName];

    setSelectedCategories(updated);
    onUpdate({ selectedCategories: updated });
  };

  const toggleRoom = (roomName: string) => {
    const updated = selectedRooms.includes(roomName)
      ? selectedRooms.filter((name) => name !== roomName)
      : [...selectedRooms, roomName];

    setSelectedRooms(updated);
    onUpdate({ selectedRooms: updated });
  };

  const handleComplete = () => {
    onUpdate({
      selectedCategories,
      selectedRooms,
    });
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose Your Organization System
        </h3>
        <p className="text-gray-600 text-sm">
          Select the categories and rooms that make sense for your move. You can
          always add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Categories</h4>
            <span className="text-sm text-gray-500">
              ({selectedCategories.length} selected)
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {DEFAULT_CATEGORIES.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <Label
                    htmlFor={`category-${category.name}`}
                    className="font-medium"
                  >
                    {category.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedCategories.includes(category.name) && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  <Switch
                    id={`category-${category.name}`}
                    checked={selectedCategories.includes(category.name)}
                    onCheckedChange={() => toggleCategory(category.name)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Home className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Rooms</h4>
            <span className="text-sm text-gray-500">
              ({selectedRooms.length} selected)
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {DEFAULT_ROOMS.map((room) => (
              <div
                key={room}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <Label htmlFor={`room-${room}`} className="font-medium">
                  {room}
                </Label>
                <div className="flex items-center space-x-2">
                  {selectedRooms.includes(room) && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  <Switch
                    id={`room-${room}`}
                    checked={selectedRooms.includes(room)}
                    onCheckedChange={() => toggleRoom(room)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-green-600 mt-0.5">✨</div>
          <div>
            <h4 className="font-medium text-green-900">
              Flexible Organization
            </h4>
            <p className="text-sm text-green-800">
              You can view your items and budgets by category or by room -
              whatever works best for you at the moment!
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        <Button
          onClick={handleComplete}
          disabled={
            isSubmitting ||
            (selectedCategories.length === 0 && selectedRooms.length === 0)
          }
          className="px-8"
        >
          {isSubmitting ? "Creating Workspace..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
}
