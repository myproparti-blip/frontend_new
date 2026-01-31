

// Helper function to safely get nested values with NA fallback
const safeGet = (obj, path, defaultValue = 'NA') => {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);

    // Handle different value types
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    // Convert boolean to Yes/No for area checkboxes 
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    // Normalize yes/no string values to Yes/No
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'yes') return 'Yes';
        if (lowerValue === 'no') return 'No';
        if (lowerValue === 'na') return 'NA';
        return value;
    }

    // If value is an object, try to extract string representation
    if (typeof value === 'object') {
        // Try common field names for document fields
        if (path === 'agreementForSale' && value.agreementForSaleExecutedName) {
            return value.agreementForSaleExecutedName;
        }
        // For other objects, convert to JSON string or return NA
        return defaultValue;
    }

    return value;
};

// Helper function for checklist yes/no logic
// Returns object with column1 and column2 values
const getChecklistValue = (fieldValue) => {
    const value = safeGet({ value: fieldValue }, 'value');
    const isYes = value === 'Yes' || value === 'yes' || value === true;
    const isNo = value === 'No' || value === 'no' || value === false;

    if (isYes) {
        return { column1: 'Yes', column2: '--' };
    } else if (isNo) {
        return { column1: '--', column2: 'No' };
    } else {
        return { column1: '--', column2: '--' };
    }
};

// Dynamic field mapping system - Maps model fields to PDF template fields
const fieldMappings = {
    // Basic Info
    borrowerName: ['pdfDetails.basicInfo.borrowerName', 'clientName'],
    ownerName: ['pdfDetails.basicInfo.ownerName', 'ownerNameAddress'],
    propertyDetails: ['pdfDetails.basicInfo.propertyDetails', 'briefDescriptionProperty'],
    propertyAddress: ['pdfDetails.basicInfo.propertyAddress', 'postalAddress', 'address'],

    // Valuation Purpose
    purposeOfValuation: ['pdfDetails.valuationPurpose.purposeOfValuation', 'valuationPurpose'],
    dateOfValuation: ['pdfDetails.valuationPurpose.dateOfValuation', 'dateOfValuation'],
    dateOfInspection: ['pdfDetails.valuationPurpose.dateOfInspection', 'dateOfInspection'],
    dateValuationMade: ['pdfDetails.valuationPurpose.dateValuationMade', 'dateValuationMade'],
    dateOfReport: ['pdfDetails.valuationPurpose.dateOfReport', 'dateOfReport'],

    // Owner Details
    ownerNameAddress: ['pdfDetails.ownerDetails.ownerNameAddress', 'ownerNameAddress'],
    ownerPhoneNo: ['pdfDetails.ownerDetails.ownerPhoneNo', 'mobileNumber'],
    ownerPhoneShare: ['pdfDetails.ownerDetails.ownerPhoneShare', 'ownerPhoneShare'],

    // Bank/Client Details
    bankName: ['pdfDetails.basicInfo.bankName', 'bankName', 'client'],
    clientName: ['pdfDetails.basicInfo.clientName', 'clientName', 'client'],
    applicant: ['pdfDetails.basicInfo.applicant', 'applicant'],

    // Property Location
    plotNumber: ['pdfDetails.propertyLocation.plotNumber', 'plotNo', 'plotSurveyNo'],
    doorNumber: ['pdfDetails.propertyLocation.doorNumber', 'doorNo'],
    village: ['pdfDetails.propertyLocation.village', 'tpVillage', 'apartmentVillageMunicipalityCounty'],
    ward: ['pdfDetails.propertyLocation.ward', 'wardTaluka'],
    district: ['pdfDetails.propertyLocation.district', 'mandalDistrict'],

    // Area Classification
    areaClassification: ['pdfDetails.areaClassification.areaClassification', 'areaClassification'],
    cityTown: ['pdfDetails.areaClassification.cityTown', 'cityTown'],
    residentialArea: ['pdfDetails.areaClassification.residentialArea', 'residentialArea'],
    commercialArea: ['pdfDetails.areaClassification.commercialArea', 'commercialArea'],
    industrialArea: ['pdfDetails.areaClassification.industrialArea', 'industrialArea'],
    highMiddlePoor: ['pdfDetails.areaClassification.highMiddlePoor', 'highMiddlePoor'],
    urbanSemiUrbanRural: ['pdfDetails.areaClassification.urbanSemiUrbanRural', 'urbanSemiUrbanRural'],
    corporationLimitVillage: ['pdfDetails.areaClassification.corporationLimitVillage', 'corporationLimitVillage'],
    governmentEnactments: ['pdfDetails.areaClassification.governmentEnactments', 'governmentEnactments'],
    agriculturalLandConversion: ['pdfDetails.areaClassification.agriculturalLandConversion', 'agriculturalLandConversion'],

    // Boundaries (from screenshot - Conveyance Deed and Visit columns)
    boundaryNorthDeed: ['pdfDetails.boundaryDetails.north.deed', 'boundariesPlotNorthDeed'],
    boundaryNorthVisit: ['pdfDetails.boundaryDetails.north.visit', 'boundariesPlotNorthActual'],
    boundaryEastDeed: ['pdfDetails.boundaryDetails.east.deed', 'boundariesPlotEastDeed'],
    boundaryEastVisit: ['pdfDetails.boundaryDetails.east.visit', 'boundariesPlotEastActual'],
    boundarySouthDeed: ['pdfDetails.boundaryDetails.south.deed', 'boundariesPlotSouthDeed'],
    boundarySouthVisit: ['pdfDetails.boundaryDetails.south.visit', 'boundariesPlotSouthActual'],
    boundaryWestDeed: ['pdfDetails.boundaryDetails.west.deed', 'boundariesPlotWestDeed'],
    boundaryWestVisit: ['pdfDetails.boundaryDetails.west.visit', 'boundariesPlotWestActual'],

    // Dimensions (from screenshot - As per Deed and Actuals columns)
    dimensionNorthDeed: ['pdfDetails.dimensions.north.deed', 'dimensionsNorthDeed'],
    dimensionNorthActual: ['pdfDetails.dimensions.north.actual', 'dimensionsNorthActual'],
    dimensionEastDeed: ['pdfDetails.dimensions.east.deed', 'dimensionsEastDeed'],
    dimensionEastActual: ['pdfDetails.dimensions.east.actual', 'dimensionsEastActual'],
    dimensionSouthDeed: ['pdfDetails.dimensions.south.deed', 'dimensionsSouthDeed'],
    dimensionSouthActual: ['pdfDetails.dimensions.south.actual', 'dimensionsSouthActual'],
    dimensionWestDeed: ['pdfDetails.dimensions.west.deed', 'dimensionsWestDeed'],
    dimensionWestActual: ['pdfDetails.dimensions.west.actual', 'dimensionsWestActual'],

    // Land Valuation (Part A)
    sizeOfPlotNorthSouth: ['pdfDetails.landValuation.sizeOfPlot.northSouth', 'plotArea', 'sizeOfPlotNorthSouth'],
    sizeOfPlotEastWest: ['pdfDetails.landValuation.sizeOfPlot.eastWest', 'sizeOfPlotEastWest'],
    plotArea: ['pdfDetails.landValuation.sizeOfPlot.total', 'plotArea'],
    approvedPlanArea: ['pdfDetails.landValuation.sizeOfPlot.total', 'approvedPlanArea'],
    totalPlotArea: ['pdfDetails.landValuation.sizeOfPlot.total', 'totalPlotArea'],
    approvedPlanTotal: ['pdfDetails.landValuation.sizeOfPlot.total', 'approvedPlanTotal'],
    prevailingRate: ['pdfDetails.landValuation.marketRate.prevailingRate', 'prevailingRate'],
    landBuildingAreaRateMethod: ['pdfDetails.landValuation.marketRate.landBuildingAreaRateMethod', 'landBuildingAreaRateMethod'],
    landRate: ['pdfDetails.landValuation.marketRate.landBuildingAreaRateMethod', 'landRate'],
    guidelineRateFromRegistrar: ['pdfDetails.landValuation.guidelineRate.fromRegistrar', 'guidelineRateFromRegistrar'],
    guidelineRateAdopted: ['pdfDetails.landValuation.guidelineRate.adoptedRate', 'guidelineRateAdopted'],
    jantriRate: ['pdfDetails.landValuation.jantriRate.rate', 'jantriRate'],
    jantriLandValue: ['pdfDetails.landValuation.jantriRate.landValue', 'jantriLandValue'],
    jantriBuildingValue: ['pdfDetails.landValuation.jantriRate.buildingValue', 'jantriBuildingValue'],
    jantriTotalValue: ['pdfDetails.landValuation.jantriRate.totalValue', 'jantriTotalValue'],
    estimatedValueOfLand: ['pdfDetails.landValuation.estimatedValueOfLand', 'estimatedValueOfLand'],
    variationClause: ['pdfDetails.landValuation.variationClause', 'variationClause'],

    // Market Value Analysis of Land (Part A - Market Value Table)
    landAreaPlot: ['pdfDetails.landValuation.plotDescription', 'pdfDetails.landValuation.landAreaPlot', 'landAreaPlot', 'plot'],
    landAreaSqYd: ['pdfDetails.landValuation.areaSqYd', 'pdfDetails.landValuation.landAreaSqYd', 'landAreaSqYd'],
    landTotal: ['pdfDetails.landValuation.totalValue', 'pdfDetails.landValuation.landTotal', 'landTotal', 'totalLandValue'],

    // Building Valuation (Part B) - Matches buildingDetailsSchema from model
    typeOfBuilding: ['pdfDetails.buildingDetails.typeOfBuilding', 'typeOfBuilding', 'buildingType'],
    typeOfConstruction: ['pdfDetails.buildingDetails.typeOfConstruction', 'typeOfConstruction', 'constructionType'],
    yearOfConstruction: ['pdfDetails.buildingDetails.yearOfConstruction', 'yearOfConstruction', 'constructionYear'],
    numberOfFloorsHeight: ['pdfDetails.buildingDetails.numberOfFloorsHeight', 'numberOfFloorsHeight', 'floorsHeight'],
    plinthAreaFloorWise: ['pdfDetails.buildingDetails.plinthAreaFloorWise', 'plinthAreaFloorWise', 'plinthArea'],
    conditionOfBuildingExterior: ['pdfDetails.buildingDetails.condition.exterior', 'exteriorCondition', 'conditionExterior'],
    conditionOfBuildingInterior: ['pdfDetails.buildingDetails.condition.interior', 'interiorCondition', 'conditionInterior'],
    approvedMapDateValidity: ['pdfDetails.buildingDetails.approvedMap.dateValidity', 'approvedMapDateValidity', 'approvedMapDate'],
    approvedMapAuthority: ['pdfDetails.buildingDetails.approvedMap.issuingAuthority', 'approvedMapAuthority', 'mapAuthority'],
    genuinessVerified: ['pdfDetails.buildingDetails.approvedMap.genuinessVerified', 'genuinessVerified', 'mapGenuine'],
    otherCommentsOnApprovedPlan: ['pdfDetails.buildingDetails.otherCommentsOnApprovedPlan', 'otherCommentsOnApprovedPlan', 'approvedPlanComments'],

    // Construction Cost Analysis / Building
    areaSMT: ['pdfDetails.constructionCostAnalysis.total.areaSMT', 'carpetArea', 'plinthArea'],
    totalValue: ['pdfDetails.constructionCostAnalysis.total.totalValue', 'fairMarketValue'],

    // Land Valuation (Part A - Market Value Analysis)
    landAreaPlot: ['pdfDetails.landValuation.plotDescription', 'pdfDetails.landValuation.landAreaPlot'],
    landAreaSqYd: ['pdfDetails.landValuation.areaSqYd', 'pdfDetails.landValuation.landAreaSqYd'],
    landRate: ['pdfDetails.landValuation.rate', 'pdfDetails.landValuation.landRate'],
    landTotal: ['pdfDetails.landValuation.totalValue', 'pdfDetails.landValuation.landTotal'],
    landTotalSayRO: ['pdfDetails.landValuation.sayRO', 'pdfDetails.landValuation.landTotalSayRO'],

    // Construction Cost Analysis - Individual Items
    securityRoomArea: ['pdfDetails.constructionCostAnalysis.securityRoom.areaDetails', 'securityRoomArea'],
    securityRoomSMT: ['pdfDetails.constructionCostAnalysis.securityRoom.areaSMT', 'securityRoomSMT'],
    securityRoomSYD: ['pdfDetails.constructionCostAnalysis.securityRoom.areaSYD', 'securityRoomSYD'],
    securityRoomRate: ['pdfDetails.constructionCostAnalysis.securityRoom.ratePerSYD', 'securityRoomRate'],
    securityRoomValue: ['pdfDetails.constructionCostAnalysis.securityRoom.value', 'securityRoomValue'],

    laboursQuarterArea: ['pdfDetails.constructionCostAnalysis.laboursQuarter.areaDetails', 'laboursQuarterArea'],
    laboursQuarterSMT: ['pdfDetails.constructionCostAnalysis.laboursQuarter.areaSMT', 'laboursQuarterSMT'],
    laboursQuarterSYD: ['pdfDetails.constructionCostAnalysis.laboursQuarter.areaSYD', 'laboursQuarterSYD'],
    laboursQuarterRate: ['pdfDetails.constructionCostAnalysis.laboursQuarter.ratePerSYD', 'laboursQuarterRate'],
    laboursQuarterValue: ['pdfDetails.constructionCostAnalysis.laboursQuarter.value', 'laboursQuarterValue'],

    storeRoomArea: ['pdfDetails.constructionCostAnalysis.storeRoom.areaDetails', 'storeRoomArea'],
    storeRoomSMT: ['pdfDetails.constructionCostAnalysis.storeRoom.areaSMT', 'storeRoomSMT'],
    storeRoomSYD: ['pdfDetails.constructionCostAnalysis.storeRoom.areaSYD', 'storeRoomSYD'],
    storeRoomRate: ['pdfDetails.constructionCostAnalysis.storeRoom.ratePerSYD', 'storeRoomRate'],
    storeRoomValue: ['pdfDetails.constructionCostAnalysis.storeRoom.value', 'storeRoomValue'],

    galleryRoomArea: ['pdfDetails.constructionCostAnalysis.galleryRoom.areaDetails', 'galleryRoomArea'],
    galleryRoomSMT: ['pdfDetails.constructionCostAnalysis.galleryRoom.areaSMT', 'galleryRoomSMT'],
    galleryRoomSYD: ['pdfDetails.constructionCostAnalysis.galleryRoom.areaSYD', 'galleryRoomSYD'],
    galleryRoomRate: ['pdfDetails.constructionCostAnalysis.galleryRoom.ratePerSYD', 'galleryRoomRate'],
    galleryRoomValue: ['pdfDetails.constructionCostAnalysis.galleryRoom.value', 'galleryRoomValue'],

    // FF Labours Quarter and other construction areas
    ffLaboursQuarterArea: ['pdfDetails.constructionCostAnalysis.ffLaboursQuarter.areaDetails', 'ffLaboursQuarterArea'],
    ffLaboursQuarterSMT: ['pdfDetails.constructionCostAnalysis.ffLaboursQuarter.areaSMT', 'ffLaboursQuarterSMT'],
    ffLaboursQuarterSYD: ['pdfDetails.constructionCostAnalysis.ffLaboursQuarter.areaSYD', 'ffLaboursQuarterSYD'],
    ffLaboursQuarterRate: ['pdfDetails.constructionCostAnalysis.ffLaboursQuarter.ratePerSYD', 'ffLaboursQuarterRate'],
    ffLaboursQuarterValue: ['pdfDetails.constructionCostAnalysis.ffLaboursQuarter.value', 'ffLaboursQuarterValue'],

    gfRoomArea: ['pdfDetails.constructionCostAnalysis.gfRoom.areaDetails', 'gfRoomArea'],
    gfRoomSMT: ['pdfDetails.constructionCostAnalysis.gfRoom.areaSMT', 'gfRoomSMT'],
    gfRoomSYD: ['pdfDetails.constructionCostAnalysis.gfRoom.areaSYD', 'gfRoomSYD'],
    gfRoomRate: ['pdfDetails.constructionCostAnalysis.gfRoom.ratePerSYD', 'gfRoomRate'],
    gfRoomValue: ['pdfDetails.constructionCostAnalysis.gfRoom.value', 'gfRoomValue'],

    gfWashRoomArea: ['pdfDetails.constructionCostAnalysis.gfWashRoom.areaDetails', 'gfWashRoomArea'],
    gfWashRoomSMT: ['pdfDetails.constructionCostAnalysis.gfWashRoom.areaSMT', 'gfWashRoomSMT'],
    gfWashRoomSYD: ['pdfDetails.constructionCostAnalysis.gfWashRoom.areaSYD', 'gfWashRoomSYD'],
    gfWashRoomRate: ['pdfDetails.constructionCostAnalysis.gfWashRoom.ratePerSYD', 'gfWashRoomRate'],
    gfWashRoomValue: ['pdfDetails.constructionCostAnalysis.gfWashRoom.value', 'gfWashRoomValue'],

    office1Area: ['pdfDetails.constructionCostAnalysis.office1.areaDetails', 'office1Area'],
    office1SMT: ['pdfDetails.constructionCostAnalysis.office1.areaSMT', 'office1SMT'],
    office1SYD: ['pdfDetails.constructionCostAnalysis.office1.areaSYD', 'office1SYD'],
    office1Rate: ['pdfDetails.constructionCostAnalysis.office1.ratePerSYD', 'office1Rate'],
    office1Value: ['pdfDetails.constructionCostAnalysis.office1.value', 'office1Value'],

    washRoomArea: ['pdfDetails.constructionCostAnalysis.washRoom.areaDetails', 'washRoomArea'],
    washRoomSMT: ['pdfDetails.constructionCostAnalysis.washRoom.areaSMT', 'washRoomSMT'],
    washRoomSYD: ['pdfDetails.constructionCostAnalysis.washRoom.areaSYD', 'washRoomSYD'],
    washRoomRate: ['pdfDetails.constructionCostAnalysis.washRoom.ratePerSYD', 'washRoomRate'],
    washRoomValue: ['pdfDetails.constructionCostAnalysis.washRoom.value', 'washRoomValue'],

    shedArea: ['pdfDetails.constructionCostAnalysis.shed.areaDetails', 'shedArea'],
    shedSMT: ['pdfDetails.constructionCostAnalysis.shed.areaSMT', 'shedSMT'],
    shedSYD: ['pdfDetails.constructionCostAnalysis.shed.areaSYD', 'shedSYD'],
    shedRate: ['pdfDetails.constructionCostAnalysis.shed.ratePerSYD', 'shedRate'],
    shedValue: ['pdfDetails.constructionCostAnalysis.shed.value', 'shedValue'],

    office2Area: ['pdfDetails.constructionCostAnalysis.office2.areaDetails', 'office2Area'],
    office2SMT: ['pdfDetails.constructionCostAnalysis.office2.areaSMT', 'office2SMT'],
    office2SYD: ['pdfDetails.constructionCostAnalysis.office2.areaSYD', 'office2SYD'],
    office2Rate: ['pdfDetails.constructionCostAnalysis.office2.ratePerSYD', 'office2Rate'],
    office2Value: ['pdfDetails.constructionCostAnalysis.office2.value', 'office2Value'],

    shed1Area: ['pdfDetails.constructionCostAnalysis.shed1.areaDetails', 'shed1Area'],
    shed1SMT: ['pdfDetails.constructionCostAnalysis.shed1.areaSMT', 'shed1SMT'],
    shed1SYD: ['pdfDetails.constructionCostAnalysis.shed1.areaSYD', 'shed1SYD'],
    shed1Rate: ['pdfDetails.constructionCostAnalysis.shed1.ratePerSYD', 'shed1Rate'],
    shed1Value: ['pdfDetails.constructionCostAnalysis.shed1.value', 'shed1Value'],

    shed2Unit1Area: ['pdfDetails.constructionCostAnalysis.shed2Unit1.areaDetails', 'shed2Unit1Area'],
    shed2Unit1SMT: ['pdfDetails.constructionCostAnalysis.shed2Unit1.areaSMT', 'shed2Unit1SMT'],
    shed2Unit1SYD: ['pdfDetails.constructionCostAnalysis.shed2Unit1.areaSYD', 'shed2Unit1SYD'],
    shed2Unit1Rate: ['pdfDetails.constructionCostAnalysis.shed2Unit1.ratePerSYD', 'shed2Unit1Rate'],
    shed2Unit1Value: ['pdfDetails.constructionCostAnalysis.shed2Unit1.value', 'shed2Unit1Value'],

    shed2Unit2Area: ['pdfDetails.constructionCostAnalysis.shed2Unit2.areaDetails', 'shed2Unit2Area'],
    shed2Unit2SMT: ['pdfDetails.constructionCostAnalysis.shed2Unit2.areaSMT', 'shed2Unit2SMT'],
    shed2Unit2SYD: ['pdfDetails.constructionCostAnalysis.shed2Unit2.areaSYD', 'shed2Unit2SYD'],
    shed2Unit2Rate: ['pdfDetails.constructionCostAnalysis.shed2Unit2.ratePerSYD', 'shed2Unit2Rate'],
    shed2Unit2Value: ['pdfDetails.constructionCostAnalysis.shed2Unit2.value', 'shed2Unit2Value'],

    // Shed-3 (aggregate/summary of shed3Unit1, Unit2, Unit3 or standalone)
    shed3Area: ['pdfDetails.constructionCostAnalysis.shed3.areaDetails', 'shed3Area'],
    shed3SMT: ['pdfDetails.constructionCostAnalysis.shed3.areaSMT', 'shed3SMT'],
    shed3SYD: ['pdfDetails.constructionCostAnalysis.shed3.areaSYD', 'shed3SYD'],
    shed3Rate: ['pdfDetails.constructionCostAnalysis.shed3.ratePerSYD', 'shed3Rate'],
    shed3Value: ['pdfDetails.constructionCostAnalysis.shed3.value', 'shed3Value'],

    openShedArea: ['pdfDetails.constructionCostAnalysis.openShed.areaDetails', 'openShedArea'],
    openShedSMT: ['pdfDetails.constructionCostAnalysis.openShed.areaSMT', 'openShedSMT'],
    openShedSYD: ['pdfDetails.constructionCostAnalysis.openShed.areaSYD', 'openShedSYD'],
    openShedRate: ['pdfDetails.constructionCostAnalysis.openShed.ratePerSYD', 'openShedRate'],
    openShedValue: ['pdfDetails.constructionCostAnalysis.openShed.value', 'openShedValue'],

    godownArea: ['pdfDetails.constructionCostAnalysis.godown.areaDetails', 'godownArea'],
    godownSMT: ['pdfDetails.constructionCostAnalysis.godown.areaSMT', 'godownSMT'],
    godownSYD: ['pdfDetails.constructionCostAnalysis.godown.areaSYD', 'godownSYD'],
    godownRate: ['pdfDetails.constructionCostAnalysis.godown.ratePerSYD', 'godownRate'],
    godownValue: ['pdfDetails.constructionCostAnalysis.godown.value', 'godownValue'],

    shed3Unit1Area: ['pdfDetails.constructionCostAnalysis.shed3Unit1.areaDetails', 'shed3Unit1Area'],
    shed3Unit1SMT: ['pdfDetails.constructionCostAnalysis.shed3Unit1.areaSMT', 'shed3Unit1SMT'],
    shed3Unit1SYD: ['pdfDetails.constructionCostAnalysis.shed3Unit1.areaSYD', 'shed3Unit1SYD'],
    shed3Unit1Rate: ['pdfDetails.constructionCostAnalysis.shed3Unit1.ratePerSYD', 'shed3Unit1Rate'],
    shed3Unit1Value: ['pdfDetails.constructionCostAnalysis.shed3Unit1.value', 'shed3Unit1Value'],

    shed3Unit2Area: ['pdfDetails.constructionCostAnalysis.shed3Unit2.areaDetails', 'shed3Unit2Area'],
    shed3Unit2SMT: ['pdfDetails.constructionCostAnalysis.shed3Unit2.areaSMT', 'shed3Unit2SMT'],
    shed3Unit2SYD: ['pdfDetails.constructionCostAnalysis.shed3Unit2.areaSYD', 'shed3Unit2SYD'],
    shed3Unit2Rate: ['pdfDetails.constructionCostAnalysis.shed3Unit2.ratePerSYD', 'shed3Unit2Rate'],
    shed3Unit2Value: ['pdfDetails.constructionCostAnalysis.shed3Unit2.value', 'shed3Unit2Value'],

    shed3Unit3Area: ['pdfDetails.constructionCostAnalysis.shed3Unit3.areaDetails', 'shed3Unit3Area'],
    shed3Unit3SMT: ['pdfDetails.constructionCostAnalysis.shed3Unit3.areaSMT', 'shed3Unit3SMT'],
    shed3Unit3SYD: ['pdfDetails.constructionCostAnalysis.shed3Unit3.areaSYD', 'shed3Unit3SYD'],
    shed3Unit3Rate: ['pdfDetails.constructionCostAnalysis.shed3Unit3.ratePerSYD', 'shed3Unit3Rate'],
    shed3Unit3Value: ['pdfDetails.constructionCostAnalysis.shed3Unit3.value', 'shed3Unit3Value'],

    // Construction Cost Analysis Total
    constructionTotalAreaSMT: ['pdfDetails.constructionCostAnalysis.total.areaSMT', 'constructionTotalAreaSMT', 'areaSMT'],
    constructionTotalAreaSYD: ['pdfDetails.constructionCostAnalysis.total.areaSYD', 'constructionTotalAreaSYD', 'areaSYD'],
    constructionTotalValue: ['pdfDetails.constructionCostAnalysis.total.totalValue', 'constructionTotalValue', 'totalValue'],

    // Extra Items (Part C)
    portico: ['pdfDetails.extraItems.portico', 'portico'],
    ornamentalFrontDoor: ['pdfDetails.extraItems.ornamentalFrontDoor', 'ornamentalFrontDoor'],
    sitOutVeranda: ['pdfDetails.extraItems.sitOutVeranda', 'sitOutVeranda'],
    overheadWaterTank: ['pdfDetails.extraItems.overheadWaterTank', 'overheadWaterTank'],
    extraSteelGates: ['pdfDetails.extraItems.extraSteelGates', 'extraSteelGates'],

    // Amenities (Part D)
    wardrobes: ['pdfDetails.amenities.wardrobes', 'wardrobes'],
    glazedTiles: ['pdfDetails.amenities.glazedTiles', 'glazedTiles'],
    extraSinksBathTub: ['pdfDetails.amenities.extraSinksBathTub', 'extraSinksBathTub'],
    marbleFlooring: ['pdfDetails.amenities.marbleFlooring', 'marbleFlooring'],
    interiorDecorations: ['pdfDetails.amenities.interiorDecorations', 'interiorDecorations'],
    architecturalElevation: ['pdfDetails.amenities.architecturalElevation', 'architecturalElevation'],
    panellingWorks: ['pdfDetails.amenities.panellingWorks', 'panellingWorks'],
    aluminiumWorks: ['pdfDetails.amenities.aluminiumWorks', 'aluminiumWorks'],
    aluminiumHandRails: ['pdfDetails.amenities.aluminiumHandRails', 'aluminiumHandRails'],
    falseCeiling: ['pdfDetails.amenities.falseCeiling', 'falseCeiling'],
    unitMaintenance: ['pdfDetails.amenities.unitMaintenance', 'unitMaintenance'],
    unitClassification: ['pdfDetails.amenities.unitClassification', 'unitClassification'],

    // Miscellaneous (Part E)
    separateToiletRoom: ['pdfDetails.miscellaneous.separateToiletRoom', 'separateToiletRoom'],
    separateLumberRoom: ['pdfDetails.miscellaneous.separateLumberRoom', 'separateLumberRoom'],
    separateWaterTankSump: ['pdfDetails.miscellaneous.separateWaterTankSump', 'separateWaterTankSump'],
    treesGardening: ['pdfDetails.miscellaneous.treesGardening', 'treesGardening'],

    // Services (Part F)
    waterSupplyArrangements: ['pdfDetails.services.waterSupplyArrangements', 'waterSupplyArrangements'],
    drainageArrangements: ['pdfDetails.services.drainageArrangements', 'drainageArrangements'],
    compoundWall: ['pdfDetails.services.compoundWall', 'compoundWall'],
    cbDepositsFittings: ['pdfDetails.services.cbDepositsFittings', 'cbDepositsFittings'],
    pavement: ['pdfDetails.services.pavement', 'pavement'],

    // Site Characteristics (from pdfDetails.siteCharacteristics)
    classificationLocality: ['pdfDetails.siteCharacteristics.classificationOfLocality', 'classificationLocality'],
    developmentSurroundingAreas: ['pdfDetails.siteCharacteristics.developmentSurroundingArea', 'developmentSurroundingAreas'],
    floodingPossibility: ['pdfDetails.siteCharacteristics.frequentFloodingSubmerging', 'floodingPossibility'],
    civicAmenitiesFeasibility: ['pdfDetails.siteCharacteristics.feasibilityCivicAmenities', 'civicAmenitiesFeasibility'],
    landTopography: ['pdfDetails.siteCharacteristics.levelOfLandTopographical', 'landTopography'],
    shapeOfLand: ['pdfDetails.siteCharacteristics.shapeOfLand', 'shapeOfLand'],
    typeOfUse: ['pdfDetails.siteCharacteristics.typeOfUse', 'typeOfUse'],
    usageRestriction: ['pdfDetails.siteCharacteristics.usageRestriction', 'usageRestriction'],
    townPlanningApproved: ['pdfDetails.siteCharacteristics.townPlanningApprovedLayout', 'townPlanningApproved'],
    cornerPlotType: ['pdfDetails.siteCharacteristics.cornerPlotIntermittentPlot', 'cornerPlotType'],
    roadFacilities: ['pdfDetails.siteCharacteristics.roadFacilities', 'roadFacilities'],
    typeOfRoad: ['pdfDetails.siteCharacteristics.typeOfRoadAvailable', 'typeOfRoad'],
    roadWidth: ['pdfDetails.siteCharacteristics.widthOfRoad', 'roadWidth'],
    lockedLand: ['pdfDetails.siteCharacteristics.lockedLand', 'lockedLand'],
    waterPotentiality: ['pdfDetails.siteCharacteristics.waterPotentiality', 'waterPotentiality'],
    undergroundSewerage: ['pdfDetails.siteCharacteristics.undergroundSewerageSystem', 'undergroundSewerage'],
    powerSupply: ['pdfDetails.siteCharacteristics.powerSupplyAtSite', 'powerSupply'],
    siteAdvantage1: ['pdfDetails.siteCharacteristics.advantageOfSite1', 'siteAdvantage1'],
    siteAdvantage2: ['pdfDetails.siteCharacteristics.advantageOfSite2', 'siteAdvantage2'],
    specialRemarks1: ['pdfDetails.siteCharacteristics.specialRemarks1', 'specialRemarks1'],
    specialRemarks2: ['pdfDetails.siteCharacteristics.specialRemarks2', 'specialRemarks2'],

    // Extent and Occupation
    extentOfSite: ['pdfDetails.extent.extentOfSite', 'extentOfSite'],
    extentSiteValuation: ['pdfDetails.extent.extentConsideredForValuation', 'extentSiteValuation'],
    occupiedByOwnerTenant: ['pdfDetails.occupationStatus.occupiedByOwnerTenant', 'occupiedByOwnerTenant'],
    tenancyDuration: ['pdfDetails.occupationStatus.tenancyDuration', 'tenancyDuration'],
    rentReceivedPerMonth: ['pdfDetails.occupationStatus.rentReceivedPerMonth', 'rentReceivedPerMonth'],

    // Total Abstract of Property
    totalAbstractPartADescription: ['pdfDetails.totalAbstract.partA.description', 'totalAbstractPartADescription'],
    totalAbstractPartAValue: ['pdfDetails.totalAbstract.partA.value', 'totalAbstractPartAValue'],
    totalAbstractPartBDescription: ['pdfDetails.totalAbstract.partB.description', 'totalAbstractPartBDescription'],
    totalAbstractPartBValue: ['pdfDetails.totalAbstract.partB.value', 'totalAbstractPartBValue'],
    totalAbstractPartCDescription: ['pdfDetails.totalAbstract.partC.description', 'totalAbstractPartCDescription'],
    totalAbstractPartCValue: ['pdfDetails.totalAbstract.partC.value', 'totalAbstractPartCValue'],
    totalAbstractPartDDescription: ['pdfDetails.totalAbstract.partD.description', 'totalAbstractPartDDescription'],
    totalAbstractPartDValue: ['pdfDetails.totalAbstract.partD.value', 'totalAbstractPartDValue'],
    totalAbstractPartEDescription: ['pdfDetails.totalAbstract.partE.description', 'totalAbstractPartEDescription'],
    totalAbstractPartEValue: ['pdfDetails.totalAbstract.partE.value', 'totalAbstractPartEValue'],
    totalAbstractPartFDescription: ['pdfDetails.totalAbstract.partF.description', 'totalAbstractPartFDescription'],
    totalAbstractPartFValue: ['pdfDetails.totalAbstract.partF.value', 'totalAbstractPartFValue'],
    totalAbstractTotalValue: ['pdfDetails.totalAbstract.totalValue', 'totalAbstractTotalValue'],
    totalAbstractSayValue: ['pdfDetails.totalAbstract.sayValue', 'totalAbstractSayValue'],

    // Valuation Summary - Present Market Value
    presentMarketValueAmount: ['pdfDetails.valuationSummary.presentMarketValue.amount', 'presentMarketValueAmount'],
    presentMarketValueWords: ['pdfDetails.valuationSummary.presentMarketValue.words', 'presentMarketValueWords'],

    // Valuation Summary - Realisable Value
    realisableValuePercentage: ['pdfDetails.valuationSummary.realisableValue.percentage', 'realisableValuePercentage'],
    realisableValueAmount: ['pdfDetails.valuationSummary.realisableValue.amount', 'realisableValueAmount'],
    realisableValueWords: ['pdfDetails.valuationSummary.realisableValue.words', 'realisableValueWords'],

    // Valuation Summary - Distress Value
    distressValuePercentage: ['pdfDetails.valuationSummary.distressValue.percentage', 'distressValuePercentage'],
    distressValueAmount: ['pdfDetails.valuationSummary.distressValue.amount', 'distressValueAmount'],
    distressValueWords: ['pdfDetails.valuationSummary.distressValue.words', 'distressValueWords'],

    // Valuation Summary - Jantri Value
    jantriValueAmount: ['pdfDetails.valuationSummary.jantriValue.amount', 'jantriValueAmount'],
    jantriValueWords: ['pdfDetails.valuationSummary.jantriValue.words', 'jantriValueWords'],

    // Valuation Summary - Fair Market Value
    fairMarketValueAmount: ['pdfDetails.valuationSummary.fairMarketValue.amount', 'fairMarketValueAmount'],
    fairMarketValueWords: ['pdfDetails.valuationSummary.fairMarketValue.words', 'fairMarketValueWords'],

    // Signature Details - Valuer
    valuersName: ['pdfDetails.signatureDetails.valuer.name', 'valuersName'],
    valuationPlace: ['pdfDetails.signatureDetails.valuer.place', 'valuationPlace'],
    valuationDate: ['pdfDetails.signatureDetails.valuer.date', 'valuationMadeDate'],

    // Signature Details - Branch Manager
    branchManagerName: ['pdfDetails.signatureDetails.branchManager.name', 'branchManagerName'],
    branchManagerDate: ['pdfDetails.signatureDetails.branchManager.date', 'branchManagerDate'],
    branchManagerPlace: ['pdfDetails.signatureDetails.branchManager.place', 'branchManagerPlace'],

    // Checklist of Documents
    engagementLetterConfirmation: ['pdfDetails.checklistOfDocuments.engagementLetterConfirmation', 'engagementLetterConfirmation'],
    ownershipDocumentsSaleDeed: ['pdfDetails.checklistOfDocuments.ownershipDocumentsSaleDeed', 'ownershipDocumentsSaleDeed'],
    advTcrLsr: ['pdfDetails.checklistOfDocuments.advTcrLsr', 'advTcrLsr'],
    agreementForSaleBanaKhat: ['pdfDetails.checklistOfDocuments.agreementForSaleBanaKhat', 'agreementForSaleBanaKhat'],
    propertyCard: ['pdfDetails.checklistOfDocuments.propertyCard', 'propertyCard'],
    mortgageDeed: ['pdfDetails.checklistOfDocuments.mortgageDeed', 'mortgageDeed'],
    leaseDeed: ['pdfDetails.checklistOfDocuments.leaseDeed', 'leaseDeed'],
    index2: ['pdfDetails.checklistOfDocuments.index2', 'index2'],
    vf712InCaseOfLand: ['pdfDetails.checklistOfDocuments.vf712InCaseOfLand', 'vf712InCaseOfLand'],
    naOrder: ['pdfDetails.checklistOfDocuments.naOrder', 'naOrder'],
    approvedLayoutPlan: ['pdfDetails.checklistOfDocuments.approvedLayoutPlan', 'approvedLayoutPlan'],
    commencementLetter: ['pdfDetails.checklistOfDocuments.commencementLetter', 'commencementLetter'],
    buPermission: ['pdfDetails.checklistOfDocuments.buPermission', 'buPermission'],
    eleMeterPhoto: ['pdfDetails.checklistOfDocuments.eleMeterPhoto', 'eleMeterPhoto'],
    lightBill: ['pdfDetails.checklistOfDocuments.lightBill', 'lightBill'],
    muniTaxBill: ['pdfDetails.checklistOfDocuments.muniTaxBill', 'muniTaxBill'],
    numberingFlatBungalowPlotNo: ['pdfDetails.checklistOfDocuments.numberingFlatBungalowPlotNo', 'numberingFlatBungalowPlotNo'],
    boundariesOfPropertyProperDemarcation: ['pdfDetails.checklistOfDocuments.boundariesOfPropertyProperDemarcation', 'boundariesOfPropertyProperDemarcation'],
    mergedProperty: ['pdfDetails.checklistOfDocuments.mergedProperty', 'mergedProperty'],
    premiseCanBeSeparatedEntranceDoor: ['pdfDetails.checklistOfDocuments.premiseCanBeSeparatedEntranceDoor', 'premiseCanBeSeparatedEntranceDoor'],
    landIsLocked: ['pdfDetails.checklistOfDocuments.landIsLocked', 'landIsLocked'],
    propertyIsRentedToOtherParty: ['pdfDetails.checklistOfDocuments.propertyIsRentedToOtherParty', 'propertyIsRentedToOtherParty'],
    ifRentedRentAgreementIsProvided: ['pdfDetails.checklistOfDocuments.ifRentedRentAgreementIsProvided', 'ifRentedRentAgreementIsProvided'],
    siteVisitPhotos: ['pdfDetails.checklistOfDocuments.siteVisitPhotos', 'siteVisitPhotos'],
    selfieWithOwnerIdentifier: ['pdfDetails.checklistOfDocuments.selfieWithOwnerIdentifier', 'selfieWithOwnerIdentifier'],
    mobileNo: ['pdfDetails.checklistOfDocuments.mobileNo', 'mobileNo', 'mobileNoChecklist'],
    dataSheet: ['pdfDetails.checklistOfDocuments.dataSheet', 'dataSheet'],
    tentativeRate: ['pdfDetails.checklistOfDocuments.tentativeRate', 'tentativeRate'],
    saleInstanceLocalInquiryVerbalSurvey: ['pdfDetails.checklistOfDocuments.saleInstanceLocalInquiryVerbalSurvey', 'saleInstanceLocalInquiryVerbalSurvey'],
    brokerRecording: ['pdfDetails.checklistOfDocuments.brokerRecording', 'brokerRecording'],
    pastValuationRate: ['pdfDetails.checklistOfDocuments.pastValuationRate', 'pastValuationRate']
};

// Function to get field value using dynamic mapping
const getFieldValue = (data, fieldName, defaultValue = 'NA') => {
    const mappings = fieldMappings[fieldName] || [fieldName];

    for (const path of mappings) {
        const value = safeGet(data, path, null);
        if (value && value !== 'NA' && value !== null) {
            return value;
        }
    }

    return defaultValue;
};

// Helper function to format date as d/m/yyyy
const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};

// Helper function to extract address value from nested object or return as-is
const extractAddressValue = (address) => {
    if (!address) return '';
    // If it's an object with fullAddress property, extract it
    if (typeof address === 'object' && address.fullAddress) {
        return address.fullAddress;
    }
    // If it's already a string, return it
    if (typeof address === 'string') {
        return address;
    }
    return '';
};

// Helper function to round value to nearest 1000
const roundToNearest1000 = (value) => {
    if (!value) return 'NA';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;
    return Math.round(num / 1000) * 1000;
};

// Helper function to extract boundary details from schema
const extractBoundaryDetails = (data) => {
    if (!data?.pdfDetails?.boundaryDetails) return null;

    const boundaries = data.pdfDetails.boundaryDetails;
    return {
        north: { deed: boundaries.north?.deed || 'NA', visit: boundaries.north?.visit || 'NA' },
        south: { deed: boundaries.south?.deed || 'NA', visit: boundaries.south?.visit || 'NA' },
        east: { deed: boundaries.east?.deed || 'NA', visit: boundaries.east?.visit || 'NA' },
        west: { deed: boundaries.west?.deed || 'NA', visit: boundaries.west?.visit || 'NA' }
    };
};

// Helper function to extract dimension details from schema
const extractDimensionDetails = (data) => {
    if (!data?.pdfDetails?.dimensions) return null;

    const dimensions = data.pdfDetails.dimensions;
    return {
        north: { deed: dimensions.north?.deed || 'NA', actual: dimensions.north?.actual || 'NA' },
        south: { deed: dimensions.south?.deed || 'NA', actual: dimensions.south?.actual || 'NA' },
        east: { deed: dimensions.east?.deed || 'NA', actual: dimensions.east?.actual || 'NA' },
        west: { deed: dimensions.west?.deed || 'NA', actual: dimensions.west?.actual || 'NA' }
    };
};

// Helper function to convert number to Indian words
const numberToWords = (num) => {
    if (!num || isNaN(num)) return '';
    num = Math.round(parseFloat(num));
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lac', 'Crore'];

    const convertHundreds = (n) => {
        let result = '';
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;

        if (hundred > 0) result += ones[hundred] + ' Hundred ';
        if (remainder >= 20) {
            result += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10] + ' ';
        } else if (remainder >= 10) {
            result += teens[remainder - 10] + ' ';
        } else if (remainder > 0) {
            result += ones[remainder] + ' ';
        }
        return result;
    };

    let words = '';
    let scale = 0;

    while (num > 0 && scale < scales.length) {
        let group = num % 1000;
        if (scale === 1) group = num % 100;

        if (group > 0) {
            if (scale === 1) {
                words = convertHundreds(group).replace('Hundred', '').trim() + ' ' + scales[scale] + ' ' + words;
            } else {
                words = convertHundreds(group) + scales[scale] + ' ' + words;
            }
        }

        num = Math.floor(num / (scale === 0 ? 1000 : scale === 1 ? 100 : 1000));
        scale++;
    }

    return words.trim().toUpperCase();
};

// Helper function to calculate percentage of value
const calculatePercentage = (baseValue, percentage) => {
    if (!baseValue) return 0;
    const num = parseFloat(String(baseValue).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return 0;
    return Math.round((num * percentage) / 100);
};

// Helper function to format currency with words
const formatCurrencyWithWords = (value, percentage = 100) => {
    if (!value) return 'NA';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;

    const finalValue = Math.round((num * percentage) / 100);
    const words = numberToWords(finalValue);
    const formatted = finalValue.toLocaleString('en-IN');

    return `₹ ${formatted}/- (${words})`;
};

// Helper function to get image dimensions and optimize for PDF
const getImageDimensions = (imageUrl) => {
    // Default dimensions
    let width = 500;
    let height = 400;

    // Ensure imageUrl is a string
    if (!imageUrl || typeof imageUrl !== 'string') {
        return { width, height };
    }

    // If image is base64 or data URI, return defaults
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return { width, height };
    }

    // For location images, use larger dimensions
    if (imageUrl.includes('location')) {
        return { width: 500, height: 450 };
    }

    return { width, height };
};

// Helper function to extract image URL safely
const extractImageUrl = (img) => {
    if (!img) return '';

    let url = '';

    if (typeof img === 'string') {
        url = img.trim();
    } else if (typeof img === 'object') {
        // Try multiple properties that might contain the URL
        url = (img.url || img.preview || img.data || img.src || img.secure_url || '').toString().trim();
    }

    // Validate URL format
    if (!url) return '';

    // Accept data URIs, blob URLs, and HTTP(S) URLs
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    return '';
};

// Helper function to validate and format image for PDF
const getImageSource = (imageUrl) => {
    // Ensure imageUrl is a string
    if (!imageUrl || typeof imageUrl !== 'string') {
        return '';
    }

    // Trim whitespace
    imageUrl = imageUrl.trim();

    // Return empty if still invalid after trim
    if (!imageUrl) {
        return '';
    }

    // If already base64 or data URI, use directly
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return imageUrl;
    }

    // For regular URLs, ensure it's valid
    try {
        // Try to construct a URL - this validates the URL format
        new URL(imageUrl);
        return imageUrl;
    } catch (e) {
        console.warn('Invalid image URL:', imageUrl.substring(0, 100), e?.message);
        return '';
    }
};

// Helper function to dynamically render table row with field value
const createTableRow = (data, label, fieldName, isHighlight = false) => {
    const value = getFieldValue(data, fieldName);
    const bgColor = isHighlight ? 'white' : 'white';
    return `
      <tr>
        <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${label}</td>
        <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; background: ${bgColor}; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(data, fieldName)}</td>
      </tr>
    `;
};

// Helper function to dynamically render boundary table rows (4-column format)
const createBoundaryRow = (data, direction, deed, actual) => {
    return `
      <tr>
        <td class="label">${direction}</td>
        <td class="deed">${safeGet(data, deed)}</td>
        <td class="actual">${safeGet(data, actual)}</td>
      </tr>
    `;
};

// Helper function to dynamically render amenities/services table rows
const createAmenitiesRow = (data, itemName, qtyField, rateField, valueField) => {
    const qty = safeGet(data, qtyField);
    const rate = safeGet(data, rateField);
    const value = safeGet(data, valueField);
    return `
      <tr>
        <td class="item">${itemName}</td>
        <td class="qty">${qty}</td>
        <td class="rate">${rate}</td>
        <td class="value">${value}</td>
      </tr>
    `;
};

// Helper function to normalize data structure - flatten nested objects from database
const normalizeDataForPDF = (data = {}) => {
    if (!data) return {};

    let normalized = { ...data };

    // If data comes from MongoDB with nested objects, flatten them
    if (data.documentInformation) {
        normalized = {
            ...normalized,
            branch: data.documentInformation.branch || normalized.branch,
            dateOfInspection: data.documentInformation.dateOfInspection || normalized.dateOfInspection,
            dateOfValuation: data.documentInformation.dateOfValuation || normalized.dateOfValuation,
            valuationPurpose: data.documentInformation.valuationPurpose || normalized.valuationPurpose,
            valuationPlace: data.documentInformation.valuationPlace || normalized.valuationPlace,
            valuationMadeDate: data.documentInformation.valuationMadeDate || data.documentInformation.dateOfValuation || normalized.valuationMadeDate
        };
    }

    if (data.ownerDetails) {
        normalized = {
            ...normalized,
            ownerNameAddress: data.ownerDetails.ownerNameAddress || normalized.ownerNameAddress,
            briefDescriptionProperty: data.ownerDetails.propertyDescription || normalized.briefDescriptionProperty
        };
    }

    if (data.locationOfProperty) {
        normalized = {
            ...normalized,
            plotSurveyNo: data.locationOfProperty.plotSurveyNo || normalized.plotSurveyNo,
            doorNo: data.locationOfProperty.doorNo || normalized.doorNo,
            tpVillage: data.locationOfProperty.tsVillage || normalized.tpVillage,
            wardTaluka: data.locationOfProperty.wardTaluka || normalized.wardTaluka,
            mandalDistrict: data.locationOfProperty.mandalDistrict || normalized.mandalDistrict,
            layoutPlanIssueDate: data.locationOfProperty.dateLayoutIssueValidity || normalized.layoutPlanIssueDate,
            approvedMapAuthority: data.locationOfProperty.approvedMapIssuingAuthority || normalized.approvedMapAuthority
        };
    }

    if (data.cityAreaType) {
        normalized = {
            ...normalized,
            cityTown: data.cityAreaType.cityTown || normalized.cityTown
        };
    }

    if (data.areaClassification) {
        normalized = {
            ...normalized,
            areaClassification: data.areaClassification.areaClassification || normalized.areaClassification,
            urbanClassification: data.areaClassification.areaType || normalized.urbanClassification,
            governmentType: data.areaClassification.govGovernance || normalized.governmentType,
            govtEnactmentsCovered: data.areaClassification.stateGovernmentEnactments || normalized.govtEnactmentsCovered
        };
    }

    // Map postal address and area fields from locationOfProperty or pdfDetails
    if (data.locationOfProperty) {
        normalized = {
            ...normalized,
            postalAddress: extractAddressValue(data.locationOfProperty.postalAddress) || normalized.postalAddress,
            residentialArea: data.locationOfProperty.residentialArea || normalized.residentialArea,
            commercialArea: data.locationOfProperty.commercialArea || normalized.commercialArea,
            industrialArea: data.locationOfProperty.industrialArea || normalized.industrialArea,
            areaClassification: data.locationOfProperty.areaClassification || normalized.areaClassification
        };
    }

    // Map authentication and verification fields from pdfDetails (highest priority)
    if (data.pdfDetails) {
        normalized = {
            ...normalized,
            authenticityVerified: data.pdfDetails.authenticityVerified || normalized.authenticityVerified,
            valuerCommentOnAuthenticity: data.pdfDetails.valuerCommentOnAuthenticity || normalized.valuerCommentOnAuthenticity,
            postalAddress: extractAddressValue(data.pdfDetails.postalAddress) || normalized.postalAddress,
            residentialArea: data.pdfDetails.residentialArea !== undefined ? data.pdfDetails.residentialArea : normalized.residentialArea,
            commercialArea: data.pdfDetails.commercialArea !== undefined ? data.pdfDetails.commercialArea : normalized.commercialArea,
            industrialArea: data.pdfDetails.industrialArea !== undefined ? data.pdfDetails.industrialArea : normalized.industrialArea,
            areaClassification: data.pdfDetails.areaClassification || normalized.areaClassification,
            apartmentCTSNo: data.pdfDetails.apartmentCTSNo || normalized.apartmentCTSNo,
            apartmentTSNo: data.pdfDetails.apartmentTSNo || normalized.apartmentTSNo,
            apartmentBlockNo: data.pdfDetails.apartmentBlockNo || normalized.apartmentBlockNo,
            apartmentWardNo: data.pdfDetails.apartmentWardNo || normalized.apartmentWardNo,
            apartmentVillageMunicipalityCounty: data.pdfDetails.apartmentVillageMunicipalityCounty || normalized.apartmentVillageMunicipalityCounty,
            apartmentDoorNoStreetRoad: data.pdfDetails.apartmentDoorNoStreetRoad || normalized.apartmentDoorNoStreetRoad,
            apartmentPinCode: data.pdfDetails.apartmentPinCode || normalized.apartmentPinCode,
            classificationPosh: data.pdfDetails.classificationPosh || normalized.classificationPosh,
            classificationUsage: data.pdfDetails.classificationUsage || normalized.classificationUsage,
            classificationOwnership: data.pdfDetails.classificationOwnership || normalized.classificationOwnership,
            ownerOccupancyStatus: data.pdfDetails.ownerOccupancyStatus || normalized.ownerOccupancyStatus
        };

        // Flatten valuation purpose details (pdfDetails.valuationPurpose -> root level)
        if (data.pdfDetails.valuationPurpose) {
            const vp = data.pdfDetails.valuationPurpose;
            normalized = {
                ...normalized,
                purposeOfValuation: vp.purposeOfValuation || normalized.purposeOfValuation,
                purposeForValuation: vp.purposeForValuation || normalized.purposeForValuation,
                dateOfValuation: vp.dateOfValuation || normalized.dateOfValuation,
                dateOfInspection: vp.dateOfInspection || normalized.dateOfInspection,
                dateValuationMade: vp.dateValuationMade || normalized.dateValuationMade,
                dateOfReport: vp.dateOfReport || normalized.dateOfReport,
                dateOfVisit: vp.dateOfVisit || normalized.dateOfVisit
            };
        }

        // Flatten owner details (pdfDetails.ownerDetails -> root level)
        if (data.pdfDetails.ownerDetails) {
            const od = data.pdfDetails.ownerDetails;
            normalized = {
                ...normalized,
                nameOfOwners: od.nameOfOwners || normalized.nameOfOwners,
                ownerNameAddress: od.ownerNameAddress || normalized.ownerNameAddress,
                ownerPhoneNo: od.ownerPhoneNo || normalized.ownerPhoneNo,
                shareDetails: od.shareDetails || normalized.shareDetails,
                ownerPhoneShare: od.ownerPhoneShare || normalized.ownerPhoneShare,
                addressOfProperty: od.addressOfProperty || normalized.addressOfProperty
            };
        }

        // Flatten boundary details (pdfDetails.boundaryDetails -> root level)
        if (data.pdfDetails.boundaryDetails) {
            const bd = data.pdfDetails.boundaryDetails;
            normalized = {
                ...normalized,
                boundaryNorthDeed: bd.north?.deed || normalized.boundaryNorthDeed,
                boundaryNorthVisit: bd.north?.visit || normalized.boundaryNorthVisit,
                boundaryEastDeed: bd.east?.deed || normalized.boundaryEastDeed,
                boundaryEastVisit: bd.east?.visit || normalized.boundaryEastVisit,
                boundarySouthDeed: bd.south?.deed || normalized.boundarySouthDeed,
                boundarySouthVisit: bd.south?.visit || normalized.boundarySouthVisit,
                boundaryWestDeed: bd.west?.deed || normalized.boundaryWestDeed,
                boundaryWestVisit: bd.west?.visit || normalized.boundaryWestVisit,
                // Legacy mapping
                boundariesPlotNorthDeed: bd.north?.deed || normalized.boundariesPlotNorthDeed,
                boundariesPlotNorthActual: bd.north?.visit || normalized.boundariesPlotNorthActual,
                boundariesPlotEastDeed: bd.east?.deed || normalized.boundariesPlotEastDeed,
                boundariesPlotEastActual: bd.east?.visit || normalized.boundariesPlotEastActual,
                boundariesPlotSouthDeed: bd.south?.deed || normalized.boundariesPlotSouthDeed,
                boundariesPlotSouthActual: bd.south?.visit || normalized.boundariesPlotSouthActual,
                boundariesPlotWestDeed: bd.west?.deed || normalized.boundariesPlotWestDeed,
                boundariesPlotWestActual: bd.west?.visit || normalized.boundariesPlotWestActual
            };
        }

        // Flatten dimension details (pdfDetails.dimensions -> root level)
        if (data.pdfDetails.dimensions) {
            const dim = data.pdfDetails.dimensions;
            normalized = {
                ...normalized,
                dimensionNorthDeed: dim.north?.deed || normalized.dimensionNorthDeed,
                dimensionNorthActual: dim.north?.actual || normalized.dimensionNorthActual,
                dimensionEastDeed: dim.east?.deed || normalized.dimensionEastDeed,
                dimensionEastActual: dim.east?.actual || normalized.dimensionEastActual,
                dimensionSouthDeed: dim.south?.deed || normalized.dimensionSouthDeed,
                dimensionSouthActual: dim.south?.actual || normalized.dimensionSouthActual,
                dimensionWestDeed: dim.west?.deed || normalized.dimensionWestDeed,
                dimensionWestActual: dim.west?.actual || normalized.dimensionWestActual
            };
        }

        // Flatten area classification details (pdfDetails.areaClassification -> root level)
        if (data.pdfDetails.areaClassification) {
            const ac = data.pdfDetails.areaClassification;
            normalized = {
                ...normalized,
                areaClassification: ac.areaClassification || normalized.areaClassification,
                cityTown: ac.cityTown || normalized.cityTown,
                residentialArea: ac.residentialArea || normalized.residentialArea,
                commercialArea: ac.commercialArea || normalized.commercialArea,
                industrialArea: ac.industrialArea || normalized.industrialArea,
                highMiddlePoor: ac.highMiddlePoor || normalized.highMiddlePoor,
                urbanSemiUrbanRural: ac.urbanSemiUrbanRural || normalized.urbanSemiUrbanRural,
                corporationLimitVillage: ac.corporationLimitVillage || normalized.corporationLimitVillage,
                governmentEnactments: ac.governmentEnactments || normalized.governmentEnactments,
                agriculturalLandConversion: ac.agriculturalLandConversion || normalized.agriculturalLandConversion
            };
        }

        // Flatten site characteristics details (pdfDetails.siteCharacteristics -> root level)
        if (data.pdfDetails.siteCharacteristics) {
            const sc = data.pdfDetails.siteCharacteristics;
            normalized = {
                ...normalized,
                classificationLocality: sc.classificationOfLocality || normalized.classificationLocality,
                developmentSurroundingAreas: sc.developmentSurroundingArea || normalized.developmentSurroundingAreas,
                floodingPossibility: sc.frequentFloodingSubmerging || normalized.floodingPossibility,
                civicAmenitiesFeasibility: sc.feasibilityCivicAmenities || normalized.civicAmenitiesFeasibility,
                landTopography: sc.levelOfLandTopographical || normalized.landTopography,
                shapeOfLand: sc.shapeOfLand || normalized.shapeOfLand,
                typeOfUse: sc.typeOfUse || normalized.typeOfUse,
                usageRestriction: sc.usageRestriction || normalized.usageRestriction,
                townPlanningApproved: sc.townPlanningApprovedLayout || normalized.townPlanningApproved,
                cornerPlotType: sc.cornerPlotIntermittentPlot || normalized.cornerPlotType,
                roadFacilities: sc.roadFacilities || normalized.roadFacilities,
                typeOfRoad: sc.typeOfRoadAvailable || normalized.typeOfRoad,
                roadWidth: sc.widthOfRoad || normalized.roadWidth,
                lockedLand: sc.lockedLand || normalized.lockedLand,
                waterPotentiality: sc.waterPotentiality || normalized.waterPotentiality,
                undergroundSewerage: sc.undergroundSewerageSystem || normalized.undergroundSewerage,
                powerSupply: sc.powerSupplyAtSite || normalized.powerSupply,
                siteAdvantage1: sc.advantageOfSite1 || normalized.siteAdvantage1,
                siteAdvantage2: sc.advantageOfSite2 || normalized.siteAdvantage2,
                specialRemarks1: sc.specialRemarks1 || normalized.specialRemarks1,
                specialRemarks2: sc.specialRemarks2 || normalized.specialRemarks2
            };
        }

        // Flatten extent details (pdfDetails.extent -> root level)
        if (data.pdfDetails.extent) {
            const ext = data.pdfDetails.extent;
            normalized = {
                ...normalized,
                extentOfSite: ext.extentOfSite || normalized.extentOfSite,
                extentSiteValuation: ext.extentConsideredForValuation || normalized.extentSiteValuation
            };
        }

        // Flatten occupation status details (pdfDetails.occupationStatus -> root level)
        if (data.pdfDetails.occupationStatus) {
            const os = data.pdfDetails.occupationStatus;
            normalized = {
                ...normalized,
                occupiedByOwnerTenant: os.occupiedByOwnerTenant || normalized.occupiedByOwnerTenant,
                tenancyDuration: os.tenancyDuration || normalized.tenancyDuration,
                rentReceivedPerMonth: os.rentReceivedPerMonth || normalized.rentReceivedPerMonth
            };
        }

        // Flatten land valuation details (pdfDetails.landValuation -> root level)
        if (data.pdfDetails.landValuation) {
            const lv = data.pdfDetails.landValuation;
            normalized = {
                ...normalized,
                // Size of Plot
                sizeOfPlotNorthSouth: lv.sizeOfPlot?.northSouth || normalized.sizeOfPlotNorthSouth,
                sizeOfPlotEastWest: lv.sizeOfPlot?.eastWest || normalized.sizeOfPlotEastWest,
                plotArea: lv.sizeOfPlot?.total || normalized.plotArea,
                approvedPlanArea: lv.sizeOfPlot?.total || normalized.approvedPlanArea,
                totalPlotArea: lv.sizeOfPlot?.total || normalized.totalPlotArea,
                approvedPlanTotal: lv.sizeOfPlot?.total || normalized.approvedPlanTotal,
                // Market Rate
                prevailingRate: lv.marketRate?.prevailingRate || normalized.prevailingRate,
                landBuildingAreaRateMethod: lv.marketRate?.landBuildingAreaRateMethod || normalized.landBuildingAreaRateMethod,
                landRate: lv.marketRate?.landBuildingAreaRateMethod || lv.rate || normalized.landRate,
                // Guideline Rate
                guidelineRateFromRegistrar: lv.guidelineRate?.fromRegistrar || normalized.guidelineRateFromRegistrar,
                guidelineRateAdopted: lv.guidelineRate?.adoptedRate || normalized.guidelineRateAdopted,
                // Jantri Rate
                jantriRate: lv.jantriRate?.rate || normalized.jantriRate,
                jantriLandValue: lv.jantriRate?.landValue || normalized.jantriLandValue,
                jantriBuildingValue: lv.jantriRate?.buildingValue || normalized.jantriBuildingValue,
                jantriTotalValue: lv.jantriRate?.totalValue || normalized.jantriTotalValue,
                // Estimated Value
                estimatedValueOfLand: lv.estimatedValueOfLand || normalized.estimatedValueOfLand,
                variationClause: lv.variationClause || normalized.variationClause,
                // Market Value Analysis of Land (Part A)
                landAreaPlot: lv.plotDescription || normalized.landAreaPlot,
                landAreaSqYd: lv.areaSqYd || normalized.landAreaSqYd,
                landTotal: lv.totalValue || normalized.landTotal,
                landTotalSayRO: lv.sayRO || normalized.landTotalSayRO
            };
        }

        // Flatten building details (pdfDetails.buildingDetails -> root level)
        if (data.pdfDetails.buildingDetails) {
            const bd = data.pdfDetails.buildingDetails;
            normalized = {
                ...normalized,
                typeOfBuilding: bd.typeOfBuilding || normalized.typeOfBuilding,
                typeOfConstruction: bd.typeOfConstruction || normalized.typeOfConstruction,
                yearOfConstruction: bd.yearOfConstruction || normalized.yearOfConstruction,
                numberOfFloorsHeight: bd.numberOfFloorsHeight || normalized.numberOfFloorsHeight,
                plinthAreaFloorWise: bd.plinthAreaFloorWise || normalized.plinthAreaFloorWise,
                conditionOfBuildingExterior: bd.condition?.exterior || normalized.conditionOfBuildingExterior,
                conditionOfBuildingInterior: bd.condition?.interior || normalized.conditionOfBuildingInterior,
                approvedMapDateValidity: bd.approvedMap?.dateValidity || normalized.approvedMapDateValidity,
                approvedMapAuthority: bd.approvedMap?.issuingAuthority || normalized.approvedMapAuthority,
                genuinessVerified: bd.approvedMap?.genuinessVerified || normalized.genuinessVerified,
                otherCommentsOnApprovedPlan: bd.otherCommentsOnApprovedPlan || normalized.otherCommentsOnApprovedPlan
            };
        }

        // Flatten construction cost analysis (pdfDetails.constructionCostAnalysis -> root level)
        if (data.pdfDetails.constructionCostAnalysis) {
            const cca = data.pdfDetails.constructionCostAnalysis;
            normalized = {
                ...normalized,
                // Total area and value
                areaSMT: cca.total?.areaSMT || normalized.areaSMT,
                areaSYD: cca.total?.areaSYD || normalized.areaSYD,
                totalValue: cca.total?.totalValue || normalized.totalValue,
                constructionTotalAreaSMT: cca.total?.areaSMT || normalized.constructionTotalAreaSMT,
                constructionTotalAreaSYD: cca.total?.areaSYD || normalized.constructionTotalAreaSYD,
                constructionTotalValue: cca.total?.totalValue || normalized.constructionTotalValue,
                // Security Room
                securityRoomArea: cca.securityRoom?.areaDetails || normalized.securityRoomArea,
                securityRoomSMT: cca.securityRoom?.areaSMT || normalized.securityRoomSMT,
                securityRoomSYD: cca.securityRoom?.areaSYD || normalized.securityRoomSYD,
                securityRoomRate: cca.securityRoom?.ratePerSYD || normalized.securityRoomRate,
                securityRoomValue: cca.securityRoom?.value || normalized.securityRoomValue,
                // Labours Quarter
                laboursQuarterArea: cca.laboursQuarter?.areaDetails || normalized.laboursQuarterArea,
                laboursQuarterSMT: cca.laboursQuarter?.areaSMT || normalized.laboursQuarterSMT,
                laboursQuarterSYD: cca.laboursQuarter?.areaSYD || normalized.laboursQuarterSYD,
                laboursQuarterRate: cca.laboursQuarter?.ratePerSYD || normalized.laboursQuarterRate,
                laboursQuarterValue: cca.laboursQuarter?.value || normalized.laboursQuarterValue,
                // Store Room
                storeRoomArea: cca.storeRoom?.areaDetails || normalized.storeRoomArea,
                storeRoomSMT: cca.storeRoom?.areaSMT || normalized.storeRoomSMT,
                storeRoomSYD: cca.storeRoom?.areaSYD || normalized.storeRoomSYD,
                storeRoomRate: cca.storeRoom?.ratePerSYD || normalized.storeRoomRate,
                storeRoomValue: cca.storeRoom?.value || normalized.storeRoomValue,
                // Gallery Room
                galleryRoomArea: cca.galleryRoom?.areaDetails || normalized.galleryRoomArea,
                galleryRoomSMT: cca.galleryRoom?.areaSMT || normalized.galleryRoomSMT,
                galleryRoomSYD: cca.galleryRoom?.areaSYD || normalized.galleryRoomSYD,
                galleryRoomRate: cca.galleryRoom?.ratePerSYD || normalized.galleryRoomRate,
                galleryRoomValue: cca.galleryRoom?.value || normalized.galleryRoomValue,
                // FF Labours Quarter
                ffLaboursQuarterArea: cca.ffLaboursQuarter?.areaDetails || normalized.ffLaboursQuarterArea,
                ffLaboursQuarterSMT: cca.ffLaboursQuarter?.areaSMT || normalized.ffLaboursQuarterSMT,
                ffLaboursQuarterSYD: cca.ffLaboursQuarter?.areaSYD || normalized.ffLaboursQuarterSYD,
                ffLaboursQuarterRate: cca.ffLaboursQuarter?.ratePerSYD || normalized.ffLaboursQuarterRate,
                ffLaboursQuarterValue: cca.ffLaboursQuarter?.value || normalized.ffLaboursQuarterValue,
                // GF Room
                gfRoomArea: cca.gfRoom?.areaDetails || normalized.gfRoomArea,
                gfRoomSMT: cca.gfRoom?.areaSMT || normalized.gfRoomSMT,
                gfRoomSYD: cca.gfRoom?.areaSYD || normalized.gfRoomSYD,
                gfRoomRate: cca.gfRoom?.ratePerSYD || normalized.gfRoomRate,
                gfRoomValue: cca.gfRoom?.value || normalized.gfRoomValue,
                // GF Wash Room
                gfWashRoomArea: cca.gfWashRoom?.areaDetails || normalized.gfWashRoomArea,
                gfWashRoomSMT: cca.gfWashRoom?.areaSMT || normalized.gfWashRoomSMT,
                gfWashRoomSYD: cca.gfWashRoom?.areaSYD || normalized.gfWashRoomSYD,
                gfWashRoomRate: cca.gfWashRoom?.ratePerSYD || normalized.gfWashRoomRate,
                gfWashRoomValue: cca.gfWashRoom?.value || normalized.gfWashRoomValue,
                // Office 1
                office1Area: cca.office1?.areaDetails || normalized.office1Area,
                office1SMT: cca.office1?.areaSMT || normalized.office1SMT,
                office1SYD: cca.office1?.areaSYD || normalized.office1SYD,
                office1Rate: cca.office1?.ratePerSYD || normalized.office1Rate,
                office1Value: cca.office1?.value || normalized.office1Value,
                // Wash Room
                washRoomArea: cca.washRoom?.areaDetails || normalized.washRoomArea,
                washRoomSMT: cca.washRoom?.areaSMT || normalized.washRoomSMT,
                washRoomSYD: cca.washRoom?.areaSYD || normalized.washRoomSYD,
                washRoomRate: cca.washRoom?.ratePerSYD || normalized.washRoomRate,
                washRoomValue: cca.washRoom?.value || normalized.washRoomValue,
                // Shed
                shedArea: cca.shed?.areaDetails || normalized.shedArea,
                shedSMT: cca.shed?.areaSMT || normalized.shedSMT,
                shedSYD: cca.shed?.areaSYD || normalized.shedSYD,
                shedRate: cca.shed?.ratePerSYD || normalized.shedRate,
                shedValue: cca.shed?.value || normalized.shedValue,
                // Office 2
                office2Area: cca.office2?.areaDetails || normalized.office2Area,
                office2SMT: cca.office2?.areaSMT || normalized.office2SMT,
                office2SYD: cca.office2?.areaSYD || normalized.office2SYD,
                office2Rate: cca.office2?.ratePerSYD || normalized.office2Rate,
                office2Value: cca.office2?.value || normalized.office2Value,
                // Shed 1
                shed1Area: cca.shed1?.areaDetails || normalized.shed1Area,
                shed1SMT: cca.shed1?.areaSMT || normalized.shed1SMT,
                shed1SYD: cca.shed1?.areaSYD || normalized.shed1SYD,
                shed1Rate: cca.shed1?.ratePerSYD || normalized.shed1Rate,
                shed1Value: cca.shed1?.value || normalized.shed1Value,
                // Shed 2 Unit 1
                shed2Unit1Area: cca.shed2Unit1?.areaDetails || normalized.shed2Unit1Area,
                shed2Unit1SMT: cca.shed2Unit1?.areaSMT || normalized.shed2Unit1SMT,
                shed2Unit1SYD: cca.shed2Unit1?.areaSYD || normalized.shed2Unit1SYD,
                shed2Unit1Rate: cca.shed2Unit1?.ratePerSYD || normalized.shed2Unit1Rate,
                shed2Unit1Value: cca.shed2Unit1?.value || normalized.shed2Unit1Value,
                // Shed 2 Unit 2
                shed2Unit2Area: cca.shed2Unit2?.areaDetails || normalized.shed2Unit2Area,
                shed2Unit2SMT: cca.shed2Unit2?.areaSMT || normalized.shed2Unit2SMT,
                shed2Unit2SYD: cca.shed2Unit2?.areaSYD || normalized.shed2Unit2SYD,
                shed2Unit2Rate: cca.shed2Unit2?.ratePerSYD || normalized.shed2Unit2Rate,
                shed2Unit2Value: cca.shed2Unit2?.value || normalized.shed2Unit2Value,
                // Shed 3 (standalone/summary)
                shed3Area: cca.shed3?.areaDetails || normalized.shed3Area,
                shed3SMT: cca.shed3?.areaSMT || normalized.shed3SMT,
                shed3SYD: cca.shed3?.areaSYD || normalized.shed3SYD,
                shed3Rate: cca.shed3?.ratePerSYD || normalized.shed3Rate,
                shed3Value: cca.shed3?.value || normalized.shed3Value,
                // Open Shed
                openShedArea: cca.openShed?.areaDetails || normalized.openShedArea,
                openShedSMT: cca.openShed?.areaSMT || normalized.openShedSMT,
                openShedSYD: cca.openShed?.areaSYD || normalized.openShedSYD,
                openShedRate: cca.openShed?.ratePerSYD || normalized.openShedRate,
                openShedValue: cca.openShed?.value || normalized.openShedValue,
                // Godown
                godownArea: cca.godown?.areaDetails || normalized.godownArea,
                godownSMT: cca.godown?.areaSMT || normalized.godownSMT,
                godownSYD: cca.godown?.areaSYD || normalized.godownSYD,
                godownRate: cca.godown?.ratePerSYD || normalized.godownRate,
                godownValue: cca.godown?.value || normalized.godownValue,
                // Shed 3 Unit 1
                shed3Unit1Area: cca.shed3Unit1?.areaDetails || normalized.shed3Unit1Area,
                shed3Unit1SMT: cca.shed3Unit1?.areaSMT || normalized.shed3Unit1SMT,
                shed3Unit1SYD: cca.shed3Unit1?.areaSYD || normalized.shed3Unit1SYD,
                shed3Unit1Rate: cca.shed3Unit1?.ratePerSYD || normalized.shed3Unit1Rate,
                shed3Unit1Value: cca.shed3Unit1?.value || normalized.shed3Unit1Value,
                // Shed 3 Unit 2
                shed3Unit2Area: cca.shed3Unit2?.areaDetails || normalized.shed3Unit2Area,
                shed3Unit2SMT: cca.shed3Unit2?.areaSMT || normalized.shed3Unit2SMT,
                shed3Unit2SYD: cca.shed3Unit2?.areaSYD || normalized.shed3Unit2SYD,
                shed3Unit2Rate: cca.shed3Unit2?.ratePerSYD || normalized.shed3Unit2Rate,
                shed3Unit2Value: cca.shed3Unit2?.value || normalized.shed3Unit2Value,
                // Shed 3 Unit 3
                shed3Unit3Area: cca.shed3Unit3?.areaDetails || normalized.shed3Unit3Area,
                shed3Unit3SMT: cca.shed3Unit3?.areaSMT || normalized.shed3Unit3SMT,
                shed3Unit3SYD: cca.shed3Unit3?.areaSYD || normalized.shed3Unit3SYD,
                shed3Unit3Rate: cca.shed3Unit3?.ratePerSYD || normalized.shed3Unit3Rate,
                shed3Unit3Value: cca.shed3Unit3?.value || normalized.shed3Unit3Value
            };
        }
    }

    // Flatten checklist of documents (pdfDetails.checklistOfDocuments -> root level)
    if (data.pdfDetails.checklistOfDocuments) {
        const cod = data.pdfDetails.checklistOfDocuments;
        normalized = {
            ...normalized,
            engagementLetterConfirmation: cod.engagementLetterConfirmation || normalized.engagementLetterConfirmation,
            ownershipDocumentsSaleDeed: cod.ownershipDocumentsSaleDeed || normalized.ownershipDocumentsSaleDeed,
            advTcrLsr: cod.advTcrLsr || normalized.advTcrLsr,
            agreementForSaleBanaKhat: cod.agreementForSaleBanaKhat || normalized.agreementForSaleBanaKhat,
            propertyCard: cod.propertyCard || normalized.propertyCard,
            mortgageDeed: cod.mortgageDeed || normalized.mortgageDeed,
            leaseDeed: cod.leaseDeed || normalized.leaseDeed,
            index2: cod.index2 || normalized.index2,
            vf712InCaseOfLand: cod.vf712InCaseOfLand || normalized.vf712InCaseOfLand,
            naOrder: cod.naOrder || normalized.naOrder,
            approvedLayoutPlan: cod.approvedLayoutPlan || normalized.approvedLayoutPlan,
            commencementLetter: cod.commencementLetter || normalized.commencementLetter,
            buPermission: cod.buPermission || normalized.buPermission,
            eleMeterPhoto: cod.eleMeterPhoto || normalized.eleMeterPhoto,
            lightBill: cod.lightBill || normalized.lightBill,
            muniTaxBill: cod.muniTaxBill || normalized.muniTaxBill,
            numberingFlatBungalowPlotNo: cod.numberingFlatBungalowPlotNo || normalized.numberingFlatBungalowPlotNo,
            boundariesOfPropertyProperDemarcation: cod.boundariesOfPropertyProperDemarcation || normalized.boundariesOfPropertyProperDemarcation,
            mergedProperty: cod.mergedProperty || normalized.mergedProperty,
            premiseCanBeSeparatedEntranceDoor: cod.premiseCanBeSeparatedEntranceDoor || normalized.premiseCanBeSeparatedEntranceDoor,
            landIsLocked: cod.landIsLocked || normalized.landIsLocked,
            propertyIsRentedToOtherParty: cod.propertyIsRentedToOtherParty || normalized.propertyIsRentedToOtherParty,
            ifRentedRentAgreementIsProvided: cod.ifRentedRentAgreementIsProvided || normalized.ifRentedRentAgreementIsProvided,
            siteVisitPhotos: cod.siteVisitPhotos || normalized.siteVisitPhotos,
            selfieWithOwnerIdentifier: cod.selfieWithOwnerIdentifier || normalized.selfieWithOwnerIdentifier,
            mobileNo: cod.mobileNo || normalized.mobileNo,
            dataSheet: cod.dataSheet || normalized.dataSheet,
            tentativeRate: cod.tentativeRate || normalized.tentativeRate,
            saleInstanceLocalInquiryVerbalSurvey: cod.saleInstanceLocalInquiryVerbalSurvey || normalized.saleInstanceLocalInquiryVerbalSurvey,
            brokerRecording: cod.brokerRecording || normalized.brokerRecording,
            pastValuationRate: cod.pastValuationRate || normalized.pastValuationRate
        };
    }

    if (data.propertyBoundaries?.plotBoundaries) {
        normalized = {
            ...normalized,
            boundariesPlotNorth: data.propertyBoundaries.plotBoundaries.north || normalized.boundariesPlotNorth,
            boundariesPlotSouth: data.propertyBoundaries.plotBoundaries.south || normalized.boundariesPlotSouth,
            boundariesPlotEast: data.propertyBoundaries.plotBoundaries.east || normalized.boundariesPlotEast,
            boundariesPlotWest: data.propertyBoundaries.plotBoundaries.west || normalized.boundariesPlotWest
        };
    }

    if (data.propertyDimensions) {
        normalized = {
            ...normalized,
            dimensionsDeed: data.propertyDimensions.dimensionsAsPerDeed || normalized.dimensionsDeed,
            dimensionsActual: data.propertyDimensions.actualDimensions || normalized.dimensionsActual,
            extentOfUnit: data.propertyDimensions.extent || normalized.extentOfUnit,
            latitudeLongitude: data.propertyDimensions.latitudeLongitudeCoordinates || normalized.latitudeLongitude,
            extentOfSiteValuation: data.propertyDimensions.extentSiteConsideredValuation || normalized.extentOfSiteValuation
        };
    }

    if (data.rateInfo) {
        normalized = {
            ...normalized,
            comparableRate: data.rateInfo.comparableRateSimilarUnit || normalized.comparableRate,
            adoptedBasicCompositeRate: data.rateInfo.adoptedBasicCompositeRate || normalized.adoptedBasicCompositeRate,
            buildingServicesRate: data.rateInfo.buildingServicesRate || normalized.buildingServicesRate,
            landOthersRate: data.rateInfo.landOthersRate || normalized.landOthersRate
        };
    }

    if (data.rateValuation) {
        normalized = {
            ...normalized,
            comparableRate: data.rateValuation.comparableRateSimilarUnitPerSqft || normalized.comparableRate,
            adoptedBasicCompositeRate: data.rateValuation.adoptedBasicCompositeRatePerSqft || normalized.adoptedBasicCompositeRate,
            buildingServicesRate: data.rateValuation.buildingServicesRatePerSqft || normalized.buildingServicesRate,
            landOthersRate: data.rateValuation.landOthersRatePerSqft || normalized.landOthersRate
        };
    }

    if (data.compositeRateDepreciation) {
        normalized = {
            ...normalized,
            depreciatedBuildingRate: data.compositeRateDepreciation.depreciatedBuildingRatePerSqft || normalized.depreciatedBuildingRate,
            replacementCostServices: data.compositeRateDepreciation.replacementCostUnitServicesPerSqft || normalized.replacementCostServices,
            buildingAge: data.compositeRateDepreciation.ageOfBuildingYears || normalized.buildingAge,
            buildingLife: data.compositeRateDepreciation.lifeOfBuildingEstimatedYears || normalized.buildingLife,
            depreciationPercentage: data.compositeRateDepreciation.depreciationPercentageSalvage || normalized.depreciationPercentage,
            deprecatedRatio: data.compositeRateDepreciation.depreciatedRatioBuilding || normalized.deprecatedRatio,
            totalCompositeRate: data.compositeRateDepreciation.totalCompositeRatePerSqft || normalized.totalCompositeRate,
            rateForLandOther: data.compositeRateDepreciation.rateLandOtherV3IIPerSqft || normalized.rateForLandOther,
            guidelineRate: data.compositeRateDepreciation.guidelineRatePerSqm || normalized.guidelineRate
        };
    }

    if (data.compositeRate) {
        normalized = {
            ...normalized,
            depreciatedBuildingRate: data.compositeRate.depreciatedBuildingRate || normalized.depreciatedBuildingRate,
            replacementCostServices: data.compositeRate.replacementCostUnitServices || normalized.replacementCostServices,
            buildingAge: data.compositeRate.ageOfBuilding || normalized.buildingAge,
            buildingLife: data.compositeRate.lifeOfBuildingEstimated || normalized.buildingLife,
            depreciationPercentage: data.compositeRate.depreciationPercentageSalvage || normalized.depreciationPercentage,
            deprecatedRatio: data.compositeRate.depreciatedRatioBuilding || normalized.deprecatedRatio,
            totalCompositeRate: data.compositeRate.totalCompositeRate || normalized.totalCompositeRate,
            rateForLandOther: data.compositeRate.rateLandOtherV3II || normalized.rateForLandOther,
            guidelineRate: data.compositeRate.guidelineRateRegistrar || normalized.guidelineRate
        };
    }

    if (data.valuationResults) {
        normalized = {
            ...normalized,
            fairMarketValue: data.valuationResults.fairMarketValue || normalized.fairMarketValue,
            fairMarketValueWords: data.valuationResults.fairMarketValueWords || normalized.fairMarketValueWords,
            realisableValue: data.valuationResults.realisableValue || data.valuationResults.realizableValue || normalized.realisableValue,
            realisableValueWords: data.valuationResults.realisableValueWords || data.valuationResults.realizableValueWords || normalized.realisableValueWords,
            distressValue: data.valuationResults.distressValue || normalized.distressValue,
            distressValueWords: data.valuationResults.distressValueWords || normalized.distressValueWords,
            agreementValue: data.valuationResults.agreementValue || normalized.agreementValue,
            agreementValueWords: data.valuationResults.agreementValueWords || normalized.agreementValueWords,
            valueCircleRate: data.valuationResults.valueCircleRate || data.valuationResults.circleRate || normalized.valueCircleRate,
            valueCircleRateWords: data.valuationResults.valueCircleRateWords || data.valuationResults.circleRateWords || normalized.valueCircleRateWords,
            saleDeedValue: data.valuationResults.saleDeedValue || normalized.saleDeedValue,
            insurableValue: data.valuationResults.insurableValue || normalized.insurableValue,
            insurableValueWords: data.valuationResults.insurableValueWords || normalized.insurableValueWords,
            rentReceivedPerMonth: data.valuationResults.rentReceivedPerMonth || normalized.rentReceivedPerMonth,
            marketability: data.valuationResults.marketability || normalized.marketability,
            valuationPlace: data.valuationResults.valuationPlace || normalized.valuationPlace,
            valuationMadeDate: data.valuationResults.valuationMadeDate || normalized.valuationMadeDate
        };
    }

    if (data.buildingConstruction) {
        normalized = {
            ...normalized,
            yearOfConstruction: data.buildingConstruction.yearOfConstruction || normalized.yearOfConstruction,
            numberOfFloors: data.buildingConstruction.numberOfFloors || normalized.numberOfFloors,
            numberOfDwellingUnits: data.buildingConstruction.numberOfDwellingUnits || normalized.numberOfDwellingUnits,
            typeOfStructure: data.buildingConstruction.typeOfStructure || normalized.typeOfStructure,
            qualityOfConstruction: data.buildingConstruction.qualityOfConstruction || normalized.qualityOfConstruction,
            appearanceOfBuilding: data.buildingConstruction.appearanceOfBuilding || normalized.appearanceOfBuilding,
            maintenanceOfBuilding: data.buildingConstruction.maintenanceOfBuilding || normalized.maintenanceOfBuilding
        };
    }

    // Map electricityService data
    if (data.electricityService) {
        normalized = {
            ...normalized,
            electricityServiceConnectionNo: data.electricityService.electricityServiceConnectionNo || normalized.electricityServiceConnectionNo,
            meterCardName: data.electricityService.meterCardName || normalized.meterCardName
        };
    }

    // Map unitTax data
    if (data.unitTax) {
        normalized = {
            ...normalized,
            assessmentNo: data.unitTax.assessmentNo || normalized.assessmentNo,
            taxPaidName: data.unitTax.taxPaidName || normalized.taxPaidName,
            taxAmount: data.unitTax.taxAmount || normalized.taxAmount
        };
    }

    // Map unitMaintenance data
    if (data.unitMaintenance) {
        normalized = {
            ...normalized,
            unitMaintenance: data.unitMaintenance.unitMaintenanceStatus || normalized.unitMaintenance
        };
    }

    // Map unitSpecifications data
    if (data.unitSpecifications) {
        normalized = {
            ...normalized,
            floorUnit: data.unitSpecifications.floorLocation || normalized.floorUnit,
            doorNoUnit: data.unitSpecifications.doorNoUnit || normalized.doorNoUnit,
            roofUnit: data.unitSpecifications.roof || normalized.roofUnit,
            flooringUnit: data.unitSpecifications.flooring || normalized.flooringUnit,
            doorsUnit: data.unitSpecifications.doors || normalized.doorsUnit,
            windowsUnit: data.unitSpecifications.windows || normalized.windowsUnit,
            fittingsUnit: data.unitSpecifications.fittings || normalized.fittingsUnit,
            finishingUnit: data.unitSpecifications.finishing || normalized.finishingUnit,
            unitBathAndWC: data.unitSpecifications.bathAndWC || normalized.unitBathAndWC,
            unitElectricalWiring: data.unitSpecifications.electricalWiring || normalized.unitElectricalWiring,
            unitWindows: data.unitSpecifications.windows || normalized.unitWindows,
            unitSpecification: data.unitSpecifications.specification || normalized.unitSpecification
        };
    }

    // Map unitAreaDetails data
    if (data.unitAreaDetails) {
        normalized = {
            ...normalized,
            undividedLandArea: data.unitAreaDetails.undividedLandAreaSaleDeed || data.unitAreaDetails.undividedLandArea || normalized.undividedLandArea,
            plinthArea: data.unitAreaDetails.plinthAreaUnit || data.unitAreaDetails.plinthArea || normalized.plinthArea,
            carpetArea: data.unitAreaDetails.carpetAreaUnit || data.unitAreaDetails.carpetArea || normalized.carpetArea
        };
    }

    // Map unitClassification data
    if (data.unitClassification) {
        normalized = {
            ...normalized,
            floorSpaceIndex: data.unitClassification.floorSpaceIndex || normalized.floorSpaceIndex,
            unitClassification: data.unitClassification.unitClassification || data.unitClassification.classification || normalized.unitClassification,
            residentialOrCommercial: data.unitClassification.residentialOrCommercial || data.unitClassification.usageType || normalized.residentialOrCommercial,
            ownerOccupiedOrLetOut: data.unitClassification.ownerOccupiedOrLetOut || data.unitClassification.occupancyType || normalized.ownerOccupiedOrLetOut,
            numberOfDwellingUnits: data.unitClassification.numberOfDwellingUnits || normalized.numberOfDwellingUnits
        };
    }

    // Map apartmentLocation data
    if (data.apartmentLocation) {
        normalized = {
            ...normalized,
            apartmentNature: data.apartmentLocation.apartmentNature || normalized.apartmentNature,
            apartmentLocation: data.apartmentLocation.apartmentLocation || data.apartmentLocation.location || normalized.apartmentLocation,
            apartmentCTSNo: data.apartmentLocation.apartmentCTSNo || data.apartmentLocation.ctsNo || data.apartmentLocation.cTSNo || normalized.apartmentCTSNo,
            apartmentTSNo: data.apartmentLocation.tsNo || data.apartmentLocation.ctsNo || data.apartmentLocation.tSNo || data.apartmentLocation.plotSurveyNo || data.apartmentLocation.apartmentCTSNo || normalized.apartmentTSNo,
            apartmentBlockNo: data.apartmentLocation.blockNo || data.apartmentLocation.block || data.apartmentLocation.blockNumber || data.apartmentLocation.apartmentBlockNo || normalized.apartmentBlockNo,
            apartmentWardNo: data.apartmentLocation.wardNo || data.apartmentLocation.ward || data.apartmentLocation.wardNumber || data.apartmentLocation.apartmentWardNo || normalized.apartmentWardNo,
            apartmentVillageMunicipalityCounty: data.apartmentLocation.villageOrMunicipality || data.apartmentLocation.village || data.apartmentLocation.municipality || data.apartmentLocation.tsVillage || data.apartmentLocation.apartmentVillageMunicipalityCounty || normalized.apartmentVillageMunicipalityCounty,
            apartmentDoorNoStreetRoad: data.apartmentLocation.doorNoStreetRoadPinCode || data.apartmentLocation.doorNo || data.apartmentLocation.streetRoad || data.apartmentLocation.street || data.apartmentLocation.doorNumber || data.apartmentLocation.roadName || data.apartmentLocation.apartmentDoorNoStreetRoad || normalized.apartmentDoorNoStreetRoad,
            apartmentPinCode: data.apartmentLocation.pinCode || data.apartmentLocation.apartmentPinCode || normalized.apartmentPinCode
        };
    }

    // Map monthlyRent data
    if (data.monthlyRent) {
        normalized = {
            ...normalized,
            monthlyRent: data.monthlyRent.ifRentedMonthlyRent || normalized.monthlyRent
        };
    }

    // Map marketability data
    if (data.marketability) {
        normalized = {
            ...normalized,
            marketability: data.marketability.howIsMarketability || normalized.marketability,
            favoringFactors: data.marketability.factorsFavouringExtraPotential || normalized.favoringFactors,
            negativeFactors: data.marketability.negativeFactorsAffectingValue || normalized.negativeFactors
        };
    }

    // Map signatureReport data
    if (data.signatureReport) {
        normalized = {
            ...normalized,
            valuationPlace: data.signatureReport.place || normalized.valuationPlace,
            valuationDate: data.signatureReport.signatureDate || normalized.valuationDate,
            valuersName: data.signatureReport.signerName || normalized.valuersName,
            reportDate: data.signatureReport.reportDate || normalized.reportDate
        };
    }

    // Map additionalFlatDetails data
    if (data.additionalFlatDetails) {
        normalized = {
            ...normalized,
            areaUsage: data.additionalFlatDetails.areaUsage || normalized.areaUsage,
            carpetArea: data.additionalFlatDetails.carpetAreaFlat || normalized.carpetArea
        };
    }

    // Map guidelineRate data
    if (data.guidelineRate) {
        normalized = {
            ...normalized,
            guidelineRate: data.guidelineRate.guidelineRatePerSqm || normalized.guidelineRate
        };
    }

    // Map images data
    if (data.propertyImages || data.locationImages || data.documentPreviews || data.areaImages) {
        normalized = {
            ...normalized,
            propertyImages: data.propertyImages || normalized.propertyImages || [],
            locationImages: data.locationImages || normalized.locationImages || [],
            documentPreviews: data.documentPreviews || normalized.documentPreviews || [],
            areaImages: data.areaImages || normalized.areaImages || {}
        };
    }

    // Map root level fields as final fallback
    normalized = {
        ...normalized,
        carpetArea: normalized.carpetArea || data.carpetArea,
        plinthArea: normalized.plinthArea || data.plinthArea,
        floorSpaceIndex: normalized.floorSpaceIndex || data.floorSpaceIndex,
        unitClassification: normalized.unitClassification || data.unitClassification,
        residentialOrCommercial: normalized.residentialOrCommercial || data.residentialOrCommercial,
        ownerOccupiedOrLetOut: normalized.ownerOccupiedOrLetOut || data.ownerOccupiedOrLetOut,
        apartmentLocation: normalized.apartmentLocation || data.apartmentLocation || data.location,
        apartmentCTSNo: normalized.apartmentCTSNo || data.apartmentCTSNo || data.ctsNo || data.cTSNo,
        apartmentTSNo: normalized.apartmentTSNo || data.apartmentTSNo || data.ctsNo || data.tSNo || data.tsNo || data.plotSurveyNo || data.apartmentCTSNo,
        apartmentBlockNo: normalized.apartmentBlockNo || data.apartmentBlockNo || data.blockNo || data.block || data.blockNumber,
        apartmentWardNo: normalized.apartmentWardNo || data.apartmentWardNo || data.wardNo || data.ward || data.wardNumber,
        apartmentVillageMunicipalityCounty: normalized.apartmentVillageMunicipalityCounty || data.apartmentVillageMunicipalityCounty || data.village || data.municipality || data.villageOrMunicipality || data.tsVillage,
        apartmentDoorNoStreetRoad: normalized.apartmentDoorNoStreetRoad || data.apartmentDoorNoStreetRoad || data.doorNo || data.streetRoad || data.street || data.doorNumber || data.roadName,
        apartmentPinCode: normalized.apartmentPinCode || data.apartmentPinCode || data.pinCode,
        classificationPosh: normalized.classificationPosh || data.classificationPosh,
        classificationUsage: normalized.classificationUsage || data.classificationUsage,
        classificationOwnership: normalized.classificationOwnership || data.classificationOwnership,
        ownerOccupancyStatus: normalized.ownerOccupancyStatus || data.ownerOccupancyStatus,
        propertyImages: normalized.propertyImages || data.propertyImages || [],
        locationImages: normalized.locationImages || data.locationImages || [],
        documentPreviews: normalized.documentPreviews || data.documentPreviews || [],
        areaImages: normalized.areaImages || data.areaImages || {}
    };

    // Map document fields from documentsProduced (MongoDB structure - primary source)
    if (data.documentsProduced) {
        normalized.agreementForSale = data.documentsProduced.photocopyCopyAgreement || normalized.agreementForSale;
        normalized.commencementCertificate = data.documentsProduced.commencementCertificate || normalized.commencementCertificate;
        normalized.occupancyCertificate = data.documentsProduced.occupancyCertificate || normalized.occupancyCertificate;
    }

    // Map document fields from pdfDetails if available (fallback)
    if (data.pdfDetails) {
        normalized.agreementForSale = normalized.agreementForSale || data.pdfDetails.agreementForSale || data.pdfDetails.agreementSaleExecutedName;
        normalized.commencementCertificate = normalized.commencementCertificate || data.pdfDetails.commencementCertificate;
        normalized.occupancyCertificate = normalized.occupancyCertificate || data.pdfDetails.occupancyCertificate;
    }

    // Map document fields from agreementForSale nested object
    if (data.agreementForSale?.agreementForSaleExecutedName) {
        normalized.agreementForSale = normalized.agreementForSale || data.agreementForSale.agreementForSaleExecutedName;
    }

    // Also check root level fields (direct properties from response)
    normalized.agreementForSale = normalized.agreementForSale || data.agreementForSale;
    normalized.commencementCertificate = normalized.commencementCertificate || data.commencementCertificate;
    normalized.occupancyCertificate = normalized.occupancyCertificate || data.occupancyCertificate;

    return normalized;
};

export function generateValuationReportHTML(data = {}) {
    // Normalize data structure first - flatten nested MongoDB objects
    const normalizedData = normalizeDataForPDF(data);



    // Start with normalized data, then merge with root level data and pdfDetails
    let pdfData = normalizedData;

    // Merge root level data first
    pdfData = {
        ...pdfData,
        ...data
    };

    // Extract nested document fields BEFORE spreading pdfDetails
    // This prevents them from being overwritten by the spread operation
    const extractedDocumentFields = {
        // Ownership Documents
        conveyanceDeed: data?.pdfDetails?.documents?.ownershipDocuments?.conveyanceDeed,
        saleCertificate: data?.pdfDetails?.documents?.ownershipDocuments?.saleCertificate,
        engagementLetter: data?.pdfDetails?.documents?.ownershipDocuments?.engagementLetter,
        ownershipDocuments: data?.pdfDetails?.documents?.ownershipDocuments?.ownershipDocuments,
        // Property Records
        advTcrLsr: data?.pdfDetails?.documents?.propertyRecords?.advTcrLsr,
        agreementForSale: data?.pdfDetails?.documents?.propertyRecords?.agreementForSale,
        propertyCard: data?.pdfDetails?.documents?.propertyRecords?.propertyCard,
        mortgageDeed: data?.pdfDetails?.documents?.propertyRecords?.mortgageDeed,
        leaseDeed: data?.pdfDetails?.documents?.propertyRecords?.leaseDeed,
        // Permissions
        approvedLayoutPlan: data?.pdfDetails?.documents?.permissions?.approvedLayoutPlan,
        commencementLetter: data?.pdfDetails?.documents?.permissions?.commencementLetter,
        buPermission: data?.pdfDetails?.documents?.permissions?.buPermission,
        healthSafetyPlan: data?.pdfDetails?.documents?.permissions?.healthSafetyPlan,
        // Utilities
        eleMeterPhoto: data?.pdfDetails?.documents?.utilities?.eleMeterPhoto,
        lightBill: data?.pdfDetails?.documents?.utilities?.lightBill,
        muniTaxBill: data?.pdfDetails?.documents?.utilities?.muniTaxBill
    };

    // Flatten pdfDetails into root level for easier access (pdfDetails has HIGHEST priority as it contains form data)
    // This ensures ALL form fields from pdfDetails are available for the PDF template and overrides other sources
    // BUT preserve propertyImages, locationImages, documentPreviews, and areaImages arrays
    if (data?.pdfDetails && typeof data.pdfDetails === 'object') {
        const preservedPropertyImages = pdfData.propertyImages;
        const preservedLocationImages = pdfData.locationImages;
        const preservedDocumentPreviews = pdfData.documentPreviews || data.documentPreviews;
        const preservedAreaImages = pdfData.areaImages || data.areaImages;

        pdfData = {
            ...pdfData,
            ...data.pdfDetails,
            ...extractedDocumentFields
        };

        // Restore image arrays if they exist
        if (preservedPropertyImages) {
            pdfData.propertyImages = preservedPropertyImages;
        }
        if (preservedLocationImages) {
            pdfData.locationImages = preservedLocationImages;
        }
        if (preservedDocumentPreviews) {
            pdfData.documentPreviews = preservedDocumentPreviews;
        }
        if (preservedAreaImages) {
            pdfData.areaImages = preservedAreaImages;
        }

        // Ensure customConstructionCostFields is available if it exists
        if (data.customConstructionCostFields && Array.isArray(data.customConstructionCostFields)) {
            pdfData.customConstructionCostFields = data.customConstructionCostFields;
        }

        // Map pdfDetails field names to template field names
        // classificationPosh -> unitClassification (for PDF template)
        if (data.pdfDetails.classificationPosh) {
            pdfData.unitClassification = data.pdfDetails.classificationPosh;
        } else if (typeof pdfData.unitClassification === 'object' && pdfData.unitClassification?.unitClassification) {
            // Extract from nested object if it exists
            pdfData.unitClassification = pdfData.unitClassification.unitClassification;
        }

        // Ensure unitMaintenance is in pdfData (should already be there from spread)
        if (data.pdfDetails.unitMaintenance) {
            pdfData.unitMaintenance = data.pdfDetails.unitMaintenance;
        } else if (typeof pdfData.unitMaintenance === 'object' && pdfData.unitMaintenance?.unitMaintenanceStatus) {
            // Extract from nested object if it exists
            pdfData.unitMaintenance = pdfData.unitMaintenance.unitMaintenanceStatus;
        }


    }

    // Flatten facilities object if it exists
    if (data?.facilities && typeof data.facilities === 'object') {
        pdfData = {
            ...pdfData,
            ...data.facilities
        };
    }

    // Comprehensive field name mapping for backward compatibility
    pdfData = {
        ...pdfData,
        // Basic info - Extract from nested pdfDetails.basicInfo
        borrowerName: pdfData.borrowerName || pdfData.pdfDetails?.basicInfo?.borrowerName || pdfData.pdfDetails?.borrowerName,
        ownerName: pdfData.ownerName || pdfData.pdfDetails?.basicInfo?.ownerName || pdfData.pdfDetails?.ownerName,
        propertyDetails: pdfData.propertyDetails || pdfData.pdfDetails?.basicInfo?.propertyDetails || pdfData.pdfDetails?.propertyDetails,
        propertyAddress: pdfData.propertyAddress || pdfData.pdfDetails?.basicInfo?.propertyAddress || pdfData.pdfDetails?.propertyAddress,
        bankName: pdfData.bankName || pdfData.pdfDetails?.basicInfo?.bankName || pdfData.pdfDetails?.bankName || pdfData.client,
        clientName: pdfData.clientName || pdfData.pdfDetails?.basicInfo?.clientName || pdfData.pdfDetails?.clientName || pdfData.client,
        client: pdfData.client || pdfData.pdfDetails?.basicInfo?.client || pdfData.pdfDetails?.client,
        applicant: pdfData.applicant || pdfData.pdfDetails?.basicInfo?.applicant || pdfData.pdfDetails?.applicant,
        valuationDoneBy: pdfData.valuationDoneBy || pdfData.pdfDetails?.basicInfo?.valuationDoneBy || pdfData.pdfDetails?.valuationDoneBy,
        // Valuation Purpose - Extract from nested pdfDetails.valuationPurpose
        purposeOfValuation: pdfData.purposeOfValuation || pdfData.pdfDetails?.valuationPurpose?.purposeOfValuation || pdfData.pdfDetails?.purposeOfValuation,
        dateOfValuation: pdfData.dateOfValuation || pdfData.pdfDetails?.valuationPurpose?.dateOfValuation || pdfData.pdfDetails?.dateOfValuation || pdfData.pdfDetails?.valuationPurpose?.dateValuationMade,
        dateOfInspection: pdfData.dateOfInspection || pdfData.pdfDetails?.valuationPurpose?.dateOfInspection || pdfData.pdfDetails?.dateOfInspection || pdfData.inspectionDate,
        // Land Valuation - Extract from nested pdfDetails.landValuation (Part A: Market Value Analysis)
        landAreaPlot: pdfData.landAreaPlot || pdfData.pdfDetails?.landValuation?.plotDescription || pdfData.pdfDetails?.landValuation?.landAreaPlot,
        landAreaSqYd: pdfData.landAreaSqYd || pdfData.pdfDetails?.landValuation?.areaSqYd || pdfData.pdfDetails?.landValuation?.landAreaSqYd,
        landRate: pdfData.landRate || pdfData.pdfDetails?.landValuation?.rate || pdfData.pdfDetails?.landValuation?.landRate,
        landTotal: pdfData.landTotal || pdfData.pdfDetails?.landValuation?.totalValue || pdfData.pdfDetails?.landValuation?.landTotal,
        landTotalSayRO: pdfData.landTotalSayRO || pdfData.pdfDetails?.landValuation?.sayRO || pdfData.pdfDetails?.landValuation?.landTotalSayRO,
        // Documents - Extract from nested pdfDetails.documents.ownershipDocuments
        conveyanceDeed: pdfData.conveyanceDeed || pdfData.pdfDetails?.documents?.ownershipDocuments?.conveyanceDeed || pdfData.pdfDetails?.conveyanceDeed,
        saleCertificate: pdfData.saleCertificate || pdfData.pdfDetails?.documents?.ownershipDocuments?.saleCertificate || pdfData.pdfDetails?.saleCertificate,
        healthSafetyPlan: pdfData.healthSafetyPlan || pdfData.pdfDetails?.documents?.permissions?.healthSafetyPlan || pdfData.pdfDetails?.healthSafetyPlan,
        // Legacy mappings
        branch: pdfData.branch || pdfData.pdfDetails?.branch,
        valuationPurpose: pdfData.valuationPurpose || pdfData.pdfDetails?.valuationPurpose?.purposeOfValuation || pdfData.pdfDetails?.valuationPurpose,
        referenceNo: pdfData.referenceNo || pdfData.pdfDetails?.referenceNo,
        inspectionDate: pdfData.inspectionDate || pdfData.dateOfInspection || pdfData.pdfDetails?.inspectionDate || pdfData.pdfDetails?.dateOfInspection,
        valuationMadeDate: pdfData.valuationMadeDate || pdfData.dateOfValuation || pdfData.pdfDetails?.valuationMadeDate || pdfData.pdfDetails?.dateOfValuationMade,
        agreementForSale: pdfData.agreementForSale || pdfData.pdfDetails?.agreementForSale,
        commencementCertificate: pdfData.commencementCertificate || pdfData.pdfDetails?.commencementCertificate,
        occupancyCertificate: pdfData.occupancyCertificate || pdfData.pdfDetails?.occupancyCertificate,
        ownerNameAddress: pdfData.ownerNameAddress || pdfData.pdfDetails?.ownerDetails?.ownerNameAddress || pdfData.pdfDetails?.ownerNameAddress,
        briefDescriptionProperty: pdfData.briefDescriptionProperty || pdfData.pdfDetails?.briefDescription?.briefDescription || pdfData.pdfDetails?.briefDescriptionProperty,

        // Location of property - Extract from nested pdfDetails.propertyLocation
        plotNo: pdfData.plotNo || pdfData.plotSurveyNo || pdfData.pdfDetails?.propertyLocation?.plotNumber || pdfData.pdfDetails?.plotSurveyNo,
        plotSurveyNo: pdfData.plotSurveyNo || pdfData.pdfDetails?.propertyLocation?.plotNumber || pdfData.pdfDetails?.plotSurveyNo,
        doorNo: pdfData.doorNo || pdfData.pdfDetails?.propertyLocation?.doorNumber || pdfData.pdfDetails?.doorNo,
        tsVillage: pdfData.tsVillage || pdfData.tsNoVillage || pdfData.tpVillage || pdfData.pdfDetails?.propertyLocation?.village || pdfData.pdfDetails?.tpVillage,
        tsNoVillage: pdfData.tsNoVillage || pdfData.tpVillage || pdfData.pdfDetails?.propertyLocation?.village || pdfData.pdfDetails?.tpVillage,
        wardTaluka: pdfData.wardTaluka || pdfData.pdfDetails?.propertyLocation?.ward || pdfData.pdfDetails?.wardTaluka,
        mandalDistrict: pdfData.mandalDistrict || pdfData.pdfDetails?.propertyLocation?.district || pdfData.pdfDetails?.mandalDistrict,
        postalAddress: extractAddressValue(pdfData.postalAddress) || extractAddressValue(pdfData.pdfDetails?.propertyLocation?.postalAddress) || extractAddressValue(pdfData.pdfDetails?.postalAddress),
        layoutIssueDate: pdfData.layoutIssueDate || pdfData.layoutPlanIssueDate || pdfData.pdfDetails?.layoutPlanIssueDate,
        approvedMapAuthority: pdfData.approvedMapAuthority || pdfData.pdfDetails?.approvedMapAuthority,
        mapVerified: pdfData.mapVerified || pdfData.authenticityVerified,
        valuersComments: pdfData.valuersComments || pdfData.valuerCommentOnAuthenticity,
        // Area Classification - Extract from nested pdfDetails.areaClassification
        cityTown: pdfData.cityTown || pdfData.pdfDetails?.areaClassification?.cityTown || pdfData.pdfDetails?.cityTown,
        residentialArea: pdfData.residentialArea || pdfData.pdfDetails?.areaClassification?.residentialArea,
        commercialArea: pdfData.commercialArea || pdfData.pdfDetails?.areaClassification?.commercialArea,
        industrialArea: pdfData.industrialArea || pdfData.pdfDetails?.areaClassification?.industrialArea,
        areaClassification: pdfData.areaClassification || pdfData.pdfDetails?.areaClassification?.areaClassification || pdfData.pdfDetails?.areaClassification,
        highMiddlePoor: pdfData.highMiddlePoor || pdfData.pdfDetails?.areaClassification?.highMiddlePoor,
        urbanSemiUrbanRural: pdfData.urbanSemiUrbanRural || pdfData.pdfDetails?.areaClassification?.urbanSemiUrbanRural,
        corporationLimitVillage: pdfData.corporationLimitVillage || pdfData.pdfDetails?.areaClassification?.corporationLimitVillage,
        governmentEnactments: pdfData.governmentEnactments || pdfData.pdfDetails?.areaClassification?.governmentEnactments,
        agriculturalLandConversion: pdfData.agriculturalLandConversion || pdfData.pdfDetails?.areaClassification?.agriculturalLandConversion,
        urbanType: pdfData.urbanType || pdfData.urbanClassification || pdfData.pdfDetails?.urbanClassification,
        jurisdictionType: pdfData.jurisdictionType || pdfData.governmentType || pdfData.pdfDetails?.governmentType,
        enactmentCovered: pdfData.enactmentCovered || pdfData.govtEnactmentsCovered || pdfData.pdfDetails?.govtEnactmentsCovered,

        // Boundaries (Deed and Visit/Actual from pdfDetails.boundaryDetails)
        boundaryNorthDeed: pdfData.boundaryNorthDeed || pdfData.boundariesPlotNorthDeed || pdfData.pdfDetails?.boundaryDetails?.north?.deed || pdfData.pdfDetails?.boundariesPlotNorthDeed,
        boundaryNorthVisit: pdfData.boundaryNorthVisit || pdfData.boundariesPlotNorthActual || pdfData.pdfDetails?.boundaryDetails?.north?.visit || pdfData.pdfDetails?.boundariesPlotNorthActual,
        boundaryEastDeed: pdfData.boundaryEastDeed || pdfData.boundariesPlotEastDeed || pdfData.pdfDetails?.boundaryDetails?.east?.deed || pdfData.pdfDetails?.boundariesPlotEastDeed,
        boundaryEastVisit: pdfData.boundaryEastVisit || pdfData.boundariesPlotEastActual || pdfData.pdfDetails?.boundaryDetails?.east?.visit || pdfData.pdfDetails?.boundariesPlotEastActual,
        boundarySouthDeed: pdfData.boundarySouthDeed || pdfData.boundariesPlotSouthDeed || pdfData.pdfDetails?.boundaryDetails?.south?.deed || pdfData.pdfDetails?.boundariesPlotSouthDeed,
        boundarySouthVisit: pdfData.boundarySouthVisit || pdfData.boundariesPlotSouthActual || pdfData.pdfDetails?.boundaryDetails?.south?.visit || pdfData.pdfDetails?.boundariesPlotSouthActual,
        boundaryWestDeed: pdfData.boundaryWestDeed || pdfData.boundariesPlotWestDeed || pdfData.pdfDetails?.boundaryDetails?.west?.deed || pdfData.pdfDetails?.boundariesPlotWestDeed,
        boundaryWestVisit: pdfData.boundaryWestVisit || pdfData.boundariesPlotWestActual || pdfData.pdfDetails?.boundaryDetails?.west?.visit || pdfData.pdfDetails?.boundariesPlotWestActual,

        // Legacy boundary fields for backward compatibility
        boundariesPlotNorthDeed: pdfData.boundariesPlotNorthDeed || pdfData.pdfDetails?.boundariesPlotNorthDeed,
        boundariesPlotNorthActual: pdfData.boundariesPlotNorthActual || pdfData.pdfDetails?.boundariesPlotNorthActual,
        boundariesPlotSouthDeed: pdfData.boundariesPlotSouthDeed || pdfData.pdfDetails?.boundariesPlotSouthDeed,
        boundariesPlotSouthActual: pdfData.boundariesPlotSouthActual || pdfData.pdfDetails?.boundariesPlotSouthActual,
        boundariesPlotEastDeed: pdfData.boundariesPlotEastDeed || pdfData.pdfDetails?.boundariesPlotEastDeed,
        boundariesPlotEastActual: pdfData.boundariesPlotEastActual || pdfData.pdfDetails?.boundariesPlotEastActual,
        boundariesPlotWestDeed: pdfData.boundariesPlotWestDeed || pdfData.pdfDetails?.boundariesPlotWestDeed,
        boundariesPlotWestActual: pdfData.boundariesPlotWestActual || pdfData.pdfDetails?.boundariesPlotWestActual,
        boundariesShopNorthDeed: pdfData.boundariesShopNorthDeed || pdfData.pdfDetails?.boundariesShopNorthDeed,
        boundariesShopNorthActual: pdfData.boundariesShopNorthActual || pdfData.pdfDetails?.boundariesShopNorthActual,
        boundariesShopSouthDeed: pdfData.boundariesShopSouthDeed || pdfData.pdfDetails?.boundariesShopSouthDeed,
        boundariesShopSouthActual: pdfData.boundariesShopSouthActual || pdfData.pdfDetails?.boundariesShopSouthActual,
        boundariesShopEastDeed: pdfData.boundariesShopEastDeed || pdfData.pdfDetails?.boundariesShopEastDeed,
        boundariesShopEastActual: pdfData.boundariesShopEastActual || pdfData.pdfDetails?.boundariesShopEastActual,
        boundariesShopWestDeed: pdfData.boundariesShopWestDeed || pdfData.pdfDetails?.boundariesShopWestDeed,
        boundariesShopWestActual: pdfData.boundariesShopWestActual || pdfData.pdfDetails?.boundariesShopWestActual,
        // Legacy boundary fields
        boundariesPlotNorth: pdfData.boundariesPlotNorth,
        boundariesPlotSouth: pdfData.boundariesPlotSouth,
        boundariesPlotEast: pdfData.boundariesPlotEast,
        boundariesPlotWest: pdfData.boundariesPlotWest,
        boundariesShopNorth: pdfData.boundariesShopNorth,
        boundariesShopSouth: pdfData.boundariesShopSouth,
        boundariesShopEast: pdfData.boundariesShopEast,
        boundariesShopWest: pdfData.boundariesShopWest,

        // Dimensions (Deed and Actual from pdfDetails.dimensions)
        dimensionNorthDeed: pdfData.dimensionNorthDeed || pdfData.pdfDetails?.dimensions?.north?.deed,
        dimensionNorthActual: pdfData.dimensionNorthActual || pdfData.pdfDetails?.dimensions?.north?.actual,
        dimensionEastDeed: pdfData.dimensionEastDeed || pdfData.pdfDetails?.dimensions?.east?.deed,
        dimensionEastActual: pdfData.dimensionEastActual || pdfData.pdfDetails?.dimensions?.east?.actual,
        dimensionSouthDeed: pdfData.dimensionSouthDeed || pdfData.pdfDetails?.dimensions?.south?.deed,
        dimensionSouthActual: pdfData.dimensionSouthActual || pdfData.pdfDetails?.dimensions?.south?.actual,
        dimensionWestDeed: pdfData.dimensionWestDeed || pdfData.pdfDetails?.dimensions?.west?.deed,
        dimensionWestActual: pdfData.dimensionWestActual || pdfData.pdfDetails?.dimensions?.west?.actual,
        // Legacy dimension fields
        dimensionsDeed: pdfData.dimensionsDeed,
        dimensionsActual: pdfData.dimensionsActual,
        extentUnit: pdfData.extentUnit || pdfData.extent || pdfData.extentOfUnit,
        coordinates: pdfData.coordinates,
        latitudeLongitude: pdfData.latitudeLongitude,
        extentSiteValuation: pdfData.extentSiteValuation || pdfData.extentOfSiteValuation,
        floorSpaceIndex: pdfData.floorSpaceIndex,

        // Apartment Building
        apartmentNature: pdfData.apartmentNature,
        apartmentLocation: pdfData.apartmentLocation,
        newRowData: pdfData.newRowData || pdfData.newFieldName,
        apartmentCTSNo: pdfData.apartmentCTSNo || pdfData.ctsNo || pdfData.cTSNo,
        apartmentTSNo: pdfData.apartmentTSNo || pdfData.tsNo || pdfData.apartmentLocation?.tsNo || pdfData.apartmentCTSNo,
        apartmentBlockNo: pdfData.apartmentBlockNo || pdfData.blockNo,
        apartmentWardNo: pdfData.apartmentWardNo || pdfData.wardNo,
        apartmentMunicipality: pdfData.apartmentMunicipality || pdfData.apartmentVillageMunicipalityCounty || pdfData.villageOrMunicipality,
        apartmentDoorNoStreetRoad: pdfData.apartmentDoorNoStreetRoad || pdfData.apartmentDoorNoPin || pdfData.apartmentDoorNoStreetRoadPinCode || pdfData.doorNoStreetRoadPinCode || pdfData.doorNo || pdfData.streetRoad,
        apartmentPinCode: pdfData.apartmentPinCode || pdfData.pinCode,
        localityDescription: pdfData.localityDescription || pdfData.descriptionOfLocalityResidentialCommercialMixed,
        yearConstruction: pdfData.yearConstruction || pdfData.yearOfConstruction,
        numberOfFloors: pdfData.numberOfFloors,
        structureType: pdfData.structureType || pdfData.typeOfStructure,

        // Building Valuation Details (Part B) - from buildingDetails schema
        typeOfBuilding: pdfData.typeOfBuilding || pdfData.pdfDetails?.buildingDetails?.typeOfBuilding || pdfData.buildingType,
        typeOfConstruction: pdfData.typeOfConstruction || pdfData.pdfDetails?.buildingDetails?.typeOfConstruction || pdfData.constructionType,
        yearOfConstruction: pdfData.yearOfConstruction || pdfData.pdfDetails?.buildingDetails?.yearOfConstruction || pdfData.constructionYear,
        numberOfFloorsHeight: pdfData.numberOfFloorsHeight || pdfData.pdfDetails?.buildingDetails?.numberOfFloorsHeight || pdfData.floorsHeight,
        plinthAreaFloorWise: pdfData.plinthAreaFloorWise || pdfData.pdfDetails?.buildingDetails?.plinthAreaFloorWise || pdfData.plinthArea,
        conditionOfBuildingExterior: pdfData.conditionOfBuildingExterior || pdfData.pdfDetails?.buildingDetails?.condition?.exterior || pdfData.conditionExterior,
        conditionOfBuildingInterior: pdfData.conditionOfBuildingInterior || pdfData.pdfDetails?.buildingDetails?.condition?.interior || pdfData.conditionInterior,
        approvedMapDateValidity: pdfData.approvedMapDateValidity || pdfData.pdfDetails?.buildingDetails?.approvedMap?.dateValidity || pdfData.approvedMapDate,
        approvedMapIssuingAuthority: pdfData.approvedMapAuthority || pdfData.approvedMapIssuingAuthority || pdfData.pdfDetails?.buildingDetails?.approvedMap?.issuingAuthority || pdfData.mapAuthority,
        genuinessVerified: pdfData.genuinessVerified || pdfData.pdfDetails?.buildingDetails?.approvedMap?.genuinessVerified || pdfData.mapGenuine,
        otherCommentsOnApprovedPlan: pdfData.otherCommentsOnApprovedPlan || pdfData.pdfDetails?.buildingDetails?.otherCommentsOnApprovedPlan || pdfData.approvedPlanComments,
        numberOfDwellingUnits: pdfData.numberOfDwellingUnits || pdfData.dwellingUnits || pdfData.numberOfDwellingUnitsInBuilding,
        qualityConstruction: pdfData.qualityConstruction || pdfData.qualityOfConstruction,
        buildingAppearance: pdfData.buildingAppearance || pdfData.appearanceOfBuilding,
        buildingMaintenance: pdfData.buildingMaintenance || pdfData.maintenanceOfBuilding,
        unitMaintenance: pdfData.unitMaintenance || pdfData.unitMaintenanceStatus || pdfData.pdfDetails?.unitMaintenance || data?.unitMaintenance?.unitMaintenanceStatus,
        unitClassification: pdfData.unitClassification || pdfData.pdfDetails?.unitClassification || pdfData.pdfDetails?.classificationPosh || data?.unitClassification?.unitClassification || data?.pdfDetails?.unitClassification,
        residentialOrCommercial: pdfData.residentialOrCommercial || pdfData.classificationUsage || pdfData.pdfDetails?.classificationUsage,
        ownerOccupiedOrLetOut: (() => {
            // Comprehensive check for owner occupancy status field
            const result = pdfData.ownerOccupiedOrLetOut ||
                pdfData.ownerOccupancyStatus ||
                data?.ownerOccupancyStatus ||
                pdfData.classificationOwnership ||
                pdfData.pdfDetails?.ownerOccupiedOrLetOut ||
                pdfData.pdfDetails?.ownerOccupancyStatus ||
                pdfData.pdfDetails?.classificationOwnership ||
                data?.pdfDetails?.ownerOccupancyStatus ||
                data?.unitClassification?.ownerOccupiedOrLetOut;

            return result;
        })(),
        facilityLift: pdfData.facilityLift || pdfData.liftAvailable || pdfData.pdfDetails?.liftAvailable,
        facilityWater: pdfData.facilityWater || pdfData.protectedWaterSupply || pdfData.pdfDetails?.protectedWaterSupply,
        facilitySump: pdfData.facilitySump || pdfData.undergroundSewerage || pdfData.pdfDetails?.undergroundSewerage,
        facilityParking: pdfData.facilityParking || pdfData.carParkingType || pdfData.carParkingOpenCovered || pdfData.pdfDetails?.carParkingOpenCovered,
        facilityCompoundWall: pdfData.facilityCompoundWall || pdfData.compoundWall || pdfData.compoundWallExisting || pdfData.isCompoundWallExisting || pdfData.pdfDetails?.isCompoundWallExisting,
        facilityPavement: pdfData.facilityPavement || pdfData.pavement || pdfData.pavementAroundBuilding || pdfData.isPavementLaidAroundBuilding || pdfData.pdfDetails?.isPavementLaidAroundBuilding,
        facilityOthers: pdfData.facilityOthers || pdfData.othersFacility || pdfData.pdfDetails?.othersFacility,
        compoundWall: pdfData.compoundWall || pdfData.compoundWallExisting || pdfData.isCompoundWallExisting,
        pavement: pdfData.pavement || pdfData.pavementAroundBuilding || pdfData.isPavementLaidAroundBuilding,

        // Unit (with multiple name variants)
        floorUnit: pdfData.floorUnit || pdfData.floorLocation || pdfData.unitFloor || pdfData.pdfDetails?.unitFloor,
        doorNoUnit: pdfData.doorNoUnit || pdfData.unitDoorNo || pdfData.pdfDetails?.unitDoorNo,
        roofUnit: pdfData.roofUnit || pdfData.roof || pdfData.unitRoof || pdfData.pdfDetails?.unitRoof,
        flooringUnit: pdfData.flooringUnit || pdfData.flooring || pdfData.unitFlooring || pdfData.pdfDetails?.unitFlooring,
        doorsUnit: pdfData.doorsUnit || pdfData.doors || pdfData.unitDoors || pdfData.pdfDetails?.unitDoors,
        windowsUnit: pdfData.windowsUnit || pdfData.windows || pdfData.unitWindows || pdfData.pdfDetails?.unitWindows,
        unitBathAndWC: pdfData.unitBathAndWC || pdfData.bathAndWC || pdfData.pdfDetails?.unitBathAndWC,
        unitElectricalWiring: pdfData.unitElectricalWiring || pdfData.electricalWiring || pdfData.pdfDetails?.unitElectricalWiring,
        unitSpecification: pdfData.unitSpecification || pdfData.specification || pdfData.pdfDetails?.unitSpecification,
        fittingsUnit: pdfData.fittingsUnit || pdfData.fittings || pdfData.unitFittings || pdfData.pdfDetails?.unitFittings,
        finishingUnit: pdfData.finishingUnit || pdfData.finishing || pdfData.unitFinishing || pdfData.pdfDetails?.unitFinishing,
        electricityConnectionNo: pdfData.electricityConnectionNo || pdfData.electricityServiceNo || pdfData.electricityServiceConnectionNo || pdfData.pdfDetails?.electricityServiceNo || pdfData.pdfDetails?.electricityServiceConnectionNo,
        agreementForSale: pdfData.agreementForSale || pdfData.agreementSaleExecutedName || pdfData.pdfDetails?.agreementSaleExecutedName,
        undividedLandArea: pdfData.undividedLandArea || pdfData.undividedAreaLand || pdfData.undividedArea || pdfData.pdfDetails?.undividedAreaLand,
        assessmentNo: pdfData.assessmentNo || pdfData.pdfDetails?.assessmentNo || data?.unitTax?.assessmentNo,
        taxPaidName: pdfData.taxPaidName || pdfData.pdfDetails?.taxPaidName || data?.unitTax?.taxPaidName,
        taxAmount: pdfData.taxAmount || pdfData.pdfDetails?.taxAmount || data?.unitTax?.taxAmount,
        meterCardName: pdfData.meterCardName || pdfData.pdfDetails?.meterCardName || pdfData.electricityServiceConnectionNo,

        // Valuation values - Extract from nested pdfDetails.valuationSummary
        carpetArea: pdfData.carpetArea || pdfData.carpetAreaFlat || pdfData.areaUsage || pdfData.pdfDetails?.carpetAreaFlat || pdfData.pdfDetails?.areaUsage,
        areaUsage: pdfData.areaUsage || pdfData.pdfDetails?.areaUsage,
        plinthArea: pdfData.plinthArea || pdfData.pdfDetails?.plinthArea,
        undividedLandArea: pdfData.undividedLandArea || pdfData.undividedLandAreaSaleDeed || pdfData.undividedAreaLand || pdfData.pdfDetails?.undividedAreaLand,
        ratePerSqft: pdfData.ratePerSqft || pdfData.presentValueRate || pdfData.adoptedBasicCompositeRate || pdfData.pdfDetails?.presentValueRate || pdfData.pdfDetails?.adoptedBasicCompositeRate,
        fairMarketValue: pdfData.fairMarketValue || pdfData.marketValue || pdfData.pdfDetails?.valuationSummary?.presentMarketValue?.amount || pdfData.pdfDetails?.valuationSummary?.fairMarketValue?.amount || pdfData.pdfDetails?.fairMarketValue,
        marketValue: pdfData.marketValue || pdfData.fairMarketValue || pdfData.pdfDetails?.valuationSummary?.presentMarketValue?.amount || pdfData.pdfDetails?.fairMarketValue,
        fairMarketValueWords: pdfData.fairMarketValueWords || pdfData.pdfDetails?.valuationSummary?.presentMarketValue?.words || pdfData.pdfDetails?.valuationSummary?.fairMarketValue?.words || pdfData.pdfDetails?.fairMarketValueWords || pdfData.marketValueWords,
        marketValueWords: pdfData.marketValueWords || pdfData.fairMarketValueWords || pdfData.pdfDetails?.valuationSummary?.presentMarketValue?.words || pdfData.pdfDetails?.fairMarketValueWords,
        realisableValue: pdfData.realisableValue || pdfData.realizableValue || pdfData.pdfDetails?.valuationSummary?.realisableValue?.amount || pdfData.pdfDetails?.realizableValue,
        realisableValueWords: pdfData.realisableValueWords || pdfData.pdfDetails?.valuationSummary?.realisableValue?.words || pdfData.pdfDetails?.realisableValueWords,
        distressValue: pdfData.distressValue || pdfData.pdfDetails?.valuationSummary?.distressValue?.amount || pdfData.pdfDetails?.distressValue,
        distressValueWords: pdfData.distressValueWords || pdfData.pdfDetails?.valuationSummary?.distressValue?.words || pdfData.pdfDetails?.distressValueWords,
        saleDeedValue: pdfData.saleDeedValue || pdfData.pdfDetails?.saleDeedValue,
        finalMarketValue: pdfData.finalMarketValue || pdfData.fairMarketValue || pdfData.pdfDetails?.valuationSummary?.presentMarketValue?.amount || pdfData.pdfDetails?.fairMarketValue,
        finalMarketValueWords: pdfData.finalMarketValueWords || pdfData.fairMarketValueWords || pdfData.pdfDetails?.valuationSummary?.presentMarketValue?.words || pdfData.pdfDetails?.fairMarketValueWords,
        finalDistressValue: pdfData.finalDistressValue || pdfData.distressValue || pdfData.pdfDetails?.valuationSummary?.distressValue?.amount || pdfData.pdfDetails?.distressValue,
        finalDistressValueWords: pdfData.finalDistressValueWords || pdfData.distressValueWords || pdfData.pdfDetails?.valuationSummary?.distressValue?.words || pdfData.pdfDetails?.distressValueWords,
        readyReckonerValue: pdfData.readyReckonerValue || pdfData.totalJantriValue || pdfData.pdfDetails?.valuationSummary?.jantriValue?.amount || pdfData.pdfDetails?.readyReckonerValue || pdfData.pdfDetails?.totalJantriValue,
        readyReckonerValueWords: pdfData.readyReckonerValueWords || pdfData.totalJantriValue || pdfData.pdfDetails?.valuationSummary?.jantriValue?.words || pdfData.pdfDetails?.readyReckonerValueWords || pdfData.pdfDetails?.readyReckonerValue || pdfData.pdfDetails?.totalJantriValue,
        readyReckonerYear: pdfData.readyReckonerYear || pdfData.pdfDetails?.readyReckonerYear || new Date().getFullYear(),
        insurableValueWords: pdfData.insurableValueWords || pdfData.pdfDetails?.insurableValueWords,
        monthlyRent: pdfData.monthlyRent || pdfData.pdfDetails?.monthlyRent,
        ownerOccupancyStatus: pdfData.ownerOccupancyStatus || pdfData.pdfDetails?.ownerOccupancyStatus,
        rentReceivedPerMonth: pdfData.rentReceivedPerMonth || pdfData.pdfDetails?.rentReceivedPerMonth || pdfData.pdfDetails?.monthlyRent,
        marketability: pdfData.marketability || pdfData.pdfDetails?.marketability,
        marketabilityRating: pdfData.marketability || pdfData.pdfDetails?.marketability,
        favoringFactors: pdfData.favoringFactors || pdfData.pdfDetails?.favoringFactors,
        negativeFactors: pdfData.negativeFactors || pdfData.pdfDetails?.negativeFactors,
        compositeRateAnalysis: pdfData.comparableRate,
        newConstructionRate: pdfData.adoptedBasicCompositeRate,

        // Site Characteristics - Extract from nested pdfDetails.siteCharacteristics
        classificationLocality: pdfData.classificationLocality || pdfData.pdfDetails?.siteCharacteristics?.classificationOfLocality || pdfData.pdfDetails?.classificationLocality,
        developmentSurroundingAreas: pdfData.developmentSurroundingAreas || pdfData.pdfDetails?.siteCharacteristics?.developmentSurroundingArea || pdfData.pdfDetails?.developmentSurroundingAreas,
        floodingPossibility: pdfData.floodingPossibility || pdfData.pdfDetails?.siteCharacteristics?.frequentFloodingSubmerging || pdfData.pdfDetails?.floodingPossibility,
        civicAmenitiesFeasibility: pdfData.civicAmenitiesFeasibility || pdfData.pdfDetails?.siteCharacteristics?.feasibilityCivicAmenities || pdfData.pdfDetails?.civicAmenitiesFeasibility,
        landTopography: pdfData.landTopography || pdfData.pdfDetails?.siteCharacteristics?.levelOfLandTopographical || pdfData.pdfDetails?.landTopography,
        shapeOfLand: pdfData.shapeOfLand || pdfData.pdfDetails?.siteCharacteristics?.shapeOfLand || pdfData.pdfDetails?.shapeOfLand,
        typeOfUse: pdfData.typeOfUse || pdfData.pdfDetails?.siteCharacteristics?.typeOfUse || pdfData.pdfDetails?.typeOfUse,
        usageRestriction: pdfData.usageRestriction || pdfData.pdfDetails?.siteCharacteristics?.usageRestriction || pdfData.pdfDetails?.usageRestriction,
        townPlanningApproved: pdfData.townPlanningApproved || pdfData.pdfDetails?.siteCharacteristics?.townPlanningApprovedLayout || pdfData.pdfDetails?.townPlanningApproved,
        cornerPlotType: pdfData.cornerPlotType || pdfData.pdfDetails?.siteCharacteristics?.cornerPlotIntermittentPlot || pdfData.pdfDetails?.cornerPlotType,
        roadFacilities: pdfData.roadFacilities || pdfData.pdfDetails?.siteCharacteristics?.roadFacilities || pdfData.pdfDetails?.roadFacilities,
        typeOfRoad: pdfData.typeOfRoad || pdfData.pdfDetails?.siteCharacteristics?.typeOfRoadAvailable || pdfData.pdfDetails?.typeOfRoad,
        roadWidth: pdfData.roadWidth || pdfData.pdfDetails?.siteCharacteristics?.widthOfRoad || pdfData.pdfDetails?.roadWidth,
        lockedLand: pdfData.lockedLand || pdfData.pdfDetails?.siteCharacteristics?.lockedLand || pdfData.pdfDetails?.lockedLand,
        waterPotentiality: pdfData.waterPotentiality || pdfData.pdfDetails?.siteCharacteristics?.waterPotentiality || pdfData.pdfDetails?.waterPotentiality,
        undergroundSewerage: pdfData.undergroundSewerage || pdfData.pdfDetails?.siteCharacteristics?.undergroundSewerageSystem || pdfData.pdfDetails?.undergroundSewerage,
        powerSupply: pdfData.powerSupply || pdfData.pdfDetails?.siteCharacteristics?.powerSupplyAtSite || pdfData.pdfDetails?.powerSupply,
        siteAdvantage1: pdfData.siteAdvantage1 || pdfData.pdfDetails?.siteCharacteristics?.advantageOfSite1 || pdfData.pdfDetails?.siteAdvantage1,
        siteAdvantage2: pdfData.siteAdvantage2 || pdfData.pdfDetails?.siteCharacteristics?.advantageOfSite2 || pdfData.pdfDetails?.siteAdvantage2,
        specialRemarks1: pdfData.specialRemarks1 || pdfData.pdfDetails?.siteCharacteristics?.specialRemarks1 || pdfData.pdfDetails?.specialRemarks1,
        specialRemarks2: pdfData.specialRemarks2 || pdfData.pdfDetails?.siteCharacteristics?.specialRemarks2 || pdfData.pdfDetails?.specialRemarks2,

        // Extent - Extract from nested pdfDetails.extent
        extentOfSite: pdfData.extentOfSite || pdfData.pdfDetails?.extent?.extentOfSite || pdfData.pdfDetails?.extentOfSite,
        extentSiteValuation: pdfData.extentSiteValuation || pdfData.pdfDetails?.extent?.extentConsideredForValuation || pdfData.pdfDetails?.extentSiteValuation,

        // Occupation Status - Extract from nested pdfDetails.occupationStatus
        occupiedByOwnerTenant: pdfData.occupiedByOwnerTenant || pdfData.pdfDetails?.occupationStatus?.occupiedByOwnerTenant || pdfData.pdfDetails?.occupiedByOwnerTenant,
        tenancyDuration: pdfData.tenancyDuration || pdfData.pdfDetails?.occupationStatus?.tenancyDuration || pdfData.pdfDetails?.tenancyDuration,
        rentReceivedPerMonth: pdfData.rentReceivedPerMonth || pdfData.pdfDetails?.occupationStatus?.rentReceivedPerMonth || pdfData.pdfDetails?.rentReceivedPerMonth,

        // Land Valuation (Part A) - Extract from nested pdfDetails.landValuation
        sizeOfPlotNorthSouth: pdfData.sizeOfPlotNorthSouth || pdfData.pdfDetails?.landValuation?.sizeOfPlot?.northSouth || pdfData.pdfDetails?.sizeOfPlotNorthSouth,
        sizeOfPlotEastWest: pdfData.sizeOfPlotEastWest || pdfData.pdfDetails?.landValuation?.sizeOfPlot?.eastWest || pdfData.pdfDetails?.sizeOfPlotEastWest,
        plotArea: pdfData.plotArea || pdfData.pdfDetails?.landValuation?.sizeOfPlot?.total || pdfData.pdfDetails?.plotArea,
        approvedPlanArea: pdfData.approvedPlanArea || pdfData.pdfDetails?.landValuation?.sizeOfPlot?.total || pdfData.pdfDetails?.approvedPlanArea,
        totalPlotArea: pdfData.totalPlotArea || pdfData.pdfDetails?.landValuation?.sizeOfPlot?.total || pdfData.pdfDetails?.totalPlotArea,
        approvedPlanTotal: pdfData.approvedPlanTotal || pdfData.pdfDetails?.landValuation?.sizeOfPlot?.total || pdfData.pdfDetails?.approvedPlanTotal,
        prevailingRate: pdfData.prevailingRate || pdfData.pdfDetails?.landValuation?.marketRate?.prevailingRate || pdfData.pdfDetails?.prevailingRate,
        landBuildingAreaRateMethod: pdfData.landBuildingAreaRateMethod || pdfData.pdfDetails?.landValuation?.marketRate?.landBuildingAreaRateMethod || pdfData.pdfDetails?.landBuildingAreaRateMethod,
        landRate: pdfData.landRate || pdfData.pdfDetails?.landValuation?.marketRate?.landBuildingAreaRateMethod || pdfData.pdfDetails?.landRate,
        guidelineRateFromRegistrar: pdfData.guidelineRateFromRegistrar || pdfData.pdfDetails?.landValuation?.guidelineRate?.fromRegistrar || pdfData.pdfDetails?.guidelineRateFromRegistrar,
        guidelineRateAdopted: pdfData.guidelineRateAdopted || pdfData.pdfDetails?.landValuation?.guidelineRate?.adoptedRate || pdfData.pdfDetails?.guidelineRateAdopted,
        jantriRate: pdfData.jantriRate || pdfData.pdfDetails?.landValuation?.jantriRate?.rate || pdfData.pdfDetails?.jantriRate,
        jantriLandValue: pdfData.jantriLandValue || pdfData.pdfDetails?.landValuation?.jantriRate?.landValue || pdfData.pdfDetails?.jantriLandValue,
        jantriBuildingValue: pdfData.jantriBuildingValue || pdfData.pdfDetails?.landValuation?.jantriRate?.buildingValue || pdfData.pdfDetails?.jantriBuildingValue,
        jantriTotalValue: pdfData.jantriTotalValue || pdfData.pdfDetails?.landValuation?.jantriRate?.totalValue || pdfData.pdfDetails?.jantriTotalValue,
        estimatedValueOfLand: pdfData.estimatedValueOfLand || pdfData.pdfDetails?.landValuation?.estimatedValueOfLand || pdfData.pdfDetails?.estimatedValueOfLand,
        variationClause: pdfData.variationClause || pdfData.pdfDetails?.landValuation?.variationClause || pdfData.pdfDetails?.variationClause,

        // Construction Cost Analysis (Part B) - Extract from nested pdfDetails.constructionCostAnalysis
        areaSMT: pdfData.areaSMT || pdfData.pdfDetails?.constructionCostAnalysis?.total?.areaSMT || pdfData.pdfDetails?.areaSMT || pdfData.carpetArea || pdfData.plinthArea,
        areaSYD: pdfData.areaSYD || pdfData.pdfDetails?.constructionCostAnalysis?.total?.areaSYD || pdfData.pdfDetails?.areaSYD,
        totalValue: pdfData.totalValue || pdfData.pdfDetails?.constructionCostAnalysis?.total?.totalValue || pdfData.pdfDetails?.totalValue || pdfData.fairMarketValue,

        // Security Room
        securityRoomArea: pdfData.securityRoomArea || pdfData.pdfDetails?.constructionCostAnalysis?.securityRoom?.areaDetails || pdfData.pdfDetails?.securityRoomArea,
        securityRoomSMT: pdfData.securityRoomSMT || pdfData.pdfDetails?.constructionCostAnalysis?.securityRoom?.areaSMT || pdfData.pdfDetails?.securityRoomSMT,
        securityRoomSYD: pdfData.securityRoomSYD || pdfData.pdfDetails?.constructionCostAnalysis?.securityRoom?.areaSYD || pdfData.pdfDetails?.securityRoomSYD,
        securityRoomRate: pdfData.securityRoomRate || pdfData.pdfDetails?.constructionCostAnalysis?.securityRoom?.ratePerSYD || pdfData.pdfDetails?.securityRoomRate,
        securityRoomValue: pdfData.securityRoomValue || pdfData.pdfDetails?.constructionCostAnalysis?.securityRoom?.value || pdfData.pdfDetails?.securityRoomValue,

        // Labours Quarter
        laboursQuarterArea: pdfData.laboursQuarterArea || pdfData.pdfDetails?.constructionCostAnalysis?.laboursQuarter?.areaDetails || pdfData.pdfDetails?.laboursQuarterArea,
        laboursQuarterSMT: pdfData.laboursQuarterSMT || pdfData.pdfDetails?.constructionCostAnalysis?.laboursQuarter?.areaSMT || pdfData.pdfDetails?.laboursQuarterSMT,
        laboursQuarterSYD: pdfData.laboursQuarterSYD || pdfData.pdfDetails?.constructionCostAnalysis?.laboursQuarter?.areaSYD || pdfData.pdfDetails?.laboursQuarterSYD,
        laboursQuarterRate: pdfData.laboursQuarterRate || pdfData.pdfDetails?.constructionCostAnalysis?.laboursQuarter?.ratePerSYD || pdfData.pdfDetails?.laboursQuarterRate,
        laboursQuarterValue: pdfData.laboursQuarterValue || pdfData.pdfDetails?.constructionCostAnalysis?.laboursQuarter?.value || pdfData.pdfDetails?.laboursQuarterValue,

        // Store Room
        storeRoomArea: pdfData.storeRoomArea || pdfData.pdfDetails?.constructionCostAnalysis?.storeRoom?.areaDetails || pdfData.pdfDetails?.storeRoomArea,
        storeRoomSMT: pdfData.storeRoomSMT || pdfData.pdfDetails?.constructionCostAnalysis?.storeRoom?.areaSMT || pdfData.pdfDetails?.storeRoomSMT,
        storeRoomSYD: pdfData.storeRoomSYD || pdfData.pdfDetails?.constructionCostAnalysis?.storeRoom?.areaSYD || pdfData.pdfDetails?.storeRoomSYD,
        storeRoomRate: pdfData.storeRoomRate || pdfData.pdfDetails?.constructionCostAnalysis?.storeRoom?.ratePerSYD || pdfData.pdfDetails?.storeRoomRate,
        storeRoomValue: pdfData.storeRoomValue || pdfData.pdfDetails?.constructionCostAnalysis?.storeRoom?.value || pdfData.pdfDetails?.storeRoomValue,

        // Gallery Room
        galleryRoomArea: pdfData.galleryRoomArea || pdfData.pdfDetails?.constructionCostAnalysis?.galleryRoom?.areaDetails || pdfData.pdfDetails?.galleryRoomArea,
        galleryRoomSMT: pdfData.galleryRoomSMT || pdfData.pdfDetails?.constructionCostAnalysis?.galleryRoom?.areaSMT || pdfData.pdfDetails?.galleryRoomSMT,
        galleryRoomSYD: pdfData.galleryRoomSYD || pdfData.pdfDetails?.constructionCostAnalysis?.galleryRoom?.areaSYD || pdfData.pdfDetails?.galleryRoomSYD,
        galleryRoomRate: pdfData.galleryRoomRate || pdfData.pdfDetails?.constructionCostAnalysis?.galleryRoom?.ratePerSYD || pdfData.pdfDetails?.galleryRoomRate,
        galleryRoomValue: pdfData.galleryRoomValue || pdfData.pdfDetails?.constructionCostAnalysis?.galleryRoom?.value || pdfData.pdfDetails?.galleryRoomValue,

        // FF Labours Quarter
        ffLaboursQuarterArea: pdfData.ffLaboursQuarterArea || pdfData.pdfDetails?.constructionCostAnalysis?.ffLaboursQuarter?.areaDetails || pdfData.pdfDetails?.ffLaboursQuarterArea,
        ffLaboursQuarterSMT: pdfData.ffLaboursQuarterSMT || pdfData.pdfDetails?.constructionCostAnalysis?.ffLaboursQuarter?.areaSMT || pdfData.pdfDetails?.ffLaboursQuarterSMT,
        ffLaboursQuarterSYD: pdfData.ffLaboursQuarterSYD || pdfData.pdfDetails?.constructionCostAnalysis?.ffLaboursQuarter?.areaSYD || pdfData.pdfDetails?.ffLaboursQuarterSYD,
        ffLaboursQuarterRate: pdfData.ffLaboursQuarterRate || pdfData.pdfDetails?.constructionCostAnalysis?.ffLaboursQuarter?.ratePerSYD || pdfData.pdfDetails?.ffLaboursQuarterRate,
        ffLaboursQuarterValue: pdfData.ffLaboursQuarterValue || pdfData.pdfDetails?.constructionCostAnalysis?.ffLaboursQuarter?.value || pdfData.pdfDetails?.ffLaboursQuarterValue,

        // Checklist of Documents - Extract from nested pdfDetails.checklistOfDocuments
        engagementLetterConfirmation: pdfData.engagementLetterConfirmation || pdfData.pdfDetails?.checklistOfDocuments?.engagementLetterConfirmation,
        ownershipDocumentsSaleDeed: pdfData.ownershipDocumentsSaleDeed || pdfData.pdfDetails?.checklistOfDocuments?.ownershipDocumentsSaleDeed,
        advTcrLsr: pdfData.advTcrLsr || pdfData.pdfDetails?.checklistOfDocuments?.advTcrLsr,
        agreementForSaleBanaKhat: pdfData.agreementForSaleBanaKhat || pdfData.pdfDetails?.checklistOfDocuments?.agreementForSaleBanaKhat,
        propertyCard: pdfData.propertyCard || pdfData.pdfDetails?.checklistOfDocuments?.propertyCard,
        mortgageDeed: pdfData.mortgageDeed || pdfData.pdfDetails?.checklistOfDocuments?.mortgageDeed,
        leaseDeed: pdfData.leaseDeed || pdfData.pdfDetails?.checklistOfDocuments?.leaseDeed,
        index2: pdfData.index2 || pdfData.pdfDetails?.checklistOfDocuments?.index2,
        vf712InCaseOfLand: pdfData.vf712InCaseOfLand || pdfData.pdfDetails?.checklistOfDocuments?.vf712InCaseOfLand,
        naOrder: pdfData.naOrder || pdfData.pdfDetails?.checklistOfDocuments?.naOrder,
        approvedLayoutPlan: pdfData.approvedLayoutPlan || pdfData.pdfDetails?.checklistOfDocuments?.approvedLayoutPlan,
        commencementLetter: pdfData.commencementLetter || pdfData.pdfDetails?.checklistOfDocuments?.commencementLetter,
        buPermission: pdfData.buPermission || pdfData.pdfDetails?.checklistOfDocuments?.buPermission,
        eleMeterPhoto: pdfData.eleMeterPhoto || pdfData.pdfDetails?.checklistOfDocuments?.eleMeterPhoto,
        lightBill: pdfData.lightBill || pdfData.pdfDetails?.checklistOfDocuments?.lightBill,
        muniTaxBill: pdfData.muniTaxBill || pdfData.pdfDetails?.checklistOfDocuments?.muniTaxBill,
        numberingFlatBungalowPlotNo: pdfData.numberingFlatBungalowPlotNo || pdfData.pdfDetails?.checklistOfDocuments?.numberingFlatBungalowPlotNo,
        boundariesOfPropertyProperDemarcation: pdfData.boundariesOfPropertyProperDemarcation || pdfData.pdfDetails?.checklistOfDocuments?.boundariesOfPropertyProperDemarcation,
        mergedProperty: pdfData.mergedProperty || pdfData.pdfDetails?.checklistOfDocuments?.mergedProperty,
        premiseCanBeSeparatedEntranceDoor: pdfData.premiseCanBeSeparatedEntranceDoor || pdfData.pdfDetails?.checklistOfDocuments?.premiseCanBeSeparatedEntranceDoor,
        landIsLocked: pdfData.landIsLocked || pdfData.pdfDetails?.checklistOfDocuments?.landIsLocked,
        propertyIsRentedToOtherParty: pdfData.propertyIsRentedToOtherParty || pdfData.pdfDetails?.checklistOfDocuments?.propertyIsRentedToOtherParty,
        ifRentedRentAgreementIsProvided: pdfData.ifRentedRentAgreementIsProvided || pdfData.pdfDetails?.checklistOfDocuments?.ifRentedRentAgreementIsProvided,
        siteVisitPhotos: pdfData.siteVisitPhotos || pdfData.pdfDetails?.checklistOfDocuments?.siteVisitPhotos,
        selfieWithOwnerIdentifier: pdfData.selfieWithOwnerIdentifier || pdfData.pdfDetails?.checklistOfDocuments?.selfieWithOwnerIdentifier,
        mobileNoChecklist: pdfData.mobileNoChecklist || pdfData.pdfDetails?.checklistOfDocuments?.mobileNo,
        dataSheet: pdfData.dataSheet || pdfData.pdfDetails?.checklistOfDocuments?.dataSheet,
        tentativeRate: pdfData.tentativeRate || pdfData.pdfDetails?.checklistOfDocuments?.tentativeRate,
        saleInstanceLocalInquiryVerbalSurvey: pdfData.saleInstanceLocalInquiryVerbalSurvey || pdfData.pdfDetails?.checklistOfDocuments?.saleInstanceLocalInquiryVerbalSurvey,
        brokerRecording: pdfData.brokerRecording || pdfData.pdfDetails?.checklistOfDocuments?.brokerRecording,
        pastValuationRate: pdfData.pastValuationRate || pdfData.pdfDetails?.checklistOfDocuments?.pastValuationRate,

        // GF Room
        gfRoomArea: pdfData.gfRoomArea || pdfData.pdfDetails?.constructionCostAnalysis?.gfRoom?.areaDetails || pdfData.pdfDetails?.gfRoomArea,
        gfRoomSMT: pdfData.gfRoomSMT || pdfData.pdfDetails?.constructionCostAnalysis?.gfRoom?.areaSMT || pdfData.pdfDetails?.gfRoomSMT,
        gfRoomSYD: pdfData.gfRoomSYD || pdfData.pdfDetails?.constructionCostAnalysis?.gfRoom?.areaSYD || pdfData.pdfDetails?.gfRoomSYD,
        gfRoomRate: pdfData.gfRoomRate || pdfData.pdfDetails?.constructionCostAnalysis?.gfRoom?.ratePerSYD || pdfData.pdfDetails?.gfRoomRate,
        gfRoomValue: pdfData.gfRoomValue || pdfData.pdfDetails?.constructionCostAnalysis?.gfRoom?.value || pdfData.pdfDetails?.gfRoomValue,

        // GF Wash Room
        gfWashRoomArea: pdfData.gfWashRoomArea || pdfData.pdfDetails?.constructionCostAnalysis?.gfWashRoom?.areaDetails || pdfData.pdfDetails?.gfWashRoomArea,
        gfWashRoomSMT: pdfData.gfWashRoomSMT || pdfData.pdfDetails?.constructionCostAnalysis?.gfWashRoom?.areaSMT || pdfData.pdfDetails?.gfWashRoomSMT,
        gfWashRoomSYD: pdfData.gfWashRoomSYD || pdfData.pdfDetails?.constructionCostAnalysis?.gfWashRoom?.areaSYD || pdfData.pdfDetails?.gfWashRoomSYD,
        gfWashRoomRate: pdfData.gfWashRoomRate || pdfData.pdfDetails?.constructionCostAnalysis?.gfWashRoom?.ratePerSYD || pdfData.pdfDetails?.gfWashRoomRate,
        gfWashRoomValue: pdfData.gfWashRoomValue || pdfData.pdfDetails?.constructionCostAnalysis?.gfWashRoom?.value || pdfData.pdfDetails?.gfWashRoomValue,

        // Office 1
        office1Area: pdfData.office1Area || pdfData.pdfDetails?.constructionCostAnalysis?.office1?.areaDetails || pdfData.pdfDetails?.office1Area,
        office1SMT: pdfData.office1SMT || pdfData.pdfDetails?.constructionCostAnalysis?.office1?.areaSMT || pdfData.pdfDetails?.office1SMT,
        office1SYD: pdfData.office1SYD || pdfData.pdfDetails?.constructionCostAnalysis?.office1?.areaSYD || pdfData.pdfDetails?.office1SYD,
        office1Rate: pdfData.office1Rate || pdfData.pdfDetails?.constructionCostAnalysis?.office1?.ratePerSYD || pdfData.pdfDetails?.office1Rate,
        office1Value: pdfData.office1Value || pdfData.pdfDetails?.constructionCostAnalysis?.office1?.value || pdfData.pdfDetails?.office1Value,

        // Wash Room
        washRoomArea: pdfData.washRoomArea || pdfData.pdfDetails?.constructionCostAnalysis?.washRoom?.areaDetails || pdfData.pdfDetails?.washRoomArea,
        washRoomSMT: pdfData.washRoomSMT || pdfData.pdfDetails?.constructionCostAnalysis?.washRoom?.areaSMT || pdfData.pdfDetails?.washRoomSMT,
        washRoomSYD: pdfData.washRoomSYD || pdfData.pdfDetails?.constructionCostAnalysis?.washRoom?.areaSYD || pdfData.pdfDetails?.washRoomSYD,
        washRoomRate: pdfData.washRoomRate || pdfData.pdfDetails?.constructionCostAnalysis?.washRoom?.ratePerSYD || pdfData.pdfDetails?.washRoomRate,
        washRoomValue: pdfData.washRoomValue || pdfData.pdfDetails?.constructionCostAnalysis?.washRoom?.value || pdfData.pdfDetails?.washRoomValue,

        // Shed
        shedArea: pdfData.shedArea || pdfData.pdfDetails?.constructionCostAnalysis?.shed?.areaDetails || pdfData.pdfDetails?.shedArea,
        shedSMT: pdfData.shedSMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed?.areaSMT || pdfData.pdfDetails?.shedSMT,
        shedSYD: pdfData.shedSYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed?.areaSYD || pdfData.pdfDetails?.shedSYD,
        shedRate: pdfData.shedRate || pdfData.pdfDetails?.constructionCostAnalysis?.shed?.ratePerSYD || pdfData.pdfDetails?.shedRate,
        shedValue: pdfData.shedValue || pdfData.pdfDetails?.constructionCostAnalysis?.shed?.value || pdfData.pdfDetails?.shedValue,

        // Office 2
        office2Area: pdfData.office2Area || pdfData.pdfDetails?.constructionCostAnalysis?.office2?.areaDetails || pdfData.pdfDetails?.office2Area,
        office2SMT: pdfData.office2SMT || pdfData.pdfDetails?.constructionCostAnalysis?.office2?.areaSMT || pdfData.pdfDetails?.office2SMT,
        office2SYD: pdfData.office2SYD || pdfData.pdfDetails?.constructionCostAnalysis?.office2?.areaSYD || pdfData.pdfDetails?.office2SYD,
        office2Rate: pdfData.office2Rate || pdfData.pdfDetails?.constructionCostAnalysis?.office2?.ratePerSYD || pdfData.pdfDetails?.office2Rate,
        office2Value: pdfData.office2Value || pdfData.pdfDetails?.constructionCostAnalysis?.office2?.value || pdfData.pdfDetails?.office2Value,

        // Shed 1
        shed1Area: pdfData.shed1Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed1?.areaDetails || pdfData.pdfDetails?.shed1Area,
        shed1SMT: pdfData.shed1SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed1?.areaSMT || pdfData.pdfDetails?.shed1SMT,
        shed1SYD: pdfData.shed1SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed1?.areaSYD || pdfData.pdfDetails?.shed1SYD,
        shed1Rate: pdfData.shed1Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed1?.ratePerSYD || pdfData.pdfDetails?.shed1Rate,
        shed1Value: pdfData.shed1Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed1?.value || pdfData.pdfDetails?.shed1Value,

        // Shed 2 Unit 1
        shed2Unit1Area: pdfData.shed2Unit1Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit1?.areaDetails || pdfData.pdfDetails?.shed2Unit1Area,
        shed2Unit1SMT: pdfData.shed2Unit1SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit1?.areaSMT || pdfData.pdfDetails?.shed2Unit1SMT,
        shed2Unit1SYD: pdfData.shed2Unit1SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit1?.areaSYD || pdfData.pdfDetails?.shed2Unit1SYD,
        shed2Unit1Rate: pdfData.shed2Unit1Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit1?.ratePerSYD || pdfData.pdfDetails?.shed2Unit1Rate,
        shed2Unit1Value: pdfData.shed2Unit1Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit1?.value || pdfData.pdfDetails?.shed2Unit1Value,

        // Shed 2 Unit 2
        shed2Unit2Area: pdfData.shed2Unit2Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit2?.areaDetails || pdfData.pdfDetails?.shed2Unit2Area,
        shed2Unit2SMT: pdfData.shed2Unit2SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit2?.areaSMT || pdfData.pdfDetails?.shed2Unit2SMT,
        shed2Unit2SYD: pdfData.shed2Unit2SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit2?.areaSYD || pdfData.pdfDetails?.shed2Unit2SYD,
        shed2Unit2Rate: pdfData.shed2Unit2Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit2?.ratePerSYD || pdfData.pdfDetails?.shed2Unit2Rate,
        shed2Unit2Value: pdfData.shed2Unit2Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed2Unit2?.value || pdfData.pdfDetails?.shed2Unit2Value,

        // Shed 3 (standalone/summary)
        shed3Area: pdfData.shed3Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed3?.areaDetails || pdfData.pdfDetails?.shed3Area,
        shed3SMT: pdfData.shed3SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed3?.areaSMT || pdfData.pdfDetails?.shed3SMT,
        shed3SYD: pdfData.shed3SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed3?.areaSYD || pdfData.pdfDetails?.shed3SYD,
        shed3Rate: pdfData.shed3Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed3?.ratePerSYD || pdfData.pdfDetails?.shed3Rate,
        shed3Value: pdfData.shed3Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed3?.value || pdfData.pdfDetails?.shed3Value,

        // Open Shed
        openShedArea: pdfData.openShedArea || pdfData.pdfDetails?.constructionCostAnalysis?.openShed?.areaDetails || pdfData.pdfDetails?.openShedArea,
        openShedSMT: pdfData.openShedSMT || pdfData.pdfDetails?.constructionCostAnalysis?.openShed?.areaSMT || pdfData.pdfDetails?.openShedSMT,
        openShedSYD: pdfData.openShedSYD || pdfData.pdfDetails?.constructionCostAnalysis?.openShed?.areaSYD || pdfData.pdfDetails?.openShedSYD,
        openShedRate: pdfData.openShedRate || pdfData.pdfDetails?.constructionCostAnalysis?.openShed?.ratePerSYD || pdfData.pdfDetails?.openShedRate,
        openShedValue: pdfData.openShedValue || pdfData.pdfDetails?.constructionCostAnalysis?.openShed?.value || pdfData.pdfDetails?.openShedValue,

        // Godown
        godownArea: pdfData.godownArea || pdfData.pdfDetails?.constructionCostAnalysis?.godown?.areaDetails || pdfData.pdfDetails?.godownArea,
        godownSMT: pdfData.godownSMT || pdfData.pdfDetails?.constructionCostAnalysis?.godown?.areaSMT || pdfData.pdfDetails?.godownSMT,
        godownSYD: pdfData.godownSYD || pdfData.pdfDetails?.constructionCostAnalysis?.godown?.areaSYD || pdfData.pdfDetails?.godownSYD,
        godownRate: pdfData.godownRate || pdfData.pdfDetails?.constructionCostAnalysis?.godown?.ratePerSYD || pdfData.pdfDetails?.godownRate,
        godownValue: pdfData.godownValue || pdfData.pdfDetails?.constructionCostAnalysis?.godown?.value || pdfData.pdfDetails?.godownValue,

        // Shed 3 Unit 1
        shed3Unit1Area: pdfData.shed3Unit1Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit1?.areaDetails || pdfData.pdfDetails?.shed3Unit1Area,
        shed3Unit1SMT: pdfData.shed3Unit1SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit1?.areaSMT || pdfData.pdfDetails?.shed3Unit1SMT,
        shed3Unit1SYD: pdfData.shed3Unit1SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit1?.areaSYD || pdfData.pdfDetails?.shed3Unit1SYD,
        shed3Unit1Rate: pdfData.shed3Unit1Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit1?.ratePerSYD || pdfData.pdfDetails?.shed3Unit1Rate,
        shed3Unit1Value: pdfData.shed3Unit1Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit1?.value || pdfData.pdfDetails?.shed3Unit1Value,

        // Shed 3 Unit 2
        shed3Unit2Area: pdfData.shed3Unit2Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit2?.areaDetails || pdfData.pdfDetails?.shed3Unit2Area,
        shed3Unit2SMT: pdfData.shed3Unit2SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit2?.areaSMT || pdfData.pdfDetails?.shed3Unit2SMT,
        shed3Unit2SYD: pdfData.shed3Unit2SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit2?.areaSYD || pdfData.pdfDetails?.shed3Unit2SYD,
        shed3Unit2Rate: pdfData.shed3Unit2Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit2?.ratePerSYD || pdfData.pdfDetails?.shed3Unit2Rate,
        shed3Unit2Value: pdfData.shed3Unit2Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit2?.value || pdfData.pdfDetails?.shed3Unit2Value,

        // Shed 3 Unit 3
        shed3Unit3Area: pdfData.shed3Unit3Area || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit3?.areaDetails || pdfData.pdfDetails?.shed3Unit3Area,
        shed3Unit3SMT: pdfData.shed3Unit3SMT || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit3?.areaSMT || pdfData.pdfDetails?.shed3Unit3SMT,
        shed3Unit3SYD: pdfData.shed3Unit3SYD || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit3?.areaSYD || pdfData.pdfDetails?.shed3Unit3SYD,
        shed3Unit3Rate: pdfData.shed3Unit3Rate || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit3?.ratePerSYD || pdfData.pdfDetails?.shed3Unit3Rate,
        shed3Unit3Value: pdfData.shed3Unit3Value || pdfData.pdfDetails?.constructionCostAnalysis?.shed3Unit3?.value || pdfData.pdfDetails?.shed3Unit3Value,

        // Brief Description - Extract from nested pdfDetails.briefDescription
        revenueDetails: pdfData.revenueDetails || pdfData.pdfDetails?.briefDescription?.revenueDetails || pdfData.pdfDetails?.revenueDetails,
        areaOfLand: pdfData.areaOfLand || pdfData.pdfDetails?.briefDescription?.areaOfLand || pdfData.pdfDetails?.areaOfLand,
        valueOfLand: pdfData.valueOfLand || pdfData.pdfDetails?.briefDescription?.valueOfLand || pdfData.pdfDetails?.valueOfLand,
        areaOfConstruction: pdfData.areaOfConstruction || pdfData.pdfDetails?.briefDescription?.areaOfConstruction || pdfData.pdfDetails?.areaOfConstruction,
        valueOfConstruction: pdfData.valueOfConstruction || pdfData.pdfDetails?.briefDescription?.valueOfConstruction || pdfData.pdfDetails?.valueOfConstruction,
        totalMarketValue: pdfData.totalMarketValue || pdfData.pdfDetails?.briefDescription?.totalMarketValue || pdfData.pdfDetails?.totalMarketValue || pdfData.fairMarketValue,
        insurableValue: pdfData.insurableValue || pdfData.pdfDetails?.briefDescription?.insurableValue || pdfData.pdfDetails?.insurableValue,
        jantriValue: pdfData.jantriValue || pdfData.pdfDetails?.valuationSummary?.jantriValue?.amount || pdfData.pdfDetails?.briefDescription?.jantriValue || pdfData.pdfDetails?.jantriValue || pdfData.readyReckonerValue,

        // Signature & Report - Extract from nested pdfDetails.signatureDetails
        valuationPlace: pdfData.valuationPlace || pdfData.place || pdfData.pdfDetails?.signatureDetails?.valuer?.place || pdfData.pdfDetails?.valuationPlace,
        valuationDate: pdfData.valuationDate || pdfData.signatureDate || pdfData.pdfDetails?.signatureDetails?.valuer?.date || pdfData.pdfDetails?.valuationMadeDate,
        valuationMadeDate: pdfData.valuationMadeDate || pdfData.pdfDetails?.valuationMadeDate || pdfData.dateOfValuationMade || pdfData.pdfDetails?.signatureDetails?.valuer?.date,
        valuersName: pdfData.valuersName || pdfData.signerName || pdfData.pdfDetails?.signatureDetails?.valuer?.name || pdfData.pdfDetails?.valuersName,
        valuersCompany: pdfData.valuersCompany || pdfData.pdfDetails?.valuersCompany,
        valuersLicense: pdfData.valuersLicense || pdfData.pdfDetails?.valuersLicense,
        reportDate: pdfData.reportDate || pdfData.pdfDetails?.reportDate,

        // Rate information
        comparableRate: pdfData.comparableRate || pdfData.pdfDetails?.comparableRate,
        adoptedBasicCompositeRate: pdfData.adoptedBasicCompositeRate || pdfData.pdfDetails?.adoptedBasicCompositeRate,
        buildingServicesRate: pdfData.buildingServicesRate || pdfData.pdfDetails?.buildingServicesRate,
        landOthersRate: pdfData.landOthersRate || pdfData.pdfDetails?.landOthersRate,
        guidelineRate: pdfData.guidelineRate || pdfData.pdfDetails?.guidelineRate,

        // Depreciation & Rate
        depreciatedBuildingRateFinal: pdfData.depreciatedBuildingRateFinal || pdfData.depreciatedBuildingRate || pdfData.pdfDetails?.depreciatedBuildingRate,
        replacementCostServices: pdfData.replacementCostServices || pdfData.pdfDetails?.replacementCostServices,
        buildingAgeDepreciation: pdfData.buildingAgeDepreciation || pdfData.buildingAge || pdfData.pdfDetails?.buildingAge,
        buildingLifeEstimated: pdfData.buildingLifeEstimated || pdfData.buildingLife || pdfData.pdfDetails?.buildingLife,
        depreciationPercentageFinal: pdfData.depreciationPercentageFinal || pdfData.depreciationPercentage || pdfData.pdfDetails?.depreciationPercentage,
        depreciatedRatio: pdfData.depreciatedRatio || pdfData.deprecatedRatio || pdfData.pdfDetails?.deprecatedRatio,
        totalCompositeRate: pdfData.totalCompositeRate || pdfData.pdfDetails?.totalCompositeRate || pdfData.adoptedBasicCompositeRate,
        guidelineRate: pdfData.guidelineRate || pdfData.pdfDetails?.guidelineRate || pdfData.pdfDetails?.guidelineRatePerSqm,
        rateLandOther: pdfData.rateLandOther || pdfData.rateForLandOther || pdfData.pdfDetails?.rateForLandOther,
        totalEstimatedValue: pdfData.totalEstimatedValue || pdfData.totalValuationItems || pdfData.pdfDetails?.totalValuationItems,
        totalValueSay: pdfData.totalValueSay || pdfData.pdfDetails?.totalValueSay,

        // Valuation items - Qty/Rate/Value variants
        valuationItem1: pdfData.valuationItem1 || pdfData.presentValue || pdfData.pdfDetails?.presentValue,
        presentValueQty: pdfData.presentValueQty || pdfData.pdfDetails?.presentValueQty,
        presentValueRate: pdfData.presentValueRate || pdfData.pdfDetails?.presentValueRate,
        wardrobesQty: pdfData.wardrobesQty || pdfData.pdfDetails?.wardrobesQty,
        wardrobesRate: pdfData.wardrobesRate || pdfData.pdfDetails?.wardrobesRate,
        wardrobes: pdfData.wardrobes || pdfData.pdfDetails?.wardrobes,
        showcasesQty: pdfData.showcasesQty || pdfData.pdfDetails?.showcasesQty,
        showcasesRate: pdfData.showcasesRate || pdfData.pdfDetails?.showcasesRate,
        showcases: pdfData.showcases || pdfData.pdfDetails?.showcases,
        kitchenArrangementsQty: pdfData.kitchenArrangementsQty || pdfData.pdfDetails?.kitchenArrangementsQty,
        kitchenArrangementsRate: pdfData.kitchenArrangementsRate || pdfData.pdfDetails?.kitchenArrangementsRate,
        kitchenArrangements: pdfData.kitchenArrangements || pdfData.pdfDetails?.kitchenArrangements,
        superfineFinishQty: pdfData.superfineFinishQty || pdfData.pdfDetails?.superfineFinishQty,
        superfineFinishRate: pdfData.superfineFinishRate || pdfData.pdfDetails?.superfineFinishRate,
        superfineFinish: pdfData.superfineFinish || pdfData.pdfDetails?.superfineFinish,
        interiorDecorationsQty: pdfData.interiorDecorationsQty || pdfData.pdfDetails?.interiorDecorationsQty,
        interiorDecorationsRate: pdfData.interiorDecorationsRate || pdfData.pdfDetails?.interiorDecorationsRate,
        interiorDecorations: pdfData.interiorDecorations || pdfData.pdfDetails?.interiorDecorations,
        electricityDepositsQty: pdfData.electricityDepositsQty || pdfData.pdfDetails?.electricityDepositsQty,
        electricityDepositsRate: pdfData.electricityDepositsRate || pdfData.pdfDetails?.electricityDepositsRate,
        electricityDeposits: pdfData.electricityDeposits || pdfData.pdfDetails?.electricityDeposits,
        collapsibleGatesQty: pdfData.collapsibleGatesQty || pdfData.pdfDetails?.collapsibleGatesQty,
        collapsibleGatesRate: pdfData.collapsibleGatesRate || pdfData.pdfDetails?.collapsibleGatesRate,
        collapsibleGates: pdfData.collapsibleGates || pdfData.pdfDetails?.collapsibleGates,
        potentialValueQty: pdfData.potentialValueQty || pdfData.pdfDetails?.potentialValueQty,
        potentialValueRate: pdfData.potentialValueRate || pdfData.pdfDetails?.potentialValueRate,
        potentialValue: pdfData.potentialValue || pdfData.pdfDetails?.potentialValue,
        otherItemsQty: pdfData.otherItemsQty || pdfData.pdfDetails?.otherItemsQty,
        otherItemsRate: pdfData.otherItemsRate || pdfData.pdfDetails?.otherItemsRate,
        otherItems: pdfData.otherItems || pdfData.pdfDetails?.otherItems,
        totalValuationItems: pdfData.totalValuationItems || pdfData.pdfDetails?.totalValuationItems,

        // Checklist of Documents - Dynamic binding from pdfDetails.checklistOfDocuments
        engagementLetterConfirmation: getFieldValue(pdfData, 'engagementLetterConfirmation'),
        ownershipDocumentsSaleDeed: getFieldValue(pdfData, 'ownershipDocumentsSaleDeed'),
        advTcrLsr: getFieldValue(pdfData, 'advTcrLsr'),
        agreementForSaleBanaKhat: getFieldValue(pdfData, 'agreementForSaleBanaKhat'),
        propertyCard: getFieldValue(pdfData, 'propertyCard'),
        mortgageDeed: getFieldValue(pdfData, 'mortgageDeed'),
        leaseDeed: getFieldValue(pdfData, 'leaseDeed'),
        index2: getFieldValue(pdfData, 'index2'),
        vf712InCaseOfLand: getFieldValue(pdfData, 'vf712InCaseOfLand'),
        naOrder: getFieldValue(pdfData, 'naOrder'),
        approvedLayoutPlan: getFieldValue(pdfData, 'approvedLayoutPlan'),
        commencementLetter: getFieldValue(pdfData, 'commencementLetter'),
        buPermission: getFieldValue(pdfData, 'buPermission'),
        eleMeterPhoto: getFieldValue(pdfData, 'eleMeterPhoto'),
        lightBill: getFieldValue(pdfData, 'lightBill'),
        muniTaxBill: getFieldValue(pdfData, 'muniTaxBill'),
        numberingFlatBungalowPlotNo: getFieldValue(pdfData, 'numberingFlatBungalowPlotNo'),
        boundariesOfPropertyProperDemarcation: getFieldValue(pdfData, 'boundariesOfPropertyProperDemarcation'),
        mergedProperty: getFieldValue(pdfData, 'mergedProperty'),
        premiseCanBeSeparatedEntranceDoor: getFieldValue(pdfData, 'premiseCanBeSeparatedEntranceDoor'),
        landIsLocked: getFieldValue(pdfData, 'landIsLocked'),
        propertyIsRentedToOtherParty: getFieldValue(pdfData, 'propertyIsRentedToOtherParty'),
        ifRentedRentAgreementIsProvided: getFieldValue(pdfData, 'ifRentedRentAgreementIsProvided'),
        siteVisitPhotos: getFieldValue(pdfData, 'siteVisitPhotos'),
        selfieWithOwnerIdentifier: getFieldValue(pdfData, 'selfieWithOwnerIdentifier'),
        mobileNoChecklist: getFieldValue(pdfData, 'mobileNo'),
        dataSheet: getFieldValue(pdfData, 'dataSheet'),
        tentativeRate: getFieldValue(pdfData, 'tentativeRate'),
        saleInstanceLocalInquiryVerbalSurvey: getFieldValue(pdfData, 'saleInstanceLocalInquiryVerbalSurvey'),
        brokerRecording: getFieldValue(pdfData, 'brokerRecording'),
        pastValuationRate: getFieldValue(pdfData, 'pastValuationRate'),

        // Valuation Details Table
        valuationDetailsTable: pdfData.valuationDetailsTable || pdfData.pdfDetails?.valuationDetailsTable,
        unitMaintenance: pdfData.unitMaintenance || pdfData.pdfDetails?.amenities?.unitMaintenance || pdfData.pdfDetails?.unitMaintenance,
        unitClassification: pdfData.unitClassification || pdfData.pdfDetails?.amenities?.unitClassification || pdfData.pdfDetails?.unitClassification,
        classificationPosh: pdfData.unitClassification || pdfData.classificationPosh || pdfData.pdfDetails?.classificationPosh,
        classificationUsage: pdfData.classificationUsage || pdfData.pdfDetails?.classificationUsage,
        classificationOwnership: pdfData.classificationOwnership || pdfData.pdfDetails?.classificationOwnership,

        // Client & Document info
        clientName: pdfData.clientName,
        mobileNumber: pdfData.mobileNumber,
        address: pdfData.address,
        bankName: pdfData.bankName,
        city: pdfData.city,
        dsa: pdfData.dsa,
        engineerName: pdfData.engineerName,
        notes: pdfData.notes,

        // Images
        propertyImages: pdfData.propertyImages || [],
        locationImages: pdfData.locationImages || [],

        // Custom Fields
        customFields: pdfData.customFields || []
    };



    // Calculate total valuation items if not provided
    if (!pdfData.totalValuationItems || pdfData.totalValuationItems === 'NA') {
        let total = 0;
        const valuationFields = [
            'presentValue', 'wardrobes', 'showcases', 'kitchenArrangements',
            'superfineFinish', 'interiorDecorations', 'electricityDeposits',
            'collapsibleGates', 'potentialValue', 'otherItems'
        ];

        valuationFields.forEach(field => {
            const value = pdfData[field];
            if (value && value !== 'NA' && value !== 'Nil') {
                const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                if (!isNaN(num)) total += num;
            }
        });

        if (total > 0) {
            pdfData.totalValuationItems = Math.round(total).toLocaleString('en-IN');
            pdfData.totalValuationItemsWords = numberToWords(Math.round(total)) + ' ONLY';
        }
    } else {
        // Generate words for existing total if not already provided
        if (!pdfData.totalValuationItemsWords || pdfData.totalValuationItemsWords === 'NA') {
            const num = parseFloat(String(pdfData.totalValuationItems).replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) {
                pdfData.totalValuationItemsWords = numberToWords(Math.round(num)) + ' ONLY';
            }
        }
    }

    // Generate word representations for all valuation values
    const valueFields = {
        fairMarketValue: 'fairMarketValueWords',
        realisableValue: 'realisableValueWords',
        distressValue: 'distressValueWords',
        agreementValue: 'agreementValueWords',
        valueCircleRate: 'valueCircleRateWords',
        insurableValue: 'insurableValueWords'
    };

    Object.entries(valueFields).forEach(([valueField, wordField]) => {
        const value = pdfData[valueField];
        if (value && value !== 'NA' && value !== 'Nil' && (!pdfData[wordField] || pdfData[wordField] === 'NA')) {
            const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
            if (!isNaN(num) && num > 0) {
                pdfData[wordField] = 'Rupees ' + numberToWords(Math.round(num)) + ' Only';
            }
        }
    });

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Valuation Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html { height: 100%; }
      body { 
        font-family: 'Arial', sans-serif; 
        font-size: 11pt; 
        line-height: 1.3; 
        color: #000;
        margin: 0;
        padding: 0;
        background: white;
      }
      @page {
        size: A4;
        margin: 0;
      }
      .continuous-wrapper {
        page-break-after: auto !important;
        page-break-inside: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100%;
        box-sizing: border-box;
      }
  
      .page { 
        page-break-after: auto !important;
        page-break-before: auto !important;
        break-after: auto !important;
        break-before: auto !important;
        padding: 12mm;
        background: white; 
        width: 100%;
        max-width: 210mm;
        box-sizing: border-box;
        overflow: visible !important;
        display: block !important;
        clear: both !important;
        margin: 0 !important;
        page-break-inside: auto !important;
        height: auto !important;
        min-height: auto !important;
      }
  
      .form-table {
        width: 100%;
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        margin: 12px 0 12px 0 !important;
        font-size: 12pt;
        table-layout: fixed;
        page-break-inside: auto !important;
        break-inside: auto !important;
        display: table !important;
      }
  
      .form-table.fixed-cols {
        table-layout: fixed;
      }
  
      .form-table tbody {
        display: table-row-group !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
  
      .form-table tr {
        height: auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: table-row !important;
        page-break-after: auto !important;
      }
  
      .form-table tr:first-child {
        height: auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
      }
  
      .form-table.compact tr {
        height: auto !important;
        min-height: 18px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      /* Page Break Classes */
      .page-break-before {
        page-break-before: always !important;
        break-before: page !important;
        display: block !important;
        clear: both !important;
        margin: 0 !important;
        padding: 0 !important;
        height: 0 !important;
        width: 100% !important;
        border: none !important;
      }

      .page-break-section {
        page-break-before: always !important;
        break-before: page !important;
        margin: 0 !important;
        margin-top: 0 !important;
        padding: 0 !important;
        padding-top: 0 !important;
        display: block !important;
      }
      
      /* Prevent empty pages between sections */
      .page-break-section + .page-break-section {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
  
      .form-table.compact td {
        padding: 3px 4px;
        min-height: 18px;
      }
  
      .form-table td {
        border-top: 1px solid #000 !important;
        border-bottom: 1px solid #000 !important;
        border-left: 1px solid #000 !important;
        border-right: 1px solid #000 !important;
        padding: 8px 12px !important;
        vertical-align: top !important;
        color: #000 !important;
        background: white !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        word-break: break-word !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        font-weight: normal;
        font-size: 12pt !important;
        display: table-cell !important;
      }
  
      /* Header row - bold borders all around */
      .form-table tr:first-child td {
        border-top: 1px solid #000 !important;
        border-bottom: 1px solid #000 !important;
        border-left: 1px solid #000 !important;
        border-right: 1px solid #000 !important;
        min-height: 32px;
        height: 32px;
        padding: 5px 8px;
        vertical-align: middle;
      }
  
      .form-table tr:first-child td:first-child {
        border-left: 1px solid #000 !important;
      }
  
      .form-table tr:first-child td:last-child {
        border-right: 1px solid #000 !important;
      }
  
      /* Left and right edges - bold borders */
      .form-table td:first-child {
        border-left: 1px solid #000 !important;
      }
  
      .form-table td:last-child {
        border-right: 1px solid #000 !important;
      }
  
      /* Bottom row - bold borders */
      .form-table tr:last-child td {
        border-bottom: 1px solid #000 !important;
      }
  
      .form-table .row-num {
        width: 8%;
        min-width: 8%;
        max-width: 8%;
        text-align: center;
        font-weight: normal;
        background: #ffffffff;
        padding: 6px 4px;
        vertical-align: top !important;
        border: 1px solid #000 !important;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        overflow: visible;
        height: auto !important;
        font-size: 12pt;
      }
  
      .form-table .label {
         width: 50%;
         min-width: 50%;
         max-width: 50%;
         font-weight: normal;
         background: #ffffffff;
         border: 1px solid #000 !important;
         word-wrap: break-word;
         overflow-wrap: break-word;
         vertical-align: top !important;
         padding: 8px 12px;
         white-space: normal;
         page-break-inside: avoid;
         break-inside: avoid;
         height: auto !important;
         word-break: break-word;
         overflow: visible;
         font-size: 12pt;
       }
  
        .form-table .value {
          width: 50%;
          min-width: 50%;
          max-width: 50%;
          text-align: left;
          background: white;
          border: 1px solid #000 !important;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          vertical-align: top !important;
          padding: 8px 12px;
          white-space: normal;
          page-break-inside: avoid;
          break-inside: avoid;
          height: auto !important;
          overflow: visible;
          font-weight: normal;
          font-size: 12pt;
        }
  
      .header { 
        text-align: center; 
        margin-bottom: 15px; 
        font-weight: bold;
        font-size: 12pt;
      }
  
      /* 4-column table support for boundaries */
      .form-table.four-col td {
        border: 1px solid #000 !important;
        padding: 8px 12px;
        vertical-align: top;
        color: #000;
        background: white;
        page-break-inside: avoid;
        break-inside: avoid;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        overflow: visible;
        height: auto !important;
      }
  
      .form-table.four-col .row-num {
        width: 10%;
        min-width: 10%;
        max-width: 10%;
        border: 1px solid #000 !important;
      }
  
      .form-table.four-col .label {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        border: 1px solid #000 !important;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto !important;
        overflow: visible;
        vertical-align: top !important;
      }
  
      .form-table.four-col .deed {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        text-align: center;
        font-weight: normal;
        font-size: 12pt;
        border: 1px solid #000 !important;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto !important;
        overflow: visible;
        vertical-align: top !important;
        padding: 8px 12px;
      }
  
      .form-table.four-col .actual {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        text-align: center;
        font-weight: normal;
        font-size: 12pt;
        border: 1px solid #000 !important;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto !important;
        overflow: visible;
        vertical-align: top !important;
        padding: 8px 12px;
      }
  
      /* Standalone deed and actual for non-four-col tables */
      .form-table .deed {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
        text-align: center;
        font-weight: normal;
        font-size: 12pt;
        border: 1px solid #000 !important;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto !important;
        overflow: visible;
        vertical-align: top !important;
        padding: 8px 12px;
      }
  
      .form-table .actual {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
        text-align: center;
        font-weight: normal;
        font-size: 12pt;
        border: 1px solid #000 !important;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto !important;
        overflow: visible;
        vertical-align: top !important;
        padding: 8px 12px;
      }
  
      /* For rows with deed/actual columns, label should be narrower */
      tr:has(td.deed) .label,
      tr:has(td.actual) .label {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
      }
  
      /* Content flow rules */
      div[style*="margin-top"],
      div[style*="margin-bottom"] {
        page-break-inside: auto !important;
        break-inside: auto !important;
        margin-top: 12px !important;
        margin-bottom: 12px !important;
        height: auto !important;
        min-height: auto !important;
      }
  
      /* Section containers */
      div {
        page-break-inside: auto !important;
        break-inside: auto !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
      }
  
      /* Image containers */
      .image-container {
        page-break-inside: auto !important;
        break-inside: auto !important;
        margin: 12px 0 12px 0 !important;
      }
  
      img {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        max-width: 100% !important;
        height: auto !important;
      }
  
      /* Paragraph and text flow */
      p {
        margin: 4px 0 4px 0 !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
        orphans: 2 !important;
        widows: 2 !important;
      }
  
      /* List styles */
      ul, ol {
        margin: 8px 0 8px 0 !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
  
      li {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
  
      /* Heading preservation */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        break-after: avoid !important;
        break-before: avoid !important;
        margin: 12px 0 8px 0 !important;
      }
  
      
      </style>
  </head>
  <body>
  
  <!-- CONTINUOUS DATA TABLE -->
  <div class="continuous-wrapper" >
  <div style="padding: 0 12mm; ">
  <!-- Title -->
  <div style="text-align: center; margin-bottom: 5px; padding: 8px 0;">
  <p style="font-size: 14pt; font-weight: bold; margin: 0; color: #0066cc;">VALUATION REPORT</p>
  </div>
  </div>
  
  <div style="padding: 0 12mm;">
      <!-- HEADER TABLE: A/C Name, Owner, Property Details -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; table-layout: fixed;">
        <tbody>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">A/C Name/ Borrower Name</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'borrowerName') || safeGet(pdfData, 'clientName')}</td>
          </tr>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Name of Owner</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'ownerName') || safeGet(pdfData, 'ownerNameAddress')}</td>
          </tr>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Property Details</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'propertyDetails') || safeGet(pdfData, 'briefDescriptionProperty')}</td>
          </tr>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Property Address / Location</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'propertyAddress') || safeGet(pdfData, 'postalAddress')}</td>
          </tr>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">Client</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'bankName')},${safeGet(pdfData, 'client')}, ${safeGet(pdfData, 'city')}</td>
          </tr>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">Purpose of Valuation</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'purposeOfValuation') || safeGet(pdfData, 'valuationPurpose')}</td>
          </tr>
          <tr>
            <td style="width: 35%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">Date of Valuation</td>
            <td style="width: 65%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${formatDate(safeGet(pdfData, 'dateOfValuation') || safeGet(pdfData, 'valuationMadeDate'))}</td>
          </tr>
        </tbody>
      </table>
      ${pdfData.bankImage ? `
      <div>
<div style="
  text-align: center;
  margin: 10px 0;
">
    <img 
      src="${getImageSource(
        typeof pdfData.bankImage === 'string'
          ? pdfData.bankImage
          : pdfData.bankImage?.url
      )}"
      alt="Bank Image"
      style="
        width: 700px !important;
        height: 450px !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto 50px auto !important;
        border: 2px solid #000 !important;
        padding: 5px !important;
        box-sizing: border-box !important;
      "
      crossorigin="anonymous"
      loading="eager"
    />
</div>
      </div>
      ` : ''}

      <!-- VALUED PROPERTY AT A GLANCE TABLE -->

        <div class="no-break"
             style="
                text-align: center;
                margin-top: 0px;
                box-sizing: border-box;
             ">
        <p style="font-size: 15pt;margin-bottom: 10px;font-weight: bold;color: #0066cc;">VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE</p>
        </div>
        <div style="box-sizing: border-box; width: 100%; margin: 0; overflow: hidden;">
        <table class="page-break-section" style="width: 100%; border-collapse: collapse; border-spacing: 0; margin-bottom: 12px; page-break-inside: avoid; table-layout: fixed;">
          <tbody>
          <tr>
            <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Applicant</td>
            <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'bankName')},${safeGet(pdfData, 'client')},  ${safeGet(pdfData, 'city')}</td>
          </tr>
          <tr>
            <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Valuation done by Govt. Approved Valuer</td>
            <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'valuationDoneBy') || 'YES Govt. Approved Valuer & Bank\'s Panel Valuer'}</td>
          </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Purpose of Valuation</td>
          <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">To ascertain fair market value for ${safeGet(pdfData, 'purposeOfValuation') || safeGet(pdfData, 'valuationPurpose')}(My opinion for the probable value of the property only)</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Name of Owner/Owners</td>
          <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'ownerName') || safeGet(pdfData, 'ownerNameAddress')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Address of property under valuation</td>
          <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'propertyAddress') || safeGet(pdfData, 'postalAddress')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Brief description of the Property</td>
          <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'briefDescriptionProperty') || safeGet(pdfData, 'propertyDetails')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Revenue details as per Sale deed / Authenticate Documents</td>
          <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'revenueDetails') || safeGet(pdfData, 'plotNumber')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Area of Land</td>
          <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'areaOfLand') || safeGet(pdfData, 'areaSMT')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Value of Land</td>
          <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'valueOfLand') || safeGet(pdfData, 'fairMarketValue')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Area of Construction</td>
          <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'areaOfConstruction') || safeGet(pdfData, 'carpetArea')}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Value of Construction</td>
          <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'valueOfConstruction')}</td>
        </tr
        <tr>
           <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">TOTAL MARKET VALUE OF THE PROPERTY</td>
           <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">${formatCurrencyWithWords(safeGet(pdfData, 'totalMarketValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'))}</td>
         </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">REALISABLE VALUE (85% of MV)</td>
          <td style="width: 60%; ; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">${formatCurrencyWithWords(safeGet(pdfData, 'realisableValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'),)}</td>
        </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">DISTRESS SALE VALUE (70% of MV)</td>
          <td style="width: 60%; ; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">${formatCurrencyWithWords(safeGet(pdfData, 'distressValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'), )}</td>
        </tr>
        <tr>
           <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">JANTRI VALUE OF PROPERTY</td>
           <td style="width: 60%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">${formatCurrencyWithWords(safeGet(pdfData, 'jantriValue')) || formatCurrencyWithWords(safeGet(pdfData, 'readyReckonerValue'))}</td>
         </tr>
        <tr>
          <td style="width: 40%; background: #ffffff; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">INSURABLE VALUE OF THE PROPERTY</td>
          <td style="width: 60%; ; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">${formatCurrencyWithWords(safeGet(pdfData, 'insurableValue'))}</td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #000; padding: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="font-size: 11pt;">
                <p style="margin: 2px 0; font-weight: bold;">Date: ${formatDate(safeGet(pdfData, 'dateOfInspection'))}</p>
                <p style="margin: 2px 0; font-weight: bold;">Place: ${safeGet(pdfData, 'city')}</p>
              </div>
              <div style="font-size: 11pt; text-align: right;">
                <p style="margin: 2px 0; font-weight: bold;">Rajesh Ganatra</p>
                <p style="margin: 2px 0; font-weight: bold;">Govt. Registered Valuer</p>
              </div>
            </div>
          </td>
        </tr>
        </tbody>
        </table>
        </div>
        
<div style="page-break-before: always; margin-top: 9px;">

  <div style="font-weight: bold; line-height: 1.6; margin-bottom: 7spx; margin-top: 28px;">
    <p style="margin: 0;">To,</p>
    <p style="margin: 0;">Chief Manager,</p>
    <p style="margin: 0;">${safeGet(pdfData, 'bankName', '')}</p>
    <p style="margin: 0;">${safeGet(pdfData, 'pdfDetails.client', '')}</p>
    <p style="margin: 0;">${safeGet(pdfData, 'city', '')}</p>
  </div>
      <!-- VALUATION REPORT TITLE -->
      <div style="text-align: center; padding: 2px 0; margin-bottom: 7px;">
        <h2 style="margin: 0; font-size: 15pt; font-weight: bold;text-align: center;color: #0066cc;">VALUATION REPORT</h2>
      </div>

      <!-- I. GENERAL TABLE -->
     <table class="form-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000;border-left: 1px solid #000;border-right: 1px solid #000;border-top: 1px solid #000;border-bottam: 1px solid #000;">
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
        <td class="label" style="border: 1px solid #000; padding: 8px; background: #ffffffff; font-weight: bold;">I. GENERAL</td>
        <td style="border: 1px solid #000; padding: 8px; background: #ffffffff;"></td>
      </tr>
      <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;">1.</td>
         <td class="label " style="border: 1px solid #000; padding: 8px;">Purpose of valuation</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'purposeOfValuation')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;">2.</td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">a) Date of inspection</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${formatDate(safeGet(pdfData, 'dateOfInspection'))}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">b) Date on which the valuation is made</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${formatDate(safeGet(pdfData, 'dateOfInspection'))}</td>
       </tr>
      
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">3.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">List of documents produced for perusal</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;"></td>
      </tr>
      <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">i) &nbsp;&nbsp;&nbsp; Conveyance Deed</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'conveyanceDeed')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">ii) &nbsp;&nbsp;&nbsp; Sale Certificate</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'saleCertificate')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">iii) &nbsp;&nbsp;&nbsp; NA Letter</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'pdfDetails.documents.propertyRecords.naLatter')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">iv) &nbsp;&nbsp;&nbsp; Industrial Health & Safety Plan</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'healthSafetyPlan')}</td>
       </tr>
    
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">4.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Name of the owner(s) and his / their address (as) with Phone no. (details of share of each owner in case of joint ownership)</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'ownerNameAddress')}${safeGet(pdfData, 'ownerPhoneShare')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">5.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Brief description of the property (Including leasehold / freehold etc.)</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'briefDescriptionProperty') || 'The property is an Industrial Building Constructed in Lodariyal Village, Abutting to Bavla Sanand Road and Located Near Madhuram Industry, Which is Middle Class Area, many Agriculture Land is Available in Surrounding Area. Also, Industrial Units, Factories are developed, Road is known as Bavla-Sanand Road, one of the Middle developed Industrial Area, potential area, all common public amenities are developed.'}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">a) &nbsp;&nbsp;&nbsp; Plot No. / Survey No.</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'plotSurveyNo')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">b) &nbsp;&nbsp;&nbsp; Door No.</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'doorNo')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">c) &nbsp;&nbsp;&nbsp; T. S. No. / Village</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'tsVillage')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">d) &nbsp;&nbsp;&nbsp; Ward / Taluka</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'wardTaluka')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;"></td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">e) &nbsp;&nbsp;&nbsp; Mandal / District</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'mandalDistrict')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">7.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Postal address of the property</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'postalAddress')}</td>
      </tr>
      <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;" rowspan="4">8.</td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">City / Town</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'cityTown')}</td>
       </tr>
       <tr>
         <td class="label" style="border: 1px solid #000; padding: 8px;">Residential Area</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'residentialArea')}</td>
       </tr>
       <tr>
         <td class="label" style="border: 1px solid #000; padding: 8px;">Commercial Area</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'commercialArea')}</td>
       </tr>
       <tr>
         <td class="label" style="border: 1px solid #000; padding: 8px;">Industrial Area</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'industrialArea')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;">9.</td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">Classification of the area</td>
         <td style="border: 1px solid #000; padding: 8px;"></td>
       </tr>
       <tr>
         <td colspan="3" style="border: 1px solid #000; padding: 0;">
           <table class="form-table" style="width: 100%; border-collapse: collapse; border: 0; margin: 0;">
             <tbody>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: left; font-weight: bold;">i) &nbsp;&nbsp;&nbsp; High / Middle / Poor</td>
                 <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: center;">Middle Class</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: left; font-weight: bold;">ii) &nbsp;&nbsp;&nbsp; Urban / Semi Urban / Rural</td>
                 <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: center;">Middle Class</td>
               </tr>
             </tbody>
           </table>
         </td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;">10.</td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">Coming under Corporation limit / Village Panchayat / Municipality</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'corporationLimitVillage')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;">11.</td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'governmentEnactments')}</td>
       </tr>
       <tr>
         <td class="row-num" style="border: 1px solid #000; padding: 8px;">12.</td>
         <td class="label" style="border: 1px solid #000; padding: 8px;">In case it is an agricultural land, any conversion to house site plots is contemplated</td>
         <td class="value" style="border: 1px solid #000; padding: 8px;">It is a ${safeGet(pdfData, 'agriculturalLandConversion')} Land And it is use Only for Industrial Purpose.</td>
       </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">13.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px; background: #ffffffff;">Boundaries of the property:</td>
        <td style="border: 1px solid #000; padding: 8px; background: #ffffffff;"></td>
      </tr>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 0;">
          <table class="form-table" style="width: 100%; border-collapse: collapse; border: 0; margin: 0;">
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 33%; text-align: center; font-weight: bold;">Direction</td>
                <td style="border: 1px solid #000; padding: 8px; width: 33%; text-align: center; font-weight: bold;">As per Conveyance Deed</td>
                <td style="border: 1px solid #000; padding: 8px; width: 34%; text-align: center; font-weight: bold;">As per Visit</td>
              </tr>
              <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">East</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundaryEastDeed') || safeGet(pdfData, 'boundariesPlotEastDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundaryEastVisit') || safeGet(pdfData, 'boundariesPlotEastActual')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">West</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundaryWestDeed') || safeGet(pdfData, 'boundariesPlotWestDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundaryWestVisit') || safeGet(pdfData, 'boundariesPlotWestActual')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">North</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundaryNorthDeed') || safeGet(pdfData, 'boundariesPlotNorthDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundaryNorthVisit') || safeGet(pdfData, 'boundariesPlotNorthActual')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">South</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundarySouthDeed') || safeGet(pdfData, 'boundariesPlotSouthDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'boundarySouthVisit') || safeGet(pdfData, 'boundariesPlotSouthActual')}</td>
               </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px; text-align: left">14</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Dimensions of the site</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;"></td>
      </tr>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 0;">
          <table class="form-table" style="width: 100%; border-collapse: collapse; border: 0; margin: 0;">
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 33%; text-align: center; font-weight: bold;">Dimension</td>
                <td style="border: 1px solid #000; padding: 8px; width: 33%; text-align: center; font-weight: bold;">A<br/>As per the Deed</td>
                <td style="border: 1px solid #000; padding: 8px; width: 33%; text-align: center; font-weight: bold;">B<br/>Actuals</td>
              </tr>
              <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">North</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionNorthDeed') || safeGet(pdfData, 'dimensionNorth') || safeGet(pdfData, 'dimensionsDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionNorthActual') || safeGet(pdfData, 'dimensionsActual')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">South</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionSouthDeed') || safeGet(pdfData, 'dimensionSouth') || safeGet(pdfData, 'dimensionsDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionSouthActual') || safeGet(pdfData, 'dimensionsActual')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">East</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionEastDeed') || safeGet(pdfData, 'dimensionEast') || safeGet(pdfData, 'dimensionsDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionEastActual') || safeGet(pdfData, 'dimensionsActual')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">West</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionWestDeed') || safeGet(pdfData, 'dimensionWest') || safeGet(pdfData, 'dimensionsDeed')}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'dimensionWestActual') || safeGet(pdfData, 'dimensionsActual')}</td>
               </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px; text-align: left">14</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Latitude, longitude and Co-ordinates of the site</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">Latitude: ${safeGet(pdfData, 'coordinates.latitude')} & Longitude: ${safeGet(pdfData, 'coordinates.longitude')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">15.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Extent of the site</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'extentOfSite') || safeGet(pdfData, 'extentUnit')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">16.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Extent of the site considered for valuation (least of 14 A & 14 B)</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'extentSiteValuation')}</td>
      </tr>
      <tr>
        <td class="row-num" style="border: 1px solid #000; padding: 8px;">17.</td>
        <td class="label" style="border: 1px solid #000; padding: 8px;">Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent Received per month.</td>
        <td class="value" style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'occupiedByOwnerTenant') || ''} | Duration: ${safeGet(pdfData, 'tenancyDuration') || ''} | Rent: ${safeGet(pdfData, 'rentReceivedPerMonth') || ''}</td>
      </tr>
      </table>

      <!-- Section II: CHARACTERISTICS OF THE SITE -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 10px; page-break-inside: avoid; break-inside: avoid; table-layout: fixed;">
        <tbody>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; text-align: center; color: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"><p style="margin: 0;">II</p></td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; text-align: left; color: #4472C4; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"><p style="margin: 0;">CHARACTERISTICS OF THE SITE</p></td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; text-align: left; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">1</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Classification of locality</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'classificationLocality')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">2</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Development of surrounding areas</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'developmentSurroundingAreas')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">3</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Possibility of frequent flooding / sub-merging</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'floodingPossibility')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">4</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Feasibility to the Civic amenities like school, hospital, bus stop, market etc.</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'civicAmenitiesFeasibility')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">5</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Level of land with topographical conditions</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'landTopography')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">6</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Shape of land</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'shapeOfLand')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">7</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Type of use to which it can be put</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'typeOfUse')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">8</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Any usage restriction</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'usageRestriction')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">9</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Is plot in town planning approved layout?</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'townPlanningApproved')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">10</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Corner plot or intermittent plot?</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'cornerPlotType')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">11</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Road facilities</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'roadFacilities')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">12</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Type of road available at present</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'typeOfRoad')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">13</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Width of road – is it below 20 ft. or more than 20 ft.</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'roadWidth')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">14</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Is it a land – locked land?</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'lockedLand')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">15</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Water potentiality</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'waterPotentiality')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">16</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Underground sewerage system</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'undergroundSewerage')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">17</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Is power supply available at the site?</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'powerSupply')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">18</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Advantage of the site:</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">1.</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'siteAdvantage1')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">2.</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'siteAdvantage2')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Special remarks:</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">1.</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'specialRemarks1')}</td>
          </tr>
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; text-align: center; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">2.</td>
            <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; background: #ffffff; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'specialRemarks2')}</td>
          </tr>
        </tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11pt; table-layout: fixed; border: 1px solid #000000ff;" border="1">
        <tbody>
          <!-- Header Row -->
          <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; background: #ffffff; font-weight: bold; font-size: 11pt; text-align: left; color: #000000ff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;"></td>
            <td colspan="2" style="width: 95%; border: 1px solid #000; padding: 8px 12px; background: #ffffff; font-weight: bold; font-size: 11pt; text-align: left; color: #000000ff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Part - A (Valuation of land)</td>
          </tr>
          
          <!-- Row 1: Size of plot -->
          <tr>
            <td rowspan="3" style="width: 5%; border: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">1.</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: left; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Size of plot</td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; vertical-align: top; background-color: #ffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              <strong>As per Sale Deed:</strong><br/>
              Total Plot Area = ${safeGet(pdfData, 'plotArea') || safeGet(pdfData, 'sizeOfPlotNorthSouth')} sq.mt<br/><br/>
            </td>
          </tr>
          <tr>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              North & South
            </td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              ${safeGet(pdfData, 'sizeOfPlotNorthSouth')}
            </td>
          </tr>
          <tr>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              East & West
            </td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              ${safeGet(pdfData, 'sizeOfPlotEastWest')}
            </td>
          </tr>
          
          <!-- Row 2: Total extent of the plot -->
          <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">2.</td>
            <td style="width: 45%; border: 1px solid #000; padding: 6px 8px; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Total extent of the plot</td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              <strong>As per Sale Deed:</strong><br/>
              Total Plot Area = ${safeGet(pdfData, 'totalPlotArea') || safeGet(pdfData, 'plotArea')}<br/>
              
            </td>
          </tr>
          
          <!-- Row 3: Prevailing market rate -->
          <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">3.</td>
            <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Prevailing market rate (Along with details /reference of at least two latest deals/transactions with respect to adjacent properties in the areas)</td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              <strong>By Land &amp; Building Area Rate Method adopted.</strong><br/><br/>
              Land: Rs. ${safeGet(pdfData, 'landRate') || safeGet(pdfData, 'landBuildingAreaRateMethod')}/- per sq. yd. Plot Area Rate (I have verified the property rates for nearby area with local person/broker in this area, and refer to known web sites, like magic bricks, 99acres, etc., the rate of Industrial Land, varies from the rates are between Rs. 0,000/- to Rs. 0,000/- per sq. yd depends on location, approaches, surrounding developing, etc., I have considered the rate Rs. 0,000/- per sq. yd. Plot Area Rate etc.
            </td>
          </tr>
          
          <!-- Row 4: Guideline rate -->
          <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">4.</td>
            <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-weight: normal; font-size: 11pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Guideline rate obtained from the Registrar's Office (an evidence thereof to be enclosed)</td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
              <strong>As per GARVI / JANTRI Portal, the Jantri Rate for Industrial Land is ₹ ${safeGet(pdfData, 'jantriRate', '1070')} per sq.mtr as per revised Guidelines for Jantri</strong><br/><br/>
              Rates 2 time of Old Rates, dated on ${formatDate(safeGet(pdfData, 'dateOfInspection'))},<br/>
              = ${safeGet(pdfData, 'jantriRate', '1070')} X 2 = ${safeGet(pdfData, 'guidelineRateAdopted', '2140')}/- per sq.mtr<br/>
              <span style=";">Land Value = ${safeGet(pdfData, 'extentOfSite', '13873')} x ${safeGet(pdfData, 'guidelineRateAdopted', '2140')}/- = ₹ ${safeGet(pdfData, 'jantriLandValue', '2,96,88,220.00')}<br/>
              Building Value = ₹ ${safeGet(pdfData, 'jantriBuildingValue', '3,18,96,328.50')}<br/>
              Total GLR / Jantri Value of Property is:<br/>
              = Land + Building<br/>
              = ${safeGet(pdfData, 'jantriLandValue', '2,96,88,220.00')} + ₹ ${safeGet(pdfData, 'jantriBuildingValue', '3,18,96,328.50')}<br/>
              = ₹ ${safeGet(pdfData, 'jantriTotalValue', '6,15,84,548.00')}<br/>
              R / O = ₹ ${safeGet(pdfData, 'estimatedValueOfLand', '6,15,85,000.00')}</span>
            </td>
          </tr>
          
          <!-- Row 5: Variation justification -->
          <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: normal; font-size: 11pt; vertical-align: top;">5.</td>
            <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-weight: normal; font-size: 11pt; text-align: justify; vertical-align: top;">
              i. In case of variation of 20% or more in the valuation proposed by the valuer and the Guideline value provided in the State Govt. notification or Income Tax Gazette Justification on variation has to be given.
            </td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; background: #ffffff; font-size: 11pt; text-align: justify; vertical-align: top;">
              <strong>a.</strong> Guideline value (Jantri rate) of land/property is the value of the land/property as determined by the government, based on it own metrics of facilities and infrastructure growth in that locality. The stamp duty and registration charges for registering a property deal, is based upon this guideline value. The guideline values are revised periodically to have them in sync with the market value. Jantri rates are not relevant in current scenario, as they were last updated in April 2011. Actual market rates have more than doubled since then, depending upon area, locality, demand and supply and other various factors.
            </td>
          </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>b.</strong> Being this the situation, it has been observed that sale deeds are executed at lower price of Jantrirates to save registration charges / stamp duty. So these instances, does not reflect actual transaction amount / market rate. Moreover now days, in actual market, transactions are done on super built-area, whereas guideline value (Jantriate) is based on carpet area. Both the areas have difference of about 40-50% This also makes difference between two values.</p>
                </td>
              </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>c.</strong> In present system certain value zones are established at macro levels, but within the same value zone the land prices of all the plots cannot be same. There are certain negative / positive factors, which are attached to any parcel of land, like width of the road on which a plot abuts, frontage to depth ratio, adjoining slum or huments, title of the property, certain religious & sentimental factors, proximity to high tension electricity supply lines, crematorium, socio-economic pattern, stage of infrastructure, development etc. whereas guideline rate are prescribes as uniform rates for particular FP/Zone.</p>
                </td>
              </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>d.</strong> Property/land/flat on the main road in any area is priced higher and should be valued higher than that in interiors, whereas guideline rate considered them all with equal perspective.</p>
                </td>
              </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>e.</strong> In real estate market, it has been observed that many type of values present in market like forced sale value, sentimental value, monopoly value etc, so it cannot be generalized, while guideline value (Jantri rate) considered them all with one value per zone.</p>
                </td>
              </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>f.</strong> Moreover two projects of two different builder having different reputation & quality work in same zone may fetch different values. Again guideline value (Jantri rate) considers them as one.</p>
                </td>
              </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>g.</strong> Government policies also change the trends/values in real estate market, for example demonetisation, GST etc. the real estate market reacts immediately for these policies for uptrend or downtrend. So this also affects the market rate heavily. While guideline rates remain the same.</p>
                </td>
              </tr>
              <tr>
                <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">
                </td>
                <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                </td>
                <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; text-align: justify; vertical-align: top;">
                  <p style="margin: 0;"><strong>h.</strong> It may not be possible to have a method to fix guideline (Jantri rate) values without anomalies as each site has different characteristics. But it is always desired to revise guideline value (Jantri rate) at regular intervals.</p>
                  </td>
                  </tr>
            
                  <tr>
                  <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;"></td>
                  <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                  Details of last two transactions in the locality/area to be provided, if available.
                  </td>
                  <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;"><p style="margin: 0 0 8px 0;"><strong>i.</strong> (e.g. Six months) or so, as it is the trend observed in other states e.g. Maharashtra (Mumbai) & other states. Recently in year 2023, Govt. has released Revised GR for Guideline rate calculation, Tharav No. 122023/20/H/1, Dt. 13/04/2023, as per that, various revision are mentioned in Land Rate for Residential land, Composite Rate for Office use and Shop Use, and Apartment use, Agriculture Land Use, etc. The GR is attached herewith</p>
                  <p style="margin: 0;"><em>Not available, please refer & considered above facts.</em></p></td>
                  </tr>
                
                  <tr>
                  <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">5.</td>
                  <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                  Assessed / adopted rate of valuation
                  </td>
                  <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;"><strong>Rs. 0,000/- per sq.yd Land Rate for Plot Area</strong></td>
                  </tr>
                  
                  <tr>
                  <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top; text-align: center;">6.</td>
                  <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;">
                  Estimated value of land
                  </td>
                  <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffffff; vertical-align: top;"> <strong>A) Value of Land<br/>
                  = Area x rate<br/>
                  = 16592.10 sq. yd x 0,000.00<br/>
                  = ₹ 00,00,0,000.00</strong></td>
                  </tr>
                 
                  </tbody>
                  </table>

                 
                  
                <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
    <tbody>
        <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff; color: #4472c4;"></td>
            <td colspan="2" style="width: 95%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff; color: #4472c4;">Part – B (Valuation of Building)</td>
        </tr>
        <tr>
            <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: center;">
                &nbsp;
            </td>
            <td style="width: 45%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Technical details of the building
            </td>
            <td style="width: 50%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
              a
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Type of Building (Residential / Commercial / Industrial)
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'typeOfBuilding', 'RCC Structure, AC sheet roof, M.S.Door')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                b
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Type of construction (Load bearing / RCC / Steel Frame)
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'typeOfConstruction', '2013 (Approx.)')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                c
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Year of construction
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'yearOfConstruction', '2013 (Approx.)')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left">
                d
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Number of floors and height of each floor including basement, if any
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'numberOfFloorsHeight', 'GF+1 and Approx. 9mtr Building Height')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                e
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Plinth area floor-wise
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'plinthAreaFloorWise', 'Please Refer Annexure-1')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                f
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Condition of the building
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'conditionOfBuildingInterior', 'Old') || safeGet(pdfData, 'conditionOfBuildingExterior', 'Old')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                i
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Exterior – Excellent, Good, Normal, Poor
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'conditionOfBuildingExterior', 'Normal')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                ii
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Interior – Excellent, Good, Normal, Poor
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'conditionOfBuildingInterior', 'Normal')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                g
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Date of issue and validity of layout of approved map / plan
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'pdfDetails.documents.propertyRecords.naLatter','NA')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                h
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Approved map / plan issuing authority
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'approvedMapIssuingAuthority') || safeGet(pdfData, 'approvedMapAuthority', 'No. 393, Dated: 25/06/2013, Approved by Industrial Safety & Health ' + safeGet(pdfData, 'city') + ' Regional.')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                i
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Whether genuineness or authenticity of approved map / plan is verified
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'genuinessVerified', 'Yes')}
            </td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top; text-align: left;">
                j
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                Any other comments by our empaneled valuers on authentic of approved plan
            </td>
            <td style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; background: #ffffff; vertical-align: top;">
                ${safeGet(pdfData, 'otherCommentsOnApprovedPlan', 'No.')}
            </td>
        </tr>
    </tbody>
</table>
        <h2 style="margin: 0; font-size: 16pt; font-weight: bold;text-align: center;color: #0066cc;">Details of valuation</h2>
                   <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
                   <tbody>
                 
        <p style="margin: 0; font-size: 12pt; font-weight: bold;"><b>Part A: Market Value Analysis of Land</b</p>
    

                   <tr style="background: #ffffff;">
                     <td style="width: 8%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">No.</td>
                     <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Plot</td>
                     <td style="width: 22%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Area sq.yd</td>
                     <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Rate</td>
                     <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Total</td>
                   </tr>
                   <tr>
                     <td style="width: 8%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left">1</td>
                     <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'landAreaPlot')}</td>
                     <td style="width: 22%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;">${safeGet(pdfData, 'landAreaSqYd')}</td>
                     <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;">${safeGet(pdfData, 'landRate')}</td>
                     <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;">${safeGet(pdfData, 'landTotal')}</td>
                   </tr>
                   <tr>
                     <td style="width: 8%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"></td>
                     <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"></td>
                     <td style="width: 22%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"></td>
                     <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;">Say. R/O</td>
                     <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;">${safeGet(pdfData, 'landTotalSayRO') || safeGet(pdfData, 'landTotal')}</td>
                   </tr>
                   </tbody>
                   </table>
<div></div>
                  <!-- Construction Cost Analysis Table -->
                  <table class="form-table" style="margin-top: 15px; width: 100%; border-collapse: collapse;">
                  <tbody>
                        <p><b>Part B: Construction Cost Analysis – as per Actual Measurement --- Details always change according to property</b></p>
                 
                  <tr style="background: #ffffcc;">
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Area Details</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Area - SMT</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Area - SYD</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Rate per SYD</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">Value</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Security Room</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'securityRoomSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'securityRoomSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'securityRoomRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'securityRoomValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Labours Quarter</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'laboursQuarterSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'laboursQuarterSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'laboursQuarterRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'laboursQuarterValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Store Room</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'storeRoomSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'storeRoomSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'storeRoomRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'storeRoomValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Labours Quarter (FF)</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'ffLaboursQuarterSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'ffLaboursQuarterSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'ffLaboursQuarterRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'ffLaboursQuarterValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Gallery room</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'galleryRoomSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'galleryRoomSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'galleryRoomRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'galleryRoomValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">FF Labours Quarter</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'ffLaboursQuarterSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'ffLaboursQuarterSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'ffLaboursQuarterRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'ffLaboursQuarterValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">GF Room</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'gfRoomSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'gfRoomSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'gfRoomRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'gfRoomValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">GF Wash Room</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'gfWashRoomSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'gfWashRoomSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'gfWashRoomRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'gfWashRoomValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Office-1</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'office1SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'office1SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'office1Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'office1Value')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Wash Room</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'washRoomSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'washRoomSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'washRoomRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'washRoomValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shedSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shedSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shedRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shedValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Office-2</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'office2SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'office2SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'office2Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'office2Value')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed-1</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed1SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed1SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed1Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed1Value')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed-2/Unit-1</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed2Unit1SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed2Unit1SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed2Unit1Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed2Unit1Value')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed-2/Unit-2</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed2Unit2SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed2Unit2SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed2Unit2Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed2Unit2Value')}</td>
                  </tr>
                  
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Open shed</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'openShedSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'openShedSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'openShedRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'openShedValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Godown</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'godownSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'godownSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'godownRate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'godownValue')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed-3/Unit-1</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed3Unit1SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed3Unit1SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed3Unit1Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed3Unit1Value')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed-3/Unit-2</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed3Unit2SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed3Unit2SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed3Unit2Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed3Unit2Value')}</td>
                  </tr>
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Shed-3/Unit-3</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed3Unit3SMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'shed3Unit3SYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed3Unit3Rate')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'shed3Unit3Value')}</td>
                  </tr>
                  ${Array.isArray(pdfData.customConstructionCostFields) && pdfData.customConstructionCostFields.length > 0 ? pdfData.customConstructionCostFields.map((field, idx) => `
                  <tr>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(field, 'name', field.areaDetails || '')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(field, 'areaSMT', '')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">${safeGet(field, 'areaSYD', '')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(field, 'ratePerSYD', '')}</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: right;">₹ ${safeGet(field, 'value', '')}</td>
                  </tr>
                  `).join('') : ''}
                  <tr style="background: #ffffcc;">
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt;">TOTAL</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'constructionTotalAreaSMT')}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: right;">${safeGet(pdfData, 'constructionTotalAreaSYD')}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: center;">TOTAL</td>
                    <td style="width: 25%; border: 1px solid #000; padding: 6px 8px; font-weight: bold; font-size: 11pt; text-align: right;">₹ ${safeGet(pdfData, 'constructionTotalValue')}</td>
                  </tr>
                  </tbody>
                  </table>

                  <!-- Part C - Extra Items -->
                  <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
                  <tbody>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;">Part - C (Extra Items)</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; text-align: center;">(Amount in Rs.)</td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">1</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Portico</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.extraItems.portico')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">2</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Ornamental front door</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.extraItems.ornamentalFrontDoor')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">3</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Sit out / Veranda with steel grills</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.extraItems.sitOutVeranda')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">4</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Overhead water tank</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.extraItems.overheadWaterTank')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">5</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Extra steel / collapsible gates</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.extraItems.extraSteelGates')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">-</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Total</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"><span style=";">₹ ${safeGet(pdfData, 'pdfDetails.extraItems.total')}</span></td>
                  </tr>
                  </tbody>
                  </table>

                  <!-- Part D - Amenities -->
                  <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
                  <tbody>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;">Part - D (Amenities)</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; text-align: center;">(Amount in Rs.)</td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">1</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Wardrobes</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.wardrobes')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">2</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Glazed tiles</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.glazedTiles')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">3</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Extra sinks and bath tub</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.extraSinksBathTub')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">4</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Marble / ceramic tiles flooring</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.marbleFlooring')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">5</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Interior decorations</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.interiorDecorations')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">6</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Architectural elevation works</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.architecturalElevation')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">7</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Panelling works</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.panellingWorks')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">8</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Aluminium works</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.aluminiumWorks')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">9</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Aluminium hand rails</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.aluminiumHandRails')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left">10</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">False ceiling</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.falseCeiling')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Total</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.amenities.total')}</td>
                  </tr>
                  </tbody>
                  </table>

                  <!-- Part E - Miscellaneous -->
                  <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
                  <tbody>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;">Part - E (Miscellaneous)</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; text-align: center;">(Amount in Rs.)</td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">1</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Separate toilet room</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.miscellaneous.separateToiletRoom')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">2</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Separate lumber room</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.miscellaneous.separateLumberRoom')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">3</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Separate water tank / sump</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.miscellaneous.separateWaterTankSump')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">4</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Trees, gardening</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.miscellaneous.treesGardening')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Total</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.miscellaneous.total')}</span></td>
                  </tr>
                  </tbody>
                  </table>

                  <!-- Part F - Services -->
                  <table class="form-table" style="margin-top: 15px; width: 100%; border-collapse: collapse;">
                  <tbody>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 8px 12px; font-size: 12pt; font-weight: bold; background: #ffffff;color: #4472c4;">Part - F (Services)</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; text-align: center;">(Amount in Rs.)</td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">1</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Water supply arrangements</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.services.waterSupplyArrangements')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">2</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Drainage arrangements</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.services.drainageArrangements')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">3</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Compound wall</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.services.compoundWall')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">4</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">C. B. deposits, fittings etc.</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.services.cbDepositsFittings')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">5</td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Pavement</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.services.pavement')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 5%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;"></td>
                    <td style="width: 55%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Total</td>
                    <td style="width: 40%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.services.total')}</span></td>
                  </tr>
                  </tbody>
                  </table>
                  <!-- Total Abstract of the Entire Property -->
                  <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
                  <tbody>
                  <tr>
                    <td colspan="3" style="border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold; background: #ffffff; text-align: center; color: #4472c4;">Total abstract of the entire property</td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Part -A</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.totalAbstract.partA.description')}</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.partA.value')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Part -B</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.totalAbstract.partB.description')}</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.partB.value')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Part -C</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.totalAbstract.partC.description')}</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.partC.value')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Part -D</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.totalAbstract.partD.description')}</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.partD.value')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Part -E</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.totalAbstract.partE.description')}</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.partE.value')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Part -F</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.totalAbstract.partF.description')}</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.partF.value')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;"></td>
                    <td style="width: 20%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Total</td>
                    <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.totalValue')}</span></td>
                  </tr>
                  <tr>
                    <td style="width: 50%; border: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; font-size: 11pt;"></td>
                    <td style="width: 20%; border: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">Say</td>
                    <td style="width: 30%; border: 1px solid #000; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left;"> <span style=";">₹ ${safeGet(pdfData, 'pdfDetails.totalAbstract.sayValue')}</span></td>
                  </tr>
                  </tbody>
                  </table>

                  <!-- Custom Fields Section -->
                  ${(() => {
            const customFields = pdfData.customFields || [];
            if (customFields.length === 0) return '';

            return `
                      <table class="form-table" style="margin-top: 12px; width: 100%; border-collapse: collapse;">
                      <tbody>
                      <tr>
                        <td style="width: 10%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; background: #ffffff; text-align: center; color: #4472c4;">Sr.No</td>
                        <td style="width: 30%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; background: #ffffff; text-align: left; color: #4472c4;">Field Name</td>
                        <td style="width: 60%; border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; background: #ffffff; text-align: left; color: #4472c4;">Value</td>
                      </tr>
                      ${customFields.map((field, idx) => `
                      <tr>
                        <td style="width: 10%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: center;">${idx + 1}</td>
                        <td style="width: 30%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; font-weight: bold;">${safeGet(pdfData, `customFields[${idx}].name`, field.name || 'Field ' + (idx + 1))}</td>
                        <td style="width: 60%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${safeGet(pdfData, `customFields[${idx}].value`, field.value || 'NA')}</td>
                      </tr>
                      `).join('')}
                      </tbody>
                      </table>
                      `;
        })()}

                  <!-- Market Approach Section -->
                  <div style="margin-top: 0px; padding: 6px 8px; background: #ffffff; font-weight: normal;">
                    <p style="margin: 0 0 8px 0; font-size: 11pt;"><strong style="color: #0066cc;">Market Approach: (For Land Valuation)</strong></p>
                    <p style="margin: 0; font-size: 11pt; text-align: justify;">Sales Comparison Approach in our valuation report. The Sales Comparison Approach compares recently-sold local similar properties to the subject property. It is a process used to determine the current market value of a property based on recent sales of comparable properties in the area. We have attached the sale instance available online for the similar property herewith.</p>
                  </div>

                  <!-- Cost Approach Section -->
                  <div style="margin-top: 12px; padding: 6px 8px; background: #ffffff; font-weight: normal;">
                    <p style="margin: 0 0 8px 0; font-size: 11pt;"><strong style="color: #0066cc;">Cost Approach (For building valuation):</strong></p>
                    <p style="margin: 0 0 8px 0; font-size: 11pt; text-align: justify;">The cost approach is a real estate valuation method that surmises that the price a buyer should pay for a piece of property should equal the cost to build an equivalent build or replacement cost of the building. In cost approach appraisal, <span style=";">the market price for the property is equal to the cost of land plus cost of construction, less depreciation. Hear we considered depreciated cost of building.</span></p>
                    
                    <p style="margin: 8px 0; font-size: 11pt; text-align: justify;">As a result of my appraisal and analysis it is my considered opinion that the <strong>Present Market Value Of The Above Property</strong> in the prevailing condition with aforesaid specifications is <span style=";"><strong> ${formatCurrencyWithWords(safeGet(pdfData, 'totalMarketValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'))}</strong></span></p>
                    
                    <p style="margin: 8px 0; font-size: 11pt;"><strong>Realisable Value is ${formatCurrencyWithWords(safeGet(pdfData, 'realisableValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'), 85)}</span></strong></p>
                    
                    <p style="margin: 8px 0; font-size: 11pt;"><strong>Distress Value is <span style=";"> ${formatCurrencyWithWords(safeGet(pdfData, 'distressValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'), 70)}</span></strong></p>
                    
                    <p style="margin: 8px 0 12px 0; font-size: 11pt;"><strong>Jantri Value is <span style=";"> ${formatCurrencyWithWords(safeGet(pdfData, 'jantriValue')) || formatCurrencyWithWords(safeGet(pdfData, 'readyReckonerValue'))}</span></strong></p>

                    
                    <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                      <tbody>
                        <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Date</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${formatDate(safeGet(pdfData, 'dateOfInspection'))}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt; text-align: right;">Rajesh Ganatra </td>
                        </tr>
                        <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Place</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${safeGet(pdfData, 'city')}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt; text-align: right;">(Govt. Approved Rgtd. Valuer)</td>
                        </tr>
                      </tbody>
                    </table>

                    <p style="margin: 12px 0; font-size: 11pt; text-align: justify;">The undersigned has inspected the property detailed in Valuation Report dated on <span style=";">${formatDate(safeGet(pdfData, 'dateOfInspection'))}</span></p>
                    <p style="margin: 0 0 12px 0; font-size: 11pt; text-align: justify;">We are satisfied that the fair and reasonable market value of the property is <span style=";"><strong> ${formatCurrencyWithWords(safeGet(pdfData, 'totalMarketValue')) || formatCurrencyWithWords(safeGet(pdfData, 'fairMarketValue'))}</strong></span></p>

                    <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                      <tbody>
                        <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Date</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${formatDate(safeGet(pdfData, 'dateOfInspection'))}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt;"></td>
                        </tr>
                        <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Place</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${safeGet(pdfData, 'city')}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt; text-align: right;">(Branch Manager)</td>
                        </tr>
                      </tbody>
                    </table>
                    </div>

                    <!-- Checklist of Document Table -->
                    <table class="" style="margin-top: 20px; width: 100%; border-collapse: collapse; margin-bottom: 20px;font-weight: normal; table-layout: fixed;">
                    <colgroup>
                        <col style="width: 70%;">
                        <col style="width: 15%;">
                        <col style="width: 15%;">
                    </colgroup>
                    <tbody>
                    <tr>
                    <td colspan="3" style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold; background: #ffffff; text-align: center;">CHECKLIST OF DOCUMENT</td>
                    </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Engagement Letter / Confirmation for Assignment</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'engagementLetterConfirmation')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'engagementLetterConfirmation')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Ownership Documents: Sale Deed / Conveyance Deed</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'ownershipDocumentsSaleDeed')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'ownershipDocumentsSaleDeed')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Adv. TCR / LSR</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'advTcrLsr')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'advTcrLsr')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Agreement For Sale / Bana khat</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'agreementForSaleBanaKhat')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'agreementForSaleBanaKhat')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Property Card</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'propertyCard')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'propertyCard')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Mortgage Deed</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'mortgageDeed')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'mortgageDeed')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Lease Deed</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'leaseDeed')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'leaseDeed')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Index – 2</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'index2')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'index2')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">VF: 7/12 in case of Land</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'vf712InCaseOfLand')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'vf712InCaseOfLand')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">NA order – mentioned in Sale deed, Title report</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'naOrder')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'naOrder')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Approved Layout Plan</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'approvedLayoutPlan')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'approvedLayoutPlan')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Commencement Letter</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'commencementLetter')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'commencementLetter')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">BU Permission</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'buPermission')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'buPermission')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Ele. Meter Photo</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'eleMeterPhoto')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'eleMeterPhoto')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Light Bill</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'lightBill')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'lightBill')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Muni. Tax Bill</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'muniTaxBill')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'muniTaxBill')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Numbering – Flat / bungalow / Plot No. / Identification on Site</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'numberingFlatBungalowPlotNo')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'numberingFlatBungalowPlotNo')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Boundaries of Property – Proper Demarcation</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'boundariesOfPropertyProperDemarcation')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'boundariesOfPropertyProperDemarcation')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Merged Property?</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'mergedProperty')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'mergedProperty')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Premise can be Separated, and Entrance / Dorr is available for the mortgaged property?</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'premiseCanBeSeparatedEntranceDoor')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'premiseCanBeSeparatedEntranceDoor')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Land is Locked?</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'landIsLocked')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'landIsLocked')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Property is rented to Other Party</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'propertyIsRentedToOtherParty')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'propertyIsRentedToOtherParty')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">If Rented – Rent Agreement is Provided?</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'ifRentedRentAgreementIsProvided')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'ifRentedRentAgreementIsProvided')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Site Visit Photos</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'siteVisitPhotos')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'siteVisitPhotos')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Selfie with Owner / Identifier</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'selfieWithOwnerIdentifier')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'selfieWithOwnerIdentifier')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Mobile No.</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'mobileNo')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'mobileNo')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Data Sheet</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'dataSheet')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'dataSheet')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Tentative Rate</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'tentativeRate')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'tentativeRate')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Sale Instance / Local Inquiry / Verbal Survey</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'saleInstanceLocalInquiryVerbalSurvey')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'saleInstanceLocalInquiryVerbalSurvey')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Broker Recording</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'brokerRecording')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">${getChecklistValue(getFieldValue(data, 'brokerRecording')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
            <td style="width: 70%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt;">Past Valuation Rate</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'pastValuationRate')).column1}</td>
            <td style="width: 15%; border: 1px solid #000; padding: 6px 8px; font-size: 11pt; ;">${getChecklistValue(getFieldValue(data, 'pastValuationRate')).column2}</td>
        </tr>
        <tr style="page-break-inside: avoid;">
             <td colspan="3" style="border: 1px solid #000; padding: 8px 12px; font-size: 11pt; font-weight: bold;">
                 <p style="margin: 0 0 8px 0; font-size: 11pt; font-weight: bold;">STANDARD OPERATING PROCEDURE (SOP)</p>
                 <p style="margin: 0 0 8px 0; font-size: 11pt; font-weight: bold;">1 BANK GUIDELINES FOR VALUER</p>
                 <p style="margin: 0 0 8px 0; font-size: 11pt; font-weight: bold;">2 www.donfinworld.io</p>
                 <p style="margin: 0 0 0 0; font-size: 11pt; font-weight: bold;">3 Taskval App for Assignment Management</p>
             </td>
         </tr>
    </tbody>
</table>

                  
                  <!-- Standard Operating Procedure Section  -->
                  <!-- PREAMBLE (starts new page, ends with a forced break to keep next section clean) -->
                  <div style="page-break-before: always; margin: 0; padding: 20px; background: #ffffff; font-weight: normal; page-break-after: always;">
                    
                    <p style="margin: 0 0 12px 0; font-size: 11pt;"><strong>❖ PREAMBLE</strong></p>
                    <div style="text-align: justify; line-height: 1.5; font-size: 11pt; page-break-inside: avoid; word-break: break-word; font-weight: normal;">
                      <p style="margin: 0 0 10px 0;">Bank valuers in India rely on Standard Operating Procedures (SOPs) for several good reasons. SOPs help ensure consistency in property valuations by providing a standardised approach. This results in uniformity in the valuation process across different regions and properties, reducing discrepancies and ensuring fair and objective valuations.</p>
                      <p style="margin: 0 0 10px 0;">Moreover, SOPs establish guidelines and best practices that bank valuers must follow to maintain high-quality and accurate valuations. This guarantees that the bank receives reliable valuations, reducing the risk of financial loss due to overvaluation or undervaluation. SOPs also assist valuers in complying with regulatory frameworks and guidelines set by regulatory authorities, such as the Reserve Bank of India (RBI) and the Securities and Exchange Board of India (SEBI). Valuers who adhere to SOPs lessen the risk of non-compliance and associated penalties.</p>
                      <p style="margin: 0 0 10px 0;">By following standardised procedures, valuers can identify and assess potential risks associated with property valuations, such as legal issues, property conditions, market trends, and encumbrances. This enables banks to make informed lending decisions, reducing the risk of default and protecting the interests of the institution and its customers.</p>
                      <p style="margin: 0 0 10px 0;">SOPs establish ethical guidelines and professional standards for bank valuers, promoting integrity, objectivity, and transparency in the valuation process. By adhering to SOPs, valuers demonstrate their commitment to upholding ethical practices, enhancing the credibility of the valuation profession and maintaining public trust.</p>
                      <p style="margin: 0;">SOPs serve as a valuable tool for training new bank valuers and providing ongoing professional development opportunities. They act as a reference guide, helping valuers accurately understand the step-by-step process of conducting valuations. SOPs also facilitate knowledge sharing and consistency among valuers, ensuring that the expertise and experience of senior professionals are passed down to newer members of the profession. In summary, SOPs are crucial for bank valuers in India as they promote consistency, maintain quality, ensure regulatory compliance, mitigate risks, uphold professionalism, and support training and development. By following these procedures, bank valuers can provide accurate and reliable property valuations, contributing to a robust banking system.</p>
                    </div>

                  </div>

                  <!-- SOP (starts on its own page) -->
                  <div style="page-break-before: always; margin: 0; padding: 20px; background: #ffffff; font-weight: normal;">
                    <p style="margin: 0 0 15px 0; font-size: 11pt;"><strong>❖ Standard Operating Procedure (SOP)</strong></p>
                     <ol style="margin: 0 0 16px 0; font-size: 11pt; text-align: justify; line-height: 1.5; padding-left: 20px;">
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>1.</strong> Receive a valuation request from the bank.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>2.</strong> Review the request thoroughly to understand the scope, purpose, and specific requirements of the valuation.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>3.</strong> Conduct a preliminary assessment of the property or asset to determine its feasibility for valuation.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>4.</strong> Gather all relevant data and information about the property or asset, including legal documents, title deeds, surveys, plans, and other necessary documents provided by the bank.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>5.</strong> Conduct an on-site inspection of the property or asset, taking photographs, measurements and noting essential details.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>6.</strong> Collect market data and research comparable properties or assets in the vicinity to establish a benchmark for valuation.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>7.</strong> Analyse the collected data and use appropriate valuation methods, such as the sales comparison approach, income approach, or cost approach, depending on the property or asset's nature.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>8.</strong> Prepare a comprehensive and detailed valuation report that includes all relevant information, assumptions made, methodologies used, and supporting evidence.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>9.</strong> Review the report meticulously for accuracy, completeness, and compliance with applicable valuation standards and guidelines.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>10.</strong> Submit the valuation report to the bank within the agreed-upon timeframe.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>11.</strong> Attend a meeting or provide additional clarification to the bank regarding the valuation report, if needed.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>12.</strong> Address any queries or requests for revision from the bank and make necessary amendments to the valuation report as per their feedback.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>13.</strong> Obtain final approval or acceptance of the valuation report from the bank.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>14.</strong> Maintain records of all valuation reports, documents, and communication related to the valuation process for future reference and compliance purposes.</li>
                       <li style="margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;"><strong>15.</strong> Follow up with the bank regarding any outstanding payments or administrative formalities.</li>
                    </ol>

                    <p style="margin: 16px 0 12px 0; font-size: 11pt; text-align: justify; line-height: 1.5;">While the process may differ based on the bank's specific requirements and the property or asset being evaluated, this flowchart is a solid foundation for all Banking Valuers in India to confidently and efficiently conduct valuations.</p>
                  </div>

            <!-- Observations, Assumptions and Limiting Conditions -->
<div style="page-break-before: always; margin: 0; padding: 20px 20px 20px 20px; background: #ffffff; border-bottom: none; font-weight: normal;">
  <p style="margin: 0 0 16px 0; font-size: 11pt; font-weight: bold; color: #000000;">
    ❖ OBSERVATIONS, ASSUMPTIONS AND LIMITING CONDITIONS
  </p>
  
  <ul style="margin: 0 0 16px 0; font-size: 10.5pt; text-align: justify; line-height: 1.6; padding-left: 20px; color: #000000; list-style-type: disc;">
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">The Indian Real Estate market is currently facing a transparency issue. It is highly fragmented and lacks authentic and reliable data on market transactions. The actual transaction value often differs from the value documented in official transactions. To accurately represent market trends, we conducted a market survey among sellers, brokers, developers, and other market participants. This survey is crucial to determine fair valuation in this subject area. Based on our verbal survey, we have gained insights into the real estate market in the subject area.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">To conduct a proper valuation, we have made the assumption that the property in question possesses a title that is clear and marketable and that it is free from any legal or physical encumbrances, disputes, claims, or other statutory liabilities. Additionally, we have assumed that the property has received the necessary planning approvals and clearances from the local authorities and that it adheres to the local development control regulations.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Please note that this valuation exercise does not cover legal title and ownership matters. Additionally, we have not obtained any legal advice on the subject property's title and ownership during this valuation. Therefore, we advise the client/bank to seek an appropriate legal opinion before making any decisions based on this report.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">We want to ensure that our valuation is fair and accurate. However, it's important to note that any legal, title, or ownership issues could have a significant impact on the value. If we become aware of any such issues at a later date, we may need to adjust our conclusions accordingly.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Throughout this exercise, we have utilized information from various sources, including hardcopy, softcopy, email, documents, and verbal communication provided by the client. We have proceeded under the assumption that the information provided is entirely reliable, accurate, and complete. However, if it is discovered that the data we were given is not dependable, precise, or comprehensive, we reserve the right to revise our conclusions at a later time.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Please note that the estimated market value of this property does not include transaction costs such as stamp duty, registration charges, and brokerage fees related to its sale or purchase.</li>

    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">When conducting a subject valuation exercise, it is important to consider the market dynamics at the time of the evaluation. However, it is essential to note that any unforeseeable developments in the future may impact the valuation. Therefore, it is crucial to remain vigilant and adaptable in the face of changing circumstances.</li>

    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Kindly take note that the physical measurements and areas given are only approximations. The exact age of the property can only be determined based on the information obtained during inspection. Furthermore, the remaining economic lifespan is an estimate determined by our professional judgment.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Please note that the valuation stated in this report is only applicable for the specific purposes mentioned herein. It is not intended for any other use and cannot be considered valid for any other purpose. The report should not be shared with any third party without our written permission. We cannot assume any responsibility for any third party who may receive or have access to this report, even if consent has been given.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Having this report or any copy of it does not grant the privilege of publishing it. None of the contents in this report should be shared with third parties through advertising, public relations, news or any other communication medium without the written acceptance and authorization of VALUERS.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">To assess the condition and estimate the remaining economic lifespan of the item, we rely on visual observations and a thorough review of maintenance, performance, and service records. It's important to note that we have not conducted any structural design or stability studies, nor have we performed any physical tests to determine the item's structural integrity and strength.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">The report was not accompanied by any soil analysis, geological or technical studies, and there were no investigations conducted on subsurface mineral rights, water, oil, gas, or other usage conditions.</li>
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">The asset was inspected, evaluated, and assessed by individuals who have expertise in valuing such assets. However, it's important to note that we do not make any assertions or assume responsibility for its compliance with health, safety, environmental, or other regulatory requirements that may not have been immediately apparent during our team's inspection.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">During the inspection, if the units were not named, we relied on identification by the owner or their representative and documents like the sale deed, light bill, plan, tax bill, the title for ownership, and boundaries of units. Without any accountability for the title of the units.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Kindly be informed that the valuation report may require modifications in case unanticipated circumstances arise, which were not considered in the presumptions and restrictions specified in the report.</li>
    
    <li style="margin-bottom: 12px; padding-left: 5px; page-break-inside: avoid; break-inside: avoid;">Additional observations, assumptions, and any relevant limiting conditions are also disclosed in the corresponding sections of this report and its annexes.</li>
    
  </ul>
  </div>

                  <!-- Terms and Conditions -->
                  <div style="page-break-before: always; margin: 0; padding: 20px; background: #ffffff; border-top: none; font-weight: normal;">
                    <p style="margin: 0 0 16px 0; font-size: 11pt; font-weight: bold; line-height: 1.5; text-align: left;"><strong>❖ Our Standard Terms and Conditions of Professional Engagement</strong></p>
                    <p style="margin: 0 0 12px 0; font-size: 11pt; line-height: 1.5; text-align: left;">The following standard terms and conditions of professional engagement govern this report:</p>
                    <ol style="margin: 0 0 16px 0; font-size: 11pt; line-height: 1.6; padding-left: 25px; text-align: justify;">
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">1. Valuers will be liable for any issues or concerns related to the Valuation and/or other Services provided. This includes situations where the cause of action is in contract, tort (including negligence), statute, or any other form. However, the total amount of liability will not exceed the professional fees paid to VALUERS for this service.</li>
                      
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">2. VALUERS and its partners, officers, and executives cannot be held liable for any damages, including consequential, incidental, indirect, punitive, exemplary, or special damages. This includes damages resulting from bad debts, non-performing assets, financial loss, malfunctions, delays, loss of data, interruptions of service, or loss of business or anticipated profits.</li>
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">3. The Valuation Services, along with the Deliverables submitted by VALUERS, are intended solely for the benefit of the parties involved. VALUERS assumes no liability or responsibility towards any third party who utilises or gains access to the Valuation or benefits from the Services.</li>
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">4. VALUERS and/or its Partners, Officers and Executives accept no responsibility for detecting fraud or misrepresentation, whether by management or employees of the Client or third parties. Accordingly, VALUERS will not be liable in any way for, or in connection with, fraud or misrepresentations, whether on the part of the Client, its contractors or agents, or any other third party.</li>

                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">5. If you wish to bring a legal proceeding related to the Services Agreement, it must be initiated within six (6) months from the date you became aware of or should have known about the facts leading to the alleged liability. Additionally, legal proceedings must be initiated no later than one (1) year from the date of the Deliverable that caused the alleged liability.</li>
                 
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">6. If you, as the client, have any concerns or complaints about the services provided, please do not hesitate to discuss them with the officials of VALUERS. Any service-related issues concerning this Agreement (or any variations or additions to it) must be brought to the attention of VALUERS in writing within one month from the date when you became aware of or should have reasonably been aware of the relevant facts. Such issues must be raised no later than six months from the completion date of the services.</li>
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">7. If there is any disagreement regarding the Valuation or other Services that are provided, both parties must first try to resolve the issue through conciliation with their senior representatives. If a resolution cannot be reached within forty-five (45) days, the dispute will be settled through Arbitration in India, following the guidelines of the Arbitration and Conciliation Act 1996. The venue of the arbitration will be located in Ahmedabad, Gujarat, India. The arbitrator(s) authority will be subject to the terms of the standard terms of service, which includes the limitation of liability provision. All information regarding the arbitration, including the arbitral award, will be kept confidential.</li>
                      </br>
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">8. By utilizing this report, the user is presumed to have thoroughly read, comprehended, and accepted VALUERS' standard business terms and conditions, as well as the assumptions and limitations outlined in this document.</li>
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">9. We have valued the right property as per the details submitted to us.</li>
                      <li style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">10. Please note that payment for the valuation report is expected to be made within the bank's given time limit from the date of the report. Simply possessing the report will not fulfill its intended purpose.</li>
                    </ol>
                  </div>

                  <!-- Professional Signature Section -->
                  <div style="margin: 0 0 0 0; padding: 16px 20px; text-align: right; background: #ffffff; font-weight: normal;">
                    <p style="margin: 12px 0 4px 0; font-size: 12pt; font-weight: bold; line-height: 1.6;">Rajesh Ganatra</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Reg. Valuer – IBBI</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Chartered Engineer (India), B.E. Civil, PMP (PMI USA)</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Fellow Institute of Valuer (Delhi), M.I.E.</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Approved Valuer by Chief Commissioner Of Income-tax (II)</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Approved Valuer by IOV (Delhi)</p>
                    <p style="margin: 8px 0 2px 0; font-size: 10pt; line-height: 1.4;">3, Chandra Sen Bungalows, Lane Opp. Atthi Restaurant</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Judges Bungalow Rd., Bodakdev, Ahmedabad - 380054, Gujarat</p>
                    <p style="margin: 2px 0; font-size: 10pt; line-height: 1.4;">Tel: 079 40028663 | Mobile: 08257586600</p>
                    <p style="margin: 4px 0 0 0; font-size: 10pt; line-height: 1.4;">E-Mail: <span style="color: #0066cc; text-decoration: underline;">rajeshanatra2003@gmail.com</span></p>
                  </div>
                   
                  <!-- Declaration - Cum - Undertaking Section -->
                  <div style="page-break-before: always; margin-top: 375px; padding: 20px; background: #ffffff; font-weight: normal;">
      <p style="margin: 0 0 12px 0; font-size: 14pt; font-weight: bold; text-align: center;margin-top: 30px;">(Annexure-IV)</p>
    
    <p style="margin: 0 0 20px 0; font-size: 13pt; font-weight: bold; text-align: center; text-decoration: underline;">DECLARATION - CUM - UNDERTAKING</p>
    
    <p style="margin: 0 0 16px 0; font-size: 11pt; line-height: 1.5;"><strong>I, Rajesh Ganatra, son of Kishorbhai Ganatra, do hereby solemnly affirm and state that:</strong></p>
    
    <div style="margin-left: 20px; page-break-inside: avoid; break-inside: avoid;">
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>a.</strong> I am a citizen of India.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>b.</strong> I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointment as valuer or three years after the valuation of assets was conducted by me.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>c.</strong> The information furnished in my valuation report dated <strong>${formatDate(safeGet(pdfData, 'dateOfInspection'))}</strong> is true and correct to the best of my knowledge and belief and I have made an impartial and true valuation of the property.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>d.</strong> I have personally inspected the property on <strong>${formatDate(safeGet(pdfData, 'dateOfInspection'))}</strong>. The work is not sub-contracted to any other valuer and carried out by myself.
        </p>
        
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>e.</strong> Valuation report is submitted in the format as prescribed by the Bank.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>f.</strong> I have not been de-paneled/delisted by any other bank and in case any such de-panelment by other banks during my empanelment with you, I will inform you within 3 days of such de-panelment.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>g.</strong> I have not been removed/dismissed from service/employment earlier.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>h.</strong> I have not been convicted of any offence and sentenced to a term of imprisonment.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>i.</strong> I have not been found guilty of misconduct in professional capacity.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>j.</strong> I have not been declared to be of unsound mind.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>k.</strong> I am not an undischarged bankrupt, or has not applied to be adjudicated as a bankrupt.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>l.</strong> I am not an undischarged insolvent.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>m.</strong> I have not been levied a penalty under section 271J of Income-tax Act, 1961 (43 of 1961) and time limit for filing appeal before Commissioner of Income-tax (Appeals) or Income-tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>n.</strong> I have not been convicted of an offence connected with any proceeding under the Income Tax Act 1961, Wealth Tax Act 1957 or Gift Tax Act 1958 and.
        </p>
        
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>o.</strong> My PAN Card number/Service Tax number as applicable is <strong>AELPG1208S</strong>.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>p.</strong> I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>q.</strong> I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>r.</strong> I have read the Handbook on Policy, Standards and procedure for Real Estate Valuation, 2011 of the IBA and this report is in conformity to the "Standards" enshrined for valuation in the Part -B of the above handbook to the best of my ability.
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>s.</strong> I am registered under Section 34 AB of the Wealth Tax Act, 1957. (Strike off, if not applicable)
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>t.</strong> I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI). (Strike off, if not applicable)
        </p>
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>u.</strong> My CIBIL Score and credit worthiness is as per Bank's guidelines.
        </p>
                     
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>v.</strong> I am the proprietor / partner / authorized official of the firm / company, who is competent to sign this valuation report.
        </p>
       
        <p style="margin: 8px 0 8px 0; font-size: 11pt; text-align: justify;">
            <strong>w.</strong> I will undertake the valuation work on receipt of Letter of Engagement generated from the system (i.e. LLMS/LOS) only.
        </p>
        <p style="margin: 8px 0 16px 0; font-size: 11pt; text-align: justify;">
            <strong>x.</strong> Further, I hereby provide the following information.
        </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0 0 0; font-size: 11pt; background: #ffffff; table-layout: fixed;">
        <thead>
            <tr style="background: #f0f0f0;">
                <td style="border: 1px solid #333; padding: 10px 12px; font-weight: bold; width: 8%; text-align: left; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Sr.No.</td>
                <td style="border: 1px solid #333; padding: 10px 12px; font-weight: bold; width: 46%; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Particulars</td>
                <td style="border: 1px solid #333; padding: 10px 12px; font-weight: bold; width: 46%; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Valuer comment</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">1</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">background information of the asset being valued;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Referred provided documents</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">2</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">purpose of valuation and appointing authority</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'purposeOfValuation') || safeGet(pdfData, 'valuationPurpose')}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">3</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">identity of the valuer and any other experts involved in the valuation;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Self-assessment</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">4</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">disclosure of valuer interest or conflict, if any;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">N.A.</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">5</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">date of appointment, valuation date and date of report;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Date of Report: ${formatDate(safeGet(pdfData, 'dateOfReport'))}<br/>Date of Visit: ${formatDate(safeGet(pdfData, 'dateOfInspection'))}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">6</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">inspections and/or investigations undertaken;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Yes.</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">7</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">nature and sources of the information used or relied upon;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Local inquiries, brokers, known websites, i.e. magic bricks, 99acre, propertiwala, prop tiger, housing, etc., if available</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">8</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">procedures adopted in carrying out the valuation and valuation standards followed;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Land & Building Method, with Market Approach for Land and Cost Approach for Building.</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">9</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">restrictions on use of the report, if any;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">As per purpose mentioned in report.</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">10</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">major factors that were taken into account during the valuation;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Location of the property, with developing of surroundings, for going-purpose valuation</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">11</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">major factors that were not taken into account during the valuation;</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Future market events and Government Policies.</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 10px 12px; text-align: center; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">12</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of limiting his responsibility for the valuation report.</td>
                <td style="border: 1px solid #333; padding: 10px 12px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">We are not responsible for Title of the subjected property and valuations affected by the same</td>
            </tr>
            <tr>
            <td style="border: 1px solid #333; padding: 12px;"></td>
            <td style="border: 1px solid #333; padding: 12px; vertical-align: top;">
                <p style="margin: 0 0 8px 0; font-size: 11pt; font-weight: bold;">Place:${safeGet(pdfData, 'city')}</p>
                <p style="margin: 0; font-size: 11pt; font-weight: bold;">Date: ${formatDate(safeGet(pdfData, 'dateOfInspection'))}</p>
            </td>
            <td style="border: 1px solid #333; padding: 12px; text-align: center; vertical-align: top;">
                <p style="margin: 0; font-size: 11pt; font-weight: bold;">Rajesh Ganatra</p>
            </td>
        </tr>
        </tbody>
    </table>
    </div>
    
    <!-- End of Annexure-V -->

                  <!-- Annexure-V: Model Code of Conduct Section - Page Break -->
                  <div class="page" style="page-break-after: always; margin: 0; padding: 5px; background: #ffffff; min-height: 297mm; font-weight: normal;">
                    <h2 style="margin: 0 0 8px 0; font-size: 13pt; font-weight: bold; text-align: center; border: none;">(Annexure-V)</h2>
                    
                    <h3 style="margin: 8px 0 8px 0; font-size: 11pt; font-weight: bold; text-align: center;">MODEL CODE OF CONDUCT FOR VALUERS</h3>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Integrity and Fairness</h4>
                    <ol style="margin: 0 0 10px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other valuers.</li>
                      <li style="margin: 4px 0;">A valuer shall maintain integrity by being honest, straightforward, and forthright in all his/its professional relationships.</li>
                      <li style="margin: 4px 0;">A valuer shall endeavor to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.</li>
                      <li style="margin: 4px 0;">A valuer shall refrain from being involved in any action that would bring disrepute to the profession.</li>
                      <li style="margin: 4px 0;">A valuer shall keep public interest foremost while delivering his services.</li>
                    </ol>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Professional Competence and Due Care</h4>
                    <ol start="6" style="margin: 0 0 10px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.</li>
                      <li style="margin: 4px 0;">A valuer shall carry out professional services in accordance with the relevant technical and professional standards that may be specified from time to time.</li>
                      <li style="margin: 4px 0;">A valuer shall continuously maintain professional knowledge and skill to provide competent professional service based on up-to-date developments in practice, prevailing regulations/guidelines and techniques.</li>
                      <li style="margin: 4px 0;">In the preparation of a valuation report, the valuer shall not disclaim liability for his/its expertise or deny his/its duty of care, except to the extent that the assumptions are based on statements of fact provided by the company or its auditors or consultants or information available in public domain and not generated by the valuer.</li>
                      <li style="margin: 4px 0;">A valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.</li>
                      <li style="margin: 4px 0;">A valuer shall clearly state to his client the services that he would be competent to provide and the services for which he would be relying on other valuers or professionals or for which the client can have a separate arrangement with other valuers.</li>
                    </ol>
                    <h4 style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">Independence and Disclosure of Interest</h4>     
                    <ol start="12" style="margin: 0 0 10px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.</li>
                      <li style="margin: 4px 0;">A valuer shall not take up an assignment if he /it or any of his/its relatives or associates is not independent in terms of association to the company.</li>
                    </br>
                    </br>
                     
                      <li style="margin: 4px 0;">A valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.</li>
                      <li style="margin: 4px 0;">A valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.</li>
                      <li style="margin: 4px 0;">A valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.</li>
                     
                      <li style="margin: 4px 0;">A valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client's needs.</li>
                      <li style="margin: 4px 0;">As an independent valuer, the valuer shall not charge success fee.</li>
                      <li style="margin: 4px 0;">In any fairness opinion or independent expert opinion submitted by a valuer, if there has been a prior engagement in an unconnected transaction, the valuer shall declare the association with the company during the last five years.</li>
                    </ol>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Confidentiality</h4>
                    <ol start="20" style="margin: 0 0 10px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.</li>
                    </ol>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Information Management</h4>
                    <ol start="21" style="margin: 0 0 10px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall ensure that he/it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.</li>
                      <li style="margin: 4px 0;">A valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorized by the authority, the registered valuers organization with which he/it is registered or any other statutory regulatory body.</li>
                      <li style="margin: 4px 0;">A valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organization with which he/it is registered, or any other statutory regulatory body.</li>
                      <li style="margin: 4px 0;">A valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.</li>
                    </ol>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Gifts and Hospitality</h4>
                    <ol start="25" style="margin: 0 0 5px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a valuer.<br/><span style="font-style: italic; font-size: 9.5pt;"><strong>Explanation:</strong> For the purposes of this code the term 'relative' shall have the same meaning as defined in clause (77) of Section 2 of the Companies Act, 2013 (18 of 2013).</span></li>
                      <li style="margin: 4px 0;">A valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.</li>
                    </ol>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Remuneration and Costs</h4>
                    <ol start="27" style="margin: 0 0 10px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.</li>
                     
                      <li style="margin: 4px 0;">A valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service. <strong>Occupation, employability and restrictions.</strong></li>
                     
                     
                      <li style="margin: 4px 0;">A valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/its assignments.</li>
                   
                      <li style="margin: 4px 0;">A valuer shall not conduct business which in the opinion of the authority or the registered valuer organisation discredits the profession.</li>
                    </ol>
                    
                    <h4 style="margin: 8px 0 6px 0; font-size: 11pt; font-weight: bold;">Miscellaneous</h4>
                    <ol start="31" style="margin: 0 0 15px 25px; padding: 0; font-size: 10.5pt; line-height: 1.4;">
                      <li style="margin: 4px 0;">A valuer shall refrain from undertaking to review the work of another valuer of the same client except under written orders from the bank or housing finance institutions and with knowledge of the concerned valuer.</li>
                      <li style="margin: 4px 0;">A valuer shall follow this code as amended or revised from time to time.</li>
                    </ol>
                    
                    <div style="margin-top: 60px; padding-top: 10px; page-break-after: always;">
                      <p style="margin: 8px 0 4px 0; font-size: 10pt;"><strong>Signature of the valuer:</strong> _______________________</p>
                      <p style="margin: 4px 0; font-size: 10pt;"><strong>Name of the Valuer:</strong> Rajesh Ganatra</p>
                      <p style="margin: 4px 0; font-size: 10pt;"><strong>Address of the valuer:</strong> 5<sup>th</sup> floor, Shailvik Complex, behind Ganesh Plaza, Opp. Sanmukh Complex, Off. C G Road, Navrangpura, Ahmedabad – 380009</p>
                      <p style="margin: 4px 0; font-size: 10pt;"><strong>Date:</strong> ${formatDate(safeGet(pdfData, 'dateOfInspection'))}</p>
                      <p style="margin: 4px 0; font-size: 10pt;"><strong>Place:</strong>${safeGet(pdfData, 'city')}</p>
                    </div>
                    </div>
                      </div>

${(() => {
  let allImages = [];
  let globalIdx = 0;
  
  if (pdfData.areaImages && typeof pdfData.areaImages === 'object' && Object.keys(pdfData.areaImages).length > 0) {
     Object.entries(pdfData.areaImages).forEach(([areaName, areaImageList]) => {
         if (Array.isArray(areaImageList) && areaImageList.length > 0) {
             areaImageList.forEach((img, idx) => {
                 const imgSrc = typeof img === 'string' ? img : (img?.url || img?.preview || img?.data || img?.src || '');
                 // Only add images with valid, non-empty URLs
                 if (imgSrc && imgSrc.trim() && imgSrc !== 'undefined' && imgSrc !== 'null') {
                     allImages.push({
                         src: imgSrc.trim(),
                         label: areaName + ' - Image ' + (idx + 1),
                         globalIdx: globalIdx++
                     });
                 }
             });
         }
     });
  }

  // Skip entire section if no valid images
  if (allImages.length === 0) {
     return '';
  }

  let pages = [];
  for (let i = 0; i < allImages.length; i += 12) {
     pages.push(allImages.slice(i, i + 12));
  }

  let pageHtml = '';
  let isFirstPage = true;
  pages.forEach((pageImages) => {
     // Filter out images with empty src
     const validImages = pageImages.filter(item => item && item.src && item.src.trim());
     if (validImages.length === 0) return; // Skip empty pages
     
     pageHtml += `
     <div class="page images-section area-images-page" style="padding: 5px 10px; margin: 0; width: 100%; box-sizing: border-box; page-break-after: always;">
          <div style="padding: 5px; font-size: 12pt;">
               ${isFirstPage ? '<h2 style="text-align: center; margin: 0 0 8px 0; font-weight: bold;">PROPERTY AREA IMAGES</h2>' : ''}
               <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin: 0; padding: 0;">
                   ${validImages.map(item => `
                   <div style="border: 1px solid #ddd; padding: 1px; text-align: center; background: #fff; margin: 0;">
                       <img class="pdf-image" src="${getImageSource(item.src)}" alt="${item.label}" style="width: 100%; height: auto; max-height: 275px; object-fit: contain; display: block; margin: 0; padding: 0;" crossorigin="anonymous">
                       <p style="margin: 2px 0 0 0; font-size: 6.5pt; color: #333; font-weight: bold; padding: 0;">${item.label}</p>
                    </div>`).join('')}
               </div>
          </div>
     </div>`;
     isFirstPage = false;
  });
  return pageHtml;
  })()}

<!-- LOCATION IMAGES: Each image gets its own page -->
 ${Array.isArray(pdfData.locationImages) && pdfData.locationImages.length > 0 && pdfData.locationImages.some(img => typeof img === 'string' ? img : img?.url) ? `
   ${pdfData.locationImages.map((img, idx) => {
              const imgSrc = typeof img === 'string' ? img : img?.url;
              return imgSrc ? `
       <div class="page" location-images-page style="width: 100%; page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 12mm; box-sizing: border-box; margin: 0; background: white;">
         <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14pt; color: #000;">LOCATION IMAGE ${idx + 1}</h2>
         <img class="pdf-image" src="${getImageSource(imgSrc)}" alt="Location Image ${idx + 1}" style="width: 100%; height: auto; max-height: 100mm; object-fit: contain; margin: 0 auto; padding: 0; border: none;" crossorigin="anonymous">
       </div>
     ` : '';
          }).join('')}
 ` : ''}

 <!-- SUPPORTING DOCUMENTS: Each document gets its own page -->
   ${Array.isArray(pdfData.documentPreviews) && pdfData.documentPreviews.length > 0 && pdfData.documentPreviews.some(img => typeof img === 'string' ? img : img?.url) ? `
   <div class="supporting-docs-section">
  ${pdfData.documentPreviews.filter(img => {
      const imgSrc = typeof img === 'string' ? img : img?.url;
      return getImageSource(imgSrc);
  }).map((img, idx) => {
      const imgSrc = typeof img === 'string' ? img : img?.url;
      const validImageSrc = getImageSource(imgSrc);
      return `
      <div class="page images-section supporting-docs-page" style="width: 100%; page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12mm; box-sizing: border-box; margin: 0; background: white;">
          ${idx === 0 ? '<h2 style="text-align: center; margin-bottom: 20px; font-weight: bold; width: 100%; font-size: 14pt; color: #000;">SUPPORTING DOCUMENTS</h2>' : ''}
          <div class="image-container" style="border: none; padding: 0; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 100%; height: auto;">
              <img class="pdf-image" src="${validImageSrc}" alt="Supporting Document ${idx + 1}" style="width: 100%; height: auto; max-height: 150mm; object-fit: contain; margin: 0 auto; padding: 0; border: none;" crossorigin="anonymous">
              <p style="margin: 10px 0 0 0; font-size: 9pt; color: #000; text-align: center;">Document ${idx + 1}</p>
          </div>
      </div>
      `;
  }).join('')}
   </div>
   ` : ''}
</div>               
</body>
</html>`;
}

export async function generateRecordPDF(record) {
  try {
      ('📄 Generating PDF for record:', record?.uniqueId || record?.clientName || 'new');
      return await generateRecordPDFOffline(record);
  } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw error;
  }
}

/**
* Preview PDF in a new tab
* Uses client-side generation with blob URL preview
*/
export async function previewValuationPDF(record) {
  try {
      ('👁️ Generating PDF preview for:', record?.uniqueId || record?.clientName || 'new');

      // Dynamically import jsPDF and html2canvas
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Generate HTML from the record data
      const htmlContent = generateValuationReportHTML(record);

      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm';
      container.style.backgroundColor = '#ffffff';
      container.style.fontSize = '12pt';
      container.style.fontFamily = "'Arial', sans-serif";
      // Add fixed page height style for preview with expandable rows
      const style = document.createElement('style');
      style.textContent = `.page { height: 297mm !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; } table { flex: 1 !important; } tbody { height: 100% !important; }`;
      document.head.appendChild(style);
      document.body.appendChild(container);

      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
          scale: 1.6,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          windowHeight: container.scrollHeight,
          windowWidth: 793
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'A4');
      let heightLeft = imgHeight;
      let position = 0;

      // Add pages to PDF
      while (heightLeft >= 0) {
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;
          if (heightLeft > 0) {
              pdf.addPage();
          }
      }

      // Create blob URL and open in new tab
      const blob = pdf.output('blob');
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      ('✅ PDF preview opened');
      return url;
  } catch (error) {
      console.error('❌ PDF preview error:', error);
      throw error;
  }
}

/**
* Compress image and convert to base64
*/
const compressImage = async (blob) => {
  return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const img = new Image();

      img.onload = () => {
          // Scale down image: max 800px width (reduced from 1200)
          const maxWidth = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 65% quality for faster PDF (reduced from 70%)
          canvas.toBlob(
              (compressedBlob) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(compressedBlob);
              },
              'image/jpeg',
              0.65
          );
      };

      img.onerror = () => resolve('');

      const reader = new FileReader();
      reader.onload = (e) => {
          img.src = e.target.result;
      };
      reader.readAsDataURL(blob);
  });
};

/**
* Convert image URL to base64 data URI with compression
*/
const urlToBase64 = async (url) => {
  if (!url) return '';

  try {
      const response = await fetch(url);
      const blob = await response.blob();

      // Compress image to reduce size
      const compressed = await compressImage(blob);
      return compressed;
  } catch (error) {
      console.warn('Failed to convert image to base64:', url, error);
      return '';
  }
};

/**
* Convert all image URLs in record to base64
*/
const convertImagesToBase64 = async (record) => {
  if (!record) return record;

  const recordCopy = { ...record };

  // Convert images in parallel with concurrency limit (max 3 at a time)
  const convertWithLimit = async (images) => {
      if (!Array.isArray(images)) return images;
      
      const results = [];
      const converting = [];
      const MAX_CONCURRENT = 3;
      
      for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const promise = (async () => {
              if (!img) return img;
              const url = typeof img === 'string' ? img : img?.url;
              if (!url) return img;

              const base64 = await urlToBase64(url);
              if (typeof img === 'string') {
                  return base64 || img;
              }
              return { ...img, url: base64 || url };
          })();
          
          results.push(promise);
          converting.push(promise);
          
          // Keep max 3 concurrent conversions
          if (converting.length >= MAX_CONCURRENT) {
              await Promise.race(converting);
              converting.splice(0, 1);
          }
      }
      
      return Promise.all(results);
  };

  // Convert property images
  if (Array.isArray(recordCopy.propertyImages)) {
      recordCopy.propertyImages = await convertWithLimit(recordCopy.propertyImages);
  }

  // Convert location images
  if (Array.isArray(recordCopy.locationImages)) {
      recordCopy.locationImages = await convertWithLimit(recordCopy.locationImages);
  }

  return recordCopy;
};

/**
* Client-side PDF generation using jsPDF + html2canvas
* Works on Vercel without server-side dependencies
*/
export async function generateRecordPDFOffline(record) {
  try {
       ('📠 Generating PDF (client-side mode)');

      // Convert images to base64 for PDF embedding (with timeout limit)
       ('🖼️ Converting images to base64...');
       // Set 30 second timeout for entire image conversion to avoid hanging
       const imageConversionPromise = convertImagesToBase64(record);
       const recordWithBase64Images = await Promise.race([
           imageConversionPromise,
           new Promise((_, reject) => setTimeout(() => reject(new Error('Image conversion timeout')), 30000))
       ]).catch((err) => {
           console.warn('⚠️ Image conversion timeout or error:', err.message);
           return record; // Fall back to original if conversion fails
       });

      // Dynamically import jsPDF and html2canvas to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

       let htmlContent = generateValuationReportHTML(recordWithBase64Images);

      // Split HTML content by page break sections (location images, property images, etc.)
      const locationImagesIndex = htmlContent.indexOf('location-images-page');
      const propertyImagesIndex = htmlContent.indexOf('property-images-page');
      const supportingDocsIndex = htmlContent.indexOf('supporting-docs-page');

      (`🔍 Detected location-images-page at index: ${locationImagesIndex}`);
      (`🔍 Detected property-images-page at index: ${propertyImagesIndex}`);
      (`🔍 Detected supporting-docs-page at index: ${supportingDocsIndex}`);

      // Find all sections and extract them
      const sections = [
          { name: 'propertyImages', index: propertyImagesIndex },
          { name: 'locationImages', index: locationImagesIndex },
          { name: 'supportingDocs', index: supportingDocsIndex }
      ].filter(s => s.index !== -1).sort((a, b) => a.index - b.index);

      if (sections.length > 0) {
          // Extract sections for separate rendering
          for (let i = 0; i < sections.length; i++) {
              const section = sections[i];
              const sectionStart = htmlContent.lastIndexOf('<div', section.index);
              (`✂️ Processing ${section.name} section at position ${sectionStart}`);
          }
      }
      ('✂️ Split HTML: Sections identified - Location Images, Property Images, Supporting Docs');

    
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm';
      container.style.height = 'auto';
      container.style.backgroundColor = '#ffffff';
      container.style.fontSize = '12pt';
      container.style.fontFamily = "'Arial', sans-serif";
      document.body.appendChild(container);

      // CRITICAL: Wait for images to load, then remove failed ones
      const allImages = container.querySelectorAll('img.pdf-image');
      const imagesToRemove = new Set();

      // First pass: check for images with invalid src attribute
      allImages.forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          const alt = img.getAttribute('alt') || 'unknown';

          // If image has no src or invalid src, mark container for removal
          if (!src || !src.trim() || src === 'undefined' || src === 'null') {
              (`⏭️ Invalid image src: ${alt}`);
              let parentContainer = img.closest('.image-container');
              if (parentContainer) {
                  imagesToRemove.add(parentContainer);
                  (`⏭️ Marking for removal (invalid src): ${alt}`);
              }
          }
      });

      // Second pass: add error listeners to detect failed load attempts
       await Promise.all(Array.from(allImages).map(img => {
           return new Promise((resolve) => {
               const alt = img.getAttribute('alt') || 'unknown';
               const timeoutId = setTimeout(() => {
                   // If image hasn't loaded after 3 seconds, mark for removal
                   if (!img.complete || img.naturalHeight === 0) {
                       (`⏭️ Image timeout/failed to load: ${alt}`);
                       let parentContainer = img.closest('.image-container');
                       if (parentContainer) {
                           imagesToRemove.add(parentContainer);
                           (`⏭️ Marking for removal (timeout): ${alt}`);
                       }
                   }
                   resolve();
               }, 3000);

              img.onload = () => {
                  clearTimeout(timeoutId);
                  (`✅ Image loaded successfully: ${alt}`);
                  resolve();
              };

              img.onerror = () => {
                  clearTimeout(timeoutId);
                  (`❌ Image failed to load: ${alt}`);
                  let parentContainer = img.closest('.image-container');
                  if (parentContainer) {
                      imagesToRemove.add(parentContainer);
                      (`⏭️ Marking for removal (onerror): ${alt}`);
                  }
                  resolve();
              };

              // If already loaded, resolve immediately
              if (img.complete) {
                  clearTimeout(timeoutId);
                  if (img.naturalHeight === 0) {
                      (`⏭️ Image failed (no height): ${alt}`);
                      let parentContainer = img.closest('.image-container');
                      if (parentContainer) {
                          imagesToRemove.add(parentContainer);
                          (`⏭️ Marking for removal (no height): ${alt}`);
                      }
                  } else {
                      (`✅ Image already loaded: ${alt}`);
                  }
                  resolve();
              }
          });
      }));

      // Remove only failed/invalid image containers
      (`🗑️ Removing ${imagesToRemove.size} failed/invalid image containers`);
      imagesToRemove.forEach(el => {
          const alt = el.querySelector('img')?.getAttribute('alt') || 'unknown';
          (`✂️ Removed container: ${alt}`);
          el.remove();
      });

      ('✅ Image validation complete - now extracting images BEFORE rendering...');

      // Extract images and remove image pages BEFORE rendering to prevent duplicates
      ('⏳ Extracting images and removing image pages from HTML before rendering...');
      const images = Array.from(container.querySelectorAll('img.pdf-image'));
      const imageData = [];

      // Extract valid images
      for (const img of images) {
          const src = img.src || img.getAttribute('data-src');
          const label = img.getAttribute('alt') || 'Image';

          // Only extract images with valid src
          if (src && (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http'))) {
              imageData.push({
                  src,
                  label,
                  type: label.includes('Location') ? 'location' :
                      label.includes('Supporting') ? 'supporting' : 'property'
              });
              (`📸 Extracted image: ${label}`);
          }
      }

      // Remove all image pages and sections from DOM before rendering (they will be added manually later)
      // First, remove wrapper sections (like supporting-docs-section)
      const supportingDocsSection = container.querySelector('.supporting-docs-section');
      if (supportingDocsSection) {
          (`🗑️ Removing supporting-docs-section wrapper from HTML`);
          supportingDocsSection.remove();
      }
      
      // Find all .page elements (including nested ones)
      const allPageElements = Array.from(container.querySelectorAll('.page'));
      const imagePagesToRemove = [];
      
      allPageElements.forEach(pageEl => {
          // Identify image pages - check all possible image page types
          const hasLocationImages = pageEl.hasAttribute('location-images-page');
          const hasSupportingDocs = pageEl.classList.contains('supporting-docs-page');
          const hasAreaImages = pageEl.classList.contains('area-images-page'); // Property area images
          const hasImagesSection = pageEl.classList.contains('images-section');
          const hasImageContainer = pageEl.querySelector('.image-container');
          const hasPdfImages = pageEl.querySelector('img.pdf-image');
          
          // Remove if it's any type of image page
          if (hasLocationImages || hasSupportingDocs || hasAreaImages ||
              (hasImagesSection && hasPdfImages) || (hasImageContainer && hasImagesSection)) {
              imagePagesToRemove.push(pageEl);
              (`🗑️ Removing image page from HTML (will be handled manually): ${pageEl.className || 'unnamed'}`);
          }
      });
      
      // Remove image pages from DOM
      imagePagesToRemove.forEach(pageEl => pageEl.remove());
      
      // Filter remaining pages for rendering (only direct children of container)
      const pageElements = Array.from(container.querySelectorAll(':scope > .page'));
      
      (`📄 Total .page elements found: ${allPageElements.length}, rendering ${pageElements.length} (removed ${imagePagesToRemove.length} image pages)`);

      // CRITICAL: Render continuous-wrapper and .page elements separately for proper page breaks
      const continuousWrapper = container.querySelector('.continuous-wrapper');
      
      // Remove image sections from continuous-wrapper if any exist
      if (continuousWrapper) {
          const imageSectionsInWrapper = continuousWrapper.querySelectorAll('.images-section, [location-images-page], .supporting-docs-section, .area-images-page');
          if (imageSectionsInWrapper.length > 0) {
              (`🗑️ Removing ${imageSectionsInWrapper.length} image sections from continuous-wrapper`);
              imageSectionsInWrapper.forEach(section => section.remove());
          }
      }

      // Render continuous wrapper first
      let mainCanvas = null;
      if (continuousWrapper) {
          mainCanvas = await html2canvas(continuousWrapper, {
              scale: 1.2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: true,
              imageTimeout: 5000,
              windowHeight: continuousWrapper.scrollHeight,
              windowWidth: 793,
              removeContainer: true,
              onclone: (clonedDocument) => {
                  const clonedImages = clonedDocument.querySelectorAll('img');
                  clonedImages.forEach(img => {
                      img.crossOrigin = 'anonymous';
                      img.loading = 'eager';
                      img.style.display = 'block';
                      img.style.visibility = 'visible';
                  });
              }
          });
          ('✅ Continuous wrapper canvas conversion complete');
      }

      // Render each .page separately for proper page breaks
      const pageCanvases = [];
      for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i];
          (`📄 Rendering .page element ${i + 1}/${pageElements.length}`);

          // Temporarily remove padding to render from top
          const originalPadding = pageEl.style.padding;
          pageEl.style.padding = '0';
          pageEl.style.margin = '0';

          const pageCanvas = await html2canvas(pageEl, {
              scale: 1.2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: true,
              imageTimeout: 5000,
              windowHeight: pageEl.scrollHeight,
              windowWidth: 793,
              x: 0,
              y: 0,
              removeContainer: true,
              onclone: (clonedDocument) => {
                  const clonedPageEl = clonedDocument.querySelector('.page') || clonedDocument;
                  clonedPageEl.style.padding = '0';
                  clonedPageEl.style.margin = '0';

                  const clonedImages = clonedDocument.querySelectorAll('img');
                  clonedImages.forEach(img => {
                      img.crossOrigin = 'anonymous';
                      img.loading = 'eager';
                      img.style.display = 'block';
                      img.style.visibility = 'visible';
                  });
              }
          });

          // Restore original padding
          pageEl.style.padding = originalPadding;

          pageCanvases.push(pageCanvas);
          (`✅ .page ${i + 1} canvas conversion complete`);
      }

      (`✅ Page rendering complete - ${pageCanvases.length} .page elements rendered separately`);
      (`✅ Images already extracted before rendering: ${imageData.length} images`);

      // Remove temporary container now that we've extracted images
      document.body.removeChild(container);
      ('✅ Container removed from DOM');

      // Create PDF from main canvas with header/footer margins
      // Use JPEG for better compression instead of PNG
      const imgData = mainCanvas.toDataURL('image/jpeg', 0.85);
      const imgWidth = 210;
      const pageHeight = 297;
      const headerHeight = 40;  // 10mm header space
      const footerHeight = 40;  // 10mm footer space
      const usableHeight = pageHeight - headerHeight - footerHeight;
      const imgHeight = (mainCanvas.height * imgWidth) / mainCanvas.width;

      // Function to find safe break point (avoid splitting rows)
      const findSafeBreakPoint = (canvasHeight, startPixel, maxHeightPixels, isFirstPage = false, isLastPage = false) => {
          try {
              // Ensure we're within bounds
              const safeStartPixel = Math.max(0, Math.floor(startPixel));
              const safeHeight = Math.min(maxHeightPixels, canvasHeight - safeStartPixel);

              if (safeHeight <= 0) {
                  return maxHeightPixels;
              }

              // Get image data to detect row boundaries
              const ctx = mainCanvas.getContext('2d');
              const width = Math.floor(mainCanvas.width);
              const height = Math.floor(safeHeight);

              const imageData = ctx.getImageData(0, safeStartPixel, width, height);
              const data = imageData.data;

              // Look for horizontal lines (table borders) by scanning for rows of dark pixels
              let lastBlackRowIndex = 0;
              let borderThickness = 0;

              const pixelsPerRow = width * 4; // RGBA = 4 bytes per pixel
              const rowCount = height;
              let inBorder = false;
              const borderRows = [];

              for (let row = 0; row < rowCount; row++) {
                  let blackCount = 0;
                  const rowStart = row * pixelsPerRow;

                  // Count dark pixels in this row
                  for (let col = 0; col < width; col++) {
                      const idx = rowStart + col * 4;
                      const r = data[idx];
                      const g = data[idx + 1];
                      const b = data[idx + 2];

                      // Check if pixel is dark (table border)
                      if (r < 150 && g < 150 && b < 150) {
                          blackCount++;
                      }
                  }

                  // If >60% of row is dark, it's a border line
                  if (blackCount > width * 0.6) {
                      if (!inBorder) {
                          inBorder = true;
                          borderThickness = 1;
                          borderRows.push(row);
                      } else {
                          borderThickness++;
                      }
                      lastBlackRowIndex = row;
                  } else {
                      inBorder = false;
                  }
              }



              // Return the last safe break point (after the border)
              if (lastBlackRowIndex > 0 && lastBlackRowIndex < rowCount - 5) {
                  return lastBlackRowIndex;
              }
          } catch (err) {
              console.warn('Error finding safe break point:', err?.message);
          }

          // Fallback to original height if detection fails
          return maxHeightPixels;
      };

      // Detect Y position of c-valuation-section for forced page break
      const cValuationElement = continuousWrapper?.querySelector('.c-valuation-section');
      let cValuationYPixels = null;
      if (cValuationElement) {
          const rect = cValuationElement.getBoundingClientRect();
          const wrapperRect = continuousWrapper.getBoundingClientRect();
          const relativeY = rect.top - wrapperRect.top;
          cValuationYPixels = relativeY * 1.5; // Apply same scale as canvas
          (`🔍 C. VALUATION DETAILS section found at Y: ${cValuationYPixels}px (canvas coordinates)`);
      }

      // Detect Y position of images page wrapper for forced page break
      const imagesPageWrapper = container?.querySelector('.images-page-wrapper');
      let imagesPageBreakYPixels = null;
      if (imagesPageWrapper) {
          const rect = imagesPageWrapper.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeY = rect.top - containerRect.top;
          imagesPageBreakYPixels = relativeY * 1.5; // Apply same scale as canvas
          (`🔍 IMAGES PAGE WRAPPER found at Y: ${relativeY}px (DOM) -> ${imagesPageBreakYPixels}px (canvas coordinates)`);
          (`   Canvas height: ${mainCanvas.height}px, Total content height: ${imgHeight}mm, Usable per page: ~257mm`);
      } else {
          (`⚠️ IMAGES PAGE WRAPPER (.images-page-wrapper) NOT found in container`);
      }

      const pdf = new jsPDF('p', 'mm', 'A4');
      let pageNumber = 1;
      let heightLeft = imgHeight;
      let yPosition = 0;
      let sourceY = 0;  // Track position in the source canvas
      let cValuationPageBreakHandled = false;  // Track if we've handled the page break
      let imagesPageBreakHandled = false;  // Track if we've handled the page break for property images
      let pageAdded = false;  // Track if first page is added to prevent empty page
      let currentPageYPosition = headerHeight;  // Track current Y position on page to avoid empty pages

      while (heightLeft > 5) {  // Only continue if there's meaningful content left (>5mm to avoid blank pages)
          // Check if we need to force a page break for IMAGES section
          if (!imagesPageBreakHandled && imagesPageBreakYPixels !== null) {
              const sourceYPixels = (sourceY / imgHeight) * mainCanvas.height;
              const nextSourceYPixels = sourceYPixels + (Math.min(usableHeight, heightLeft) / imgHeight) * mainCanvas.height;

              // If images section will be on this page, force it to next page instead
              if (sourceYPixels < imagesPageBreakYPixels && nextSourceYPixels > imagesPageBreakYPixels) {
                  (`⚠️ IMAGES would split across pages, forcing to new page (currently on page ${pageNumber})`);
                  if (pageNumber > 1) {
                      pdf.addPage();
                      pageNumber++;
                  }
                  imagesPageBreakHandled = true;
                  // Skip remaining content and restart from images break marker
                  sourceY = (imagesPageBreakYPixels / mainCanvas.height) * imgHeight;
                  heightLeft = imgHeight - sourceY;
                  continue;
              } else if (sourceYPixels >= imagesPageBreakYPixels && sourceYPixels < imagesPageBreakYPixels + 50) {
                  // We're at the images break marker, mark it handled
                  imagesPageBreakHandled = true;
                  (`✅ IMAGES is starting on new page as expected (page ${pageNumber})`);
              }
          }

          // Check if we need to force a page break for C. VALUATION DETAILS section
          if (!cValuationPageBreakHandled && cValuationYPixels !== null) {
              const sourceYPixels = (sourceY / imgHeight) * mainCanvas.height;
              const nextSourceYPixels = sourceYPixels + (Math.min(usableHeight, heightLeft) / imgHeight) * mainCanvas.height;

              // If C. VALUATION section will be on this page, force it to next page instead
              if (sourceYPixels < cValuationYPixels && nextSourceYPixels > cValuationYPixels && pageNumber > 1) {
                  (`⚠️ C. VALUATION DETAILS would split, forcing to new page`);
                  pdf.addPage();
                  pageNumber++;
                  cValuationPageBreakHandled = true;
                  // Skip remaining content and restart from C. VALUATION section
                  sourceY = (cValuationYPixels / mainCanvas.height) * imgHeight;
                  heightLeft = imgHeight - sourceY;
                  continue;
              } else if (sourceYPixels >= cValuationYPixels && sourceYPixels < cValuationYPixels + 100) {
                  // We're at the C. VALUATION section, mark it handled
                  cValuationPageBreakHandled = true;
                  (`✅ C. VALUATION DETAILS is on new page as expected`);
              }
          }

          // Calculate how much of the image fits on this page
          let imageHeightForThisPage = Math.min(usableHeight, heightLeft);

          // Calculate the crop region from the canvas
          const canvasHeight = mainCanvas.height;
          const canvasWidth = mainCanvas.width;
          const sourceYPixels = (sourceY / imgHeight) * canvasHeight;
          const maxHeightPixels = (imageHeightForThisPage / imgHeight) * canvasHeight;

          // Check if this is first or last page
          const isFirstPage = pageNumber === 1;
          const isLastPage = heightLeft - imageHeightForThisPage <= 0;

          // Apply bold borders BEFORE finding safe break point
          const ctx = mainCanvas.getContext('2d');
          const width = Math.floor(mainCanvas.width);
          const height = Math.floor(maxHeightPixels);

          // Guard against getImageData with 0 height
          if (height <= 0) {
              console.warn('⚠️ Height is 0 or negative, skipping image data operations');
              heightLeft -= imageHeightForThisPage;
              sourceY += imageHeightForThisPage;
              pageNumber++;
              if (heightLeft > 0) {
                  pdf.addPage();
              }
              continue;
          }

          const imageData = ctx.getImageData(0, Math.floor(sourceYPixels), width, height);
          const data = imageData.data;
          const pixelsPerRow = width * 4;

          // Calculate table boundaries (table is approximately in center, ~645px wide at 1.5x scale = ~430px at normal view)
          // But we need to find it dynamically from the actual border pixels
          let tableLeftBound = 0;
          let tableRightBound = width;

          // Find table left boundary by looking for first vertical line of dark pixels
          for (let col = 0; col < Math.min(200, width); col++) {
              let darkCount = 0;
              for (let row = 10; row < Math.min(50, height); row++) {
                  const idx = (row * pixelsPerRow) + (col * 4);
                  if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
                      darkCount++;
                  }
              }
              if (darkCount > 10) {
                  tableLeftBound = col;
                  break;
              }
          }

          // Find table right boundary by looking for last vertical line of dark pixels
          for (let col = width - 1; col > tableLeftBound + 100; col--) {
              let darkCount = 0;
              for (let row = 10; row < Math.min(50, height); row++) {
                  const idx = (row * pixelsPerRow) + (col * 4);
                  if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
                      darkCount++;
                  }
              }
              if (darkCount > 10) {
                  tableRightBound = col;
                  break;
              }
          }

          // Find top border (first border row in this section)
          if (!isFirstPage) {
              for (let row = 0; row < Math.min(50, height); row++) {
                  let blackCount = 0;
                  const rowStart = row * pixelsPerRow;
                  // Only count dark pixels within table bounds
                  for (let col = tableLeftBound; col < tableRightBound; col++) {
                      const idx = rowStart + col * 4;
                      if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
                          blackCount++;
                      }
                  }
                  const tableWidth = tableRightBound - tableLeftBound;
                  if (blackCount > tableWidth * 0.6) {
                      // Make top border bold - only within table bounds
                      for (let offset = -2; offset <= 2; offset++) {
                          const boldRow = row + offset;
                          if (boldRow >= 0 && boldRow < height) {
                              const boldRowStart = boldRow * pixelsPerRow;
                              // Only darken pixels within table bounds
                              for (let col = tableLeftBound; col < tableRightBound; col++) {
                                  const idx = boldRowStart + col * 4;
                                  // Preserve original color, just increase opacity/saturation
                                  data[idx] = Math.min(255, data[idx] * 0.5);      // R - darken
                                  data[idx + 1] = Math.min(255, data[idx + 1] * 0.5);  // G - darken
                                  data[idx + 2] = Math.min(255, data[idx + 2] * 0.5);  // B - darken
                                  data[idx + 3] = 255; // A
                              }
                          }
                      }
                      break;
                  }
              }
          }

          // Find bottom border (last border row in this section)
          if (!isLastPage) {
              for (let row = height - 1; row >= Math.max(0, height - 50); row--) {
                  let blackCount = 0;
                  const rowStart = row * pixelsPerRow;
                  // Only count dark pixels within table bounds
                  for (let col = tableLeftBound; col < tableRightBound; col++) {
                      const idx = rowStart + col * 4;
                      if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
                          blackCount++;
                      }
                  }
                  const tableWidth = tableRightBound - tableLeftBound;
                  if (blackCount > tableWidth * 0.6) {
                      // Make bottom border bold - only within table bounds
                      for (let offset = -2; offset <= 2; offset++) {
                          const boldRow = row + offset;
                          if (boldRow >= 0 && boldRow < height) {
                              const boldRowStart = boldRow * pixelsPerRow;
                              // Only darken pixels within table bounds
                              for (let col = tableLeftBound; col < tableRightBound; col++) {
                                  const idx = boldRowStart + col * 4;
                                  // Preserve original color, just increase opacity/saturation
                                  data[idx] = Math.min(255, data[idx] * 0.5);      // R - darken
                                  data[idx + 1] = Math.min(255, data[idx + 1] * 0.5);  // G - darken
                                  data[idx + 2] = Math.min(255, data[idx + 2] * 0.5);  // B - darken
                                  data[idx + 3] = 255; // A
                              }
                          }
                      }
                      break;
                  }
              }
          }

          ctx.putImageData(imageData, 0, Math.floor(sourceYPixels));

          // Find safe break point to avoid splitting rows
          const safeHeightPixels = findSafeBreakPoint(canvasHeight, sourceYPixels, maxHeightPixels, isFirstPage, isLastPage);
          const sourceHeightPixels = Math.min(safeHeightPixels, maxHeightPixels);

          // Recalculate the actual height used
          imageHeightForThisPage = (sourceHeightPixels / canvasHeight) * imgHeight;

          // Create a cropped canvas for this page
          const croppedPageCanvas = document.createElement('canvas');
          croppedPageCanvas.width = canvasWidth;
          croppedPageCanvas.height = sourceHeightPixels;
          const pageCtx = croppedPageCanvas.getContext('2d');
          pageCtx.drawImage(
              mainCanvas,
              0, sourceYPixels,
              canvasWidth, sourceHeightPixels,
              0, 0,
              canvasWidth, sourceHeightPixels
          );

          const pageImgData = croppedPageCanvas.toDataURL('image/jpeg', 0.85);

          // Only add content if it has meaningful height (avoid blank pages)
          if (imageHeightForThisPage > 2) {  // Only add if >2mm height
              // Only add new page if not first page - first page already exists from jsPDF init
              if (pageAdded) {
                  pdf.addPage();
              } else {
                  pageAdded = true;
              }

              // Add image with top margin (header space)
              pdf.addImage(pageImgData, 'JPEG', 0, headerHeight, imgWidth, imageHeightForThisPage);

              // Add page number in footer
              pdf.setFontSize(9);
              pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });

              // Update Y position tracking
              currentPageYPosition = headerHeight + imageHeightForThisPage;

              pageNumber++;
          }

          // Update counters
          heightLeft -= imageHeightForThisPage;
          sourceY += imageHeightForThisPage;
      }

      // Reset currentPageYPosition since we're starting new section for separate .page elements
      currentPageYPosition = headerHeight;

      // Add page canvases as separate pages in PDF
      (`📄 Adding ${pageCanvases.length} separate .page canvases to PDF...`);
      for (let i = 0; i < pageCanvases.length; i++) {
          const pageCanvas = pageCanvases[i];
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
          const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

          // Only add new page if there's substantial content on current page (more than just header space)
          // currentPageYPosition > headerHeight + 20 means there's at least 20mm of content
          if (currentPageYPosition > headerHeight + 20) {
              pdf.addPage();
              pageNumber++;
              currentPageYPosition = headerHeight;
              (`📄 Added new page for .page element ${i + 1}`);
          } else {
              (`📄 Skipping new page for .page element ${i + 1} - minimal content on current page`);
              // If on current page with minimal content, just continue on same page
              // currentPageYPosition already at headerHeight, ready for new content
          }

          // Add image with proper margins (12mm = ~45px at 96dpi)
          const leftMargin = 12;
          const topMargin = 12;
          const availableWidth = imgWidth - (leftMargin * 2);
          const adjustedImgHeight = (pageCanvas.height * availableWidth) / pageCanvas.width;

          pdf.addImage(pageImgData, 'JPEG', leftMargin, topMargin, availableWidth, adjustedImgHeight);
          pdf.setFontSize(9);
          pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });

          // Update Y position tracking
          currentPageYPosition = topMargin + adjustedImgHeight;

          pageNumber++;
          (`✅ Added .page canvas ${i + 1} as page ${pageNumber - 1}`);
      }

      // Add images as separate pages
      ('📸 Adding', imageData.length, 'images to PDF...');

      // Filter out images with invalid src before adding to PDF
      const validImages = imageData.filter(img => {
          if (!img.src || typeof img.src !== 'string' || !img.src.trim()) {
              (`⏭️ Skipping image with invalid src: ${img.label}`);
              return false;
          }
          return true;
      });

      if (validImages.length > 0) {
          // Separate images by type
          const propertyImgs = validImages.filter(img => img.type === 'property');
          const locationImgs = validImages.filter(img => img.type === 'location');
          const supportingImgs = validImages.filter(img => img.type === 'supporting');

          // Helper function to load and convert image to canvas with proper scaling
          const loadImageToCanvas = async (imageSrc) => {
              return new Promise((resolve, reject) => {
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  
                  img.onload = () => {
                      try {
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          
                          // Set canvas dimensions to match image
                          canvas.width = img.width;
                          canvas.height = img.height;
                          
                          // Draw image to canvas
                          ctx.drawImage(img, 0, 0);
                          
                          resolve(canvas);
                      } catch (error) {
                          reject(error);
                      }
                  };
                  
                  img.onerror = () => {
                      reject(new Error('Failed to load image'));
                  };
                  
                  img.src = imageSrc;
              });
          };

          // Helper function to calculate image dimensions after scaling
          const calculateImageDimensions = (canvas, maxWidth, maxHeight) => {
              const imgWidth = canvas.width;
              const imgHeight = canvas.height;
              
              // Calculate scaling to fit within maxWidth and maxHeight while maintaining aspect ratio
              const scaleX = maxWidth / imgWidth;
              const scaleY = maxHeight / imgHeight;
              const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
              
              return {
                  width: imgWidth * scale,
                  height: imgHeight * scale
              };
          };

          // Helper function to add image to PDF with proper scaling (contain behavior)
          const addImageToPDF = (pdf, canvas, x, y, maxWidth, maxHeight, label = '') => {
              const dimensions = calculateImageDimensions(canvas, maxWidth, maxHeight);
              
              // Convert canvas to image data
              const imgData = canvas.toDataURL('image/jpeg', 0.92);
              
              // Add image to PDF
              pdf.addImage(imgData, 'JPEG', x, y, dimensions.width, dimensions.height);
              
              return dimensions;
          };

          // Helper function to create a cropped canvas with cover behavior (object-fit: cover)
          // Creates a canvas with fixed pixel dimensions that will be rendered at containerWidthMM x containerHeightMM in PDF
          const createCoverCanvas = (sourceCanvas, containerWidthMM, containerHeightMM) => {
              const imgWidth = sourceCanvas.width;
              const imgHeight = sourceCanvas.height;
              
              // Use a fixed high resolution for canvas (300 DPI: ~11.8 pixels per mm)
              // This ensures good quality when rendered in PDF
              const pixelsPerMM = 11.8;
              const canvasWidthPx = Math.round(containerWidthMM * pixelsPerMM);
              const canvasHeightPx = Math.round(containerHeightMM * pixelsPerMM);
              
              // Calculate scaling to fill canvas (cover behavior)
              const scaleX = canvasWidthPx / imgWidth;
              const scaleY = canvasHeightPx / imgHeight;
              const scale = Math.max(scaleX, scaleY); // Use max to fill container
              
              // Calculate scaled dimensions
              const scaledWidth = imgWidth * scale;
              const scaledHeight = imgHeight * scale;
              
              // Calculate source crop area (center of scaled image)
              const sourceX = (scaledWidth - canvasWidthPx) / 2 / scale;
              const sourceY = (scaledHeight - canvasHeightPx) / 2 / scale;
              const sourceWidth = canvasWidthPx / scale;
              const sourceHeight = canvasHeightPx / scale;
              
              // Create new canvas with fixed dimensions
              const croppedCanvas = document.createElement('canvas');
              croppedCanvas.width = canvasWidthPx;
              croppedCanvas.height = canvasHeightPx;
              const ctx = croppedCanvas.getContext('2d');
              
              // Set high quality rendering
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              // Draw the cropped portion of the source image to fill the canvas
              ctx.drawImage(
                  sourceCanvas,
                  Math.max(0, sourceX), Math.max(0, sourceY), 
                  Math.min(imgWidth, sourceWidth), Math.min(imgHeight, sourceHeight),  // Source rectangle
                  0, 0, canvasWidthPx, canvasHeightPx  // Destination rectangle (always full canvas)
              );
              
              return croppedCanvas;
          };

          // Helper function to add image with cover behavior (object-fit: cover)
          // All images will be exactly the same size: containerWidth x containerHeight
          const addImageToPDFCover = (pdf, canvas, x, y, containerWidth, containerHeight) => {
              // Create a cropped canvas that's exactly containerWidth x containerHeight
              const croppedCanvas = createCoverCanvas(canvas, containerWidth, containerHeight);
              
              // Convert cropped canvas to image data
              const imgData = croppedCanvas.toDataURL('image/jpeg', 0.92);
              
              // Add image to PDF at exact container size
              pdf.addImage(imgData, 'JPEG', x, y, containerWidth, containerHeight);
              
              // Return fixed container dimensions
              return {
                  width: containerWidth,
                  height: containerHeight
              };
          };

          // ===== PROPERTY IMAGES: 3x4 Grid on one page + one per page =====
          if (propertyImgs.length > 0) {
              // First, add 3x4 grid page (up to 12 images)
              const gridImages = propertyImgs.slice(0, 12);
              if (gridImages.length > 0) {
                  pdf.addPage();
                  pageNumber++;
                  
                  // Add heading on first page
                  pdf.setFontSize(14);
                  pdf.setFont(undefined, 'bold');
                  pdf.text('PROPERTY IMAGES', 105, 15, { align: 'center' });
                  
                  // Grid layout: 3 columns x 4 rows with FIXED sizes
                   const gridCols = 3;
                   const gridRows = 4;
                   const topMargin = 25; // Space for heading
                   const bottomMargin = 10;
                   const cellSpacing = 2; // Spacing between cells
                   const cellWidth = 55; // Fixed cell width (mm)
                   const imageHeight = 45; // Fixed image height (mm)
                   const labelHeight = 6; // Fixed label height (mm)
                   
                   // Calculate grid width and center it on page
                   const gridWidth = gridCols * cellWidth + (gridCols - 1) * cellSpacing;
                   const pageWidth = 210; // A4 width in mm
                   const centerMargin = (pageWidth - gridWidth) / 2; // Center the grid horizontally
                  
                  for (let i = 0; i < gridImages.length; i++) {
                      const img = gridImages[i];
                      const row = Math.floor(i / gridCols);
                      const col = i % gridCols;
                      
                      const x = centerMargin + col * (cellWidth + cellSpacing);
                      const y = topMargin + row * (imageHeight + labelHeight + cellSpacing);
                      
                      try {
                          const canvas = await loadImageToCanvas(img.src);
                          // Add image with cover behavior - all images same fixed size
                          const imageSize = addImageToPDFCover(pdf, canvas, x, y, cellWidth, imageHeight);
                          
                          // Add label directly below image - always at fixed position with more spacing
                           pdf.setFontSize(7);
                           pdf.setFont(undefined, 'normal');
                           const labelSpacing = 3; // Increased spacing between image and label (mm)
                           const labelY = y + imageHeight + labelSpacing; // Fixed position below image container with spacing
                           if (labelY < pageHeight - 5) {
                               const labelText = img.label || `Image ${i + 1}`;
                               pdf.text(labelText, x + cellWidth / 2, labelY, { align: 'center', maxWidth: cellWidth });
                           }
                          
                          (`✅ Added property image to grid (${row + 1}, ${col + 1}): ${img.label}`);
                      } catch (err) {
                          console.warn(`Failed to add property image to grid ${img.label}:`, err?.message);
                      }
                  }
                  
                  // Add page number
                  pdf.setFontSize(9);
                  pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });
              }
              
              // Then add remaining property images in grid (3x4 per page)
              const remainingPropertyImgs = propertyImgs.slice(12);
              if (remainingPropertyImgs.length > 0) {
                  // Process remaining images in batches of 12 (3x4 grid)
                  for (let batchStart = 0; batchStart < remainingPropertyImgs.length; batchStart += 12) {
                      const batchEnd = Math.min(batchStart + 12, remainingPropertyImgs.length);
                      const batchImages = remainingPropertyImgs.slice(batchStart, batchEnd);
                      
                      pdf.addPage();
                      pageNumber++;
                      
                      // Grid layout: 3 columns x 4 rows with FIXED sizes
                      const gridCols = 3;
                      const gridRows = 4;
                      const topMargin = 20; // No heading for continuation pages
                      const bottomMargin = 10;
                      const cellSpacing = 2; // Spacing between cells
                      const cellWidth = 55; // Fixed cell width (mm)
                      const imageHeight = 45; // Fixed image height (mm)
                      const labelHeight = 6; // Fixed label height (mm)
                      
                      // Calculate grid width and center it on page
                      const gridWidth = gridCols * cellWidth + (gridCols - 1) * cellSpacing;
                      const pageWidth = 210; // A4 width in mm
                      const centerMargin = (pageWidth - gridWidth) / 2; // Center the grid horizontally
                      
                      for (let i = 0; i < batchImages.length; i++) {
                          const img = batchImages[i];
                          const row = Math.floor(i / gridCols);
                          const col = i % gridCols;
                          
                          const x = centerMargin + col * (cellWidth + cellSpacing);
                          const y = topMargin + row * (imageHeight + labelHeight + cellSpacing);
                          
                          try {
                              const canvas = await loadImageToCanvas(img.src);
                              // Add image with cover behavior - all images same fixed size
                              const imageSize = addImageToPDFCover(pdf, canvas, x, y, cellWidth, imageHeight);
                              
                              // Add label directly below image - always at fixed position with more spacing
                              pdf.setFontSize(7);
                              pdf.setFont(undefined, 'normal');
                              const labelSpacing = 3; // Increased spacing between image and label (mm)
                              const labelY = y + imageHeight + labelSpacing; // Fixed position below image container with spacing
                              if (labelY < pageHeight - 5) {
                                  const labelText = img.label || `Image ${batchStart + i + 13}`;
                                  pdf.text(labelText, x + cellWidth / 2, labelY, { align: 'center', maxWidth: cellWidth });
                              }
                              
                              (`✅ Added property image to grid (${row + 1}, ${col + 1}): ${img.label}`);
                          } catch (err) {
                              console.warn(`Failed to add property image to grid ${img.label}:`, err?.message);
                          }
                      }
                      
                      // Add page number
                      pdf.setFontSize(9);
                      pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });
                  }
              }
          }

          // ===== LOCATION IMAGES: One per page =====
          if (locationImgs.length > 0) {
              for (let i = 0; i < locationImgs.length; i++) {
                  const img = locationImgs[i];
                  
                  try {
                      const canvas = await loadImageToCanvas(img.src);
                      
                      pdf.addPage();
                      pageNumber++;
                      
                      // Add heading on first page only
                      if (i === 0) {
                          pdf.setFontSize(14);
                          pdf.setFont(undefined, 'bold');
                          pdf.text('LOCATION IMAGES', 105, 15, { align: 'center' });
                      }
                      
                      // Add image with proper scaling (increased width, reduced height, centered)
                       const pageMargin = 5; // Reduced margin to increase image width
                       const topMargin = i === 0 ? 25 : 20; // Extra space for heading on first page
                       const bottomMargin = 20;
                       const availableWidth = imgWidth - (pageMargin * 1); // Increased width: 210 - 5 = 205mm
                      const maxImageHeight = 180; // Limit max height to reduce image size
                      const availableHeight = Math.min(pageHeight - topMargin - bottomMargin, maxImageHeight);
                      
                      // Calculate actual image dimensions after scaling
                      const imageDimensions = calculateImageDimensions(canvas, availableWidth, availableHeight);
                      // Center the image horizontally based on actual rendered width
                      const centerX = (imgWidth - imageDimensions.width) / 2;
                      
                      const imageSize = addImageToPDF(pdf, canvas, centerX, topMargin, availableWidth, availableHeight);
                      
                      // Add label below image
                      pdf.setFontSize(10);
                      pdf.setFont(undefined, 'bold');
                      const labelY = topMargin + imageSize.height + 5;
                      if (labelY < pageHeight - 5) {
                          pdf.text(img.label || `Location Image ${i + 1}`, 105, labelY, { align: 'center' });
                      }
                      
                      // Add page number
                      pdf.setFontSize(9);
                      pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });
                      
                      (`✅ Added location image: ${img.label}`);
                  } catch (err) {
                      console.warn(`Failed to add location image ${img.label}:`, err?.message);
                  }
              }
          }

          // ===== SUPPORTING IMAGES: One per page =====
          if (supportingImgs.length > 0) {
              for (let i = 0; i < supportingImgs.length; i++) {
                  const img = supportingImgs[i];
                  
                  try {
                      const canvas = await loadImageToCanvas(img.src);
                      
                      pdf.addPage();
                      pageNumber++;
                      
                      // Add heading on first page only
                      if (i === 0) {
                          pdf.setFontSize(14);
                          pdf.setFont(undefined, 'bold');
                          pdf.text('SUPPORTING IMAGES', 105, 15, { align: 'center' });
                      }
                      
                      // Add image with proper scaling (increased width, reduced height, centered)
                      const pageMargin = 5; // Reduced margin to increase image width
                      const topMargin = i === 0 ? 25 : 20; // Extra space for heading on first page
                      const bottomMargin = 20;
                      const availableWidth = imgWidth - (pageMargin * 2); // Increased width: 210 - 10 = 200mm
                      const maxImageHeight = 180; // Limit max height to reduce image size
                      const availableHeight = Math.min(pageHeight - topMargin - bottomMargin, maxImageHeight);
                      
                      // Calculate actual image dimensions after scaling
                      const imageDimensions = calculateImageDimensions(canvas, availableWidth, availableHeight);
                      // Center the image horizontally
                      const centerX = (imgWidth - imageDimensions.width) / 2;
                      
                      const imageSize = addImageToPDF(pdf, canvas, centerX, topMargin, availableWidth, availableHeight);
                      
                      // Add label below image
                      pdf.setFontSize(10);
                      pdf.setFont(undefined, 'bold');
                      const labelY = topMargin + imageSize.height + 5;
                      if (labelY < pageHeight - 5) {
                          pdf.text(img.label || `Supporting Image ${i + 1}`, 105, labelY, { align: 'center' });
                      }
                      
                      // Add page number
                      pdf.setFontSize(9);
                      pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });
                      
                      (`✅ Added supporting image: ${img.label}`);
                  } catch (err) {
                      console.warn(`Failed to add supporting image ${img.label}:`, err?.message);
                  }
              }
          }
      } else {
          ('⏭️ No valid images to add to PDF');
      }

      // Download PDF
      const filename = `valuation_${record?.clientName || record?.uniqueId || Date.now()}.pdf`;
      pdf.save(filename);

      ('✅ PDF generated and downloaded:', filename);
      return filename;
  } catch (error) {
      console.error('❌ Client-side PDF generation error:', error);
      throw error;
  }
}

// Alias for generateRecordPDF to match import name
export const generateRajeshHousePDF = generateRecordPDF;
const pdfExportService = {
    generateValuationReportHTML,
    generateRecordPDF,
    generateRajeshHousePDF,
    previewValuationPDF,
    generateRecordPDFOffline,
    normalizeDataForPDF
};
export default pdfExportService;