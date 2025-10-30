"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { PencilIcon, TrashBinIcon } from "@/icons";

type SpriteItem = {
  id?: string;
  name: string;
  roomType: string;
  x: number;
  y: number;
};

const API = "/room-items";

export default function SpriteManagement() {
  const [sprites, setSprites] = useState<SpriteItem[]>([]);
  const [form, setForm] = useState<Omit<SpriteItem, "id">>({ name: "", roomType: "", x: 0, y: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const pagedSprites = sprites.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const openAdd = () => { setEditing(null); setForm({ name: "", roomType: "", x: 0, y: 0 }); setIsModalOpen(true); };
  const openEdit = (row: SpriteItem) => { setEditing(row.id ?? null); setForm({ name: row.name, roomType: row.roomType, x: row.x, y: row.y }); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    api.get<SpriteItem[]>(API)
      .then(setSprites)
      .catch(() => setSprites([]));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "x" || name === "y" ? +value : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editing) {
      await api.put(`${API}/${editing}`, form);
    } else {
      await api.post(API, form);
    }
    setIsModalOpen(false);
    api.get<SpriteItem[]>(API).then(setSprites);
  };
  const handleDelete = async (id: string | undefined) => {
    if(!id) return;
    await api.del(`${API}/${id}`);
    api.get<SpriteItem[]>(API).then(setSprites);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Sprite Management</h1>
        <Button size="sm" onClick={openAdd}>Add Sprite</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md">
          <thead className="bg-gray-50 dark:bg_white/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">X</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Y</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedSprites.map((row: SpriteItem, index) => {
              const fallbackKey = `${row.name}-${row.roomType}-${row.x}-${row.y}-${index}`;
              return (
                <tr key={row.id ?? fallbackKey} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{row.roomType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{row.x}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{row.y}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="ml-auto flex items-center justify-end gap-2">
                      <button aria-label="Edit" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => openEdit(row)}>
                        <PencilIcon />
                      </button>
                      <button aria-label="Delete" className="p-2 rounded-lg hover:bg-gray-100 text-error-500 dark:hover:bg-white/5" onClick={() => handleDelete(row.id)}>
                        <TrashBinIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between py-3">
        <Button size="sm" variant="outline" onClick={()=>setPage(Math.max(1,page-1))} disabled={page === 1}>Previous</Button>
        <span className="text-xs text-gray-500">Page {page} of {Math.ceil(sprites.length/ITEMS_PER_PAGE)||1}</span>
        <Button size="sm" variant="outline" onClick={()=>setPage(page+1)} disabled={page===Math.ceil(sprites.length/ITEMS_PER_PAGE)||sprites.length===0}>Next</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-[640px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">{editing ? "Edit Sprite" : "Add Sprite"}</h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleInputChange} placeholder="Name" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <input name="roomType" value={form.roomType} onChange={handleInputChange} placeholder="Room Type" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <input name="x" type="number" value={form.x} onChange={handleInputChange} placeholder="X" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
            <input name="y" type="number" value={form.y} onChange={handleInputChange} placeholder="Y" className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" required />
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
