/**
 * UI関連の操作を管理するクラス
 */
class UI {
    constructor() {
        this.initTheme();
        this.bindEvents();
    }

    /**
     * テーマの初期化
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').innerHTML = '☀️';
        }
    }

    /**
     * イベントのバインド
     */
    bindEvents() {
        // テーマ切り替え
        const themeToggleBtn = document.getElementById('themeToggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', this.toggleTheme.bind(this));
        }

        // 会話読み込みボタン
        const loadConversationBtn = document.getElementById('loadConversationBtn');
        if (loadConversationBtn) {
            loadConversationBtn.addEventListener('click', this.showLoadConversationModal.bind(this));
        }

        // API接続ボタン
        const connectApiBtn = document.getElementById('connectApiBtn');
        if (connectApiBtn) {
            connectApiBtn.addEventListener('click', this.showConnectApiModal.bind(this));
        }

        // 設定ボタン
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', this.showSettingsModal.bind(this));
        }

        // 検索ボタン
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', this.toggleSearch.bind(this));
        }

        // 検索入力
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // 設定保存ボタン
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', this.saveSettings.bind(this));
        }

        // 会話リストの更新
        this.updateConversationsList();
    }

    /**
     * テーマの切り替え
     */
    toggleTheme() {
        const body = document.body;
        const themeToggleBtn = document.getElementById('themeToggle');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            themeToggleBtn.innerHTML = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            themeToggleBtn.innerHTML = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    }

    /**
     * 会話リストの更新
     */
    async updateConversationsList() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        try {
            const conversations = await conversationStorage.getAllConversations();
            
            conversationsList.innerHTML = '';
            
            if (conversations.length === 0) {
                conversationsList.innerHTML = '<p class="no-conversations">会話がありません</p>';
                return;
            }
            
            conversations.forEach(conversation => {
                const conversationItem = document.createElement('div');
                conversationItem.className = 'conversation-item';
                conversationItem.dataset.id = conversation.id;
                
                const title = document.createElement('div');
                title.className = 'conversation-title';
                title.textContent = conversation.title;
                
                const meta = document.createElement('div');
                meta.className = 'conversation-meta';
                
                const date = new Date(conversation.timestamp);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const timestamp = document.createElement('span');
                timestamp.textContent = `${formattedDate} ${formattedTime}`;
                
                const messageCount = document.createElement('span');
                messageCount.textContent = `${conversation.messageCount || 0} メッセージ`;
                
                meta.appendChild(timestamp);
                meta.appendChild(messageCount);
                
                conversationItem.appendChild(title);
                conversationItem.appendChild(meta);
                
                conversationItem.addEventListener('click', () => {
                    this.loadConversation(conversation.id);
                });
                
                conversationsList.appendChild(conversationItem);
            });
            
        } catch (error) {
            console.error('Error updating conversations list:', error);
            conversationsList.innerHTML = '<p class="error">会話リストの読み込みに失敗しました</p>';
        }
    }

    /**
     * 会話の読み込み
     * @param {number} conversationId - 会話ID
     */
    async loadConversation(conversationId) {
        try {
            const conversation = await conversationStorage.getConversation(conversationId);
            const messages = await conversationStorage.getMessages(conversationId);
            
            // 会話コンテナの表示
            document.getElementById('welcomeContainer').style.display = 'none';
            document.getElementById('conversationContainer').style.display = 'flex';
            
            // メッセージの表示
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = '';
            
            messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = `message from-${msg.role === 'user' ? 'me' : 'other'}`;
                
                const messageContent = document.createElement('div');
                messageContent.className = 'message-content';
                messageContent.innerHTML = this.formatMessageContent(msg.content);
                
                const messageTimestamp = document.createElement('div');
                messageTimestamp.className = 'message-timestamp';
                const date = new Date(msg.timestamp);
                messageTimestamp.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                messageElement.appendChild(messageContent);
                messageElement.appendChild(messageTimestamp);
                
                messagesContainer.appendChild(messageElement);
            });
            
            // スクロールを一番下に
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // 現在の会話IDをセット
            document.getElementById('conversationContainer').dataset.conversationId = conversationId;
            
            // サイドバーのアクティブ状態を更新
            this.updateActiveConversation(conversationId);
            
        } catch (error) {
            console.error('Error loading conversation:', error);
            alert('会話の読み込みに失敗しました');
        }
    }

    /**
     * アクティブな会話の更新
     * @param {number} conversationId - 会話ID
     */
    updateActiveConversation(conversationId) {
        const conversationItems = document.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === conversationId.toString()) {
                item.classList.add('active');
            }
        });
    }

    /**
     * メッセージ内容のフォーマット
     * @param {string} content - メッセージ内容
     * @returns {string} - フォーマットされたメッセージ内容
     */
    formatMessageContent(content) {
        // 改行をHTML改行に変換
        content = content.replace(/\n/g, '<br>');
        
        // リンクをクリック可能に変換
        content = content.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        return content;
    }

    /**
     * 会話読み込みモーダルを表示
     */
    showLoadConversationModal() {
        this.createModal(
            'Load Conversation',
            `
            <div class="file-upload-container">
                <div class="file-upload-icon">📂</div>
                <div class="file-upload-text">JSONファイルをドラッグ＆ドロップするか、クリックして選択してください</div>
                <input type="file" id="fileInput" accept=".json" style="display: none;">
                <button class="file-upload-btn">ファイルを選択</button>
            </div>
            <div class="manual-load-container">
                <div class="manual-load-title">または、会話データを貼り付けてください</div>
                <textarea class="manual-load-textarea" id="manualLoadTextarea" placeholder='{"title": "会話タイトル", "messages": [{"role": "user", "content": "こんにちは"}, {"role": "assistant", "content": "こんにちは！お手伝いできることはありますか？"}]}'></textarea>
                <button class="manual-load-btn" id="manualLoadBtn">読み込む</button>
                <div class="manual-load-error" id="manualLoadError"></div>
            </div>
            `,
            [
                {
                    text: '閉じる',
                    class: 'modal-btn-secondary',
                    action: (modal) => {
                        document.body.removeChild(modal);
                    }
                }
            ]
        );
        
        // ファイル選択ボタンの処理
        const fileUploadBtn = document.querySelector('.file-upload-btn');
        const fileInput = document.getElementById('fileInput');
        
        fileUploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', this.handleFileUpload.bind(this));
        
        // 手動読み込みボタンの処理
        const manualLoadBtn = document.getElementById('manualLoadBtn');
        manualLoadBtn.addEventListener('click', this.handleManualLoad.bind(this));
        
        // ドラッグ＆ドロップの処理
        const fileUploadContainer = document.querySelector('.file-upload-container');
        
        fileUploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadContainer.classList.add('dragover');
        });
        
        fileUploadContainer.addEventListener('dragleave', () => {
            fileUploadContainer.classList.remove('dragover');
        });
        
        fileUploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadContainer.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileUpload({ target: { files } });
            }
        });
    }

    /**
     * ファイルアップロード処理
     * @param {Event} event - ファイル選択イベント
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert('JSONファイルを選択してください');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await this.importConversation(data);
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('ファイルの解析に失敗しました。有効なJSON形式か確認してください。');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * 手動データ読み込み処理
     */
    async handleManualLoad() {
        const textarea = document.getElementById('manualLoadTextarea');
        const errorDiv = document.getElementById('manualLoadError');
        
        try {
            const data = JSON.parse(textarea.value);
            
            if (!data.messages || !Array.isArray(data.messages)) {
                errorDiv.textContent = 'messages配列が必要です';
                errorDiv.classList.add('active');
                return;
            }
            
            await this.importConversation(data);
            
        } catch (error) {
            console.error('Error parsing manual input:', error);
            errorDiv.textContent = '有効なJSON形式ではありません';
            errorDiv.classList.add('active');
        }
    }

    /**
     * 会話データのインポート
     * @param {Object} data - インポートするデータ
     */
    async importConversation(data) {
        try {
            this.showLoader();
            
            const conversationId = await conversationStorage.importConversation(data);
            
            this.hideLoader();
            
            // モーダルを閉じる
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                document.body.removeChild(modal);
            }
            
            // 会話リストを更新
            await this.updateConversationsList();
            
            // インポートした会話を読み込む
            this.loadConversation(conversationId);
            
        } catch (error) {
            this.hideLoader();
            console.error('Error importing conversation:', error);
            alert('会話のインポートに失敗しました');
        }
    }

    /**
     * API接続モーダルを表示
     */
    showConnectApiModal() {
        this.createModal(
            'Connect to Claude API',
            `
            <div class="settings-section">
                <h3>API設定</h3>
                <div class="settings-option">
                    <label for="apiKeyInput">API Key</label>
                    <div class="api-key-input-container">
                        <input type="password" id="apiKeyInput" class="api-key-input" value="${claudeAPI.apiKey}">
                        <button class="toggle-visibility-btn" id="toggleApiKeyBtn">
                            <span class="eye-icon">👁️</span>
                        </button>
                    </div>
                </div>
                <div class="settings-option">
                    <label for="modelSelect">モデル</label>
                    <select id="modelSelect" class="model-dropdown">
                        <option value="claude-3.7-sonnet" ${claudeAPI.model === 'claude-3.7-sonnet' ? 'selected' : ''}>Claude 3.7 Sonnet</option>
                        <option value="claude-3-opus" ${claudeAPI.model === 'claude-3-opus' ? 'selected' : ''}>Claude 3 Opus</option>
                        <option value="claude-3.5-sonnet" ${claudeAPI.model === 'claude-3.5-sonnet' ? 'selected' : ''}>Claude 3.5 Sonnet</option>
                        <option value="claude-3.5-haiku" ${claudeAPI.model === 'claude-3.5-haiku' ? 'selected' : ''}>Claude 3.5 Haiku</option>
                    </select>
                </div>
            </div>
            `,
            [
                {
                    text: 'キャンセル',
                    class: 'modal-btn-secondary',
                    action: (modal) => {
                        document.body.removeChild(modal);
                    }
                },
                {
                    text: '接続',
                    class: 'modal-btn-primary',
                    action: async (modal) => {
                        const apiKey = document.getElementById('apiKeyInput').value;
                        const model = document.getElementById('modelSelect').value;
                        
                        if (!apiKey) {
                            alert('APIキーを入力してください');
                            return;
                        }
                        
                        try {
                            this.showLoader();
                            
                            // API設定を更新
                            claudeAPI.updateSettings(apiKey, model);
                            
                            // APIキーをテスト
                            const isValid = await claudeAPI.testApiKey();
                            
                            this.hideLoader();
                            
                            if (!isValid) {
                                alert('APIキーが無効です。キーを確認してください。');
                                return;
                            }
                            
                            // 設定保存
                            document.getElementById('apiKeyInput').value = apiKey;
                            document.getElementById('modelSelect').value = model;
                            
                            // モーダルを閉じる
                            document.body.removeChild(modal);
                            
                            // 新しい会話を開始
                            this.startNewConversation();
                            
                        } catch (error) {
                            this.hideLoader();
                            console.error('API connection error:', error);
                            alert(`API接続エラー: ${error.message}`);
                        }
                    }
                }
            ]
        );
        
        // APIキー表示切り替え
        const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');
        
        toggleApiKeyBtn.addEventListener('click', () => {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                toggleApiKeyBtn.innerHTML = '🔒';
            } else {
                apiKeyInput.type = 'password';
                toggleApiKeyBtn.innerHTML = '👁️';
            }
        });
    }

    /**
     * 設定モーダルを表示
     */
    showSettingsModal() {
        this.createModal(
            'Settings',
            `
            <div class="settings-section">
                <h3>表示設定</h3>
                <div class="settings-option">
                    <label>
                        ダークモード
                        <div class="toggle-switch">
                            <input type="checkbox" id="darkModeToggle" ${document.body.classList.contains('dark-theme') ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </label>
                </div>
            </div>
            <div class="settings-section">
                <h3>API設定</h3>
                <div class="settings-option">
                    <label for="settingsApiKeyInput">API Key</label>
                    <div class="api-key-input-container">
                        <input type="password" id="settingsApiKeyInput" class="api-key-input" value="${claudeAPI.apiKey}">
                        <button class="toggle-visibility-btn" id="settingsToggleApiKeyBtn">
                            <span class="eye-icon">👁️</span>
                        </button>
                    </div>
                </div>
                <div class="settings-option">
                    <label for="settingsModelSelect">モデル</label>
                    <select id="settingsModelSelect" class="model-dropdown">
                        <option value="claude-3.7-sonnet" ${claudeAPI.model === 'claude-3.7-sonnet' ? 'selected' : ''}>Claude 3.7 Sonnet</option>
                        <option value="claude-3-opus" ${claudeAPI.model === 'claude-3-opus' ? 'selected' : ''}>Claude 3 Opus</option>
                        <option value="claude-3.5-sonnet" ${claudeAPI.model === 'claude-3.5-sonnet' ? 'selected' : ''}>Claude 3.5 Sonnet</option>
                        <option value="claude-3.5-haiku" ${claudeAPI.model === 'claude-3.5-haiku' ? 'selected' : ''}>Claude 3.5 Haiku</option>
                    </select>
                </div>
            </div>
            `,
            [
                {
                    text: 'キャンセル',
                    class: 'modal-btn-secondary',
                    action: (modal) => {
                        document.body.removeChild(modal);
                    }
                },
                {
                    text: '保存',
                    class: 'modal-btn-primary',
                    action: (modal) => {
                        // ダークモード設定
                        const darkModeToggle = document.getElementById('darkModeToggle');
                        if (darkModeToggle.checked) {
                            document.body.classList.add('dark-theme');
                            document.getElementById('themeToggle').innerHTML = '☀️';
                            localStorage.setItem('theme', 'dark');
                        } else {
                            document.body.classList.remove('dark-theme');
                            document.getElementById('themeToggle').innerHTML = '🌙';
                            localStorage.setItem('theme', 'light');
                        }
                        
                        // API設定
                        const apiKey = document.getElementById('settingsApiKeyInput').value;
                        const model = document.getElementById('settingsModelSelect').value;
                        
                        claudeAPI.updateSettings(apiKey, model);
                        
                        // API設定を更新
                        document.getElementById('apiKeyInput').value = apiKey;
                        document.getElementById('modelSelect').value = model;
                        
                        // モーダルを閉じる
                        document.body.removeChild(modal);
                    }
                }
            ]
        );
        
        // APIキー表示切り替え
        const toggleApiKeyBtn = document.getElementById('settingsToggleApiKeyBtn');
        const apiKeyInput = document.getElementById('settingsApiKeyInput');
        
        toggleApiKeyBtn.addEventListener('click', () => {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                toggleApiKeyBtn.innerHTML = '🔒';
            } else {
                apiKeyInput.type = 'password';
                toggleApiKeyBtn.innerHTML = '👁️';
            }
        });
    }

    /**
     * 新しい会話を開始
     */
    async startNewConversation() {
        try {
            // 新しい会話を作成
            const conversationId = await conversationStorage.createConversation('新しい会話');
            
            // 会話リストを更新
            await this.updateConversationsList();
            
            // 新しい会話を読み込む
            this.loadConversation(conversationId);
            
        } catch (error) {
            console.error('Error starting new conversation:', error);
            alert('新しい会話の開始に失敗しました');
        }
    }

    /**
     * 設定を保存
     */
    async saveSettings() {
        try {
            const apiKey = document.getElementById('apiKeyInput').value;
            const model = document.getElementById('modelSelect').value;
            
            claudeAPI.updateSettings(apiKey, model);
            
            alert('設定を保存しました');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('設定の保存に失敗しました');
        }
    }

    /**
     * 検索表示切り替え
     */
    toggleSearch() {
        const searchInput = document.getElementById('searchInput');
        
        if (searchInput.style.display === 'none' || !searchInput.style.display) {
            searchInput.style.display = 'block';
            searchInput.focus();
        } else {
            searchInput.style.display = 'none';
            this.updateConversationsList();
        }
    }

    /**
     * 検索処理
     * @param {Event} event - 入力イベント
     */
    async handleSearch(event) {
        const query = event.target.value.trim();
        
        try {
            const conversations = await conversationStorage.searchConversations(query);
            
            const conversationsList = document.getElementById('conversationsList');
            conversationsList.innerHTML = '';
            
            if (conversations.length === 0) {
                conversationsList.innerHTML = '<p class="no-conversations">検索結果がありません</p>';
                return;
            }
            
            conversations.forEach(conversation => {
                const conversationItem = document.createElement('div');
                conversationItem.className = 'conversation-item';
                conversationItem.dataset.id = conversation.id;
                
                const title = document.createElement('div');
                title.className = 'conversation-title';
                title.textContent = conversation.title;
                
                const meta = document.createElement('div');
                meta.className = 'conversation-meta';
                
                const date = new Date(conversation.timestamp);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const timestamp = document.createElement('span');
                timestamp.textContent = `${formattedDate} ${formattedTime}`;
                
                const messageCount = document.createElement('span');
                messageCount.textContent = `${conversation.messageCount || 0} メッセージ`;
                
                meta.appendChild(timestamp);
                meta.appendChild(messageCount);
                
                conversationItem.appendChild(title);
                conversationItem.appendChild(meta);
                
                conversationItem.addEventListener('click', () => {
                    this.loadConversation(conversation.id);
                });
                
                conversationsList.appendChild(conversationItem);
            });
            
        } catch (error) {
            console.error('Error searching conversations:', error);
        }
    }

    /**
     * モーダルを作成
     * @param {string} title - モーダルタイトル
     * @param {string} content - モーダル内容
     * @param {Array} buttons - ボタン設定
     */
    createModal(title, content, buttons = []) {
        // 既存のモーダルがあれば削除
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        modalTitle.textContent = title;
        
        const modalClose = document.createElement('button');
        modalClose.className = 'modal-close';
        modalClose.innerHTML = '&times;';
        modalClose.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(modalClose);
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.innerHTML = content;
        
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `modal-btn ${button.class || ''}`;
            btn.textContent = button.text;
            btn.addEventListener('click', () => button.action(modalOverlay));
            modalFooter.appendChild(btn);
        });
        
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalContainer.appendChild(modalFooter);
        
        modalOverlay.appendChild(modalContainer);
        
        document.body.appendChild(modalOverlay);
        
        // アニメーション用にタイムアウトを設定
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
    }

    /**
     * ローディング表示
     */
    showLoader() {
        // 既存のローダーがあれば削除
        const existingLoader = document.querySelector('.loader-container');
        if (existingLoader) {
            document.body.removeChild(existingLoader);
        }
        
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'loader-container';
        
        const loader = document.createElement('span');
        loader.className = 'loader';
        
        loaderContainer.appendChild(loader);
        document.body.appendChild(loaderContainer);
        
        // アニメーション用にタイムアウトを設定
        setTimeout(() => {
            loaderContainer.classList.add('active');
        }, 10);
    }

    /**
     * ローディング非表示
     */
    hideLoader() {
        const loaderContainer = document.querySelector('.loader-container');
        if (loaderContainer) {
            loaderContainer.classList.remove('active');
            
            // アニメーション完了後に削除
            setTimeout(() => {
                if (loaderContainer.parentNode) {
                    document.body.removeChild(loaderContainer);
                }
            }, 300);
        }
    }
}

// UIの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();
});