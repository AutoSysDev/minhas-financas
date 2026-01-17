import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { Icon } from '../Icon';
import { Dropdown } from '../Dropdown';

interface AddItemModalProps {
    listId: string;
    isOpen: boolean;
    onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ listId, isOpen, onClose }) => {
    const { addItem } = useSupermarket();
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: 1,
        unit: 'un',
        estimated_price: ''
    });

    const categories = [
        'Hortifruti', 'Laticínios', 'Padaria', 'Açougue', 'Limpeza',
        'Higiene', 'Bebidas', 'Congelados', 'Mercearia', 'Outros'
    ];

    const categoryOptions = categories.map(cat => ({
        label: cat,
        value: cat,
        icon: 'category'
    }));

    const unitOptions = [
        { label: 'un', value: 'un' },
        { label: 'kg', value: 'kg' },
        { label: 'g', value: 'g' },
        { label: 'L', value: 'L' },
        { label: 'ml', value: 'ml' },
        { label: 'cx', value: 'cx' },
        { label: 'pct', value: 'pct' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        await addItem(listId, {
            name: formData.name,
            category: formData.category || 'Outros',
            quantity: formData.quantity,
            unit: formData.unit,
            estimated_price: parseFloat(formData.estimated_price) || 0
        });

        setFormData({ name: '', category: '', quantity: 1, unit: 'un', estimated_price: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-[#121820] w-full max-w-sm rounded-[28px] overflow-hidden border border-white/10 flex flex-col max-h-[90vh] shadow-2xl animate-scale-up">
                <div className="p-5 pb-1 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                            <Icon name="add_shopping_cart" className="text-teal-400 text-lg" />
                        </div>
                        <h2 className="text-lg font-black text-white leading-tight tracking-tight">Novo Item</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-7 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    >
                        <Icon name="close" className="text-base" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 pt-3 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Nome */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Nome</label>
                        <div className="relative group">
                            <Icon name="inventory_2" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-teal-400 text-sm transition-colors" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="O que você precisa?"
                                className="w-full bg-white/[0.03] border border-white/5 focus:border-teal-500/30 rounded-[14px] py-3 pl-11 pr-4 text-white text-xs focus:ring-0 outline-none transition-all placeholder:text-gray-700 font-medium font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Categoria Custom Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Categoria</label>
                        <Dropdown
                            options={categoryOptions}
                            value={formData.category}
                            onChange={(value) => setFormData({ ...formData, category: value })}
                            placeholder="Selecione a Categoria"
                            icon="category"
                            className="z-[120]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Quantidade */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Qtd</label>
                            <div className="relative group">
                                <Icon name="numbers" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-teal-400 text-sm transition-colors" />
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-white/[0.03] border border-white/5 focus:border-teal-500/30 rounded-[14px] py-2.5 pl-11 pr-3 text-white text-xs focus:ring-0 outline-none transition-all font-bold"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Unidade */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Unid</label>
                            <Dropdown
                                options={unitOptions}
                                value={formData.unit}
                                onChange={(value) => setFormData({ ...formData, unit: value })}
                                placeholder="Un"
                                className="z-[110]"
                            />
                        </div>
                    </div>

                    {/* Preço Estimado */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Preço Total Estimado</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-teal-400/50 group-focus-within:text-teal-400 transition-colors">R$</div>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="w-full bg-white/[0.03] border border-white/5 focus:border-teal-500/30 rounded-[14px] py-3 pl-11 pr-4 text-white text-xs focus:ring-0 outline-none transition-all placeholder:text-gray-700 font-bold"
                                value={formData.estimated_price}
                                onChange={e => setFormData({ ...formData, estimated_price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-3">
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-[18px] shadow-lg shadow-teal-500/20 hover:scale-[1.01] active:scale-95 transition-all text-[11px] uppercase tracking-widest"
                        >
                            Confirmar Item
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 text-gray-600 hover:text-white font-bold text-[9px] uppercase tracking-widest transition-colors"
                        >
                            Voltar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
