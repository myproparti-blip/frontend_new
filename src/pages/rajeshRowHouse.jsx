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
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, RadioGroup, RadioGroupItem, ChipSelect, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui";
import { getRajeshRowHouseById, updateRajeshRowHouse, managerSubmitRajeshRowHouse, getLastSubmittedRajeshRowHouse } from "../services/rajeshRowHouseService";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";
import { uploadPropertyImages, uploadLocationImages, uploadDocuments } from "../services/imageService";
import { invalidateCache } from "../services/axios";
import { getCustomOptions } from "../services/customOptionsService";
import ClientInfoPanel from "../components/ClientInfoPanel";
import DocumentsPanel from "../components/DocumentsPanel";
import { generateRowHouse } from "../services/rowHousePdf";

const RajeshRowHouseEditForm = ({ user, onLogin }) => {
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
    const [bankImagePreview, setBankImagePreview] = useState(null);
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
        documentPreviews: [],
        bankImage: null,
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

        // PDF DETAILS (AUTO-EXTRACTED)
        pdfDetails: {
            // CHECKLIST OF DOCUMENTS (referenced from main form checklist_ fields)
            checklist_engagementLetterConfirmation: '',
            checklist_ownershipDocumentsSaleDeed: '',
            checklist_advTcrLsr: '',
            checklist_allotmentLetter: '',
            checklist_kabulatLekh: '',
            checklist_mortgageDeed: '',
            checklist_leaseDeed: '',
            checklist_index2: '',
            checklist_vf712InCaseOfLand: '',
            checklist_naOrder: '',
            checklist_approvedPlan: '',
            checklist_commencementLetter: '',
            checklist_buPermission: '',
            checklist_eleMeterPhoto: '',
            checklist_lightBill: '',
            checklist_muniTaxBill: '',
            checklist_numberingFlatPlotNoIdentification: '',
            checklist_boundariesPropertyDemarcation: '',
            checklist_mergedProperty: '',
            checklist_premiseCanBeSeparatedEntrance: '',
            checklist_landIsLocked: '',
            checklist_propertyIsRentedToOtherParty: '',
            checklist_ifRentedRentAgreementProvided: '',
            checklist_siteVisitPhotos: '',
            checklist_selfieWithOwnerIdentifier: '',
            checklist_mobileNo: '',
            checklist_dataSheet: '',
            checklist_tentativeRate: '',
            checklist_saleInstanceLocalInquiry: '',
            checklist_brokerRecording: '',
            checklist_pastValuationRate: '',

            // CHARACTERISTICS OF LOCALITY
            characteristicOfLocality: '',
            classificationOfLocality: '',
            developmentSurroundingarea: '',
            developmentPossibilityFutureCommercialMarketLike: '',
            developmentFootholdMarketScopeBuilding: '',
            developmentFossilusMarcetcombinedMarketConditions: '',
            developmentLeveloflandBuilding: '',
            developmentShapeoflandi: '',
            developmentTypeofBuildingComplex: '',
            developmentUseLandConstructionlocalised: '',
            developmentLandapprovalavailableLandApprovalavailable: '',
            developmentYes: '',
            developmentBoundariesroadAvailable: '',
            developmentC2Notavailable: '',

            // PART A - MARKET VALUE DETAILS
            part_A_landarea_SqYd: '',
            part_A_rateSqYd: '',
            part_A_totalConstructionCost: '',
            part_A_detailsAlongChangingAccordingtoProperty: '',
            part_A_detailsofLandandValueofLand: '',

            // PART B - CONSTRUCTION ANALYSIS
            part_B_areaDetails_SqM: '',
            part_B_areaDetails_SqYd: '',
            part_B_measurementBasisArea_SqYd: '',
            part_B_measurementBasisHeight_SqYd: '',
            part_B_pipeNumber: '',
            part_B_surveyNumberofLand: '',
            part_B_existenceOfRoadAvailable: '',
            part_B_treeCountPropertyDetails: '',
            part_B_yearConstructionBuilding: '',
            part_B_plotShapeAndCondition: '',
            part_B_conditionOfPlot: '',
            part_B_conditionOfBuildingStructure: '',
            part_B_generalConditionInteriorExterior: '',
            part_B_existencePowerAvailable: '',
            part_B_existenceWaterAvailable: '',
            part_B_interiorExteriorPoorCondition: '',

            // LOCALITY - DETAILED
            locality_cityTownOrVillage: '',
            locality_residentialArea: '',
            locality_commercialArea: '',
            locality_classificationArea: '',
            locality_highMiddleRuralType: '',
            locality_unionSectorCommunityLocationDetails: '',
            locality_municipalCorporationCommercialLocationDetails: '',
            locality_governmentSector: '',
            locality_areaLocality_ImpactOnProperty: '',
            locality_agricultureLandAllowedPropertyCommercialUse: '',
            locality_restrictionsOnPropertyFuture: '',
            locality_interestOfPropertyScopeForBuilding: '',
            locality_scopePropertyForBuilding: '',

            // LEVEL OF BUILDING
            building_estimatedValueOfLand: '',
            building_typeOfBuildingDetails: '',
            building_typeOfConstructionDetails: '',
            building_yearOfConstructionBuilding: '',
            building_numberOfFloorAreaDetails: '',
            building_dimensionsOfBuiltArea: '',
            building_binAreaSize: '',
            building_conditionOfTheBuildingDetails: '',
            building_conditionExcellent: '',
            building_conditionGood: '',
            building_conditionNormal: '',
            building_conditionPoor: '',

            // PROPERTY SHAPE & UTILITIES
            property_wherePropertyLocated: '',
            property_propertyOccupiedBy: '',
            property_buildingFootprintDetails: '',
            property_buildingElevationDetails: '',
            property_buildingSurroundingAreaDetails: '',
            property_buildingTypeOfConstructionDetails: '',
            property_buildingNoOfFloorsDetails: '',
            property_buildingNoOfBedroomsDetails: '',
            property_distressedSalesPropertyCondition: '',
            property_shelterCondition: '',
            property_sqft: '',
            property_ratePerSqft: '',
            property_costAnalysisPerSqft: '',
            property_detailsOfValueOfProperty: '',

            // BOUNDARY & ACCESS
            boundary_boundaryConditionDetails: '',
            boundary_roadAvailableDetails: '',
            boundary_roadWidthDetails: '',
            boundary_approachableTypeOfRoad: '',
            boundary_typeOfRoadAccessible: '',
            boundary_roadAccessibilityDetails: '',

            // ENCROACHMENTS & ISSUES
            encroachment_underGroundSewerageSystemArea: '',
            encroachment_restrictionsWaterPointing: '',

            // VALUATION DETAILS
            valuation_appreciationProperty: '',
            valuation_depreciation: '',
            valuation_distressSale: '',
            valuation_interimValueProperty: '',

            // CERTIFICATE OF VALUATION
            certificate_certificateNumber: '',
            certificate_dateOfValuation: '',
            certificate_appraiserName: '',
            certificate_appraiserLicense: '',

            // PROPERTY AT A GLANCE
            propertyGlance_applicant: '',
            propertyGlance_valuationDrawValue: '',
            propertyGlance_purposeOfValuation: '',
            propertyGlance_nameOfOwner: '',
            propertyGlance_propertyAddress: '',
            propertyGlance_briefDescriptionProperty: '',

            // MARKET VALUE DETAILS
            market_totalPlotArea_SqYd: '',
            market_totalPlotArea_SqM: '',
            market_ratePerSqYd: '',
            market_ratePerSqM: '',
            market_ratePerSqft: '',
            market_rateSqm: '',
            market_totalMarketValue: '',
            market_totalMarketValueInWords: '',
            market_marketValue: '',
            market_pricePerSqft: '',
            market_marketDemand: '',
            market_investmentPotential: '',
            market_marketValuePerSqft: '',
            market_distressValuePerSqft: '',
            market_loanValuePerSqft: '',

            // LOAN DETAILS
            loan_loanAmount: '',
            loan_loanToValueRatio: '',
            loan_loanValueTotal: '',

            // SITE DESCRIPTION
            site_siteDescription: '',
            site_locationProximity: '',
            site_accessibilityDetails: '',

            // STRUCTURE & CONDITION
            structure_structureType: '',
            structure_conditionOfBuilding: '',
            structure_maintenanceStatus: '',

            // AREA MEASUREMENT
            area_carpetArea: '',
            area_builtUpArea: '',
            area_plotArea: '',
            area_totalBuiltUpArea: '',
            area_balconyArea: '',

            // AMENITIES & FACILITIES
            amenities_electricity: '',
            amenities_waterSupply: '',
            amenities_sewerage: '',
            amenities_carParking: '',

            // CONSTRUCTION DETAILS
            construction_foundationType: '',
            construction_roofType: '',
            construction_floorsInBuilding: '',
            construction_totalConstructionCost: '',
            construction_groundFloor: '',
            construction_firstFloor: '',
            construction_secondFloor: '',
            construction_thirdFloor: '',
            construction_otherFloors: '',

            // OBSERVED ISSUES & REMARKS
            issues_majorIssuesObserved: '',
            issues_minorRepairsNeeded: '',
            issues_specialRemarks: '',
            issues_specialRemarksAboutValuation: '',

            // APPRAISER OBSERVATIONS
            appraiser_observationsByAppraiser: '',
            appraiser_futureGrowthPotential: '',
            appraiser_riskFactors: '',

            // DOCUMENT UPLOAD EVIDENCE
            documents_certificateOfValuationFile: '',
            documents_propertyPhotographsFile: '',
            documents_propertyDocumentsFile: '',
            documents_otherDocumentsFile: '',

            // SPECIFICATION DETAILS
            specification_specifications: '',
            specification_additionalInformation: '',
            specification_notesAndComments: '',

            // STATUS & DATES
            status_valuationStatus: '',
            status_valuationApprovedDate: '',
            status_valuationRejectedDate: '',
            status_valuationRevisedDate: '',
            status_dateOfValuationReport: '',
            status_placeOfValuation: '',

            // CONSTRUCTION COST ANALYSIS
            costAnalysis_areaSecurityQuantum: '',
            costAnalysis_lossPlotArea: '',
            costAnalysis_lossStoreRoom: '',
            costAnalysis_lossDoubleQuantum: '',
            costAnalysis_lossgranary: '',
            costAnalysis_lossquartersquare: '',
            costAnalysis_lossGTRoomArea: '',
            costAnalysis_lossWall: '',
            costAnalysis_lossOffice1: '',
            costAnalysis_lossWallRoom: '',
            costAnalysis_lossOffice2: '',
            costAnalysis_lossShelteredArea: '',
            costAnalysis_lossShed3UKold: '',
            costAnalysis_lossShed3UKold2: '',
            costAnalysis_lossShed3UKold3: '',
            costAnalysis_totalarea_sqft: '',
            costAnalysis_totalamountin_Rs: '',
            costAnalysis_sqYdrate: '',
            costAnalysis_ratedetailsChange_sqft: '',

            // CONSTRUCTION COST VALUES
            constructionValues_rateValue_SQM: '',
            constructionValues_estimatedValues_sqft: '',
            constructionValues_areaSqft: '',
            constructionValues_areaSqM: '',
            constructionValues_estimatedValueSqYd: '',

            // FINAL VALUATION SUMMARY
            finalValuation_estimatedValueOfBuild: '',
            finalValuation_estimatedValueOfBuilding: '',
            finalValuation_totalValueOfProperty: '',
            finalValuation_totalValueInWords: '',
            finalValuation_distressValue: '',
            finalValuation_loanValue: '',

            // APPRAISER & CERTIFICATION
            appraisal_appraiserSignature: '',
            appraisal_appraiserStampDate: '',
            appraisal_dateOfValuationReport: '',
            appraisal_placeOfValuation: '',

            // PROPERTY ANALYSIS & VALUES
            analysisProperty_propertyUseDetails: '',
            analysisProperty_approvedUseByIndustrialArea: '',
            analysisProperty_approvedUseByMunicipalCorporation: '',
            analysisProperty_approvedUseByMunicipalBody: '',
            analysisProperty_approvedUseByRailway: '',
            analysisProperty_approvedUseByAirport: '',

            // LOCATION & IDENTIFICATION
            location_laneNumber: '',
            location_latitude: '',
            location_longitude: '',
            location_areaName: '',
            location_landmarkOrProximity: '',
            location_plotOrBlockNumber: '',
            location_surveyNumber: '',
            location_villageOrTown: '',
            location_district: '',
            location_state: '',
            location_postalCode: '',
            revenueDetailsPerSaleDeed: '',

            // VALUATION CHECKLIST (Yes/No Matrix)
            checklist_engagementLetterConfirmation: '',
            checklist_ownershipDocumentsSaleDeed: '',
            checklist_advTcrLsr: '',
            checklist_allotmentLetter: '',
            checklist_kabulatLekh: '',
            checklist_mortgageDeed: '',
            checklist_leaseDeed: '',
            checklist_index2: '',
            checklist_vf712InCaseOfLand: '',
            checklist_naOrder: '',
            checklist_approvedPlan: '',
            checklist_commencementLetter: '',
            checklist_buPermission: '',
            checklist_eleMeterPhoto: '',
            checklist_lightBill: '',
            checklist_muniTaxBill: '',
            checklist_numberingFlatPlotNoIdentification: '',
            checklist_boundariesPropertyDemarcation: '',
            checklist_mergedProperty: '',
            checklist_premiseCanBeSeparatedEntrance: '',
            checklist_landIsLocked: '',
            checklist_propertyIsRentedToOtherParty: '',
            checklist_ifRentedRentAgreementProvided: '',
            checklist_siteVisitPhotos: '',
            checklist_selfieWithOwnerIdentifier: '',
            checklist_mobileNo: '',
            checklist_dataSheet: '',
            checklist_tentativeRate: '',
            checklist_saleInstanceLocalInquiry: '',
            checklist_brokerRecording: '',
            checklist_pastValuationRate: '',

            // PART C - VALUATION
            partC_valuationOfBuilding: '',
            partC_federalDetailsOfBuildingConstruction: '',
            partC_typeOfBuildingConstruction: '',
            partC_constructionLocalBuilding: '',
            partC_yearOfConstructionBuilding: '',
            partC_numberOfFloorsAreaProperty: '',
            partC_briefAreaUsageOfEachFloor: '',
            partC_planAreaOfEachFloor: '',
            partC_conditionOfTheBuildingValueCondition: '',
            partC_existenceOfElectricalPower: '',
            partC_existenceOfWaterSupply: '',
            partC_existenceOfSewerageSystem: '',
            partC_interiorExteriorPoorCondition: '',

            // DEPRECIATION & VALUATION FACTORS
            depreciation_physicalDepreciation: '',
            depreciation_functionalDepreciation: '',
            depreciation_externalDepreciation: '',
            depreciation_totalDepreciation: '',
            depreciation_percentageDepreciation: '',

            // DISTRESS & LOAN VALUES
            value_marketValue: '',
            value_distressValue: '',
            value_loanValue: '',
            value_marketValueInWords: '',
            value_distressValueInWords: '',
            value_loanValueInWords: '',

            // REMARKS & OBSERVATIONS
            remarks_generalRemarks: '',
            remarks_aboutProperty: '',
            remarks_approvedUseOfProperty: '',
            remarks_datingFutureEnhancement: '',
            remarks_futureGrowthPotential: '',
            remarks_riskFactors: '',
            remarks_specialNotesAndObservations: '',

            // DOCUMENT VALIDATION & CERTIFICATION
            validation_dateOfInspection: '',
            validation_dateOfDocumentedValidation: '',
            validation_certificateOfValuationFile: '',
            validation_validationApprovedDate: '',
            validation_validationRejectedDate: '',

            // BANK & INSURANCE MANDATE
            mandate_bankName: '',
            mandate_bankGuidelinesForValuation: '',
            mandate_insuranceValuationMandates: '',
            mandate_valuationPurpose: '',

            // QR CODE & DIGITAL SIGNATURE
            digital_qrCodeGenerated: '',
            digital_qrCodeLink: '',
            digital_appraiserDigitalSignature: '',
            digital_reportVersion: '',

            // VALUATION REPORT HEADER
            report_comfinancePrice: '',
            report_dateOfInspection: '',
            report_dateOfDocumentProducedSal: '',
            report_seedNo: '',
            report_seedNo_2: '',

            // FINANCIAL ASSISTANCE
            financial_confirmFinancePrice: '',
            financial_totalCost: '',

            // AREA ANALYSIS
            area_analysis_squareArea: '',
            area_analysis_ratePerSqft: '',
            area_analysis_totalRate: '',

            // RATE AND DEPRECIATION
            rate_oldPrice: '',
            rate_depreciation: '',
            rate_ageOfBuilding: '',

            // METHOD APPLIED
            method_pricingModel: '',
            method_comparisonMethod: '',
            method_costMethod: '',

            // LANDMARK & UTILITIES
            landmark_landmarkOrProximity: '',
            landmark_approachableRoad: '',
            landmark_roadsideAvailability: '',

            // CONSTRUCTION DETAILS PART B
            constructionPartB_glassDetails: '',
            constructionPartB_northSouth: '',
            constructionPartB_eastWest: '',
            constructionPartB_totalLengthAndBreadth: '',
            constructionPartB_estimatedAreaOfPlot: '',

            // GUARDIANS VALUATION SECTION
            guardians_toBank: '',
            guardians_stateBank: '',
            guardians_AmunicipialCorporation: '',
            guardians_dateIncertioninValuation: '',
            guardians_coverageDocumentation: '',

            // VALUATION REPORT DETAILS
            valuationReport_confirmFinancePrice: '',
            valuationReport_dateOfInspection: '',
            valuationReport_dateOfDocumentProducedSal: '',
            valuationReport_seedNo: '',
            valuationReport_seedNo_2: '',

            // CONSTRUCTION COST EXTENDED
            constructionCost_ratePerSqft: '',
            constructionCost_areaInSqft: '',
            constructionCost_totalConstructionCost: '',

            // PLOT DETAILS
            plot_sqftArea: '',
            plot_roadAccess: '',
            plot_boundaries: '',
            plot_utilities: '',

            // VALUATION ANALYSIS
            valuationAnalysis_methodApplied: '',
            valuationAnalysis_costApproach: '',
            valuationAnalysis_comparisonApproach: '',
            valuationAnalysis_incomeApproach: '',

            // DEPRECIATION DETAILS
            depreciationDetails_physicalDeteriorationPercentage: '',
            depreciationDetails_functionalObsolescence: '',
            depreciationDetails_externalFactors: '',
            depreciationDetails_totalDepreciationPercentage: '',

            // FINAL VALUES
            finalValue_marketValue: '',
            finalValue_distressValue: '',
            finalValue_loanValue: '',
            finalValue_marketValueInWords: '',
            finalValue_distressValueInWords: '',
            finalValue_loanValueInWords: '',

            // CERTIFICATION & VALIDATION
            certification_appraiserName: '',
            certification_appraiserLicense: '',
            certification_dateOfValuation: '',
            certification_placeOfValuation: '',
            certification_appraiserSignature: '',
            certification_stampDate: '',

            // ADDITIONAL IDENTIFICATION
            identification_plotNumber: '',
            identification_surveyNumber: '',
            identification_villageOrTown: '',
            identification_district: '',
            identification_state: '',
            identification_postalCode: '',

            // BUILDING CHARACTERISTICS
            buildingChar_typeOfBuilding: '',
            buildingChar_yearOfConstruction: '',
            buildingChar_numberOfFloors: '',
            buildingChar_numberOfRooms: '',
            buildingChar_conditionOfBuilding: '',

            // PHYSICAL DETAILS - ADJOINING PROPERTIES
            adjoiningPropertiesNorthDocument: '',
            adjoiningPropertiesNorthSite: '',
            adjoiningPropertiesSouthDocument: '',
            adjoiningPropertiesSouthSite: '',
            adjoiningPropertiesEastDocument: '',
            adjoiningPropertiesEastSite: '',
            adjoiningPropertiesWestDocument: '',
            adjoiningPropertiesWestSite: '',
            matchingOfBoundaries: '',
            approvedLandUse: '',
            plotDemarcated: '',
            typeOfProperty: '',
            noOfRoomsLivingDining: '',
            bedRooms: '',
            noOfRoomsToiletBath: '',
            kitchenStore: '',
            totalNoOfFloor: '',
            floorOnWhichPropertyIsLocated: '',
            ageOfPropertyInYears: '',
            residualAgeOfPropertyInYears: '',
            yearOfConstruction: '',
            totalLifeOfPropertyInYears: '',
            typeOfStructure: '',

            // TENURE / OCCUPANCY DETAILS
            statusOfTenure: '',
            noOfYearsOfOccupancySince: '',
            relationshipOfTenantOrOwner: '',

            // STAGE OF CONSTRUCTION
            stageOfConstruction: '',
            ifUnderConstructionExtentOfCompletion: '',
            violationsIfAnyObserved: '',
            natureAndExtentOfViolations: '',

            // AREA DETAILS (VALUATION TAB)
            landAreaAsPerSaleDeed: '',
            landAreaAsPerGRUDA: '',
            builtUpAreaAsPerGRUDA: '',
            cabuaSbuaInSqFt: '',

            // GUIDELINE RATE DETAILS
            guidelineRateObtainedFrom: '',
            jantriRatePerSqMt: '',
            revisedGuidelineRate: '',
            jantriValueOfLand: '',

            // LAND VALUATION
            landAreaSFT: '',
            landRatePerSqFt: '',
            valueOfLand: '',
            totalLandValue: '',

            // BUILDING VALUATION
            totalBUA: '',
            plinthArea: '',
            roofHeight: '',
            ageOfBuilding: '',
            estimatedReplacementRate: '',
            valueOfConstruction: '',
            buildingValuePlinthArea: '',
            buildingValueRoofHeight: '',
            buildingValueAge: '',
            totalBuildingValue: '',

            // MARKET VALUE SUMMARY
            marketValueOfProperty: '',
            realizableValue: '',
            distressValue: '',
            insurableValue: '',

            // BOOK VALUE
            bookValueOfProperty: '',
            bookValueAsPerSaleDeed: '',
            saleDeedRegistrationNumber: '',
            saleDeedDate: '',

            // ASSUMPTIONS & REMARKS
            qualificationsInTIR: '',
            propertyIsSARFAESICompliant: '',
            propertyBelongsToSocialInfrastructure: '',
            entireLandMortgaged: '',
            anyOtherAspectOnMarketability: '',

            // ENCLOSURES
            layoutPlanSketch: '',
            buildingPlan: '',
            floorPlan: '',
            photographsOfProperty: '',
            certifiedCopyOfApprovedPlan: '',
            googleMapLocation: '',
            priceTrendFromPropertySites: '',
            anyOtherRelevantDocuments: '',
        },

        // PDF DETAILS (MATCHES pdfDetailsSchema EXACTLY FROM rajeshRowHouseModel.js)
        // Replaced with correct schema fields only
        pdfDetailsNew: {
            engagementLetter: '',
            overCtDocumentsSoldDeed: '',
            allotLetter: '',
            estateNo: '',
            inspectionDone: '',
            ldTypeOfLand: '',
            inclined: '',
            maisonFlatApartmentHouseVilla: '',
            approvedPlanning: '',
            buildingLine: '',
            electricityBill: '',
            lightTaxBill: '',
            numberTaxBill: '',
            boundaryDetail: '',
            previewPropertyDetail: '',
            landMarkedProperty: '',
            propertyCanBeSearchedEntranceDontSaveAnotherWay: '',
            landMarked: '',
            propertyFencedMarked: '',
            propertySharedBoundary: '',
            searchOwnerIdentifier: '',
            selfOwnedProperty: '',
            modleNo: '',
            draftProperty: '',
            taxableRate: '',
            salesInferenceCalorifice: '',
            coveringDetails: '',
            standardOperatingProcedureSOP: '',
            accountNumbersSaclanMailer: '',
            approachApproachmentment: '',
            standingDoorsProvisions: '',
            listedEnclosure: '',
            buildingPlanEnclosure: '',
            floorPlanEnclosure: '',
            propertyRelatedEnclosure: '',
            documentEntranceEnclosure: '',
            unitLotEnclosure: '',
            unattachedUnitUnitLevelEnclosure: '',
            attachedUnitUnitLevelEnclosure: '',
            attachedUnitEnclosure: '',
            allotmentUnitEnclosure: '',
            realizationInWords: '',
            itemOne: '',
            itemTwo: '',
            itemThree: '',
            itemFour: '',
            itemFive: '',
            itemSix: '',
            houseNo: '',
            serialNo: '',
            westBoundary: '',
            matchingBoundary: '',
            approxLengthNo: '',
            netRooms: '',
            kitchen: '',
            flowOnWhichTheProperty: '',
            propertyTypeYears: '',
            yearOfConstruction: '',
            typeOfStructure: '',
            terraceBalconyDetails: '',
            salesOfOccupancy: '',
            netYearsOfOccupancy: '',
            typesOfConstructionDone: '',
            stageOfConstruction: '',
            condition: '',
            ifAnyExistingViolations: '',
            conditionLandPremises: '',
            streetEland: '',
            valuationCertificateFrom: '',
            valuationGiven: '',
            purposeOfValuation: '',
            browseAccountName: '',
            addressesOfProprietor: '',
            briefDescriptionOfProperty: '',
            revenueDetailsPerSiteDocuments: '',
            nameNumberOfSites: '',
            accessToPublicRoad: '',
            totalAreaPerSiteMap: '',
            netPlotAreaAccess: '',
            constructionAreaOrBuiltup: '',
            valuationMethod: '',
            totalBuiltupArea: '',
            propertyDescription: '',
            areaInSqFt: '',
            areaBuildingSqFt: '',
            areParkingSqFt: '',
            areOtherSqFt: '',
            stageOfFenceEachElevation: '',
            estimatedReplacementCost: '',
            deptBitDepreciated: '',
            constructionDates: '',
            registryDocsByIssuedDates: '',
            remarksRegistry: '',
            landAreaValue: '',
            plotAreaSqFtValue: '',
            buildingValue: '',
            realizableValueOfProperty: '',
            distancesValuesInWordsProperty: '',
            insurableValueOfProperty: '',
            totalMarketValue: '',
            releasingValue: '',
            dirtyFinanceLimited: '',
            alterValuesProperty: '',
            insuranceProperty: '',
            formatOfValuationReport: '',
            usedForValuation: '',
            nameOfBranch: '',
            otherNameMain: '',
            coverageOfCensus: '',
            censusDirectory: '',
            createdOwner: '',
            createOwnerProperty: '',
            createNumberProperty: '',
            dateInspection: '',
            dateValueReport: '',
            valuesLocationDetails: '',
            arenaConstructionDetails: '',
            stageDetailConstruction: '',
            guidDemandDetail: '',
            layoutPlan: '',
            constructionPermission: '',
            lightBillDetails: '',
            taxBillDetails: '',
            physicalCondition: '',
            affiliationProperty: '',
            nearbyLandmark: '',
            inheritanceDetails: '',
            soldImpactPlan: '',
            north: '',
            south: '',
        },

        // CUSTOM FIELDS FOR DROPDOWN HANDLING
        customBankName: '',
        customCity: '',
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [locationImagePreviews, setLocationImagePreviews] = useState([]);
    const [areaImagePreviews, setAreaImagePreviews] = useState({});

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
                // Add cache buster to force fresh fetch from server
                dataToDownload = await getRajeshRowHouseById(id, username, role, clientId, { cacheBuster: Date.now() });
                ('✅ Fresh Rajesh RowHouse data fetched for PDF:', {
                    bankName: dataToDownload?.bankName,
                    city: dataToDownload?.city
                });
            } catch (fetchError) {
                console.error('❌ Failed to fetch fresh Rajesh RowHouse data:', fetchError);
                // Use in-memory valuation data if available
                dataToDownload = valuation;
                if (!dataToDownload || !dataToDownload.uniqueId) {
                    console.warn('Rajesh RowHouse form not found in DB and no local data available');
                    showError('Form data not found. Please save the form first before downloading.');
                    dispatch(hideLoader());
                    return;
                } else {
                    ('⚠️ Using unsaved form data from memory for PDF generation');
                }
            }

            await generateRowHouse(dataToDownload);
            showSuccess('PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showError('Failed to download PDF');
        } finally {
            dispatch(hideLoader());
        }
    };

    // Immediately load and prefill form when component mounts
    useLayoutEffect(() => {
        if (id) {
            ('[DEBUG] Component mounted - loadValuation for id:', id);
            loadValuation();
        }
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
                ('[DEBUG] Using saved draft data');
                setValuation(parsedData);
                mapDataToForm(parsedData);

                // Restore area images from draft data
                if (parsedData.areaImages && typeof parsedData.areaImages === 'object' && Object.keys(parsedData.areaImages).length > 0) {
                    const areaPreviews = {};
                    Object.keys(parsedData.areaImages).forEach(area => {
                        if (Array.isArray(parsedData.areaImages[area])) {
                            areaPreviews[area] = parsedData.areaImages[area].map(img => {
                                let previewUrl = '';
                                if (img.url) {
                                    previewUrl = img.url;
                                } else if (img.path) {
                                    const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                                    previewUrl = `/api/uploads/${fileName}`;
                                } else if (img.fileName) {
                                    previewUrl = `/api/uploads/${img.fileName}`;
                                } else if (img.preview && img.preview.startsWith('data:')) {
                                    previewUrl = img.preview;
                                }
                                return {
                                    preview: previewUrl,
                                    url: previewUrl,
                                    fileName: img.fileName || img.name || `Image`,
                                    size: img.size || 0,
                                    file: img.file || null
                                };
                            });
                        }
                    });
                    setAreaImagePreviews(areaPreviews);
                }

                return;
            }
        }

        try {
            ('[DEBUG] Fetching from database');
            // Pass user info for authentication
            const dbData = await getRajeshRowHouseById(id, username, role, clientId);
            ('[DEBUG] Database data loaded:', {
                clientName: dbData?.clientName,
                address: dbData?.address,
                city: dbData?.city,
                pdfDetailsKeys: Object.keys(dbData?.pdfDetails || {}).length
            });
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

            // Restore bank image from database
            if (dbData.bankImage && typeof dbData.bankImage === 'object') {
                ('[rajeshRowhouse.jsx] Restoring bank image - data:', dbData.bankImage);
                let previewUrl = '';
                if (dbData.bankImage.url) {
                    previewUrl = dbData.bankImage.url;
                    ('[rajeshRowhouse.jsx] Bank image URL from url field:', previewUrl);
                } else if (dbData.bankImage.path) {
                    const fileName = dbData.bankImage.path.split('\\').pop() || dbData.bankImage.path.split('/').pop();
                    previewUrl = `/api/uploads/${fileName}`;
                    ('[rajeshRowhouse.jsx] Bank image URL from path:', previewUrl);
                } else if (dbData.bankImage.fileName) {
                    previewUrl = `/api/uploads/${dbData.bankImage.fileName}`;
                    ('[rajeshRowhouse.jsx] Bank image URL from fileName:', previewUrl);
                }
                if (previewUrl) {
                    const bankImageObj = {
                        preview: previewUrl,
                        name: dbData.bankImage.name || 'Bank Image',
                        path: dbData.bankImage.path || dbData.bankImage.fileName || ''
                    };
                    ('[rajeshRowhouse.jsx] Bank image preview object:', bankImageObj);
                    setBankImagePreview(bankImageObj);
                    ('[rajeshRowhouse.jsx] Bank image preview set successfully');
                } else {
                    ('[rajeshRowhouse.jsx] No preview URL found for bank image');
                }
            } else {
                ('[rajeshRowhouse.jsx] No bank image data found - data.bankImage:', dbData.bankImage);
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
                ('[DEBUG] Found areaImages in dbData:', Object.keys(dbData.areaImages));
                setFormData(prev => ({
                    ...prev,
                    areaImages: dbData.areaImages
                }));
                // Also populate the areaImagePreviews state for display
                const areaPreviews = {};
                Object.keys(dbData.areaImages).forEach(area => {
                    if (Array.isArray(dbData.areaImages[area])) {
                        areaPreviews[area] = dbData.areaImages[area].map(img => {
                            let previewUrl = '';
                            if (img.url) {
                                previewUrl = img.url;
                            } else if (img.path) {
                                const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                                previewUrl = `/api/uploads/${fileName}`;
                            } else if (img.fileName) {
                                previewUrl = `/api/uploads/${img.fileName}`;
                            } else if (img.preview && img.preview.startsWith('data:')) {
                                previewUrl = img.preview;
                            }
                            return {
                                preview: previewUrl,
                                url: previewUrl,
                                fileName: img.fileName || img.name || `Image`,
                                size: img.size || 0,
                                file: img.file || null
                            };
                        });
                    }
                });
                ('[DEBUG] Setting areaImagePreviews with areas:', Object.keys(areaPreviews));
                setAreaImagePreviews(areaPreviews);
            } else {
                ('[DEBUG] No areaImages found in dbData');
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
                    const lastForm = await getLastSubmittedRajeshRowHouse();

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

        // Merge pdfDetails properly to ensure all checklist fields are included
        const mergedPdfDetails = {
            ...formData.pdfDetails,
            ...(data.pdfDetails || {})
        };

        setFormData(prev => ({
            ...prev,
            ...data,
            pdfDetails: mergedPdfDetails
        }));
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
            await updateRajeshRowHouse(id, formData, user.username, user.role, user.clientId);
            invalidateCache();
            dispatch(hideLoader());
            showSuccess('Rajesh RowHouse form saved successfully');
        } catch (error) {
            console.error("Error saving Rajesh RowHouse form:", error);
            dispatch(hideLoader());
            showError('Failed to save Rajesh RowHouse form');
        }
    };

    const handleValuationChange = (field, value) => {
        setFormData(prev => {
            const newPdfDetails = {
                ...prev.pdfDetails,
                [field]: value
            };

            // AUTO-CALCULATE LAND VALUE: Value of Land = Land Area × Land Rate
            if (field === 'landAreaSFT' || field === 'landRatePerSqFt') {
                const landArea = parseFloat(newPdfDetails.landAreaSFT) || 0;
                const landRate = parseFloat(newPdfDetails.landRatePerSqFt) || 0;
                const valueOfLand = landArea * landRate;
                newPdfDetails.valueOfLand = valueOfLand > 0 ? valueOfLand.toFixed(2) : '';
            }

            // AUTO-CALCULATE VALUE OF CONSTRUCTION: Value of Construction = Plinth Area × Estimated Replacement Rate
            if (field === 'buildingValuePlinthArea' || field === 'estimatedReplacementRate') {
                const plinthArea = parseFloat(newPdfDetails.buildingValuePlinthArea) || 0;
                const replacementRate = parseFloat(newPdfDetails.estimatedReplacementRate) || 0;
                const valueOfConstruction = plinthArea * replacementRate;
                newPdfDetails.valueOfConstruction = valueOfConstruction > 0 ? valueOfConstruction.toFixed(2) : '';
            }

            // AUTO-CALCULATE MARKET VALUE: Market Value = Value of Land + Value of Construction
            if (field === 'landAreaSFT' || field === 'landRatePerSqFt' ||
                field === 'buildingValuePlinthArea' || field === 'estimatedReplacementRate') {
                const valueOfLand = parseFloat(newPdfDetails.valueOfLand) || 0;
                const valueOfConstruction = parseFloat(newPdfDetails.valueOfConstruction) || 0;
                const marketValue = valueOfLand + valueOfConstruction;
                newPdfDetails.marketValueOfProperty = marketValue > 0 ? marketValue.toFixed(2) : '';

                // AUTO-CALCULATE REALIZABLE VALUE: 90% of Market Value
                const realizableValue = marketValue * 0.9;
                newPdfDetails.realizableValue = realizableValue > 0 ? realizableValue.toFixed(2) : '';

                // AUTO-CALCULATE DISTRESS VALUE: 80% of Market Value
                const distressValue = marketValue * 0.8;
                newPdfDetails.distressValue = distressValue > 0 ? distressValue.toFixed(2) : '';
            }

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

                            // Parallel image uploads (including supporting images, bank image, and area images)
                            const [uploadedPropertyImages, uploadedLocationImages, uploadedSupportingImages, uploadedBankImage, uploadedAreaImages] = await Promise.all([
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
                                })(),
                                (async () => {
                                    // Handle area images - upload any with file objects
                                    const areaImagesObj = {};
                                    const areaImagesToUpload = {};

                                    if (formData.areaImages && typeof formData.areaImages === 'object') {
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

                            // Use uploaded area images from the parallel upload
                            payload.areaImages = uploadedAreaImages || {};

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
                            localStorage.removeItem(`valuation_draft_${user.username}`);

                            // Call API to update rajesh row house
                            await updateRajeshRowHouse(id, payload, user.username, user.role, user.clientId);
                            invalidateCache("/rajesh-RowHouse");

                            showSuccess('Rajesh RowHouse form saved successfully');
                            resolve();
                        } catch (error) {
                            console.error("Error saving Rajesh RowHouse form:", error);
                            showError('Failed to save Rajesh RowHouse form');
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

            const responseData = await managerSubmitRajeshRowHouse(id, statusValue, modalFeedback, user.username, user.role);

            invalidateCache("/rajesh-RowHouse");

            // Update the form state with response data from backend
            setValuation(responseData);

            showSuccess(`Rajesh RowHouse form ${statusValue} successfully!`);
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
                documentPreviews: (formData.documentPreviews || []).map(doc => ({
                    fileName: doc.fileName,
                    size: doc.size,
                    ...(doc.url && { url: doc.url })
                })),
                photos: formData.photos || { elevationImages: [], siteImages: [] },
                status: "on-progress",
                pdfDetails: formData.pdfDetails,
                customFields: customFields,
                managerFeedback: formData.managerFeedback || "",
                submittedByManager: formData.submittedByManager || false,
                lastUpdatedBy: username,
                lastUpdatedByRole: role
            };

            // Handle image uploads - parallel (including supporting images, bank image, and area images)
            const [uploadedPropertyImages, uploadedLocationImages, uploadedSupportingImages, uploadedBankImage, uploadedAreaImages] = await Promise.all([
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
                })(),
                (async () => {
                    // Handle area images - upload any with file objects
                    const areaImagesObj = {};
                    const areaImagesToUpload = {};

                    if (formData.areaImages && typeof formData.areaImages === 'object') {
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

            // Use uploaded area images from the parallel upload
            payload.areaImages = uploadedAreaImages || {};

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

            // Call API to update Rajesh RowHouse form
            ("[rajeshRowHouse.jsx] Payload being sent to API:", {
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
            const apiResponse = await updateRajeshRowHouse(id, payload, username, role, clientId);
            invalidateCache("/rajesh-RowHouse");

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
            {/* VALUATION REPORT HEADER */}
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-4">Valuation Report Header</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'accountName', label: 'Account Name' },

                        { key: 'client', label: 'Branch Name ' },
                        { key: 'propertyDetails', label: 'Property Details' },
                        { key: 'location', label: 'Location' },
                        { key: 'purposeOfProperty', label: 'Purpose of Property' },

                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>

                {/* Date of Valuation - Calendar Picker */}
                <div className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Date of Valuation</Label>
                            <Input
                                type="date"
                                value={formData.pdfDetails?.dateOfValuation || ""}
                                onChange={(e) => handleValuationChange('dateOfValuation', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* PROPERTY AT A GLANCE */}
            <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-4">Property at a Glance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[


                        { key: 'valuationDoneByGovtApprovedValuer', label: 'Valuation Done by Govt Approved Valuer' },
                        { key: 'purposeOfProperty', label: 'Purpose of Valuation' },
                        { key: 'accountName', label: 'Borrower Account Name' },
                        { key: 'nameOfOwnerOrOwners', label: 'Name of Owner/Owners' },
                        { key: 'addressOfPropertyUnderValuation', label: 'Address of Property Under Valuation' },
                        { key: 'briefDescriptionOfProperty', label: 'Brief Description of Property' },
                        { key: 'revenueDetailsPerSaleDeed', label: 'Revenue Details Per Sale Deed' },
                        { key: 'areaOfLand', label: 'Area of Land (Sq Ft)' },
                        { key: 'valueOfLand', label: 'Value of Land' },
                        { key: 'areaOfConstruction', label: 'Area of Construction (Sq Ft)' },
                        { key: 'valueOfConstruction', label: 'Value of Construction' },

                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* CUSTOMER DETAILS */}
            <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-4">Customer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'nameOfOwnerOrOwners', label: 'Name of the Property Owner' },
                        { key: 'contactNumberOfRepresentative', label: 'Contact Number of Representative' },
                        { key: 'addressOfPropertyUnderValuation', label: 'Address' },
                        { key: 'nearbyLandmarkGoogleMap', label: 'Nearby Landmark/Google Map' },

                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>

                {/* Date fields */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Date of Inspection of Property - Calendar Picker */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Date of Inspection of Property</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.dateOfInspectionOfProperty || ""}
                            onChange={(e) => handleValuationChange('dateOfInspectionOfProperty', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* Date of Valuation Report - Calendar Picker */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Date of Valuation Report</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.dateOfValuationReport || ""}
                            onChange={(e) => handleValuationChange('dateOfValuationReport', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* DOCUMENT DETAILS */}
            <div className="mb-6 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                <h4 className="font-bold text-gray-900 mb-4">Document Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'saleDeed', label: 'Sale Deed' },
                        { key: 'grudaImpactPlan', label: 'GRUDA Impact Plan' },
                        { key: 'layoutPlan', label: 'Layout Plan' },
                        { key: 'constructionPermission', label: 'Construction Permission' },
                        { key: 'lightBill', label: 'Light Bill' },
                        { key: 'taxBill', label: 'Tax Bill' },

                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ADJOINING PROPERTIES */}
            <div className="mb-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-gray-900 mb-4">Physical Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'adjoiningPropertiesNorthDocument', label: 'North (Document)' },
                        { key: 'adjoiningPropertiesNorthSite', label: 'North (Site)' },
                        { key: 'adjoiningPropertiesSouthDocument', label: 'South (Document)' },
                        { key: 'adjoiningPropertiesSouthSite', label: 'South (Site)' },
                        { key: 'adjoiningPropertiesEastDocument', label: 'East (Document)' },
                        { key: 'adjoiningPropertiesEastSite', label: 'East (Site)' },
                        { key: 'adjoiningPropertiesWestDocument', label: 'West (Document)' },
                        { key: 'adjoiningPropertiesWestSite', label: 'West (Site)' },
                        { key: 'matchingOfBoundaries', label: 'Matching of Boundaries' },
                        { key: 'approvedLandUse', label: 'Approved Land Use' },
                        { key: 'plotDemarcated', label: 'Plot Demarcated' },
                        { key: 'typeOfProperty', label: 'Type of Property' },
                        { key: 'noOfRoomsLivingDining', label: 'No. of Rooms (Living/Dining)' },
                        { key: 'bedRooms', label: 'Bed Rooms' },
                        { key: 'noOfRoomsToiletBath', label: 'No. of Rooms (Toilet/Bath)' },
                        { key: 'kitchenStore', label: 'Kitchen/Store' },
                        { key: 'totalNoOfFloor', label: 'Total No of Floor' },
                        { key: 'floorOnWhichPropertyIsLocated', label: 'Floor on Which Property is Located' },
                        { key: 'ageOfPropertyInYears', label: 'Age of Property in Years' },
                        { key: 'residualAgeOfPropertyInYears', label: 'Residual Age of Property in Years' },
                        { key: 'yearOfConstruction', label: 'Year of Construction' },
                        { key: 'totalLifeOfPropertyInYears', label: 'Total Life of Property in Years' },
                        { key: 'typeOfStructure', label: 'Type of Structure' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>
            </div>



            {/* TENURE / OCCUPANCY DETAILS */}
            <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-gray-900 mb-4">Tenure / Occupancy Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'statusOfTenure', label: 'Status of Tenure' },
                        { key: 'noOfYearsOfOccupancySince', label: 'No. of Years of Occupancy Since' },
                        { key: 'relationshipOfTenantOrOwner', label: 'Relationship of Tenant or Owner' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* STAGE OF CONSTRUCTION */}
            <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <h4 className="font-bold text-gray-900 mb-4">Stage of Construction</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'stageOfConstruction', label: 'Stage of Construction' },
                        { key: 'ifUnderConstructionExtentOfCompletion', label: 'If Under Construction - Extent of Completion' },
                        { key: 'violationsIfAnyObserved', label: 'Violations if any Observed' },
                        { key: 'natureAndExtentOfViolations', label: 'Nature and Extent of Violations' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                            <Input
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                value={formData.pdfDetails?.[field.key] || ""}
                                onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderValuationTab = () => {
        return (
            <div className="space-y-6">
                {/* AREA DETAILS */}
                <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Area Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'landAreaAsPerSaleDeed', label: 'Land Area as per Sale Deed (Sq Ft)' },
                            { key: 'landAreaAsPerGRUDA', label: 'Land Area as per GRUDA (Sq Ft)' },
                            { key: 'builtUpAreaAsPerGRUDA', label: 'Built Up Area as per GRUDA (Sq Ft)' },
                            { key: 'cabuaSbuaInSqFt', label: 'CBUA/SBUA in Sq Ft' },
                            { key: 'remarks', label: 'Remarks' },
                            { key: 'guidelineRateObtainedFrom', label: 'Guideline Rate Obtained From' },
                            { key: 'guidelineValue', label: 'Guideline Value' },

                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                <Input
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    value={formData.pdfDetails?.[field.key] || ""}
                                    onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                    disabled={!canEdit}
                                    className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        ))}
                    </div>
                </div>



                {/* LAND VALUATION */}
                <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Land Valuation</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Land Area */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Land Area (Sq Ft)</Label>
                            <Input
                                placeholder="Enter land area (Sq Ft)"
                                value={formData.pdfDetails?.landAreaSFT || ""}
                                onChange={(e) => handleValuationChange('landAreaSFT', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Land Rate per Sq Ft */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Land Rate per Sq Ft</Label>
                            <Input
                                placeholder="Enter land rate per Sq Ft"
                                value={formData.pdfDetails?.landRatePerSqFt || ""}
                                onChange={(e) => handleValuationChange('landRatePerSqFt', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Value of Land - Auto-calculated */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Value of Land (Auto-Calculated)</Label>
                            <Input
                                placeholder="Auto-calculated"
                                value={formData.pdfDetails?.valueOfLand || ""}
                                disabled={true}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-gray-100 text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                </div>

                {/* BUILDING VALUATION */}
                <div className="mb-6 p-6 bg-pink-50 rounded-2xl border border-pink-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Building Valuation</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Plinth Area */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Plinth Area (Sq Ft)</Label>
                            <Input
                                placeholder="Enter plinth area (Sq Ft)"
                                value={formData.pdfDetails?.buildingValuePlinthArea || ""}
                                onChange={(e) => handleValuationChange('buildingValuePlinthArea', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Estimated Replacement Rate */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Estimated Replacement Rate per Sq Ft</Label>
                            <Input
                                placeholder="Enter replacement rate per Sq Ft"
                                value={formData.pdfDetails?.estimatedReplacementRate || ""}
                                onChange={(e) => handleValuationChange('estimatedReplacementRate', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Value of Construction - Auto-calculated */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Value of Construction (Auto-Calculated)</Label>
                            <Input
                                placeholder="Auto-calculated"
                                value={formData.pdfDetails?.valueOfConstruction || ""}
                                disabled={true}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-gray-100 text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Other Building Fields */}
                        {[
                            { key: 'buildingValueRoofHeight', label: 'Roof Height' },
                            { key: 'buildingValueAge', label: 'Age of Building' },
                            { key: 'estimatedReplacementRate', label: 'Estimated Replacement Rate per Sq Ft' },
                            { key: 'valueOfConstruction', label: 'Value of Construction' },
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                <Input
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    value={formData.pdfDetails?.[field.key] || ""}
                                    onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                    disabled={!canEdit}
                                    className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MARKET VALUE SUMMARY */}
                <div className="mb-6 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Market Value Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Market Value of Property - Auto-calculated */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Market Value of Property (Auto-Calculated)</Label>
                            <Input
                                placeholder="Auto-calculated"
                                value={formData.pdfDetails?.marketValueOfProperty || ""}
                                disabled={true}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-gray-100 text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Realizable Value - Auto-calculated */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Realizable Value (90% - Auto-Calculated)</Label>
                            <Input
                                placeholder="Auto-calculated"
                                value={formData.pdfDetails?.realizableValue || ""}
                                disabled={true}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-gray-100 text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Distress Value - Auto-calculated */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Distress Value (80% - Auto-Calculated)</Label>
                            <Input
                                placeholder="Auto-calculated"
                                value={formData.pdfDetails?.distressValue || ""}
                                disabled={true}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-gray-100 text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Other Editable Fields */}
                        {[
                            { key: 'insurableValue', label: 'Insurable Value' },
                            { key: 'bookValueOfProperty', label: 'Book Value of Property' },
                            { key: 'jantriValueOfProperty', label: 'Jantri Value of the Property' },

                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                <Input
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    value={formData.pdfDetails?.[field.key] || ""}
                                    onChange={(e) => handleValuationChange(field.key, e.target.value)}
                                    disabled={!canEdit}
                                    className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        ))}
                    </div>
                </div>


            </div>
        );
    };

    const renderValuationAnalysisTab = () => {
        return (
            <div className="space-y-6">

                {/* ASSUMPTIONS & REMARKS */}
                <div className="mb-6 p-6 bg-sky-50 rounded-2xl border border-sky-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Assumptions & Remarks</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'qualificationsInTIR', label: 'Qualifications in TIR/Mitigation Suggested' },
                            { key: 'propertyIsSARFAESICompliant', label: 'Property is SARFAESI Compliant' },
                            { key: 'propertyBelongsToSocialInfrastructure', label: 'Property Belongs to Social Infrastructure' },
                            { key: 'entireLandMortgaged', label: 'Entire Land Mortgaged' },
                            { key: 'anyOtherAspectOnMarketability', label: 'Any Other Aspect on Marketability' },
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                <Select
                                    value={formData.pdfDetails?.[field.key] || ""}
                                    onValueChange={(value) => handleValuationChange(field.key, value)}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                        <SelectValue placeholder="Select option" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                        <SelectItem value="NA">NA</SelectItem>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Not Available">Not Available</SelectItem>
                                        <SelectItem value="Difficult to Obtain">Difficult to Obtain</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>


                {/* ENCLOSURES */}
                <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Enclosures</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'layoutPlanSketch', label: 'Layout Plan Sketch' },
                            { key: 'buildingPlan', label: 'Building Plan' },
                            { key: 'floorPlan', label: 'Floor Plan' },
                            { key: 'photographsOfProperty', label: 'Photographs of Property' },
                            { key: 'certifiedCopyOfApprovedPlan', label: 'Certified Copy of Approved Plan' },
                            { key: 'googleMapLocation', label: 'Google Map Location' },
                            { key: 'priceTrendFromPropertySites', label: 'Price Trend from Property Sites' },
                            { key: 'anyOtherRelevantDocuments', label: 'Any Other Relevant Documents' },
                        ].map(field => (
                            <div key={field.key} className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                <Select
                                    value={formData.pdfDetails?.[field.key] || ""}
                                    onValueChange={(value) => handleValuationChange(field.key, value)}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                        <SelectValue placeholder="Select option" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="Attached">Attached</SelectItem>
                                        <SelectItem value="Not Attached">Not Attached</SelectItem>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Not Available">Not Available</SelectItem>
                                        <SelectItem value="NA">NA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHECKLIST OF DOCUMENT */}
                <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Checklist of Document</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { key: 'checklist_engagementLetterConfirmation', label: 'Engagement Letter / Confirmation for Assignment' },
                            { key: 'checklist_ownershipDocumentsSaleDeed', label: 'Ownership Documents: Sale Deed' },
                            { key: 'checklist_advTcrLsr', label: 'Adv. TCR / LSR' },
                            { key: 'checklist_allotmentLetter', label: 'Allotment Letter' },
                            { key: 'checklist_kabulatLekh', label: 'Kabulat Lekh' },
                            { key: 'checklist_mortgageDeed', label: 'Mortgage Deed' },
                            { key: 'checklist_leaseDeed', label: 'Lease Deed' },
                            { key: 'checklist_index2', label: 'Index – 2' },
                            { key: 'checklist_vf712InCaseOfLand', label: 'VF: 7/12 in case of Land' },
                            { key: 'checklist_naOrder', label: 'NA order' },
                            { key: 'checklist_approvedPlan', label: 'Approved Plan' },
                            { key: 'checklist_commencementLetter', label: 'Commencement Letter' },
                            { key: 'checklist_buPermission', label: 'BU Permission' },
                            { key: 'checklist_eleMeterPhoto', label: 'Ele. Meter Photo' },
                            { key: 'checklist_lightBill', label: 'Light Bill' },
                            { key: 'checklist_muniTaxBill', label: 'Muni. Tax Bill' },
                            { key: 'checklist_numberingFlatPlotNoIdentification', label: 'Numbering – Flat / bungalow / Plot No. / Identification on Site' },
                            { key: 'checklist_boundariesPropertyDemarcation', label: 'Boundaries of Property – Proper Demarcation' },
                            { key: 'checklist_mergedProperty', label: 'Merged Property' },
                            { key: 'checklist_premiseCanBeSeparatedEntrance', label: 'Premise can be Separated, and Entrance / Door is available for the mortgaged property?' },
                            { key: 'checklist_landIsLocked', label: 'Land is Locked?' },
                            { key: 'checklist_propertyIsRentedToOtherParty', label: 'Property is rented to Other Party' },
                            { key: 'checklist_ifRentedRentAgreementProvided', label: 'If Rented – Rent Agreement is Provided?' },
                            { key: 'checklist_siteVisitPhotos', label: 'Site Visit Photos' },
                            { key: 'checklist_selfieWithOwnerIdentifier', label: 'Selfie with Owner / Identifier' },
                            { key: 'checklist_mobileNo', label: 'Mobile No.' },
                            { key: 'checklist_dataSheet', label: 'Data Sheet' },
                            { key: 'checklist_tentativeRate', label: 'Tentative Rate' },
                            { key: 'checklist_saleInstanceLocalInquiry', label: 'Sale Instance / Local Inquiry / Verbal Survey' },
                            { key: 'checklist_brokerRecording', label: 'Broker Recording' },
                            { key: 'checklist_pastValuationRate', label: 'Past Valuation Rate' },
                        ].map(field => {
                            const val = formData.pdfDetails?.[field.key]?.trim?.() || formData.pdfDetails?.[field.key] || "";
                            return (
                                <div key={field.key} className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">{field.label}</Label>
                                    <Select
                                        value={val}
                                        onValueChange={(value) => handleValuationChange(field.key, value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                            <SelectValue placeholder="Select option" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                            <SelectItem value="--">--</SelectItem>
                                            <SelectItem value="NA">NA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })}
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
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Rajesh RowHouse Valuation Form</h1>
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
                                <CardTitle className="text-sm font-bold text-neutral-900">Rajesh RowHouse Details</CardTitle>
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
                                                areaImagePreviews={areaImagePreviews}
                                                formType="rajeshrowhouse"
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
                                                    { id: 'analysis', label: 'ANALYSIS' }
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
                                                {activeValuationSubTab === 'analysis' && renderValuationAnalysisTab()}
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

export default RajeshRowHouseEditForm;