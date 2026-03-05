const KnowledgeCoverage = require("../../models/KnowledgeCoverage");
const KnowledgeCategory = require("../../models/KnowledgeCategory");
const PageContent = require("../../models/PageContent");
const ConnectionDiscovery = require("../../models/ConnectionDiscovery");
const logger = require("../../utils/logger");

/**
 * Service to calculate and track knowledge coverage metrics
 */
class CoverageService {

    /**
     * Categorize a page based on URL and title keywords
     */
    static categorizePage(url, title = "") {
        const textToMatch = (url + " " + title).toLowerCase();

        if (textToMatch.includes('price') || textToMatch.includes('billing') || textToMatch.includes('plan')) return 'PRICING';
        if (textToMatch.includes('support') || textToMatch.includes('help') || textToMatch.includes('contact')) return 'SUPPORT';
        if (textToMatch.includes('faq') || textToMatch.includes('questions')) return 'FAQ';
        if (textToMatch.includes('about') || textToMatch.includes('team') || textToMatch.includes('who')) return 'ABOUT';
        if (textToMatch.includes('legal') || textToMatch.includes('privacy') || textToMatch.includes('terms')) return 'LEGAL';
        if (textToMatch.includes('blog') || textToMatch.includes('news')) return 'BLOG';
        if (textToMatch.includes('product') || textToMatch.includes('feature')) return 'PRODUCT';

        return 'OTHER';
    }

    /**
     * Calculate and update coverage stats for a connection
     */
    static async updateCoverage(connectionId) {
        try {
            // 1. Get raw counts from discovery vs indexed
            const totalDiscovered = await ConnectionDiscovery.count({ where: { connectionId } });
            const totalIndexed = await ConnectionDiscovery.count({ where: { connectionId, status: 'INDEXED' } });
            const totalPageContents = await PageContent.count({ where: { connectionId, status: 'FETCHED' } });

            // 2. Identify and update per-category counts
            const pages = await PageContent.findAll({ where: { connectionId } });
            const categoryCounts = {
                PRICING: 0, SUPPORT: 0, ABOUT: 0, LEGAL: 0,
                FAQ: 0, BLOG: 0, PRODUCT: 0, OTHER: 0
            };

            for (const page of pages) {
                if (!page.category) {
                    page.category = this.categorizePage(page.url, page.title || "");
                    await page.save();
                }
                categoryCounts[page.category]++;
            }

            // 3. Update KnowledgeCategory table
            for (const [category, count] of Object.entries(categoryCounts)) {
                await KnowledgeCategory.upsert({
                    connectionId,
                    category,
                    pageCount: count,
                    confidence: 1.0 // Simple heuristic for now
                });
            }

            // 4. Determine Critical Coverage
            const criticalCategories = ['PRICING', 'SUPPORT', 'ABOUT', 'PRODUCT'];
            let criticalFoundCount = 0;
            criticalCategories.forEach(cat => {
                if (categoryCounts[cat] > 0) criticalFoundCount++;
            });

            const criticalCoverageScore = criticalFoundCount / criticalCategories.length;
            const overallScore = totalDiscovered > 0 ? (totalIndexed / totalDiscovered) : 1.0;

            // 5. Determine Risk Level
            let riskLevel = 'LOW';
            if (criticalCoverageScore < 0.25) riskLevel = 'CRITICAL';
            else if (criticalCoverageScore < 0.5) riskLevel = 'HIGH';
            else if (criticalCoverageScore < 0.75) riskLevel = 'MEDIUM';

            // 6. Save KnowledgeCoverage
            const [coverage] = await KnowledgeCoverage.findOrCreate({ where: { connectionId } });
            await coverage.update({
                totalDiscoveredPages: totalDiscovered,
                approvedPages: totalPageContents,
                indexedPages: totalIndexed,
                coverageScore: overallScore,
                criticalCoverageScore: criticalCoverageScore,
                riskLevel,
                lastCalculatedAt: new Date()
            });

            logger.info(`✅ [COVERAGE] Updated coverage for ${connectionId}: Score=${(overallScore * 100).toFixed(1)}%, Risk=${riskLevel}`);
            return coverage;

        } catch (error) {
            logger.error(`❌ [COVERAGE] Failed to update: ${error.message}`);
            throw error;
        }
    }
}

module.exports = CoverageService;
