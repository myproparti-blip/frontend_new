import React, { useEffect, useState, useRef, useLayoutEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaWhatsapp, FaTrash } from "react-icons/fa";
import { FaSignOutAlt, FaPlus, FaDownload, FaSyncAlt, FaEye, FaSort, FaChartBar, FaLock, FaClock, FaSpinner, FaCheckCircle, FaTimesCircle, FaEdit, FaFileAlt, FaCreditCard, FaRedo, FaHeadset, FaCrown } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui";

import { getAllRajeshHouse, getRajeshHouseById, requestReworkRajeshHouse, deleteMultipleRajeshHouse } from "../services/rajeshHouseService";
import { logoutUser } from "../services/auth";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { setCurrentPage, setTotalItems, setItemsPerPage } from "../redux/slices/paginationSlice";
import { invalidateCache } from "../services/axios";
import { useNotification } from "../context/NotificationContext";
import Pagination from "../components/Pagination";
import LoginModal from "../components/LoginModal";
import SearchBar from "../components/SearchBar";
import ReworkModal from "../components/ReworkModal";
import StatusGraph from "../components/StatusGraph";
import MasterAdminChipsModal from "../components/MasterAdminChipsModal";
import { getFormRouteForBank, isBofMaharashtraBank } from "../config/bankFormMapping";
import { FaFileInvoice } from 'react-icons/fa';

// Memoized FormTypeBadge component to prevent unnecessary re-renders
const FormTypeBadge = memo(({ selectedForm, selectedFormName, chipName }) => {
    const badgeConfig = {
        'ubiShop': { bg: 'from-blue-500 to-blue-600', label: 'UBI Shop' },
        'bomFlat': { bg: 'from-purple-500 to-purple-600', label: 'BOM Flat' },
        'ubiApf': { bg: 'from-amber-500 to-amber-600', label: 'UBI APF' },
        'rajeshhouse': { bg: 'from-green-500 to-green-600', label: 'Rajesh House' }
    };

    if (!selectedForm) return null;

    // If selectedFormName is available from backend (new field), use it first
    if (selectedFormName) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600" title={selectedFormName}>
                {selectedFormName}
            </span>
        );
    }

    // Fallback to chipName for backward compatibility
    if (chipName) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-slate-500 to-slate-600" title={chipName}>
                {chipName}
            </span>
        );
    }

    // Check if it's a known form type (old mapping)
    let config = badgeConfig[selectedForm];

    // If not found, it's likely a chip ID - display it with a generic style
    if (!config) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-slate-500 to-slate-600" title={selectedForm}>
                {selectedForm}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.bg}`} title={selectedForm}>
            {config.label}
        </span>
    );
});

FormTypeBadge.displayName = "FormTypeBadge";

// Memoized DateTimeCell component to prevent unnecessary re-renders
const DateTimeCell = memo(({ dateTime, createdAt }) => {
    const date = dateTime || createdAt;
    if (!date) return <span>-</span>;

    const dateObj = new Date(date);
    return (
        <>
            <div>{dateObj.toLocaleDateString()}</div>
            <div className="text-slate-600 text-xs">{dateObj.toLocaleTimeString()}</div>
        </>
    );
});

DateTimeCell.displayName = "DateTimeCell";

// Memoized StatCard component to prevent unnecessary re-renders
const StatCard = memo(({ title, value, color, status, icon: Icon, isSelected, onStatusClick }) => (
    <div
        onClick={() => status && onStatusClick(status)}
        className={`overflow-hidden hover:shadow-md transition-all duration-300 ${status ? 'cursor-pointer' : 'cursor-default'} border-l-4 relative group ${status && isSelected ? `border-l-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-300` : `border-l-neutral-200 bg-white hover:border-l-neutral-300 hover:shadow-sm`} rounded px-2.5 py-2 flex-shrink-0 flex items-center justify-center min-w-max`}
    >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} group-hover:h-1 transition-all duration-300`}></div>
        <div className="flex items-center justify-center gap-2 pt-0.5">
            <div className="text-center">
                <p className={`text-xs font-semibold mb-1 leading-tight whitespace-nowrap transition-colors duration-300 ${status && isSelected ? 'text-blue-700 font-bold' : 'text-neutral-600'}`}>{title}</p>
                <p className={`text-lg font-black bg-gradient-to-r ${color} bg-clip-text text-transparent leading-tight`}>{value}</p>
            </div>
            {Icon && <Icon className={`h-3.5 w-3.5 flex-shrink-0 transition-all duration-300 ${status && isSelected ? 'opacity-70' : 'opacity-35 group-hover:opacity-45'}`} />}
        </div>
    </div>
));

StatCard.displayName = "StatCard";

/**
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Pagination: 20 items per page on frontend display
 * 2. Backend fetch: 300 records limit per endpoint (4 endpoints = up to 1200 total records)
 *    This ensures all records are fetched for accurate pagination
 * 3. Frontend pagination: Dynamically paginate combined records at 20 per page
 * 4. useCallback: fetchFiles wrapped in useCallback to prevent unnecessary re-renders
 * 5. useMemo: Filtered files, sorted files, and pagination are memoized
 * 6. Lazy loading: Duration calculations deferred to avoid blocking initial render
 * 7. Parallel requests: All 4 Rajesh API calls run in parallel with Promise.all
 * 8. Timeout protection: 12-second timeout prevents hanging requests
 * 9. Cache busting: Timestamp parameter (_t) forces fresh API calls
 */

const DashboardPage = ({ user, onLogout, onLogin }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { showSuccess } = useNotification();
    const { currentPage, itemsPerPage, totalItems } = useSelector((state) => state.pagination);
    const { isLoading } = useSelector((state) => state.loader);
    const [files, setFiles] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [timeDurations, setTimeDurations] = useState({});
    const [statusFilter, setStatusFilter] = useState(null);
    const [cityFilter, setCityFilter] = useState(null);
    const [bankFilter, setBankFilter] = useState(null);
    const [engineerFilter, setEngineerFilter] = useState(null);
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [copiedRows, setCopiedRows] = useState(new Map()); // Map<id, rowData>
    const [reworkModalOpen, setReworkModalOpen] = useState(false);
    const [reworkingRecordId, setReworkingRecordId] = useState(null);
    const [reworkingRecord, setReworkingRecord] = useState(null);
    const [reworkLoading, setReworkLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [rajeshPdfModalOpen, setRajeshPdfModalOpen] = useState(false);
    const [rajeshPdfData, setRajeshPdfData] = useState(null);
    const [masterAdminChipsModalOpen, setMasterAdminChipsModalOpen] = useState(false);
    const username = user?.username || "";
    const role = user?.role || "";
    const clientId = user?.clientId || "";
    const isLoggedIn = !!user;
    const isMasterAdmin = role === "masteradmin";
    const pollIntervalRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const isMountedRef = useRef(false);
    const filesRef = useRef(files);
    const fetchDebounceRef = useRef(null); // Debounce timer for fetchFiles
    const { showError } = useNotification();

    // Keep filesRef in sync with files state
    useLayoutEffect(() => {
        filesRef.current = files;
    }, [files]);


    // Helper function to normalize status values - trim and validate
    const normalizeStatus = useCallback((status) => {
        const normalized = String(status || "").trim().toLowerCase();
        const validStatuses = ["pending", "on-progress", "approved", "rejected", "rework"];
        return validStatuses.includes(normalized) ? normalized : null;
    }, []);

    // Helper function to navigate to the correct form based on selectedForm or bank name
    const navigateToEditForm = useCallback((record) => {

        let formRoute;

        console.log("[navigateToEditForm] Opening record:", {
            selectedForm: record?.selectedForm,
            bankName: record?.bankName,
            uniqueId: record?.uniqueId
        });

        // First priority: use selectedForm if explicitly set
        if (record?.selectedForm === 'bomFlat') {
            // BOM Flat form route
            formRoute = "/valuationeditformbomaharastra";
        } else if (record?.selectedForm === 'ubiShop') {
            // UBI Shop form route
            formRoute = "/valuationeditform";
        } else if (record?.selectedForm === 'ubiApf') {
            // UBI APF form route
            formRoute = "/valuationeditformubiapf";
        } else if (record?.selectedForm === 'rajeshhouse') {
            // Rajesh House form route
            formRoute = "/valuationeditformrajeshhouse";
        } else if (record?.selectedForm) {
            // If selectedForm is a chip ID or unknown form type, default to rajeshhouse
            console.log("[navigateToEditForm] Chip ID/unknown form detected, using rajeshhouse form:", record.selectedForm);
            formRoute = "/valuationeditformrajeshhouse";
        } else {
            // If no selectedForm, use bank-based routing
            // Check if bank is BOM first, then use getFormRouteForBank
            if (isBofMaharashtraBank(record?.bankName)) {
                formRoute = "/valuationeditformbomaharastra";
            } else {
                formRoute = getFormRouteForBank(record?.bankName);
            }
        }

        console.log("[navigateToEditForm] Navigating to:", formRoute, "with ID:", record.uniqueId);
        // Navigate immediately without loader for fast performance
        navigate(`${formRoute}/${record.uniqueId}`);
    }, [navigate]);

    // Handle sorting - memoized with proper dependencies
    const handleSort = useCallback((field) => {
        dispatch(setCurrentPage(1));
        setSortField(prevField => {
            if (prevField === field) {
                setSortOrder(order => order === "asc" ? "desc" : "asc");
            } else {
                setSortField(field);
                setSortOrder("asc");
            }
            return field;
        });
    }, [dispatch]);

    // Memoized WhatsApp URLs to prevent recreation
    const helplineWhatsAppURL = useMemo(() => {
        const phoneNumber = "919327361477";
        const message = encodeURIComponent("Hi, how can I help you?");
        return `https://wa.me/${phoneNumber}?text=${message}`;
    }, []);

    const personalWhatsAppURL = useMemo(() => `https://web.whatsapp.com/`, []);

    const handleOpenHelplineWhatsApp = useCallback(() => {
        window.open(helplineWhatsAppURL, "_blank");
    }, [helplineWhatsAppURL]);

    const handleOpenPersonalWhatsApp = useCallback(() => {
        window.open(personalWhatsAppURL, "_blank");
    }, [personalWhatsAppURL]);

    // Filter files based on status, city, bank, and engineer filters - memoized to prevent recalculation
    const filteredFiles = useMemo(() => files.filter(f => {
        if (statusFilter && normalizeStatus(f.status) !== statusFilter) return false;
        if (cityFilter && f.city !== cityFilter) return false;
        if (bankFilter && f.bankName !== bankFilter) return false;
        if (engineerFilter && f.engineerName !== engineerFilter) return false;
        return true;
    }), [files, statusFilter, cityFilter, bankFilter, engineerFilter, normalizeStatus]);

    // Sort filtered files - memoized to prevent recalculation
    const sortedFiles = useMemo(() => [...filteredFiles].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortOrder === "asc" ? 1 : -1;
        if (bVal == null) return sortOrder === "asc" ? -1 : 1;

        // Handle duration sorting
        if (sortField === "duration") {
            const aDuration = timeDurations[a._id];
            const bDuration = timeDurations[b._id];

            const aSeconds = aDuration ? (aDuration.days * 86400 + aDuration.hours * 3600 + aDuration.minutes * 60 + aDuration.seconds) : 0;
            const bSeconds = bDuration ? (bDuration.days * 86400 + bDuration.hours * 3600 + bDuration.minutes * 60 + bDuration.seconds) : 0;

            return sortOrder === "asc" ? aSeconds - bSeconds : bSeconds - aSeconds;
        }

        // Handle date sorting
        if (sortField === "createdAt" || sortField === "dateTime") {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }

        // Handle string sorting
        if (typeof aVal === "string" && typeof bVal === "string") {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
            return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        // Handle numeric sorting 
        if (sortOrder === "asc") {
            return aVal < bVal ? -1 : 1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    }), [filteredFiles, sortField, sortOrder, timeDurations]);

    // Calculate total pages - memoized to prevent recalculation
    const totalPages = useMemo(() => {
        return Math.ceil(sortedFiles.length / itemsPerPage);
    }, [sortedFiles.length, itemsPerPage]);

    // Calculate pagination - memoized to prevent recalculation
    const paginatedFiles = useMemo(() => {
        const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
        const startIndex = (safePage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedFiles.slice(startIndex, endIndex);
    }, [sortedFiles, itemsPerPage, currentPage, totalPages]);

    const calculateTimeDurations = (filesList) => {
        // Lightweight duration calculation - only for pending/active records
        const durations = {};
        const now = Date.now(); // Cache now value

        for (let i = 0; i < filesList.length; i++) {
            const record = filesList[i];
            const normalizedStatus = normalizeStatus(record.status);

            // Only calculate for active statuses
            if (normalizedStatus === "pending" || normalizedStatus === "on-progress" || normalizedStatus === "rejected" || normalizedStatus === "rework") {
                try {
                    const createdTime = new Date(record.createdAt).getTime();
                    if (isNaN(createdTime)) continue;

                    const diffSecs = Math.floor((now - createdTime) / 1000);
                    const diffMins = Math.floor(diffSecs / 60);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);

                    durations[record._id] = {
                        days: diffDays,
                        hours: diffHours % 24,
                        minutes: diffMins % 60,
                        seconds: diffSecs % 60
                    };
                } catch (e) {
                    // Skip invalid date records
                }
            }
        }
        setTimeDurations(durations);
    };

    // Get unique values for dropdown filters - only update when files count changes
    const uniqueCities = useMemo(() => {
        const cities = [];
        for (let i = 0; i < files.length; i++) {
            const city = files[i].city;
            if (city && city.trim() && !cities.includes(city)) {
                cities.push(city);
            }
        }
        return cities.sort();
    }, [files.length]);

    const uniqueBanks = useMemo(() => {
        const banks = [];
        for (let i = 0; i < files.length; i++) {
            const bank = files[i].bankName;
            if (bank && bank.trim() && !banks.includes(bank)) {
                banks.push(bank);
            }
        }
        return banks.sort();
    }, [files.length]);

    const uniqueEngineers = useMemo(() => {
        const engineers = [];
        for (let i = 0; i < files.length; i++) {
            const engineer = files[i].engineerName;
            if (engineer && engineer.trim() && !engineers.includes(engineer)) {
                engineers.push(engineer);
            }
        }
        return engineers.sort();
    }, [files.length]);


    // Reset to page 1 when filter changes
    // Reset pagination when filters change
    useEffect(() => {
        dispatch(setCurrentPage(1));
    }, [statusFilter, cityFilter, bankFilter, engineerFilter, dispatch]);

    // Additional safety: reset page if it exceeds totalPages (handles edge cases with filtering)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            dispatch(setCurrentPage(1));
        }
    }, [totalPages, currentPage, dispatch]);

    // Handle logout - clear files when user logs out
    useEffect(() => {
        if (!isLoggedIn) {
            setFiles([]);
            setTimeDurations({});
            setStatusFilter(null);
            setCityFilter(null);
            setBankFilter(null);
            setEngineerFilter(null);
            setSortField("createdAt");
            setSortOrder("desc");
            setSelectedRows(new Set());
            setCopiedRows(new Map());
            dispatch(setTotalItems(0));
            dispatch(setCurrentPage(1));
        }
    }, [isLoggedIn, dispatch]);

    // Initial mount - fetch files ONLY ONCE when user is logged in
    useEffect(() => {
        // Use a combination of isMountedRef and isLoggedIn to ensure single initial fetch
        if (isLoggedIn && !isMountedRef.current) {
            isMountedRef.current = true;
            // Don't invalidate cache on initial load - use cached data if available for faster load
            fetchFiles(true, true);
        }
    }, []);

    // Auto-refresh after form submission (when new forms appear) - DISABLED for performance
    useEffect(() => {
        // Clear any existing poll interval before setting a new one
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Polling DISABLED - only refresh on manual action or visibility change
        // Users can manually refresh with the Refresh button

        // Only refresh when user returns to dashboard tab
        const handleVisibilityChange = () => {
            if (!document.hidden && isMountedRef.current && isLoggedIn) {
                // Only fetch Rajesh data on tab return for minimal bandwidth
                fetchFiles(false, false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        // Clear any existing interval before setting a new one
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        // Lazy load durations after initial render (debounce)
        const timeoutId = setTimeout(() => {
            if (files.length > 0) {
                calculateTimeDurations(files);
            }
        }, 500); // Delay duration calculation by 500ms for smooth initial load

        return () => {
            clearTimeout(timeoutId);
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [files.length]);

    const fetchFiles = useCallback(async (isInitial = false, showLoadingIndicator = true) => {
        try {
            // Show loader BEFORE initiating any API calls
            if (showLoadingIndicator) {
                dispatch(showLoader("Loading Data..."));
            }

            // Only invalidate cache for non-initial loads (polling/refresh)
            // Initial load should use cache to speed up dashboard load
            if (!isInitial) {
                invalidateCache("/rajesh-house");
                invalidateCache("/rajesh-bank");
                invalidateCache("/rajesh-flat");
                invalidateCache("/rajesh-RowHouse");
            }

            // Fetch Rajesh-related APIs only
            let rajeshHouseResponse;

            // Fetch records in efficient batches to prevent UI hang
            // First batch: 500 records to show immediately, then fetch rest in background
            const initialLimit = 500;
            const maxLimit = 10000;

            // Add 30-second timeout for large dataset fetches
            const fetchWithTimeout = (promise, timeoutMs = 30000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('API request timeout')), timeoutMs)
                    )
                ]).catch(() => ({ data: [], pagination: { total: 0 } }));
            };

            // Fetch initial batch (500 records)
            const apiParams = { username, userRole: role, clientId, limit: initialLimit, page: 1, _t: Date.now() };
            console.log("[dashboard] Calling API with params:", apiParams);

            [rajeshHouseResponse] = await Promise.all([
                fetchWithTimeout(getAllRajeshHouse(apiParams))
            ]);

            console.log("[dashboard] API responses received:", {
                rajeshHouseSuccess: rajeshHouseResponse?.success,
                rajeshHouseDataLength: rajeshHouseResponse?.data?.length
            });

            // Fetch remaining records in background if more exist
            (async () => {
                try {
                    const allResponses = await Promise.all([
                        fetchWithTimeout(getAllRajeshHouse({ username, userRole: role, clientId, limit: maxLimit, page: 1, _t: Date.now() }), 20000)
                    ]);

                    // Only update if there are more records than initial batch
                    const totalInitial = (rajeshHouseResponse?.data?.length || 0);
                    const totalFinal = (allResponses[0]?.data?.length || 0);

                    if (totalFinal > totalInitial && isMountedRef.current) {
                        rajeshHouseResponse = allResponses[0];
                        fetchFiles(false, true);
                    }
                } catch (err) {
                    // Silently fail background fetch - UI already has initial data
                }
            })();

            // Combine responses with formType markers
            const rajeshHouseData = (Array.isArray(rajeshHouseResponse?.data) ? rajeshHouseResponse.data : [])
                .map(item => ({
                    ...item,
                    formType: 'rajeshhouse',
                    // Preserve selectedForm from database if it exists
                    selectedForm: item.selectedForm !== undefined && item.selectedForm !== null ? item.selectedForm : 'rajeshhouse'
                }));

            // Calculate total from pagination responses
            const totalItems = (rajeshHouseResponse?.pagination?.total || 0);

            const response = {
                data: [...rajeshHouseData],
                pagination: { total: totalItems }
            };

            console.log("[dashboard] API data fetched:", {
                rajeshHouseCount: rajeshHouseData.length,
                totalCount: response.data.length,
                totalItems: totalItems,
                sampleData: response.data[0]
            });

            // Handle response format: API returns { success, data: [...], pagination: {...} }
            let filesList = [];
            if (Array.isArray(response)) {
                // Direct array response
                filesList = response;
            } else if (Array.isArray(response?.data)) {
                // Nested array in data property
                filesList = response.data;
            } else if (response?.data && Array.isArray(response.data.data)) {
                // Double nested (edge case)
                filesList = response.data.data;
            } else {
                // Fallback
                filesList = [];
            }
            // DEDUPLICATION: Remove duplicates by uniqueId (simplified for performance)
            const uniqueByUniqueIdMap = new Map();

            for (let i = 0; i < filesList.length; i++) {
                const item = filesList[i];
                if (!item.uniqueId) continue;

                const existing = uniqueByUniqueIdMap.get(item.uniqueId);
                if (!existing) {
                    uniqueByUniqueIdMap.set(item.uniqueId, item);
                } else {
                    // Keep newer version based on timestamps
                    const existingTime = new Date(existing.lastUpdatedAt || existing.updatedAt || existing.createdAt).getTime();
                    const currentTime = new Date(item.lastUpdatedAt || item.updatedAt || item.createdAt).getTime();
                    if (currentTime > existingTime) {
                        uniqueByUniqueIdMap.set(item.uniqueId, item);
                    }
                }
            }

            // Rebuild list with deduplicated items
            filesList = filesList.filter(item => !item.uniqueId || uniqueByUniqueIdMap.get(item.uniqueId) === item);
            // Ensure selectedForm is set for all records after deduplication
            filesList = filesList.map(item => ({
                ...item,
                // Preserve selectedForm from database if it exists, otherwise use formType
                selectedForm: item.selectedForm !== undefined && item.selectedForm !== null ? item.selectedForm : item.formType
            }));

            console.log("[dashboard] Final file list before display:", {
                totalFiles: filesList.length,
                firstRecord: filesList[0],
                selectedForms: filesList.slice(0, 3).map(f => ({ clientName: f.clientName, selectedForm: f.selectedForm }))
            });

            setFiles(filesList);
            // Use pagination total if available, otherwise fallback to filesList length
            const paginationTotal = response?.pagination?.total || filesList.length;
            dispatch(setTotalItems(paginationTotal));
            const totalPages = Math.ceil(filesList.length / itemsPerPage);
            console.log(`[dashboard] Fetched ${filesList.length} records (Total in DB: ${paginationTotal}), Pages: ${totalPages} (${itemsPerPage} items per page)`);
            if (isInitial) {
                dispatch(setCurrentPage(1));
                // Skip duration calculation on initial load - do it lazily
            } else {
                // Only calculate durations on refresh
                calculateTimeDurations(filesList);
            }
        } catch (err) {
            console.error("❌ Dashboard - Error fetching valuations:", err);
        } finally {
            if (showLoadingIndicator) {
                dispatch(hideLoader());
            }
        }
    }, [username, role, clientId, dispatch, showError]);

    const handleLogout = async () => {
        setLoggingOut(true);
        dispatch(showLoader("Loading Data..."));
        try {
            await logoutUser();
            // Clear files immediately
            setFiles([]);
            setTimeDurations({});
            if (onLogout) onLogout();
            setTimeout(() => {
                dispatch(hideLoader());
                navigate("/dashboard");
            }, 500);
        } catch (error) {
            // Clear files even on error
            setFiles([]);
            setTimeDurations({});
            if (onLogout) onLogout();
            dispatch(hideLoader());
            navigate("/dashboard");
        } finally {
            setLoggingOut(false);
            setLogoutModalOpen(false);
        }
    };

    const getStatusBadge = (status) => {
        const normalized = normalizeStatus(status);
        const variants = {
            "pending": { variant: "warning", label: "PR", fullLabel: "Pending Review" },
            "on-progress": { variant: "default", label: "OP", fullLabel: "On Progress" },
            "approved": { variant: "success", label: "App", fullLabel: "Approved" },
            "rejected": { variant: "destructive", label: "Rej", fullLabel: "Rejected" },
            "rework": { variant: "outline", label: "RW", fullLabel: "Rework" },
        };
        const config = variants[normalized] || variants["pending"];
        return <Badge variant={config.variant} title={config.fullLabel}>{config.label}</Badge>;
    };

    const getPaymentBadge = (payment) => {
        return (
            <Badge variant={payment === "yes" ? "success" : "warning"}>
                {payment === "yes" ? "Collected" : "Not Collected"}
            </Badge>
        );
    };

    const handleDownloadPDF = async (record) => {
        try {
            dispatch(showLoader("Generating PDF..."));

            // CRITICAL FIX: Always fetch fresh data from database before PDF generation
            // to ensure the PDF contains the latest filled-in data, not stale cache
            let freshRecord = record;
            const user = localStorage.getItem("user");
            const userData = user ? JSON.parse(user) : {};
            const username = userData.username;
            const userRole = userData.role;
            const clientId = userData.clientId;

            try {
                // Fetch fresh data based on form type
                if (record?.selectedForm === 'rajeshhouse' || !record?.selectedForm || (record?.selectedForm && !['bomFlat', 'ubiShop', 'ubiApf'].includes(record?.selectedForm))) {
                    // Fetch fresh data for rajeshhouse or unknown form types (chip IDs)
                    freshRecord = await getRajeshHouseById(record.uniqueId || record._id, username, userRole, clientId);
                    console.log("✅ Fresh data fetched for PDF generation");
                }
            } catch (fetchError) {
                console.warn("⚠️ Could not fetch fresh data, using record from table:", fetchError.message);
                // Fall back to the record from table if fetch fails
            }

            // Determine which PDF service to use based on selectedForm
            if (freshRecord?.selectedForm === 'bomFlat') {
                // BOM Flat PDF generation not yet implemented
                showError("PDF generation for BOM Flat is not yet available");
                return;
            } else if (freshRecord?.selectedForm === 'rajeshhouse' || !freshRecord?.selectedForm) {
                // Use Rajesh House PDF service for rajeshhouse
                const { generateRajeshHousePDF } = await import("../services/rajeshHousePdf.js");
                await generateRajeshHousePDF(freshRecord);
            } else if (freshRecord?.selectedForm === 'ubiShop' || freshRecord?.selectedForm === 'ubiApf') {
                // UBI Shop/APF PDF generation not yet implemented
                showError("PDF generation for UBI Shop/APF is not yet available");
                return;
            } else {
                // Default - treat unknown form types (chip IDs) as Rajesh House
                console.log("[PDF] Unknown form type detected:", freshRecord?.selectedForm, "- using Rajesh House PDF service");
                const { generateRajeshHousePDF } = await import("../services/rajeshHousePdf.js");
                await generateRajeshHousePDF(freshRecord);
            }

            showSuccess("PDF downloaded successfully!");
        } catch (error) {
            console.error("Download error:", error);
            showError(error.message || "Failed to download PDF");
        } finally {
            dispatch(hideLoader());
        }
    };


    const handleDownloadDOCX = async (record) => {
        try {
            dispatch(showLoader("Generating Word document..."));

            // CRITICAL FIX: Always fetch fresh data from database before DOCX generation
            // to ensure the document contains the latest filled-in data, not stale cache
            let freshRecord = record;
            const user = localStorage.getItem("user");
            const userData = user ? JSON.parse(user) : {};
            const username = userData.username;
            const userRole = userData.role;
            const clientId = userData.clientId;

            try {
                // Fetch fresh data based on form type
                if (record?.selectedForm === 'rajeshhouse' || !record?.selectedForm) {
                    freshRecord = await getRajeshHouseById(record.uniqueId || record._id, username, userRole, clientId);
                }
                ("✅ Fresh data fetched for DOCX generation");
            } catch (fetchError) {
                console.warn("⚠️ Could not fetch fresh data, using record from table:", fetchError.message);
                // Fall back to the record from table if fetch fails
            }

            // Determine which DOCX service to use based on selectedForm
            if (freshRecord?.selectedForm === 'bomFlat') {
                // BOM Flat DOCX generation not yet implemented
                showError("DOCX generation for BOM Flat is not yet available");
                return;
            } else if (freshRecord?.selectedForm === 'rajeshhouse' || !freshRecord?.selectedForm) {
                // Use Rajesh House DOCX service for rajeshhouse
                const { generateRecordDOCX } = await import("../services/rajeshHousePdf.js");
                await generateRecordDOCX(freshRecord);
            } else if (freshRecord?.selectedForm === 'ubiShop' || freshRecord?.selectedForm === 'ubiApf') {
                // UBI Shop/APF DOCX generation not yet implemented
                showError("DOCX generation for UBI Shop/APF is not yet available");
                return;
            } else {
                // Default - no DOCX service available
                showError("DOCX generation is not available for this form type");
                return;
            }

            showSuccess("Word document downloaded successfully!");
        } catch (error) {
            console.error("Download error:", error);
            showError(error.message || "Failed to download Word document");
        } finally {
            dispatch(hideLoader());
        }
    };

    const handleReworkRequest = (record) => {
        ("[handleReworkRequest] Received record:", {
            uniqueId: record.uniqueId,
            bankName: record.bankName,
            status: record.status,
            recordKeys: Object.keys(record)
        });
        setReworkingRecordId(record.uniqueId);
        setReworkingRecord(record);
        setReworkModalOpen(true);
    };

    const handleReworkSubmit = async (reworkComments) => {
        try {
            setReworkLoading(true);
            dispatch(showLoader("Requesting rework..."));

            ("[handleReworkSubmit] Record info:", {
                recordId: reworkingRecordId,
                formType: reworkingRecord?.formType
            });

            // Call the correct service based on form type
            if (reworkingRecord?.formType === 'rajeshhouse') {
                ("[handleReworkSubmit] Calling requestReworkRajeshHouse");
                await requestReworkRajeshHouse(reworkingRecordId, reworkComments, username, role);
                invalidateCache("rajesh-house");
            }

            showSuccess("Rework requested successfully!");
            setReworkModalOpen(false);
            setReworkingRecordId(null);
            setReworkingRecord(null);
            // Debounce refresh to prevent multiple rapid API calls
            if (fetchDebounceRef.current) {
                clearTimeout(fetchDebounceRef.current);
            }
            fetchDebounceRef.current = setTimeout(() => {
                fetchFiles(false, false); // Avoid double loader
            }, 500);
        } catch (error) {
            showError(error.message || "Failed to request rework");
        } finally {
            dispatch(hideLoader());
            setReworkLoading(false);
        }
    };
    // Bulletproof checkbox → copy logic with atomic state management
    const handleCheckboxChange = (recordId) => {
        setSelectedRows(prev => {
            const newSelected = new Set(prev);
            let isAdding = false;

            if (newSelected.has(recordId)) {
                // UNCHECKING: delete and remove from copied data
                newSelected.delete(recordId);
            } else {
                // CHECKING: add and copy row data
                newSelected.add(recordId);
                isAdding = true;
            }

            // ATOMIC UPDATE: modify copiedRows in sync with selectedRows
            setCopiedRows(prevCopied => {
                const newCopied = new Map(prevCopied);

                if (isAdding) {
                    // Find the row data from authoritative source (files) at moment of state update
                    const rowData = files.find(f => f._id === recordId);
                    if (rowData) {
                        newCopied.set(recordId, rowData);
                    }
                } else {
                    // Remove copied data immediately when unchecking
                    newCopied.delete(recordId);
                }

                return newCopied;
            });

            return newSelected;
        });
    };

    // Handle select-all checkbox in header
    const handleSelectAll = () => {
        if (selectedRows.size === paginatedFiles.length && paginatedFiles.length > 0) {
            // All rows currently selected → deselect all on current page
            setSelectedRows(new Set());
            setCopiedRows(new Map());
        } else {
            // Select all rows on current page
            const newSelected = new Set(selectedRows);
            const newCopied = new Map(copiedRows);

            paginatedFiles.forEach(record => {
                newSelected.add(record._id);
                newCopied.set(record._id, record);
            });

            setSelectedRows(newSelected);
            setCopiedRows(newCopied);
        }
    };

    const handleCopyToClipboard = (records) => {
        if (!Array.isArray(records) || records.length === 0) return;

        const textToCopy = records.map(record =>
            `Client Name: ${record.clientName}\nPhone Number: ${record.mobileNumber}\nBank Name: ${record.bankName}\nClient Address: ${record.address}`
        ).join("\n\n---\n\n");

        navigator.clipboard.writeText(textToCopy).then(() => {
            showSuccess(`${records.length} record(s) copied!`);
        }).catch(() => {
            showSuccess("Failed to copy");
        });
    };

    const navigateToBillForm = (selectedRecords) => {
        // Extract only the required fields: Clnt, Addr, Mobile, Bank, City
        const selectedData = selectedRecords.map(record => ({
            clnt: record.clientName,
            addr: record.address,
            mobile: record.mobileNumber,
            bank: record.bankName,
            city: record.city,
            // Keep original _id for reference if needed
            _id: record._id
        }));

        // Store in localStorage for persistence
        localStorage.setItem('selectedValuationForms', JSON.stringify(selectedData));

        // Navigate to bill form with state
        navigate('/bills/create', {
            state: {
                selectedRows: selectedData,
                fromValuation: true
            }
        });
    };

    // Memoized status counts to prevent recalculation on every render
    const { pendingCount, onProgressCount, approvedCount, rejectedCount, reworkCount, totalCount, completionRate } = useMemo(() => {
        const pending = files.filter(f => normalizeStatus(f.status) === "pending").length;
        const onProgress = files.filter(f => normalizeStatus(f.status) === "on-progress").length;
        const approved = files.filter(f => normalizeStatus(f.status) === "approved").length;
        const rejected = files.filter(f => normalizeStatus(f.status) === "rejected").length;
        const rework = files.filter(f => normalizeStatus(f.status) === "rework").length;
        const total = files.length;
        const completion = total > 0 ? Math.round(((approved + rejected) / total) * 100) : 0;

        // Debug logging
        ("📊 Status Counts Updated:", {
            pending,
            "on-progress": onProgress,
            approved,
            rejected,
            rework,
            total,
            completionRate: `${completion}%`
        });

        return {
            pendingCount: pending,
            onProgressCount: onProgress,
            approvedCount: approved,
            rejectedCount: rejected,
            reworkCount: rework,
            totalCount: total,
            completionRate: completion
        };
    }, [files, normalizeStatus]);

    // Refetch data when window regains focus (user returns from form)
    useEffect(() => {
        const handleWindowFocus = () => {
            ("🔄 Dashboard - Window regained focus, refetching data...");
            invalidateCache("/valuations");
            // Use setTimeout to ensure state is ready
            setTimeout(() => fetchFiles(true, true), 100);
        };

        window.addEventListener("focus", handleWindowFocus);

        return () => {
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [isLoggedIn]);

    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) return;

        try {
            dispatch(showLoader("Deleting records..."));

            const idsToDelete = Array.from(selectedRows);

            // Determine which delete function to use based on formType
            const selectedRecords = files.filter(r => selectedRows.has(r._id));

            for (const record of selectedRecords) {
                const deleteFunc = record.formType === 'rajeshhouse'
                    ? deleteMultipleRajeshHouse
                    : null;

                try {
                    if (deleteFunc) {
                        await deleteFunc([record._id]);
                    }
                } catch (error) {
                    console.error(`Error deleting record ${record._id}:`, error);
                }
            }

            showSuccess(`Deleted ${idsToDelete.length} record(s)`);
            setDeleteModalOpen(false);
            setSelectedRows(new Set());
            setCopiedRows(new Map());

            // Debounce refresh to prevent multiple rapid API calls
            if (fetchDebounceRef.current) {
                clearTimeout(fetchDebounceRef.current);
            }
            fetchDebounceRef.current = setTimeout(() => {
                fetchFiles(false, false);
            }, 500);
        } catch (error) {
            console.error("Error deleting records:", error);
            showError("Failed to delete records");
        } finally {
            dispatch(hideLoader());
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className={`bg-gradient-to-r from-white via-blue-50 to-white text-neutral-900 shadow-lg hover:shadow-xl sticky top-0 z-40 border-b-2 border-blue-200 transition-all duration-300 ${isLoading ? "blur-sm" : ""}`}>
                <div className="px-3 sm:px-8 py-3 sm:py-4">
                    {/* Top Row - Logo, Status Cards, Search, and Controls */}
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        {/* Logo Section - Premium Design */}
                        <div className="flex items-center gap-3 flex-shrink-0 h-10 pr-4 sm:pr-6 border-r-2 border-blue-200 group">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 text-white">
                                <FaChartBar className="text-lg sm:text-xl" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-black tracking-tight text-neutral-900 whitespace-nowrap leading-tight">Valu Soft</h1>
                                <p className="text-xs text-blue-600 font-bold mt-0 hidden sm:block leading-tight tracking-wide">
                                    {!isLoggedIn ? "Read-Only" : role === "user" ? "Submissions" : role === "manager" ? "Review" : "Admin"}
                                </p>
                            </div>
                        </div>

                        {/* Status Cards Row - Premium Compact */}
                        <div className="flex items-center gap-2 flex-shrink-0 overflow-hidden h-10 px-2 py-1">
                            <StatCard
                                title="Pending"
                                value={pendingCount}
                                color="from-amber-600 to-amber-700"
                                status="pending"
                                icon={FaClock}
                                isSelected={statusFilter === "pending"}
                                onStatusClick={(status) => setStatusFilter(statusFilter === status ? null : status)}
                            />
                            <StatCard
                                title="Progress"
                                value={onProgressCount}
                                color="from-blue-600 to-blue-700"
                                status="on-progress"
                                icon={FaSpinner}
                                isSelected={statusFilter === "on-progress"}
                                onStatusClick={(status) => setStatusFilter(statusFilter === status ? null : status)}
                            />
                            <StatCard
                                title="Approved"
                                value={approvedCount}
                                color="from-green-600 to-green-700"
                                status="approved"
                                icon={FaCheckCircle}
                                isSelected={statusFilter === "approved"}
                                onStatusClick={(status) => setStatusFilter(statusFilter === status ? null : status)}
                            />
                            <StatCard
                                title="Rejected"
                                value={rejectedCount}
                                color="from-red-600 to-red-700"
                                status="rejected"
                                icon={FaTimesCircle}
                                isSelected={statusFilter === "rejected"}
                                onStatusClick={(status) => setStatusFilter(statusFilter === status ? null : status)}
                            />
                            <StatCard
                                title="Rework"
                                value={reworkCount}
                                color="from-violet-600 to-violet-700"
                                status="rework"
                                icon={FaRedo}
                                isSelected={statusFilter === "rework"}
                                onStatusClick={(status) => setStatusFilter(statusFilter === status ? null : status)}
                            />
                            <StatCard
                                title="Complete"
                                value={`${completionRate}%`}
                                color="from-indigo-600 to-indigo-700"
                                status={null}
                                icon={FaCheckCircle}
                                isSelected={false}
                                onStatusClick={() => { }}
                            />
                        </div>

                        {/* Search Bar */}
                        <div className="hidden sm:flex w-1/2 min-w-0 h-10 items-center px-4">
                            <SearchBar data={files} />
                        </div>

                        {/* Right Actions - Premium Style */}
                        <div className="flex items-center gap-3 flex-shrink-0 h-10 pl-4 sm:pl-6 border-l-2 border-blue-200">
                            {isMasterAdmin && (
                                <button
                                    onClick={() => setMasterAdminChipsModalOpen(true)}
                                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-purple-800 hover:border-purple-900"
                                    title="Master Admin - Manage Client Chips"
                                >
                                    <FaCrown style={{ fontSize: "13px" }} />
                                </button>
                            )}

                            <button
                                onClick={() => navigate("/valuationform")}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-blue-800 hover:border-blue-900"
                                title="New Form"
                            >
                                <FaPlus style={{ fontSize: "13px" }} />
                            </button>
                            {role !== "user" && (
                                <button
                                    onClick={() => navigate("/bills")}
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-green-800 hover:border-green-900"
                                    title="Bills"
                                >
                                    <FaCreditCard style={{ fontSize: "13px" }} />
                                </button>
                            )}

                            <button
                                onClick={handleOpenHelplineWhatsApp}
                                className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-red-800 hover:border-red-900"
                                title="Contact Helpline on WhatsApp"
                            >
                                <FaHeadset style={{ fontSize: "13px" }} />
                            </button>

                            <div className="h-6 w-px bg-blue-200"></div>

                            {!isLoggedIn ? (
                                <Button
                                    onClick={() => setLoginModalOpen(true)}
                                    className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2.5 h-8 sm:h-9 flex items-center gap-1 font-bold shadow-sm hover:shadow-md transition-all duration-300 border border-blue-700"
                                    title="Login"
                                >
                                    <FaLock className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Login</span>
                                </Button>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-150 transition-all duration-300 h-8 sm:h-9">
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-white shadow-sm border border-blue-700">
                                            <span className="text-xs font-black">{username && username[0] ? username[0].toUpperCase() : ""}</span>
                                        </div>
                                        <div className="hidden sm:block min-w-0 flex-1">
                                            <p className="text-xs font-semibold truncate text-neutral-900 leading-tight">{username}</p>
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider truncate font-medium leading-tight">{role}</p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 hover:shadow-md rounded"
                                        onClick={() => setLogoutModalOpen(true)}
                                        title="Logout"
                                    >
                                        <FaSignOutAlt className="h-4 w-4 sm:h-4 sm:w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={`bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 transition-all duration-300 ${isLoading ? "blur-sm pointer-events-none" : ""}`}>
                {/* Unified Premium Container */}
                <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
                    {/* Search Bar - Mobile Only */}
                    <div className="sm:hidden mb-6 w-1/2">
                        <SearchBar data={files} />
                    </div>

                    {/* Premium Unified Card - Table */}
                    <Card className="overflow-hidden bg-white rounded-3xl border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                        {/* Data Table - Premium Styling */}
                        {/* Analytics Section */}
                        {files.length > 0 && (
                            <div className="border-b border-slate-100/80 bg-gradient-to-br from-slate-50/50 to-white/50 animate-fadeIn">
                                <StatusGraph files={files} isCompact={true} />
                            </div>
                        )}

                        <div className="bg-white">
                            <CardHeader >
                                <div className="min-w-0">
                                    <CardDescription className="text-xs mt-1 text-neutral-700 font-semibold">{sortedFiles.length} records {statusFilter && `— filtered`}</CardDescription>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {(statusFilter || cityFilter || bankFilter || engineerFilter) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setStatusFilter(null);
                                                setCityFilter(null);
                                                setBankFilter(null);
                                                setEngineerFilter(null);
                                            }}
                                            className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-400 text-neutral-600 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                    {selectedRows.size > 0 && (
                                        <>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    const selectedRecords = Array.from(selectedRows).map(id => files.find(r => r._id === id)).filter(Boolean);
                                                    if (selectedRecords.length > 0) {
                                                        handleCopyToClipboard(selectedRecords);
                                                    }
                                                }}
                                                className="text-xs sm:text-sm px-3 sm:px-4 bg-neutral-600 hover:bg-neutral-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-neutral-700 hover:scale-105"
                                            >
                                                Copy {selectedRows.size}
                                            </Button>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => {
                                                    const selectedRecords = Array.from(selectedRows).map(id => files.find(r => r._id === id)).filter(Boolean);
                                                    if (selectedRecords.length > 0) {
                                                        navigateToBillForm(selectedRecords);
                                                    }
                                                }}
                                                className="text-xs sm:text-sm px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-blue-700 hover:scale-105"
                                            >
                                                <FaFileInvoice className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                                Create Bill ({selectedRows.size})
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setDeleteModalOpen(true)}
                                                className="text-xs sm:text-sm px-3 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-red-700 hover:scale-105"
                                            >
                                                <FaTrash className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                                Delete ({selectedRows.size})
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedRows(new Set())}
                                                className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-400 text-neutral-600 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                            >
                                                Clear Selection
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchFiles(false, true)}
                                        disabled={isLoading}
                                        className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-400 text-neutral-600 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:border-neutral-300 disabled:text-neutral-400"
                                    >
                                        <FaSyncAlt className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                                        <span className="hidden sm:inline">Refresh</span>
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-3">
                                {sortedFiles.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-500 font-semibold text-base">
                                            {files.length === 0 ? "No records found. Create a new valuation to get started." : "No records match the selected filters. Try adjusting your filters."}
                                        </p>
                                    </div>
                                ) : paginatedFiles.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 border-b-2 border-slate-700 transition-colors duration-200">
                                                        <TableHead className="min-w-[40px] text-xs sm:text-sm px-2 py-2 font-black text-white">
                                                            <div className="flex items-center gap-1 justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={paginatedFiles.length > 0 && selectedRows.size === paginatedFiles.length}
                                                                    onChange={handleSelectAll}
                                                                    className="w-4 h-4 cursor-pointer accent-blue-400 rounded"
                                                                    title="Select all rows on this page"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200 rounded-t-lg" onClick={() => handleSort("clientName")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">CLNT</span>
                                                                {sortField === "clientName" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[85px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200" onClick={() => handleSort("address")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">ADDR</span>
                                                                {sortField === "address" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[85px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200" onClick={() => handleSort("mobileNumber")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">MOBILE</span>
                                                                {sortField === "mobileNumber" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2.5 py-2">
                                                            <div className="flex flex-col gap-1 h-full">
                                                                <span className="font-black tracking-widest text-black text-xs text-center leading-tight">BANK</span>
                                                                <select
                                                                    value={bankFilter || ""}
                                                                    onChange={(e) => setBankFilter(e.target.value || null)}
                                                                    className="text-xs px-2 py-1 border-2 border-blue-500 rounded-md bg-white text-slate-900 font-bold cursor-pointer w-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 hover:border-blue-600 hover:bg-blue-50 transition-all shadow-md h-7"
                                                                    title="Filter by Bank"
                                                                >
                                                                    <option value="">All</option>
                                                                    {uniqueBanks.map(bank => (
                                                                        <option key={bank} value={bank}>{bank}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2.5 py-2">
                                                            <div className="flex flex-col gap-1 h-full">
                                                                <span className="font-black tracking-widest text-black text-xs text-center leading-tight">ENG</span>
                                                                <select
                                                                    value={engineerFilter || ""}
                                                                    onChange={(e) => setEngineerFilter(e.target.value || null)}
                                                                    className="text-xs px-2 py-1 border-2 border-green-500 rounded-md bg-white text-slate-900 font-bold cursor-pointer w-full focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-300 hover:border-green-600 hover:bg-green-50 transition-all shadow-md h-7"
                                                                    title="Filter by Engineer"
                                                                >
                                                                    <option value="">All</option>
                                                                    {uniqueEngineers.map(engineer => (
                                                                        <option key={engineer} value={engineer}>{engineer}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2.5 py-2">
                                                            <div className="flex flex-col gap-1 h-full">
                                                                <span className="font-black tracking-widest text-black text-xs text-center leading-tight">CITY</span>
                                                                <select
                                                                    value={cityFilter || ""}
                                                                    onChange={(e) => setCityFilter(e.target.value || null)}
                                                                    className="text-xs px-2 py-1 border-2 border-purple-500 rounded-md bg-white text-slate-900 font-bold cursor-pointer w-full focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 hover:border-purple-600 hover:bg-purple-50 transition-all shadow-md h-7"
                                                                    title="Filter by City"
                                                                >
                                                                    <option value="">All</option>
                                                                    {uniqueCities.map(city => (
                                                                        <option key={city} value={city}>{city}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[60px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200" onClick={() => handleSort("payment")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">PAY</span>
                                                                {sortField === "payment" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[60px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200" onClick={() => handleSort("status")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">STS</span>
                                                                {sortField === "status" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[70px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200" onClick={() => handleSort("duration")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">DUR</span>
                                                                {sortField === "duration" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[95px] text-xs sm:text-sm px-2.5 py-3 cursor-pointer font-black text-white transition-all duration-200" onClick={() => handleSort("createdAt")}>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">DATE</span>
                                                                {sortField === "createdAt" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[110px] text-xs sm:text-sm px-2.5 py-3 font-black text-white">
                                                            <div className="flex justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">NOTES</span>
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[80px] text-xs sm:text-sm px-2.5 py-3 font-black text-white">
                                                            <div className="flex justify-center">
                                                                <span className="font-black tracking-widest text-black text-xs leading-none drop-shadow-md">ACTS</span>
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedFiles.map((record) => (
                                                        <TableRow key={record._id} className="hover:bg-slate-50/80 border-b border-slate-100/80 transition-all duration-200 hover:shadow-sm group hover:scale-y-102 h-auto">
                                                            <TableCell className="text-sm text-center px-1 py-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedRows.has(record._id)}
                                                                    onChange={() => handleCheckboxChange(record._id)}
                                                                    className="w-4 h-4 cursor-pointer accent-neutral-700 rounded"
                                                                />



                                                            </TableCell>
                                                            <TableCell className={`text-sm font-black text-slate-900 group-hover:text-slate-700 transition-colors duration-200 ${record.address && record.address.length > 50 ? 'whitespace-normal' : ''}`}>{record.clientName}</TableCell>
                                                            <TableCell className="text-xs max-w-[160px] px-2 py-2">
                                                                {record.address ? (
                                                                    <div className="text-xs font-medium text-slate-700 bg-slate-50 rounded border border-slate-200 p-2 max-h-[80px] overflow-y-auto break-words scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                                                        {record.address}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs px-1 py-2 truncate font-semibold text-slate-700 group-hover:text-slate-900 transition-colors duration-200">{record.mobileNumber}</TableCell>
                                                            <TableCell className="text-xs px-1 py-2 font-semibold text-slate-700">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="truncate">{record.bankName}</span>
                                                                    <FormTypeBadge selectedForm={record.selectedForm} selectedFormName={record.selectedFormName} chipName={record.chipName} />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs px-1 py-2 truncate font-semibold text-slate-700">{record.engineerName}</TableCell>
                                                            <TableCell className="text-xs px-1 py-2 truncate font-semibold text-slate-700">{record.city}</TableCell>
                                                            <TableCell className="px-1 py-2">
                                                                <Badge variant={record.payment === "yes" ? "success" : "warning"} className="text-xs px-2 py-1 font-bold shadow-sm">
                                                                    {record.payment === "yes" ? "Y" : "N"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="px-1 py-2 text-center">{getStatusBadge(record.status)}</TableCell>
                                                            <TableCell className="px-1 py-2">
                                                                {timeDurations[record._id] ? (
                                                                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-slate-100 to-slate-150 px-2 py-1 font-bold border-slate-300 shadow-sm">{timeDurations[record._id].days}:{timeDurations[record._id].hours}:{timeDurations[record._id].minutes}:{timeDurations[record._id].seconds}</Badge>
                                                                ) : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-xs sm:text-sm px-1 py-2 font-semibold text-slate-700">
                                                                <DateTimeCell dateTime={record.dateTime} createdAt={record.createdAt} />
                                                            </TableCell>
                                                            <TableCell className="text-xs max-w-[180px] px-2 py-2">
                                                                {record.notes ? (
                                                                    <div className="text-xs font-medium text-slate-700 bg-slate-50 rounded border border-slate-200 p-2 max-h-[80px] overflow-y-auto break-words scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                                                        {record.notes}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="px-1 py-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {role === "user" && normalizeStatus(record.status) === "pending" && (
                                                                        <Badge
                                                                            variant="warning"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                ("🟡 Pending Edit Badge clicked - record:", record);
                                                                                navigateToEditForm(record);
                                                                            }}
                                                                            title="Edit Form"
                                                                        >
                                                                            <FaEdit className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}
                                                                    {role === "user" && normalizeStatus(record.status) === "on-progress" && (
                                                                        <Badge
                                                                            variant="default"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-blue-600 flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                ("🔵 On-Progress Edit Badge clicked - record:", record);
                                                                                navigateToEditForm(record);
                                                                            }}
                                                                            title="Edit Form"
                                                                        >
                                                                            <FaEdit className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}
                                                                    {role === "user" && normalizeStatus(record.status) === "rejected" && (
                                                                        <Badge
                                                                            variant="destructive"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                ("🔴 Rejected Edit Badge clicked - record:", record);
                                                                                navigateToEditForm(record);
                                                                            }}
                                                                            title="Edit Form"
                                                                        >
                                                                            <FaEdit className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}
                                                                    {normalizeStatus(record.status) === "approved" && (
                                                                        <>
                                                                            <Badge
                                                                                variant="success"
                                                                                className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 border border-green-700"
                                                                                onClick={() => handleDownloadPDF(record)}
                                                                                title="Download PDF - Red Badge"
                                                                            >
                                                                                <FaDownload className="h-3 w-3" />
                                                                                <span className="hidden sm:inline text-xs">PDF</span>
                                                                            </Badge>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5 bg-blue-50 border-2 border-blue-600 text-blue-700 hover:bg-blue-100 hover:border-blue-700"
                                                                                onClick={() => handleDownloadDOCX(record)}
                                                                                title="Download Word Document (.docx)"
                                                                            >
                                                                                <FaFileAlt className="h-3 w-3" />
                                                                                <span className="hidden sm:inline text-xs">DOCX</span>
                                                                            </Badge>
                                                                        </>
                                                                    )}
                                                                    {(role === "manager" || role === "admin") && (normalizeStatus(record.status) === "pending" || normalizeStatus(record.status) === "on-progress") && (
                                                                        <Badge
                                                                            variant="default"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-blue-600 flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                ("👁️ Manager Review Badge clicked - record:", record);
                                                                                navigateToEditForm(record);
                                                                            }}
                                                                            title="Review Form"
                                                                        >
                                                                            <FaEye className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}
                                                                    {(role === "manager" || role === "admin") && (normalizeStatus(record.status) === "rejected" || normalizeStatus(record.status) === "rework") && (
                                                                        <Badge
                                                                            variant="destructive"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                ("🟠 Manager Rework/Rejected Badge clicked - record:", record);
                                                                                navigateToEditForm(record);
                                                                            }}
                                                                            title="Edit Form"
                                                                        >
                                                                            <FaEdit className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}
                                                                    {(role === "manager" || role === "admin") && normalizeStatus(record.status) === "approved" && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-purple-50 border-purple-400 text-purple-700 flex items-center gap-1.5"
                                                                            onClick={() => handleReworkRequest(record)}
                                                                            title="Request Rework"
                                                                        >
                                                                            <FaRedo className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}
                                                                    {role === "user" && normalizeStatus(record.status) === "rework" && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-orange-50 border-orange-400 text-orange-700 flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                ("🟠 Rework Badge clicked - record:", record);
                                                                                navigateToEditForm(record);
                                                                            }}
                                                                            title="Rework Form"
                                                                        >
                                                                            <FaRedo className="h-3 w-3" />
                                                                        </Badge>
                                                                    )}

                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>


                                        </div>
                                        <div className="border-t border-slate-100/60 bg-white p-3">
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                {sortedFiles.length > 20 && (
                                                    <div className="flex items-center gap-3">
                                                        <label className="text-sm font-semibold text-slate-700">Items per page:</label>
                                                        <select
                                                            value={itemsPerPage}
                                                            onChange={(e) => dispatch(setItemsPerPage(parseInt(e.target.value)))}
                                                            className="px-3 py-2 border-2 border-blue-500 rounded-lg bg-white text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 hover:border-blue-600 hover:bg-blue-50 transition-all shadow-md text-sm"
                                                            title="Select number of items to display per page"
                                                        >
                                                            <option value={20}>20</option>
                                                            <option value={40}>40</option>
                                                            <option value={60}>60</option>
                                                            <option value={100}>100</option>
                                                            <option value={140}>140</option>
                                                            <option value={180}>180</option>
                                                        </select>
                                                    </div>
                                                )}
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={totalPages}
                                                    onPageChange={(page) => dispatch(setCurrentPage(page))}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-slate-500 font-semibold text-base">
                                            No data available for this page. {currentPage > 1 && "Try navigating to an earlier page."}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </main>

            {/* Login Modal */}
            <LoginModal
                isOpen={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                onLogin={(userData) => {
                    if (onLogin) {
                        onLogin(userData);
                    }
                    setLoginModalOpen(false);
                }}
            />

            {/* Logout Confirmation Dialog */}
            <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to logout? You will be redirected to the login page.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLogoutModalOpen(false)}
                            disabled={loggingOut}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? "Logging out..." : "Logout"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rework Modal */}
            <ReworkModal
                isOpen={reworkModalOpen}
                onClose={() => {
                    setReworkModalOpen(false);
                    setReworkingRecordId(null);
                }}
                onSubmit={handleReworkSubmit}
                isLoading={reworkLoading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Records</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedRows.size} selected record(s)? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rajesh Ganatra PDF Modal */}
            <Dialog open={rajeshPdfModalOpen} onOpenChange={setRajeshPdfModalOpen}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Rajesh Ganatra Valuation Report</DialogTitle>
                        <DialogDescription>
                            {rajeshPdfData?.clientName} - {rajeshPdfData?.address}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRajeshPdfModalOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Master Admin Chips Modal */}
            <MasterAdminChipsModal
                isOpen={masterAdminChipsModalOpen}
                onClose={() => setMasterAdminChipsModalOpen(false)}
            />

            {/* Floating Personal WhatsApp Button */}
            <button
                onClick={handleOpenPersonalWhatsApp}
                className="fixed bottom-6 right-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-slate-800 hover:scale-110 transition-all z-50 border border-slate-600/50"
                title="Open Personal WhatsApp"
            >
                <FaWhatsapp className="h-6 w-6" />
            </button>

        </div>
    );
};
export default DashboardPage; 