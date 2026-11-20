import { config } from '../../../../config/env.js';

/**
 * Public runtime values the web apps need but may not have baked in at build time.
 * ONLY values that are public by design are returned here — never secrets.
 *  - firebaseVapidKey: the Web Push "application server" PUBLIC key. Browsers receive it
 *    whenever they subscribe to push, so it is not secret. Without it the apps cannot
 *    create a push (FCM) token and notifications silently never register.
 */
export const getPublicEnvController = async (_req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Public environment variables fetched',
            data: {
                firebaseVapidKey: config.firebaseWebVapidKey || process.env.VITE_FIREBASE_VAPID_KEY || '',
            },
        });
    } catch (error) {
        next(error);
    }
};
