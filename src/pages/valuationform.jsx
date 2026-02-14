import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaArrowLeft, FaTimes, FaFileAlt } from "react-icons/fa";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Label, RadioGroup, RadioGroupItem } from "../components/ui";
import { v4 as uuidv4 } from "uuid";

import { createRajeshHouse, getLastSubmittedRajeshHouse } from "../services/rajeshHouseService";
import { isBofMaharashtraBank } from "../config/bankFormMapping";
import { addCustomOption, getCustomOptions, deleteCustomOption } from "../services/customOptionsService";
import api, { invalidateCache } from "../services/axios";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";

const FormPage = ({ user, onLogin }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { isLoading: loading } = useSelector((state) => state.loader);
    const isLoggedIn = !!user;
    const [bankName, setBankName] = useState("");
    const [city, setCity] = useState("");
    const [payment, setPayment] = useState("");
    const [dsa, setDsa] = useState("");
    const [engineerName, setEngineerName] = useState("");
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedFormName, setSelectedFormName] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const formRef = useRef(null);
    const [formData, setFormData] = useState({
        bankName: "",
        customBankName: "",
        city: "",
        customCity: "",
        clientName: "",
        mobileNumber: "",
        address: "",
        payment: "",
        collectedBy: "",
        dsa: "",
        customDsa: "",
        engineerName: "",
        customEngineerName: "",
        notes: ""
    });
    const { showSuccess, showError } = useNotification();
    const username = user?.username || "";
    const role = user?.role || "";
    const clientId = user?.clientId || "";

    // Memoized default arrays to prevent recreating on every render
    const defaultBanks = useMemo(() => ["SBI", "HDFC", "ICICI", "Axis", "PNB", "BOB"], []);
    const defaultCities = useMemo(() => ["Surat", "vadodara", "Ahmedabad", "Kheda"], []);
    const defaultDsaNames = useMemo(() => ["Bhayva Shah", "Shailesh Shah", "Vijay Shah"], []);
    const defaultEngineers = useMemo(() => ["Bhavesh", "Bhanu", "Ronak", "Mukesh"], []);

    const [banks, setBanks] = useState([...defaultBanks]);
    const [cities, setCities] = useState([...defaultCities]);
    const [dsaNames, setDsaNames] = useState([...defaultDsaNames]);
    const [engineers, setEngineers] = useState([...defaultEngineers]);
    const [chips, setChips] = useState([]);
    const isMountedRef = useRef(true);
    const loadingRef = useRef(false);

    // Load custom options and chips from database with fresh API call
    const loadCustomOptions = useCallback(async () => {
        // Prevent race conditions - only one load at a time
        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            // Clear entire cache before fetching
            invalidateCache("options");

            // Add timestamp to URL to bypass any remaining cache
            const timestamp = Date.now();
            const params = { _t: timestamp };

            // Fetch fresh data with timestamp parameter
            const [customBanks, customCities, customDsas, customEngineers, clientChips] = await Promise.all([
                (async () => {
                    const response = await api.get(`/options/banks`, { params });
                    return response.data.data || [];
                })().catch(() => []),
                (async () => {
                    const response = await api.get(`/options/cities`, { params });
                    return response.data.data || [];
                })().catch(() => []),
                (async () => {
                    const response = await api.get(`/options/dsas`, { params });
                    return response.data.data || [];
                })().catch(() => []),
                (async () => {
                    const response = await api.get(`/options/engineers`, { params });
                    return response.data.data || [];
                })().catch(() => []),
                (async () => {
                    if (!clientId) {
                        console.warn("[valuationform] No clientId available for chips");
                        return [];
                    }
                    try {
                        const response = await api.get(`/chips?clientId=${clientId}`, { params });
                        console.log("[valuationform] Chips loaded:", response.data.data);
                        return response.data.data || [];
                    } catch (error) {
                        console.error("[valuationform] Chips loading error:", error.message);
                        return [];
                    }
                })()
            ]);

            // Only update if component is still mounted
            if (!isMountedRef.current) return;

            // Remove duplicates and merge with defaults (custom options appear first)
            const uniqueBanks = [...new Set([...(customBanks || []), ...defaultBanks])];
            const uniqueCities = [...new Set([...(customCities || []), ...defaultCities])];
            const uniqueDsas = [...new Set([...(customDsas || []), ...defaultDsaNames])];
            const uniqueEngineers = [...new Set([...(customEngineers || []), ...defaultEngineers])];

            setBanks(uniqueBanks);
            setCities(uniqueCities);
            setDsaNames(uniqueDsas);
            setEngineers(uniqueEngineers);
            setChips(clientChips || []);
        } catch (error) {
            if (!isMountedRef.current) return;

            // Fallback to defaults on error
            setBanks([...defaultBanks]);
            setCities([...defaultCities]);
            setDsaNames([...defaultDsaNames]);
            setEngineers([...defaultEngineers]);
            setChips([]);
        } finally {
            loadingRef.current = false;
        }
    }, [clientId]);



    // Load custom options on component mount, route change, and visibility change
    useLayoutEffect(() => {
        isMountedRef.current = true;
        loadingRef.current = false;

        // Load immediately on mount to display custom options initially
        loadCustomOptions();

        // Reload when browser tab becomes visible - memoized handler
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadCustomOptions();
            }
        };

        // Reload when window gains focus - memoized handler
        const handleFocus = () => {
            loadCustomOptions();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            isMountedRef.current = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [location.pathname, loadCustomOptions]);

    const uniqueId = `FORM-${uuidv4()}`;
    const dateTime = new Date().toLocaleString();
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;

        // Mobile number validation - only numbers and max 10 digits
        if (name === "mobileNumber") {
            const numbersOnly = value.replace(/[^0-9]/g, '');
            if (numbersOnly.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numbersOnly }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    const handleBankChange = useCallback((val) => {
        // Prevent unselecting custom options - only allow selection, not clearing
        if (bankName === val) return;

        if (val === "other") {
            setBankName("other");
            setFormData(prev => ({ ...prev, bankName: "other", customBankName: "" }));
        } else {
            setBankName(val);
            setFormData(prev => ({ ...prev, bankName: val, customBankName: "" }));
        }
    }, [bankName]);

    const handleCityChange = useCallback((val) => {
        // Prevent unselecting custom options - only allow selection, not clearing
        if (city === val) return;

        if (val === "other") {
            setCity("other");
            setFormData(prev => ({ ...prev, city: "other", customCity: "" }));
        } else {
            setCity(val);
            setFormData(prev => ({ ...prev, city: val, customCity: "" }));
        }
    }, [city]);

    const handleDsaChange = useCallback((val) => {
        // Prevent unselecting custom options - only allow selection, not clearing
        if (dsa === val) return;

        if (val === "other") {
            setDsa("other");
            setFormData(prev => ({ ...prev, dsa: "other", customDsa: "" }));
        } else {
            setDsa(val);
            setFormData(prev => ({ ...prev, dsa: val, customDsa: "" }));
        }
    }, [dsa]);

    const handleEngineerChange = useCallback((val) => {
        // Prevent unselecting custom options - only allow selection, not clearing
        if (engineerName === val) return;

        if (val === "other") {
            setEngineerName("other");
            setFormData(prev => ({ ...prev, engineerName: "other", customEngineerName: "" }));
        } else {
            setEngineerName(val);
            setFormData(prev => ({ ...prev, engineerName: val, customEngineerName: "" }));
        }
    }, [engineerName]);

    const handleCustomInputChange = useCallback((e, field) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const saveCustomEntry = useCallback(async (type, value) => {
        if (!value) return;
        try {
            await addCustomOption(type, value);
            // Clear cache after adding custom option to ensure fresh data
            invalidateCache("custom-options");
        } catch (error) {
        }
    }, []);

    const deleteCustomEntry = useCallback(async (type, value) => {
        try {
            await deleteCustomOption(type, value);

            // Clear entire cache
            invalidateCache("options");

            // Optimistically remove from UI
            if (type === "banks") {
                setBanks(prev => prev && prev.length > 0 ? prev.filter(item => item !== value) : [...defaultBanks]);
            } else if (type === "cities") {
                setCities(prev => prev && prev.length > 0 ? prev.filter(item => item !== value) : [...defaultCities]);
            } else if (type === "dsas") {
                setDsaNames(prev => prev && prev.length > 0 ? prev.filter(item => item !== value) : [...defaultDsaNames]);
            } else if (type === "engineers") {
                setEngineers(prev => prev && prev.length > 0 ? prev.filter(item => item !== value) : [...defaultEngineers]);
            }

            showSuccess(`${type} option deleted successfully`);

            // Reload fresh data after deletion
            setTimeout(() => {
                loadCustomOptions();
            }, 200);
        } catch (error) {
            showError(`Failed to delete ${type} option`);
        }
    }, [loadCustomOptions, showError, showSuccess, defaultDsaNames, defaultCities, defaultBanks, defaultEngineers]);

    const onFinish = async (e) => {
        e.preventDefault();

        // Prevent HTML form native reset - ensure form doesn't auto-clear
        if (formRef.current) {
            formRef.current.onreset = (resetEvent) => resetEvent.preventDefault();
        }

        // Check if user has permission to submit forms
        if (role !== "user" && role !== "manager" && role !== "admin") {
            showError("You don't have permission to submit forms");
            return;
        }

        const finalBankName = bankName === "other" ? formData.customBankName : bankName;
        const finalCity = city === "other" ? formData.customCity : city;
        const finalDsa = dsa === "other" ? formData.customDsa : dsa;
        const finalEngineer = engineerName === "other" ? formData.customEngineerName : engineerName;

        const errors = [];

        // Collect all validation errors
        if (!finalBankName) errors.push("Bank Name");
        if (!finalCity) errors.push("City");
        if (!formData.clientName) errors.push("Client Name");
        if (!formData.mobileNumber) errors.push("Mobile Number");
        if (!formData.address) errors.push("Address");
        if (!payment) errors.push("Payment Status");
        if (!finalDsa) errors.push("Sales Agent (DSA)");
        if (!finalEngineer) errors.push("Engineer Name");
        // Only require form selection if chips are available
        if (chips.length > 0 && !selectedForm) errors.push("Form Type");

        // Show single consolidated error if any field is empty
        if (errors.length > 0) {
            showError(`Please fill all required fields: ${errors.join(", ")}`);
            // Form data remains intact in state - inputs keep their values
            return;
        }

        // Mobile number validation
        if (formData.mobileNumber.length !== 10) {
            showError("Please enter a valid 10-digit mobile number");
            // Form data remains intact in state - inputs keep their values
            return;
        }

        // If we reach here, validation passed - proceed with submission
        try {
            dispatch(showLoader("Submitting your form..."));

            const payload = {
                clientId: clientId || uuidv4(),
                bankName: finalBankName,
                customBankName: formData.customBankName,
                city: finalCity,
                customCity: formData.customCity,
                clientName: formData.clientName,
                mobileNumber: formData.mobileNumber,
                address: formData.address,
                payment: payment,
                collectedBy: formData.collectedBy,
                dsa: finalDsa,
                customDsa: formData.customDsa,
                engineerName: finalEngineer,
                customEngineerName: formData.customEngineerName,
                notes: formData.notes,
                selectedForm: selectedForm,
                selectedFormName: selectedFormName,
                username,
                userRole: role,
                uniqueId,
                dateTime,
                day,
                status: "pending"
            };

            console.log("[valuationform] Form submission payload:", {
                clientName: payload.clientName,
                selectedForm: payload.selectedForm,
                selectedFormName: payload.selectedFormName,
                status: payload.status,
                uniqueId: payload.uniqueId
            });

            // Save custom entries to database only if they don't exist
            const saveCustomPromises = [];

            if (bankName === "other" && formData.customBankName && !banks.includes(formData.customBankName)) {
                saveCustomPromises.push(saveCustomEntry("banks", formData.customBankName));
            }

            if (city === "other" && formData.customCity && !cities.includes(formData.customCity)) {
                saveCustomPromises.push(saveCustomEntry("cities", formData.customCity));
            }

            if (dsa === "other" && formData.customDsa && !dsaNames.includes(formData.customDsa)) {
                saveCustomPromises.push(saveCustomEntry("dsas", formData.customDsa));
            }

            if (engineerName === "other" && formData.customEngineerName && !engineers.includes(formData.customEngineerName)) {
                saveCustomPromises.push(saveCustomEntry("engineers", formData.customEngineerName));
            }

            // Wait for custom entries to be saved
            if (saveCustomPromises.length > 0) {
                await Promise.all(saveCustomPromises);
            }

            // Clear draft only after successful submission
            localStorage.removeItem(`valuation_draft_${username}`);

            // Route forms based on selectedForm or bank name
            let response;

            // Determine form type: use rajeshhouse as default
            const formType = selectedForm === 'rajeshhouse' || !selectedForm ? 'rajeshhouse' : 'rajeshhouse';

            console.log("[onFinish] Using form type:", formType, "from selectedForm:", selectedForm);

            if (formType === 'rajeshhouse') {
                console.log("[onFinish] Creating Rajesh House form:", { finalBankName, formType, selectedFormName });
                try {
                    // Prefill data from last form with matching selectedFormName
                    const lastForm = await getLastSubmittedRajeshHouse(username, clientId, selectedFormName);
                    if (lastForm) {
                        console.log("[onFinish] Found last form with selectedFormName:", lastForm.selectedFormName);
                        if (lastForm.pdfDetails) {
                            payload.pdfDetails = lastForm.pdfDetails;
                            console.log("[onFinish] ✅ Autofill pdfDetails from last form:", Object.keys(lastForm.pdfDetails).length, "fields");
                        }
                        if (lastForm.spreadsheetData) {
                            payload.spreadsheetData = lastForm.spreadsheetData;
                            console.log("[onFinish] ✅ Autofill spreadsheetData from last form");
                        }
                    } else {
                        console.log("[onFinish] No previous form found for prefill with selectedFormName:", selectedFormName);
                    }
                } catch (autofillError) {
                    console.warn("[onFinish] Could not autofill data:", autofillError.message);
                    // Continue creating form without autofill
                }
                response = await createRajeshHouse(payload);
            }

            // Success - form values remain visible during success notification
            showSuccess("Form submitted successfully!");
            dispatch(hideLoader());

            // Reload custom options to include any new ones
            loadCustomOptions();

            // Navigate to dashboard after form submission
            ('[onFinish] Form submitted successfully, navigating to dashboard');
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 300);

        } catch (err) {
            showError(err.message || "Failed to submit form");
            dispatch(hideLoader());
            // Form data remains intact in state - no reset on error
            // User can see validation errors and correct the form
        }
    };
    return (
        <div className="min-h-screen bg-neutral-50 p-4">
            {!isLoggedIn && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 max-w-sm border border-neutral-200 shadow-lg">
                        <p className="text-center font-semibold text-base text-neutral-900">Please login to create a new form</p>
                        <p className="text-center text-sm text-neutral-600 mt-3">You are currently viewing in read-only mode</p>
                    </div>
                </div>
            )}
            <div className="max-w-full mx-auto">
                {/* Header - Premium */}
                <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/dashboard")}
                            className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                        >
                            <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Valuation Form</h1>
                            <p className="text-xs text-neutral-500 mt-1">{!isLoggedIn && "Read-Only Mode"}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                        title="Toggle Form Info"
                    >
                        <FaFileAlt className="h-4 w-4 text-neutral-700" />
                    </Button>
                </div>

                {/* Sliding Sidebar - Form Info */}
                <div
                    className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-neutral-200 shadow-lg z-[9998] transform transition-transform duration-300 ease-in-out overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                <FaFileAlt className="h-4 w-4 text-blue-500" />
                                Form Info
                            </h2>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSidebarOpen(false)}
                                className="h-6 w-6 border border-neutral-300 hover:bg-neutral-100 rounded p-0"
                            >
                                ✕
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">By</p>
                            <p className="text-sm font-medium text-neutral-900">{username}</p>
                        </div>
                        <div className="border-t border-neutral-200"></div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Day</p>
                            <p className="text-sm font-medium text-neutral-900">{day}</p>
                        </div>
                        <div className="border-t border-neutral-200"></div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Date Time</p>
                            <p className="text-sm font-medium text-neutral-900 break-words">{dateTime}</p>
                        </div>
                        <div className="border-t border-neutral-200"></div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">ID</p>
                            <code className="bg-neutral-100 px-2 py-1.5 rounded-lg text-xs font-mono break-all text-neutral-700 border border-neutral-300 block">{uniqueId.slice(0, 12)}...</code>
                        </div>
                    </div>
                </div>

                {/* Overlay when sidebar is open */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 z-[9997] transition-opacity duration-300"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content - Full Width */}
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                    {/* Forms Panel & Main Form */}
                    <div className="col-span-12 space-y-4">
                        {/* Available Forms Panel - Dynamically Generated from Chips */}
                        {chips.length > 0 && (
                            <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-neutral-900">
                                        <FaFileAlt className="h-4 w-4 text-green-500" />
                                        Available Forms ({chips.length})
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {chips.map((chip, index) => {
                                            // Map chip value to form type
                                            const chipValue = chip.value.toLowerCase();
                                            // Use chip ID as unique form type identifier
                                            const formType = chip._id;
                                            let bgColor = "bg-gray-100";
                                            let hoverColor = "hover:bg-gray-200";
                                            let activeBg = "bg-blue-500";

                                            // Determine colors based on chip value keywords
                                            if (chipValue.includes("ubi") && chipValue.includes("shop")) {
                                                bgColor = "bg-blue-100";
                                                hoverColor = "hover:bg-blue-200";
                                                activeBg = "bg-blue-500";
                                            } else if (chipValue.includes("bom") && chipValue.includes("flat")) {
                                                bgColor = "bg-purple-100";
                                                hoverColor = "hover:bg-purple-200";
                                                activeBg = "bg-purple-500";
                                            } else if (chipValue.includes("ubi") && chipValue.includes("apf")) {
                                                bgColor = "bg-amber-100";
                                                hoverColor = "hover:bg-amber-200";
                                                activeBg = "bg-amber-500";
                                            } else if (chipValue.includes("rajesh") && chipValue.includes("house") && !chipValue.includes("row")) {
                                                bgColor = "bg-red-100";
                                                hoverColor = "hover:bg-red-200";
                                                activeBg = "bg-red-500";
                                            } else if (chipValue.includes("rajesh") && chipValue.includes("bank")) {
                                                bgColor = "bg-rose-100";
                                                hoverColor = "hover:bg-rose-200";
                                                activeBg = "bg-rose-500";
                                            } else if (chipValue.includes("rajesh") && chipValue.includes("row")) {
                                                bgColor = "bg-orange-100";
                                                hoverColor = "hover:bg-orange-200";
                                                activeBg = "bg-orange-500";
                                            } else if (chipValue.includes("rajesh") && chipValue.includes("flat")) {
                                                bgColor = "bg-cyan-100";
                                                hoverColor = "hover:bg-cyan-200";
                                                activeBg = "bg-cyan-500";
                                            } else {
                                                // Default gradient colors for unknown chip types
                                                bgColor = "bg-indigo-100";
                                                hoverColor = "hover:bg-indigo-200";
                                                activeBg = "bg-indigo-500";
                                            }

                                            return (
                                                <button
                                                    key={chip._id}
                                                    type="button"
                                                    onClick={() => {
                                                        console.log("[valuationform] Form selected:", chip.value, "ID:", formType);
                                                        if (selectedForm === formType) {
                                                            setSelectedForm(null);
                                                            setSelectedFormName(null);
                                                        } else {
                                                            setSelectedForm(formType);
                                                            setSelectedFormName(chip.value);
                                                        }
                                                    }}
                                                    className={`px-3 py-2 rounded-full border transition-all shadow-sm text-xs font-semibold cursor-pointer ${selectedForm === formType
                                                        ? `${activeBg} text-white border-blue-600 hover:opacity-90`
                                                        : `${bgColor} text-gray-700 border-gray-300 ${hoverColor}`
                                                        }`}
                                                    title={chip.value}
                                                >
                                                    {chip.value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                                <CardTitle className="text-sm font-bold text-neutral-900">Property Details</CardTitle>
                                <p className="text-neutral-600 text-xs mt-1.5 font-medium">* Required fields</p>
                            </CardHeader>
                            <CardContent className="p-4 flex-1">
                                <form onSubmit={onFinish} ref={formRef} className="space-y-3">

                                    {/* Bank & City Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {/* Bank Section */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-neutral-900">Bank *</Label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {banks && banks.length > 0 && banks.map(name => (
                                                    <div key={name} className="relative group">
                                                        <Button
                                                            type="button"
                                                            className={`h-8 w-full text-xs font-semibold rounded-lg transition-all ${bankName === name
                                                                ? "bg-blue-500 text-white border border-blue-600 shadow-md hover:bg-blue-600"
                                                                : "border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                                }`}
                                                            onClick={() => handleBankChange(name)}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            {name}
                                                        </Button>
                                                        {!defaultBanks.includes(name) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteCustomEntry("banks", name);
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                                disabled={!isLoggedIn}
                                                                title="Delete"
                                                            >
                                                                <FaTimes className="h-2.5 w-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="relative">
                                                    {bankName === "other" ? (
                                                        <Input
                                                            type="text"
                                                            placeholder="Name"
                                                            value={formData.customBankName}
                                                            onChange={(e) => handleCustomInputChange(e, "customBankName")}
                                                            className="h-8 text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                            autoFocus
                                                            disabled={!isLoggedIn}
                                                        />
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            className="h-8 w-full text-xs font-semibold rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                            onClick={() => handleBankChange("other")}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            Other
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* City Section */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-neutral-900">City *</Label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {cities && cities.length > 0 && cities.map(name => (
                                                    <div key={name} className="relative group">
                                                        <Button
                                                            type="button"
                                                            className={`h-8 w-full text-xs font-semibold rounded-lg transition-all ${city === name
                                                                ? "bg-blue-500 text-white border border-blue-600 shadow-md hover:bg-blue-600"
                                                                : "border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                                }`}
                                                            onClick={() => handleCityChange(name)}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            {name}
                                                        </Button>
                                                        {!defaultCities.includes(name) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteCustomEntry("cities", name);
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                                disabled={!isLoggedIn}
                                                                title="Delete"
                                                            >
                                                                <FaTimes className="h-2.5 w-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="relative">
                                                    {city === "other" ? (
                                                        <Input
                                                            type="text"
                                                            placeholder="Name"
                                                            value={formData.customCity}
                                                            onChange={(e) => handleCustomInputChange(e, "customCity")}
                                                            className="h-8 text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                            autoFocus
                                                            disabled={!isLoggedIn}
                                                        />
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            className="h-8 w-full text-xs font-semibold rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                            onClick={() => handleCityChange("other")}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            Other
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Client Info Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="clientName" className="text-xs font-bold text-neutral-900">Name *</Label>
                                            <Input
                                                id="clientName"
                                                placeholder="Client name"
                                                name="clientName"
                                                value={formData.clientName}
                                                onChange={handleInputChange}
                                                className="h-8 text-xs rounded-lg border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                disabled={!isLoggedIn}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="mobileNumber" className="text-xs font-bold text-neutral-900">Mobile *</Label>
                                            <Input
                                                id="mobileNumber"
                                                placeholder="10 digits"
                                                name="mobileNumber"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                className="h-8 text-xs rounded-lg border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                maxLength={10}
                                                inputMode="numeric"
                                                disabled={!isLoggedIn}
                                            />
                                        </div>

                                        <div className="lg:col-span-2 space-y-1.5">
                                            <Label htmlFor="address" className="text-xs font-bold text-neutral-900">Address *</Label>
                                            <Input
                                                id="address"
                                                placeholder="Complete address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="h-8 text-xs w-full rounded-lg border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                disabled={!isLoggedIn}
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                        <div className="lg:col-span-1 space-y-1.5">
                                            <Label className="text-xs font-bold text-neutral-900">Payment *</Label>
                                            <RadioGroup value={payment} onValueChange={!isLoggedIn ? undefined : setPayment} className="flex gap-4 pt-0.5">
                                                <div className="flex items-center gap-1.5 cursor-pointer">
                                                    <RadioGroupItem value="yes" id="payment-yes" className="w-4 h-4 border border-neutral-400 accent-blue-500" />
                                                    <Label htmlFor="payment-yes" className="text-xs font-medium cursor-pointer text-neutral-900">Collected</Label>
                                                </div>
                                                <div className="flex items-center gap-1.5 cursor-pointer">
                                                    <RadioGroupItem value="no" id="payment-no" className="w-4 h-4 border border-neutral-400 accent-blue-500" />
                                                    <Label htmlFor="payment-no" className="text-xs font-medium cursor-pointer text-neutral-900">Pending</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        {payment === "yes" && (
                                            <div className="lg:col-span-2 space-y-1.5">
                                                <Label htmlFor="collectedBy" className="text-xs font-bold text-neutral-900">Collected By *</Label>
                                                <Input
                                                    id="collectedBy"
                                                    placeholder="Collector name"
                                                    name="collectedBy"
                                                    value={formData.collectedBy}
                                                    onChange={handleInputChange}
                                                    className="h-8 text-xs w-full rounded-lg border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                    disabled={!isLoggedIn}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* DSA & Engineer Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {/* DSA Section */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-neutral-900">Sales Agent (DSA) *</Label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {dsaNames && dsaNames.length > 0 && dsaNames.map(name => (
                                                    <div key={name} className="relative group">
                                                        <Button
                                                            type="button"
                                                            className={`h-8 w-full text-xs font-semibold rounded-lg transition-all ${dsa === name
                                                                ? "bg-blue-500 text-white border border-blue-600 shadow-md hover:bg-blue-600"
                                                                : "border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                                }`}
                                                            onClick={() => handleDsaChange(name)}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            {name}
                                                        </Button>
                                                        {!defaultDsaNames.includes(name) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteCustomEntry("dsas", name);
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                                disabled={!isLoggedIn}
                                                                title="Delete"
                                                            >
                                                                <FaTimes className="h-2.5 w-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="relative">
                                                    {dsa === "other" ? (
                                                        <Input
                                                            type="text"
                                                            placeholder="Name"
                                                            value={formData.customDsa}
                                                            onChange={(e) => handleCustomInputChange(e, "customDsa")}
                                                            className="h-8 text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                            autoFocus
                                                            disabled={!isLoggedIn}
                                                        />
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            className="h-8 w-full text-xs font-semibold rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                            onClick={() => handleDsaChange("other")}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            Other
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Engineer Name Section */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-neutral-900">Engineer *</Label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {engineers && engineers.length > 0 && engineers.map(name => (
                                                    <div key={name} className="relative group">
                                                        <Button
                                                            type="button"
                                                            className={`h-8 w-full text-xs font-semibold rounded-lg transition-all ${engineerName === name
                                                                ? "bg-blue-500 text-white border border-blue-600 shadow-md hover:bg-blue-600"
                                                                : "border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                                }`}
                                                            onClick={() => handleEngineerChange(name)}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            {name}
                                                        </Button>
                                                        {!defaultEngineers.includes(name) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteCustomEntry("engineers", name);
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                                disabled={!isLoggedIn}
                                                                title="Delete"
                                                            >
                                                                <FaTimes className="h-2.5 w-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="relative">
                                                    {engineerName === "other" ? (
                                                        <Input
                                                            type="text"
                                                            placeholder="Name"
                                                            value={formData.customEngineerName}
                                                            onChange={(e) => handleCustomInputChange(e, "customEngineerName")}
                                                            className="h-8 text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                            autoFocus
                                                            disabled={!isLoggedIn}
                                                        />
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            className="h-8 w-full text-xs font-semibold rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:border-blue-400 hover:bg-blue-50"
                                                            onClick={() => handleEngineerChange("other")}
                                                            disabled={!isLoggedIn}
                                                        >
                                                            Other
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="notes" className="text-xs font-bold text-neutral-900">Notes (Optional)</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Additional notes..."
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="text-xs rounded-lg border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[40px] max-h-[40px] bg-white"
                                            disabled={!isLoggedIn}
                                        />
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex gap-2.5 pt-3 border-t border-neutral-200">
                                        <Button
                                            type="submit"
                                            disabled={loading || !isLoggedIn}
                                            className="flex-1 h-9 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                                        >
                                            {!isLoggedIn ? "Login" : loading ? "Submitting..." : "Submit"}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => navigate("/dashboard")}
                                            disabled={loading}
                                            className="flex-1 h-9 text-xs font-bold rounded-lg border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 transition-all"
                                        >
                                            Back
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormPage;