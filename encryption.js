/**
 * ماژول رمزنگاری برای رمزگذاری و رمزگشایی داده‌ها
 * از کتابخانه CryptoJS استفاده می‌کند
 */

const Encryption = {
    /**
     * کلید رمزنگاری پیش‌فرض
     * توجه: این کلید برای رمزنگاری اولیه است و در صورت وجود کلید API، از آن استفاده می‌شود
     */
    DEFAULT_SECRET_KEY: 'ai-chatbot-default-encryption-key',
    
    /**
     * دریافت کلید رمزنگاری
     * @returns {string} کلید رمزنگاری
     */
    getEncryptionKey: function() {
        const apiKey = localStorage.getItem('openrouter_api_key');
        // از کلید API به عنوان کلید رمزنگاری استفاده می‌کنیم یا از کلید پیش‌فرض
        return apiKey || this.DEFAULT_SECRET_KEY;
    },
    
    /**
     * رمزگذاری داده‌ها
     * @param {object|string} data - داده‌های برای رمزگذاری 
     * @returns {string} داده‌های رمزگذاری شده
     */
    encrypt: function(data) {
        try {
            const dataStr = typeof data === 'object' ? JSON.stringify(data) : data;
            const key = this.getEncryptionKey();
            const encrypted = CryptoJS.AES.encrypt(dataStr, key).toString();
            return encrypted;
        } catch (error) {
            console.error('خطا در رمزگذاری داده‌ها:', error);
            return null;
        }
    },
    
    /**
     * رمزگشایی داده‌ها
     * @param {string} encryptedData - داده‌های رمزگذاری شده 
     * @param {boolean} parseJson - آیا داده‌ها را به صورت JSON تجزیه کند؟
     * @returns {object|string} داده‌های رمزگشایی شده
     */
    decrypt: function(encryptedData, parseJson = true) {
        try {
            if (!encryptedData) return null;
            
            const key = this.getEncryptionKey();
            const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
            
            if (parseJson) {
                try {
                    return JSON.parse(decrypted);
                } catch {
                    return decrypted;
                }
            }
            
            return decrypted;
        } catch (error) {
            console.error('خطا در رمزگشایی داده‌ها:', error);
            return null;
        }
    }
}; 