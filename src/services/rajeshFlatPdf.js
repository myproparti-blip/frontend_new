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

    }
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
        white-space: normal !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        word-break: break-word !important;
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
        <p style="font-size: 20pt; font-weight: bold; margin: 0; color: #0047AB; ">VALUATION REPORT</p>
      </div>
      
      <table class="form-table" style="border-collapse: collapse; border: 1px solid #000; margin-bottom: 20px; width: 100%;">
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Name of A/C 
</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ;  font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.accountName', 'NA')}</td>
        </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Name of Owner</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ;  font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.propertyOwnerDetails.nameOfOwner', 'NA')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Client</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%;  font-size: 11pt;">${safeGet(pdfData, 'bankName', '')},${safeGet(pdfData, 'pdfDetails.client', '')},${safeGet(pdfData, 'city', '')}</td>
          </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Property Details</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ;  font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.typeOfProperty', '')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Location</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%;  font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.propertyDetailsLocation', 'NA')}</td>
        </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Purpose of Valuation</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ;  font-size: 11pt;">${safeGet(pdfData, 'pdfDetails.valuationHeader.purposeForValuation', 'NA')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Date of Valuation</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%;  font-size: 11pt;">${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</td>
        </tr>
      </table>

<!-- Bank Image Below Table -->
<div class="image-container"
     style="
        text-align: center;
        margin-top: 10px;
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
              height: 440px;
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
          color: #0047AB; 
       ">
      VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE
    </p>
  </div>

    <div style="box-sizing: border-box; width: 100%; margin: 0; padding: 0 12mm; overflow: hidden;">
    <table class="form-table"
      style="width:100%; border-collapse: collapse; border: 1px solid #000; font-family: Arial, sans-serif; font-size:11pt; margin:0; padding:0; box-sizing: border-box; page-break-inside: avoid; table-layout: fixed;">
      <tr>
         <td style="border:1px solid #000; padding:6px; width:35%; ">
           Applicant
         </td>
         <td style="border:1px solid #000; padding:6px; width:65%; ">
${safeGet(pdfData, 'bankName', '')},${safeGet(pdfData, 'pdfDetails.client', '')},${safeGet(pdfData, 'city', '')}         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Valuation done by Govt. Approved Valuer
         </td>
         <td style="border:1px solid #000; padding:6px; ">
           ${safeGet(
             pdfData,
             'pdfDetails.valuationDoneByApproved',
             "IBBI Regd. & Govt. Approved Valuer & Bank's Panel Valuer"
         )}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Purpose of Valuation
         </td>
         <td style="border:1px solid #000; padding:6px; ">
           To ascertain fair market value for
           <em>${safeGet(pdfData, 'pdfDetails.valuationHeader.purposeForValuation', '')}</em>
           (My opinion for the probable value of the property only)
         </td>
       </tr>


       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Name of Owner / Owners
         </td>
         <td style="border:1px solid #000; padding:6px; ">
${safeGet(pdfData, 'pdfDetails.propertyOwnerDetails.nameOfOwner', 'NA')}         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Address of property under valuation
         </td>
         <td style="border:1px solid #000; padding:6px; ">
          ${safeGet(pdfData, 'pdfDetails.propertyDetailsLocation', 'NA')}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Brief description of the Property
         </td>
         <td style="border:1px solid #000; padding:6px; ">
           ${safeGet(pdfData, 'pdfDetails.propertyDescription.briefDescriptionOfProperty', 'NA')}
         </td>
       </tr>

       <tr>
          <td style="border:1px solid #000; padding:6px; ">
            Revenue details as per Sale deed / Authenticate Documents
          </td>
          <td style="border:1px solid #000; padding:6px; ">
            ${safeGet(pdfData, 'pdfDetails.requisiteDetailsAsPerSaleDeedAuthoritiesDocuments', 'FP No. 151, TPS No. 29, Sub Plot No. 9/P, Sur. No. 88/1, Mouje: Naranpura, Ta. City, Dist. Ahmedabad.')}
          </td>
       </tr>

      
       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Construction Area 
         </td>
         <td style="border:1px solid #000; padding:6px; ">
           ${safeGet(pdfData, 'pdfDetails.areaOfLand', 'NA')}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           Construction Area Value
         </td>
         <td style="border:1px solid #000; padding:6px; ">
           ${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.valueOfConstruction', 'NA'))}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; margin-top: 80px;">
           TOTAL MARKET VALUE OF THE PROPERTY
         </td>
         <td style="border:1px solid #000; padding:6px; font-weight:bold;">
           ${formatCurrencyWithWords(
             safeGet(pdfData, 'pdfDetails.totalMarketValueOfTheProperty', 'NA')
         )}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           REALISABLE VALUE (90% of MV)
         </td>
         <td style="border:1px solid #000; padding:6px; font-weight:bold;">
           ${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.realizableValue', 'NA'))}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           DISTRESS SALE VALUE (80% of MV)
         </td>
         <td style="border:1px solid #000; padding:6px; font-weight:bold;">
           ${formatCurrencyWithWords(
             safeGet(pdfData, 'pdfDetails.valuationComputation.valuationSummary.distressValue', 'NA')
         )}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           JANTRI VALUE OF PROPERTY
         </td>
         <td style="border:1px solid #000; padding:6px; font-weight:bold;">
           ${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.valuationComputation.valuationSummary.jantriValue', 'NA'))}
         </td>
       </tr>

       <tr>
         <td style="border:1px solid #000; padding:6px; ">
           INSURABLE VALUE OF PROPERTY
         </td>
         <td style="border:1px solid #000; padding:6px; font-weight:bold;">
           ${formatCurrencyWithWords(
             safeGet(pdfData, 'pdfDetails.valuationComputation.valuationSummary.insurableValue', 'NA')
         )}
         </td>
       </tr>
       <tr>
         <td colspan="3" style="border: 1px solid #000; padding: 5px 6px;">
           <div style="display: flex; justify-content: space-between; align-items: flex-start;">
             <div style="text-align: left;">
               <p style="margin: 4px 0; font-size: 12pt; padding: 4px; border: none; text-decoration: none;"><strong>Date:</strong> ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</p>
               <p style="margin: 4px 0; font-size: 12pt; padding: 4px; border: none; text-decoration: none;"><strong>Place:</strong>${safeGet(pdfData, 'city', '')}</p>
             </div>
             <div style="text-align: right;">
               <p style="margin: 0; border: none; text-decoration: none;"><strong>Rajesh Ganatra</strong></p>
               <p style="margin: 4px 0; border: none; text-decoration: none;"><strong>Govt. Registered Valuer</strong></p>
             </div>
           </div>
         </td>
       </tr>
      </table>
      </div>
      </div>
<!-- END: valued-property-section -->

<!-- START: letterhead-section (PAGE 2) -->
<div style="page-break-before: always; margin-top: 10px;">

  <div style="font-weight: bold; line-height: 1.6; margin-bottom: 20px; margin-top: 30px;">
    <p style="margin: 0;">To,</p>
    <p style="margin: 0;">Chief Manager,</p>
    <p style="margin: 0;">${safeGet(pdfData, 'bankName', '')}</p>
    <p style="margin: 0;">${safeGet(pdfData, 'pdfDetails.client', '')}</p>
    <p style="margin: 0;">${safeGet(pdfData, 'city', '')}</p>
  </div>

  <h4 style="
    text-align: center;
    font-weight: bold;
    font-size: 16pt;
    color: #0047AB;
    text-transform: uppercase;
    margin-bottom: 30px;
  ">
    VALUATION REPORT
  </h4>

</div>
<!-- END: letterhead-section -->


     


      <!-- START: general-section -->
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 45%;">
            <col style="width: 50%;">
          </colgroup>
          <tr style="background-color: #ffffff;">
            <td colspan="3" style="border: 1px solid #000000; padding: 8px; font-weight: bold; text-align: left;">I. GENERAL</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">1.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Purpose for which the valuation is made</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.purposeOfValuationIntro', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">2.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;">
              <div style="margin-bottom: 8px; font-weight: bold;">a) Date of inspection</strong></div>
              <div style="font-weight: bold;">b) Date on which the valuation is made</strong></div>
            </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">
              <div style="margin-bottom: 8px;"> ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfInspectionOfProperty', 'NA'))}</div>
              <div> ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">3.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">List of documents produced for perusal</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">i) Sale-Deed</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docSaleDeed', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">ii) Approved Plan</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docBuildingPlanApproval', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">iii) BU Permission</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docPowerOfAttorney', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">iv) Construction Permission</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docConstructionPermission', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">v) NA Letter</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docNALetter', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">vi) TCR</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docTCR', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">vii) Tax Bill</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.docPropertyTax', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">4.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Name of the owner(s) and his / their address (as) with Phone no. (details of share of each owner in case of joint ownership)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.nameAddressOfManager', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">5.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Brief description of the property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.propertyDescription.briefDescriptionOfProperty', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">6.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Location of property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;"><strong>a)</strong> Plot No. / Survey No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.plotNoRevenueNo', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;"><strong>b)</strong> Door No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.doorNumber', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;"><strong>c)</strong> T.S. No. / Village</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.villageOrTalukSubRegisterBlock', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;"><strong>d)</strong> Ward / Taluka</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.wardTaluka', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;"><strong>e)</strong> Mandal / District</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.district', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">f) Google Map</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"> ${safeGet(pdfData, 'pdfDetails.propertyDescription.googleMapCoordinates', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">g) Date of issue and validity of layout of approved map/plan</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"> ${safeGet(pdfData, 'pdfDetails.dateOfIssueValidity', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">h) Approved map/plan issuing authority</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"> ${safeGet(pdfData, 'pdfDetails.approvedMapPlanAuthority', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">i) Whether genuineness or authenticity of approved map/plan is verified</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.genuinenessVerified', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">j) Any other comments by our empanelled valuers on authentic of approved plan</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"> ${safeGet(pdfData, 'pdfDetails.otherComments', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">7.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Postal address of the property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"> ${safeGet(pdfData, 'pdfDetails.propertyDetailsLocation', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">8.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">City / Town</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.cityTown', safeGet(pdfData, 'city', 'NA'))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Residential area</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.residentialArea', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Commercial area</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.commercialArea', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Industrial area</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.industrialArea', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">9.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Classification of the area</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">i) High / Middle / Poor</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.areaGrade', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">ii) Urban / Semi Urban / Rural</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.areaType', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">10.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Coming under Corporation limit / Village Panchayat / Municipality  </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.governanceType', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">11.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Whether covered under any State/ Central Govt. documents (e.g. Urban Land Ceiling Act) or notified under agency area/ scheduled area/ cantonment area.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.governmentEnactments', 'NA')}</td>
          </tr>
        </table>
      </div>

      <!-- START: boundaries-dimensions-section -->
      <div style="margin-top: 0;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 30%;">
            <col style="width: 32.5%;">
            <col style="width: 32.5%;">
          </colgroup>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">12.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; font-weight: bold;">Boundaries of the property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; text-align: center; font-weight: bold;">As Per Sale Deed</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; text-align: center; font-weight: bold;">As per site Visit</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">East</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.east.saleDeed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.east.siteVisit', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">West</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.west.saleDeed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.west.siteVisit', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">North</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.north.saleDeed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.north.siteVisit', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">South</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.south.saleDeed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.boundaries.south.siteVisit', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">13.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; font-weight: bold;">Dimensions of the site</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; text-align: center; font-weight: bold;">As per the Deed</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; text-align: center; font-weight: bold; background-color: #ffffff;">Actuals</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">East</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.east.deed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.east.actual', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">West</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.west.deed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.west.actual', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">North</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.north.deed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.north.actual', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 30%; padding-left: 10px;">South</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.south.deed', 'NA')}</td>
            <td style="border: 1px solid #000; padding: 8px; width: 32.5%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.siteDetails.dimensions.south.actual', 'NA')}</td>
          </tr>
        </table>
      </div>
      <!-- END: boundaries-dimensions-section -->

      <!-- START: site-extent-section -->
      <div style="margin-top: 5px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; vertical-align: top;">14.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%; vertical-align: top; font-weight: bold;">Extent of the site</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%;"><strong>Area details of Property</strong><br><br>
              <strong>As per Sale Deed:</strong><br>
              Built-up Area = ${safeGet(pdfData, 'pdfDetails.siteDetails.extentOfSite.saleDeed', '')} sq.mt<br><br>
              <strong>As per Approved Plan:</strong><br>
              Built-up Area = ${safeGet(pdfData, 'pdfDetails.siteDetails.extentOfSite.approvedPlan', '')} sq.mt<br><br>
              <strong>As per Tax Bill:</strong><br>
              Built-up Area = ${safeGet(pdfData, 'pdfDetails.siteDetails.extentOfSite.taxBill', '')} sq.mt
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">15.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%; ">Extent of the site considered for valuation (least of 13a & 13b)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%;"><strong>As per Sale Deed:</strong><br>
              Built-up Area = ${safeGet(pdfData, 'pdfDetails.siteAreaForValuation', '')} sq.mt
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">16.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%; ">Whether occupied by the owner / tenant? If occupied by tenant since how long? Rent received per month</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">${safeGet(pdfData, 'pdfDetails.siteDetails.occupancyStatus', 'NA')}</td>
          </tr>
        </table>
      </div>
      <!-- END: site-extent-section -->

      <!-- START: apartment-building-section -->
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 45%;">
            <col style="width: 50%;">
          </colgroup>
          <tr style="background-color: #ffffff;">
            <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #000000;">II. APARTMENT BUILDING</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">Sr. No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; "></td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">1.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Nature of the apartment</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.constructionType', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">2.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Location</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; ">Details of Area Surroundings with Google Location</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">T.S. No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.tsNo', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Block No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.blockNo', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Ward No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.wardNo', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Village /Municipality /Corporation</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.villageOrMunicipality', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Door No. Street or Road (Pin Code)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.doorNoStreetRoadPinCode', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">3.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Description of the locality Residential/Commercial /Mixed </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.localityDescription', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">4.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Year of Construction</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.buildingAge', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">5.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Number of floors</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.buildingAndProperty.apartmentBuilding.numberOfFloors', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">6.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Type of structure</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.structureType', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">7.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Number of Dwelling units in the building </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.dwellingUnits', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">8.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Quality of Construction</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.constructionQuality', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">9.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Appearance of the Building</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.buildingAppearance', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">10.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Maintenance of the Building</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.maintenanceStatus', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">11.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Facilities available</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Lift</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.hasLift', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Protected Water Supply</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.hasWaterSupply', 'NA')}</td>
          </tr>
          
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Underground Sewerage</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.hasSewerage', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Car Parking - Open / Covered </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.hasCarParking', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Does Compound wall existing?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.hasCompoundWall', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">Is pavement laid around the building? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.hasPavement', 'NA')}</td>
          </tr>
        </table>
      </div>
      <!-- END: apartment-building-section -->

      <!-- START: flat-details-section -->
      <div style="margin-top: 50px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 45%;">
            <col style="width: 50%;">
          </colgroup>
          <tr style="background-color: #ffffff;">
            <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #2864b9;">III. OFFICE / SHOP / FLAT</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">1.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Floor in which the Flat is situated</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.flatLocation', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">2.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Door No. of the Flat</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.flatDoorNumber', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">3.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Specifications of the Flat</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">i) Roof</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.specRoof', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">ii) Flooring</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.specFlooring', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">iii) Doors</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.specDoors', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">iv) Windows</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.specWindows', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">v) Fittings</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.specFittings', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">vi) Finishing</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.specFinishing', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">4.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">House Tax</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">a) Assessment No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.taxAssessmentNo', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">b) Tax paid in name of</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.taxPaidName', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; padding-left: 30px;">c) Tax amount</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.taxAmount', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">5.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Electricity Service connection No.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.electricityConnectionNo', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">6.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">How is the maintenance of the Unit? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.unitMaintenance', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">7.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Conveyance Deed executed in name of</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.propertyOwnerDetails.nameOfOwner', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">8.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">What is the undivided area of land as per Sale Deed?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.undividedLandArea', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">9.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">What is the plinth area of the Flat?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-size: 10pt;">
              <strong>As per Sale Deed:</strong> </br>${safeGet(pdfData, 'pdfDetails.flatPlinthArea', '000.00')} sq.mt
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">10.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">What is the floor space index (app.) </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.floorSpaceIndex', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">11.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">What is the Carpet Area of the Flat?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-size: 10pt;">
             <strong> As per Tax Bill:</strong></br> ${safeGet(pdfData, 'pdfDetails.carpetAreaFlat', '000.00')} sq.mt
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">12.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Is it Posh / I Class / Medium / Ordinary? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.flatClass', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">13.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Is it being used for Residential or Commercial purpose? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.usagePurpose', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">14.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Is it Owner -occupied or let out?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.occupancyType', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">15.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">If rented, what is the monthly rent? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.monthlyRent', 'NA')}</td>
          </tr>
        </table>
      </div>
      <!-- END: flat-details-section -->

      <!-- START: marketability-section -->
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 45%;">
            <col style="width: 50%;">
          </colgroup>
          <tr style="background-color: #ffffff;">
            <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #2864b9;">IV. MARKETABILITY</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">1.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">How is the marketability? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.marketabilityLocational', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">2.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">What are the factors favouring for an extra 
          Potential Value?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.marketabilityScarcity', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">3.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Any negative factors are observed which 
          affect the market value in general? </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.marketabilityDemandSupply', 'NA')}</td>
          </tr>
        </table>
      </div>
      <!-- END: marketability-section -->

      <!-- START: rate-section -->
      <div style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 45%;">
            <col style="width: 50%;">
          </colgroup>
          <tr style="background-color: #ffffff;">
            <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #2864b9;">V. RATE</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">1.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">After analysing the comparable sale instances, 
          what is the composite rate for a similar Flat 
          with same specifications in the adjoining 
          locality?</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.rateAnalysis.compositeRateAnalysis', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">2.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%;font-weight: bold; ">Assuming it is a new construction, what is the 
          adopted basic composite rate of the Flat under 
          valuation after comparing with the 
          specifications and other factors with the Flat 
          under comparison (given details). </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">Rate ${safeGet(pdfData, 'pdfDetails.rateAnalysis.adoptedCompositeRate', 'NA')}/- sq. mt. for Built-up Area as per
situation and condition of the Flat</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">3.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold; ">Break-up for the rate</td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%; font-size: 10pt;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; "></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Building + Services</strong></td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.rateAnalysis.rateBreakup.buildingServices', 'NA')} per sq.mt. for Built-up area</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Land + others</strong></td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.rateAnalysis.rateBreakup.landOthers', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">4.</td>
            <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Guideline rate obtained from the Registrar's 
          Flat (evidence thereof to be enclosed) </td>
            <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'pdfDetails.rateAnalysis.guidelineRate', 'NA')}</td>
          </tr>
        </table>
      </div>
      <!-- END: rate-section -->

      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
       
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; vertical-align: top; font-weight: bold;"> i. In case of variation of 20% or more in the valuation proposed by the valuer and the Guideline value provided in the State Govt. notification or Income Tax Gazette Justification on variation has to be given.</td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">a. Guideline value (Jantri rate) of land/property is the value of the land/property as determined by the government, based on it own metrics of facilities and infrastructure growth in that locality. The stamp duty and registration charges for registering a property deal, is based upon this guideline value. The guideline values are revised periodically but then in sync with the market value; Jantri rates are not relevant in current scenario, as they were last updated in April 2011. Actual market rates have more than doubled since then, depending upon area, locality, demand and supply and other various factors.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">b.Being this the situation, it has been observed that sale deeds are executed at lower price of Jantri rates to save registration charges / stamp duty. So these instances does not reflect actual transaction amount / market rate. Moreover now days, in actual market, transactions are done on super built-p area, whereas guideline value (Jantri rate ) is based on carpet area. Both the areas have difference of about 40-50% This also makes difference between two values.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; border-top: 3px solid #000;  padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; border-top: 3px solid #000;  padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; border-top: 3px solid #000;  padding: 8px; width: 47.5%;">c. In present system certain value zones are established at macro levels, but within the same value zone the land prices of all the plots cannot be same. There are certain negative / positive factors, which are attached to any parcel of land, like width of the road on which a plot abuts, frontage to depth ratio, adjoining slum or hutments, title of the property, certain religious & sentimental factors, proximity to high tension electricity supply lines, crematorium, socio economic pattern, stage of infrastructure, development etc. whereas guideline rate are prescribes as uniform rates for particular FP/Zone.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;"> d.Property/land/flat on the main road in any area is priced higher and should be valued higher than that in interiors, whereas guideline rate considered them all with equal perspective.</td>
        </tr>
        <tr>
           <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;"></td>
           <td style="border: 1px solid #000; padding: 3px; width: 47.5%;">e. In real estate market, it has been observed that many type of values present in market like forced sale value, sentimental value, monopoly value etc. so it cannot be generalized, while guideline value (Jantri rate) considered them all with one value per zone.</td>
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
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; vertical-align: top;">Details of last two transactions in the locality/area to be provided, if available.</td>
           <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">i. Recently in year 2023, Govt. has released Revised GR for Guideline rate calculation, Tharav No. 122023/20/H/1, Dt. 13/04/2023, as per that various revision are mentioned in Land Rate for Residential land, Composite Rate for Office use and Shop Use, and Agricultural Use etc. The GR is attached herewith </br> Not available, please refer & considered above facts.</td>
        </tr>
          </table>

          <!-- START: composite-rate-depreciation-section -->
          <div style="margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
              <colgroup>
                <col style="width: 5%;">
                <col style="width: 45%;">
                <col style="width: 50%;">
              </colgroup>
              <tr style="background-color: #ffffff;">
                <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #2864b9;">COMPOSITE RATE ADOPTED AFTER DEPRECIATION</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">a</td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Depreciated building rate</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeDepreciatedBuildingRate', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Replacement cost of Flat with Services (v (3) i)</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeReplacementCost', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Age of the building</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeAgeOfBuilding', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Life of the building estimated</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeLifeOfBuilding', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Depreciation percentage assuming the salvage value as 10%</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #fffffc;">${safeGet(pdfData, 'pdfDetails.compositeDepreciationPercentage', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Depreciated Ratio of the building</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeDepreciatedRatio', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold;">b</td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Total composite rate arrived for valuation</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeTotalRateForValuation', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Depreciated building rate V1 (a)</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeDepreciatedBuildingRateVI', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; ">Rate for Land & other V (3) ii</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff;">${safeGet(pdfData, 'pdfDetails.compositeRateForLand', 'NA')}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
                <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Total Composite Rate</td>
                <td style="border: 1px solid #000; padding: 8px; width: 50%; background-color: #ffffff; font-weight: bold;">${safeGet(pdfData, 'pdfDetails.compositeTotalCompositeRate', 'NA')}</td>
              </tr>
            </table>
          </div>
          <!-- END: composite-rate-depreciation-section -->

          <!-- START: details-of-valuation-section -->
          <div style="margin-top: 15px;">
            <p style="margin: 10px 0; text-align: center; font-weight: bold; font-size: 14pt; color: #2864b9;">Details of Valuation</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11pt; table-layout: fixed;">
              <tr style="background-color: #ffffff;">
                <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; text-align: center;">No.</td>
                <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">Description</td>
                <td style="border: 1px solid #000; padding: 8px; width: 15%; font-weight: bold; text-align: center;">Qty.</td>
                <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold; text-align: center;">Rate per unit ₹</td>
                <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold; text-align: center;">Estimated Value</td>
              </tr>
              <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">1</td>
                 <td style="border: 1px solid #000; padding: 8px;">Present value of the Apartment (incl. car parking, if provided)</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.presentValueQty', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.presentValueRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.presentValue', 'NA')}</td>
               </tr>
              
              <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">2</td>
                 <td style="border: 1px solid #000; padding: 8px;">Wardrobes</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.wardrobes', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.wardrobesRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.wardrobesValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">3</td>
                 <td style="border: 1px solid #000; padding: 8px;">Showcases</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.showcases', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.showcasesRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.showcasesValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">4</td>
                 <td style="border: 1px solid #000; padding: 8px;">Kitchen Arrangements</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.kitchenArrangements', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.kitchenRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.kitchenValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">5</td>
                 <td style="border: 1px solid #000; padding: 8px;">Superfine Finish</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.superfineFinish', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.finishRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.finishValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">6</td>
                 <td style="border: 1px solid #000; padding: 8px;">Interior Decorations</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.interiorDecorations', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.decorationRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.decorationValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">7</td>
                 <td style="border: 1px solid #000; padding: 8px;">Electricity deposits / electrical fittings, etc.</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.electricityDeposits', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.electricityRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.electricityValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">8</td>
                 <td style="border: 1px solid #000; padding: 8px;">Extra collapsible gates / grill works etc.</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.grillWorks', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.grillRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.grillValue', 'NA')}</td>
               </tr>
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">9</td>
                 <td style="border: 1px solid #000; padding: 8px;">Potential value, if any</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.potentialValue', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.potentialRate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.potentialValueAmount', 'NA')}</td>
               </tr>
               ${pdfData.customValuationItems && Array.isArray(pdfData.customValuationItems) && pdfData.customValuationItems.length > 0 ? pdfData.customValuationItems.map((item, index) => `
               <tr>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${10 + index}</td>
                 <td style="border: 1px solid #000; padding: 8px;">${safeGet(item, 'description', 'Custom Item')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(item, 'qty', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(item, 'rate', 'NA')}</td>
                 <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(item, 'value', 'NA')}</td>
               </tr>
               `).join(''): ''}
              <tr style=" font-weight: bold;">
                <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;">Total Value</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">R/o.</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${safeGet(pdfData, 'pdfDetails.valuationTotalValue', '₹ 00,00,000.00')}</td>
              </tr>
            </table>
          </div>
          <!-- END: details-of-valuation-section -->


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
                    <td style="border: 1px solid #000; padding: 8px; ">${safeGet(field, 'name', 'Custom Field')}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${safeGet(field, 'value', 'NA')}</td>
                  </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}

              <div style="page-break-before: always; margin-top: 40px; margin-bottom: 40px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;"><strong><span>
As subjected property is Apartment, we have adopted market approach for this valuation excises. 
The Comparable Sales Approach/ Market Approach </strong></span>
              </p>
              </div>
              <div style="margin-top: 10px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
               <span style="">* For residential homes, condos, townhouses, and small rental apartment buildings, the 
comparable sales approach often provides a great estimate of market value. If you want the 
probable price of a specific property will likely sell at, find out the selling prices, the deal terms, 
and features of recently sold similar properties near the target property. The more closely the 
comparable properties resemble your target property and the closer in proximity, 
the better and more accurate your estimate will be using this approach.</span>
              </p>
            </div>

            <div style="margin-top: 10px;">
              <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
               <span style="">* As a result of my appraisal and analysis it is my considered opinion that the present market value of the 
            above property in the prevailing condition with aforesaid specifications is  </span>
              </p>
            </div>
       <!-- START: valuation-summary-table-section -->
       <div style="margin-top: 20px;">
         <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt; table-layout: fixed;">
           <tr>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; font-weight: bold;">MARKET VALUE (100 %)</td>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; background-color: #ffffff;">${formatCurrencyWithWords(
             safeGet(pdfData, 'pdfDetails.totalMarketValueOfTheProperty', 'NA'))}</td>
           </tr>
           <tr style="background-color: #ffffff;">
             <td style="border: 1px solid #000; padding: 10px; width: 50%; font-weight: bold;">REALIZABLE VALUE (90 %)</td>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; background-color: #ffffff;"> ${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.realizableValue', 'NA'))}</td>
           </tr>
           <tr style="background-color: #ffffff;">
             <td style="border: 1px solid #000; padding: 10px; width: 50%; font-weight: bold;">DISTRESS VALUE (80 %)</td>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; background-color: #ffffff;"> ${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.valuationComputation.valuationSummary.distressValue', 'NA'))}</td>
           </tr>
           <tr>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; font-weight: bold;">INSURABLE VALUE</td>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; background-color: #ffffff;">${formatCurrencyWithWords(
             safeGet(pdfData, 'pdfDetails.valuationComputation.valuationSummary.insurableValue', 'NA'))}</td>
           </tr>
           <tr style="background-color: #ffffff;">
             <td style="border: 1px solid #000; padding: 10px; width: 50%; font-weight: bold;">JANTRI VALUE</td>
             <td style="border: 1px solid #000; padding: 10px; width: 50%; background-color: #ffffff;">          ${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.valuationComputation.valuationSummary.jantriValue', 'NA'))}</td>
           </tr>
         </table>
       </div>
       <!-- END: valuation-summary-table-section -->
            
              <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                      <tbody>
                        <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Date</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt; text-align: right; font-weight: bold;">Rajesh Ganatra </td>
                          </tr>
                          <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Place</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${safeGet(pdfData, 'city', '')}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt; text-align: right; font-weight: bold;">(Govt. Approved Rgtd. Valuer)</td>
                          </tr>
                          </tbody>
                          </table>

                          <p style="margin: 12px 0; font-size: 11pt; text-align: justify;">The undersigned has inspected the property detailed in Valuation Report dated on <span style=";"></strong>${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</strong></span></p>
                          <p style="margin: 0 0 12px 0; font-size: 11pt; text-align: justify;">We are satisfied that the fair and reasonable market value of the property is <span style=";"><strong>${formatCurrencyWithWords(safeGet(pdfData, 'pdfDetails.totalMarketValueOfTheProperty', 'NA'))}</strong></span></p>

                          <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                          <tbody>
                          <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Date</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt;"></td>
                        </tr>
                        <tr>
                          <td style="width: 15%; border: none; padding: 4px 8px; font-weight: bold; font-size: 11pt; ;">Place</td>
                          <td style="width: 5%; border: none; padding: 4px 8px; font-size: 11pt;">: -</td>
                          <td style="width: 30%; border: none; padding: 4px 8px; font-size: 11pt; ;">${safeGet(pdfData, 'city', '')}</td>
                          <td style="width: 50%; border: none; padding: 4px 8px; font-size: 11pt; text-align: right;">(Branch Manager)</td>
                        </tr>
                      </tbody>
                    </table>

        
                 
                 <div style="margin-top: 40px;  page-break-before: always;">

            <p style="margin-bottom: 10px; text-align: center; font-weight: bold; ">CHECKLIST OF DOCUMENT</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11pt;">
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #ffffff; text-align: left;">Engagement Letter / Confirmation for Assignment</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.engagementLetter', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.engagementLetterReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Ownership Documents: Sale Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.saleDeed', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.saleDeedReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Adv. TCR / LSR</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.tcrLsr', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.tcrLsrReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Allotment Letter</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.allotmentLetter', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.allotmentLetterReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Kabular Lekh</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.kabualatLekh', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.kabualatLekhReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Mortgage Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.mortgageDeed', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.mortgageDeedReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Lease Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.leaseDeed', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.leaseDeadReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Index – 2</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.index2', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.index2Reviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">VF: 7/12 in case of Land</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.vf712', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.vf712Reviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">NA order</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.naOrder', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.naOrderReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Approved Plan</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.approvedPlan', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.approvedPlanReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Commencement Letter</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.commencementLetter', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.commencementLetterReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">BU Permission</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.buPermission', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.buPermissionReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Ele. Meter Photo</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.eleMeterPhoto', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.eleMeterPhotoReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Light Bill</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.lightBill', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.lightBillReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Muni. Tax Bill</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.muniTaxBill', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.muniTaxBillReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Numbering = Flat / bungalow / Plot No. / Identification on Site</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.numbering', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.numberingReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Boundaries of Property – Proper Demarcation</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.boundaries', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.boundariesReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Merged Property?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.mergedProperty', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.mergedPropertyReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Premise can be Separated, and Entrance / Dorr is available for the mortgaged property?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.premiseSeparation', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.premiseSeparationReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Land is Locked?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.landLocked', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.landLockedReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Property is rented to Other Party</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.propertyRented', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.propertyRentedReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">If Rented = Rent Agreement is Provided?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.rentAgreement', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.rentAgreementReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Site Visit Photos</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.siteVisitPhotos', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.siteVisitPhotosReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Selfie with Owner / Identifier</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.selfieOwner', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.selfieOwnerReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Mobile No.</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.mobileNo', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.mobileNoReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Data Sheet</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.dataSheet', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.dataSheetReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Tentative Rate</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.tentativeRate', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.tentativeRateReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Sale Instance / Local Inquiry / Verbal Survey</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.saleInstance', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.saleInstanceReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Broker Recording</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.brokerRecording', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.brokerRecordingReviewed', '--'), false)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: left;">Past Valuation Rate</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.pastValuationRate', '--'), true)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getChecklistValue(safeGet(pdfData, 'checklist.pastValuationRateReviewed', '--'), false)}</td>
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

    <div style="margin: 10px 0; line-height: 1.8;">
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>a.</strong> I am a citizen of India</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>b.</strong> I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointment as valuer or three years after the valuation of assets was conducted by me</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>c.</strong> The information furnished in my valuation report dated ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))} is true and correct to the best of my knowledge and belief and I have made an impartial and true valuation of the property</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>d.</strong> We have personally inspected the property on  ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfInspectionOfProperty', 'NA'))} The work is not sub-contracted to any other valuer and carried out by myself.</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>e.</strong> Valuation report is submitted in the format as prescribed by the Bank.</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>f.</strong> I have been duly empanelled/ delisted by any other bank and in case any such de-panelment by other banks during my empanelment with you, I will inform you within 3 days of such de-panelment.</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>g.</strong> I have not been removed/dismissed from service/employment earlier</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>h.</strong> I have not been convicted of any offence and sentenced to a term of imprisonment</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>i.</strong> I have not been found guilty of misconduct in professional capacity</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>j.</strong> I have not been declared to be unsound mind</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>k.</strong> I am not an un-discharged bankrupt, or has not applied to be adjudicated as a bankrupt;</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>l.</strong> I am not an un-discharged insolvent</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>m.</strong> I have not been levied a penalty under section 271J of Income-tax Act, 1961 (43 of 1961) and time limit for filing appeal before Commissioner of Income- tax (Appeals) or Income-tax Appellate Tribunal, as the case may be his expired, or such penalty has been confirmed by Income-tax Appellate Tribunal, and five years have not elapsed after levy of such penalty</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>n.</strong> I have not been convicted of an offence connected with any proceeding under the Income Tax Act 1961, Wealth Tax Act 1957 or Gift Tax Act 1958 and</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>o.</strong> My PAN Card number/Service Tax number as applicable is AELPG1208B</p>
    
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>p.</strong> I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer</p>
     
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>q.</strong> I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure</p>
     
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>r.</strong> I have read the Handbook on Policy, Standards and procedure for Real Estate Valuation, 2011 of the IBA and this report is in conformity to the "Standards" enshrined for valuation in the Part-B of the above handbook to the best of my ability</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>s.</strong> I am registered under Section 34 AB of the Wealth Tax Act, 1957. (Strike off, if not applicable)</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>t.</strong> I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI) (Strike off, if not applicable)</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>u.</strong> My CIBIL Score and credit worthiness is as per Bank's guidelines.</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>v.</strong> I am the proprietor / partner / authorized official of the firm / company, who is competent to sign this valuation report.</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>w.</strong> I will undertake the valuation work on receipt of Letter of Engagement generated from the system (i.e. LLMS/LOS) only.</p>
      <p style="margin: 0; padding-left: 0; line-height: 1.8;"><strong>x.</strong> Further, I hereby provide the following information.</p>
    </div>

    
  </div>
</div>

<!-- PAGE 23: VALUATION DETAILS TABLE -->
<div class="" style=" background: white; width: 100%;" class="">
  <div style="font-size: 12pt; line-height: 1.4;">
    <table style="width: 100%; border-collapse: collapse; margin: 0; border: 1px solid #000; page-break-inside: avoid;">
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%; font-weight: bold;">Sr. No.</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%; font-weight: bold;">Particulars</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%; font-weight: bold;">Valuer comment</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">1</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">background information of the asset being valued;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Referred provided documents</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">2</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">purpose of valuation and appointing authority</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;"><strong>${safeGet(pdfData, 'pdfDetails.valuationHeader.purposeForValuation', '')}</strong></td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">3</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">identity of the valuer and any other experts involved in the valuation;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Self-assessment</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">4</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">disclosure of valuer interest or conflict, if any;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">N.A.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">5</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">date of appointment, valuation date and date of report;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;"><strong>Date of report:${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</p>
      <p style="margin: 4px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block;"> Date of Visit:  ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfInspectionOfProperty', 'NA'))}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">6</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">inspections and/or investigations undertaken;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Yes.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">7</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">nature and sources of the information used or relied upon;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Local inquiries, brokers, known websites, i.e., magicbricks, 99acres, propertywall, proprtiger, housing, etc., if available</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">8</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">procedures adopted in carrying out the valuation and valuation standards followed.</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Land & Building Method, with Market Approach for Land and Cost Approach for Building.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">9</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">restrictions on use of the report, if any;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">As per purpose mentioned in report.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">10</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">major factors that were taken into account during the valuation;</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Location of the property, with developing of surroundings, for going-purpose valuation</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">11</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of limiting his responsibility for the valuation report.</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">Future market events and Government Policies.</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">12</td>
        <td style="border: 1px solid #000; padding: 6px; width: 42%;">Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of limiting his responsibility for the valuation report.</td>
        <td style="border: 1px solid #000; padding: 6px; width: 50%;">We are not responsible for Title of the subjected property and valuations affected by the same</td>
      </tr>
      <tr>
         <td colspan="3" style="border: 1px solid #000; padding: 15px 6px;">
           <div style="">
             <div style="display: flex; justify-content: space-between; align-items: center;">
               <p style="margin: 0; border: none; text-decoration: none;"><strong>Place: ${safeGet(pdfData, 'city') || safeGet(pdfData, 'pdfDetails.city')}</strong></p>
               <p style="margin: 0; font-weight: bold;">Rajesh Ganatra</p>
             </div>
             <p style="margin: 4px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block; border: none; text-decoration: none;"><strong>Date: ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</strong></p>
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
      <p style="margin: 4px 0; font-size: 12pt; background-color: #ffffffff; padding: 4px; display: inline-block;"><strong>Date: ${formatDate(safeGet(pdfData, 'pdfDetails.dateOfValuationReport', 'NA'))}</strong></p></br>
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
export const generateFlatRajesh = generateRecordPDF;

const pdfExportService = {
    generateValuationReportHTML,
    generateRecordPDF,
    generateFlatRajesh,
    previewValuationPDF,
    generateRecordPDFOffline,
    normalizeDataForPDF
};

export default pdfExportService;