"use client";
import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorHandler";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon, MoreDotIcon, ChevronLeftIcon, ArrowRightIcon, PlusIcon, EyeIcon } from "@/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

type Plan = {
  planId?: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};
const API = "/plans";

export default function PlanManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Plan, "planId">>({ code: "", name: "", description: "", isActive: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const modal = useModal();
  const detailModal = useModal();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter states
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = "Quản lý Gói - HomeTrack Admin";
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get<Plan[]>(API);
      setPlans(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải danh sách gói");
      alert(errorMessage);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "", isActive: true });
    modal.openModal();
  };

  const openEdit = (item: Plan) => {
    setEditing(item.planId ?? null);
    setForm({ code: item.code, name: item.name, description: item.description || "", isActive: item.isActive });
    setOpenMenuId(null);
    modal.openModal();
  };

  const closeModal = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "", isActive: true });
    modal.closeModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const requestBody = {
        code: form.code,
        name: form.name,
        description: form.description || null,
        isActive: form.isActive
      };
      if (editing) {
        await api.put(`${API}/${editing}`, requestBody);
      } else {
        await api.post(API, requestBody);
      }
      closeModal();
      await fetchPlans();
    } catch (error) {
      console.error("Failed to save plan:", error);
      const errorMessage = getErrorMessage(error, "Không thể lưu gói. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa gói này?")) return;
    try {
      await api.del(`${API}/${id}`);
      setOpenMenuId(null);
      await fetchPlans();
    } catch (error) {
      console.error("Failed to delete plan:", error);
      const errorMessage = getErrorMessage(error, "Không thể xóa gói. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEditClick = (item: Plan) => {
    setOpenMenuId(null);
    openEdit(item);
  };

  const handleDeleteClick = (id: string) => {
    setOpenMenuId(null);
    handleDelete(id);
  };

  const handleViewClick = async (item: Plan) => {
    setOpenMenuId(null);
    if (item.planId) {
      try {
        setLoadingDetail(true);
        const planDetail = await api.get<Plan>(`${API}/${item.planId}`);
        setSelectedPlan(planDetail);
        detailModal.openModal();
      } catch (error) {
        console.error("Failed to fetch plan details:", error);
        const errorMessage = getErrorMessage(error, "Không thể tải chi tiết gói. Vui lòng thử lại.");
        alert(errorMessage);
      } finally {
        setLoadingDetail(false);
      }
    } else {
      // If no planId, just show the item data we already have
      setSelectedPlan(item);
      detailModal.openModal();
    }
  };

  const closeDetailModal = () => {
    setSelectedPlan(null);
    detailModal.closeModal();
  };

  const renderActive = (isActive: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isActive
        ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
    }`}>{isActive ? "Hoạt động" : "Không hoạt động"}</span>
  );

  // Filter and pagination logic
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      // Filter by code
      if (filterCode && !plan.code.toLowerCase().includes(filterCode.toLowerCase())) {
        return false;
      }
      // Filter by name
      if (filterName && !plan.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      // Filter by status
      if (filterStatus !== "all") {
        const statusValue = filterStatus === "active";
        if (plan.isActive !== statusValue) {
          return false;
        }
      }
      return true;
    });
  }, [plans, filterCode, filterName, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCode, filterName, filterStatus]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterCode("");
    setFilterName("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterCode || filterName || filterStatus !== "all";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white/90">Quản lý Gói</h1>
        <Button size="sm" onClick={openAdd} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
          Thêm Gói
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filter by Code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Mã Gói
            </label>
            <input
              type="text"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              placeholder="Tìm kiếm mã gói..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Tên Gói
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Tìm kiếm tên gói..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
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
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Hiển thị {filteredPlans.length} trong tổng số {plans.length} gói
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải gói...</p>
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
                    ID Gói
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mã Gói
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tên Gói
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mô Tả
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
                {paginatedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-visible">
                          <PlusIcon className="w-6 h-6 text-gray-400 flex-shrink-0 min-w-[1.5rem] min-h-[1.5rem]" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {plans.length === 0 ? "Không tìm thấy gói nào" : "Không có gói nào khớp với bộ lọc của bạn"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {plans.length === 0 
                            ? "Thử thêm gói mới hoặc quay lại sau" 
                            : "Thử điều chỉnh tiêu chí lọc của bạn"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map((row, index) => {
                    const fallbackKey = `${row.code}-${row.name}-${index}`;
                    return (
                      <tr 
                        key={row.planId ?? fallbackKey} 
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {startIndex + index + 1}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {row.planId || "-"}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-medium text-gray-800 dark:text-white/90 text-sm">
                            {row.code}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-medium text-gray-800 dark:text-white/90 text-sm">
                            {row.name}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={row.description || ""}>
                            {row.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          {renderActive(row.isActive)}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="relative flex items-center justify-end overflow-visible">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(row.planId ?? fallbackKey);
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors dropdown-toggle flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] overflow-visible"
                              aria-label="Tùy chọn khác"
                              title="Tùy chọn khác"
                            >
                              <MoreDotIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[1.25rem] min-h-[1.25rem]" />
                            </button>
                            <Dropdown
                              isOpen={openMenuId === (row.planId ?? fallbackKey)}
                              onClose={() => setOpenMenuId(null)}
                              className="min-w-[160px]"
                            >
                              <div className="py-1">
                                <DropdownItem
                                  onClick={() => handleViewClick(row)}
                                  baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  className="flex items-center gap-2"
                                >
                                  <EyeIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                  <span>Xem</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleEditClick(row)}
                                  baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  className="flex items-center gap-2"
                                >
                                  <PencilIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                  <span>Sửa</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleDeleteClick(row.planId ?? fallbackKey)}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredPlans.length > 0 && (
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
                  <span>trong tổng số {filteredPlans.length} gói</span>
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
      <Modal isOpen={modal.isOpen} onClose={closeModal} className="max-w-[680px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">
          {editing ? "Sửa Gói" : "Thêm Gói"}
        </h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mã Gói
              </label>
              <input
                name="code"
                value={form.code}
                onChange={handleInputChange}
                placeholder="Mã Gói"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên Gói
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Tên Gói"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô Tả
              </label>
              <textarea
                name="description"
                value={form.description || ""}
                onChange={handleInputChange}
                placeholder="Mô tả gói..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Hoạt động</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={closeModal}>
              Hủy
            </Button>
            <Button size="sm" type="submit">
              Lưu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Plan Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onClose={closeDetailModal} className="max-w-[680px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">
          Chi Tiết Gói
        </h4>
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-400">Đang tải chi tiết...</p>
            </div>
          </div>
        ) : selectedPlan ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  ID Gói
                </label>
                <div className="text-sm text-gray-900 dark:text-white/90 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  {selectedPlan.planId || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Mã Gói
                </label>
                <div className="text-sm text-gray-900 dark:text-white/90 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  {selectedPlan.code}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tên Gói
                </label>
                <div className="text-sm text-gray-900 dark:text-white/90 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  {selectedPlan.name}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Mô Tả
                </label>
                <div className="text-sm text-gray-900 dark:text-white/90 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg min-h-[60px] whitespace-pre-wrap">
                  {selectedPlan.description || "-"}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Trạng Thái
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  {renderActive(selectedPlan.isActive)}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button size="sm" variant="outline" type="button" onClick={closeDetailModal}>
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Không có thông tin để hiển thị
          </div>
        )}
      </Modal>
    </div>
  );
}

