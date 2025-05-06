/**
 * 3カラムレイアウト用のUI拡張機能
 * 既存のUI.jsと連携して3カラムレイアウトの機能を追加
 */

document.addEventListener('DOMContentLoaded', () => {
    // 3カラムレイアウトの初期化
    initThreeColumnLayout();
    
    // 会話コントローラとの連携
    setupConversationEvents();

    // 会話をインポートした後の処理を拡張
    extendUIImportConversation();
});

/**
 * 3カラムレイアウトの初期化
 */
function initThreeColumnLayout() {
    // 右カラムの会話アクションボタンのイベントを設定
    const exportConversationBtn = document.getElementById('exportConversationBtn');
    if (exportConversationBtn) {
        exportConversationBtn.addEventListener('click', () => {
            // 現在の会話IDを取得
            const conversationContainer = document.getElementById('conversationContainer');
            const conversationId = conversationContainer.dataset.conversationId;
            
            if (!conversationId) {
                alert('エクスポートする会話がありません');
                return;
            }
            
            exportConversation(conversationId);
        });
    }
    
    const clearConversationBtn = document.getElementById('clearConversationBtn');
    if (clearConversationBtn) {
        clearConversationBtn.addEventListener('click', () => {
            // 現在の会話IDを取得
            const conversationContainer = document.getElementById('conversationContainer');
            const conversationId = conversationContainer.dataset.conversationId;
            
            if (!conversationId) {
                alert('クリアする会話がありません');
                return;
            }
            
            if (confirm('この会話をクリアしますか？この操作は元に戻せません。')) {
                clearConversation(conversationId);
            }
        });
    }
}

/**
 * 会話コントローラとの連携イベントの設定
 */
function setupConversationEvents() {
    // 会話読み込み時に詳細情報を更新
    document.addEventListener('conversationLoaded', (event) => {
        if (event.detail) {
            updateConversationDetailsPanel(event.detail);
        }
    });
    
    // メッセージ追加時に詳細情報を更新
    document.addEventListener('messageAdded', (event) => {
        if (event.detail) {
            updateConversationDetailsPanel(event.detail);
        }
    });
}

/**
 * 会話詳細パネルの更新
 * @param {Object} conversation - 会話オブジェクト
 */
function updateConversationDetailsPanel(conversation) {
    const titleElement = document.getElementById('conversationTitle');
    const createdElement = document.getElementById('conversationCreated');
    const updatedElement = document.getElementById('conversationUpdated');
    const messageCountElement = document.getElementById('messageCount');
    
    if (!titleElement || !createdElement || !updatedElement || !messageCountElement) {
        return;
    }
    
    if (conversation) {
        // タイトル
        titleElement.textContent = conversation.title || 'Untitled Conversation';
        
        // 作成日時
        const createdDate = new Date(conversation.createdAt || conversation.timestamp);
        createdElement.textContent = formatDateTime(createdDate);
        
        // 更新日時
        const updatedDate = new Date(conversation.updatedAt || conversation.timestamp);
        updatedElement.textContent = formatDateTime(updatedDate);
        
        // メッセージ数
        const messageCount = conversation.messages ? conversation.messages.length : 
                            (conversation.messageCount || 0);
        messageCountElement.textContent = messageCount;
    } else {
        // 詳細情報がない場合
        titleElement.textContent = '-';
        createdElement.textContent = '-';
        updatedElement.textContent = '-';
        messageCountElement.textContent = '-';
    }
}

/**
 * 日時のフォーマット
 * @param {Date} date - フォーマットする日時
 * @returns {string} - フォーマットされた日時文字列
 */
function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '-';
    }
    
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 会話のエクスポート
 * @param {number|string} conversationId - 会話ID
 */
async function exportConversation(conversationId) {
    try {
        // UIのローディング表示
        if (window.ui && window.ui.showLoader) {
            window.ui.showLoader();
        }
        
        // 会話データの取得
        const conversation = await conversationStorage.getConversation(conversationId);
        const messages = await conversationStorage.getMessages(conversationId);
        
        // エクスポートデータの作成
        const exportData = {
            title: conversation.title,
            createdAt: conversation.createdAt || conversation.timestamp,
            updatedAt: conversation.updatedAt || conversation.timestamp,
            messages: messages
        };
        
        // JSONファイルとしてダウンロード
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${conversation.title || 'conversation'}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // UIのローディング非表示
        if (window.ui && window.ui.hideLoader) {
            window.ui.hideLoader();
        }
        
    } catch (error) {
        console.error('Error exporting conversation:', error);
        alert('会話のエクスポートに失敗しました');
        
        // UIのローディング非表示
        if (window.ui && window.ui.hideLoader) {
            window.ui.hideLoader();
        }
    }
}

/**
 * 会話のクリア
 * @param {number|string} conversationId - 会話ID
 */
async function clearConversation(conversationId) {
    try {
        // UIのローディング表示
        if (window.ui && window.ui.showLoader) {
            window.ui.showLoader();
        }
        
        // 会話のメッセージをクリア
        await conversationStorage.clearMessages(conversationId);
        
        // 会話リストを更新
        if (window.ui && window.ui.updateConversationsList) {
            await window.ui.updateConversationsList();
        }
        
        // 会話を再読み込み
        if (window.ui && window.ui.loadConversation) {
            await window.ui.loadConversation(conversationId);
        }
        
        // UIのローディング非表示
        if (window.ui && window.ui.hideLoader) {
            window.ui.hideLoader();
        }
        
    } catch (error) {
        console.error('Error clearing conversation:', error);
        alert('会話のクリアに失敗しました');
        
        // UIのローディング非表示
        if (window.ui && window.ui.hideLoader) {
            window.ui.hideLoader();
        }
    }
}

/**
 * UI.jsのimportConversation関数を拡張
 */
function extendUIImportConversation() {
    // 元のUI.importConversation関数を保存
    if (window.ui && window.ui.importConversation) {
        const originalImportConversation = window.ui.importConversation;
        
        // 拡張した関数で置き換え
        window.ui.importConversation = async function(data) {
            try {
                // 元の関数を呼び出し
                await originalImportConversation.call(window.ui, data);
                
                // 会話詳細パネルを更新
                if (data) {
                    updateConversationDetailsPanel({
                        title: data.title,
                        createdAt: data.createdAt || new Date(),
                        updatedAt: data.updatedAt || new Date(),
                        messages: data.messages || []
                    });
                }
                
            } catch (error) {
                console.error('Error in extended importConversation:', error);
                throw error;
            }
        };
    }
}
