"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { PencilIcon } from "@/icons";

type Subscription = {
  id?: string;
  planId: string;
  period: number;
  durationInDays: number;
  amountVnd: number;
  isActive: boolean;
};
const API = "/PlanPrice";

export default function SubscriptionManagement() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [form, setForm] = useState<Omit<Subscription, "id">>({ planId: "", period: 0, durationInDays: 0, amountVnd: 0, isActive: true });
  const [editing, setEditing] = useState<string|null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ planId: "", period: 0, durationInDays: 0, amountVnd: 0, isActive: true }); setIsModalOpen(true); };
  const openEdit = (item: Subscription) => { setEditing(item.id ?? null); setForm({ planId: item.planId, period: item.period, durationInDays: item.durationInDays, amountVnd: item.amountVnd, isActive: item.isActive }); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    api.get<Subscription[]>(API)
      .then(setSubs)
      .catch(() => setSubs([]));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editing) {
      await api.put(`${API}/${editing}`, form);
    } else {
      await api.post(API, form);
    }
    setIsModalOpen(false);
    api.get<Subscription[]>(API).then(setSubs);
  };

  const renderActive = (isActive: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isActive
        ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
    }`}>{isActive ? "Active" : "Inactive"}</span>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Subscription Management</h1>
        <Button size="sm" onClick={openAdd}>Add Price</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md">
          <thead className="bg-gray-50 dark:bg_white/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PlanId</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration (days)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (VND)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((row: Subscription, index) => {
              const fallbackKey = `${row.planId}-${row.period}-${row.durationInDays}-${row.amountVnd}-${index}`;
              return (
                <tr key={row.id ?? fallbackKey} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-white/90">{row.planId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{row.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{row.durationInDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-white/90">{row.amountVnd.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderActive(row.isActive)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="ml-auto flex items-center justify-end gap-2">
                      <button aria-label="Edit" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => openEdit(row)}>
                        <PencilIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-[680px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">{editing ? "Edit Price" : "Add Price"}</h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="planId" value={form.planId} onChange={handleInputChange} placeholder="Plan ID" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <input name="period" type="number" value={form.period} onChange={handleInputChange} placeholder="Period" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <input name="durationInDays" type="number" value={form.durationInDays} onChange={handleInputChange} placeholder="Days" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <input name="amountVnd" type="number" value={form.amountVnd} onChange={handleInputChange} placeholder="Amount VND" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <label className="flex gap-2 items-center"><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleInputChange}/>Active</label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={closeModal}>Cancel</Button>
            <Button size="sm" type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
