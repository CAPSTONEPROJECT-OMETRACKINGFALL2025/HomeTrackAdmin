"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon, MoreDotIcon, ChevronLeftIcon, ArrowRightIcon, PlusIcon } from "@/icons";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorHandler";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

type RoomItem = {
  roomItemId: string;
  item: string;
  subName: string;
  roomType: string;
  defaultX: number;
  defaultY: number;
};

type RoomItemForm = {
  item: string;
  subName: string;
  roomType: string;
  defaultX: number;
  defaultY: number;
};

export default function SpriteManagement() {
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RoomItemForm>({ item: "", subName: "", roomType: "", defaultX: 0, defaultY: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const modal = useModal();

  // Filter states
  const [filterItem, setFilterItem] = useState("");
  const [filterSubName, setFilterSubName] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = "Quản lý Sprite - HomeTrack Admin";
  }, []);

  useEffect(() => {
    fetchRoomItems();
  }, []);

  const fetchRoomItems = async () => {
    try {
      setLoading(true);
      const response = await api.get<RoomItem[]>("/RoomItem");
      setRoomItems(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch room items:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải danh sách vật phẩm phòng");
      alert(errorMessage);
      setRoomItems([]);
    } finally {
      setLoading(false);
    }
  };


  const openAdd = () => {
    setEditing(null);
    setForm({ item: "", subName: "", roomType: "", defaultX: 0, defaultY: 0 });
    modal.openModal();
  };

  const openEdit = async (roomItem: RoomItem) => {
    try {
      setEditing(roomItem.roomItemId);
      setForm({
        item: roomItem.item,
        subName: roomItem.subName,
        roomType: roomItem.roomType,
        defaultX: roomItem.defaultX,
        defaultY: roomItem.defaultY,
      });
      setOpenMenuId(null);
      modal.openModal();
    } catch (error) {
      console.error("Failed to load room item for editing:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải chi tiết vật phẩm phòng");
      alert(errorMessage);
    }
  };

  const closeModal = () => {
    setEditing(null);
    setForm({ item: "", subName: "", roomType: "", defaultX: 0, defaultY: 0 });
    modal.closeModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === "defaultX" || name === "defaultY" ? Number(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/RoomItem/${editing}`, form);
      } else {
        await api.post("/RoomItem", form);
      }
      await fetchRoomItems();
      closeModal();
    } catch (error) {
      console.error("Failed to save room item:", error);
      const errorMessage = getErrorMessage(error, "Không thể lưu vật phẩm phòng. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vật phẩm phòng này?")) return;
    try {
      await api.del(`/api/RoomItem/${id}`);
      setOpenMenuId(null);
      await fetchRoomItems();
    } catch (error) {
      console.error("Failed to delete room item:", error);
      const errorMessage = getErrorMessage(error, "Không thể xóa vật phẩm phòng. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEditClick = (roomItem: RoomItem) => {
    setOpenMenuId(null);
    openEdit(roomItem);
  };

  const handleDeleteClick = (id: string) => {
    setOpenMenuId(null);
    handleDelete(id);
  };

  // Filter and pagination logic
  const filteredItems = useMemo(() => {
    return roomItems.filter(item => {
      // Filter by item name
      if (filterItem && !item.item.toLowerCase().includes(filterItem.toLowerCase())) {
        return false;
      }
      // Filter by sub name
      if (filterSubName && !item.subName.toLowerCase().includes(filterSubName.toLowerCase())) {
        return false;
      }
      // Filter by room type
      if (filterRoomType && !item.roomType.toLowerCase().includes(filterRoomType.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [roomItems, filterItem, filterSubName, filterRoomType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterItem, filterSubName, filterRoomType]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterItem("");
    setFilterSubName("");
    setFilterRoomType("");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterItem || filterSubName || filterRoomType;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white/90">Quản lý Sprite</h1>
        <Button size="sm" onClick={openAdd} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
          Thêm Vật Phẩm
        </Button>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bộ lọc</h2>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Xóa tất cả
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filter by Item */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Vật Phẩm
            </label>
            <input
              type="text"
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
              placeholder="Tìm kiếm vật phẩm..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Sub Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Tên Phụ
            </label>
            <input
              type="text"
              value={filterSubName}
              onChange={(e) => setFilterSubName(e.target.value)}
              placeholder="Tìm kiếm tên phụ..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Room Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Loại Phòng
            </label>
            <input
              type="text"
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value)}
              placeholder="Tìm kiếm loại phòng..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Hiển thị {filteredItems.length} trong tổng số {roomItems.length} vật phẩm
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải vật phẩm phòng...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vật Phẩm
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tên Phụ
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Loại Phòng
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vị Trí X Mặc Định
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vị Trí Y Mặc Định
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-visible">
                          <PlusIcon className="w-6 h-6 text-gray-400 flex-shrink-0 min-w-[1.5rem] min-h-[1.5rem]" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {roomItems.length === 0 ? "Không tìm thấy vật phẩm phòng nào" : "Không có vật phẩm nào khớp với bộ lọc của bạn"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {roomItems.length === 0 
                            ? "Thử thêm vật phẩm phòng mới hoặc quay lại sau" 
                            : "Thử điều chỉnh tiêu chí lọc của bạn"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => (
                    <tr 
                      key={item.roomItemId} 
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {startIndex + index + 1}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white/90 text-sm">
                          {item.item}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.subName}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 whitespace-nowrap">
                          {item.roomType}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {item.defaultX}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {item.defaultY}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="relative flex items-center justify-end overflow-visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(item.roomItemId);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors dropdown-toggle flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] overflow-visible"
                            aria-label="Tùy chọn khác"
                            title="Tùy chọn khác"
                          >
                            <MoreDotIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[1.25rem] min-h-[1.25rem]" />
                          </button>
                          <Dropdown
                            isOpen={openMenuId === item.roomItemId}
                            onClose={() => setOpenMenuId(null)}
                            className="min-w-[160px]"
                          >
                            <div className="py-1">
                              <DropdownItem
                                onClick={() => handleEditClick(item)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <PencilIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>Sửa</span>
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => handleDeleteClick(item.roomItemId)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <TrashBinIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>Xóa</span>
                              </DropdownItem>
                            </div>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 bg-gray-50 dark:bg-white/[0.02]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>trong tổng số {filteredItems.length} vật phẩm</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    aria-label="Trang trước"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[2rem] px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-orange-500 text-white"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    aria-label="Trang sau"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.isOpen} onClose={closeModal} className="max-w-[640px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">
          {editing ? "Sửa Vật Phẩm Phòng" : "Thêm Vật Phẩm Phòng"}
        </h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên Vật Phẩm <span className="text-error-500">*</span>
              </label>
              <input
                name="item"
                value={form.item}
                onChange={handleInputChange}
                placeholder="Ví dụ: bed, desk, chair"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên Phụ <span className="text-error-500">*</span>
              </label>
              <input
                name="subName"
                value={form.subName}
                onChange={handleInputChange}
                placeholder="Ví dụ: Giường, Bàn làm việc"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại Phòng <span className="text-error-500">*</span>
              </label>
              <input
                name="roomType"
                value={form.roomType}
                onChange={handleInputChange}
                placeholder="Ví dụ: Bedroom, Kitchen, Living Room"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vị Trí X Mặc Định <span className="text-error-500">*</span>
              </label>
              <input
                name="defaultX"
                type="number"
                value={form.defaultX}
                onChange={handleInputChange}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vị Trí Y Mặc Định <span className="text-error-500">*</span>
              </label>
              <input
                name="defaultY"
                type="number"
                value={form.defaultY}
                onChange={handleInputChange}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={closeModal}>Hủy</Button>
            <Button size="sm" type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
