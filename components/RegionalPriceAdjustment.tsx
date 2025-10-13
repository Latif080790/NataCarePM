import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { Input, Select } from './FormControls';
import { Modal } from './Modal';
import { 
    MapPin, 
    Calculator, 
    TrendingUp,
    TrendingDown,
    Plus,
    Edit,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { 
    EnhancedRabItem, 
    RegionalPriceFactor
} from '../types';
import { formatCurrency } from '../constants';

interface RegionalPriceAdjustmentProps {
    rabItems: EnhancedRabItem[];
    onUpdateRegionalFactors?: (itemId: number, factors: RegionalPriceFactor[]) => void;
}

export const RegionalPriceAdjustment: React.FC<RegionalPriceAdjustmentProps> = ({
    rabItems,
    onUpdateRegionalFactors
}) => {
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [showFactorModal, setShowFactorModal] = useState(false);
    const [editingFactor, setEditingFactor] = useState<RegionalPriceFactor | null>(null);
    const [newFactor, setNewFactor] = useState<Partial<RegionalPriceFactor>>({
        region: '',
        adjustmentFactor: 1.0,
        category: 'all',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: '',
        isActive: true
    });

    // Pre-defined regions in Indonesia with typical adjustment factors
    const indonesianRegions = [
        { name: 'Jakarta', factor: 1.0, description: 'Capital city - baseline' },
        { name: 'Surabaya', factor: 0.95, description: 'Major city in East Java' },
        { name: 'Bandung', factor: 0.90, description: 'Major city in West Java' },
        { name: 'Medan', factor: 0.85, description: 'Major city in North Sumatra' },
        { name: 'Makassar', factor: 1.10, description: 'Major city in South Sulawesi' },
        { name: 'Balikpapan', factor: 1.25, description: 'Industrial city in East Kalimantan' },
        { name: 'Jayapura', factor: 1.40, description: 'Capital of Papua' },
        { name: 'Pontianak', factor: 1.15, description: 'Capital of West Kalimantan' },
        { name: 'Palembang', factor: 0.88, description: 'Major city in South Sumatra' },
        { name: 'Denpasar', factor: 1.05, description: 'Capital of Bali' },
        { name: 'Remote Areas', factor: 1.50, description: 'Remote/difficult access areas' },
        { name: 'Border Areas', factor: 1.35, description: 'Border regions' }
    ];

    // Calculate overall regional impact
    const regionalImpact = useMemo(() => {
        const activeFactors = rabItems.flatMap(item => 
            item.regionalFactors.filter(factor => factor.isActive)
        );
        
        const totalAdjustment = activeFactors.reduce((sum, factor) => 
            sum + (factor.adjustmentFactor - 1), 0
        );
        
        const avgAdjustment = activeFactors.length > 0 ? totalAdjustment / activeFactors.length : 0;
        
        const regionDistribution = activeFactors.reduce((acc, factor) => {
            acc[factor.region] = (acc[factor.region] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalFactors: activeFactors.length,
            avgAdjustment: avgAdjustment * 100,
            regionDistribution,
            highImpactRegions: activeFactors.filter(factor => factor.adjustmentFactor > 1.2).length
        };
    }, [rabItems]);

    // Filter items by region
    const filteredItems = useMemo(() => {
        if (selectedRegion === 'all') return rabItems;
        
        return rabItems.filter(item => 
            item.regionalFactors.some(factor => 
                factor.region === selectedRegion && factor.isActive
            )
        );
    }, [rabItems, selectedRegion]);

    // Calculate adjusted price for an item
    const calculateAdjustedPrice = (item: EnhancedRabItem, targetRegion?: string): number => {
        let adjustedPrice = item.hargaSatuan;
        
        const applicableFactors = item.regionalFactors.filter(factor => 
            factor.isActive && 
            new Date(factor.effectiveDate) <= new Date() &&
            new Date(factor.expiryDate) >= new Date() &&
            (!targetRegion || factor.region === targetRegion)
        );
        
        for (const factor of applicableFactors) {
            adjustedPrice *= factor.adjustmentFactor;
        }
        
        return adjustedPrice;
    };

    const handleAddFactor = () => {
        if (!newFactor.region || !newFactor.adjustmentFactor) return;

        const factor: RegionalPriceFactor = {
            id: `regional_${Date.now()}`,
            region: newFactor.region,
            adjustmentFactor: newFactor.adjustmentFactor,
            category: newFactor.category || 'all',
            effectiveDate: newFactor.effectiveDate || new Date().toISOString(),
            expiryDate: newFactor.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            reason: newFactor.reason || '',
            isActive: true
        };

        // Add to all applicable items or specific category
        rabItems.forEach(item => {
            const updatedFactors = [...item.regionalFactors, factor];
            if (onUpdateRegionalFactors) {
                onUpdateRegionalFactors(item.id, updatedFactors);
            }
        });

        resetForm();
    };

    const handleEditFactor = (factor: RegionalPriceFactor) => {
        setEditingFactor(factor);
        setNewFactor(factor);
        setShowFactorModal(true);
    };

    const handleUpdateFactor = () => {
        if (!editingFactor || !newFactor.region) return;

        const updatedFactor: RegionalPriceFactor = {
            ...editingFactor,
            ...newFactor
        };

        // Update factor in all items
        rabItems.forEach(item => {
            const factorIndex = item.regionalFactors.findIndex(f => f.id === editingFactor.id);
            if (factorIndex >= 0) {
                const updatedFactors = [...item.regionalFactors];
                updatedFactors[factorIndex] = updatedFactor;
                if (onUpdateRegionalFactors) {
                    onUpdateRegionalFactors(item.id, updatedFactors);
                }
            }
        });

        resetForm();
    };

    const resetForm = () => {
        setNewFactor({
            region: '',
            adjustmentFactor: 1.0,
            category: 'all',
            effectiveDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reason: '',
            isActive: true
        });
        setEditingFactor(null);
        setShowFactorModal(false);
    };

    const getAdjustmentColor = (factor: number): string => {
        if (factor > 1.2) return 'text-red-600';
        if (factor > 1.1) return 'text-orange-600';
        if (factor > 1.0) return 'text-yellow-600';
        if (factor < 0.9) return 'text-green-600';
        return 'text-blue-600';
    };

    const getAdjustmentIcon = (factor: number) => {
        if (factor > 1.0) return <TrendingUp className="w-4 h-4" />;
        if (factor < 1.0) return <TrendingDown className="w-4 h-4" />;
        return <CheckCircle className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Regional Impact Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Active Regions</p>
                                <p className="text-2xl font-bold text-night-black">
                                    {Object.keys(regionalImpact.regionDistribution).length}
                                </p>
                            </div>
                            <MapPin className="w-8 h-8 text-persimmon" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Avg Adjustment</p>
                                <p className={`text-2xl font-bold ${getAdjustmentColor(1 + regionalImpact.avgAdjustment / 100)}`}>
                                    {regionalImpact.avgAdjustment >= 0 ? '+' : ''}{regionalImpact.avgAdjustment.toFixed(1)}%
                                </p>
                            </div>
                            <Calculator className="w-8 h-8 text-persimmon" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">High Impact Regions</p>
                                <p className="text-2xl font-bold text-red-500">
                                    {regionalImpact.highImpactRegions}
                                </p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-palladium">Total Factors</p>
                                <p className="text-2xl font-bold text-blue-500">
                                    {regionalImpact.totalFactors}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Regional Adjustment Templates */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Template Regional Adjustment Indonesia</CardTitle>
                            <CardDescription>
                                Template standar untuk penyesuaian harga berdasarkan region di Indonesia
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowFactorModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Custom Factor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {indonesianRegions.map(region => (
                            <div
                                key={region.name}
                                className="p-4 border border-violet-essence rounded-lg hover:bg-violet-essence/20 cursor-pointer"
                                onClick={() => setNewFactor({
                                    ...newFactor,
                                    region: region.name,
                                    adjustmentFactor: region.factor,
                                    reason: region.description
                                })}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-night-black">{region.name}</h4>
                                    <div className="flex items-center gap-1">
                                        {getAdjustmentIcon(region.factor)}
                                        <span className={`font-bold ${getAdjustmentColor(region.factor)}`}>
                                            {((region.factor - 1) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-palladium">{region.description}</p>
                                <p className="text-xs text-persimmon mt-1">
                                    Factor: {region.factor}x
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Region Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter by Region</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full md:w-64"
                    >
                        <option value="all">All Regions</option>
                        {Object.keys(regionalImpact.regionDistribution).map(region => (
                            <option key={region} value={region}>
                                {region} ({regionalImpact.regionDistribution[region]} items)
                            </option>
                        ))}
                    </Select>
                </CardContent>
            </Card>

            {/* Price Comparison Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Regional Price Comparison</CardTitle>
                    <CardDescription>
                        Perbandingan harga dasar dengan harga yang disesuaikan per region
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-violet-essence/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3 text-left">Item RAB</th>
                                    <th className="p-3 text-right">Base Price</th>
                                    <th className="p-3 text-center">Active Regions</th>
                                    <th className="p-3 text-right">Jakarta Price</th>
                                    <th className="p-3 text-right">Remote Areas</th>
                                    <th className="p-3 text-right">Max Difference</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const jakartaPrice = calculateAdjustedPrice(item, 'Jakarta');
                                    const remotePrice = calculateAdjustedPrice(item, 'Remote Areas');
                                    const maxDiff = Math.abs(remotePrice - jakartaPrice);
                                    
                                    return (
                                        <tr key={item.id} className="border-b border-violet-essence hover:bg-violet-essence/30">
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium text-night-black">{item.uraian}</p>
                                                    <p className="text-xs text-palladium">{item.kategori}</p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-medium">
                                                {formatCurrency(item.hargaSatuan)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {item.regionalFactors
                                                        .filter(f => f.isActive)
                                                        .slice(0, 2)
                                                        .map(factor => (
                                                            <span
                                                                key={factor.id}
                                                                className="px-2 py-1 bg-violet-essence/30 rounded text-xs"
                                                            >
                                                                {factor.region}
                                                            </span>
                                                        ))
                                                    }
                                                    {item.regionalFactors.filter(f => f.isActive).length > 2 && (
                                                        <span className="text-xs text-palladium">
                                                            +{item.regionalFactors.filter(f => f.isActive).length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-medium text-blue-600">
                                                    {formatCurrency(jakartaPrice)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-medium text-red-600">
                                                    {formatCurrency(remotePrice)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div>
                                                    <p className="font-medium text-orange-600">
                                                        {formatCurrency(maxDiff)}
                                                    </p>
                                                    <p className="text-xs text-palladium">
                                                        {((maxDiff / item.hargaSatuan) * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex gap-1 justify-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (item.regionalFactors.length > 0) {
                                                                handleEditFactor(item.regionalFactors[0]);
                                                            }
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Factor Modal */}
            {showFactorModal && (
                <Modal
                    isOpen={showFactorModal}
                    onClose={resetForm}
                    title={editingFactor ? 'Edit Regional Factor' : 'Add Regional Price Factor'}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Region</label>
                            <Input
                                value={newFactor.region || ''}
                                onChange={(e) => setNewFactor({...newFactor, region: e.target.value})}
                                placeholder="e.g., Jakarta, Surabaya, Remote Areas"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Adjustment Factor</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newFactor.adjustmentFactor || 1.0}
                                    onChange={(e) => setNewFactor({...newFactor, adjustmentFactor: Number(e.target.value)})}
                                    min="0.1"
                                    max="3.0"
                                />
                                <p className="text-xs text-palladium mt-1">
                                    1.0 = no change, 1.2 = +20%, 0.8 = -20%
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <Select
                                    value={newFactor.category || 'all'}
                                    onChange={(e) => setNewFactor({...newFactor, category: e.target.value as any})}
                                >
                                    <option value="all">All Categories</option>
                                    <option value="labor">Labor Only</option>
                                    <option value="material">Material Only</option>
                                    <option value="equipment">Equipment Only</option>
                                    <option value="overhead">Overhead Only</option>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Effective Date</label>
                                <Input
                                    type="date"
                                    value={newFactor.effectiveDate?.split('T')[0] || ''}
                                    onChange={(e) => setNewFactor({...newFactor, effectiveDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                <Input
                                    type="date"
                                    value={newFactor.expiryDate?.split('T')[0] || ''}
                                    onChange={(e) => setNewFactor({...newFactor, expiryDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Reason/Description</label>
                            <Input
                                value={newFactor.reason || ''}
                                onChange={(e) => setNewFactor({...newFactor, reason: e.target.value})}
                                placeholder="e.g., Remote location premium, Urban efficiency discount"
                            />
                        </div>

                        {/* Preview */}
                        {newFactor.adjustmentFactor && (
                            <div className="p-3 bg-violet-essence/20 rounded-lg">
                                <p className="text-sm font-medium mb-2">Preview:</p>
                                <p className="text-xs text-palladium">
                                    {newFactor.adjustmentFactor > 1 ? 'Price increase:' : 'Price decrease:'} 
                                    {' '}{Math.abs((newFactor.adjustmentFactor - 1) * 100).toFixed(1)}%
                                </p>
                                <p className="text-xs text-palladium">
                                    Example: Rp 1,000,000 → {formatCurrency(1000000 * (newFactor.adjustmentFactor || 1))}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button 
                                onClick={editingFactor ? handleUpdateFactor : handleAddFactor} 
                                className="flex-1"
                            >
                                {editingFactor ? 'Update Factor' : 'Add Factor'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default RegionalPriceAdjustment;