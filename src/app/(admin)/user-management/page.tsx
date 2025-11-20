"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { EyeIcon, PencilIcon, TrashBinIcon, UserIcon, MailIcon, CalenderIcon, TimeIcon, UserCircleIcon, MoreDotIcon, ChevronLeftIcon, ArrowRightIcon } from "@/icons";
import { api } from "@/lib/api";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

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

type UserDetail = User & {
  password?: string;
  role?: any;
  otpGeneratedAt?: string;
  houses?: any[];
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [newRoleId, setNewRoleId] = useState<number>(2);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const detailModal = useModal();
  const roleModal = useModal();

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVerify, setFilterVerify] = useState<string>("all");
  const [filterPremium, setFilterPremium] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    document.title = "User Management - HomeTrack Admin";
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>("/Auth/Get All User");
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await api.get<UserDetail>(`/Auth/get-by-userid/${userId}`);
      setUserDetail(response);
      detailModal.openModal();
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
      alert("Failed to load user details");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      // TODO: Replace with actual delete API endpoint when available
      await api.del(`/api/Auth/delete/${userId}`);
      setUsers(users.filter(u => u.userId !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  const handleChangeRole = async () => {
    if (!changingRole) return;
    try {
      // TODO: Replace with actual change role API endpoint when available
      await api.put(`/api/Auth/change-role/${changingRole}`, { roleId: newRoleId });
      setUsers(users.map(u => 
        u.userId === changingRole 
          ? { ...u, roleId: newRoleId, roleName: newRoleId === 1 ? "Admin" : newRoleId === 2 ? "Customer" : "User" }
          : u
      ));
      roleModal.closeModal();
      setChangingRole(null);
    } catch (error) {
      console.error("Failed to change role:", error);
      alert("Failed to change user role");
    }
  };

  const openChangeRole = (user: User) => {
    setChangingRole(user.userId);
    setNewRoleId(user.roleId);
    setOpenMenuId(null);
    roleModal.openModal();
  };

  const toggleMenu = (userId: string) => {
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const handleViewDetail = (userId: string) => {
    setOpenMenuId(null);
    fetchUserDetail(userId);
  };

  const handleDeleteClick = (userId: string) => {
    setOpenMenuId(null);
    handleDelete(userId);
  };

  const renderBadge = (label: string, isActive: boolean, variant: "success" | "warning" | "info" = "success") => {
    const variants = {
      success: "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400",
      warning: "bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
      info: "bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive ? variants[variant] : "bg-red-100 text-red-600 dark:bg-red/5 dark:text-red-400"
      }`}>
        {isActive ? label : ` In${label}`}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
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
    if (!dateString) return "N/A";
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

  const handleImageError = (userId: string) => {
    setImageErrors((prev) => new Set(prev).add(userId));
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Filter and pagination logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filter by name
      if (filterName && !user.username.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      // Filter by email
      if (filterEmail && !user.email.toLowerCase().includes(filterEmail.toLowerCase())) {
        return false;
      }
      // Filter by role
      if (filterRole !== "all") {
        const roleId = Number(filterRole);
        if (user.roleId !== roleId) {
          return false;
        }
      }
      // Filter by status
      if (filterStatus !== "all") {
        const statusValue = filterStatus === "active";
        if (user.status !== statusValue) {
          return false;
        }
      }
      // Filter by verify
      if (filterVerify !== "all") {
        const verifyValue = filterVerify === "verified";
        if (user.isEmailVerified !== verifyValue) {
          return false;
        }
      }
      // Filter by premium
      if (filterPremium !== "all") {
        const premiumValue = filterPremium === "premium";
        if (user.isPremium !== premiumValue) {
          return false;
        }
      }
      return true;
    });
  }, [users, filterName, filterEmail, filterRole, filterStatus, filterVerify, filterPremium]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterEmail, filterRole, filterStatus, filterVerify, filterPremium]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setFilterName("");
    setFilterEmail("");
    setFilterRole("all");
    setFilterStatus("all");
    setFilterVerify("all");
    setFilterPremium("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterName || filterEmail || filterRole !== "all" || filterStatus !== "all" || filterVerify !== "all" || filterPremium !== "all";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">User Management</h1>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h2>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Filter by Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Name
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Search name..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Email
            </label>
            <input
              type="text"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              placeholder="Search email..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Filter by Role */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">All Roles</option>
              <option value="1">Admin</option>
              <option value="2">Customer</option>
              <option value="3">User</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Filter by Verify */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Verify
            </label>
            <select
              value={filterVerify}
              onChange={(e) => setFilterVerify(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Filter by Premium */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Premium
            </label>
            <select
              value={filterPremium}
              onChange={(e) => setFilterPremium(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="all">All</option>
              <option value="premium">Premium</option>
              <option value="regular">Regular</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-theme-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[180px] max-w-[180px]">
                    User
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[200px] max-w-[200px]">
                    Contact
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Verify
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Premium
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-visible">
                          <UserIcon className="w-6 h-6 text-gray-400 flex-shrink-0 min-w-[1.5rem] min-h-[1.5rem]" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {users.length === 0 ? "No users found" : "No users match your filters"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {users.length === 0 
                            ? "Try refreshing the page or check back later" 
                            : "Try adjusting your filter criteria"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <tr 
                      key={user.userId} 
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4 w-[180px] max-w-[180px]">
                        <div className="flex items-center gap-2 min-w-0">
                          {user.pictureProfile && !imageErrors.has(user.userId) ? (
                            <img 
                              src={user.pictureProfile} 
                              alt={user.username}
                              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                              onError={() => handleImageError(user.userId)}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium text-xs flex-shrink-0">
                              {getInitials(user.username)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="font-medium text-gray-800 dark:text-white/90 truncate text-sm" title={user.username}>
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 w-[200px] max-w-[200px]">
                        <div className="space-y-1 min-w-0">
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 min-w-0">
                            <MailIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem]" />
                            <span className="truncate min-w-0 flex-1" title={user.email}>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 truncate" title={user.phone}>
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 whitespace-nowrap">
                          {user.roleName}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {renderBadge("Active", user.status, "success")}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {renderBadge("Verified", user.isEmailVerified, "info")}
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderBadge("Premium", user.isPremium, "warning")}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="relative flex items-center justify-end overflow-visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(user.userId);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors dropdown-toggle flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] overflow-visible"
                            aria-label="More options"
                            title="More options"
                          >
                            <MoreDotIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[1.25rem] min-h-[1.25rem]" />
                          </button>
                          <Dropdown
                            isOpen={openMenuId === user.userId}
                            onClose={() => setOpenMenuId(null)}
                            className="min-w-[160px]"
                          >
                            <div className="py-1">
                              <DropdownItem
                                onClick={() => handleViewDetail(user.userId)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <EyeIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>View Details</span>
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => openChangeRole(user)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <PencilIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>Change Role</span>
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => handleDeleteClick(user.userId)}
                                baseClassName="block w-full text-left px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                                className="flex items-center gap-2"
                              >
                                <TrashBinIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                                <span>Delete</span>
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
          {filteredUsers.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 bg-gray-50 dark:bg-white/[0.02]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Showing</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>of {filteredUsers.length} users</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    aria-label="Previous page"
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
                              ? "bg-brand-500 text-white"
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
                    aria-label="Next page"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="max-w-[800px] p-0 overflow-hidden">
        {userDetail && (
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header with Profile */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 px-6 lg:px-8 pt-8 pb-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  {userDetail.pictureProfile && !imageErrors.has(userDetail.userId) ? (
                    <img 
                      src={userDetail.pictureProfile} 
                      alt={userDetail.username}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white/20 dark:border-gray-800/20"
                      onError={() => handleImageError(userDetail.userId)}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-white/20 dark:bg-gray-800/20 flex items-center justify-center text-white font-bold text-2xl border-4 border-white/20 dark:border-gray-800/20">
                      {getInitials(userDetail.username)}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white dark:border-gray-800 ${
                    userDetail.status ? 'bg-success-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-2xl font-bold text-white mb-2">{userDetail.username}</h4>
                  <p className="text-white/90 mb-4 flex items-center gap-2 min-w-0">
                    <MailIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                    <span className="truncate">{userDetail.email}</span>
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {renderBadge("Active", userDetail.status, "success")}
                    {renderBadge("Premium", userDetail.isPremium, "warning")}
                    {renderBadge("Verified", userDetail.isEmailVerified, "info")}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                    Personal Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">User ID</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-mono break-all">{userDetail.userId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Username</p>
                      <p className="text-sm text-gray-800 dark:text-white/90">{userDetail.username}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2 min-w-0">
                        <MailIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                        <span className="truncate">{userDetail.email}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm text-gray-800 dark:text-white/90">{userDetail.phone || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date of Birth</p>
                      <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2 min-w-0">
                        <CalenderIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                        <span>{formatDate(userDetail.dateOfBirth)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                    Account Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</p>
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                          {userDetail.roleName} (ID: {userDetail.roleId})
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                      <div className="mt-1">{renderBadge("Active", userDetail.status, "success")}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email Verified</p>
                      <div className="mt-1">{renderBadge("Verified", userDetail.isEmailVerified, "info")}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Premium Member</p>
                      <div className="mt-1">{renderBadge("Premium", userDetail.isPremium, "warning")}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(userDetail.otpGeneratedAt || (userDetail.houses && userDetail.houses.length > 0)) && (
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <TimeIcon className="w-4 h-4 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                      Additional Information
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userDetail.otpGeneratedAt && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">OTP Generated At</p>
                          <p className="text-sm text-gray-800 dark:text-white/90 flex items-center gap-2 min-w-0">
                            <TimeIcon className="w-4 h-4 text-gray-400 flex-shrink-0 min-w-[1rem] min-h-[1rem]" />
                            <span>{formatDateTime(userDetail.otpGeneratedAt)}</span>
                          </p>
                        </div>
                      )}
                      {userDetail.houses && userDetail.houses.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Houses</p>
                          <p className="text-sm text-gray-800 dark:text-white/90">
                            <span className="font-semibold text-brand-600 dark:text-brand-400">{userDetail.houses.length}</span> house(s) registered
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 lg:px-8 py-4 bg-gray-50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-end gap-3">
                <Button size="sm" variant="outline" onClick={detailModal.closeModal}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={roleModal.isOpen} onClose={roleModal.closeModal} className="max-w-[480px] p-6 lg:p-8">
        <h4 className="font-semibold text-gray-800 mb-5 text-title-sm dark:text-white/90">Change User Role</h4>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <select 
              value={newRoleId} 
              onChange={(e) => setNewRoleId(Number(e.target.value))}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value={1}>Admin</option>
              <option value={2}>Customer</option>
              <option value={3}>User</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={roleModal.closeModal}>Cancel</Button>
            <Button size="sm" onClick={handleChangeRole}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
