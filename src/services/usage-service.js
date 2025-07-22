const { spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');

class UsageService {
    getUsage(period) {
        return new Promise((resolve, reject) => {
            try {
                const ccusageScriptPath = this._getCcusageScriptPath();
                const ccusage = spawn('node', [ccusageScriptPath, 'blocks', '--json']);
                this._handleCcusageProcess(ccusage, period, resolve, reject);
            } catch (error) {
                const ccusage = spawn('npx', ['ccusage', 'blocks', '--json']);
                this._handleCcusageProcess(ccusage, period, resolve, reject);
            }
        });
    }

    _handleCcusageProcess(ccusage, period, resolve, reject) {
        let stdout = '';
        let stderr = '';

        ccusage.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        ccusage.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ccusage.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`ccusage error: ${stderr || 'Unknown error'}`));
            }
            try {
                const result = JSON.parse(stdout);
                const blocks = result.blocks || result;
                const processedData = this._processBlocksData(blocks, period);
                resolve(processedData);
            } catch (error) {
                reject(new Error('Failed to parse ccusage output.'));
            }
        });

        ccusage.on('error', (err) => {
            reject(new Error('Failed to start ccusage process. Is ccusage installed?'));
        });
    }

    _processBlocksData(blocks, period) {
        if (!blocks || blocks.length === 0) {
            return { total_cost: 0, total_input_tokens: 0, total_output_tokens: 0, days: 0, blocks: [] };
        }

        let filteredBlocks = blocks.filter(block => !block.isGap);
        const now = new Date();

        if (period === 'daily') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredBlocks = filteredBlocks.filter(block => new Date(block.startTime) >= today);
        } else if (period === '7days') {
            const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
            filteredBlocks = filteredBlocks.filter(block => new Date(block.startTime) >= sevenDaysAgo);
        } else if (period === 'month') {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredBlocks = filteredBlocks.filter(block => new Date(block.startTime) >= firstDayOfMonth);
        }


        const totals = filteredBlocks.reduce((acc, block) => {
            acc.total_cost += block.costUSD || 0;
            acc.total_input_tokens += block.tokenCounts?.inputTokens || 0;
            acc.total_output_tokens += block.tokenCounts?.outputTokens || 0;
            acc.total_cache_creation += block.tokenCounts?.cacheCreationInputTokens || 0;
            acc.total_cache_read += block.tokenCounts?.cacheReadInputTokens || 0;
            return acc;
        }, {
            total_cost: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_cache_creation: 0,
            total_cache_read: 0
        });

        const activeBlock = filteredBlocks.find(b => b.isActive);

        return {
            ...totals,
            days: filteredBlocks.length,
            burnRate: activeBlock?.burnRate,
            projection: activeBlock?.projection,
            blocks: filteredBlocks.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
        };
    }

    _getCcusageScriptPath() {
        const fs = require('fs');
        
        const possiblePaths = [
            path.join(__dirname, '..', '..', 'node_modules', 'ccusage', 'dist', 'index.js'),
            path.join(app.getAppPath(), 'node_modules', 'ccusage', 'dist', 'index.js'),
            path.join(process.resourcesPath, 'app', 'node_modules', 'ccusage', 'dist', 'index.js'),
            path.join(process.resourcesPath, 'app.asar', 'node_modules', 'ccusage', 'dist', 'index.js'),
            path.join(process.cwd(), 'node_modules', 'ccusage', 'dist', 'index.js')
        ];

        for (const testPath of possiblePaths) {
            try {
                if (fs.existsSync(testPath)) {
                    return testPath;
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error('ccusage script not found in any expected location')
    }
}

module.exports = UsageService;
