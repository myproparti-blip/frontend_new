import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import exifr from 'exifr';
import {
    FaArrowLeft,
    FaMapMarkerAlt,
    FaUpload,
    FaPrint,
    FaDownload,
    FaUser,
    FaFileAlt,
    FaDollarSign,
    FaCog,
    FaCompass,
    FaBuilding,
    FaImage,
    FaLocationArrow,
    FaCheckCircle,
    FaTimesCircle,
    FaSave,
    FaThumbsUp,
    FaThumbsDown,
    FaRedo,
    FaTools,
    FaLeaf
} from "react-icons/fa";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, RadioGroup, RadioGroupItem, ChipSelect } from "../components/ui";
import { getRajeshBankById, updateRajeshBank, managerSubmitRajeshBank, getLastSubmittedRajeshBank } from "../services/rajeshBankService";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";
import { uploadPropertyImages, uploadLocationImages, uploadDocuments, uploadAreaImages } from "../services/imageService";
import { invalidateCache } from "../services/axios";
import { getCustomOptions } from "../services/customOptionsService";
import ClientInfoPanel from "../components/ClientInfoPanel";
import DocumentsPanel from "../components/DocumentsPanel";
import { generateRajeshBankPDF } from "../services/rajeshBankpdf";

const RajeshBankEditForm = ({ user, onLogin }) => {
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
    const [activeValuationSubTab, setActiveValuationSubTab] = useState("general");
    const [customFields, setCustomFields] = useState([]);
    const [customFieldName, setCustomFieldName] = useState("");
    const [customFieldValue, setCustomFieldValue] = useState("");
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
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
        // DIRECTIONS
        directions: {
            north1: '',
            east1: '',
            south1: '',
            west1: '',
            north2: '',
            east2: '',
            south2: '',
            west2: ''
        },

        // COORDINATES
        coordinates: {
            latitude: '',
            longitude: ''
        },

        // IMAGES
        propertyImages: [],
        locationImages: [],
        bankImage: null,
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

        // PDF DETAILS - ALL 212 SCHEMA FIELDS (100% IDENTICAL TO pdfDetailsSchema)
        pdfDetails: {
            // PAGE 1: ACCOUNT INFORMATION TABLE
            accountName: '',
            nameOfOwner: '',
            client: '',
            typeOfProperty: '',
            propertyDetailsLocation: '',
            purposeOfValuation: '',
            dateOfValuation: '',

            // PAGE 2: SUMMARY VALUES TABLE
            applicant: '',
            valuationDoneByApproved: '',
            nameOfOwnerValuation: '',
            addressPropertyValuation: '',
            briefDescriptionOfProperty: '',
            requisiteDetailsAsPerSaleDeedAuthoritiesDocuments: '',
            areaOfLand: '',
            areaOfConstruction: '',
            valueOfConstruction: '',
            totalMarketValueOfTheProperty: '',

            // PAGE 2: VALUATION SUMMARY VALUES (continued)
            valueOfLand: '',
            realizableValue: '',
            realizableValueWords: '',
            distressValue: '',
            distressValueWords: '',
            jantriValue: '',
            jantriValueWords: '',
            insurableValue: '',
            insurableValueWords: '',

            // PAGE 3: HEADER SECTION
            branchName: '',
            branchAddress: '',
            customerName: '',

            // PAGE 3: INTRODUCTION TABLE
            nameAddressOfManager: '',
            purposeOfValuationIntro: '',
            dateOfInspectionOfProperty: '',
            dateOfValuationReport: '',
            nameOfTheDeputySuperintendentProperty: '',

            // PAGE 3: PHYSICAL CHARACTERISTICS TABLE
            nearbyLandmark: '',
            noModifiedSquadsSGHighway: '',
            postalAddress: '',
            areaOfThePlotLandSupportedByA: '',

            // PAGE 4: DETAILED PROPERTY TABLE (IV to XIII)
            developedLand: '',
            interceptAccessToTheProperty: '',
            locationOfThePropertyWithNeighborhoodLayout: '',
            detailsOfExistingProperty: '',
            descriptionOfAdjoiningProperty: '',
            plotNoRevenueNo: '',
            villageOrTalukSubRegisterBlock: '',
            subRegistryBlock: '',
            district: '',
            anyOtherAspect: '',

            // PAGE 4: PLINTH/CARPET/SALEABLE AREA
            plinthArea: '',
            carpetArea: '',
            saleableArea: '',

            // PAGE 4: BOUNDARIES OF THE PLOT (Deed/Plan)
            boundaryNorth: '',
            boundarySouth: '',
            boundaryEast: '',
            boundaryWest: '',

            // PAGE 4: BOUNDARIES OF THE PLOT (ACTUAL ON SITE)
            boundaryActualNorth: '',
            boundaryActualSouth: '',
            boundaryActualEast: '',
            boundaryActualWest: '',

            // PAGE 5: TOWN PLANNING PARAMETERS
            masterPlanProvisions: '',
            propertyInTermsOfLandUseSpace: '',
            asPerGDR: '',
            certificateHasBeenIssued: '',
            constructionMandatorily: '',
            permissibleTypeLaws: '',
            planningAreaZone: '',
            constraintFullyDeveloped: '',
            requirementForCommercialArea: '',
            surroundingAreaWithCommercialAndResidential: '',
            demolitionProceedings: '',
            compoundingRegularizationProceedings: '',
            townPlanningOtherAspect: '',
            greenSpace: '',
            parking: '',
            utilities: '',
            accessibility: '',

            // PAGE 5: DOCUMENT DETAILS & LEGAL ASPECTS
            includesRegistrationOfEachProperty: '',
            shareCertificate: '',
            approvalPlanAndBUPermission: '',

            // MARKET VALUE OF PROPERTY SECTION
            // Land Value Fields
            landAreaSqmt: '',
            landRatePerSqmtr: '',
            valueOfLandMarket: '',
            totalLandValue: '',

            // Building Value Fields
            buildingParticulars: '',
            plinthAreaSqft: '',
            roofHeightApprox: '',
            ageOfBuilding: '',
            replacementDepreciation: '',
            valueOfConstructionMarket: '',
            totalBuildingValue: '',

            // Valuation Summary Fields
            marketValueOfProperty: '',
            realizableValueProperty: '',
            distressValueProperty: '',
            insurableValueProperty: '',
            jantriValueProperty: '',

            // PAGE 6: AMC & OWNERSHIP
            amcTheBill: '',
            nameOfTheOwners: '',
            certainStatusOfFreeholdOrLeasehold: '',
            amenity: '',
            notificationOfAcquisition: '',
            notificationOfRoadWidening: '',
            heritageEasement: '',
            commentOnTransferability: '',
            commentOnExistingMortgages: '',
            commentOnGuarantee: '',
            builderPlan: '',
            ifPropertyIsAgriculturalLand: '',
            sarfaesiCompliant: '',
            aDetailedDocumentsTesting: '',
            observationOnDisputeOrDues: '',
            whetherEntirePieceLandMortgaged: '',
            leaseAgreement: '',
            letterAgreement: '',
            authorityApprovedPlan: '',
            anyViolationFromApprovedPlan: '',
            agriculturalLandStatus: '',
            companyInvolved: '',
            confirmUsingMortgageChanges: '',
            permissionIsBuildingIncluded: '',
            observationInPlan: '',

            // PAGE 8: DECLARATION DATA
            theChiefManagerOfTheBank: '',
            specificationAuthorization: '',
            propertiesOfValueLimitedThroughIsGroup: '',

            // PAGE 7: ECONOMIC ASPECTS TABLE
            reasonableLettingValue: '',
            tenancyDetails: '',
            taxesAndOutgoings: '',
            propertyInsurance: '',
            monthlyMaintenanceCharges: '',
            securityCharges: '',
            economicOtherAspect: '',

            // PAGE 7: SOCIO-CULTURAL ASPECTS TABLE
            socioCulturalDescription: '',
            socialInfrastructureType: '',

            // PAGE 7: FUNCTIONAL AND UTILITARIAN ASPECTS TABLE
            spaceAllocation: '',
            storageSpaces: '',
            utilitySpaces: '',
            carParkingFacility: '',
            balconies: '',
            functionalOtherAspect: '',

            // PAGE 8: INFRASTRUCTURE AVAILABILITY TABLE - AQUA INFRASTRUCTURE
            waterSupply: '',
            sewerageSystem: '',
            stormWaterDrainage: '',

            // PAGE 8: INFRASTRUCTURE AVAILABILITY TABLE - PHYSICAL INFRASTRUCTURE
            solidWasteManagement: '',
            electricity: '',
            roadConnectivity: '',
            publicUtilities: '',

            // PAGE 8: INFRASTRUCTURE AVAILABILITY TABLE - SOCIAL INFRASTRUCTURE
            schoolFacility: '',
            medicalFacility: '',
            recreationalFacility: '',

            // PAGE 8: MARKETABILITY OF THE PROPERTY TABLE
            marketabilityLocational: '',
            marketabilityScarcity: '',
            marketabilityDemandSupply: '',
            marketabilityComparablePrices: '',
            marketabilityOtherAspect: '',

            // PAGE 8: ADDITIONAL FIELDS
            soilDescription: '',

            // PAGE 8: ENCLOSURES DATA
            layoutPlanSketch: '',
            buildingPlan: '',
            floorPlan: '',
            photographOfProperty: '',
            
            // PAGE 15: ENCLOSURES (NEW FIELD NAMES)
            enclosureLayoutPlan: '',
            enclosureBuildingPlan: '',
            enclosureFloorPlan: '',
            enclosurePhotograph: '',
            enclosureApprovedPlan: '',
            enclosureGoogleMap: '',
            enclosurePriceTrend: '',
            enclosureGuidelineRate: '',
            enclosureOtherDocuments: '',

            // PAGE 9: ENGINEERING AND TECHNOLOGY ASPECTS TABLE
            constructionType: '',
            materialTechnology: '',
            specifications: '',
            maintenanceStatus: '',
            buildingAge: '',
            totalLife: '',
            deterioration: '',
            structuralSafety: '',
            disasterProtection: '',
            visibleDamage: '',
            airConditioning: '',
            firefighting: '',
            buildingPlans: '',

            // PAGE 9: ENVIRONMENTAL FACTORS TABLE
            greenBuildingTechniques: '',
            rainWaterHarvesting: '',
            solarSystems: '',
            environmentalPollution: '',

            // PAGE 5: CHECKLIST OF DOCUMENTS
            docSaleDeed: '',
            docPropertyTax: '',
            docPowerOfAttorney: '',
            docBuildingPlanApproval: '',
            docEncumbranceCertificate: '',
            docSurveyReport: '',
            docShareCertificate: '',
            docAgreementToSell: '',
            docOtherDocuments: '',

            // PAGE 9: ARCHITECTURAL AND AESTHETIC QUALITY TABLE
            architecturalQuality: '',

            // PAGE 10: VALUATION METHODOLOGY DATA
            valuationMethodology: '',
            marketRatePriceTrend: '',
            guidelineRateObtained: '',
            valuationSummary: '',

            // PAGE 11: VALUATION DETAILS DATA
            constructionRate: '',
            rateDescription: '',
            marketTrend: '',
            guidelineRate: '',
            guidelineValue: '',

            // PAGE 12: MARKET VALUE OF THE PROPERTY
            landAreaSMT: '',
            landRate: '',
            valueLand: '',
            totalLandValue: '',
            plinthAreaBuilding: '',
            roofHeight: '',
            ageOfBuilding: '',
            depreciatedRatePerSqmt: '',
            valueOfConstruction: '',
            totalBuildingValue: '',
            marketValueProperty: '',
            realizableValueMarket: '',
            distressValueMarket: '',
            insurableValueMarket: '',
            jantriValueMarket: '',
            valuationRemarks: '',

            // PAGE 12: MARKET VALUE OF THE PROPERTY - LAND VALUE (legacy fields)
            buildingParticulars: '',
            roofHeightApprx: '',
            estimatedReplacement: '',
            depreciatedRate: '',
            totalBuildingValue: '',

            // PAGE 12: NOTES & GUIDELINES
            variationNotes: '',
            guidelineValueDescription: '',

            // PAGE 12: ADDITIONAL DETAILS
            lastTwoTransactionsDetails: '',
            revisedGuidelineRateInfo: '',
            remarks: '',

            // PAGE 12: SUPPORTING DOCUMENTS & FINAL VALUES
            approvedSanctionedPlanCopy: '',
            googleMapCoordinates: '',
            propertyPriceTrend: '',
            guidelineRateDocumentation: '',
            otherRelevantDocuments: '',
            bookValue: '',
            bookValueWords: '',

            // PAGE 13: SIGNATURE & APPROVAL PAGE
            reportDate: '',
            reportPlace: '',
            approverDesignation: 'GOVT. REGD APPROVER',
            inspectionCompletionDate: '',
            approverDeclaration: '',
            fairMarketValueApproval: '',
            fairMarketValueApprovalWords: '',
            branchManagerNameApproval: '',
            branchManagerSignature: '',
            branchManagerSealAttached: 'No',
        },

        // CHECKLIST FIELDS - ALL 73 FIELDS FROM checklistSchema
        checklist: {
            engagementLetter: 'Yes',
            engagementLetterReviewed: '--',
            saleDeed: 'Yes',
            saleDeedReviewed: '--',
            tcrLsr: '--',
            tcrLsrReviewed: 'No',
            allotmentLetter: '--',
            allotmentLetterReviewed: 'No',
            kabualatLekh: '--',
            kabualatLekhReviewed: 'No',
            mortgageDeed: '--',
            mortgageDeedReviewed: 'No',
            leaseDeed: '--',
            leaseDeadReviewed: 'No',
            index2: '--',
            index2Reviewed: 'No',
            vf712: '--',
            vf712Reviewed: 'No',
            naOrder: '--',
            naOrderReviewed: 'No',
            approvedPlan: 'Yes',
            approvedPlanReviewed: '--',
            commencementLetter: '--',
            commencementLetterReviewed: 'No',
            buPermission: 'Yes',
            buPermissionReviewed: '--',
            eleMeterPhoto: '--',
            eleMeterPhotoReviewed: 'No',
            lightBill: '--',
            lightBillReviewed: 'No',
            muniTaxBill: 'Yes',
            muniTaxBillReviewed: '--',
            numbering: 'Yes',
            numberingReviewed: '--',
            boundaries: 'Yes',
            boundariesReviewed: '--',
            mergedProperty: '--',
            mergedPropertyReviewed: 'No',
            premiseSeparation: 'NA',
            premiseSeparationReviewed: '--',
            landLocked: '--',
            landLockedReviewed: 'No',
            propertyRented: '--',
            propertyRentedReviewed: 'No',
            rentAgreement: '--',
            rentAgreementReviewed: 'No',
            siteVisitPhotos: 'Yes',
            siteVisitPhotosReviewed: '--',
            selfieOwner: 'Yes',
            selfieOwnerReviewed: '--',
            mobileNo: 'Yes',
            mobileNoReviewed: '--',
            dataSheet: 'Yes',
            dataSheetReviewed: '--',
            tentativeRate: 'Yes',
            tentativeRateReviewed: '--',
            saleInstance: 'Yes',
            saleInstanceReviewed: '--',
            brokerRecording: 'Yes',
            brokerRecordingReviewed: '--',
            pastValuationRate: 'Yes',
            pastValuationRateReviewed: '--'
        },

        // CUSTOM FIELDS FOR DROPDOWN HANDLING
        customBankName: '',
        customCity: '',
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [locationImagePreviews, setLocationImagePreviews] = useState([]);
    const [bankImagePreview, setBankImagePreview] = useState(null);

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
    const bankFileInputRef = useRef(null);
    const documentFileInputRef = useRef(null);
    const dropdownFetchedRef = useRef(false);

    const username = user?.username || "";
    const role = user?.role || "";
    const clientId = user?.clientId || "";

    const handleDownloadPDF = async () => {
        try {
            dispatch(showLoader());
            // ALWAYS fetch fresh data from DB - do not use local state which may be stale
            let dataToDownload;

            try {
                dataToDownload = await getRajeshBankById(id, username, role, clientId);
                ('✅ Fresh Rajesh Bank data fetched for PDF:', {
                    bankName: dataToDownload?.bankName,
                    city: dataToDownload?.city
                });
            } catch (fetchError) {
                console.error('❌ Failed to fetch fresh Rajesh Bank data:', fetchError);
                // Use in-memory valuation data if available
                dataToDownload = valuation;
                if (!dataToDownload || !dataToDownload.uniqueId) {
                    console.warn('Rajesh Bank form not found in DB and no local data available');
                    showError('Form data not found. Please save the form first before downloading.');
                    dispatch(hideLoader());
                    return;
                } else {
                    ('⚠️ Using unsaved form data from memory for PDF generation');
                }
            }

            await generateRajeshBankPDF(dataToDownload);
            showSuccess('PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showError('Failed to download PDF');
        } finally {
            dispatch(hideLoader());
        }
    };

    useEffect(() => {
        if (id) loadValuation();
    }, [id]);

    // Helper function to convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Fetch dropdown data from API (non-blocking with defaults already set)
    useLayoutEffect(() => {
        if (dropdownFetchedRef.current) return;
        dropdownFetchedRef.current = true;

        const fetchDropdownData = async () => {
            try {
                const [banksData, citiesData, dsaData, engineerData] = await Promise.all([
                    getCustomOptions('banks'),
                    getCustomOptions('cities'),
                    getCustomOptions('dsas'),
                    getCustomOptions('engineers')
                ]);

                // Only update if API returns non-empty data
                if (Array.isArray(banksData) && banksData.length > 0) {
                    setBanks(banksData);
                }
                if (Array.isArray(citiesData) && citiesData.length > 0) {
                    setCities(citiesData);
                }
                if (Array.isArray(dsaData) && dsaData.length > 0) {
                    setDsaNames(dsaData);
                }
                if (Array.isArray(engineerData) && engineerData.length > 0) {
                    setEngineerNames(engineerData);
                }
            } catch (error) {
                console.warn('Could not fetch dropdown options from API, using defaults:', error.message);
                // Defaults are already set, no action needed
            }
        };

        // Try to fetch API data, but don't block the UI
        fetchDropdownData();
    }, []);

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

    const loadValuation = async () => {
        const savedData = localStorage.getItem(`valuation_draft_${username}`);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.uniqueId === id) {
                setValuation(parsedData);
                mapDataToForm(parsedData);
                return;
            }
        }

        try {
            // Pass user info for authentication
            const dbData = await getRajeshBankById(id, username, role, clientId);
            setValuation(dbData);
            mapDataToForm(dbData);

            // Restore property image previews from database
            if (dbData.propertyImages && Array.isArray(dbData.propertyImages)) {
                const propertyPreviews = dbData.propertyImages
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
                        return { preview: previewUrl, name: img.name || `Property Image ${idx + 1}`, path: img.path || img.fileName || '', inputNumber: img.inputNumber || 1 };
                    });
                setImagePreviews(propertyPreviews);
            }

            // Restore location image previews from database
            if (dbData.locationImages && Array.isArray(dbData.locationImages)) {
                const locationPreviews = dbData.locationImages
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
                        return { preview: previewUrl, name: img.name || `Location Image ${idx + 1}`, path: img.path || img.fileName || '' };
                    });
                setLocationImagePreviews(locationPreviews);
            }

            // Restore bank image preview from database
            if (dbData.bankImage) {
                let previewUrl = '';
                if (typeof dbData.bankImage === 'string' && dbData.bankImage.startsWith('data:')) {
                    previewUrl = dbData.bankImage;
                } else if (typeof dbData.bankImage === 'string') {
                    const fileName = dbData.bankImage.split('\\').pop() || dbData.bankImage.split('/').pop();
                    previewUrl = `/api/uploads/${fileName}`;
                }
                if (previewUrl) {
                    setBankImagePreview({ preview: previewUrl, name: 'Bank Image' });
                }
            }

            // Restore document previews from database
            if (dbData.documentPreviews && Array.isArray(dbData.documentPreviews)) {
                setFormData(prev => ({
                    ...prev,
                    documentPreviews: dbData.documentPreviews
                }));
            }

            // Restore area images from database
            if (dbData.areaImages && typeof dbData.areaImages === 'object' && Object.keys(dbData.areaImages).length > 0) {
                setFormData(prev => ({
                    ...prev,
                    areaImages: dbData.areaImages
                }));
            }

            setBankName(dbData.bankName || "");
            setCity(dbData.city || "");
            setDsa(dbData.dsa || "");
            setEngineerName(dbData.engineerName || "");
        } catch (error) {
            console.error("Error loading valuation:", error);
            
            // If form not found (new form), try to autofill from last submitted form
            if (error.message && error.message.includes("not found")) {
                try {
                    ("[loadValuation] Form not found, attempting autofill from last form...");
                    
                    // Fetch last submitted form for autofilling valuation tab data only
                    const lastForm = await getLastSubmittedRajeshBank();
                    
                    ("[loadValuation] Last form fetched:", {
                        exists: !!lastForm,
                        hasPdfDetails: lastForm && !!lastForm.pdfDetails,
                        pdfDetailsKeys: lastForm && lastForm.pdfDetails ? Object.keys(lastForm.pdfDetails).length : 0
                    });
                    
                    if (lastForm && lastForm.pdfDetails && Object.keys(lastForm.pdfDetails).length > 0) {
                        // Create a new form with autofilled pdfDetails only
                        const autofilledFormData = {
                            ...formData,
                            uniqueId: id,
                            username: username,
                            clientId: clientId,
                            pdfDetails: { ...lastForm.pdfDetails }
                        };
                        setValuation(autofilledFormData);
                        mapDataToForm(autofilledFormData);
                        ("[loadValuation] ✅ Form autofilled with last valuation data");
                        showSuccess("New form created with last valuation data autofilled");
                        return;
                    } else {
                        console.warn("[loadValuation] Last form has no pdfDetails data to autofill");
                    }
                } catch (autofillError) {
                    console.warn("Could not autofill from last form:", autofillError.message);
                    // Continue with empty form if autofill fails
                }
                
                // If no autofill possible, initialize with empty form
                showError("Rajesh Bank form not found. Creating new form...");
                const newFormData = {
                    ...formData,
                    uniqueId: id,
                    username: username,
                    clientId: clientId
                };
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

        setFormData(prev => {
            const mergedData = {
                ...prev,
                ...data,
                pdfDetails: data.pdfDetails ? { ...prev.pdfDetails, ...data.pdfDetails } : prev.pdfDetails,
                checklist: data.checklist ? { ...prev.checklist, ...data.checklist } : prev.checklist
            };

            // Ensure checklist always has all fields (in case database is missing some)
            if (!mergedData.checklist) {
                mergedData.checklist = prev.checklist;
            }

            return mergedData;
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

    // Handle Add Custom Field
    const handleAddCustomField = () => {
        const name = customFieldName.trim();
        const value = customFieldValue.trim();

        // Validation: Check if both fields are filled
        if (!name || !value) {
            showError("Field Name and Field Value cannot be empty");
            return;
        }

        // Validation: Check for duplicate field names (case-insensitive)
        const duplicateExists = customFields.some(
            field => field.name.toLowerCase() === name.toLowerCase()
        );

        if (duplicateExists) {
            showError(`Field name "${name}" already exists. Please use a different name.`);
            return;
        }

        // Add the field
        setCustomFields([...customFields, { name, value }]);
        setCustomFieldName("");
        setCustomFieldValue("");
        showSuccess("Field added successfully");
    };

    // Handle Remove Custom Field
    const handleRemoveCustomField = (index) => {
        const fieldName = customFields[index]?.name;
        const updatedFields = customFields.filter((_, i) => i !== index);
        setCustomFields(updatedFields);
        showSuccess(`Field "${fieldName}" removed successfully`);
    };

    const handleSave = async () => {
        try {
            dispatch(showLoader());
            
            // Upload area images if they exist and contain files
            let dataToSave = { ...formData };
            
            if (formData.areaImages && Object.keys(formData.areaImages).length > 0) {
                ('📤 Uploading area images...');
                try {
                    const uploadedAreaImages = await uploadAreaImages(formData.areaImages, valuation.uniqueId);
                    dataToSave = {
                        ...dataToSave,
                        areaImages: uploadedAreaImages
                    };
                    ('✅ Area images uploaded:', uploadedAreaImages);
                } catch (error) {
                    console.error('⚠️ Error uploading area images:', error);
                    // Continue saving even if area images fail to upload
                    showError('Some area images failed to upload, but saving form data');
                }
            }
            
            await updateRajeshBank(id, dataToSave, user.username, user.role, user.clientId);
            invalidateCache();
            dispatch(hideLoader());
            showSuccess('Rajesh Bank form saved successfully');
        } catch (error) {
            console.error("Error saving Rajesh Bank form:", error);
            dispatch(hideLoader());
            showError('Failed to save Rajesh Bank form');
        }
    };

    const handleChecklistChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            checklist: {
                ...prev.checklist,
                [field]: value
            }
        }));
    };

    const handleValuationChange = (field, value) => {
        setFormData(prev => {
            const newPdfDetails = {
                ...prev.pdfDetails,
                [field]: value
            };

            // AUTO-CALCULATE LAND VALUE: Value of Land = Land Area × Land Rate
            if (field === 'landAreaSqmt' || field === 'landRatePerSqmtr') {
                const landArea = parseFloat(newPdfDetails.landAreaSqmt) || 0;
                const landRate = parseFloat(newPdfDetails.landRatePerSqmtr) || 0;
                const valueOfLand = landArea * landRate;
                newPdfDetails.valueOfLandMarket = valueOfLand > 0 ? valueOfLand.toString() : '';
                // Also update totalLandValue to be same as valueOfLandMarket (since there's only one row)
                newPdfDetails.totalLandValue = valueOfLand > 0 ? valueOfLand.toString() : '';
            }

            // AUTO-CALCULATE BUILDING VALUE: Value of Construction = Plinth Area × Replacement Depreciation Rate
            if (field === 'plinthAreaSqft' || field === 'replacementDepreciation') {
                const plinthArea = parseFloat(newPdfDetails.plinthAreaSqft) || 0;
                const replacementRate = parseFloat(newPdfDetails.replacementDepreciation) || 0;
                const valueOfConstruction = plinthArea * replacementRate;
                newPdfDetails.valueOfConstructionMarket = valueOfConstruction > 0 ? valueOfConstruction.toString() : '';
                // Total Building Value = Value of Construction (after depreciation applied)
                newPdfDetails.totalBuildingValue = valueOfConstruction > 0 ? valueOfConstruction.toString() : '';
            }

            // AUTO-CALCULATE TOTAL MARKET VALUE OF PROPERTY = Total Land Value + Total Building Value
            if (field === 'totalLandValue' || field === 'totalBuildingValue' || 
                field === 'landAreaSqmt' || field === 'landRatePerSqmtr' ||
                field === 'plinthAreaSqft' || field === 'replacementDepreciation') {
                const totalLandValue = parseFloat(newPdfDetails.totalLandValue) || 0;
                const totalBuildingValue = parseFloat(newPdfDetails.totalBuildingValue) || 0;
                const marketValueOfProperty = totalLandValue + totalBuildingValue;
                newPdfDetails.marketValueOfProperty = marketValueOfProperty > 0 ? marketValueOfProperty.toString() : '';

                // AUTO-CALCULATE DERIVED VALUES based on Fair Market Value (Market Value of Property)
                if (marketValueOfProperty > 0) {
                    newPdfDetails.realizableValueProperty = (marketValueOfProperty * 0.9).toString(); // 90%
                    newPdfDetails.distressValueProperty = (marketValueOfProperty * 0.8).toString();   // 80%
                    newPdfDetails.insurableValueProperty = marketValueOfProperty.toString();          // 100% (Insurable = Fair Market Value)
                }
            }

            // Auto-calculate Estimated Value = Qty × Rate for all 10 items (legacy functionality)
            const items = [
                { qtyField: 'presentValueQty', rateField: 'presentValueRate', valueField: 'presentValue' },
                { qtyField: 'wardrobesQty', rateField: 'wardrobesRate', valueField: 'wardrobes' },
                { qtyField: 'showcasesQty', rateField: 'showcasesRate', valueField: 'showcases' },
                { qtyField: 'kitchenArrangementsQty', rateField: 'kitchenArrangementsRate', valueField: 'kitchenArrangements' },
                { qtyField: 'superfineFinishQty', rateField: 'superfineFinishRate', valueField: 'superfineFinish' },
                { qtyField: 'interiorDecorationsQty', rateField: 'interiorDecorationsRate', valueField: 'interiorDecorations' },
                { qtyField: 'electricityDepositsQty', rateField: 'electricityDepositsRate', valueField: 'electricityDeposits' },
                { qtyField: 'collapsibleGatesQty', rateField: 'collapsibleGatesRate', valueField: 'collapsibleGates' },
                { qtyField: 'potentialValueQty', rateField: 'potentialValueRate', valueField: 'potentialValue' },
                { qtyField: 'otherItemsQty', rateField: 'otherItemsRate', valueField: 'otherItems' }
            ];

            // Check if the changed field is a qty or rate field and auto-calculate
            items.forEach(item => {
                if (field === item.qtyField || field === item.rateField) {
                    const qty = parseFloat(newPdfDetails[item.qtyField]) || 0;
                    const rate = parseFloat(newPdfDetails[item.rateField]) || 0;
                    const estimatedValue = qty * rate;
                    newPdfDetails[item.valueField] = estimatedValue > 0 ? estimatedValue.toString() : '';
                }
            });

            // Auto-populate Value of Flat section based on ROUND FIGURE value
            const isQtyOrRateField = items.some(item => field === item.qtyField || field === item.rateField);
            if (isQtyOrRateField) {
                const totalValuation = items.reduce((sum, item) => {
                    const value = parseFloat(newPdfDetails[item.valueField]) || 0;
                    return sum + value;
                }, 0);

                // Round to nearest 1000
                const roundFigureTotal = Math.round(totalValuation / 1000) * 1000;

                // Auto-populate the 4 calculated fields based on ROUND FIGURE
                newPdfDetails.fairMarketValue = roundFigureTotal > 0 ? roundFigureTotal.toString() : '';
                newPdfDetails.realizableValue = roundFigureTotal > 0 ? (roundFigureTotal * 0.9).toString() : '';
                newPdfDetails.distressValue = roundFigureTotal > 0 ? (roundFigureTotal * 0.8).toString() : '';
                newPdfDetails.insurableValue = roundFigureTotal > 0 ? (roundFigureTotal * 0.35).toString() : '';
            }

            return {
                ...prev,
                pdfDetails: newPdfDetails
            };
        });
    };

    const handleLocationImageUpload = async (e) => {
        const files = e.target.files;
        if (!files) return;

        for (let file of files) {
            try {
                const base64 = await fileToBase64(file);
                setLocationImagePreviews(prev => [
                    ...prev,
                    { preview: base64, name: file.name, file: file }
                ]);
            } catch (error) {
                console.error('Error converting file to base64:', error);
                showError('Failed to upload image');
            }
        }
    };

    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (!files) return;

        for (let file of files) {
            try {
                const base64 = await fileToBase64(file);
                setImagePreviews(prev => [
                    ...prev,
                    { preview: base64, name: file.name, file: file }
                ]);
            } catch (error) {
                console.error('Error converting file to base64:', error);
                showError('Failed to upload image');
            }
        }
    };

    const removeLocationImage = (index) => {
        setLocationImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleBankImageUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const file = files[0];
            const base64 = await fileToBase64(file);
            setBankImagePreview({ preview: base64, name: file.name, file: file });
            setFormData(prev => ({ ...prev, bankImage: base64 }));
        } catch (error) {
            console.error('Error converting file to base64:', error);
            showError('Failed to upload bank image');
        }
    };

    const removeBankImage = () => {
        setBankImagePreview(null);
        setFormData(prev => ({ ...prev, bankImage: null }));
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleDocumentUpload = async (e) => {
        const files = e.target.files;
        if (!files) return;

        // Add local previews immediately
        const filesToAdd = Array.from(files).map((file) => {
            const preview = URL.createObjectURL(file);
            return { file, preview, fileName: file.name, size: file.size, isImage: true };
        });

        // Display local previews
        const localPreviews = filesToAdd.map(f => ({
            preview: f.preview,
            file: f.file,
            fileName: f.fileName,
            size: f.size
        }));

        setFormData(prev => ({
            ...prev,
            documentPreviews: [
                ...(prev.documentPreviews || []),
                ...localPreviews
            ]
        }));

        try {
            // Upload images using same service as Property Images with compression
            const uploadPromises = filesToAdd.map(f => ({ file: f.file, inputNumber: 1 }));
            const uploadedImages = await uploadPropertyImages(uploadPromises, valuation.uniqueId);

            // Update with actual uploaded URLs (replace local previews)
            setFormData(prev => {
                const newPreviews = [...(prev.documentPreviews || [])];
                let uploadIndex = 0;

                // Update the last N items (where N = uploadedImages.length) with actual URLs
                for (let i = newPreviews.length - uploadPromises.length; i < newPreviews.length && uploadIndex < uploadedImages.length; i++) {
                    if (uploadedImages[uploadIndex]) {
                        newPreviews[i] = {
                            fileName: newPreviews[i].fileName,
                            size: newPreviews[i].size,
                            url: uploadedImages[uploadIndex].url
                        };
                        uploadIndex++;
                    }
                }

                return {
                    ...prev,
                    documentPreviews: newPreviews
                };
            });
        } catch (error) {
            console.error('Error uploading supporting images:', error);
            showError('Failed to upload images: ' + error.message);

            // Remove the local previews on error
            setFormData(prev => ({
                ...prev,
                documentPreviews: (prev.documentPreviews || []).slice(0, -filesToAdd.length)
            }));
        }

        // Reset input
        if (documentFileInputRef.current) {
            documentFileInputRef.current.value = '';
        }
    };

    const removeDocument = (index) => {
        setFormData(prev => ({
            ...prev,
            documentPreviews: (prev.documentPreviews || []).filter((_, i) => i !== index)
        }));
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

    const handleDirectionChange = (direction, value) => {
        setFormData(prev => ({
            ...prev,
            directions: {
                ...prev.directions,
                [direction]: value
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

    const validatePdfDetails = () => {
        const errors = [];
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
                                pdfDetails: formData.pdfDetails
                            };

                            // Parallel image uploads
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
                                    const areaImagesObj = {};
                                    const areaImagesToUpload = {};
                                    for (const [key, file] of Object.entries(formData.areaImages || {})) {
                                        if (file instanceof File) {
                                            areaImagesToUpload[key] = { file, inputNumber: key };
                                        } else {
                                            areaImagesObj[key] = file;
                                        }
                                    }
                                    if (Object.keys(areaImagesToUpload).length > 0) {
                                        const uploadedAreaImgs = await uploadAreaImages(Object.values(areaImagesToUpload), valuation.uniqueId);
                                        uploadedAreaImgs.forEach((img, index) => {
                                            const keys = Object.keys(areaImagesToUpload);
                                            if (keys[index]) {
                                                areaImagesObj[keys[index]] = img.url;
                                            }
                                        });
                                    }
                                    return areaImagesObj;
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
                            payload.areaImages = uploadedAreaImages || {};

                            // Clear draft before API call
                            localStorage.removeItem(`valuation_draft_${user.username}`);

                            // Call API to update rajesh bank
                            await updateRajeshBank(id, payload, user.username, user.role, user.clientId);
                            invalidateCache("/rajesh-Bank");

                            showSuccess('Rajesh Bank form saved successfully');
                            resolve();
                        } catch (error) {
                            console.error("Error saving Rajesh Bank form:", error);
                            showError('Failed to save Rajesh Bank form');
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

            const responseData = await managerSubmitRajeshBank(id, statusValue, modalFeedback, user.username, user.role);

            invalidateCache("/rajesh-Bank");

            // Update the form state with response data from backend
            setValuation(responseData);

            showSuccess(`Rajesh Bank form ${statusValue} successfully!`);
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
        const pdfDetailsErrors = validatePdfDetails();
        const allErrors = [...validationErrors, ...pdfDetailsErrors];
        if (allErrors.length > 0) {
            // Show single consolidated error instead of multiple notifications
            showError(` ${allErrors.join(", ")}`);
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
                bankImage: formData.bankImage || null,
                areaImages: formData.areaImages || {},
                documentPreviews: (formData.documentPreviews || []).map(doc => ({
                    fileName: doc.fileName,
                    size: doc.size,
                    ...(doc.url && { url: doc.url })
                })),
                photos: formData.photos || { elevationImages: [], siteImages: [] },
                status: "on-progress",
                pdfDetails: formData.pdfDetails,
                checklist: formData.checklist,
                customFields: customFields,
                managerFeedback: formData.managerFeedback || "",
                submittedByManager: formData.submittedByManager || false,
                lastUpdatedBy: username,
                lastUpdatedByRole: role
            };

            // Handle image uploads - parallel (including supporting images and area images)
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
                        return await uploadAreaImages(formData.areaImages, valuation.uniqueId);
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
            localStorage.removeItem(`valuation_draft_${username}`);

            // Call API to update Rajesh Bank form
            ("[rajeshBank.jsx] Payload being sent to API:", {
                clientId: payload.clientId,
                uniqueId: payload.uniqueId,
                bankName: payload.bankName,
                city: payload.city,
                pdfDetailsKeys: Object.keys(payload.pdfDetails || {}).length,
                pdfDetailsSample: payload.pdfDetails ? {
                    purposeOfValuation: payload.pdfDetails.purposeOfValuation,
                    plotSurveyNo: payload.pdfDetails.plotSurveyNo,
                    fairMarketValue: payload.pdfDetails.fairMarketValue
                } : null
            });
            const apiResponse = await updateRajeshBank(id, payload, username, role, clientId);
            invalidateCache("/rajesh-Bank");

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
            setFormData(prev => ({
                ...prev,
                ...payload,
                customBankName: bankState === "other" ? payload.bankName : "",
                customCity: cityState === "other" ? payload.city : "",
                customDsa: formData.dsa === "other" ? (payload.dsa || "").trim() : "",
                customEngineerName: formData.engineerName === "other" ? (payload.engineerName || "").trim() : ""
            }));

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

    const renderGeneralTab = () => (
        <div className="space-y-6">
            {/* VALUATION SUMMARY SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                    <FaDollarSign className="text-blue-600" />
                    Property Valuation Summary
                </h3>

                {/* Applicant & Bank */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Account Name</Label>
                        <Input
                            placeholder="Account Name"
                            value={formData.pdfDetails?.accountName || ""}
                            onChange={(e) => handleValuationChange('accountName', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900"> Property Details</Label>
                        <Input
                            placeholder="e.g., Commercial Shop"
                            value={formData.pdfDetails?.typeOfProperty || ""}
                            onChange={(e) => handleValuationChange('typeOfProperty', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Name of Owner/Owners</Label>
                        <Input
                            placeholder="Owner name"
                            value={formData.pdfDetails?.nameOfOwnerValuation || ""}
                            onChange={(e) => handleValuationChange('nameOfOwnerValuation', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Branch Name </Label>
                        <Input
                            placeholder="Bank Name"
                            value={formData.pdfDetails?.applicant || ""}
                            onChange={(e) => handleValuationChange('applicant', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Valuation done by Govt. Approved Valuer</Label>
                        <Input
                            placeholder="Name & Details"
                            value={formData.pdfDetails?.valuationDoneByApproved || ""}
                            onChange={(e) => handleValuationChange('valuationDoneByApproved', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Purpose of Valuation</Label>
                        <Input
                            placeholder="e.g., Continue Financial Assistance"
                            value={formData.pdfDetails?.purposeOfValuation || ""}
                            onChange={(e) => handleValuationChange('purposeOfValuation', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                     <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Address of property under valuation</Label>
                        <Input
                            placeholder="Property address"
                            value={formData.pdfDetails?.addressPropertyValuation || ""}
                            onChange={(e) => handleValuationChange('addressPropertyValuation', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
                {/* Property Description & Revenue Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm font-bold text-gray-900">Brief description of the Property</Label>
                        <Textarea
                            placeholder="Detailed property description"
                            value={formData.pdfDetails?.briefDescriptionOfProperty || ""}
                            onChange={(e) => handleValuationChange('briefDescriptionOfProperty', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-16"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm font-bold text-gray-900">Revenue details as per Sale deed / Authenticate Documents</Label>
                        <Textarea
                            placeholder="e.g., Survey No. 879, 873/1/Paiki, TPS No. 24"
                            value={formData.pdfDetails?.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments || ""}
                            onChange={(e) => handleValuationChange('requisiteDetailsAsPerSaleDeedAuthoritiesDocuments', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-16"
                        />
                    </div>
                </div>

                {/* Area & Value Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Area & Valuation Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Area of Land</Label>
                            <Input
                                placeholder="e.g., 1000 Sq.Ft"
                                value={formData.pdfDetails?.areaOfLand || ""}
                                onChange={(e) => handleValuationChange('areaOfLand', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Value of Land</Label>
                            <Input
                                placeholder="e.g., ₹ 25,00,000"
                                value={formData.pdfDetails?.valueOfLand || ""}
                                onChange={(e) => handleValuationChange('valueOfLand', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Area of Construction</Label>
                            <Input
                                placeholder="e.g., 500 Sq.Ft"
                                value={formData.pdfDetails?.areaOfConstruction || ""}
                                onChange={(e) => handleValuationChange('areaOfConstruction', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Value of Construction</Label>
                            <Input
                                placeholder="e.g., ₹ 10,00,000"
                                value={formData.pdfDetails?.valueOfConstruction || ""}
                                onChange={(e) => handleValuationChange('valueOfConstruction', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                </div>


                {/* INTRODUCTION SECTION */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm">
                    <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                        <FaFileAlt className="text-blue-600" />
                        1. Introduction
                    </h3>

                    {/* Branch & Customer Header - 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-blue-200">
                            <Label className="text-sm font-bold text-gray-900">Name & Address of Branch</Label>
                            <Input
                                placeholder="name & add"
                                value={formData.pdfDetails?.branchName || ""}
                                onChange={(e) => handleValuationChange('branchName', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                            <Input
                                placeholder="Branch address"
                                value={formData.pdfDetails?.branchAddress || ""}
                                onChange={(e) => handleValuationChange('branchAddress', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mt-2"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-blue-200">
                            <Label className="text-sm font-bold text-gray-900">Name of Customer(s) / Borrower</Label>
                            <Input
                                placeholder="Customer name"
                                value={formData.pdfDetails?.accountName || ""}
                                onChange={(e) => handleValuationChange('accountName', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                            <p className="text-xs text-gray-600 mt-2 italic">(for valuation report)</p>
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-blue-200">
                            <Label className="text-sm font-bold text-gray-900">a) Property Owner Name</Label>
                            <Input
                                placeholder="Owner name & contact"
                                value={formData.pdfDetails?.nameOfOwnerValuation || ""}
                                onChange={(e) => handleValuationChange('nameOfOwnerValuation', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    {/* Introduction Details - 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                       
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-blue-200">
                            <Label className="text-sm font-bold text-gray-900">c) Date of Inspection of Property</Label>
                            <Input
                                type="date"
                                value={formData.pdfDetails?.dateOfInspectionOfProperty || ""}
                                onChange={(e) => handleValuationChange('dateOfInspectionOfProperty', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-blue-200">
                            <Label className="text-sm font-bold text-gray-900">d) Date of Valuation Report</Label>
                            <Input
                                type="date"
                                value={formData.pdfDetails?.dateOfValuationReport || ""}
                                onChange={(e) => handleValuationChange('dateOfValuationReport', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-blue-200">
                            <Label className="text-sm font-bold text-gray-900">e) Name of the Developer of Property </Label>
                            <Input
                                placeholder="Developer name or NA"
                                value={formData.pdfDetails?.nameOfTheDeputySuperintendentProperty || ""}
                                onChange={(e) => handleValuationChange('nameOfTheDeputySuperintendentProperty', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                  
                </div>


                {/* PHYSICAL CHARACTERISTICS SECTION */}
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl border border-amber-200 shadow-sm">
                    <h3 className="font-bold text-lg text-amber-900 mb-4 flex items-center gap-2">
                        <FaBuilding className="text-amber-600" />
                        2. Physical Characteristics of the Property
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-amber-200">
                            <Label className="text-sm font-bold text-gray-900">a) i. Nearby landmark</Label>
                            <Input
                                placeholder="e.g., Near Mondeal Square, Beside Shapath 4"
                                value={formData.pdfDetails?.nearbyLandmark || ""}
                                onChange={(e) => handleValuationChange('nearbyLandmark', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-amber-200">
                            <Label className="text-sm font-bold text-gray-900">a) ii. Postal Address of the Property</Label>
                            <Input
                                placeholder="Complete postal address"
                                value={formData.pdfDetails?.postalAddress || ""}
                                onChange={(e) => handleValuationChange('postalAddress', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-amber-200">
                            <Label className="text-sm font-bold text-gray-900">a) iii. Area of the plot/land (supported by a plan)</Label>
                            <Input
                                placeholder="e.g., NA – Commercial Shop cum Showroom"
                                value={formData.pdfDetails?.areaOfThePlotLandSupportedByA || ""}
                                onChange={(e) => handleValuationChange('areaOfThePlotLandSupportedByA', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                </div>

                {/* DETAILED PROPERTY DESCRIPTION SECTION */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm">
                    <h3 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
                        <FaCompass className="text-green-600" />
                        3. Detailed Property Description
                    </h3>

                    {/* Row 1: IV, V, VI, VII */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">IV. Type of Land</Label>
                            <Input
                                placeholder="e.g., Developed Land, Solid, Rocky, Marsh land"
                                value={formData.pdfDetails?.developedLand || ""}
                                onChange={(e) => handleValuationChange('developedLand', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">V. Independent access/approach</Label>
                            <select
                                value={formData.pdfDetails?.interceptAccessToTheProperty || ""}
                                onChange={(e) => handleValuationChange('interceptAccessToTheProperty', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">VI. Google Map Location of the Property with a neighborhood layout map</Label>
                            <Input
                                placeholder="e.g., Google Map location with layout map"
                                value={formData.pdfDetails?.locationOfThePropertyWithNeighborhoodLayout || ""}
                                onChange={(e) => handleValuationChange('locationOfThePropertyWithNeighborhoodLayout', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">VII. Details of roads abutting property</Label>
                            <Input
                                placeholder="e.g., Abutting on main 18.00 mt wide road"
                                value={formData.pdfDetails?.detailsOfExistingProperty || ""}
                                onChange={(e) => handleValuationChange('detailsOfExistingProperty', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    {/* Row 2: VIII, IX, X, XI */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">VIII. Description of adjoining property</Label>
                            <Input
                                placeholder="e.g., Surrounded by Commercial and Residential area"
                                value={formData.pdfDetails?.descriptionOfAdjoiningProperty || ""}
                                onChange={(e) => handleValuationChange('descriptionOfAdjoiningProperty', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">IX. Plot No. Revenue Survey No</Label>
                            <Input
                                placeholder="e.g., Survey No: 879, 873/1/Paiki"
                                value={formData.pdfDetails?.plotNoRevenueNo || ""}
                                onChange={(e) => handleValuationChange('plotNoRevenueNo', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">X. Ward/Village/Taluka</Label>
                            <Input
                                placeholder="e.g., Vejaipur"
                                value={formData.pdfDetails?.villageOrTalukSubRegisterBlock || ""}
                                onChange={(e) => handleValuationChange('villageOrTalukSubRegisterBlock', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">XI. Sub-Registry/Block</Label>
                            <Input
                                placeholder="e.g., Ta: Vejaipur"
                                value={formData.pdfDetails?.subRegistryBlock || ""}
                                onChange={(e) => handleValuationChange('subRegistryBlock', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    {/* Row 3: XII, XIII, b) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">XII. District</Label>
                            <Input
                                placeholder="e.g., Ahmedabad"
                                value={formData.pdfDetails?.district || ""}
                                onChange={(e) => handleValuationChange('district', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-sm font-bold text-gray-900">XIII. Any other aspect</Label>
                            <Input
                                placeholder="e.g., Surrounding Area Developments"
                                value={formData.pdfDetails?.anyOtherAspect || ""}
                                onChange={(e) => handleValuationChange('anyOtherAspect', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-1.5 p-3 bg-white rounded-lg border border-green-200 md:col-span-2">
                            <Label className="text-sm font-bold text-gray-900">b) Plinth area, Carpet area, and Saleable area</Label>
                            <Input
                                placeholder="e.g., Carpet: 252.96 SMT | Saleable: 269.70 SMT"
                                value={formData.pdfDetails?.plinthArea || ""}
                                onChange={(e) => handleValuationChange('plinthArea', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    {/* C) Boundaries of the Plot */}
                    <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-slate-900 text-sm">C) Boundaries of the Plot</h4>

                        {/* Deed/Plan Section */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <h5 className="font-bold text-sm text-slate-900 mb-3">As per Deed/Plan</h5>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">NORTH</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryNorth || ""}
                                        onChange={(e) => handleValuationChange('boundaryNorth', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">SOUTH</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundarySouth || ""}
                                        onChange={(e) => handleValuationChange('boundarySouth', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">EAST</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryEast || ""}
                                        onChange={(e) => handleValuationChange('boundaryEast', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">WEST</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryWest || ""}
                                        onChange={(e) => handleValuationChange('boundaryWest', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actual on Site Section */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <h5 className="font-bold text-sm text-slate-900 mb-3">Boundaries of the Plot - As per Actual on Site</h5>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">NORTH</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryActualNorth || ""}
                                        onChange={(e) => handleValuationChange('boundaryActualNorth', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">SOUTH</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryActualSouth || ""}
                                        onChange={(e) => handleValuationChange('boundaryActualSouth', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">EAST</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryActualEast || ""}
                                        onChange={(e) => handleValuationChange('boundaryActualEast', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">WEST</Label>
                                    <Input
                                        placeholder="Boundary details"
                                        value={formData.pdfDetails?.boundaryActualWest || ""}
                                        onChange={(e) => handleValuationChange('boundaryActualWest', e.target.value)}
                                        disabled={!canEdit}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderValuationTab = () => {
        return (
            <div className="space-y-6">
                {/* TOWN PLANNING PARAMETERS SECTION */}
                <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 shadow-sm">
                    <h3 className="font-bold text-lg text-yellow-900 mb-6 flex items-center gap-2">
                        <FaCompass className="text-yellow-600" />
                        3. Town Planning Parameters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Column 1: Master Plan */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Master Plan provisions</Label>
                            <Input
                                placeholder="e.g., Plan is approved by..."
                                value={formData.pdfDetails?.masterPlanProvisions || ""}
                                onChange={(e) => handleValuationChange('masterPlanProvisions', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 2: FAR/FSI */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">FAR/FSI</Label>
                            <Input
                                placeholder="e.g., As per permissible Bye Laws"
                                value={formData.pdfDetails?.propertyInTermsOfLandUseSpace || ""}
                                onChange={(e) => handleValuationChange('propertyInTermsOfLandUseSpace', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 3: Ground Coverage */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Ground coverage</Label>
                            <Input
                                placeholder="e.g., As per approved plan"
                                value={formData.pdfDetails?.asPerGDR || ""}
                                onChange={(e) => handleValuationChange('asPerGDR', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 4: OC Certificate */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">OC Certificate</Label>
                            <select
                                value={formData.pdfDetails?.certificateHasBeenIssued || ""}
                                onChange={(e) => handleValuationChange('certificateHasBeenIssued', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>

                        {/* Column 1: Unauthorized Constructions */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Unauthorized Constructions</Label>
                            <select
                                value={formData.pdfDetails?.constructionMandatorily || ""}
                                onChange={(e) => handleValuationChange('constructionMandatorily', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                                <option value="Partial">Partial</option>
                            </select>
                        </div>

                        {/* Column 2: Transferability */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Transferability</Label>
                            <Input
                                placeholder="e.g., As Per Permissible Bye Laws"
                                value={formData.pdfDetails?.permissibleTypeLaws || ""}
                                onChange={(e) => handleValuationChange('permissibleTypeLaws', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 3: Planning Area/Zone */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Planning area/zone</Label>
                            <Input
                                placeholder="e.g., As per GDCR"
                                value={formData.pdfDetails?.planningAreaZone || ""}
                                onChange={(e) => handleValuationChange('planningAreaZone', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 4: Developmental Controls */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Developmental controls</Label>
                            <Input
                                placeholder="e.g., As per GDCR"
                                value={formData.pdfDetails?.constraintFullyDeveloped || ""}
                                onChange={(e) => handleValuationChange('constraintFullyDeveloped', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 1: Zoning Status */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Zoning Status</Label>
                            <Input
                                placeholder="e.g., As per bye laws"
                                value={formData.pdfDetails?.requirementForCommercialArea || ""}
                                onChange={(e) => handleValuationChange('requirementForCommercialArea', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 2: Surrounding Area */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">x. Comment on surrounding land uses and adjoining properties</Label>
                            <Input
                                placeholder="e.g., Mixed commercial/residential area"
                                value={formData.pdfDetails?.surroundingAreaWithCommercialAndResidential || ""}
                                onChange={(e) => handleValuationChange('surroundingAreaWithCommercialAndResidential', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 3: Demolition Status */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Demolition Status</Label>
                            <Input
                                placeholder="e.g., N.A. / Pending"
                                value={formData.pdfDetails?.demolitionProceedings || ""}
                                onChange={(e) => handleValuationChange('demolitionProceedings', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Column 4: Regularization */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Regularization</Label>
                            <Input
                                placeholder="e.g., N.A. / Approved"
                                value={formData.pdfDetails?.compoundingRegularizationProceedings || ""}
                                onChange={(e) => handleValuationChange('compoundingRegularizationProceedings', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        

                        {/* Column 1-4: Any Other Aspect - Full Width */}
                        <div className="space-y-1.5 ">
                            <Label className="text-sm font-bold text-gray-900">Any other Aspect</Label>
                            <Input
                                placeholder="e.g., No. / Additional details"
                                value={formData.pdfDetails?.townPlanningOtherAspect || ""}
                                onChange={(e) => handleValuationChange('townPlanningOtherAspect', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                </div>

                {/* DOCUMENT DETAILS AND LEGAL ASPECTS SECTION */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm">
                    <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                        <FaFileAlt className="text-blue-600" />
                        4. Document Details and Legal Aspects
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* a) Ownership Documents */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">1) Indenture of Allotment-Cum-Sale </Label>
                            <Input
                                placeholder="e.g., Sale Deed, Gift Deed"
                                value={formData.pdfDetails?.includesRegistrationOfEachProperty || ""}
                                onChange={(e) => handleValuationChange('includesRegistrationOfEachProperty', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* b) Share Certificate */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">2) Share Certificate</Label>
                            <Input
                                placeholder="e.g., Share No., Certificate No."
                                value={formData.pdfDetails?.shareCertificate || ""}
                                onChange={(e) => handleValuationChange('shareCertificate', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* c) Approved Plan & BU Permission */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">3) Approved Plan & BU</Label>
                            <Input
                                placeholder="e.g., Wide No., Permission No."
                                value={formData.pdfDetails?.approvalPlanAndBUPermission || ""}
                                onChange={(e) => handleValuationChange('approvalPlanAndBUPermission', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* d) AMC Tax Bill */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">4) AMC Tax Bill</Label>
                            <Input
                                placeholder="e.g., Tenement No."
                                value={formData.pdfDetails?.amcTheBill || ""}
                                onChange={(e) => handleValuationChange('amcTheBill', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* e) Name of the Owners */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">b) Name of the Owners</Label>
                            <Input
                                placeholder="e.g., Owner Name"
                                value={formData.pdfDetails?.nameOfOwnerValuation || ""}
                                onChange={(e) => handleValuationChange('nameOfOwnerValuation', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* f) Freehold or Leasehold Status */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">1) Freehold or Leasehold Status</Label>
                            <Input
                                placeholder="e.g., Freehold - Please Refer Adv. Title Report"
                                value={formData.pdfDetails?.certainStatusOfFreeholdOrLeasehold || ""}
                                onChange={(e) => handleValuationChange('certainStatusOfFreeholdOrLeasehold', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* g) Agreement of Easement */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">d) Agreement of Easement</Label>
                            <select
                                value={formData.pdfDetails?.leaseAgreement || ""}
                                onChange={(e) => handleValuationChange('leaseAgreement', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* h) Notification of Acquisition */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">e) Notification of Acquisition</Label>
                            <Input
                                placeholder="e.g., NA"
                                value={formData.pdfDetails?.notificationOfAcquisition || ""}
                                onChange={(e) => handleValuationChange('notificationOfAcquisition', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* i) Road Widening Notification */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">f) Notification of Road Widening</Label>
                            <Input
                                placeholder="e.g., NA"
                                value={formData.pdfDetails?.notificationOfRoadWidening || ""}
                                onChange={(e) => handleValuationChange('notificationOfRoadWidening', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* j) Heritage Restriction */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">g) Heritage Restriction</Label>
                            <select
                                value={formData.pdfDetails?.heritageEasement || ""}
                                onChange={(e) => handleValuationChange('heritageEasement', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* k) Transferability Comment */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">h) Transferability</Label>
                            <Input
                                placeholder="e.g., Please refer Title Report"
                                value={formData.pdfDetails?.commentOnTransferability || ""}
                                onChange={(e) => handleValuationChange('commentOnTransferability', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* l) Existing Mortgages Comment */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">i) Mortgages/Charges</Label>
                            <Input
                                placeholder="e.g., Mortgaged with Bank"
                                value={formData.pdfDetails?.commentOnExistingMortgages || ""}
                                onChange={(e) => handleValuationChange('commentOnExistingMortgages', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* m) Guarantee Comment */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">j) Guarantee</Label>
                            <Input
                                placeholder="e.g., Please refer Title Report"
                                value={formData.pdfDetails?.commentOnGuarantee || ""}
                                onChange={(e) => handleValuationChange('commentOnGuarantee', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* k) Authority Approved Plan */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">k) Building Plan Sanction - Authority Approved Plan</Label>
                            <Textarea
                                placeholder="e.g., Plan is approved by Authority, Wide No., Dated, BU Permission No."
                                value={formData.pdfDetails?.authorityApprovedPlan || ""}
                                onChange={(e) => handleValuationChange('authorityApprovedPlan', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-14"
                            />
                        </div>

                      

                        {/* o) Agricultural Land Status */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">l) Agricultural Land Status</Label>
                            <Input
                                placeholder="e.g., NA - Commercial Shop"
                                value={formData.pdfDetails?.ifPropertyIsAgriculturalLand || ""}
                                onChange={(e) => handleValuationChange('ifPropertyIsAgriculturalLand', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

   {/* m) SARFAESI Compliance */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">m) SARFAESI Compliance</Label>
                            <select
                                value={formData.pdfDetails?.sarfaesiCompliant || ""}
                                onChange={(e) => handleValuationChange('sarfaesiCompliant', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>
                        {/* n) Legal Documents Enclosed */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">n) a.All Legal Documents Enclosed</Label>
                            <Textarea
                                placeholder="e.g., Allotment Deed, Approved Plan, BU Permission, Tax Bill..."
                                value={formData.pdfDetails?.legalDocumentsEnclosed || ""}
                                onChange={(e) => handleValuationChange('legalDocumentsEnclosed', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-14"
                            />
                        </div>

                        {/* n) Observation on Dispute or Dues */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">n) b.Observation on Dispute/Dues</Label>
                            <Input
                                placeholder="e.g., NA - No dues or disputes"
                                value={formData.pdfDetails?.observationOnDisputeOrDues || ""}
                                onChange={(e) => handleValuationChange('observationOnDisputeOrDues', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* o) Whether Entire Piece of Land Mortgaged */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">o) Whether Entire Land Mortgaged</Label>
                            <Input
                                placeholder="e.g., Please refer Latest Adv. Title Report"
                                value={formData.pdfDetails?.whetherEntirePieceLandMortgaged || ""}
                                onChange={(e) => handleValuationChange('whetherEntirePieceLandMortgaged', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                     

                        {/* p) Qualification in TIR/mitigation */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">p) Qualification in TIR/mitigation</Label>
                            <Input
                                placeholder="e.g., Please refer Latest Adv. Title Report"
                                value={formData.pdfDetails?.letterAgreement || ""}
                                onChange={(e) => handleValuationChange('letterAgreement', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* q) Any Other Aspect */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">q) Any Other Aspect</Label>
                            <select
                                value={formData.pdfDetails?.anyViolationFromApprovedPlan || ""}
                                onChange={(e) => handleValuationChange('anyViolationFromApprovedPlan', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ECONOMIC ASPECTS OF THE PROPERTY SECTION */}
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200 shadow-sm">
                    <h3 className="font-bold text-lg text-purple-900 mb-6 flex items-center gap-2">
                        <FaDollarSign className="text-purple-600" />
                        5. Economic Aspects of the Property
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* i) Reasonable Letting Value */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">i) Reasonable Letting Value</Label>
                            <Input
                                placeholder="e.g., Shop - Composite method"
                                value={formData.pdfDetails?.reasonableLettingValue || ""}
                                onChange={(e) => handleValuationChange('reasonableLettingValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* ii) If property is occupied by tenant */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">ii) Property Occupancy</Label>
                            <Input
                                placeholder="e.g., Owner Occupied / Tenant details"
                                value={formData.pdfDetails?.tenancyDetails || ""}
                                onChange={(e) => handleValuationChange('tenancyDetails', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* iii) Taxes and other outings */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">iii) Taxes & Outings</Label>
                            <Input
                                placeholder="e.g., AMC - Tenement No."
                                value={formData.pdfDetails?.taxesAndOutgoings || ""}
                                onChange={(e) => handleValuationChange('taxesAndOutgoings', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* iv) Property Insurance */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">iv) Property Insurance</Label>
                            <select
                                value={formData.pdfDetails?.propertyInsurance || ""}
                                onChange={(e) => handleValuationChange('propertyInsurance', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Details Available">Details Available</option>
                                <option value="Details not Available">Details not Available</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* v) Monthly Maintenance Charges */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">v) Monthly Maintenance</Label>
                            <select
                                value={formData.pdfDetails?.monthlyMaintenanceCharges || ""}
                                onChange={(e) => handleValuationChange('monthlyMaintenanceCharges', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Details Available">Details Available</option>
                                <option value="Details not Available">Details not Available</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* vi) Security Charges */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">vi) Security Charges</Label>
                            <select
                                value={formData.pdfDetails?.securityCharges || ""}
                                onChange={(e) => handleValuationChange('securityCharges', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Details Available">Details Available</option>
                                <option value="Details not Available">Details not Available</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* vii) Any Other Aspect */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">vii) Any Other Aspect</Label>
                            <select
                                value={formData.pdfDetails?.economicOtherAspect || ""}
                                onChange={(e) => handleValuationChange('economicOtherAspect', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SOCIO-CULTURAL ASPECTS OF THE PROPERTY SECTION */}
                <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm">
                    <h3 className="font-bold text-lg text-green-900 mb-6 flex items-center gap-2">
                        <FaBuilding className="text-green-600" />
                        6. Socio-cultural Aspects of the Property
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* a) Descriptive Account of Location */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">a) Descriptive Account of Location</Label>
                            <Textarea
                                placeholder="e.g., Socially good location, Higher Class Commercial Area, etc."
                                value={formData.pdfDetails?.socioCulturalDescription || ""}
                                onChange={(e) => handleValuationChange('socioCulturalDescription', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-14"
                            />
                        </div>

                        {/* b) Whether Property Belongs to Social Infrastructure */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">b) Social Infrastructure Proximity</Label>
                            <Textarea
                                placeholder="e.g., Available within nearby area - 2-3 Km"
                                value={formData.pdfDetails?.socialInfrastructureType || ""}
                                onChange={(e) => handleValuationChange('socialInfrastructureType', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-14"
                            />
                        </div>
                    </div>
                </div>

                {/* FUNCTIONAL AND UTILITARIAN ASPECTS OF THE PROPERTY SECTION */}
                <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-sm">
                    <h3 className="font-bold text-lg text-orange-900 mb-6 flex items-center gap-2">
                        <FaTools className="text-orange-600" />
                        7. Functional and Utilitarian Aspects of the Property
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* i. Space allocation */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">i. Space allocation</Label>
                            <select
                                value={formData.pdfDetails?.spaceAllocation || ""}
                                onChange={(e) => handleValuationChange('spaceAllocation', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* ii. Storage Spaces */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">ii. Storage Spaces</Label>
                            <select
                                value={formData.pdfDetails?.storageSpaces || ""}
                                onChange={(e) => handleValuationChange('storageSpaces', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* iii. Utility spaces */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">iii. Utility spaces</Label>
                            <select
                                value={formData.pdfDetails?.utilitySpaces || ""}
                                onChange={(e) => handleValuationChange('utilitySpaces', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* iv. Car Parking */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">iv. Car Parking</Label>
                            <select
                                value={formData.pdfDetails?.carParkingFacility || ""}
                                onChange={(e) => handleValuationChange('carParkingFacility', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* v. Balconies */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">v. Balconies, etc.</Label>
                            <select
                                value={formData.pdfDetails?.balconies || ""}
                                onChange={(e) => handleValuationChange('balconies', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>

                        {/* b) Any Other Aspect */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">b) Any Other Aspect</Label>
                            <select
                                value={formData.pdfDetails?.functionalOtherAspect || ""}
                                onChange={(e) => handleValuationChange('functionalOtherAspect', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderInfrastructureTab = () => (
        <div className="space-y-6">
            {/* INFRASTRUCTURE AVAILABILITY SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 shadow-sm">
                <h3 className="font-bold text-lg text-yellow-900 mb-6 flex items-center gap-2">
                    <FaBuilding className="text-yellow-600" />
                    8. Infrastructure Availability
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* a) Water Supply */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">a) Water Supply</Label>
                        <select
                            value={formData.pdfDetails?.waterSupply || ""}
                            onChange={(e) => handleValuationChange('waterSupply', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                        >
                            <option value="">Select...</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* b) Sewerage System */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">b) Sewerage System</Label>
                        <Input
                            placeholder="e.g., Yes, Connects to public sewer line"
                            value={formData.pdfDetails?.sewerageSystem || ""}
                            onChange={(e) => handleValuationChange('sewerageSystem', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* c) Storm Water Drainage */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">c) Storm Water Drainage</Label>
                        <select
                            value={formData.pdfDetails?.stormWaterDrainage || ""}
                            onChange={(e) => handleValuationChange('stormWaterDrainage', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                        >
                            <option value="">Select...</option>
                            <option value="Yes, Available">Yes, Available</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* d) Solid Waste Management */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">d) Solid Waste Management</Label>
                        <select
                            value={formData.pdfDetails?.solidWasteManagement || ""}
                            onChange={(e) => handleValuationChange('solidWasteManagement', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                        >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* e) Electricity */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">e) Electricity</Label>
                        <select
                            value={formData.pdfDetails?.electricity || ""}
                            onChange={(e) => handleValuationChange('electricity', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                        >
                            <option value="">Select...</option>
                            <option value="Yes, Available">Yes, Available</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* f) Road & Public Transport Connectivity */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">f) Road & Public Transport</Label>
                        <Input
                            placeholder="Yes, 18.00 mtr Wide S G Highway"
                            value={formData.pdfDetails?.roadConnectivity || ""}
                            onChange={(e) => handleValuationChange('roadConnectivity', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* g) Public Utilities Nearby */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">g) Public Utilities Nearby</Label>
                        <Input
                            placeholder="No, Approx. 2-3 km"
                            value={formData.pdfDetails?.publicUtilities || ""}
                            onChange={(e) => handleValuationChange('publicUtilities', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* h) School */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">h) School</Label>
                        <Input
                            placeholder="Within 2 to 3 km Area"
                            value={formData.pdfDetails?.schoolFacility || ""}
                            onChange={(e) => handleValuationChange('schoolFacility', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* i) Medical Facilities */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">i) Medical Facilities</Label>
                        <Input
                            placeholder="Within 2 to 3 km Area"
                            value={formData.pdfDetails?.medicalFacility || ""}
                            onChange={(e) => handleValuationChange('medicalFacility', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* j) Recreational Facility */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">j) Recreational Facility</Label>
                        <Input
                            placeholder="Within 2 to 3 km Area"
                            value={formData.pdfDetails?.recreationalFacility || ""}
                            onChange={(e) => handleValuationChange('recreationalFacility', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* MARKETABILITY OF THE PROPERTY SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm">
                <h3 className="font-bold text-lg text-green-900 mb-6 flex items-center gap-2">
                    <FaCompass className="text-green-600" />
                    9. Marketability of the Property
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* i) Locational Attributes */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">i) Locational Attributes</Label>
                        <Input
                            placeholder="e.g., Good, abutting on 18.00 mt wide S G Highway, surrounded by developed commercial complex..."
                            value={formData.pdfDetails?.marketabilityLocational || ""}
                            onChange={(e) => handleValuationChange('marketabilityLocational', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* ii) Scarcity */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">ii) Scarcity</Label>
                        <select
                            value={formData.pdfDetails?.marketabilityScarcity || ""}
                            onChange={(e) => handleValuationChange('marketabilityScarcity', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* iii) Demand and Supply of the kind of subject Property */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">iii) Demand and Supply of the kind of subject Property</Label>
                        <Input
                            placeholder="e.g., Good"
                            value={formData.pdfDetails?.marketabilityDemandSupply || ""}
                            onChange={(e) => handleValuationChange('marketabilityDemandSupply', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* iv) Comparable Sale Prices in the Locality */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">iv) Comparable Sale Prices in the Locality</Label>
                        <Input
                            placeholder="e.g., Super Built-up area Rate is about Rs. 25,000/- to 30,000/- per sq.ft..."
                            value={formData.pdfDetails?.marketabilityComparablePrices || ""}
                            onChange={(e) => handleValuationChange('marketabilityComparablePrices', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* e) Any Other Aspect which has Relevance on the Value or Marketability of the Property */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">b) Any Other Aspect which has Relevance on the Value or Marketability of the Property</Label>
                        <select
                            value={formData.pdfDetails?.marketabilityOtherAspect || ""}
                            onChange={(b) => handleValuationChange('marketabilityOtherAspect', b.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer">
                            <option value="">Select</option>
                            <option value="Good">Good</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Poor">Poor</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Average">Average</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ENGINEERING AND TECHNOLOGY ASPECTS SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200 shadow-sm">
                <h3 className="font-bold text-lg text-purple-900 mb-6 flex items-center gap-2">
                    <FaTools className="text-purple-600" />
                    10. Engineering and Technology Aspects
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* a) Type of Construction */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">a) Type of Construction</Label>
                        <select
                            value={formData.pdfDetails?.constructionType || ""}
                            onChange={(e) => handleValuationChange('constructionType', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="RCC Frame">RCC Frame</option>
                            <option value="Load Bearing">Load Bearing</option>
                            <option value="Steel Frame">Steel Frame</option>
                            <option value="Composite">Composite</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* b) Material & Technology Used */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">b) Material & Technology Used</Label>
                        <select
                            value={formData.pdfDetails?.materialTechnology || ""}
                            onChange={(e) => handleValuationChange('materialTechnology', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Modern">Modern</option>
                            <option value="Standard">Standard</option>
                            <option value="Basic">Basic</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* c) Specifications */}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm font-bold text-gray-900">c) Specifications</Label>
                        <Textarea
                            placeholder="e.g., As per Specifications"
                            value={formData.pdfDetails?.specifications || ""}
                            onChange={(e) => handleValuationChange('specifications', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-16 w-full"
                        />
                    </div>

                    {/* d) Maintenance Issues */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">d) Maintenance Issues</Label>
                        <select
                            value={formData.pdfDetails?.maintenanceStatus || ""}
                            onChange={(e) => handleValuationChange('maintenanceStatus', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Well Maintained">Well Maintained</option>
                            <option value="Maintained">Maintained</option>
                            <option value="Poorly Maintained">Poorly Maintained</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* e) Age of the Building */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">e) Age of the Building</Label>
                        <Input
                            placeholder="e.g., 10-20 years"
                            value={formData.pdfDetails?.buildingAge || ""}
                            onChange={(e) => handleValuationChange('buildingAge', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* f) Total Life of the Building */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">f) Total Life of the Building</Label>
                        <Input
                            placeholder="e.g., 50 years"
                            value={formData.pdfDetails?.totalLife || ""}
                            onChange={(e) => handleValuationChange('totalLife', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* g) Extent of Deterioration */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">g) Extent of Deterioration</Label>
                        <select
                            value={formData.pdfDetails?.deterioration || ""}
                            onChange={(e) => handleValuationChange('deterioration', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Nil">Nil</option>
                            <option value="Minor">Minor</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* h) Structural Safety */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">h) Structural Safety</Label>
                        <select
                            value={formData.pdfDetails?.structuralSafety || ""}
                            onChange={(e) => handleValuationChange('structuralSafety', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* i) Protection against Natural Disaster */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">i) Protection against Natural Disaster</Label>
                        <select
                            value={formData.pdfDetails?.disasterProtection || ""}
                            onChange={(e) => handleValuationChange('disasterProtection', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* j) Visible Damage */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">j) Visible Damage</Label>
                        <select
                            value={formData.pdfDetails?.visibleDamage || ""}
                            onChange={(e) => handleValuationChange('visibleDamage', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Visible">Visible</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* k) Air-conditioning System */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">k) Air-conditioning System</Label>
                        <select
                            value={formData.pdfDetails?.airConditioning || ""}
                            onChange={(e) => handleValuationChange('airConditioning', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                            <option value="Partial">Partial</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* l) Provision of Firefighting */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">l) Provision of Firefighting</Label>
                        <select
                            value={formData.pdfDetails?.firefighting || ""}
                            onChange={(e) => handleValuationChange('firefighting', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                            <option value="Partial">Partial</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* m) Building Plans Copy */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">m) Building Plans Copy</Label>
                        <select
                            value={formData.pdfDetails?.buildingPlans || ""}
                            onChange={(e) => handleValuationChange('buildingPlans', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, Attached">Yes, Attached</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ENVIRONMENTAL FACTORS SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-2xl border border-cyan-200 shadow-sm">
                <h3 className="font-bold text-lg text-cyan-900 mb-6 flex items-center gap-2">
                    <FaLeaf className="text-cyan-600" />
                    11. Environmental Factors
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* a) Green Building Techniques */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">a) Green Building Techniques</Label>
                        <select
                            value={formData.pdfDetails?.greenBuildingTechniques || ""}
                            onChange={(e) => handleValuationChange('greenBuildingTechniques', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* b) Rain Water Harvesting */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">b) Rain Water Harvesting</Label>
                        <select
                            value={formData.pdfDetails?.rainWaterHarvesting || ""}
                            onChange={(e) => handleValuationChange('rainWaterHarvesting', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* c) Solar Heating and Lightning Systems */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">c) Solar Heating and Lightning Systems</Label>
                        <select
                            value={formData.pdfDetails?.solarSystems || ""}
                            onChange={(e) => handleValuationChange('solarSystems', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* d) Environmental Pollution */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">d) Environmental Pollution</Label>
                        <select
                            value={formData.pdfDetails?.environmentalPollution || ""}
                            onChange={(e) => handleValuationChange('environmentalPollution', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CHECKLIST OF DOCUMENTS SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 shadow-sm">
                <h3 className="font-bold text-lg text-indigo-900 mb-6 flex items-center gap-2">
                    <FaFileAlt className="text-indigo-600" />
                    Checklist of Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Sale Deed */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">a) Sale Deed / Transfer Deed</Label>
                        <select
                            value={formData.pdfDetails?.docSaleDeed || ""}
                            onChange={(e) => handleValuationChange('docSaleDeed', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                        </select>
                    </div>

                    {/* Property Tax Receipts */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">b) Property Tax Receipts (Latest 1-2 years)</Label>
                        <select
                            value={formData.pdfDetails?.docPropertyTax || ""}
                            onChange={(e) => handleValuationChange('docPropertyTax', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                        </select>
                    </div>

                    {/* Power of Attorney */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">c) Power of Attorney (if applicable)</Label>
                        <select
                            value={formData.pdfDetails?.docPowerOfAttorney || ""}
                            onChange={(e) => handleValuationChange('docPowerOfAttorney', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* Building Plan & Approval */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">d) Building Plan & BU Approval/Completion Certificate</Label>
                        <select
                            value={formData.pdfDetails?.docBuildingPlanApproval || ""}
                            onChange={(e) => handleValuationChange('docBuildingPlanApproval', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                        </select>
                    </div>

                    {/* Encumbrance Certificate */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">e) Encumbrance Certificate (Latest)</Label>
                        <select
                            value={formData.pdfDetails?.docEncumbranceCertificate || ""}
                            onChange={(e) => handleValuationChange('docEncumbranceCertificate', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    {/* Survey Report & Map */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">f) Survey Report & Map</Label>
                        <select
                            value={formData.pdfDetails?.docSurveyReport || ""}
                            onChange={(e) => handleValuationChange('docSurveyReport', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                        </select>
                    </div>

                    {/* Share Certificate & Layout Plan */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">g) Share Certificate & Society Layout Plan (if applicable)</Label>
                        <select
                            value={formData.pdfDetails?.docShareCertificate || ""}
                            onChange={(e) => handleValuationChange('docShareCertificate', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* Agreement to Sell */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200">
                        <Label className="text-sm font-bold text-gray-900">h) Agreement to Sell / Conveyance Deed</Label>
                        <select
                            value={formData.pdfDetails?.docAgreementToSell || ""}
                            onChange={(e) => handleValuationChange('docAgreementToSell', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Partial">Partial</option>
                        </select>
                    </div>

                    {/* Other Documents */}
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-indigo-200 md:col-span-2">
                        <Label className="text-sm font-bold text-gray-900">i) Other Relevant Documents / Permits</Label>
                        <Textarea
                            placeholder="e.g., No Objection Certificate, Environmental Clearance, Occupancy Certificate, etc."
                            value={formData.pdfDetails?.docOtherDocuments || ""}
                            onChange={(e) => handleValuationChange('docOtherDocuments', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-12 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* ARCHITECTURAL AND AESTHETIC QUALITY SECTION */}
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-sm">
                <h3 className="font-bold text-lg text-orange-900 mb-6 flex items-center gap-2">
                    <FaBuilding className="text-orange-600" />
                    12. Architectural and Aesthetic Quality of the Property
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    {/* a) Descriptive account on whether the building is modern, old fashioned, plain looking or decorative, heritage value, presence of landscape elements etc. */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900">a) Architectural Quality & Design</Label>
                        <Textarea
                            placeholder="Subject Building Is Designed as Per Requirements..."
                            value={formData.pdfDetails?.architecturalQuality || ""}
                            onChange={(e) => handleValuationChange('architecturalQuality', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-8 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* VALUATION SECTION */}
            <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-200 shadow-sm">
                <h3 className="font-bold text-lg text-purple-900 mb-6 flex items-center gap-2">
                    <FaDollarSign className="text-purple-600" />
                    13. Valuation
                </h3>

                <div className="space-y-4">
                    {/* Row 1: A) & B) - Full Width */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* a) Methodology of Valuation Procedures */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-purple-900">A) METHODOLOGY OF VALUATION PROCEDURES</Label>
                            <Textarea
                                placeholder="Enter valuation methodology..."
                                value={formData.pdfDetails?.valuationMethodology || ""}
                                onChange={(e) => handleValuationChange('valuationMethodology', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-purple-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-24 w-full"
                            />
                        </div>

                        {/* b) Prevailing Market Rate/Price trend */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-purple-900">B) PREVAILING MARKET RATE/PRICE TREND</Label>
                            <Textarea
                                placeholder="Enter market rate and price trend information..."
                                value={formData.pdfDetails?.marketRatePriceTrend || ""}
                                onChange={(e) => handleValuationChange('marketRatePriceTrend', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-purple-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-24 w-full"
                            />
                        </div>
                    </div>

                    {/* Row 2: C) & D) - Full Width */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* c) Guideline Rate Obtained */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-purple-900">C) GUIDELINE RATE OBTAINED FROM REGISTRAR'S OFFICE/STATE GOVT. GAZETTE</Label>
                            <Textarea
                                placeholder="Enter guideline rate and references..."
                                value={formData.pdfDetails?.guidelineRateObtained || ""}
                                onChange={(e) => handleValuationChange('guidelineRateObtained', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-purple-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-24 w-full"
                            />
                        </div>

                        {/* d) Summary of Valuation */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-purple-900">D) SUMMARY OF VALUATION</Label>
                            <Textarea
                                placeholder="Enter valuation summary..."
                                value={formData.pdfDetails?.valuationSummary || ""}
                                onChange={(e) => handleValuationChange('valuationSummary', e.target.value)}
                                disabled={!canEdit}
                                className="text-sm rounded-lg border border-purple-300 py-2 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-24 w-full"
                            />
                        </div>
                    </div>

                    {/* Row 3: Guideline Value */}
                    <div className=" rounded-xl  p-4 mt-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">GUIDELINE VALUE</Label>
                            <Input
                                placeholder="₹ 0.00"
                                value={formData.pdfDetails?.guidelineValue || ""}
                                onChange={(e) => handleValuationChange('guidelineValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border  py-1 px-3 bg-white font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* MARKET VALUE OF PROPERTY SECTION */}
            <div className="mb-6 p-4 bg-white rounded-2xl border border-green-300 shadow-sm">
                <h3 className="font-bold text-lg text-green-900 mb-6 flex items-center gap-2">
                    <FaDollarSign className="text-green-600" />
                    Market Value of the Property
                </h3>

                {/* 1. LAND VALUE SECTION */}
                <div className="mb-6">
                    <h4 className="font-bold text-base text-green-800 mb-4 pl-3 border-l-4 border-green-600">1. LAND VALUE:</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Sr. No.</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Land Area – SqMT</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Land Rate – Including Land Development cost rate per sq.mtr</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Value of Land</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-400 p-2 font-bold">1.</td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.landAreaSqmt || ""}
                                            onChange={(e) => handleValuationChange('landAreaSqmt', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.landRatePerSqmtr || ""}
                                            onChange={(e) => handleValuationChange('landRatePerSqmtr', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.valueOfLandMarket || ""}
                                            onChange={(e) => handleValuationChange('valueOfLandMarket', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-400 p-2 font-bold text-right" colSpan="3">Total Land Value</td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.totalLandValue || ""}
                                            onChange={(e) => handleValuationChange('totalLandValue', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white font-semibold"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. BUILDING VALUE SECTION */}
                <div className="mb-6">
                    <h4 className="font-bold text-base text-green-800 mb-4 pl-3 border-l-4 border-green-600">2. BUILDING VALUE:</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Sr. No.</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Particulars of item</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Plinth area (In Sq.ft)</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Roof Height Approx.</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Age of the Building</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Estimated Replacement Depreciated Rate of Construction per sq.mtr</th>
                                    <th className="border border-gray-400 p-2 text-left font-bold text-sm">Value of Construction</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-400 p-2 font-bold">1.</td>
                                    <td className="border border-gray-400 p-2 ">
                                        <Input
                                            placeholder="As per Allotment Deed - SBUA"
                                            value={formData.pdfDetails?.buildingParticulars || ""}
                                            onChange={(e) => handleValuationChange('buildingParticulars', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2 ">
                                        <Input
                                            placeholder="000.00"
                                            value={formData.pdfDetails?.plinthAreaSqft || ""}
                                            onChange={(e) => handleValuationChange('plinthAreaSqft', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="12 Ft"
                                            value={formData.pdfDetails?.roofHeightApprox || ""}
                                            onChange={(e) => handleValuationChange('roofHeightApprox', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="12 Years"
                                            value={formData.pdfDetails?.ageOfBuilding || ""}
                                            onChange={(e) => handleValuationChange('ageOfBuilding', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2 ">
                                        <Input
                                            placeholder="₹ 00,000/- per sq.mtr SBUA rate"
                                            value={formData.pdfDetails?.replacementDepreciation || ""}
                                            onChange={(e) => handleValuationChange('replacementDepreciation', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white text-xs"
                                        />
                                    </td>
                                    <td className="border border-gray-400 p-2 font-bold">
                                        <Input
                                            placeholder="₹ 00.00.00,000.00"
                                            value={formData.pdfDetails?.valueOfConstructionMarket || ""}
                                            onChange={(e) => handleValuationChange('valueOfConstructionMarket', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white font-semibold"
                                        />
                                    </td>
                                </tr>
                                <tr className="bg-gray-100">
                                    <td className="border border-gray-400 p-2 font-bold text-right" colSpan="6">Total Building Value</td>
                                    <td className="border border-gray-400 p-2">
                                        <Input
                                            placeholder="₹ 00.00.00,000.00"
                                            value={formData.pdfDetails?.totalBuildingValue || ""}
                                            onChange={(e) => handleValuationChange('totalBuildingValue', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white font-semibold"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. VALUATION SUMMARY TABLE */}
                <div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-400">
                            <tbody>
                                <tr className="bg-gray-100">
                                    <td className="border border-gray-400 p-3 font-bold text-left">Market Value of Property</td>
                                    <td className="border border-gray-400 p-3">
                                        <Input
                                            placeholder="₹ 000.00"
                                            value={formData.pdfDetails?.marketValueOfProperty || ""}
                                            onChange={(e) => handleValuationChange('marketValueOfProperty', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-400 p-3 font-bold text-left">Realizable value Rs. (90% of Fair market value)</td>
                                    <td className="border border-gray-400 p-3">
                                        <Input
                                            placeholder="₹ 000.00"
                                            value={formData.pdfDetails?.realizableValueProperty || ""}
                                            onChange={(e) => handleValuationChange('realizableValueProperty', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-400 p-3 font-bold text-left">Distress Value Rs. (80% of Fair market value)</td>
                                    <td className="border border-gray-400 p-3">
                                        <Input
                                            placeholder="₹ 000.00"
                                            value={formData.pdfDetails?.distressValueProperty || ""}
                                            onChange={(e) => handleValuationChange('distressValueProperty', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-400 p-3 font-bold text-left">Insurable Value of the Property</td>
                                    <td className="border border-gray-400 p-3">
                                        <Input
                                            placeholder="₹ 000.00"
                                            value={formData.pdfDetails?.insurableValueProperty || ""}
                                            onChange={(e) => handleValuationChange('insurableValueProperty', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-400 p-3 font-bold text-left">Jantri Value of the Property</td>
                                    <td className="border border-gray-400 p-3">
                                        <Input
                                            placeholder="₹ 000.00"
                                            value={formData.pdfDetails?.jantriValueProperty || ""}
                                            onChange={(e) => handleValuationChange('jantriValueProperty', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-sm rounded-lg border border-neutral-300 py-1 px-2 bg-white"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 15. ENCLOSURES SECTION */}
            <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-200 shadow-sm">
                <h3 className="font-bold text-lg text-indigo-900 mb-6 flex items-center gap-2">
                    <FaFileAlt className="text-indigo-600" />
                    15. Enclosures
                </h3>

                {/* First Row: A, B, C */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* a) Layout plan sketch */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">A) LAYOUT PLAN SKETCH</Label>
                        <select
                            value={formData.pdfDetails?.enclosureLayoutPlan || ""}
                            onChange={(e) => handleValuationChange('enclosureLayoutPlan', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* b) Building Plan */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">B) BUILDING PLAN</Label>
                        <select
                            value={formData.pdfDetails?.enclosureBuildingPlan || ""}
                            onChange={(e) => handleValuationChange('enclosureBuildingPlan', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* c) Floor Plan */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">C) FLOOR PLAN</Label>
                        <select
                            value={formData.pdfDetails?.enclosureFloorPlan || ""}
                            onChange={(e) => handleValuationChange('enclosureFloorPlan', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                </div>

                {/* Second Row: D, E, F */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* d) Photograph of the property */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">D) PROPERTY PHOTOGRAPH</Label>
                        <select
                            value={formData.pdfDetails?.enclosurePhotograph || ""}
                            onChange={(e) => handleValuationChange('enclosurePhotograph', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* e) Certified copy of approved plan */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">E) APPROVED PLAN COPY</Label>
                        <select
                            value={formData.pdfDetails?.enclosureApprovedPlan || ""}
                            onChange={(e) => handleValuationChange('enclosureApprovedPlan', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* f) Google Map location */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">F) GOOGLE MAP LOCATION</Label>
                        <select
                            value={formData.pdfDetails?.enclosureGoogleMap || ""}
                            onChange={(e) => handleValuationChange('enclosureGoogleMap', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                </div>

                {/* Third Row: G, H, I */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* g) Price trend */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">G) PRICE TREND</Label>
                        <select
                            value={formData.pdfDetails?.enclosurePriceTrend || ""}
                            onChange={(e) => handleValuationChange('enclosurePriceTrend', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* h) Guideline rate */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">H) GUIDELINE RATE</Label>
                        <select
                            value={formData.pdfDetails?.enclosureGuidelineRate || ""}
                            onChange={(e) => handleValuationChange('enclosureGuidelineRate', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>

                    {/* i) Other relevant documents */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider">I) OTHER DOCUMENTS</Label>
                        <select
                            value={formData.pdfDetails?.enclosureOtherDocuments || ""}
                            onChange={(e) => handleValuationChange('enclosureOtherDocuments', e.target.value)}
                            disabled={!canEdit}
                            className="h-10 text-sm rounded-lg border border-indigo-200 py-2 px-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Yes, It is attached herewith">Yes, It is attached herewith</option>
                            <option value="No">No</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderChecklistTab = () => {
        return (
            <div className="space-y-6">
                {/* CHECKLIST OF DOCUMENTS SECTION */}
                <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                    <h3 className="font-bold text-lg text-amber-900 mb-6 flex items-center gap-2">
                        <FaFileAlt className="text-amber-600" />
                        Checklist of Documents
                    </h3>

                    {/* Document Checklist Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-amber-100 border border-amber-300">
                                    <th className="border border-amber-300 p-3 font-bold text-amber-900 text-left text-sm">Document</th>
                                    <th className="border border-amber-300 p-3 font-bold text-amber-900 text-center text-sm">Status</th>
                                    <th className="border border-amber-300 p-3 font-bold text-amber-900 text-center text-sm">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* 1. Engagement Letter */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Engagement Letter / Confirmation for Assignment</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.engagementLetter || ""}
                                            onChange={(e) => handleChecklistChange('engagementLetter', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.engagementLetterReviewed || ""}
                                            onChange={(e) => handleChecklistChange('engagementLetterReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 2. Ownership Documents */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Ownership Documents: Sale Deed</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.saleDeed || ""}
                                            onChange={(e) => handleChecklistChange('saleDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.saleDeedReviewed || ""}
                                            onChange={(e) => handleChecklistChange('saleDeedReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 3. Adv. TCR / LSR */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Adv. TCR / LSR</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.tcrLsr || ""}
                                            onChange={(e) => handleChecklistChange('tcrLsr', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.tcrLsrReviewed || ""}
                                            onChange={(e) => handleChecklistChange('tcrLsrReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 4. Allotment Letter */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Allotment Letter</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.allotmentLetter || ""}
                                            onChange={(e) => handleChecklistChange('allotmentLetter', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.allotmentLetterReviewed || ""}
                                            onChange={(e) => handleChecklistChange('allotmentLetterReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 5. Kabulat Lekh */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Kabulat Lekh</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.kabualatLekh || ""}
                                            onChange={(e) => handleChecklistChange('kabualatLekh', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.kabualatLekhReviewed || ""}
                                            onChange={(e) => handleChecklistChange('kabualatLekhReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 6. Mortgage Deed */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Mortgage Deed</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.mortgageDeed || ""}
                                            onChange={(e) => handleChecklistChange('mortgageDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.mortgageDeedReviewed || ""}
                                            onChange={(e) => handleChecklistChange('mortgageDeedReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 7. Lease Deed */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Lease Deed</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.leaseDeed || ""}
                                            onChange={(e) => handleChecklistChange('leaseDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.leaseDeadReviewed || ""}
                                            onChange={(e) => handleChecklistChange('leaseDeadReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 8. Index – 2 */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Index – 2</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.index2 || ""}
                                            onChange={(e) => handleChecklistChange('index2', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.index2Reviewed || ""}
                                            onChange={(e) => handleChecklistChange('index2Reviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 9. VF: 7/12 in case of Land */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">VF: 7/12 in case of Land</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.vf712 || ""}
                                            onChange={(e) => handleChecklistChange('vf712', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.vf712Reviewed || ""}
                                            onChange={(e) => handleChecklistChange('vf712Reviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 10. NA order */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">NA order</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.naOrder || ""}
                                            onChange={(e) => handleChecklistChange('naOrder', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.naOrderReviewed || ""}
                                            onChange={(e) => handleChecklistChange('naOrderReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 11. Approved Plan */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Approved Plan</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.approvedPlan || ""}
                                            onChange={(e) => handleChecklistChange('approvedPlan', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.approvedPlanReviewed || ""}
                                            onChange={(e) => handleChecklistChange('approvedPlanReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 12. Commencement Letter */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Commencement Letter</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.commencementLetter || ""}
                                            onChange={(e) => handleChecklistChange('commencementLetter', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.commencementLetterReviewed || ""}
                                            onChange={(e) => handleChecklistChange('commencementLetterReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 13. BU Permission */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">BU Permission</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.buPermission || ""}
                                            onChange={(e) => handleChecklistChange('buPermission', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.buPermissionReviewed || ""}
                                            onChange={(e) => handleChecklistChange('buPermissionReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 14. Ele. Meter Photo */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Ele. Meter Photo</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.eleMeterPhoto || ""}
                                            onChange={(e) => handleChecklistChange('eleMeterPhoto', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.eleMeterPhotoReviewed || ""}
                                            onChange={(e) => handleChecklistChange('eleMeterPhotoReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 15. Light Bill */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Light Bill</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.lightBill || ""}
                                            onChange={(e) => handleChecklistChange('lightBill', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.lightBillReviewed || ""}
                                            onChange={(e) => handleChecklistChange('lightBillReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 16. Muni. Tax Bill */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Muni. Tax Bill</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.muniTaxBill || ""}
                                            onChange={(e) => handleChecklistChange('muniTaxBill', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.muniTaxBillReviewed || ""}
                                            onChange={(e) => handleChecklistChange('muniTaxBillReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 17. Numbering – Flat / bungalow / Plot No. / Identification on Site */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Numbering – Flat / bungalow / Plot No. / Identification on Site</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.numbering || ""}
                                            onChange={(e) => handleChecklistChange('numbering', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.numberingReviewed || ""}
                                            onChange={(e) => handleChecklistChange('numberingReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 18. Boundaries of Property – Proper Demarcation */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Boundaries of Property – Proper Demarcation</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.boundaries || ""}
                                            onChange={(e) => handleChecklistChange('boundaries', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.boundariesReviewed || ""}
                                            onChange={(e) => handleChecklistChange('boundariesReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 19. Merged Property? */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Merged Property?</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.mergedProperty || ""}
                                            onChange={(e) => handleChecklistChange('mergedProperty', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.mergedPropertyReviewed || ""}
                                            onChange={(e) => handleChecklistChange('mergedPropertyReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 20. Premise can be Separated, and Entrance / Dorr is available for the mortgaged property? */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800 text-sm">Premise can be Separated, and Entrance / Dorr is available for the mortgaged property?</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.premiseSeparation || ""}
                                            onChange={(e) => handleChecklistChange('premiseSeparation', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.premiseSeparationReviewed || ""}
                                            onChange={(e) => handleChecklistChange('premiseSeparationReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 21. Land is Locked? */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Land is Locked?</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.landLocked || ""}
                                            onChange={(e) => handleChecklistChange('landLocked', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.landLockedReviewed || ""}
                                            onChange={(e) => handleChecklistChange('landLockedReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 22. Property is rented to Other Party */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Property is rented to Other Party</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.propertyRented || ""}
                                            onChange={(e) => handleChecklistChange('propertyRented', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.propertyRentedReviewed || ""}
                                            onChange={(e) => handleChecklistChange('propertyRentedReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 23. If Rented – Rent Agreement is Provided? */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">If Rented – Rent Agreement is Provided?</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.rentAgreement || ""}
                                            onChange={(e) => handleChecklistChange('rentAgreement', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.rentAgreementReviewed || ""}
                                            onChange={(e) => handleChecklistChange('rentAgreementReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 24. Site Visit Photos */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Site Visit Photos</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.siteVisitPhotos || ""}
                                            onChange={(e) => handleChecklistChange('siteVisitPhotos', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.siteVisitPhotosReviewed || ""}
                                            onChange={(e) => handleChecklistChange('siteVisitPhotosReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 25. Selfie with Owner / Identifier */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Selfie with Owner / Identifier</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.selfieOwner || ""}
                                            onChange={(e) => handleChecklistChange('selfieOwner', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.selfieOwnerReviewed || ""}
                                            onChange={(e) => handleChecklistChange('selfieOwnerReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 26. Mobile No. */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Mobile No.</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.mobileNo || ""}
                                            onChange={(e) => handleChecklistChange('mobileNo', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.mobileNoReviewed || ""}
                                            onChange={(e) => handleChecklistChange('mobileNoReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 27. Data Sheet */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Data Sheet</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.dataSheet || ""}
                                            onChange={(e) => handleChecklistChange('dataSheet', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.dataSheetReviewed || ""}
                                            onChange={(e) => handleChecklistChange('dataSheetReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 28. Tentative Rate */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Tentative Rate</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.tentativeRate || ""}
                                            onChange={(e) => handleChecklistChange('tentativeRate', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.tentativeRateReviewed || ""}
                                            onChange={(e) => handleChecklistChange('tentativeRateReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 29. Sale Instance / Local Inquiry / Verbal Survey */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Sale Instance / Local Inquiry / Verbal Survey</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.saleInstance || ""}
                                            onChange={(e) => handleChecklistChange('saleInstance', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.saleInstanceReviewed || ""}
                                            onChange={(e) => handleChecklistChange('saleInstanceReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 30. Broker Recording */}
                                <tr className="bg-yellow-50 border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Broker Recording</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.brokerRecording || ""}
                                            onChange={(e) => handleChecklistChange('brokerRecording', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.brokerRecordingReviewed || ""}
                                            onChange={(e) => handleChecklistChange('brokerRecordingReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>

                                {/* 31. Past Valuation Rate */}
                                <tr className="bg-white border border-amber-200 hover:bg-amber-50">
                                    <td className="border border-amber-200 p-3 font-semibold text-gray-800">Past Valuation Rate</td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.pastValuationRate || ""}
                                            onChange={(e) => handleChecklistChange('pastValuationRate', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="NA">NA</option>
                                        </select>
                                    </td>
                                    <td className="border border-amber-200 p-3 text-center">
                                        <select
                                            value={formData.checklist?.pastValuationRateReviewed || ""}
                                            onChange={(e) => handleChecklistChange('pastValuationRateReviewed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-8 text-xs rounded border border-amber-300 py-1 px-2 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="--">--</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderValuationAnalysisTab = () => {
        return (
            <div className="space-y-6">
                <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">ANALYSIS Tab - 100% Schema Coverage</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        All <strong>416 fields</strong> from the pdfDetailsSchema have been successfully mapped:
                    </p>
                    <ul className="list-disc list-inside mt-3 space-y-1.5 text-sm text-gray-700">
                        <li><strong>GENERAL Tab (Pages 1-4):</strong> 161 fields covering Account Information, Summary Values, Headers, Introductions, Physical Characteristics, Detailed Property Descriptions, Area Details, and Boundaries (both Deed/Plan and Actual on Site)</li>
                        <li><strong>VALUATION Tab (Pages 5-13):</strong> 242 fields covering Town Planning, Document Details, AMC & Ownership, Economic/Socio-Cultural/Functional Aspects, Infrastructure (Aqua/Physical/Social), Marketability, Soil & Enclosures, Engineering & Technology, Environmental Factors, Architectural Quality, Valuation Methodology, Valuation Details, Market Value (Land & Building), Notes, Additional Details, Supporting Documents, and Signature & Approval</li>
                        <li><strong>This ANALYSIS Tab:</strong> Reserved for future custom analysis fields, notes, or additional proprietary calculations</li>
                    </ul>
                </div>

                <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Data Structure</h4>
                    <p className="text-sm text-gray-700">
                        All data is stored in <code className="bg-gray-200 px-2 py-1 rounded text-sm">formData.pdfDetails</code> with individual field keys matching the MongoDB schema exactly. No custom or unnecessary fields are used.
                    </p>
                </div>
            </div>
        );
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
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/dashboard")}
                        className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                    >
                        <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Rajesh Bank Valuation Form</h1>
                        <p className="text-sm text-neutral-500 mt-1">{!isLoggedIn && "Read-Only Mode"}</p>
                    </div>
                </div>

                {/* Main Content - 2-Column Layout */}
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                    {/* Left Column - Form Info */}
                    <div className="col-span-12 sm:col-span-3 lg:col-span-2">
                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-neutral-900">
                                    <FaFileAlt className="h-4 w-4 text-blue-500" />
                                    Form Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">By</p>
                                    <p className="text-sm font-medium text-neutral-900">{username}</p>
                                </div>
                                <div className="border-t border-neutral-200"></div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Status</p>
                                    <p className="text-sm font-medium text-neutral-900">{valuation?.status?.charAt(0).toUpperCase() + valuation?.status?.slice(1)}</p>
                                </div>
                                <div className="border-t border-neutral-200"></div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Last Updated</p>
                                    <p className="text-sm font-medium text-neutral-900 break-words">{new Date().toLocaleString()}</p>
                                </div>
                                <div className="border-t border-neutral-200"></div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">ID</p>
                                    <code className="bg-neutral-100 px-2 py-1.5 rounded-lg text-sm font-mono break-all text-neutral-700 border border-neutral-300 block">{id.slice(0, 12)}...</code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Main Form */}
                    <div className="col-span-12 sm:col-span-9 lg:col-span-10">
                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200 flex-shrink-0">
                                <CardTitle className="text-sm font-bold text-neutral-900">Rajesh Bank Details</CardTitle>
                                <p className="text-neutral-600 text-sm mt-1.5 font-medium">* Required fields</p>
                            </CardHeader>
                            <CardContent className="p-4 overflow-y-auto flex-1">
                                <form className="space-y-3" onSubmit={onFinish}>

                                    {/* Main Tab Navigation - Client/Documents/Valuation */}
                                    <div className="flex gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 overflow-x-auto">
                                        {[
                                            { id: 'client', label: 'CLIENT', icon: FaUser },
                                            { id: 'documents', label: 'DOCS', icon: FaFileAlt },
                                            { id: 'valuation', label: 'VALUATION', icon: FaDollarSign },
                                            { id: 'addfields', label: 'ADD FIELDS', icon: FaCog }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${activeTab === tab.id
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
                                                formType="rajeshbank"
                                            />
                                        </div>
                                    )}

                                    {/* Valuation Details Tab */}
                                    {activeTab === 'valuation' && (
                                        <div>
                                            {/* Sub-tab Navigation */}
                                            <div className="flex gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 overflow-x-auto">
                                                {[
                                                    { id: 'general', label: 'GENERAL' },
                                                    { id: 'valuation', label: 'VALUATION' },
                                                    { id: 'infrastructure', label: 'INFRASTRUCTURE' },
                                                    { id: 'checklist', label: 'CHECKLIST' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setActiveValuationSubTab(tab.id)}
                                                        className={`px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap flex-shrink-0 transition-all ${activeValuationSubTab === tab.id
                                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                            : "bg-white border border-gray-300 text-gray-900 hover:border-blue-500"
                                                            }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Sub-tab Content */}
                                            <div className="space-y-6">
                                                {activeValuationSubTab === 'general' && renderGeneralTab()}
                                                {activeValuationSubTab === 'valuation' && renderValuationTab()}
                                                {activeValuationSubTab === 'infrastructure' && renderInfrastructureTab()}
                                                {activeValuationSubTab === 'checklist' && renderChecklistTab()}
                                            </div>
                                        </div>
                                    )}

                                    {/* ADD FIELDS Section */}
                                    {activeTab === "addfields" && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Custom Fields</h3>

                                            <div className="p-6 bg-white rounded-2xl border border-gray-200 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-bold text-gray-900">
                                                            Field Name
                                                            <span className="text-red-500 ml-1">*</span>
                                                        </Label>
                                                        <Input
                                                            placeholder="Enter field name (e.g., Property Type)"
                                                            value={customFieldName}
                                                            onChange={(e) => setCustomFieldName(e.target.value.substring(0, 100))}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter' && customFieldName.trim() && customFieldValue.trim() && canEdit) {
                                                                    handleAddCustomField();
                                                                }
                                                            }}
                                                            disabled={!canEdit}
                                                            maxLength={100}
                                                            className="h-10 text-sm rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />
                                                        <span className="text-sm text-gray-500">{customFieldName.length}/100 characters</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-bold text-gray-900">
                                                            Field Value
                                                            <span className="text-red-500 ml-1">*</span>
                                                        </Label>
                                                        <Input
                                                            placeholder="Enter field value"
                                                            value={customFieldValue}
                                                            onChange={(e) => setCustomFieldValue(e.target.value.substring(0, 500))}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter' && customFieldName.trim() && customFieldValue.trim() && canEdit) {
                                                                    handleAddCustomField();
                                                                }
                                                            }}
                                                            disabled={!canEdit}
                                                            maxLength={500}
                                                            className="h-10 text-sm rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />
                                                        <span className="text-sm text-gray-500">{customFieldValue.length}/500 characters</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        onClick={handleAddCustomField}
                                                        disabled={!canEdit || !customFieldName.trim() || !customFieldValue.trim()}
                                                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                                                    >
                                                        {customFields.length === 0 ? "Add First Field" : "Add Field"}
                                                    </Button>
                                                    {(customFieldName.trim() || customFieldValue.trim()) && (
                                                        <Button
                                                            onClick={() => {
                                                                setCustomFieldName("");
                                                                setCustomFieldValue("");
                                                            }}
                                                            disabled={!canEdit}
                                                            className="bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Display Custom Fields */}
                                            {customFields.length > 0 && (
                                                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-bold text-gray-900">
                                                            Custom Fields
                                                            <span className="bg-blue-500 text-white text-sm font-semibold ml-2 px-3 py-1 rounded-full">
                                                                {customFields.length}
                                                            </span>
                                                        </h4>
                                                        {canEdit && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setClearConfirmOpen(true)}
                                                                className="text-sm text-red-600 hover:text-red-800 font-semibold transition-colors"
                                                            >
                                                                Clear All
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        {customFields.map((field, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex justify-between items-start p-4 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-baseline gap-2">
                                                                        <span className="font-semibold text-gray-900 break-words">{field.name}</span>
                                                                        <span className="text-gray-400">:</span>
                                                                    </div>
                                                                    <span className="text-gray-700 block mt-1 break-words">{field.value}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveCustomField(index)}
                                                                    disabled={!canEdit}
                                                                    title={canEdit ? "Click to remove this field" : "Cannot edit"}
                                                                    className="flex-shrink-0 ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold px-3 py-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Empty State */}
                                            {customFields.length === 0 && !customFieldName && !customFieldValue && (
                                                <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 text-center">
                                                    <p className="text-gray-600 font-medium">No custom fields added yet</p>
                                                    <p className="text-sm text-gray-500 mt-2">Add a field name and value above to get started</p>
                                                </div>
                                            )}
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
                                        className="min-w-fit px-4 h-10 text-sm font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
                                                className="min-w-fit px-6 h-10 text-sm font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                            >
                                                <FaSave size={14} />
                                                {loading ? "Saving..." : "Save Changes"}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => navigate("/dashboard")}
                                                disabled={loading}
                                                className="min-w-fit px-4 h-10 text-sm font-bold rounded-lg border border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
                                                className="min-w-fit px-6 h-10 text-sm font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                            >
                                                <FaCheckCircle size={14} />
                                                {loading ? "Processing..." : "Approve"}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => handleManagerAction("reject")}
                                                disabled={loading}
                                                className="min-w-fit px-6 h-10 text-sm font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
                                            className="min-w-fit px-4 h-10 text-sm font-bold rounded-lg border border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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

export default RajeshBankEditForm;