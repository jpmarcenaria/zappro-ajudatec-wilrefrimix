#!/usr/bin/env node

/**
 * Test script for HVAC-R RAG Integration
 * Usage: node test-hvacr-rag.mjs
 */

const API_URL = 'http://localhost:3000/api/openai/chat'

const testQueries = [
    {
        name: 'Brand + Model + Error Code',
        query: 'Daikin VRV dando erro U4',
        expectedExtraction: { brand: 'Daikin', model: 'VRV', errorCode: 'U4' }
    },
    {
        name: 'Generic Inverter Issue',
        query: 'Inverter piscando 3 vezes',
        expectedExtraction: { brand: null, model: null, errorCode: null }
    },
    {
        name: 'Error Code Only',
        query: 'Ar condicionado dando erro E1',
        expectedExtraction: { brand: null, model: null, errorCode: 'E1' }
    },
    {
        name: 'Brand + Error',
        query: 'Midea erro F0',
        expectedExtraction: { brand: 'Midea', model: null, errorCode: 'F0' }
    }
]

async function testAPI(query) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: "${query.query}"`)
    console.log(`${'='.repeat(60)}`)

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: query.query })
        })

        if (!response.ok) {
            console.error(`❌ HTTP Error: ${response.status}`)
            const text = await response.text()
            console.error(text.slice(0, 200))
            return false
        }

        const data = await response.json()

        console.log(`✅ Response received:`)
        console.log(`   Text length: ${data.text?.length || 0} chars`)
        console.log(`   First 100 chars: ${data.text?.slice(0, 100) || 'N/A'}`)

        return true

    } catch (error) {
        console.error(`❌ Request failed:`, error.message)
        return false
    }
}

async function runTests() {
    console.log('🔧 HVAC-R RAG Integration Test Suite')
    console.log('=====================================\n')
    console.log(`Target: ${API_URL}\n`)

    let passed = 0
    let failed = 0

    for (const query of testQueries) {
        const result = await testAPI(query)
        if (result) {
            passed++
        } else {
            failed++
        }

        // Wait 1 second between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Test Results: ${passed} passed, ${failed} failed`)
    console.log(`${'='.repeat(60)}\n`)
    console.log('💡 Check the dev server terminal for detailed logs with:')
    console.log('   - brand/model/errorCode extraction')
    console.log('   - chunksFound count')
    console.log('   - avgSimilarity score')
    console.log('   - topChunkSection and topChunkSimilarity')
}

runTests().catch(console.error)
