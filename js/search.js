/**
 * 検索機能を管理するクラス
 */
class Search {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = [];
        this.highlightClass = 'search-highlight';
        this.bindEvents();
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }
    }

    /**
     * 検索処理
     * @param {Event} event - 入力イベント
     */
    async handleSearch(event) {
        const query = event.target.value.trim();
        
        if (!query) {
            // 検索クエリが空の場合は全ての会話を表示
            await ui.updateConversationsList();
            this.clearHighlights();
            return;
        }
        
        try {
            // 会話を検索
            const conversations = await conversationStorage.searchConversations(query);
            
            // 会話リストを更新
            const conversationsList = document.getElementById('conversationsList');
            conversationsList.innerHTML = '';
            
            if (conversations.length === 0) {
                conversationsList.innerHTML = '<p class="no-conversations">検索結果がありません</p>';
                return;
            }
            
            // 検索結果を表示
            conversations.forEach(conversation => {
                const conversationItem = document.createElement('div');
                conversationItem.className = 'conversation-item';
                conversationItem.dataset.id = conversation.id;
                
                const title = document.createElement('div');
                title.className = 'conversation-title';
                
                // タイトルのハイライト
                const highlightedTitle = this.highlightText(conversation.title, query);
                title.innerHTML = highlightedTitle;
                
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
                    // 会話を読み込むときにクエリを渡して、メッセージ内でもハイライト
                    this.loadConversationWithHighlight(conversation.id, query);
                });
                
                conversationsList.appendChild(conversationItem);
            });
            
        } catch (error) {
            console.error('Error searching conversations:', error);
        }
    }

    /**
     * ハイライト付きで会話を読み込む
     * @param {number} conversationId - 会話ID
     * @param {string} query - 検索クエリ
     */
    async loadConversationWithHighlight(conversationId, query) {
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
                
                // メッセージ内容をハイライト
                const formattedContent = ui.formatMessageContent(msg.content);
                messageContent.innerHTML = this.highlightText(formattedContent, query);
                
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
            ui.updateActiveConversation(conversationId);
            
        } catch (error) {
            console.error('Error loading conversation with highlight:', error);
            alert('会話の読み込みに失敗しました');
        }
    }

    /**
     * テキスト内の検索クエリをハイライト
     * @param {string} text - 元のテキスト
     * @param {string} query - 検索クエリ
     * @returns {string} - ハイライト付きのテキスト
     */
    highlightText(text, query) {
        if (!query) return text;
        
        // 正規表現エスケープ
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        return text.replace(regex, `<span class="${this.highlightClass}">$1</span>`);
    }

    /**
     * 検索をクリア
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            ui.updateConversationsList();
        }
        this.clearHighlights();
    }

    /**
     * ハイライトをクリア
     */
    clearHighlights() {
        const highlights = document.querySelectorAll(`.${this.highlightClass}`);
        highlights.forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
    }
}

// 検索機能の初期化
document.addEventListener('DOMContentLoaded', () => {
    window.search = new Search();
});