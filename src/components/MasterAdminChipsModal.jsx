import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Badge } from "./ui";
import { FaTimes, FaPlus } from "react-icons/fa";
import api from "../services/axios";

const MasterAdminChipsModal = ({ isOpen, onClose }) => {
    const [chips, setChips] = useState([]);
    const [newChipValue, setNewChipValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [allClients, setAllClients] = useState([]);

    // Load all clients
    useEffect(() => {
        if (isOpen) {
            loadAllClients();
        }
    }, [isOpen]);

    const loadAllClients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/chips/clients/list");
            setAllClients(response.data.data || []);
            // Set first client as default
            if (response.data.data && response.data.data.length > 0) {
                setSelectedClientId(response.data.data[0]);
            }
        } catch (error) {
            console.error("Failed to load clients:", error);
            // Fallback: use hardcoded list of common clients
            const commonClients = ["c1908090", "c278988", "c3808809", "c4567890", "c5678901", "c6789012", "c7890123", "c8901234", "c9012345", "AshishMaster1010"];
            setAllClients(commonClients);
            if (commonClients.length > 0) {
                setSelectedClientId(commonClients[0]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load chips when selected client changes
    useEffect(() => {
        if (selectedClientId) {
            loadChips();
        }
    }, [selectedClientId]);

    const loadChips = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/chips?clientId=${selectedClientId}`);
            setChips(response.data.data || []);
        } catch (error) {
            console.error("Failed to load chips:", error);
            setChips([]);
        } finally {
            setLoading(false);
        }
    }, [selectedClientId]);

    const handleAddChip = useCallback(async () => {
        if (!newChipValue.trim()) return;

        try {
            setLoading(true);
            const response = await api.post("/chips", {
                clientId: selectedClientId,
                value: newChipValue.trim(),
            });

            if (response.data.success) {
                setChips([...chips, response.data.data]);
                setNewChipValue("");
            }
        } catch (error) {
            console.error("Failed to add chip:", error);
        } finally {
            setLoading(false);
        }
    }, [newChipValue, selectedClientId, chips]);

    const handleDeleteChip = useCallback(async (chipId) => {
        try {
            setLoading(true);
            const response = await api.delete(`/chips/${chipId}`);

            if (response.data.success) {
                setChips(chips.filter(chip => chip._id !== chipId));
            }
        } catch (error) {
            console.error("Failed to delete chip:", error);
        } finally {
            setLoading(false);
        }
    }, [chips]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === "Enter") {
            handleAddChip();
        }
    }, [handleAddChip]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Manage Client Chips</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Client Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-900">Select Client</label>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full h-8 text-xs rounded-lg border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 bg-white"
                            disabled={loading}
                        >
                            <option value="">-- Choose a client --</option>
                            {allClients.map((clientId) => (
                                <option key={clientId} value={clientId}>
                                    {clientId}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedClientId && (
                        <>
                            {/* Add New Chip */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-900">Add New Chip for {selectedClientId}</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Enter chip value"
                                        value={newChipValue}
                                        onChange={(e) => setNewChipValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="h-8 text-xs flex-1"
                                        disabled={loading}
                                    />
                                    <Button
                                        onClick={handleAddChip}
                                        disabled={loading || !newChipValue.trim()}
                                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                    >
                                        <FaPlus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Display Existing Chips */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-900">
                                    Chips for {selectedClientId} ({chips.length})
                                </label>
                                <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 min-h-12">
                                    {chips.length === 0 ? (
                                        <p className="text-xs text-neutral-500">No chips added yet</p>
                                    ) : (
                                        chips.map((chip) => (
                                            <Badge
                                                key={chip._id}
                                                className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200 px-2 py-1 rounded-full text-xs font-medium"
                                            >
                                                {chip.value}
                                                <button
                                                    onClick={() => handleDeleteChip(chip._id)}
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                    disabled={loading}
                                                >
                                                    <FaTimes className="h-2.5 w-2.5" />
                                                </button>
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        onClick={onClose}
                        className="h-8 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-900"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MasterAdminChipsModal;
