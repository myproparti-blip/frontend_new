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

// Helper function to format currency with automatic word conversion (auto-generates words if not provided)
const formatCurrencyWithWordsAuto = (numericValue, wordValue) => {
  if (!numericValue) return 'NA';
  const cleanNum = String(numericValue).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanNum);
  if (isNaN(num)) return numericValue;

  // Check if wordValue is a valid word format (contains RUPEES or is meaningful)
  const isValidWordValue = wordValue &&
      wordValue !== 'NA' &&
      wordValue !== 'Yes' &&
      wordValue !== 'No' &&
      wordValue !== 'Details Available' &&
      wordValue.toUpperCase().includes('RUPEES');

  // Use provided word value if valid, otherwise auto-generate
  const words = isValidWordValue ? wordValue : `${numberToWords(num)} RUPEES ONLY`;
  return `₹ ${num} (${words})`;
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

  // For location images, use larger dimensions - optimized for page 1
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

// Helper function to compress image to base64 for faster PDF generation
const compressImageToBase64 = async (imageUrl) => {
  if (!imageUrl) return '';
  
  try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      
      // Create canvas for compression
      return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
              const canvas = document.createElement('canvas');
              // Reduce size: max width 400px
              const maxWidth = 400;
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth) {
                  height = (maxWidth / width) * height;
                  width = maxWidth;
              }
              
              canvas.width = width;
              canvas.height = height;
              canvas.getContext('2d').drawImage(img, 0, 0, width, height);
              
              // Compress to JPEG quality 0.6 for faster generation
              resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = () => resolve('');
          img.src = URL.createObjectURL(blob);
      });
  } catch (e) {
      console.warn('Image compression failed:', e?.message);
      return imageUrl;
  }
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

// Helper function for checklist column logic
// If column 1 is "Yes", column 2 shows "-", otherwise shows the value
// If column 1 is "No", column 1 shows "-", otherwise shows the value
const getChecklistValue = (value, isColumn1 = true) => {
  const normalizedValue = safeGet({}, '', value);

  if (isColumn1) {
    // Column 1: Show "-" if value is "No", otherwise show value
    return normalizedValue === 'No' ? '-' : (normalizedValue && normalizedValue !== '--' ? normalizedValue : '--');
  } else {
    // Column 2: Show "-" if value is "Yes", otherwise show "No"
    return normalizedValue === 'Yes' ? '-' : (normalizedValue === 'No' ? 'No' : '--');
  }
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
      ownerOccupancyStatus: data.pdfDetails.ownerOccupancyStatus || normalized.ownerOccupancyStatus,
      clientImage: data.pdfDetails.clientImage || normalized.clientImage
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
  if (data.propertyImages || data.locationImages || data.documentPreviews || data.areaImages || data.bankImage) {
    normalized = {
      ...normalized,
      propertyImages: data.propertyImages || normalized.propertyImages || [],
      locationImages: data.locationImages || normalized.locationImages || [],
      documentPreviews: data.documentPreviews || normalized.documentPreviews || [],
      areaImages: data.areaImages || normalized.areaImages || {},
      bankImage: data.bankImage || normalized.bankImage
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
    areaImages: normalized.areaImages || data.areaImages || {},
    bankImage: normalized.bankImage || data.bankImage
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

  // Debug logging to verify data is being received
  ('🔍 PDF Data Received:', {
    hasData: !!data,
    hasRootFields: {
      uniqueId: !!data?.uniqueId,
      bankName: !!data?.bankName,
      bankImage: !!data?.bankImage,
      clientImage: !!data?.clientImage,
      clientName: !!data?.clientName,
      city: !!data?.city
    },
    hasPdfDetails: !!data?.pdfDetails,
    pdfDetailsKeys: Object.keys(data?.pdfDetails || {}).length,
    pdfDetailsSample: {
      postalAddress: data?.pdfDetails?.postalAddress,
      residentialArea: data?.pdfDetails?.residentialArea,
      areaClassification: data?.pdfDetails?.areaClassification,
      inspectionDate: data?.pdfDetails?.inspectionDate,
      agreementForSale: data?.pdfDetails?.agreementForSale,
      classificationPosh: data?.pdfDetails?.classificationPosh,
      classificationUsage: data?.pdfDetails?.classificationUsage,
      ownerOccupancyStatus: data?.pdfDetails?.ownerOccupancyStatus
    },
    hasPropertyImages: data?.propertyImages?.length || 0,
    hasBankImage: !!data?.bankImage,
    hasDocumentPreviews: data?.documentPreviews?.length || 0,
    documentPreviewsSample: data?.documentPreviews?.[0],
    normalizedKeys: Object.keys(normalizedData).length
  });

  // Start with normalized data, then merge with root level data and pdfDetails
  let pdfData = normalizedData;

  // Merge root level data first
  pdfData = {
    ...pdfData,
    ...data
  };

  // Flatten pdfDetails into root level for easier access (pdfDetails has HIGHEST priority as it contains form data)
  // This ensures ALL form fields from pdfDetails are available for the PDF template and overrides other sources
  // BUT preserve propertyImages, locationImages, documentPreviews, areaImages arrays, and bank image
  if (data?.pdfDetails && typeof data.pdfDetails === 'object') {
    const preservedPropertyImages = pdfData.propertyImages;
    const preservedLocationImages = pdfData.locationImages;
    const preservedDocumentPreviews = pdfData.documentPreviews || data.documentPreviews;
    const preservedAreaImages = pdfData.areaImages || data.areaImages;
    const preservedBankImage = data?.bankImage;
    const preservedClientImage = pdfData.clientImage || data?.clientImage;

    pdfData = {
      ...pdfData,
      ...data.pdfDetails
    };

    // Restore image arrays and bank images if they exist
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
    if (preservedBankImage) {
      pdfData.bankImage = preservedBankImage;
    }
    if (preservedClientImage) {
      pdfData.clientImage = preservedClientImage;
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

    // DEBUG: Log field mapping
    ('🔧 Field Mapping Debug:', {
      allPdfDetailsKeys: Object.keys(data.pdfDetails),
      classificationPosh: data.pdfDetails.classificationPosh,
      unitMaintenance: data.pdfDetails.unitMaintenance,
      pdfDataUnitClassification: pdfData.unitClassification,
      pdfDataUnitMaintenance: pdfData.unitMaintenance,
      pdfDetailsUnitMaintenance: data.pdfDetails.unitMaintenance,
      pdfDetailsClassificationPosh: data.pdfDetails.classificationPosh
    });
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
    // Basic info
    branch: pdfData.branch || pdfData.pdfDetails?.branch,
    valuationPurpose: pdfData.valuationPurpose || pdfData.pdfDetails?.valuationPurpose || pdfData.pdfDetails?.purposeOfValuation,
    referenceNo: pdfData.referenceNo || pdfData.pdfDetails?.referenceNo,
    inspectionDate: pdfData.inspectionDate || pdfData.dateOfInspection || pdfData.pdfDetails?.inspectionDate || pdfData.pdfDetails?.dateOfInspection,
    valuationMadeDate: pdfData.valuationMadeDate || pdfData.dateOfValuation || pdfData.pdfDetails?.valuationMadeDate || pdfData.pdfDetails?.dateOfValuationMade,
    agreementForSale: pdfData.agreementForSale || pdfData.pdfDetails?.agreementForSale,
    commencementCertificate: pdfData.commencementCertificate || pdfData.pdfDetails?.commencementCertificate,
    occupancyCertificate: pdfData.occupancyCertificate || pdfData.pdfDetails?.occupancyCertificate,
    ownerNameAddress: pdfData.ownerNameAddress || pdfData.pdfDetails?.ownerNameAddress || pdfData.pdfDetails?.nameOfOwnerOrOwners || pdfData.nameOfOwnerOrOwners,
    briefDescriptionProperty: pdfData.briefDescriptionProperty || pdfData.pdfDetails?.briefDescriptionProperty || pdfData.briefDescriptionOfProperty || pdfData.pdfDetails?.briefDescriptionOfProperty,

    // Location of property
    plotNo: pdfData.plotNo || pdfData.plotSurveyNo || pdfData.pdfDetails?.plotSurveyNo,
    doorNo: pdfData.doorNo || pdfData.pdfDetails?.doorNo,
    tsNoVillage: pdfData.tsNoVillage || pdfData.tpVillage || pdfData.pdfDetails?.tpVillage,
    wardTaluka: pdfData.wardTaluka || pdfData.pdfDetails?.wardTaluka,
    mandalDistrict: pdfData.mandalDistrict || pdfData.pdfDetails?.mandalDistrict,
    layoutIssueDate: pdfData.layoutIssueDate || pdfData.layoutPlanIssueDate || pdfData.pdfDetails?.layoutPlanIssueDate,
    approvedMapAuthority: pdfData.approvedMapAuthority || pdfData.pdfDetails?.approvedMapAuthority,
    mapVerified: pdfData.mapVerified || pdfData.authenticityVerified,
    valuersComments: pdfData.valuersComments || pdfData.valuerCommentOnAuthenticity,
    postalAddress: extractAddressValue(pdfData.postalAddress) || extractAddressValue(pdfData.pdfDetails?.postalAddress) || extractAddressValue(pdfData.addressOfPropertyUnderValuation) || extractAddressValue(pdfData.pdfDetails?.addressOfPropertyUnderValuation),
    cityTown: pdfData.cityTown || pdfData.pdfDetails?.cityTown,
    residentialArea: pdfData.residentialArea,
    commercialArea: pdfData.commercialArea,
    industrialArea: pdfData.industrialArea,
    areaClassification: pdfData.areaClassification || pdfData.pdfDetails?.areaClassification,
    urbanType: pdfData.urbanType || pdfData.urbanClassification || pdfData.pdfDetails?.urbanClassification,
    jurisdictionType: pdfData.jurisdictionType || pdfData.governmentType || pdfData.pdfDetails?.governmentType,
    enactmentCovered: pdfData.enactmentCovered || pdfData.govtEnactmentsCovered || pdfData.pdfDetails?.govtEnactmentsCovered,

    // Boundaries
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
    // Legacy fields for backward compatibility
    boundariesPlotNorth: pdfData.boundariesPlotNorth,
    boundariesPlotSouth: pdfData.boundariesPlotSouth,
    boundariesPlotEast: pdfData.boundariesPlotEast,
    boundariesPlotWest: pdfData.boundariesPlotWest,
    boundariesShopNorth: pdfData.boundariesShopNorth,
    boundariesShopSouth: pdfData.boundariesShopSouth,
    boundariesShopEast: pdfData.boundariesShopEast,
    boundariesShopWest: pdfData.boundariesShopWest,

    // Dimensions
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
    numberOfDwellingUnits: pdfData.numberOfDwellingUnits || pdfData.dwellingUnits || pdfData.numberOfDwellingUnitsInBuilding,
    qualityConstruction: pdfData.qualityConstruction || pdfData.qualityOfConstruction,
    buildingAppearance: pdfData.buildingAppearance || pdfData.appearanceOfBuilding,
    buildingMaintenance: pdfData.buildingMaintenance || pdfData.maintenanceOfBuilding,
    unitMaintenance: pdfData.unitMaintenance || pdfData.unitMaintenanceStatus || pdfData.pdfDetails?.unitMaintenance || data?.unitMaintenance?.unitMaintenanceStatus,
    unitClassification: pdfData.unitClassification || pdfData.pdfDetails?.classificationPosh || data?.unitClassification?.unitClassification,
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
      ('⚠️ ownerOccupiedOrLetOut mapping:', {
        'pdfData.ownerOccupiedOrLetOut': pdfData.ownerOccupiedOrLetOut,
        'pdfData.ownerOccupancyStatus': pdfData.ownerOccupancyStatus,
        'data.ownerOccupancyStatus': data?.ownerOccupancyStatus,
        'pdfData.pdfDetails?.ownerOccupancyStatus': pdfData.pdfDetails?.ownerOccupancyStatus,
        'data.pdfDetails?.ownerOccupancyStatus': data?.pdfDetails?.ownerOccupancyStatus,
        finalResult: result
      });
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

    // Valuation values
    carpetArea: pdfData.carpetArea || pdfData.carpetAreaFlat || pdfData.areaUsage || pdfData.pdfDetails?.carpetAreaFlat || pdfData.pdfDetails?.areaUsage,
    areaUsage: pdfData.areaUsage || pdfData.pdfDetails?.areaUsage,
    plinthArea: pdfData.plinthArea || pdfData.pdfDetails?.plinthArea,
    undividedLandArea: pdfData.undividedLandArea || pdfData.undividedLandAreaSaleDeed || pdfData.undividedAreaLand || pdfData.pdfDetails?.undividedAreaLand,
    ratePerSqft: pdfData.ratePerSqft || pdfData.presentValueRate || pdfData.adoptedBasicCompositeRate || pdfData.pdfDetails?.presentValueRate || pdfData.pdfDetails?.adoptedBasicCompositeRate,
    fairMarketValue: pdfData.fairMarketValue || pdfData.pdfDetails?.fairMarketValue,
    fairMarketValueWords: pdfData.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValueWords,
    marketValue: pdfData.marketValue || pdfData.fairMarketValue || pdfData.pdfDetails?.fairMarketValue,
    marketValueWords: pdfData.marketValueWords || pdfData.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValue,
    distressValue: pdfData.distressValue || pdfData.pdfDetails?.distressValue,
    distressValueWords: pdfData.distressValueWords || pdfData.pdfDetails?.distressValueWords,
    saleDeedValue: pdfData.saleDeedValue || pdfData.pdfDetails?.saleDeedValue || pdfData.bookValue || pdfData.pdfDetails?.bookValue,
    saleDeedValueWords: pdfData.saleDeedValueWords || pdfData.pdfDetails?.saleDeedValueWords || pdfData.bookValueWords || pdfData.pdfDetails?.bookValueWords,
    finalMarketValue: pdfData.finalMarketValue || pdfData.fairMarketValue || pdfData.pdfDetails?.fairMarketValue,
    finalMarketValueWords: pdfData.finalMarketValueWords || pdfData.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValue,
    marketValueOfProperty: pdfData.marketValueOfProperty || pdfData.pdfDetails?.marketValueOfProperty,
    realizableValue: pdfData.realizableValue || pdfData.pdfDetails?.realizableValue,
    distressValue: pdfData.distressValue || pdfData.pdfDetails?.distressValue,
    insurableValue: pdfData.insurableValue || pdfData.pdfDetails?.insurableValue,
    bookValueOfProperty: pdfData.bookValueOfProperty || pdfData.pdfDetails?.bookValueOfProperty || pdfData.saleDeedValue || pdfData.pdfDetails?.saleDeedValue || pdfData.valueOfProperty || pdfData.pdfDetails?.valueOfProperty,
    bookValueAsPerSaleDeed: pdfData.bookValueAsPerSaleDeed || pdfData.pdfDetails?.bookValueAsPerSaleDeed || pdfData.saleDeedValue || pdfData.pdfDetails?.saleDeedValue || pdfData.saleDeed || pdfData.pdfDetails?.saleDeed,
    saleDeedRegistrationNumber: pdfData.saleDeedRegistrationNumber || pdfData.pdfDetails?.saleDeedRegistrationNumber || pdfData.saleRegistrationNumber || pdfData.pdfDetails?.saleRegistrationNumber || pdfData.registrationNumber || pdfData.pdfDetails?.registrationNumber,
    saleDeedDate: pdfData.saleDeedDate || pdfData.pdfDetails?.saleDeedDate || pdfData.dateofsaleDeed || pdfData.pdfDetails?.dateofsaleDeed || pdfData.saleDate || pdfData.pdfDetails?.saleDate,

    // ASSUMPTIONS & REMARKS
    qualificationsInTIR: pdfData.qualificationsInTIR || pdfData.pdfDetails?.qualificationsInTIR,
    propertyIsSARFAESICompliant: pdfData.propertyIsSARFAESICompliant || pdfData.pdfDetails?.propertyIsSARFAESICompliant,
    propertyBelongsToSocialInfrastructure: pdfData.propertyBelongsToSocialInfrastructure || pdfData.pdfDetails?.propertyBelongsToSocialInfrastructure,
    entireLandMortgaged: pdfData.entireLandMortgaged || pdfData.pdfDetails?.entireLandMortgaged,
    anyOtherAspectOnMarketability: pdfData.anyOtherAspectOnMarketability || pdfData.pdfDetails?.anyOtherAspectOnMarketability,

    // ENCLOSURES
    layoutPlanSketch: pdfData.layoutPlanSketch || pdfData.pdfDetails?.layoutPlanSketch,
    buildingPlan: pdfData.buildingPlan || pdfData.pdfDetails?.buildingPlan,
    floorPlan: pdfData.floorPlan || pdfData.pdfDetails?.floorPlan,
    photographsOfProperty: pdfData.photographsOfProperty || pdfData.pdfDetails?.photographsOfProperty,
    certifiedCopyOfApprovedPlan: pdfData.certifiedCopyOfApprovedPlan || pdfData.pdfDetails?.certifiedCopyOfApprovedPlan,
    googleMapLocation: pdfData.googleMapLocation || pdfData.pdfDetails?.googleMapLocation,
    priceTrendFromPropertySites: pdfData.priceTrendFromPropertySites || pdfData.pdfDetails?.priceTrendFromPropertySites,
    anyOtherRelevantDocuments: pdfData.anyOtherRelevantDocuments || pdfData.pdfDetails?.anyOtherRelevantDocuments,

    realisableValue: pdfData.realisableValue || pdfData.realizableValue || pdfData.pdfDetails?.realizableValue || pdfData.pdfDetails?.realisableValue,
    realisableValueWords: pdfData.realisableValueWords || pdfData.pdfDetails?.realisableValueWords || pdfData.pdfDetails?.realizableValueWords || pdfData.realizableValueWords,
    finalDistressValue: pdfData.finalDistressValue || pdfData.distressValue || pdfData.pdfDetails?.distressValue,
    finalDistressValueWords: pdfData.finalDistressValueWords || pdfData.distressValueWords || pdfData.pdfDetails?.distressValueWords || pdfData.pdfDetails?.distressValue,
    readyReckonerValue: pdfData.readyReckonerValue || pdfData.totalJantriValue || pdfData.pdfDetails?.readyReckonerValue || pdfData.pdfDetails?.totalJantriValue,
    readyReckonerValueWords: pdfData.readyReckonerValueWords || pdfData.totalJantriValue || pdfData.pdfDetails?.readyReckonerValueWords || pdfData.pdfDetails?.readyReckonerValue || pdfData.pdfDetails?.totalJantriValue,
    readyReckonerYear: pdfData.readyReckonerYear || pdfData.pdfDetails?.readyReckonerYear || new Date().getFullYear(),
    insurableValue: pdfData.insurableValue || pdfData.pdfDetails?.insurableValue,
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

    // Signature & Report
    valuationPlace: pdfData.valuationPlace || pdfData.place || pdfData.pdfDetails?.valuationPlace,
    reportDate: pdfData.reportDate || pdfData.pdfDetails?.reportDate || pdfData.pdfDetails?.valuationMadeDate || pdfData.dateOfValuation,
    valuationDate: pdfData.valuationDate || pdfData.pdfDetails?.valuationDate || pdfData.signatureDate || pdfData.pdfDetails?.valuationMadeDate || pdfData.dateOfValuationMade,
    valuationMadeDate: pdfData.valuationMadeDate || pdfData.pdfDetails?.valuationMadeDate || pdfData.dateOfValuationMade,
    valuersName: pdfData.valuersName || pdfData.signerName || pdfData.pdfDetails?.valuersName || pdfData.engineerName || pdfData.pdfDetails?.engineerName,
    valuersCompany: pdfData.valuersCompany || pdfData.pdfDetails?.valuersCompany,
    valuersLicense: pdfData.valuersLicense || pdfData.pdfDetails?.valuersLicense,

    // Rate information
    comparableRate: pdfData.comparableRate || pdfData.pdfDetails?.comparableRate,
    adoptedBasicCompositeRate: pdfData.adoptedBasicCompositeRate || pdfData.pdfDetails?.adoptedBasicCompositeRate,
    buildingServicesRate: pdfData.buildingServicesRate || pdfData.pdfDetails?.buildingServicesRate,
    landOthersRate: pdfData.landOthersRate || pdfData.pdfDetails?.landOthersRate,
    guidelineRate: pdfData.guidelineRate || pdfData.pdfDetails?.guidelineRate,

    // Dynamic Declaration Table Fields
    backgroundInfoComment: pdfData.backgroundInfoComment || pdfData.pdfDetails?.backgroundInfoComment || "Referred provided documents",
    valuationPurposeComment: pdfData.valuationPurposeComment || pdfData.pdfDetails?.valuationPurposeComment || "Continue Financial Assistance Purpose",
    valuersIdentityComment: pdfData.valuersIdentityComment || pdfData.pdfDetails?.valuersIdentityComment || "Self-assessment",
    conflictOfInterestComment: pdfData.conflictOfInterestComment || pdfData.pdfDetails?.conflictOfInterestComment || "N.A.",
    inspectionsUndertakenComment: pdfData.inspectionsUndertakenComment || pdfData.pdfDetails?.inspectionsUndertakenComment || "Yes.",
    informationSourcesComment: pdfData.informationSourcesComment || pdfData.pdfDetails?.informationSourcesComment || "Local inquiries, brokers, known websites, i.e., matches, 99acre, propertiwalai, proptiger, housing, etc., if available",
    valuationProceduresComment: pdfData.valuationProceduresComment || pdfData.pdfDetails?.valuationProceduresComment || "Land & Building Method, with Market Approach for Land and Cost Approach for Building.",
    restrictionsOnUseComment: pdfData.restrictionsOnUseComment || pdfData.pdfDetails?.restrictionsOnUseComment || "As per purpose mentioned in report.",
    majorFactorsComment: pdfData.majorFactorsComment || pdfData.pdfDetails?.majorFactorsComment || "Location of the property, with developing of surroundings, for going-purpose valuation",
    notConsideredFactorsComment: pdfData.notConsideredFactorsComment || pdfData.pdfDetails?.notConsideredFactorsComment || "Future market events and Government Policies.",
    caveatsLimitationsComment: pdfData.caveatsLimitationsComment || pdfData.pdfDetails?.caveatsLimitationsComment || "We are not responsible for Title of the subjected property and valuations affected by the same",

    // General Tab Fields from Schema
    numberingFlatBungalowPlotNo: pdfData.numberingFlatBungalowPlotNo || pdfData.pdfDetails?.numberingFlatBungalowPlotNo,
    applicant: pdfData.applicant || pdfData.pdfDetails?.applicant,
    nameOfOwnerOrOwners: pdfData.nameOfOwnerOrOwners || pdfData.pdfDetails?.nameOfOwnerOrOwners,
    typeOfProperty: pdfData.typeOfProperty || pdfData.pdfDetails?.typeOfProperty,
    typeOfStructure: pdfData.typeOfStructure || pdfData.pdfDetails?.typeOfStructure,
    statusOfTenure: pdfData.statusOfTenure || pdfData.pdfDetails?.statusOfTenure,
    accountName: pdfData.accountName || pdfData.pdfDetails?.accountName || pdfData.clientName || pdfData.borrowerName,
    nameOfOwner: pdfData.nameOfOwner || pdfData.pdfDetails?.nameOfOwner,
    client: pdfData.client || pdfData.pdfDetails?.client,
    borrowerAccountName: pdfData.borrowerAccountName || pdfData.pdfDetails?.borrowerAccountName,
    mobileNo: pdfData.mobileNo || pdfData.pdfDetails?.mobileNo,
    contactNumberOfRepresentative: pdfData.contactNumberOfRepresentative || pdfData.pdfDetails?.contactNumberOfRepresentative,
    nearbyLandmarkGoogleMap: pdfData.nearbyLandmarkGoogleMap || pdfData.pdfDetails?.nearbyLandmarkGoogleMap,
    matchingOfBoundaries: pdfData.matchingOfBoundaries || pdfData.pdfDetails?.matchingOfBoundaries || pdfData.boundary_boundaryConditionDetails || pdfData.pdfDetails?.boundary_boundaryConditionDetails,
    boundariesOfPropertyProperDemarcation: pdfData.boundariesOfPropertyProperDemarcation || pdfData.pdfDetails?.boundariesOfPropertyProperDemarcation || pdfData.checklist_boundariesPropertyDemarcation || pdfData.pdfDetails?.checklist_boundariesPropertyDemarcation,
    independentAccessToProperty: pdfData.independentAccessToProperty || pdfData.pdfDetails?.independentAccessToProperty,
    addressOfPropertyUnderValuation: pdfData.addressOfPropertyUnderValuation || pdfData.pdfDetails?.addressOfPropertyUnderValuation,
    adjoiningPropertiesNorthDocument: pdfData.adjoiningPropertiesNorthDocument || pdfData.pdfDetails?.adjoiningPropertiesNorthDocument,
    adjoiningPropertiesNorthSite: pdfData.adjoiningPropertiesNorthSite || pdfData.pdfDetails?.adjoiningPropertiesNorthSite,
    adjoiningPropertiesSouthDocument: pdfData.adjoiningPropertiesSouthDocument || pdfData.pdfDetails?.adjoiningPropertiesSouthDocument,
    adjoiningPropertiesSouthSite: pdfData.adjoiningPropertiesSouthSite || pdfData.pdfDetails?.adjoiningPropertiesSouthSite,
    adjoiningPropertiesEastDocument: pdfData.adjoiningPropertiesEastDocument || pdfData.pdfDetails?.adjoiningPropertiesEastDocument,
    adjoiningPropertiesEastSite: pdfData.adjoiningPropertiesEastSite || pdfData.pdfDetails?.adjoiningPropertiesEastSite,
    adjoiningPropertiesWestDocument: pdfData.adjoiningPropertiesWestDocument || pdfData.pdfDetails?.adjoiningPropertiesWestDocument,
    adjoiningPropertiesWestSite: pdfData.adjoiningPropertiesWestSite || pdfData.pdfDetails?.adjoiningPropertiesWestSite,
    dateOfInspectionOfProperty: pdfData.dateOfInspectionOfProperty || pdfData.pdfDetails?.dateOfInspectionOfProperty,
    inspectedBy: pdfData.inspectedBy || pdfData.pdfDetails?.inspectedBy,
    engagementLetterConfirmation: pdfData.engagementLetterConfirmation || pdfData.pdfDetails?.engagementLetterConfirmation,
    ownershipDocumentsSaleDeed: pdfData.ownershipDocumentsSaleDeed || pdfData.pdfDetails?.ownershipDocumentsSaleDeed,
    allotmentLetter: pdfData.allotmentLetter || pdfData.pdfDetails?.allotmentLetter,
    approvedPlan: pdfData.approvedPlan || pdfData.pdfDetails?.approvedPlan,
    briefDescriptionOfProperty: pdfData.briefDescriptionOfProperty || pdfData.pdfDetails?.briefDescriptionOfProperty,
    ageOfPropertyInYears: pdfData.ageOfPropertyInYears || pdfData.pdfDetails?.ageOfPropertyInYears,
    stageOfConstruction: pdfData.stageOfConstruction || pdfData.pdfDetails?.stageOfConstruction,
    mergedProperty: pdfData.mergedProperty || pdfData.pdfDetails?.mergedProperty,
    premiseCanBeSeparatedEntrance: pdfData.premiseCanBeSeparatedEntrance || pdfData.pdfDetails?.premiseCanBeSeparatedEntrance,
    propertyIsRentedToOtherParty: pdfData.propertyIsRentedToOtherParty || pdfData.pdfDetails?.propertyIsRentedToOtherParty,
    landIsLocked: pdfData.landIsLocked || pdfData.pdfDetails?.landIsLocked,
    ifRentedRentAgreementProvided: pdfData.ifRentedRentAgreementProvided || pdfData.pdfDetails?.ifRentedRentAgreementProvided,
    approvedLandUse: pdfData.approvedLandUse || pdfData.pdfDetails?.approvedLandUse,
    plotDemarcated: pdfData.plotDemarcated || pdfData.pdfDetails?.plotDemarcated,
    noOfYearsOfOccupancySince: pdfData.noOfYearsOfOccupancySince || pdfData.pdfDetails?.noOfYearsOfOccupancySince,
    relationshipOfTenantOrOwner: pdfData.relationshipOfTenantOrOwner || pdfData.pdfDetails?.relationshipOfTenantOrOwner,
    violationsIfAnyObserved: pdfData.violationsIfAnyObserved || pdfData.pdfDetails?.violationsIfAnyObserved || data?.pdfDetails?.violationsIfAnyObserved || data?.violationsIfAnyObserved || 'NA',
    stageOfConstruction: pdfData.stageOfConstruction || pdfData.pdfDetails?.stageOfConstruction,
    natureAndExtentOfViolations: pdfData.natureAndExtentOfViolations || pdfData.pdfDetails?.natureAndExtentOfViolations || data?.pdfDetails?.natureAndExtentOfViolations || data?.natureAndExtentOfViolations || 'NA',
    propertyDetails: pdfData.propertyDetails || pdfData.pdfDetails?.propertyDetails,
    remarks: pdfData.remarks || pdfData.pdfDetails?.remarks,

    // Valuation Tab Fields from Schema
    purposeOfValuation: pdfData.purposeOfValuation || pdfData.pdfDetails?.purposeOfValuation,
    purposeOfProperty: pdfData.purposeOfProperty || pdfData.pdfDetails?.purposeOfProperty,
    valuationDoneByGovtApprovedValuer: pdfData.valuationDoneByGovtApprovedValuer || pdfData.pdfDetails?.valuationDoneByGovtApprovedValuer,
    dateOfValuation: pdfData.dateOfValuation || pdfData.pdfDetails?.dateOfValuation,
    dateOfValuationReport: pdfData.dateOfValuationReport || pdfData.pdfDetails?.dateOfValuationReport,
    areaOfLand: pdfData.areaOfLand || pdfData.pdfDetails?.areaOfLand,
    areaOfConstruction: pdfData.areaOfConstruction || pdfData.pdfDetails?.areaOfConstruction,
    revenueDetailsPerSaleDeed: pdfData.revenueDetailsPerSaleDeed || pdfData.pdfDetails?.revenueDetailsPerSaleDeed,
    landAreaPerSaleDeed: pdfData.landAreaPerSaleDeed || pdfData.pdfDetails?.landAreaPerSaleDeed,
    landAreaAsPerSaleDeed: pdfData.landAreaAsPerSaleDeed || pdfData.pdfDetails?.landAreaAsPerSaleDeed || data?.pdfDetails?.landAreaAsPerSaleDeed || data?.landAreaAsPerSaleDeed || pdfData.landAreaPerSaleDeed || pdfData.pdfDetails?.landAreaPerSaleDeed || 'NA',
    landAreaAsPerGRUDA: pdfData.landAreaAsPerGRUDA || pdfData.pdfDetails?.landAreaAsPerGRUDA || data?.pdfDetails?.landAreaAsPerGRUDA || data?.landAreaAsPerGRUDA || pdfData.areaOfLand || pdfData.pdfDetails?.areaOfLand || 'NA',
    builtUpAreaAsPerGRUDA: pdfData.builtUpAreaAsPerGRUDA || pdfData.pdfDetails?.builtUpAreaAsPerGRUDA || data?.pdfDetails?.builtUpAreaAsPerGRUDA || data?.builtUpAreaAsPerGRUDA || pdfData.builtUpAreaPerGrudaImpactPlan || pdfData.pdfDetails?.builtUpAreaPerGrudaImpactPlan || 'NA',
    builtUpAreaPerGrudaImpactPlan: pdfData.builtUpAreaPerGrudaImpactPlan || pdfData.pdfDetails?.builtUpAreaPerGrudaImpactPlan || data?.pdfDetails?.builtUpAreaPerGrudaImpactPlan || data?.builtUpAreaPerGrudaImpactPlan || 'NA',
    cabuaSbuaInSqFt: pdfData.cabuaSbuaInSqFt || pdfData.pdfDetails?.cabuaSbuaInSqFt || data?.pdfDetails?.cabuaSbuaInSqFt || data?.cabuaSbuaInSqFt || pdfData.areaOfConstruction || pdfData.pdfDetails?.areaOfConstruction || 'NA',
    totalLifeOfPropertyInYears: pdfData.totalLifeOfPropertyInYears || pdfData.pdfDetails?.totalLifeOfPropertyInYears,
    ifUnderConstructionExtentOfCompletion: pdfData.ifUnderConstructionExtentOfCompletion || pdfData.pdfDetails?.ifUnderConstructionExtentOfCompletion,
    residualAgeOfPropertyInYears: pdfData.residualAgeOfPropertyInYears || pdfData.pdfDetails?.residualAgeOfPropertyInYears,
    totalNoOfFloor: pdfData.totalNoOfFloor || pdfData.pdfDetails?.totalNoOfFloor,
    floorOnWhichPropertyIsLocated: pdfData.floorOnWhichPropertyIsLocated || pdfData.pdfDetails?.floorOnWhichPropertyIsLocated,
    noOfRoomsLivingDining: pdfData.noOfRoomsLivingDining || pdfData.pdfDetails?.noOfRoomsLivingDining,
    bedRooms: pdfData.bedRooms || pdfData.pdfDetails?.bedRooms,
    noOfRoomsToiletBath: pdfData.noOfRoomsToiletBath || pdfData.pdfDetails?.noOfRoomsToiletBath,
    kitchenStore: pdfData.kitchenStore || pdfData.pdfDetails?.kitchenStore,
    location: pdfData.location || pdfData.pdfDetails?.location,
    valueOfLand: pdfData.valueOfLand || pdfData.pdfDetails?.valueOfLand,
    valueOfConstruction: pdfData.valueOfConstruction || pdfData.pdfDetails?.valueOfConstruction,
    totalMarketValueOfProperty: pdfData.totalMarketValueOfProperty || pdfData.pdfDetails?.totalMarketValueOfProperty,
    distressSaleValue: pdfData.distressSaleValue || pdfData.pdfDetails?.distressSaleValue,
    insurableValueOfProperty: pdfData.insurableValueOfProperty || pdfData.pdfDetails?.insurableValueOfProperty,
    jantriValueOfProperty: pdfData.jantriValueOfProperty || pdfData.pdfDetails?.jantriValueOfProperty,
    realisableValuePercentage: pdfData.realisableValuePercentage || pdfData.pdfDetails?.realisableValuePercentage,
    distressValuePercentage: pdfData.distressValuePercentage || pdfData.pdfDetails?.distressValuePercentage,
    buildingValueEstimatedReplacementRate: pdfData.buildingValueEstimatedReplacementRate || pdfData.pdfDetails?.buildingValueEstimatedReplacementRate,
    bookValueOfProperty: pdfData.bookValueOfProperty || pdfData.pdfDetails?.bookValueOfProperty,
    valuersOpinion: pdfData.valuersOpinion || pdfData.pdfDetails?.valuersOpinion,
    valuationBy: pdfData.valuationBy || pdfData.pdfDetails?.valuationBy,
    guidelineRateObtainedFrom: pdfData.guidelineRateObtainedFrom || pdfData.pdfDetails?.guidelineRateObtainedFrom || pdfData.guidelineSource || pdfData.pdfDetails?.guidelineSource,
    guidelineValue: pdfData.guidelineValue || pdfData.pdfDetails?.guidelineValue || pdfData.revisedGuidelineRate || pdfData.pdfDetails?.revisedGuidelineRate,
    marketValueOfProperty: pdfData.marketValueOfProperty || pdfData.pdfDetails?.marketValueOfProperty,
    dateOfReport: pdfData.dateOfReport || pdfData.pdfDetails?.dateOfReport,
    saleDeed: pdfData.saleDeed || pdfData.pdfDetails?.saleDeed,
    grudaImpactPlan: pdfData.grudaImpactPlan || pdfData.pdfDetails?.grudaImpactPlan,
    layoutPlan: pdfData.layoutPlan || pdfData.pdfDetails?.layoutPlan,
    constructionPermission: pdfData.constructionPermission || pdfData.pdfDetails?.constructionPermission,
    lightBill: pdfData.lightBill || pdfData.pdfDetails?.lightBill,
    taxBill: pdfData.taxBill || pdfData.pdfDetails?.taxBill,
    jantriRatePerSqMt: pdfData.jantriRatePerSqMt || pdfData.pdfDetails?.jantriRatePerSqMt || pdfData.guidelineRatePerSqMt || pdfData.pdfDetails?.guidelineRatePerSqMt,
    revisedGuidelineRate: pdfData.revisedGuidelineRate || pdfData.pdfDetails?.revisedGuidelineRate || pdfData.guidelineRate || pdfData.pdfDetails?.guidelineRate,
    jantriValueOfLand: pdfData.jantriValueOfLand || pdfData.pdfDetails?.jantriValueOfLand || pdfData.jantriValueOfProperty || pdfData.pdfDetails?.jantriValueOfProperty,

    // Valuation Analysis Tab Fields from Schema
    landAreaSFT: pdfData.landAreaSFT || pdfData.pdfDetails?.landAreaSFT || data?.pdfDetails?.landAreaSFT || data?.landAreaSFT || pdfData.areaOfLand || pdfData.pdfDetails?.areaOfLand || 'NA',
    landRate: pdfData.landRate || pdfData.pdfDetails?.landRate || data?.pdfDetails?.landRate || data?.landRate || pdfData.landRatePerSqFt || pdfData.pdfDetails?.landRatePerSqFt || 'NA',
    landRatePerSqFt: pdfData.landRatePerSqFt || pdfData.pdfDetails?.landRatePerSqFt || data?.pdfDetails?.landRatePerSqFt || data?.landRatePerSqFt || pdfData.landRate || pdfData.pdfDetails?.landRate || pdfData.ratePerSqft || pdfData.pdfDetails?.ratePerSqft || 'NA',
    valueOfLand: pdfData.valueOfLand || pdfData.pdfDetails?.valueOfLand || data?.pdfDetails?.valueOfLand || data?.valueOfLand || 'NA',
    valueOfLandPerSqFt: pdfData.valueOfLandPerSqFt || pdfData.pdfDetails?.valueOfLandPerSqFt || data?.pdfDetails?.valueOfLandPerSqFt || data?.valueOfLandPerSqFt || 'NA',
    totalLandValue: pdfData.totalLandValue || pdfData.pdfDetails?.totalLandValue || data?.pdfDetails?.totalLandValue || data?.totalLandValue || pdfData.valueOfLand || pdfData.pdfDetails?.valueOfLand || 'NA',
    totalBUA: pdfData.totalBUA || pdfData.pdfDetails?.totalBUA,
    plinthArea: pdfData.plinthArea || pdfData.pdfDetails?.plinthArea,
    roofHeight: pdfData.roofHeight || pdfData.pdfDetails?.roofHeight,
    ageOfBuilding: pdfData.ageOfBuilding || pdfData.pdfDetails?.ageOfBuilding,
    estimatedReplacementRate: pdfData.estimatedReplacementRate || pdfData.pdfDetails?.estimatedReplacementRate,
    valueOfConstruction: pdfData.valueOfConstruction || pdfData.pdfDetails?.valueOfConstruction,
    dataSheet: pdfData.dataSheet || pdfData.pdfDetails?.dataSheet,
    buildingValuePlinthArea: pdfData.buildingValuePlinthArea || pdfData.pdfDetails?.buildingValuePlinthArea,
    buildingValueRoofHeight: pdfData.buildingValueRoofHeight || pdfData.pdfDetails?.buildingValueRoofHeight,
    buildingValueAge: pdfData.buildingValueAge || pdfData.pdfDetails?.buildingValueAge,
    buildingValueOfConstruction: pdfData.buildingValueOfConstruction || pdfData.pdfDetails?.buildingValueOfConstruction,
    totalBuildingValue: pdfData.totalBuildingValue || pdfData.pdfDetails?.totalBuildingValue,
    fairMarketValueInWords: pdfData.fairMarketValueInWords || pdfData.pdfDetails?.fairMarketValueInWords,
    realisableValueInWords: pdfData.realisableValueInWords || pdfData.pdfDetails?.realisableValueInWords,
    distressValueInWords: pdfData.distressValueInWords || pdfData.pdfDetails?.distressValueInWords,
    dateOfVisit: pdfData.dateOfVisit || pdfData.pdfDetails?.dateOfVisit,
    valuationReportDeclaration: pdfData.valuationReportDeclaration || pdfData.pdfDetails?.valuationReportDeclaration,
    propertyInspectionDeclaration: pdfData.propertyInspectionDeclaration || pdfData.pdfDetails?.propertyInspectionDeclaration,
    siteVisitPhotos: pdfData.siteVisitPhotos || pdfData.pdfDetails?.siteVisitPhotos,
    selfieWithOwner: pdfData.selfieWithOwner || pdfData.pdfDetails?.selfieWithOwner,
    saleInstanceLocalInquiry: pdfData.saleInstanceLocalInquiry || pdfData.pdfDetails?.saleInstanceLocalInquiry,
    brokerRecording: pdfData.brokerRecording || pdfData.pdfDetails?.brokerRecording,
    advTcrLsr: pdfData.advTcrLsr || pdfData.pdfDetails?.advTcrLsr,
    kabulatLekh: pdfData.kabulatLekh || pdfData.pdfDetails?.kabulatLekh,
    mortgageDeed: pdfData.mortgageDeed || pdfData.pdfDetails?.mortgageDeed,
    leaseDeed: pdfData.leaseDeed || pdfData.pdfDetails?.leaseDeed,
    index2: pdfData.index2 || pdfData.pdfDetails?.index2,
    vf712InCaseOfLand: pdfData.vf712InCaseOfLand || pdfData.pdfDetails?.vf712InCaseOfLand,
    naOrder: pdfData.naOrder || pdfData.pdfDetails?.naOrder,
    commencementLetter: pdfData.commencementLetter || pdfData.pdfDetails?.commencementLetter,
    buPermission: pdfData.buPermission || pdfData.pdfDetails?.buPermission,
    tentativeRate: pdfData.tentativeRate || pdfData.pdfDetails?.tentativeRate,
    pastValuationRate: pdfData.pastValuationRate || pdfData.pdfDetails?.pastValuationRate,
    subContractingDeclaration: pdfData.subContractingDeclaration || pdfData.pdfDetails?.subContractingDeclaration,
    eleMeterPhoto: pdfData.eleMeterPhoto || pdfData.pdfDetails?.eleMeterPhoto,
    muniTaxBill: pdfData.muniTaxBill || pdfData.pdfDetails?.muniTaxBill,
    place: pdfData.place || pdfData.pdfDetails?.place,

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

    // Valuation Details Table
    valuationDetailsTable: pdfData.valuationDetailsTable || pdfData.pdfDetails?.valuationDetailsTable,
    classificationPosh: pdfData.unitClassification || pdfData.classificationPosh || pdfData.pdfDetails?.classificationPosh,
    classificationUsage: pdfData.classificationUsage || pdfData.pdfDetails?.classificationUsage,
    classificationOwnership: pdfData.classificationOwnership || pdfData.pdfDetails?.classificationOwnership,

    // Client & Document info
    clientName: pdfData.clientName,
    mobileNumber: pdfData.mobileNumber,
    address: pdfData.address,
    bankName: pdfData.bankName,
    bankImage: pdfData.bankImage,
    clientImage: pdfData.clientImage || pdfData.bankImage,
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

  // Debug: Log critical fields for troubleshooting
  ('🔍 PDF Field Extraction Debug:', {
    areaClassification: pdfData.areaClassification,
    postalAddress: pdfData.postalAddress,
    postalAddressRaw: data?.postalAddress,
    pdfDetailsPostalAddress: data?.pdfDetails?.postalAddress,
    cityTown: pdfData.cityTown,
    urbanType: pdfData.urbanType
  });

  // DEBUG: Log final pdfData before rendering
  ('📋 Final pdfData before HTML rendering:', {
    unitMaintenance: pdfData.unitMaintenance,
    unitClassification: pdfData.unitClassification,
    classificationPosh: pdfData.classificationPosh,
    bankImage: pdfData.bankImage ? 'EXISTS' : 'MISSING',
    clientImage: pdfData.clientImage ? 'EXISTS' : 'MISSING'
  });

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
        font-size: 12pt; 
        line-height: 1.2; 
        color: #000;
        margin: 0;
        padding: 0;
        background: white;
      }
      @page {
        size: A4;
        margin: 12mm;
        padding: 0;
      }
      
      @page :first {
        margin-top: 12mm;
        margin-bottom: 12mm;
      }
      
      /* PDF Page Container System */
      .continuous-wrapper {
        display: block;
        width: 100%;
        margin: 0;
        padding: 0;
        background: white;
      }

      /* Individual Page Container */
      .pdf-page {
        width: 210mm;
        height: auto;
        margin: 0;
        padding: 12mm;
        background: white;
        page-break-after: always;
        break-after: page;
        position: relative;
        box-sizing: border-box;
        overflow: visible;
        display: block;
      }
      
      /* Header (40mm height) */
      .pdf-header {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        padding: 10mm 12mm;
        background: white;
        box-sizing: border-box;
        z-index: 10;
        overflow: visible;
      }
      
      /* Footer (40mm height) */
      .pdf-footer {
        position: relative;
        bottom: 0;
        left: 0;
        width: 100%;
        height: auto;
        padding: 10mm 12mm;
        background: white;
        box-sizing: border-box;
        z-index: 10;
        overflow: visible;
      }
      
      /* Content Area (between header and footer) */
      .pdf-content {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        overflow-y: visible;
        overflow-x: hidden;
        padding: 0 12mm;
        box-sizing: border-box;
        background: white;
      }

      .page { 
        page-break-after: always;
        break-after: page;
        padding: 12mm;
        background: white; 
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        overflow: visible;
        display: block;
        clear: both;
        margin: 0;
        page-break-inside: avoid;
      }

      .form-table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        margin: 12px 0;
        font-size: 11pt;
        table-layout: fixed;
        page-break-inside: avoid;
        break-inside: avoid;
        display: table;
        clear: both;
        max-width: 100%;
        overflow: visible;
      }

      .form-table.fixed-cols {
        table-layout: fixed;
      }

      .form-table tbody {
        display: table-row-group;
        width: 100%;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Keep table rows together on same page */
      .form-table tr {
        display: table-row;
        page-break-inside: avoid;
        break-inside: avoid;
        height: auto;
        page-break-before: auto;
      }

      .form-table tr:first-child {
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-before: auto;
      }

      .form-table.compact tr {
        height: auto;
        min-height: 18px;
        page-break-inside: auto;
        break-inside: auto;
      }

      .form-table.compact td {
        padding: 8px 10px;
        min-height: 18px;
      }

      /* Hide/Show classes for screen vs print */
      .hide-on-screen {
        display: none !important;
      }

      .show-on-print {
        display: none !important;
      }

      @media print {
        .hide-on-screen {
          display: block !important;
        }

        .show-on-print {
          display: block !important;
        }

        .hide-on-print {
          display: none !important;
        }
      }

      .form-table td {
        padding: 6px 8px;
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
        height: auto;
        font-weight: normal;
        font-size: 11pt;
        line-height: 1.2;
      }

      .form-table .row-num {
        width: 8%;
        min-width: 8%;
        max-width: 8%;
        text-align: center;
        font-weight: normal;
        background: #ffffff;
        padding: 6px 6px;
        vertical-align: top;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        overflow: visible;
        height: auto;
        font-size: 11pt;
      }

      .form-table .label {
        width: 45%;
        min-width: 45%;
        max-width: 45%;
        font-weight: normal;
        background: #ffffff;
        word-wrap: break-word;
        overflow-wrap: break-word;
        vertical-align: top;
        padding: 6px 8px;
        white-space: normal;
        page-break-inside: avoid;
        break-inside: avoid;
        height: auto;
        word-break: break-word;
        overflow: visible;
        font-size: 11pt;
        line-height: 1.2;
      }

      .form-table .value {
        width: 55%;
        min-width: 55%;
        max-width: 55%;
        text-align: left;
        background: white;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        vertical-align: top;
        padding: 6px 8px;
        white-space: normal;
        page-break-inside: avoid;
        break-inside: avoid;
        height: auto;
        overflow: visible;
        font-weight: normal;
        font-size: 11pt;
        line-height: 1.2;
      }

      .header { 
        text-align: center; 
        margin-bottom: 15px; 
        font-weight: bold;
        font-size: 12pt;
      }

      /* Section wrapper for floor data (GR, etc) */
      .floor-section {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 12px;
        padding: 0;
      }

      .floor-section:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      /* 4-column table support for boundaries */
      .form-table.four-col td {
        padding: 8px 10px;
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
        height: auto;
        font-size: 11pt;
      }

      .form-table.four-col .row-num {
        width: 10%;
        min-width: 10%;
        max-width: 10%;
        padding: 6px 6px;
        font-size: 11pt;
      }

      .form-table.four-col .label {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
        font-size: 11pt;
      }

      .form-table.four-col .deed {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        text-align: center;
        font-weight: normal;
        font-size: 11pt;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      .form-table.four-col .actual {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        text-align: center;
        font-weight: normal;
        font-size: 11pt;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      /* Standalone deed and actual for non-four-col tables */
      .form-table .deed {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
        text-align: center;
        font-weight: normal;
        font-size: 11pt;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      .form-table .actual {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
        text-align: center;
        font-weight: normal;
        font-size: 11pt;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      /* For rows with deed/actual columns, label should be narrower */
      tr:has(td.deed) .label,
      tr:has(td.actual) .label {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
      }

    
    </style>
  </head>
  <body>

  <!-- CONTINUOUS DATA TABLE -->
  <div class="continuous-wrapper" >
    <div style="padding: 0 12mm; padding-top: 1mm;">
      
      <!-- Property Details Table -->
      <div style="text-align: center; margin-bottom: 15px;">
        <p style="font-size: 20pt; font-weight: bold; margin: 0; color: #4472C4;">VALUATION REPORT</p>
      </div>
      
      <table class="form-table" style="border-collapse: collapse; border: 1px solid #000; margin-bottom: 20px; width: 100%;">
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Account Name</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'accountName')}</td>
        </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Name of Owner</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Client</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'bankName')},${safeGet(pdfData, 'client', safeGet(pdfData, 'bankName', ''))},${safeGet(pdfData, 'city')}</td>
          </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Property Details</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'propertyDetails', 'Residential Property')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Location</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'postalAddress', safeGet(pdfData, 'addressOfPropertyUnderValuation', 'NA'))}</td>
        </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Purpose of Property</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'purposeOfProperty', 'Continue Financial Assistance Purpose')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Date of Valuation</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; font-weight: bold; font-size: 11pt;">${formatDate(safeGet(pdfData, 'dateOfValuation', safeGet(pdfData, 'inspectionDate')))}</td>
        </tr>
      </table>

<!-- Bank Image Below Table -->
<div class="image-container"
     style="
        text-align: center;
        margin-top: 20px;
        margin-bottom: 0;
        page-break-after: always;
        break-after: page;
      
        box-sizing: border-box;
     ">
  ${pdfData.bankImage ? (() => {
    const bankImg = pdfData.bankImage;
    const imgUrl = typeof bankImg === 'string'
      ? bankImg
      : (bankImg?.url || bankImg?.preview || bankImg?.data || '');

    return imgUrl
      ? `<img
            src="${getImageSource(imgUrl)}"
            alt="Bank Logo"
            style="
              width: 700px;
              height: 450px;
              max-width: 100%;
              object-fit: contain;
              display: block;
              margin: 0 auto;
              border: 2px solid #000 !important;
              padding: 5px !important;
              box-sizing: border-box !important;
            "
            class="pdf-image"
            crossorigin="anonymous"
         />`
      : '';
  })() : ''}
</div>
<!-- VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE SECTION -->
<div class=""
     style="
        margin: 0px -12mm 0px -12mm;
        padding: 0;
        box-sizing: border-box;
        page-break-before: always;
        break-before: page;
        width: calc(100% + 24mm);
        overflow: hidden;
     ">

  <div class="no-break"
       style="
          text-align: center;
          margin-top: 30px;
          padding: 0 12mm;
          box-sizing: border-box;
       ">
    <p style="
          font-size: 16pt;
          margin-bottom: 10px;
          font-weight: bold;
          color: #4472C4;
       ">
      VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE
    </p>
  </div>

    <div style="box-sizing: border-box; width: 100%; margin: 0; padding: 0 12mm; overflow: hidden;">
    <table class="form-table"
      style="width:100%; border-collapse: collapse; border: 1px solid #000; font-family: Arial, sans-serif; font-size:11pt; margin:0; padding:0; box-sizing: border-box; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <td style="border:1px solid #000; padding:6px; width:35%; font-weight:bold;">
          Applicant
        </td>
        <td style="border:1px solid #000; padding:6px; width:65%; ">
          ${safeGet(pdfData, 'bankName')},${safeGet(pdfData, 'client', safeGet(pdfData, 'bankName', ''))},${safeGet(pdfData, 'city') }
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Valuation done by Govt. Approved Valuer
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(
      pdfData,
      'valuationDoneByGovtApprovedValuer',
      "IBBI Regd. & Govt. Approved Valuer & Bank's Panel Valuer"
    )}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Purpose of Valuation
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          To ascertain fair market value for
          <em>${safeGet(pdfData, 'purposeOfProperty', 'Continue Financial Assistance Purpose')}</em>
          (My opinion for the probable value of the property only)
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Borrower Account Name
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'accountName', safeGet(pdfData, 'borrowerAccountName', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Name of Owner / Owners
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Address of property under valuation
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'postalAddress', safeGet(pdfData, 'addressOfPropertyUnderValuation', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Brief description of the Property
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'briefDescriptionProperty', safeGet(pdfData, 'briefDescriptionOfProperty', 'NA'))}
        </td>
      </tr>

      <tr>
         <td style="border:1px solid #000; padding:6px; font-weight:bold;">
           Revenue details as per Sale deed / Authenticate Documents
         </td>
         <td style="border:1px solid #000; padding:6px; ">
           ${safeGet(pdfData, 'revenueDetailsPerSaleDeed', 'FP No. 151, TPS No. 29, Sub Plot No. 9/P, Sur. No. 88/1, Mouje: Naranpura, Ta. City, Dist. Ahmedabad.')}
         </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Area of Land
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          As per GRUDA Impact Plan:<br>
          Net Plot Area = ${safeGet(pdfData, 'areaOfLand', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Value of Land
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${formatCurrencyWithWords(safeGet(pdfData, 'valueOfLand', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Area of Construction
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'areaOfConstruction', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          Value of Construction
        </td>
        <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'valueOfConstruction', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;margin-top: 80px;">
          TOTAL MARKET VALUE OF THE PROPERTY
        </td>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'marketValueOfProperty', 'NA') )}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          REALISABLE VALUE (90% of MV)
        </td>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'realizableValue', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          DISTRESS SALE VALUE (80% of MV)
        </td>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'distressValue','NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          JANTRI VALUE OF PROPERTY
        </td>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'jantriValueOfProperty', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          INSURABLE VALUE OF PROPERTY
        </td>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">
          ${formatCurrencyWithWords(
      safeGet(pdfData, 'insurableValue ',
        safeGet(pdfData, 'insurableValue', 'NA'))
    )}
        </td>
      </tr>
      </table>
      <tr>
         <td colspan="3" style="border: none !important; border-bottom: none !important; padding: 5px 6px;">
           <div style="display: flex; justify-content: space-between; align-items: flex-start;">
             <div style="text-align: left;">
               <p style="margin: 4px 0; font-size: 12pt; padding: 4px; border: none; text-decoration: none;"><strong>Date:</strong> ${safeGet(pdfData, 'dateOfValuation')}</p>
               <p style="margin: 4px 0; font-size: 12pt; padding: 4px; border: none; text-decoration: none;"><strong>Place:</strong>${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</p> 
             </div>
             <div style="text-align: right;">
               <p style="margin: 0; border: none; text-decoration: none;"><strong>Rajesh Ganatra</strong></p>
               <p style="margin: 4px 0; border: none; text-decoration: none;"><strong>Govt. Registered Valuer</strong></p>
             </div>
           </div>
         </td>
       </tr>
      </div>
      </div>
      </div>
      <!-- END: valued-property-section -->


       <!-- ANNEXURE-XIV SECTION -->

      <!-- ANNEXURE-XIV: FORMAT OF VALUATION REPORT -->
      <div style="padding: 0 12mm; margin-top: 30px; page-break-before: always; box-sizing: border-box; width: 100%;">
      <div style="text-align: center; margin-bottom: 5px;">
      <p style="margin: 0; font-weight: bold; font-size: 12pt;">ANNEXURE-XIV</p>
      <p style="margin: 0; font-weight: bold; font-size: 12pt;">FORMAT OF VALUATION REPORT</p>
      <p style="margin: 0; font-weight: bold; font-size: 11pt; padding: 4px;">(to be used for all properties of value upto Rs.5 Crore)</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 15px; font-size: 12pt; border-spacing: 0;">
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">Name & Address of Branch</td>
        <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">Name of Customer (s)/ Borrower:<br/><em>(for which valuation report is sought)</em></td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 50%;">
          To,<br/>The Chief Manager,<br/>${safeGet(pdfData, 'bankName')},<br/>${safeGet(pdfData, 'client', safeGet(pdfData, 'bankName', ''))},</br> ${safeGet(pdfData, 'city')}.
        </td>
        <td style="border: 1px solid #000; padding: 8px; width: 50%;">
          <p style="margin: 0; margin-bottom: 8px;"><strong>Borrower Name:</strong> ${safeGet(pdfData, 'accountName')}</span></p>
          <p style="margin: 0;"><strong>Owner Name</strong> <span>${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}</span></p>
        </td>
      </tr>
      </table>

      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed; empty-cells: show; border-spacing: 0;">
        <colgroup>
          <col style="width: 5%;">
          <col style="width: 47.5%;">
          <col style="width: 47.5%;">
        </colgroup>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">1</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Customer Details:</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
        </tr>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Name of the Property Owner</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}</td>
        </tr>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Contact Number of Representative</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'contactNumberOfRepresentative', safeGet(pdfData, 'mobileNumber', 'NA'))}</td>
        </tr>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Date of Inspection of Property</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${formatDate(safeGet(pdfData, 'dateOfInspectionOfProperty', safeGet(pdfData, 'inspectionDate', safeGet(pdfData, 'dateOfInspection', 'NA'))))}</td>
        </tr>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Date of Valuation Report</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${formatDate(safeGet(pdfData, 'dateOfValuationReport', safeGet(pdfData, 'valuationMadeDate', safeGet(pdfData, 'dateOfValuation', 'NA'))))}</td>
        </tr>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">2</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Property Details</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
        </tr>
        <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Address</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'addressOfPropertyUnderValuation')}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Nearby Landmark/Google Map<br/>Independent access to the property</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'latitudeLongitude', safeGet(pdfData, 'nearbyLandmarkGoogleMap', 'NA'))}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">3</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Document Details</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;"></td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">i.</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Sale Deed</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'saleDeed', 'NA')}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">ii.</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">GRUDA Impact Plan</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'grudaImpactPlan', 'NA')}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">iii.</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Layout Plan</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'layoutPlan', 'NA')}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">iv.</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Construction Permission</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'constructionPermission', 'NA')}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">v.</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">Light Bill</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'lightBill', 'NA')}</td>
          </tr>
          <tr>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;font-weight: bold;">vi.</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px; font-weight: bold;">TAX Bill</td>
          <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'taxBill', 'NA')}</td>
          </tr>
      </table>
      </div>
                            
      <div style="margin-top: 0px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
        <tr>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;">4. Physical Details</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold;">Adjoining Properties</td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; text-align: center; font-weight: bold;">As per Document</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; text-align: center; font-weight: bold;">As per Site</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">North</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesNorthDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesNorthSite', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">South</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesSouthDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesSouthSite', 'NA')}</td>
        </tr>
      
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; font-weight: bold;">As per Document</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; font-weight: bold;">As per Site</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">East</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesEastDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesEastSite', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">West</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesWestDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesWestSite', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Matching of Boundaries</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'matchingOfBoundaries', safeGet(pdfData, 'boundary_boundaryConditionDetails', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Plot Demarcated :</strong> ${safeGet(pdfData, 'plotDemarcated', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Approved land use</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'approvedLandUse', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Type of Property:</strong> ${safeGet(pdfData, 'typeOfProperty', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">No. of Rooms</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Living/Dining:</strong> ${safeGet(pdfData, 'noOfRoomsLivingDining', 'NA')}<br/><strong>Toilet/Bath:</strong> ${safeGet(pdfData, 'noOfRoomsToiletBath', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Bed Rooms: </strong>${safeGet(pdfData, 'bedRooms', 'NA')}<br/><strong>Kitchen + Store:</strong> ${safeGet(pdfData, 'kitchenStore', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Total No of Floor</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'totalNoOfFloor', safeGet(pdfData, 'numberOfFloors', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Floor located:</strong> ${safeGet(pdfData, 'floorOnWhichPropertyIsLocated', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Age of the Property</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'ageOfPropertyInYears', 'NA')} Years</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Residual age:</strong> ${safeGet(pdfData, 'residualAgeOfPropertyInYears', 'NA')} Years</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Year of Construction</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'yearConstruction', safeGet(pdfData, 'yearOfConstruction', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;"><strong>Total life:</strong> ${safeGet(pdfData, 'totalLifeOfPropertyInYears', 'NA')} Years</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold;">Type of structure: ${safeGet(pdfData, 'structureType', safeGet(pdfData, 'typeOfStructure', 'NA'))}</td>
        </tr>
      </table>
      </div>
                         
      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
        <colgroup>
          <col style="width: 5%;">
          <col style="width: 47.5%;">
          <col style="width: 47.5%;">
        </colgroup>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;font-weight: bold;">5</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Tenure / Occupancy Details</td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Status of Tenure</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'statusOfTenure', 'Owner Occupied')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">No. of years of Occupancy Since</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'noOfYearsOfOccupancySince', '27 Years Approx.')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Relationship of tenant or owner</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'relationshipOfTenantOrOwner', 'NA')}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 20px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
        <colgroup>
          <col style="width: 5%;">
          <col style="width: 47.5%;">
          <col style="width: 47.5%;">
        </colgroup>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;font-weight: bold;">6</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Stage of Construction (for which valuation report is sought)</td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Stage of Construction</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'stageOfConstruction', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">If under construction, extent of completion</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'ifUnderConstructionExtentOfCompletion', 'NA')}</td>
        </tr>
      </table>
      </div>
                
      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
        <colgroup>
          <col style="width: 5%;">
          <col style="width: 47.5%;">
          <col style="width: 47.5%;">
        </colgroup>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;font-weight: bold;">7</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Violations if any observed</td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Violations if any Observed</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'violationsIfAnyObserved', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Nature and extent of violations</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'natureAndExtentOfViolations', 'NA')}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 47.5%;">
            <col style="width: 47.5%;">
          </colgroup>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;font-weight: bold;">8</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Area Details of Property (For Land &amp; Building method)</td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Land Area</td>
            <td style="border: 1px solid #000; padding: 8px;">
              <div style="padding: 4px;"><strong>As per Sale Deed:</strong> ${safeGet(pdfData, 'landAreaAsPerSaleDeed', safeGet(pdfData, 'landAreaPerSaleDeed', 'NA'))}</div>
              <div style="padding: 4px;"><strong>As per GRUDA:</strong> ${safeGet(pdfData, 'landAreaAsPerGRUDA', safeGet(pdfData, 'areaOfLand', 'NA'))}</div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Built-up Area</td>
            <td style="border: 1px solid #000; padding: 8px;">
              <div style="padding: 4px;"><strong>As per GRUDA:</strong> ${safeGet(pdfData, 'builtUpAreaAsPerGRUDA', safeGet(pdfData, 'builtUpAreaPerGrudaImpactPlan', 'NA'))}</div>
              <div style="padding: 4px;"><strong></div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Area Details of Property (For Composite rate method- Office / Flat / Shop) </td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">CA / BUA / SBUA – in sq. ft:</td>
            <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'cabuaSbuaInSqFt', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Remarks</td>
            <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'remarks', 'NA')}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 5px;">
         <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
           <colgroup>
             <col style="width: 5%;">
             <col style="width: 47.5%;">
             <col style="width: 47.5%;">
           </colgroup>
           <tr>
             <td style="border: 1px solid #000; padding: 8px;font-weight: bold;">9</td>
             <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Valuation</td>
             <td style="border: 1px solid #000; padding: 8px;"></td>
           </tr>
           <tr>
             <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Guideline Rate obtained from
Registrar’s office/State Govt. Gazette/ 
Income Tax Notification</td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">
               ${safeGet(pdfData, 'guidelineRateObtainedFrom', safeGet(pdfData, 'guidelineSource', 'NA'))}<br><br>
          
             </td>
           </tr>
          
         </table>
         <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
           <colgroup>
             <col style="width: 5%;">
             <col style="width: 47.5%;">
             <col style="width: 47.5%;">
           </colgroup>
           <tr>
             <td style="border: 1px solid #000; padding: 8px;"></td>
             <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;">d) Summary of Valuation</td>
             <td style="border: 1px solid #000; padding: 8px;"></td>
           </tr>
           <tr>
             <td style="border: 1px solid #000; padding: 8px;"></td>
             <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Guideline Value</td>
             <td style="border: 1px solid #000; padding: 8px;">${formatCurrencyWithWords(safeGet(pdfData, 'guidelineValue', 'NA'))}</td>
           </tr>
           </table>
       </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; text-align: center;">MARKET VALUE OF THE PROPERTY</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
        <colgroup>
          <col style="width: 10%;">
          <col style="width: 30%;">
          <col style="width: 30%;">
          <col style="width: 30%;">
        </colgroup>
        <tr>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;font-weight: bold;">1.</td>

          <td colspan="7" style="border: 1px solid #000; padding: 8px; font-weight: bold;">LAND VALUE:</td>
         
        </tr>
          
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Sr. No.</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Land Area – SFT</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Land Rate per Sq Ft</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Value of Land</td>
          </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">1.</td>
          <td style="border: 1px solid #000; padding: 8px;">As per Plan:<br>${safeGet(pdfData, 'landAreaSFT', safeGet(pdfData, 'areaOfLand', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'landRatePerSqFt', safeGet(pdfData, 'landRate', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px;">${(safeGet(pdfData, 'valueOfLand', 'NA'))}</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: right;">Total Land Value</td>
          <td colspan="1" style="border: 1px solid #000; padding: 8px; font-weight: bold;">${(safeGet(pdfData, 'valueOfLand', 'NA'))}</td>
        </tr>
      </table>
      </div>
      
<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt; font-family: Arial, sans-serif;">
  <thead>
  <p style="margin-top: 15px;"><strong>2. BUILDING VALUE </strong> </p>
    <tr>
      <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; text-align: center; vertical-align: middle;">Sr. No.</td>
      <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold; text-align: center; vertical-align: middle;">Particulars of item</td>
      <td style="border: 1px solid #000; padding: 8px; width: 12%; font-weight: bold; text-align: center; vertical-align: middle;">Plinth area<br/>(In Sq.Ft.)</td>
      <td style="border: 1px solid #000; padding: 8px; width: 8%; font-weight: bold; text-align: center; vertical-align: middle;">Roof Heights<br/>(Appx.)</td>
      <td style="border: 1px solid #000; padding: 8px; width: 8%; font-weight: bold; text-align: center; vertical-align: middle;">Age of the<br/>Building</td>
      <td style="border: 1px solid #000; padding: 8px; width: 22%; font-weight: bold; text-align: center; vertical-align: middle;">Estimated Replacement Depreciated<br/>Rate of Construction per sq.ft</td>
      <td style="border: 1px solid #000; padding: 8px; width: 25%; font-weight: bold; text-align: center; vertical-align: middle;">Value of Construction</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">1.</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">As per Plan: Total BUA</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">
        ${safeGet(pdfData, 'plinthArea', safeGet(pdfData, 'buildingValuePlinthArea', ''))}<br/>
        <small>SFT</small>
      </td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">
        ${safeGet(pdfData, 'roofHeight', safeGet(pdfData, 'buildingValueRoofHeight', ''))}<br/>
        <small>Mt</small>
      </td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">
        ${safeGet(pdfData, 'ageOfBuilding', safeGet(pdfData, 'buildingValueAge', ''))}
      </td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">
        ${safeGet(pdfData, 'estimatedReplacementRate', safeGet(pdfData, 'buildingValueEstimatedReplacementRate', '£ 0000/- per sq.ft'))}
      </td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">
        ${(safeGet(pdfData, 'valueOfConstruction', ''))}
      </td>
    </tr>
    <tr>
      <td colspan="6" style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: right; vertical-align: middle;">
        Total Building Value
      </td>
      <td colspan="1" style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; vertical-align: middle;">
          ${(safeGet(pdfData, 'valueOfConstruction', ''))}      </td>
    </tr>
  </tbody>
</table>

      <div style="margin-top: 5px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: right; font-weight: bold;">Market Value of Property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'marketValueOfProperty', safeGet(pdfData, 'totalMarketValueOfProperty', safeGet(pdfData, 'marketValue', 'NA'))))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: right; font-weight: bold;">Realizable value Rs. (90% of Fair market value)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'realizableValue', 'NA'))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: right; font-weight: bold;">Distress Value Rs. (80% of Fair market value)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'distressValue', 'NA'))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: right; font-weight: bold;">Insurable Value of the Property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'insurableValue', safeGet(pdfData, 'insurableValueOfProperty', 'NA')))}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;text-align: right; font-weight: bold;">Jantri Value of the Property</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'jantriValueOfProperty', 'NA'))}</td>
        </tr>
        </table>
      </div>

      

      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
       
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">e) i. In case of variation of 20% or more in the valuation proposed by the valuer and the Guideline value provided in the State Govt. notification or Income Tax Gazette Justification on variation has to be given.</td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">a. Guideline value (Jantri rate) of land/property is the value of the land/property as determined by the government, based on it own metrics of facilities and infrastructure growth in that locality. The stamp duty and registration charges for registering a property deal, is based upon this guideline value. The guideline values are revised periodically but then in sync with the market value; Jantri rates are not relevant in current scenario, as they were last updated in April 2011. Actual market rates have more than doubled since then, depending upon area, locality, demand and supply and other various factors.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">b.Being this the situation, it has been observed that sale deeds are executed at lower price of Jantri rates to save registration charges / stamp duty. So these instances does not reflect actual transaction amount / market rate. Moreover now days, in actual market, transactions are done on super built-p area, whereas guideline value (Jantri rate ) is based on carpet area. Both the areas have difference of about 40-50% This also makes difference between two values.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">c. In present system certain value zones are established at macro levels, but within the same value zone the land prices of all the plots cannot be same. There are certain negative / positive factors, which are attached to any parcel of land, like width of the road on which a plot abuts, frontage to depth ratio, adjoining slum or hutments, title of the property, certain religious & sentimental factors, proximity to high tension electricity supply lines, crematorium, socio economic pattern, stage of infrastructure, development etc. whereas guideline rate are prescribes as uniform rates for particular FP/Zone.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;"> d.Property/land/flat on the main road in any area is priced higher and should be valued higher than that in interiors, whereas guideline rate considered them all with equal perspective.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;"> e. In real estate market, it has been observed that many type of values present in market like forced sale value, sentimental value, monopoly value etc. so it cannot be generalized, while guideline value (Jantri rate) considered them all with one value per zone.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">f. Moreover two projects of two different builder having different reputation & quality work in same zone may fetch different values. different builders projects in same zone are now considered for valuation purpose.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">g. Government policies also change the trends/values in real estate market, for example demonetisation, GST etc. the real estate market reacts immediately for these policies for uptrend or downtrend. So this also affects the market rate heavily. While guideline rates remain same.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">h. It may not be possible to have a method to fix guideline (Jantri rate) values without anomalies as each site has different characteristics. But it is always desired to revise guideline value (Jantri rate) at regular intervals (e.g. Six months) or so, as it is the trend observed in other states e.g. Maharashtra (Mumbai) & other states.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">i. Recently in year 2023, Govt. has released Revised GR for Guideline rate calculation, Tharav No. 122023/20/H/1, Dt. 13/04/2023, as per that various revision are mentioned in Land Rate for Residential land, Composite Rate for Office use and Shop Use, and Agricultural Use etc. The GR is attached herewith</td>
        </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Details of last two transactions in the locality/area to be provided, if available.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">Details not found, please considered above facts</td>
          </tr>
          <tr>
              <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;">REMARKS:</td>
          </tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 45%;">
            <col style="width: 50%;">
          </colgroup>
          <tr>
          <td style="border: 1px solid #000; padding: 8px;font-weight: bold;">10</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Assumptions/Remarks</td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">1</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Qualifications in TIR/Mitigation suggested, if any</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'qualificationsInTIR', 'No')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">2</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Property is SARFAESI compliant</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'propertyIsSARFAESICompliant', 'Yes, Subject to title Clear report of panel advocate of Bank')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">3</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Whether property belongs to social infrastructure like hospital, school, old age home etc.</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'propertyBelongsToSocialInfrastructure', 'No')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">4</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Whether entire piece of land on which the unit is set up the property is situated has been mortgaged or to be mortgaged.</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'entireLandMortgaged', 'Yes')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">5</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Details of last two transactions in the locality/area to be provided, if available.</td>
          <td style="border: 1px solid #000; padding: 8px;">As widely known, Market records at sub-Registrar office generally at Jantri value market value evidence is difficult to obtain for reasons of unrecorded/unaccounted market value. Thus, it is not possible to cite last two transactions, in the valuation report.</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">6</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Any other aspect which has relevance on the value or marketability of the property</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'anyOtherAspectOnMarketability', 'No')}</td>
          </tr>
          </table>
          </div>

          <div style="margin-top: 0px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
              <tr>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;">11. Declaration</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">1. <span style=";"><strong>The property was inspected by  Mr. Dhruvalbhai  ${safeGet(pdfData, 'dateOfInspectionOfProperty')}.</strong></span></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">2. The undersigned does not have any direct/indirect interest in the above property.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">3. The information furnished herein is true and correct to the best of our knowledge.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">4. I have submitted Valuation report directly to the Bank.</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 5px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;">12. Name address &amp; signature of valuer</td>
              </tr>
              <tr>
                 <td style="border: 1px solid #000; padding: 8px; width: 50%;">
                    <span style="border: none; text-decoration: none;"><strong>Place: ${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</strong></span><br>
                    <span style="border: none; text-decoration: none;"><strong>Date: ${pdfData.reportDate ? formatDate(pdfData.reportDate) : (pdfData.valuationDate ? formatDate(pdfData.valuationDate) : (pdfData.valuationMadeDate ? formatDate(pdfData.valuationMadeDate) : 'NA'))}</strong></span>
                  </td>
                  <td style="border: 1px solid #000; padding: 8px; width: 50%; text-align: right;">
                    <strong>Rajesh Ganatra</strong><br>
                    Govt. Approved Valuer
                  </td>
                </tr>
             </table>
           </div>

          <div style="margin-top: 5px; page-break-inside: avoid;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
              <colgroup>
                <col style="width: 5%;">
                <col style="width: 70%;">
                <col style="width: 25%;">
              </colgroup>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">13</td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;"> Enclosures</td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Layout plan sketch of the area in which the property is located with latitude and longitude</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'layoutPlanSketch', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Building Plan</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'buildingPlan', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Floor Plan</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'floorPlan', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Photograph of the property (including geo- stamping with date) and owner (in case of housing loans, if borrower is available) including a "Selfie" of the Valuer at the site</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'photographsOfProperty', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Certified copy of the approved / sanctioned plan wherever applicable from the concerned office</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'certifiedCopyOfApprovedPlan', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Google Map location of the property</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'googleMapLocation', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Price trend of the Property in the locality/city from property search sites viz Magickbricks.com, 99Acres.com, Makan.com etc</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'priceTrendFromPropertySites', 'Attached as under')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Any other relevant documents/ extracts</td>
                <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'anyOtherRelevantDocuments', 'NA')}</td>
              </tr>
              </table>
              </div>
                  <!-- CUSTOM FIELDS SECTION - AFTER 13. ENCLOSURES -->
              ${pdfData.customFields && Array.isArray(pdfData.customFields) && pdfData.customFields.length > 0 ? `
              <div style="margin-top: 25px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                    <td style="border: 1px solid #000; padding: 8px; width: 70%; font-weight: bold;">Custom Fields</td>
                    <td style="border: 1px solid #000; padding: 8px; width: 25%;"></td>
                  </tr>
                  ${pdfData.customFields.map((field, index) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">${safeGet(field, 'name', 'Custom Field')}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${safeGet(field, 'value', 'NA')}</td>
                  </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}

              <div style="margin-top: 15px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
              As a result of my appraisal and analysis, it is my considered opinion that the present <span style=";"><strong>Fair Market Value of the above property in the prevailing Condition with aforesaid specifications is  ${formatCurrencyWithWords(safeGet(pdfData, 'marketValueOfProperty', safeGet(pdfData, 'totalMarketValueOfProperty', safeGet(pdfData, 'marketValue', 'NA'))))}
</strong></span>
              </p>
              </div>
              <div style="margin-top: 10px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
               <span style=";"><strong>The Realizable value of the above property  ${formatCurrencyWithWords(safeGet(pdfData, 'realizableValue', 'NA'))}</strong></span>
              </p>
            </div>
            <div style="margin-top: 15px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
               <span style=";"><strong>The Distress value  ${formatCurrencyWithWords(safeGet(pdfData, 'distressValue', 'NA'))}</strong></span>
              </p>
            </div>
            <div style="margin-top: 15px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
               <span style=";"><strong>The Book value of the above property as per Sale Deed (Reg. No. 1473, Dt. 30/03/1998.) is  ${formatCurrencyWithWords(safeGet(pdfData, 'bookValueOfProperty', 'NA'))}</strong></span>
              </p>
            </div>
            <div style="margin-top: 30px;">
              <p style="margin: 5px 0; border: none; text-decoration: none;"><strong>Dated :- ${safeGet(pdfData, 'reportDate') ? formatDate(pdfData.reportDate) : (safeGet(pdfData, 'valuationDate') ? formatDate(pdfData.valuationDate) : 'NA')}</strong></p></br>
              <p style="margin: 5px 0; border: none; text-decoration: none;"><strong>Place:- ${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</strong></p>
            </div>
            <div style="margin-top: 20px; text-align: right;">
              <p style="margin: 5px 0; font-weight: bold;">GOVT. REGD APPROVED VALUER</p>
            </div>
         

            <!-- Inspection Statement -->
            <div style="margin-top: 40px; line-height: 2; clear: both;">
              <p style="font-size: 12pt;">The undersigned has inspected the property detailed in the Valuation Report dated ${safeGet(pdfData, 'reportDate') ? formatDate(pdfData.reportDate) : '_______'} .</p>
              <p style="font-size: 12pt;">We are satisfied that the fair and reasonable market value of the property is Rs. ${safeGet(pdfData, 'fairMarketValue', '________')} (Rupees only).</p>
              <p style="margin-top: 60px; text-align: right; font-weight: bold;">Signature</p>
              <p style="text-align: center; font-weight: bold;text-align: right;">(Name of the Branch Manager with Official seal)</p>
            </div>
          

          
            
            <div style="margin-top: 20px;  page-break-before: always;">

            <p style="margin-bottom: 10px; text-align: center; font-weight: bold; ">CHECKLIST OF DOCUMENT</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11pt;">
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #ffffff; text-align: left;">Engagement Letter / Confirmation for Assignment</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_engagementLetterConfirmation', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_engagementLetterConfirmation', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Ownership Documents: Sale Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_ownershipDocumentsSaleDeed', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_ownershipDocumentsSaleDeed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Adv. TCR / LSR</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_advTcrLsr', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_advTcrLsr', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Allotment Letter</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_allotmentLetter', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_allotmentLetter', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Kabular Lekh</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_kabulatLekh', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_kabulatLekh', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Mortgage Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_mortgageDeed', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_mortgageDeed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Lease Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_leaseDeed', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_leaseDeed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Index – 2</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_index2', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_index2', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">VF: 7/12 in case of Land</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_vf712InCaseOfLand', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_vf712InCaseOfLand', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">NA order</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_naOrder', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_naOrder', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Approved Plan</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_approvedPlan', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_approvedPlan', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Commencement Letter</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_commencementLetter', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_commencementLetter', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">BU Permission</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_buPermission', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_buPermission', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Ele. Meter Photo</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_eleMeterPhoto', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_eleMeterPhoto', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Light Bill</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_lightBill', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_lightBill', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Muni. Tax Bill</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_muniTaxBill', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_muniTaxBill', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Numbering = Flat / bungalow / Plot No. / Identification on Site</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_numberingFlatPlotNoIdentification', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_numberingFlatPlotNoIdentification', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Boundaries of Property – Proper Demarcation</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_boundariesPropertyDemarcation', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_boundariesPropertyDemarcation', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Merged Property?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_mergedProperty', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_mergedProperty', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Premise can be Separated, and Entrance / Dorr is available for the mortgaged property?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_premiseCanBeSeparatedEntrance', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_premiseCanBeSeparatedEntrance', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Land is Locked?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_landIsLocked', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_landIsLocked', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Property is rented to Other Party</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_propertyIsRentedToOtherParty', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_propertyIsRentedToOtherParty', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">If Rented = Rent Agreement is Provided?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_ifRentedRentAgreementProvided', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_ifRentedRentAgreementProvided', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Site Visit Photos</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_siteVisitPhotos', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_siteVisitPhotos', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Selfie with Owner / Identifier</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_selfieWithOwnerIdentifier', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_selfieWithOwnerIdentifier', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Mobile No.</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_mobileNo', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_mobileNo', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Data Sheet</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_dataSheet', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_dataSheet', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Tentative Rate</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_tentativeRate', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_tentativeRate', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Sale Instance / Local Inquiry / Verbal Survey</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_saleInstanceLocalInquiry', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_saleInstanceLocalInquiry', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Broker Recording</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_brokerRecording', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_brokerRecording', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Past Valuation Rate</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_pastValuationRate', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'pdfDetails.checklist_pastValuationRate', '--'), false)}</td>
              </tr>
            </table>
    
   <!-- SOP Section -->
    <div style="margin-top: 15px; width: 100%; padding: 12px; border: 1px solid #000; font-size: 12pt;">
      <p style="margin: 0 0 8px 0; font-weight: bold; text-align: left;">STANDARD OPERATING PROCEDURE (SOP)</p>
      <p style="margin: 4px 0; text-align: left;">1 &nbsp;&nbsp;BANK GUIDELINES FOR VALUER</p>
      <p style="margin: 4px 0; text-align: left;">2 &nbsp;&nbsp;<span><u>www.donfinworld.io</u></span></p>
      <p style="margin: 4px 0; text-align: left;">3 &nbsp;&nbsp;Taskval App for Assignment Management</p>
    </div>
    </div>
          <div style="margin-top: 0px; padding: 10px; page-break-before: always;">
            <p style="margin: 5px 0; font-weight: bold;">❖ PREAMBLE</p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              Bank valuers in India rely on Standard Operating Procedures (SOPs) for several good reasons. SOPs help ensure consistency in property valuations by providing a standardised approach. This results in uniformity in the valuation process across different regions and properties, reducing discrepancies and ensuring fair and objective valuations. Moreover, SOPs establish guidelines and best practices that bank valuers must follow to maintain high-quality and accurate valuations. This guarantees that the bank receives reliable valuations, reducing the risk of financial loss due to overvaluation or undervaluation.
            </p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              SOPs also assist valuers in complying with regulatory frameworks and guidelines set by regulatory authorities, such as the Reserve Bank of India (RBI) and the Securities and Exchange Board of India (SEBI). Valuers who adhere to SOPs lessen the risk of non-compliance and associated penalties. Furthermore, by following standardised procedures, valuers can identify and assess potential risks associated with property valuations, such as legal issues, property conditions, market trends, and encumbrances. This enables banks to make informed lending decisions, reducing the risk of default and protecting the interests of the institution and its customers.
            </p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              SOPs establish ethical guidelines and professional standards for bank valuers, promoting integrity, objectivity, and transparency in the valuation process. By adhering to SOPs, valuers demonstrate their commitment to upholding ethical practices, enhancing the credibility of the valuation profession and maintaining public trust. SOPs also serve as a valuable tool for training new bank valuers and providing ongoing professional development opportunities. They act as a reference guide, helping valuers accurately understand the step-by-step process of conducting valuations. SOPs also facilitate knowledge sharing and consistency among valuers, ensuring that the expertise and experience of senior professionals are passed down to newer members of the profession.
            </p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              In summary, SOPs are crucial for bank valuers in India as they promote consistency, maintain quality, ensure regulatory compliance, mitigate risks, uphold professionalism, and support training and development. By following these procedures, bank valuers can provide accurate and reliable property valuations, contributing to a robust banking system.
            </p>

            <p style="margin: 15px 0; font-weight: bold;">❖ Standard Operating Procedure (SOP)</p>
            
      <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.6; font-size: 11pt; list-style: none;">
    <li style="margin-bottom: 8px;">1. Receive a valuation request from the bank.</li>
    <li style="margin-bottom: 8px;">2. Review the request thoroughly to understand the scope, purpose, and specific requirements of the valuation.</li>
    </br>
    <li style="margin-bottom: 8px;">3. Conduct a preliminary assessment of the property or asset to determine its feasibility for valuation.</li>
    <li style="margin-bottom: 8px;">4. Gather all relevant data and information about the property or asset, including legal documents, title deeds, surveys, plans, and other necessary documents provided by the bank.</li>
    <li style="margin-bottom: 8px;">5. Conduct an on-site inspection of the property or asset, taking photographs, measurements and noting essential details.</li>
 
    <li style="margin-bottom: 8px;">6. Collect market data and research comparable properties or assets in the vicinity to establish a benchmark for valuation.</li>
    <li style="margin-bottom: 8px;">7. Analyze the collected data and use appropriate valuation methods, such as the sales comparison approach, income approach, or cost approach, depending on the property or asset's nature.</li>
    <li style="margin-bottom: 8px;">8. Prepare a comprehensive and detailed valuation report that includes all relevant information, assumptions made, methodologies used, and supporting evidence.</li>
    <li style="margin-bottom: 8px;">9. Review the report meticulously for accuracy, completeness, and compliance with applicable valuation standards and guidelines.</li>
    <li style="margin-bottom: 8px;">10. Submit the valuation report to the bank within the agreed-upon timeframe.</li>
    <li style="margin-bottom: 8px;">10. Please note that payment for the valuation report is expected to be made within the bank's given time limit from the date of the report. Simply possessing the report will not fulfill its intended purpose.</li>
    <li style="margin-bottom: 8px;">11. Attend a meeting or provide additional clarification to the bank regarding the valuation report, if needed.</li>
    <li style="margin-bottom: 8px;">12. Address any queries or requests for revision from the bank and make necessary amendments to the valuation report as per their feedback.</li>
    <li style="margin-bottom: 8px;">13. Obtain final approval or acceptance of the valuation report from the bank.</li>
    <li style="margin-bottom: 8px;">14. Maintain records of all valuation reports, documents, and communication related to the valuation process for future reference and compliance purposes.</li>
    <li style="margin-bottom: 8px;">15. Follow up with the bank regarding any outstanding payments or administrative formalities.</li>
  </ol>


            <p style="margin: 15px 0; line-height: 1.6; text-align: justify; font-size: 11pt; font: bold;">
            While the process may differ based on the bank's specific requirements and the property or asset being evaluated, this flowchart is a solid foundation for all Banking Valuers in India to confidently and efficiently conduct valuations.
            </p>

            <p style="margin-top: 30px ; font-weight: bold;">Observations, Assumptions and Limiting Conditions</p>

          <ul style="margin: 10px 0; padding-left: 10px; line-height: 1.6; font-size: 11pt; list-style: none;">
    <li style="margin-bottom: 8px;">
      • The Indian Real Estate market is currently facing a transparency issue. It is highly fragmented and lacks authentic and reliable data on market transactions. The actual transaction value often differs from the value documented in official transactions. To accurately represent market trends, we conducted a market survey among sellers, brokers, developers, and other market participants. This survey is crucial to determine fair valuation in this subject area. Based on our verbal survey, we have gained insights into the real estate market in the subject area.
    </li>

    <li style="margin-bottom: 8px;">
      • To conduct a proper valuation, we have made the assumption that the property in question possesses a title that is clear and marketable and that it is free from any legal or physical encumbrances, disputes, claims, or other statutory liabilities. Additionally, we have assumed that the property has received the necessary planning approvals and clearances from the local authorities and that it adheres to the local development control regulations.
    </li>

    <li style="margin-bottom: 8px;">
      • Please note that this valuation exercise does not cover legal title and ownership matters. Additionally, we have not obtained any legal advice on the subject property's title and ownership during this valuation. Therefore, we advise the client/bank to seek an appropriate legal opinion before making any decisions based on this report.
    </li>

    <li style="margin-bottom: 8px;">
      • We want to ensure that our valuation is fair and accurate. However, it's important to note that any legal, title, or ownership issues could have a significant impact on the value. If we become aware of any such issues at a later date, we may need to adjust our conclusions accordingly.
    </li>

    <li style="margin-bottom: 8px;">
      • Throughout this exercise, we have utilized information from various sources, including hardcopy, softcopy, email, documents, and verbal communication provided by the client. We have proceeded under the assumption that the information provided is entirely reliable, accurate, and complete. However, if it is discovered that the data we were given is not dependable, precise, or comprehensive, we reserve the right to revise our conclusions at a later time.
    </li>

    <li style="margin-bottom: 8px;">
      • Please note that the estimated market value of this property does not include transaction costs such as stamp duty, registration charges, and brokerage fees related to its sale or purchase.
    </li>

    <li style="margin-bottom: 8px;">
      • When conducting a subject valuation exercise, it is important to consider the market dynamics at the time of the evaluation. However, it is essential to note that any unforeseeable developments in the future may impact the valuation. Therefore, it is crucial to remain vigilant and adaptable in the face of changing circumstances.
    </li>

    <li style="margin-bottom: 8px;">
      • Kindly take note that the physical measurements and areas given are only approximations. The exact age of the property can only be determined based on the information obtained during inspection. Furthermore, the remaining economic lifespan is an estimate determined by our professional judgment.
    </li>

    <li style="margin-bottom: 8px;">
      • Please note that the valuation stated in this report is only applicable for the specific purposes mentioned herein. It is not intended for any other use and cannot be considered valid for any other purpose. The report should not be shared with any third party without our written permission. We cannot assume any responsibility for any third party who may receive or have access to this report, even if consent has been given.
    </li>

    <li style="margin-bottom: 8px;">
      • Having this report or any copy of it does not grant the privilege of publishing it. None of the contents in this report should be shared with third parties through advertising, public relations, news, or any other communication medium without the written acceptance and authorization of VALUERS.
    </li>

    <li style="margin-bottom: 8px;">
      • To assess the condition and estimate the remaining economic lifespan of the item, we rely on visual observations and a thorough review of maintenance, performance, and service records. It's important to note that we have not conducted any structural design or stability studies, nor have we performed any physical tests to determine the item's structural integrity and strength.
    </li>

    <li style="margin-bottom: 8px;">
      • The report was not accompanied by any soil analysis, geological or technical studies, and there were no investigations conducted on subsurface mineral rights, water, oil, gas, or other usage conditions.
    </li>

    <li style="margin-bottom: 8px;">
      • The asset was inspected, evaluated, and assessed by individuals who have expertise in valuing such assets. However, it's important to note that we do not make any assertions or assume responsibility for its compliance with health, safety, environmental, or other regulatory requirements that may not have been immediately apparent during our team's inspection.
    </li>

    <li style="margin-bottom: 8px;">
      • During the inspection, if the units were not named, we relied on identification by the owner or their representative and documents like the sale deed, light bill, plan, tax bill, the title for ownership, and boundaries of the units. Without any accountability for the title of the units.
    </li>

    <li style="margin-bottom: 8px;">
      • Kindly be informed that the valuation report may require modifications in case unanticipated circumstances arise, which were not considered in the presumptions and restrictions specified in the report.
    </li>

    <li style="margin-bottom: 8px;">
      • Additional observations, assumptions, and any relevant limiting conditions are also disclosed in the corresponding sections of this report and its annexes.
    </li>
  </ul>
 
    <p style="margin: 10px 0; font-weight: bold; font-size: 12pt;">❖ Our standard terms and conditions of professional engagement govern this report. They are outlined below:</p>
  
    <ol style="margin: 10px 0; padding-left: 10px; line-height: 1.6; font-size: 11pt; list-style: none;">
    <li style="margin-bottom: 8px;">
      1. Valuers will be liable for any issues or concerns related to the Valuation and/or other Services provided. This includes situations where the cause of action is in contract, tort (including negligence), statute, or any other form. However, the total amount of liability will not exceed the professional fees paid to VALUERS for this service.
    </li>

    <li style="margin-bottom: 8px;">
      2. VALUERS and its partners, officers, and executives cannot be held liable for any damages, including consequential, incidental, indirect, punitive, exemplary, or special damages. This includes damages resulting from bad debt, non-performing assets, financial loss, malfunctions, delays, loss of data, interruptions of service, or loss of business or anticipated profits.
    </li>

    <li style="margin-bottom: 8px;">
      3. The Valuation Services, along with the Deliverables submitted by VALUERS, are intended solely for the benefit of the parties involved. VALUERS assumes no liability or responsibility towards any third party who utilizes or gains access to the Valuation or benefits from the Services.
    </li>

    <li style="margin-bottom: 5px;">
      4. VALUERS and / or its Partners, Officers and Executives accept no responsibility for detecting fraud or misrepresentation, whether by management or employees of the Client or third parties. Accordingly, VALUERS will not be liable in any way for, or in connection with, fraud or misrepresentations, whether on the part of the Client, its contractors or agents, or any other third party.
    </li>

    <li style="margin-bottom: 3px;">
      5. If you wish to bring a legal proceeding related to the Services or Agreement, it must be initiated within six (6) months from the date you became aware of or should have known about the facts leading to the alleged liability. Additionally, legal proceedings must be initiated no later than one (1) year from the date of the Deliverable that caused the alleged liability.
    </li>

    <li style="margin-bottom: 3px;">
      6. If you, as the client, have any concerns or complaints about the services provided, please do not hesitate to discuss them with the officials of VALUERS. Any service-related issues concerning this Agreement (or any variations or additions to it) must be brought to the attention of VALUERS in writing within one month from the date when you became aware of or should reasonably been aware of the relevant facts. Such issues must be raised no later than six months from the completion date of the services.
    </li>

    <li style="margin-bottom: 5px;">
      7. If there is any disagreement regarding the Valuation or other Services that are provided, both parties must first try to resolve the issue through conciliation with their senior representatives. If a resolution cannot be reached within forty-five (45) days, the dispute will be settled through Arbitration in India, following the guidelines of the Arbitration and Conciliation Act 1996. The venue of the arbitration will be located in Ahmedabad, Gujarat, India. The arbitrator(s)' authority will be subject to the terms of the standard terms of service, which includes the limitation of liability provision. All information regarding the arbitration, including the award, will be kept confidential.
    </li>

    <li style="margin-bottom: 8px;">
      8. By utilizing this report, the user is presumed to have thoroughly read, comprehended, and accepted VALUERS' standard business terms and conditions, as well as the assumptions and limitations outlined in this document.
    </li>

    <li style="margin-bottom: 8px;">
      9. We have valued the right property as per the details submitted to me.
    </li>
    <li style="margin-bottom: 8px;">
      10. Please note that payment for the valuation report is expected to be made within the bank's given time limit from the date of the report. Simply possessing the report will not fulfill its intended purpose.
    </li>
    </ol>

          <div style="margin-top: 30px; padding: 20px; text-align: right; ">
            <p style="margin: 0; font-size: 12pt; font-weight: bold;">Rajesh Ganatra</p>
            <p style="margin: 4px 0; font-size: 11pt;">Chartered Engineer (India), B.E. Civil, PMP (PMI USA)</p>
            <p style="margin: 4px 0; font-size: 11pt;">Fellow Institute Of Valuer (Delhi), M.I.E.,</p>
            <p style="margin: 4px 0; font-size: 11pt;">Approved Valuer By Chief Commissioner Of Incom-Tax(II)</p>
            <p style="margin: 4px 0; font-size: 11pt;">Approved Valuer By IOV (Delhi)</p>
            <p style="margin: 4px 0; font-size: 11pt;">5th floor, Shaivk Complex, behind Ganesh Plaza,</p>
            <p style="margin: 4px 0; font-size: 11pt;">Opp. Sanmukh Complex, Off. C G Road,</p>
            <p style="margin: 4px 0; font-size: 11pt;">${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</p>
            <p style="margin: 8px 0 4px 0; font-size: 11pt;">Mobile: 09825798600</p>
            <p style="margin: 8px 0 4px 0; font-size: 11pt;"> E-Mail: rajeshganatra2003@gmail.com</p>
          </div>

              <div style="font-size: 12pt; line-height: 1.4; margin-top: 495px; margin-left: 0; margin-right: 0; margin-bottom: 20px; width: 100%; page-break-before: always;" class="annexure-iv-section">
    <div style="text-align: center; margin-bottom: 25px;">
      <p style="margin: 0; font-weight: bold; font-size: 12pt;">ANNEXURE – IV</p>
      <p style="margin: 8px 0 0 0; font-weight: bold; font-size: 12pt;">DECLARATION- CUM- UNDERTAKING</p>
    </div>

    <p style="margin: 10px 0; font-weight: bold;">I, ${safeGet(pdfData, 'engineerName') || 'Rajesh Ganatra'}, son of ${safeGet(pdfData, 'fatherName') || 'Kishorbhai Ganatra'}, do hereby solemnly affirm and state that:</p>

    <ol style="margin: 10px 0; padding-left: 20px; list-style-type: lower-alpha;">
      <li style="margin: 6px 0;">I am a citizen of India</li>
      <li style="margin: 6px 0;">I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointment as valuer or three years after the valuation of assets was conducted by me</li>
      <li style="margin: 6px 0;">The information furnished in my valuation report dated ${safeGet(pdfData, 'dateOfValuation') || 'NA'} is true and correct to the best of my knowledge and belief and I have made an impartial and true valuation of the property</li>
      <li style="margin: 6px 0;">We have personally inspected the property on ${safeGet(pdfData, 'dateOfInspectionOfProperty') || 'NA'} The work is not sub-contracted to any other valuer and carried out by myself.</li>
      <li style="margin: 6px 0;">Valuation report is submitted in the format as prescribed by the Bank.</li>
      <li style="margin: 6px 0;">I have been duly empanelled/ delisted by any other bank and in case any such de-panelment by other banks during my empanelment with you, I will inform you within 3 days of such de-panelment.</li>
      <li style="margin: 6px 0;">I have not been removed/dismissed from service/employment earlier</li>
      <li style="margin: 6px 0;">I have not been convicted of any offence and sentenced to a term of imprisonment</li>
      <li style="margin: 6px 0;">I have not been found guilty of misconduct in professional capacity</li>
      <li style="margin: 6px 0;">I have not been declared to be unsound mind</li>
      <li style="margin: 6px 0;">I am not an un-discharged bankrupt, or has not applied to be adjudicated as a bankrupt;</li>
      <li style="margin: 6px 0;">I am not an un-discharged insolvent</li>
      <li style="margin: 6px 0;">I have not been levied a penalty under section 271J of Income-tax Act, 1961 (43 of 1961) and time limit for filing appeal before Commissioner of Income- tax (Appeals) or Income-tax Appellate Tribunal, as the case may be his expired, or such penalty has been confirmed by Income-tax Appellate Tribunal, and five years have not elapsed after levy of such penalty</li>
      <li style="margin: 6px 0;">I have not been convicted of an offence connected with any proceeding under the Income Tax Act 1961, Wealth Tax Act 1957 or Gift Tax Act 1958 and</li>
      <li style="margin: 6px 0;">My PAN Card number/Service Tax number as applicable is AELPG1208B</li>
      <li style="margin: 6px 0;">I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer</li>
      </br>
      <li style="margin: 6px 0;">I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure</li>
    
      <li style="margin: 6px 0;">I have read the Handbook on Policy, Standards and procedure for Real Estate Valuation, 2011 of the IBA and this report is in conformity to the "Standards" enshrined for valuation in the Part-B of the above handbook to the best of my ability</li>
      <li style="margin: 6px 0;">I am registered under Section 34 AB of the Wealth Tax Act, 1957. (Strike off, if not applicable)</li>
      <li style="margin: 6px 0;">I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI) (Strike off, if not applicable)</li>
      <li style="margin: 6px 0;">My CIBIL Score and credit worthiness is as per Bank's guidelines.</li>
      <li style="margin: 6px 0;">I am the proprietor / partner / authorized official of the firm / company, who is competent to sign this valuation report.</li>
      <li style="margin: 6px 0;">I will undertake the valuation work on receipt of Letter of Engagement generated from the system (i.e. LLMS/LOS) only.</li>
      <li style="margin: 6px 0;">Further, I hereby provide the following information.</li>
    </ol>

    
  </div>
</div>

<!-- PAGE 23: VALUATION DETAILS TABLE -->
<div class="" style=" background: white; width: 100%;" class="">
  <div style="font-size: 12pt; line-height: 1.4;">
    <table style="width: 100%; border-collapse: separate; border-spacing: 0;; margin: 0; border: 1px solid #000; page-break-inside: avoid;">
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%; font-weight: bold;">Sr. No.</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%; font-weight: bold;">Particulars</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%; font-weight: bold;">Valuer comment</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">1</td>
        <td style="border: 1px solid #000; padding: 6px;">background information of the asset being valued;</td>
        <td style="border: 1px solid #000; padding: 6px;">Referred provided documents</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">2</td>
        <td style="border: 1px solid #000; padding: 6px;">purpose of valuation and appointing authority</td>
        <td style="border: 1px solid #000; padding: 6px;"><strong>Continue Financial Assistance Purpose</strong></td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">3</td>
        <td style="border: 1px solid #000; padding: 6px;">identity of the valuer and any other experts involved in the valuation;</td>
        <td style="border: 1px solid #000; padding: 6px;">Self-assessment</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">4</td>
        <td style="border: 1px solid #000; padding: 6px;">disclosure of valuer interest or conflict, if any;</td>
        <td style="border: 1px solid #000; padding: 6px;">N.A.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">5</td>
        <td style="border: 1px solid #000; padding: 6px;">date of appointment, valuation date and date of report;</td>
        <td style="border: 1px solid #000; padding: 6px;"><strong>Date of report:${formatDate(safeGet(pdfData, 'dateOfValuation'))}</p>
      <p style="margin: 4px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block;"> Date of Visit: ${safeGet(pdfData, 'dateOfInspectionOfProperty') || ''}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">6</td>
        <td style="border: 1px solid #000; padding: 6px;">inspections and/or investigations undertaken;</td>
        <td style="border: 1px solid #000; padding: 6px;">Yes.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">7</td>
        <td style="border: 1px solid #000; padding: 6px;">nature and sources of the information used or relied upon;</td>
        <td style="border: 1px solid #000; padding: 6px;">Local inquiries, brokers, known websites, i.e., magicbricks, 99acres, propertywall, proprtiger, housing, etc., if available</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">8</td>
        <td style="border: 1px solid #000; padding: 6px;">procedures adopted in carrying out the valuation and valuation standards followed.</td>
        <td style="border: 1px solid #000; padding: 6px;">Land & Building Method, with Market Approach for Land and Cost Approach for Building.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">9</td>
        <td style="border: 1px solid #000; padding: 6px;">restrictions on use of the report, if any;</td>
        <td style="border: 1px solid #000; padding: 6px;">As per purpose mentioned in report.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">10</td>
        <td style="border: 1px solid #000; padding: 6px;">major factors that were taken into account during the valuation;</td>
        <td style="border: 1px solid #000; padding: 6px;">Location of the property, with developing of surroundings, for going-purpose valuation</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">11</td>
        <td style="border: 1px solid #000; padding: 6px;">Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of limiting his responsibility for the valuation report.</td>
        <td style="border: 1px solid #000; padding: 6px;">Future market events and Government Policies.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">12</td>
        <td style="border: 1px solid #000; padding: 6px;">Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of limiting his responsibility for the valuation report.</td>
        <td style="border: 1px solid #000; padding: 6px;">We are not responsible for Title of the subjected property and valuations affected by the same</td>
      </tr>
      <tr>
         <td colspan="3" style="border: none !important; border-bottom: none !important; padding: 15px 6px;">
           <div style="">
             <p style="margin: 0;text-align: left; border: none; text-decoration: none;"><strong>Place: ${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</strong></p>
             <p style="margin: 4px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block; border: none; text-decoration: none;"><strong>Date: ${formatDate(safeGet(pdfData, 'dateOfValuation') || new Date().toISOString().split('T')[0])}</strong></p>
             <div style="margin-top: 10px;">
               <p style="margin: 0;text-align: right; font-weight: bold;">Rajesh Ganatra</p>
             </div>
           </div>
         </td>
       </tr>
      </table>
      </div>
      </div>

<!-- PAGE 24-25: MODEL CODE OF CONDUCT FOR VALUERS -->
</br>
<div class="" style="margin: 0; background: white; width: 100%; box-sizing: border-box;">
  <div style="font-size: 12pt; line-height: 1.4; ">
    <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; font-size: 12pt;">(Annexure-V) </p>
      <p style="margin: 0; font-weight: bold; font-size: 12pt;">MODEL CODE OF CONDUCT FOR VALUERS</p>
    </div>

    <p style="margin: 7px 0 8px 0; font-weight: bold;">Integrity and Fairness</p>
    <ol style="margin: 5px 0 10px 20px; padding: 0;  ">
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other valuers.</li>
      <li style="margin: 4px 0; text-align: justify;">A valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.</li>
      <li style="margin: 4px 0; text-align: justify;">A valuer shall endeavour to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.</li>
      <li style="margin: 4px 0; text-align: justify;">A valuer shall refrain from being involved in any action that would bring disrepute to the profession.</li>
      <li style="margin: 4px 0; text-align: justify;">A valuer shall keep public interest foremost while delivering his services.</li>
    </ol>

    <p style="margin: 7px 0 8px 0; font-weight: bold;">Professional Competence and Due Care</p>
    <ol style="margin: 5px 0 10px 20px; padding: 0;  ">
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall carry out professional services in accordance with the relevant technical and professional standards that may be specified from time to time</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall continuously maintain professional knowledge and skill to provide competent professional service based on up-to-date developments in practice, prevailing regulations/guidelines and techniques.</li>
      <li style="margin: 4px 0; text-align: justify;  ">In the preparation of a valuation report, the valuer shall not disclaim liability for his/its expertise or deny his/its duty of care, except to the extent that the assumptions are based on statements of fact provided by the company or its auditors or consultants or information unavailable in public domain and not generated by the valuer.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall clearly state to his client the services that he would be competent to provide and the services for which he would be relying on other valuers or professionals or for which the client can have a separate arrangement with other valuers.</li>
    </ol>

    <p style="margin: 10px 0 8px 0; font-weight: bold;">Independence and Disclosure of Interest</p>
    <ol style="margin: 5px 0 10px 20px; padding: 0;" start="8">
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent in terms of association to the company.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.</li>
     
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation, and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client's needs.</li>
      <li style="margin: 4px 0; text-align: justify;  ">As an independent valuer, the valuer shall not charge success fee.</li>
      <li style="margin: 4px 0; text-align: justify;  ">In any fairness opinion or independent expert opinion submitted by a valuer, if there has been a prior engagement in an unconnected transaction, the valuer shall declare the association with the company during the last five years.</li>
    </ol>

    <p style="margin: 10px 0 8px 0; font-weight: bold;">Confidentiality</p>
    <ol style="margin: 5px 0 10px 20px; padding: 0;" start="20">
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.</li>
    </ol>

    <p style="margin: 10px 0 8px 0; font-weight: bold;">Information Management</p>
    <ol style="margin: 5px 0 10px 20px; padding: 0;" start="21">
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall ensure that he/ it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorised by the authority, the registered valuers organisation with which he/it is registered or any other statutory regulatory body.</li>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organisation with which he/it is registered, or any other statutory regulatory body.</li>
    </br>
      <li style="margin: 4px 0; text-align: justify;  ">A valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.</li>
    </ol>

    <p style="margin: 10px 0 8px 0; font-weight: bold;">Gifts and hospitality.</p>
    <ol style="margin: 5px 0 10px 20px; padding: 0;" start="25">
      <li style="margin: 4px 0; text-align: justify;  ">A valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a valuer.</li>
    </ol>
<ol style="margin: 10px 0 10px 20px; padding: 0;" start="">
    <p style="margin: 10px 0 3px 0; font-size: 12pt;">Explanation: For the purposes of this code the term 'relative' shall have the same meaning as defined in clause (77) of Section 2 of the Companies Act, 2013 (18 of 2013).</p>
</ol>

    <ol style="margin: 10px 0 10px 20px; padding: 0;" start="26">
      <li style="margin: 6px 0; text-align: justify; font-size: 12pt;">A valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.</li>
    </ol>

    <p style="margin: 8px 0 4px 0; font-weight: bold; font-size: 12pt;">Remuneration and Costs.</p>
    <ol style="margin: 2px 0 4px 20px; padding: 0;" start="27">
      <li style="margin: 2px 0; text-align: justify; font-size: 12pt;  ">A valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.</li>
      <li style="margin: 2px 0; text-align: justify; font-size: 12pt;  ">A valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service. <strong>Occupation, employability and restrictions.</strong></li>
      <li style="margin: 2px 0; text-align: justify; font-size: 12pt;  ">A valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/ its assignments.</li>
      <li style="margin: 2px 0; text-align: justify; font-size: 12pt;  ">A valuer shall not conduct business which in the opinion of the authority or the registered valuer organisation discredits the profession.</li>
    </ol>

    <p style="margin: 8px 0 4px 0; font-weight: bold; font-size: 12pt;">Miscellaneous</p>
    <ol style="margin: 2px 0 4px 20px; padding: 0;" start="31">
      <li style="margin: 2px 0; text-align: justify; font-size: 12pt;  ">A valuer shall refrain from undertaking to review the work of another valuer of the same client except under written orders from the bank or housing finance institutions and with knowledge of the concerned valuer.</li>
      <li style="margin: 2px 0; text-align: justify; font-size: 12pt;  ">A valuer shall follow this code as amended or revised from time to time</li>
    </ol>
</br>
</br>
<!-- PAGE: SIGNATURE SECTION -->
    <div style="margin-top: 40px ; padding-top: 10px; ">
      <p style="margin: 10px 0; font-size: 12pt;"><strong>Signature of the valuer:</strong> _________________</p>
      <p style="margin: 10px 0; font-size: 12pt;"><strong>Name of the Valuer:</strong> Rajesh Ganatra</p>
      <p style="margin: 10px 0 0 0; font-size: 12pt;"><strong>Address of the valuer:</strong></p>
      <p style="margin: 4px 0; font-size: 12pt;">5<sup>th</sup> floor, Shalvik Complex, behind Ganesh Plaza,</p>
      <p style="margin: 4px 0; font-size: 12pt;">Opp. Sanmukh Complex, off. C G Road,</p>
      <p style="margin: 4px 0 20px 0; font-size: 12pt;">${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</p>
      <p style="margin: 4px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block;"><strong>Date: ${formatDate(safeGet(pdfData, 'dateOfValuation') || new Date().toISOString().split('T')[0])}</strong></p></br>
      <p style="margin: 10px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block;"><strong>Place:${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</strong></p>
    </div>
    </div>
    </div>
    </div>

    <div style="margin-top: 110px"></div>
  <!-- PAGE 13: IMAGES SECTION - AREA IMAGES -->
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
      ('📊 Input Record Structure:', {
          recordKeys: Object.keys(record || {}),
          rootFields: {
              uniqueId: record?.uniqueId,
              bankName: record?.bankName,
              clientName: record?.clientName,
              city: record?.city,
              engineerName: record?.engineerName
          },
          pdfDetailsKeys: Object.keys(record?.pdfDetails || {}).slice(0, 20),
          totalPdfDetailsFields: Object.keys(record?.pdfDetails || {}).length,
          criticalFields: {
              postalAddress: record?.pdfDetails?.postalAddress,
              areaClassification: record?.pdfDetails?.areaClassification,
              residentialArea: record?.pdfDetails?.residentialArea,
              commercialArea: record?.pdfDetails?.commercialArea,
              inspectionDate: record?.pdfDetails?.inspectionDate,
              agreementForSale: record?.pdfDetails?.agreementForSale
          },
          documentsProduced: record?.documentsProduced,
          agreementForSale_root: record?.agreementForSale,
          agreementForSale_pdfDetails: record?.pdfDetails?.agreementForSale,
          // CRITICAL: Log images at start
          propertyImages_count: Array.isArray(record?.propertyImages) ? record.propertyImages.length : 0,
          locationImages_count: Array.isArray(record?.locationImages) ? record.locationImages.length : 0,
          documentPreviews_count: Array.isArray(record?.documentPreviews) ? record.documentPreviews.length : 0,
          propertyImages_sample: record?.propertyImages?.slice(0, 1),
          locationImages_sample: record?.locationImages?.slice(0, 1),
          documentPreviews_sample: record?.documentPreviews?.slice(0, 1)
      });

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
export const generateRowHouse = generateRecordPDF;

const pdfExportService = {
  generateValuationReportHTML,
  generateRecordPDF,
  generateRowHouse,
  previewValuationPDF,
  generateRecordPDFOffline,
  normalizeDataForPDF
};

export default pdfExportService;