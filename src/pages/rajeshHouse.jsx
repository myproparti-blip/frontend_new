import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    FaArrowLeft,
    FaDownload,
    FaUser,
    FaFileAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaSave,
    FaChartBar
} from "react-icons/fa";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, RadioGroup, RadioGroupItem, ChipSelect } from "../components/ui";
import { getRajeshHouseById, updateRajeshHouse, managerSubmitRajeshHouse, getLastSubmittedRajeshHouse } from "../services/rajeshHouseService";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";
import { uploadPropertyImages, uploadLocationImages, uploadDocuments, uploadAreaImages } from "../services/imageService";
import api, { invalidateCache } from "../services/axios";
import ClientInfoPanel from "../components/ClientInfoPanel";
import DocumentsPanel from "../components/DocumentsPanel";
import RealSpreadsheet from "../components/RealSpreadsheet";
import { generateRajeshHousePDF } from "../services/rajeshHousePdf";

const RajeshHouseEditForm = ({ user, onLogin }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading: loading } = useSelector((state) => state.loader);
    const [valuation, setValuation] = useState(null);
    const isLoggedIn = !!user;
    const [bankName, setBankName] = useState("");
    const [city, setCity] = useState("");
    const [dsa, setDsa] = useState("");
    const [engineerName, setEngineerName] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null);
    const [modalFeedback, setModalFeedback] = useState("");
    const [activeTab, setActiveTab] = useState("client");
    const [customFields, setCustomFields] = useState([]);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [customConstructionCostFields, setCustomConstructionCostFields] = useState([]);
    const [spreadsheetData, setSpreadsheetData] = useState(null);
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        // BASIC INFO
        uniqueId: '',
        username: '',
        dateTime: '',
        day: '',

        // BANK & CITY
        bankName: '',
        city: '',

        // CLIENT DETAILS
        clientName: '',
        mobileNumber: '',
        address: '',

        // PAYMENT
        payment: '',
        collectedBy: '',

        // DSA
        dsa: '',
        customDsa: '',

        // ENGINEER
        engineerName: '',
        customEngineerName: '',

        // NOTES
        notes: '',

        // PROPERTY BASIC DETAILS
        elevation: '',

        // COORDINATES
        coordinates: {
            latitude: '',
            longitude: ''
        },

        // IMAGES
        propertyImages: [],
        locationImages: [],
        documentPreviews: [],
        areaImages: {},
        photos: {
            elevationImages: [],
            siteImages: []
        },

        // STATUS
        status: 'pending',
        managerFeedback: '',
        submittedByManager: false,
        lastUpdatedBy: '',
        lastUpdatedByRole: '',
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [locationImagePreviews, setLocationImagePreviews] = useState([]);
    const [bankImagePreview, setBankImagePreview] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const defaultBanks = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "BOB"];
    const defaultCities = ["Surat", "vadodara", "Ahmedabad", "Kheda"];
    const defaultDsaNames = ["Bhayva Shah", "Shailesh Shah", "Vijay Shah"];
    const defaultEngineers = ["Bhavesh", "Bhanu", "Ronak", "Mukesh"];

    const [banks, setBanks] = useState(defaultBanks);
    const [cities, setCities] = useState(defaultCities);
    const [dsaNames, setDsaNames] = useState(defaultDsaNames);
    const [engineerNames, setEngineerNames] = useState(defaultEngineers);
    const [customOptions, setCustomOptions] = useState({
        dsa: [],
        engineerName: [],
        bankName: [],
        city: []
    });

    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);
    const fileInputRef3 = useRef(null);
    const fileInputRef4 = useRef(null);
    const locationFileInputRef = useRef(null);
    const documentFileInputRef = useRef(null);
    const bankFileInputRef = useRef(null);
    const dropdownFetchedRef = useRef(false);
    const valuationFetchedRef = useRef(false);

    const username = user?.username || "";
    const role = user?.role || "";
    const clientId = user?.clientId || "";

    const handleDownloadPDF = async () => {
        try {
            dispatch(showLoader());
            // ALWAYS fetch fresh data from DB - do not use local state which may be stale
            let dataToDownload;

            try {
                // Add cache buster to ensure fresh data
                const cacheParams = { username, userRole: role, clientId, t: Date.now() };
                dataToDownload = await api.get(`${process.env.REACT_APP_API_URL}/rajesh-house/${id}`, {
                    params: cacheParams
                }).then(res => res.data.data);
                ('✅ Fresh Rajesh House data fetched for PDF:', {
                    bankName: dataToDownload?.bankName,
                    city: dataToDownload?.city
                });
            } catch (fetchError) {
                console.error('❌ Failed to fetch fresh Rajesh House data:', fetchError);
                // Use in-memory valuation data if available
                dataToDownload = valuation;
                if (!dataToDownload || !dataToDownload.uniqueId) {
                    console.warn('Rajesh House form not found in DB and no local data available');
                    showError('Form data not found. Please save the form first before downloading.');
                    dispatch(hideLoader());
                    return;
                } else {
                    ('⚠️ Using unsaved form data from memory for PDF generation');
                }
            }

            await generateRajeshHousePDF(dataToDownload);
            showSuccess('PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showError('Failed to download PDF');
        } finally {
            dispatch(hideLoader());
        }
    };

    useEffect(() => {
        if (id && !valuationFetchedRef.current) {
            valuationFetchedRef.current = true;
            loadValuation();
        }
    }, [id]);


    // Monitor area images to ensure they're properly loaded on initial page load
    useEffect(() => {
        if (formData?.areaImages && Object.keys(formData.areaImages).length > 0) {
            ('[rajeshHouse.jsx] Area Images data loaded:', Object.keys(formData.areaImages));
        }
    }, [formData?.areaImages]);

    // Monitor bank image preview state
    useEffect(() => {
        if (bankImagePreview) {
            ('[rajeshHouse.jsx] Bank image preview state updated:', bankImagePreview);
        } else {
            ('[rajeshHouse.jsx] Bank image preview is null/empty');
        }
    }, [bankImagePreview]);

    // Sync bankName, city, dsa, engineerName values back to formData whenever they change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            bankName: bankName,
            city: city,
            dsa: dsa,
            engineerName: engineerName
        }));
    }, [bankName, city, dsa, engineerName]);

    // Helper function to restore image previews from data
    const restoreImagePreviews = (data) => {
        // Restore property image previews
        if (data.propertyImages && Array.isArray(data.propertyImages)) {
            const propertyPreviews = data.propertyImages
                .filter(img => img && typeof img === 'object')
                .map((img, idx) => {
                    let previewUrl = '';
                    if (img.url) {
                        previewUrl = img.url;
                    } else if (img.path) {
                        const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                        previewUrl = `/api/uploads/${fileName}`;
                    } else if (img.fileName) {
                        previewUrl = `/api/uploads/${img.fileName}`;
                    }
                    return {
                        preview: previewUrl,
                        url: previewUrl,
                        name: img.name || `Property Image ${idx + 1}`,
                        fileName: img.fileName || `Property Image ${idx + 1}`,
                        path: img.path || img.fileName || '',
                        size: img.size || 0
                    };
                });
            setImagePreviews(propertyPreviews);
        }

        // Restore location image previews
        if (data.locationImages && Array.isArray(data.locationImages)) {
            const locationPreviews = data.locationImages
                .filter(img => img && typeof img === 'object')
                .map((img, idx) => {
                    let previewUrl = '';
                    if (img.url) {
                        previewUrl = img.url;
                    } else if (img.path) {
                        const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                        previewUrl = `/api/uploads/${fileName}`;
                    } else if (img.fileName) {
                        previewUrl = `/api/uploads/${img.fileName}`;
                    }
                    return {
                        preview: previewUrl,
                        url: previewUrl,
                        name: img.name || `Location Image ${idx + 1}`,
                        fileName: img.fileName || `Location Image ${idx + 1}`,
                        path: img.path || img.fileName || '',
                        size: img.size || 0
                    };
                });
            setLocationImagePreviews(locationPreviews);
        }

        // Restore document previews
        if (data.documentPreviews && Array.isArray(data.documentPreviews)) {
            setFormData(prev => ({
                ...prev,
                documentPreviews: data.documentPreviews
            }));
        }

        // Restore area images from database (same as rajeshFlat.jsx)
        if (data.areaImages && typeof data.areaImages === 'object' && Object.keys(data.areaImages).length > 0) {
            ('[rajeshHouse.jsx] Restoring area images:', Object.keys(data.areaImages));
            setFormData(prev => ({
                ...prev,
                areaImages: data.areaImages
            }));
        }

        // Restore bank image from database
        if (data.bankImage && typeof data.bankImage === 'object') {
            ('[rajeshHouse.jsx] Restoring bank image - data:', data.bankImage);
            let previewUrl = '';
            if (data.bankImage.url) {
                previewUrl = data.bankImage.url;
                ('[rajeshHouse.jsx] Bank image URL from url field:', previewUrl);
            } else if (data.bankImage.path) {
                const fileName = data.bankImage.path.split('\\').pop() || data.bankImage.path.split('/').pop();
                previewUrl = `/api/uploads/${fileName}`;
                ('[rajeshHouse.jsx] Bank image URL from path:', previewUrl);
            } else if (data.bankImage.fileName) {
                previewUrl = `/api/uploads/${data.bankImage.fileName}`;
                ('[rajeshHouse.jsx] Bank image URL from fileName:', previewUrl);
            }
            if (previewUrl) {
                const bankImageObj = {
                    preview: previewUrl,
                    name: data.bankImage.name || 'Bank Image',
                    path: data.bankImage.path || data.bankImage.fileName || ''
                };
                ('[rajeshHouse.jsx] Bank image preview object:', bankImageObj);
                setBankImagePreview(bankImageObj);
                ('[rajeshHouse.jsx] Bank image preview set successfully');
            } else {
                ('[rajeshHouse.jsx] No preview URL found for bank image');
            }
        } else {
            ('[rajeshHouse.jsx] No bank image data found - data.bankImage:', data.bankImage);
        }
    };

    const loadValuation = async () => {
        const savedData = localStorage.getItem(`valuation_draft_${username}`);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.uniqueId === id) {
                setValuation(parsedData);
                mapDataToForm(parsedData);
                restoreImagePreviews(parsedData);
                return;
            }
        }

        try {
            // Pass user info for authentication
            const dbData = await getRajeshHouseById(id, username, role, clientId);
            ('[rajeshHouse.jsx] Loaded data from API:', {
                hasAreaImages: !!dbData.areaImages,
                areaImagesKeys: dbData.areaImages ? Object.keys(dbData.areaImages) : [],
                hasBankImage: !!dbData.bankImage,
                bankImageData: dbData.bankImage
            });
            setValuation(dbData);
            mapDataToForm(dbData);
            restoreImagePreviews(dbData);

            setBankName(dbData.bankName || "");
            setCity(dbData.city || "");
            setDsa(dbData.dsa || "");
            setEngineerName(dbData.engineerName || "");
        } catch (error) {
            console.error("Error loading valuation:", error);
            // If form not found (new form), try to autofill from last submitted form
             if (error.message && error.message.includes("not found")) {
                 let lastForm = null;
                 try {
                     ("[loadValuation] Form not found, attempting autofill from last form...");

                     // Fetch last submitted form for autofilling valuation tab data and spreadsheet data
                     lastForm = await getLastSubmittedRajeshHouse();

                     ("[loadValuation] Last form fetched:", {
                         exists: !!lastForm,
                         hasSpreadsheetData: !!lastForm?.spreadsheetData
                     });
                 } catch (autofillError) {
                     console.warn("Could not autofill from last form:", autofillError.message);
                     // Continue with empty form if autofill fails
                 }

                 // Initialize with empty form or autofilled data
                 const newFormData = {
                     ...formData,
                     uniqueId: id,
                     username: username,
                     clientId: clientId
                 };
                 
                 // Autofill spreadsheet data if available from last form
                 if (lastForm && lastForm.spreadsheetData) {
                     newFormData.spreadsheetData = lastForm.spreadsheetData;
                     showSuccess("New form created with Excel sheet data from previous form");
                 } else {
                     showError("Rajesh House form not found. Creating new form...");
                 }
                 
                 setValuation(newFormData);
                 mapDataToForm(newFormData);
             }
        }
    };

    const mapDataToForm = (data) => {
        // Always store the actual values in state first, regardless of whether they're in the dropdown lists
        setBankName(data.bankName || "");
        setCity(data.city || "");
        setDsa(data.dsa || "");
        setEngineerName(data.engineerName || "");

        // Load custom fields from data
        if (data.customFields && Array.isArray(data.customFields)) {
            setCustomFields(data.customFields);
        }

        // Load custom construction cost fields from data
        if (data.customConstructionCostFields && Array.isArray(data.customConstructionCostFields)) {
            setCustomConstructionCostFields(data.customConstructionCostFields);
        }

        // Load spreadsheet data
        if (data.spreadsheetData) {
            setSpreadsheetData(data.spreadsheetData);
        }

        setFormData(prev => {
            return {
                ...prev,
                ...data
            };
        });
    };

    const canEdit = isLoggedIn && (
        (role === "admin") ||
        (role === "manager" && (valuation?.status === "pending" || valuation?.status === "rejected" || valuation?.status === "on-progress" || valuation?.status === "rework")) ||
        ((role === "user") && (valuation?.status === "rejected" || valuation?.status === "pending" || valuation?.status === "rework"))
    );

    const canEditField = (fieldName) => {
        // Allow editing if status allows it
        return canEdit;
    };

    const canApprove = isLoggedIn && (role === "manager" || role === "admin") &&
        (valuation?.status === "pending" || valuation?.status === "on-progress" || valuation?.status === "rejected" || valuation?.status === "rework");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleIntegerInputChange = (e, callback) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (callback) callback(value);
    };

    const handleLettersOnlyInputChange = (e, callback) => {
        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        if (callback) callback(value);
    };

    const handleLocationImageUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Use URL.createObjectURL for instant preview (non-blocking)
        const newPreviews = Array.from(files).map(file => ({
            preview: URL.createObjectURL(file),
            name: file.name,
            file: file
        }));

        // Single batched state update
        setLocationImagePreviews(prev => [
            ...prev,
            ...newPreviews
        ]);
    };

    const handleImageUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Use URL.createObjectURL for instant preview (non-blocking)
        const newPreviews = Array.from(files).map(file => ({
            preview: URL.createObjectURL(file),
            name: file.name,
            file: file
        }));

        // Single batched state update
        setImagePreviews(prev => [
            ...prev,
            ...newPreviews
        ]);
    };

    const removeLocationImage = (index) => {
        setLocationImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleDocumentUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);

        // Create local previews with URL.createObjectURL (non-blocking)
        const localPreviews = filesArray.map((file) => ({
            preview: URL.createObjectURL(file),
            file: file,
            fileName: file.name,
            size: file.size
        }));

        // Single state update: add local previews
        setFormData(prev => ({
            ...prev,
            documentPreviews: [
                ...(prev.documentPreviews || []),
                ...localPreviews
            ]
        }));

        try {
            // Upload images using same service as Property Images with compression
            const uploadedImages = await uploadPropertyImages(
                filesArray.map(f => ({ file: f, inputNumber: 1 })),
                valuation.uniqueId
            );

            // Single state update: replace local previews with actual URLs
            setFormData(prev => {
                const newPreviews = [...(prev.documentPreviews || [])];
                const startIndex = Math.max(0, newPreviews.length - filesArray.length);

                uploadedImages.forEach((uploadedImage, uploadIndex) => {
                    const previewIndex = startIndex + uploadIndex;
                    if (previewIndex < newPreviews.length && uploadedImage?.url) {
                        newPreviews[previewIndex] = {
                            fileName: newPreviews[previewIndex].fileName,
                            size: newPreviews[previewIndex].size,
                            url: uploadedImage.url
                        };
                    }
                });

                return { ...prev, documentPreviews: newPreviews };
            });
        } catch (error) {
            console.error('Error uploading supporting images:', error);
            showError('Failed to upload images: ' + error.message);

            // Remove the local previews on error (single state update)
            setFormData(prev => ({
                ...prev,
                documentPreviews: (prev.documentPreviews || []).slice(0, -filesArray.length)
            }));
        } finally {
            // Reset input
            if (documentFileInputRef.current) {
                documentFileInputRef.current.value = '';
            }
        }
    };

    const removeDocument = (index) => {
        setFormData(prev => ({
            ...prev,
            documentPreviews: (prev.documentPreviews || []).filter((_, i) => i !== index)
        }));
    };

    const handleBankImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Use URL.createObjectURL for instant preview (non-blocking)
        const preview = URL.createObjectURL(file);
        setBankImagePreview({ preview, name: file.name, file: file });

        // Reset input
        if (bankFileInputRef.current) {
            bankFileInputRef.current.value = '';
        }
    };

    const removeBankImage = () => {
        setBankImagePreview(null);
        if (bankFileInputRef.current) {
            bankFileInputRef.current.value = '';
        }
    };

    const handleCoordinateChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                [field]: value
            }
        }));
    };

  
    const validateForm = () => {
        const errors = [];

        // === CLIENT INFORMATION ===
        if (!formData.clientName || !formData.clientName.trim()) {
            errors.push("Client Name is required");
        }

        if (!formData.mobileNumber || !formData.mobileNumber.trim()) {
            errors.push("Mobile Number is required");
        } else {
            // Mobile number validation - exactly 10 digits
            const mobileDigits = formData.mobileNumber.replace(/\D/g, '');
            if (mobileDigits.length !== 10) {
                errors.push("Mobile Number must be 10 digits");
            }
        }

        if (!formData.address || !formData.address.trim()) {
            errors.push("Address is required");
        }

        // === BANK & CITY ===
        const finalBankName = bankName === "other" ? formData.customBankName : bankName;
        if (!finalBankName || !finalBankName.trim()) {
            errors.push("Bank Name is required");
        }

        const finalCity = city === "other" ? formData.customCity : city;
        if (!finalCity || !finalCity.trim()) {
            errors.push("City is required");
        }

        // === MARKET APPLICATIONS / DSA (Sales Agent) ===
        const finalDsa = formData.dsa === "other" ? formData.customDsa : formData.dsa;
        if (!finalDsa || !finalDsa.trim()) {
            errors.push("Market Applications / DSA (Sales Agent) is required");
        }

        // === ENGINEER NAME ===
        const finalEngineerName = formData.engineerName === "other" ? formData.customEngineerName : formData.engineerName;
        if (!finalEngineerName || !finalEngineerName.trim()) {
            errors.push("Engineer Name is required");
        }

        // === PAYMENT INFORMATION ===
        if (formData.payment === "yes" && (!formData.collectedBy || !formData.collectedBy.trim())) {
            errors.push("Collected By name is required when payment is collected");
        }

        // === GPS COORDINATES VALIDATION ===
        if (formData.coordinates.latitude || formData.coordinates.longitude) {
            if (formData.coordinates.latitude) {
                const lat = parseFloat(formData.coordinates.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    errors.push("Latitude must be a valid number between -90 and 90");
                }
            }

            if (formData.coordinates.longitude) {
                const lng = parseFloat(formData.coordinates.longitude);
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    errors.push("Longitude must be a valid number between -180 and 180");
                }
            }
        }

        return errors;
    };

    const handleManagerAction = async (action) => {
        // For Approve action, trigger Save first
        if (action === "approve") {
            try {
                // Create a promise to handle the async save
                const savePromise = new Promise((resolve, reject) => {
                    dispatch(showLoader("Saving form..."));

                    // Call the save logic (from onFinish but without redirect)
                    (async () => {
                        try {
                            if (!user) {
                                showError('Authentication required. Please log in.');
                                onLogin?.();
                                reject(new Error('Not authenticated'));
                                return;
                            }

                            // Build the complete payload
                            const payload = {
                                clientId: user.clientId,
                                uniqueId: formData.uniqueId || id,
                                username: formData.username || user.username,
                                dateTime: formData.dateTime,
                                day: formData.day,
                                bankName: bankName || "",
                                city: city || "",
                                clientName: formData.clientName,
                                mobileNumber: formData.mobileNumber,
                                address: formData.address,
                                payment: formData.payment,
                                collectedBy: formData.collectedBy,
                                dsa: dsa || "",
                                engineerName: engineerName || "",
                                notes: formData.notes,
                                elevation: formData.elevation,
                                directions: formData.directions,
                                coordinates: formData.coordinates,
                                ...(valuation?._id && { status: "on-progress" }),
                                managerFeedback: formData.managerFeedback,
                                submittedByManager: formData.submittedByManager,
                                customFields: customFields,
                                customConstructionCostFields: customConstructionCostFields,
                                spreadsheetData: spreadsheetData || { rows: [] }
                            };

                            // Parallel image uploads (including supporting images and area images)
                            const [uploadedPropertyImages, uploadedLocationImages, uploadedSupportingImages, uploadedAreaImages] = await Promise.all([
                                (async () => {
                                    const newPropertyImages = imagePreviews.filter(p => p && p.file);
                                    if (newPropertyImages.length > 0) {
                                        return await uploadPropertyImages(newPropertyImages, valuation.uniqueId);
                                    }
                                    return [];
                                })(),
                                (async () => {
                                    const newLocationImages = locationImagePreviews.filter(p => p && p.file);
                                    if (newLocationImages.length > 0) {
                                        return await uploadLocationImages(newLocationImages, valuation.uniqueId);
                                    }
                                    return [];
                                })(),
                                (async () => {
                                    // Handle supporting images (documents) - upload any with file objects
                                    const newSupportingImages = (formData.documentPreviews || []).filter(d => d && d.file);
                                    if (newSupportingImages.length > 0) {
                                        return await uploadPropertyImages(newSupportingImages, valuation.uniqueId);
                                    }
                                    return [];
                                })(),
                                (async () => {
                                    // Handle area images - upload any with file objects
                                    if (formData.areaImages && Object.keys(formData.areaImages).length > 0) {
                                        const areaImagesObj = {};
                                        const areaImagesToUpload = {};

                                        for (const [area, images] of Object.entries(formData.areaImages)) {
                                            if (Array.isArray(images)) {
                                                const filesToUpload = images.filter(img => img && img.file);
                                                const previousImages = images.filter(img => img && !img.file);

                                                areaImagesObj[area] = previousImages.map(img => {
                                                    // Exclude blob URLs - use url first, then preview if not blob
                                                    const finalUrl = (img.url && !img.url.startsWith('blob:'))
                                                        ? img.url
                                                        : (img.preview && !img.preview.startsWith('blob:') ? img.preview : '');

                                                    return {
                                                        fileName: img.fileName || img.name || 'Image',
                                                        size: img.size || 0,
                                                        url: finalUrl
                                                    };
                                                });

                                                if (filesToUpload.length > 0) {
                                                    areaImagesToUpload[area] = filesToUpload;
                                                }
                                            }
                                        }

                                        // Upload any new files
                                        if (Object.keys(areaImagesToUpload).length > 0) {
                                            const uploadPromises = [];
                                            for (const [area, files] of Object.entries(areaImagesToUpload)) {
                                                if (files.length > 0) {
                                                    uploadPromises.push(
                                                        uploadPropertyImages(files, valuation.uniqueId).then(uploaded => ({
                                                            area,
                                                            uploaded
                                                        }))
                                                    );
                                                }
                                            }

                                            if (uploadPromises.length > 0) {
                                                const results = await Promise.all(uploadPromises);
                                                for (const result of results) {
                                                    const uploadedImages = result.uploaded.map(img => ({
                                                        fileName: img.originalFileName || img.publicId || 'Image',
                                                        size: img.bytes || img.size || 0,
                                                        url: img.url
                                                    }));
                                                    areaImagesObj[result.area] = [
                                                        ...(areaImagesObj[result.area] || []),
                                                        ...uploadedImages
                                                    ];
                                                }
                                            }
                                        }

                                        return areaImagesObj;
                                    }
                                    return {};
                                })()
                            ]);

                            // Combine previously saved images with newly uploaded URLs
                            const previousPropertyImages = imagePreviews
                                .filter(p => p && !p.file && p.preview)
                                .map((preview, idx) => ({
                                    url: preview.preview,
                                    index: idx
                                }));

                            // For location images: if new image uploaded, use only the new one; otherwise use previous
                            const previousLocationImages = (uploadedLocationImages.length === 0)
                                ? locationImagePreviews
                                    .filter(p => p && !p.file && p.preview)
                                    .map((preview, idx) => ({
                                        url: preview.preview,
                                        index: idx
                                    }))
                                : [];

                            // Combine supporting images with previously saved ones
                            const previousSupportingImages = (formData.documentPreviews || [])
                                .filter(d => d && !d.file && d.url)
                                .map(d => ({
                                    fileName: d.fileName,
                                    size: d.size,
                                    url: d.url
                                }));

                            payload.propertyImages = [...previousPropertyImages, ...uploadedPropertyImages];
                            payload.locationImages = uploadedLocationImages.length > 0 ? uploadedLocationImages : previousLocationImages;
                            payload.documentPreviews = [...previousSupportingImages, ...uploadedSupportingImages.map(img => ({
                                fileName: img.originalFileName || img.publicId || 'Image',
                                size: img.bytes || img.size || 0,
                                url: img.url
                            }))];

                            // Handle area images - combine uploaded with existing ones
                            if (uploadedAreaImages && Object.keys(uploadedAreaImages).length > 0) {
                                payload.areaImages = uploadedAreaImages;
                            } else if (formData.areaImages && Object.keys(formData.areaImages).length > 0) {
                                // Keep existing area images if no new uploads
                                payload.areaImages = formData.areaImages;
                            }

                            // Clear draft before API call
                            localStorage.removeItem(`valuation_draft_${user.username}`);

                            // Call API to update rajesh house
                            await updateRajeshHouse(id, payload, user.username, user.role, user.clientId);
                            invalidateCache("/rajesh-house");

                            showSuccess('Rajesh House form saved successfully');
                            resolve();
                        } catch (error) {
                            console.error("Error saving Rajesh House form:", error);
                            showError('Failed to save Rajesh House form');
                            reject(error);
                        } finally {
                            dispatch(hideLoader());
                        }
                    })();
                });

                await savePromise;

                // If save succeeded, proceed with approval
                setModalAction(action);
                setModalFeedback("");
                setModalOpen(true);
            } catch (error) {
                console.error('Save failed before approval:', error);
                return;
            }
        } else {
            // For Reject action, open modal directly
            setModalAction(action);
            setModalFeedback("");
            setModalOpen(true);
        }
    };

    const handleModalOk = async () => {
        let statusValue, actionLabel;

        if (modalAction === "approve") {
            statusValue = "approved";
            actionLabel = "Approve";
        } else if (modalAction === "reject") {
            statusValue = "rejected";
            actionLabel = "Reject";
        } else if (modalAction === "rework") {
            statusValue = "rework";
            actionLabel = "Request Rework";
        }

        try {
            dispatch(showLoader(`${actionLabel}ing form...`));

            const responseData = await managerSubmitRajeshHouse(id, statusValue, modalFeedback, user.username, user.role);

            invalidateCache("/rajesh-house");

            // Update the form state with response data from backend
            setValuation(responseData);

            showSuccess(`Rajesh House form ${statusValue} successfully!`);
            dispatch(hideLoader());
            setModalOpen(false);

            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 300);
        } catch (err) {
            showError(err.message || `Failed to ${actionLabel.toLowerCase()} form`);
            dispatch(hideLoader());
        }
    };

    const onFinish = async (e) => {
        e.preventDefault();

        const isUserUpdate = role === "user" && (valuation.status === "pending" || valuation.status === "rejected" || valuation.status === "rework");
        const isManagerUpdate = role === "manager" && (valuation.status === "pending" || valuation.status === "rejected" || valuation.status === "on-progress" || valuation.status === "rework");
        const isAdminUpdate = role === "admin";

        if (!isUserUpdate && !isManagerUpdate && !isAdminUpdate) {
            showError("You don't have permission to update this form");
            return;
        }

        // Validate form
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            // Show single consolidated error instead of multiple notifications
            showError(` ${validationErrors.join(", ")}`);
            return;
        }

        try {
            dispatch(showLoader("Saving..."));

            const payload = {
                clientId: clientId,
                uniqueId: formData.uniqueId || id,
                username: formData.username || username,
                dateTime: formData.dateTime,
                day: formData.day,
                bankName: bankName || "",
                city: city || "",
                clientName: formData.clientName,
                mobileNumber: formData.mobileNumber,
                address: formData.address,
                payment: formData.payment,
                collectedBy: formData.collectedBy,
                dsa: dsa || "",
                engineerName: formData.engineerName || "",
                notes: formData.notes,
                elevation: formData.elevation,
                directions: formData.directions,
                coordinates: formData.coordinates,
                propertyImages: formData.propertyImages || [],
                locationImages: formData.locationImages || [],
                documentPreviews: (formData.documentPreviews || []).map(doc => ({
                    fileName: doc.fileName,
                    size: doc.size,
                    ...(doc.url && { url: doc.url })
                })),
                photos: formData.photos || { elevationImages: [], siteImages: [] },
                status: "on-progress",
                customConstructionCostFields: customConstructionCostFields,
                customFields: customFields,
                managerFeedback: formData.managerFeedback || "",
                submittedByManager: formData.submittedByManager || false,
                lastUpdatedBy: username,
                lastUpdatedByRole: role,
                spreadsheetData: spreadsheetData || { rows: [] }
            };

            // Handle image uploads - parallel (including supporting images, area images, and bank image)
            const [uploadedPropertyImages, uploadedLocationImages, uploadedSupportingImages, uploadedAreaImages, uploadedBankImage] = await Promise.all([
                (async () => {
                    const newPropertyImages = imagePreviews.filter(p => p && p.file);
                    if (newPropertyImages.length > 0) {
                        return await uploadPropertyImages(newPropertyImages, valuation.uniqueId);
                    }
                    return [];
                })(),
                (async () => {
                    const newLocationImages = locationImagePreviews.filter(p => p && p.file);
                    if (newLocationImages.length > 0) {
                        return await uploadLocationImages(newLocationImages, valuation.uniqueId);
                    }
                    return [];
                })(),
                (async () => {
                    // Handle supporting images (documents) - upload any with file objects
                    const newSupportingImages = (formData.documentPreviews || []).filter(d => d && d.file);
                    if (newSupportingImages.length > 0) {
                        return await uploadPropertyImages(newSupportingImages, valuation.uniqueId);
                    }
                    return [];
                })(),
                (async () => {
                    // Handle area images - upload using uploadAreaImages
                    if (formData.areaImages && Object.keys(formData.areaImages).length > 0) {
                        return await uploadAreaImages(formData.areaImages, valuation.uniqueId);
                    }
                    return {};
                })(),
                (async () => {
                    // Handle bank image upload
                    if (bankImagePreview && bankImagePreview.file) {
                        const result = await uploadPropertyImages([{ file: bankImagePreview.file, inputNumber: 1 }], valuation.uniqueId);
                        return result.length > 0 ? result[0] : null;
                    }
                    return null;
                })()
            ]);

            // Combine previously saved images with newly uploaded URLs
            const previousPropertyImages = imagePreviews
                .filter(p => p && !p.file && p.preview)
                .map((preview, idx) => ({
                    url: preview.preview,
                    index: idx
                }));

            // For location images: if new image uploaded, use only the new one; otherwise use previous
            const previousLocationImages = (uploadedLocationImages.length === 0)
                ? locationImagePreviews
                    .filter(p => p && !p.file && p.preview)
                    .map((preview, idx) => ({
                        url: preview.preview,
                        index: idx
                    }))
                : [];

            // Combine supporting images with previously saved ones
            const previousSupportingImages = (formData.documentPreviews || [])
                .filter(d => d && !d.file && d.url)
                .map(d => ({
                    fileName: d.fileName,
                    size: d.size,
                    url: d.url
                }));

            payload.propertyImages = [...previousPropertyImages, ...uploadedPropertyImages];
            payload.locationImages = uploadedLocationImages.length > 0 ? uploadedLocationImages : previousLocationImages;
            payload.documentPreviews = [...previousSupportingImages, ...uploadedSupportingImages.map(img => ({
                fileName: img.originalFileName || img.publicId || 'Image',
                size: img.bytes || img.size || 0,
                url: img.url
            }))];

            // Handle area images - combine uploaded with existing ones
            if (uploadedAreaImages && Object.keys(uploadedAreaImages).length > 0) {
                payload.areaImages = uploadedAreaImages;
            } else if (formData.areaImages && typeof formData.areaImages === 'object') {
                // If no uploads, preserve existing area images (with proper URLs only, no blob URLs)
                const areaImagesObj = {};
                for (const [area, images] of Object.entries(formData.areaImages)) {
                    if (Array.isArray(images)) {
                        areaImagesObj[area] = images
                            .filter(img => img && !img.file)  // Only keep saved images, not new uploads
                            .map(img => ({
                                fileName: img.fileName || img.name || 'Image',
                                size: img.size || 0,
                                url: img.url || img.preview || ''
                            }));
                    }
                }
                payload.areaImages = areaImagesObj;
            } else {
                payload.areaImages = {};
            }

            // Handle bank image
            if (uploadedBankImage) {
                // New bank image was uploaded
                payload.bankImage = {
                    url: uploadedBankImage.url,
                    fileName: uploadedBankImage.originalFileName || uploadedBankImage.publicId || 'Bank Image',
                    size: uploadedBankImage.bytes || uploadedBankImage.size || 0
                };
            } else if (bankImagePreview && !bankImagePreview.file && bankImagePreview.preview) {
                // Existing bank image from database - keep the preview URL
                payload.bankImage = {
                    url: bankImagePreview.preview,
                    fileName: bankImagePreview.name || 'Bank Image',
                    path: bankImagePreview.path || ''
                };
            } else if (!bankImagePreview) {
                // No bank image
                payload.bankImage = null;
            }

            // Clear draft before API call
            localStorage.removeItem(`valuation_draft_${username}`);

            // Call API to update Rajesh House form
            ("[rajeshHouse.jsx] Payload being sent to API:", {
                clientId: payload.clientId,
                uniqueId: payload.uniqueId,
                bankName: payload.bankName,
                city: payload.city,
                areaImagesCount: Object.keys(payload.areaImages || {}).length,
                areaImagesAreas: Object.keys(payload.areaImages || {}),
                bankImage: !!payload.bankImage
            });
            const apiResponse = await updateRajeshHouse(id, payload, username, role, clientId);
            invalidateCache("/rajesh-house");

            // Get the actual status from API response (server updates to on-progress on save)
            const newStatus = apiResponse?.status || "on-progress";

            // Update local state with API response
            const updatedValuation = {
                ...valuation,
                ...(apiResponse || {}),
                ...payload,
                status: newStatus, // Use server-confirmed status
                lastUpdatedBy: apiResponse?.lastUpdatedBy || username,
                lastUpdatedByRole: apiResponse?.lastUpdatedByRole || role,
                lastUpdatedAt: apiResponse?.lastUpdatedAt || new Date().toISOString()
            };

            setValuation(updatedValuation);
            // Set bank and city states based on whether they're in default lists
            const bankState = banks.includes(payload.bankName) ? payload.bankName : "other";
            const cityState = cities.includes(payload.city) ? payload.city : "other";
            setBankName(bankState);
            setCity(cityState);
            // Update formData with trimmed custom values
            setFormData(prev => {
                // Deep merge landValuation to preserve nested structure
                let mergedLandValuation = { ...prev.landValuation };
                if (payload.landValuation) {
                    Object.keys(payload.landValuation).forEach(key => {
                        if (typeof payload.landValuation[key] === 'object' && payload.landValuation[key] !== null && !Array.isArray(payload.landValuation[key])) {
                            mergedLandValuation[key] = {
                                ...mergedLandValuation[key],
                                ...payload.landValuation[key]
                            };
                        } else {
                            mergedLandValuation[key] = payload.landValuation[key];
                        }
                    });
                }

                return {
                    ...prev,
                    ...payload,
                    landValuation: mergedLandValuation,
                    customBankName: bankState === "other" ? payload.bankName : "",
                    customCity: cityState === "other" ? payload.city : "",
                    customDsa: formData.dsa === "other" ? (payload.dsa || "").trim() : "",
                    customEngineerName: formData.engineerName === "other" ? (payload.engineerName || "").trim() : ""
                };
            });

            showSuccess("Form saved successfully!");
            dispatch(hideLoader());
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 300);
        } catch (err) {
            const errorMessage = err.message || "Failed to update form";
            showError(errorMessage);
            dispatch(hideLoader());
        }
    };

 
    if (!valuation) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-80">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-muted-foreground">Loading valuation...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-4">
            {!isLoggedIn && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 max-w-sm border border-neutral-200 shadow-lg">
                        <p className="text-center font-semibold text-base text-neutral-900">Please login to edit this valuation</p>
                        <p className="text-center text-sm text-neutral-600 mt-3">You are currently viewing in read-only mode</p>
                    </div>
                </div>
            )}

            <div className="max-w-full mx-auto">

                {/* Header */}
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
                            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Edit Valuation Form</h1>
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
                    className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-neutral-200 shadow-lg z-[9998] transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-medium text-neutral-900">{valuation?.status?.charAt(0).toUpperCase() + valuation?.status?.slice(1)}</p>
                        </div>
                        <div className="border-t border-neutral-200"></div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Last Updated</p>
                            <p className="text-sm font-medium text-neutral-900 break-words">{new Date().toLocaleString()}</p>
                        </div>
                        <div className="border-t border-neutral-200"></div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">ID</p>
                            <code className="bg-neutral-100 px-2 py-1.5 rounded-lg text-xs font-mono break-all text-neutral-700 border border-neutral-300 block">{id.slice(0, 12)}...</code>
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
                    {/* Main Form */}
                    <div className="col-span-12">
                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            
                            <CardContent className="p-4 overflow-y-auto flex-1">
                                <form className="space-y-3" onSubmit={onFinish}>

                                    {/* Main Tab Navigation - Client/Documents/Valuation */}
                                    <div className="flex gap-2 overflow-x-auto">
                                        {[
                                            { id: 'client', label: 'CLIENT', icon: FaUser },
                                            { id: 'documents', label: 'DOCS', icon: FaFileAlt },
                                            { id: 'spreadsheet', label: 'Report Data', icon: FaChartBar },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${activeTab === tab.id
                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                    : "bg-white border border-gray-300 text-gray-900 hover:border-blue-500"
                                                    }`}
                                            >
                                                <tab.icon size={12} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Client Info Tab */}
                                    {activeTab === 'client' && (
                                        <div>
                                            <ClientInfoPanel
                                                formData={formData}
                                                bankName={bankName}
                                                city={city}
                                                canEdit={canEdit}
                                                canEditField={canEditField}
                                                handleInputChange={handleInputChange}
                                                handleIntegerInputChange={handleIntegerInputChange}
                                                handleLettersOnlyInputChange={handleLettersOnlyInputChange}
                                                setBankName={setBankName}
                                                setCity={setCity}
                                                setFormData={setFormData}
                                                banks={banks}
                                                cities={cities}
                                                dsaNames={dsaNames}
                                                dsa={dsa}
                                                setDsa={setDsa}
                                                engineerName={engineerName}
                                                setEngineerName={setEngineerName}
                                                engineerNames={engineerNames}
                                            />
                                        </div>
                                    )}

                                    {/* Documents Tab */}
                                    {activeTab === 'documents' && (
                                        <div>
                                            <DocumentsPanel
                                                formData={formData}
                                                canEdit={canEdit}
                                                locationImagePreviews={locationImagePreviews}
                                                imagePreviews={imagePreviews}
                                                documentPreviews={formData.documentPreviews || []}
                                                handleLocationImageUpload={handleLocationImageUpload}
                                                handleImageUpload={handleImageUpload}
                                                handleDocumentUpload={handleDocumentUpload}
                                                removeLocationImage={removeLocationImage}
                                                removeImage={removeImage}
                                                removeDocument={removeDocument}
                                                handleInputChange={handleInputChange}
                                                handleCoordinateChange={handleCoordinateChange}
                                                setFormData={setFormData}
                                                locationFileInputRef={locationFileInputRef}
                                                bankFileInputRef={bankFileInputRef}
                                                fileInputRef1={fileInputRef1}
                                                fileInputRef2={fileInputRef2}
                                                fileInputRef3={fileInputRef3}
                                                fileInputRef4={fileInputRef4}
                                                documentFileInputRef={documentFileInputRef}
                                                bankImagePreview={bankImagePreview}
                                                handleBankImageUpload={handleBankImageUpload}
                                                removeBankImage={removeBankImage}
                                                areaImagePreviews={formData.areaImages || {}}
                                                formType="rajeshhouse"
                                            />
                                        </div>
                                    )}



                                    {/* Excel Sheet Tab */}
                                    {activeTab === 'spreadsheet' && (
                                        <div className="space-y-4">
                                            <RealSpreadsheet
                                                initialData={spreadsheetData}
                                                onDataChange={setSpreadsheetData}
                                            />
                                        </div>
                                    )}

                                
                                </form>
                                {/* Submit Buttons - OUTSIDE FORM, ALWAYS VISIBLE */}
                                <div className="flex-shrink-0 flex flex-wrap gap-2 pt-4 px-0 border-t border-neutral-200 mt-auto bg-white">
                                    {/* Download PDF Button - Always visible */}
                                    <Button
                                        type="button"
                                        onClick={handleDownloadPDF}
                                        disabled={loading}
                                        className="min-w-fit px-4 h-10 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                    >
                                        <FaDownload size={14} />
                                        Download PDF
                                    </Button>

                                    {/* Save/Edit Buttons - Shown when user can edit */}
                                    {canEdit && (
                                        <>
                                            <Button
                                                type="button"
                                                onClick={onFinish}
                                                disabled={loading}
                                                className="min-w-fit px-6 h-10 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                            >
                                                <FaSave size={14} />
                                                {loading ? "Saving..." : "Save Changes"}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => navigate("/dashboard")}
                                                disabled={loading}
                                                className="min-w-fit px-4 h-10 text-xs font-bold rounded-lg border border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                            >
                                                <FaArrowLeft size={14} />
                                                Back
                                            </Button>
                                        </>
                                    )}

                                    {/* Manager Action Buttons - Approve/Reject/Review and Fix */}
                                    {canApprove && (
                                        <>
                                            <Button
                                                type="button"
                                                onClick={() => handleManagerAction("approve")}
                                                disabled={loading}
                                                className="min-w-fit px-6 h-10 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                            >
                                                <FaCheckCircle size={14} />
                                                {loading ? "Processing..." : "Approve"}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => handleManagerAction("reject")}
                                                disabled={loading}
                                                className="min-w-fit px-6 h-10 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                            >
                                                <FaTimesCircle size={14} />
                                                {loading ? "Processing..." : "Reject"}
                                            </Button>
                                        </>
                                    )}

                                    {/* Back Button for non-editable users */}
                                    {!canEdit && !canApprove && (
                                        <Button
                                            type="button"
                                            onClick={() => navigate("/dashboard")}
                                            disabled={loading}
                                            className="min-w-fit px-4 h-10 text-xs font-bold rounded-lg border border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                        >
                                            <FaArrowLeft size={14} />
                                            Back
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Approval/Rejection/Rework Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {modalAction === "approve" ? "Approve Form" : modalAction === "reject" ? "Reject Form" : "Request Rework"}
                        </DialogTitle>
                        <DialogDescription>
                            {modalAction === "approve" ? "Enter approval notes (optional)" : modalAction === "reject" ? "Please provide feedback for rejection" : "Provide instructions for the rework"}
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        placeholder={modalAction === "approve" ? "Enter approval notes (optional)" : modalAction === "reject" ? "Please provide feedback for rejection" : "Enter rework instructions"}
                        value={modalFeedback}
                        onChange={(e) => setModalFeedback(e.target.value)}
                        rows={4}
                        autoFocus
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={modalAction === "approve" ? "default" : modalAction === "rework" ? "default" : "destructive"}
                            onClick={handleModalOk}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : (modalAction === "approve" ? "Approve" : modalAction === "reject" ? "Reject" : "Request Rework")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear Custom Fields Confirmation Dialog */}
            <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Clear All Custom Fields</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove all custom fields? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setClearConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                setCustomFields([]);
                                setClearConfirmOpen(false);
                            }}
                        >
                            Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
export default RajeshHouseEditForm;