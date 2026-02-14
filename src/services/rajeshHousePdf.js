import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to safely get nested values with NA fallback
const safeGet = (obj, path, defaultValue = 'NA') => {
    if (!obj || !path) return defaultValue;

    const value = path.split('.').reduce((acc, part) => {
        if (acc === null || acc === undefined) return null;
        return acc[part];
    }, obj);

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
        const trimmed = value.trim();
        if (!trimmed) return defaultValue;
        const lowerValue = trimmed.toLowerCase();
        if (lowerValue === 'yes') return 'Yes';
        if (lowerValue === 'no') return 'No';
        if (lowerValue === 'na') return 'NA';
        if (lowerValue === 'null') return defaultValue;
        return trimmed;
    }

    // If value is an object, try to extract string representation
    if (typeof value === 'object') {
        // Try common field names for document fields
        if (value.agreementForSaleExecutedName) {
            return value.agreementForSaleExecutedName;
        }
        // For other objects, return NA
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

// Function to add images to PDF (one per page)
const addImagesToPDF = async (doc, imageArrays) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const marginTopBottom = 40;

    // Group images by category with section headings
    const imageGroups = [];

    console.log('🔍 [PDF] Image arrays received:', {
        hasPropertyImages: !!imageArrays.propertyImages,
        hasLocationImages: !!imageArrays.locationImages,
        hasAreaImages: !!imageArrays.areaImages,
        hasSupportingImages: !!imageArrays.supportingImages,
        hasDocumentPreviews: !!imageArrays.documentPreviews,
        areaImagesType: typeof imageArrays.areaImages,
        areaImagesKeys: imageArrays.areaImages ? Object.keys(imageArrays.areaImages) : []
    });

    // Add property images
    if (imageArrays.propertyImages && Array.isArray(imageArrays.propertyImages) && imageArrays.propertyImages.length > 0) {
        console.log('✅ Adding property images:', imageArrays.propertyImages.length);
        imageGroups.push({
            title: 'Property Images',
            images: imageArrays.propertyImages
        });
    }

    // Add location images
    if (imageArrays.locationImages && Array.isArray(imageArrays.locationImages) && imageArrays.locationImages.length > 0) {
        console.log('✅ Adding location images:', imageArrays.locationImages.length);
        imageGroups.push({
            title: 'Location Images',
            images: imageArrays.locationImages
        });
    }

    // Add area images (areaImages is an object with area names as keys and arrays of image objects as values)
    if (imageArrays.areaImages && typeof imageArrays.areaImages === 'object' && !Array.isArray(imageArrays.areaImages)) {
        const areaEntries = Object.entries(imageArrays.areaImages);
        if (areaEntries.length > 0) {
            console.log('✅ Processing area images:', areaEntries.length, 'areas');
            const areaImages = [];
            areaEntries.forEach(([areaName, images]) => {
                // Handle both array of objects and string URL formats
                if (Array.isArray(images)) {
                    console.log(`  - Area "${areaName}" has ${images.length} images`);
                    images.forEach((imgObj, idx) => {
                        if (imgObj && imgObj.url) {
                            console.log(`    - Adding area image ${idx + 1}: ${imgObj.url.substring(0, 50)}...`);
                            areaImages.push({
                                url: imgObj.url,
                                fileName: imgObj.fileName || `Area: ${areaName} #${idx + 1}`
                            });
                        }
                    });
                } else if (typeof images === 'string' && images) {
                    console.log(`  - Adding area image: ${areaName} - ${images.substring(0, 50)}...`);
                    areaImages.push({
                        url: images,
                        fileName: `Area: ${areaName}`
                    });
                }
            });
            if (areaImages.length > 0) {
                imageGroups.push({
                    title: 'Area Images',
                    images: areaImages
                });
            }
        }
    }

    // Add supporting images
    if (imageArrays.supportingImages && Array.isArray(imageArrays.supportingImages) && imageArrays.supportingImages.length > 0) {
        console.log('✅ Adding supporting images:', imageArrays.supportingImages.length);
        imageGroups.push({
            title: 'Supporting Documents',
            images: imageArrays.supportingImages
        });
    }

    // Add document previews
    if (imageArrays.documentPreviews && Array.isArray(imageArrays.documentPreviews) && imageArrays.documentPreviews.length > 0) {
        console.log('✅ Adding document previews:', imageArrays.documentPreviews.length);
        imageGroups.push({
            title: 'Document Previews',
            images: imageArrays.documentPreviews
        });
    }

    let totalImages = imageGroups.reduce((sum, group) => sum + group.images.length, 0);
    console.log(`📊 Total images to display: ${totalImages} across ${imageGroups.length} groups`);
    console.log('📋 Image groups:', imageGroups.map(g => ({ title: g.title, count: g.images.length })));

    if (totalImages === 0) {
        console.warn('⚠️ No images found to display in PDF');
        return;
    }

    // Add images grouped by category with section headings
    for (const group of imageGroups) {
        // Special handling for Area Images - 9 per page (3x3 grid)
        if (group.title === 'Area Images') {
            const imagesPerPage = 9;
            const imagesPerRow = 3;
            const gridMargin = 10;
            const gridCellSize = (pageWidth - gridMargin * 2) / imagesPerRow;
            const imageSize = gridCellSize - 5; // 5mm padding between images

            for (let pageIdx = 0; pageIdx < Math.ceil(group.images.length / imagesPerPage); pageIdx++) {
                doc.addPage();

                // Add section heading at top
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setCharSpace(0); 
                doc.setTextColor(41, 128, 185);
                doc.text(`${group.title} (Page ${pageIdx + 1})`, margin, marginTopBottom + 5);

                let currentY = gridMargin + 12;
                const startIdx = pageIdx * imagesPerPage;
                const endIdx = Math.min(startIdx + imagesPerPage, group.images.length);

                for (let i = startIdx; i < endIdx; i++) {
                    const imageData = group.images[i];
                    const imageUrl = imageData.url;

                    if (!imageUrl) continue;

                    const posInPage = i - startIdx;
                    const row = Math.floor(posInPage / imagesPerRow);
                    const col = posInPage % imagesPerRow;

                    const xPos = gridMargin + col * gridCellSize;
                    const yPos = currentY + row * (gridCellSize + 2);

                    try {
                        // Create img element to get dimensions
                        const img = new Image();
                        img.crossOrigin = 'anonymous';

                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = imageUrl;
                        });

                        // Add image to PDF using canvas conversion
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const imgData = canvas.toDataURL('image/jpeg');

                        doc.addImage(imgData, 'JPEG', xPos, yPos, imageSize, imageSize);

                    } catch (imgError) {
                        console.warn(`Failed to load area image: ${imageUrl}`, imgError);
                    }
                }
            }
        } else {
            // Original single-image-per-page layout for other image types
            for (let i = 0; i < group.images.length; i++) {
                const imageData = group.images[i];
                const imageUrl = imageData.url;

                if (!imageUrl) continue;

                try {
                    // Add new page for each image
                    doc.addPage();

                    // Add section heading
                    doc.setFontSize(14);
                   doc.setFont('helvetica', 'bold');
                   doc.setCharSpace(0); 
                    doc.setTextColor(41, 128, 185);
                    doc.text(group.title, margin, margin + 3);

                    // Add image title/filename
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setCharSpace(0); 
                    doc.setTextColor(0, 0, 0);
                    const filename = imageData.fileName || `Image ${i + 1}`;
                    doc.text(filename, margin, margin + 9);

                    // Calculate dimensions for image
                    const maxWidth = pageWidth - margin * 2;
                    const maxHeight = pageHeight - margin * 3 - 10; // Leave space for title

                    // Try to load and add image
                    try {
                        // Create img element to get dimensions
                        const img = new Image();
                        img.crossOrigin = 'anonymous';

                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = imageUrl;
                        });

                        const imgWidth = img.naturalWidth;
                        const imgHeight = img.naturalHeight;

                        // Calculate scaled dimensions maintaining aspect ratio
                        let scaledWidth = maxWidth;
                        let scaledHeight = (imgHeight / imgWidth) * scaledWidth;

                        if (scaledHeight > maxHeight) {
                            scaledHeight = maxHeight;
                            scaledWidth = (imgWidth / imgHeight) * scaledHeight;
                        }

                        // Center image horizontally
                        const xPos = (pageWidth - scaledWidth) / 2;
                        const yPos = margin + 15;

                        // Add image to PDF using canvas conversion for better compatibility
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const imgData = canvas.toDataURL('image/jpeg');

                        doc.addImage(imgData, 'JPEG', xPos, yPos, scaledWidth, scaledHeight);

                    } catch (imgError) {
                        console.warn(`Failed to load image: ${imageUrl}`, imgError);
                        // Add placeholder text if image fails to load
                        doc.setFontSize(10);
                        doc.text('Image could not be loaded', margin, margin + 20);
                    }

                } catch (error) {
                    console.error(`Error adding image ${i + 1}:`, error);
                }
            }
        }
    }
};

// Function to add spreadsheet data to PDF
const addSpreadsheetToPDF = (doc, spreadsheetData, startY = 30) => {
    if (!spreadsheetData || !spreadsheetData.rows || spreadsheetData.rows.length === 0) {
        return startY;
    }

    let currentY = startY;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const marginTopBottom = 40;

    // Add title for spreadsheet section (DISABLED)
    // doc.setFontSize(14);
    // doc.setFont(undefined, 'bold');
    // doc.text('Spreadsheet Data', margin, currentY);
    // currentY += 10;

    // First, build map of merged cells to exclude from column detection
    const mergedCellColumns = new Set();
    if (spreadsheetData.mergedCells) {
        spreadsheetData.mergedCells.forEach(merge => {
            // Mark columns that are part of a merge (not the origin column)
            for (let c = merge.col + 1; c < merge.col + merge.colspan; c++) {
                mergedCellColumns.add(c);
            }
        });
    }

    // Find all columns that have data (excluding first 2 which are S.No and Field Name)
    const columnHasData = {};
    let maxColIndex = 0;

    spreadsheetData.rows.forEach((row, rowIndex) => {
        if (!row) return;
        let rowData = [];
        if (Array.isArray(row)) {
            rowData = row;
        } else if (typeof row === 'object') {
            rowData = Object.values(row);
        }

        rowData.forEach((val, idx) => {
            // Skip first 2 columns (S.No and Field Name), check all others for data
            if (idx >= 2) {
                if (val !== null && val !== undefined && val !== '') {
                    columnHasData[idx] = true;
                    maxColIndex = Math.max(maxColIndex, idx);
                }
            }
        });
    });

    // Get list of columns that have data (sorted), starting from column index 2
    const dataColumnIndices = Object.keys(columnHasData).map(Number).sort((a, b) => a - b);

    // Dynamic columns based on data (S.No, Field Name, + actual data columns)
    const totalColumns = dataColumnIndices.length + 2;
    const valueColumns = totalColumns - 2;

    // Get merged cells info
    const mergedCells = spreadsheetData.mergedCells || [];

    // Get cell styles info
    const cellStyles = {};
    if (spreadsheetData.cellStyles && Array.isArray(spreadsheetData.cellStyles)) {
        spreadsheetData.cellStyles.forEach(({ key, style }) => {
            cellStyles[key] = style;
        });
    }

    // Build map of which rows are covered by vertical merges in each column
    const coveredCells = {}; // key: "row,col", value: merge info
    mergedCells.forEach(merge => {
        for (let r = merge.row + 1; r < merge.row + merge.rowspan; r++) {
            for (let c = merge.col; c < merge.col + merge.colspan; c++) {
                coveredCells[`${r},${c}`] = merge;
            }
        }
    });

    // Build a map of which cells are merge origins
    const mergeOrigins = {};
    mergedCells.forEach(merge => {
        mergeOrigins[`${merge.row},${merge.col}`] = merge;
    });

    // Prepare table data
    const tableRows = [];

    // 🔥 Text cleaning function (VERY IMPORTANT)
    const cleanText = (text) => {
        return String(text || '')
            .replace(/\u00A0/g, ' ')
            .replace(/[\u2000-\u200F]/g, '')
            .replace(/[\u202A-\u202E]/g, '')
            .replace(/[\u00B9\u00B2\u00B3]/g, '')
            .replace(/[^\x20-\x7E]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    spreadsheetData.rows.forEach((row, rowIndex) => {
        if (!row) return;

        // Handle both array and object formats
        let rowData = [];
        if (Array.isArray(row)) {
            rowData = row;
        } else if (typeof row === 'object') {
            rowData = Object.values(row);
        } else {
            return;
        }

        // First column is S.No, second is Field Name, rest are values
        const sNo = cleanText(rowData[0]);
        const fieldName = cleanText(rowData[1]);

        // Skip row only if all columns are empty (including S.No and Field Name)
        const hasAnyData = rowData.some(val => val !== null && val !== undefined && val !== '');
        if (!hasAnyData) return;

        // Check if S.No and Field Name are covered by merges
        const sNoCovered = coveredCells[`${rowIndex},0`];
        const fieldNameCovered = coveredCells[`${rowIndex},1`];
        
        // Check if current row is a merge origin for the first 2 columns
        const sNoMerge = mergeOrigins[`${rowIndex},0`];
        const fieldNameMerge = mergeOrigins[`${rowIndex},1`];

        // Get values starting from index 2, for all columns up to dataColumnIndices
        const valueData = [];
        let lastNonEmptyIndex = -1;
        
        // Find the max column index to process
        const maxColIndex = Math.max(...dataColumnIndices, 0);
        
        // When merging across S.No and Field Name, combine their values if both exist
        let mergedFirstColValue = '';
        if ((sNoMerge || fieldNameMerge) && (sNo || fieldName)) {
            // If either is merged, combine the values for display
            mergedFirstColValue = [sNo, fieldName].filter(v => v).join(' - ');
        }
        
        for (let colIdx = 0; colIdx <= maxColIndex; colIdx++) {
            const val = rowData[colIdx + 2]; // +2 because first 2 cols are S.No and Field Name
            let cellValue = '';
            
            if (val !== null && val !== undefined && val !== '') {
                if (typeof val === 'object') {
                    cellValue = JSON.stringify(val);
                } else {
                    // Clean the value using cleanText function
                    cellValue = cleanText(val);
                }
            }
            
            valueData.push(cellValue);
            
            if (cellValue !== '') {
                lastNonEmptyIndex = valueData.length - 1;
            }
        }

        // Use the actual last data index found
        const lastDataIndex = lastNonEmptyIndex;

        // Helper function to get cell styles with formatting applied
        const getCellStyles = (rowIdx, colIdx, baseStyles) => {
            const styleKey = `${rowIdx},${colIdx}`;
            const cellFormat = cellStyles[styleKey] || {};
            const styles = { ...baseStyles };

            // Apply formatting from cellFormat
            if (cellFormat.bold) {
                styles.fontStyle = styles.fontStyle === 'italic' ? 'bolditalic' : 'bold';
            }
            if (cellFormat.italic) {
                styles.fontStyle = styles.fontStyle === 'bold' ? 'bolditalic' : 'italic';
            }
            if (cellFormat.underline) {
                // jsPDF doesn't have native underline, so we'll add it in didDrawCell
                styles._hasUnderline = true;
            }
            if (cellFormat.fontSize) {
                styles.fontSize = parseInt(cellFormat.fontSize);
            }

            return styles;
        };

        // Create row cells
        let rowCells = [];
        
        // Check if both S.No and Field Name are being merged together
        const bothMerged = sNoMerge && sNoMerge.colspan >= 2 && sNoMerge.col === 0;
        
        if (bothMerged) {
            // Single merged cell spanning both columns
            rowCells.push({
                content: !sNoCovered ? (mergedFirstColValue || sNo || fieldName) : '',
                rowSpan: sNoMerge.rowspan,
                colSpan: sNoMerge.colspan,
                styles: getCellStyles(rowIndex, 0, {
                    fontSize: 9,
                    cellPadding: 4,
                    halign: 'left',
                    valign: 'top',
                    fillColor: [255, 255, 255],
                    fontStyle: 'bold',
                    overflow: 'linebreak',
                    lineWidth: 0.3
                })
            });
        } else {
            // Original logic for separate S.No and Field Name cells
            rowCells.push({
                content: !sNoCovered ? sNo : '',
                ...(sNoMerge && { rowSpan: sNoMerge.rowspan, colSpan: sNoMerge.colspan }),
                styles: getCellStyles(rowIndex, 0, {
                    fontSize: 9,
                    cellPadding: 4,
                    halign: 'center',
                    valign: 'top',
                    fillColor: [255, 255, 255],
                    fontStyle: 'bold',
                    lineWidth: 0.3
                })
            });
            
            rowCells.push({
                content: !fieldNameCovered ? fieldName : '',
                ...(fieldNameMerge && { rowSpan: fieldNameMerge.rowspan, colSpan: fieldNameMerge.colspan }),
                styles: getCellStyles(rowIndex, 1, {
                    fontSize: 9,
                    cellPadding: 4,
                    halign: 'left',
                    valign: 'top',
                    fillColor: [255, 255, 255],
                    fontStyle: 'bold',
                    overflow: 'linebreak',
                    lineWidth: 0.3
                })
            });
        }

        // Add value cells up to last data cell (if any data exists)
        if (lastDataIndex >= 0) {
            for (let colOffset = 0; colOffset <= lastDataIndex; colOffset++) {
                if (colOffset >= valueData.length) break;
                
                const val = valueData[colOffset] || '';
                const colIndex = colOffset + 2;
                const isValueCovered = coveredCells[`${rowIndex},${colIndex}`];
                const valueMerge = mergeOrigins[`${rowIndex},${colIndex}`];

                // Calculate colspan: limit to valueColumns (don't exceed available columns)
                let colspan = 1;
                if (colOffset === lastDataIndex && lastDataIndex < valueColumns - 1) {
                    colspan = valueColumns - lastDataIndex;
                }

                const cellConfig = {
                    content: !isValueCovered ? val : '',
                    styles: getCellStyles(rowIndex, colIndex, {
                        fontSize: 9,
                        cellPadding: 4,
                        halign: 'left',
                        valign: 'top',
                        fillColor: [255, 255, 255],
                        fontStyle: 'normal',
                        overflow: 'linebreak',
                        lineWidth: 0.3
                    })
                };

                // Apply merge or colspan
                if (valueMerge) {
                    // Limit merged colspan to valueColumns to prevent extra columns
                    cellConfig.rowSpan = valueMerge.rowspan;
                    cellConfig.colSpan = Math.min(valueMerge.colspan, valueColumns);
                } else if (colspan > 1) {
                    cellConfig.colSpan = colspan;
                }

                rowCells.push(cellConfig);
            }
        } else {
            // No value data, but row has S.No or Field Name - add one spanning empty cell
            rowCells.push({
                content: '',
                colSpan: valueColumns,
                styles: getCellStyles(rowIndex, 2, {
                    fontSize: 9,
                    cellPadding: 4,
                    halign: 'left',
                    valign: 'top',
                    fillColor: [255, 255, 255],
                    overflow: 'linebreak',
                    lineWidth: 0.3
                })
            });
        }

        tableRows.push(rowCells);
    });

    if (tableRows.length === 0) {
        doc.setFontSize(10);
        doc.text('No data available', margin, currentY);
        return currentY + 10;
    }

    // Create table header with 8 columns
    const headerCells = [
        {
            content: 'S.No',
            styles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 10,
                cellPadding: 5
            }
        },
        {
            content: 'Field Name',
            styles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'left',
                fontSize: 10,
                cellPadding: 5
            }
        },
        {
            content: 'Values',
            colSpan: valueColumns,
            styles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 10,
                cellPadding: 5
            }
        }
    ];

    // Column widths for 8 columns
    const columnStyles = {};
    columnStyles[0] = { cellWidth: 15 }; // S.No
    columnStyles[1] = { cellWidth: 50 };

    // Distribute remaining width among value columns
    const remainingWidth = pageWidth - margin * 2 - 15 - 50;
    const valueColWidth = remainingWidth / valueColumns;
    for (let i = 0; i < valueColumns; i++) {
        columnStyles[i + 2] = { cellWidth: valueColWidth, overflow: 'linebreak' };
    }

    // Track cell positions for merged regions
    const mergeCellPositions = {};

    // Create table
    doc.autoTable({
        head: [],
        body: tableRows,
        startY: currentY,
        margin: { top: marginTopBottom, right: margin, bottom: marginTopBottom, left: margin },
        pageBreak: 'auto',
        pageBreakAvoidWidows: true,
        repeatTableHeader: false,
        columnStyles: columnStyles,
        styles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 9,
            cellPadding: 4,
            lineColor: [0, 0, 0],
            lineWidth: 0.3,
            overflow: 'linebreak',
            charSpace: 0
        },
        bodyStyles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.3
        },
        headStyles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.3
        },
        didDrawCell: (data) => {
            const rowIndex = data.rowIndex - 1;
            const cell = data.cell;

            if (rowIndex >= 0) {
                const cellKey = `${rowIndex},${data.column.index}`;

                // For covered cells: fill with white to hide content from merged cells
                if (coveredCells[cellKey]) {
                    doc.setFillColor(255, 255, 255);
                    doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
                }

                // Apply underline if needed
                const styleKey = `${rowIndex},${data.column.index}`;
                const cellFormat = cellStyles[styleKey];

                if (cellFormat && cellFormat.underline && cell.text && cell.text.length > 0) {
                    const textContent = Array.isArray(cell.text) ? cell.text.join(' ') : String(cell.text);

                    // Save current state
                    const prevDrawColor = doc._drawColor;
                    const prevLineWidth = doc.getLineWidth();

                    // Calculate text dimensions
                    doc.setFont('helvetica', cell.styles.fontStyle || 'normal');
                    doc.setCharSpace(0);   // ensure no spacing applied

                    doc.setFontSize(cell.styles.fontSize || 9);
                    const textWidth = doc.getTextWidth(textContent);

                    // Position underline below text baseline (with small offset)
                    const cellPadding = cell.styles.cellPadding || 4;
                    const textX = cell.x + cellPadding;
                    const textBaseline = cell.y + cellPadding + (doc.getLineHeight() * 0.75); // Approximate baseline
                    const underlineY = textBaseline + 1;

                    // Draw the underline
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    doc.line(textX, underlineY, textX + textWidth, underlineY);
                }

                // Track cells that are part of merges
                for (let merge of mergedCells) {
                    if (merge.row === rowIndex && data.column.index === merge.col) {
                        const mergeKey = `${merge.row},${merge.col}`;
                        if (!mergeCellPositions[mergeKey]) {
                            mergeCellPositions[mergeKey] = {
                                x: cell.x,
                                y: cell.y,
                                width: cell.width,
                                height: cell.height,
                                rowspan: merge.rowspan,
                                colspan: merge.colspan || 1,
                                startRow: merge.row,
                                colIndex: data.column.index
                            };
                        }
                    } else if (merge.row <= rowIndex && rowIndex < merge.row + merge.rowspan && data.column.index === merge.col) {
                        // Track the last row of the merge
                        const mergeKey = `${merge.row},${merge.col}`;
                        if (mergeCellPositions[mergeKey]) {
                            mergeCellPositions[mergeKey].lastRowY = cell.y;
                            mergeCellPositions[mergeKey].lastRowHeight = cell.height;
                        }
                    }
                }
            }
        },
        didDrawTable: (data) => {
            // Draw borders for merged cells after table is complete
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);

            // Redraw merged cell borders to ensure complete coverage
            Object.values(mergeCellPositions).forEach(merge => {
                if (merge.lastRowY !== undefined && merge.lastRowHeight) {
                    const totalHeight = (merge.lastRowY + merge.lastRowHeight) - merge.y;
                    // Use rect to draw a complete box around the merged cell
                    doc.rect(merge.x, merge.y, merge.width, totalHeight);
                }
            });
        }
    });

    return doc.lastAutoTable.finalY + 10;
};

// Main PDF generation function
const generateRajeshHousePDF = async (data) => {
    try {
        if (!data) {
            console.error('No data provided for PDF generation');
            return null;
        }

       // Create PDF document 
const doc = new jsPDF('p', 'mm', 'A4');

const pageWidth = doc.internal.pageSize.width;
const pageHeight = doc.internal.pageSize.height;
const margin = 10;
const marginTopBottom = 40;
let currentY = marginTopBottom;

// ✅ Set default font properly
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);

// ✅ VERY IMPORTANT – Fix extra letter spacing issue
doc.setCharSpace(0);

// ✅ Improve text rendering stability
doc.setLineHeightFactor(1.15);

// ✅ Reset text rendering mode (prevents hidden spacing bugs)
doc.setTextColor(0, 0, 0);
doc.setDrawColor(0, 0, 0);
doc.setFillColor(255, 255, 255);

// ===== TITLE SECTION =====
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.setTextColor(41, 128, 185);
doc.text('VALUATION REPORT', pageWidth / 2, 45, { align: 'center' });
doc.setTextColor(0, 0, 0);
doc.setFont('helvetica', 'normal');
currentY = 50;

         // ===== SPREADSHEET DATA SECTION =====
        if (data.spreadsheetData && data.spreadsheetData.rows && data.spreadsheetData.rows.length > 0) {
            currentY = addSpreadsheetToPDF(doc, data.spreadsheetData, currentY);
        }

        // ===== IMAGES SECTION (One per page) =====
        const imageCollections = {
            propertyImages: data.propertyImages || [],
            locationImages: data.locationImages || [],
            areaImages: data.areaImages || {},
            supportingImages: data.supportingImages || [],
            documentPreviews: data.documentPreviews || []
        };

        console.log('📋 [generateRajeshHousePDF] Data received:', {
            hasData: !!data,
            propertyImageCount: data.propertyImages ? data.propertyImages.length : 0,
            locationImageCount: data.locationImages ? data.locationImages.length : 0,
            hasAreaImages: !!data.areaImages,
            areaImagesType: typeof data.areaImages,
            areaImagesKeys: data.areaImages ? Object.keys(data.areaImages) : [],
            supportingImageCount: data.supportingImages ? data.supportingImages.length : 0,
            documentPreviewCount: data.documentPreviews ? data.documentPreviews.length : 0,
            allKeys: Object.keys(data).filter(k => k.includes('image') || k.includes('document') || k.includes('preview'))
        });

        await addImagesToPDF(doc, imageCollections);



        // ===== GENERATE DOWNLOAD =====
        const filename = `Rajesh_House_Valuation_${data.uniqueId || 'Report'}.pdf`;
        doc.save(filename);

        console.log('✅ PDF generated successfully:', filename);
        return filename;

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        throw error;
    }
};

export { safeGet, getChecklistValue, generateRajeshHousePDF, addImagesToPDF };  