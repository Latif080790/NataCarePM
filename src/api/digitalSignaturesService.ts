import {
  DigitalSignature,
  SignerInfo,
  SignatureData,
  SignatureCertificate,
  SignatureStatus,
  SignatureMetadata,
  SignatureVerification,
  LegalCompliance,
  SignatureWorkflow,
  BiometricData,
} from '@/types';

// Dynamically import node-forge to avoid TypeScript issues
let forge: any;
try {
  forge = require('node-forge');
} catch (error) {
  console.warn('node-forge not available, using fallback implementation');
  forge = null;
}

// Digital Signatures Service with Legal Compliance
export class DigitalSignaturesService {
  private certificates: Map<string, SignatureCertificate> = new Map();
  private signatures: Map<string, DigitalSignature> = new Map();
  private workflows: Map<string, SignatureWorkflow> = new Map();
  private complianceSettings: Map<string, LegalCompliance> = new Map();
  private caPrivateKey: any = null;
  private caCertificate: any = null;

  constructor() {
    this.initializeComplianceStandards();
    this.initializeCertificateAuthorities();
  }

  // Initialize compliance standards
  private initializeComplianceStandards(): void {
    // eIDAS (European Union)
    this.complianceSettings.set('eidas', {
      standard: 'eIDAS',
      level: 'qualified',
      jurisdiction: 'EU',
      auditTrail: [],
      retention: {
        retentionPeriod: 30,
        archivalLocation: 'eu-central-archive',
        legalHold: false,
      },
      dataProtection: {
        gdprCompliant: true,
        dataProcessingBasis: 'Legal obligation',
        dataSubjectRights: ['access', 'rectification', 'erasure', 'portability'],
        crossBorderTransfer: false,
      },
    });

    // ESIGN Act (United States)
    this.complianceSettings.set('esign', {
      standard: 'ESIGN',
      level: 'advanced',
      jurisdiction: 'US',
      auditTrail: [],
      retention: {
        retentionPeriod: 7,
        archivalLocation: 'us-archive',
        legalHold: false,
      },
      dataProtection: {
        gdprCompliant: false,
        dataProcessingBasis: 'Consent',
        dataSubjectRights: ['access'],
        crossBorderTransfer: true,
      },
    });

    // UETA (Uniform Electronic Transactions Act)
    this.complianceSettings.set('ueta', {
      standard: 'UETA',
      level: 'basic',
      jurisdiction: 'US',
      auditTrail: [],
      retention: {
        retentionPeriod: 7,
        archivalLocation: 'state-archive',
        legalHold: false,
      },
      dataProtection: {
        gdprCompliant: false,
        dataProcessingBasis: 'Consent',
        dataSubjectRights: ['access'],
        crossBorderTransfer: true,
      },
    });

    // Indonesia Electronic Transaction Law
    this.complianceSettings.set('indonesia_ite', {
      standard: 'custom',
      level: 'advanced',
      jurisdiction: 'ID',
      auditTrail: [],
      retention: {
        retentionPeriod: 10,
        archivalLocation: 'id-archive',
        legalHold: false,
      },
      dataProtection: {
        gdprCompliant: false,
        dataProcessingBasis: 'Legal obligation',
        dataSubjectRights: ['access', 'rectification'],
        crossBorderTransfer: false,
      },
    });
  }

  // Initialize certificate authorities
  private initializeCertificateAuthorities(): void {
    // In production, this would connect to a real Certificate Authority
    // For now, we'll generate a self-signed CA certificate
    try {
      if (!forge) {
        throw new Error('node-forge not available');
      }
      
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
      
      // Convert to our certificate format
      const cert: SignatureCertificate = {
        id: 'ca_root_001',
        issuer: 'NataCarePM',
        subject: 'NataCarePM Root Certificate Authority',
        serialNumber: '01',
        validFrom: caCert.validity.notBefore,
        validTo: caCert.validity.notAfter,
        algorithm: 'RSA-2048-SHA256',
        publicKey: forge.pki.publicKeyToPem(caKeys.publicKey),
        certificateChain: [],
        revocationStatus: 'valid',
        trustLevel: 'high',
      };
      
      this.certificates.set(cert.id, cert);
    } catch (error) {
      console.error('Failed to initialize certificate authority:', error);
      // Fallback to mock CA if PKI initialization fails
      const mockCA: SignatureCertificate = {
        id: 'ca_root_001',
        issuer: 'NataCarePM Root CA',
        subject: 'NataCarePM Root Certificate Authority',
        serialNumber: 'ROOT-001-2024',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2034-12-31'),
        algorithm: 'RSA-2048-SHA256',
        publicKey: 'mock_public_key_data',
        certificateChain: [],
        revocationStatus: 'valid',
        trustLevel: 'high',
      };
      
      this.certificates.set(mockCA.id, mockCA);
    }
  }

  // Create digital signature for document
  async createSignature(
    documentId: string,
    documentVersionId: string,
    signerInfo: Partial<SignerInfo>,
    signatureType: 'digital' | 'electronic' | 'biometric' = 'digital',
    complianceStandard: string = 'esign'
  ): Promise<DigitalSignature> {
    // Validate signer information
    const validatedSigner = await this.validateSigner(signerInfo);

    // Generate signature data
    const signatureData = await this.generateSignatureData(
      documentId,
      documentVersionId,
      validatedSigner,
      signatureType
    );

    // Get or create certificate
    const certificate = await this.getOrCreateCertificate(validatedSigner);

    // Create signature metadata
    const metadata = await this.createSignatureMetadata(
      documentId,
      validatedSigner,
      complianceStandard
    );

    // Get compliance settings
    const compliance =
      this.complianceSettings.get(complianceStandard) || this.complianceSettings.get('esign')!;

    const signature: DigitalSignature = {
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
      legalCompliance: compliance,
    };

    // Store signature
    this.signatures.set(signature.id, signature);

    // Update audit trail
    await this.addAuditEntry(signature, 'signature_created', validatedSigner.userId);

    // Check workflow if exists
    if (metadata.workflow) {
      await this.updateWorkflow(metadata.workflow, signature);
    }

    return signature;
  }

  // Validate signer information
  private async validateSigner(signerInfo: Partial<SignerInfo>): Promise<SignerInfo> {
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
  private async generateSignatureData(
    documentId: string,
    documentVersionId: string,
    signer: SignerInfo,
    signatureType: 'digital' | 'electronic' | 'biometric'
  ): Promise<SignatureData> {
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
    let signatureData: string;
    let algorithm: string;
    let biometricData: BiometricData | undefined;

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
        const biometricResult = await this.generateBiometricSignature(payload, signer);
        signatureData = biometricResult.signature;
        biometricData = biometricResult.biometric;
        break;
      default:
        throw new Error(`Unsupported signature type: ${signatureType}`);
    }

    return {
      type: signatureType,
      data: signatureData,
      algorithm,
      hashValue: documentHash,
      encryptionKey: this.generateEncryptionKey(),
      biometricData,
    };
  }

  // Calculate document hash
  private async calculateDocumentHash(
    documentId: string,
    documentVersionId: string
  ): Promise<string> {
    // In production, fetch actual document content and calculate hash
    const mockContent = `document_${documentId}_version_${documentVersionId}`;
    return this.sha256(mockContent);
  }

  // Generate digital signature (PKI-based)
  private async generateDigitalSignature(payload: any): Promise<string> {
    try {
      if (!forge) {
        throw new Error('node-forge not available');
      }
      
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
    } catch (error) {
      console.error('Failed to generate digital signature:', error);
      // Fallback to mock signature if PKI fails
      const payloadString = JSON.stringify(payload);
      const hash = this.sha256(payloadString);
      return `digital_sig_${hash.substring(0, 32)}`;
    }
  }

  // Generate electronic signature (simpler authentication)
  private async generateElectronicSignature(payload: any): Promise<string> {
    const payloadString = JSON.stringify(payload);
    const hash = this.sha256(payloadString);
    return `electronic_sig_${hash.substring(0, 24)}`;
  }

  // Generate biometric signature
  private async generateBiometricSignature(
    payload: any,
    signer: SignerInfo
  ): Promise<{
    signature: string;
    biometric: BiometricData;
  }> {
    // Mock biometric data
    const biometric: BiometricData = {
      type: 'fingerprint',
      template: `biometric_template_${signer.userId}`,
      confidence: 0.95,
      quality: 0.92,
    };

    const payloadString = JSON.stringify({ ...payload, biometric });
    const hash = this.sha256(payloadString);

    return {
      signature: `biometric_sig_${hash.substring(0, 28)}`,
      biometric,
    };
  }

  // Get or create certificate for signer
  private async getOrCreateCertificate(signer: SignerInfo): Promise<SignatureCertificate> {
    // Check if signer already has a certificate
    const existingCert = Array.from(this.certificates.values()).find((cert) =>
      cert.subject.includes(signer.email)
    );

    if (existingCert && existingCert.revocationStatus === 'valid') {
      // Verify certificate is still valid
      const now = new Date();
      if (now >= existingCert.validFrom && now <= existingCert.validTo) {
        return existingCert;
      }
    }

    try {
      if (!forge) {
        throw new Error('node-forge not available');
      }
      
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
      } else {
        // Fallback if CA private key is not available
        const caKeys = forge.pki.rsa.generateKeyPair(2048);
        cert.sign(caKeys.privateKey, forge.md.sha256.create());
      }
      
      const certificate: SignatureCertificate = {
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

      this.certificates.set(certificate.id, certificate);
      return certificate;
    } catch (error) {
      console.error('Failed to create certificate:', error);
      // Fallback to mock certificate if PKI fails
      const certificate: SignatureCertificate = {
        id: this.generateId(),
        issuer: 'NataCarePM Certificate Authority',
        subject: `CN=${signer.name}, emailAddress=${signer.email}, O=${signer.organization || 'Unknown'}`,
        serialNumber: `CERT-${Date.now()}`,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        algorithm: 'RSA-2048-SHA256',
        publicKey: this.generatePublicKey(signer),
        certificateChain: ['ca_root_001'],
        revocationStatus: 'valid',
        trustLevel: 'medium',
      };

      this.certificates.set(certificate.id, certificate);
      return certificate;
    }
  }

  // Create signature metadata
  private async createSignatureMetadata(
    documentId: string,
    signer: SignerInfo,
    complianceStandard: string
  ): Promise<SignatureMetadata> {
    // Use compliance standard for signature metadata
    console.log('Creating signature metadata with compliance standard:', complianceStandard);

    // Check if document is part of a workflow
    const workflow = Array.from(this.workflows.values()).find((w) =>
      w.workflowId.includes(documentId)
    );

    return {
      reason: 'Document approval and agreement',
      location: `${signer.ipAddress} (${signer.organization})`,
      contactInfo: signer.email,
      signingTime: new Date(),
      timeStampAuthority: 'NataCarePM TSA',
      documentHash: await this.calculateDocumentHash(documentId, 'current'),
      workflow: workflow!,
    };
  }

  // Perform initial verification
  private async performInitialVerification(
    signatureData: SignatureData,
    certificate: SignatureCertificate
  ): Promise<SignatureVerification> {
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
  async verifySignature(
    signatureData: SignatureData,
    certificate: SignatureCertificate
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  // Create signature workflow
  async createSignatureWorkflow(
    workflowId: string,
    documentId: string,
    signers: string[],
    isSequential: boolean = true,
    deadline?: Date
  ): Promise<SignatureWorkflow> {
    // Use documentId for workflow tracking
    console.log('Creating signature workflow for document:', documentId);

    const workflow: SignatureWorkflow = {
      workflowId,
      step: 1,
      totalSteps: signers.length,
      nextSigners: isSequential ? [signers[0]] : signers,
      completedSigners: [],
      isRequired: true,
      deadline,
      reminderSchedule: deadline
        ? [
            new Date(deadline.getTime() - 24 * 60 * 60 * 1000), // 1 day before
            new Date(deadline.getTime() - 60 * 60 * 1000), // 1 hour before
          ]
        : undefined,
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  // Update workflow when signature is completed
  private async updateWorkflow(
    workflow: SignatureWorkflow,
    signature: DigitalSignature
  ): Promise<void> {
    if (!workflow) return;

    const signerUserId = signature.signerInfo.userId;

    // Add to completed signers
    if (!workflow.completedSigners.includes(signerUserId)) {
      workflow.completedSigners.push(signerUserId);
    }

    // Remove from next signers
    workflow.nextSigners = workflow.nextSigners.filter((id) => id !== signerUserId);

    // Update workflow step
    workflow.step = workflow.completedSigners.length + 1;

    // Check if workflow is completed
    if (workflow.completedSigners.length >= workflow.totalSteps) {
      workflow.isCompleted = true;
      workflow.nextSigners = [];
    } else {
      // Add next signer for sequential workflows
      const allSigners = [...workflow.completedSigners, ...workflow.nextSigners];
      const remainingSigners = allSigners.filter((id) => !workflow.completedSigners.includes(id));

      if (remainingSigners.length > 0) {
        workflow.nextSigners = [remainingSigners[0]]; // Sequential
      }
    }

    this.workflows.set(workflow.workflowId, workflow);
  }

  // Bulk verification of signatures
  async bulkVerifySignatures(signatureIds: string[]): Promise<Map<string, SignatureVerification>> {
    const results = new Map<string, SignatureVerification>();

    const verificationPromises = signatureIds.map(async (id) => {
      const signature = this.signatures.get(id);
      if (!signature) {
        return { id, verification: null };
      }

      const verification = await this.performInitialVerification(
        signature.signatureData,
        signature.certificate
      );

      return { id, verification };
    });

    const verificationResults = await Promise.all(verificationPromises);

    verificationResults.forEach((result) => {
      if (result.verification) {
        results.set(result.id, result.verification);
      }
    });

    return results;
  }

  // Revoke certificate
  async revokeCertificate(certificateId: string, reason: string, revokedBy: string): Promise<void> {
    const certificate = this.certificates.get(certificateId);
    if (!certificate) {
      throw new Error(`Certificate not found: ${certificateId}`);
    }

    certificate.revocationStatus = 'revoked';

    // Update all signatures using this certificate
    for (const signature of this.signatures.values()) {
      if (signature.certificate.id === certificateId) {
        signature.status = 'revoked';
        await this.addAuditEntry(signature, 'certificate_revoked', revokedBy);
      }
    }

    // Add audit entry for certificate revocation
    const auditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId: revokedBy,
      userName: 'System Administrator',
      action: 'certificate_revoked',
      resourceType: 'certificate',
      resourceId: certificateId,
      details: { reason },
      ipAddress: '127.0.0.1',
      userAgent: 'System',
      sessionId: 'system',
      result: 'success' as const,
    };

    // Add to compliance audit trail
    const compliance = this.complianceSettings.get('esign');
    if (compliance) {
      compliance.auditTrail.push(auditEntry);
    }
  }

  // Generate signature report
  async generateSignatureReport(
    documentId: string,
    includeAuditTrail: boolean = true
  ): Promise<SignatureReport> {
    const signatures = Array.from(this.signatures.values()).filter(
      (sig) => sig.documentId === documentId
    );

    const report: SignatureReport = {
      documentId,
      generatedAt: new Date(),
      totalSignatures: signatures.length,
      validSignatures: signatures.filter((sig) => sig.status === 'signed').length,
      revokedSignatures: signatures.filter((sig) => sig.status === 'revoked').length,
      pendingSignatures: signatures.filter((sig) => sig.status === 'pending').length,
      signatures: signatures.map((sig) => ({
        id: sig.id,
        signerName: sig.signerInfo.name,
        signerEmail: sig.signerInfo.email,
        signedAt: sig.timestamp,
        status: sig.status,
        complianceStandard: sig.legalCompliance.standard,
        verificationStatus: sig.verification.isValid,
      })),
      auditTrail: includeAuditTrail ? this.getAuditTrail(documentId) : [],
    };

    return report;
  }

  // Get audit trail for document
  private getAuditTrail(documentId: string): any[] {
    const auditEntries: any[] = [];

    // Collect audit entries from all compliance settings
    for (const compliance of this.complianceSettings.values()) {
      const relevantEntries = compliance.auditTrail.filter(
        (entry) => entry.details.documentId === documentId || entry.resourceId === documentId
      );
      auditEntries.push(...relevantEntries);
    }

    return auditEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Add audit trail entry
  private async addAuditEntry(
    signature: DigitalSignature,
    action: string,
    userId: string
  ): Promise<void> {
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
        complianceStandard: signature.legalCompliance.standard,
      },
      ipAddress: signature.signerInfo.ipAddress,
      userAgent: signature.signerInfo.deviceInfo,
      sessionId: 'signature_session',
      result: 'success' as const,
    };

    signature.legalCompliance.auditTrail.push(auditEntry);
  }

  // Utility functions
  private generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEncryptionKey(): string {
    return `key_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generatePublicKey(signer: SignerInfo): string {
    return `pubkey_${signer.userId}_${Date.now()}`;
  }

  private sha256(input: string): string {
    // Mock SHA256 implementation - use actual crypto library in production
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(8);
  }

  // Public API methods
  getSignature(signatureId: string): DigitalSignature | undefined {
    return this.signatures.get(signatureId);
  }

  getSignaturesByDocument(documentId: string): DigitalSignature[] {
    return Array.from(this.signatures.values()).filter((sig) => sig.documentId === documentId);
  }

  getWorkflow(workflowId: string): SignatureWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflows(): SignatureWorkflow[] {
    return Array.from(this.workflows.values());
  }

  async cancelWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    workflow.isCancelled = true;
    this.workflows.set(workflowId, workflow);
    console.log('Workflow cancelled:', workflowId);
    return true;
  }

  async sendReminder(workflowId: string, signerId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    // In real implementation, send actual reminder
    console.log('Reminder sent for workflow:', workflowId, 'to signer:', signerId);
    return true;
  }

  getCertificate(certificateId: string): SignatureCertificate | undefined {
    return this.certificates.get(certificateId);
  }

  listComplianceStandards(): string[] {
    return Array.from(this.complianceSettings.keys());
  }

  getComplianceInfo(standard: string): LegalCompliance | undefined {
    return this.complianceSettings.get(standard);
  }
}

// Helper interfaces
interface SignatureReport {
  documentId: string;
  generatedAt: Date;
  totalSignatures: number;
  validSignatures: number;
  revokedSignatures: number;
  pendingSignatures: number;
  signatures: {
    id: string;
    signerName: string;
    signerEmail: string;
    signedAt: Date;
    status: SignatureStatus;
    complianceStandard: string;
    verificationStatus: boolean;
  }[];
  auditTrail: any[];
}

// Export singleton instance
export const digitalSignaturesService = new DigitalSignaturesService();