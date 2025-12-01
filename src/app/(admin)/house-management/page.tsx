"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon, MoreDotIcon, ChevronLeftIcon, ArrowRightIcon, PlusIcon } from "@/icons";
import { getErrorMessage } from "@/lib/errorHandler";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

type House = { 
  id: number; 
  name: string; 
  address: string; 
  type: string; 
  owner: string; 
  status: "Available" | "Rented" 
};

const initialHouses: House[] = [
  { id: 1, name: "Sunshine Villa", address: "123 Main St", type: "Villa", owner: "Jane Doe", status: "Available" },
  { id: 2, name: "Downtown Loft", address: "88 High St", type: "Loft", owner: "John Smith", status: "Rented" },
];

export default function HouseManagement() {
  const [houses, setHouses] = useState<House[]>(initialHouses);
  const loading = false; // TODO: Implement loading state when API is integrated
  const [editing, setEditing] = useState<House | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const modal = useModal();

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = "Quản lý Nhà - HomeTrack Admin";
  }, []);

  const openEdit = (house: House) => {
    setEditing(house);
    setOpenMenuId(null);
    modal.openModal();
  };

  const openAdd = () => {
    setEditing(null);
    modal.openModal();
  };

  const closeEdit = () => {
    setEditing(null);
    modal.closeModal();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhà này?")) return;
    try {
      // TODO: Replace with actual delete API endpoint when available
      // await api.del(`/api/House/${id}`);
      setHouses(houses.filter(h => h.id !== id));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to delete house:", error);
      const errorMessage = getErrorMessage(error, "Không thể xóa nhà");
      alert(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) {
      // Add new house
      const newHouse: House = {
        id: houses.length + 1,
        name: (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value,
        address: (e.currentTarget.elements.namedItem("address") as HTMLInputElement).value,
        type: (e.currentTarget.elements.namedItem("type") as HTMLInputElement).value,
        owner: (e.currentTarget.elements.namedItem("owner") as HTMLInputElement).value,
        status: (e.currentTarget.elements.namedItem("status") as HTMLSelectElement).value as "Available" | "Rented",
      };
      setHouses([...houses, newHouse]);
    } else {
      // Update existing house
      const updatedHouse: House = {
        ...editing,
        name: (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value,
        address: (e.currentTarget.elements.namedItem("address") as HTMLInputElement).value,
        type: (e.currentTarget.elements.namedItem("type") as HTMLInputElement).value,
        owner: (e.currentTarget.elements.namedItem("owner") as HTMLInputElement).value,
        status: (e.currentTarget.elements.namedItem("status") as HTMLSelectElement).value as "Available" | "Rented",
      };
      setHouses(houses.map(h => h.id === editing.id ? updatedHouse : h));
    }
    closeEdit();
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEditClick = (house: House) => {
    setOpenMenuId(null);
    openEdit(house);
  };

  const handleDeleteClick = (id: number) => {
    setOpenMenuId(null);
    handleDelete(id);
  };

  const renderStatus = (status: House["status"]) => {
    const isAvailable = status === "Available";
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isAvailable
          ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
          : "bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400"
      }`}>
        {isAvailable ? "Có sẵn" : "Đã cho thuê"}
      </span>
    );
  };

  // Filter and pagination logic
  const filteredHouses = useMemo(() => {
    return houses.filter(house => {
      // Filter by name
      if (filterName && !house.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      // Filter by address
      if (filterAddress && !house.address.toLowerCase().includes(filterAddress.toLowerCase())) {
        return false;
      }
      // Filter by type
      if (filterType !== "all" && house.type !== filterType) {
        return false;
      }
      // Filter by status
      if (filterStatus !== "all") {
        const statusValue = filterStatus === "Available";
        if ((house.status === "Available") !== statusValue) {
          return false;
        }
      }
      return true;
    });
  }, [houses, filterName, filterAddress, filterType, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredHouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHouses = filteredHouses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterAddress, filterType, filterStatus]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterName("");
    setFilterAddress("");
    setFilterType("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterName || filterAddress || filterType !== "all" || filterStatus !== "all";

  // Get unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(houses.map(h => h.type)));
  }, [houses]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white/90">Quản lý Nhà</h1>
        <Button size="sm" onClick={openAdd} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
          Thêm Nhà
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter by Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Tên
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Tìm kiếm tên nhà..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Địa Chỉ
            </label>
            <input
              type="text"
              value={filterAddress}
              onChange={(e) => setFilterAddress(e.target.value)}
              placeholder="Tìm kiếm địa chỉ..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Loại
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">Tất cả Loại</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Trạng Thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">Tất cả Trạng Thái</option>
              <option value="Available">Có sẵn</option>
              <option value="Rented">Đã cho thuê</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Hiển thị {filteredHouses.length} trong tổng số {houses.length} nhà
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải danh sách nhà...</p>
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
                    Tên
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Địa Chỉ
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chủ Sở Hữu
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedHouses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-visible">
                          <PlusIcon className="w-6 h-6 text-gray-400 flex-shrink-0 min-w-[1.5rem] min-h-[1.5rem]" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {houses.length === 0 ? "Không tìm thấy nhà nào" : "Không có nhà nào khớp với bộ lọc của bạn"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {houses.length === 0 
                            ? "Thử thêm nhà mới hoặc quay lại sau" 
                            : "Thử điều chỉnh tiêu chí lọc của bạn"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedHouses.map((house, index) => (
                    <tr 
                      key={house.id} 
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {startIndex + index + 1}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white/90 text-sm">
                          {house.name}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {house.address}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 whitespace-nowrap">
                          {house.type}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {house.owner}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {renderStatus(house.status)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="relative flex items-center justify-end overflow-visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(house.id);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors dropdown-toggle flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] overflow-visible"
                            aria-label="Tùy chọn khác"
                            title="Tùy chọn khác"
                          >
                            <MoreDotIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[1.25rem] min-h-[1.25rem]" />
                          </button>
                          <Dropdown
                            isOpen={openMenuId === house.id}
                            onClose={() => setOpenMenuId(null)}
                            className="min-w-[160px]"
                          >
                            <div className="py-1">
                              <DropdownItem
                                onClick={() => handleEditClick(house)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <PencilIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>Sửa</span>
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => handleDeleteClick(house.id)}
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
          {filteredHouses.length > 0 && (
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
                  <span>trong tổng số {filteredHouses.length} nhà</span>
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
      <Modal isOpen={modal.isOpen} onClose={closeEdit} className="max-w-[560px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">
          {editing ? "Sửa Nhà" : "Thêm Nhà Mới"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên Nhà
            </label>
            <input
              type="text"
              name="name"
              defaultValue={editing?.name || ""}
              required
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              placeholder="Nhập tên nhà"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Địa Chỉ
            </label>
            <input
              type="text"
              name="address"
              defaultValue={editing?.address || ""}
              required
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              placeholder="Nhập địa chỉ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại
            </label>
            <input
              type="text"
              name="type"
              defaultValue={editing?.type || ""}
              required
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              placeholder="Nhập loại nhà"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chủ Sở Hữu
            </label>
            <input
              type="text"
              name="owner"
              defaultValue={editing?.owner || ""}
              required
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              placeholder="Nhập tên chủ sở hữu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng Thái
            </label>
            <select
              name="status"
              defaultValue={editing?.status || "Available"}
              required
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="Available">Có sẵn</option>
              <option value="Rented">Đã cho thuê</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button size="sm" variant="outline" type="button" onClick={closeEdit}>
              Hủy
            </Button>
            <Button size="sm" type="submit">
              {editing ? "Cập Nhật" : "Thêm"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
