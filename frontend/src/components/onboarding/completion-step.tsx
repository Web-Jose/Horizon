"use client";

import { CheckCircle, Home, UsersIcon, Package } from "lucide-react";

export function CompletionStep() {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Workspace Created! 🎉
        </h3>
        <p className="text-gray-600">
          Your moving planner is ready to use. Redirecting you to your
          dashboard...
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex flex-col items-center text-center">
            <Home className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-blue-900">Workspace Ready</h4>
            <p className="text-sm text-blue-700">Your shared space is set up</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex flex-col items-center text-center">
            <Package className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-medium text-green-900">Categories & Rooms</h4>
            <p className="text-sm text-green-700">
              Organization system configured
            </p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex flex-col items-center text-center">
            <UsersIcon className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-purple-900">Partner Invited</h4>
            <p className="text-sm text-purple-700">Collaboration is enabled</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-yellow-900 mb-2">What&#39;s next?</h4>
        <ul className="text-sm text-yellow-800 space-y-1 text-left">
          <li>• Start adding items to your shopping lists</li>
          <li>• Set up budgets for each room</li>
          <li>• Create tasks and milestones for your move</li>
          <li>• Add companies and their fee structures</li>
        </ul>
      </div>
    </div>
  );
}
