/**
 * Crypto Module - Client-side encryption using Web Crypto API
 * All user data is encrypted with their password using AES-GCM
 */

(function () {
    const PBKDF2_ITERATIONS = 100000;
    const SALT_LENGTH = 16;
    const IV_LENGTH = 12;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    window.StopIt.CryptoService = {
        /**
         * Generate a random salt
         */
        generateSalt: function () {
            return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        },

        /**
         * Generate a random IV (Initialization Vector)
         */
        generateIV: function () {
            return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        },

        /**
         * Derive a cryptographic key from password using PBKDF2
         */
        deriveKey: async function (password, salt) {
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            return crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                },
                passwordKey,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false,
                ['encrypt', 'decrypt']
            );
        },

        /**
         * Hash password for authentication (not for encryption)
         */
        hashPassword: async function (password, salt) {
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                },
                passwordKey,
                256
            );

            // Convert to hex string
            return Array.from(new Uint8Array(derivedBits))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        },

        /**
         * Encrypt data with password
         */
        encrypt: async function (data, password, salt) {
            try {
                const key = await this.deriveKey(password, salt);
                const iv = this.generateIV();

                const dataString = typeof data === 'string' ? data : JSON.stringify(data);
                const dataBuffer = encoder.encode(dataString);

                const encryptedBuffer = await crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    key,
                    dataBuffer
                );

                // Combine IV + encrypted data for storage
                const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                combined.set(iv, 0);
                combined.set(new Uint8Array(encryptedBuffer), iv.length);

                // Convert to base64 for storage
                return this.arrayBufferToBase64(combined);
            } catch (error) {
                console.error('❌ Encryption error:', error);
                throw new Error('Encryption failed');
            }
        },

        /**
         * Decrypt data with password
         */
        decrypt: async function (encryptedData, password, salt) {
            try {
                const key = await this.deriveKey(password, salt);

                // Convert from base64
                const combined = this.base64ToArrayBuffer(encryptedData);

                // Extract IV and encrypted data
                const iv = combined.slice(0, IV_LENGTH);
                const data = combined.slice(IV_LENGTH);

                const decryptedBuffer = await crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    key,
                    data
                );

                const decryptedString = decoder.decode(decryptedBuffer);

                // Try to parse as JSON, otherwise return as string
                try {
                    return JSON.parse(decryptedString);
                } catch {
                    return decryptedString;
                }
            } catch (error) {
                console.error('❌ Decryption error:', error);
                throw new Error('Decryption failed - wrong password?');
            }
        },

        /**
         * Convert ArrayBuffer to Base64 string
         */
        arrayBufferToBase64: function (buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        },

        /**
         * Convert Base64 string to ArrayBuffer
         */
        base64ToArrayBuffer: function (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        },

        /**
         * Convert Uint8Array to Base64 (for salt storage)
         */
        saltToBase64: function (salt) {
            return this.arrayBufferToBase64(salt);
        },

        /**
         * Convert Base64 to Uint8Array (for salt retrieval)
         */
        base64ToSalt: function (base64) {
            return this.base64ToArrayBuffer(base64);
        },

        /**
         * Verify password against stored hash
         */
        verifyPassword: async function (password, storedHash, salt) {
            const hash = await this.hashPassword(password, salt);
            return hash === storedHash;
        },

        /**
         * Generate a secure random password (for testing/demo)
         */
        generateRandomPassword: function (length = 16) {
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
            const randomValues = crypto.getRandomValues(new Uint8Array(length));
            return Array.from(randomValues)
                .map(x => charset[x % charset.length])
                .join('');
        }
    };
})();
