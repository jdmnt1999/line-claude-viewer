/**
 * 会話制御用のクラス
 */
class ConversationController {
    constructor() {
        this.currentConversationId = null;
        this.isProcessing = false;
        this.bindEvents();
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        // メッセージ送信ボタン
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', this.sendMessage.bind(this));
        }

        // メッセージ入力欄のEnterキー処理
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                // Ctrl + Enterでメッセージ送信
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
                
                // 入力欄の高さを自動調整
                this.adjustTextareaHeight(messageInput);
            });
            
            messageInput.addEventListener('input', () => {
                this.adjustTextareaHeight(messageInput);
            });
        }
    }

    /**
     * テキストエリアの高さを自動調整
     * @param {HTMLElement} textarea - テキストエリア要素
     */
    adjustTextareaHeight(textarea) {
        // リセット
        textarea.style.height = 'auto';
        
        // スクロール高さに合わせる（最大200px）
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = `${newHeight}px`;
    }

    /**
     * メッセージ送信
     */
    async sendMessage() {
        if (this.isProcessing) return;
        
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content) return;
        
        // 会話IDの取得
        this.currentConversationId = document.getElementById('conversationContainer').dataset.conversationId;
        
        // 会話IDがない場合は新規作成
        if (!this.currentConversationId) {
            try {
                this.currentConversationId = await conversationStorage.createConversation('新しい会話');
                document.getElementById('conversationContainer').dataset.conversationId = this.currentConversationId;
            } catch (error) {
                console.error('Error creating new conversation:', error);
                alert('新しい会話の作成に失敗しました');
                return;
            }
        }
        
        try {
            this.isProcessing = true;
            
            // 送信ボタンの無効化
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            sendMessageBtn.disabled = true;
            
            // ユーザーメッセージの追加
            const userMessageId = await conversationStorage.addMessage(
                this.currentConversationId, 
                'user', 
                content
            );
            
            // UIに表示
            this.addMessageToUI('user', content);
            
            // 入力欄をクリア
            messageInput.value = '';
            this.adjustTextareaHeight(messageInput);
            
            // API呼び出し前にローディング表示
            const messagesContainer = document.getElementById('messagesContainer');
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'message from-other loading';
            loadingMessage.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
            messagesContainer.appendChild(loadingMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // APIに送信
            try {
                // 現在の会話の全メッセージを取得
                const messages = await conversationStorage.getMessages(this.currentConversationId);
                
                // APIに送信
                const response = await claudeAPI.sendMessage(content, messages);
                
                // ローディング表示を削除
                messagesContainer.removeChild(loadingMessage);
                
                // レスポンスを保存
                if (response && response.content && response.content.length > 0) {
                    const assistantContent = response.content[0].text;
                    await conversationStorage.addMessage(
                        this.currentConversationId, 
                        'assistant', 
                        assistantContent
                    );
                    
                    // UIに表示
                    this.addMessageToUI('assistant', assistantContent);
                }
                
            } catch (error) {
                // ローディング表示を削除
                messagesContainer.removeChild(loadingMessage);
                
                console.error('API error:', error);
                
                // エラーメッセージを表示
                const errorMsg = `エラーが発生しました: ${error.message || 'API接続エラー'}`;
                await conversationStorage.addMessage(
                    this.currentConversationId, 
                    'assistant', 
                    errorMsg
                );
                
                this.addMessageToUI('assistant', errorMsg);
            }
            
            // 会話リストを更新
            ui.updateConversationsList();
            
        } catch (error) {
            console.error('Send message error:', error);
            alert('メッセージの送信に失敗しました');
        } finally {
            this.isProcessing = false;
            
            // 送信ボタンの有効化
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            if (sendMessageBtn) {
                sendMessageBtn.disabled = false;
            }
        }
    }

    /**
     * UIにメッセージを追加
     * @param {string} role - メッセージの送信者（user/assistant）
     * @param {string} content - メッセージ内容
     */
    addMessageToUI(role, content) {
        const messagesContainer = document.getElementById('messagesContainer');
        
        const messageElement = document.createElement('div');
        messageElement.className = `message from-${role === 'user' ? 'me' : 'other'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = ui.formatMessageContent(content);
        
        const messageTimestamp = document.createElement('div');
        messageTimestamp.className = 'message-timestamp';
        const now = new Date();
        messageTimestamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageTimestamp);
        
        messagesContainer.appendChild(messageElement);
        
        // スクロールを一番下に
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * 会話をエクスポート
     * @param {number} conversationId - 会話ID
     */
    async exportConversation(conversationId) {
        try {
            ui.showLoader();
            
            // 指定がなければ現在の会話を使用
            const targetId = conversationId || this.currentConversationId;
            
            if (!targetId) {
                ui.hideLoader();
                alert('エクスポートする会話がありません');
                return;
            }
            
            const data = await conversationStorage.exportConversation(targetId);
            
            // JSONをダウンロード
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            
            // クリーンアップ
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            
            ui.hideLoader();
            
        } catch (error) {
            ui.hideLoader();
            console.error('Error exporting conversation:', error);
            alert('会話のエクスポートに失敗しました');
        }
    }

    /**
     * 会話を削除
     * @param {number} conversationId - 会話ID
     */
    async deleteConversation(conversationId) {
        try {
            ui.showLoader();
            
            // 指定がなければ現在の会話を使用
            const targetId = conversationId || this.currentConversationId;
            
            if (!targetId) {
                ui.hideLoader();
                alert('削除する会話がありません');
                return;
            }
            
            // 削除確認
            if (!confirm('この会話を削除してもよろしいですか？この操作は元に戻せません。')) {
                ui.hideLoader();
                return;
            }
            
            await conversationStorage.deleteConversation(targetId);
            
            // 会話リストを更新
            await ui.updateConversationsList();
            
            // 現在表示中の会話が削除された場合はリセット
            if (targetId === this.currentConversationId) {
                this.currentConversationId = null;
                document.getElementById('conversationContainer').style.display = 'none';
                document.getElementById('welcomeContainer').style.display = 'flex';
            }
            
            ui.hideLoader();
            
        } catch (error) {
            ui.hideLoader();
            console.error('Error deleting conversation:', error);
            alert('会話の削除に失敗しました');
        }
    }
}

// 会話コントローラーの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.conversationController = new ConversationController();
});