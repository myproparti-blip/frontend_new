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
    FaRedo
} from "react-icons/fa";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, RadioGroup, RadioGroupItem, ChipSelect } from "../components/ui";
import { getRajeshHouseById, updateRajeshHouse, managerSubmitRajeshHouse, getLastSubmittedRajeshHouse } from "../services/rajeshHouseService";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";
import { uploadPropertyImages, uploadLocationImages, uploadDocuments } from "../services/imageService";
import api, { invalidateCache } from "../services/axios";
import { getCustomOptions } from "../services/customOptionsService";
import ClientInfoPanel from "../components/ClientInfoPanel";
import DocumentsPanel from "../components/DocumentsPanel";
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
    const [activeValuationSubTab, setActiveValuationSubTab] = useState("general");
    const [customFields, setCustomFields] = useState([]);
    const [customFieldName, setCustomFieldName] = useState("");
    const [customFieldValue, setCustomFieldValue] = useState("");
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [customConstructionCostFields, setCustomConstructionCostFields] = useState([]);
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

        // PDF DETAILS (AUTO-EXTRACTED) - 100% IDENTICAL NESTED STRUCTURE WITH BACKEND pdfDetailsSchema
        pdfDetails: {
            // basicInfo - 7 fields
            basicInfo: {
                borrowerName: '',
                ownerName: '',
                propertyDetails: '',
                propertyAddress: '',
                client: '',
                applicant: '',
                valuationDoneBy: ''
            },

            // valuationPurpose - 7 fields
            valuationPurpose: {
                purposeOfValuation: '',
                purposeForValuation: '',
                dateOfValuation: '',
                dateOfInspection: '',
                dateValuationMade: '',
                dateOfReport: '',
                dateOfVisit: ''
            },

            // documents - nested structure matching MongoDB model
            documents: {
                ownershipDocuments: {
                    engagementLetter: '',
                    ownershipDocuments: '',
                    conveyanceDeed: '',
                    saleCertificate: ''
                },
                propertyRecords: {
                    advTcrLsr: '',
                    agreementForSale: '',
                    propertyCard: '',
                    mortgageDeed: '',
                    leaseDeed: '',
                    index: '',
                    vf712Land: '',
                    naOrder: '',
                    naLatter: ''
                },
                permissions: {
                    approvedLayoutPlan: '',
                    commencementLetter: '',
                    buPermission: '',
                    healthSafetyPlan: ''
                },
                utilities: {
                    eleMeterPhoto: '',
                    lightBill: '',
                    muniTaxBill: ''
                },
                propertyStatus: {
                    numberingDetails: '',
                    boundariesDemarcation: '',
                    mergedProperty: '',
                    premiseSeparationDetails: '',
                    landLocked: '',
                    propertyRented: '',
                    rentAgreement: ''
                },
                inspectionPhotos: {
                    siteVisitPhotos: '',
                    selfieWithOwner: '',
                    mobileNo: '',
                    dataSheet: ''
                },
                valuation: {
                    tentativeRate: '',
                    saleInstanceLocalInquiry: '',
                    brokerRecording: '',
                    pastValuationRate: ''
                }
            },

            // ownerDetails - 6 fields
            ownerDetails: {
                nameOfOwners: '',
                ownerNameAddress: '',
                ownerPhoneNo: '',
                shareDetails: '',
                ownerPhoneShare: '',
                addressOfProperty: ''
            },

            // propertyLocation - 9 fields
            propertyLocation: {
                plotNumber: '',
                doorNumber: '',
                tsNumber: '',
                village: '',
                ward: '',
                taluka: '',
                mandal: '',
                district: '',
                postalAddress: ''
            },

            // areaClassification - 10 fields
            areaClassification: {
                cityTown: '',
                residentialArea: '',
                commercialArea: '',
                industrialArea: '',
                areaClassification: '',
                highMiddlePoor: '',
                urbanSemiUrbanRural: '',
                corporationLimitVillage: '',
                governmentEnactments: '',
                agriculturalLandConversion: ''
            },

            // boundaryDetails - 8 fields
            boundaryDetails: {
                east: { deed: '', visit: '' },
                west: { deed: '', visit: '' },
                north: { deed: '', visit: '' },
                south: { deed: '', visit: '' }
            },

            // dimensions - 8 fields
            dimensions: {
                north: { deed: '', actual: '' },
                south: { deed: '', actual: '' },
                east: { deed: '', actual: '' },
                west: { deed: '', actual: '' }
            },

            // coordinates - 2 fields
            coordinates: {
                latitude: '',
                longitude: ''
            },

            // extent - 2 fields
            extent: {
                extentOfSite: '',
                extentConsideredForValuation: ''
            },

            // occupationStatus - 3 fields
            occupationStatus: {
                occupiedByOwnerTenant: '',
                tenancyDuration: '',
                rentReceivedPerMonth: ''
            },

            // siteCharacteristics - 21 fields
            siteCharacteristics: {
                classificationOfLocality: '',
                developmentSurroundingArea: '',
                frequentFloodingSubmerging: '',
                feasibilityCivicAmenities: '',
                levelOfLandTopographical: '',
                shapeOfLand: '',
                typeOfUse: '',
                usageRestriction: '',
                townPlanningApprovedLayout: '',
                cornerPlotIntermittentPlot: '',
                roadFacilities: '',
                typeOfRoadAvailable: '',
                widthOfRoad: '',
                lockedLand: '',
                waterPotentiality: '',
                undergroundSewerageSystem: '',
                powerSupplyAtSite: '',
                advantageOfSite1: '',
                advantageOfSite2: '',
                specialRemarks1: '',
                specialRemarks2: ''
            },

            // briefDescription - 8 fields
            briefDescription: {
                briefDescription: '',
                revenueDetails: '',
                areaOfLand: '',
                valueOfLand: '',
                areaOfConstruction: '',
                valueOfConstruction: '',
                totalMarketValue: '',
                insurableValue: ''
            },

            // landValuation - Part A: Market Value Analysis of Land
            landValuation: {
                plotDescription: '',
                areaSqYd: '',
                rate: '',
                totalValue: '',
                sayRO: '',
                sizeOfPlot: {
                    northSouth: '',
                    eastWest: '',
                    total: ''
                },
                marketRate: {
                    prevailingRate: '',
                    landBuildingAreaRateMethod: ''
                },
                guidelineRate: {
                    fromRegistrar: '',
                    adoptedRate: ''
                },
                jantriRate: {
                    rate: '',
                    landValue: '',
                    buildingValue: '',
                    totalValue: ''
                },
                estimatedValueOfLand: '',
                variationClause: ''
            },

            // buildingDetails - 11 fields
            buildingDetails: {
                typeOfBuilding: '',
                typeOfConstruction: '',
                yearOfConstruction: '',
                numberOfFloorsHeight: '',
                plinthAreaFloorWise: '',
                condition: {
                    exterior: '',
                    interior: ''
                },
                approvedMap: {
                    dateValidity: '',
                    issuingAuthority: '',
                    genuinessVerified: ''
                },
                otherCommentsOnApprovedPlan: ''
            },

            // constructionCostAnalysis - 115 fields (18 rooms × 5 fields + total)
            constructionCostAnalysis: {
                securityRoom: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                laboursQuarter: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                storeRoom: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                galleryRoom: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                ffLaboursQuarter: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                gfRoom: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                gfWashRoom: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                office1: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                washRoom: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                office2: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed1: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed2Unit1: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed2Unit2: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                openShed: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                godown: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed3Unit1: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed3Unit2: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                shed3Unit3: { areaDetails: '', areaSMT: '', areaSYD: '', ratePerSYD: '', value: '' },
                total: { areaSMT: '', areaSYD: '', ratePerSYD: '', totalValue: '' }
            },

            // extraItems - 6 fields
            extraItems: {
                portico: '',
                ornamentalFrontDoor: '',
                sitOutVeranda: '',
                overheadWaterTank: '',
                extraSteelGates: '',
                total: ''
            },

            // amenities - 11 fields
            amenities: {
                wardrobes: '',
                glazedTiles: '',
                extraSinksBathTub: '',
                marbleFlooring: '',
                interiorDecorations: '',
                architecturalElevation: '',
                panellingWorks: '',
                aluminiumWorks: '',
                aluminiumHandRails: '',
                falseCeiling: '',
                total: ''
            },

            // miscellaneous - 5 fields
            miscellaneous: {
                separateToiletRoom: '',
                separateLumberRoom: '',
                separateWaterTankSump: '',
                treesGardening: '',
                total: ''
            },

            // fixedFurniture - 6 fields (Part C)
            fixedFurniture: {
                item1: '',
                item2: '',
                item3: '',
                item4: '',
                item5: '',
                total: ''
            },

            // services - 6 fields
            services: {
                waterSupplyArrangements: '',
                drainageArrangements: '',
                compoundWall: '',
                cbDepositsFittings: '',
                pavement: '',
                total: ''
            },

            // totalAbstract - 14 fields
            totalAbstract: {
                partA: { description: 'Land', value: '' },
                partB: { description: 'Building', value: '' },
                partC: { description: 'Fixed Furniture', value: '' },
                partD: { description: 'Amenities', value: '' },
                partE: { description: 'Miscellaneous', value: '' },
                partF: { description: 'Services', value: '' },
                totalValue: '',
                sayValue: ''
            },


            // valuationSummary - 19 fields
            valuationSummary: {
                presentMarketValue: { amount: '', words: '', inWords: '' },
                realisableValue: { percentage: '85%', amount: '', words: '', inWords: '' },
                distressValue: { percentage: '70%', amount: '', words: '', inWords: '' },
                jantriValue: { amount: '', words: '', inWords: '' },
                fairMarketValue: { amount: '', words: '', inWords: '' },
                appraisalOpinion: '',
                inspectionDetails: ''
            },

            // signatureDetails - 8 fields
            signatureDetails: {
                valuer: { name: '', designation: '', date: '', place: '' },
                branchManager: { name: '', designation: '', date: '', place: '' }
            },

            // qrCode - 1 field
            qrCode: {
                url: ''
            }
        },
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
    const documentFileInputRef = useRef(null);
    const bankFileInputRef = useRef(null);
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
        if (id) loadValuation();
    }, [id]);

    // Log when formData loads to verify data binding
    useEffect(() => {
        if (formData?.constructionCostAnalysis && Object.keys(formData.constructionCostAnalysis).length > 0) {
            ('[rajeshHouse.jsx] Construction Cost Analysis data loaded:', formData.constructionCostAnalysis);
        }
    }, [formData?.constructionCostAnalysis]);

    // Monitor landValuation data to ensure it's being loaded properly
    useEffect(() => {
        if (formData?.pdfDetails?.landValuation) {
            ('[rajeshHouse.jsx] Land Valuation (Part A) data loaded:', formData.pdfDetails.landValuation);
        }
    }, [formData?.pdfDetails?.landValuation]);

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

    // Helper function to recalculate totalAbstract
    const recalculateTotalAbstract = (pdfDetails, currentFormData = null) => {
        const newPdfDetails = JSON.parse(JSON.stringify(pdfDetails));

        // Get all part values from pdfDetails, but get Part B from formData.constructionCostAnalysis to ensure it's current
        const partAValue = parseFloat(getNestedProperty(newPdfDetails, 'landValuation.sayRO')) || 0;
        // Use currentFormData for Part B if available, otherwise use pdfDetails
        const partBValue = currentFormData
            ? parseFloat(getNestedProperty(currentFormData, 'constructionCostAnalysis.total.roundedValue')) || 0
            : parseFloat(getNestedProperty(newPdfDetails, 'constructionCostAnalysis.total.roundedValue')) || 0;
        const partCValue = parseFloat(getNestedProperty(newPdfDetails, 'extraItems.total')) || 0;
        const partDValue = parseFloat(getNestedProperty(newPdfDetails, 'amenities.total')) || 0;
        const partEValue = parseFloat(getNestedProperty(newPdfDetails, 'miscellaneous.total')) || 0;
        const partFValue = parseFloat(getNestedProperty(newPdfDetails, 'services.total')) || 0;

        // Update part values in totalAbstract
        newPdfDetails.totalAbstract = newPdfDetails.totalAbstract || {};
        newPdfDetails.totalAbstract.partA = newPdfDetails.totalAbstract.partA || {};
        newPdfDetails.totalAbstract.partB = newPdfDetails.totalAbstract.partB || {};
        newPdfDetails.totalAbstract.partC = newPdfDetails.totalAbstract.partC || {};
        newPdfDetails.totalAbstract.partD = newPdfDetails.totalAbstract.partD || {};
        newPdfDetails.totalAbstract.partE = newPdfDetails.totalAbstract.partE || {};
        newPdfDetails.totalAbstract.partF = newPdfDetails.totalAbstract.partF || {};

        newPdfDetails.totalAbstract.partA.value = partAValue > 0 ? partAValue.toString() : '';
        newPdfDetails.totalAbstract.partB.value = partBValue > 0 ? partBValue.toString() : '';
        newPdfDetails.totalAbstract.partC.value = partCValue > 0 ? partCValue.toString() : '';
        newPdfDetails.totalAbstract.partD.value = partDValue > 0 ? partDValue.toString() : '';
        newPdfDetails.totalAbstract.partE.value = partEValue > 0 ? partEValue.toString() : '';
        newPdfDetails.totalAbstract.partF.value = partFValue > 0 ? partFValue.toString() : '';

        // Calculate total and say value
        const totalAbstractValue = partAValue + partBValue + partCValue + partDValue + partEValue + partFValue;
        newPdfDetails.totalAbstract.totalValue = totalAbstractValue > 0 ? totalAbstractValue.toString() : '';
        const roundedSayValue = Math.round(totalAbstractValue / 1000) * 1000;
        newPdfDetails.totalAbstract.sayValue = roundedSayValue > 0 ? roundedSayValue.toString() : '';

        return newPdfDetails;
    };

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

        // Restore area images from database - NORMALIZE STRUCTURE
        if (data.areaImages && typeof data.areaImages === 'object' && Object.keys(data.areaImages).length > 0) {
            ('[rajeshHouse.jsx] Restoring area images:', Object.keys(data.areaImages));
            // Normalize area images to ensure they have proper structure
            const normalizedAreaImages = {};
            Object.keys(data.areaImages).forEach(area => {
                if (Array.isArray(data.areaImages[area])) {
                    normalizedAreaImages[area] = data.areaImages[area].map(img => {
                        let imageUrl = '';
                        if (img.url) {
                            imageUrl = img.url;
                        } else if (img.preview) {
                            imageUrl = img.preview;
                        } else if (img.path) {
                            const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                            imageUrl = `/api/uploads/${fileName}`;
                        } else if (img.fileName) {
                            imageUrl = `/api/uploads/${img.fileName}`;
                        }
                        return {
                            preview: imageUrl,
                            url: imageUrl,
                            fileName: img.fileName || img.name || `Image`,
                            size: img.size || 0,
                            file: img.file || null
                        };
                    });
                }
            });
            setFormData(prev => ({
                ...prev,
                areaImages: normalizedAreaImages
            }));
            ('[rajeshHouse.jsx] Area images restored:', normalizedAreaImages);
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
                try {
                    ("[loadValuation] Form not found, attempting autofill from last form...");

                    // Fetch last submitted form for autofilling valuation tab data only
                    const lastForm = await getLastSubmittedRajeshHouse();

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
                showError("Rajesh House form not found. Creating new form...");                // Initialize with empty form
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

        // Load custom construction cost fields from data
        if (data.customConstructionCostFields && Array.isArray(data.customConstructionCostFields)) {
            setCustomConstructionCostFields(data.customConstructionCostFields);
        }

        setFormData(prev => {
            // Extract constructionCostAnalysis from either direct property or pdfDetails
            let incomingConstructionCostAnalysis = data.constructionCostAnalysis;
            if (!incomingConstructionCostAnalysis && data.pdfDetails?.constructionCostAnalysis) {
                incomingConstructionCostAnalysis = data.pdfDetails.constructionCostAnalysis;
            }

            // Deep merge constructionCostAnalysis to preserve all room data
            let mergedConstructionCostAnalysis = { ...prev.constructionCostAnalysis };
            if (incomingConstructionCostAnalysis) {
                Object.keys(incomingConstructionCostAnalysis).forEach(key => {
                    if (typeof incomingConstructionCostAnalysis[key] === 'object' && incomingConstructionCostAnalysis[key] !== null) {
                        mergedConstructionCostAnalysis[key] = {
                            ...mergedConstructionCostAnalysis[key],
                            ...incomingConstructionCostAnalysis[key]
                        };
                    } else {
                        mergedConstructionCostAnalysis[key] = incomingConstructionCostAnalysis[key];
                    }
                });
            }

            ('[rajeshHouse.jsx] mapDataToForm - constructionCostAnalysis:', mergedConstructionCostAnalysis);

            return {
                ...prev,
                ...data,
                pdfDetails: data.pdfDetails ? { ...prev.pdfDetails, ...data.pdfDetails } : prev.pdfDetails,
                constructionCostAnalysis: mergedConstructionCostAnalysis
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
            await updateRajeshHouse(id, formData, user.username, user.role, user.clientId);
            invalidateCache();
            dispatch(hideLoader());
            showSuccess('Rajesh House form saved successfully');
        } catch (error) {
            console.error("Error saving Rajesh House form:", error);
            dispatch(hideLoader());
            showError('Failed to save Rajesh House form');
        }
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

    // Check if field is a date field
    const isDateField = (key) => {
        const dateKeywords = ['date', 'Date'];
        return dateKeywords.some(keyword => key.includes(keyword));
    };

    // Check if field is a dropdown/select field
    const isDropdownField = (key) => {
        // Exclude agriculturalLandConversion from dropdown fields
        if (key.includes('agriculturalLandConversion')) {
            return false;
        }
        const dropdownKeywords = ['status', 'condition', 'type', 'Type', 'available', 'Available', 'classification', 'Classification', 'approval', 'Approval'];
        return dropdownKeywords.some(keyword => key.includes(keyword));
    };

    // Get dropdown options based on field
    const getDropdownOptions = (key) => {
        if (key.includes('status') || key.includes('Status')) {
            return ['', 'Approved', 'Rejected', 'Pending', 'In Progress'];
        }
        if (key.includes('condition') || key.includes('Condition')) {
            return ['', 'Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];
        }
        if (key.includes('type') || key.includes('Type')) {
            return ['', 'Residential', 'Commercial', 'Industrial', 'Bitumen Road', 'Mixed Use'];
        }
        if (key.includes('available') || key.includes('Available')) {
            return ['', 'Yes', 'No'];
        }
        if (key.includes('corporationLimitVillage')) {
            return ['', 'Corporation Limit', 'Village Panchayat', 'Municipality', 'Gram Panchayat'];
        }
        if (key.includes('governmentEnactments')) {
            return ['', 'Urban Land Ceiling Act', 'Agency Area', 'Scheduled Area', 'Cantonment Area', 'Not Covered'];
        }
        if (key.includes('classification') || key.includes('Classification')) {
            return ['', 'High Class', 'Middle Class', 'Lower Class', 'Rural'];
        }
        if (key.includes('approval') || key.includes('Approval')) {
            return ['', 'Yes', 'No', 'Pending'];
        }
        return [];
    };

    // Render field based on type
    const renderFormField = (field) => {
        const value = getNestedProperty(formData.pdfDetails, field.key);
        // Auto-calculated fields should be disabled
        const autoCalculatedFields = [
            'briefDescription.totalMarketValue',
            'valuationSummary.realisableValue.amount',
            'valuationSummary.distressValue.amount',
            'totalAbstract.partA.value',
            'totalAbstract.partB.value',
            'totalAbstract.partC.value',
            'totalAbstract.partD.value',
            'totalAbstract.partE.value',
            'totalAbstract.partF.value',
            'totalAbstract.totalValue',
            'totalAbstract.sayValue'
        ];
        const isAutoCalculated = autoCalculatedFields.includes(field.key);
        const isDisabled = field.disabled || !canEdit || isAutoCalculated;

        if (isDateField(field.key)) {
            return (
                <input
                    type="date"
                    value={value}
                    onChange={(e) => handleValuationChange(field.key, e.target.value)}
                    disabled={isDisabled}
                    className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    title={isAutoCalculated ? 'This value is automatically calculated' : ''}
                />
            );
        }

        if (isDropdownField(field.key)) {
            const options = getDropdownOptions(field.key);
            if (options.length > 0) {
                return (
                    <select
                        value={value}
                        onChange={(e) => handleValuationChange(field.key, e.target.value)}
                        disabled={isDisabled}
                        className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                        title={isAutoCalculated ? 'This value is automatically calculated' : ''}
                    >
                        {options.map(option => (
                            <option key={option} value={option}>{option || 'Select'}</option>
                        ))}
                    </select>
                );
            }
        }

        return (
            <Input
                placeholder="Enter value"
                value={value}
                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                disabled={isDisabled}
                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                title={isAutoCalculated ? 'This value is automatically calculated' : ''}
            />
        );
    };

    const handleValuationChange = (field, value) => {
        setFormData(prev => {
            const newPdfDetails = JSON.parse(JSON.stringify(prev.pdfDetails));
            setNestedProperty(newPdfDetails, field, value);

            // Auto-calculate Estimated Value = Qty × Rate for all 10 items
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
                    const qty = parseFloat(getNestedProperty(newPdfDetails, item.qtyField)) || 0;
                    const rate = parseFloat(getNestedProperty(newPdfDetails, item.rateField)) || 0;
                    const estimatedValue = qty * rate;
                    setNestedProperty(newPdfDetails, item.valueField, estimatedValue > 0 ? estimatedValue.toString() : '');
                }
            });

            // Auto-populate Value of Flat section based on ROUND FIGURE value
            const isQtyOrRateField = items.some(item => field === item.qtyField || field === item.rateField);
            if (isQtyOrRateField) {
                const totalValuation = items.reduce((sum, item) => {
                    const value = parseFloat(getNestedProperty(newPdfDetails, item.valueField)) || 0;
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

            // Auto-calculate Extra Items total based on 5 values
            const extraItemsFields = ['extraItems.portico', 'extraItems.ornamentalFrontDoor', 'extraItems.sitOutVeranda', 'extraItems.overheadWaterTank', 'extraItems.extraSteelGates'];
            if (extraItemsFields.includes(field)) {
                const totalExtraItems = extraItemsFields.reduce((sum, fieldName) => {
                    const value = parseFloat(getNestedProperty(newPdfDetails, fieldName)) || 0;
                    return sum + value;
                }, 0);
                setNestedProperty(newPdfDetails, 'extraItems.total', totalExtraItems > 0 ? totalExtraItems.toString() : '');
            }

            // Auto-calculate Amenities total based on 10 values
            const amenitiesFields = ['amenities.wardrobes', 'amenities.glazedTiles', 'amenities.extraSinksBathTub', 'amenities.marbleFlooring', 'amenities.interiorDecorations', 'amenities.architecturalElevation', 'amenities.panellingWorks', 'amenities.aluminiumWorks', 'amenities.aluminiumHandRails', 'amenities.falseCeiling'];
            if (amenitiesFields.includes(field)) {
                const totalAmenities = amenitiesFields.reduce((sum, fieldName) => {
                    const value = parseFloat(getNestedProperty(newPdfDetails, fieldName)) || 0;
                    return sum + value;
                }, 0);
                setNestedProperty(newPdfDetails, 'amenities.total', totalAmenities > 0 ? totalAmenities.toString() : '');
            }

            // Auto-calculate Miscellaneous total based on 4 values
            const miscellaneousFields = ['miscellaneous.separateToiletRoom', 'miscellaneous.separateLumberRoom', 'miscellaneous.separateWaterTankSump', 'miscellaneous.treesGardening'];
            if (miscellaneousFields.includes(field)) {
                const totalMiscellaneous = miscellaneousFields.reduce((sum, fieldName) => {
                    const value = parseFloat(getNestedProperty(newPdfDetails, fieldName)) || 0;
                    return sum + value;
                }, 0);
                setNestedProperty(newPdfDetails, 'miscellaneous.total', totalMiscellaneous > 0 ? totalMiscellaneous.toString() : '');
            }

            // Auto-calculate Services total based on 5 values
            const servicesFields = ['services.waterSupplyArrangements', 'services.drainageArrangements', 'services.compoundWall', 'services.cbDepositsFittings', 'services.pavement'];
            if (servicesFields.includes(field)) {
                const totalServices = servicesFields.reduce((sum, fieldName) => {
                    const value = parseFloat(getNestedProperty(newPdfDetails, fieldName)) || 0;
                    return sum + value;
                }, 0);
                setNestedProperty(newPdfDetails, 'services.total', totalServices > 0 ? totalServices.toString() : '');
            }



            // Auto-calculate Total Market Value, Realisable Value, and Distress Value
            if (field === 'briefDescription.valueOfLand' || field === 'briefDescription.valueOfConstruction') {
                const valueOfLand = parseFloat(getNestedProperty(newPdfDetails, 'briefDescription.valueOfLand')) || 0;
                const valueOfConstruction = parseFloat(getNestedProperty(newPdfDetails, 'briefDescription.valueOfConstruction')) || 0;

                const totalMarketValue = valueOfLand + valueOfConstruction;
                const realisableValue = totalMarketValue * 0.9; // 90% of TMV
                const distressValue = totalMarketValue * 0.8;   // 80% of TMV

                setNestedProperty(newPdfDetails, 'briefDescription.totalMarketValue', totalMarketValue > 0 ? parseFloat(totalMarketValue.toFixed(2)).toString() : '');
                setNestedProperty(newPdfDetails, 'valuationSummary.realisableValue.amount', realisableValue > 0 ? parseFloat(realisableValue.toFixed(2)).toString() : '');
                setNestedProperty(newPdfDetails, 'valuationSummary.distressValue.amount', distressValue > 0 ? parseFloat(distressValue.toFixed(2)).toString() : '');
            }

            // Auto-calculate Part A from Land Valuation sayRO
            if (field === 'landValuation.sayRO') {
                const partAValue = parseFloat(getNestedProperty(newPdfDetails, 'landValuation.sayRO')) || 0;
                setNestedProperty(newPdfDetails, 'totalAbstract.partA.value', partAValue > 0 ? partAValue.toString() : '');
            }

            // Auto-calculate Part B from Construction Cost total roundedValue
            if (field.startsWith('constructionCostAnalysis.')) {
                const partBValue = parseFloat(getNestedProperty(newPdfDetails, 'constructionCostAnalysis.total.roundedValue')) || 0;
                setNestedProperty(newPdfDetails, 'totalAbstract.partB.value', partBValue > 0 ? partBValue.toString() : '');
            }

            // Auto-calculate Part C from Extra Items total
            if (field.startsWith('extraItems.')) {
                const partCValue = parseFloat(getNestedProperty(newPdfDetails, 'extraItems.total')) || 0;
                setNestedProperty(newPdfDetails, 'totalAbstract.partC.value', partCValue > 0 ? partCValue.toString() : '');
            }

            // Auto-calculate Part D from Amenities total
            if (field.startsWith('amenities.')) {
                const partDValue = parseFloat(getNestedProperty(newPdfDetails, 'amenities.total')) || 0;
                setNestedProperty(newPdfDetails, 'totalAbstract.partD.value', partDValue > 0 ? partDValue.toString() : '');
            }

            // Auto-calculate Part E from Miscellaneous total
            if (field.startsWith('miscellaneous.')) {
                const partEValue = parseFloat(getNestedProperty(newPdfDetails, 'miscellaneous.total')) || 0;
                setNestedProperty(newPdfDetails, 'totalAbstract.partE.value', partEValue > 0 ? partEValue.toString() : '');
            }

            // Auto-calculate Part F from Services total
            if (field.startsWith('services.')) {
                const partFValue = parseFloat(getNestedProperty(newPdfDetails, 'services.total')) || 0;
                setNestedProperty(newPdfDetails, 'totalAbstract.partF.value', partFValue > 0 ? partFValue.toString() : '');
            }

            return {
                ...prev,
                pdfDetails: recalculateTotalAbstract(newPdfDetails, prev)
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

    const handleBankImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64 = await fileToBase64(file);
            setBankImagePreview({ preview: base64, name: file.name, file: file });

            // Reset input
            if (bankFileInputRef.current) {
                bankFileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error converting file to base64:', error);
            showError('Failed to upload bank image');
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

    const handleDirectionChange = (direction, value) => {
        setFormData(prev => ({
            ...prev,
            directions: {
                ...prev.directions,
                [direction]: value
            }
        }));
    };

    const handleConstructionCostChange = (field, value) => {
        setFormData(prev => {
            const newConstructionCostAnalysis = prev.constructionCostAnalysis ? JSON.parse(JSON.stringify(prev.constructionCostAnalysis)) : {};
            setNestedProperty(newConstructionCostAnalysis, field, value);

            // Auto-calculate Value = Area SMT × Rate Per SYD
            const parts = field.split('.');
            if (parts.length === 2) {
                const section = parts[0];
                const fieldType = parts[1];

                if (fieldType === 'areaSMT' || fieldType === 'ratePerSYD') {
                    const areaSMT = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.areaSMT`)) || 0;
                    const ratePerSYD = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.ratePerSYD`)) || 0;
                    const calculatedValue = areaSMT * ratePerSYD;
                    setNestedProperty(newConstructionCostAnalysis, `${section}.value`, calculatedValue > 0 ? calculatedValue.toString() : '');
                }
            }

            // Auto-calculate totals
            const sections = ['securityRoom', 'laboursQuarter', 'storeRoom', 'galleryRoom', 'ffLaboursQuarter', 'gfRoom', 'gfWashRoom', 'office1', 'washRoom', 'shed', 'office2', 'shed1', 'shed2Unit1', 'shed2Unit2', 'shed3', 'openShed', 'godown', 'shed3Unit1', 'shed3Unit2', 'shed3Unit3'];

            let totalValue = 0;
            let totalAreaSMT = 0;
            let totalAreaSYD = 0;
            let lastRatePerSYD = 0;

            sections.forEach(section => {
                const sectionValue = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.value`)) || 0;
                const sectionAreaSMT = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.areaSMT`)) || 0;
                const sectionAreaSYD = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.areaSYD`)) || 0;
                const sectionRatePerSYD = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.ratePerSYD`)) || 0;

                totalValue += sectionValue;
                totalAreaSMT += sectionAreaSMT;
                totalAreaSYD += sectionAreaSYD;

                // Keep track of last non-zero rate per SYD
                if (sectionRatePerSYD > 0) {
                    lastRatePerSYD = sectionRatePerSYD;
                }
            });

            if (!newConstructionCostAnalysis.total) {
                newConstructionCostAnalysis.total = {};
            }
            newConstructionCostAnalysis.total.totalValue = totalValue > 0 ? totalValue.toString() : '';
            newConstructionCostAnalysis.total.roundedValue = totalValue > 0 ? Math.round(totalValue / 1000) * 1000 : '';
            newConstructionCostAnalysis.total.areaSMT = totalAreaSMT > 0 ? totalAreaSMT.toString() : '';
            newConstructionCostAnalysis.total.areaSYD = totalAreaSYD > 0 ? totalAreaSYD.toString() : '';
            newConstructionCostAnalysis.total.ratePerSYD = lastRatePerSYD > 0 ? lastRatePerSYD.toString() : '';

            // Also update pdfDetails.constructionCostAnalysis to ensure totalAbstract calculations work
            const newPdfDetails = prev.pdfDetails ? JSON.parse(JSON.stringify(prev.pdfDetails)) : {};
            newPdfDetails.constructionCostAnalysis = newConstructionCostAnalysis;

            return {
                ...prev,
                constructionCostAnalysis: newConstructionCostAnalysis,
                pdfDetails: recalculateTotalAbstract(newPdfDetails)
            };
        });
    };

    const handleCustomConstructionCostChange = (idx, field, value) => {
        setCustomConstructionCostFields(prev => {
            const updated = [...prev];
            updated[idx][field] = value;

            // Auto-calculate Value = Area SMT × Rate Per SYD (if both fields exist)
            if ((field === 'areaSMT' || field === 'ratePerSYD') && updated[idx].areaSMT && updated[idx].ratePerSYD) {
                const areaSMTValue = parseFloat(updated[idx].areaSMT);
                const ratePerSYDValue = parseFloat(updated[idx].ratePerSYD);
                if (!isNaN(areaSMTValue) && !isNaN(ratePerSYDValue) && areaSMTValue > 0 && ratePerSYDValue > 0) {
                    updated[idx].value = (areaSMTValue * ratePerSYDValue).toFixed(2);
                } else {
                    updated[idx].value = '';
                }
            }

            return updated;
        });

        // Also update totals in constructionCostAnalysis to include custom fields
        setFormData(prev => {
            const newConstructionCostAnalysis = prev.constructionCostAnalysis ? JSON.parse(JSON.stringify(prev.constructionCostAnalysis)) : {};
            const sections = ['securityRoom', 'laboursQuarter', 'storeRoom', 'galleryRoom', 'ffLaboursQuarter', 'gfRoom', 'gfWashRoom', 'office1', 'washRoom', 'shed', 'office2', 'shed1', 'shed2Unit1', 'shed2Unit2', 'shed3', 'openShed', 'godown', 'shed3Unit1', 'shed3Unit2', 'shed3Unit3'];

            let totalValue = 0;
            let totalAreaSMT = 0;
            let totalAreaSYD = 0;
            let lastRatePerSYD = 0;

            // Include fixed rows
            sections.forEach(section => {
                const sectionValue = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.value`)) || 0;
                const sectionAreaSMT = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.areaSMT`)) || 0;
                const sectionAreaSYD = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.areaSYD`)) || 0;
                const sectionRatePerSYD = parseFloat(getNestedProperty(newConstructionCostAnalysis, `${section}.ratePerSYD`)) || 0;

                totalValue += sectionValue;
                totalAreaSMT += sectionAreaSMT;
                totalAreaSYD += sectionAreaSYD;

                if (sectionRatePerSYD > 0) {
                    lastRatePerSYD = sectionRatePerSYD;
                }
            });

            // Include custom rows
            customConstructionCostFields.forEach(customField => {
                const customValue = parseFloat(customField.value) || 0;
                const customAreaSMT = parseFloat(customField.areaSMT) || 0;
                const customAreaSYD = parseFloat(customField.areaSYD) || 0;
                const customRatePerSYD = parseFloat(customField.ratePerSYD) || 0;

                totalValue += customValue;
                totalAreaSMT += customAreaSMT;
                totalAreaSYD += customAreaSYD;

                if (customRatePerSYD > 0) {
                    lastRatePerSYD = customRatePerSYD;
                }
            });

            if (!newConstructionCostAnalysis.total) {
                newConstructionCostAnalysis.total = {};
            }
            newConstructionCostAnalysis.total.totalValue = totalValue > 0 ? totalValue.toString() : '';
            newConstructionCostAnalysis.total.roundedValue = totalValue > 0 ? Math.round(totalValue / 1000) * 1000 : '';
            newConstructionCostAnalysis.total.areaSMT = totalAreaSMT > 0 ? totalAreaSMT.toString() : '';
            newConstructionCostAnalysis.total.areaSYD = totalAreaSYD > 0 ? totalAreaSYD.toString() : '';
            newConstructionCostAnalysis.total.ratePerSYD = lastRatePerSYD > 0 ? lastRatePerSYD.toString() : '';

            // Also update pdfDetails.constructionCostAnalysis to ensure totalAbstract calculations work
            const newPdfDetails = prev.pdfDetails ? JSON.parse(JSON.stringify(prev.pdfDetails)) : {};
            newPdfDetails.constructionCostAnalysis = newConstructionCostAnalysis;

            return {
                ...prev,
                constructionCostAnalysis: newConstructionCostAnalysis,
                pdfDetails: recalculateTotalAbstract(newPdfDetails)
            };
        });
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
                                customConstructionCostFields: customConstructionCostFields,
                                constructionCostAnalysis: formData.constructionCostAnalysis,
                                pdfDetails: formData.pdfDetails
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

                                                areaImagesObj[area] = previousImages.map(img => ({
                                                    fileName: img.fileName || img.name || 'Image',
                                                    size: img.size || 0,
                                                    url: img.url || img.preview
                                                }));

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
        const pdfDetailsErrors = validatePdfDetails();
        const allErrors = [...validationErrors, ...pdfDetailsErrors];
        if (allErrors.length > 0) {
            // Show single consolidated error instead of multiple notifications
            showError(` ${allErrors.join(", ")}`);
            return;
        }

        try {
            dispatch(showLoader("Saving..."));

            ('[rajeshHouse.jsx] onFinish - landValuation data:', formData.pdfDetails?.landValuation);

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
                pdfDetails: {
                    ...(formData.pdfDetails || {}),
                    constructionCostAnalysis: formData.constructionCostAnalysis
                },
                constructionCostAnalysis: formData.constructionCostAnalysis,
                customConstructionCostFields: customConstructionCostFields,
                customFields: customFields,
                managerFeedback: formData.managerFeedback || "",
                submittedByManager: formData.submittedByManager || false,
                lastUpdatedBy: username,
                lastUpdatedByRole: role
            };

            // Handle image uploads - parallel (including supporting images and bank image)
            const [uploadedPropertyImages, uploadedLocationImages, uploadedSupportingImages, uploadedBankImage] = await Promise.all([
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

            // Handle area images - preserve them in payload
            if (formData.areaImages && typeof formData.areaImages === 'object') {
                const areaImagesObj = {};
                for (const [area, images] of Object.entries(formData.areaImages)) {
                    if (Array.isArray(images)) {
                        areaImagesObj[area] = images.map(img => ({
                            fileName: img.fileName || img.name || 'Image',
                            size: img.size || 0,
                            url: img.url || img.preview
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
                hasLandValuation: !!payload.landValuation,
                landValuationData: payload.landValuation,
                areaImagesCount: Object.keys(payload.areaImages || {}).length,
                areaImagesAreas: Object.keys(payload.areaImages || {}),
                bankImage: !!payload.bankImage,
                pdfDetailsKeys: Object.keys(payload.pdfDetails || {}).length,
                pdfDetailsSample: payload.pdfDetails ? {
                    purposeOfValuation: payload.pdfDetails.purposeOfValuation,
                    plotSurveyNo: payload.pdfDetails.plotSurveyNo,
                    fairMarketValue: payload.pdfDetails.fairMarketValue
                } : null
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

    const renderGeneralTab = () => (
        <div className="space-y-6">
            {/* basicInfo - 7 fields */}
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'basicInfo.borrowerName', label: 'Borrower Name' },
                        { key: 'basicInfo.ownerName', label: 'Owner Name' },
                        { key: 'basicInfo.propertyDetails', label: 'Property Details' },
                        { key: 'basicInfo.propertyAddress', label: 'Property Address' },
                        { key: 'basicInfo.client', label: 'Bank Branch Name' },
                        { key: 'valuationPurpose.purposeOfValuation', label: 'Purpose Of Valuation' },
                        { key: 'valuationPurpose.dateOfValuation', label: 'Date Of Valuation' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* valuationPurpose - 7 fields */}
            <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-4">Valuation Purpose</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'basicInfo.valuationDoneBy', label: 'Valuation Done By' },
                        { key: 'valuationPurpose.purposeForValuation', label: 'Purpose For Valuation' },
                        { key: 'briefDescription.briefDescription', label: 'Brief Description of Property' },
                        { key: 'briefDescription.revenueDetails', label: 'Revenue Details as per Sale Deed' },
                        { key: 'briefDescription.areaOfLand', label: 'Area of Land' },
                        { key: 'briefDescription.valueOfLand', label: 'Value of Land' },
                        { key: 'briefDescription.areaOfConstruction', label: 'Area of Construction' },
                        { key: 'briefDescription.valueOfConstruction', label: 'Value of Construction' },
                        { key: 'briefDescription.totalMarketValue', label: 'Total Market Value' },
                        { key: 'valuationSummary.realisableValue.amount', label: 'Realisable Value - Amount' },
                        { key: 'valuationSummary.distressValue.amount', label: 'Distress Value - Amount' },
                        { key: 'valuationSummary.jantriValue.amount', label: 'Jantri Value - Amount' },
                        { key: 'briefDescription.insurableValue', label: 'Insurable Value' },
                        { key: 'valuationPurpose.dateOfInspection', label: 'Date Of Inspection' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* documents - List of documents produced for perusal */}
            <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-4">Documents Produced for Perusal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'documents.ownershipDocuments.conveyanceDeed', label: 'Conveyance Deed' },
                        { key: 'documents.ownershipDocuments.saleCertificate', label: 'Sale Certificate' },
                        { key: 'documents.propertyRecords.naLatter', label: 'NA Letter' },
                        { key: 'documents.permissions.healthSafetyPlan', label: 'Industrial Health & Safety Plan' },
                        { key: 'ownerDetails.ownerNameAddress', label: 'Name of the owner(s)' },
                        { key: 'ownerDetails.ownerPhoneShare', label: 'their address(es) with Phone no.' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>



            {/* propertyLocation - 9 fields */}
            <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <h4 className="font-bold text-gray-900 mb-4">Property Location Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'propertyLocation.plotNumber', label: 'Plot No. / Survey No.' },
                        { key: 'propertyLocation.doorNumber', label: 'Door No.' },
                        { key: 'propertyLocation.tsNumber', label: 'T. S. No. / Village' },
                        { key: 'propertyLocation.ward', label: 'Ward / Taluka' },
                        { key: 'propertyLocation.mandal', label: 'Mandal / District' },
                        { key: 'propertyLocation.district', label: 'District' },
                        { key: 'propertyLocation.village', label: 'Village' },
                        { key: 'propertyLocation.postalAddress', label: 'Postal Address of Property' }
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* areaClassification - 10 fields */}
            <div className="mb-6 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                <h4 className="font-bold text-gray-900 mb-4">Area Classification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'areaClassification.cityTown', label: 'City / Town' },
                        { key: 'areaClassification.residentialArea', label: 'Residential Area' },
                        { key: 'areaClassification.commercialArea', label: 'Commercial Area' },
                        { key: 'areaClassification.industrialArea', label: 'Industrial Area' },
                        { key: 'areaClassification.highMiddlePoor', label: 'High / Middle / Poor' },
                        { key: 'areaClassification.urbanSemiUrbanRural', label: 'Urban / Semi Urban / Rural' },
                        { key: 'areaClassification.corporationLimitVillage', label: 'Corporation limit / Village Panchayat / Municipality' },
                        { key: 'areaClassification.governmentEnactments', label: 'Covered under State/Central Govt. Enactments' },
                        { key: 'areaClassification.agriculturalLandConversion', label: 'Agricultural Land Conversion' }
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* boundaryDetails - 8 fields */}
            <div className="mb-6 p-6 bg-teal-50 rounded-2xl border border-teal-100">
                <h4 className="font-bold text-gray-900 mb-4">Boundaries of the Property</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { key: 'boundaryDetails.east.deed', label: 'East - As per Conveyance Deed' },
                        { key: 'boundaryDetails.east.visit', label: 'East - As per Visit' },
                        { key: 'boundaryDetails.west.deed', label: 'West - As per Conveyance Deed' },
                        { key: 'boundaryDetails.west.visit', label: 'West - As per Visit' },
                        { key: 'boundaryDetails.north.deed', label: 'North - As per Conveyance Deed' },
                        { key: 'boundaryDetails.north.visit', label: 'North - As per Visit' },
                        { key: 'boundaryDetails.south.deed', label: 'South - As per Conveyance Deed' },
                        { key: 'boundaryDetails.south.visit', label: 'South - As per Visit' }
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* dimensions - 8 fields */}
            <div className="mb-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-gray-900 mb-4">Dimensions of the Site</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { key: 'dimensions.north.deed', label: 'North - As per Deed' },
                        { key: 'dimensions.north.actual', label: 'North - Actuals' },
                        { key: 'dimensions.south.deed', label: 'South - As per Deed' },
                        { key: 'dimensions.south.actual', label: 'South - Actuals' },
                        { key: 'dimensions.east.deed', label: 'East - As per Deed' },
                        { key: 'dimensions.east.actual', label: 'East - Actuals' },
                        { key: 'dimensions.west.deed', label: 'West - As per Deed' },
                        { key: 'dimensions.west.actual', label: 'West - Actuals' }
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* coordinates - 3 fields (including site coordinates) */}
            <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-gray-900 mb-4">Coordinates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { key: 'coordinates.latitude', label: 'Latitude' },
                        { key: 'coordinates.longitude', label: 'Longitude' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* extent - 2 fields */}
            <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-gray-900 mb-4">Extent of the Site</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { key: 'extent.extentOfSite', label: 'Extent of the Site' },
                        { key: 'extent.extentConsideredForValuation', label: 'Extent Considered for Valuation' }
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* occupationStatus - 3 fields */}
            <div className="mb-6 p-6 bg-lime-50 rounded-2xl border border-lime-100">
                <h4 className="font-bold text-gray-900 mb-4">Occupation Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'occupationStatus.occupiedByOwnerTenant', label: 'Occupied by Owner / Tenant' },
                        { key: 'occupationStatus.tenancyDuration', label: 'Tenancy Duration (if tenant)' },
                        { key: 'occupationStatus.rentReceivedPerMonth', label: 'Rent Received per Month' }
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            {renderFormField(field)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderValuationTab = () => {
        return (
            <div className="space-y-6">
                {/* SITE CHARACTERISTICS */}
                <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Site Characteristics</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'siteCharacteristics.classificationOfLocality', label: 'Classification of Locality' },
                            { key: 'siteCharacteristics.developmentSurroundingArea', label: 'Development Surrounding Area' },
                            { key: 'siteCharacteristics.frequentFloodingSubmerging', label: 'Possibility of frequent flooding' },
                            { key: 'siteCharacteristics.feasibilityCivicAmenities', label: 'Feasibility Civic Amenities' },
                            { key: 'siteCharacteristics.levelOfLandTopographical', label: 'Level of Land Topographical' },
                            { key: 'siteCharacteristics.shapeOfLand', label: 'Shape of Land' },
                            { key: 'siteCharacteristics.typeOfUse', label: 'Type of Use' },
                            { key: 'siteCharacteristics.usageRestriction', label: 'Any Usage Restriction' },
                            { key: 'siteCharacteristics.townPlanningApprovedLayout', label: 'Town Planning Approved Layout' },
                            { key: 'siteCharacteristics.cornerPlotIntermittentPlot', label: 'Corner Plot Intermittent Plot' },
                            { key: 'siteCharacteristics.roadFacilities', label: 'Road Facilities' },
                            { key: 'siteCharacteristics.typeOfRoadAvailable', label: 'Type of Road Available' },
                            { key: 'siteCharacteristics.widthOfRoad', label: 'Width of Road' },
                            { key: 'siteCharacteristics.lockedLand', label: 'Locked Land' },
                            { key: 'siteCharacteristics.waterPotentiality', label: 'Water Potentiality' },
                            { key: 'siteCharacteristics.undergroundSewerageSystem', label: 'Underground Sewerage System' },
                            { key: 'siteCharacteristics.powerSupplyAtSite', label: 'Power Supply at Site' },
                            { key: 'siteCharacteristics.advantageOfSite1', label: 'Advantage of Site 1' },
                            { key: 'siteCharacteristics.advantageOfSite2', label: 'Advantage of Site 2' },
                            { key: 'siteCharacteristics.specialRemarks1', label: 'Special Remarks 1' },
                            { key: 'siteCharacteristics.specialRemarks2', label: 'Special Remarks 2' }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>
                </div>



                {/* LAND VALUATION */}
                <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Land Valuation</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'landValuation.sizeOfPlot.northSouth', label: 'Size of Plot - North South' },
                            { key: 'landValuation.sizeOfPlot.eastWest', label: 'Size of Plot - East West' },
                            { key: 'landValuation.sizeOfPlot.total', label: 'Size of Plot - Total' },
                            { key: 'landValuation.marketRate.prevailingRate', label: 'Market Rate - Prevailing Rate' },
                            { key: 'landValuation.marketRate.landBuildingAreaRateMethod', label: 'Market Rate - Land Building Area Rate' },
                            { key: 'landValuation.guidelineRate.fromRegistrar', label: 'Guideline Rate - From Registrar' },
                            { key: 'landValuation.guidelineRate.adoptedRate', label: 'Guideline Rate - Adopted Rate' },
                            { key: 'landValuation.jantriRate.rate', label: 'Jantri Rate - Rate' },
                            { key: 'landValuation.jantriRate.landValue', label: 'Jantri Rate - Land Value' },
                            { key: 'landValuation.jantriRate.buildingValue', label: 'Jantri Rate - Building Value' },
                            { key: 'landValuation.jantriRate.totalValue', label: 'Jantri Rate - Total Value' },
                            { key: 'landValuation.estimatedValueOfLand', label: 'Estimated Value of Land' },
                            { key: 'landValuation.variationClause', label: 'Variation Clause' }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* BUILDING DETAILS */}
                <div className="mb-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Building Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'buildingDetails.typeOfBuilding', label: 'Type of Building' },
                            { key: 'buildingDetails.typeOfConstruction', label: 'Type of Construction' },
                            { key: 'buildingDetails.yearOfConstruction', label: 'Year of Construction' },
                            { key: 'buildingDetails.numberOfFloorsHeight', label: 'Number of Floors Height' },
                            { key: 'buildingDetails.plinthAreaFloorWise', label: 'Plinth Area Floor Wise' },
                            { key: 'buildingDetails.condition.exterior', label: 'Condition - Exterior' },
                            { key: 'buildingDetails.condition.interior', label: 'Condition - Interior' },
                            { key: 'buildingDetails.approvedMap.issuingAuthority', label: 'Approved Map - Issuing Authority' },
                            { key: 'buildingDetails.approvedMap.genuinessVerified', label: 'Approved Map - Genuineness Verified' },
                            { key: 'buildingDetails.otherCommentsOnApprovedPlan', label: 'Other Comments on Approved Plan' }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>

                    {/* Part A: Market Value Analysis of Land */}
                    <div className="mt-6 pt-6 border-t border-emerald-200">
                        <h5 className="font-bold text-gray-900 mb-3 text-sm">Part A: Market Value Analysis of Land</h5>
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-emerald-100 border border-emerald-200">
                                        <th className="px-2 py-2 text-left font-bold text-gray-900 border border-emerald-200 min-w-[150px]">Plot Description</th>
                                        <th className="px-2 py-2 text-center font-bold text-gray-900 border border-emerald-200 min-w-[100px]">Area (Sq.Yd)</th>
                                        <th className="px-2 py-2 text-center font-bold text-gray-900 border border-emerald-200 min-w-[100px]">Rate</th>
                                        <th className="px-2 py-2 text-center font-bold text-gray-900 border border-emerald-200 min-w-[120px]">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border border-emerald-200 bg-white">
                                        <td className="px-2 py-2 border border-emerald-200">
                                            <Input
                                                placeholder="Plot Description"
                                                value={formData.pdfDetails?.landValuation?.plotDescription || ""}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    pdfDetails: { ...prev.pdfDetails, landValuation: { ...prev.pdfDetails.landValuation, plotDescription: e.target.value } }
                                                }))}
                                                className="h-7 text-xs"
                                                disabled={!canEdit}
                                            />
                                        </td>
                                        <td className="px-2 py-2 border border-emerald-200">
                                            <Input
                                                type="number"
                                                placeholder="Area Sq.Yd"
                                                value={formData.pdfDetails?.landValuation?.areaSqYd || ""}
                                                onChange={(e) => {
                                                    const areaSqYd = e.target.value;
                                                    const rate = formData.pdfDetails?.landValuation?.rate || 0;
                                                    const total = areaSqYd && rate ? Math.round(parseFloat(areaSqYd) * parseFloat(rate)) : "";
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        pdfDetails: {
                                                            ...prev.pdfDetails,
                                                            landValuation: {
                                                                ...prev.pdfDetails.landValuation,
                                                                areaSqYd: areaSqYd,
                                                                totalValue: total.toString(),
                                                                sayRO: total.toString()
                                                            }
                                                        }
                                                    }));
                                                    // Trigger recalculation of totalAbstract.partA
                                                    handleValuationChange('landValuation.sayRO', total.toString());
                                                }}
                                                className="h-7 text-xs"
                                                disabled={!canEdit}
                                            />
                                        </td>
                                        <td className="px-2 py-2 border border-emerald-200">
                                            <Input
                                                type="number"
                                                placeholder="Rate"
                                                value={formData.pdfDetails?.landValuation?.rate || ""}
                                                onChange={(e) => {
                                                    const rate = e.target.value;
                                                    const areaSqYd = formData.pdfDetails?.landValuation?.areaSqYd || 0;
                                                    const total = rate && areaSqYd ? Math.round(parseFloat(areaSqYd) * parseFloat(rate)) : "";
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        pdfDetails: {
                                                            ...prev.pdfDetails,
                                                            landValuation: {
                                                                ...prev.pdfDetails.landValuation,
                                                                rate: rate,
                                                                totalValue: total.toString(),
                                                                sayRO: total.toString()
                                                            }
                                                        }
                                                    }));
                                                    // Trigger recalculation of totalAbstract.partA
                                                    handleValuationChange('landValuation.sayRO', total.toString());
                                                }}
                                                className="h-7 text-xs"
                                                disabled={!canEdit}
                                            />
                                        </td>
                                        <td className="px-2 py-2 border border-emerald-200">
                                            <Input
                                                type="number"
                                                placeholder="Total"
                                                value={formData.pdfDetails?.landValuation?.totalValue || ""}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    pdfDetails: { ...prev.pdfDetails, landValuation: { ...prev.pdfDetails.landValuation, totalValue: e.target.value } }
                                                }))}
                                                className="h-7 text-xs bg-gray-50"
                                                disabled={true}
                                                title="Automatically calculated from Area × Rate (rounded)"
                                            />
                                        </td>
                                    </tr>
                                    {/* Say. R/O Row - Summary */}
                                    <tr className="border border-emerald-200 bg-emerald-50">
                                        <td className="px-2 py-2 border border-emerald-200"></td>
                                        <td className="px-2 py-2 border border-emerald-200"></td>
                                        <td className="px-2 py-2 border border-emerald-200 text-right font-bold text-gray-900">Say. R/O</td>
                                        <td className="px-2 py-2 border border-emerald-200">
                                            <Input
                                                type="number"
                                                placeholder="Rounded Value"
                                                value={formData.pdfDetails?.landValuation?.sayRO || ""}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    pdfDetails: { ...prev.pdfDetails, landValuation: { ...prev.pdfDetails.landValuation, sayRO: e.target.value } }
                                                }))}
                                                className="h-7 text-xs  font-semibold"
                                                disabled={!canEdit}
                                                title="Say Rate/Order - Rounded figure of total value"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 italic">Total = Area (Sq.Yd) × Rate, automatically rounded to nearest whole number. Say. R/O shows the rounded final value.</p>
                    </div>
                </div>

                {/* CONSTRUCTION COST ANALYSIS */}
                <div className="mb-6 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h4 className="font-bold text-gray-900 mb-3">Part -B Construction Cost Analysis</h4>
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-rose-100 border border-rose-200">
                                    <th className="px-2 py-2 text-left font-bold text-gray-900 border border-rose-200 min-w-[50px]">Sr. No.</th>
                                    <th className="px-2 py-2 text-left font-bold text-gray-900 border border-rose-200 min-w-[150px]">Area Details</th>
                                    <th className="px-2 py-2 text-left font-bold text-gray-900 border border-rose-200 min-w-[120px]">Area - SMT</th>
                                    <th className="px-2 py-2 text-left font-bold text-gray-900 border border-rose-200 min-w-[120px]">Area - SYD</th>
                                    <th className="px-2 py-2 text-left font-bold text-gray-900 border border-rose-200 min-w-[140px]">Rate per SYD</th>
                                    <th className="px-2 py-2 text-left font-bold text-gray-900 border border-rose-200 min-w-[150px]">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>Value</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const updated = customConstructionCostFields ? [...customConstructionCostFields] : [];
                                                    updated.push({
                                                        id: `custom_construction_${Date.now()}_${Math.random()}`,
                                                        srNo: (updated.length + 21).toString(),
                                                        areaDetails: '',
                                                        areaSMT: '',
                                                        areaSYD: '',
                                                        ratePerSYD: '',
                                                        value: ''
                                                    });
                                                    setCustomConstructionCostFields(updated);
                                                }}
                                                disabled={!canEdit}
                                                className="px-1.5 py-0.5 bg-white hover:bg-gray-100 text-rose-600 text-sm font-bold rounded disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                                title="Add Custom Field"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">1</td>
                                    <td className="px-2 py-2 border border-rose-200">Security Room</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.securityRoom?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('securityRoom.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.securityRoom?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('securityRoom.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.securityRoom?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('securityRoom.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.securityRoom?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">2</td>
                                    <td className="px-2 py-2 border border-rose-200">Labours Quarter</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.laboursQuarter?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('laboursQuarter.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.laboursQuarter?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('laboursQuarter.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.laboursQuarter?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('laboursQuarter.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.laboursQuarter?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">3</td>
                                    <td className="px-2 py-2 border border-rose-200">Store Room</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.storeRoom?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('storeRoom.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.storeRoom?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('storeRoom.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.storeRoom?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('storeRoom.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.storeRoom?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">4</td>
                                    <td className="px-2 py-2 border border-rose-200">Gallery room</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.galleryRoom?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('galleryRoom.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.galleryRoom?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('galleryRoom.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.galleryRoom?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('galleryRoom.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.galleryRoom?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">5</td>
                                    <td className="px-2 py-2 border border-rose-200">FF Labours Quarter</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.ffLaboursQuarter?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('ffLaboursQuarter.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.ffLaboursQuarter?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('ffLaboursQuarter.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.ffLaboursQuarter?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('ffLaboursQuarter.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.ffLaboursQuarter?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">6</td>
                                    <td className="px-2 py-2 border border-rose-200">GF Room</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.gfRoom?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('gfRoom.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.gfRoom?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('gfRoom.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.gfRoom?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('gfRoom.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.gfRoom?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">7</td>
                                    <td className="px-2 py-2 border border-rose-200">GF Wash Room</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.gfWashRoom?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('gfWashRoom.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.gfWashRoom?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('gfWashRoom.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.gfWashRoom?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('gfWashRoom.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.gfWashRoom?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">8</td>
                                    <td className="px-2 py-2 border border-rose-200">Office-1</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.office1?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('office1.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.office1?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('office1.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.office1?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('office1.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.office1?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">9</td>
                                    <td className="px-2 py-2 border border-rose-200">Wash Room</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.washRoom?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('washRoom.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.washRoom?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('washRoom.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.washRoom?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('washRoom.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.washRoom?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">10</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">11</td>
                                    <td className="px-2 py-2 border border-rose-200">Office-2</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.office2?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('office2.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.office2?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('office2.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.office2?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('office2.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.office2?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">12</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-1</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed1?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed1.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed1?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed1.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed1?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed1.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed1?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">13</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-2/Unit-1</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed2Unit1?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed2Unit1.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed2Unit1?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed2Unit1.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed2Unit1?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed2Unit1.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed2Unit1?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">14</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-2/Unit-2</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed2Unit2?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed2Unit2.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed2Unit2?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed2Unit2.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed2Unit2?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed2Unit2.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed2Unit2?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">15</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-3</td>
                                    <td className="px-2 py-2 border border-rose-200">
                                        <Input
                                            type="number"
                                            placeholder="Area SMT"
                                            value={formData.constructionCostAnalysis?.shed3?.areaSMT || ""}
                                            onChange={(e) => handleConstructionCostChange('shed3.areaSMT', e.target.value)}
                                            className="h-7 text-xs"
                                            disabled={!canEdit}
                                        />
                                    </td>
                                    <td className="px-2 py-2 border border-rose-200">
                                        <Input
                                            type="number"
                                            placeholder="Area SYD"
                                            value={formData.constructionCostAnalysis?.shed3?.areaSYD || ""}
                                            onChange={(e) => handleConstructionCostChange('shed3.areaSYD', e.target.value)}
                                            className="h-7 text-xs"
                                            disabled={!canEdit}
                                        />
                                    </td>
                                    <td className="px-2 py-2 border border-rose-200">
                                        <Input
                                            type="number"
                                            placeholder="Rate per SYD"
                                            value={formData.constructionCostAnalysis?.shed3?.ratePerSYD || ""}
                                            onChange={(e) => handleConstructionCostChange('shed3.ratePerSYD', e.target.value)}
                                            className="h-7 text-xs"
                                            disabled={!canEdit}
                                        />
                                    </td>
                                    <td className="px-2 py-2 border border-rose-200">
                                        <Input
                                            type="number"
                                            placeholder="Value"
                                            value={formData.constructionCostAnalysis?.shed3?.value || ""}
                                            disabled
                                            className="h-7 text-xs bg-gray-100"
                                        />
                                    </td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">16</td>
                                    <td className="px-2 py-2 border border-rose-200">Open shed</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.openShed?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('openShed.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.openShed?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('openShed.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.openShed?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('openShed.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.openShed?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">17</td>
                                    <td className="px-2 py-2 border border-rose-200">Godown</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.godown?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('godown.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.godown?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('godown.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.godown?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('godown.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.godown?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">18</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-3/Unit-1</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed3Unit1?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed3Unit1.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed3Unit1?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed3Unit1.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed3Unit1?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed3Unit1.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed3Unit1?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">19</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-3/Unit-2</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed3Unit2?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed3Unit2.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed3Unit2?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed3Unit2.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed3Unit2?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed3Unit2.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed3Unit2?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-center font-bold">20</td>
                                    <td className="px-2 py-2 border border-rose-200">Shed-3/Unit-3</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={formData.constructionCostAnalysis?.shed3Unit3?.areaSMT || ""} onChange={(e) => handleConstructionCostChange('shed3Unit3.areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={formData.constructionCostAnalysis?.shed3Unit3?.areaSYD || ""} onChange={(e) => handleConstructionCostChange('shed3Unit3.areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={formData.constructionCostAnalysis?.shed3Unit3?.ratePerSYD || ""} onChange={(e) => handleConstructionCostChange('shed3Unit3.ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={formData.constructionCostAnalysis?.shed3Unit3?.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>

                                {/* Custom Rows */}
                                {customConstructionCostFields && customConstructionCostFields.map((field, idx) => (
                                    <tr key={field.id || idx} className="border border-rose-200">
                                        <td className="px-2 py-2 border border-rose-200 text-center font-bold">{21 + idx}</td>
                                        <td className="px-2 py-2 border border-rose-200">
                                            <div className="flex items-center justify-between gap-2">
                                                <Input
                                                    placeholder="Enter field name"
                                                    value={field.name || ""}
                                                    onChange={(e) => {
                                                        const updated = [...customConstructionCostFields];
                                                        updated[idx].name = e.target.value;
                                                        setCustomConstructionCostFields(updated);
                                                    }}
                                                    disabled={!canEdit}
                                                    className="h-7 text-xs flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const updated = customConstructionCostFields.filter((_, i) => i !== idx);
                                                        setCustomConstructionCostFields(updated);
                                                    }}
                                                    disabled={!canEdit}
                                                    className="text-red-500 hover:text-red-700 disabled:text-gray-300 text-lg font-bold hover:bg-red-50 rounded p-1 transition-colors"
                                                    title="Delete field"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SMT" value={field.areaSMT || ""} onChange={(e) => handleCustomConstructionCostChange(idx, 'areaSMT', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                        <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Area SYD" value={field.areaSYD || ""} onChange={(e) => handleCustomConstructionCostChange(idx, 'areaSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                        <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Rate per SYD" value={field.ratePerSYD || ""} onChange={(e) => handleCustomConstructionCostChange(idx, 'ratePerSYD', e.target.value)} className="h-7 text-xs" disabled={!canEdit} /></td>
                                        <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="Value" value={field.value || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                    </tr>
                                ))}

                                <tr className="bg-rose-100 border border-rose-200 font-bold">
                                    <td colSpan="2" className="px-2 py-2 border border-rose-200 text-right">TOTAL</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="0" value={formData.constructionCostAnalysis?.total?.areaSMT || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="0" value={formData.constructionCostAnalysis?.total?.areaSYD || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                    <td className="px-2 py-2 border border-rose-200"></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" placeholder="0" value={formData.constructionCostAnalysis?.total?.totalValue || ""} disabled className="h-7 text-xs bg-gray-100" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* EXTRA ITEMS */}
                <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Part -c Extra Items</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'extraItems.portico', label: 'Portico' },
                            { key: 'extraItems.ornamentalFrontDoor', label: 'Ornamental Front Door' },
                            { key: 'extraItems.sitOutVeranda', label: 'Sit Out Veranda' },
                            { key: 'extraItems.overheadWaterTank', label: 'Overhead Water Tank' },
                            { key: 'extraItems.extraSteelGates', label: 'Extra Steel Gates' },
                            { key: 'extraItems.total', label: 'Total', disabled: true }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>
                </div>


                {/* AMENITIES */}
                <div className="mb-6 p-6 bg-lime-50 rounded-2xl border border-lime-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Part -d Amenities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'amenities.wardrobes', label: 'Wardrobes' },
                            { key: 'amenities.glazedTiles', label: 'Glazed Tiles' },
                            { key: 'amenities.extraSinksBathTub', label: 'Extra Sinks Bath Tub' },
                            { key: 'amenities.marbleFlooring', label: 'Marble Flooring' },
                            { key: 'amenities.interiorDecorations', label: 'Interior Decorations' },
                            { key: 'amenities.architecturalElevation', label: 'Architectural Elevation' },
                            { key: 'amenities.panellingWorks', label: 'Panelling Works' },
                            { key: 'amenities.aluminiumWorks', label: 'Aluminium Works' },
                            { key: 'amenities.aluminiumHandRails', label: 'Aluminium Hand Rails' },
                            { key: 'amenities.falseCeiling', label: 'False Ceiling' },
                            { key: 'amenities.total', label: 'Total', disabled: true }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* MISCELLANEOUS */}
                <div className="mb-6 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Part -e Miscellaneous</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'miscellaneous.separateToiletRoom', label: 'Separate Toilet Room' },
                            { key: 'miscellaneous.separateLumberRoom', label: 'Separate Lumber Room' },
                            { key: 'miscellaneous.separateWaterTankSump', label: 'Separate Water Tank Sump' },
                            { key: 'miscellaneous.treesGardening', label: 'Trees Gardening' },
                            { key: 'miscellaneous.total', label: 'Total', disabled: true }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SERVICES */}
                <div className="mb-6 p-6 bg-sky-50 rounded-2xl border border-sky-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Part -f Services</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'services.waterSupplyArrangements', label: 'Water Supply Arrangements' },
                            { key: 'services.drainageArrangements', label: 'Drainage Arrangements' },
                            { key: 'services.compoundWall', label: 'Compound Wall' },
                            { key: 'services.cbDepositsFittings', label: 'CB Deposits Fittings' },
                            { key: 'services.pavement', label: 'Pavement' },
                            { key: 'services.total', label: 'Total', disabled: true }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOTAL ABSTRACT */}
                <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Total Abstract</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'totalAbstract.partA.value', label: 'Part A - Land Value' },
                            { key: 'totalAbstract.partB.value', label: 'Part B - Building Value' },
                            { key: 'totalAbstract.partC.value', label: 'Part C - Extra Items' },
                            { key: 'totalAbstract.partD.value', label: 'Part D - Amenities Value' },
                            { key: 'totalAbstract.partE.value', label: 'Part E - Miscellaneous Value' },
                            { key: 'totalAbstract.partF.value', label: 'Part F - Services Value' },
                            { key: 'totalAbstract.totalValue', label: 'Total Value', disabled: true },
                            { key: 'totalAbstract.sayValue', label: 'Say Value', disabled: true }
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                {renderFormField(field)}
                            </div>
                        ))}
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

    const renderChecklistTab = () => (
        <div className="space-y-6">
            {/* CHECKLIST OF DOCUMENTS */}
            <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                <h4 className="font-bold text-gray-900 mb-4 text-base">Checklist of Documents</h4>
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-yellow-100 border border-yellow-300">
                                <th className="px-3 py-2 text-left font-bold text-gray-900 border border-yellow-300">Description</th>
                                <th className="px-3 py-2 text-center font-bold text-gray-900 border border-yellow-300 min-w-[120px]">Yes / No</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { key: 'pdfDetails.checklistOfDocuments.engagementLetterConfirmation', label: 'Engagement Letter / Confirmation for Assignment' },
                                { key: 'pdfDetails.checklistOfDocuments.ownershipDocumentsSaleDeed', label: 'Ownership Documents: Sale Deed / Conveyance Deed' },
                                { key: 'pdfDetails.checklistOfDocuments.advTcrLsr', label: 'Adv. TCR / LSR' },
                                { key: 'pdfDetails.checklistOfDocuments.agreementForSaleBanaKhat', label: 'Agreement For Sale / Bana khat' },
                                { key: 'pdfDetails.checklistOfDocuments.propertyCard', label: 'Property Card' },
                                { key: 'pdfDetails.checklistOfDocuments.mortgageDeed', label: 'Mortgage Deed' },
                                { key: 'pdfDetails.checklistOfDocuments.leaseDeed', label: 'Lease Deed' },
                                { key: 'pdfDetails.checklistOfDocuments.index2', label: 'Index - 2' },
                                { key: 'pdfDetails.checklistOfDocuments.vf712InCaseOfLand', label: 'VF: 7/12 in case of Land' },
                                { key: 'pdfDetails.checklistOfDocuments.naOrder', label: 'NA order - mentioned in Sale deed, Title report' },
                                { key: 'pdfDetails.checklistOfDocuments.approvedLayoutPlan', label: 'Approved Layout Plan' },
                                { key: 'pdfDetails.checklistOfDocuments.commencementLetter', label: 'Commencement Letter' },
                                { key: 'pdfDetails.checklistOfDocuments.buPermission', label: 'BU Permission' },
                                { key: 'pdfDetails.checklistOfDocuments.eleMeterPhoto', label: 'Ele. Meter Photo' },
                                { key: 'pdfDetails.checklistOfDocuments.lightBill', label: 'Light Bill' },
                                { key: 'pdfDetails.checklistOfDocuments.muniTaxBill', label: 'Muni. Tax Bill' },
                                { key: 'pdfDetails.checklistOfDocuments.numberingFlatBungalowPlotNo', label: 'Numbering - Flat / bungalow / Plot No. / Identification on Site' },
                                { key: 'pdfDetails.checklistOfDocuments.boundariesOfPropertyProperDemarcation', label: 'Boundaries of Property - Proper Demarcation' },
                                { key: 'pdfDetails.checklistOfDocuments.mergedProperty', label: 'Merged Property?' },
                                { key: 'pdfDetails.checklistOfDocuments.premiseCanBeSeparatedEntranceDoor', label: 'Premise can be Separated, and Entrance / Dorr is available for the mortgaged property?' },
                                { key: 'pdfDetails.checklistOfDocuments.landIsLocked', label: 'Land is Locked?' },
                                { key: 'pdfDetails.checklistOfDocuments.propertyIsRentedToOtherParty', label: 'Property is rented to Other Party' },
                                { key: 'pdfDetails.checklistOfDocuments.ifRentedRentAgreementIsProvided', label: 'If Rented - Rent Agreement is Provided?' },
                                { key: 'pdfDetails.checklistOfDocuments.siteVisitPhotos', label: 'Site Visit Photos' },
                                { key: 'pdfDetails.checklistOfDocuments.selfieWithOwnerIdentifier', label: 'Selfie with Owner / Identifier' },
                                { key: 'pdfDetails.checklistOfDocuments.mobileNo', label: 'Mobile No.' },
                                { key: 'pdfDetails.checklistOfDocuments.dataSheet', label: 'Data Sheet' },
                                { key: 'pdfDetails.checklistOfDocuments.tentativeRate', label: 'Tentative Rate' },
                                { key: 'pdfDetails.checklistOfDocuments.saleInstanceLocalInquiryVerbalSurvey', label: 'Sale Instance / Local Inquiry / Verbal Survey' },
                                { key: 'pdfDetails.checklistOfDocuments.brokerRecording', label: 'Broker Recording' },
                                { key: 'pdfDetails.checklistOfDocuments.pastValuationRate', label: 'Past Valuation Rate' }
                            ].map((item, index) => (
                                <tr key={item.key} className={index % 2 === 0 ? 'bg-white border border-yellow-200' : 'bg-yellow-50 border border-yellow-200'}>
                                    <td className="px-3 py-2 border border-yellow-300 text-gray-900">{item.label}</td>
                                    <td className="px-3 py-2 border border-yellow-300 text-center">
                                        {(() => {
                                            const value = getNestedProperty(formData, item.key);
                                            return (
                                                <select
                                                    value={value === 'yes' || value === true ? 'yes' : value === 'no' || value === false ? 'no' : ''}
                                                    onChange={(e) => setFormData(prev => {
                                                        const newFormData = JSON.parse(JSON.stringify(prev));
                                                        setNestedProperty(newFormData, item.key, e.target.value === 'yes' ? 'yes' : e.target.value === 'no' ? 'no' : '');
                                                        return newFormData;
                                                    })}
                                                    disabled={!canEdit}
                                                    className="h-7 text-xs rounded border border-gray-300 bg-white px-2 py-1"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="yes">Yes</option>
                                                    <option value="no">No</option>
                                                </select>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

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
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Rajesh House Valuation Form</h1>
                        <p className="text-xs text-neutral-500 mt-1">{!isLoggedIn && "Read-Only Mode"}</p>
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Main Form */}
                    <div className="col-span-12 sm:col-span-9 lg:col-span-10">
                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200 flex-shrink-0">
                                <CardTitle className="text-sm font-bold text-neutral-900">Rajesh House Details</CardTitle>
                                <p className="text-neutral-600 text-xs mt-1.5 font-medium">* Required fields</p>
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

                                    {/* Valuation Details Tab */}
                                    {activeTab === 'valuation' && (
                                        <div>
                                            {/* Sub-tab Navigation */}
                                            <div className="flex gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 overflow-x-auto">
                                                {[
                                                    { id: 'general', label: 'GENERAL' },
                                                    { id: 'valuation', label: 'VALUATION' },
                                                    { id: 'checklist', label: 'CHECKLIST' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setActiveValuationSubTab(tab.id)}
                                                        className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap flex-shrink-0 transition-all ${activeValuationSubTab === tab.id
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
                                                        <span className="text-xs text-gray-500">{customFieldName.length}/100 characters</span>
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
                                                        <span className="text-xs text-gray-500">{customFieldValue.length}/500 characters</span>
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
                                                            <span className="bg-blue-500 text-white text-xs font-semibold ml-2 px-3 py-1 rounded-full">
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