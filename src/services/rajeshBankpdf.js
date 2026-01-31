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

// Helper function to convert number to lowercase Roman numerals
const toRomanNumeral = (num) => {
  const romanMap = [
    { value: 1000, numeral: 'm' },
    { value: 900, numeral: 'cm' },
    { value: 500, numeral: 'd' },
    { value: 400, numeral: 'cd' },
    { value: 100, numeral: 'c' },
    { value: 90, numeral: 'xc' },
    { value: 50, numeral: 'l' },
    { value: 40, numeral: 'xl' },
    { value: 10, numeral: 'x' },
    { value: 9, numeral: 'ix' },
    { value: 5, numeral: 'v' },
    { value: 4, numeral: 'iv' },
    { value: 1, numeral: 'i' }
  ];
  
  let result = '';
  let n = num;
  
  for (let i = 0; i < romanMap.length; i++) {
    while (n >= romanMap[i].value) {
      result += romanMap[i].numeral;
      n -= romanMap[i].value;
    }
  }
  
  return result;
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

// ===== TABLE BUILDING HELPER FUNCTIONS =====

// Reusable table row builder - eliminates repetitive styling
const createTableRow = (label, value, bgColor = '#ffffff', valueBgColor = '#ffffff', labelWidth = '40%', valueWidth = '60%', fontSize = '12pt') => {
  return `
  <tr >
    <td style="width: ${labelWidth}; background: ${bgColor}; font-weight: bold; border: 1px solid #000000 !important; padding: 5px 8px; font-size: ${fontSize}; vertical-align: middle;">${label}</td>
    <td style="width: ${valueWidth}; background: ${valueBgColor}; border: 1px solid #000000 !important; padding: 5px 8px; font-size: ${fontSize}; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${value}</td>
  </tr>`;
};

// Table row with top alignment (for multi-line content)
const createTableRowTopAlign = (label, value, bgColor = '#ffffff', valueBgColor = '#ffffff', labelWidth = '50%', valueWidth = '50%', fontSize = '12pt') => {
   return `
   <tr >
     <td style="width: ${labelWidth}; background: ${bgColor}; font-weight: bold; border: 1px solid #000000 !important; padding: 8px 5px; font-size: ${fontSize}; vertical-align: top; ">${label}</td>
     <td style="width: ${valueWidth}; background: ${valueBgColor}; border: 1px solid #000000 !important; padding: 8px 5px; font-size: ${fontSize}; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${value}</td>
   </tr>`;
};
// Dynamic table builder from array of row data
const buildTableFromData = (rowsArray, tableStyles = 'width: 100%; border-collapse: collapse; border-spacing: 0; margin-bottom: 8px; border: 1px solid #000 !important; table-layout: fixed;') => {
  const rows = rowsArray.map(row => createTableRow(row.label, row.value, row.bgColor, row.valueBgColor, row.labelWidth, row.valueWidth, row.fontSize)).join('');
  return `<table style="${tableStyles}">${rows}</table>`;
};

// ===== PAGE-SPECIFIC TABLE DATA MAPPINGS =====

// PAGE 1: Cover Page - Account Information Table - DYNAMIC from pdfDetails
const getAccountInformationTableData = (pdfData) => [
  { label: 'Account Name', value: safeGet(pdfData, 'pdfDetails.accountName') },
  { label: 'Name of Owner', value: safeGet(pdfData, 'pdfDetails.nameOfOwnerValuation') },
  { label: 'Client', value: (safeGet(pdfData, 'bankName') ? `${safeGet(pdfData, 'bankName')} Bank,${safeGet(pdfData, 'pdfDetails.applicant')}, ${safeGet(pdfData, 'city')}` : 'NA') },
  { label: 'Property Details', value: safeGet(pdfData, 'pdfDetails.typeOfProperty') },
  { label: 'Location', value: safeGet(pdfData, 'pdfDetails.addressPropertyValuation') || safeGet(pdfData, 'address') },
  { label: 'Purpose of Property', value: safeGet(pdfData, 'pdfDetails.purposeOfValuation') },
  { label: 'Date of Valuation', value: formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport') || safeGet(pdfData, 'dateTime', 'NA')) }
];

// PAGE 2: Summary Values Table - DYNAMIC from pdfDetails
const getSummaryValuesTableData = (pdfData) => [
  { label: 'Applicant', value: (safeGet(pdfData, 'bankName') ? `${safeGet(pdfData, 'bankName')} Bank,${safeGet(pdfData, 'pdfDetails.applicant')}, ${safeGet(pdfData, 'city')}` : 'NA') },
  { label: 'Valuation done by Govt. Approved Valuer', value: safeGet(pdfData, 'pdfDetails.valuationDoneByApproved') || safeGet(pdfData, 'engineerName') },
  { label: 'Purpose of Valuation', value: safeGet(pdfData, 'pdfDetails.purposeOfValuation') || safeGet(pdfData, 'valuationPurpose') || 'To ascertain fair market value for <u>Continue Financial Assistance Purpose</u> (My opinion for the probable value of the property only)' },
  { label: 'Name of Owner/Owners', value: safeGet(pdfData, 'pdfDetails.nameOfOwnerValuation') },
  { label: 'Address of property under valuation', value: safeGet(pdfData, 'pdfDetails.addressPropertyValuation') || safeGet(pdfData, 'address') },
  { label: 'Brief description of the Property', value: safeGet(pdfData, 'pdfDetails.briefDescriptionOfProperty') || safeGet(pdfData, 'briefDescriptionOfProperty') },
  { label: 'Revenue details as per Sale deed / Authenticate Documents', value: safeGet(pdfData, 'pdfDetails.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments') || safeGet(pdfData, 'plotSurveyNo') },
  { label: 'Area of Land', value: safeGet(pdfData, 'pdfDetails.areaOfLand') || safeGet(pdfData, 'areaOfLand') || 'NA – As subject property is commercial Shop Composite Rate Area Method Adopted.' },
{ label: 'Value of Land', value: (safeGet(pdfData, 'pdfDetails.valueOfLand') || safeGet(pdfData, 'valueOfLand')) ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.valueOfLand') || safeGet(pdfData, 'valueOfLand'), safeGet(pdfData, 'pdfDetails.valueOfLandWords')) : 'NA – As subject property is commercial Shop Composite Rate Area Method Adopted.' },
  { label: 'Area of Construction', value: safeGet(pdfData, 'pdfDetails.areaOfConstruction') || `As per Copy of Indenture of Allotment-cum-Sale:<br/>Carpet Area = ${safeGet(pdfData, 'pdfDetails.carpetArea', safeGet(pdfData, 'carpetArea'))} SMT = ${safeGet(pdfData, 'pdfDetails.carpetAreaSFT', safeGet(pdfData, 'carpetAreaSFT'))} SFT<br/>Built-up Area = ${safeGet(pdfData, 'pdfDetails.builtUpArea', safeGet(pdfData, 'builtUpArea'))} SMT = ${safeGet(pdfData, 'pdfDetails.builtUpAreaSFT', safeGet(pdfData, 'builtUpAreaSFT'))} SFT<br/>Super Built-up Area = ${safeGet(pdfData, 'pdfDetails.superBuiltUpArea', safeGet(pdfData, 'superBuiltUpArea'))} SMT = ${safeGet(pdfData, 'pdfDetails.superBuiltUpAreaSFT', safeGet(pdfData, 'superBuiltUpAreaSFT'))} SFT` },
  { label: 'Value of Construction', value: safeGet(pdfData, 'pdfDetails.valueOfConstruction') || `= ${safeGet(pdfData, 'pdfDetails.constructionSqft', safeGet(pdfData, 'constructionSqft'))} sq. ft x ₹ ${safeGet(pdfData, 'pdfDetails.constructionRate', safeGet(pdfData, 'constructionRate'))} sq. ft. = ₹ ${safeGet(pdfData, 'pdfDetails.constructionValue', safeGet(pdfData, 'constructionValue'))}` },
  { label: 'TOTAL MARKET VALUE OF THE PROPERTY', value: `${safeGet(pdfData, 'pdfDetails.marketValueOfProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.marketValueOfProperty'), safeGet(pdfData, 'pdfDetails.marketValueOfProperty')) : 'NA'}` },
  { label: 'REALISABLE VALUE (90% of MV)', value: `${safeGet(pdfData, 'pdfDetails.realizableValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.realizableValueProperty'), safeGet(pdfData, 'pdfDetails.realizableValueProperty')) : 'NA'}`},
  { label: 'DISTRESS SALE VALUE (80% of MV)', value: `${safeGet(pdfData, 'pdfDetails.distressValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.distressValueProperty'), safeGet(pdfData, 'pdfDetails.distressValueProperty')) : 'NA'}` },
  { label: 'JANTRI VALUE OF PROPERTY', value: `${safeGet(pdfData, 'pdfDetails.jantriValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.jantriValueProperty'), safeGet(pdfData, 'pdfDetails.jantriValueProperty')) : 'NA'}` },
  { label: 'INSURABLE VALUE OF PROPERTY', value: `${safeGet(pdfData, 'pdfDetails.insurableValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.insurableValueProperty'), safeGet(pdfData, 'pdfDetails.insurableValueProperty')) : 'NA'}` }
];

// PAGE 3: Introduction Table - DYNAMIC from pdfDetails
const getIntroductionTableData = (pdfData) => [
{
  label: 'a) Name of the Property Owner / (with address & phone nos.)',
  value: `${safeGet(pdfData, 'pdfDetails.nameOfOwnerValuation')},

Property Address:


${safeGet(pdfData, 'pdfDetails.addressPropertyValuation')}`,
  labelWidth: '50%',
  valueWidth: '50%'
},

  { label: 'b) Purpose of Valuation', value: safeGet(pdfData, 'pdfDetails.purposeOfValuation') || safeGet(pdfData, 'valuationPurpose') || safeGet(pdfData, 'purposeOfProperty'), labelWidth: '50%', valueWidth: '50%' },
  { label: 'c) Date of Inspection of Property', value: formatDate(safeGet(pdfData, 'pdfDetails.dateOfInspectionOfProperty') || safeGet(pdfData, 'inspectionDate') || safeGet(pdfData, 'dateOfInspection', 'NA')), labelWidth: '50%', valueWidth: '50%' },
  { label: 'd) Date of Valuation Report', value: formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport') || safeGet(pdfData, 'valuationMadeDate') || safeGet(pdfData, 'dateOfValuationReport', 'NA')), labelWidth: '50%', valueWidth: '50%' },
  { label: 'e) Name of the Developer of Property (in case of developer-built properties)', value: safeGet(pdfData, 'pdfDetails.nameOfTheDeputySuperintendentProperty') || safeGet(pdfData, 'engineerName') || safeGet(pdfData, 'developerName'), labelWidth: '50%', valueWidth: '50%' }
];

// PAGE 3: Physical Characteristics Table - DYNAMIC from pdfDetails
const getPhysicalCharacteristicsTableData = (pdfData) => [
  { number: 'a)', label: 'Location of the Property', value: safeGet(pdfData, 'pdfDetails.propertyDetailsLocation') || safeGet(pdfData, 'address'), isHeader: true },
  { number: 'i.', label: 'Nearby landmark', value: safeGet(pdfData, 'pdfDetails.nearbyLandmark') || safeGet(pdfData, 'nearbyLandmark') || safeGet(pdfData, 'landmark') },
  { number: 'ii.', label: 'Postal Address of the Property', value: safeGet(pdfData, 'pdfDetails.postalAddress') || safeGet(pdfData, 'postalAddress') || safeGet(pdfData, 'address') },
  { number: 'iii.', label: 'Area of the plot/land (supported by a plan)', value: safeGet(pdfData, 'pdfDetails.areaOfThePlotLandSupportedByA') || safeGet(pdfData, 'plotArea') || safeGet(pdfData, 'landArea') }
];

// PAGE 4: Detailed Property Characteristics Table (IV to XIII) - DYNAMIC from pdfDetails
const getDetailedPropertyTableData = (pdfData) => [
  { label: 'IV.', item: 'Type of Land: Solid, Rocky, Marsh land, Reclaimed land, Water-logged, Land locked.', value: safeGet(pdfData, 'pdfDetails.developedLand') || safeGet(pdfData, 'typeOfLand') || safeGet(pdfData, 'landType') },
  { label: 'V.', item: 'Independent access/approach to the property etc.', value: safeGet(pdfData, 'pdfDetails.interceptAccessToTheProperty') || safeGet(pdfData, 'independentAccess') || safeGet(pdfData, 'accessToProperty') },
  { label: 'VI.', item: 'Google Map Location of the Property with a neighborhood layout map', value: safeGet(pdfData, 'pdfDetails.locationOfThePropertyWithNeighborhoodLayout') || safeGet(pdfData, 'googleMapLocation') || safeGet(pdfData, 'mapLocation') },
  { label: 'VII.', item: 'Details of roads abutting the property', value: safeGet(pdfData, 'pdfDetails.detailsOfExistingProperty') || safeGet(pdfData, 'roadDetails') || safeGet(pdfData, 'roadsAbuttingProperty') },
  { label: 'VIII.', item: 'Description of adjoining property', value: safeGet(pdfData, 'pdfDetails.descriptionOfAdjoiningProperty') || safeGet(pdfData, 'adjoiningProperty') || safeGet(pdfData, 'adjoiningPropertyDescription') },
  { label: 'IX.', item: 'Plot No. Revenue Survey No', value: safeGet(pdfData, 'pdfDetails.plotNoRevenueNo') || safeGet(pdfData, 'plotSurveyNo') || safeGet(pdfData, 'plotRevenueNo') },
  { label: 'X.', item: 'Ward/Village/Taluka', value: safeGet(pdfData, 'pdfDetails.villageOrTalukSubRegisterBlock') || safeGet(pdfData, 'ward') || safeGet(pdfData, 'wardVillageTaluka') },
  { label: 'XI.', item: 'Sub-Registry/Block', value: safeGet(pdfData, 'pdfDetails.subRegistryBlock') || safeGet(pdfData, 'subRegistry') },
  { label: 'XII.', item: 'District', value: safeGet(pdfData, 'pdfDetails.district') || safeGet(pdfData, 'districtName') || safeGet(pdfData, 'district') },
  { label: 'XIII.', item: 'Any other aspect', value: safeGet(pdfData, 'pdfDetails.anyOtherAspect') || safeGet(pdfData, 'remarks') || safeGet(pdfData, 'otherAspect') }
];

// Boundary information
const getBoundaryData = (pdfData) => [
  { direction: 'NORTH', value: safeGet(pdfData, 'boundaryNorth') || safeGet(pdfData, 'boundariesPlotNorth') },
  { direction: 'SOUTH', value: safeGet(pdfData, 'boundarySouth') || safeGet(pdfData, 'boundariesPlotSouth') },
  { direction: 'EAST', value: safeGet(pdfData, 'boundaryEast') || safeGet(pdfData, 'boundariesPlotEast') },
  { direction: 'WEST', value: safeGet(pdfData, 'boundaryWest') || safeGet(pdfData, 'boundariesPlotWest') }
];

// PAGE 5: TOWN PLANNING PARAMETERS - DYNAMIC from pdfDetails
const getTownPlanningTableData = (pdfData) => [
  {
      item: ' Master Plan provisions related to property in Terms of land use',
      value: safeGet(pdfData, 'pdfDetails.masterPlanProvisions') || safeGet(pdfData, 'pdfDetails.approvedMapAuthority') || 'Plan is approved by Ahmedabad Urban Development Authority, Wide no. PRM/36/7/09/7603, Dated: 05/06/2010. Approved by AUDA'
  },
  {
      item: ' FAR- Floor Area Rise/FSI- Floor Space Index permitted & consumed',
      value: safeGet(pdfData, 'pdfDetails.propertyInTermsOfLandUseSpace') || safeGet(pdfData, 'pdfDetails.floorSpaceIndex') || 'As per permissible Bye Laws'
  },
  {
      item: ' Ground coverage',
      value: safeGet(pdfData, 'pdfDetails.asPerGDR') || 'As per approved plan.'
  },
  {
      item: ' Comment on whether OC- Occupancy Certificate has been issued or not',
      value: safeGet(pdfData, 'pdfDetails.certificateHasBeenIssued') || 'Yes'
  },
  {
      item: ' Comment on unauthorized constructions if any',
      value: safeGet(pdfData, 'pdfDetails.constructionMandatorily') || 'No.'
  },
  {
      item: ' Transferability of developmental rights if any, Building by-laws provision as applicable to The property viz. setbacks, height restriction etc.',
      value: safeGet(pdfData, 'pdfDetails.permissibleTypeLaws') || 'As Per Permissible Bye Laws'
  },
  {
      item: ' Planning area/zone',
      value: safeGet(pdfData, 'pdfDetails.planningAreaZone') || 'As per GDCR'
  },
  {
      item: ' Developmental controls',
      value: safeGet(pdfData, 'pdfDetails.constraintFullyDeveloped') || 'As per GDCR'
  },
  {
      item: ' Zoning regulations',
      value: safeGet(pdfData, 'pdfDetails.requirementForCommercialArea') || 'NA'
  }
];

// PAGE 8: DECLARATION DATA - DYNAMIC from pdfDetails
const getDeclarationData = (pdfData) => ({
  inspectionName: safeGet(pdfData, 'pdfDetails.nameOfTheDeputySuperintendentProperty') || 'Dhruvalbhai',
  inspectionTitle: 'Filed Engineer',
  inspectionDate: formatDate(safeGet(pdfData, 'pdfDetails.dateOfInspectionOfProperty') || ''),
  reportDate: formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport') || ''),
  valuerName: safeGet(pdfData, 'engineerName') || safeGet(pdfData, 'pdfDetails.engineerName') || safeGet(pdfData, 'pdfDetails.theChiefManagerOfTheBank') || 'Rajesh Ganatra',
  valuationCompany: safeGet(pdfData, 'pdfDetails.branchName') || safeGet(pdfData, 'pdfDetails.specificationAuthorization') || 'Rajesh Ganatra Valuation Services',
  headOffice: safeGet(pdfData, 'pdfDetails.branchAddress') || safeGet(pdfData, 'pdfDetails.propertiesOfValueLimitedThroughIsGroup') || '5th floor, Shalvik Complex, behind Ganesh Plaza, Opp. Sanmukh Complex, Off. C G Road, Navrangpura, Ahmedabad – 380009. Mobile: 98257 98600,'
});

// PAGE 8: ENCLOSURES DATA - DYNAMIC from pdfDetails
const getEnclosuresData = (pdfData) => [
  {
      item: ' Layout plan sketch of the area in which the property is located with latitude and longitude',
      status: safeGet(pdfData, 'pdfDetails.enclosureLayoutPlan') || safeGet(pdfData, 'pdfDetails.layoutPlanSketch') || 'Yes, It is attached herewith'
  },
  {
      item: ' Building Plan',
      status: safeGet(pdfData, 'pdfDetails.enclosureBuildingPlan') || safeGet(pdfData, 'pdfDetails.buildingPlan') || 'Yes, It is attached herewith'
  },
  {
      item: ' Floor Plan',
      status: safeGet(pdfData, 'pdfDetails.enclosureFloorPlan') || safeGet(pdfData, 'pdfDetails.floorPlan') || 'Yes, It is attached herewith'
  },
  {
      item: ' Photograph of the property (including geo-stamping with date) and owner (in case of housing loans, if borrower is available) including a "Selfie" of the Valuer at the site',
      status: safeGet(pdfData, 'pdfDetails.enclosurePhotograph') || safeGet(pdfData, 'pdfDetails.photographOfProperty') || 'Yes, It is attached herewith'
  },
  {
      item: ' Certified copy of the approved / sanctioned plan, wherever applicable from the concerned office',
      status: safeGet(pdfData, 'pdfDetails.enclosureApprovedPlan') || 'Yes, It is attached herewith'
  },
  {
      item: ' Google Map location of the property and latitude/longitude and co-ordinates of the property',
      status: safeGet(pdfData, 'pdfDetails.enclosureGoogleMap') || 'Yes, It is attached herewith'
  },
  {
      item: ' Price trend of the Property in the locality/city from property search sites viz Magickbricks.com, 99Acres.com, Makan.com etc',
      status: safeGet(pdfData, 'pdfDetails.enclosurePriceTrend') || 'NA'
  },
  {
      item: ' Guideline rate mentioned in the valuation report must be supported by documentary evidence i.e. latest guideline rate published in district website, Registrar Office etc should be printed and signed by the concerned valuer as an evidence of authenticity',
      status: safeGet(pdfData, 'pdfDetails.enclosureGuidelineRate') || 'NA'
  },
  {
      item: 'Any other relevant documents/ extracts ',
      status: safeGet(pdfData, 'pdfDetails.enclosureOtherDocuments') || 'NA'
  }
];

// PAGE 10: CONSTRUCTION AREA RATE & VALUATION SUMMARY - DYNAMIC from pdfDetails
const getConstructionAreaRateData = (pdfData) => ({
  constructionAreaRate: safeGet(pdfData, 'pdfDetails.constructionAreaRate') || 'Rs. 0000/- per sq.ft for Super Built up Area Rate on Ground Floor Commercial Shop Cum Show Room',
  constructionRateDetails: safeGet(pdfData, 'pdfDetails.constructionRateDetails') || '(We have verified the property rates for nearby area with local person/broker in this area, and refer to known web sites, like magic brick, 99acres, etc., the rate of Commercial Shop sum Show Room, varies from the rates are between Rs. 25,000/- to Rs. 30,000/- per sq.ft. Depends on location, approaches, surrounding developing, etc., We have considered the rate Rs. 27,000/-per sq.ft for Super Built up area Rate for Ground Floor Commercial Shop cum Show Room Considering Furnished Unit.',
  prevailingMarketRate: safeGet(pdfData, 'pdfDetails.prevailingMarketRate') || 'The perfect rate cannot available on any websites, and also in Reg. Sale instance is Reg. Sale instance is reflecting only Jantri Rate Value, is considered for Stamp Duty only. The actual Sale – Purchase Rate is depending on demand / supply of such type of property, what offers are available on known websites, some of that is have no proper details, negotiable offers, and some also fake. So, we gathered all type of Data of prevailing Rate in such area, applying positive and negative factors, and come to conclusion of prevailing Rate.',
  guidelineRate: safeGet(pdfData, 'pdfDetails.guidelineRate') || 'As per the Town planning and valuation department of Govt. of Gujarat, Jantri Rate in that area for Commercial Shop is Rs. 50,000/- rupees per sq.mt. as per New Guideline for Revision of Jantry / GLR, 2 times rate of Land of ASR-2011, will be applicable, Dt. 13/04/2023, the GLR Valuation for subject property is as under Then, Jantry value = Area x Rate = 420.83 sq.mt x 1,00,000.00/- = Rs. 4,20,83,000.00',
  summaryValue: safeGet(pdfData, 'pdfDetails.guidelineValue') || '₹ 4,20,83,000.00'
});

// PAGE 11: VALUATION METHODOLOGY - DYNAMIC from pdfDetails  
const getValuationMethodologyData = (pdfData) => ({
  costApproach: safeGet(pdfData, 'pdfDetails.costApproach') || 'The Cost Approach: The cost approach to valuation makes a simple assumption that a potential user of a property will not (and should not) pay more for a property than it would cost to build an equivalent property from scratch. That is, the value of the property is the cost of land plus the cost of construction, less depreciation.',
  comparableSalesApproach: safeGet(pdfData, 'pdfDetails.comparableSalesApproach') || 'The Comparable Sales Approach/ Market Approach: For residential homes, condos, townhouses, and small rental apartment buildings, the comparable sales approach often provides a great estimate of market value. If you want the probable price of a specific property you will likely sell it, find out the selling prices, deal terms, and features of recently sold similar properties near the target property. The more closely comparable properties resemble your target property and the closer in proximity, the better and more accurate your estimate will be using this approach.',
  incomeApproach: safeGet(pdfData, 'pdfDetails.incomeApproach') || 'The Income Approach: Lastly, we have the income approach, which is an appraisal technique that is also often called the Gross Rent Multiplier (GRM). To calculate the GRM, you need to know the monthly rents and sales prices of similar properties that have recently sold. For this reason, the method only works for income-producing properties.',
  adoptedMethod: safeGet(pdfData, 'pdfDetails.adoptedMethod') || 'As subjected property is Commercial Shop Cum Show Room, we have adopted Composite Area Rate Method with Market Approach for this valuation excises. By Composite Area Rate Method adopted.'
});

// PAGE 5: DOCUMENT DETAILS & LEGAL ASPECTS - DYNAMIC from pdfDetails
const getDocumentDetailsData = (pdfData) => [
  {
      label: 'Indenture of Allotment-Cum-Sale',
      value: safeGet(pdfData, 'pdfDetails.includesRegistrationOfEachProperty') || 'Deed No. AHD-10-VJR-284-2017, Dated: 19/01/2017.'
  },
  {
      label: 'Share Certificate',
      value: safeGet(pdfData, 'pdfDetails.shareCertificate') || 'Share No. 941-945. Certificate No: 189, Dated: 08/01/2017.'
  },
  {
      label: 'Approved Plan & BU Permission',
      value: safeGet(pdfData, 'pdfDetails.approvalPlanAndBUPermission') || 'Wide No. PRM/36/7/09/7603, Dated: 05/06/2010. Approved by AUDA'
  }
];

// PAGE 6: AMC & OWNERSHIP - DYNAMIC from pdfDetails
const getAMCOwnershipData = (pdfData) => [
  {
      label: ' AMC Tax Bill',
      value: safeGet(pdfData, 'pdfDetails.amcTheBill') || 'NA'
  },
  {
      label: 'b) Name of the Owner/s',
      value: safeGet(pdfData, 'pdfDetails.nameOfOwnerValuation') || 'NA.'
  },
  {
      label: '1.Ordinary status of freehold or leasehold including restrictions on transfer',
      value: safeGet(pdfData, 'pdfDetails.certainStatusOfFreeholdOrLeasehold') || 'Freehold – Please Refer Adv. Title report.'
  },
  {
      label: 'd) Agreement of easement if any',
      value: safeGet(pdfData, 'pdfDetails.leaseAgreement') || 'NA'
  },
  {
      label: 'e) Notification of acquisition if any',
      value: safeGet(pdfData, 'pdfDetails.notificationOfAcquisition') || 'NA'
  },
  {
      label: 'f) Notification of road widening if any',
      value: safeGet(pdfData, 'pdfDetails.notificationOfRoadWidening') || 'NA'
  },
  {
      label: 'g) Heritage restriction, if any',
      value: safeGet(pdfData, 'pdfDetails.heritageEasement') || 'Nil.'
  },
  {
      label: 'h) Comment on transferability of the property ownership',
      value: safeGet(pdfData, 'pdfDetails.builderPlan') || 'Please refer Latest Adv. Title Report.'
  },
  {
      label: 'i) Comment on existing mortgages / charges / encumbrances on the property, if any',
      value: safeGet(pdfData, 'pdfDetails.authorityApprovedPlan') || 'As subject property is already mortgaged with Bank.'
  },
  {
      label: 'j) Comment on whether the owners of the property have issued any guarantee',
      value: safeGet(pdfData, 'pdfDetails.anyViolationFromApprovedPlan') || 'Please refer Latest Adv. Title Report.'
  },
  {
      label: 'k) Building plan sanction',
      value: safeGet(pdfData, 'pdfDetails.agriculturalLandStatus') || 'Plan is approved by Ahmedabad Urban Development Authority, Wide No. PRM/36/7/09/7603, Dated: 05/06/2010'
  },
  {
      label: 'l) Whether Property is Agricultural Land',
      value: safeGet(pdfData, 'pdfDetails.ifPropertyIsAgriculturalLand') || 'NA – Commercial Shop cum Showroom'
  },
  {
      label: 'm) Whether the property is SARFAESI compliant',
      value: safeGet(pdfData, 'pdfDetails.sarfaesiCompliant') || 'NA'
  },
  {
      label: 'n) a.Legal documents, receipts related to electricity, Water tax, Municipal tax',
      value: safeGet(pdfData, 'pdfDetails.aDetailedDocumentsTesting') || 'N.A.'
  },
  {
      label: 'n) b.Observation on Dispute or Dues if any',
      value: safeGet(pdfData, 'pdfDetails.permissionIsBuildingIncluded') || 'N.A.'
  },
  {
      label: 'o) Whether entire piece of land mortgaged',
      value: safeGet(pdfData, 'pdfDetails.observationInPlan') || 'Please refer Latest Adv. Title Report.'
  }
];

// PAGE 7: ECONOMIC ASPECTS - DYNAMIC from pdfDetails  
const getEconomicAspectsData = (pdfData) => [
  {
      item: 'i. Reasonable letting value',
      value: safeGet(pdfData, 'pdfDetails.reasonableLettingValue') || safeGet(pdfData, 'shopCompositeMethod') || 'Shop – Composite method'
  },
  {
      item: 'ii. If property is occupied by tenant - Number of tenants, Since how long, Status of tenancy right, Rent received per month',
      value: safeGet(pdfData, 'pdfDetails.tenancyDetails') || safeGet(pdfData, 'tenantDetails') || 'Owner Occupied.'
  },
  {
      item: 'iii. Taxes and other outings',
      value: safeGet(pdfData, 'pdfDetails.taxesAndOutgoings') || safeGet(pdfData, 'amcTaxBill') || 'AMC – Tenement No. 07280571410001D'
  },
  {
      item: 'iv. Property Insurance',
      value: safeGet(pdfData, 'pdfDetails.propertyInsurance') || safeGet(pdfData, 'insuranceDetails') || 'Details not Available.'
  },
  {
      item: 'v. Monthly maintenance charges',
      value: safeGet(pdfData, 'pdfDetails.monthlyMaintenanceCharges') || safeGet(pdfData, 'maintenanceCharges') || 'Details not Available.'
  },
  {
      item: 'vi. Security charges',
      value: safeGet(pdfData, 'pdfDetails.securityCharges') || safeGet(pdfData, 'securityFees') || 'Details not Available.'
  },
  {
      item: 'vii. Any other aspect',
      value: safeGet(pdfData, 'pdfDetails.economicOtherAspect') || 'No'
  }
];

// PAGE 7: SOCIO-CULTURAL ASPECTS - DYNAMIC from pdfDetails
const getSocioCulturalAspectsData = (pdfData) => [
  {
      item: ' Descriptive account of the location of the property in terms of social structure of the area, population, social stratification, regional origin, economic level, location of slums, squatter settlements nearby, etc',
      value: safeGet(pdfData, 'pdfDetails.socioCulturalDescription') || safeGet(pdfData, 'socioCulturalAspect') || 'Socially good location, the said area in which the property is located is area of Higher Class Commercial Area, surrounding area is Developed with of Commercial Complex and Residential Apartments which is abutting on S G Highway Road, all necessary public amenities are available in nearby area of 2-3 Km.'
  },
  {
      item: 'b) Whether property belongs to social infrastructure like hospital, school, old age homes etc.',
      value: safeGet(pdfData, 'pdfDetails.socialInfrastructureType') || safeGet(pdfData, 'socialInfrastructure') || 'Available within nearby area.'
  }
];

// PAGE 7: FUNCTIONAL AND UTILITARIAN ASPECTS - DYNAMIC from pdfDetails
const getFunctionalAspectsData = (pdfData) => [
  {
      item: 'i. Space allocation',
      value: safeGet(pdfData, 'pdfDetails.spaceAllocation') || safeGet(pdfData, 'spaceAllocation') || ''
  },
  {
      item: 'ii. Storage Spaces',
      value: safeGet(pdfData, 'pdfDetails.storageSpaces') || safeGet(pdfData, 'storageSpace') || ''
  },
  {
      item: 'iii. Utility spaces provided within the building',
      value: safeGet(pdfData, 'pdfDetails.utilitySpaces') || safeGet(pdfData, 'utilitySpaces') || ''
  },
  {
      item: 'iv. Car Parking facility',
      value: safeGet(pdfData, 'pdfDetails.carParkingFacility') || safeGet(pdfData, 'parkingFacility') || ''
  },
  {
      item: 'v. Balconies, etc.',
      value: safeGet(pdfData, 'pdfDetails.balconies') || safeGet(pdfData, 'balconiesFacility') || '-'
  },
  {
      item: 'Any other aspect',
      value: safeGet(pdfData, 'pdfDetails.functionalOtherAspect') || ''
  }
];

// PAGE 8: INFRASTRUCTURE AVAILABILITY - DYNAMIC from pdfDetails
const getInfrastructureAvailabilityData = (pdfData) => ({
  aquaInfra: [
      { item: 'i. Water supply', value: safeGet(pdfData, 'pdfDetails.waterSupply') || safeGet(pdfData, 'waterSupply') || 'Available' },
      { item: 'ii. Sewerage/sanitation System', value: safeGet(pdfData, 'pdfDetails.sewerageSystem') || safeGet(pdfData, 'sewerage') || 'Yes. Connects to public sewer line, and underground sewerage system' },
      { item: 'iii. Storm water drainage', value: safeGet(pdfData, 'pdfDetails.stormWaterDrainage') || safeGet(pdfData, 'drainage') || 'Yes, Available' }
  ],
  physicalInfra: [
      { item: 'i. Solid waste management', value: safeGet(pdfData, 'pdfDetails.solidWasteManagement') || safeGet(pdfData, 'wasteManagement') || 'Yes.' },
      { item: 'ii. Electricity', value: safeGet(pdfData, 'pdfDetails.electricity') || safeGet(pdfData, 'electricity') || 'Yes, Available' },
      { item: 'iii. Road and public transport connectivity', value: safeGet(pdfData, 'pdfDetails.roadConnectivity') || safeGet(pdfData, 'roadTransport') || 'Yes. 18.00 mtr Wide S G Highway.' },
      { item: 'iv. Availability of other public utilities nearby', value: safeGet(pdfData, 'pdfDetails.publicUtilities') || safeGet(pdfData, 'otherPublicUtilities') || 'No, Approx. 2-3 km' }
  ],
  socialInfra: [
      { item: 'i. School', value: safeGet(pdfData, 'pdfDetails.schoolFacility') || safeGet(pdfData, 'schoolDistance') || 'Within 2 to 3 km Area' },
      { item: 'ii. Medical facilities', value: safeGet(pdfData, 'pdfDetails.medicalFacility') || safeGet(pdfData, 'hospitalDistance') || 'Within 2 to 3 km Area' },
      { item: 'iii. Recreational facility in terms of parks and Open space', value: safeGet(pdfData, 'pdfDetails.recreationalFacility') || safeGet(pdfData, 'parksDistance') || 'Within 2 to 3 km Area' }
  ]
});

// PAGE 8: MARKETABILITY OF THE PROPERTY - DYNAMIC from pdfDetails
const getMarketabilityData = (pdfData) => [
  {
      item: 'i. Locational attributes',
      value: safeGet(pdfData, 'pdfDetails.marketabilityLocational') || safeGet(pdfData, 'locationAttributes') || 'Good, abutting on 18.00 mt wide S G Highway, surrounded by developed commercial complex and Business hub Schemes, the said area is good potentiality.'
  },
  {
      item: 'ii. Scarcity',
      value: safeGet(pdfData, 'pdfDetails.marketabilityScarcity') || safeGet(pdfData, 'scarcityStatus') || 'No.'
  },
  {
      item: 'iii. Demand and supply of the kind of subject Property',
      value: safeGet(pdfData, 'pdfDetails.marketabilityDemandSupply') || safeGet(pdfData, 'demandSupply') || 'Good'
  },
  {
      item: 'iv. Comparable sale prices in the locality',
      value: safeGet(pdfData, 'pdfDetails.marketabilityComparablePrices') || safeGet(pdfData, 'comparablePrices') || 'Super Built-up area Rate is about Rs. 25,000/- to 30,000/- per sq.ft for Commercial Shop cum Show room on Ground Floor.<br/><br/>with reference to our local / Online Research /broker'
  },
  {
      item: 'b) Any other aspect which has relevance on the value or marketability of the property',
      value: safeGet(pdfData, 'pdfDetails.marketabilityOtherAspect') || safeGet(pdfData, 'marketabilityRemarks') || 'Shop cum Showroom in range of Rs. 25,000 to 30,000 per Sq.ft For Super Built-up Area, depends on size, location situation, Elevation, surrounding development, etc.'
  }
];

// PAGE 9: ENGINEERING AND TECHNOLOGY ASPECTS - DYNAMIC from pdfDetails
const getEngineeringAspectsData = (pdfData) => [
  { item: 'a) Type of construction', value: safeGet(pdfData, 'pdfDetails.constructionType') || safeGet(pdfData, 'typeOfConstruction') || 'RCC Frame structure' },
  { item: 'b) Material & technology used', value: safeGet(pdfData, 'pdfDetails.materialTechnology') || safeGet(pdfData, 'constructionMaterial') || 'As per Specifications' },
  { item: 'c) Specifications', value: safeGet(pdfData, 'pdfDetails.specifications') || safeGet(pdfData, 'buildingSpecifications') || 'NA' },
  { item: 'd) Maintenance issues', value: safeGet(pdfData, 'pdfDetails.maintenanceStatus') || safeGet(pdfData, 'maintenance') || 'Maintained' },
  { item: 'e) Age of the building', value: safeGet(pdfData, 'pdfDetails.buildingAge') || safeGet(pdfData, 'ageOfBuilding') || '12 Year' },
  { item: 'f) Total life of the building', value: safeGet(pdfData, 'pdfDetails.totalLife') || safeGet(pdfData, 'buildingTotalLife') || '48 years with Subject to preventive maintenance.' },
  { item: 'g) Extent of deterioration', value: safeGet(pdfData, 'pdfDetails.deterioration') || safeGet(pdfData, 'buildingDeterioration') || 'No.' },
  { item: 'h) Structural safety', value: safeGet(pdfData, 'pdfDetails.structuralSafety') || safeGet(pdfData, 'safetyStatus') || 'Yes.' },
  { item: 'i) Protection against natural disaster viz. earthquakes', value: safeGet(pdfData, 'pdfDetails.disasterProtection') || safeGet(pdfData, 'earthquakeProtection') || 'NA' },
  { item: 'j) Visible damage in the building', value: safeGet(pdfData, 'pdfDetails.visibleDamage') || safeGet(pdfData, 'buildingDamage') || 'No.' },
  { item: 'k) System of air-conditioning', value: safeGet(pdfData, 'pdfDetails.airConditioning') || safeGet(pdfData, 'acSystem') || 'NA' },
  { item: 'l) Provision of firefighting', value: safeGet(pdfData, 'pdfDetails.firefighting') || safeGet(pdfData, 'fireProtection') || 'NA' },
  { item: 'm) Copies of the plan and elevation of the building to be included', value: safeGet(pdfData, 'pdfDetails.buildingPlans') || safeGet(pdfData, 'plansAttached') || 'Yes, attached.' }
];

// PAGE 9: ENVIRONMENTAL FACTORS - DYNAMIC from pdfDetails
const getEnvironmentalFactorsData = (pdfData) => [
  { item: 'a) Use of environment friendly building materials, Green Building techniques if any', value: safeGet(pdfData, 'pdfDetails.greenBuildingTechniques') || safeGet(pdfData, 'environmentalFriendlyMaterials') || 'No' },
  { item: 'b) Provision of rain water harvesting', value: safeGet(pdfData, 'pdfDetails.rainWaterHarvesting') || safeGet(pdfData, 'waterHarvesting') || 'No.' },
  { item: 'c) Use of solar heating and lightening systems, etc.', value: safeGet(pdfData, 'pdfDetails.solarSystems') || safeGet(pdfData, 'solarEnergy') || 'No.' },
  { item: 'd) Presence of environmental pollution in the vicinity of the property in terms of industry, heavy traffic etc.', value: safeGet(pdfData, 'pdfDetails.environmentalPollution') || safeGet(pdfData, 'pollutionStatus') || 'No.' }
];

// PAGE 9: ARCHITECTURAL AND AESTHETIC QUALITY - DYNAMIC from pdfDetails
const getArchitecturalAspectsData = (pdfData) => [
  { item: 'a) Descriptive account on whether the building is modern, old fashioned, plain looking or decorative, heritage value, presence of landscape elements etc.', value: safeGet(pdfData, 'pdfDetails.architecturalQuality') || safeGet(pdfData, 'buildingAesthetic') || 'Subject Building Is Designed as Per Requirements.' }
];

// PAGE 11: VALUATION DETAILS - DYNAMIC from pdfDetails
const getValuationDetailsData = (pdfData) => ({
  constructionRate: safeGet(pdfData, 'pdfDetails.constructionRate') || safeGet(pdfData, 'constructionRate') || '27,000',
  rateDescription: safeGet(pdfData, 'pdfDetails.rateDescription') || safeGet(pdfData, 'rateNotes') || 'Construction Area Rate: Rs. 27,000/- per sq.ft for Super Built up Area Rate on Ground Floor Commercial Shop Cum Show Room<br/><br/>(We have verified the property rates for nearby area with local person/broker in this area, and refer to known web sites, like magic brick, 99acres, etc., the rate of Commercial Shop sum Show Room, varies from the rates are between Rs. 25,000/- to Rs. 30,000/- per sq.ft, Depends on location, approaches, surrounding developing, etc., We have considered the rate <strong>Rs. 27,000/- per sq.ft for Super Built up area Rate for Ground Floor Commercial Shop cum Show Room Considering Furnished Unit.</strong>',
  marketTrend: safeGet(pdfData, 'pdfDetails.marketTrend') || safeGet(pdfData, 'marketTrendNotes') || 'The prevailing market rate has remained stable in recent years, with marginal variations in specific localities.'
});

// PAGE 17: DOCUMENT CHECKLIST - DYNAMIC from pdfData
const getDocumentChecklistData = (pdfData) => [
  { document: 'Engagement Letter / Confirmation for Assignment', received: safeGet(pdfData, 'checklist.engagementLetter') || 'Yes', reviewed: safeGet(pdfData, 'checklist.engagementLetterReviewed') || '--' },
  { document: 'Ownership Documents: Sale Deed', received: safeGet(pdfData, 'checklist.saleDeed') || 'Yes', reviewed: safeGet(pdfData, 'checklist.saleDeedReviewed') || '--' },
  { document: 'Adv. TCR / LSR', received: safeGet(pdfData, 'checklist.tcrLsr') || '--', reviewed: safeGet(pdfData, 'checklist.tcrLsrReviewed') || 'No' },
  { document: 'Allotment Letter', received: safeGet(pdfData, 'checklist.allotmentLetter') || '--', reviewed: safeGet(pdfData, 'checklist.allotmentLetterReviewed') || 'No' },
  { document: 'Kabulat Lekh', received: safeGet(pdfData, 'checklist.kabualatLekh') || '--', reviewed: safeGet(pdfData, 'checklist.kabualatLekhReviewed') || 'No' },
  { document: 'Mortgage Deed', received: safeGet(pdfData, 'checklist.mortgageDeed') || '--', reviewed: safeGet(pdfData, 'checklist.mortgageDeedReviewed') || 'No' },
  { document: 'Lease Deed', received: safeGet(pdfData, 'checklist.leaseDeed') || '--', reviewed: safeGet(pdfData, 'checklist.leaseDeadReviewed') || 'No' },
  { document: 'Index – 2', received: safeGet(pdfData, 'checklist.index2') || '--', reviewed: safeGet(pdfData, 'checklist.index2Reviewed') || 'No' },
  { document: 'VF: 7/12 in case of Land', received: safeGet(pdfData, 'checklist.vf712') || '--', reviewed: safeGet(pdfData, 'checklist.vf712Reviewed') || 'No' },
  { document: 'NA order', received: safeGet(pdfData, 'checklist.naOrder') || '--', reviewed: safeGet(pdfData, 'checklist.naOrderReviewed') || 'No' },
  { document: 'Approved Plan', received: safeGet(pdfData, 'checklist.approvedPlan') || 'Yes', reviewed: safeGet(pdfData, 'checklist.approvedPlanReviewed') || '--' },
  { document: 'Commencement Letter', received: safeGet(pdfData, 'checklist.commencementLetter') || '--', reviewed: safeGet(pdfData, 'checklist.commencementLetterReviewed') || 'No' },
  { document: 'BU Permission', received: safeGet(pdfData, 'checklist.buPermission') || 'Yes', reviewed: safeGet(pdfData, 'checklist.buPermissionReviewed') || '--' },
  { document: 'Ele. Meter Photo', received: safeGet(pdfData, 'checklist.eleMeterPhoto') || '--', reviewed: safeGet(pdfData, 'checklist.eleMeterPhotoReviewed') || 'No' },
  { document: 'Light Bill', received: safeGet(pdfData, 'checklist.lightBill') || '--', reviewed: safeGet(pdfData, 'checklist.lightBillReviewed') || 'No' },
  { document: 'Muni. Tax Bill', received: safeGet(pdfData, 'checklist.muniTaxBill') || 'Yes', reviewed: safeGet(pdfData, 'checklist.muniTaxBillReviewed') || '--' },
  { document: 'Numbering – Flat / bungalow / Plot No. / Identification on Site', received: safeGet(pdfData, 'checklist.numbering') || 'Yes', reviewed: safeGet(pdfData, 'checklist.numberingReviewed') || '--' },
  { document: 'Boundaries of Property – Proper Demarcation', received: safeGet(pdfData, 'checklist.boundaries') || 'Yes', reviewed: safeGet(pdfData, 'checklist.boundariesReviewed') || '--' },
  { document: 'Merged Property?', received: safeGet(pdfData, 'checklist.mergedProperty') || '--', reviewed: safeGet(pdfData, 'checklist.mergedPropertyReviewed') || 'No' },
  { document: 'Premise can be Separated, and Entrance / Door is available for the mortgaged property?', received: safeGet(pdfData, 'checklist.premiseSeparation') || 'NA', reviewed: safeGet(pdfData, 'checklist.premiseSeparationReviewed') || '--', isNA: true },
  { document: 'Land is Locked?', received: safeGet(pdfData, 'checklist.landLocked') || '--', reviewed: safeGet(pdfData, 'checklist.landLockedReviewed') || 'No' },
  { document: 'Property is rented to Other Party', received: safeGet(pdfData, 'checklist.propertyRented') || '--', reviewed: safeGet(pdfData, 'checklist.propertyRentedReviewed') || 'No' },
  { document: 'If Rented – Rent Agreement is Provided?', received: safeGet(pdfData, 'checklist.rentAgreement') || '--', reviewed: safeGet(pdfData, 'checklist.rentAgreementReviewed') || 'No' },
  { document: 'Site Visit Photos', received: safeGet(pdfData, 'checklist.siteVisitPhotos') || 'Yes', reviewed: safeGet(pdfData, 'checklist.siteVisitPhotosReviewed') || '--' },
  { document: 'Selfie with Owner / Identifier', received: safeGet(pdfData, 'checklist.selfieOwner') || 'Yes', reviewed: safeGet(pdfData, 'checklist.selfieOwnerReviewed') || '--' },
  { document: 'Mobile No.', received: safeGet(pdfData, 'checklist.mobileNo') || 'Yes', reviewed: safeGet(pdfData, 'checklist.mobileNoReviewed') || '--' },
  { document: 'Data Sheet', received: safeGet(pdfData, 'checklist.dataSheet') || 'Yes', reviewed: safeGet(pdfData, 'checklist.dataSheetReviewed') || '--' },
  { document: 'Tentative Rate', received: safeGet(pdfData, 'checklist.tentativeRate') || 'Yes', reviewed: safeGet(pdfData, 'checklist.tentativeRateReviewed') || '--' },
  { document: 'Sale Instance / Local Inquiry / Verbal Survey', received: safeGet(pdfData, 'checklist.saleInstance') || 'Yes', reviewed: safeGet(pdfData, 'checklist.saleInstanceReviewed') || '--' },
  { document: 'Broker Recording', received: safeGet(pdfData, 'checklist.brokerRecording') || 'Yes', reviewed: safeGet(pdfData, 'checklist.brokerRecordingReviewed') || '--' },
  { document: 'Past Valuation Rate', received: safeGet(pdfData, 'checklist.pastValuationRate') || 'Yes', reviewed: safeGet(pdfData, 'checklist.pastValuationRateReviewed') || '--' }
];

// Helper function to normalize data structure - flatten nested objects from database
const normalizeDataForPDF = (data = {}) => {
  if (!data) return {};

  // Start with data as-is
  let normalized = { ...data };

  // 1. Extract from documentInformation (lowest priority)
  if (data.documentInformation) {
      normalized.branch = safeGet(normalized, 'branch', null) || data.documentInformation.branch;
      normalized.dateOfInspection = safeGet(normalized, 'dateOfInspection', null) || data.documentInformation.dateOfInspection;
      normalized.dateOfValuationReport = safeGet(normalized, 'dateOfValuationReport', null) || data.documentInformation.dateOfValuationReport;
      normalized.valuationPurpose = safeGet(normalized, 'valuationPurpose', null) || data.documentInformation.valuationPurpose;
  }

  // 2. Extract from ownerDetails
  if (data.ownerDetails) {
      normalized.ownerNameAddress = safeGet(normalized, 'ownerNameAddress', null) || data.ownerDetails.ownerNameAddress;
      normalized.briefDescriptionProperty = safeGet(normalized, 'briefDescriptionProperty', null) || data.ownerDetails.propertyDescription;
  }

  // 3. Extract from locationOfProperty
  if (data.locationOfProperty) {
      normalized.plotSurveyNo = safeGet(normalized, 'plotSurveyNo', null) || data.locationOfProperty.plotSurveyNo;
      normalized.doorNo = safeGet(normalized, 'doorNo', null) || data.locationOfProperty.doorNo;
      normalized.tpVillage = safeGet(normalized, 'tpVillage', null) || data.locationOfProperty.tsVillage;
      normalized.wardTaluka = safeGet(normalized, 'wardTaluka', null) || data.locationOfProperty.wardTaluka;
      normalized.mandalDistrict = safeGet(normalized, 'mandalDistrict', null) || data.locationOfProperty.mandalDistrict;
      normalized.layoutPlanIssueDate = safeGet(normalized, 'layoutPlanIssueDate', null) || data.locationOfProperty.dateLayoutIssueValidity;
      normalized.approvedMapAuthority = safeGet(normalized, 'approvedMapAuthority', null) || data.locationOfProperty.approvedMapIssuingAuthority;
      // Area fields from locationOfProperty (only if not set)
      normalized.postalAddress = extractAddressValue(safeGet(normalized, 'postalAddress', null) || data.locationOfProperty.postalAddress);
      normalized.residentialArea = data.locationOfProperty.residentialArea !== undefined ? data.locationOfProperty.residentialArea : normalized.residentialArea;
      normalized.commercialArea = data.locationOfProperty.commercialArea !== undefined ? data.locationOfProperty.commercialArea : normalized.commercialArea;
      normalized.industrialArea = data.locationOfProperty.industrialArea !== undefined ? data.locationOfProperty.industrialArea : normalized.industrialArea;
  }

  // 4. Extract from cityAreaType
  if (data.cityAreaType) {
      normalized.cityTown = safeGet(normalized, 'cityTown', null) || data.cityAreaType.cityTown;
  }

  // 5. Extract from areaClassification
  if (data.areaClassification) {
      normalized.areaClassification = safeGet(normalized, 'areaClassification', null) || data.areaClassification.areaClassification;
      normalized.urbanClassification = safeGet(normalized, 'urbanClassification', null) || data.areaClassification.areaType;
      normalized.governmentType = safeGet(normalized, 'governmentType', null) || data.areaClassification.govGovernance;
      normalized.govtEnactmentsCovered = safeGet(normalized, 'govtEnactmentsCovered', null) || data.areaClassification.stateGovernmentEnactments;
  }

  // 6. Extract from propertyBoundaries (only if not set)
  if (data.propertyBoundaries?.plotBoundaries) {
      normalized.boundariesPlotNorth = safeGet(normalized, 'boundariesPlotNorth', null) || data.propertyBoundaries.plotBoundaries.north;
      normalized.boundariesPlotSouth = safeGet(normalized, 'boundariesPlotSouth', null) || data.propertyBoundaries.plotBoundaries.south;
      normalized.boundariesPlotEast = safeGet(normalized, 'boundariesPlotEast', null) || data.propertyBoundaries.plotBoundaries.east;
      normalized.boundariesPlotWest = safeGet(normalized, 'boundariesPlotWest', null) || data.propertyBoundaries.plotBoundaries.west;
  }

  // 7. Extract from propertyDimensions
  if (data.propertyDimensions) {
      normalized.dimensionsDeed = safeGet(normalized, 'dimensionsDeed', null) || data.propertyDimensions.dimensionsAsPerDeed;
      normalized.dimensionsActual = safeGet(normalized, 'dimensionsActual', null) || data.propertyDimensions.actualDimensions;
      normalized.extentOfUnit = safeGet(normalized, 'extentOfUnit', null) || data.propertyDimensions.extent;
      normalized.latitudeLongitude = safeGet(normalized, 'latitudeLongitude', null) || data.propertyDimensions.latitudeLongitudeCoordinates;
      normalized.extentOfSiteValuation = safeGet(normalized, 'extentOfSiteValuation', null) || data.propertyDimensions.extentSiteConsideredValuation;
  }

  // 8. Extract from rateInfo (priority 1)
  if (data.rateInfo && !normalized.comparableRate) {
      normalized.comparableRate = data.rateInfo.comparableRateSimilarUnit;
      normalized.adoptedBasicCompositeRate = data.rateInfo.adoptedBasicCompositeRate;
      normalized.buildingServicesRate = data.rateInfo.buildingServicesRate;
      normalized.landOthersRate = data.rateInfo.landOthersRate;
  }

  // 9. Extract from rateValuation (priority 2 - overwrites rateInfo if present)
  if (data.rateValuation) {
      normalized.comparableRate = data.rateValuation.comparableRateSimilarUnitPerSqft || normalized.comparableRate;
      normalized.adoptedBasicCompositeRate = data.rateValuation.adoptedBasicCompositeRatePerSqft || normalized.adoptedBasicCompositeRate;
      normalized.buildingServicesRate = data.rateValuation.buildingServicesRatePerSqft || normalized.buildingServicesRate;
      normalized.landOthersRate = data.rateValuation.landOthersRatePerSqft || normalized.landOthersRate;
  }

  // 10. Extract from compositeRateDepreciation (priority 1)
  if (data.compositeRateDepreciation && !normalized.depreciatedBuildingRate) {
      normalized.depreciatedBuildingRate = data.compositeRateDepreciation.depreciatedBuildingRatePerSqft;
      normalized.replacementCostServices = data.compositeRateDepreciation.replacementCostUnitServicesPerSqft;
      normalized.buildingAge = data.compositeRateDepreciation.ageOfBuildingYears;
      normalized.buildingLife = data.compositeRateDepreciation.lifeOfBuildingEstimatedYears;
      normalized.depreciationPercentage = data.compositeRateDepreciation.depreciationPercentageSalvage;
      normalized.deprecatedRatio = data.compositeRateDepreciation.depreciatedRatioBuilding;
      normalized.totalCompositeRate = data.compositeRateDepreciation.totalCompositeRatePerSqft;
      normalized.rateForLandOther = data.compositeRateDepreciation.rateLandOtherV3IIPerSqft;
      normalized.guidelineRate = data.compositeRateDepreciation.guidelineRatePerSqm;
  }

  // 11. Extract from compositeRate (priority 2 - overwrites if present)
  if (data.compositeRate) {
      normalized.depreciatedBuildingRate = data.compositeRate.depreciatedBuildingRate || normalized.depreciatedBuildingRate;
      normalized.replacementCostServices = data.compositeRate.replacementCostUnitServices || normalized.replacementCostServices;
      normalized.buildingAge = data.compositeRate.ageOfBuilding || normalized.buildingAge;
      normalized.buildingLife = data.compositeRate.lifeOfBuildingEstimated || normalized.buildingLife;
      normalized.depreciationPercentage = data.compositeRate.depreciationPercentageSalvage || normalized.depreciationPercentage;
      normalized.deprecatedRatio = data.compositeRate.depreciatedRatioBuilding || normalized.deprecatedRatio;
      normalized.totalCompositeRate = data.compositeRate.totalCompositeRate || normalized.totalCompositeRate;
      normalized.rateForLandOther = data.compositeRate.rateLandOtherV3II || normalized.rateForLandOther;
      normalized.guidelineRate = data.compositeRate.guidelineRateRegistrar || normalized.guidelineRate;
  }

  // 12. Extract from valuationResults
  if (data.valuationResults) {
      normalized.fairMarketValue = safeGet(normalized, 'fairMarketValue', null) || data.valuationResults.fairMarketValue;
      normalized.realizableValue = safeGet(normalized, 'realizableValue', null) || data.valuationResults.realizableValue;
      normalized.distressValue = safeGet(normalized, 'distressValue', null) || data.valuationResults.distressValue;
      normalized.saleDeedValue = safeGet(normalized, 'saleDeedValue', null) || data.valuationResults.saleDeedValue;
      normalized.insurableValue = safeGet(normalized, 'insurableValue', null) || data.valuationResults.insurableValue;
      normalized.rentReceivedPerMonth = safeGet(normalized, 'rentReceivedPerMonth', null) || data.valuationResults.rentReceivedPerMonth;
      normalized.marketability = safeGet(normalized, 'marketability', null) || data.valuationResults.marketability;
  }

  // 13. Extract from buildingConstruction
  if (data.buildingConstruction) {
      normalized.yearOfConstruction = safeGet(normalized, 'yearOfConstruction', null) || data.buildingConstruction.yearOfConstruction;
      normalized.numberOfFloors = safeGet(normalized, 'numberOfFloors', null) || data.buildingConstruction.numberOfFloors;
      normalized.numberOfDwellingUnits = safeGet(normalized, 'numberOfDwellingUnits', null) || data.buildingConstruction.numberOfDwellingUnits;
      normalized.typeOfStructure = safeGet(normalized, 'typeOfStructure', null) || data.buildingConstruction.typeOfStructure;
      normalized.qualityOfConstruction = safeGet(normalized, 'qualityOfConstruction', null) || data.buildingConstruction.qualityOfConstruction;
      normalized.appearanceOfBuilding = safeGet(normalized, 'appearanceOfBuilding', null) || data.buildingConstruction.appearanceOfBuilding;
      normalized.maintenanceOfBuilding = safeGet(normalized, 'maintenanceOfBuilding', null) || data.buildingConstruction.maintenanceOfBuilding;
  }

  // 14. Extract from electricityService
  if (data.electricityService) {
      normalized.electricityServiceConnectionNo = safeGet(normalized, 'electricityServiceConnectionNo', null) || data.electricityService.electricityServiceConnectionNo;
      normalized.meterCardName = safeGet(normalized, 'meterCardName', null) || data.electricityService.meterCardName;
  }

  // 15. Extract from unitTax
  if (data.unitTax) {
      normalized.assessmentNo = safeGet(normalized, 'assessmentNo', null) || data.unitTax.assessmentNo;
      normalized.taxPaidName = safeGet(normalized, 'taxPaidName', null) || data.unitTax.taxPaidName;
      normalized.taxAmount = safeGet(normalized, 'taxAmount', null) || data.unitTax.taxAmount;
  }

  // 16. Extract from unitMaintenance
  if (data.unitMaintenance) {
      normalized.unitMaintenance = safeGet(normalized, 'unitMaintenance', null) || data.unitMaintenance.unitMaintenanceStatus;
  }

  // 17. Extract from unitSpecifications
  if (data.unitSpecifications) {
      normalized.floorUnit = safeGet(normalized, 'floorUnit', null) || data.unitSpecifications.floorLocation;
      normalized.doorNoUnit = safeGet(normalized, 'doorNoUnit', null) || data.unitSpecifications.doorNoUnit;
      normalized.roofUnit = safeGet(normalized, 'roofUnit', null) || data.unitSpecifications.roof;
      normalized.flooringUnit = safeGet(normalized, 'flooringUnit', null) || data.unitSpecifications.flooring;
      normalized.doorsUnit = safeGet(normalized, 'doorsUnit', null) || data.unitSpecifications.doors;
      normalized.windowsUnit = safeGet(normalized, 'windowsUnit', null) || data.unitSpecifications.windows;
      normalized.fittingsUnit = safeGet(normalized, 'fittingsUnit', null) || data.unitSpecifications.fittings;
      normalized.finishingUnit = safeGet(normalized, 'finishingUnit', null) || data.unitSpecifications.finishing;
      normalized.unitBathAndWC = safeGet(normalized, 'unitBathAndWC', null) || data.unitSpecifications.bathAndWC;
      normalized.unitElectricalWiring = safeGet(normalized, 'unitElectricalWiring', null) || data.unitSpecifications.electricalWiring;
      normalized.unitWindows = safeGet(normalized, 'unitWindows', null) || data.unitSpecifications.windows;
      normalized.unitSpecification = safeGet(normalized, 'unitSpecification', null) || data.unitSpecifications.specification;
  }

  // 18. Extract from unitAreaDetails
  if (data.unitAreaDetails) {
      normalized.undividedLandArea = normalized.undividedLandArea || data.unitAreaDetails.undividedLandAreaSaleDeed || data.unitAreaDetails.undividedLandArea;
      normalized.plinthArea = normalized.plinthArea || data.unitAreaDetails.plinthAreaUnit || data.unitAreaDetails.plinthArea;
      normalized.carpetArea = normalized.carpetArea || data.unitAreaDetails.carpetAreaUnit || data.unitAreaDetails.carpetArea;
  }

  // 19. Extract from unitClassification
  if (data.unitClassification) {
      normalized.floorSpaceIndex = safeGet(normalized, 'floorSpaceIndex', null) || data.unitClassification.floorSpaceIndex;
      normalized.unitClassification = normalized.unitClassification || data.unitClassification.unitClassification || data.unitClassification.classification;
      normalized.residentialOrCommercial = normalized.residentialOrCommercial || data.unitClassification.residentialOrCommercial || data.unitClassification.usageType;
      normalized.ownerOccupiedOrLetOut = normalized.ownerOccupiedOrLetOut || data.unitClassification.ownerOccupiedOrLetOut || data.unitClassification.occupancyType;
      normalized.numberOfDwellingUnits = normalized.numberOfDwellingUnits || data.unitClassification.numberOfDwellingUnits;
  }

  // 20. Extract from apartmentLocation
  if (data.apartmentLocation) {
      normalized.apartmentNature = safeGet(normalized, 'apartmentNature', null) || data.apartmentLocation.apartmentNature;
      normalized.apartmentLocation = normalized.apartmentLocation || data.apartmentLocation.apartmentLocation || data.apartmentLocation.location;
      normalized.apartmentCTSNo = normalized.apartmentCTSNo || data.apartmentLocation.apartmentCTSNo || data.apartmentLocation.ctsNo || data.apartmentLocation.cTSNo;
      normalized.apartmentTSNo = normalized.apartmentTSNo || data.apartmentLocation.tsNo || data.apartmentLocation.ctsNo || data.apartmentLocation.tSNo || data.apartmentLocation.plotSurveyNo;
      normalized.apartmentBlockNo = normalized.apartmentBlockNo || data.apartmentLocation.blockNo || data.apartmentLocation.block || data.apartmentLocation.blockNumber;
      normalized.apartmentWardNo = normalized.apartmentWardNo || data.apartmentLocation.wardNo || data.apartmentLocation.ward || data.apartmentLocation.wardNumber;
      normalized.apartmentVillageMunicipalityCounty = normalized.apartmentVillageMunicipalityCounty || data.apartmentLocation.villageOrMunicipality || data.apartmentLocation.village || data.apartmentLocation.municipality || data.apartmentLocation.tsVillage;
      normalized.apartmentDoorNoStreetRoad = normalized.apartmentDoorNoStreetRoad || data.apartmentLocation.doorNoStreetRoadPinCode || data.apartmentLocation.doorNo || data.apartmentLocation.streetRoad || data.apartmentLocation.street || data.apartmentLocation.doorNumber || data.apartmentLocation.roadName;
      normalized.apartmentPinCode = normalized.apartmentPinCode || data.apartmentLocation.pinCode;
  }

  // 21. Extract from monthlyRent
  if (data.monthlyRent) {
      normalized.monthlyRent = safeGet(normalized, 'monthlyRent', null) || data.monthlyRent.ifRentedMonthlyRent;
  }

  // 22. Extract from marketability
  if (data.marketability) {
      normalized.marketability = safeGet(normalized, 'marketability', null) || data.marketability.howIsMarketability;
      normalized.favoringFactors = safeGet(normalized, 'favoringFactors', null) || data.marketability.factorsFavouringExtraPotential;
      normalized.negativeFactors = safeGet(normalized, 'negativeFactors', null) || data.marketability.negativeFactorsAffectingValue;
  }

  // 23. Extract from signatureReport
  if (data.signatureReport) {
      normalized.valuationPlace = safeGet(normalized, 'valuationPlace', null) || data.signatureReport.place;
      normalized.valuationDate = safeGet(normalized, 'valuationDate', null) || data.signatureReport.signatureDate;
      normalized.valuersName = safeGet(normalized, 'valuersName', null) || data.signatureReport.signerName;
      normalized.reportDate = safeGet(normalized, 'reportDate', null) || data.signatureReport.reportDate;
  }

  // 24. Extract from additionalFlatDetails
  if (data.additionalFlatDetails) {
      normalized.areaUsage = safeGet(normalized, 'areaUsage', null) || data.additionalFlatDetails.areaUsage;
      normalized.carpetArea = normalized.carpetArea || data.additionalFlatDetails.carpetAreaFlat;
  }

  // 25. Extract from guidelineRate
  if (data.guidelineRate) {
      normalized.guidelineRate = safeGet(normalized, 'guidelineRate', null) || data.guidelineRate.guidelineRatePerSqm;
  }

  // 26. Extract images (preserve as arrays and objects)
  normalized.propertyImages = normalized.propertyImages || data.propertyImages || [];
  normalized.locationImages = normalized.locationImages || data.locationImages || [];
  normalized.documentPreviews = normalized.documentPreviews || data.documentPreviews || [];
  normalized.areaImages = normalized.areaImages || data.areaImages || {};

  // 27. Extract document fields with correct priority
  if (data.documentsProduced) {
      normalized.agreementForSale = normalized.agreementForSale || data.documentsProduced.photocopyCopyAgreement;
      normalized.commencementCertificate = normalized.commencementCertificate || data.documentsProduced.commencementCertificate;
      normalized.occupancyCertificate = normalized.occupancyCertificate || data.documentsProduced.occupancyCertificate;
  }

  // 28. Extract from pdfDetails for documents (only if not set)
  if (data.pdfDetails) {
      normalized.agreementForSale = normalized.agreementForSale || data.pdfDetails.agreementForSale || data.pdfDetails.agreementSaleExecutedName;
      normalized.commencementCertificate = normalized.commencementCertificate || data.pdfDetails.commencementCertificate;
      normalized.occupancyCertificate = normalized.occupancyCertificate || data.pdfDetails.occupancyCertificate;
  }

  // 29. Extract from agreementForSale nested object
  if (data.agreementForSale?.agreementForSaleExecutedName) {
      normalized.agreementForSale = normalized.agreementForSale || data.agreementForSale.agreementForSaleExecutedName;
  }

  // 30. Root level document fields (last resort)
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
      uniqueId: data?.uniqueId,
      clientName: data?.clientName,
      normalizedKeys: Object.keys(normalizedData).length
  });

  // Start with ONLY normalized data (eliminate redundant root merge)
  let pdfData = normalizedData;

  // Flatten pdfDetails into root level ONLY for fields not already set
  if (data?.pdfDetails && typeof data.pdfDetails === 'object') {
      const preservedPropertyImages = pdfData.propertyImages;
      const preservedLocationImages = pdfData.locationImages;
      const preservedDocumentPreviews = pdfData.documentPreviews;

      // Only merge fields from pdfDetails that aren't already in normalized data
      Object.keys(data.pdfDetails).forEach(key => {
          if (pdfData[key] === undefined || pdfData[key] === null || pdfData[key] === 'NA') {
              pdfData[key] = data.pdfDetails[key];
          }
      });

      // Restore image arrays (they should NOT be overwritten)
      if (preservedPropertyImages) pdfData.propertyImages = preservedPropertyImages;
      if (preservedLocationImages) pdfData.locationImages = preservedLocationImages;
      if (preservedDocumentPreviews) pdfData.documentPreviews = preservedDocumentPreviews;
  }

  // Flatten facilities object if it exists
  if (data?.facilities && typeof data.facilities === 'object') {
      Object.keys(data.facilities).forEach(key => {
          if (pdfData[key] === undefined || pdfData[key] === null) {
              pdfData[key] = data.facilities[key];
          }
      });
  }

  // Minimal field aliasing for template compatibility (no duplicate mappings)
  // The normalized function already handles all data extraction properly
  const aliasFields = {
      plotNo: ['plotSurveyNo'],
      tsNoVillage: ['tpVillage'],
      layoutIssueDate: ['layoutPlanIssueDate'],
      mapVerified: ['authenticityVerified'],
      valuersComments: ['valuerCommentOnAuthenticity'],
      urbanType: ['urbanClassification'],
      jurisdictionType: ['governmentType'],
      enactmentCovered: ['govtEnactmentsCovered'],
      extentUnit: ['extent', 'extentOfUnit'],
      apartmentMunicipality: ['apartmentVillageMunicipalityCounty'],
      localityDescription: ['descriptionOfLocalityResidentialCommercialMixed'],
      yearConstruction: ['yearOfConstruction'],
      structureType: ['typeOfStructure'],
      qualityConstruction: ['qualityOfConstruction'],
      buildingAppearance: ['appearanceOfBuilding'],
      buildingMaintenance: ['maintenanceOfBuilding'],
      classificationPosh: ['unitClassification'],
      compositeRateAnalysis: ['comparableRate'],
      newConstructionRate: ['adoptedBasicCompositeRate'],
  };

  // Apply aliases (only if primary field is not set)
  Object.entries(aliasFields).forEach(([primary, aliases]) => {
      if (!pdfData[primary]) {
          for (const alias of aliases) {
              if (pdfData[alias]) {
                  pdfData[primary] = pdfData[alias];
                  break;
              }
          }
      }
  });

  // Extract address value if needed
  if (pdfData.postalAddress && typeof pdfData.postalAddress === 'object') {
      pdfData.postalAddress = extractAddressValue(pdfData.postalAddress);
  }

  // Boolean conversions for checkboxes (using safeGet for proper Yes/No)
  const booleanFields = [
      'residentialArea', 'commercialArea', 'industrialArea',
      'facilityLift', 'facilityWater', 'facilitySump', 'facilityParking',
      'facilityCompoundWall', 'facilityPavement', 'facilityOthers',
      'compoundWall', 'pavement'
  ];

  booleanFields.forEach(field => {
      if (pdfData[field] !== undefined && pdfData[field] !== null) {
          pdfData[field] = safeGet(pdfData, field);
      }
  });

  // Debug: Log critical fields
  ('📋 PDF Ready:', {
      uniqueId: pdfData.uniqueId,
      clientName: pdfData.clientName,
      city: pdfData.city,
      carpetArea: pdfData.carpetArea,
      fairMarketValue: pdfData.fairMarketValue
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
  * { margin: 0; padding: 0; box-sizing: border-box; font-size: 12pt; }
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
    margin: 0;
  }
  .continuous-wrapper {
     border: none !important;
     outline: none !important;
     box-shadow: none !important;
     margin: 0 !important;
     padding: 0 !important;
     background: white;
     page-break-inside: auto !important;
   }

  .page { 
     padding: 0;
     background: white; 
     width: 100%;
     box-sizing: border-box;
     page-break-inside: auto;
  }

  .pdf-page {
    width: 210mm;
    height: 297mm;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    background: white;
  }
.property-grid {
display: grid;
grid-template-columns: repeat(3, 1fr);
grid-auto-rows: 62mm;
gap: 4mm;
padding: 0 10mm;
height: 240mm;
}

.property-cell img {
width: 100%;
height: 52mm;
object-fit: contain;
}

  .print-container {
     width: 100% !important;
     page-break-inside: auto !important;
     margin: 0 !important;
    overflow: visible !important;
    display: block !important;
    clear: both !important;
    margin: 0 !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .form-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    margin: 0;
    margin-bottom: 0;
    font-size: 12pt;
    table-layout: fixed;
    box-sizing: border-box;
  }

  .form-table.fixed-cols {
    table-layout: fixed;
  }

  .form-table tbody {
    display: table-row-group;
  }

  .form-table tr {
    height: auto;
    display: table-row;
  }

  .form-table tr:first-child {
    height: auto;
  }

  .form-table.compact tr {
    height: auto;
    min-height: 18px;
  }

  .form-table.compact td {
    padding: 3px 4px;
    min-height: 18px;
  }

  .form-table td {
    border: 1px solid #000 !important;
    padding: 8px 12px;
    vertical-align: top !important;
    color: #000;
    background: white;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    overflow: visible;
    height: auto !important;
    font-weight: normal;
    font-size: 12pt;
  }

  /* Header row - bold borders all around */
  .form-table tr:first-child td {
    border: 2px solid #000 !important;
    min-height: 32px;
    height: 32px;
    padding: 5px 8px;
    vertical-align: middle;
  }



  /* Left and right edges - borders removed */

  /* Bottom row - single border only */
  .form-table tr:last-child td {
    border-bottom: 1px solid #000 !important;
    padding-bottom: 8px;
  }

  .table-header {
   border: 1px solid #000;
   padding: 6px;
   text-align: center;
   font-weight: bold;
   font-size: 12pt;
  }

  .table-cell {
   border: 1px solid #000;
   padding: 6px;
   text-align: center;
   font-size: 12pt;
  }

  .form-table .row-num {
    width: 45px;
    min-width: 45px;
    max-width: 45px;
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
     width: 300px;
     min-width: 300px;
     max-width: 300px;
     font-weight: normal;
     background: #ffffffff;
     border: 1px solid #000 !important;
     word-wrap: break-word;
     overflow-wrap: break-word;
     vertical-align: top !important;
     padding: 8px 12px;
     white-space: normal;
     height: auto !important;
     word-break: break-word;
     overflow: visible;
     font-size: 12pt;
   }

    .form-table .value {
      width: 300px;
      min-width: 300px;
      max-width: 300px;
      text-align: left;
      background: white;
      border: 1px solid #000 !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      vertical-align: top !important;
      padding: 8px 12px;
      white-space: normal;
      height: auto !important;
      overflow: visible;
      font-weight: normal;
      font-size: 12pt;
    }

  .header-section {
    text-align: center;
    margin-bottom: 20px;
    padding: 10px 0;
  }

  .header-title {
    font-weight: bold;
    font-size: 14pt;
    text-align: center;
    margin-bottom: 5px;
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
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    overflow: visible;
    height: auto !important;
  }

  .form-table.four-col .row-num {
    width: 45px;
    min-width: 45px;
    max-width: 45px;
    border: 1px solid #000 !important;
  }

  .form-table.four-col .label {
    width: 200px;
    min-width: 200px;
    max-width: 200px;
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
    width: 130px;
    min-width: 130px;
    max-width: 130px;
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
    width: 130px;
    min-width: 130px;
    max-width: 130px;
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
    width: 130px;
    min-width: 130px;
    max-width: 130px;
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
     width: 130px;
     min-width: 130px;
     max-width: 130px;
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
     width: 150px;
     min-width: 150px;
     max-width: 150px;
   }

   /* Print/PDF specific styles - remove all extra borders */
   @media print {
     * {
       border-top: none !important;
       border-bottom: none !important;
       box-shadow: none !important;
     }

     html, body {
       margin: 0 !important;
       padding: 0 !important;
       border: none !important;
       background: white !important;
     }

     .continuous-wrapper {
       border: none !important;
       outline: none !important;
       box-shadow: none !important;
       margin: 0 !important;
       padding: 0 !important;
     }

     .page {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        margin: 0 !important;
      }

      .form-table {
        border: none !important;
        border-collapse: collapse !important;
        margin: 0 !important;
      }

     .form-table td {
       border-top: 1px solid #000 !important;
       border-bottom: 1px solid #000 !important;
     }

     .header-section, .header {
       border: none !important;
     }

     div:not(.form-table):not(.page):not(.continuous-wrapper) {
       border: none !important;
       box-shadow: none !important;
     }

     hr {
       display: none !important;
     }

     /* Page break styles for tables */
     table {
       border-collapse: collapse;
       page-break-inside: auto;
       orphans: 1;
       widows: 1;
     }

     tbody {
       page-break-inside: auto;
       orphans: 1;
       widows: 1;
     }

     tr {
       page-break-after: auto;
       page-break-inside: auto;
       orphans: 1;
       widows: 1;
     }

     /* Prevent wrapper divs from creating extra borders at page breaks */
     div[style*="padding: 8px"] {
       
       border: none !important;
     }

     /* Remove any background or border styling that might appear at page boundaries */
     .continuous-wrapper,
     .page {
       border: none !important;
       background: white;
       box-shadow: none !important;
       outline: none !important;
       page-break-inside: auto;
     }

     /* Page break for forcing new page */
     .page-break {
       page-break-after: always;
       display: block;
       clear: both;
     }

     /* Allow content to shift to next page if it doesn't fit on current page */
     .continuous-wrapper {
       page-break-inside: auto;
     }

     /* Allow tables and divs to break across pages */
     table {
       page-break-inside: auto;
     }

     tr {
        page-break-inside: auto;
        page-break-after: auto;
        orphans: 1;
        widows: 1;
      }

      td {
        page-break-inside: auto;
      }

      /* Force page breaks for large content blocks */
      div[style*="margin: 20px"] {
        page-break-inside: auto;
      }

      section {
        page-break-inside: auto;
      }

      /* Ensure tables break properly across pages */
      table {
        page-break-inside: auto;
        orphans: 1;
        widows: 1;
      }

      tbody {
        page-break-inside: auto;
      }

      /* Allow divs with content to break */
      div {
        page-break-inside: auto;
        orphans: 1;
        widows: 1;
      }
     }

      </style>
</head>

<body>

<!-- CONTINUOUS WRAPPER - NO FIXED PAGES -->
<div class="continuous-wrapper" >
<!-- PAGE 1 HEADER -->
<div style="margin-top: 0px; margin-bottom: 5px; padding: 5px 20px; width: 100%; box-sizing: border-box;">
  <div style="text-align: center; margin-bottom: 8px;">
    ${(() => {
          const company = safeGet(pdfData, 'pdfDetails.valuationCompany', '');
          const subtitle = safeGet(pdfData, 'pdfDetails.valuationCompanySubtitle', '');
          const master = safeGet(pdfData, 'pdfDetails.masterValuation', '');
          const regValuer = safeGet(pdfData, 'pdfDetails.regValuer', '');
          const govtReg = safeGet(pdfData, 'pdfDetails.govtReg', '');

          let html = '';
          if (company && company !== 'NA') html += `<p style="font-size: 12pt; font-weight: bold; margin: 0;">${company}</p>`;
          if (subtitle && subtitle !== 'NA') html += `<p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">(${subtitle})</p>`;

          let credentials = '';
          if (master && master !== 'NA') credentials += master + '<br/>';
          if (regValuer && regValuer !== 'NA') credentials += regValuer + '<br/>';
          if (govtReg && govtReg !== 'NA') credentials += govtReg;

          if (credentials) html += `<p style="font-size: 12pt; margin: 2px 0; color: #333;">${credentials}</p>`;

          return html || '';
      })()
      }
        </div>
        </div>

        <div style="text-align: center; margin-bottom: 5px;">
        <p style="font-size: 15pt; font-weight: bold; margin: 0; text-align: center; color: #4472C4;">VALUATION REPORT</p>
        </div>

<!-- PAGE 1: Account Information Table & Image Container -->
<div style="padding: 5px 20px; width: 100%; box-sizing: border-box; page-break-after: always !important;">
  <table style="width: 100%; border-collapse: collapse; margin: 0 0 10px 0; padding: 0; border: 1px solid #000 !important; box-sizing: border-box; table-layout: fixed;">
    ${getAccountInformationTableData(pdfData).map(row => createTableRow(row.label, row.value, '#ffffff', '#ffffff', '35%', '65%', '12pt')).join('')}
  </table>

  <!-- Bank Image Below Table -->
  ${(() => {
    const bankImg = safeGet(pdfData, 'bankImage');
    const imgSrc = getImageSource(bankImg);
    return imgSrc ? `
    <div class="image-container" style="text-align: center; margin-top: 5px; margin-bottom: 5px; display: flex; justify-content: center;border: 2px solid #000 !important;
                 padding: 5px !important;
                 box-sizing: border-box !important;">
      <img src="${imgSrc}" alt="Bank Image" style="width: 700px; height: 450px; object-fit: cover; border: none; background: #f5f5f5; padding: 5px; box-sizing: border-box; margin: 0 auto;" crossorigin="anonymous" loading="eager" />
    </div>
    ` : '';
  })()}
  </div>

  <!-- PAGE 1 FOOTER -->
  
  <!-- PAGE 2 START - Page Break Forced -->
  <div class="" style="page-break-before: always !important; clear: both; margin-top: 25px; margin-bottom: 0px; padding: 5px 20px; width: 100%; box-sizing: border-box; display: block;">
  
  <!-- PAGE 2: Summary Values Table - Dynamically Generated -->
          <p style="font-size: 15pt; font-weight: bold; text-align: center; margin: 5px 0 10px 0; color: #4472C4;">VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 12pt; margin: 0; padding: 0; border: 1px solid #000000; box-sizing: border-box; table-layout: fixed;">
  ${getSummaryValuesTableData(pdfData).map(row =>
          `<tr>
      <td style="width: 40%; background: #ffffff; border: 1px solid #000000; padding: 7px 5px; vertical-align: middle;">${row.label}</td>
      <td style="width: 60%; background: #ffffff; border: 1px solid #000000; padding: 7px 5px; ${row.label.includes('TOTAL') || row.label.includes('VALUE') ? 'font-weight: bold;' : ''} vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${row.value}</td>
    </tr>`
      ).join('')}
      <tr>
      <td colspan="2" style="background: #ffffffff; border: 1px solid #000000; padding: 5px 6px;">
       <div style="margin-top: 3px; margin-bottom: 3px; background-color: #ffffffff; padding: 5px 8px; border: 1px solid #ffffffff;">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
           <div style="font-size: 12pt;">
             <span style="font-weight: bold;">Date:</span> <span style="background-color: #ffffffff;">${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport'))}</span>
           </div>
           <div style="font-size: 12pt; text-align: right;">
             <span style="font-weight: bold;">"Rajesh Ganatra"</span>
    </div>
         </div>
         <div style="display: flex; justify-content: space-between; align-items: center;">
           <div style="font-size: 12pt;">
             <span style="font-weight: bold;">Place:</span> <span style="background-color: #ffffffff;">${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</span>
           </div>
           <div style="font-size: 12pt; text-align: right;">
             <span style="font-weight: bold;">${safeGet(pdfData, 'pdfDetails.designation', 'Govt. Registered Valuer')}</span>
           </div>
         </div>
       </div>
     </td>
    </tr>
    </table>
    <!-- END: valued-property-summary-section -->
   <!-- PAGE 2 FOOTER -->
   <!-- PAGE 3 HEADER - ANNEXURE-II START -->
  <div class="" style="page-break-before: always !important; clear: both; margin-top: 5px; margin-bottom: 0px; padding: 5px 20px; width: 100%; box-sizing: border-box; display: block;">
  <div style="text-align: center; margin-bottom: 3px;">
    ${(() => {
          const company = safeGet(pdfData, 'pdfDetails.valuationCompany', '');
          const subtitle = safeGet(pdfData, 'pdfDetails.valuationCompanySubtitle', '');
          const master = safeGet(pdfData, 'pdfDetails.masterValuation', '');
          const regValuer = safeGet(pdfData, 'pdfDetails.regValuer', '');
          const govtReg = safeGet(pdfData, 'pdfDetails.govtReg', '');

          let html = '';
          if (company && company !== 'NA') html += `<p style="font-size: 14pt; font-weight: bold; margin: 0;">${company}</p>`;
          if (subtitle && subtitle !== 'NA') html += `<p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">(${subtitle})</p>`;

          let credentials = '';
          if (master && master !== 'NA') credentials += master + '<br/>';
          if (regValuer && regValuer !== 'NA') credentials += regValuer + '<br/>';
          if (govtReg && govtReg !== 'NA') credentials += govtReg;

          if (credentials) html += `<p style="font-size: 12pt; margin: 2px 0; color: #333;">${credentials}</p>`;

          return html || '';
      })()
      }
  </div>
  <!-- Header Text with yellow background -->
  <div style="margin-top: 10px; margin-bottom: 15px;">
    <p style="margin: 0; font-size: 12pt; text-align: center; background-color: #ffffff; padding: 5px; font-weight: bold;">ANNEXURE-II </p>
   <p style="margin: 0; font-size: 12pt; text-align: center; background-color: #ffffff; padding: 5px; font-weight: bold;">VALUATION REPORT </p>
   <p style="margin: 0; font-size: 12pt; text-align: center; background-color: #ffffff; padding: 5px; font-weight: bold;">(to be used for all properties of value above Rs.5 Crore)</p>
  </div>

<!-- Top Table with Branch and Customer Info - DYNAMIC -->
<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #000 !important; table-layout: fixed;">
  <tr >
    <td style="width: 50%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 5px 6px; font-size: 12pt; vertical-align: top; ">Name & Address of Branch</td>
    <td style="width: 50%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 5px 6px; font-size: 12pt; vertical-align: top; ">Name of Customer (s)/ Borrower:<br/>(for which valuation report is sought)</td>
  </tr>
  <tr >
    <td style="width: 50%; background: #ffffff; border: 1px solid #000 !important; padding: 5px 6px; font-size: 12pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">To,<br/>The Chief Manager,<br/>${safeGet(pdfData, 'bankName') || 'State Bank of India'},<br/>${safeGet(pdfData, 'pdfDetails.branchName') || safeGet(pdfData, 'pdfDetails.branchAddress')}<br/>${safeGet(pdfData, 'city') || 'NA'}, India.</td>
    <td style="width: 50%; background: #ffffff; border: 1px solid #000 !important; padding: 5px 6px; font-size: 12pt; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${safeGet(pdfData, 'pdfDetails.accountName') || safeGet(pdfData, 'accountName') || 'NA'}</td>
  </tr>
</table>

<!-- Introduction Section -->
<div style="margin-bottom: 5px;">
  <p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">1. Introduction</p>
</div>

<!-- PAGE 3: Introduction Table - Dynamically Generated -->
<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #000 !important; table-layout: fixed;">
  ${getIntroductionTableData(pdfData).map(row => createTableRowTopAlign(row.label, row.value, '#ffffff', '#ffffff', row.labelWidth || '50%', row.valueWidth || '50%')).join('')}
</table>

<!-- Physical Characteristics Section -->
<div style="margin-bottom: 5px;">
  <p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">2. Physical Characteristics of the Property</p>
</div>

<!-- PAGE 3 & 4: Physical Characteristics Table (i-iii) + Detailed Property Table (IV-X) - COMBINED -->
<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #000 !important; table-layout: fixed;">
  ${(() => {
          const data = getPhysicalCharacteristicsTableData(pdfData);
          let html = '';
          data.forEach((row, idx) => {
              if (row.isHeader) {
                  html += `
          <tr >
          <td style="width: 8%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">${row.number}</td>
          <td colspan="2" style="width: 92%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.label}</td>
          </tr>`;
              } else {
                  html += `
          <tr >
          <td style="width: 8%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">${row.number}</td>
          <td style="width: 35%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.label}</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.value}</td>
          </tr>`;
              }
          });
                                                                      
          // Continue with IV onwards from getDetailedPropertyTableData
          getDetailedPropertyTableData(pdfData).slice(0, 8).forEach(row => {
              html += `
          <tr >
           <td style="width: 8%; background: #ffffff;font-weight: bold;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">${row.label}</td>
           <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.item}</td>
           <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.value}</td>
          </tr>`;
          });

          // Add XI and XII
          getDetailedPropertyTableData(pdfData).slice(8, 10).forEach(row => {
              html += `
          <tr >
           <td style="width: 8%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">${row.label}</td>
           <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.item}</td>
           <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${row.value}</td>
          </tr>`;
          });

          // Add item b) - Plinth area, carpet area, and saleable area
          html += `
          <tr >
           <td style="width: 8%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">b)</td>
           <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">Plinth area, carpet area, and saleable area to be mentioned separately and clarified</td>
           <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${safeGet(pdfData, 'plinthArea')}</td>
          </tr>`;

          // Add item C) - Boundaries of the Plot
          html += `
          <tr ><td style="width: 8%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">C)</td>
          <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">Boundaries of the Plot</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">As per Document</td>
          </tr>`;

          // Add boundary directions (NORTH, SOUTH, EAST, WEST)
          getBoundaryData(pdfData).forEach(boundary => {
              html += `
          <tr >
          <td style="width: 8%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;"></td>
          <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">${boundary.direction}</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${boundary.value}</td>
          </tr>`;
          });

          // Add Boundaries as per Actual on Site section
          html += `
          <tr >
          <td style="width: 8%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;"></td>
          <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">Boundaries of the Plot</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">As per Actual on Site</td>
          </tr>`;

          // Add actual on-site boundary directions
          html += `
          <tr >
          <td style="width: 8%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;"></td>
          <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">NORTH</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${safeGet(pdfData, 'boundaryActualNorth')}</td>
          </tr>
          <tr >
          <td style="width: 8%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;"></td>
          <td style="width: 35%; background: #ffffff; ; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">SOUTH</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${safeGet(pdfData, 'boundaryActualSouth')}</td>
          </tr>
          <tr >
          <td style="width: 8%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;"></td>
          <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">EAST</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${safeGet(pdfData, 'boundaryActualEast')}</td>
          </tr>
          <tr >
          <td style="width: 8%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;"></td>
          <td style="width: 35%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top; text-align: center;">WEST</td>
          <td style="width: 57%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; vertical-align: top;">${safeGet(pdfData, 'boundaryActualWest')}</td>
          </tr>`;

          return html;
      })()}
</table>

<!-- PAGE 3 FOOTER -->


<!-- PAGE 4 FOOTER -->
<!-- PAGE 5 HEADER -->
<div style="margin-top: 5px; margin-bottom: 5px; padding: 5px 10px; width: 100%; box-sizing: border-box;">
  <div style="text-align: center; margin-bottom: 3px;">
    ${(() => {
          const company = safeGet(pdfData, 'pdfDetails.valuationCompany', '');
          const subtitle = safeGet(pdfData, 'pdfDetails.valuationCompanySubtitle', '');
          const master = safeGet(pdfData, 'pdfDetails.masterValuation', '');
          const regValuer = safeGet(pdfData, 'pdfDetails.regValuer', '');
          const govtReg = safeGet(pdfData, 'pdfDetails.govtReg', '');

          let html = '';
          if (company && company !== 'NA') html += `<p style="font-size: 14pt; font-weight: bold; margin: 0;">${company}</p>`;
          if (subtitle && subtitle !== 'NA') html += `<p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">(${subtitle})</p>`;

          let credentials = '';
          if (master && master !== 'NA') credentials += master + '<br/>';
          if (regValuer && regValuer !== 'NA') credentials += regValuer + '<br/>';
          if (govtReg && govtReg !== 'NA') credentials += govtReg;

          if (credentials) html += `<p style="font-size: 12pt; margin: 2px 0; color: #333;">${credentials}</p>`;

          return html || '';
      })()
      }
  </div>
</div>

<!-- Section 3: Town Planning Parameters - DYNAMIC DATA BINDING -->
<div style="margin-bottom: 8px;">
  <p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">3. Town Planning parameters</p>
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #000 !important; table-layout: fixed;">
   ${getTownPlanningTableData(pdfData).map((row, idx) => `
   <tr>
     <td style="width: 5%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; text-align: center;">${toRomanNumeral(idx + 1)}.</td>
     <td style="width: 50%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; ">${row.item}</td>
     <td style="width: 45%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${row.value}</td>
   </tr>
   `).join('')}
   <tr>
     <td style="width: 5%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; text-align: center;">ix.</td>
     <td style="width: 50%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">Comment on the surrounding land uses and adjoining properties in terms of uses</td>
     <td style="width: 45%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.surroundingAreaWithCommercialAndResidential') || 'NA'}</td>
   </tr>
   <tr>
     <td style="width: 5%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; text-align: center;">x.</td>
     <td style="width: 50%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">Comment on demolition proceedings if any</td>
     <td style="width: 45%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.demolitionProceedings') || 'NA'}</td>
   </tr>
   <tr>
     <td style="width: 5%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; text-align: center;">xi.</td>
     <td style="width: 50%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">Comment on compounding/regularization proceedings</td>
     <td style="width: 45%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.compoundingRegularizationProceedings') || 'NA'}</td>
   </tr>
   <tr>
     <td style="width: 5%; background: #ffffff; font-weight: bold; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt; text-align: center;">xii.</td>
     <td style="width: 50%; background: #ffffff;  border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">Any other Aspect</td>
     <td style="width: 45%; background: #ffffff; border: 1px solid #000 !important; padding: 8px 5px; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.anyOtherAspect') || 'NA'}</td>
   </tr>
 </table>

<!-- EXPLICIT PAGE BREAK BEFORE SECTION 4 if needed -->
<div style="page-break-before: auto; page-break-after: always;"></div>

<!-- Section 4: Document Details and Legal Aspects of Property -->
<div style="margin-bottom: 8px; margin-top: 0;">
  <p style="font-size: 12pt; font-weight: bold; margin: 3px 0;">4. Document Details and Legal Aspects of Property</p>
</div>

<table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 0; margin-top: 10px; table-layout: fixed;">
   <tr>
     <td style="width: 5%; background: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">a)</td>
     <td style="width: 45%; background: #ffffff; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt; ">Ownership Documents, i. Sale Deed, Gift Deed, Lease Deed ii. TIR of the Property</td>
     <td style="width: 50%; background: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">List of documents produced for perusal:</td>
   </tr>
   ${getDocumentDetailsData(pdfData).map((doc, idx) => `
   <tr>
      <td style="width: 5%; background: #ffffff; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"></td>
      <td style="width: 45%; background: #ffffff; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">${idx + 1}. ${doc.label}</td>
      <td style="width: 50%; background: #ffffff; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">${doc.value}</td>
    </tr>
   `).join('')}
  
  
  
  <!-- Row: 4. AMC Tax Bill -->
  <tr>
    <td style="width: 5%; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"></td>
    <td style="width: 45%; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      4. AMC Tax Bill
    </td>
    <td style="width: 50%; border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      ${safeGet(pdfData, 'pdfDetails.amcTheBill') || 'NA'}
    </td>
  </tr>
  
  <!-- Row: b) Name of the Owner's -->
  <tr>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"><strong>b)</strong></td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      Name of the Owner/s
    </td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      ${safeGet(pdfData, 'pdfDetails.nameOfOwnerValuation') || 'NA.'}
    </td>
  </tr>
  
  <!-- Row: Ordinary status -->
  <tr>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"></td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      Ordinary status of freehold or leasehold including restrictions on transfer
    </td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      ${safeGet(pdfData, 'pdfDetails.certainStatusOfFreeholdOrLeasehold') || 'Freehold – Please Refer Adv. Title report.'}
    </td>
  </tr>
  
  <!-- Row: d) Agreement of easement -->
  <tr>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"><strong>d)</strong></td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      Agreement of easement if any
    </td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      ${safeGet(pdfData, 'pdfDetails.leaseAgreement') || 'NA'}
    </td>
  </tr>
  
  <!-- Row: e) Notification of acquisition -->
  <tr>
   <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"><strong>e)</strong></td>
   <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
     Notification of acquisition if any
   </td>
   <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
     ${safeGet(pdfData, 'pdfDetails.notificationOfAcquisition') || 'NA'}
   </td>
  </tr>
  
  <!-- Row: f) Notification of road widening -->
  <tr>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;"><strong>f)</strong></td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      Notification of road widening if any
    </td>
    <td style="border: 1px solid #000000; padding: 8px 5px; font-size: 12pt;">
      ${safeGet(pdfData, 'pdfDetails.notificationOfRoadWidening') || 'NA'}
    </td>
  </tr>
  
  <!-- Row: g) Heritage restriction -->
  <tr>
    <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"><strong>g)</strong></td>
    <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
      Heritage restriction, if any
    </td>
    <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
      ${safeGet(pdfData, 'pdfDetails.heritageEasement') || 'Nil.'}
    </td>
  </tr>
  
  <!-- Row: h) Comment on transferability -->
  <tr>
    <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"><strong>h)</strong></td>
    <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
      Comment on transferability of the property ownership
    </td>
    <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          ${safeGet(pdfData, 'pdfDetails.builderPlan') || 'Please refer Latest Adv. Title Report.'}
        </td>
      </tr>
      
      <!-- Row 10: i) Comment on existing mortgages -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"><strong>i)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          Comment on existing mortgages/ charges / encumbrances on the property, if any
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          ${safeGet(pdfData, 'pdfDetails.commentOnExistingMortgages') || 'As subject property is already mortgaged with Bank.'}
        </td>
      </tr>
      
      <!-- Row 11: j) Comment on guarantee -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;"><strong>j)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;">
          Comment on whether the owners of the property have issued any guarantee (personal or corporate) as the case may be
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;">
          ${safeGet(pdfData, 'pdfDetails.commentOnGuarantee') || 'Please refer Latest Adv. Title Report.'}
        </td>
      </tr>
      
      <!-- Row 12: k) Building plan sanction -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;"><strong>k)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;">
          Building plan sanction:<br/>Authority approving the plan -<br/>Name of the office of the Authority -<br/>Any violation from the approved Building Plan -
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;">
          ${safeGet(pdfData, 'pdfDetails.authorityApprovedPlan') || 'Plan is approved by Ahmedabad Urban Development Authority, Wide No. PRM/36/7/09/7603, Dated: 05/06/2010, Approved by AUDA<br/>BU Permission No. CMP/4189/5/2012/26, Dated: 08/02/2013, Approved by AUDA.'}
        </td>
      </tr>
      
      <!-- Row 13: l) Whether Property is Agricultural Land -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"><strong>l)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          Whether Property is Agricultural Land if yes, any conversion is contemplated
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          ${safeGet(pdfData, 'pdfDetails.ifPropertyIsAgriculturalLand') || 'NA – Commercial Shop cum Showroom'}
        </td>
      </tr>
      
      <!-- Row 14: m) Whether property is SARFAESI compliant -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"><strong>m)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          Whether the property is SARFAESI compliant
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          ${safeGet(pdfData, 'pdfDetails.sarfaesiCompliant') || 'Yes'}
        </td>
      </tr>
      
      <!-- Row 15: n) a. All legal documents -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;"><strong>n)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;">
          a. All legal documents, receipts related to electricity, Water tax, Municipal tax and other building taxes to be verified and copies as applicable to be enclosed with the report.
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt; vertical-align: top;">
          ${safeGet(pdfData, 'pdfDetails.legalDocumentsEnclosed') || 'N. A.<br/>As we provided with Allotment Deed, Approved Plan, BU Permission, Tax Bill of Property. and it is Re-Valuation of said property, all original documents should with bank.'}
        </td>
      </tr>
      
      <!-- Row 16: n) b. Observation on Dispute -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          b. Observation on Dispute or Dues if any in payment of bills/taxes to be reported.
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          ${safeGet(pdfData, 'pdfDetails.observationOnDisputeOrDues') || 'N. A.'}
        </td>
      </tr>
      
      <!-- Row 17: o) Whether entire piece of land -->
      <tr>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;"><strong>o)</strong></td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          Whether entire piece of land on which the unit is set up/ property is situated has been mortgaged or to be mortgaged.
        </td>
        <td style="border: 1px solid #000000; padding: 4px 5px; font-size: 12pt;">
          ${safeGet(pdfData, 'pdfDetails.whetherEntirePieceLandMortgaged') || 'Please refer Latest Adv. Title Report.'}
        </td>
      </tr>
       <!-- p and q continuation from previous page -->
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>p)</strong></td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          Qualification in TIR/mitigation suggested if any.
        </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">${safeGet(pdfData, 'pdfDetails.letterAgreement') || 'Please refer Latest Adv. Title Report.'}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000000; padding: 8px;"><strong>q)</strong></td>
        <td style="border: 1px solid #000000; padding: 8px;">
          Any other aspect
        </td>
        <td style="border: 1px solid #000000; padding: 8px;">${safeGet(pdfData, 'pdfDetails.anyViolationFromApprovedPlan') || 'No'}</td>
      </tr>
  </table>

  <!-- PAGE 7 HEADER - Force new page before large sections -->
 
 
  <div style="margin: 0; width: 100%;">
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 12pt; table-layout: fixed; margin-bottom: 0; margin-top: 20px;">
    <colgroup>
      <col style="width: 5%;"/>
      <col style="width: 45%;"/>
      <col style="width: 50%;"/>
    </colgroup>
    <tbody>

      <!-- Section 5: Economic Aspects - with proper spacing -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 12px 15px; font-weight: bold; background: #ffffff; margin: 0 10px;">
          <strong>5. Economic Aspects of the Property</strong>
        </td>
      </tr>
      ${getEconomicAspectsData(pdfData).map((item, idx) => {
          const romanMatch = item.item.match(/^([ivxl]+)\./);
          const roman = romanMatch ? romanMatch[1] : '';
          const text = item.item.replace(/^[ivxl]+\.\s*/, '');
          return `
      <tr>
        <td style="width: 5%; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 12px 5px; font-weight: bold; background-color: #ffffff;">
          ${roman}
        </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 12px 8px; background-color: #ffffff; ">
          ${text}
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 12px 8px; background-color: #ffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.value}</td>
      </tr>`;
      }).join('')}
        </table>

      
      <!-- Section 6: Socio-cultural Aspects -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 12pt; table-layout: fixed; margin-bottom: 0; margin-top: 20px;">
    <colgroup>
      <col style="width: 5%;"/>
      <col style="width: 45%;"/>
      <col style="width: 50%;"/>
    </colgroup>
    <tbody>
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>6. Socio-cultural Aspects of the Property</strong>
        </td>
      </tr>
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>a)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          ${getSocioCulturalAspectsData(pdfData)[0].item}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff;">${getSocioCulturalAspectsData(pdfData)[0].value}</td>
      </tr>
      ${getSocioCulturalAspectsData(pdfData).slice(1).map((item, idx) => `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          <strong>${String.fromCharCode(97 + idx + 1)})</strong>
        </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px; ">
          ${item.item.replace(/^[a-z]\)\s*/, '')}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.value}</td>
      </tr>`).join('')}
      
      <!-- Section 7: Functional and Utilitarian Aspects -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>7. Functional and Utilitarian Aspects of the Property</strong>
        </td>
      </tr>
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>a)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          Description of the functionality and utility of the Property in terms of:
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 8px;"></td>
      </tr>
      ${getFunctionalAspectsData(pdfData).map((item, idx) => {
          const isOtherAspect = item.item.startsWith('b)');
          const romanMatch = item.item.match(/^([ivxl]+)\./);
          const roman = romanMatch ? romanMatch[1] : '';
          const text = isOtherAspect ? item.item : item.item.replace(/^[ivxl]+\.\s*/, '');
          const label = isOtherAspect ? 'b)' : roman;
          return `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          <strong>${label}</strong>
        </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px; ">
          ${text}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.value}</td>
        </tr>`;
        }).join('')}
        
        <!-- Section 8: Infrastructure Availability -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>8. Infrastructure Availability</strong>
        </td>
      </tr>
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>a)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          Description of aqua infrastructure availability in terms of
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 8px;"></td>
      </tr>
      ${getInfrastructureAvailabilityData(pdfData).aquaInfra.map(item => `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>${item.item.match(/^[^.]+/)[0]}.</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px; ">
          ${item.item.replace(/^[^.]+\.\s*/, '')}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.value}</td>
      </tr>`).join('')}
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>b)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          Description of other physical infrastructure facilities viz.
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 8px;"></td>
      </tr>
      ${getInfrastructureAvailabilityData(pdfData).physicalInfra.map(item => `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>${item.item.match(/^[^.]+/)[0]}.</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px; ">
          ${item.item.replace(/^[^.]+\.\s*/, '')}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.value}</td>
      </tr>`).join('')}
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>c)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          Social infrastructure in terms of
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 8px;"></td>
      </tr>
      ${getInfrastructureAvailabilityData(pdfData).socialInfra.map(item => `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>${item.item.match(/^[^.]+/)[0]}.</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px; ">
          ${item.item.replace(/^[^.]+\.\s*/, '')}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item.value}</td>
      </tr>`).join('')}

      <!-- Section 9: Marketability of the Property -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>9. Marketability of the Property</strong>
        </td>
      </tr>
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;"><strong>a)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          Marketability of the property in terms of
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 8px;"></td>
      </tr>
      ${getMarketabilityData(pdfData).map((item, idx) => {
          const isMainItem = !item.item.includes('Any other aspect');
          const numberMatch = item.item.match(/^([ivxl]+|[a-z])\./);
          const number = numberMatch ? numberMatch[1] : '';
          const text = numberMatch ? item.item.replace(/^[ivxl]+\.\s*/, '').replace(/^[a-z]\)\s*/, '') : item.item.replace(/^b\)\s*/, '');
          return `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          ${isMainItem ? '<strong>' + number + '</strong>' : '<strong>b)</strong>'}
        </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          ${text}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff;">${item.value}</td>
      </tr>`;
      }).join('')}
</tbody>
    </table>
    </div>

<div style="margin: 0; width: 100%;">
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 12pt; table-layout: fixed; margin-bottom: 0; margin-top: 5px;">
    <colgroup>
      <col style="width: 5%;"/>
      <col style="width: 45%;"/>
      <col style="width: 50%;"/>
    </colgroup>
    <tbody>      
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>10. Engineering and Technology Aspects of the Property</strong>
        </td>
      </tr>
      ${getEngineeringAspectsData(pdfData).map(item => {
          const letterMatch = item.item.match(/^([a-z])\)/);
          const letter = letterMatch ? letterMatch[1] : item.item.charAt(0);
          const text = letterMatch ? item.item.replace(/^[a-z]\)\s*/, '') : item.item.substring(1).replace(/^\)\s*/, '');
          return `
       <tr>
         <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
           <strong>${letter}</strong>
         </td>
         <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
           ${text}
         </td>
         <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff;">${item.value}</td>
       </tr>`;
      }).join('')}
</tbody>
    </table>
    </div>
<div style="margin: 0; width: 100%;">
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 12pt; table-layout: fixed; margin-bottom: 0; margin-top: 10px;">
    <colgroup>
      <col style="width: 5%;"/>
      <col style="width: 45%;"/>
      <col style="width: 50%;"/>
    </colgroup>
    <tbody>
      <!-- Section 11: Environmental Factors -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>11. Environmental Factors</strong>
        </td>
      </tr>
      ${getEnvironmentalFactorsData(pdfData).map(item => {
          const letterMatch = item.item.match(/^([a-z])\)/);
          const letter = letterMatch ? letterMatch[1] : item.item.charAt(0);
          const text = letterMatch ? item.item.replace(/^[a-z]\)\s*/, '') : item.item.substring(1).replace(/^\)\s*/, '');
          return `
       <tr>
         <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
           <strong>${letter}</strong>
         </td>
         <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
           ${text}
         </td>
         <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff;">${item.value}</td>
       </tr>`;
      }).join('')}

      <!-- Section 12: Architectural and aesthetic quality -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>12. Architectural and aesthetic quality of the Property</strong>
        </td>
      </tr>
      ${getArchitecturalAspectsData(pdfData).map(item => {
          const letterMatch = item.item.match(/^([a-z])\)/);
          const letter = letterMatch ? letterMatch[1] : item.item.charAt(0);
          const text = letterMatch ? item.item.replace(/^[a-z]\)\s*/, '') : item.item.substring(1).replace(/^\)\s*/, '');
          return `
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          <strong>${letter}</strong>
        </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 8px;">
          ${text}
        </td>
        <td style="width: 50%; border: 1px solid #000000; padding: 8px; background-color: #ffffffff;">${item.value}</td>
      </tr>`;
      }).join('')}
    </tbody>
    </table>
    </div>
    <!-- PAGE 9 FOOTER -->
    <!-- PAGE 10 HEADER - Force new page before Valuation section -->
    <div style=" margin-top: 5px; margin-bottom: 10px; width: 100%; box-sizing: border-box;">
    </div>
    <div style="margin: 0; width: 100%;">
   
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 12pt; margin-bottom: 0; margin-top: 10px;">
    <tbody>
    <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>13.Valuation</strong>
        </td>
      </tr>
      <tr>
         <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-weight: normal;">
           <strong>a)</strong>
         </td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-weight: normal;">
          Methodology of valuation Procedures adopted for arriving at the valuation. Valuer may consider various approaches and state explicitly the reason for adopting particular approach and assumptions made, basis adopted with supporting data, comparable sales, and reconciliation of various factors on which final value judgment is arrived at.
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-size: 9.5pt; line-height: 1.4;">
          <strong>The Cost Approach:</strong> The cost approach to valuation makes a simple assumption that a potential user of a property will not (and should not) pay more for a property than it would cost to build an equivalent property from scratch. That is, the value of the property is the cost of land plus the cost of construction, less depreciation.<br/><br/>
          </td>
      </tr>

      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 6px;"><strong></strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 6px;"></td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-size: 9.5pt; line-height: 1.5;">
        <strong>The Comparable Sales Approach/ Market Approach:</strong> For residential homes, condos, townhouses, and small rental apartment buildings, the comparable sales approach often provides a great estimate of market value. If you want the probable price of a specific property will likely sell it, find out the selling prices, deal terms, and features of recently sold similar properties near the target property. The more closely comparable properties resemble your target property and the closer in proximity, the better and more accurate your estimate will be using this approach.<br/><br/>
        <strong>The Income Approach:</strong> Lastly, we have the income approach, which is an appraisal technique that is also often called the Gross Rent Multiplier (GRM). To calculate the GRM, you need to know the monthly rents and sales prices of similar properties that have recently sold. For this reason, the method only works for income-producing properties.<br/><br/>
        </td>
      </tr>

       <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 6px;"><strong></strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 6px;"></td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-size: 9.5pt; line-height: 1.5;">
       <strong>As subjected property is Commercial Shop Cum Show Room, we have adopted Composite Area Rate Method with Market Approach for this valuation excises.<br/>By Composite Area Rate Method adopted.</strong>
       <span style="color: #ff6600;">Construction Area Rate: Rs. 0000/- per sq.ft for Super Built up Area Rate on Ground Floor Commercial Shop Cum Show Room</span><br/>
          (We have verified the property rates for nearby area with local person/broker in this area, and refer to known web sites, like magic brick, 99acres, etc., the rate of Commercial Shop sum Show Room, varies from the rates are between <span style="color: #ff6600;">Rs. 25,000/- to Rs. 30,000/-</span> per sq.ft. Depends on location, approaches, surrounding developing, etc., We have considered the rate <span style="color: #ff6600;">Rs. 27,000/- per sq.ft for Super Built up area Rate for Ground Floor Commercial Shop cum Show Room Considering Furnished Unit.</span>
       </td>
      </tr>
      
      <!-- Row b) Prevailing Market Rate -->
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 6px;"><strong>b)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 6px;">
          Prevailing Market Rate/Price trend of the Property in the locality/city from property search sites magickbricks.com, 99acres.com, akaan.com etc. if available
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-size: 9.5pt; line-height: 1.5;">
          The perfect rate cannot available on any websites, and also in Reg. Sale instance, as Reg. Sale instance is reflecting only Jantri Rate Value, is considered for Stamp Duty only. The actual Sale – Purchase Rate is depending on demand / supply of such type of property, what offers are available on known websites, some of that is have no proper details, negotiable offers, and some also fake. So, we gathered all type of Data of prevailing Rate in such area, applying positive and negative factors, and come to conclusion of probable Rate.
        </td>
      </tr>
      <!-- Row c) Guideline Rate -->
      <tr>
        <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 6px;"><strong>c)</strong></td>
        <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 6px;">
          Guideline Rate obtained from Registrar's office/State Govt. Gazette/ Income Tax Notification
        </td>
        <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-size: 9.5pt; line-height: 1.5;">
          <strong>As per the Town planning and Valuation department of Govt. of Gujarat, Jantri Rate in that area for Commercial Shop is <span style="color: #ff6600;">Rs. 50,000/- rupees per sq.mt</span>,</strong> as per New Guideline for Revision of Jantry / GLR, 2 times rate of Land of ASR-2011, will be applicable, Dt. 13/04/2023, the GLR Valuation for subject property is as under<br/>
          <strong>Then, Jantry value = Area x Rate<br/>
          = 420.83 sq.mt x 1,00,000.00/-<br/>
          <span style="color: #ff6600;">= Rs. 4,20,83,000.00</span></strong>
        </td>
      </tr>
      <!-- Row d) Summary of Valuation -->
      <tr>
        <td colspan="3" style="border: 1px solid #000000; padding: 6px; font-weight: bold; background: #ffffff;">
          <strong>d)</strong> Summary of Valuation
        </td>
      </tr>
      <!-- Guideline Value Row -->
       <tr>
         <td style="width: 5%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-weight: bold;"></td>
         <td style="width: 45%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-weight: bold;">
           Guideline Value
         </td>
         <td style="width: 50%; vertical-align: top; border: 1px solid #000000; padding: 6px; font-weight: bold; font-size: 12pt;">
           ${safeGet(pdfData, 'pdfDetails.guidelineValue') || 'NA'}
         </td>
       </tr>
    </tbody>
    </table>
    </div>
    <!-- PAGE 10 FOOTER -->
    
    <!-- PAGE 12 HEADER -->
    <div style="margin-top: 5px; margin-bottom: 10px; padding: 5px 10px; width: 100%; box-sizing: border-box;">
    
    </div>
<div style="margin: 0;  width: 100%;">
 <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
   <colgroup>
     <col style="width: 8%;" />
     <col style="width: 18%;" />
     <col style="width: 14%;" />
     <col style="width: 12%;" />
     <col style="width: 10%;" />
     <col style="width: 20%;" />
     <col style="width: 18%;" />
   </colgroup>
   <tbody>
     <!-- PAGE TITLE -->
     <tr>
       <td colspan="7" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 13pt; background-color: #f5f5f5;">
         MARKET VALUE OF THE PROPERTY
       </td>
     </tr>
      
      <!-- LAND VALUE SECTION HEADER -->
      <tr>
        <td colspan="7" style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #ffffff; font-size: 12pt;">
          <i>1. LAND VALUE:</i>
        </td>
      </tr>
      
      <!-- LAND VALUE COLUMN HEADERS -->
      <tr>
        <td class="table-header">Sr. No.</td>
        <td class="table-header">Land Area - SMT</td>
        <td colspan="3" class="table-header">Land Rate – Including Land Development cost rate per sq.mtr</td>
        <td colspan="2" class="table-header">Value of Land</td>
      </tr>
      
      <!-- LAND VALUE DATA ROW -->
      <tr>
        <td class="table-cell">1.</td>
        <td class="table-cell">${safeGet(pdfData, 'pdfDetails.landAreaSqmt') || 'NA'}</td>
        <td colspan="3" class="table-cell">${safeGet(pdfData, 'pdfDetails.landRatePerSqmtr') || 'NA'}</td>
        <td colspan="2" class="table-cell">${safeGet(pdfData, 'pdfDetails.valueOfLandMarket') || 'NA'}</td>
      </tr>
      
      <!-- TOTAL LAND VALUE ROW -->
      <tr>
        <td colspan="6" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; font-size: 12pt;">Total Land Value</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.totalLandValue') || 'NA'}</td>
      </tr>

      <!-- BUILDING VALUE SECTION HEADER -->
      <tr>
        <td colspan="7" style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #ffffff; font-size: 12pt;">
          <i>2. BUILDING VALUE</i>
        </td>
      </tr>
      
      <!-- BUILDING VALUE COLUMN HEADERS -->
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 8%; font-size: 12pt;">Sr. No.</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 18%; font-size: 12pt;">Particulars of item</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 14%; font-size: 12pt;">Plinth area (In Sq.ft.)</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 12%; font-size: 12pt;">Roof Height Apprx.</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 10%; font-size: 12pt;">Age of the Building</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 20%; font-size: 12pt;">Estimated Replacement Depreciated Rate of Construction per sq.mtr</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 18%; font-size: 12pt;">Value of Construction</td>
      </tr>
      
      <!-- BUILDING VALUE DATA ROW -->
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-size: 12pt;">1.</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.buildingParticulars') || 'As per Allotment Deed - SBUA'}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.plinthAreaSqft') || '000.00'}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.roofHeightApprox') || '12 Ft'}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.ageOfBuilding') || '12 Years'}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.valueOfConstructionMarket') || '₹ 00,000/- per sq.ft SBUA rate Considering Furnished Unit'}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #ffffffff; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.totalBuildingValue') || '₹ 00,00,00,000.00'}</td>
      </tr>
      
      <!-- TOTAL BUILDING VALUE ROW -->
      <tr>
        <td colspan="6" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; font-size: 12pt;">Total Building Value</td>
        <td colspan="1" style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.totalBuildingValue') || 'NA'}</td>
      </tr>

      <!-- VALUATION SUMMARY ROWS -->
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12pt;">Market Value of Property</td>
        <td colspan="4" style="background-color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.marketValueOfProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.marketValueOfProperty'), safeGet(pdfData, 'pdfDetails.marketValueOfProperty')) : 'NA'}</td>
      </tr>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12pt;">Realizable value Rs. (90% of Fair market value)</td>
        <td colspan="4" style="background-color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.realizableValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.realizableValueProperty'), safeGet(pdfData, 'pdfDetails.realizableValueProperty')) : 'NA'}</td>
      </tr>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12pt;">Distress Value Rs. (80% of Fair market value)</td>
        <td colspan="4" style="background-color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.distressValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.distressValueProperty'), safeGet(pdfData, 'pdfDetails.distressValueProperty')) : 'NA'}</td>
      </tr>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12pt;">Insurable Value of the Property</td>
        <td colspan="4" style="background-color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.insurableValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.insurableValueProperty'), safeGet(pdfData, 'pdfDetails.insurableValueProperty')) : 'NA'}</td>
      </tr>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12pt;">Jantri Value of the Property</td>
        <td colspan="4" style="background-color: #ffffff; border: 1px solid #000; padding: 6px; text-align: center; font-size: 12pt;">${safeGet(pdfData, 'pdfDetails.jantriValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.jantriValueProperty'), safeGet(pdfData, 'pdfDetails.jantriValueProperty')) : 'NA'}</td>
      </tr>
      <!-- VARIATION CLAUSE -->
       <table style="width: 100%; border-collapse: collapse;">
       <colgroup>
         <col style="width: 5%;">
         <col style="width: 45%;">
         <col style="width: 50%;">
       </colgroup>
       <tr>
       <!-- VARIATION CLAUSE Guideline  -->

         <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
           <strong></strong>
         </td>
         <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
           e) &nbsp; i. In case of variation of 20% or more in the valuation proposed by the valuer and the Guideline value provided in the State Govt. notification or Income Tax Gazette Justification on variation has to be given.
         </td>
         <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           a.  Guideline value (Jantri rate) of land/property is the value of the land/property as determined by the government, based on it own metrics of facilities and infrastructure growth in that locality. The stamp duty and registration charges for registering a property deal, is based upon this guideline value. The guideline values are revised periodically to have them in sync with the market value. Jantri rates are not relevant in current scenario, as they were last updated in April 2011. Actual market rates have more than doubled since then, depending upon area, locality, demand and supply and other various factors.
         </td>
       </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           b.  Being this the situation, it has been observed that sale deeds are executed at lower price of Jantri rates to save registration charges / stamp duty. So these instances does not reflect actual transaction amount / market rate. Moreover now days, in actual market, transactions are done on super built-up area, whereas guideline value (Jantri rate) is based on carpet area. Both the areas have difference of about 40-50% This also makes difference between two values.
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           c.  In present system certain value zones are established at macro levels, but within the same value zone the land prices of all the plots cannot be same. There are certain negative / positive factors, which are attached to any parcel of land, like width of the road on which a plot abuts, frontage to depth ratio, adjoining slum or hutments, title of the property, certain religious & sentimental factors, proximity to high tension electricity supply lines, crematorium, socio-economic pattern, stage of infrastructure, development of area, whereas guideline rate are prescribes as uniform rates for particular FP/Zone.
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           d.  Property/land/flat on the main road in any area is priced higher and should be valued higher than in interiors, whereas guideline rate considered them all with equal perspective.
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
          e.  In real estate market, it has been observed that many type of values prevalent in market like forced Sale value, sentimental value, monopoly value etc. so it cannot be generalized, while guideline value (Jantri rate) considered them all with one value only
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           f.  Moreover two projects of two different builder having different reputation & quality work in same zone may fetch different values. Again guideline value (Jantri rate) considered them all as one.
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           g.  Government policies also change the trends/values in real estate market, for example demonetization, GST etc. the real estate market reacts significantly for these policies for uptrend or downtrend. So this also affects the market rate heavily. While guideline rates remain same.
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
        <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt; line-height: 1.3;">
           h.  It may not be possible to have a method to fix guideline (Jantri rate) values without anomalies as each site has different characteristics. But it is always desired to revise guideline value (Jantrirate) at regular intervals (e.g. Six months) or so, as it is the trend observed in other states e.g. Maharashtra (Mumbai) & other states.
        </td>
      </tr>
    
    <!-- CONTINUATION - LAST TRANSACTIONS -->
    <tr>
    <td style="border: 1px solid #000; padding: 8px; vertical-align: top;"></td>
    <td style="border: 1px solid #000; padding: 8px; vertical-align: top;">
    ii. Details of last two transactions in the locality/area to be provided, if available.
    </td>
    <td style="background-color: #ffffff; border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 12pt;">
     i.Recently in year 2023, Govt. has released Revised GR for Guideline rate calculation, Tharav No. 122023/20/H/1, Dt. 13/04/2023, as per that, various revision are mentioned in Land Rate for Residential land, Composite Rate for Office use and Shop Use, and Apartment use, Agriculture Land Use, etc. The GR is attached herewith
    </td>
    </tr>
     
      <!-- REMARKS SECTION -->
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 5%; vertical-align: top;"></td>
        <td colspan="6" style="border: 1px solid #000; padding: 8px; font-weight: bold; background: #ffffff;">
          <strong>REMARKS:</strong>
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 5%; vertical-align: top;"></td>
        <td colspan="6" style="border: 1px solid #000; padding: 6px; background-color: #ffffff;">
          <strong>We have considered Super Built-up Area As per Copy of Indenture of Allotment-cum-Sale for Valuation.</strong><br/>
          <strong>Property is Mortgaged in Bank, All Original documents already submitted to bank.</strong>
        </td>
      </tr>
       </table>
      </tbody>
      </table>
      </div>
   
<div style="margin: 0; padding: 5px 10px; width: 100%;">
  <!-- Section 14: Declaration -->
  <div style="margin-bottom: 8px;">
    <h3 style="font-size: 12pt; font-weight: bold; margin: 8px 0 5px 0; padding-bottom: 3px; border-bottom: none;">14. Declaration</h3>
    
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
      <tbody>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; vertical-align: top; text-align: center;">1</td>
          <td style="border: 1px solid #000; padding: 8px; width: 95%;">
            <strong>I hereby declare that:</strong><br/><br/>
            <strong>i.</strong> The information provided is true and correct to the best of my knowledge and belief.<br/><br/>
            <strong>ii.</strong> The analysis and conclusions are limited by the reported assumptions and conditions.<br/><br/>
            <strong>iii.</strong> I have read the Handbook on Policy, Standard and Procedures for Real Estate Valuation by Banks and HFIs in India, 2011, issued by IBA and NHB, fully understood the provisions of the same and followed the provisions of the same to the best of my ability and this report is in conformity to the Standards of Reporting enshrined in the above Handbook.<br/><br/>
            <strong>iv.</strong> I have no direct or indirect interest in the above property valued.<br/><br/>
            <strong>v.</strong> <span style="background-color: #ffffff;"><strong>I/ my authorized representative by the name of <span style="text-decoration: underline;">${getDeclarationData(pdfData).inspectionName}</span>, who is a "<span style="text-decoration: underline;">${getDeclarationData(pdfData).inspectionTitle}</span>", has inspected the subject property on <span style="text-decoration: underline;">${getDeclarationData(pdfData).inspectionDate}</span>.</strong></span><br/><br/>
            <strong>vi.</strong> I am a registered Valuer under Section 34 AB of Wealth Tax Act, 1957, Category-I for valuing property up to No limit.<br/><br/>
            <strong>vii.</strong> I am/am not an approved Valuer under SARFAESI ACT-2002 and am approved by the Bank.<br/><br/>
            <strong>viii.</strong> I have not been de-paneled or removed from any Bank/Financial Institution/Government Organization at any point of time in the past.<br/><br/>
            <strong>ix.</strong> I have submitted the Valuation Report (s) directly to the Bank.
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; vertical-align: top; text-align: center;">2</td>
          <td style="border: 1px solid #000; padding: 8px; width: 95%;">
            <strong>Date: <span>${getDeclarationData(pdfData).reportDate}</span></strong><br/><br/>
            <strong>Name and address of the Valuer</strong><br/>
            <strong>Rajesh Ganatra</strong><br/>
            <strong>Rajesh Ganatra Valuation Services</strong><br/>
            <strong>Head Office: ${getDeclarationData(pdfData).headOffice}</strong><br/>
            <strong>${safeGet(pdfData, 'city') || 'NA'}. Mobile: 98257 98600,</strong>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

  <!-- Section 15: Enclosures - DYNAMIC DATA BINDING -->
  <div style="margin-top: 20px;   width: 100%;">
    <h3 style="font-size: 12pt; font-weight: bold; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: none;">15. Enclosures</h3>
    
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #000; font-size: 12pt;">
      <tbody>
        ${getEnclosuresData(pdfData).map((row, idx) => `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">${String.fromCharCode(97 + idx)})</td>
          <td style="border: 1px solid #000; padding: 8px; width: 60%;">${row.item}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 35%;">${row.status}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Custom Fields Section -->
  ${Array.isArray(pdfData.customFields) && pdfData.customFields.length > 0 ? `
  <div style="margin-top: 15px; width: 100%;">
    <h3 style="font-size: 12pt; font-weight: bold; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: none;">Additional Custom Fields</h3>
    
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #000; font-size: 12pt;">
      <tbody>
        ${pdfData.customFields.map((field, idx) => `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; background-color: #f0f0f0; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 35%; font-weight: bold; background-color: #f0f0f0;">${field.name}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 60%;">${field.value}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Final Valuation Summary -->
  <div style="margin-top: 10px; page-break-inside: avoid;">
    <p style="margin: 8px 0; font-size: 12pt; color: #000000;">
      As a result of my appraisal and analysis, it is my considered opinion that the present fair market value of the above property in the prevailing Condition with aforesaid specifications is <strong style=" color: #000000; display: inline-block; padding: 4px 6px;">
${safeGet(pdfData, 'pdfDetails.marketValueOfProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.marketValueOfProperty'), safeGet(pdfData, 'pdfDetails.marketValueOfProperty')) : 'NA'}</strong>
    </p>
    
    <p style="margin: 8px 0; font-size: 12pt; color: #000000;">
      <strong>The Realizable value of the above property is </strong><span style=" color: #000000; display: inline-block; padding: 2px 4px;"><strong>${safeGet(pdfData, 'pdfDetails.realizableValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.realizableValueProperty'), safeGet(pdfData, 'pdfDetails.realizableValueProperty')) : 'NA'}</strong></span>
    </p>
    
    <p style="margin: 8px 0; font-size: 12pt; color: #000000;">
      <strong>The Distress value </strong><span style=" color: #000000; display: inline-block; padding: 2px 4px;"><strong>${safeGet(pdfData, 'pdfDetails.distressValueProperty') ? formatCurrencyWithWordsAuto(safeGet(pdfData, 'pdfDetails.distressValueProperty'), safeGet(pdfData, 'pdfDetails.distressValueProperty')) : 'NA'}</strong></span>
    </p>
    
    <p style="margin: 8px 0; font-size: 12pt; color: #000000;">
      <strong>The Book value of the above property  </strong>
    </p>
  </div>
    
    <!-- PAGE 16: GOVERNMENT REGISTERED VALUER CERTIFICATION -->
  <div style="margin-top: 20px; margin-bottom: 10px; padding: 10px 20px; width: 100%; box-sizing: border-box;">
  </div>
<div style="margin: 0; padding: 5px 10px; width: 100%;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
    <div style="font-size: 12pt;">
       <p style="margin: 0px 0 5px 0;"><strong>Dated :- <span style="color: #FF9900;">${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport') || '')}</span></strong></p>
       <p style="margin: 0px 0;"><strong>Place:- ${safeGet(pdfData, 'city') ||  'NA'}</strong></p>
     </div>
    <div style="text-align: right; font-size: 12pt; font-weight: bold;">
      GOVT. REGD APPROVED VALUER
    </div>
  </div>

  <!-- Main Statement -->
  <div style="margin: 8px 0; text-align: left; line-height: 1.4;">
    <p style="margin: 12px 0; font-size: 12pt; font-weight: bold;">
      The undersigned has inspected the property detailed in the Valuation Report dated _______ on _______.
    </p>
    <p style="margin: 12px 0; font-size: 12pt; font-weight: bold;">
      We are satisfied that the fair and reasonable market value of the property is Rs. _______ (Rupees only).
    </p>
  </div>

  <!-- Signature Section -->
  <div style="margin-top: 50px; text-align: center; margin-left: 360px;">
    <div style="margin: 35px 0;">
      <div style="height: 40px; margin-bottom: 6px;"></div>
      <p style="margin: 5px 0; font-size: 12pt; font-weight: bold;">Signature</p>
    </div>
    <p style="margin: 5px 0; font-size: 12pt; font-weight: bold;">
      (Name of the Branch Manager with Official seal)
    </p>
  </div>
  </div>
</div>

  <!-- PAGE 17: CHECKLIST OF DOCUMENT -->
  <div style="margin-top: 0px; margin-bottom: 10px; padding-top: 10px; padding-bottom: 10px;">
  </div>
  <div style="margin: 0; padding: 5px 10px; width: 100%;">
   <table style="width: 100%; border-collapse: separate; border-spacing: 0;; border: 1px solid #000; font-size: 12pt;">
    <tbody>
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background: #ffffff;">
          CHECKLIST OF DOCUMENT
        </td>
      </tr>
      ${getDocumentChecklistData(pdfData).map(item => `
      <tr>
        <td style="border: 1px solid #000; padding: 5px;">${item.document}</td>
        <td style="border: 1px solid #000; padding: 5px; text-align: center; ${item.isNA ? 'background-color: #ffffff;' : ''}">${item.received}</td>
        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${item.reviewed}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <!-- SOP Section -->
  <div style="margin-top: 15px; width: 100%; padding: 12px; border: 1px solid #000; font-size: 12pt;">
    <p style="margin: 0 0 8px 0; font-weight: bold; text-align: left;">STANDARD OPERATING PROCEDURE (SOP)</p>
    <p style="margin: 4px 0; text-align: left;">1 &nbsp;&nbsp;BANK GUIDELINES FOR VALUER</p>
    <p style="margin: 4px 0; text-align: left;">2 &nbsp;&nbsp;<span><u>www.donfinworld.io</u></span></p>
    <p style="margin: 4px 0; text-align: left;">3 &nbsp;&nbsp;Taskval App for Assignment Management</p>
  </div>
  </div>


  <!-- PAGE 18: PREAMBLE AND STANDARD OPERATING PROCEDURE -->
  <div style="margin: 0; font-size: 12pt; line-height: 1.4; width: 100%; page-break-before: always; overflow: visible;">
  <p style="margin: 10px 0; font-weight: bold; page-break-after: avoid;">❖ PREAMBLE</p>
  
  <p style="margin: 8px 0; text-align: justify;">
    Bank valuers in India rely on Standard Operating Procedures (SOPs) for several good reasons. SOPs help ensure consistency in property valuations by providing a standardised approach. This results in uniformity in the valuation process across different regions and properties, reducing discrepancies and ensuring fair and objective valuations. Moreover, SOPs establish guidelines and best practices that bank valuers must follow to maintain high-quality and accurate valuations. This guarantees that the bank receives reliable valuations, reducing the risk of financial loss due to overvaluation or undervaluation.
  </p>

  <p style="margin: 8px 0; text-align: justify;">
    SOPs also assist valuers in complying with regulatory frameworks and guidelines set by regulatory authorities, such as the Reserve Bank of India (RBI) and the Securities and Exchange Board of India (SEBI). Valuers who adhere to SOPs lessen the risk of non-compliance and associated penalties. Furthermore, by following standardised procedures, valuers can identify and assess potential risks associated with property valuations, such as legal issues, property conditions, market trends, and encumbrances. This enables banks to make informed lending decisions, reducing the risk of default and protecting the interests of the institution and its customers.
  </p>

  <p style="margin: 8px 0; text-align: justify;">
    SOPs establish ethical guidelines and professional standards for bank valuers, promoting integrity, objectivity, and transparency in the valuation process. By adhering to SOPs, valuers demonstrate their commitment to upholding ethical practices, enhancing the credibility of the valuation profession and maintaining public trust. SOPs also serve as a valuable tool for training new bank valuers and providing ongoing professional development opportunities. They act as a reference guide, helping valuers accurately understand the step-by-step process of conducting valuations. SOPs also facilitate knowledge sharing and consistency among valuers, ensuring that the expertise and experience of senior professionals are passed down to newer members of the profession.
  </p>

  <p style="margin: 8px 0; text-align: justify;">
    In summary, SOPs are crucial for bank valuers in India as they promote consistency, maintain quality, ensure regulatory compliance, mitigate risks, uphold professionalism, and support training and development. By following these procedures, bank valuers can provide accurate and reliable property valuations, contributing to a robust banking system.
  </p>
  

  <!-- PAGE BREAK BEFORE SOP -->
  <div style="margin-top: 10px; font-size: 12pt; line-height: 1.5; width: 100%; page-break-before: always; padding: 0 20px; overflow: visible;">
    <p style="margin: 12px 0 10px 0; font-weight: bold; font-size: 13pt;">❖ Standard Operating Procedure (SOP)</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>1.</strong> Receive a valuation request from the bank.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>2.</strong> Review the request thoroughly to understand the scope, purpose, and specific requirements of the valuation.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>3.</strong> Conduct a preliminary assessment of the property or asset to determine its feasibility for valuation.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>4.</strong> Gather relevant data and information about the property or asset, including legal documents, title deeds, surveys, plans, and other necessary documents provided by the bank.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>5.</strong> Conduct an on-site inspection of the property or asset, taking photographs, measurements and noting essential details.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>6.</strong> Collect market data and research comparable properties or assets in the vicinity to establish a benchmark for valuation.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>7.</strong> Analyze the collected data and use appropriate valuation methods, such as the sales comparison approach, income approach, or cost approach, depending on the property or asset's nature.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>8.</strong> Prepare a comprehensive and detailed valuation report that includes all relevant information, assumptions made, methodologies used, and supporting evidence.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>9.</strong> Review the report meticulously for accuracy, completeness, and compliance with applicable valuation standards and guidelines.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>10.</strong> Submit the valuation report to the bank within the agreed-upon timeframe.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>11.</strong> Attend a meeting or provide additional clarification to the bank regarding the valuation report, if needed.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>12.</strong> Address any queries or requests for revision from the bank and make necessary amendments to the valuation report as per their feedback.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>13.</strong> Obtain final approval or acceptance of the valuation report from the bank.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>14.</strong> Maintain records of all valuation reports, documents, and communication-related to the valuation process for future reference and compliance purposes.</p>
    <p style="margin: 6px 0; font-weight: normal;"><strong>15.</strong> Follow up with the bank regarding any outstanding payments or administrative formalities.</p>
    
    <p style="margin: 12px 0; text-align: justify;">
      While the process may differ based on the bank's specific requirements and the property or asset being evaluated, this flowchart is a solid foundation for all Banking Valuers in India to confidently and efficiently conduct valuations.
    </p>
  </div>

  <p style="margin: 8px 0; font-weight: bold; page-break-after: avoid;">Observations, Assumptions and Limiting Conditions</p>
  
  <ul style="margin: 8px 0; padding-left: 20px;">
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      The Indian Real Estate market is currently facing a transparency issue. It is highly fragmented and lacks authentic and reliable data on market transactions. The actual transaction value often differs from the value documented in official transactions. To accurately represent market trends, we conducted a market survey among sellers, brokers, developers, and other market participants. This survey is crucial to determine fair valuation in this subject area. Based on our verbal survey, we have gained insights into the real estate market in the subject area.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      To conduct a proper valuation, we have made the assumption that the property in question possesses a title that is clear and marketable and that it is free from any legal or physical encumbrances, disputes, claims, or other statutory liabilities. Additionally, we have assumed that the property has received the necessary planning approvals and clearances from the local authorities and that it adheres to the local development control regulations.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      Please note that this valuation exercise does not cover legal title and ownership matters. Additionally, we have not obtained any legal advice on the subject property's title and ownership during this valuation. Therefore, we advise the client/bank to seek an appropriate legal opinion before making any decision based on this report.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      We want to ensure that our valuation is fair and accurate. However, it's important to note that any legal, title, or ownership issues could have a significant impact on the value. If we become aware of any such issues at a later date, we may need to adjust our conclusions accordingly.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      Throughout this exercise, we have utilized information from various sources, including hardcopy, softcopy, email documents, and verbal communication provided by the client. We have proceeded under the assumption that the information provided is entirely reliable, accurate, and complete. However, if it is discovered that the data we were given is not dependable, precise, or comprehensive, we reserve the right to revise our conclusions at a later time.
    </li>
    <li style="margin: 5px 0; text-align: justify; page-break-after: avoid;">
      Please note that the estimated market value of this property does not include transaction costs such as stamp duty, registration charges, and brokerage fees related to its sale or purchase.
    </li>
    <li style="margin: 5px 0; text-align: justify; page-break-after: avoid;">
      When conducting a subject valuation exercise, it is important to consider the market dynamics at the time of the evaluation. However, it is essential to note that any unforeseeable developments in the future may impact the valuation. Therefore, it is crucial to remain vigilant and adaptable in the face of changing circumstances.
    </li>
    <li style="margin: 5px 0; text-align: justify; page-break-after: avoid;">
      Kindly note that the physical measurements and area given are only approximations. The exact area of the property can only be determined based on the information obtained during inspection. Furthermore, the remaining economic lifespan is an estimate determined by our professional judgement.
    </li>
    <li style="margin: 5px 0; text-align: justify; page-break-after: avoid;">
      Please note that the valuation stated in this report is only applicable for the specific purposes mentioned herein. It is not intended for any other use and cannot be considered valid for any other purpose. The report should not be shared with any third party without our written permission. We cannot assume any responsibility for any third party who may receive or have access to this report, even if consent has been given.
    </li>
    <li style="margin: 2px 0; text-align: justify; page-break-after: avoid;">
      Having this report or a copy of it does not grant the privilege of publishing it. None of the contents in this report should be shared with third parties through advertising, public relations, news or any other communication medium without the written acceptance and authorization of VALUERS.
    </li>
    <br>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      To assess the condition and estimate the remaining economic lifespan of the item, we rely on visual observations and a thorough review of maintenance, performance, and service records. It's important to note that we have not conducted any structural design or stability studies, nor have we performed any physical tests to determine the item's structural integrity and strength.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      The report was not accompanied by any soil analysis, geological or technical studies, and there were no investigations conducted on subsurface mineral rights, water, oil, gas, or other usage conditions.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      The asset was inspected, evaluated, and assessed by individuals who have expertise in valuing such assets. However, it's important to note that we do not make any assertions or assume responsibility for its compliance with health, safety, environmental, or other regulatory requirements that may not have been immediately apparent during our team's inspection.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      During the inspection, if the units were not named, we relied on identification by the owner or their representative and documents like the sale deed, light bill, plan, tax bill, the title for ownership, and boundaries of units. Without any accountability for the title of the units.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      Kindly be informed that the valuation report may require modifications in case unanticipated circumstances arise, which were not considered in the presumptions and restrictions specified in the report.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
      Additional observations, assumptions, and any relevant limiting conditions are also disclosed in the corresponding sections of this report and its annexes.
    </li>
  </ul>

  <p style="margin: 12px 0; font-weight: bold; page-break-after: avoid;">❖ Our standard terms and conditions of professional engagement govern this report. They are outlined below:</p>

  <ol style="margin: 8px 0; padding-left: 20px;">
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
     1. Valuers will be liable for any issues or concerns related to the Valuation and/or other Services provided. This includes situations where the cause of action is in contract, tort (including negligence), statute, or any other form, however, the total amount of liability will not exceed the professional fees paid to VALUERS for this service.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
    2.  VALUERS and its partners, officers, and executives cannot be held liable for any damages, including consequential, incidental, indirect, punitive, exemplary, or special damages. This includes damages resulting from bad debts, non-performing assets, financial loss, malfunctions, delays, loss of data, interruptions of service, or loss of business and anticipated profits.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
     3. The Valuation Services, along with the Deliverables submitted by VALUERS, are intended solely for the benefit of the parties involved. VALUERS assumes no liability or responsibility towards any third party who utilizes or gains access to the Valuation or benefits from the Services.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
     4. VALUERS and / or its Partners, Officers and Executives accept no responsibility for detecting fraud or misrepresentation, whether by management or employees of the Client or third parties. Accordingly, VALUERS will not be liable in any way for, or in connection with, fraud or misrepresentations, whether on the part of the Client, its contractors or agents, or any other third party.
    </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
5. If you wish to bring a legal proceeding related to the Services or Agreement, it must be initiated within six (6) 
months from the date you became aware of or should have known about the facts leading to the alleged 
liability. Additionally, legal proceedings must be initiated no later than one (1) year from the date of the 
Deliverable that caused the alleged liability.     </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
6. If you, as the client, have any concerns or complaints about the services provided, please do not hesitate to 
discuss them with the officials of VALUERS. Any service-related issues concerning this Agreement (or any 
variations or additions to it) must be brought to the attention of VALUERS in writing within one month from 
the date when you became aware of or should have reasonably been aware of the relevant facts. Such issues 
must be raised no later than six months from the completion date of the services.     </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
   
7. If there is any disagreement regarding the Valuation or other Services that are provided, both parties must first 
try to resolve the issue through conciliation with their senior representatives. If a resolution cannot be reached 
within forty-five (45) days, the dispute will be settled through Arbitration in India, following the guidelines of 
the Arbitration and Conciliation Act 1996. The venue of the arbitration will be located in Ahmedabad, Gujarat, 
India. The arbitrator(s)' authority will be subject to the terms of the  standard terms of service, which includes 
the limitation of liability provision. All information regarding the arbitration, including the arbitral award, will 
be kept confidential.      </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
8. By utilizing this report, the user is presumed to have thoroughly read, comprehended, and accepted VALUERS' 
standard business terms and conditions, as well as the assumptions and limitations outlined in this document.      </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
    9. We have valued the right property as per the details submitted to me.  
   </li>
    <li style="margin: 6px 0; text-align: justify; page-break-after: avoid;">
10. Please note that payment for the valuation report is expected to be made within the bank's given time limit 
from the date of the report. Simply possessing the report will not fulfill its intended purpose. 
    </li>
  </ol>
  </div>


  <!-- RAJESH GANATRA INFO - CENTERED -->
  <div style="margin: 60px 0 0 0; text-align: right;">
   <p style="margin: 8px 0 4px 0; font-weight: bold; font-size: 16pt; line-height: 1.2;">Rajesh Ganatra</p>
   <p style="margin: 2px 0; font-size: 12pt; line-height: 1.6;">Chartered Engineer (India), B.E. Civil, PMP (PMI USA)</p>
    <p style="margin: 2px 0; font-size: 12pt; line-height: 1.6;">Fellow Institute Of Valuer (Delhi), M.I.E.,</p>
    <p style="margin: 2px 0; font-size: 12pt; line-height: 1.5;">Approved Valuer By Chief Commissioner Of Incom-tax(II)</p>
    <p style="margin: 2px 0; font-size: 12pt; line-height: 1.5;">Approved Valuer By IOV (Delhi)</p>
    <p style="margin: 2px 0 2px 0; font-size: 12pt; line-height: 1.5;">5th floor, Shalvik Complex, behind Ganesh Plaza,</p>
    <p style="margin: 2px 0; font-size: 12pt; line-height: 1.6;">Opp. Sanmukh Complex, Off. C G Road,</p>
   <p style="margin: 2px 0; font-size: 12pt; line-height: 1.6;">Navrangpura, Ahmedabad – 380009</p>
   <p style="margin: 2px 0; font-size: 12pt; line-height: 1.6;">Mobile: 09825798600</p>
   <p style="margin: 6px 0 0 0; font-size: 12pt; line-height: 1.6;"><a href="mailto:rajeshganatra2003@gmail.com" style="color: blue; text-decoration: underline;">E-Mail: rajeshganatra2003@gmail.com</a></p>
  </div>
</div>
  <!-- PAGE 22: DECLARATION-CUM-UNDERTAKING (ANNEXURE-IV) -->
<div style="background: white; padding: 12mm; width: 100%; box-sizing: border-box; page-break-before: always; overflow: visible;">
<div style="font-size: 12pt; line-height: 1.4; margin-top: 20px; margin-left: 0; margin-right: 0; width: 100%; overflow: visible;">
  <div style="text-align: center; margin-bottom: 25px;">
    <p style="margin: 0; font-weight: bold; font-size: 12pt;">ANNEXURE – IV</p>
    <p style="margin: 8px 0 0 0; font-weight: bold; font-size: 12pt;">DECLARATION- CUM- UNDERTAKING</p>
  </div>

  <p style="margin: 10px 0; font-weight: bold;">I,'Rajesh Ganatra' son of  'Kishorbhai Ganatra' do hereby solemnly affirm and state that:</p>

<ol style="margin: 10px 0; padding-left: 20px; list-style-type: none; counter-reset: alphacounter;">
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">A.</span>I am a citizen of India
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">B.</span>I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointment as valuer or three years after the valuation of assets was conducted by me
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">C.</span>The information furnished in my valuation report dated <span style="text-decoration: underline;">${formatDate(safeGet(pdfData, 'dateOfValuationReport')) || ''}</span> is true and correct to the best of my knowledge and belief and I have made an impartial and true valuation of the property
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">D.</span>We have personally inspected the property on <span style="text-decoration: underline;">${formatDate(safeGet(pdfData, 'dateOfInspectionOfProperty')) || ''}</span>. The work is not sub-contracted to any other valuer and carried out by myself.
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">E.</span>Valuation report is submitted in the format as prescribed by the Bank.
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">F.</span>I have not been depanelled/ delisted by any other bank and in case any such deplanement by other banks 
during my empanelment with you, I will inform you within 3 days of such depanelment. 
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">F.</span>I have not been removed/dismissed from service/employment earlier
</li>

<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">H.</span>I have not been convicted of any offence and sentenced to a term of imprisonment
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">I.</span>I have not been found guilty of misconduct in professional capacity
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">J.</span>I have not been declared to be unsound mind
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">K.</span>I am not an un-discharged bankrupt, or have not applied to be adjudicated as a bankrupt
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">L.</span>I am not an un-discharged insolvent
</li>

<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">M.</span>I have not been levied a penalty under section 271J of Income-tax Act, 1961 (43 of 1961) and time limit for filing appeal before Commissioner of Income-tax (Appeals) or Income-tax 
  Appellate Tribunal, as the case may be, has expired, or such penalty has been confirmed by Income-tax </br> Appellate Tribunal, and five years have not elapsed after levy of such penalty
</li>

<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">N.</span>I have not been convicted of an offence connected with any proceeding under the Income Tax Act 1961, Wealth Tax Act 1957 or Gift Tax Act 1958
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">O.</span>My PAN Card number/Service Tax number as applicable is <span style="text-decoration: underline;">AELPG1208B</span>
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">P.</span>I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">Q.</span>I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">R.</span>I have read the Handbook on Policy, Standards and Procedure for Real Estate Valuation, 2011 of the IBA and this report is in conformity to the "Standards" enshrined for valuation in the Part-B of the above handbook to the best of my ability
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">S.</span>I am registered under Section 34 AB of the Wealth Tax Act, 1957. (Strike off, if not applicable)
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">T.</span>I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI) (Strike off, if not applicable)
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">U.</span>My CIBIL Score and credit worthiness is as per Bank's guidelines
</li>
<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">V.</span>I am the proprietor/partner/authorized official of the firm/company, who is competent to sign this valuation report
</li>

<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">W.</span>I will undertake the valuation work on receipt of Letter of Engagement generated from the system (i.e. LLMS/LOS) only
</li>

<li style="margin: 6px 0; text-align: justify; list-style-type: none; counter-increment: alphacounter; page-break-after: avoid;">
  <span style="margin-right: 8px; font-weight: bold; width: 20px; display: inline-block;">X.</span>Further, I hereby provide the following information
</li>
</ol>
</div>
</div>
<!-- PAGE 23: VALUATION DETAILS TABLE -->
<div style="margin: 0; padding: 12mm; background: white; width: 100%; box-sizing: border-box; page-break-before: always; overflow: visible;" class="print-container">
<div style="font-size: 12pt; line-height: 1.4; overflow: visible;">
  <table style="width: 100%; border-collapse: collapse; margin: 0; border: 1px solid #000; table-layout: fixed;">
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 5%; font-weight: bold;">No.</td>
      <td style="border: 1px solid #000; padding: 6px; width: 45%; font-weight: bold;">Particulars</td>
      <td style="border: 1px solid #000; padding: 6px; width: 50%; font-weight: bold;">Valuer comment</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">1</td>
      <td style="border: 1px solid #000; padding: 6px;">Background information of the asset being valued</td>
      <td style="border: 1px solid #000; padding: 6px;">Referred provided documents</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">2</td>
      <td style="border: 1px solid #000; padding: 6px;">Purpose of valuation and appointing authority</td>
      <td style="border: 1px solid #000; padding: 6px;"><strong>${safeGet(pdfData, 'pdfDetails.purposeOfValuation') || safeGet(pdfData, 'valuationPurpose') || 'Continue Financial Assistance Purpose'}</strong></td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">3</td>
      <td style="border: 1px solid #000; padding: 6px;">Identity of the valuer and any other experts involved in the valuation</td>
      <td style="border: 1px solid #000; padding: 6px;">Self-assessment</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">4</td>
      <td style="border: 1px solid #000; padding: 6px;">Disclosure of valuer interest or conflict, if any</td>
      <td style="border: 1px solid #000; padding: 6px;">N.A.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">5</td>
      <td style="border: 1px solid #000; padding: 6px;">Date of appointment, valuation date and date of report</td>
      <td style="border: 1px solid #000; padding: 6px;"><strong>Date of report: ${formatDate(safeGet(pdfData, 'dateOfValuationReport'))}<br/>Date of Visit: ${formatDate(safeGet(pdfData, 'dateOfInspectionOfProperty'))}</strong></td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">6</td>
      <td style="border: 1px solid #000; padding: 6px;">Inspections and/or investigations undertaken</td>
      <td style="border: 1px solid #000; padding: 6px;">Yes</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">7</td>
      <td style="border: 1px solid #000; padding: 6px;">Nature and sources of the information used or relied upon</td>
      <td style="border: 1px solid #000; padding: 6px;">Local inquiries, brokers, known websites (magicbricks, 99acres, propertywall, proprtiger, housing), if available</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">8</td>
      <td style="border: 1px solid #000; padding: 6px;">Procedures adopted in carrying out the valuation and valuation standards followed</td>
      <td style="border: 1px solid #000; padding: 6px;">Land & Building Method, with Market Approach for Land and Cost Approach for Building</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">9</td>
      <td style="border: 1px solid #000; padding: 6px;">Restrictions on use of the report, if any</td>
      <td style="border: 1px solid #000; padding: 6px;">As per purpose mentioned in report</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">10</td>
      <td style="border: 1px solid #000; padding: 6px;">Major factors that were taken into account during the valuation</td>
      <td style="border: 1px solid #000; padding: 6px;">Location of the property, with developing surroundings, for going-concern valuation</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">11</td>
      <td style="border: 1px solid #000; padding: 6px;">Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of limiting responsibility for the valuation report</td>
      <td style="border: 1px solid #000; padding: 6px;">Future market events and Government Policies</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">12</td>
      <td style="border: 1px solid #000; padding: 6px;">Other relevant caveats, limitations and disclaimers</td>
      <td style="border: 1px solid #000; padding: 6px;">we are Not responsible for Title of the property and valuations affected by the same</td>
    </tr>
     <tr>
     <td colspan="2" style="border: none; padding: 6px;">
       <div style="display: flex; align-items: flex-start; width: 100%;">
         <div style="flex: 1;">
           <p style="margin: 0; text-align: left; white-space: nowrap;"><strong>Place:&nbsp;${safeGet(pdfData, 'city') || 'NA'}</strong></p>
           <p style="margin: 5px 0 0 0; text-align: left; white-space: nowrap;"><strong>Date:&nbsp;${formatDate(safeGet(pdfData, 'dateOfValuationReport')) || 'NA'}</strong></p>
         </div>
         <div style="margin-left: 60px; text-align: right; flex-shrink: 0;">
           <p style="margin: 0; font-weight: bold;">Rajesh Ganatra</p>
         </div>
       </div>
     </td>
     </tr>
</table>
</div>
</div>

<!-- PAGE 24-25: MODEL CODE OF CONDUCT FOR VALUERS -->
<div class="page print-container" style="margin: 0; padding: 12mm; background: white; width: 100%; box-sizing: border-box; page-break-before: always; overflow: visible;">
<div style="font-size: 12pt; line-height: 1.4; overflow: visible;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="margin: 0; font-weight: bold; font-size: 12pt;">(Annexure-V)</p>
    <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 12pt;">MODEL CODE OF CONDUCT FOR VALUERS</p>
  </div>

  <p style="margin: 10px 0 8px 0; font-weight: bold;">Integrity and Fairness</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">1.</span>
      <span>A valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other valuers.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">2.</span>
      <span>A valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">3.</span>
      <span>A valuer shall endeavour to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">4.</span>
      <span>A valuer shall refrain from being involved in any action that would bring disrepute to the profession.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">5.</span>
      <span>A valuer shall keep public interest foremost while delivering his services.</span>
    </div>
  </div>

  <p style="margin: 10px 0 8px 0; font-weight: bold;">Professional Competence and Due Care</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">6.</span>
      <span>A valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">7.</span>
      <span>A valuer shall carry out professional services in accordance with the relevant technical and professional standards that may be specified from time to time.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">8.</span>
      <span>A valuer shall continuously maintain professional knowledge and skill to provide competent professional service based on up-to-date developments in practice, prevailing regulations/guidelines and techniques.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">9.</span>
      <span>In the preparation of a valuation report, the valuer shall not disclaim liability for his/its expertise or deny his/its duty of care, except to the extent that the assumptions are based on statements of fact provided by the company or its auditors or consultants or information unavailable in public domain and not generated by the valuer.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">10.</span>
      <span>A valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">11.</span>
      <span>A valuer shall clearly state to his client the services that he would be competent to provide and the services for which he would be relying on other valuers or professionals or for which the client can have a separate arrangement with other valuers.</span>
    </div>
  </div>
  <p style=" font-weight: bold;">Independence and Disclosure of Interest</p>
  </br>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">12.</span>
      <span>A valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.</span>
    </div>
 
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">13.</span>
      <span>A valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent in terms of association to the company.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">14.</span>
      <span>A valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">15.</span>
      <span>A valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">16.</span>
      <span>A valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation, and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">17.</span>
      <span>A valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client's needs.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">18.</span>
      <span>As an independent valuer, the valuer shall not charge success fee.</span>
    </div>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">19.</span>
      <span>In any fairness opinion or independent expert opinion submitted by a valuer, if there has been a prior engagement in an unconnected transaction, the valuer shall declare the association with the company during the last five years.</span>
    </div>
  </div>

  <p style="margin: 10px 0 8px 0; font-weight: bold;">Confidentiality</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">20.</span>
      <span>A valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.</span>
    </div>
  </div>

  <p style="margin: 10px 0 8px 0; font-weight: bold;">Information Management</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">21.</span>
      <span>A valuer shall ensure that he/it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.</span>
    </div>
    
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">22.</span>
      <span>A valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorised by the authority, the registered valuers </br> organisation with which he/it is registered or any other statutory regulatory body.</span>
    </div>
 </br>
    </br>
    </br>
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">23.</span>
      <span>A valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organisation with which he/it is registered, or any other statutory regulatory body.</span>
    </div>
 
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">24.</span>
      <span>A valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.</span>
    </div>
  </div>

  <p style="margin: 10px 0 8px 0; font-weight: bold;">Gifts and hospitality.</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 4px 0; text-align: justify; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">25.</span>
      <span>A valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a valuer.</span>
    </div>
  </div>

  <p style="margin: 10px 0 3px 0; font-size: 12pt;">Explanation: For the purposes of this code the term 'relative' shall have the same meaning as defined in clause (77) of Section 2 of the Companies Act, 2013 (18 of 2013).</p>

  <div style="margin: 10px 0 10px 0; padding: 0;">
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">26.</span>
      <span>A valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.</span>
    </div>
  </div>

  <p style="margin: 7px 0 8px 0; font-weight: bold; font-size: 12pt;">Remuneration and Costs.</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">27.</span>
      <span>A valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.</span>
    </div>
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">28.</span>
      <span>A valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service.</span>
    </div>
  </div>

  <p style="margin: 7px 0 8px 0; font-weight: bold; font-size: 12pt;">Occupation, employability and restrictions.</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">29.</span>
      <span>A valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/its assignments.</span>
    </div>
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">30.</span>
      <span>A valuer shall not conduct business which in the opinion of the authority or the registered valuer organisation discredits the profession.</span>
    </div>
  </div>

  <p style="margin: 3px 0 8px 0; font-weight: bold; font-size: 12pt;">Miscellaneous</p>
  <div style="margin: 5px 0 10px 0; padding: 0;">
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">31.</span>
      <span>A valuer shall refrain from undertaking to review the work of another valuer of the same client except under written orders from the bank or housing finance institutions and with knowledge of the concerned valuer.</span>
    </div>
    <div style="margin: 6px 0; text-align: justify; font-size: 12pt; display: flex;">
      <span style="font-weight: bold; min-width: 24px;">32.</span>
      <span>A valuer shall follow this code as amended or revised from time to time.</span>
    </div>
    <div style="margin-top: 50px;">
    <p style="margin: 4px 0; font-size: 12pt;"><strong>Signature of the valuer:</strong> _________________</p>
    <p style="margin: 4px 0; font-size: 12pt;"><strong>Name of the Valuer:</strong> Rajesh Ganatra</p>
    <p style="margin: 4px 0 0 0; font-size: 12pt;"><strong>Address of the valuer:</strong></p>
    <p style="margin: 4px 0; font-size: 12pt;">5<sup>th</sup> floor, Shalvik Complex, behind Ganesh Plaza,</p>
    <p style="margin: 4px 0; font-size: 12pt;">Opp. Sanmukh Complex, off. C G Road,</p>
    <p style="margin: 4px 0 10px 0; font-size: 12pt;">Navrangpura, Ahmedabad – 380009</p>
    <p style="margin: 4px 0; font-size: 12pt; padding: 4px; display: inline-block;"><strong>Date: ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport') || '')}</strong></p></br>
    <p style="margin: 4px 0; font-size: 12pt; padding: 4px; display: inline-block;"><strong>Place: ${safeGet(pdfData, 'city') || 'NA'}</strong></p>
  </div>
  </div>
  </div>
</div>
<!-- END OF CONTINUOUS WRAPPER -->
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


export const generateRajeshBankPDF = generateRecordPDF;

const pdfExportService = {
  generateValuationReportHTML,
  generateRecordPDF,
  generateRajeshBankPDF,
  previewValuationPDF,
  generateRecordPDFOffline,
  normalizeDataForPDF
};

export default pdfExportService;