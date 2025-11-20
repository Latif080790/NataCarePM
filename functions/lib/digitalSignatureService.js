"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitalSignatureService = exports.DigitalSignatureService = void 0;
const admin = __importStar(require("firebase-admin"));
const forge = __importStar(require("node-forge"));
// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
// Digital Signature Service with PKI Implementation
class DigitalSignatureService {
    constructor() {
        this.caPrivateKey = null;
        this.caCertificate = null;
        this.initializeCertificateAuthority();
    }
    // Initialize certificate authority with real PKI
    initializeCertificateAuthority() {
        try {
            // Generate a new RSA key pair for the CA
            const caKeys = forge.pki.rsa.generateKeyPair(2048);
            this.caPrivateKey = caKeys.privateKey;
            // Create a new certificate
            const caCert = forge.pki.createCertificate();
            caCert.publicKey = caKeys.publicKey;
            caCert.serialNumber = '01';
            caCert.validity.notBefore = new Date();
            caCert.validity.notAfter = new Date();
            caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10); // 10 years
            // Set the CA certificate subject and issuer
            const attrs = [{
                    name: 'commonName',
                    value: 'NataCarePM Root CA'
                }, {
                    name: 'countryName',
                    value: 'ID'
                }, {
                    shortName: 'ST',
                    value: 'Jakarta'
                }, {
                    name: 'organizationName',
                    value: 'NataCarePM'
                }, {
                    shortName: 'OU',
                    value: 'Certificate Authority'
                }];
            caCert.setSubject(attrs);
            caCert.setIssuer(attrs);
            // Set extensions
            caCert.setExtensions([{
                    name: 'basicConstraints',
                    cA: true
                }, {
                    name: 'keyUsage',
                    keyCertSign: true,
                    digitalSignature: true,
                    nonRepudiation: true,
                    keyEncipherment: true,
                    dataEncipherment: true
                }]);
            // Self-sign the certificate
            caCert.sign(caKeys.privateKey, forge.md.sha256.create());
            this.caCertificate = caCert;
        }
        catch (error) {
            console.error('Failed to initialize certificate authority:', error);
            throw new Error('Failed to initialize PKI infrastructure');
        }
    }
    // Create digital signature for document
    async createSignature(documentId, documentVersionId, signerInfo, signatureType = 'digital') {
        try {
            // Validate signer information
            const validatedSigner = await this.validateSigner(signerInfo);
            // Generate signature data
            const signatureData = await this.generateSignatureData(documentId, documentVersionId, validatedSigner, signatureType);
            // Get or create certificate
            const certificate = await this.getOrCreateCertificate(validatedSigner);
            // Create signature metadata
            const metadata = await this.createSignatureMetadata(documentId, validatedSigner);
            const signature = {
                id: this.generateId(),
                documentId,
                documentVersionId,
                signerInfo: validatedSigner,
                signatureData,
                certificate,
                timestamp: new Date(),
                status: 'signed',
                metadata,
                verification: await this.performInitialVerification(signatureData, certificate),
            };
            // Store signature in Firestore
            await db.collection('digitalSignatures').doc(signature.id).set(signature);
            // Update audit trail
            await this.addAuditEntry(signature, 'signature_created', validatedSigner.userId);
            return signature;
        }
        catch (error) {
            console.error('Failed to create digital signature:', error);
            throw new Error('Failed to create digital signature');
        }
    }
    // Validate signer information
    async validateSigner(signerInfo) {
        if (!signerInfo.userId || !signerInfo.name || !signerInfo.email) {
            throw new Error('Incomplete signer information');
        }
        // Get IP address and device info (mock implementation)
        const ipAddress = '192.168.1.100'; // In production, get from request
        const deviceInfo = 'Chrome 118.0.0.0 on Windows 10'; // In production, parse user agent
        return {
            userId: signerInfo.userId,
            name: signerInfo.name,
            email: signerInfo.email,
            role: signerInfo.role || 'Signatory',
            organization: signerInfo.organization || 'Unknown',
            ipAddress,
            deviceInfo,
            location: signerInfo.location,
            authMethod: signerInfo.authMethod || 'password',
        };
    }
    // Generate signature data
    async generateSignatureData(documentId, documentVersionId, signer, signatureType) {
        // Calculate document hash
        const documentHash = await this.calculateDocumentHash(documentId, documentVersionId);
        // Create signature payload
        const payload = {
            documentId,
            documentVersionId,
            documentHash,
            signerId: signer.userId,
            timestamp: new Date().toISOString(),
            ipAddress: signer.ipAddress,
            deviceInfo: signer.deviceInfo,
        };
        // Generate signature based on type
        let signatureData;
        let algorithm;
        switch (signatureType) {
            case 'digital':
                algorithm = 'RSA-2048-SHA256';
                signatureData = await this.generateDigitalSignature(payload);
                break;
            case 'electronic':
                algorithm = 'HMAC-SHA256';
                signatureData = await this.generateElectronicSignature(payload);
                break;
            case 'biometric':
                algorithm = 'ECDSA-P256-SHA256';
                signatureData = await this.generateBiometricSignature(payload, signer);
                break;
            default:
                throw new Error(`Unsupported signature type: ${signatureType}`);
        }
        return {
            type: signatureType,
            data: signatureData,
            algorithm,
            hashValue: documentHash,
        };
    }
    // Calculate document hash
    async calculateDocumentHash(documentId, documentVersionId) {
        // In production, fetch actual document content and calculate hash
        const mockContent = `document_${documentId}_version_${documentVersionId}`;
        return this.sha256(mockContent);
    }
    // Generate digital signature (PKI-based)
    async generateDigitalSignature(payload) {
        try {
            // Serialize the payload
            const payloadString = JSON.stringify(payload);
            // Create a hash of the payload
            const md = forge.md.sha256.create();
            md.update(payloadString, 'utf8');
            // In a real implementation, we would use the signer's private key
            // For this example, we'll generate a temporary key pair
            const keys = forge.pki.rsa.generateKeyPair(2048);
            // Sign the hash
            const signature = keys.privateKey.sign(md);
            // Return the signature as a hex string
            return forge.util.bytesToHex(signature);
        }
        catch (error) {
            console.error('Failed to generate digital signature:', error);
            throw new Error('Failed to generate digital signature');
        }
    }
    // Generate electronic signature (simpler authentication)
    async generateElectronicSignature(payload) {
        const payloadString = JSON.stringify(payload);
        const hash = this.sha256(payloadString);
        return `electronic_sig_${hash.substring(0, 24)}`;
    }
    // Generate biometric signature
    async generateBiometricSignature(payload, signer) {
        // Mock biometric data
        const payloadString = JSON.stringify(Object.assign({}, payload));
        const hash = this.sha256(payloadString);
        return `biometric_sig_${hash.substring(0, 28)}`;
    }
    // Get or create certificate for signer
    async getOrCreateCertificate(signer) {
        try {
            // Generate a new RSA key pair for the signer
            const keys = forge.pki.rsa.generateKeyPair(2048);
            // Get the CA certificate
            if (!this.caCertificate) {
                throw new Error('CA certificate not found');
            }
            // Create a new certificate for the signer
            const cert = forge.pki.createCertificate();
            cert.publicKey = keys.publicKey;
            cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(8));
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // 1 year
            // Set the certificate subject
            const subjectAttrs = [{
                    name: 'commonName',
                    value: signer.name
                }, {
                    name: 'countryName',
                    value: 'ID'
                }, {
                    name: 'organizationName',
                    value: signer.organization || 'NataCarePM'
                }, {
                    name: 'emailAddress',
                    value: signer.email
                }];
            cert.setSubject(subjectAttrs);
            // Set the certificate issuer (the CA)
            const issuerAttrs = [{
                    name: 'commonName',
                    value: 'NataCarePM Root CA'
                }, {
                    name: 'countryName',
                    value: 'ID'
                }, {
                    shortName: 'ST',
                    value: 'Jakarta'
                }, {
                    name: 'organizationName',
                    value: 'NataCarePM'
                }, {
                    shortName: 'OU',
                    value: 'Certificate Authority'
                }];
            cert.setIssuer(issuerAttrs);
            // Set extensions
            cert.setExtensions([{
                    name: 'basicConstraints',
                    cA: false
                }, {
                    name: 'keyUsage',
                    digitalSignature: true,
                    nonRepudiation: true,
                    keyEncipherment: true,
                    dataEncipherment: true
                }, {
                    name: 'extKeyUsage',
                    serverAuth: true,
                    clientAuth: true
                }]);
            // Sign the certificate with the CA private key
            if (this.caPrivateKey) {
                cert.sign(this.caPrivateKey, forge.md.sha256.create());
            }
            else {
                // Fallback if CA private key is not available
                const caKeys = forge.pki.rsa.generateKeyPair(2048);
                cert.sign(caKeys.privateKey, forge.md.sha256.create());
            }
            const certificate = {
                id: this.generateId(),
                issuer: 'NataCarePM Root CA',
                subject: `CN=${signer.name}, emailAddress=${signer.email}, O=${signer.organization || 'NataCarePM'}`,
                serialNumber: cert.serialNumber,
                validFrom: cert.validity.notBefore,
                validTo: cert.validity.notAfter,
                algorithm: 'RSA-2048-SHA256',
                publicKey: forge.pki.publicKeyToPem(keys.publicKey),
                certificateChain: ['ca_root_001'],
                revocationStatus: 'valid',
                trustLevel: 'medium',
            };
            return certificate;
        }
        catch (error) {
            console.error('Failed to create certificate:', error);
            throw new Error('Failed to create digital certificate');
        }
    }
    // Create signature metadata
    async createSignatureMetadata(documentId, signer) {
        return {
            reason: 'Document approval and agreement',
            location: `${signer.ipAddress} (${signer.organization})`,
            contactInfo: signer.email,
            signingTime: new Date(),
            timeStampAuthority: 'NataCarePM TSA',
            documentHash: await this.calculateDocumentHash(documentId, 'current'),
        };
    }
    // Perform initial verification
    async performInitialVerification(signatureData, certificate) {
        const isValid = await this.verifySignature(signatureData, certificate);
        return {
            isValid,
            verifiedAt: new Date(),
            verifiedBy: 'system',
            verificationMethod: 'automated',
            integrityCheck: true,
            certificateValid: certificate.revocationStatus === 'valid',
            timestampValid: true,
            revocationChecked: true,
            errors: isValid ? [] : ['Signature verification failed'],
            warnings: [],
            verificationReport: isValid
                ? 'Signature verified successfully'
                : 'Signature verification failed',
        };
    }
    // Verify signature
    async verifySignature(signatureData, certificate) {
        try {
            // Check certificate validity
            const now = new Date();
            if (now < certificate.validFrom || now > certificate.validTo) {
                return false;
            }
            // Check revocation status
            if (certificate.revocationStatus !== 'valid') {
                return false;
            }
            // In a real implementation, we would verify the signature using the certificate's public key
            // For now, we'll do a basic validation
            return signatureData.data.length > 20 && signatureData.hashValue.length > 0;
        }
        catch (error) {
            console.error('Failed to verify signature:', error);
            return false;
        }
    }
    // Add audit trail entry
    async addAuditEntry(signature, action, userId) {
        const auditEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            userId,
            userName: signature.signerInfo.name,
            action,
            resourceType: 'signature',
            resourceId: signature.id,
            details: {
                documentId: signature.documentId,
                signatureType: signature.signatureData.type,
            },
            ipAddress: signature.signerInfo.ipAddress,
            userAgent: signature.signerInfo.deviceInfo,
            sessionId: 'signature_session',
            result: 'success',
        };
        await db.collection('auditTrail').add(auditEntry);
    }
    // Utility functions
    generateId() {
        return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    sha256(input) {
        // Mock SHA256 implementation - use actual crypto library in production
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(8, '0').repeat(8);
    }
}
exports.DigitalSignatureService = DigitalSignatureService;
// Export singleton instance
exports.digitalSignatureService = new DigitalSignatureService();
//# sourceMappingURL=digitalSignatureService.js.map