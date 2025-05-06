/**
 * CORS対応のプロキシ機能
 * ローカル環境でAPI呼び出しをする際のCORS問題を回避
 */
class CorsProxy {
    constructor() {
        this.proxyUrl = 'https://corsproxy.io/?';
        this.useProxy = false; // デフォルトでは無効
        
        // プロキシ設定を読み込み
        this.loadSettings();
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
        const savedSetting = localStorage.getItem('use_cors_proxy');
        this.useProxy = savedSetting === 'true';
    }

    /**
     * プロキシの有効/無効を切り替え
     * @param {boolean} enabled - 有効にするかどうか
     */
    setProxyEnabled(enabled) {
        this.useProxy = enabled;
        localStorage.setItem('use_cors_proxy', enabled.toString());
    }

    /**
     * URLにプロキシを適用
     * @param {string} url - 元のURL
     * @returns {string} - プロキシを適用したURL
     */
    applyProxy(url) {
        if (!this.useProxy) {
            return url;
        }
        
        // すでにプロキシが適用されている場合は何もしない
        if (url.startsWith(this.proxyUrl)) {
            return url;
        }
        
        return this.proxyUrl + encodeURIComponent(url);
    }

    /**
     * fetchメソッドをプロキシ対応にラップ
     * @param {string} url - 元のURL
     * @param {Object} options - fetchオプション
     * @returns {Promise} - fetchの結果
     */
    async fetch(url, options = {}) {
        const proxiedUrl = this.applyProxy(url);
        
        try {
            return await fetch(proxiedUrl, options);
        } catch (error) {
            console.error('Proxy fetch error:', error);
            
            // プロキシが失敗した場合は直接アクセスを試みる
            if (this.useProxy && proxiedUrl !== url) {
                console.log('Trying direct fetch as fallback');
                return fetch(url, options);
            }
            
            throw error;
        }
    }
}

// グローバルインスタンス
const corsProxy = new CorsProxy();