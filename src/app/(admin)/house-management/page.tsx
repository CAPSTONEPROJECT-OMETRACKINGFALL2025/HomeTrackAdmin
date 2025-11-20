"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon } from "@/icons";

type House = { id: number; name: string; address: string; type: string; owner: string; status: "Available"|"Rented" };

const initialHouses: House[] = [
  { id: 1, name: "Sunshine Villa", address: "123 Main St", type: "Villa", owner: "Jane Doe", status: "Available" },
  { id: 2, name: "Downtown Loft", address: "88 High St", type: "Loft", owner: "John Smith", status: "Rented" },
];

export default function HouseManagement() {
  const [houses, setHouses] = useState<House[]>(initialHouses);
  const [editing, setEditing] = useState<House|null>(null);
  const modal = useModal();

  useEffect(() => {
    document.title = "House Management - HomeTrack Admin";
  }, []);

  const openEdit = (house: House) => { setEditing(house); modal.openModal(); };
  const closeEdit = () => { setEditing(null); modal.closeModal(); };
  const handleDelete = (id: number) => setHouses(houses.filter(h => h.id !== id));

  const renderStatus = (status: House["status"]) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      status === "Available"
        ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400"
    }`}>{status}</span>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">House Management</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md">
          <thead className="bg-gray-50 dark:bg_white/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {houses.map(house => (
              <tr key={house.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{house.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{house.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{house.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{house.owner}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderStatus(house.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="ml-auto flex items-center justify-end gap-2">
                    <button aria-label="Edit" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => openEdit(house)}>
                      <PencilIcon />
                    </button>
                    <button aria-label="Delete" className="p-2 rounded-lg hover:bg-gray-100 text-error-500 dark:hover:bg-white/5" onClick={() => handleDelete(house.id)}>
                      <TrashBinIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.isOpen} onClose={closeEdit} className="max-w-[560px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">House Details</h4>
        {editing && (
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between"><span className="font-medium">Name</span><span>{editing.name}</span></div>
            <div className="flex justify-between"><span className="font-medium">Address</span><span>{editing.address}</span></div>
            <div className="flex justify-between"><span className="font-medium">Type</span><span>{editing.type}</span></div>
            <div className="flex justify-between"><span className="font-medium">Owner</span><span>{editing.owner}</span></div>
            <div className="flex justify-between"><span className="font-medium">Status</span><span>{editing.status}</span></div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button size="sm" variant="outline" onClick={closeEdit}>Close</Button>
          <Button size="sm" onClick={closeEdit}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
