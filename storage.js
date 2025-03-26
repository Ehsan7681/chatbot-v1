/**
 * ماژول ذخیره‌سازی برای مدیریت داده‌ها در localStorage
 * با استفاده از رمزنگاری برای امنیت داده‌ها
 */

const Storage = {
    KEYS: {
        API_KEY: 'openrouter_api_key',
        SITE_CODE: 'site_code',
        MANUAL_CODE: 'manual_code',
        CHATS: 'chats',
        MODELS: 'models',
        ACTIVE_CHAT: 'active_chat',
        LAST_MODEL: 'last_model',
        SETTINGS: 'settings',
        THEME: 'theme',
        CREATIVITY: 'creativity',
        TYPING_SPEED: 'typing_speed',
        SEARCH_QUERY: 'model_search_query'
    },
    
    /**
     * ذخیره داده در localStorage با رمزنگاری
     * @param {string} key - کلید ذخیره‌سازی
     * @param {any} data - داده‌های برای ذخیره‌سازی
     */
    save: function(key, data) {
        try {
            const encrypted = Encryption.encrypt(data);
            localStorage.setItem(key, encrypted);
        } catch (error) {
            console.error(`خطا در ذخیره ${key}:`, error);
        }
    },
    
    /**
     * بازیابی داده از localStorage با رمزگشایی
     * @param {string} key - کلید ذخیره‌سازی
     * @param {any} defaultValue - مقدار پیش‌فرض در صورت عدم وجود داده
     * @returns {any} داده‌های بازیابی شده
     */
    load: function(key, defaultValue = null) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return defaultValue;
            
            const decrypted = Encryption.decrypt(encrypted);
            return decrypted !== null ? decrypted : defaultValue;
        } catch (error) {
            console.error(`خطا در بازیابی ${key}:`, error);
            return defaultValue;
        }
    },
    
    /**
     * ذخیره کلید API
     * @param {string} apiKey - کلید API اوپن روتر
     */
    saveApiKey: function(apiKey) {
        localStorage.setItem(this.KEYS.API_KEY, apiKey);
    },
    
    /**
     * بازیابی کلید API
     * @returns {string|null} کلید API یا null
     */
    getApiKey: function() {
        return localStorage.getItem(this.KEYS.API_KEY);
    },
    
    /**
     * ذخیره کد سایت
     * @param {string} siteCode - کد سایت
     */
    saveSiteCode: function(siteCode) {
        localStorage.setItem(this.KEYS.SITE_CODE, siteCode);
    },
    
    /**
     * بازیابی کد سایت
     * @returns {string|null} کد سایت یا null
     */
    getSiteCode: function() {
        return localStorage.getItem(this.KEYS.SITE_CODE);
    },
    
    /**
     * ذخیره چت فعال
     * @param {string} chatId - شناسه چت فعال
     */
    saveActiveChat: function(chatId) {
        this.save(this.KEYS.ACTIVE_CHAT, chatId);
    },
    
    /**
     * بازیابی چت فعال
     * @returns {string|null} شناسه چت فعال یا null
     */
    getActiveChat: function() {
        return this.load(this.KEYS.ACTIVE_CHAT);
    },
    
    /**
     * ذخیره تمام چت‌ها
     * @param {Array} chats - لیست چت‌ها
     */
    saveChats: function(chats) {
        this.save(this.KEYS.CHATS, chats);
    },
    
    /**
     * بازیابی تمام چت‌ها
     * @returns {Array} لیست چت‌ها
     */
    getChats: function() {
        return this.load(this.KEYS.CHATS, []);
    },
    
    /**
     * ذخیره چت جدید یا بروزرسانی چت موجود
     * @param {Object} chat - اطلاعات چت
     */
    saveChat: function(chat) {
        const chats = this.getChats();
        const existingIndex = chats.findIndex(c => c.id === chat.id);
        
        if (existingIndex >= 0) {
            chats[existingIndex] = chat;
        } else {
            chats.push(chat);
        }
        
        this.saveChats(chats);
    },
    
    /**
     * بازیابی چت با شناسه
     * @param {string} chatId - شناسه چت
     * @returns {Object|null} اطلاعات چت یا null
     */
    getChat: function(chatId) {
        const chats = this.getChats();
        return chats.find(chat => chat.id === chatId) || null;
    },
    
    /**
     * حذف چت با شناسه
     * @param {string} chatId - شناسه چت
     * @returns {boolean} آیا حذف موفقیت‌آمیز بود؟
     */
    deleteChat: function(chatId) {
        const chats = this.getChats();
        const newChats = chats.filter(chat => chat.id !== chatId);
        
        if (newChats.length !== chats.length) {
            this.saveChats(newChats);
            
            // اگر چت فعال حذف شده، چت فعال را پاک کنیم
            if (this.getActiveChat() === chatId) {
                this.saveActiveChat(null);
            }
            
            return true;
        }
        
        return false;
    },
    
    /**
     * ذخیره آخرین مدل استفاده شده
     * @param {string} modelId - شناسه مدل
     */
    saveLastModel: function(modelId) {
        localStorage.setItem(this.KEYS.LAST_MODEL, modelId);
    },
    
    /**
     * بازیابی آخرین مدل استفاده شده
     * @returns {string|null} شناسه مدل یا null
     */
    getLastModel: function() {
        return localStorage.getItem(this.KEYS.LAST_MODEL);
    },
    
    /**
     * ذخیره لیست مدل‌ها
     * @param {Array} models - لیست مدل‌ها
     */
    saveModels: function(models) {
        this.save(this.KEYS.MODELS, models);
    },
    
    /**
     * بازیابی لیست مدل‌ها
     * @returns {Array} لیست مدل‌ها
     */
    getModels: function() {
        return this.load(this.KEYS.MODELS, []);
    },
    
    /**
     * ذخیره عبارت جستجوی مدل
     * @param {string} query - عبارت جستجو
     */
    saveModelSearchQuery: function(query) {
        localStorage.setItem(this.KEYS.SEARCH_QUERY, query);
    },
    
    /**
     * بازیابی عبارت جستجوی مدل
     * @returns {string} عبارت جستجو
     */
    getModelSearchQuery: function() {
        return localStorage.getItem(this.KEYS.SEARCH_QUERY) || '';
    },
    
    /**
     * ذخیره میزان خلاقیت
     * @param {number} value - میزان خلاقیت (0 تا 2)
     */
    saveCreativity: function(value) {
        localStorage.setItem(this.KEYS.CREATIVITY, value.toString());
    },
    
    /**
     * بازیابی میزان خلاقیت
     * @returns {number} میزان خلاقیت
     */
    getCreativity: function() {
        return parseFloat(localStorage.getItem(this.KEYS.CREATIVITY) || '0.7');
    },
    
    /**
     * ذخیره سرعت تایپ
     * @param {string} speed - سرعت تایپ (fast, medium, slow)
     */
    saveTypingSpeed: function(speed) {
        localStorage.setItem(this.KEYS.TYPING_SPEED, speed);
    },
    
    /**
     * بازیابی سرعت تایپ
     * @returns {string} سرعت تایپ
     */
    getTypingSpeed: function() {
        return localStorage.getItem(this.KEYS.TYPING_SPEED) || 'medium';
    },
    
    /**
     * ذخیره تنظیمات
     * @param {Object} settings - تنظیمات
     */
    saveSettings: function(settings) {
        this.save(this.KEYS.SETTINGS, settings);
    },
    
    /**
     * بازیابی تنظیمات
     * @returns {Object} تنظیمات
     */
    getSettings: function() {
        return this.load(this.KEYS.SETTINGS, {});
    },
    
    /**
     * ذخیره تم (روشن یا تاریک)
     * @param {string} theme - نوع تم ('light' یا 'dark')
     */
    saveTheme: function(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },
    
    /**
     * بازیابی تم
     * @returns {string} نوع تم ('light' یا 'dark')
     */
    getTheme: function() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },
    
    /**
     * افزودن پیام به چت فعال
     * @param {Object} message - اطلاعات پیام
     */
    addMessageToActiveChat: function(message) {
        const activeChatId = this.getActiveChat();
        if (!activeChatId) return false;
        
        const chat = this.getChat(activeChatId);
        if (!chat) return false;
        
        if (!chat.messages) {
            chat.messages = [];
        }
        
        chat.messages.push(message);
        chat.updatedAt = new Date().toISOString();
        this.saveChat(chat);
        
        return true;
    },
    
    /**
     * ذخیره کد دستی
     * @param {string} manualCode - کد دستی
     */
    saveManualCode: function(manualCode) {
        localStorage.setItem(this.KEYS.MANUAL_CODE, manualCode);
    },
    
    /**
     * بازیابی کد دستی
     * @returns {string|null} کد دستی یا null
     */
    getManualCode: function() {
        return localStorage.getItem(this.KEYS.MANUAL_CODE);
    }
}; 