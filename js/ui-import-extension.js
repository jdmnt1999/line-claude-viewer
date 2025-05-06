/**
 * UIの会話インポート機能を拡張するスクリプト
 * ImportHelperを使用した拡張機能を提供
 */

// デバッグモード
const DEBUG = localStorage.getItem('debugMode') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    // 元のUI.importConversation関数を保存
    if (window.ui && window.ui.importConversation) {
        const originalImportConversation = window.ui.importConversation;
        
        // 拡張した関数で置き換え
        window.ui.importConversation = async function(data, options = {}) {
            try {
                // ImportHelperが利用可能であれば、それを使用
                if (window.ImportHelper) {
                    return await window.ImportHelper.startImport(data, options);
                } else {
                    // 元の関数を使用
                    return await originalImportConversation.call(window.ui, data);
                }
            } catch (error) {
                console.error('会話のインポート中にエラーが発生しました:', error);
                throw error;
            }
        };
    }
    
    // 元のUI.handleFileUpload関数を拡張
    if (window.ui && window.ui.handleFileUpload) {
        const originalHandleFileUpload = window.ui.handleFileUpload;
        
        // 拡張した関数で置き換え
        window.ui.handleFileUpload = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                alert('JSONファイルを選択してください');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // JSONデータの解析
                    const jsonData = JSON.parse(e.target.result);
                    
                    // データの形式を確認
                    const isMultipleConversations = Array.isArray(jsonData) ||
                        (jsonData.conversations && Array.isArray(jsonData.conversations));
                    
                    if (isMultipleConversations && window.ImportHelper) {
                        // 複数の会話データの場合はImportHelperを使用
                        const conversations = Array.isArray(jsonData) ? jsonData : jsonData.conversations;
                        
                        // ローダーの表示
                        if (window.ui.showLoader) {
                            window.ui.showLoader();
                        }
                        
                        // インポートオプションの作成とモーダル表示
                        window.ui.showImportOptionsModal(conversations);
                    } else {
                        // 単一の会話データの場合は元の関数を使用
                        return originalHandleFileUpload.call(window.ui, event);
                    }
                } catch (error) {
                    console.error('JSONファイルの解析に失敗しました:', error);
                    alert('ファイルの解析に失敗しました。有効なJSON形式か確認してください。');
                }
            };
            
            reader.readAsText(file);
        };
    }
    
    // インポートオプションモーダル表示関数を追加
    if (window.ui && !window.ui.showImportOptionsModal) {
        window.ui.showImportOptionsModal = function(conversations) {
            // モーダル作成
            window.ui.createModal(
                'インポートオプション',
                `
                <div class="import-summary">
                    <p>${conversations.length}件の会話をインポートします。オプションを選択してください。</p>
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
                        text: 'インポート開始',
                        class: 'modal-btn-primary',
                        action: async (modal) => {
                            try {
                                // インポート開始
                                await window.ImportHelper.startImport(conversations);
                                
                                // インポート完了時にはモーダルを閉じない
                                // ユーザーが完了状態を確認してから閉じられるようにする
                                
                                // 完了後にボタンテキストを変更
                                const importBtn = modal.querySelector('.modal-btn-primary');
                                if (importBtn) {
                                    importBtn.textContent = '閉じる';
                                    importBtn.onclick = () => {
                                        document.body.removeChild(modal);
                                    };
                                }
                                
                                // キャンセルボタンを非表示
                                const cancelBtn = modal.querySelector('.modal-btn-secondary');
                                if (cancelBtn) {
                                    cancelBtn.style.display = 'none';
                                }
                                
                            } catch (error) {
                                console.error('会話のインポート中にエラーが発生しました:', error);
                                alert(`インポート中にエラーが発生しました: ${error.message}`);
                            }
                        }
                    }
                ]
            );
            
            // モーダルにオプション選択UIを追加
            const modalBody = document.querySelector('.modal-body');
            if (modalBody && window.ImportHelper) {
                modalBody.appendChild(window.ImportHelper.createImportOptions());
                modalBody.appendChild(window.ImportHelper.createProgressBar());
            }
        };
    }
    
    // 手動読み込み関数の拡張
    if (window.ui && window.ui.handleManualLoad) {
        const originalHandleManualLoad = window.ui.handleManualLoad;
        
        // 拡張した関数で置き換え
        window.ui.handleManualLoad = async function() {
            const textarea = document.getElementById('manualLoadTextarea');
            const errorDiv = document.getElementById('manualLoadError');
            
            try {
                // JSONデータの解析
                const jsonData = JSON.parse(textarea.value);
                
                // データの形式を確認
                const isMultipleConversations = Array.isArray(jsonData) ||
                    (jsonData.conversations && Array.isArray(jsonData.conversations));
                
                if (isMultipleConversations && window.ImportHelper) {
                    // 複数の会話データの場合はImportHelperを使用
                    const conversations = Array.isArray(jsonData) ? jsonData : jsonData.conversations;
                    
                    // ローダーの表示
                    if (window.ui.showLoader) {
                        window.ui.showLoader();
                    }
                    
                    // インポートオプションの作成とモーダル表示
                    window.ui.showImportOptionsModal(conversations);
                } else {
                    // 単一の会話データの場合は元の関数を使用
                    return originalHandleManualLoad.call(window.ui);
                }
            } catch (error) {
                console.error('JSONデータの解析に失敗しました:', error);
                
                if (errorDiv) {
                    errorDiv.textContent = '有効なJSON形式ではありません';
                    errorDiv.classList.add('active');
                } else {
                    alert('JSONデータの解析に失敗しました。有効なJSON形式か確認してください。');
                }
            }
        };
    }
});

// デバッグモード時のログ
if (DEBUG) {
    console.log('UI拡張モジュール（インポート機能）が初期化されました');
}
