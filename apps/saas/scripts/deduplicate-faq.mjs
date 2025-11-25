#!/usr/bin/env node
/**
 * Deduplicação de FAQs por similaridade de embedding
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deduplicateFAQs() {
    console.log('🧹 Iniciando deduplicação de FAQs...\n');

    // Buscar todas as FAQs
    const { data: faqs, error } = await supabase
        .from('faq_knowledge_base')
        .select('*')
        .order('prioridade', { ascending: true });

    if (error) {
        console.error('❌ Erro ao buscar FAQs:', error.message);
        return;
    }

    console.log(`📊 ${faqs.length} FAQs no banco\n`);

    const toDelete = [];
    const seen = new Set();

    for (let i = 0; i < faqs.length; i++) {
        const faq1 = faqs[i];

        if (seen.has(faq1.id)) continue;

        for (let j = i + 1; j < faqs.length; j++) {
            const faq2 = faqs[j];

            if (seen.has(faq2.id)) continue;

            // Calcular similaridade de embedding
            const similarity = calculateCosineSimilarity(faq1.embedding, faq2.embedding);

            if (similarity > 0.95) {
                // Duplicado detectado - manter o de maior prioridade
                const toKeep = faq1.prioridade <= faq2.prioridade ? faq1 : faq2;
                const toRemove = toKeep.id === faq1.id ? faq2 : faq1;

                console.log(`   🔍 Duplicado encontrado (${similarity.toFixed(3)}):`);
                console.log(`      Mantendo: ${toKeep.pergunta.slice(0, 50)}...`);
                console.log(`      Removendo: ${toRemove.pergunta.slice(0, 50)}...`);

                toDelete.push(toRemove.id);
                seen.add(toRemove.id);
            }
        }
    }

    if (toDelete.length === 0) {
        console.log('\n✅ Nenhum duplicado encontrado!');
        return;
    }

    console.log(`\n🗑️ Removendo ${toDelete.length} duplicados...`);

    const { error: deleteError } = await supabase
        .from('faq_knowledge_base')
        .delete()
        .in('id', toDelete);

    if (deleteError) {
        console.error('❌ Erro ao remover duplicados:', deleteError.message);
    } else {
        console.log(`✅ ${toDelete.length} FAQs duplicadas removidas!`);
    }
}

function calculateCosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

deduplicateFAQs().catch(console.error);
