#!/usr/bin/env node
/**
 * Auto-Update FAQ - Orquestrador de atualização semanal
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function autoUpdateFAQ() {
    console.log('🔄 Iniciando atualização automática FAQ...\n');
    const startTime = Date.now();

    try {
        // 1. Crawl novos vídeos YouTube
        console.log('📺 Crawling YouTube...');
        const { stdout: crawlOut } = await execAsync('node scripts/crawl-youtube.mjs');
        console.log(crawlOut);

        // 2. Enriquecer com Tavily
        console.log('\n🔍 Enriquecendo com Tavily...');
        const { stdout: enrichOut } = await execAsync('node scripts/enrich-faq-tavily.mjs');
        console.log(enrichOut);

        // 3. Limpar duplicados
        console.log('\n🧹 Removendo duplicados...');
        const { stdout: dedupOut } = await execAsync('node scripts/deduplicate-faq.mjs');
        console.log(dedupOut);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Atualização completa em ${duration}s!`);

    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        process.exit(1);
    }
}

// Rodar semanalmente via cron
// Crontab: 0 2 * * 0 /usr/bin/node /app/scripts/auto-update-faq.mjs
autoUpdateFAQ();
