import EnvSetting from '../models/EnvSetting.js';
import { decrypt } from '../utils/encryption.js';
import { updateConfig } from './env.js';

export const loadEnvFromDb = async ({ quiet = false } = {}) => {
    try {
        const settings = await EnvSetting.find({});
        let count = 0;
        
        settings.forEach(setting => {
            if (setting.value !== undefined && setting.value !== null) {
                const decryptedValue = setting.isEncrypted ? decrypt(setting.value) : setting.value;
                process.env[setting.key] = decryptedValue;
                count++;
            }
        });
        
        if (count > 0) {
            updateConfig();
            if (!quiet) console.log(`Loaded ${count} environment variables from Database`);
        }
    } catch (error) {
        console.error('Error loading env settings from DB:', error.message);
    }
};


let envReloadTimer = null;

/**
 * Re-read admin-managed environment settings every minute, so a change saved in the admin
 * panel reaches every process (all API instances, socket server, scheduler) without a restart.
 */
export const startEnvAutoReload = (intervalMs = 60 * 1000) => {
    if (envReloadTimer) return;
    envReloadTimer = setInterval(() => {
        loadEnvFromDb({ quiet: true }).catch(() => {});
    }, intervalMs);
    envReloadTimer.unref?.();
};
