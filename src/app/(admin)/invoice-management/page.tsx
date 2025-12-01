"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { EyeIcon, CalenderIcon, TimeIcon, MoreDotIcon, ChevronLeftIcon, ArrowRightIcon, DownloadIcon, UserIcon, MailIcon } from "@/icons";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorHandler";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { generateInvoicePDF } from "@/lib/pdf/invoicePdf";

type User = {
  userId: string;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  pictureProfile: string;
  dateOfBirth: string;
  phone: string;
  status: boolean;
  isPremium: boolean;
  isEmailVerified: boolean;
};

type Order = {
  id: string;
  orderCode: number;
  userId: string;
  subscriptionId: string | null;
  planPriceId: string;
  amountVnd: number;
  status: number;
  returnUrl: string;
  cancelUrl: string;
  createdAt: string;
  paidAt: string | null;
};

type OrderDetail = Order & {
  user?: User;
};

export default function InvoiceManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const detailModal = useModal();

  // Filter states
  const [filterOrderCode, setFilterOrderCode] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = "Quản lý Hóa Đơn - HomeTrack Admin";
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<Order[]>("/orders");
      setOrders(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải danh sách đơn hàng");
      alert(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const response = await api.get<Order>(`/orders/${orderId}`);
      
      // Fetch user details
      let userData: User | undefined;
      try {
        userData = await api.get<User>(`/Auth/get-by-userid/${response.userId}`);
      } catch (userError) {
        console.error("Failed to fetch user details:", userError);
        // Continue without user data if fetch fails
      }
      
      const orderDetail: OrderDetail = {
        ...response,
        user: userData,
      };
      
      setOrderDetail(orderDetail);
      detailModal.openModal();
    } catch (error) {
      console.error("Failed to fetch order detail:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải chi tiết đơn hàng");
      alert(errorMessage);
    }
  };

  const handleViewDetail = (orderId: string) => {
    setOpenMenuId(null);
    fetchOrderDetail(orderId);
  };

  const handleDownloadInvoice = async (order: Order) => {
    if (order.status !== 1) {
      alert("Chỉ có thể tải hóa đơn đã thanh toán.");
      return;
    }
    
    try {
      // Fetch full order details if not already available
      let orderData: OrderDetail;
      if (orderDetail && orderDetail.id === order.id) {
        orderData = orderDetail;
      } else {
        const orderResponse = await api.get<Order>(`/orders/${order.id}`);
        
        // Fetch user details
        let userData: User | undefined;
        try {
          userData = await api.get<User>(`/Auth/get-by-userid/${orderResponse.userId}`);
        } catch (userError) {
          console.error("Failed to fetch user details:", userError);
        }
        
        orderData = {
          ...orderResponse,
          user: userData,
        };
      }
      
      await generateInvoicePDF(orderData);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      const errorMessage = getErrorMessage(error, "Không thể tải hóa đơn. Vui lòng thử lại.");
      alert(errorMessage);
    }
  };

  const toggleMenu = (orderId: string) => {
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };

  const getStatusLabel = (status: number): string => {
    switch (status) {
      case 0:
        return "Chờ thanh toán";
      case 1:
        return "Đã thanh toán";
      case 2:
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const getStatusVariant = (status: number): "success" | "warning" | "error" => {
    switch (status) {
      case 1:
        return "success";
      case 0:
        return "warning";
      default:
        return "error";
    }
  };

  const renderBadge = (label: string, variant: "success" | "warning" | "error" = "success") => {
    const variants = {
      success: "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400",
      warning: "bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
      error: "bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Không có";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Không có";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Filter and pagination logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by order code
      if (filterOrderCode && !order.orderCode.toString().includes(filterOrderCode)) {
        return false;
      }
      // Filter by status
      if (filterStatus !== "all") {
        const statusValue = Number(filterStatus);
        if (order.status !== statusValue) {
          return false;
        }
      }
      // Filter by date range
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        const orderDate = new Date(order.createdAt);
        if (orderDate < fromDate) {
          return false;
        }
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire day
        const orderDate = new Date(order.createdAt);
        if (orderDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [orders, filterOrderCode, filterStatus, filterDateFrom, filterDateTo]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOrderCode, filterStatus, filterDateFrom, filterDateTo]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterOrderCode("");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterOrderCode || filterStatus !== "all" || filterDateFrom || filterDateTo;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white/90">Quản lý Hóa Đơn</h1>
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
          {/* Filter by Order Code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theo Mã Đơn Hàng
            </label>
            <input
              type="text"
              value={filterOrderCode}
              onChange={(e) => setFilterOrderCode(e.target.value)}
              placeholder="Tìm kiếm mã đơn hàng..."
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
              <option value="0">Chờ thanh toán</option>
              <option value="1">Đã thanh toán</option>
              <option value="2">Đã hủy</option>
            </select>
          </div>

          {/* Filter by Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Từ Ngày
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Đến Ngày
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Hiển thị {filteredOrders.length} trong tổng số {orders.length} đơn hàng
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải đơn hàng...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md overflow-hidden">
      <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-white/[0.02]">
            <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mã Đơn Hàng
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID Người Dùng
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Số Tiền
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Ngày Tạo
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Ngày Thanh Toán
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao Tác
                  </th>
            </tr>
          </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-visible">
                          <CalenderIcon className="w-6 h-6 text-gray-400 flex-shrink-0 min-w-[1.5rem] min-h-[1.5rem]" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {orders.length === 0 ? "Không tìm thấy đơn hàng nào" : "Không có đơn hàng nào khớp với bộ lọc của bạn"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {orders.length === 0 
                            ? "Thử làm mới trang hoặc quay lại sau" 
                            : "Thử điều chỉnh tiêu chí lọc của bạn"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(order => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white/90 text-sm">
                          {order.orderCode}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs break-all max-w-[200px] truncate" title={order.userId}>
                          {order.userId}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {formatCurrency(order.amountVnd)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {renderBadge(getStatusLabel(order.status), getStatusVariant(order.status))}
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <CalenderIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          {order.paidAt ? (
                            <>
                              <TimeIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                              <span>{formatDate(order.paidAt)}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Không có</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="relative flex items-center justify-end overflow-visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(order.id);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors dropdown-toggle flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] overflow-visible"
                            aria-label="Tùy chọn khác"
                            title="Tùy chọn khác"
                          >
                            <MoreDotIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[1.25rem] min-h-[1.25rem]" />
                    </button>
                          <Dropdown
                            isOpen={openMenuId === order.id}
                            onClose={() => setOpenMenuId(null)}
                            className="min-w-[160px]"
                          >
                            <div className="py-1">
                              <DropdownItem
                                onClick={() => handleViewDetail(order.id)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <EyeIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>Xem Chi Tiết</span>
                              </DropdownItem>
                              {order.status === 1 && (
                                <DropdownItem
                                  onClick={() => handleDownloadInvoice(order)}
                                  baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  className="flex items-center gap-2"
                                >
                                  <DownloadIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                  <span>Tải Hóa Đơn</span>
                                </DropdownItem>
                              )}
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
          {filteredOrders.length > 0 && (
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
                  <span>trong tổng số {filteredOrders.length} đơn hàng</span>
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

      {/* Order Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="max-w-[800px] p-0 overflow-hidden">
        {orderDetail && (
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 px-6 lg:px-8 pt-8 pb-6">
              <div className="flex items-start gap-6">
                <div className="flex-1 pt-2">
                  <h4 className="text-2xl font-bold text-white mb-2">Đơn Hàng #{orderDetail.orderCode}</h4>
                  <div className="flex items-center gap-3 flex-wrap mt-4">
                    {renderBadge(getStatusLabel(orderDetail.status), getStatusVariant(orderDetail.status))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
              <div className="space-y-6">
                {/* Order Information */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <CalenderIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                    Thông Tin Đơn Hàng
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Đơn Hàng</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-mono break-all">{orderDetail.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mã Đơn Hàng</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-semibold">{orderDetail.orderCode}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Người Dùng</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-mono break-all">{orderDetail.userId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Số Tiền</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(orderDetail.amountVnd)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng Thái</p>
                      <div className="mt-1">
                        {renderBadge(getStatusLabel(orderDetail.status), getStatusVariant(orderDetail.status))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Giá Gói</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-mono break-all text-xs">{orderDetail.planPriceId}</p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                {orderDetail.user && (
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                      Thông Tin Người Dùng
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tên Người Dùng</p>
                        <p className="text-sm text-gray-800 dark:text-white/90 font-semibold">{orderDetail.user.username}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                        <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2 min-w-0">
                          <MailIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                          <span className="truncate">{orderDetail.user.email}</span>
                        </p>
                      </div>
                      {orderDetail.user.phone && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Số Điện Thoại</p>
                          <p className="text-sm text-gray-800 dark:text-white/90">{orderDetail.user.phone}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vai Trò</p>
                        <p className="text-sm text-gray-800 dark:text-white/90">{orderDetail.user.roleName}</p>
                      </div>
                      {orderDetail.user.dateOfBirth && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày Sinh</p>
                          <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <CalenderIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                            <span>{formatDate(orderDetail.user.dateOfBirth)}</span>
                          </p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng Thái Tài Khoản</p>
                        <div className="mt-1">
                          {renderBadge(orderDetail.user.status ? "Hoạt động" : "Không hoạt động", orderDetail.user.status ? "success" : "error")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Information */}
                {orderDetail.subscriptionId && (
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <TimeIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                      Thông Tin Gói Đăng Ký
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Gói Đăng Ký</p>
                        <p className="text-sm text-gray-800 dark:text-white/90 font-mono break-all">{orderDetail.subscriptionId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Information */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <TimeIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                    Thông Tin Ngày Tháng
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày Tạo</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                        <CalenderIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                        <span>{formatDateTime(orderDetail.createdAt)}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày Thanh Toán</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                        {orderDetail.paidAt ? (
                          <>
                            <TimeIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                            <span>{formatDateTime(orderDetail.paidAt)}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Chưa thanh toán</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* URL Information */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Thông Tin URL</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">URL Trả Về</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 break-all font-mono text-xs">{orderDetail.returnUrl}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">URL Hủy</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 break-all font-mono text-xs">{orderDetail.cancelUrl}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 lg:px-8 py-4 bg-gray-50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-end gap-3">
                {orderDetail.status === 1 && (
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      try {
                        await generateInvoicePDF(orderDetail);
                      } catch (error) {
                        const errorMessage = getErrorMessage(error, "Không thể tải hóa đơn. Vui lòng thử lại.");
                        alert(errorMessage);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <DownloadIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                    Tải Hóa Đơn
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={detailModal.closeModal}>Đóng</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
