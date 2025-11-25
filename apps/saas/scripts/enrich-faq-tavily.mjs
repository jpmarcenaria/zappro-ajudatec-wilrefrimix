#!/usr/bin/env node
/**
 * Script de Enriquecimento com Tavily
 * Valida FAQs com fontes oficiais
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enrichWithTavily(faq) {
    console.log(`   🔍 Enriquecendo: ${faq.pergunta.slice(0, 60)}...`);

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
            },
            body: JSON.stringify({
                query: `${faq.pergunta} site:daikin.com.br OR site:midea.com.br OR site:lg.com`,
                search_depth: 'advanced',
                max_results: 3,
                include_domains: ['daikin.com.br', 'midea.com.br', 'lg.com', 'carrier.com.br']
            })
        });

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            console.log(`      ⚠️ Nenhuma referência encontrada`);
            return [];
        }

        const referencias = data.results.map(r => ({
            titulo: r.title,
            url: r.url,
            snippet: r.content?.slice(0, 200) || ''
        }));

        console.log(`      ✅ ${referencias.length} referências encontradas`);
        return referencias;

    } catch (error) {
        console.error(`      ❌ Erro Tavily:`, error.message);
        return [];
    }
}

async function enrichAllFAQs() {
    console.log('🚀 Iniciando enriquecimento de FAQs...\n');

    // Pegar FAQs sem enriquecimento
    const { data: faqs, error } = await supabase
        .from('faq_knowledge_base')
        .select('*')
        .is('referencias_validadas', null)
        .order('prioridade', { ascending: true })
        .limit(20);

    if (error) {
        console.error('❌ Erro ao buscar FAQs:', error.message);
        return;
    }

    if (!faqs || faqs.length === 0) {
        console.log('✅ Todas as FAQs já estão enriquecidas!');
        return;
    }

    console.log(`📊 ${faqs.length} FAQs para enriquecer\n`);

    for (const faq of faqs) {
        const referencias = await enrichWithTavily(faq);

        // Atualizar FAQ com referências
        const { error: updateError } = await supabase
            .from('faq_knowledge_base')
            .update({
                referencias_validadas: referencias,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', faq.id);

        if (updateError) {
            console.error(`      ❌ Erro ao atualizar:`, updateError.message);
        }

        // Rate limit: 1s entre requests
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n✅ Enriquecimento completo!');
}

enrichAllFAQs().catch(console.error);
