import { supabase } from './supabase';
import { FiscalNote } from '../types';

export const nuvemFiscalService = {
    /**
     * Chama a Edge Function para interagir com a API da Nuvem Fiscal
     */
    async invokeFunction(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', payload?: any) {
        const { data, error } = await supabase.functions.invoke('nuvem-fiscal', {
            body: {
                endpoint,
                method,
                payload
            }
        });

        if (error) throw error;
        return data;
    },

    /**
     * Busca nota fiscal vinculada a uma transação no banco local
     */
    async getLocalFiscalNote(transactionId: string): Promise<FiscalNote | null> {
        const { data, error } = await supabase
            .from('fiscal_notes')
            .select('*')
            .eq('transaction_id', transactionId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Cria registro inicial da nota no banco local e inicia emissão na Nuvem Fiscal
     */
    async issueNFe(transaction: any, companyInfo: any): Promise<FiscalNote> {
        // 1. Criar registro pendente no banco local
        const { data: localNote, error: localError } = await supabase
            .from('fiscal_notes')
            .insert({
                transaction_id: transaction.id,
                user_id: (await supabase.auth.getUser()).data.user?.id,
                status: 'pending'
            })
            .select()
            .single();

        if (localError) throw localError;

        try {
            // 2. Preparar payload básico para Nuvem Fiscal (Exemplo simplificado)
            // Nota: O payload real da NF-e é enorme. Aqui passamos o essencial.
            const payload = {
                natureza_operacao: "Venda de mercadoria",
                tipo_operacao: 1, // Saída
                finalidade_emissao: 1, // Normal
                ambiente: "homologacao", // ou "producao"
                data_emissao: new Date().toISOString(),
                items: [
                    {
                        descricao: transaction.description,
                        quantidade: 1,
                        valor_unitario: transaction.amount,
                        valor_total: transaction.amount,
                        ncm: "99999999", // NCM Genérico ou vir do cadastro
                        codigo_produto: "001",
                        unidade_comercial: "UN",
                        tributacao: {
                            icms: {
                                origem: 0,
                                cst: "41" // Não tributada
                            },
                            pis: { cst: "07" },
                            cofins: { cst: "07" }
                        }
                    }
                ],
                inf_adic: {
                    inf_cpl: "Nota emitida via Monely Finance"
                }
                // Dados do destinatário devem vir do cadastro de clientes ou ser solicitados.
                // Para este MVP, assumimos dados que devem estar no companyInfo.
            };

            // 3. Chamar Nuvem Fiscal
            const result = await this.invokeFunction('/nfe', 'POST', payload);

            if (result.id) {
                // 4. Atualizar registro local com o ID da Nuvem Fiscal
                const { data: updatedNote, error: updateError } = await supabase
                    .from('fiscal_notes')
                    .update({
                        nuvem_fiscal_id: result.id,
                        status: result.status === 'autorizado' ? 'authorized' : 'processing'
                    })
                    .eq('id', localNote.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return updatedNote;
            }

            return localNote;
        } catch (err: any) {
            // Atualizar com erro
            await supabase
                .from('fiscal_notes')
                .update({
                    status: 'rejected',
                    error_message: err.message
                })
                .eq('id', localNote.id);

            throw err;
        }
    },

    /**
     * Consulta status atual da nota na Nuvem Fiscal e atualiza localmente
     */
    async syncNFeStatus(fiscalNote: FiscalNote): Promise<FiscalNote> {
        if (!fiscalNote.nuvem_fiscal_id) return fiscalNote;

        const result = await this.invokeFunction(`/nfe/${fiscalNote.nuvem_fiscal_id}`, 'GET');

        const updates: Partial<FiscalNote> = {
            status: result.status === 'autorizado' ? 'authorized' :
                result.status === 'rejeitado' ? 'rejected' :
                    result.status === 'cancelado' ? 'canceled' : 'processing',
            nfe_number: result.numero,
            nfe_series: result.serie,
        };

        if (result.status === 'autorizado') {
            const downloads = await this.invokeFunction(`/nfe/${fiscalNote.nuvem_fiscal_id}/downloads`, 'GET');
            updates.xml_url = downloads.xml;
            updates.pdf_url = downloads.pdf;
        }

        const { data: updatedNote, error } = await supabase
            .from('fiscal_notes')
            .update(updates)
            .eq('id', fiscalNote.id)
            .select()
            .single();

        if (error) throw error;
        return updatedNote;
    }
};
