"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon } from "@/icons";

type Invoice = { id: number; invoiceNumber: string; user: string; amount: number; status: "Paid"|"Pending"|"Overdue"; date: string };

const initialInvoices: Invoice[] = [
  { id: 1, invoiceNumber: "INV-001", user: "Jane Doe", amount: 1200000, status: "Paid", date: "2024-05-01" },
  { id: 2, invoiceNumber: "INV-002", user: "John Smith", amount: 800000, status: "Pending", date: "2024-05-03" },
];

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [editing, setEditing] = useState<Invoice|null>(null);
  const modal = useModal();

  const openEdit = (inv: Invoice) => { setEditing(inv); modal.openModal(); };
  const closeEdit = () => { setEditing(null); modal.closeModal(); };
  const handleDelete = (id: number) => setInvoices(invoices.filter(inv => inv.id !== id));

  const renderStatus = (status: Invoice["status"]) => {
    const cls = status === "Paid" ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
      : status === "Pending" ? "bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
      : "bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400";
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Invoice Management</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md">
          <thead className="bg-gray-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{inv.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-300">{inv.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderStatus(inv.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{inv.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="ml-auto flex items-center justify-end gap-2">
                    <button aria-label="Edit" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => openEdit(inv)}>
                      <PencilIcon />
                    </button>
                    <button aria-label="Delete" className="p-2 rounded-lg hover:bg-gray-100 text-error-500 dark:hover:bg_white/5" onClick={() => handleDelete(inv.id)}>
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
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">Edit Invoice</h4>
        {editing && (
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between"><span className="font-medium">Invoice #</span><span>{editing.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="font-medium">User</span><span>{editing.user}</span></div>
            <div className="flex justify-between"><span className="font-medium">Amount</span><span>{editing.amount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="font-medium">Status</span><span>{editing.status}</span></div>
            <div className="flex justify-between"><span className="font-medium">Date</span><span>{editing.date}</span></div>
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
