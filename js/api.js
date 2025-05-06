/**
 * Claude API接続用のクラス
 */
class ClaudeAPI {
    constructor() {
        this.apiKey = localStorage.getItem('claude_api_key') || '';
        this.model = localStorage.getItem('claude_model') || 'claude-3.7-sonnet';
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.maxTokens = 4096;
    }

    /**
     * API設定を更新
     * @param {string} apiKey - Claude API Key
     * @param {string} model - 使用するモデル
     */
    updateSettings(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
        localStorage.setItem('claude_api_key', apiKey);
        localStorage.setItem('claude_model', model);
    }

    /**
     * メッセージを送信
     * @param {string} prompt - ユーザーからのプロンプト
     * @param {Array} messages - 会話履歴
     * @returns {Promise} - APIレスポンス
     */
    async sendMessage(prompt, messages = []) {
        if (!this.apiKey) {
            throw new Error('APIキーが設定されていません。設定から追加してください。');
        }

        const conversationHistory = this._formatMessages(messages);
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        ...conversationHistory,
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: this.maxTokens
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Claude API Error:', error);
            throw error;
        }
    }

    /**
     * メッセージを適切な形式に変換
     * @param {Array} messages - 会話履歴
     * @returns {Array} - APIに適した形式の会話履歴
     */
    _formatMessages(messages) {
        return messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    /**
     * APIキーが有効かテスト
     * @returns {Promise<boolean>} - APIキーが有効かどうか
     */
    async testApiKey() {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/models', {
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('API Key Test Error:', error);
            return false;
        }
    }
}

// グローバルインスタンス
const claudeAPI = new ClaudeAPI();