export class SaveSystem {
    static STORAGE_KEY = 'SPLIT_SECOND_SAVE_DATA_V1';
    static CURRENT_VERSION = 1;
    static _memoryStore = {};

    static getStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage;
            }
        } catch (e) {}

        return {
            getItem: (k) => SaveSystem._memoryStore[k] || null,
            setItem: (k, v) => { SaveSystem._memoryStore[k] = String(v); }
        };
    }

    static getInitialData() {
        return {
            version: this.CURRENT_VERSION,
            unlockedIndex: 0,
            levelProgress: {}, // { [levelId]: { score, stars, completed, bestTime } }
            settings: {
                reducedMotion: false,
                muted: false
            }
        };
    }

    static load() {
        try {
            const storage = this.getStorage();
            const raw = storage.getItem(this.STORAGE_KEY);
            if (!raw) return this.getInitialData();

            const parsed = JSON.parse(raw);
            // §25 #4 Version migration guard
            if (!parsed.version || parsed.version < this.CURRENT_VERSION) {
                parsed.version = this.CURRENT_VERSION;
            }
            return {
                ...this.getInitialData(),
                ...parsed,
                settings: {
                    ...this.getInitialData().settings,
                    ...(parsed.settings || {})
                }
            };
        } catch (e) {
            return this.getInitialData();
        }
    }

    static save(data) {
        try {
            const storage = this.getStorage();
            data.version = this.CURRENT_VERSION;
            storage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            return false;
        }
    }

    static recordLevelCompletion(levelId, index, score, stars, time) {
        const data = this.load();
        
        // Update highest unlocked index
        if (index + 1 > data.unlockedIndex) {
            data.unlockedIndex = index + 1;
        }

        // Record best score/stars
        const prev = data.levelProgress[levelId] || { score: 0, stars: 0, completed: false, bestTime: 9999 };
        data.levelProgress[levelId] = {
            completed: true,
            score: Math.max(prev.score, score),
            stars: Math.max(prev.stars, stars),
            bestTime: Math.min(prev.bestTime, time)
        };

        this.save(data);
        return data;
    }
}
