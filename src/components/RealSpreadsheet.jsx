import React, { useEffect, useRef, useState, useCallback } from "react";
import Handsontable from "handsontable";
// Suppress Handsontable deprecation warnings
import "handsontable/dist/handsontable.full.min.css";
Handsontable.licenseKey = 'non-commercial-and-evaluation';

const RealSpreadsheet = ({ initialData = null, onDataChange = null }) => {
    const containerRef = useRef(null);
    const hotRef = useRef(null);
    const suppressChangeRef = useRef(false);
    const isFormulaEditingRef = useRef(false);
    const wrapStateRef = useRef(new Map()); // Persistent wrap state: "row,col" -> true
    const validationRulesRef = useRef(new Map()); // Data validation rules: "row,col" -> {type, criteria, values}
    const undoStackRef = useRef([]); // Undo stack for Ctrl+Z functionality
    const redoStackRef = useRef([]); // Redo stack for Ctrl+Y functionality

    // Data validation dialog state
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [validationType, setValidationType] = useState('any');
    const [validationCriteria, setValidationCriteria] = useState('between');
    const [validationMin, setValidationMin] = useState('');
    const [validationMax, setValidationMax] = useState('');
    const [validationList, setValidationList] = useState('');
    const [validationMessage, setValidationMessage] = useState('');
    const [validationErrorTitle, setValidationErrorTitle] = useState('');
    const [validationErrorMessage, setValidationErrorMessage] = useState('');
    const [ignoreBlank, setIgnoreBlank] = useState(true);
    const [applyToAll, setApplyToAll] = useState(false);

    // Generate 1000 rows × 26 columns (A-Z)
    // Ensure we always have a valid 1000x26 grid, even if initialData is empty or malformed
    const getInitialData = () => {
        const defaultGrid = Array.from({ length: 600 }, () => Array(26).fill(""));

        // If no initial data, return default grid
        if (!initialData) return defaultGrid;

        // If initialData has rows and it's a non-empty 2D array
        if (initialData.rows && Array.isArray(initialData.rows) && initialData.rows.length > 0) {
            // Ensure each row has exactly 26 columns
            return initialData.rows.map(row => {
                if (!Array.isArray(row)) return Array(26).fill("");
                // Pad row to 26 columns if needed
                const paddedRow = [...row];
                while (paddedRow.length < 26) paddedRow.push("");
                return paddedRow.slice(0, 26);
            });
        }

        // If initialData is a 2D array directly (backward compatibility)
        if (Array.isArray(initialData) && initialData.length > 0) {
            return initialData.map(row => {
                if (!Array.isArray(row)) return Array(26).fill("");
                const paddedRow = [...row];
                while (paddedRow.length < 26) paddedRow.push("");
                return paddedRow.slice(0, 26);
            });
        }

        // Default: return empty 100x26 grid
        return defaultGrid;
    };

    // Restore wrap state from initialData
    const restoreWrapState = () => {
        if (initialData && initialData.wrapState && Array.isArray(initialData.wrapState)) {
            ('Restoring wrapState:', initialData.wrapState);
            wrapStateRef.current.clear();
            initialData.wrapState.forEach(key => {
                wrapStateRef.current.set(key, true);
            });
        } else {
            ('No wrapState in initialData:', initialData);
        }
    };

    // Restore validation rules from initialData
    const restoreValidationRules = () => {
        if (initialData && initialData.validationRules && Array.isArray(initialData.validationRules)) {
            ('Restoring validationRules:', initialData.validationRules);
            validationRulesRef.current.clear();
            initialData.validationRules.forEach(({ key, rule }) => {
                validationRulesRef.current.set(key, rule);

                // Apply editor metadata for list-type validations
                if (hotRef.current && hotRef.current.isDestroyed === false && rule.type === 'list' && rule.listItems && rule.listItems.length > 0) {
                    try {
                        const [row, col] = key.split(',').map(Number);
                        if (!isNaN(row) && !isNaN(col)) {
                            hotRef.current.setCellMeta(row, col, 'type', 'dropdown');
                            hotRef.current.setCellMeta(row, col, 'source', rule.listItems);
                            hotRef.current.setCellMeta(row, col, 'strict', false);

                            // Set first list item as default if cell is empty
                            const currentValue = hotRef.current.getDataAtCell(row, col);
                            if (!currentValue || currentValue.trim() === '') {
                                hotRef.current.setDataAtCell(row, col, rule.listItems[0]);
                            }
                        }
                    } catch (e) {
                        console.error('Error restoring validation editor:', e);
                    }
                }
            });
        } else {
            ('No validationRules in initialData');
        }
    };

    // Restore cell styles from initialData
    const restoreCellStyles = () => {
        if (initialData && initialData.cellStyles && Array.isArray(initialData.cellStyles)) {
            ('Restoring cellStyles:', initialData.cellStyles);
            cellStylesRef.current.clear();
            initialData.cellStyles.forEach(({ key, style }) => {
                cellStylesRef.current.set(key, style);
            });
        } else {
            ('No cellStyles in initialData');
        }
    };

    const getInitialMergedCells = () => {
        if (initialData && initialData.mergedCells && Array.isArray(initialData.mergedCells)) {
            return initialData.mergedCells;
        }
        return [];
    };

    // Restore undo/redo history from initialData
    const restoreUndoRedoHistory = () => {
        if (initialData && initialData.undoStack && Array.isArray(initialData.undoStack)) {
            undoStackRef.current = JSON.parse(JSON.stringify(initialData.undoStack));
            console.log('Restored undo stack:', undoStackRef.current.length, 'items');
        }
        if (initialData && initialData.redoStack && Array.isArray(initialData.redoStack)) {
            redoStackRef.current = JSON.parse(JSON.stringify(initialData.redoStack));
            console.log('Restored redo stack:', redoStackRef.current.length, 'items');
        }
    };

    const [data, setData] = useState(getInitialData());
    const [mergedCells] = useState(getInitialMergedCells());
    const [selectedRange, setSelectedRange] = useState(null);
    const [fontSize, setFontSize] = useState('12');
    const [undoRedoTrigger, setUndoRedoTrigger] = useState(0); // Force button re-render on undo/redo
    const cellStylesRef = useRef(new Map()); // Stores cell formatting: "row,col" -> {bold, italic, underline, fontSize}

    // Convert number to words (Indo-English format)
    const numberToWords = (num) => {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

        if (num === 0) return 'zero';
        if (num < 0) return 'minus ' + numberToWords(-num);

        function convertHundreds(n) {
            let result = '';
            if (Math.floor(n / 100) > 0) {
                result += ones[Math.floor(n / 100)] + ' hundred';
            }
            n %= 100;
            if (n >= 20) {
                result += (result ? ' ' : '') + tens[Math.floor(n / 10)];
                if (n % 10 > 0) {
                    result += ' ' + ones[n % 10];
                }
            } else if (n >= 10) {
                result += (result ? ' ' : '') + teens[n - 10];
            } else if (n > 0) {
                result += (result ? ' ' : '') + ones[n];
            }
            return result;
        }

        let words = [];
        let scaleIndex = 0;

        while (num > 0) {
            const chunk = num % 1000;
            if (chunk !== 0) {
                let part = convertHundreds(chunk);
                if (scales[scaleIndex]) {
                    part += ' ' + scales[scaleIndex];
                }
                words.unshift(part);
            }
            num = Math.floor(num / 1000);
            scaleIndex++;
        }

        return words.join(' ').trim();
    };

    // Undo/Redo helper functions
    const saveToUndoStack = useCallback(() => {
        if (hotRef.current && hotRef.current.isDestroyed === false) {
            try {
                const currentData = hotRef.current.getData();
                const dataCopy = JSON.parse(JSON.stringify(currentData));
                undoStackRef.current.push(dataCopy);
                // Limit undo stack to 50 items
                if (undoStackRef.current.length > 50) {
                    undoStackRef.current.shift();
                }
                redoStackRef.current = []; // Clear redo stack on new action
                console.log('✅ Saved to undo stack. Stack size:', undoStackRef.current.length);
            } catch (e) {
                console.error('❌ Error saving to undo stack:', e);
            }
        }
    }, []);

    const undo = useCallback(() => {
        if (hotRef.current && hotRef.current.isDestroyed === false && undoStackRef.current.length > 0) {
            try {
                const currentData = hotRef.current.getData();
                const currentDataCopy = JSON.parse(JSON.stringify(currentData));
                redoStackRef.current.push(currentDataCopy);

                const previousData = undoStackRef.current.pop();
                console.log('✅ Undo triggered. Restoring previous state. Undo stack:', undoStackRef.current.length);

                suppressChangeRef.current = true;
                if (!hotRef.current.isDestroyed) {
                    hotRef.current.loadData(previousData);
                    try {
                        hotRef.current.render();
                    } catch (e) {
                        // Silently ignore render errors
                    }
                }
                suppressChangeRef.current = false;

                // Force state update to trigger button re-render
                setData(JSON.parse(JSON.stringify(previousData)));
                setUndoRedoTrigger(prev => prev + 1); // Trigger button re-render

                if (onDataChange) {
                    onDataChange({
                        rows: previousData,
                        mergedCells: mergedCells,
                        wrapState: Array.from(wrapStateRef.current.keys()),
                        validationRules: Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule })),
                        cellStyles: Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style })),
                        undoStack: undoStackRef.current,
                        redoStack: redoStackRef.current
                    });
                }
            } catch (e) {
                console.error('❌ Error during undo:', e);
            }
        } else {
            console.log('⚠️ Cannot undo: no history available');
        }
    }, [onDataChange, mergedCells]);

    const redo = useCallback(() => {
        if (hotRef.current && hotRef.current.isDestroyed === false && redoStackRef.current.length > 0) {
            try {
                const currentData = hotRef.current.getData();
                const currentDataCopy = JSON.parse(JSON.stringify(currentData));
                undoStackRef.current.push(currentDataCopy);

                const nextData = redoStackRef.current.pop();
                console.log('✅ Redo triggered. Restoring next state. Redo stack:', redoStackRef.current.length);

                suppressChangeRef.current = true;
                if (!hotRef.current.isDestroyed) {
                    hotRef.current.loadData(nextData);
                    try {
                        hotRef.current.render();
                    } catch (e) {
                        // Silently ignore render errors
                    }
                }
                suppressChangeRef.current = false;

                // Force state update to trigger button re-render
                setData(JSON.parse(JSON.stringify(nextData)));
                setUndoRedoTrigger(prev => prev + 1); // Trigger button re-render

                if (onDataChange) {
                    onDataChange({
                        rows: nextData,
                        mergedCells: mergedCells,
                        wrapState: Array.from(wrapStateRef.current.keys()),
                        validationRules: Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule })),
                        cellStyles: Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style })),
                        undoStack: undoStackRef.current,
                        redoStack: redoStackRef.current
                    });
                }
            } catch (e) {
                console.error('❌ Error during redo:', e);
            }
        } else {
            console.log('⚠️ Cannot redo: no history available');
        }
    }, [onDataChange, mergedCells]);

    // Update data when initialData changes
    useEffect(() => {
        const newData = getInitialData();
        setData(newData);

        // Restore wrap state, merged cells, validation rules, cell styles, and undo/redo history
        restoreWrapState();
        restoreValidationRules();
        restoreCellStyles();
        restoreUndoRedoHistory();

        // Only update Handsontable if it exists and is not destroyed
        if (hotRef.current && hotRef.current.isDestroyed === false && newData && newData.length > 0) {
            try {
                suppressChangeRef.current = true;

                // Only reload data if it has actually changed (not just initialData metadata)
                const currentData = hotRef.current.getData();
                const dataChanged = JSON.stringify(currentData) !== JSON.stringify(newData);
                if (dataChanged) {
                    hotRef.current.loadData(newData);
                }

                // Restore wrap state in cell metadata
                if (initialData && initialData.wrapState && Array.isArray(initialData.wrapState)) {
                    initialData.wrapState.forEach(key => {
                        const [row, col] = key.split(',').map(Number);
                        if (!isNaN(row) && !isNaN(col)) {
                            hotRef.current.setCellMeta(row, col, 'wrap', true);
                        }
                    });
                }

                // Restore wrap state, cell styles, and validation rules with rendering
                if (initialData && (initialData.wrapState || initialData.cellStyles || initialData.validationRules)) {
                    setTimeout(() => {
                        // Do NOT restore merged cells here - let Handsontable manage them automatically

                        // Restore validation rules with dropdown editors
                        if (initialData && initialData.validationRules && Array.isArray(initialData.validationRules)) {
                            initialData.validationRules.forEach(({ key, rule }) => {
                                if (rule.type === 'list' && rule.listItems && rule.listItems.length > 0) {
                                    try {
                                        const [row, col] = key.split(',').map(Number);
                                        if (!isNaN(row) && !isNaN(col)) {
                                            hotRef.current.setCellMeta(row, col, 'type', 'dropdown');
                                            hotRef.current.setCellMeta(row, col, 'source', rule.listItems);
                                            hotRef.current.setCellMeta(row, col, 'strict', false);
                                        }
                                    } catch (e) {
                                        // Silently ignore
                                    }
                                }
                            });
                        }

                        // Recalculate heights for wrapped rows
                        if (initialData && initialData.wrapState && Array.isArray(initialData.wrapState) && initialData.wrapState.length > 0) {
                            try {
                                const wrappedRows = new Set();
                                initialData.wrapState.forEach(key => {
                                    const [row] = key.split(',').map(Number);
                                    if (!isNaN(row)) {
                                        wrappedRows.add(row);
                                    }
                                });

                                if (hotRef.current && hotRef.current.isDestroyed === false) {
                                    wrappedRows.forEach(row => {
                                        const cells = hotRef.current.getDataAtRow(row);
                                        if (cells && cells.length > 0) {
                                            let maxHeight = 25;
                                            const colWidths = hotRef.current.getSettings().colWidths || [];

                                            cells.forEach((cellValue, col) => {
                                                if (cellValue && String(cellValue).length > 0) {
                                                    const colWidth = colWidths[col] || 100;
                                                    const charWidth = colWidth / 10;
                                                    const textLength = String(cellValue).length;
                                                    const estimatedLines = Math.ceil(textLength / charWidth);
                                                    const estimatedHeight = Math.max(25, estimatedLines * 18 + 8);
                                                    maxHeight = Math.max(maxHeight, estimatedHeight);
                                                }
                                            });

                                            hotRef.current.setRowHeight(row, maxHeight);
                                        }
                                    });
                                }
                            } catch (e) {
                                // Silently ignore
                            }
                        }

                        // Final render
                        if (hotRef.current && !hotRef.current.isDestroyed) {
                            try {
                                hotRef.current.render();
                            } catch (e) {
                                // Silently ignore render errors
                            }
                        }
                        suppressChangeRef.current = false;
                    }, 50);
                } else {
                    suppressChangeRef.current = false;
                }
            } catch (error) {
                // Silently ignore if table is being destroyed or is destroyed
                suppressChangeRef.current = false;
            }
        }
    }, [initialData]);

    // Generate column headers A-Z
    const generateColumnHeaders = () => {
        const headers = [];
        for (let i = 0; i < 26; i++) {
            headers.push(String.fromCharCode(65 + i)); // A, B, C, ... Z
        }
        return headers;
    };

    // Helper function to convert column index to letter (0 = A, 1 = B, etc.)
    const colIndexToLetter = (index) => {
        return String.fromCharCode(65 + index);
    };

    // Helper function to get cell address (e.g., A1, B5)
    const getCellAddress = (row, col) => {
        return colIndexToLetter(col) + (row + 1);
    };

    // Helper function to get merged cells from the merge plugin and convert to plain objects
    const getCurrentMergedCells = (hot) => {
        try {
            if (!hot || hot.isDestroyed) return [];
            const mergePlugin = hot.getPlugin('mergeCells');
            if (!mergePlugin || !mergePlugin.mergedCellsCollection || !mergePlugin.mergedCellsCollection.mergedCells) {
                return [];
            }
            // Convert internal objects to plain objects
            return mergePlugin.mergedCellsCollection.mergedCells.map(m => ({
                row: m.row,
                col: m.col,
                rowspan: m.rowspan,
                colspan: m.colspan
            }));
        } catch (error) {
            return [];
        }
    };

    // Apply formatting to selected cells
    const applyFormatting = (formatType) => {
        if (!selectedRange || !hotRef.current) return;

        const { row: startRow, col: startCol, row2: endRow, col2: endCol } = selectedRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const key = `${r},${c}`;
                const currentStyle = cellStylesRef.current.get(key) || {};

                if (formatType === 'bold') {
                    currentStyle.bold = !currentStyle.bold;
                } else if (formatType === 'italic') {
                    currentStyle.italic = !currentStyle.italic;
                } else if (formatType === 'underline') {
                    currentStyle.underline = !currentStyle.underline;
                } else if (formatType.startsWith('fontSize')) {
                    currentStyle.fontSize = formatType.split('-')[1];
                }

                cellStylesRef.current.set(key, currentStyle);
            }
        }

        if (hotRef.current && !hotRef.current.isDestroyed) {
            try {
                hotRef.current.render();
            } catch (e) {
                // Silently ignore render errors
            }
        }

        // Trigger onDataChange to save formatting changes
        if (hotRef.current) {
            const currentData = hotRef.current.getData();
            const currentMergedCells = getCurrentMergedCells(hotRef.current);
            const wrapStateArray = Array.from(wrapStateRef.current.keys());
            const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
            const cellStylesArray = Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style }));

            if (onDataChange) {
                onDataChange({
                    rows: currentData,
                    mergedCells: currentMergedCells,
                    wrapState: wrapStateArray,
                    validationRules: validationRulesArray,
                    cellStyles: cellStylesArray,
                    undoStack: undoStackRef.current,
                    redoStack: redoStackRef.current
                });
            }
        }
    };

    // Data validation helper functions
    const validateCellValue = (value, rule) => {
        if (!rule) return true;

        // Allow blank if ignored
        if ((value === '' || value === null) && rule.ignoreBlank) return true;

        const val = parseFloat(value);

        switch (rule.type) {
            case 'any':
                return true;
            case 'whole':
            case 'decimal':
                if (isNaN(val)) return false;
                switch (rule.criteria) {
                    case 'between':
                        return val >= parseFloat(rule.min) && val <= parseFloat(rule.max);
                    case 'notBetween':
                        return val < parseFloat(rule.min) || val > parseFloat(rule.max);
                    case 'equal':
                        return val === parseFloat(rule.min);
                    case 'notEqual':
                        return val !== parseFloat(rule.min);
                    case 'greaterThan':
                        return val > parseFloat(rule.min);
                    case 'lessThan':
                        return val < parseFloat(rule.min);
                    case 'greaterOrEqual':
                        return val >= parseFloat(rule.min);
                    case 'lessOrEqual':
                        return val <= parseFloat(rule.min);
                    default:
                        return true;
                }
            case 'list':
                const listItems = rule.listItems || [];
                return listItems.includes(String(value).trim());
            case 'text':
                const textValue = String(value).toLowerCase();
                switch (rule.criteria) {
                    case 'equal':
                        return textValue === rule.min.toLowerCase();
                    case 'notEqual':
                        return textValue !== rule.min.toLowerCase();
                    case 'contains':
                        return textValue.includes(rule.min.toLowerCase());
                    case 'notContains':
                        return !textValue.includes(rule.min.toLowerCase());
                    case 'beginsWith':
                        return textValue.startsWith(rule.min.toLowerCase());
                    case 'endsWith':
                        return textValue.endsWith(rule.min.toLowerCase());
                    default:
                        return true;
                }
            case 'date':
                // Simple date validation - can be extended
                return !isNaN(Date.parse(value));
            default:
                return true;
        }
    };

    const openValidationDialog = (row, col) => {
        setSelectedCell({ row, col });
        const key = `${row},${col}`;
        const existingRule = validationRulesRef.current.get(key);

        if (existingRule) {
            setValidationType(existingRule.type);
            setValidationCriteria(existingRule.criteria || 'between');
            setValidationMin(existingRule.min || '');
            setValidationMax(existingRule.max || '');
            setValidationList(Array.isArray(existingRule.listItems) ? existingRule.listItems.join('\n') : '');
            setValidationMessage(existingRule.inputMessage || '');
            setValidationErrorTitle(existingRule.errorTitle || '');
            setValidationErrorMessage(existingRule.errorMessage || '');
            setIgnoreBlank(existingRule.ignoreBlank !== false);
        } else {
            setValidationType('any');
            setValidationCriteria('between');
            setValidationMin('');
            setValidationMax('');
            setValidationList('');
            setValidationMessage('');
            setValidationErrorTitle('');
            setValidationErrorMessage('');
            setIgnoreBlank(true);
        }
        setShowValidationDialog(true);
    };

    const saveValidationRule = () => {
        if (!selectedCell) return;

        const key = `${selectedCell.row},${selectedCell.col}`;

        if (validationType === 'any') {
            validationRulesRef.current.delete(key);
            // Clear cell metadata
            if (hotRef.current && hotRef.current.isDestroyed === false) {
                try {
                    hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'type', 'text');
                    hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'source', null);
                    hotRef.current.render();
                } catch (e) {
                    // Silently ignore
                }
            }
        } else {
            const listItems = validationType === 'list' ? validationList.split('\n').map(s => s.trim()).filter(s => s) : [];
            const rule = {
                type: validationType,
                criteria: validationCriteria,
                min: validationMin,
                max: validationMax,
                listItems: listItems,
                inputMessage: validationMessage,
                errorTitle: validationErrorTitle,
                errorMessage: validationErrorMessage,
                ignoreBlank: ignoreBlank
            };
            validationRulesRef.current.set(key, rule);

            // Apply dropdown editor for list validations IMMEDIATELY
             if (hotRef.current && hotRef.current.isDestroyed === false) {
                 try {
                     if (validationType === 'list' && listItems.length > 0) {
                         // Set dropdown editor with saved options
                         hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'type', 'dropdown');
                         hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'source', listItems);
                         hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'strict', false);

                         // Set first list item as default if cell is empty
                         const currentValue = hotRef.current.getDataAtCell(selectedCell.row, selectedCell.col);
                         if (!currentValue || currentValue.trim() === '') {
                             hotRef.current.setDataAtCell(selectedCell.row, selectedCell.col, listItems[0]);
                         }
                     } else if (validationType === 'whole' || validationType === 'decimal') {
                         hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'type', 'numeric');
                     } else if (validationType === 'date') {
                         hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'type', 'date');
                     }
                     hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'valid', true);
                     hotRef.current.render();
                 } catch (e) {
                     console.error('Error applying validation to editor:', e);
                 }
             }
        }

        setShowValidationDialog(false);
    };

    // Helper function to evaluate simple formulas
    const evaluateFormula = (formula, tableData) => {
        if (!formula || !formula.startsWith("=")) return formula;

        try {
            let expression = formula.substring(1);

            // Handle SUM function
            expression = expression.replace(
                /SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
                (match, startCol, startRow, endCol, endRow) => {
                    const col1 = startCol.charCodeAt(0) - 65;
                    const row1 = parseInt(startRow) - 1;
                    const col2 = endCol.charCodeAt(0) - 65;
                    const row2 = parseInt(endRow) - 1;

                    let sum = 0;
                    const minRow = Math.min(row1, row2);
                    const maxRow = Math.max(row1, row2);
                    const minCol = Math.min(col1, col2);
                    const maxCol = Math.max(col1, col2);

                    for (let r = minRow; r <= maxRow; r++) {
                        for (let c = minCol; c <= maxCol; c++) {
                            let cellValue = tableData[r]?.[c];
                            // Recursively evaluate if cell contains a formula
                            if (cellValue && typeof cellValue === "string" && cellValue.startsWith("=")) {
                                cellValue = evaluateFormula(cellValue, tableData);
                            }
                            const num = parseFloat(cellValue);
                            if (!isNaN(num)) sum += num;
                        }
                    }
                    return sum.toString();
                }
            );

            // Handle AVG function
            expression = expression.replace(
                /AVG\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
                (match, startCol, startRow, endCol, endRow) => {
                    const col1 = startCol.charCodeAt(0) - 65;
                    const row1 = parseInt(startRow) - 1;
                    const col2 = endCol.charCodeAt(0) - 65;
                    const row2 = parseInt(endRow) - 1;

                    let sum = 0,
                        count = 0;
                    const minRow = Math.min(row1, row2);
                    const maxRow = Math.max(row1, row2);
                    const minCol = Math.min(col1, col2);
                    const maxCol = Math.max(col1, col2);

                    for (let r = minRow; r <= maxRow; r++) {
                        for (let c = minCol; c <= maxCol; c++) {
                            let cellValue = tableData[r]?.[c];
                            // Recursively evaluate if cell contains a formula
                            if (cellValue && typeof cellValue === "string" && cellValue.startsWith("=")) {
                                cellValue = evaluateFormula(cellValue, tableData);
                            }
                            const num = parseFloat(cellValue);
                            if (!isNaN(num)) {
                                sum += num;
                                count++;
                            }
                        }
                    }
                    return (count > 0 ? sum / count : 0).toString();
                }
            );

            // Handle cell references - convert to actual values
            let hasText = false;
            let textValues = [];
            let cellReferences = [];

            expression = expression.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
                const colIndex = col.charCodeAt(0) - 65;
                const rowIndex = parseInt(row) - 1;
                let cellValue = tableData[rowIndex]?.[colIndex];
                
                // Recursively evaluate if cell contains a formula
                if (cellValue && typeof cellValue === "string" && cellValue.startsWith("=")) {
                    cellValue = evaluateFormula(cellValue, tableData);
                }
                
                const cellStr = String(cellValue || '').trim();
                const num = parseFloat(cellStr);

                // Check if cell contains text/date (non-numeric or contains special chars like /)
                const isText = isNaN(num) || cellStr.includes('/') || cellStr.includes('-') || cellStr.includes(':') || cellStr.match(/[a-zA-Z]/);
                
                if (isText && cellValue !== undefined && cellValue !== "") {
                    hasText = true;
                    textValues.push(cellValue);
                    cellReferences.push(match);
                    return `0`; // Replace with 0 to prevent evaluation errors
                }
                // Return numeric value or 0 for empty cells
                return `(${isNaN(num) ? 0 : num})`;
            });

            // If formula only references text cells and uses simple reference, return the text
            if (hasText && textValues.length === 1 && cellReferences.length === 1) {
                // Check if the formula is a simple single cell reference
                const simpleRef = `=${cellReferences[0]}`;
                if (formula.trim() === simpleRef) {
                    return textValues[0];
                }
            }

            // Safe evaluation - handle all math operators including modulo
            const result = Function('"use strict"; return (' + expression + ")")();
            return isNaN(result) ? "#ERROR!" : result.toString();
        } catch (error) {
            return "#ERROR!";
        }
    };

    const handleMergeCells = (hot, type = "cells") => {
        const selected = hot.getSelected();
        if (!selected || selected.length === 0) {
            alert("Please select cells to merge");
            return;
        }

        const [startRow, startCol, endRow, endCol] = selected[0];
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        const colspan = maxCol - minCol + 1;
        const rowspan = maxRow - minRow + 1;

        // Validate: cannot merge a single cell
        if (colspan === 1 && rowspan === 1) {
            alert("Please select multiple cells to merge");
            return;
        }

        // Get current merged cells from the merge plugin
        let mergedCells = getCurrentMergedCells(hot);
        if (!Array.isArray(mergedCells)) {
            mergedCells = [];
        }

        // Check if already merged
        const alreadyMerged = mergedCells.some(m =>
            m.row === minRow && m.col === minCol &&
            m.colspan === colspan && m.rowspan === rowspan
        );

        if (alreadyMerged) {
            alert("Cells are already merged");
            return;
        }

        // Collect all data from cells being merged
        let mergedData = [];
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cellValue = hot.getDataAtCell(r, c);
                if (cellValue) {
                    mergedData.push(cellValue);
                }
            }
        }

        // Keep first cell data intact, combine others if needed
        const firstCellValue = hot.getDataAtCell(minRow, minCol);
        if (mergedData.length > 1 && !firstCellValue) {
            // If first cell is empty, use the combined data
            hot.setDataAtCell(minRow, minCol, mergedData.join(" "));
        }

        // Add new merge
        mergedCells.push({
            row: minRow,
            col: minCol,
            colspan: colspan,
            rowspan: rowspan
        });

        // Apply alignment
        const cellMeta = hot.getCellMeta(minRow, minCol);
        if (type === "center") {
            cellMeta.className = "htCenter htMiddle";
        } else if (type === "across") {
            cellMeta.className = "htCenter";
        }

        hot.updateSettings({ mergeCells: mergedCells });

        // Trigger data change callback - don't update state
        if (onDataChange) {
            const updatedData = hot.getData();
            const wrapStateArray = Array.from(wrapStateRef.current.keys());
            const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
            onDataChange({
                rows: updatedData,
                mergedCells: mergedCells,
                wrapState: wrapStateArray,
                validationRules: validationRulesArray,
                undoStack: undoStackRef.current,
                redoStack: redoStackRef.current
            });
        }
    };

    const handleUnmergeCells = (hot) => {
        const selected = hot.getSelected();
        if (!selected || selected.length === 0) {
            alert("Please select cells to unmerge");
            return;
        }

        const [startRow, startCol, endRow, endCol] = selected[0];
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        let mergedCells = getCurrentMergedCells(hot);
        if (!Array.isArray(mergedCells)) {
            mergedCells = [];
        }

        // Filter out merges that overlap with selection
        const updatedMergedCells = mergedCells.filter(m => {
            const mEndRow = m.row + m.rowspan - 1;
            const mEndCol = m.col + m.colspan - 1;

            // Keep if doesn't overlap
            return !(m.row <= maxRow && mEndRow >= minRow &&
                m.col <= maxCol && mEndCol >= minCol);
        });

        hot.updateSettings({ mergeCells: updatedMergedCells });

        // Trigger data change callback - don't update state
        if (onDataChange) {
            const updatedData = hot.getData();
            const wrapStateArray = Array.from(wrapStateRef.current.keys());
            const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
            onDataChange({
                rows: updatedData,
                mergedCells: updatedMergedCells,
                wrapState: wrapStateArray,
                validationRules: validationRulesArray,
                undoStack: undoStackRef.current,
                redoStack: redoStackRef.current
            });
        }
    };

    const handleWrapText = (hot) => {
        const selected = hot.getSelected();
        if (!selected || selected.length === 0) {
            alert("Please select cells to wrap text");
            return;
        }

        // Handle multiple selections
        selected.forEach((selection) => {
            const [startRow, startCol, endRow, endCol] = selection;
            const minRow = Math.min(startRow, endRow);
            const maxRow = Math.max(startRow, endRow);
            const minCol = Math.min(startCol, endCol);
            const maxCol = Math.max(startCol, endCol);

            // Toggle wrap text for each cell in selection
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    const key = `${r},${c}`;
                    const isWrapped = wrapStateRef.current.has(key);

                    if (isWrapped) {
                        // Remove from map
                        wrapStateRef.current.delete(key);
                    } else {
                        // Add to map
                        wrapStateRef.current.set(key, true);
                    }

                    // Also update cellMeta for consistency
                    hot.setCellMeta(r, c, 'wrap', !isWrapped);
                }
            }
        });

        // Apply changes and re-render
        hot.render();

        // Trigger data change callback to save wrap state
        if (onDataChange) {
            const updatedData = hot.getData();
            const currentMergedCells = getCurrentMergedCells(hot);
            const wrapStateArray = Array.from(wrapStateRef.current.keys());
            const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
            onDataChange({
                rows: updatedData,
                mergedCells: currentMergedCells,
                wrapState: wrapStateArray,
                validationRules: validationRulesArray,
                undoStack: undoStackRef.current,
                redoStack: redoStackRef.current
            });
        }
    };

    useEffect(() => {
        if (containerRef.current) {
            const hot = new Handsontable(containerRef.current, {
                data: data,
                rowHeaders: true,
                colHeaders: generateColumnHeaders(),
                width: "100%",
                height: "700px",
                licenseKey: "non-commercial-and-evaluation",
                mergeCells: mergedCells && mergedCells.length > 0 ? mergedCells : [],

                // Context menu with all Excel operations
                contextMenu: {
                    callback: (key, selection) => {
                        if (key === "merge_cells") {
                            handleMergeCells(hot);
                        } else if (key === "merge_center") {
                            handleMergeCells(hot, "center");
                        } else if (key === "merge_across") {
                            handleMergeCells(hot, "across");
                        } else if (key === "unmerge_cells") {
                            handleUnmergeCells(hot);
                        } else if (key === "wrap_text") {
                            handleWrapText(hot);
                        } else if (key === "data_validation") {
                            const selectedRange = hot.getSelectedRange();
                            if (selectedRange && selectedRange.length > 0) {
                                const range = selectedRange[0];
                                openValidationDialog(range.from.row, range.from.col);
                            }
                        } else if (key === "remove_row") {
                            // Get the row index before deletion
                            const selectedRange = hot.getSelectedRange();
                            if (selectedRange && selectedRange.length > 0) {
                                
                                const range = selectedRange[0];
                                const deletedRow = range.from.row;
                                
                                // After row deletion, clean up validation rules
                                setTimeout(() => {
                                    // Remove validation rules for deleted row and shift others
                                    const newValidationRules = new Map();
                                    for (const [key, rule] of validationRulesRef.current.entries()) {
                                        const [row, col] = key.split(',').map(Number);
                                        if (row === deletedRow) {
                                            // Remove rule for deleted row
                                            continue;
                                        } else if (row > deletedRow) {
                                            // Shift rule up by 1
                                            const newKey = `${row - 1},${col}`;
                                            newValidationRules.set(newKey, rule);
                                        } else {
                                            // Keep rule as is
                                            newValidationRules.set(key, rule);
                                        }
                                    }
                                    validationRulesRef.current = newValidationRules;
                                    
                                    // Also update wrap state
                                    const newWrapState = new Map();
                                    for (const key of wrapStateRef.current.keys()) {
                                        const [row, col] = key.split(',').map(Number);
                                        if (row === deletedRow) {
                                            continue;
                                        } else if (row > deletedRow) {
                                            const newKey = `${row - 1},${col}`;
                                            newWrapState.set(newKey, true);
                                        } else {
                                            newWrapState.set(key, true);
                                        }
                                    }
                                    wrapStateRef.current = newWrapState;

                                    // Also update cell styles
                                    const newCellStyles = new Map();
                                    for (const [key, style] of cellStylesRef.current.entries()) {
                                        const [row, col] = key.split(',').map(Number);
                                        if (row === deletedRow) {
                                            continue;
                                        } else if (row > deletedRow) {
                                            const newKey = `${row - 1},${col}`;
                                            newCellStyles.set(newKey, style);
                                        } else {
                                            newCellStyles.set(key, style);
                                        }
                                    }
                                    cellStylesRef.current = newCellStyles;

                                    const updatedData = hot.getData();
                                    setData(updatedData);

                                    if (onDataChange) {
                                        const currentMergedCells = getCurrentMergedCells(hot);
                                        const wrapStateArray = Array.from(wrapStateRef.current.keys());
                                        const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
                                        const cellStylesArray = Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style }));
                                        onDataChange({
                                            rows: updatedData,
                                            mergedCells: currentMergedCells,
                                            wrapState: wrapStateArray,
                                            validationRules: validationRulesArray,
                                            cellStyles: cellStylesArray,
                                            undoStack: undoStackRef.current,
                                            redoStack: redoStackRef.current
                                        });
                                    }
                                }, 100);
                            }
                        } else if (key === "remove_col") {
                            // Get the column index before deletion
                            const selectedRange = hot.getSelectedRange();
                            if (selectedRange && selectedRange.length > 0) {
                                const range = selectedRange[0];
                                const deletedCol = range.from.col;
                                
                                // After column deletion, clean up validation rules
                                setTimeout(() => {
                                    // Remove validation rules for deleted column and shift others
                                    const newValidationRules = new Map();
                                    for (const [key, rule] of validationRulesRef.current.entries()) {
                                        const [row, col] = key.split(',').map(Number);
                                        if (col === deletedCol) {
                                            // Remove rule for deleted column
                                            continue;
                                        } else if (col > deletedCol) {
                                            // Shift rule left by 1
                                            const newKey = `${row},${col - 1}`;
                                            newValidationRules.set(newKey, rule);
                                        } else {
                                            // Keep rule as is
                                            newValidationRules.set(key, rule);
                                        }
                                    }
                                    validationRulesRef.current = newValidationRules;

                                    // Also update wrap state
                                    const newWrapState = new Map();
                                    for (const key of wrapStateRef.current.keys()) {
                                        const [row, col] = key.split(',').map(Number);
                                        if (col === deletedCol) {
                                            continue;
                                        } else if (col > deletedCol) {
                                            const newKey = `${row},${col - 1}`;
                                            newWrapState.set(newKey, true);
                                        } else {
                                            newWrapState.set(key, true);
                                        }
                                    }
                                    wrapStateRef.current = newWrapState;

                                    // Also update cell styles
                                    const newCellStyles = new Map();
                                    for (const [key, style] of cellStylesRef.current.entries()) {
                                        const [row, col] = key.split(',').map(Number);
                                        if (col === deletedCol) {
                                            continue;
                                        } else if (col > deletedCol) {
                                            const newKey = `${row},${col - 1}`;
                                            newCellStyles.set(newKey, style);
                                        } else {
                                            newCellStyles.set(key, style);
                                        }
                                    }
                                    cellStylesRef.current = newCellStyles;

                                    const updatedData = hot.getData();
                                    setData(updatedData);

                                    if (onDataChange) {
                                        const currentMergedCells = getCurrentMergedCells(hot);
                                        const wrapStateArray = Array.from(wrapStateRef.current.keys());
                                        const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
                                        const cellStylesArray = Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style }));
                                        onDataChange({
                                            rows: updatedData,
                                            mergedCells: currentMergedCells,
                                            wrapState: wrapStateArray,
                                            validationRules: validationRulesArray,
                                            cellStyles: cellStylesArray,
                                            undoStack: undoStackRef.current,
                                            redoStack: redoStackRef.current
                                        });
                                    }
                                }, 100);
                            }
                        } else if (key === "row_above" || key === "row_below") {
                            // After row/column operations, save the data
                            setTimeout(() => {
                                const updatedData = hot.getData();
                                setData(updatedData);

                                if (onDataChange) {
                                    const currentMergedCells = getCurrentMergedCells(hot);
                                    const wrapStateArray = Array.from(wrapStateRef.current.keys());
                                    const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
                                    const cellStylesArray = Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style }));
                                    onDataChange({
                                        rows: updatedData,
                                        mergedCells: currentMergedCells,
                                        wrapState: wrapStateArray,
                                        validationRules: validationRulesArray,
                                        cellStyles: cellStylesArray,
                                        undoStack: undoStackRef.current,
                                        redoStack: redoStackRef.current
                                    });
                                }
                            }, 100);
                        }
                    },
                    items: {
                        row_above: {
                            name: "Insert Row Above",
                        },
                        row_below: {
                            name: "Insert Row Below",
                        },
                        "---------": "---------",
                        remove_row: {
                            name: "Delete Row",
                        },
                        "---------": "---------",

                        remove_col: {
                            name: "Delete Column",
                        },
                        "---------": "---------",

                        "merge_center": {
                            name: "Merge & Center",
                        },
                        "merge_across": {
                            name: "Merge Across",
                        },
                        "merge_cells": {
                            name: "Merge Cells",
                        },
                        "unmerge_cells": {
                            name: "Unmerge Cells",
                        },
                        "---------": "---------",

                        wrap_text: {
                            name: "Wrap Text",
                        },
                        "---------2": "---------",
                        data_validation: {
                            name: "Data Validation",
                        },
                    },
                },

                // Column sizing
                stretchH: "all",
                manualColumnResize: true,
                manualRowResize: true,
                columnSorting: true,
                colWidths: [60, 280, 280, 220, 220, 160, 140, 140],

                // Row height - auto-expand for wrapped text
                rowHeights: 25,
                autoRowSize: true,

                // Row and column configuration
                minCols: 8,
                minRows: 600,
                maxRows: 5000,
                maxCols: 8,
                disabledColumns: [],
                disabledRows: [],

                // Copy/Paste
                copyPaste: {
                    uiContainer: document.body,
                },

                // Cell properties with custom renderer for formulas
                cells: (row, col) => {
                    const key = `${row},${col}`;
                    const rule = validationRulesRef.current.get(key);

                    // Determine editor based on validation rule
                    let editorConfig = 'text'; // Default editor
                    const cellOptions = {};

                    if (rule && rule.type === 'list' && rule.listItems && rule.listItems.length > 0) {
                        editorConfig = 'dropdown';
                        cellOptions.source = rule.listItems;
                        cellOptions.strict = false; // Allow custom values not in list
                    }

                    return {
                        renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            let displayValue = value;
                            if (value && typeof value === "string" && value.startsWith("=")) {
                                const currentData = instance.getData ? instance.getData() : data;
                                displayValue = evaluateFormula(value, currentData);
                            }

                            // Clear previous content
                            td.innerHTML = '';

                            // Set default cell styles for overflow
                            td.style.whiteSpace = 'nowrap';
                            td.style.overflow = 'visible';
                            td.style.backgroundColor = '#ffffff';
                            td.style.position = 'relative';

                            // Apply cell formatting (bold, italic, underline, font size)
                            const key = `${row},${col}`;
                            const cellFormatting = cellStylesRef.current.get(key) || {};

                            if (cellFormatting.bold) {
                                td.style.fontWeight = 'bold';
                            }
                            if (cellFormatting.italic) {
                                td.style.fontStyle = 'italic';
                            }
                            if (cellFormatting.underline) {
                                td.style.textDecoration = 'underline';
                            }
                            if (cellFormatting.fontSize) {
                                td.style.fontSize = cellFormatting.fontSize + 'px';
                            }

                            // Apply wrap text styling if enabled - check both persistent state and cellMeta
                            const cellMeta = instance.getCellMeta(row, col);
                            const isWrapped = wrapStateRef.current.has(key) || cellMeta.wrap;
                            if (isWrapped) {
                                td.classList.add('wrap-text');
                                td.style.whiteSpace = 'normal';
                                td.style.overflow = 'hidden';
                            } else {
                                td.classList.remove('wrap-text');
                                td.style.whiteSpace = 'nowrap';
                                td.style.overflow = 'visible';
                            }

                            // Create text content container
                            const contentDiv = document.createElement('div');
                            contentDiv.style.display = 'flex';
                            contentDiv.style.justifyContent = 'space-between';
                            contentDiv.style.alignItems = 'center';
                            contentDiv.style.width = '100%';
                            contentDiv.style.gap = '4px';

                            const textSpan = document.createElement('span');
                            textSpan.textContent = displayValue;
                            textSpan.style.flex = '1';
                            contentDiv.appendChild(textSpan);

                            // Add dropdown indicator for cells with validation (especially list type)
                            if (rule) {
                                const dropdownIndicator = document.createElement('span');
                                dropdownIndicator.innerHTML = '▼';
                                dropdownIndicator.style.fontSize = '10px';
                                dropdownIndicator.style.color = '#4a90e2';
                                dropdownIndicator.style.fontWeight = 'bold';
                                dropdownIndicator.style.cursor = 'pointer';
                                dropdownIndicator.style.marginRight = '2px';
                                contentDiv.appendChild(dropdownIndicator);
                            }

                            td.appendChild(contentDiv);

                            // Add validation indicator class to cells with validation rules
                            if (rule) {
                                td.classList.add('has-validation');
                                td.style.cursor = 'pointer';
                            } else {
                                td.classList.remove('has-validation');
                            }

                            // Add blue border to cells with formulas (references/functions)
                            if (value && typeof value === "string" && value.startsWith("=")) {
                                td.style.border = '2px solid #a2bfe0';
                            } else {
                                td.style.border = '';
                            }

                            // Set title attribute for input message tooltip (without help icon)
                            if (rule && rule.inputMessage) {
                                td.title = rule.inputMessage;
                            } else {
                                td.removeAttribute('title');
                            }

                        },
                        editor: editorConfig,
                        ...cellOptions
                    };
                },



                // Selection
                outsideClickDeselects: true,
                multiSelect: true,
                selectionMode: "multiple",

                // Search
                search: true,
                filters: true,

                // Auto wrap
                autoWrapRow: true,
                autoWrapCol: true,

                // Headers styling
                currentHeaderClassName: "highlight",
                currentColClassName: "highlight",

                // Prevent auto-edit on Enter navigation
                beforeBeginEditing: (row, col, source) => {
                    if (isFormulaEditingRef.current) {
                        return false; // Prevent editing when navigating with Enter
                    }
                },
                
                // Ensure formula is displayed as text, not evaluated value
                afterBeginEditing: (row, col) => {
                    const cellValue = hot.getDataAtCell(row, col);
                    if (cellValue && typeof cellValue === 'string' && cellValue.startsWith('=')) {
                        const activeEditor = hot.getActiveEditor();
                        if (activeEditor) {
                            activeEditor.setValue(cellValue);
                            // Force textarea to show raw formula
                            if (activeEditor.TEXTAREA) {
                                activeEditor.TEXTAREA.value = cellValue;
                                activeEditor.TEXTAREA.textContent = cellValue;
                            }
                            if (activeEditor.INPUT) {
                                activeEditor.INPUT.value = cellValue;
                            }
                        }
                    }
                },
                // Handle cell selection during formula input
                afterSelection: (row, col, row2, col2) => {
                    // Track selected range for formatting
                    setSelectedRange({ row, col, row2, col2 });

                    try {
                        const activeEditor = hot.getActiveEditor();
                        if (activeEditor && activeEditor.isOpened && activeEditor.isOpened()) {
                            const editorValue = activeEditor.getValue();
                            // Check if we're in formula mode (starts with =)
                            if (editorValue && typeof editorValue === 'string' && editorValue.trim().startsWith('=')) {
                                const colLabel = Handsontable.helper.spreadsheetColumnLabel(col);
                                const cellRef = colLabel + (row + 1);
                                // Append cell address to formula
                                const newFormula = editorValue + cellRef;
                                activeEditor.setValue(newFormula);
                            }
                        }
                    } catch (e) {
                        // Silently ignore
                    }
                },

                // Validation before change
                beforeChange: (changes, source) => {
                    if (changes && (source === 'edit' || source === 'CopyPaste.paste') && !suppressChangeRef.current) {
                        saveToUndoStack();
                    }
                    if (!changes || source === 'internal') return;

                    for (let i = 0; i < changes.length; i++) {
                        const [row, col, oldValue, newValue] = changes[i];
                        const key = `${row},${col}`;
                        const rule = validationRulesRef.current.get(key);

                        if (rule && !validateCellValue(newValue, rule)) {
                            if (rule.errorTitle || rule.errorMessage) {
                                alert(`${rule.errorTitle || 'Validation Error'}\n\n${rule.errorMessage || 'This value does not meet the validation criteria.'}`);
                            } else {
                                alert('Invalid value for this cell. Please check the validation criteria.');
                            }
                            changes[i] = [row, col, oldValue, oldValue]; // Revert change
                        }
                    }
                },

                // Data change handler
                afterChange: (changes, source) => {
                    // Only trigger onDataChange for actual user edits, not internal changes or validation setup
                    // Also check that the instance is not destroyed
                    if (changes && source !== 'internal' && !suppressChangeRef.current && hotRef.current && hotRef.current.isDestroyed === false) {
                        try {
                            // Note: saveToUndoStack() is now called in beforeChange instead
                            // This ensures we save the previous state BEFORE the change is applied

                            let updatedData = null;
                            if (!hotRef.current.isDestroyed) {
                                updatedData = hotRef.current.getData();
                                setData(updatedData);

                                // Do NOT auto-wrap on edits - only respect manual wrap settings
                                if (changes && source === 'edit' && !hotRef.current.isDestroyed) {
                                    // Just render to refresh, don't modify wrap settings
                                    try {
                                        hotRef.current.render();
                                    } catch (e) {
                                        // Silently ignore render errors if instance is being destroyed
                                    }
                                }

                                // Re-render cells to show formula results
                                if (!hotRef.current.isDestroyed) {
                                    try {
                                        hotRef.current.render();
                                    } catch (e) {
                                        // Silently ignore render errors if instance is being destroyed
                                    }
                                }
                            }

                            if (onDataChange && updatedData) {
                                // Include merged cells, wrap state, validation rules, and cell styles in the data being saved
                                const currentMergedCells = getCurrentMergedCells(hotRef.current);
                                const wrapStateArray = Array.from(wrapStateRef.current.keys());
                                const validationRulesArray = Array.from(validationRulesRef.current.entries()).map(([key, rule]) => ({ key, rule }));
                                const cellStylesArray = Array.from(cellStylesRef.current.entries()).map(([key, style]) => ({ key, style }));
                                onDataChange({
                                    rows: updatedData,
                                    mergedCells: currentMergedCells,
                                    wrapState: wrapStateArray,
                                    validationRules: validationRulesArray,
                                    cellStyles: cellStylesArray,
                                    undoStack: undoStackRef.current,
                                    redoStack: redoStackRef.current
                                });
                            }
                        } catch (error) {
                            // Silently ignore if instance is being destroyed
                        }
                    }
                },

                // Freezing
                fixedRowsTop: 0,
                fixedColumnsLeft: 0,

                // Font
               enterMoves: { row: 0, col: 0 },
                tabMoves: { row: 0, col: 1 },

                beforeKeyDown: function (e) {
                    // Handle Ctrl+Z for undo
                    if (e.ctrlKey && e.key.toLowerCase() === "z") {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        const editor = this.getActiveEditor();

                        // If still editing, close it properly
                        if (editor && editor.isOpened()) {
                            editor.finishEditing();
                        }

                        // Perform undo
                        undo();

                        return;
                    }

                    // Handle Ctrl+Y for redo
                    if (e.ctrlKey && e.key.toLowerCase() === "y") {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        const editor = this.getActiveEditor();

                        // If still editing, close it properly
                        if (editor && editor.isOpened()) {
                            editor.finishEditing();
                        }

                        // Perform redo
                        redo();

                        return;
                    }

                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        const selected = this.getSelectedLast();
                        if (!selected) return false;

                        const row = selected[0];
                        const col = selected[1];

                        const totalCols = this.countCols();
                        const totalRows = this.countRows();

                        const editor = this.getActiveEditor();
                        if (editor && editor.isOpened()) {
                            editor.finishEditing();
                        }

                        // Set flag to prevent auto-edit mode on navigation
                        isFormulaEditingRef.current = true;
                        
                        // If NOT last column → move right
                        if (col < totalCols - 1) {
                            this.selectCell(row, col + 1, undefined, undefined, false);
                        }
                        // If last column → move to next row first column
                        else if (row < totalRows - 1) {
                            this.selectCell(row + 1, 0, undefined, undefined, false);
                        }
                        
                        // Reset flag after brief delay
                        setTimeout(() => {
                            isFormulaEditingRef.current = false;
                        }, 0);
                        
                        return false;
                    }
                },

                // Open dropdown on single click for cells with list validation
                beforeOnCellMouseDown: function (event, coords, TD) {
                    const row = coords.row;
                    const col = coords.col;
                    const key = `${row},${col}`;
                    const rule = validationRulesRef.current.get(key);

                    // Only handle left-click (button 0), allow right-click for context menu
                    if (event.button === 0 && rule && rule.type === 'list' && rule.listItems && rule.listItems.length > 0) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        
                        const instance = this;
                        instance.selectCell(row, col);
                        
                        // Trigger edit mode with space key to open dropdown
                        setTimeout(() => {
                            const keyEvent = new KeyboardEvent('keydown', {
                                key: ' ',
                                code: 'Space',
                                keyCode: 32,
                                which: 32,
                                bubbles: true,
                                cancelable: true
                            });
                            document.activeElement.dispatchEvent(keyEvent);
                        }, 20);
                    }
                }

            });
            hotRef.current = hot;

            return () => {
                if (hotRef.current) {
                    hotRef.current.destroy();
                }
            };
        }
    }, []);

   // Add inline styles for wrap text, overflow text, and validation indicators
useEffect(() => {
    const wrapTextStyle = document.createElement('style');
    if (!document.querySelector('style[data-wrap-text]')) {
        wrapTextStyle.setAttribute('data-wrap-text', 'true');
        wrapTextStyle.textContent = `
            .handsontable td {
                white-space: nowrap !important;
                overflow: visible !important;
                background-color: #FFFFFF !important;
            }
            .handsontable td.wrap-text {
                white-space: normal !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                word-break: break-word !important;
                hyphens: auto !important;
                vertical-align: top !important;
                padding: 4px !important;
                line-height: 1.4 !important;
                overflow: visible !important;
                background-color: #FFFFFF !important;
            }

            .handsontable td[title] {
                cursor: default;
            }

            .handsontable td.has-validation {
                border-right: 3px solid #4A90E2 !important;
            }

            /* :white_check_mark: Hide ONLY Right Side Scrollbar (Vertical) */
            .handsontable .wtHolder::-webkit-scrollbar:vertical {
                width: 0px !important;
                display: none !important;
            }

            /* :white_check_mark: Keep Bottom Scrollbar (Horizontal) */
            .handsontable .wtHolder::-webkit-scrollbar:horizontal {
                height: 24px;
            }

            /* Horizontal scrollbar styling */
            .handsontable .wtHolder::-webkit-scrollbar-thumb:horizontal {
                background: #888;
                border-radius: 8px;
            }

            .handsontable .wtHolder::-webkit-scrollbar-thumb:horizontal:hover {
                background: #555;
            }

            /* Firefox */
            .handsontable .wtHolder {
                scrollbar-width: thin;
            }
        `;
        document.head.appendChild(wrapTextStyle);
    }
    return () => {};
}, []);

    // Global keyboard listener for Ctrl+Z and Ctrl+Y
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check if we're inside the spreadsheet container OR if the active element is inside it
            const isInSpreadsheet = containerRef.current && (
                containerRef.current.contains(document.activeElement) || 
                containerRef.current === document.activeElement
            );

            const isCtrlZ = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
            const isCtrlY = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y';

            // Allow undo/redo if Handsontable instance exists
            const hotExists = hotRef.current && !hotRef.current.isDestroyed;

            if (isCtrlZ && hotExists) {
                console.log('🔙 Ctrl+Z pressed - triggering undo');
                event.preventDefault();
                undo();
            } else if (isCtrlY && hotExists) {
                console.log('🔜 Ctrl+Y pressed - triggering redo');
                event.preventDefault();
                redo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [undo, redo]);

    return (
        <>
            <div className="flex flex-col gap-4 p-6 bg-white border border-gray-300 rounded-lg shadow-md">
                {/* Header */}
                <div className="flex flex-row gap-4 items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">📊 Excel Spreadsheet</h3>
                    <div className="flex gap-2 flex-wrap justify-end">
                        {(() => {
                            const buttons = [1];
                            for (let i = 50; i <= 600; i += 50) {
                                buttons.push(i);
                            }
                            return buttons.map((rowNum) => (
                                <button
                                    key={rowNum}
                                    type="button"
                                    title={`Go to row ${rowNum}`}
                                    onClick={() => {
                                        if (hotRef.current && hotRef.current.isDestroyed === false) {
                                            const maxRow = hotRef.current.countRows() - 1;
                                            const targetRow = Math.min(rowNum - 1, maxRow);
                                            hotRef.current.selectCell(targetRow, 0);
                                            hotRef.current.scrollViewportTo(targetRow, 0);
                                        }
                                    }}
                                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold transition-colors"
                                >
                                    {rowNum}
                                </button>
                            ));
                        })()}
                    </div>
                    <div className="flex gap-2">
                         <button
                             type="button"
                             title="Number to Words"
                             onClick={() => {
                                 if (!selectedRange) {
                                     alert('Please select a cell with a number');
                                     return;
                                 }
                                 
                                 const { row: startRow, col: startCol, row2: endRow, col2: endCol } = selectedRange;
                                 for (let row = startRow; row <= endRow; row++) {
                                     for (let col = startCol; col <= endCol; col++) {
                                         let cellValue = hotRef.current.getDataAtCell(row, col);
                                         // Evaluate formula if cell contains one
                                         if (cellValue && typeof cellValue === "string" && cellValue.startsWith("=")) {
                                             const currentData = hotRef.current.getData();
                                             cellValue = evaluateFormula(cellValue, currentData);
                                         }
                                         // Remove rupee symbol, commas, decimals, and get integer part
                                         const cleanValue = String(cellValue).replace(/[₹₨]/g, '').replace(/,/g, '').split('.')[0].trim();
                                         const numValue = parseInt(cleanValue);
                                         if (!isNaN(numValue) && numValue >= 0) {
                                             const words = numberToWords(numValue);
                                             // Capitalize first letter of each word
                                             const capitalizedWords = words.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                             const newValue = capitalizedWords;
                                             hotRef.current.setDataAtCell(row, col, newValue);
                                         }
                                     }
                                 }
                             }}
                             className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md text-sm"
                         >
                             Words
                         </button>
                         <button
                             type="button"
                             title="Bold"
                             onClick={() => applyFormatting('bold')}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md font-bold"
                        >
                            B
                        </button>
                        <button
                            type="button"
                            title="Italic"
                            onClick={() => applyFormatting('italic')}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md italic"
                        >
                            I
                        </button>
                        <button
                            type="button"
                            title="Underline"
                            onClick={() => applyFormatting('underline')}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md underline"
                        >
                            U
                        </button>
                        <select
                            title="Font Size"
                            value={fontSize}
                            onChange={(e) => {
                                setFontSize(e.target.value);
                                applyFormatting(`fontSize-${e.target.value}`);
                            }}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md"
                        >
                            <option>12</option>
                            <option>14</option>
                            <option>16</option>
                            <option>18</option>
                            <option>20</option>
                            <option>24</option>
                            <option>26</option>
                            <option>28</option>

                        </select>
                    </div>
                </div>

                {/* Handsontable Container */}
                <div
                    ref={containerRef}
                    className="border-2 border-gray-400 rounded-lg overflow-hidden bg-white"
                    style={{ maxHeight: "1000px", width: "100%", overflowX: "auto" }}
                />
            </div>

            {/* Data Validation Dialog */}
            {showValidationDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto z-[10000]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Data Validation</h2>
                            <button
                                onClick={() => setShowValidationDialog(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Validation Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Allow:</label>
                                <select
                                    value={validationType}
                                    onChange={(e) => {
                                        setValidationType(e.target.value);
                                        if (e.target.value === 'list') {
                                            setValidationCriteria('');
                                        } else {
                                            setValidationCriteria('between');
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                >
                                    <option value="any">Any value</option>
                                    <option value="whole">Whole number</option>
                                    <option value="decimal">Decimal</option>
                                    <option value="text">Text</option>
                                    <option value="date">Date</option>
                                    <option value="list">List</option>
                                </select>
                            </div>

                            {/* Data Criteria */}
                            {validationType !== 'any' && validationType !== 'list' && validationType !== 'date' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data:</label>
                                    <select
                                        value={validationCriteria}
                                        onChange={(e) => setValidationCriteria(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                    >
                                        {(validationType === 'whole' || validationType === 'decimal') ? (
                                            <>
                                                <option value="between">between</option>
                                                <option value="notBetween">not between</option>
                                                <option value="equal">equal to</option>
                                                <option value="notEqual">not equal to</option>
                                                <option value="greaterThan">greater than</option>
                                                <option value="lessThan">less than</option>
                                                <option value="greaterOrEqual">greater than or equal to</option>
                                                <option value="lessOrEqual">less than or equal to</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="equal">equals</option>
                                                <option value="notEqual">not equals</option>
                                                <option value="contains">contains</option>
                                                <option value="notContains">does not contain</option>
                                                <option value="beginsWith">begins with</option>
                                                <option value="endsWith">ends with</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            )}

                            {/* Input Fields based on type */}
                            {validationType === 'list' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">List items (one per line):</label>
                                    <textarea
                                        value={validationList}
                                        onChange={(e) => setValidationList(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 h-24"
                                        placeholder="Item 1&#10;Item 2&#10;Item 3"
                                    />
                                </div>
                            )}

                            {validationType !== 'any' && validationType !== 'list' && (
                                <>
                                    {(validationCriteria === 'between' || validationCriteria === 'notBetween') && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum:</label>
                                                <input
                                                    type="text"
                                                    value={validationMin}
                                                    onChange={(e) => setValidationMin(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum:</label>
                                                <input
                                                    type="text"
                                                    value={validationMax}
                                                    onChange={(e) => setValidationMax(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {(validationCriteria !== 'between' && validationCriteria !== 'notBetween') && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Value:</label>
                                            <input
                                                type="text"
                                                value={validationMin}
                                                onChange={(e) => setValidationMin(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Ignore Blank */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="ignoreBlank"
                                    checked={ignoreBlank}
                                    onChange={(e) => setIgnoreBlank(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="ignoreBlank" className="ml-2 text-sm text-gray-700">
                                    Ignore blank
                                </label>
                            </div>

                            {/* Input Message */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Input Message:</label>
                                <textarea
                                    value={validationMessage}
                                    onChange={(e) => setValidationMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 h-16"
                                    placeholder="Message shown when cell is selected"
                                />
                            </div>

                            {/* Error Alert */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Error Title:</label>
                                <input
                                    type="text"
                                    value={validationErrorTitle}
                                    onChange={(e) => setValidationErrorTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                    placeholder="Error title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Error Message:</label>
                                <textarea
                                    value={validationErrorMessage}
                                    onChange={(e) => setValidationErrorMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 h-16"
                                    placeholder="Message shown when invalid value is entered"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        const key = `${selectedCell.row},${selectedCell.col}`;
                                        validationRulesRef.current.delete(key);
                                        // Clear cell metadata
                                        if (hotRef.current && hotRef.current.isDestroyed === false) {
                                            try {
                                                hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'type', 'text');
                                                hotRef.current.setCellMeta(selectedCell.row, selectedCell.col, 'source', null);
                                                hotRef.current.render();
                                            } catch (e) {
                                                // Silently ignore
                                            }
                                        }
                                        setShowValidationDialog(false);
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowValidationDialog(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveValidationRule}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RealSpreadsheet;