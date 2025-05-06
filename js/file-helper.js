/**
 * ファイル操作関連のヘルパー関数
 * ファイルの読み込み、保存、パス処理などを支援するユーティリティ
 */

// デバッグモード
const DEBUG = localStorage.getItem('debugMode') === 'true';

/**
 * ファイルヘルパーモジュール
 */
const FileHelper = {
    /**
     * ファイルを読み込む
     * @param {File} file - 読み込むファイル
     * @param {string} [encoding='utf-8'] - エンコーディング
     * @returns {Promise<string>} - ファイルの内容
     */
    readFile: (file, encoding = 'utf-8') => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                console.error('ファイル読み込みエラー:', error);
                reject(error);
            };
            
            reader.readAsText(file, encoding);
        });
    },
    
    /**
     * テキストファイルとして保存
     * @param {string} content - 保存する内容
     * @param {string} filename - ファイル名
     * @param {string} [type='text/plain'] - ファイルタイプ
     */
    saveFile: (content, filename, type = 'text/plain') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // クリーンアップ
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    /**
     * JSONファイルとして保存
     * @param {Object} data - 保存するデータ
     * @param {string} filename - ファイル名
     */
    saveJSON: (data, filename) => {
        const json = JSON.stringify(data, null, 2);
        FileHelper.saveFile(json, filename, 'application/json');
    },
    
    /**
     * ファイルパスを正規化する
     * 異なるOS間でのパス形式の違いを吸収
     * @param {string} path - 正規化するパス
     * @returns {string} - 正規化されたパス
     */
    normalizePath: (path) => {
        // バックスラッシュをスラッシュに変換
        let normalized = path.replace(/\\/g, '/');
        
        // 連続するスラッシュを単一のスラッシュに変換
        normalized = normalized.replace(/\/+/g, '/');
        
        // 末尾のスラッシュを削除
        normalized = normalized.replace(/\/$/, '');
        
        if (DEBUG) {
            console.log(`パス正規化: ${path} -> ${normalized}`);
        }
        
        return normalized;
    },
    
    /**
     * パスから拡張子を取得
     * @param {string} path - 拡張子を取得するパス
     * @returns {string} - 拡張子（ドットを含む）
     */
    getExtension: (path) => {
        const match = path.match(/\.[^.]+$/);
        return match ? match[0] : '';
    },
    
    /**
     * ファイルを選択するためのダイアログを表示
     * @param {string} [accept='.json'] - 受け入れるファイル形式
     * @param {boolean} [multiple=false] - 複数ファイルの選択を許可するか
     * @returns {Promise<File[]>} - 選択されたファイル
     */
    showFileSelectDialog: (accept = '.json', multiple = false) => {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.multiple = multiple;
            input.style.display = 'none';
            
            input.addEventListener('change', (event) => {
                const files = Array.from(event.target.files);
                document.body.removeChild(input);
                resolve(files);
            });
            
            document.body.appendChild(input);
            input.click();
        });
    },
    
    /**
     * ディレクトリ名をパスから取得
     * @param {string} path - ディレクトリ名を取得するパス
     * @returns {string} - ディレクトリ名
     */
    getDirname: (path) => {
        const normalized = FileHelper.normalizePath(path);
        const lastSlashIndex = normalized.lastIndexOf('/');
        
        if (lastSlashIndex === -1) {
            return '';
        }
        
        return normalized.substring(0, lastSlashIndex);
    },
    
    /**
     * ファイル名をパスから取得
     * @param {string} path - ファイル名を取得するパス
     * @returns {string} - ファイル名
     */
    getFilename: (path) => {
        const normalized = FileHelper.normalizePath(path);
        const lastSlashIndex = normalized.lastIndexOf('/');
        
        if (lastSlashIndex === -1) {
            return normalized;
        }
        
        return normalized.substring(lastSlashIndex + 1);
    },
    
    /**
     * パスを結合する
     * @param {...string} parts - 結合するパスの部分
     * @returns {string} - 結合されたパス
     */
    joinPath: (...parts) => {
        const normalized = parts.map(part => FileHelper.normalizePath(part));
        return normalized.filter(Boolean).join('/');
    }
};

// デバッグモード時のログ
if (DEBUG) {
    console.log('FileHelperモジュールが初期化されました');
}

// グローバルスコープにエクスポート
window.FileHelper = FileHelper;
