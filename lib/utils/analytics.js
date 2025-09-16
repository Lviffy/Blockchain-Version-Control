const fs = require('fs-extra');
const path = require('path');

class BVCAnalytics {
    constructor() {
        this.analyticsFile = path.join(process.cwd(), '.bvc-analytics.json');
        this.sessionStart = Date.now();
        this.metrics = {
            commands: {},
            repositories: {},
            performance: {},
            errors: [],
            usage: {
                totalCommands: 0,
                totalRepositories: 0,
                totalCommits: 0,
                totalCheckpoints: 0
            }
        };
    }

    /**
     * Initialize analytics system
     */
    async initialize() {
        try {
            if (await fs.pathExists(this.analyticsFile)) {
                const data = await fs.readJson(this.analyticsFile);
                this.metrics = { ...this.metrics, ...data };
            }
        } catch (error) {
            console.warn('Analytics initialization failed:', error.message);
        }
    }

    /**
     * Track command usage
     */
    trackCommand(command, args = [], duration = 0) {
        const timestamp = Date.now();
        
        if (!this.metrics.commands[command]) {
            this.metrics.commands[command] = {
                count: 0,
                totalDuration: 0,
                lastUsed: null,
                avgDuration: 0
            };
        }

        this.metrics.commands[command].count++;
        this.metrics.commands[command].totalDuration += duration;
        this.metrics.commands[command].lastUsed = timestamp;
        this.metrics.commands[command].avgDuration = 
            this.metrics.commands[command].totalDuration / 
            this.metrics.commands[command].count;

        this.metrics.usage.totalCommands++;
        
        this.saveMetrics();
    }

    /**
     * Track repository activity
     */
    trackRepository(repoName, action, details = {}) {
        const timestamp = Date.now();
        
        if (!this.metrics.repositories[repoName]) {
            this.metrics.repositories[repoName] = {
                created: timestamp,
                commits: 0,
                checkpoints: 0,
                lastActivity: null,
                size: 0
            };
            this.metrics.usage.totalRepositories++;
        }

        const repo = this.metrics.repositories[repoName];
        repo.lastActivity = timestamp;

        switch (action) {
            case 'commit':
                repo.commits++;
                this.metrics.usage.totalCommits++;
                break;
            case 'checkpoint':
                repo.checkpoints++;
                this.metrics.usage.totalCheckpoints++;
                break;
            case 'size_update':
                repo.size = details.size || 0;
                break;
        }

        this.saveMetrics();
    }

    /**
     * Track performance metrics
     */
    trackPerformance(operation, duration, details = {}) {
        const timestamp = Date.now();
        
        if (!this.metrics.performance[operation]) {
            this.metrics.performance[operation] = {
                count: 0,
                totalDuration: 0,
                avgDuration: 0,
                minDuration: Infinity,
                maxDuration: 0
            };
        }

        const perf = this.metrics.performance[operation];
        perf.count++;
        perf.totalDuration += duration;
        perf.avgDuration = perf.totalDuration / perf.count;
        perf.minDuration = Math.min(perf.minDuration, duration);
        perf.maxDuration = Math.max(perf.maxDuration, duration);

        this.saveMetrics();
    }

    /**
     * Track errors
     */
    trackError(error, context = {}) {
        const errorRecord = {
            timestamp: Date.now(),
            message: error.message || error,
            stack: error.stack,
            context: context
        };

        this.metrics.errors.push(errorRecord);

        // Keep only recent errors (last 100)
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }

        this.saveMetrics();
    }

    /**
     * Generate usage report
     */
    generateReport() {
        const now = Date.now();
        const sessionDuration = now - this.sessionStart;

        const report = {
            generated: new Date().toISOString(),
            sessionDuration: Math.round(sessionDuration / 1000),
            summary: {
                totalCommands: this.metrics.usage.totalCommands,
                totalRepositories: this.metrics.usage.totalRepositories,
                totalCommits: this.metrics.usage.totalCommits,
                totalCheckpoints: this.metrics.usage.totalCheckpoints,
                errorCount: this.metrics.errors.length
            },
            topCommands: this.getTopCommands(),
            activeRepositories: this.getActiveRepositories(),
            performanceInsights: this.getPerformanceInsights(),
            recentErrors: this.getRecentErrors()
        };

        return report;
    }

    /**
     * Get top used commands
     */
    getTopCommands(limit = 5) {
        return Object.entries(this.metrics.commands)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([command, stats]) => ({
                command,
                count: stats.count,
                avgDuration: Math.round(stats.avgDuration),
                lastUsed: new Date(stats.lastUsed).toISOString()
            }));
    }

    /**
     * Get active repositories
     */
    getActiveRepositories(limit = 5) {
        return Object.entries(this.metrics.repositories)
            .sort((a, b) => b[1].lastActivity - a[1].lastActivity)
            .slice(0, limit)
            .map(([repo, stats]) => ({
                repository: repo,
                commits: stats.commits,
                checkpoints: stats.checkpoints,
                lastActivity: new Date(stats.lastActivity).toISOString(),
                size: stats.size
            }));
    }

    /**
     * Get performance insights
     */
    getPerformanceInsights() {
        const insights = [];
        
        Object.entries(this.metrics.performance).forEach(([operation, stats]) => {
            if (stats.avgDuration > 5000) { // > 5 seconds
                insights.push({
                    type: 'slow_operation',
                    operation,
                    avgDuration: Math.round(stats.avgDuration),
                    suggestion: 'Consider optimization or check network connectivity'
                });
            }
        });

        return insights;
    }

    /**
     * Get recent errors
     */
    getRecentErrors(limit = 5) {
        return this.metrics.errors
            .slice(-limit)
            .map(error => ({
                timestamp: new Date(error.timestamp).toISOString(),
                message: error.message,
                context: error.context
            }));
    }

    /**
     * Save metrics to file
     */
    async saveMetrics() {
        try {
            await fs.writeJson(this.analyticsFile, this.metrics, { spaces: 2 });
        } catch (error) {
            // Silently fail to avoid disrupting user operations
        }
    }

    /**
     * Clear analytics data
     */
    async clearData() {
        this.metrics = {
            commands: {},
            repositories: {},
            performance: {},
            errors: [],
            usage: {
                totalCommands: 0,
                totalRepositories: 0,
                totalCommits: 0,
                totalCheckpoints: 0
            }
        };
        
        await this.saveMetrics();
        console.log('✅ Analytics data cleared');
    }
}

module.exports = BVCAnalytics;