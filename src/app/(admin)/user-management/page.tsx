"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { MoreDotIcon, PencilIcon, TrashBinIcon } from "@/icons";

type User = { id: number; name: string; email: string; role: string; status: "Active"|"Inactive" };

const initialUsers: User[] = [
  { id: 1, name: "Jane Doe", email: "jane@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "John Smith", email: "john@example.com", role: "User", status: "Inactive" },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editing, setEditing] = useState<number|null>(null);
  const [form, setForm] = useState<Omit<User, "id">>({ name: "", email: "", role: "User", status: "Active" });
  const modal = useModal();

  const openAdd = () => { setEditing(null); setForm({ name: "", email: "", role: "User", status: "Active" }); modal.openModal(); };
  const openEdit = (user: User) => { setEditing(user.id); setForm({ name: user.name, email: user.email, role: user.role, status: user.status }); modal.openModal(); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editing) {
      setUsers(users.map(u => (u.id === editing ? { ...form, id: editing } as User : u)));
    } else {
      setUsers([ ...users, { ...form, id: Date.now() } as User ]);
    }
    modal.closeModal();
  };

  const handleDelete = (id: number) => setUsers(users.filter(u => u.id !== id));

  const renderStatus = (status: User["status"]) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      status === "Active"
        ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
    }`}>{status}</span>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">User Management</h1>
        <Button size="sm" onClick={openAdd}>Add User</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md">
          <thead className="bg-gray-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-white/90">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderStatus(user.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="ml-auto flex items-center justify-end gap-2">
                    <button aria-label="Edit" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => openEdit(user)}>
                      <PencilIcon />
                    </button>
                    <button aria-label="Delete" className="p-2 rounded-lg hover:bg-gray-100 text-error-500 dark:hover:bg-white/5" onClick={() => handleDelete(user.id)}>
                      <TrashBinIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-[640px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">{editing ? "Edit User" : "Add User"}</h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input name="name" value={form.name} onChange={handleInputChange} placeholder="Full name" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 flex-1" required />
            <input name="email" value={form.email} type="email" onChange={handleInputChange} placeholder="Email" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 flex-1" required />
          </div>
          <div className="flex gap-4">
            <select name="role" value={form.role} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
              <option>User</option><option>Admin</option>
            </select>
            <select name="status" value={form.status} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={modal.closeModal}>Cancel</Button>
            <Button size="sm" type="submit" onClick={() => {}}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
