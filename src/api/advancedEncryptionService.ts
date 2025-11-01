/**
 * Advanced Encryption Service
 * NataCarePM - Phase 4.3: Enhanced Security
 *
 * Implements advanced data encryption and key management for sensitive information
 * including field-level encryption, key rotation, and biometric data protection
 */

import forge from 'node-forge';
import { logger } from '@/utils/logger.enhanced';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
// APIResponse type is not used in this file, removing import

// ============================================================================
// Type Definitions
// ============================================================================

export interface EncryptionKey {
  id: string;
  key: string; // Base64 encoded
  algorithm: 'AES-256-GCM' | 'RSA-OAEP';
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  purpose: 'data_encryption' | 'key_encryption' | 'biometric' | 'backup';
}

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
  keyId: string;
  algorithm: 'AES-256-GCM';
  createdAt: Date;
}

export interface BiometricData {
  template: string; // Base64 encoded encrypted template
  keyId: string;
  algorithm: 'AES-256-GCM';
  createdAt: Date;
  lastUsed?: Date;
}

export interface KeyRotationConfig {
  rotationIntervalDays: number;
  retentionPeriodDays: number;
  autoRotate: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const KEY_PURPOSES = {
  DATA_ENCRYPTION: 'data_encryption',
  KEY_ENCRYPTION: 'key_encryption',
  BIOMETRIC: 'biometric',
  BACKUP: 'backup',
} as const;

const ALGORITHMS = {
  AES_256_GCM: 'AES-256-GCM',
  RSA_OAEP: 'RSA-OAEP',
} as const;

const DEFAULT_KEY_ROTATION_CONFIG: KeyRotationConfig = {
  rotationIntervalDays: 90,
  retentionPeriodDays: 365,
  autoRotate: true,
};

// ============================================================================
// Key Management
// ============================================================================

class KeyManager {
  private masterKey: string | null = null;
  private keys: Map<string, EncryptionKey> = new Map();
  private config: KeyRotationConfig;

  constructor(config: Partial<KeyRotationConfig> = {}) {
    this.config = { ...DEFAULT_KEY_ROTATION_CONFIG, ...config };
  }

  /**
   * Initialize key manager with master key
   */
  async initialize(masterKey?: string): Promise<void> {
    try {
      // Use provided master key or generate one
      this.masterKey = masterKey || this.generateMasterKey();
      
      // Load active keys from database
      await this.loadActiveKeys();
      
      // Generate initial keys if none exist
      if (this.keys.size === 0) {
        await this.generateInitialKeys();
      }
      
      logger.info('Key manager initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize key manager', error);
      throw error;
    }
  }

  /**
   * Generate a new master key
   */
  private generateMasterKey(): string {
    return forge.util.bytesToHex(forge.random.getBytesSync(32)); // 256 bits
  }

  /**
   * Load active encryption keys from database
   */
  private async loadActiveKeys(): Promise<void> {
    try {
      // In a real implementation, this would fetch from a secure key store
      // For now, we'll simulate with in-memory storage
      logger.debug('Loading active encryption keys');
    } catch (error: any) {
      logger.error('Failed to load active keys', error);
    }
  }

  /**
   * Generate initial encryption keys
   */
  private async generateInitialKeys(): Promise<void> {
    try {
      // Generate data encryption key
      await this.generateKey(KEY_PURPOSES.DATA_ENCRYPTION);
      
      // Generate key encryption key
      await this.generateKey(KEY_PURPOSES.KEY_ENCRYPTION);
      
      // Generate biometric key
      await this.generateKey(KEY_PURPOSES.BIOMETRIC);
      
      logger.info('Initial encryption keys generated');
    } catch (error: any) {
      logger.error('Failed to generate initial keys', error);
      throw error;
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(purpose: string): Promise<EncryptionKey> {
    try {
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const keyBytes = forge.random.getBytesSync(32); // 256 bits
      const keyBase64 = forge.util.encode64(keyBytes);
      
      const key: EncryptionKey = {
        id: keyId,
        key: keyBase64,
        algorithm: ALGORITHMS.AES_256_GCM,
        createdAt: new Date(),
        isActive: true,
        purpose: purpose as any,
      };
      
      // Store key (in a real implementation, this would be in a secure key store)
      this.keys.set(keyId, key);
      
      logger.info('Encryption key generated', { keyId, purpose });
      return key;
    } catch (error: any) {
      logger.error('Failed to generate encryption key', error);
      throw error;
    }
  }

  /**
   * Get active key for a specific purpose
   */
  getActiveKey(purpose: string): EncryptionKey | null {
    for (const key of this.keys.values()) {
      if (key.isActive && key.purpose === purpose) {
        return key;
      }
    }
    return null;
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      // Generate new keys for each purpose
      await this.generateKey(KEY_PURPOSES.DATA_ENCRYPTION);
      await this.generateKey(KEY_PURPOSES.KEY_ENCRYPTION);
      await this.generateKey(KEY_PURPOSES.BIOMETRIC);
      
      // Mark old keys as inactive
      const now = new Date();
      for (const key of this.keys.values()) {
        if (key.isActive) {
          key.isActive = false;
          // Set expiration based on retention period
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + this.config.retentionPeriodDays);
          key.expiresAt = expiresAt;
        }
      }
      
      logger.info('Encryption keys rotated successfully');
    } catch (error: any) {
      logger.error('Failed to rotate encryption keys', error);
      throw error;
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    try {
      const now = new Date();
      let cleanedCount = 0;
      
      for (const [keyId, key] of this.keys.entries()) {
        if (key.expiresAt && key.expiresAt < now) {
          this.keys.delete(keyId);
          cleanedCount++;
        }
      }
      
      logger.info('Expired keys cleaned up', { cleanedCount });
    } catch (error: any) {
      logger.error('Failed to clean up expired keys', error);
    }
  }
}

// ============================================================================
// Encryption Service
// ============================================================================

class AdvancedEncryptionService {
  private keyManager: KeyManager;

  constructor() {
    this.keyManager = new KeyManager();
  }

  /**
   * Initialize the encryption service
   */
  async initialize(masterKey?: string): Promise<void> {
    await this.keyManager.initialize(masterKey);
    logger.info('Advanced encryption service initialized');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptData(plaintext: string, purpose: string = KEY_PURPOSES.DATA_ENCRYPTION): EncryptedData {
    try {
      // Get active key for the specified purpose
      const key = this.keyManager.getActiveKey(purpose);
      if (!key) {
        throw new Error(`No active key found for purpose: ${purpose}`);
      }

      // Convert key from Base64 to bytes
      const keyBytes = forge.util.decode64(key.key);
      
      // Generate random IV
      const iv = forge.random.getBytesSync(12); // 96 bits for GCM
      
      // Create cipher
      const cipher = forge.cipher.createCipher('AES-GCM', keyBytes);
      
      // Initialize cipher with IV
      cipher.start({ iv: forge.util.createBuffer(iv) });
      
      // Update cipher with plaintext
      cipher.update(forge.util.createBuffer(plaintext, 'utf8'));
      
      // Finish cipher
      cipher.finish();
      
      // Get encrypted data
      const ciphertext = cipher.output.getBytes();
      const authTag = cipher.mode.tag.getBytes();
      
      const encryptedData: EncryptedData = {
        ciphertext: forge.util.encode64(ciphertext),
        iv: forge.util.encode64(iv),
        authTag: forge.util.encode64(authTag),
        keyId: key.id,
        algorithm: ALGORITHMS.AES_256_GCM,
        createdAt: new Date(),
      };
      
      logger.debug('Data encrypted successfully', { 
        keyId: key.id, 
        ciphertextLength: encryptedData.ciphertext.length 
      });
      
      return encryptedData;
    } catch (error: any) {
      logger.error('Failed to encrypt data', error);
      throw error;
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decryptData(encryptedData: EncryptedData): string {
    try {
      // Get the key used for encryption
      const key = this.keyManager.getActiveKey(KEY_PURPOSES.DATA_ENCRYPTION);
      if (!key || key.id !== encryptedData.keyId) {
        throw new Error(`Key not found or inactive: ${encryptedData.keyId}`);
      }

      // Convert key and data from Base64 to bytes
      const keyBytes = forge.util.decode64(key.key);
      const ciphertext = forge.util.decode64(encryptedData.ciphertext);
      const iv = forge.util.decode64(encryptedData.iv);
      const authTag = forge.util.decode64(encryptedData.authTag);
      
      // Create decipher
      const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
      
      // Initialize decipher with IV and auth tag
      decipher.start({
        iv: forge.util.createBuffer(iv),
        tag: forge.util.createBuffer(authTag),
      });
      
      // Update decipher with ciphertext
      decipher.update(forge.util.createBuffer(ciphertext));
      
      // Finish decipher
      const result = decipher.finish();
      
      if (!result) {
        throw new Error('Authentication failed during decryption');
      }
      
      // Get decrypted plaintext
      const plaintext = decipher.output.getBytes();
      
      logger.debug('Data decrypted successfully', { 
        keyId: encryptedData.keyId, 
        plaintextLength: plaintext.length 
      });
      
      return forge.util.decodeUtf8(plaintext);
    } catch (error: any) {
      logger.error('Failed to decrypt data', error);
      throw error;
    }
  }

  /**
   * Encrypt biometric data
   */
  encryptBiometricData(template: string): BiometricData {
    try {
      const encryptedTemplate = this.encryptData(template, KEY_PURPOSES.BIOMETRIC);
      
      const biometricData: BiometricData = {
        template: encryptedTemplate.ciphertext,
        keyId: encryptedTemplate.keyId,
        algorithm: ALGORITHMS.AES_256_GCM,
        createdAt: new Date(),
      };
      
      logger.debug('Biometric data encrypted successfully');
      return biometricData;
    } catch (error: any) {
      logger.error('Failed to encrypt biometric data', error);
      throw error;
    }
  }

  /**
   * Decrypt biometric data
   */
  decryptBiometricData(biometricData: BiometricData): string {
    try {
      // Reconstruct encrypted data structure
      const encryptedData: EncryptedData = {
        ciphertext: biometricData.template,
        iv: '', // IV would be stored separately in a real implementation
        authTag: '', // Auth tag would be stored separately in a real implementation
        keyId: biometricData.keyId,
        algorithm: biometricData.algorithm,
        createdAt: biometricData.createdAt,
      };
      
      const decryptedTemplate = this.decryptData(encryptedData);
      
      logger.debug('Biometric data decrypted successfully');
      return decryptedTemplate;
    } catch (error: any) {
      logger.error('Failed to decrypt biometric data', error);
      throw error;
    }
  }

  /**
   * Generate key pair for asymmetric encryption
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    try {
      // Generate RSA key pair
      const keyPair = forge.pki.rsa.generateKeyPair(2048);
      
      // Convert to PEM format
      const publicKey = forge.pki.publicKeyToPem(keyPair.publicKey);
      const privateKey = forge.pki.privateKeyToPem(keyPair.privateKey);
      
      logger.debug('RSA key pair generated successfully');
      return { publicKey, privateKey };
    } catch (error: any) {
      logger.error('Failed to generate key pair', error);
      throw error;
    }
  }

  /**
   * Encrypt data with public key
   */
  encryptWithPublicKey(plaintext: string, publicKeyPem: string): string {
    try {
      // Parse public key
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      
      // Encrypt data
      const encrypted = publicKey.encrypt(plaintext, 'RSA-OAEP');
      
      // Encode as Base64
      const encryptedBase64 = forge.util.encode64(encrypted);
      
      logger.debug('Data encrypted with public key successfully');
      return encryptedBase64;
    } catch (error: any) {
      logger.error('Failed to encrypt with public key', error);
      throw error;
    }
  }

  /**
   * Decrypt data with private key
   */
  decryptWithPrivateKey(encryptedData: string, privateKeyPem: string): string {
    try {
      // Parse private key
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      
      // Decode from Base64
      const encryptedBytes = forge.util.decode64(encryptedData);
      
      // Decrypt data
      const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP');
      
      logger.debug('Data decrypted with private key successfully');
      return decrypted;
    } catch (error: any) {
      logger.error('Failed to decrypt with private key', error);
      throw error;
    }
  }

  /**
   * Hash data with salt
   */
  hashData(data: string, salt?: string): string {
    try {
      // Generate salt if not provided
      const saltBytes = salt ? forge.util.hexToBytes(salt) : forge.random.getBytesSync(16);
      
      // Create hash
      const md = forge.md.sha256.create();
      md.update(data, 'utf8');
      md.update(saltBytes, 'raw');
      
      // Return hash with salt
      return `${forge.util.bytesToHex(saltBytes)}:${md.digest().toHex()}`;
    } catch (error: any) {
      logger.error('Failed to hash data', error);
      throw error;
    }
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashWithSalt: string): boolean {
    try {
      // Split salt and hash
      const [saltHex, originalHash] = hashWithSalt.split(':');
      
      // Hash the data with the same salt
      const saltBytes = forge.util.hexToBytes(saltHex);
      const md = forge.md.sha256.create();
      md.update(data, 'utf8');
      md.update(saltBytes, 'raw');
      
      // Compare hashes
      const newHash = md.digest().toHex();
      return newHash === originalHash;
    } catch (error: any) {
      logger.error('Failed to verify hash', error);
      return false;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    await this.keyManager.rotateKeys();
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    await this.keyManager.cleanupExpiredKeys();
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const advancedEncryptionService = new AdvancedEncryptionService();
export { KeyManager, AdvancedEncryptionService };
// Types are already exported above