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
    FaLeaf,
    FaChartBar
} from "react-icons/fa";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, RadioGroup, RadioGroupItem, ChipSelect } from "../components/ui";
import { getRajeshFlatById, updateRajeshFlat, managerSubmitRajeshFlat, getLastSubmittedRajeshFlat } from "../services/rajeshFlatService";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";
import { uploadPropertyImages, uploadLocationImages, uploadDocuments, uploadAreaImages } from "../services/imageService";
import { invalidateCache } from "../services/axios";
import { getCustomOptions } from "../services/customOptionsService";
import ClientInfoPanel from "../components/ClientInfoPanel";
import DocumentsPanel from "../components/DocumentsPanel";
import { generateFlatRajesh } from "../services/rajeshFlatPdf";

const RajeshFlatEditForm = ({ user, onLogin }) => {
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
    const [customValuationItems, setCustomValuationItems] = useState([]);
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

        // PDF DETAILS - FLAT STRUCTURE FOR FORM (maps to nested schema in database)
        // All fields mapped 100% to rajeshFlatModel.js schema
        pdfDetails: {
            // EXTRA FIELDS (used in form UI but not in schema)
            accountName: '',
            client: '',
            typeOfProperty: '',
            propertyDetailsLocation: '',
            valuationDoneByApproved: '',
            purposeOfValuationIntro: '',
            nameOfOwnerValuation: '',
            addressPropertyValuation: '',
            requisiteDetailsAsPerSaleDeedAuthoritiesDocuments: '',
            areaOfLand: '',
            valueOfConstruction: '',
            totalMarketValueOfTheProperty: '',
            realizableValue: '',
            dateOfInspectionOfProperty: '',
            dateOfValuationReport: '',
            docSaleDeed: '',
            docBuildingPlanApproval: '',
            docPowerOfAttorney: '',
            docConstructionPermission: '',
            docNALetter: '',
            docTCR: '',
            docPropertyTax: '',
            nameAddressOfManager: '',
            plotNoRevenueNo: '',
            doorNumber: '',
            villageOrTalukSubRegisterBlock: '',
            dateOfIssueValidity: '',
            approvedMapPlan: '',
            approvedMapPlanAuthority: '',
            genuinenessVerified: '',
            otherComments: '',
            cityTown: '',
            saleableArea: '',
            siteAreaForValuation: '',
            constructionType: '',
            tsNo: '',
            blockNo: '',
            wardNo: '',
            villageOrMunicipality: '',
            doorNoStreetRoadPinCode: '',
            localityDescription: '',
            buildingAge: '',
            structureType: '',
            dwellingUnits: '',
            constructionQuality: '',
            buildingAppearance: '',
            maintenanceStatus: '',
            hasLift: '',
            hasWaterSupply: '',
            hasSewerage: '',
            hasCarParking: '',
            hasCompoundWall: '',
            hasPavement: '',
            flatLocation: '',
            flatDoorNumber: '',
            specRoof: '',
            specFlooring: '',
            specDoors: '',
            specWindows: '',
            specFittings: '',
            specFinishing: '',
            taxAssessmentNo: '',
            taxPaidName: '',
            taxAmount: '',
            electricityConnectionNo: '',
            unitMaintenance: '',
            conveyanceDeedName: '',
            undividedLandArea: '',
            flatPlinthArea: '',
            carpetAreaFlat: '',
            flatClass: '',
            usagePurpose: '',
            marketabilityLocational: '',
            marketabilityScarcity: '',
            marketabilityDemandSupply: '',
            compositeDepreciatedBuildingRate: '',
            compositeReplacementCost: '',
            compositeAgeOfBuilding: '',
            compositeLifeOfBuilding: '',
            compositeDepreciationPercentage: '',
            compositeDepreciatedRatio: '',
            compositeTotalRateForValuation: '',
            compositeDepreciatedBuildingRateVI: '',
            compositeRateForLand: '',
            compositeTotalCompositeRate: '',
            presentValueQty: '',
            presentValueRate: '',
            presentValue: '',

            // DETAILS OF VALUATION FIELDS
            wardrobes: '',
            wardrobesRate: '',
            wardrobesValue: '',
            showcases: '',
            showcasesRate: '',
            showcasesValue: '',
            kitchenArrangements: '',
            kitchenRate: '',
            kitchenValue: '',
            superfineFinish: '',
            finishRate: '',
            finishValue: '',
            interiorDecorations: '',
            decorationRate: '',
            decorationValue: '',
            electricityDeposits: '',
            electricityRate: '',
            electricityValue: '',
            grillWorks: '',
            grillRate: '',
            grillValue: '',
            potentialValue: '',
            potentialRate: '',
            potentialValueAmount: '',
            valuationTotalValue: '',

            // AREA CLASSIFICATION FIELDS
            residentialArea: '',
            commercialArea: '',
            industrialArea: '',
            areaGrade: '',
            areaType: '',
            areaClassificationHighMiddlePoor: '',
            areaClassificationUrbanSemiUrbanRural: '',
            governanceType: '',
            governmentEnactments: '',
            corporationLimit: '',
            stateGovernmentEnactments: '',

            // LOCATION DETAILS FIELDS
            locationOfProperty: '',
            wardTaluka: '',
            district: '',

            // EXTENT OF SITE FIELDS
            extentOfSiteSaleDeed: '',
            extentOfSiteApprovedPlan: '',
            extentOfSiteTaxBill: '',
            extentOfSiteForValuation: '',

            // FLAT OCCUPANCY & DETAILS FIELDS
            floorSpaceIndex: '',
            occupancyType: '',
            monthlyRent: '',

            // VALUATION HEADER (valuationHeaderSchema)
            applicant: '',
            valuationDoneBy: '',
            purposeForValuation: '',
            dateOfInspection: '',
            dateOfValuation: '',

            // PROPERTY OWNER DETAILS (propertyOwnerDetailsSchema)
            nameOfOwner: '',
            ownerAddress: '',

            // PROPERTY DESCRIPTION (propertyDescriptionSchema)
            briefDescriptionOfProperty: '',
            locationOfProperty: '',
            googleMapCoordinates: '',
            otherCommentsByValuers: '',

            // LOCATION DETAILS (locationDetailsSchema)
            plotNoSurveyNo: '',
            doorNo: '',
            tsNoVillage: '',
            wardTaluka: '',
            mandalDistrict: '',

            // APPROVED MAP DETAILS (approvedMapDetailsSchema)
            dateOfIssueAndValidity: '',
            approvedMapIssuingAuthority: '',
            genuinessOfApprovedMap: '',

            // AREA AND LOCATION DETAILS (areaAndLocationDetailsSchema)
            postalAddress: '',
            cityTown: '',
            residentialArea: '',
            commercialArea: '',
            industrialArea: '',
            areaClassificationHighMiddlePoor: '',
            areaClassificationUrbanSemiUrbanRural: '',
            corporationLimit: '',
            stateGovernmentEnactments: '',

            // SITE DETAILS (siteDetailsSchema) - BOUNDARIES
            boundariesEastSaleDeed: '',
            boundariesEastSiteVisit: '',
            boundariesWestSaleDeed: '',
            boundariesWestSiteVisit: '',
            boundariesNorthSaleDeed: '',
            boundariesNorthSiteVisit: '',
            boundariesSouthSaleDeed: '',
            boundariesSouthSiteVisit: '',

            // SITE DETAILS - DIMENSIONS
            dimensionsEastDeed: '',
            dimensionsEastActual: '',
            dimensionsWestDeed: '',
            dimensionsWestActual: '',
            dimensionsNorthDeed: '',
            dimensionsNorthActual: '',
            dimensionsSouthDeed: '',
            dimensionsSouthActual: '',

            // SITE DETAILS - EXTENT OF SITE
            extentOfSiteSaleDeed: '',
            extentOfSiteApprovedPlan: '',
            extentOfSiteTaxBill: '',
            extentOfSiteForValuation: '',
            occupancyStatus: '',
            rentReceivedPerMonth: '',

            // BUILDING AND PROPERTY - APARTMENT BUILDING LOCATION
            apartmentLocationTsNo: '',
            apartmentLocationBlockNo: '',
            apartmentLocationWardNo: '',
            apartmentLocationVillageOrMunicipalityOrCorporation: '',
            apartmentLocationDoorNoStreetOrRoad: '',
            apartmentLocationPinCode: '',

            // BUILDING AND PROPERTY - APARTMENT BUILDING
            natureOfApartment: '',
            descriptionOfLocality: '',
            yearOfConstruction: '',
            numberOfFloors: '',
            typeOfStructure: '',
            numberOfDwellingUnits: '',
            qualityOfConstruction: '',
            appearanceOfBuilding: '',
            maintenanceOfBuilding: '',

            // BUILDING AND PROPERTY - FACILITIES AVAILABLE
            facilitiesLift: '',
            facilitiesProtectedWaterSupply: '',
            facilitiesUndergroundSewerage: '',
            facilitiesCarParking: '',
            facilitiesCompoundWall: '',
            facilitiesPavementAroundBuilding: '',

            // BUILDING AND PROPERTY - FLAT DETAILS
            flatDetailsFloorNumber: '',
            flatDetailsDoorNo: '',
            flatDetailsSpecificationsRoof: '',
            flatDetailsSpecificationsFlooring: '',
            flatDetailsSpecificationsDoors: '',
            flatDetailsSpecificationsWindows: '',
            flatDetailsSpecificationsFittings: '',
            flatDetailsSpecificationsFinishing: '',
            flatDetailsHouseTaxDetailsHouseTax: '',
            flatDetailsHouseTaxDetailsAssessmentNo: '',
            flatDetailsHouseTaxDetailsTaxPaidInNameOf: '',
            flatDetailsHouseTaxDetailsTaxAmount: '',
            flatDetailsElectricityServiceConnectionNo: '',
            flatDetailsMaintenanceOfUnit: '',
            flatDetailsConveyanceDeedExecutedInNameOf: '',
            flatDetailsUndividedAreaOfLand: '',
            flatDetailsPlinthArea: '',
            flatDetailsFloorSpaceIndex: '',
            flatDetailsCarpetArea: '',
            flatDetailsClassification: '',
            flatDetailsPurposeOfUse: '',
            flatDetailsOccupancyType: '',
            flatDetailsMonthlyRent: '',

            // PROPERTY ANALYSIS (propertyAnalysisSchema)
            propertyAnalysisMarketability: '',
            propertyAnalysisExtraPotentialValueFactors: '',
            propertyAnalysisNegativeFactorsObserved: '',

            // RATE ANALYSIS (rateAnalysisSchema)
            rateAnalysisCompositeRateAnalysis: '',
            rateAnalysisAdoptedCompositeRate: '',
            rateAnalysisRateBreakupBuildingServices: '',
            rateAnalysisRateBreakupLandOthers: '',
            rateAnalysisGuidelineRate: '',

            // VALUATION COMPUTATION - JANTRI VALUE DETAILS
            jantriValueDetailsJantriValue: '',
            jantriValueDetailsGuideline: '',
            jantriValueDetailsGlrMultiplier: '',
            jantriValueDetailsCalculatedValue: '',
            jantriValueDetailsDetails: '',

            // VALUATION COMPUTATION - DEPRECIATION DETAILS
            depreciationDetailsDeprecatedBuildingRate: '',
            depreciationDetailsReplacementCostOfFlatWithServices: '',
            depreciationDetailsAgeOfBuilding: '',
            depreciationDetailsLifeOfBuildingEstimated: '',
            depreciationDetailsDepreciationPercentage: '',
            depreciationDetailsDepreciatedRatioOfBuilding: '',
            depreciationDetailsTotalCompositeRateArrived: '',
            depreciationDetailsDeprecatedBuildingRateV1: '',
            depreciationDetailsRateForLandAndOther: '',
            depreciationDetailsTotalCompositeRate: '',

            // VALUATION COMPUTATION - VALUATION DETAILS (array handled separately)
            valuationDetailsArray: [],

            // VALUATION COMPUTATION - TOTAL VALUE AND SUMMARY
            totalValueFromValuation: '',
            marketValue: '',
            marketValueInWords: '',
            realisableValue: '',
            realisableValueInWords: '',
            distressValue: '',
            distressValueInWords: '',
            insurableValue: '',
            insurableValueInWords: '',
            jantriValue: '',
            jantriValueInWords: '',

            // DOCUMENTATION - DOCUMENTS
            documentsDocSaleDeed: '',
            documentsApprovedPlan: '',
            documentsBuPermission: '',
            documentsConstructionPermission: '',
            documentsNaLetter: '',
            documentsTcr: '',
            documentsTaxBill: '',

            // DOCUMENTATION - DOCUMENT CHECKLIST (all 27 items)
            documentChecklistEngagementLetterConfirmation: '',
            documentChecklistOwnershipDocumentsSaleDeedConveyance: '',
            documentChecklistAdvTcrLsr: '',
            documentChecklistAgreementForSaleBanaKhat: '',
            documentChecklistPropertyCard: '',
            documentChecklistMortgageDeed: '',
            documentChecklistLeaseDeed: '',
            documentChecklistIndexMinusTwo: '',
            documentChecklistVfSevenTwelveInCaseOfLand: '',
            documentChecklistNaOrder: '',
            documentChecklistApprovedLayoutPlan: '',
            documentChecklistCommencementLetter: '',
            documentChecklistBuPermissionDoc: '',
            documentChecklistEleMeterPhoto: '',
            documentChecklistLightBill: '',
            documentChecklistMuniTaxBill: '',
            documentChecklistNumberingFlatBungalowPlotNo: '',
            documentChecklistBoundariesOfPropertyProperDemarcation: '',
            documentChecklistMergedProperty: '',
            documentChecklistPremiseCanBeSeparatedAndEntrance: '',
            documentChecklistLandIsLocked: '',
            documentChecklistPropertyIsRentedToOtherParty: '',
            documentChecklistIfRentedRentAgreementProvided: '',
            documentChecklistSiteVisitPhotos: '',
            documentChecklistSelfieWithOwnerIdentifier: '',
            documentChecklistMobileNo: '',
            documentChecklistDataSheet: '',
            documentChecklistTentativeRate: '',
            documentChecklistSaleInstanceLocalInquiryVerbalSurvey: '',
            documentChecklistBrokerRecording: '',
            documentChecklistPastValuationRate: '',

            // DOCUMENTATION - DECLARATION DETAILS
            declarationDetailsValuationReportDate: '',
            declarationDetailsInformationFurnished: '',
            declarationDetailsImpartialValuation: '',
            declarationDetailsPropertyInspectionDate: '',
            declarationDetailsSubContractingStatement: '',
            declarationDetailsYearsAfterValuation: '',

            // APPROVAL AND CERTIFICATION - SIGNATURE DETAILS
            signatureDetailsValuersName: '',
            signatureDetailsValuersDesignation: '',
            signatureDetailsValuersDate: '',
            signatureDetailsValuersPlace: '',
            signatureDetailsValuersSignature: '',
            signatureDetailsBranchManagerName: '',
            signatureDetailsBranchManagerDate: '',
            signatureDetailsBranchManagerPlace: '',
            signatureDetailsBranchManagerSignature: '',

            // APPROVAL AND CERTIFICATION - CERTIFICATION DETAILS
            certificationDetailsInspectionDate: '',
            certificationDetailsReportDate: '',
            certificationDetailsCertificateStatement: '',
            certificationDetailsFairMarketValue: '',
            certificationDetailsFairMarketValueInWords: '',

            // CONSTRUCTION DETAILS (constructionDetailsSchema)
            constructionDetailsConstructionArea: '',
            constructionDetailsConstructionAreaValue: '',
            constructionDetailsRevenueDetails: '',

            // APPOINTMENT AND DATES (appointmentAndDatesSchema)
            appointmentAndDatesDateOfAppointment: '',
            appointmentAndDatesDateOfVisit: '',
            appointmentAndDatesDateOfReport: ''
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
                dataToDownload = await getRajeshFlatById(id, username, role, clientId);
                ('✅ Fresh Rajesh Flat data fetched for PDF:', {
                    bankName: dataToDownload?.bankName,
                    city: dataToDownload?.city
                });
            } catch (fetchError) {
                console.error('❌ Failed to fetch fresh Rajesh Flat data:', fetchError);
                // Use in-memory valuation data if available
                dataToDownload = valuation;
                if (!dataToDownload || !dataToDownload.uniqueId) {
                    console.warn('Rajesh Flat form not found in DB and no local data available');
                    showError('Form data not found. Please save the form first before downloading.');
                    dispatch(hideLoader());
                    return;
                } else {
                    ('⚠️ Using unsaved form data from memory for PDF generation');
                }
            }

            await generateFlatRajesh(dataToDownload);
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



    const loadValuation = async () => {
        const savedData = localStorage.getItem(`valuation_draft_${username}`);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.uniqueId === id) {
                ("[loadValuation] Loading from draft, pdfDetails keys:", Object.keys(parsedData.pdfDetails || {}).slice(0, 5));
                setValuation(parsedData);
                mapDataToForm(parsedData);
                return;
            }
        }

        try {
            // Pass user info for authentication
            const dbData = await getRajeshFlatById(id, username, role, clientId);
            ("[loadValuation] Data loaded from DB, pdfDetails keys:", Object.keys(dbData.pdfDetails || {}).slice(0, 5));
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

            // Restore custom valuation items from database
            if (dbData.customValuationItems && Array.isArray(dbData.customValuationItems)) {
                setCustomValuationItems(dbData.customValuationItems);
            }
        } catch (error) {
            console.error("Error loading valuation:", error);
            // If form not found (new form), try to autofill from last submitted form
            if (error.message && error.message.includes("not found")) {
                try {
                    ("[loadValuation] Form not found, attempting autofill from last form...");
                    // Fetch last submitted form for autofilling valuation tab data only
                    const lastForm = await getLastSubmittedRajeshFlat();

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
                showError("Rajesh Flat form not found. Creating new form...");
                // Initialize with empty form
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

    // Helper function to flatten nested pdfDetails structure from API response (NEW SCHEMA)
    const convertFlatPdfDetailsToNested = (flatPdfDetails) => {
        if (!flatPdfDetails || typeof flatPdfDetails !== 'object') {
            return {};
        }

        // If already nested (has valuationHeader, etc.), return as is
        if (flatPdfDetails.valuationHeader || flatPdfDetails.propertyOwnerDetails) {
            return flatPdfDetails;
        }

        const nested = {};

        // EXTRA FIELDS - Keep as-is (not part of schema, but needed for form)
        nested.accountName = flatPdfDetails.accountName || '';
        nested.client = flatPdfDetails.client || '';
        nested.typeOfProperty = flatPdfDetails.typeOfProperty || '';
        nested.propertyDetailsLocation = flatPdfDetails.propertyDetailsLocation || '';
        nested.valuationDoneByApproved = flatPdfDetails.valuationDoneByApproved || '';
        nested.purposeOfValuationIntro = flatPdfDetails.purposeOfValuationIntro || '';
        nested.nameOfOwnerValuation = flatPdfDetails.nameOfOwnerValuation || '';
        nested.addressPropertyValuation = flatPdfDetails.addressPropertyValuation || '';
        nested.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments = flatPdfDetails.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments || '';
        nested.areaOfLand = flatPdfDetails.areaOfLand || '';
        nested.valueOfConstruction = flatPdfDetails.valueOfConstruction || '';
        nested.totalMarketValueOfTheProperty = flatPdfDetails.totalMarketValueOfTheProperty || '';
        nested.realizableValue = flatPdfDetails.realizableValue || '';
        nested.dateOfInspectionOfProperty = flatPdfDetails.dateOfInspectionOfProperty || '';
        nested.dateOfValuationReport = flatPdfDetails.dateOfValuationReport || '';
        nested.docSaleDeed = flatPdfDetails.docSaleDeed || '';
        nested.docBuildingPlanApproval = flatPdfDetails.docBuildingPlanApproval || '';
        nested.docPowerOfAttorney = flatPdfDetails.docPowerOfAttorney || '';
        nested.docConstructionPermission = flatPdfDetails.docConstructionPermission || '';
        nested.docNALetter = flatPdfDetails.docNALetter || '';
        nested.docTCR = flatPdfDetails.docTCR || '';
        nested.docPropertyTax = flatPdfDetails.docPropertyTax || '';
        nested.nameAddressOfManager = flatPdfDetails.nameAddressOfManager || '';
        nested.plotNoRevenueNo = flatPdfDetails.plotNoRevenueNo || '';
        nested.doorNumber = flatPdfDetails.doorNumber || '';
        nested.villageOrTalukSubRegisterBlock = flatPdfDetails.villageOrTalukSubRegisterBlock || '';
        nested.dateOfIssueValidity = flatPdfDetails.dateOfIssueValidity || '';
        nested.approvedMapPlan = flatPdfDetails.approvedMapPlan || '';
        nested.approvedMapPlanAuthority = flatPdfDetails.approvedMapPlanAuthority || '';
        nested.genuinenessVerified = flatPdfDetails.genuinenessVerified || '';
        nested.otherComments = flatPdfDetails.otherComments || '';
        nested.cityTown = flatPdfDetails.cityTown || '';
        nested.saleableArea = flatPdfDetails.saleableArea || '';
        nested.siteAreaForValuation = flatPdfDetails.siteAreaForValuation || '';
        nested.constructionType = flatPdfDetails.constructionType || '';
        nested.tsNo = flatPdfDetails.tsNo || '';
        nested.blockNo = flatPdfDetails.blockNo || '';
        nested.wardNo = flatPdfDetails.wardNo || '';
        nested.villageOrMunicipality = flatPdfDetails.villageOrMunicipality || '';
        nested.doorNoStreetRoadPinCode = flatPdfDetails.doorNoStreetRoadPinCode || '';
        nested.localityDescription = flatPdfDetails.localityDescription || '';
        nested.buildingAge = flatPdfDetails.buildingAge || '';
        nested.structureType = flatPdfDetails.structureType || '';
        nested.dwellingUnits = flatPdfDetails.dwellingUnits || '';
        nested.constructionQuality = flatPdfDetails.constructionQuality || '';
        nested.buildingAppearance = flatPdfDetails.buildingAppearance || '';
        nested.maintenanceStatus = flatPdfDetails.maintenanceStatus || '';
        nested.hasLift = flatPdfDetails.hasLift || '';
        nested.hasWaterSupply = flatPdfDetails.hasWaterSupply || '';
        nested.hasSewerage = flatPdfDetails.hasSewerage || '';
        nested.hasCarParking = flatPdfDetails.hasCarParking || '';
        nested.hasCompoundWall = flatPdfDetails.hasCompoundWall || '';
        nested.hasPavement = flatPdfDetails.hasPavement || '';
        nested.flatLocation = flatPdfDetails.flatLocation || '';
        nested.flatDoorNumber = flatPdfDetails.flatDoorNumber || '';
        nested.specRoof = flatPdfDetails.specRoof || '';
        nested.specFlooring = flatPdfDetails.specFlooring || '';
        nested.specDoors = flatPdfDetails.specDoors || '';
        nested.specWindows = flatPdfDetails.specWindows || '';
        nested.specFittings = flatPdfDetails.specFittings || '';
        nested.specFinishing = flatPdfDetails.specFinishing || '';
        nested.taxAssessmentNo = flatPdfDetails.taxAssessmentNo || '';
        nested.taxPaidName = flatPdfDetails.taxPaidName || '';
        nested.taxAmount = flatPdfDetails.taxAmount || '';
        nested.electricityConnectionNo = flatPdfDetails.electricityConnectionNo || '';
        nested.unitMaintenance = flatPdfDetails.unitMaintenance || '';
        nested.conveyanceDeedName = flatPdfDetails.conveyanceDeedName || '';
        nested.undividedLandArea = flatPdfDetails.undividedLandArea || '';
        nested.flatPlinthArea = flatPdfDetails.flatPlinthArea || '';
        nested.carpetAreaFlat = flatPdfDetails.carpetAreaFlat || '';
        nested.flatClass = flatPdfDetails.flatClass || '';
        nested.usagePurpose = flatPdfDetails.usagePurpose || '';
        nested.marketabilityLocational = flatPdfDetails.marketabilityLocational || '';
        nested.marketabilityScarcity = flatPdfDetails.marketabilityScarcity || '';
        nested.marketabilityDemandSupply = flatPdfDetails.marketabilityDemandSupply || '';
        nested.compositeDepreciatedBuildingRate = flatPdfDetails.compositeDepreciatedBuildingRate || '';
        nested.compositeReplacementCost = flatPdfDetails.compositeReplacementCost || '';
        nested.compositeAgeOfBuilding = flatPdfDetails.compositeAgeOfBuilding || '';
        nested.compositeLifeOfBuilding = flatPdfDetails.compositeLifeOfBuilding || '';
        nested.compositeDepreciationPercentage = flatPdfDetails.compositeDepreciationPercentage || '';
        nested.compositeDepreciatedRatio = flatPdfDetails.compositeDepreciatedRatio || '';
        nested.compositeTotalRateForValuation = flatPdfDetails.compositeTotalRateForValuation || '';
        nested.compositeDepreciatedBuildingRateVI = flatPdfDetails.compositeDepreciatedBuildingRateVI || '';
        nested.compositeRateForLand = flatPdfDetails.compositeRateForLand || '';
        nested.compositeTotalCompositeRate = flatPdfDetails.compositeTotalCompositeRate || '';
        nested.presentValueQty = flatPdfDetails.presentValueQty || '';
        nested.presentValueRate = flatPdfDetails.presentValueRate || '';
        nested.presentValue = flatPdfDetails.presentValue || '';

        // DETAILS OF VALUATION FIELDS
        nested.wardrobes = flatPdfDetails.wardrobes || '';
        nested.wardrobesRate = flatPdfDetails.wardrobesRate || '';
        nested.wardrobesValue = flatPdfDetails.wardrobesValue || '';
        nested.showcases = flatPdfDetails.showcases || '';
        nested.showcasesRate = flatPdfDetails.showcasesRate || '';
        nested.showcasesValue = flatPdfDetails.showcasesValue || '';
        nested.kitchenArrangements = flatPdfDetails.kitchenArrangements || '';
        nested.kitchenRate = flatPdfDetails.kitchenRate || '';
        nested.kitchenValue = flatPdfDetails.kitchenValue || '';
        nested.superfineFinish = flatPdfDetails.superfineFinish || '';
        nested.finishRate = flatPdfDetails.finishRate || '';
        nested.finishValue = flatPdfDetails.finishValue || '';
        nested.interiorDecorations = flatPdfDetails.interiorDecorations || '';
        nested.decorationRate = flatPdfDetails.decorationRate || '';
        nested.decorationValue = flatPdfDetails.decorationValue || '';
        nested.electricityDeposits = flatPdfDetails.electricityDeposits || '';
        nested.electricityRate = flatPdfDetails.electricityRate || '';
        nested.electricityValue = flatPdfDetails.electricityValue || '';
        nested.grillWorks = flatPdfDetails.grillWorks || '';
        nested.grillRate = flatPdfDetails.grillRate || '';
        nested.grillValue = flatPdfDetails.grillValue || '';
        nested.potentialValue = flatPdfDetails.potentialValue || '';
        nested.potentialRate = flatPdfDetails.potentialRate || '';
        nested.potentialValueAmount = flatPdfDetails.potentialValueAmount || '';
        nested.valuationTotalValue = flatPdfDetails.valuationTotalValue || '';

        // AREA CLASSIFICATION FIELDS
        nested.residentialArea = flatPdfDetails.residentialArea || '';
        nested.commercialArea = flatPdfDetails.commercialArea || '';
        nested.industrialArea = flatPdfDetails.industrialArea || '';
        nested.areaGrade = flatPdfDetails.areaGrade || '';
        nested.areaType = flatPdfDetails.areaType || '';
        nested.areaClassificationHighMiddlePoor = flatPdfDetails.areaClassificationHighMiddlePoor || '';
        nested.areaClassificationUrbanSemiUrbanRural = flatPdfDetails.areaClassificationUrbanSemiUrbanRural || '';
        nested.governanceType = flatPdfDetails.governanceType || '';
        nested.governmentEnactments = flatPdfDetails.governmentEnactments || '';
        nested.corporationLimit = flatPdfDetails.corporationLimit || '';
        nested.stateGovernmentEnactments = flatPdfDetails.stateGovernmentEnactments || '';

        // LOCATION DETAILS FIELDS
        nested.wardTaluka = flatPdfDetails.wardTaluka || '';
        nested.district = flatPdfDetails.district || '';

        // EXTENT OF SITE FIELDS
        nested.extentOfSiteSaleDeed = flatPdfDetails.extentOfSiteSaleDeed || '';
        nested.extentOfSiteApprovedPlan = flatPdfDetails.extentOfSiteApprovedPlan || '';
        nested.extentOfSiteTaxBill = flatPdfDetails.extentOfSiteTaxBill || '';
        nested.extentOfSiteForValuation = flatPdfDetails.extentOfSiteForValuation || '';

        // FLAT OCCUPANCY & DETAILS FIELDS
        nested.floorSpaceIndex = flatPdfDetails.floorSpaceIndex || '';
        nested.occupancyType = flatPdfDetails.occupancyType || '';
        nested.monthlyRent = flatPdfDetails.monthlyRent || '';

        // valuationHeader
        nested.valuationHeader = {
            applicant: flatPdfDetails.applicant || '',
            valuationDoneBy: flatPdfDetails.valuationDoneBy || '',
            purposeForValuation: flatPdfDetails.purposeForValuation || '',
            dateOfInspection: flatPdfDetails.dateOfInspection || '',
            dateOfValuation: flatPdfDetails.dateOfValuation || ''
        };

        // propertyOwnerDetails
        nested.propertyOwnerDetails = {
            nameOfOwner: flatPdfDetails.nameOfOwner || '',
            ownerAddress: flatPdfDetails.ownerAddress || ''
        };

        // propertyDescription
        nested.propertyDescription = {
            briefDescriptionOfProperty: flatPdfDetails.briefDescriptionOfProperty || '',
            locationOfProperty: flatPdfDetails.locationOfProperty || '',
            googleMapCoordinates: flatPdfDetails.googleMapCoordinates || '',
            otherCommentsByValuers: flatPdfDetails.otherCommentsByValuers || ''
        };

        // locationDetails
        nested.locationDetails = {
            plotNoSurveyNo: flatPdfDetails.plotNoSurveyNo || '',
            doorNo: flatPdfDetails.doorNo || '',
            tsNoVillage: flatPdfDetails.tsNoVillage || '',
            wardTaluka: flatPdfDetails.wardTaluka || '',
            mandalDistrict: flatPdfDetails.mandalDistrict || ''
        };

        // approvedMapDetails
        nested.approvedMapDetails = {
            dateOfIssueAndValidity: flatPdfDetails.dateOfIssueAndValidity || '',
            approvedMapIssuingAuthority: flatPdfDetails.approvedMapIssuingAuthority || '',
            genuinessOfApprovedMap: flatPdfDetails.genuinessOfApprovedMap || ''
        };

        // areaAndLocationDetails
        nested.areaAndLocationDetails = {
            postalAddress: flatPdfDetails.postalAddress || '',
            cityTown: flatPdfDetails.cityTown || '',
            residentialArea: flatPdfDetails.residentialArea || '',
            commercialArea: flatPdfDetails.commercialArea || '',
            industrialArea: flatPdfDetails.industrialArea || '',
            corporationLimit: flatPdfDetails.corporationLimit || '',
            stateGovernmentEnactments: flatPdfDetails.stateGovernmentEnactments || '',
            areaClassification: {
                highMiddlePoor: flatPdfDetails.areaClassificationHighMiddlePoor || '',
                urbanSemiUrbanRural: flatPdfDetails.areaClassificationUrbanSemiUrbanRural || ''
            }
        };

        // siteDetails
        nested.siteDetails = {
            extentOfSiteForValuation: flatPdfDetails.extentOfSiteForValuation || '',
            occupancyStatus: flatPdfDetails.occupancyStatus || '',
            rentReceivedPerMonth: flatPdfDetails.rentReceivedPerMonth || '',
            boundaries: {
                east: {
                    saleDeed: flatPdfDetails.boundaryDeedEast || flatPdfDetails.boundariesEastSaleDeed || '',
                    siteVisit: flatPdfDetails.boundarySiteEast || flatPdfDetails.boundaryVisitEast || flatPdfDetails.boundariesEastSiteVisit || ''
                },
                west: {
                    saleDeed: flatPdfDetails.boundaryDeedWest || flatPdfDetails.boundariesWestSaleDeed || '',
                    siteVisit: flatPdfDetails.boundarySiteWest || flatPdfDetails.boundaryVisitWest || flatPdfDetails.boundariesWestSiteVisit || ''
                },
                north: {
                    saleDeed: flatPdfDetails.boundaryDeedNorth || flatPdfDetails.boundariesNorthSaleDeed || '',
                    siteVisit: flatPdfDetails.boundarySiteNorth || flatPdfDetails.boundaryVisitNorth || flatPdfDetails.boundariesNorthSiteVisit || ''
                },
                south: {
                    saleDeed: flatPdfDetails.boundaryDeedSouth || flatPdfDetails.boundariesSouthSaleDeed || '',
                    siteVisit: flatPdfDetails.boundarySiteSouth || flatPdfDetails.boundaryVisitSouth || flatPdfDetails.boundariesSouthSiteVisit || ''
                }
            },
            dimensions: {
                east: {
                    deed: flatPdfDetails.dimensionsDeedEast || flatPdfDetails.dimensionsEastDeed || '',
                    actual: flatPdfDetails.dimensionsPlanEast || flatPdfDetails.dimensionsEastActual || ''
                },
                west: {
                    deed: flatPdfDetails.dimensionsDeedWest || flatPdfDetails.dimensionsWestDeed || '',
                    actual: flatPdfDetails.dimensionsPlanWest || flatPdfDetails.dimensionsWestActual || ''
                },
                north: {
                    deed: flatPdfDetails.dimensionsDeedNorth || flatPdfDetails.dimensionsNorthDeed || '',
                    actual: flatPdfDetails.dimensionsPlanNorth || flatPdfDetails.dimensionsNorthActual || ''
                },
                south: {
                    deed: flatPdfDetails.dimensionsDeedSouth || flatPdfDetails.dimensionsSouthDeed || '',
                    actual: flatPdfDetails.dimensionsPlanSouth || flatPdfDetails.dimensionsSouthActual || ''
                }
            },
            extentOfSite: {
                saleDeed: flatPdfDetails.extentOfSiteSaleDeed || '',
                approvedPlan: flatPdfDetails.extentOfSiteApprovedPlan || '',
                taxBill: flatPdfDetails.extentOfSiteTaxBill || ''
            }
        };

        // buildingAndProperty
        nested.buildingAndProperty = {
            apartmentBuilding: {
                natureOfApartment: flatPdfDetails.natureOfApartment || '',
                descriptionOfLocality: flatPdfDetails.descriptionOfLocality || '',
                yearOfConstruction: flatPdfDetails.yearOfConstruction || '',
                numberOfFloors: flatPdfDetails.numberOfFloors || '',
                typeOfStructure: flatPdfDetails.typeOfStructure || '',
                numberOfDwellingUnits: flatPdfDetails.numberOfDwellingUnits || '',
                qualityOfConstruction: flatPdfDetails.qualityOfConstruction || '',
                appearanceOfBuilding: flatPdfDetails.appearanceOfBuilding || '',
                maintenanceOfBuilding: flatPdfDetails.maintenanceOfBuilding || '',
                location: {
                    tsNo: flatPdfDetails.apartmentLocationTsNo || '',
                    blockNo: flatPdfDetails.apartmentLocationBlockNo || '',
                    wardNo: flatPdfDetails.apartmentLocationWardNo || '',
                    villageOrMunicipalityOrCorporation: flatPdfDetails.apartmentLocationVillageOrMunicipalityOrCorporation || '',
                    doorNoStreetOrRoad: flatPdfDetails.apartmentLocationDoorNoStreetOrRoad || '',
                    pinCode: flatPdfDetails.apartmentLocationPinCode || ''
                },
                facilitiesAvailable: {
                    lift: flatPdfDetails.facilitiesLift || '',
                    protectedWaterSupply: flatPdfDetails.facilitiesProtectedWaterSupply || '',
                    undergroundSewerage: flatPdfDetails.facilitiesUndergroundSewerage || '',
                    carParking: flatPdfDetails.facilitiesCarParking || '',
                    compoundWall: flatPdfDetails.facilitiesCompoundWall || '',
                    pavementAroundBuilding: flatPdfDetails.facilitiesPavementAroundBuilding || ''
                }
            },
            flatDetails: {
                floorNumber: flatPdfDetails.flatDetailsFloorNumber || '',
                doorNo: flatPdfDetails.flatDetailsDoorNo || '',
                electricityServiceConnectionNo: flatPdfDetails.flatDetailsElectricityServiceConnectionNo || '',
                maintenanceOfUnit: flatPdfDetails.flatDetailsMaintenanceOfUnit || '',
                conveyanceDeedExecutedInNameOf: flatPdfDetails.flatDetailsConveyanceDeedExecutedInNameOf || '',
                undividedAreaOfLand: flatPdfDetails.flatDetailsUndividedAreaOfLand || '',
                plinthArea: flatPdfDetails.flatDetailsPlinthArea || '',
                floorSpaceIndex: flatPdfDetails.flatDetailsFloorSpaceIndex || '',
                carpetArea: flatPdfDetails.flatDetailsCarpetArea || '',
                classification: flatPdfDetails.flatDetailsClassification || '',
                purposeOfUse: flatPdfDetails.flatDetailsPurposeOfUse || '',
                occupancyType: flatPdfDetails.flatDetailsOccupancyType || '',
                monthlyRent: flatPdfDetails.flatDetailsMonthlyRent || '',
                specifications: {
                    roof: flatPdfDetails.flatDetailsSpecificationsRoof || '',
                    flooring: flatPdfDetails.flatDetailsSpecificationsFlooring || '',
                    doors: flatPdfDetails.flatDetailsSpecificationsDoors || '',
                    windows: flatPdfDetails.flatDetailsSpecificationsWindows || '',
                    fittings: flatPdfDetails.flatDetailsSpecificationsFittings || '',
                    finishing: flatPdfDetails.flatDetailsSpecificationsFinishing || ''
                },
                houseTaxDetails: {
                    houseTax: flatPdfDetails.flatDetailsHouseTaxDetailsHouseTax || '',
                    assessmentNo: flatPdfDetails.flatDetailsHouseTaxDetailsAssessmentNo || '',
                    taxPaidInNameOf: flatPdfDetails.flatDetailsHouseTaxDetailsTaxPaidInNameOf || '',
                    taxAmount: flatPdfDetails.flatDetailsHouseTaxDetailsTaxAmount || ''
                }
            }
        };

        // propertyAnalysis
        nested.propertyAnalysis = {
            marketability: flatPdfDetails.propertyAnalysisMarketability || '',
            extraPotentialValueFactors: flatPdfDetails.propertyAnalysisExtraPotentialValueFactors || '',
            negativeFactorsObserved: flatPdfDetails.propertyAnalysisNegativeFactorsObserved || ''
        };

        // rateAnalysis
        nested.rateAnalysis = {
            compositeRateAnalysis: flatPdfDetails.rateAnalysisCompositeRateAnalysis || '',
            adoptedCompositeRate: flatPdfDetails.rateAnalysisAdoptedCompositeRate || '',
            guidelineRate: flatPdfDetails.rateAnalysisGuidelineRate || '',
            rateBreakup: {
                buildingServices: flatPdfDetails.rateAnalysisRateBreakupBuildingServices || '',
                landOthers: flatPdfDetails.rateAnalysisRateBreakupLandOthers || ''
            }
        };

        // valuationComputation
        nested.valuationComputation = {
            totalValueFromValuation: flatPdfDetails.totalValueFromValuation || '',
            jantriValueDetails: {
                jantriValue: flatPdfDetails.jantriValueDetailsJantriValue || '',
                guideline: flatPdfDetails.jantriValueDetailsGuideline || '',
                glrMultiplier: flatPdfDetails.jantriValueDetailsGlrMultiplier || '',
                calculatedValue: flatPdfDetails.jantriValueDetailsCalculatedValue || '',
                details: flatPdfDetails.jantriValueDetailsDetails || ''
            },
            depreciationDetails: {
                deprecatedBuildingRate: flatPdfDetails.depreciationDetailsDeprecatedBuildingRate || '',
                replacementCostOfFlatWithServices: flatPdfDetails.depreciationDetailsReplacementCostOfFlatWithServices || '',
                ageOfBuilding: flatPdfDetails.depreciationDetailsAgeOfBuilding || '',
                lifeOfBuildingEstimated: flatPdfDetails.depreciationDetailsLifeOfBuildingEstimated || '',
                depreciationPercentage: flatPdfDetails.depreciationDetailsDepreciationPercentage || '',
                depreciatedRatioOfBuilding: flatPdfDetails.depreciationDetailsDepreciatedRatioOfBuilding || '',
                totalCompositeRateArrived: flatPdfDetails.depreciationDetailsTotalCompositeRateArrived || '',
                deprecatedBuildingRateV1: flatPdfDetails.depreciationDetailsDeprecatedBuildingRateV1 || '',
                rateForLandAndOther: flatPdfDetails.depreciationDetailsRateForLandAndOther || '',
                totalCompositeRate: flatPdfDetails.depreciationDetailsTotalCompositeRate || ''
            },
            valuationDetails: flatPdfDetails.valuationDetailsArray || [],
            valuationSummary: {
                marketValue: flatPdfDetails.marketValue || '',
                marketValueInWords: flatPdfDetails.marketValueInWords || '',
                realisableValue: flatPdfDetails.realisableValue || '',
                realisableValueInWords: flatPdfDetails.realisableValueInWords || '',
                distressValue: flatPdfDetails.distressValue || '',
                distressValueInWords: flatPdfDetails.distressValueInWords || '',
                insurableValue: flatPdfDetails.insurableValue || '',
                insurableValueInWords: flatPdfDetails.insurableValueInWords || '',
                jantriValue: flatPdfDetails.jantriValue || '',
                jantriValueInWords: flatPdfDetails.jantriValueInWords || ''
            }
        };

        // documentation
        nested.documentation = {
            documents: {
                saleDeed: flatPdfDetails.documentsDocSaleDeed || '',
                approvedPlan: flatPdfDetails.documentsApprovedPlan || '',
                buPermission: flatPdfDetails.documentsBuPermission || '',
                constructionPermission: flatPdfDetails.documentsConstructionPermission || '',
                naLetter: flatPdfDetails.documentsNaLetter || '',
                tcr: flatPdfDetails.documentsTcr || '',
                taxBill: flatPdfDetails.documentsTaxBill || ''
            },
            documentChecklist: {
                engagementLetterConfirmation: flatPdfDetails.documentChecklistEngagementLetterConfirmation || '',
                ownershipDocumentsSaleDeedConveyance: flatPdfDetails.documentChecklistOwnershipDocumentsSaleDeedConveyance || '',
                advTcrLsr: flatPdfDetails.documentChecklistAdvTcrLsr || '',
                agreementForSaleBanaKhat: flatPdfDetails.documentChecklistAgreementForSaleBanaKhat || '',
                propertyCard: flatPdfDetails.documentChecklistPropertyCard || '',
                mortgageDeed: flatPdfDetails.documentChecklistMortgageDeed || '',
                leaseDeed: flatPdfDetails.documentChecklistLeaseDeed || '',
                indexMinusTwo: flatPdfDetails.documentChecklistIndexMinusTwo || '',
                vfSevenTwelveInCaseOfLand: flatPdfDetails.documentChecklistVfSevenTwelveInCaseOfLand || '',
                naOrder: flatPdfDetails.documentChecklistNaOrder || '',
                approvedLayoutPlan: flatPdfDetails.documentChecklistApprovedLayoutPlan || '',
                commencementLetter: flatPdfDetails.documentChecklistCommencementLetter || '',
                buPermission: flatPdfDetails.documentChecklistBuPermission || '',
                eleMeterPhoto: flatPdfDetails.documentChecklistEleMeterPhoto || '',
                lightBill: flatPdfDetails.documentChecklistLightBill || '',
                muniTaxBill: flatPdfDetails.documentChecklistMuniTaxBill || '',
                numberingFlatBungalowPlotNo: flatPdfDetails.documentChecklistNumberingFlatBungalowPlotNo || '',
                boundariesOfPropertyProperDemarcation: flatPdfDetails.documentChecklistBoundariesOfPropertyProperDemarcation || '',
                mergedProperty: flatPdfDetails.documentChecklistMergedProperty || '',
                premiseCanBeSeparatedAndEntrance: flatPdfDetails.documentChecklistPremiseCanBeSeparatedAndEntrance || '',
                landIsLocked: flatPdfDetails.documentChecklistLandIsLocked || '',
                propertyIsRentedToOtherParty: flatPdfDetails.documentChecklistPropertyIsRentedToOtherParty || '',
                ifRentedRentAgreementProvided: flatPdfDetails.documentChecklistIfRentedRentAgreementProvided || '',
                siteVisitPhotos: flatPdfDetails.documentChecklistSiteVisitPhotos || '',
                selfieWithOwnerIdentifier: flatPdfDetails.documentChecklistSelfieWithOwnerIdentifier || '',
                mobileNo: flatPdfDetails.documentChecklistMobileNo || '',
                dataSheet: flatPdfDetails.documentChecklistDataSheet || '',
                tentativeRate: flatPdfDetails.documentChecklistTentativeRate || '',
                saleInstanceLocalInquiryVerbalSurvey: flatPdfDetails.documentChecklistSaleInstanceLocalInquiryVerbalSurvey || '',
                brokerRecording: flatPdfDetails.documentChecklistBrokerRecording || '',
                pastValuationRate: flatPdfDetails.documentChecklistPastValuationRate || ''
            },
            declarationDetails: {
                valuationReportDate: flatPdfDetails.declarationDetailsValuationReportDate || '',
                informationFurnished: flatPdfDetails.declarationDetailsInformationFurnished || '',
                impartialValuation: flatPdfDetails.declarationDetailsImpartialValuation || '',
                propertyInspectionDate: flatPdfDetails.declarationDetailsPropertyInspectionDate || '',
                subContractingStatement: flatPdfDetails.declarationDetailsSubContractingStatement || '',
                yearsAfterValuation: flatPdfDetails.declarationDetailsYearsAfterValuation || ''
            }
        };

        // approvalAndCertification
        nested.approvalAndCertification = {
            signatureDetails: {
                valuersName: flatPdfDetails.signatureDetailsValuersName || '',
                valuersDesignation: flatPdfDetails.signatureDetailsValuersDesignation || '',
                valuersDate: flatPdfDetails.signatureDetailsValuersDate || '',
                valuersPlace: flatPdfDetails.signatureDetailsValuersPlace || '',
                valuersSignature: flatPdfDetails.signatureDetailsValuersSignature || '',
                branchManagerName: flatPdfDetails.signatureDetailsBranchManagerName || '',
                branchManagerDate: flatPdfDetails.signatureDetailsBranchManagerDate || '',
                branchManagerPlace: flatPdfDetails.signatureDetailsBranchManagerPlace || '',
                branchManagerSignature: flatPdfDetails.signatureDetailsBranchManagerSignature || ''
            },
            certificationDetails: {
                inspectionDate: flatPdfDetails.certificationDetailsInspectionDate || '',
                reportDate: flatPdfDetails.certificationDetailsReportDate || '',
                certificateStatement: flatPdfDetails.certificationDetailsCertificateStatement || '',
                fairMarketValue: flatPdfDetails.certificationDetailsFairMarketValue || '',
                fairMarketValueInWords: flatPdfDetails.certificationDetailsFairMarketValueInWords || ''
            }
        };

        // constructionDetails
        nested.constructionDetails = {
            constructionArea: flatPdfDetails.constructionArea || '',
            constructionAreaValue: flatPdfDetails.constructionAreaValue || '',
            revenueDetails: flatPdfDetails.revenueDetails || ''
        };

        // appointmentAndDates
        nested.appointmentAndDates = {
            dateOfAppointment: flatPdfDetails.dateOfAppointment || '',
            dateOfVisit: flatPdfDetails.dateOfVisit || '',
            dateOfReport: flatPdfDetails.dateOfReport || ''
        };

        return nested;
    };

    const flattenPdfDetails = (nestedPdfDetails) => {
        if (!nestedPdfDetails || typeof nestedPdfDetails !== 'object') {
            return {};
        }

        const flattened = {};

        // If pdfDetails is already flat (has applicant field directly), return as is
        if (nestedPdfDetails.applicant !== undefined && !nestedPdfDetails.valuationHeader) {
            return { ...nestedPdfDetails };
        }

        // EXTRA FIELDS - Copy as-is (not part of schema, but needed for form)
        flattened.accountName = nestedPdfDetails.accountName || '';
        flattened.client = nestedPdfDetails.client || '';
        flattened.typeOfProperty = nestedPdfDetails.typeOfProperty || '';
        flattened.propertyDetailsLocation = nestedPdfDetails.propertyDetailsLocation || '';
        flattened.valuationDoneByApproved = nestedPdfDetails.valuationDoneByApproved || '';
        flattened.purposeOfValuationIntro = nestedPdfDetails.purposeOfValuationIntro || '';
        flattened.nameOfOwnerValuation = nestedPdfDetails.nameOfOwnerValuation || '';
        flattened.addressPropertyValuation = nestedPdfDetails.addressPropertyValuation || '';
        flattened.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments = nestedPdfDetails.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments || '';
        flattened.areaOfLand = nestedPdfDetails.areaOfLand || '';
        flattened.valueOfConstruction = nestedPdfDetails.valueOfConstruction || '';
        flattened.totalMarketValueOfTheProperty = nestedPdfDetails.totalMarketValueOfTheProperty || '';
        flattened.realizableValue = nestedPdfDetails.realizableValue || '';
        flattened.dateOfInspectionOfProperty = nestedPdfDetails.dateOfInspectionOfProperty || '';
        flattened.dateOfValuationReport = nestedPdfDetails.dateOfValuationReport || '';
        flattened.docSaleDeed = nestedPdfDetails.docSaleDeed || '';
        flattened.docBuildingPlanApproval = nestedPdfDetails.docBuildingPlanApproval || '';
        flattened.docPowerOfAttorney = nestedPdfDetails.docPowerOfAttorney || '';
        flattened.docConstructionPermission = nestedPdfDetails.docConstructionPermission || '';
        flattened.docNALetter = nestedPdfDetails.docNALetter || '';
        flattened.docTCR = nestedPdfDetails.docTCR || '';
        flattened.docPropertyTax = nestedPdfDetails.docPropertyTax || '';
        flattened.nameAddressOfManager = nestedPdfDetails.nameAddressOfManager || '';
        flattened.plotNoRevenueNo = nestedPdfDetails.plotNoRevenueNo || '';
        flattened.doorNumber = nestedPdfDetails.doorNumber || '';
        flattened.villageOrTalukSubRegisterBlock = nestedPdfDetails.villageOrTalukSubRegisterBlock || '';
        flattened.dateOfIssueValidity = nestedPdfDetails.dateOfIssueValidity || '';
        flattened.approvedMapPlan = nestedPdfDetails.approvedMapPlan || '';
        flattened.approvedMapPlanAuthority = nestedPdfDetails.approvedMapPlanAuthority || '';
        flattened.genuinenessVerified = nestedPdfDetails.genuinenessVerified || '';
        flattened.otherComments = nestedPdfDetails.otherComments || '';
        flattened.cityTown = nestedPdfDetails.cityTown || '';
        flattened.saleableArea = nestedPdfDetails.saleableArea || '';
        flattened.siteAreaForValuation = nestedPdfDetails.siteAreaForValuation || '';
        flattened.constructionType = nestedPdfDetails.constructionType || '';
        flattened.tsNo = nestedPdfDetails.tsNo || '';
        flattened.blockNo = nestedPdfDetails.blockNo || '';
        flattened.wardNo = nestedPdfDetails.wardNo || '';
        flattened.villageOrMunicipality = nestedPdfDetails.villageOrMunicipality || '';
        flattened.doorNoStreetRoadPinCode = nestedPdfDetails.doorNoStreetRoadPinCode || '';
        flattened.localityDescription = nestedPdfDetails.localityDescription || '';
        flattened.buildingAge = nestedPdfDetails.buildingAge || '';
        flattened.structureType = nestedPdfDetails.structureType || '';
        flattened.dwellingUnits = nestedPdfDetails.dwellingUnits || '';
        flattened.constructionQuality = nestedPdfDetails.constructionQuality || '';
        flattened.buildingAppearance = nestedPdfDetails.buildingAppearance || '';
        flattened.maintenanceStatus = nestedPdfDetails.maintenanceStatus || '';
        flattened.hasLift = nestedPdfDetails.hasLift || '';
        flattened.hasWaterSupply = nestedPdfDetails.hasWaterSupply || '';
        flattened.hasSewerage = nestedPdfDetails.hasSewerage || '';
        flattened.hasCarParking = nestedPdfDetails.hasCarParking || '';
        flattened.hasCompoundWall = nestedPdfDetails.hasCompoundWall || '';
        flattened.hasPavement = nestedPdfDetails.hasPavement || '';
        flattened.flatLocation = nestedPdfDetails.flatLocation || '';
        flattened.flatDoorNumber = nestedPdfDetails.flatDoorNumber || '';
        flattened.specRoof = nestedPdfDetails.specRoof || '';
        flattened.specFlooring = nestedPdfDetails.specFlooring || '';
        flattened.specDoors = nestedPdfDetails.specDoors || '';
        flattened.specWindows = nestedPdfDetails.specWindows || '';
        flattened.specFittings = nestedPdfDetails.specFittings || '';
        flattened.specFinishing = nestedPdfDetails.specFinishing || '';
        flattened.taxAssessmentNo = nestedPdfDetails.taxAssessmentNo || '';
        flattened.taxPaidName = nestedPdfDetails.taxPaidName || '';
        flattened.taxAmount = nestedPdfDetails.taxAmount || '';
        flattened.electricityConnectionNo = nestedPdfDetails.electricityConnectionNo || '';
        flattened.unitMaintenance = nestedPdfDetails.unitMaintenance || '';
        flattened.conveyanceDeedName = nestedPdfDetails.conveyanceDeedName || '';
        flattened.undividedLandArea = nestedPdfDetails.undividedLandArea || '';
        flattened.flatPlinthArea = nestedPdfDetails.flatPlinthArea || '';
        flattened.carpetAreaFlat = nestedPdfDetails.carpetAreaFlat || '';
        flattened.flatClass = nestedPdfDetails.flatClass || '';
        flattened.usagePurpose = nestedPdfDetails.usagePurpose || '';
        flattened.marketabilityLocational = nestedPdfDetails.marketabilityLocational || '';
        flattened.marketabilityScarcity = nestedPdfDetails.marketabilityScarcity || '';
        flattened.marketabilityDemandSupply = nestedPdfDetails.marketabilityDemandSupply || '';
        flattened.compositeDepreciatedBuildingRate = nestedPdfDetails.compositeDepreciatedBuildingRate || '';
        flattened.compositeReplacementCost = nestedPdfDetails.compositeReplacementCost || '';
        flattened.compositeAgeOfBuilding = nestedPdfDetails.compositeAgeOfBuilding || '';
        flattened.compositeLifeOfBuilding = nestedPdfDetails.compositeLifeOfBuilding || '';
        flattened.compositeDepreciationPercentage = nestedPdfDetails.compositeDepreciationPercentage || '';
        flattened.compositeDepreciatedRatio = nestedPdfDetails.compositeDepreciatedRatio || '';
        flattened.compositeTotalRateForValuation = nestedPdfDetails.compositeTotalRateForValuation || '';
        flattened.compositeDepreciatedBuildingRateVI = nestedPdfDetails.compositeDepreciatedBuildingRateVI || '';
        flattened.compositeRateForLand = nestedPdfDetails.compositeRateForLand || '';
        flattened.compositeTotalCompositeRate = nestedPdfDetails.compositeTotalCompositeRate || '';
        flattened.presentValueQty = nestedPdfDetails.presentValueQty || '';
        flattened.presentValueRate = nestedPdfDetails.presentValueRate || '';
        flattened.presentValue = nestedPdfDetails.presentValue || '';

        // DETAILS OF VALUATION FIELDS
        flattened.wardrobes = nestedPdfDetails.wardrobes || '';
        flattened.wardrobesRate = nestedPdfDetails.wardrobesRate || '';
        flattened.wardrobesValue = nestedPdfDetails.wardrobesValue || '';
        flattened.showcases = nestedPdfDetails.showcases || '';
        flattened.showcasesRate = nestedPdfDetails.showcasesRate || '';
        flattened.showcasesValue = nestedPdfDetails.showcasesValue || '';
        flattened.kitchenArrangements = nestedPdfDetails.kitchenArrangements || '';
        flattened.kitchenRate = nestedPdfDetails.kitchenRate || '';
        flattened.kitchenValue = nestedPdfDetails.kitchenValue || '';
        flattened.superfineFinish = nestedPdfDetails.superfineFinish || '';
        flattened.finishRate = nestedPdfDetails.finishRate || '';
        flattened.finishValue = nestedPdfDetails.finishValue || '';
        flattened.interiorDecorations = nestedPdfDetails.interiorDecorations || '';
        flattened.decorationRate = nestedPdfDetails.decorationRate || '';
        flattened.decorationValue = nestedPdfDetails.decorationValue || '';
        flattened.electricityDeposits = nestedPdfDetails.electricityDeposits || '';
        flattened.electricityRate = nestedPdfDetails.electricityRate || '';
        flattened.electricityValue = nestedPdfDetails.electricityValue || '';
        flattened.grillWorks = nestedPdfDetails.grillWorks || '';
        flattened.grillRate = nestedPdfDetails.grillRate || '';
        flattened.grillValue = nestedPdfDetails.grillValue || '';
        flattened.potentialValue = nestedPdfDetails.potentialValue || '';
        flattened.potentialRate = nestedPdfDetails.potentialRate || '';
        flattened.potentialValueAmount = nestedPdfDetails.potentialValueAmount || '';
        flattened.valuationTotalValue = nestedPdfDetails.valuationTotalValue || '';

        // AREA CLASSIFICATION FIELDS
        flattened.residentialArea = nestedPdfDetails.residentialArea || '';
        flattened.commercialArea = nestedPdfDetails.commercialArea || '';
        flattened.industrialArea = nestedPdfDetails.industrialArea || '';
        flattened.areaGrade = nestedPdfDetails.areaGrade || '';
        flattened.areaType = nestedPdfDetails.areaType || '';
        flattened.areaClassificationHighMiddlePoor = nestedPdfDetails.areaClassificationHighMiddlePoor || '';
        flattened.areaClassificationUrbanSemiUrbanRural = nestedPdfDetails.areaClassificationUrbanSemiUrbanRural || '';
        flattened.governanceType = nestedPdfDetails.governanceType || '';
        flattened.governmentEnactments = nestedPdfDetails.governmentEnactments || '';
        flattened.corporationLimit = nestedPdfDetails.corporationLimit || '';
        flattened.stateGovernmentEnactments = nestedPdfDetails.stateGovernmentEnactments || '';

        // LOCATION DETAILS FIELDS
        flattened.locationOfProperty = nestedPdfDetails.locationOfProperty || '';
        flattened.wardTaluka = nestedPdfDetails.wardTaluka || '';
        flattened.district = nestedPdfDetails.district || '';

        // EXTENT OF SITE FIELDS
        flattened.extentOfSiteSaleDeed = nestedPdfDetails.extentOfSiteSaleDeed || '';
        flattened.extentOfSiteApprovedPlan = nestedPdfDetails.extentOfSiteApprovedPlan || '';
        flattened.extentOfSiteTaxBill = nestedPdfDetails.extentOfSiteTaxBill || '';
        flattened.extentOfSiteForValuation = nestedPdfDetails.extentOfSiteForValuation || '';

        // FLAT OCCUPANCY & DETAILS FIELDS
        flattened.floorSpaceIndex = nestedPdfDetails.floorSpaceIndex || '';
        flattened.occupancyType = nestedPdfDetails.occupancyType || '';
        flattened.monthlyRent = nestedPdfDetails.monthlyRent || '';

        // FLATTEN NEW NESTED SCHEMA STRUCTURE FROM DATABASE
        // valuationHeader
        if (nestedPdfDetails.valuationHeader) {
            flattened.applicant = nestedPdfDetails.valuationHeader.applicant || '';
            flattened.valuationDoneBy = nestedPdfDetails.valuationHeader.valuationDoneBy || '';
            flattened.purposeForValuation = nestedPdfDetails.valuationHeader.purposeForValuation || '';
            flattened.dateOfInspection = nestedPdfDetails.valuationHeader.dateOfInspection || '';
            flattened.dateOfValuation = nestedPdfDetails.valuationHeader.dateOfValuation || '';
        }

        // propertyOwnerDetails
        if (nestedPdfDetails.propertyOwnerDetails) {
            flattened.nameOfOwner = nestedPdfDetails.propertyOwnerDetails.nameOfOwner || '';
            flattened.ownerAddress = nestedPdfDetails.propertyOwnerDetails.ownerAddress || '';
        }

        // propertyDescription
        if (nestedPdfDetails.propertyDescription) {
            flattened.briefDescriptionOfProperty = nestedPdfDetails.propertyDescription.briefDescriptionOfProperty || '';
            flattened.locationOfProperty = nestedPdfDetails.propertyDescription.locationOfProperty || '';
            flattened.googleMapCoordinates = nestedPdfDetails.propertyDescription.googleMapCoordinates || '';
            flattened.otherCommentsByValuers = nestedPdfDetails.propertyDescription.otherCommentsByValuers || '';
        }

        // locationDetails
        if (nestedPdfDetails.locationDetails) {
            flattened.plotNoSurveyNo = nestedPdfDetails.locationDetails.plotNoSurveyNo || '';
            flattened.doorNo = nestedPdfDetails.locationDetails.doorNo || '';
            flattened.tsNoVillage = nestedPdfDetails.locationDetails.tsNoVillage || '';
            flattened.wardTaluka = nestedPdfDetails.locationDetails.wardTaluka || '';
            flattened.mandalDistrict = nestedPdfDetails.locationDetails.mandalDistrict || '';
        }

        // approvedMapDetails
        if (nestedPdfDetails.approvedMapDetails) {
            flattened.dateOfIssueAndValidity = nestedPdfDetails.approvedMapDetails.dateOfIssueAndValidity || '';
            flattened.approvedMapIssuingAuthority = nestedPdfDetails.approvedMapDetails.approvedMapIssuingAuthority || '';
            flattened.genuinessOfApprovedMap = nestedPdfDetails.approvedMapDetails.genuinessOfApprovedMap || '';
        }

        // areaAndLocationDetails
        if (nestedPdfDetails.areaAndLocationDetails) {
            const area = nestedPdfDetails.areaAndLocationDetails;
            flattened.postalAddress = area.postalAddress || '';
            flattened.cityTown = area.cityTown || '';
            flattened.residentialArea = area.residentialArea || '';
            flattened.commercialArea = area.commercialArea || '';
            flattened.industrialArea = area.industrialArea || '';
            flattened.corporationLimit = area.corporationLimit || '';
            flattened.stateGovernmentEnactments = area.stateGovernmentEnactments || '';

            if (area.areaClassification) {
                flattened.areaClassificationHighMiddlePoor = area.areaClassification.highMiddlePoor || '';
                flattened.areaClassificationUrbanSemiUrbanRural = area.areaClassification.urbanSemiUrbanRural || '';
            }
        }

        // siteDetails
        if (nestedPdfDetails.siteDetails) {
            const site = nestedPdfDetails.siteDetails;

            // boundaries
            if (site.boundaries) {
                flattened.boundaryDeedEast = site.boundaries.east?.saleDeed || '';
                flattened.boundarySiteEast = site.boundaries.east?.siteVisit || '';
                flattened.boundaryDeedWest = site.boundaries.west?.saleDeed || '';
                flattened.boundarySiteWest = site.boundaries.west?.siteVisit || '';
                flattened.boundaryDeedNorth = site.boundaries.north?.saleDeed || '';
                flattened.boundarySiteNorth = site.boundaries.north?.siteVisit || '';
                flattened.boundaryDeedSouth = site.boundaries.south?.saleDeed || '';
                flattened.boundarySiteSouth = site.boundaries.south?.siteVisit || '';
            }

            // dimensions
            if (site.dimensions) {
                flattened.dimensionsDeedEast = site.dimensions.east?.deed || '';
                flattened.dimensionsPlanEast = site.dimensions.east?.actual || '';
                flattened.dimensionsDeedWest = site.dimensions.west?.deed || '';
                flattened.dimensionsPlanWest = site.dimensions.west?.actual || '';
                flattened.dimensionsDeedNorth = site.dimensions.north?.deed || '';
                flattened.dimensionsPlanNorth = site.dimensions.north?.actual || '';
                flattened.dimensionsDeedSouth = site.dimensions.south?.deed || '';
                flattened.dimensionsPlanSouth = site.dimensions.south?.actual || '';
            }

            // extentOfSite
            if (site.extentOfSite) {
                flattened.extentOfSiteSaleDeed = site.extentOfSite.saleDeed || '';
                flattened.extentOfSiteApprovedPlan = site.extentOfSite.approvedPlan || '';
                flattened.extentOfSiteTaxBill = site.extentOfSite.taxBill || '';
            }

            flattened.extentOfSiteForValuation = site.extentOfSiteForValuation || '';
            flattened.occupancyStatus = site.occupancyStatus || '';
            flattened.rentReceivedPerMonth = site.rentReceivedPerMonth || '';
        }

        // buildingAndProperty
        if (nestedPdfDetails.buildingAndProperty) {
            const building = nestedPdfDetails.buildingAndProperty;

            if (building.apartmentBuilding) {
                const apt = building.apartmentBuilding;
                flattened.natureOfApartment = apt.natureOfApartment || '';
                flattened.descriptionOfLocality = apt.descriptionOfLocality || '';
                flattened.yearOfConstruction = apt.yearOfConstruction || '';
                flattened.numberOfFloors = apt.numberOfFloors || '';
                flattened.typeOfStructure = apt.typeOfStructure || '';
                flattened.numberOfDwellingUnits = apt.numberOfDwellingUnits || '';
                flattened.qualityOfConstruction = apt.qualityOfConstruction || '';
                flattened.appearanceOfBuilding = apt.appearanceOfBuilding || '';
                flattened.maintenanceOfBuilding = apt.maintenanceOfBuilding || '';

                if (apt.location) {
                    flattened.apartmentLocationTsNo = apt.location.tsNo || '';
                    flattened.apartmentLocationBlockNo = apt.location.blockNo || '';
                    flattened.apartmentLocationWardNo = apt.location.wardNo || '';
                    flattened.apartmentLocationVillageOrMunicipalityOrCorporation = apt.location.villageOrMunicipalityOrCorporation || '';
                    flattened.apartmentLocationDoorNoStreetOrRoad = apt.location.doorNoStreetOrRoad || '';
                    flattened.apartmentLocationPinCode = apt.location.pinCode || '';
                }

                if (apt.facilitiesAvailable) {
                    flattened.facilitiesLift = apt.facilitiesAvailable.lift || '';
                    flattened.facilitiesProtectedWaterSupply = apt.facilitiesAvailable.protectedWaterSupply || '';
                    flattened.facilitiesUndergroundSewerage = apt.facilitiesAvailable.undergroundSewerage || '';
                    flattened.facilitiesCarParking = apt.facilitiesAvailable.carParking || '';
                    flattened.facilitiesCompoundWall = apt.facilitiesAvailable.compoundWall || '';
                    flattened.facilitiesPavementAroundBuilding = apt.facilitiesAvailable.pavementAroundBuilding || '';
                }
            }

            if (building.flatDetails) {
                const flat = building.flatDetails;
                flattened.flatDetailsFloorNumber = flat.floorNumber || '';
                flattened.flatDetailsDoorNo = flat.doorNo || '';
                flattened.flatDetailsElectricityServiceConnectionNo = flat.electricityServiceConnectionNo || '';
                flattened.flatDetailsMaintenanceOfUnit = flat.maintenanceOfUnit || '';
                flattened.flatDetailsConveyanceDeedExecutedInNameOf = flat.conveyanceDeedExecutedInNameOf || '';
                flattened.flatDetailsUndividedAreaOfLand = flat.undividedAreaOfLand || '';
                flattened.flatDetailsPlinthArea = flat.plinthArea || '';
                flattened.flatDetailsFloorSpaceIndex = flat.floorSpaceIndex || '';
                flattened.flatDetailsCarpetArea = flat.carpetArea || '';
                flattened.flatDetailsClassification = flat.classification || '';
                flattened.flatDetailsPurposeOfUse = flat.purposeOfUse || '';
                flattened.flatDetailsOccupancyType = flat.occupancyType || '';
                flattened.flatDetailsMonthlyRent = flat.monthlyRent || '';

                if (flat.specifications) {
                    flattened.flatDetailsSpecificationsRoof = flat.specifications.roof || '';
                    flattened.flatDetailsSpecificationsFlooring = flat.specifications.flooring || '';
                    flattened.flatDetailsSpecificationsDoors = flat.specifications.doors || '';
                    flattened.flatDetailsSpecificationsWindows = flat.specifications.windows || '';
                    flattened.flatDetailsSpecificationsFittings = flat.specifications.fittings || '';
                    flattened.flatDetailsSpecificationsFinishing = flat.specifications.finishing || '';
                }

                if (flat.houseTaxDetails) {
                    flattened.flatDetailsHouseTaxDetailsHouseTax = flat.houseTaxDetails.houseTax || '';
                    flattened.flatDetailsHouseTaxDetailsAssessmentNo = flat.houseTaxDetails.assessmentNo || '';
                    flattened.flatDetailsHouseTaxDetailsTaxPaidInNameOf = flat.houseTaxDetails.taxPaidInNameOf || '';
                    flattened.flatDetailsHouseTaxDetailsTaxAmount = flat.houseTaxDetails.taxAmount || '';
                }
            }
        }

        // propertyAnalysis
        if (nestedPdfDetails.propertyAnalysis) {
            const analysis = nestedPdfDetails.propertyAnalysis;
            flattened.propertyAnalysisMarketability = analysis.marketability || '';
            flattened.propertyAnalysisExtraPotentialValueFactors = analysis.extraPotentialValueFactors || '';
            flattened.propertyAnalysisNegativeFactorsObserved = analysis.negativeFactorsObserved || '';
        }

        // rateAnalysis
        if (nestedPdfDetails.rateAnalysis) {
            const rate = nestedPdfDetails.rateAnalysis;
            flattened.rateAnalysisCompositeRateAnalysis = rate.compositeRateAnalysis || '';
            flattened.rateAnalysisAdoptedCompositeRate = rate.adoptedCompositeRate || '';
            flattened.rateAnalysisGuidelineRate = rate.guidelineRate || '';

            if (rate.rateBreakup) {
                flattened.rateAnalysisRateBreakupBuildingServices = rate.rateBreakup.buildingServices || '';
                flattened.rateAnalysisRateBreakupLandOthers = rate.rateBreakup.landOthers || '';
            }
        }

        // valuationComputation
        if (nestedPdfDetails.valuationComputation) {
            const comp = nestedPdfDetails.valuationComputation;

            if (comp.jantriValueDetails) {
                flattened.jantriValueDetailsJantriValue = comp.jantriValueDetails.jantriValue || '';
                flattened.jantriValueDetailsGuideline = comp.jantriValueDetails.guideline || '';
                flattened.jantriValueDetailsGlrMultiplier = comp.jantriValueDetails.glrMultiplier || '';
                flattened.jantriValueDetailsCalculatedValue = comp.jantriValueDetails.calculatedValue || '';
                flattened.jantriValueDetailsDetails = comp.jantriValueDetails.details || '';
            }

            if (comp.depreciationDetails) {
                flattened.depreciationDetailsDeprecatedBuildingRate = comp.depreciationDetails.deprecatedBuildingRate || '';
                flattened.depreciationDetailsReplacementCostOfFlatWithServices = comp.depreciationDetails.replacementCostOfFlatWithServices || '';
                flattened.depreciationDetailsAgeOfBuilding = comp.depreciationDetails.ageOfBuilding || '';
                flattened.depreciationDetailsLifeOfBuildingEstimated = comp.depreciationDetails.lifeOfBuildingEstimated || '';
                flattened.depreciationDetailsDepreciationPercentage = comp.depreciationDetails.depreciationPercentage || '';
                flattened.depreciationDetailsDepreciatedRatioOfBuilding = comp.depreciationDetails.depreciatedRatioOfBuilding || '';
                flattened.depreciationDetailsTotalCompositeRateArrived = comp.depreciationDetails.totalCompositeRateArrived || '';
                flattened.depreciationDetailsDeprecatedBuildingRateV1 = comp.depreciationDetails.deprecatedBuildingRateV1 || '';
                flattened.depreciationDetailsRateForLandAndOther = comp.depreciationDetails.rateForLandAndOther || '';
                flattened.depreciationDetailsTotalCompositeRate = comp.depreciationDetails.totalCompositeRate || '';
            }

            if (comp.valuationSummary) {
                flattened.marketValue = comp.valuationSummary.marketValue || '';
                flattened.marketValueInWords = comp.valuationSummary.marketValueInWords || '';
                flattened.realisableValue = comp.valuationSummary.realisableValue || '';
                flattened.realisableValueInWords = comp.valuationSummary.realisableValueInWords || '';
                flattened.distressValue = comp.valuationSummary.distressValue || '';
                flattened.distressValueInWords = comp.valuationSummary.distressValueInWords || '';
                flattened.insurableValue = comp.valuationSummary.insurableValue || '';
                flattened.insurableValueInWords = comp.valuationSummary.insurableValueInWords || '';
                flattened.jantriValue = comp.valuationSummary.jantriValue || '';
                flattened.jantriValueInWords = comp.valuationSummary.jantriValueInWords || '';
            }

            flattened.valuationDetailsArray = comp.valuationDetails || [];
            flattened.totalValueFromValuation = comp.totalValueFromValuation || '';
        }

        // documentation
        if (nestedPdfDetails.documentation) {
            const docs = nestedPdfDetails.documentation;

            if (docs.documents) {
                flattened.documentsDocSaleDeed = docs.documents.saleDeed || '';
                flattened.documentsApprovedPlan = docs.documents.approvedPlan || '';
                flattened.documentsBuPermission = docs.documents.buPermission || '';
                flattened.documentsConstructionPermission = docs.documents.constructionPermission || '';
                flattened.documentsNaLetter = docs.documents.naLetter || '';
                flattened.documentsTcr = docs.documents.tcr || '';
                flattened.documentsTaxBill = docs.documents.taxBill || '';
            }

            if (docs.documentChecklist) {
                const checklist = docs.documentChecklist;
                flattened.documentChecklistEngagementLetterConfirmation = checklist.engagementLetterConfirmation || '';
                flattened.documentChecklistOwnershipDocumentsSaleDeedConveyance = checklist.ownershipDocumentsSaleDeedConveyance || '';
                flattened.documentChecklistAdvTcrLsr = checklist.advTcrLsr || '';
                flattened.documentChecklistAgreementForSaleBanaKhat = checklist.agreementForSaleBanaKhat || '';
                flattened.documentChecklistPropertyCard = checklist.propertyCard || '';
                flattened.documentChecklistMortgageDeed = checklist.mortgageDeed || '';
                flattened.documentChecklistLeaseDeed = checklist.leaseDeed || '';
                flattened.documentChecklistIndexMinusTwo = checklist.indexMinusTwo || '';
                flattened.documentChecklistVfSevenTwelveInCaseOfLand = checklist.vfSevenTwelveInCaseOfLand || '';
                flattened.documentChecklistNaOrder = checklist.naOrder || '';
                flattened.documentChecklistApprovedLayoutPlan = checklist.approvedLayoutPlan || '';
                flattened.documentChecklistCommencementLetter = checklist.commencementLetter || '';
                flattened.documentChecklistBuPermissionDoc = checklist.buPermission || '';
                flattened.documentChecklistEleMeterPhoto = checklist.eleMeterPhoto || '';
                flattened.documentChecklistLightBill = checklist.lightBill || '';
                flattened.documentChecklistMuniTaxBill = checklist.muniTaxBill || '';
                flattened.documentChecklistNumberingFlatBungalowPlotNo = checklist.numberingFlatBungalowPlotNo || '';
                flattened.documentChecklistBoundariesOfPropertyProperDemarcation = checklist.boundariesOfPropertyProperDemarcation || '';
                flattened.documentChecklistMergedProperty = checklist.mergedProperty || '';
                flattened.documentChecklistPremiseCanBeSeparatedAndEntrance = checklist.premiseCanBeSeparatedAndEntrance || '';
                flattened.documentChecklistLandIsLocked = checklist.landIsLocked || '';
                flattened.documentChecklistPropertyIsRentedToOtherParty = checklist.propertyIsRentedToOtherParty || '';
                flattened.documentChecklistIfRentedRentAgreementProvided = checklist.ifRentedRentAgreementProvided || '';
                flattened.documentChecklistSiteVisitPhotos = checklist.siteVisitPhotos || '';
                flattened.documentChecklistSelfieWithOwnerIdentifier = checklist.selfieWithOwnerIdentifier || '';
                flattened.documentChecklistMobileNo = checklist.mobileNo || '';
                flattened.documentChecklistDataSheet = checklist.dataSheet || '';
                flattened.documentChecklistTentativeRate = checklist.tentativeRate || '';
                flattened.documentChecklistSaleInstanceLocalInquiryVerbalSurvey = checklist.saleInstanceLocalInquiryVerbalSurvey || '';
                flattened.documentChecklistBrokerRecording = checklist.brokerRecording || '';
                flattened.documentChecklistPastValuationRate = checklist.pastValuationRate || '';
            }

            if (docs.declarationDetails) {
                flattened.declarationDetailsValuationReportDate = docs.declarationDetails.valuationReportDate || '';
                flattened.declarationDetailsInformationFurnished = docs.declarationDetails.informationFurnished || '';
                flattened.declarationDetailsImpartialValuation = docs.declarationDetails.impartialValuation || '';
                flattened.declarationDetailsPropertyInspectionDate = docs.declarationDetails.propertyInspectionDate || '';
                flattened.declarationDetailsSubContractingStatement = docs.declarationDetails.subContractingStatement || '';
                flattened.declarationDetailsYearsAfterValuation = docs.declarationDetails.yearsAfterValuation || '';
            }
        }

        // approvalAndCertification
        if (nestedPdfDetails.approvalAndCertification) {
            const approval = nestedPdfDetails.approvalAndCertification;

            if (approval.signatureDetails) {
                flattened.signatureDetailsValuersName = approval.signatureDetails.valuersName || '';
                flattened.signatureDetailsValuersDesignation = approval.signatureDetails.valuersDesignation || '';
                flattened.signatureDetailsValuersDate = approval.signatureDetails.valuersDate || '';
                flattened.signatureDetailsValuersPlace = approval.signatureDetails.valuersPlace || '';
                flattened.signatureDetailsValuersSignature = approval.signatureDetails.valuersSignature || '';
                flattened.signatureDetailsBranchManagerName = approval.signatureDetails.branchManagerName || '';
                flattened.signatureDetailsBranchManagerDate = approval.signatureDetails.branchManagerDate || '';
                flattened.signatureDetailsBranchManagerPlace = approval.signatureDetails.branchManagerPlace || '';
                flattened.signatureDetailsBranchManagerSignature = approval.signatureDetails.branchManagerSignature || '';
            }

            if (approval.certificationDetails) {
                flattened.certificationDetailsInspectionDate = approval.certificationDetails.inspectionDate || '';
                flattened.certificationDetailsReportDate = approval.certificationDetails.reportDate || '';
                flattened.certificationDetailsCertificateStatement = approval.certificationDetails.certificateStatement || '';
                flattened.certificationDetailsFairMarketValue = approval.certificationDetails.fairMarketValue || '';
                flattened.certificationDetailsFairMarketValueInWords = approval.certificationDetails.fairMarketValueInWords || '';
            }
        }

        // constructionDetails
        if (nestedPdfDetails.constructionDetails) {
            const construction = nestedPdfDetails.constructionDetails;
            flattened.constructionDetailsConstructionArea = construction.constructionArea || '';
            flattened.constructionDetailsConstructionAreaValue = construction.constructionAreaValue || '';
            flattened.constructionDetailsRevenueDetails = construction.revenueDetails || '';
        }

        // appointmentAndDates
        if (nestedPdfDetails.appointmentAndDates) {
            const appt = nestedPdfDetails.appointmentAndDates;
            flattened.appointmentAndDatesDateOfAppointment = appt.dateOfAppointment || '';
            flattened.appointmentAndDatesDateOfVisit = appt.dateOfVisit || '';
            flattened.appointmentAndDatesDateOfReport = appt.dateOfReport || '';
        }

        return flattened;
    };

    const mapDataToForm = (data) => {
        // Always store the actual values in state first, regardless of whether they're in the dropdown lists
        // These will be used for dropdown buttons or custom input fields
        setBankName(data.bankName || "");
        setCity(data.city || "");
        setDsa(data.dsa || "");
        setEngineerName(data.engineerName || "");

        // Load custom fields from data
        if (data.customFields && Array.isArray(data.customFields)) {
            setCustomFields(data.customFields);
        }

        setFormData(prev => {
            // Flatten nested pdfDetails structure from API response to match flat form structure
            let mergedPdfDetails = { ...prev.pdfDetails };
            if (data.pdfDetails && typeof data.pdfDetails === 'object') {
                // Check if pdfDetails is nested (has valuationHeader, etc.) or flat (has accountName, etc.)
                const flattened = flattenPdfDetails(data.pdfDetails);
                ("[mapDataToForm] Flattened pdfDetails:", {
                    originalKeys: Object.keys(data.pdfDetails).slice(0, 10),
                    flattenedKeys: Object.keys(flattened).slice(0, 10),
                    sampleFields: {
                        applicant: flattened.applicant,
                        nameOfOwner: flattened.nameOfOwner,
                        locationOfProperty: flattened.locationOfProperty
                    }
                });
                // Merge flattened structure with existing pdfDetails
                mergedPdfDetails = { ...mergedPdfDetails, ...flattened };
            }

            // Merge all data, ensuring API response values take precedence
            // This includes top-level fields like clientName, mobileNumber, address, notes, etc.
            const mergedData = {
                ...prev,
                ...data, // Spread all data fields (clientName, mobileNumber, address, notes, etc.)
                pdfDetails: mergedPdfDetails,
                checklist: data.checklist ? { ...prev.checklist, ...data.checklist } : prev.checklist
            };

            // Ensure checklist always has all fields (in case database is missing some)
            if (!mergedData.checklist) {
                mergedData.checklist = prev.checklist;
            }

            // Ensure pdfDetails exists even if data doesn't have it
            if (!mergedData.pdfDetails) {
                mergedData.pdfDetails = prev.pdfDetails;
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

            await updateRajeshFlat(id, dataToSave, user.username, user.role, user.clientId);
            invalidateCache();
            dispatch(hideLoader());
            showSuccess('Rajesh Flat form saved successfully');
        } catch (error) {
            console.error("Error saving Rajesh Flat form:", error);
            dispatch(hideLoader());
            showError('Failed to save Rajesh Flat form');
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

    // Helper function to set nested object properties
    const setNestedProperty = (obj, path, value) => {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    };

    // Helper function to get nested object properties
    const getNestedProperty = (obj, path) => {
        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
            current = current?.[key];
            if (current === undefined) return '';
        }

        return current || '';
    };

    const handleValuationChange = (field, value, section = null) => {
        setFormData(prev => {
            const newPdfDetails = JSON.parse(JSON.stringify(prev.pdfDetails));

            // Handle nested field paths (e.g., "valuationHeader.applicant")
            if (field.includes('.')) {
                setNestedProperty(newPdfDetails, field, value);
            } else if (section && newPdfDetails[section]) {
                // Handle section-based updates (e.g., section="valuationHeader", field="applicant")
                if (!newPdfDetails[section]) {
                    newPdfDetails[section] = {};
                }
                newPdfDetails[section][field] = value;
            } else {
                // Fallback for flat field paths
                newPdfDetails[field] = value;
            }

            // Auto-calculate Realizable Value (90%) and Distress Value (80%) based on Total Market Value
            if (field === 'totalMarketValueOfTheProperty') {
                const totalValue = parseFloat(value) || 0;
                if (totalValue > 0) {
                    const realisableValue = (totalValue * 90) / 100;
                    const distressValue = (totalValue * 80) / 100;
                    newPdfDetails.realizableValue = realisableValue.toString();
                    newPdfDetails.distressValue = distressValue.toString();
                }
            }

            // Auto-calculate Estimated Value = Qty × Rate for all 9 valuation items
            const items = [
                { qtyField: 'presentValueQty', rateField: 'presentValueRate', valueField: 'presentValue' },
                { qtyField: 'wardrobes', rateField: 'wardrobesRate', valueField: 'wardrobesValue' },
                { qtyField: 'showcases', rateField: 'showcasesRate', valueField: 'showcasesValue' },
                { qtyField: 'kitchenArrangements', rateField: 'kitchenRate', valueField: 'kitchenValue' },
                { qtyField: 'superfineFinish', rateField: 'finishRate', valueField: 'finishValue' },
                { qtyField: 'interiorDecorations', rateField: 'decorationRate', valueField: 'decorationValue' },
                { qtyField: 'electricityDeposits', rateField: 'electricityRate', valueField: 'electricityValue' },
                { qtyField: 'grillWorks', rateField: 'grillRate', valueField: 'grillValue' },
                { qtyField: 'potentialValue', rateField: 'potentialRate', valueField: 'potentialValueAmount' }
            ];

            // Check if the changed field is a qty or rate field and auto-calculate
            let shouldRecalculateTotal = false;
            items.forEach(item => {
                if (field === item.qtyField || field === item.rateField) {
                    const qty = parseFloat(getNestedProperty(newPdfDetails, item.qtyField)) || 0;
                    const rate = parseFloat(getNestedProperty(newPdfDetails, item.rateField)) || 0;
                    const estimatedValue = qty * rate;
                    setNestedProperty(newPdfDetails, item.valueField, estimatedValue > 0 ? estimatedValue.toString() : '');
                    shouldRecalculateTotal = true;
                }
            });

            // Auto-calculate total value from all individual valuation items
            if (shouldRecalculateTotal) {
                const totalValue = items.reduce((sum, item) => {
                    const value = parseFloat(getNestedProperty(newPdfDetails, item.valueField)) || 0;
                    return sum + value;
                }, 0);
                newPdfDetails.valuationTotalValue = totalValue > 0 ? totalValue.toString() : '';
            }

            return {
                ...prev,
                pdfDetails: newPdfDetails
            };
        });
    };

    const addCustomValuationItem = () => {
        const nextSerialNumber = 10 + customValuationItems.length;
        const newItem = {
            id: Date.now(),
            serialNumber: nextSerialNumber,
            description: '',
            qty: '',
            rate: '',
            value: ''
        };
        setCustomValuationItems(prev => [...prev, newItem]);
    };

    const removeCustomValuationItem = (id) => {
        setCustomValuationItems(prev =>
            prev.filter(item => item.id !== id).map((item, idx) => ({
                ...item,
                serialNumber: 10 + idx
            }))
        );
    };

    const updateCustomValuationItem = (id, field, value) => {
        setCustomValuationItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };
                    // Auto-calculate value when qty or rate changes
                    if (field === 'qty' || field === 'rate') {
                        const qty = parseFloat(updatedItem.qty) || 0;
                        const rate = parseFloat(updatedItem.rate) || 0;
                        updatedItem.value = qty * rate > 0 ? (qty * rate).toString() : '';
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const getCustomValuationTotal = () => {
        return customValuationItems.reduce((sum, item) => {
            const value = parseFloat(item.value) || 0;
            return sum + value;
        }, 0);
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
                                customValuationItems: customValuationItems,
                                pdfDetails: convertFlatPdfDetailsToNested(formData.pdfDetails)
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

                            // Call API to update rajesh flat
                            await updateRajeshFlat(id, payload, user.username, user.role, user.clientId);
                            invalidateCache("/rajesh-flat");

                            showSuccess('Rajesh Flat form saved successfully');
                            resolve();
                        } catch (error) {
                            console.error("Error saving Rajesh Flat form:", error);
                            showError('Failed to save Rajesh Flat form');
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

            const responseData = await managerSubmitRajeshFlat(id, statusValue, modalFeedback, user.username, user.role);

            invalidateCache("/rajesh-flat");

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
                pdfDetails: convertFlatPdfDetailsToNested(formData.pdfDetails),
                checklist: formData.checklist,
                customFields: customFields,
                customValuationItems: customValuationItems,
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
            ("[rajeshFlat.jsx] Payload being sent to API:", {
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
            const apiResponse = await updateRajeshFlat(id, payload, username, role, clientId);
            invalidateCache("/rajesh-flat");

            // Log API response for debugging
            ("[rajeshFlat.jsx] API Response received:", {
                hasPdfDetails: !!apiResponse?.pdfDetails,
                pdfDetailsKeys: apiResponse?.pdfDetails ? Object.keys(apiResponse.pdfDetails).slice(0, 5) : "none",
                hasLocationDetails: !!apiResponse?.pdfDetails?.locationDetails,
                coordinates: apiResponse?.coordinates,
                clientName: apiResponse?.clientName,
                mobileNumber: apiResponse?.mobileNumber,
                address: apiResponse?.address,
                bankName: apiResponse?.bankName,
                city: apiResponse?.city,
                notes: apiResponse?.notes
            });

            // Get the actual status from API response (server updates to on-progress on save)
            const newStatus = apiResponse?.status || "on-progress";

            // Update local state with API response - preserve all nested fields
            // IMPORTANT: API response takes precedence over payload to ensure server-confirmed values are used
            const updatedValuation = {
                ...valuation,
                ...payload, // Start with payload (what was sent)
                ...(apiResponse || {}), // Override with API response (what server confirmed)
                status: newStatus, // Use server-confirmed status
                // Preserve nested structures from API response first, fallback to payload/formData
                coordinates: apiResponse?.coordinates || payload.coordinates || formData.coordinates || { latitude: '', longitude: '' },
                directions: apiResponse?.directions || payload.directions || formData.directions || { north1: '', east1: '', south1: '', west1: '', north2: '', east2: '', south2: '', west2: '' },
                propertyImages: apiResponse?.propertyImages || payload.propertyImages || formData.propertyImages || [],
                locationImages: apiResponse?.locationImages || payload.locationImages || formData.locationImages || [],
                pdfDetails: apiResponse?.pdfDetails || payload.pdfDetails || formData.pdfDetails || {},
                checklist: apiResponse?.checklist || formData.checklist || {},
                areaImages: apiResponse?.areaImages || payload.areaImages || formData.areaImages || {},
                documentPreviews: apiResponse?.documentPreviews || payload.documentPreviews || formData.documentPreviews || [],
                lastUpdatedBy: apiResponse?.lastUpdatedBy || username,
                lastUpdatedByRole: apiResponse?.lastUpdatedByRole || role,
                lastUpdatedAt: apiResponse?.lastUpdatedAt || new Date().toISOString()
            };

            setValuation(updatedValuation);
            mapDataToForm(updatedValuation); // Ensure all data is properly mapped back to form

            // Set bank and city states - use API response values first, then fallback to payload
            // mapDataToForm will also set these from updatedValuation, ensuring consistency
            const finalBankName = apiResponse?.bankName || payload.bankName || "";
            const finalCity = apiResponse?.city || payload.city || "";
            setBankName(finalBankName);
            setCity(finalCity);

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
            {/* ===== PAGE 1-2: VALUATION REPORT SECTION ===== */}
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                    <FaFileAlt className="text-blue-600" />
                    VALUATION REPORT
                </h3>

                {/* ACCOUNT INFORMATION TABLE */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Name of A/C */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Name of A/C</Label>
                        <Input
                            placeholder="M/s. Actymo Pvt Ltd"
                            value={formData.pdfDetails?.accountName || ""}
                            onChange={(e) => handleValuationChange('accountName', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Name of Owner */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Name of Owner</Label>
                        <Input
                            placeholder="Prafullchandra Vitthalbhai Patel"
                            value={formData.pdfDetails?.nameOfOwner || ""}
                            onChange={(e) => handleValuationChange('nameOfOwner', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Client use as branch name  */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Bank Branch Name </Label>
                        <Input
                            placeholder="State Bank of India, Law Garden Branch, Ahmedabad"
                            value={formData.pdfDetails?.client || ""}
                            onChange={(e) => handleValuationChange('client', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Property Detail */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Property Detail</Label>
                        <Input
                            placeholder="Residential Flat"
                            value={formData.pdfDetails?.typeOfProperty || ""}
                            onChange={(e) => handleValuationChange('typeOfProperty', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>
                </div>

                {/* ROW 2: Location, Purpose, Date */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Location */}
                    <div className="space-y-1.5 ">
                        <Label className="text-sm font-bold text-gray-900">Location</Label>
                        <Input
                            placeholder="Location"
                            value={formData.pdfDetails?.propertyDetailsLocation || ""}
                            onChange={(e) => handleValuationChange('propertyDetailsLocation', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Purpose of Valuation */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Purpose of Valuation</Label>
                        <Input
                            placeholder="Continue Financial Assistance Purpose"
                            value={formData.pdfDetails?.purposeForValuation || ""}
                            onChange={(e) => handleValuationChange('purposeForValuation', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Date of Valuation */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Date of Valuation</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.dateOfValuation || ""}
                            onChange={(e) => handleValuationChange('dateOfValuation', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            </div>

            {/* ===== PAGE 2: VALUED PROPERTY AT A GLANCE ===== */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                    <FaDollarSign className="text-blue-600" />
                    VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE
                </h3>

                {/* ROW 1: Applicant, Valuer, Purpose, Owner */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Applicant */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Applicant</Label>
                        <Input
                            placeholder="State Bank of India, Law Garden Branch, Ahmedabad"
                            value={formData.pdfDetails?.applicant || ""}
                            onChange={(e) => handleValuationChange('applicant', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Valuation done by Govt. Approved Valuer */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Govt. Approved Valuer</Label>
                        <Input
                            placeholder="Govt. Approved Valuer & Bank's Panel Valuer"
                            value={formData.pdfDetails?.valuationDoneByApproved || ""}
                            onChange={(e) => handleValuationChange('valuationDoneByApproved', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>


                    {/* Brief description of the Property */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Description of property</Label>
                        <Input
                            placeholder="Description"
                            value={formData.pdfDetails?.briefDescriptionOfProperty || ""}
                            onChange={(e) => handleValuationChange('briefDescriptionOfProperty', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Revenue details as per Sale deed / Authenticate Documents */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Revenue Details</Label>
                        <Input
                            placeholder="R. S No. 491/P, 493/P, TPS No. 28 (Nava Vadaj), FP No. 412, Sub Plot No. 2, Flat No. H/503, At. Wadaj, Ta & Dist. Ahmedabad"
                            value={formData.pdfDetails?.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments || ""}
                            onChange={(e) => handleValuationChange('requisiteDetailsAsPerSaleDeedAuthoritiesDocuments', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Construction Area  */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Construction Area </Label>
                        <Input
                            placeholder="Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                            value={formData.pdfDetails?.areaOfLand || ""}
                            onChange={(e) => handleValuationChange('areaOfLand', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Value of Construction */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Value of Construction</Label>
                        <Input
                            placeholder="000.00 sq.mt X 000.00 = 000.00,000.00"
                            value={formData.pdfDetails?.valueOfConstruction || ""}
                            onChange={(e) => handleValuationChange('valueOfConstruction', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Total Market Value of the Property */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Total Market Value</Label>
                        <Input
                            placeholder="000.00,000/- (In words)"
                            value={formData.pdfDetails?.totalMarketValueOfTheProperty || ""}
                            onChange={(e) => handleValuationChange('totalMarketValueOfTheProperty', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* REALISABLE VALUE (90% of MV) */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Realisable Value (90%)</Label>
                        <Input
                            placeholder="000.00,000/- "
                            value={formData.pdfDetails?.realizableValue || ""}
                            onChange={(e) => handleValuationChange('realizableValue', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                        <p className="text-xs text-gray-500">Auto-calculated as 90% of Total Market Value</p>
                    </div>

                    {/* DISTRESS SALE VALUE (80% of MV) */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Distress Value (80%)</Label>
                        <Input
                            placeholder="000.00,000/- "
                            value={formData.pdfDetails?.distressValue || ""}
                            onChange={(e) => handleValuationChange('distressValue', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                        <p className="text-xs text-gray-500">Auto-calculated as 80% of Total Market Value</p>
                    </div>

                    {/* JANTRI VALUE OF PROPERTY */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Jantri Value</Label>
                        <Input
                            placeholder="000.00,000/- "
                            value={formData.pdfDetails?.jantriValue || ""}
                            onChange={(e) => handleValuationChange('jantriValue', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* INSURABLE VALUE OF THE PROPERTY */}
                    <div className="space-y-1.5">
                        <Label className="text-base font-bold text-gray-900">Insurable Value</Label>
                        <Input
                            placeholder="000.00,000/-"
                            value={formData.pdfDetails?.insurableValue || ""}
                            onChange={(e) => handleValuationChange('insurableValue', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            </div>

            {/* ===== PAGE 3: DETAILED VALUATION ===== */}
            <div className="mb-6 p-6 bg-gradient-to-r from-pink-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                    <FaFileAlt className="text-blue-600" />
                    DETAILED VALUATION
                </h3>


                {/* I. GENERAL SECTION */}
                <div className="space-y-4 mb-6">
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2">I. GENERAL</h4>

                    {/* 1 row 4 columns: Purpose, Date of Inspection, Date of Valuation, (empty) */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* 1. Purpose for which the valuation is made */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Purpose for which the valuation is made </Label>
                            <select
                                value={formData.pdfDetails?.purposeOfValuationIntro || ""}
                                onChange={(e) => handleValuationChange('purposeOfValuationIntro', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={!canEdit}
                            >
                                <option value="">Select Purpose</option>
                                <option value="Financial Assistance Purpose">Financial Assistance Purpose</option>
                                <option value="Continue Financial Assistance">Continue Financial Assistance</option>
                                <option value="Personal Purpose">Personal Purpose</option>
                                <option value="VISA Purpose">VISA Purpose</option>
                                <option value="NPA Purpose">NPA Purpose</option>
                            </select>
                        </div>

                        {/* Date of inspection */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Date of Inspection</Label>
                            <Input
                                type="date"
                                value={formData.pdfDetails?.dateOfInspectionOfProperty || ""}
                                onChange={(e) => handleValuationChange('dateOfInspectionOfProperty', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* Date on which the valuation is made */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Date of Valuation</Label>
                            <Input
                                type="date"
                                value={formData.pdfDetails?.dateOfValuationReport || ""}
                                onChange={(e) => handleValuationChange('dateOfValuationReport', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div></div>
                    </div>

                    {/* 3. List of documents produced for perusal */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-900">3. List of documents produced for perusal</Label>

                        {/* Row 1: Sale-Deed, Approved Plan, BU Permission, Construction Permission */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold text-gray-700">Sale-Deed</Label>
                                <Input
                                    placeholder="Deed No. 13204, AHD-2-VDJ, Dated: 16/10/2013"
                                    value={formData.pdfDetails?.docSaleDeed || ""}
                                    onChange={(e) => handleValuationChange('docSaleDeed', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold text-gray-700">Approved Plan</Label>
                                <Input
                                    placeholder="BHNTS/WZ/100510/P/A8059/R0/M1, Dated: 04/09/2010, Approved by AMC"
                                    value={formData.pdfDetails?.docBuildingPlanApproval || ""}
                                    onChange={(e) => handleValuationChange('docBuildingPlanApproval', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold  text-gray-700">BU Permission</Label>
                                <Input
                                    placeholder="BU/WZ/170513/0189, Dated: 24/07/2013, Approved by AMC"
                                    value={formData.pdfDetails?.docPowerOfAttorney || ""}
                                    onChange={(e) => handleValuationChange('docPowerOfAttorney', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold  text-gray-700">Construction Permission</Label>
                                <Input
                                    placeholder="17295/100510/A8059/R0/M1, Dated: 04/09/2010, Approved by AMC"
                                    value={formData.pdfDetails?.docConstructionPermission || ""}
                                    onChange={(e) => handleValuationChange('docConstructionPermission', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        {/* Row 2: NA Letter, TCR, Tax Bill, (empty) */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold  text-gray-700">NA Letter</Label>
                                <Input
                                    placeholder="CB/LAND-1/NA/SR-551/2009, Dated: 15/04/2010"
                                    value={formData.pdfDetails?.docNALetter || ""}
                                    onChange={(e) => handleValuationChange('docNALetter', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold text-gray-700">TCR</Label>
                                <Input
                                    placeholder="Hiren M. Shroff, Dated: 22/07/2024"
                                    value={formData.pdfDetails?.docTCR || ""}
                                    onChange={(e) => handleValuationChange('docTCR', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold font-bold font-boldtext-gray-700">Tax Bill</Label>
                                <Input
                                    placeholder="05301535570001F"
                                    value={formData.pdfDetails?.docPropertyTax || ""}
                                    onChange={(e) => handleValuationChange('docPropertyTax', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 1 row 4 columns: Owner Name, Description, Plot No., Door No. */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* 4. Name of the owner(s) and his / their address(es) */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Owner Name & Phone</Label>
                            <Input
                                placeholder="Owner details"
                                value={formData.pdfDetails?.nameAddressOfManager || ""}
                                onChange={(e) => handleValuationChange('nameAddressOfManager', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 5. Brief description of the property */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Property Description</Label>
                            <Input
                                placeholder="Property details"
                                value={formData.pdfDetails?.briefDescriptionOfProperty || ""}
                                onChange={(e) => handleValuationChange('briefDescriptionOfProperty', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 6. Location Details of Area Surroundings with Google Location */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">6. Location Details </Label>
                            <Input
                                placeholder=""
                                value={formData.pdfDetails?.locationOfProperty || ""}
                                onChange={(e) => handleValuationChange('locationOfProperty', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 6a) Plot No./Survey No. */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Plot No./Survey No.</Label>
                            <Input
                                placeholder="R. S No. 491/P, 493/P"
                                value={formData.pdfDetails?.plotNoRevenueNo || ""}
                                onChange={(e) => handleValuationChange('plotNoRevenueNo', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                    {/* 6b) Door No. */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Door No.</Label>
                            <Input
                                placeholder="Flat No. 503, 5th Floor"
                                value={formData.pdfDetails?.doorNumber || ""}
                                onChange={(e) => handleValuationChange('doorNumber', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 6c, 6d, 6e: Village, Ward, District */}

                        {/* c) T.S. No. / Village */}

                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">T.S. No. / Village </Label>
                            <Input
                                placeholder="Vadaj"
                                value={formData.pdfDetails?.villageOrTalukSubRegisterBlock || ""}
                                onChange={(e) => handleValuationChange('villageOrTalukSubRegisterBlock', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* d) Ward / Taluka */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Ward / Taluka</Label>
                            <Input
                                placeholder="City"
                                value={formData.pdfDetails?.wardTaluka || ""}
                                onChange={(e) => handleValuationChange('wardTaluka', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* e) Mandal / District */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">District</Label>
                            <Input
                                placeholder="Ahmedabad"
                                value={formData.pdfDetails?.district || ""}
                                onChange={(e) => handleValuationChange('district', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* f) Google Map */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Google Map </Label>
                            <Input
                                placeholder="e.g., 23.062300, 72.570135"
                                value={formData.pdfDetails?.googleMapCoordinates || ""}
                                onChange={(e) => handleValuationChange('googleMapCoordinates', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* g) Date of issue / Validity */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Date of Issue / Validity of Layout</Label>
                            <Input
                                placeholder="e.g., 04/09/2010"
                                value={formData.pdfDetails?.dateOfIssueValidity || ""}
                                onChange={(e) => handleValuationChange('dateOfIssueValidity', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* h) Approved map / Plan */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Approved Map / Plan</Label>
                            <Input
                                placeholder="e.g., Approved by AMC"
                                value={formData.pdfDetails?.approvedMapPlan || ""}
                                onChange={(e) => handleValuationChange('approvedMapPlan', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* i) Approved map / Plan issuing authority */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Approved Map / Plan Issuing Authority</Label>
                            <select
                                value={formData.pdfDetails?.approvedMapPlanAuthority || ""}
                                onChange={(e) => handleValuationChange('approvedMapPlanAuthority', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Authority</option>
                                <option value="Approved by AMC">Approved by AMC</option>
                                <option value="Approved by UMC">Approved by UMC</option>
                                <option value="Approved by RDC">Approved by RDC</option>
                                <option value="Approved by GIDC">Approved by GIDC</option>
                                <option value="Approved by State">Approved by State</option>
                                <option value="Approved by Collector">Approved by Collector</option>
                                <option value="Approved by Municipal Corporation">Approved by Municipal Corporation</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* j) Whether genuineness / authenticity is verified */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Whether Genuineness / Authenticity is Verified</Label>
                            <select
                                value={formData.pdfDetails?.genuinenessVerified || ""}
                                onChange={(e) => handleValuationChange('genuinenessVerified', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select an option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>

                        {/* k) Any other comments / corrections / cancelled values */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">Any Other Comments / Corrections / Cancelled Values</Label>
                            <select
                                value={formData.pdfDetails?.otherComments || ""}
                                onChange={(e) => handleValuationChange('otherComments', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select an option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">8. City / Town</Label>
                            <Input
                                placeholder="e.g., Ahmedabad"
                                value={formData.pdfDetails?.cityTown || ""}
                                onChange={(e) => handleValuationChange('cityTown', e.target.value)}
                                className=" text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">

                {/* 8a, 8b, 8c - Area Classification (3 columns) */}
                <div className="grid grid-cols-3 gap-4">
                    {/* 8a. Residential area */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Residential Area</Label>
                        <select
                            value={formData.pdfDetails?.residentialArea || ""}
                            onChange={(e) => handleValuationChange('residentialArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    {/* 8b. Commercial area */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Commercial Area</Label>
                        <select
                            value={formData.pdfDetails?.commercialArea || ""}
                            onChange={(e) => handleValuationChange('commercialArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    {/* 8c. Industrial area */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">Industrial Area</Label>
                        <select
                            value={formData.pdfDetails?.industrialArea || ""}
                            onChange={(e) => handleValuationChange('industrialArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>

                {/* Area Classification Section */}
                <div className="col-span-4 space-y-4 mb-4">
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-1">Area Classification</h4>

                    {/* Row 2: Area Type and Governance in 4 columns */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">i.  High / Middle / Poor</Label>
                            <select
                                value={formData.pdfDetails?.areaGrade || ""}
                                onChange={(e) => handleValuationChange('areaGrade', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Grade</option>
                                <option value="High">High Class</option>
                                <option value="Middle">Middle Class</option>
                                <option value="Poor">Poor Class</option>
                            </select>
                        </div>
                        {/* 9b. Urban / Semi Urban / Rural */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">ii. Urban / Semi Urban / Rural</Label>
                            <select
                                value={formData.pdfDetails?.areaType || ""}
                                onChange={(e) => handleValuationChange('areaType', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Type</option>
                                <option value="Urban">Urban</option>
                                <option value="Semi Urban">Semi Urban</option>
                                <option value="Rural">Rural</option>
                            </select>
                        </div>

                        {/* 10. Coming under Corporation limit / Panchayat / Municipality */}
                        <div className="space-y-1.5 ">
                            <Label className="text-sm font-bold text-gray-900">10. Coming Under Corporation / Panchayat / Municipality</Label>
                            <select
                                value={formData.pdfDetails?.governanceType || ""}
                                onChange={(e) => handleValuationChange('governanceType', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Governance Type</option>
                                <option value="AMC Limit">AMC (Ahmedabad Municipal Corporation)</option>
                                <option value="Corporation Limit">Corporation Limit</option>
                                <option value="Municipality">Municipality</option>
                                <option value="Panchayat">Panchayat</option>
                                <option value="Gram Panchayat">Gram Panchayat</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">11. Whether Covered Under Any State</Label>
                            <Input
                                placeholder="e.g., Please Refer Adv. Title Report"
                                value={formData.pdfDetails?.governmentEnactments || ""}
                                onChange={(e) => handleValuationChange('governmentEnactments', e.target.value)}
                                className=" text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>

                </div>
            </div>


            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">

                {/* 12. Boundaries of the property */}
                <div className="col-span-4">
                    <Label className="text-sm font-bold text-gray-900 block mb-4">12. Boundaries of the Property</Label>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">East (As Per Sale Deed)</Label>
                            <Input
                                placeholder="e.g., Flat No. H-502"
                                value={formData.pdfDetails?.boundaryDeedEast || ""}
                                onChange={(e) => handleValuationChange('boundaryDeedEast', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">East (As Per Site Visit)</Label>
                            <Input
                                placeholder="e.g., Passage then Flat No. H-502"
                                value={formData.pdfDetails?.boundarySiteEast || ""}
                                onChange={(e) => handleValuationChange('boundarySiteEast', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">West (As Per Sale Deed)</Label>
                            <Input
                                placeholder="e.g., Compound Wall"
                                value={formData.pdfDetails?.boundaryDeedWest || ""}
                                onChange={(e) => handleValuationChange('boundaryDeedWest', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">West (As Per Site Visit)</Label>
                            <Input
                                placeholder="e.g., Compound Wall"
                                value={formData.pdfDetails?.boundarySiteWest || ""}
                                onChange={(e) => handleValuationChange('boundarySiteWest', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">North (As Per Sale Deed)</Label>
                            <Input
                                placeholder="e.g., Flat No. H-504"
                                value={formData.pdfDetails?.boundaryDeedNorth || ""}
                                onChange={(e) => handleValuationChange('boundaryDeedNorth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">North (As Per Site Visit)</Label>
                            <Input
                                placeholder="e.g., Flat No. H-504"
                                value={formData.pdfDetails?.boundarySiteNorth || ""}
                                onChange={(e) => handleValuationChange('boundarySiteNorth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">South (As Per Sale Deed)</Label>
                            <Input
                                placeholder="e.g., Compound Wall"
                                value={formData.pdfDetails?.boundaryDeedSouth || ""}
                                onChange={(e) => handleValuationChange('boundaryDeedSouth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">South (As Per Site Visit)</Label>
                            <Input
                                placeholder="e.g., Compound Wall"
                                value={formData.pdfDetails?.boundarySiteSouth || ""}
                                onChange={(e) => handleValuationChange('boundarySiteSouth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 13. Dimensions of the site */}
                <div className="col-span-4">
                    <Label className="text-sm font-bold text-gray-900 block mb-4">13. Dimensions of the Site</Label>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">East (As Per Deed)</Label>
                            <Input
                                placeholder="Actual dimensions"
                                value={formData.pdfDetails?.dimensionsDeedEast || ""}
                                onChange={(e) => handleValuationChange('dimensionsDeedEast', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">East (As Per Plan)</Label>
                            <Input
                                placeholder="As per Plan"
                                value={formData.pdfDetails?.dimensionsPlanEast || ""}
                                onChange={(e) => handleValuationChange('dimensionsPlanEast', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">West (As Per Deed)</Label>
                            <Input
                                placeholder="Actual dimensions"
                                value={formData.pdfDetails?.dimensionsDeedWest || ""}
                                onChange={(e) => handleValuationChange('dimensionsDeedWest', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">West (As Per Plan)</Label>
                            <Input
                                placeholder="As per Plan"
                                value={formData.pdfDetails?.dimensionsPlanWest || ""}
                                onChange={(e) => handleValuationChange('dimensionsPlanWest', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">North (As Per Deed)</Label>
                            <Input
                                placeholder="Actual dimensions"
                                value={formData.pdfDetails?.dimensionsDeedNorth || ""}
                                onChange={(e) => handleValuationChange('dimensionsDeedNorth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">North (As Per Plan)</Label>
                            <Input
                                placeholder="As per Plan"
                                value={formData.pdfDetails?.dimensionsPlanNorth || ""}
                                onChange={(e) => handleValuationChange('dimensionsPlanNorth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-900">South (As Per Deed)</Label>
                            <Input
                                placeholder="Actual dimensions"
                                value={formData.pdfDetails?.dimensionsDeedSouth || ""}
                                onChange={(e) => handleValuationChange('dimensionsDeedSouth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                            <Label className="text-xs font-bold text-gray-900">South (As Per Plan)</Label>
                            <Input
                                placeholder="As per Plan"
                                value={formData.pdfDetails?.dimensionsPlanSouth || ""}
                                onChange={(e) => handleValuationChange('dimensionsPlanSouth', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                    </div>
                </div>
            </div>


            {/* ===== PAGE 4-5: EXTENT OF SITE & APARTMENT BUILDING DETAILS ===== */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                    <FaBuilding className="text-blue-600" />
                    PROPERTY MEASUREMENTS & BUILDING DETAILS
                </h3>

                {/* 14. Extent of the site Area details of Property */}
                <div className="mb-6">
                    <Label className="text-sm font-bold text-gray-900 block mb-4">14. Extent of the site Area details of Property</Label>

                    <div className="grid grid-cols-3 gap-4">
                        {/* As per Sale Deed */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold font-bold text-gray-700 block mb-1">As per Sale Deed:</Label>
                            <Input
                                placeholder="Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                                value={formData.pdfDetails?.extentOfSiteSaleDeed || ""}
                                onChange={(e) => handleValuationChange('extentOfSiteSaleDeed', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* As per Approved Plan */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold font-bold text-gray-700 block mb-1">As per Approved Plan:</Label>
                            <Input
                                placeholder="Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                                value={formData.pdfDetails?.extentOfSiteApprovedPlan || ""}
                                onChange={(e) => handleValuationChange('extentOfSiteApprovedPlan', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* As per Tax Bill */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold font-bold text-gray-700 block mb-1">As per Tax Bill:</Label>
                            <Input
                                placeholder="Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                                value={formData.pdfDetails?.extentOfSiteTaxBill || ""}
                                onChange={(e) => handleValuationChange('extentOfSiteTaxBill', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">            {/* 15. Extent of the site considered for valuation */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">15. Extent of the site considered for valuation
                            (least of 13a & 13b) </Label>
                        <Input
                            placeholder="As per Sale Deed: Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                            value={formData.pdfDetails?.siteAreaForValuation || ""}
                            onChange={(e) => handleValuationChange('siteAreaForValuation', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>

                    {/* 16. Whether occupied by the owner / tenant? */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">16. occupied by the owner / tenant, since how long? Rent
                            received per month </Label>
                        <Input
                            placeholder="Tenant Occupied"
                            value={formData.pdfDetails?.occupancyStatus || ""}
                            onChange={(e) => handleValuationChange('occupancyStatus', e.target.value)}
                            className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            disabled={!canEdit}
                        />
                    </div>
                </div>

                {/* II. APARTMENT BUILDING SECTION */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2">II. APARTMENT BUILDING</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Nature of the apartment */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">1. Nature of apartment</Label>
                            <Input
                                placeholder="RCC Frame structure - High Rise"
                                value={formData.pdfDetails?.constructionType || ""}
                                onChange={(e) => handleValuationChange('constructionType', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 2. Location: Details of Area Surroundings with Google Location */}
                        <div className="col-span-1 md:col-span-2">
                            <Label className="text-sm font-bold text-gray-900">2. Location: Details of Area Surroundings with Google Location</Label>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
                                {/* T.S. No. */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm  font-bold  text-gray-700">T.S. No.</Label>
                                    <Input
                                        placeholder="28 (Nava Vadaj)"
                                        value={formData.pdfDetails?.tsNo || ""}
                                        onChange={(e) => handleValuationChange('tsNo', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                {/* Block No. */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm  font-bold  text-gray-700">Block No.</Label>
                                    <Input
                                        placeholder="R. S No. 491/P,"
                                        value={formData.pdfDetails?.blockNo || ""}
                                        onChange={(e) => handleValuationChange('blockNo', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>


                                {/* Ward No. */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm  font-bold  text-gray-700">Ward No.</Label>
                                    <Input
                                        placeholder="0530 - NANDIGRAM"
                                        value={formData.pdfDetails?.wardNo || ""}
                                        onChange={(e) => handleValuationChange('wardNo', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>

                                {/* Village / Municipality / Corporation */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm  font-bold  text-gray-700">Village/Municipality/Corpo</Label>
                                    <Input
                                        placeholder="AMC Limit"
                                        value={formData.pdfDetails?.villageOrMunicipality || ""}
                                        onChange={(e) => handleValuationChange('villageOrMunicipality', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>


                                {/* Door No. / Street or Road (Pin Code) - separate row */}

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold  text-gray-700">Door No. / Street or Road (Pin Code)</Label>
                                    <Input
                                        placeholder="380013"
                                        value={formData.pdfDetails?.doorNoStreetRoadPinCode || ""}
                                        onChange={(e) => handleValuationChange('doorNoStreetRoadPinCode', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Description of the locality */}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">3. Locality description</Label>
                            <Input
                                placeholder="Surrounding Development is well developed for Residential & Commercial area all Amenities Available Near By."
                                value={formData.pdfDetails?.localityDescription || ""}
                                onChange={(e) => handleValuationChange('localityDescription', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 4. Year of Construction */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">4. Year of construction</Label>
                            <Input
                                placeholder="2013"
                                value={formData.pdfDetails?.buildingAge || ""}
                                onChange={(e) => handleValuationChange('buildingAge', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 5. Number of floors */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">5. Number of floors</Label>
                            <Input
                                placeholder="GF + 10 Floor"
                                value={formData.pdfDetails?.numberOfFloors || ""}
                                onChange={(e) => handleValuationChange('numberOfFloors', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 6. Type of structure */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">6. Type of structure</Label>
                            <Input
                                placeholder="RCC Frame Structure"
                                value={formData.pdfDetails?.structureType || ""}
                                onChange={(e) => handleValuationChange('structureType', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                    {/* 7. Number of Dwelling units in the building */}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">7. Dwelling units</Label>
                            <Input
                                placeholder="4 unit"
                                value={formData.pdfDetails?.dwellingUnits || ""}
                                onChange={(e) => handleValuationChange('dwellingUnits', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>



                        {/* 8. Quality of Construction */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">8. Quality of construction</Label>
                            <Input
                                placeholder="Good"
                                value={formData.pdfDetails?.constructionQuality || ""}
                                onChange={(e) => handleValuationChange('constructionQuality', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 9. Appearance of the Building */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">9. Appearance of building</Label>
                            <Input
                                placeholder="Good"
                                value={formData.pdfDetails?.buildingAppearance || ""}
                                onChange={(e) => handleValuationChange('buildingAppearance', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 10. Maintenance of the Building */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">10. Maintenance of building</Label>
                            <Input
                                placeholder="Well Maintained"
                                value={formData.pdfDetails?.maintenanceStatus || ""}
                                onChange={(e) => handleValuationChange('maintenanceStatus', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>

                    {/* 11. Facilities available */}

                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-900">11. Facilities available</Label>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">Lift</Label>
                                <select
                                    value={formData.pdfDetails?.hasLift || ""}
                                    onChange={(e) => handleValuationChange('hasLift', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">Protected Water Supply</Label>
                                <select
                                    value={formData.pdfDetails?.hasWaterSupply || ""}
                                    onChange={(e) => handleValuationChange('hasWaterSupply', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">Underground Sewerage</Label>
                                <select
                                    value={formData.pdfDetails?.hasSewerage || ""}
                                    onChange={(e) => handleValuationChange('hasSewerage', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">Car Parking - Open / Covered</Label>
                                <select
                                    value={formData.pdfDetails?.hasCarParking || ""}
                                    onChange={(e) => handleValuationChange('hasCarParking', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">Does Compound wall existing?</Label>
                                <select
                                    value={formData.pdfDetails?.hasCompoundWall || ""}
                                    onChange={(e) => handleValuationChange('hasCompoundWall', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">Is pavement laid around the building?</Label>
                                <select
                                    value={formData.pdfDetails?.hasPavement || ""}
                                    onChange={(e) => handleValuationChange('hasPavement', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div >
    );

    const renderValuationAnalysisTab = () => {
        return (
            <>
                {/* ===== PAGE 6: FLAT SPECIFICATIONS ===== */}
                <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                    <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                        <FaBuilding className="text-blue-600" />
                        FLAT SPECIFICATIONS & DETAILS
                    </h3>

                    {/* III. Office / Shop / Flat */}
                    {/* 1. The floor in which the Flat is situated */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">1. The floor in which the Flat is situated</Label>
                            <Input
                                placeholder="Flat No. 503, 5th Floor, Block No. H (As per brochure of the Scheme), (Block No. E - As per Approved Layout Plan)"
                                value={formData.pdfDetails?.flatLocation || ""}
                                onChange={(e) => handleValuationChange('flatLocation', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 2. Door No. of the Flat */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">2. Door No. of the Flat</Label>
                            <Input
                                placeholder="5th Floor"
                                value={formData.pdfDetails?.flatDoorNumber || ""}
                                onChange={(e) => handleValuationChange('flatDoorNumber', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 3. Specifications of the Flat */}
                        <div className="col-span-1 md:col-span-4 space-y-3">
                            <h4 className="font-bold text-gray-900 text-sm">3. Specifications of the Flat</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-700">Roof</Label>
                                    <Input
                                        placeholder="RCC Slab"
                                        value={formData.pdfDetails?.specRoof || ""}
                                        onChange={(e) => handleValuationChange('specRoof', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-gray-700 font-bold">Flooring</Label>
                                    <Input
                                        placeholder="Vitrified Tiles Flooring"
                                        value={formData.pdfDetails?.specFlooring || ""}
                                        onChange={(e) => handleValuationChange('specFlooring', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-gray-700 font-bold">Doors</Label>
                                    <Input
                                        placeholder="Wooden Door"
                                        value={formData.pdfDetails?.specDoors || ""}
                                        onChange={(e) => handleValuationChange('specDoors', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-gray-700 font-bold">Windows</Label>
                                    <Input
                                        placeholder="Sliding windows"
                                        value={formData.pdfDetails?.specWindows || ""}
                                        onChange={(e) => handleValuationChange('specWindows', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm  text-gray-700 font-bold">Fittings</Label>
                                    <Input
                                        placeholder="Concealed fitting"
                                        value={formData.pdfDetails?.specFittings || ""}
                                        onChange={(e) => handleValuationChange('specFittings', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-gray-700 font-bold">Finishing</Label>
                                    <Input
                                        placeholder="Inside paint & outside double coat plaster"
                                        value={formData.pdfDetails?.specFinishing || ""}
                                        onChange={(e) => handleValuationChange('specFinishing', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </div>


                        {/* 4. House Tax - AMC Assessment No. */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">4. AMC Assessment No.</Label>
                            <Input
                                placeholder="05301535570001F"
                                value={formData.pdfDetails?.taxAssessmentNo || ""}
                                onChange={(e) => handleValuationChange('taxAssessmentNo', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 4a. Tax paid in the name of */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">4a. Tax paid in the name of</Label>
                            <Input
                                placeholder="The Ozone Angan Comm. & Hou.Co.O.Ser.Soc.Ltd"
                                value={formData.pdfDetails?.taxPaidName || ""}
                                onChange={(e) => handleValuationChange('taxPaidName', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 4b. Tax amount */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">4b. Tax amount</Label>
                            <Input
                                placeholder="₹ 2646/-"
                                value={formData.pdfDetails?.taxAmount || ""}
                                onChange={(e) => handleValuationChange('taxAmount', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 5. Electricity Service connection No. */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">5. Electricity Service connection No.</Label>
                            <Input
                                placeholder="-"
                                value={formData.pdfDetails?.electricityConnectionNo || ""}
                                onChange={(e) => handleValuationChange('electricityConnectionNo', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 6. How is the maintenance of the Unit? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">6. How is the maintenance of the Unit?</Label>
                            <Input
                                placeholder="-"
                                value={formData.pdfDetails?.unitMaintenance || ""}
                                onChange={(e) => handleValuationChange('unitMaintenance', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>


                        {/* 8. What is the undivided area of land as per Sale Deed? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">8. What is the undivided area of land as per Sale Deed?</Label>
                            <Input
                                placeholder="-"
                                value={formData.pdfDetails?.undividedLandArea || ""}
                                onChange={(e) => handleValuationChange('undividedLandArea', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 9. What is the plinth area of the Flat? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">9. What is the plinth area of the Flat?</Label>
                            <Input
                                placeholder="As per Sale Deed: Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                                value={formData.pdfDetails?.flatPlinthArea || ""}
                                onChange={(e) => handleValuationChange('flatPlinthArea', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 10. What is the floor space index (app.) */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">10. What is the floor space index (app.)</Label>
                            <Input
                                placeholder="As per approved plan"
                                value={formData.pdfDetails?.floorSpaceIndex || ""}
                                onChange={(e) => handleValuationChange('floorSpaceIndex', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 11. What is the Carpet Area of the Flat? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">11. What is the Carpet Area of the Flat?</Label>
                            <Input
                                placeholder="As per Tax Bill: Built-up Area = 000.00 sq.mt i.e., 000.00 sq.yd"
                                value={formData.pdfDetails?.carpetAreaFlat || ""}
                                onChange={(e) => handleValuationChange('carpetAreaFlat', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 12. Is it Posh / I Class / Medium / Ordinary? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">12. Is it Posh / I Class / Medium / Ordinary?</Label>
                            <select
                                value={formData.pdfDetails?.flatClass || ""}
                                onChange={(e) => handleValuationChange('flatClass', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={!canEdit}
                            >
                                <option value="">Select Class</option>
                                <option value="Posh">Posh</option>
                                <option value="I Class">I Class</option>
                                <option value="Medium">Medium</option>
                                <option value="Ordinary">Ordinary</option>
                            </select>
                        </div>

                        {/* 13. Is it being used for Residential or Commercial purpose? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">13. Is it being used for Residential or Commercial purpose?</Label>
                            <Input
                                placeholder="Residential purpose Use"
                                value={formData.pdfDetails?.usagePurpose || ""}
                                onChange={(e) => handleValuationChange('usagePurpose', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 14. Is it Owner-occupied or let out? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">14. Is it Owner-occupied or let out?</Label>
                            <Input
                                placeholder="Tenant Occupied"
                                value={formData.pdfDetails?.occupancyType || ""}
                                onChange={(e) => handleValuationChange('occupancyType', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 15. If rented, what is the monthly rent? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">15. If rented, what is the monthly rent?</Label>
                            <Input
                                placeholder="details not provided / available"
                                value={formData.pdfDetails?.monthlyRent || ""}
                                onChange={(e) => handleValuationChange('monthlyRent', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">

                    <h3 className="font-bold text-lg text-blue-900 mb-6 flex items-center gap-2">
                        <FaChartBar className="text-blue-600" />
                        MARKETABILITY & VALUATION ANALYSIS
                    </h3>

                    {/* IV. MARKETABILITY */}
                    <div className="grid grid-cols-3 gap-4 mb-6">


                        {/* 1. How is the marketability? */}

                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">1. How is the marketability?</Label>
                            <Input
                                placeholder="Well-developed Residential & Commercial Mixed area,"
                                value={formData.pdfDetails?.marketabilityLocational || ""}
                                onChange={(e) => handleValuationChange('marketabilityLocational', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 2. What are the factors favouring for an extra Potential Value? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-900">2. What are the factors favouring </Label>
                            <Input
                                placeholder="All Common Amenities Available Near by the Location."
                                value={formData.pdfDetails?.marketabilityScarcity || ""}
                                onChange={(e) => handleValuationChange('marketabilityScarcity', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* 3. Any negative factors are observed which affect the market value in general? */}
                        <div className="space-y-1.5">
                            <Label className="text-sm ext-[10px] font-bold text-gray-900">3. Any negative factors are observed which affect the market value in general?</Label>
                            <select
                                value={formData.pdfDetails?.marketabilityDemandSupply || ""}
                                onChange={(e) => handleValuationChange('marketabilityDemandSupply', e.target.value)}
                                className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                disabled={!canEdit}
                            >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>

                    {/* V. RATE SECTION */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-900 text-base mb-4" style={{ color: '#2864b9' }}>V. RATE</h4>
                        <div className="space-y-4">
                            {/* 1 & 2. Composite rate and Adopted basic rate in one row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">1. After analysing the comparable sale instances, what is the composite rate for a similar Flat with same specifications in the adjoining locality?</Label>
                                    <Input
                                        placeholder="e.g., ₹ 75,000/per sq.mt"
                                        value={formData.pdfDetails?.rateAnalysisCompositeRateAnalysis || ""}
                                        onChange={(e) => handleValuationChange('rateAnalysisCompositeRateAnalysis', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-bold text-gray-900">2. Assuming it is a new construction, what is the adopted basic composite rate of the Flat under valuation after comparing with the specifications </Label>
                                    <Input
                                        placeholder="e.g., ₹ 75,000/per sq.mt"
                                        value={formData.pdfDetails?.rateAnalysisAdoptedCompositeRate || ""}
                                        onChange={(e) => handleValuationChange('rateAnalysisAdoptedCompositeRate', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>

                            {/* 3 & 4. Break-up for the rate and Guideline rate in one row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-800">3. Building + Services</Label>
                                    <Input
                                        placeholder="e.g., ₹ 50,000/per sq.mt"
                                        value={formData.pdfDetails?.rateAnalysisRateBreakupBuildingServices || ""}
                                        onChange={(e) => handleValuationChange('rateAnalysisRateBreakupBuildingServices', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-800">Land + Others</Label>
                                    <Input
                                        placeholder="e.g., ₹ 25,000/per sq.mt"
                                        value={formData.pdfDetails?.rateAnalysisRateBreakupLandOthers || ""}
                                        onChange={(e) => handleValuationChange('rateAnalysisRateBreakupLandOthers', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-800">4. Guideline Rate</Label>
                                    <Input
                                        placeholder="e.g., ₹ 65,000/per sq.mt"
                                        value={formData.pdfDetails?.rateAnalysisGuidelineRate || ""}
                                        onChange={(e) => handleValuationChange('rateAnalysisGuidelineRate', e.target.value)}
                                        className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COMPOSITE RATE TABLE */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-900 text-base mb-4">Composite Rate Adopted After Depreciation</h4>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {/* 1. Depreciated building rate */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">A. DEPRECIATED BUILDING RATE</Label>
                                <Input
                                    placeholder="
Considered in construction cost. "
                                    value={formData.pdfDetails?.compositeDepreciatedBuildingRate || ""}
                                    onChange={(e) => handleValuationChange('compositeDepreciatedBuildingRate', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />

                            </div>

                            {/* 2. Replacement cost of Flat with Services */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">REPLACEMENT COST OF FLAT WITH SERVICES</Label>
                                <Input
                                    placeholder="
Considered in construction cost. "
                                    value={formData.pdfDetails?.compositeReplacementCost || ""}
                                    onChange={(e) => handleValuationChange('compositeReplacementCost', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />

                            </div>

                            {/* 3. Age of the building */}

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">AGE OF THE BUILDING </Label>
                                <Input
                                    placeholder="
11 Years Old "
                                    value={formData.pdfDetails?.compositeAgeOfBuilding || ""}
                                    onChange={(e) => handleValuationChange('compositeAgeOfBuilding', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>
                            {/* 4. Life of the building estimated */}

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">LIFE OF THE BUILDING ESTIMATED</Label>
                                <Input
                                    placeholder="60 – 11 Year = 49 Years) "
                                    value={formData.pdfDetails?.compositeLifeOfBuilding || ""}
                                    onChange={(e) => handleValuationChange('compositeLifeOfBuilding', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>
                            {/* 5. Depreciation percentage */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">DEPRECIATION PERCENTAGE (Salvage Value 10%)</Label>
                                <select
                                    name="compositeDepreciationPercentage"
                                    value={formData.pdfDetails?.compositeDepreciationPercentage || ""}
                                    onChange={(e) => handleValuationChange('compositeDepreciationPercentage', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                >
                                    <option value="">Select</option>
                                    <option value="Applicable">Applicable</option>
                                    <option value="Not Applicable">Not Applicable</option>

                                </select>
                            </div>

                            {/* 6. Depreciated Ratio of the building */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">DEPRECIATED RATIO OF THE BUILDING</Label>
                                <Input
                                    placeholder="
Considered in construction cost. "
                                    value={formData.pdfDetails?.compositeDepreciatedRatio || ""}
                                    onChange={(e) => handleValuationChange('compositeDepreciatedRatio', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />

                            </div>

                            {/* 7. Total composite rate arrived for valuation */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">B.TOTAL COMPOSITE RATE ARRIVED FOR VALUATION</Label>
                                <Input
                                    placeholder="
Considered in construction cost. "                                value={formData.pdfDetails?.compositeTotalRateForValuation || ""}
                                    onChange={(e) => handleValuationChange('compositeTotalRateForValuation', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />

                            </div>

                            {/* 8. Depreciated building rate VI (a) */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">DEPRECIATED BUILDING RATE VI (A)</Label>
                                <Input
                                    placeholder="
Considered in construction cost. "                                value={formData.pdfDetails?.compositeDepreciatedBuildingRateVI || ""}
                                    onChange={(e) => handleValuationChange('compositeDepreciatedBuildingRateVI', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />

                            </div>

                            {/* 9. Rate for Land & other V (3) ii */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">RATE FOR LAND & OTHER V (3) II</Label>
                                <Input
                                    placeholder="
Considered in construction cost. "
                                    value={formData.pdfDetails?.compositeRateForLand || ""}
                                    onChange={(e) => handleValuationChange('compositeRateForLand', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />

                            </div>

                            {/* 10. Total Composite Rate */}


                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-gray-900">TOTAL COMPOSITE RATE</Label>
                                <Input
                                    placeholder="
₹ 75,000/per sq.mt for Built-up Area "
                                    value={formData.pdfDetails?.compositeTotalCompositeRate || ""}
                                    onChange={(e) => handleValuationChange('compositeTotalCompositeRate', e.target.value)}
                                    className="h-9 text-sm rounded-lg border border-neutral-300 py-1 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </div>

                    {/* DETAILS OF VALUATION TABLE */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-900 text-base mb-4" style={{ color: '#4169E1' }}>Details of Valuation</h4>

                        <div className="overflow-x-auto border border-gray-300 rounded-lg">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-bold bg-gray-300">No.</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-bold bg-gray-300">Description</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-bold bg-gray-300">Qty.</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-bold bg-gray-300">Rate per unit ₹</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-bold bg-gray-300 flex justify-between items-center">
                                            <span>Estimated Value</span>
                                            <button
                                                type="button"
                                                onClick={addCustomValuationItem}
                                                className="ml-2 p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold"
                                                title="Add new item"
                                            >
                                                +
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">1</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Present value of the Apartment (incl. car parking, if provided)</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <div className="flex items-center">
                                                <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2 flex-1" disabled={!canEdit} value={formData.pdfDetails?.presentValueQty || ""} onChange={(e) => handleValuationChange('presentValueQty', e.target.value)} />
                                                <span className="ml-1 text-xs">sq.mt</span>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <div className="flex items-center">
                                                <span className="mr-1 text-xs">₹</span>
                                                <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2 flex-1" disabled={!canEdit} value={formData.pdfDetails?.presentValueRate || ""} onChange={(e) => handleValuationChange('presentValueRate', e.target.value)} />
                                                <span className="ml-1 text-xs">sq.mt</span>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <div className="flex items-center">
                                                <span className="mr-1 text-xs">₹</span>
                                                <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2 flex-1" disabled={!canEdit} value={formData.pdfDetails?.presentValue || ""} onChange={(e) => handleValuationChange('presentValue', e.target.value)} readOnly />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">2</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Wardrobes</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.wardrobes || ""} onChange={(e) => handleValuationChange('wardrobes', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.wardrobesRate || ""} onChange={(e) => handleValuationChange('wardrobesRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.wardrobesValue || ""} onChange={(e) => handleValuationChange('wardrobesValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">3</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Showcases</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.showcases || ""} onChange={(e) => handleValuationChange('showcases', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.showcasesRate || ""} onChange={(e) => handleValuationChange('showcasesRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.showcasesValue || ""} onChange={(e) => handleValuationChange('showcasesValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">4</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Kitchen Arrangements</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.kitchenArrangements || ""} onChange={(e) => handleValuationChange('kitchenArrangements', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.kitchenRate || ""} onChange={(e) => handleValuationChange('kitchenRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.kitchenValue || ""} onChange={(e) => handleValuationChange('kitchenValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">5</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Superfine Finish</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.superfineFinish || ""} onChange={(e) => handleValuationChange('superfineFinish', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.finishRate || ""} onChange={(e) => handleValuationChange('finishRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.finishValue || ""} onChange={(e) => handleValuationChange('finishValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">6</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Interior Decorations</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.interiorDecorations || ""} onChange={(e) => handleValuationChange('interiorDecorations', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.decorationRate || ""} onChange={(e) => handleValuationChange('decorationRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.decorationValue || ""} onChange={(e) => handleValuationChange('decorationValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">7</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Electricity deposits / electrical fittings, etc.</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.electricityDeposits || ""} onChange={(e) => handleValuationChange('electricityDeposits', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.electricityRate || ""} onChange={(e) => handleValuationChange('electricityRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.electricityValue || ""} onChange={(e) => handleValuationChange('electricityValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">8</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Extra collapsible gates / grill works etc.</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.grillWorks || ""} onChange={(e) => handleValuationChange('grillWorks', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.grillRate || ""} onChange={(e) => handleValuationChange('grillRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.grillValue || ""} onChange={(e) => handleValuationChange('grillValue', e.target.value)} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">9</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">Potential value, if any</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.potentialValue || ""} onChange={(e) => handleValuationChange('potentialValue', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.potentialRate || ""} onChange={(e) => handleValuationChange('potentialRate', e.target.value)} />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <Input type="number" className="h-7 text-xs border border-gray-300 py-1 px-2" disabled={!canEdit} value={formData.pdfDetails?.potentialValueAmount || ""} onChange={(e) => handleValuationChange('potentialValueAmount', e.target.value)} readOnly />
                                        </td>
                                    </tr>

                                    {/* Dynamic Custom Valuation Items */}
                                    {customValuationItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-bold">{item.serialNumber}</td>
                                            <td className="border border-gray-300 px-4 py-2 font-bold">
                                                <Input
                                                    type="text"
                                                    placeholder="Enter description"
                                                    className="h-7 text-xs border border-gray-300 py-1 px-2 w-full"
                                                    disabled={!canEdit}
                                                    value={item.description}
                                                    onChange={(e) => updateCustomValuationItem(item.id, 'description', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <Input
                                                    type="number"
                                                    className="h-7 text-xs border border-gray-300 py-1 px-2 w-full"
                                                    disabled={!canEdit}
                                                    value={item.qty}
                                                    onChange={(e) => updateCustomValuationItem(item.id, 'qty', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <Input
                                                    type="number"
                                                    className="h-7 text-xs border border-gray-300 py-1 px-2 w-full"
                                                    disabled={!canEdit}
                                                    value={item.rate}
                                                    onChange={(e) => updateCustomValuationItem(item.id, 'rate', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        className="h-7 text-xs border border-gray-300 py-1 px-2 flex-1"
                                                        disabled={!canEdit}
                                                        value={item.value}
                                                        readOnly
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCustomValuationItem(item.id)}
                                                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                                                        disabled={!canEdit}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan="4" className="border border-gray-300 px-4 py-2 text-right">Total Value</td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                            <Input
                                                placeholder="₹ 00,00,000.00"
                                                type="number"
                                                value={(() => {
                                                    const standardTotal = parseFloat(formData.pdfDetails?.valuationTotalValue) || 0;
                                                    const customTotal = getCustomValuationTotal();
                                                    return (standardTotal + customTotal) > 0 ? (standardTotal + customTotal).toString() : '';
                                                })()}
                                                className="h-8 text-xs font-bold rounded border border-gray-300 py-1 px-2"
                                                disabled={!canEdit}
                                                readOnly
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </>
        );
    };

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
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Rajesh Flat Valuation Form</h1>
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
                                <CardTitle className="text-sm font-bold text-neutral-900">Rajesh Flat Details</CardTitle>
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
                                                    : "bg-white border border-gray-300 hover:border-blue-500"
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
                                                formType="rajeshflat"
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
                                                    { id: 'valuationanalysis', label: 'VALUATION ANALYSIS' },
                                                    { id: 'checklist', label: 'CHECKLIST' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setActiveValuationSubTab(tab.id)}
                                                        className={`px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap flex-shrink-0 transition-all ${activeValuationSubTab === tab.id
                                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                            : "bg-white border border-gray-300 hover:border-blue-500"
                                                            }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Sub-tab Content */}
                                            <div className="space-y-6">
                                                {activeValuationSubTab === 'general' && renderGeneralTab()}

                                                {activeValuationSubTab === 'valuationanalysis' && renderValuationAnalysisTab()}

                                                {activeValuationSubTab === 'checklist' && renderChecklistTab()}
                                            </div>
                                        </div>
                                    )}

                                    {/* ADD FIELDS Section */}
                                    {activeTab === "addfields" && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold mb-4">Add Custom Fields</h3>

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
                                                                        <span className="font-semibold break-words">{field.name}</span>
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

export default RajeshFlatEditForm;