import {
  DocumentVersion,
  FileMetadata,
  ChangeSet,
  VersionTag,
  MergeInfo,
  ConflictResolution,
  DocumentBranch,
  EncryptionInfo,
} from '@/types';
import { logger } from '@/utils/logger.enhanced';

// Document Version Control System (Git-like)
export class DocumentVersionControl {
  private versions: Map<string, DocumentVersion> = new Map();
  private branches: Map<string, DocumentBranch> = new Map();
  private commits: Map<string, CommitInfo> = new Map();
  private conflictResolver: ConflictResolver;

  constructor() {
    this.conflictResolver = new ConflictResolver();
    this.initializeDefaultBranches();

    // TODO: Implement conflict resolver functionality
    logger.info('Conflict resolver initialized:', this.conflictResolver);
  }

  // Initialize default branches
  private initializeDefaultBranches(): void {
    const mainBranch: DocumentBranch = {
      id: 'main',
      name: 'main',
      documentId: '',
      createdBy: 'system',
      createdAt: new Date(),
      lastCommitId: '',
      lastActivityAt: new Date(),
      isDefault: true,
      isProtected: true,
      mergeRules: [
        {
          type: 'require_review',
          condition: 'always',
          minimumApprovals: 1,
        },
      ],
      access: {
        canRead: ['all'],
        canWrite: ['authorized'],
        canMerge: ['admin', 'project_manager'],
        canDelete: ['admin'],
        inheritFromParent: false,
      },
      status: 'active',
    };

    this.branches.set('main', mainBranch);
  }

  // Create new document version (commit)
  async createVersion(
    documentId: string,
    content: Blob | string,
    commitMessage: string,
    authorId: string,
    authorName: string,
    branchName: string = 'main',
    parentVersionId?: string
  ): Promise<DocumentVersion> {
    // Get or create branch
    const branch = await this.getOrCreateBranch(documentId, branchName, authorId);

    // Calculate version number
    const versionNumber = await this.calculateNextVersion(documentId, branchName, parentVersionId);

    // Process file content
    const fileMetadata = await this.processFileContent(content, documentId);

    // Calculate content hash
    const contentHash = await this.calculateContentHash(content);

    // Generate change set
    const changeSet = await this.generateChangeSet(
      documentId,
      branchName,
      parentVersionId,
      content
    );

    const version: DocumentVersion = {
      id: this.generateVersionId(),
      documentId,
      versionNumber: versionNumber.version,
      majorVersion: versionNumber.major,
      minorVersion: versionNumber.minor,
      patchVersion: versionNumber.patch,
      parentVersionId,
      branchName,
      commitMessage,
      authorId,
      authorName,
      timestamp: new Date(),
      fileMetadata,
      contentHash,
      changeSet,
      status: 'draft',
      tags: [],
      mergeInfo: undefined,
      conflictResolution: undefined,
    };

    // Store version
    this.versions.set(version.id, version);

    // Update branch
    branch.lastCommitId = version.id;
    branch.lastActivityAt = new Date();
    this.branches.set(branch.id, branch);

    // Create commit info
    const commitInfo: CommitInfo = {
      id: version.id,
      documentId,
      branchName,
      authorId,
      authorName,
      timestamp: version.timestamp,
      message: commitMessage,
      parentCommits: parentVersionId ? [parentVersionId] : [],
      fileChanges: changeSet,
      stats: this.calculateCommitStats(changeSet),
    };

    this.commits.set(version.id, commitInfo);

    return version;
  }

  // Get or create branch
  private async getOrCreateBranch(
    documentId: string,
    branchName: string,
    createdBy: string
  ): Promise<DocumentBranch> {
    const branchId = `${documentId}_${branchName}`;
    let branch = this.branches.get(branchId);

    if (!branch) {
      // Create new branch
      branch = {
        id: branchId,
        name: branchName,
        documentId,
        createdBy,
        createdAt: new Date(),
        lastCommitId: '',
        lastActivityAt: new Date(),
        isDefault: branchName === 'main',
        isProtected: branchName === 'main',
        mergeRules:
          branchName === 'main'
            ? [
                {
                  type: 'require_review',
                  condition: 'always',
                  minimumApprovals: 1,
                },
              ]
            : [],
        access: {
          canRead: ['all'],
          canWrite: ['authorized'],
          canMerge: ['admin', 'project_manager'],
          canDelete: branchName === 'main' ? [] : ['admin'],
          inheritFromParent: true,
        },
        status: 'active',
      };

      this.branches.set(branchId, branch);
    }

    return branch;
  }

  // Calculate next version number
  private async calculateNextVersion(
    documentId: string,
    branchName: string,
    parentVersionId?: string
  ): Promise<{ version: string; major: number; minor: number; patch: number }> {
    if (parentVersionId) {
      const parentVersion = this.versions.get(parentVersionId);
      if (parentVersion) {
        return {
          version: `${parentVersion.majorVersion}.${parentVersion.minorVersion}.${parentVersion.patchVersion + 1}`,
          major: parentVersion.majorVersion,
          minor: parentVersion.minorVersion,
          patch: parentVersion.patchVersion + 1,
        };
      }
    }

    // Find latest version in branch
    const branchVersions = Array.from(this.versions.values())
      .filter((v) => v.documentId === documentId && v.branchName === branchName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (branchVersions.length === 0) {
      return { version: '1.0.0', major: 1, minor: 0, patch: 0 };
    }

    const latest = branchVersions[0];
    return {
      version: `${latest.majorVersion}.${latest.minorVersion}.${latest.patchVersion + 1}`,
      major: latest.majorVersion,
      minor: latest.minorVersion,
      patch: latest.patchVersion + 1,
    };
  }

  // Process file content and generate metadata
  private async processFileContent(
    content: Blob | string,
    documentId: string
  ): Promise<FileMetadata> {
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: 'text/plain' });
    } else {
      blob = content;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const checksum = await this.calculateChecksum(arrayBuffer);

    // Determine file type
    const mimeType = blob.type || 'application/octet-stream';
    const fileName = `${documentId}_${Date.now()}`;

    // Mock compression (in production, implement actual compression)
    const compressionRatio = Math.random() * 0.3 + 0.7; // 70-100%

    // Mock encryption info
    const encryptionInfo: EncryptionInfo = {
      algorithm: 'AES-256-GCM',
      keyId: `key_${this.generateId()}`,
      isEncrypted: true,
      encryptionLevel: 'storage',
    };

    return {
      fileName,
      fileSize: blob.size,
      mimeType,
      encoding: 'utf-8',
      checksum,
      storageLocation: `storage/${documentId}/${fileName}`,
      compressionRatio,
      encryptionInfo,
    };
  }

  // Calculate content hash
  private async calculateContentHash(content: Blob | string): Promise<string> {
    let text: string;
    if (typeof content === 'string') {
      text = content;
    } else {
      text = await content.text();
    }

    return this.sha256(text);
  }

  // Generate change set
  private async generateChangeSet(
    documentId: string,
    branchName: string,
    parentVersionId: string | undefined,
    newContent: Blob | string
  ): Promise<ChangeSet[]> {
    // Use branchName for change tracking
    logger.info('Generating change set for branch', { branchName, documentId });

    if (!parentVersionId) {
      // First version - everything is new
      return [
        {
          type: 'insert',
          path: '/',
          newValue: typeof newContent === 'string' ? newContent : await newContent.text(),
          lineNumber: 1,
          characterPosition: 0,
        },
      ];
    }

    const parentVersion = this.versions.get(parentVersionId);
    if (!parentVersion) {
      throw new Error(`Parent version not found: ${parentVersionId}`);
    }

    // Get parent content (mock - in production, retrieve from storage)
    const parentContent = `Previous content for ${documentId}`;
    const currentContent = typeof newContent === 'string' ? newContent : await newContent.text();

    // Generate diff (simplified)
    return this.generateDiff(parentContent, currentContent);
  }

  // Generate diff between two content versions
  private generateDiff(oldContent: string, newContent: string): ChangeSet[] {
    const changes: ChangeSet[] = [];
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    // Simple line-by-line diff (in production, use more sophisticated algorithm)
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine !== newLine) {
        if (oldLine && newLine) {
          // Modified line
          changes.push({
            type: 'modify',
            path: `line_${i + 1}`,
            oldValue: oldLine,
            newValue: newLine,
            lineNumber: i + 1,
            characterPosition: 0,
          });
        } else if (oldLine && !newLine) {
          // Deleted line
          changes.push({
            type: 'delete',
            path: `line_${i + 1}`,
            oldValue: oldLine,
            lineNumber: i + 1,
            characterPosition: 0,
          });
        } else if (!oldLine && newLine) {
          // Inserted line
          changes.push({
            type: 'insert',
            path: `line_${i + 1}`,
            newValue: newLine,
            lineNumber: i + 1,
            characterPosition: 0,
          });
        }
      }
    }

    return changes;
  }

  // Create branch
  async createBranch(
    documentId: string,
    branchName: string,
    fromBranch: string = 'main',
    createdBy: string
  ): Promise<DocumentBranch> {
    // Check if branch already exists
    const branchId = `${documentId}_${branchName}`;
    if (this.branches.has(branchId)) {
      throw new Error(`Branch already exists: ${branchName}`);
    }

    // Get parent branch
    const parentBranchId = `${documentId}_${fromBranch}`;
    const parentBranch = this.branches.get(parentBranchId);
    if (!parentBranch) {
      throw new Error(`Parent branch not found: ${fromBranch}`);
    }

    const branch: DocumentBranch = {
      id: branchId,
      name: branchName,
      documentId,
      parentBranchId: parentBranchId,
      createdBy,
      createdAt: new Date(),
      lastCommitId: parentBranch.lastCommitId,
      lastActivityAt: new Date(),
      isDefault: false,
      isProtected: false,
      mergeRules: [],
      access: {
        canRead: parentBranch.access.canRead,
        canWrite: parentBranch.access.canWrite,
        canMerge: parentBranch.access.canMerge,
        canDelete: parentBranch.access.canDelete,
        inheritFromParent: true,
      },
      status: 'active',
    };

    this.branches.set(branchId, branch);
    return branch;
  }

  // Merge branches
  async mergeBranches(
    documentId: string,
    fromBranch: string,
    toBranch: string,
    mergedBy: string,
    mergeStrategy: 'fast-forward' | 'recursive' | 'ours' | 'theirs' | 'manual' = 'recursive'
  ): Promise<MergeResult> {
    const fromBranchId = `${documentId}_${fromBranch}`;
    const toBranchId = `${documentId}_${toBranch}`;

    const sourceBranch = this.branches.get(fromBranchId);
    const targetBranch = this.branches.get(toBranchId);

    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found');
    }

    // Check merge rules
    await this.validateMergeRules(targetBranch, mergedBy);

    // Get latest versions from both branches
    const sourceVersion = this.versions.get(sourceBranch.lastCommitId);
    const targetVersion = this.versions.get(targetBranch.lastCommitId);

    if (!sourceVersion || !targetVersion) {
      throw new Error('Could not find latest versions for merge');
    }

    // Detect conflicts
    const conflicts = await this.detectConflicts(sourceVersion, targetVersion);

    let mergeCommitId: string;
    let conflictResolutions: ConflictResolution[] = [];

    if (conflicts.length > 0 && mergeStrategy !== 'ours' && mergeStrategy !== 'theirs') {
      // Manual conflict resolution required
      return {
        success: false,
        conflicts,
        mergeCommitId: '',
        message: 'Manual conflict resolution required',
      };
    }

    // Resolve conflicts automatically based on strategy
    if (conflicts.length > 0) {
      const validStrategy =
        mergeStrategy === 'manual' ||
        mergeStrategy === 'fast-forward' ||
        mergeStrategy === 'recursive'
          ? 'ours'
          : mergeStrategy;
      conflictResolutions = await this.resolveConflicts(conflicts, validStrategy, mergedBy);
    }

    // Create merge commit
    const mergeCommit = await this.createMergeCommit(
      documentId,
      sourceVersion,
      targetVersion,
      toBranch,
      mergedBy,
      mergeStrategy,
      conflictResolutions
    );

    mergeCommitId = mergeCommit.id;

    // Update target branch
    targetBranch.lastCommitId = mergeCommitId;
    targetBranch.lastActivityAt = new Date();
    this.branches.set(toBranchId, targetBranch);

    // Mark source branch as merged if it's a feature branch
    if (fromBranch !== 'main' && fromBranch !== 'development') {
      sourceBranch.status = 'merged';
      this.branches.set(fromBranchId, sourceBranch);
    }

    return {
      success: true,
      conflicts: [],
      mergeCommitId,
      message: `Successfully merged ${fromBranch} into ${toBranch}`,
    };
  }

  // Validate merge rules
  private async validateMergeRules(branch: DocumentBranch, userId: string): Promise<void> {
    for (const rule of branch.mergeRules) {
      switch (rule.type) {
        case 'require_review':
          // In production, check if PR has required reviews
          break;
        case 'require_approval':
          if (rule.approvers && !rule.approvers.includes(userId)) {
            throw new Error('User not authorized to merge');
          }
          break;
      }
    }
  }

  // Detect merge conflicts
  private async detectConflicts(
    sourceVersion: DocumentVersion,
    targetVersion: DocumentVersion
  ): Promise<MergeConflict[]> {
    const conflicts: MergeConflict[] = [];

    // Compare change sets
    const sourceChanges = sourceVersion.changeSet;
    const targetChanges = targetVersion.changeSet;

    // Find overlapping changes
    for (const sourceChange of sourceChanges) {
      const conflictingChange = targetChanges.find(
        (targetChange) =>
          targetChange.path === sourceChange.path &&
          targetChange.lineNumber === sourceChange.lineNumber
      );

      if (conflictingChange) {
        conflicts.push({
          path: sourceChange.path,
          lineNumber: sourceChange.lineNumber || 0,
          sourceChange,
          targetChange: conflictingChange,
          type: 'content',
        });
      }
    }

    return conflicts;
  }

  // Resolve conflicts automatically
  private async resolveConflicts(
    conflicts: MergeConflict[],
    strategy: 'ours' | 'theirs',
    resolvedBy: string
  ): Promise<ConflictResolution[]> {
    return conflicts.map((conflict) => ({
      conflictType: conflict.type,
      conflictPath: conflict.path,
      resolution: strategy === 'ours' ? 'accept_current' : 'accept_incoming',
      resolvedBy,
      resolvedAt: new Date(),
      resolutionDetails: `Automatically resolved using ${strategy} strategy`,
    }));
  }

  // Create merge commit
  private async createMergeCommit(
    documentId: string,
    sourceVersion: DocumentVersion,
    targetVersion: DocumentVersion,
    toBranch: string,
    mergedBy: string,
    mergeStrategy: string,
    conflictResolutions: ConflictResolution[]
  ): Promise<DocumentVersion> {
    // Merge content (simplified)
    const mergedContent = await this.mergeContent(sourceVersion, targetVersion, mergeStrategy);

    const versionNumber = await this.calculateNextVersion(documentId, toBranch, targetVersion.id);

    const mergeInfo: MergeInfo = {
      fromBranch: sourceVersion.branchName,
      toBranch,
      mergeStrategy: mergeStrategy as any,
      conflictsDetected: conflictResolutions.length > 0,
      mergedAt: new Date(),
      mergedBy,
      mergeCommitId: '',
    };

    const mergeCommit: DocumentVersion = {
      id: this.generateVersionId(),
      documentId,
      versionNumber: versionNumber.version,
      majorVersion: versionNumber.major,
      minorVersion: versionNumber.minor,
      patchVersion: versionNumber.patch,
      parentVersionId: targetVersion.id,
      branchName: toBranch,
      commitMessage: `Merge ${sourceVersion.branchName} into ${toBranch}`,
      authorId: mergedBy,
      authorName: 'System',
      timestamp: new Date(),
      fileMetadata: targetVersion.fileMetadata,
      contentHash: await this.calculateContentHash(mergedContent),
      changeSet: await this.generateChangeSet(
        documentId,
        toBranch,
        targetVersion.id,
        mergedContent
      ),
      status: 'approved',
      tags: [],
      mergeInfo,
      conflictResolution: conflictResolutions,
    };

    mergeInfo.mergeCommitId = mergeCommit.id;
    this.versions.set(mergeCommit.id, mergeCommit);

    return mergeCommit;
  }

  // Merge content
  private async mergeContent(
    sourceVersion: DocumentVersion,
    targetVersion: DocumentVersion,
    strategy: string
  ): Promise<string> {
    // Simplified content merging
    // In production, implement sophisticated merging algorithms

    switch (strategy) {
      case 'ours':
        return `Content from ${targetVersion.branchName} branch`;
      case 'theirs':
        return `Content from ${sourceVersion.branchName} branch`;
      default:
        return `Merged content from ${sourceVersion.branchName} and ${targetVersion.branchName}`;
    }
  }

  // Get version history
  getVersionHistory(documentId: string, branchName?: string, limit?: number): DocumentVersion[] {
    let versions = Array.from(this.versions.values()).filter((v) => v.documentId === documentId);

    if (branchName) {
      versions = versions.filter((v) => v.branchName === branchName);
    }

    // Sort by timestamp (newest first)
    versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit) {
      versions = versions.slice(0, limit);
    }

    return versions;
  }

  // Get commit graph
  getCommitGraph(documentId: string): CommitGraphNode[] {
    const commits = Array.from(this.commits.values()).filter((c) => c.documentId === documentId);

    return commits.map((commit) => ({
      id: commit.id,
      message: commit.message,
      author: commit.authorName,
      timestamp: commit.timestamp,
      branchName: commit.branchName,
      parentCommits: commit.parentCommits,
      children: this.getChildCommits(commit.id),
    }));
  }

  // Get child commits
  private getChildCommits(commitId: string): string[] {
    return Array.from(this.commits.values())
      .filter((c) => c.parentCommits.includes(commitId))
      .map((c) => c.id);
  }

  // Tag version
  async tagVersion(versionId: string, tag: VersionTag, taggedBy: string): Promise<void> {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }

    // Check if tag already exists
    const existingTag = version.tags.find((t) => t.name === tag.name);
    if (existingTag) {
      throw new Error(`Tag already exists: ${tag.name}`);
    }

    version.tags.push({
      ...tag,
      metadata: {
        ...tag.metadata,
        taggedBy,
        taggedAt: new Date(),
      },
    });

    this.versions.set(versionId, version);
  }

  // Revert to version
  async revertToVersion(
    documentId: string,
    versionId: string,
    branchName: string,
    revertedBy: string
  ): Promise<DocumentVersion> {
    const targetVersion = this.versions.get(versionId);
    if (!targetVersion) {
      throw new Error(`Version not found: ${versionId}`);
    }

    // Create new version with reverted content
    const revertCommit = await this.createVersion(
      documentId,
      `Reverted content from version ${targetVersion.versionNumber}`,
      `Revert to version ${targetVersion.versionNumber}`,
      revertedBy,
      'System',
      branchName,
      await this.getLatestVersionId(documentId, branchName)
    );

    return revertCommit;
  }

  // Get latest version ID
  private async getLatestVersionId(
    documentId: string,
    branchName: string
  ): Promise<string | undefined> {
    const versions = this.getVersionHistory(documentId, branchName, 1);
    return versions.length > 0 ? versions[0].id : undefined;
  }

  // Compare versions
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionComparison> {
    const version1 = this.versions.get(versionId1);
    const version2 = this.versions.get(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    return {
      version1: {
        id: version1.id,
        version: version1.versionNumber,
        author: version1.authorName,
        timestamp: version1.timestamp,
      },
      version2: {
        id: version2.id,
        version: version2.versionNumber,
        author: version2.authorName,
        timestamp: version2.timestamp,
      },
      differences: this.calculateDifferences(version1, version2),
      stats: {
        additions: version2.changeSet.filter((c) => c.type === 'insert').length,
        deletions: version2.changeSet.filter((c) => c.type === 'delete').length,
        modifications: version2.changeSet.filter((c) => c.type === 'modify').length,
      },
    };
  }

  // Calculate differences between versions
  private calculateDifferences(
    version1: DocumentVersion,
    version2: DocumentVersion
  ): VersionDifference[] {
    const differences: VersionDifference[] = [];

    // Compare file metadata
    if (version1.fileMetadata.fileSize !== version2.fileMetadata.fileSize) {
      differences.push({
        type: 'metadata',
        field: 'fileSize',
        oldValue: version1.fileMetadata.fileSize,
        newValue: version2.fileMetadata.fileSize,
      });
    }

    // Compare change sets
    version2.changeSet.forEach((change, index) => {
      differences.push({
        type: 'content',
        field: `change_${index}`,
        oldValue: change.oldValue,
        newValue: change.newValue,
      });
    });

    return differences;
  }

  // Utility functions
  private calculateCommitStats(changeSet: ChangeSet[]): CommitStats {
    return {
      additions: changeSet.filter((c) => c.type === 'insert').length,
      deletions: changeSet.filter((c) => c.type === 'delete').length,
      modifications: changeSet.filter((c) => c.type === 'modify').length,
      totalChanges: changeSet.length,
    };
  }

  private async calculateChecksum(arrayBuffer: ArrayBuffer): Promise<string> {
    // Simple checksum calculation (use proper crypto in production)
    const view = new Uint8Array(arrayBuffer);
    let hash = 0;
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }

  private sha256(input: string): string {
    // Mock SHA256 implementation
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(8);
  }

  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getVersion(versionId: string): DocumentVersion | undefined {
    return this.versions.get(versionId);
  }

  getBranch(branchId: string): DocumentBranch | undefined {
    return this.branches.get(branchId);
  }

  getBranches(documentId: string): DocumentBranch[] {
    return Array.from(this.branches.values()).filter((b) => b.documentId === documentId);
  }

  getCommit(commitId: string): CommitInfo | undefined {
    return this.commits.get(commitId);
  }

  listTags(documentId: string): VersionTag[] {
    const tags: VersionTag[] = [];
    Array.from(this.versions.values())
      .filter((v) => v.documentId === documentId)
      .forEach((v) => tags.push(...v.tags));
    return tags;
  }
}

// Conflict Resolver
class ConflictResolver {
  resolveContentConflict(
    sourceContent: string,
    targetContent: string,
    strategy: 'ours' | 'theirs' | 'merge'
  ): string {
    switch (strategy) {
      case 'ours':
        return targetContent;
      case 'theirs':
        return sourceContent;
      case 'merge':
        return this.mergeContent(sourceContent, targetContent);
      default:
        throw new Error(`Unknown merge strategy: ${strategy}`);
    }
  }

  private mergeContent(sourceContent: string, targetContent: string): string {
    // Simple merge implementation
    const sourceLines = sourceContent.split('\n');
    const targetLines = targetContent.split('\n');

    const mergedLines: string[] = [];
    const maxLines = Math.max(sourceLines.length, targetLines.length);

    for (let i = 0; i < maxLines; i++) {
      const sourceLine = sourceLines[i];
      const targetLine = targetLines[i];

      if (sourceLine === targetLine) {
        mergedLines.push(sourceLine);
      } else if (sourceLine && targetLine) {
        mergedLines.push(`<<<<<<< HEAD`);
        mergedLines.push(targetLine);
        mergedLines.push(`=======`);
        mergedLines.push(sourceLine);
        mergedLines.push(`>>>>>>> branch`);
      } else {
        mergedLines.push(sourceLine || targetLine);
      }
    }

    return mergedLines.join('\n');
  }
}

// Helper interfaces
interface CommitInfo {
  id: string;
  documentId: string;
  branchName: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  message: string;
  parentCommits: string[];
  fileChanges: ChangeSet[];
  stats: CommitStats;
}

interface CommitStats {
  additions: number;
  deletions: number;
  modifications: number;
  totalChanges: number;
}

interface MergeConflict {
  path: string;
  lineNumber: number;
  sourceChange: ChangeSet;
  targetChange: ChangeSet;
  type: 'content' | 'metadata' | 'structure' | 'permission';
}

interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  mergeCommitId: string;
  message: string;
}

interface CommitGraphNode {
  id: string;
  message: string;
  author: string;
  timestamp: Date;
  branchName: string;
  parentCommits: string[];
  children: string[];
}

interface VersionComparison {
  version1: {
    id: string;
    version: string;
    author: string;
    timestamp: Date;
  };
  version2: {
    id: string;
    version: string;
    author: string;
    timestamp: Date;
  };
  differences: VersionDifference[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

interface VersionDifference {
  type: 'content' | 'metadata';
  field: string;
  oldValue: any;
  newValue: any;
}

// Export singleton instance
export const documentVersionControl = new DocumentVersionControl();
