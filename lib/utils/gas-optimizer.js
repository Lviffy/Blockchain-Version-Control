const { ethers } = require('ethers');

class GasOptimizer {
    constructor(provider, networkConfig) {
        this.provider = provider;
        this.networkConfig = networkConfig;
        this.gasHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Get optimized gas price based on network conditions
     */
    async getOptimizedGasPrice() {
        try {
            const currentGasPrice = await this.provider.getGasPrice();
            const maxGasPrice = ethers.utils.parseUnits(
                process.env.MAX_GAS_PRICE || '50', 
                'gwei'
            );

            // Use lower of current price or max configured price
            const optimizedPrice = currentGasPrice.gt(maxGasPrice) 
                ? maxGasPrice 
                : currentGasPrice;

            // Add small buffer for reliability (5%)
            return optimizedPrice.mul(105).div(100);
        } catch (error) {
            console.warn('Failed to get gas price, using default:', error.message);
            return ethers.utils.parseUnits(
                this.networkConfig.gasPrice?.toString() || '20', 
                'gwei'
            );
        }
    }

    /**
     * Estimate gas with optimization
     */
    async estimateGas(contract, method, args) {
        try {
            const estimated = await contract.estimateGas[method](...args);
            
            // Add 10% buffer for safety
            const withBuffer = estimated.mul(110).div(100);
            
            // Ensure within limits
            const maxGas = this.networkConfig.gasLimit || 8000000;
            return withBuffer.gt(maxGas) ? ethers.BigNumber.from(maxGas) : withBuffer;
        } catch (error) {
            console.warn('Gas estimation failed:', error.message);
            return ethers.BigNumber.from(this.networkConfig.gasLimit || 8000000);
        }
    }

    /**
     * Track gas usage for analytics
     */
    recordGasUsage(txHash, gasUsed, gasPrice) {
        this.gasHistory.push({
            timestamp: Date.now(),
            txHash,
            gasUsed: gasUsed.toString(),
            gasPrice: gasPrice.toString(),
            cost: gasUsed.mul(gasPrice).toString()
        });

        // Keep history size manageable
        if (this.gasHistory.length > this.maxHistorySize) {
            this.gasHistory = this.gasHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Get gas usage statistics
     */
    getGasStats() {
        if (this.gasHistory.length === 0) {
            return { avgGasUsed: 0, avgGasPrice: 0, totalCost: '0' };
        }

        const totalGasUsed = this.gasHistory.reduce(
            (sum, tx) => sum + parseInt(tx.gasUsed), 0
        );
        const totalGasPrice = this.gasHistory.reduce(
            (sum, tx) => sum + parseInt(tx.gasPrice), 0
        );
        const totalCost = this.gasHistory.reduce(
            (sum, tx) => ethers.BigNumber.from(sum).add(tx.cost), 
            ethers.BigNumber.from(0)
        );

        return {
            avgGasUsed: Math.round(totalGasUsed / this.gasHistory.length),
            avgGasPrice: Math.round(totalGasPrice / this.gasHistory.length),
            totalCost: ethers.utils.formatEther(totalCost),
            transactionCount: this.gasHistory.length
        };
    }

    /**
     * Suggest gas optimizations
     */
    suggestOptimizations() {
        const stats = this.getGasStats();
        const suggestions = [];

        if (stats.avgGasUsed > 500000) {
            suggestions.push({
                type: 'gas-usage',
                message: 'High gas usage detected. Consider batching operations.',
                priority: 'high'
            });
        }

        if (stats.avgGasPrice > 50000000000) { // 50 gwei
            suggestions.push({
                type: 'gas-price',
                message: 'High gas prices. Consider using checkpoint batching.',
                priority: 'medium'
            });
        }

        if (this.networkConfig.isTestnet && stats.avgGasUsed > 200000) {
            suggestions.push({
                type: 'testnet',
                message: 'Consider testing on localhost first for development.',
                priority: 'low'
            });
        }

        return suggestions;
    }
}

module.exports = GasOptimizer;