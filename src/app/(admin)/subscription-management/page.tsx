"use client";
import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorHandler";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon, MoreDotIcon, ChevronLeftIcon, ArrowRightIcon, PlusIcon } from "@/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

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
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Subscription, "id">>({ planId: "", period: 0, durationInDays: 0, amountVnd: 0, isActive: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const modal = useModal();

  // Filter states
  const [filterPlanId, setFilterPlanId] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = "Quản lý Gói Đăng Ký - HomeTrack Admin";
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get<Subscription[]>(API);
      setSubs(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải danh sách gói đăng ký");
      alert(errorMessage);
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ planId: "", period: 0, durationInDays: 0, amountVnd: 0, isActive: true });
    modal.openModal();
  };

  const openEdit = (item: Subscription) => {
    setEditing(item.id ?? null);
    setForm({ planId: item.planId, period: item.period, durationInDays: item.durationInDays, amountVnd: item.amountVnd, isActive: item.isActive });
    setOpenMenuId(null);
    modal.openModal();
  };

  const closeModal = () => {
    setEditing(null);
    setForm({ planId: "", period: 0, durationInDays: 0, amountVnd: 0, isActive: true });
    modal.closeModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`${API}/${editing}`, form);
      } else {
        await api.post(API, form);
      }
      closeModal();
      await fetchSubscriptions();
    } catch (error) {
      console.error("Failed to save subscription:", error);
      const errorMessage = getErrorMessage(error, "Không thể lưu gói đăng ký. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa gói đăng ký này?")) return;
    try {
      await api.del(`${API}/${id}`);
      setOpenMenuId(null);
      await fetchSubscriptions();
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      const errorMessage = getErrorMessage(error, "Không thể xóa gói đăng ký. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEditClick = (item: Subscription) => {
    setOpenMenuId(null);
    openEdit(item);
  };

  const handleDeleteClick = (id: string) => {
    setOpenMenuId(null);
    handleDelete(id);
  };

  const renderActive = (isActive: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isActive
        ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
    }`}>{isActive ? "Hoạt động" : "Không hoạt động"}</span>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Filter and pagination logic
  const filteredSubs = useMemo(() => {
    return subs.filter(sub => {
      // Filter by plan ID
      if (filterPlanId && !sub.planId.toLowerCase().includes(filterPlanId.toLowerCase())) {
        return false;
      }
      // Filter by period
      if (filterPeriod !== "all") {
        const periodValue = Number(filterPeriod);
        if (sub.period !== periodValue) {
          return false;
        }
      }
      // Filter by status
      if (filterStatus !== "all") {
        const statusValue = filterStatus === "active";
        if (sub.isActive !== statusValue) {
          return false;
        }
      }
      return true;
    });
  }, [subs, filterPlanId, filterPeriod, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubs = filteredSubs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPlanId, filterPeriod, filterStatus]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterPlanId("");
    setFilterPeriod("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterPlanId || filterPeriod !== "all" || filterStatus !== "all";

  // Get unique periods for filter dropdown
  const uniquePeriods = useMemo(() => {
    return Array.from(new Set(subs.map(s => s.period))).sort((a, b) => a - b);
  }, [subs]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white/90">Quản lý Gói Đăng Ký</h1>
        <Button size="sm" onClick={openAdd} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
          Thêm Giá
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
          {/* Filter by Plan ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo ID Gói
            </label>
            <input
              type="text"
              value={filterPlanId}
              onChange={(e) => setFilterPlanId(e.target.value)}
              placeholder="Tìm kiếm ID gói..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Period */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Chu Kỳ
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">Tất cả Chu Kỳ</option>
              {uniquePeriods.map(period => (
                <option key={period} value={period.toString()}>{period}</option>
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
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Hiển thị {filteredSubs.length} trong tổng số {subs.length} gói đăng ký
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải gói đăng ký...</p>
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
                    Chu Kỳ
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thời Hạn (ngày)
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Số Tiền (VND)
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
                {paginatedSubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-visible">
                          <PlusIcon className="w-6 h-6 text-gray-400 flex-shrink-0 min-w-[1.5rem] min-h-[1.5rem]" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {subs.length === 0 ? "Không tìm thấy gói đăng ký nào" : "Không có gói đăng ký nào khớp với bộ lọc của bạn"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {subs.length === 0 
                            ? "Thử thêm gói đăng ký mới hoặc quay lại sau" 
                            : "Thử điều chỉnh tiêu chí lọc của bạn"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSubs.map((row, index) => {
                    const fallbackKey = `${row.planId}-${row.period}-${row.durationInDays}-${row.amountVnd}-${index}`;
                    return (
                      <tr 
                        key={row.id ?? fallbackKey} 
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {startIndex + index + 1}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-medium text-gray-800 dark:text-white/90 text-sm">
                            {row.planId}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {row.period}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {row.durationInDays}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {formatCurrency(row.amountVnd)}
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
                                toggleMenu(row.id ?? fallbackKey);
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors dropdown-toggle flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] overflow-visible"
                              aria-label="Tùy chọn khác"
                              title="Tùy chọn khác"
                            >
                              <MoreDotIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[1.25rem] min-h-[1.25rem]" />
                            </button>
                            <Dropdown
                              isOpen={openMenuId === (row.id ?? fallbackKey)}
                              onClose={() => setOpenMenuId(null)}
                              className="min-w-[160px]"
                            >
                              <div className="py-1">
                                <DropdownItem
                                  onClick={() => handleEditClick(row)}
                                  baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  className="flex items-center gap-2"
                                >
                                  <PencilIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                  <span>Sửa</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleDeleteClick(row.id ?? fallbackKey)}
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
          {filteredSubs.length > 0 && (
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
                  <span>trong tổng số {filteredSubs.length} gói đăng ký</span>
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
          {editing ? "Sửa Giá" : "Thêm Giá"}
        </h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Gói
              </label>
              <input
                name="planId"
                value={form.planId}
                onChange={handleInputChange}
                placeholder="ID Gói"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chu Kỳ
              </label>
              <input
                name="period"
                type="number"
                value={form.period}
                onChange={handleInputChange}
                placeholder="Chu Kỳ"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thời Hạn (ngày)
              </label>
              <input
                name="durationInDays"
                type="number"
                value={form.durationInDays}
                onChange={handleInputChange}
                placeholder="Số Ngày"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số Tiền VND
              </label>
              <input
                name="amountVnd"
                type="number"
                value={form.amountVnd}
                onChange={handleInputChange}
                placeholder="Số Tiền VND"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                required
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
    </div>
  );
}
