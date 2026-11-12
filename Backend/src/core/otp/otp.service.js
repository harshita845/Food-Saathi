import crypto from 'crypto';
import ms from 'ms';
import { FoodOtp } from './otp.model.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ValidationError } from '../auth/errors.js';

const generateOtpCode = () => {
    const code = crypto.randomInt(100000, 999999);
    return String(code);
};

const maskPhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 4 ? `******${digits.slice(-4)}` : 'unknown';
};

/**
 * Sends a DLT-approved OTP message through SMS India Hub.
 * Uses GET request to cloud.smsindiahub.in/api/mt/SendSMS endpoint.
 */
const sendSmsViaIndiaHub = async (phone, otp) => {
    const apiKey = config.smsIndiaHubApiKey;
    const senderId = config.smsIndiaHubSenderId || 'BGADPL';

    if (!apiKey) {
        throw new Error('SMS_INDIA_HUB_API_KEY is not configured');
    }

    const digits = String(phone || '').replace(/\D/g, '');
    const mobile = digits.slice(-10);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
        throw new ValidationError('A valid Indian mobile number is required');
    }

    const number = `91${mobile}`;
    const text = `Welcome to Food Saathi, powered by Food Saathi. Your OTP for registration is ${otp}. This OTP is valid for 10 minutes. Please do not share it with anyone.BGADPL`;

    const params = new URLSearchParams({
        APIKey: apiKey,
        senderid: senderId,
        channel: config.smsIndiaHubChannel || 'Trans',
        DCS: config.smsIndiaHubDcs || '0',
        flashsms: config.smsIndiaHubFlashSms || '0',
        number,
        text,
    });

    // Add DLT fields only if configured (required for TRAI compliance in production)
    if (config.smsIndiaHubEntityId) params.set('EntityId', config.smsIndiaHubEntityId);
    if (config.smsIndiaHubTemplateId) params.set('dlttemplateid', config.smsIndiaHubTemplateId);

    const url = `https://cloud.smsindiahub.in/api/mt/SendSMS?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        logger.info(`[SMS] Sending OTP to ${maskPhone(mobile)} via SMS India Hub with SenderId ${senderId}...`);
        const response = await fetch(url, { signal: controller.signal });
        const resultText = (await response.text()).trim();

        let resultJson = null;
        try {
            resultJson = JSON.parse(resultText);
        } catch (_) {}

        const isSuccess = response.ok && resultJson && resultJson.ErrorCode === '000';
        if (!isSuccess) {
            const errDetail = resultJson?.ErrorMessage || resultText;
            logger.error(`[SMS] SMS India Hub rejected OTP for ${maskPhone(mobile)} (ErrorCode ${resultJson?.ErrorCode || response.status}): ${errDetail}`);
            throw new Error(`SMS provider rejected the OTP request: ${errDetail}`);
        }

        logger.info(`[SMS] OTP accepted by SMS India Hub for ${maskPhone(mobile)}: JobId ${resultJson.JobId}`);
    } catch (error) {
        const message = error?.name === 'AbortError'
            ? 'SMS provider request timed out'
            : error.message;
        logger.error(`[SMS] SMS India Hub OTP delivery failed for ${maskPhone(mobile)}: ${message}`);
        throw new Error(message);
    } finally {
        clearTimeout(timeoutId);
    }
};

/** Test/review phone numbers configured in DEFAULT_OTP_TEST_PHONES (compared on the last 10 digits). */
function isDefaultOtpTestPhone(phone) {
    const last10 = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!last10) return false;
    return String(config.defaultOtpTestPhones || '')
        .split(',')
        .map((p) => p.replace(/\D/g, '').slice(-10))
        .filter(Boolean)
        .includes(last10);
}

export const createOrUpdateOtp = async (phone) => {
    const existing = await FoodOtp.findOne({ phone });
    const now = new Date();

    // Rate Limiting Logic
    if (existing) {
        const windowMs = (config.otpRateWindow || 600) * 1000;
        const isInWindow = now - existing.lastRequestAt < windowMs;

        if (isInWindow) {
            if (existing.requestCount >= (config.otpRateLimit || 3)) {
                logger.warn(`Rate limit exceeded for phone ${phone}`);
                throw new ValidationError(`Too many OTP requests. Please try again after ${Math.ceil(windowMs / 60000)} minutes.`);
            }
            existing.requestCount += 1;
        } else {
            // Reset count if window has passed
            existing.requestCount = 1;
        }
    }

    const useFixedOtp = config.useDefaultOtp || isDefaultOtpTestPhone(phone);
    let otp;
    if (useFixedOtp) {
        otp = String(config.defaultOtpCode || '123456');
        logger.info(`Default OTP mode enabled – OTP is ${otp} for phone ${phone}`);
    } else {
        otp = generateOtpCode();
    }

    // Expiry calculation: prioritize seconds, then minutes, then fallback to MS string
    let ttlMs;
    if (config.otpExpirySeconds) {
        ttlMs = config.otpExpirySeconds * 1000;
    } else if (config.otpExpiryMinutes) {
        ttlMs = config.otpExpiryMinutes * 60 * 1000;
    } else {
        ttlMs = ms(config.otpExpiry || '5m');
    }
    const expiresAt = new Date(now.getTime() + ttlMs);

    if (existing) {
        existing.otp = otp;
        existing.expiresAt = expiresAt;
        existing.attempts = 0;
        existing.lastRequestAt = now;
        await existing.save();
    } else {
        await FoodOtp.create({
            phone,
            otp,
            expiresAt,
            requestCount: 1,
            lastRequestAt: now
        });
    }

    // Only send SMS if not in default OTP mode
    if (!useFixedOtp) {
        await sendSmsViaIndiaHub(phone, otp);
    }

    return otp;
};

export const verifyOtp = async (phone, otp, options = { consume: true }) => {
    const record = await FoodOtp.findOne({ phone });
    if (!record) {
        return { valid: false, reason: 'OTP not found' };
    }

    if (record.expiresAt < new Date()) {
        return { valid: false, reason: 'OTP expired' };
    }

    if (record.attempts >= config.otpMaxAttempts) {
        return { valid: false, reason: 'Max attempts exceeded' };
    }

    record.attempts += 1;

    if (record.otp !== otp) {
        await record.save();
        return { valid: false, reason: 'Invalid OTP' };
    }

    if (options.consume !== false) {
        await record.deleteOne();
    }
    return { valid: true };
};

