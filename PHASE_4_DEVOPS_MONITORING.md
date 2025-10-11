# Fase 4: Enterprise DevOps & Monitoring - Implementation Complete

## 🎯 Objektif Fase 4 (Bulan 5-6)
Membangun infrastruktur DevOps enterprise-grade dengan monitoring komprehensif, observability terdistribusi, dan automation pipeline yang mendukung continuous delivery di lingkungan multi-cloud.

---

## 🛠️ **1. Advanced CI/CD Pipeline Architecture**

### 1.1 **GitOps with ArgoCD & Tekton**

#### Enterprise GitOps Workflow
```yaml
# .tekton/pipeline/enterprise-pipeline.yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: natacare-enterprise-pipeline
  namespace: natacare-devops
  labels:
    app.kubernetes.io/name: natacare-pipeline
    app.kubernetes.io/version: "2.0"
    security.level: "enterprise"
spec:
  description: |
    Enterprise-grade CI/CD pipeline for NataCarePM with security scanning,
    compliance validation, performance testing, and multi-environment deployment
  params:
  - name: git-url
    type: string
    description: Git repository URL
  - name: git-revision
    type: string
    description: Git revision to build
    default: main
  - name: image-registry
    type: string
    description: Container registry URL
    default: "registry.natacare.com"
  - name: deployment-environment
    type: string
    description: Target deployment environment
    default: "staging"
  - name: security-scan-enabled
    type: string
    description: Enable security scanning
    default: "true"
  - name: performance-test-enabled
    type: string
    description: Enable performance testing
    default: "true"
  - name: compliance-check-enabled
    type: string
    description: Enable compliance validation
    default: "true"

  workspaces:
  - name: shared-data
    description: Shared workspace for pipeline steps
  - name: docker-config
    description: Docker configuration for registry access
  - name: security-configs
    description: Security scanning configurations
  - name: compliance-configs
    description: Compliance validation configurations

  tasks:
  # 1. Source Code Analysis & Security
  - name: source-checkout
    taskRef:
      name: git-clone
      kind: ClusterTask
    workspaces:
    - name: output
      workspace: shared-data
    params:
    - name: url
      value: $(params.git-url)
    - name: revision
      value: $(params.git-revision)
    - name: depth
      value: "1"
    - name: sslVerify
      value: "true"

  - name: source-security-scan
    taskRef:
      name: security-source-scan
    runAfter: ["source-checkout"]
    when:
    - input: "$(params.security-scan-enabled)"
      operator: in
      values: ["true"]
    workspaces:
    - name: source
      workspace: shared-data
    - name: security-config
      workspace: security-configs
    params:
    - name: scan-type
      value: "comprehensive"
    - name: severity-threshold
      value: "MEDIUM"

  - name: dependency-vulnerability-scan
    taskRef:
      name: dependency-check
    runAfter: ["source-checkout"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: scan-language
      value: "typescript,javascript"
    - name: exclude-paths
      value: "node_modules,dist,build"

  - name: license-compliance-check
    taskRef:
      name: license-scanner
    runAfter: ["source-checkout"]
    workspaces:
    - name: source
      workspace: shared-data
    - name: compliance-config
      workspace: compliance-configs

  # 2. Code Quality & Testing
  - name: code-quality-analysis
    taskRef:
      name: sonarqube-enterprise-scan
    runAfter: ["source-checkout"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: sonar-host-url
      value: "https://sonar.natacare.com"
    - name: sonar-project-key
      value: "natacare-pm-enterprise"
    - name: quality-gate-wait
      value: "true"
    - name: coverage-threshold
      value: "80"

  - name: unit-tests
    taskRef:
      name: npm-test
    runAfter: ["source-checkout"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: test-command
      value: "npm run test:unit:coverage"
    - name: coverage-report
      value: "true"

  - name: integration-tests
    taskRef:
      name: integration-test
    runAfter: ["unit-tests"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: test-environment
      value: "test-isolated"
    - name: database-setup
      value: "true"
    - name: external-services-mock
      value: "true"

  - name: e2e-tests
    taskRef:
      name: playwright-e2e-test
    runAfter: ["integration-tests"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: browser-matrix
      value: "chromium,firefox,webkit"
    - name: parallel-workers
      value: "4"
    - name: video-recording
      value: "on-failure"

  # 3. Container Build & Security
  - name: container-build
    taskRef:
      name: buildah-enterprise
    runAfter: ["code-quality-analysis", "e2e-tests"]
    workspaces:
    - name: source
      workspace: shared-data
    - name: dockerconfig
      workspace: docker-config
    params:
    - name: IMAGE
      value: "$(params.image-registry)/natacare-pm:$(params.git-revision)"
    - name: DOCKERFILE
      value: "./Dockerfile.enterprise"
    - name: CONTEXT
      value: "."
    - name: BUILD_ARGS
      value: |
        NODE_ENV=production
        BUILD_VERSION=$(params.git-revision)
        BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
        SECURITY_SCANNER=enabled

  - name: container-security-scan
    taskRef:
      name: trivy-enterprise-scan
    runAfter: ["container-build"]
    when:
    - input: "$(params.security-scan-enabled)"
      operator: in
      values: ["true"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: IMAGE
      value: "$(params.image-registry)/natacare-pm:$(params.git-revision)"
    - name: SEVERITY
      value: "HIGH,CRITICAL"
    - name: EXIT_CODE
      value: "1"
    - name: POLICY_FILE
      value: "./security/trivy-policy.yaml"

  - name: container-compliance-scan
    taskRef:
      name: conftest-policy-check
    runAfter: ["container-build"]
    when:
    - input: "$(params.compliance-check-enabled)"
      operator: in
      values: ["true"]
    workspaces:
    - name: source
      workspace: shared-data
    - name: compliance-config
      workspace: compliance-configs
    params:
    - name: IMAGE
      value: "$(params.image-registry)/natacare-pm:$(params.git-revision)"
    - name: POLICY_PATH
      value: "./compliance/opa-policies"

  # 4. Performance & Load Testing
  - name: performance-baseline-test
    taskRef:
      name: k6-performance-test
    runAfter: ["container-security-scan"]
    when:
    - input: "$(params.performance-test-enabled)"
      operator: in
      values: ["true"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: TEST_SCRIPT
      value: "./performance/baseline-test.js"
    - name: TARGET_ENV
      value: "$(params.deployment-environment)"
    - name: VIRTUAL_USERS
      value: "100"
    - name: DURATION
      value: "5m"
    - name: THRESHOLD_P95
      value: "2000ms"

  - name: load-test
    taskRef:
      name: artillery-load-test
    runAfter: ["performance-baseline-test"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: CONFIG_FILE
      value: "./performance/load-test-config.yml"
    - name: TARGET_ENVIRONMENT
      value: "$(params.deployment-environment)"
    - name: REPORT_FORMAT
      value: "json,html"

  # 5. Infrastructure as Code Validation
  - name: terraform-validate
    taskRef:
      name: terraform-enterprise-validate
    runAfter: ["source-checkout"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: TERRAFORM_VERSION
      value: "1.6.0"
    - name: WORKSPACE_PATH
      value: "./infrastructure"
    - name: VALIDATION_LEVEL
      value: "strict"

  - name: kubernetes-manifest-validation
    taskRef:
      name: kubeval-validate
    runAfter: ["terraform-validate"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: MANIFEST_PATH
      value: "./k8s"
    - name: KUBERNETES_VERSION
      value: "1.28.0"
    - name: STRICT_MODE
      value: "true"

  # 6. Deployment & Verification
  - name: deploy-to-environment
    taskRef:
      name: argocd-sync-deploy
    runAfter: ["load-test", "kubernetes-manifest-validation"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: APPLICATION_NAME
      value: "natacare-$(params.deployment-environment)"
    - name: ARGOCD_SERVER
      value: "argocd.natacare.com"
    - name: IMAGE_TAG
      value: "$(params.git-revision)"
    - name: SYNC_POLICY
      value: "automated"
    - name: PRUNE
      value: "true"

  - name: deployment-verification
    taskRef:
      name: deployment-health-check
    runAfter: ["deploy-to-environment"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: ENVIRONMENT
      value: "$(params.deployment-environment)"
    - name: HEALTH_ENDPOINTS
      value: "/health,/metrics,/ready"
    - name: TIMEOUT
      value: "300s"
    - name: RETRY_INTERVAL
      value: "10s"

  - name: smoke-tests
    taskRef:
      name: smoke-test-suite
    runAfter: ["deployment-verification"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: ENVIRONMENT
      value: "$(params.deployment-environment)"
    - name: TEST_SUITE
      value: "critical-path"
    - name: PARALLEL_EXECUTION
      value: "true"

  # 7. Security & Compliance Post-Deployment
  - name: runtime-security-scan
    taskRef:
      name: falco-runtime-scan
    runAfter: ["smoke-tests"]
    when:
    - input: "$(params.security-scan-enabled)"
      operator: in
      values: ["true"]
    params:
    - name: NAMESPACE
      value: "natacare-$(params.deployment-environment)"
    - name: SCAN_DURATION
      value: "300s"
    - name: POLICY_FILE
      value: "./security/falco-rules.yaml"

  - name: compliance-validation
    taskRef:
      name: opa-gatekeeper-validate
    runAfter: ["runtime-security-scan"]
    when:
    - input: "$(params.compliance-check-enabled)"
      operator: in
      values: ["true"]
    params:
    - name: NAMESPACE
      value: "natacare-$(params.deployment-environment)"
    - name: POLICY_BUNDLE
      value: "./compliance/gatekeeper-policies"

  # 8. Notification & Reporting
  - name: pipeline-notification
    taskRef:
      name: notification-service
    runAfter: ["compliance-validation"]
    workspaces:
    - name: source
      workspace: shared-data
    params:
    - name: NOTIFICATION_TYPE
      value: "pipeline-completion"
    - name: ENVIRONMENT
      value: "$(params.deployment-environment)"
    - name: STATUS
      value: "$(tasks.status)"
    - name: SLACK_CHANNEL
      value: "#natacare-deployments"
    - name: EMAIL_RECIPIENTS
      value: "devops@natacare.com,security@natacare.com"

  finally:
  - name: cleanup-workspace
    taskRef:
      name: workspace-cleanup
    workspaces:
    - name: shared-data
      workspace: shared-data
    params:
    - name: CLEANUP_LEVEL
      value: "aggressive"
    - name: PRESERVE_ARTIFACTS
      value: "true"
    - name: RETENTION_DAYS
      value: "30"

---
# Enterprise ArgoCD Application Configuration
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: natacare-production
  namespace: argocd
  labels:
    environment: production
    criticality: high
    security-level: enterprise
spec:
  project: natacare-enterprise
  source:
    repoURL: https://git.natacare.com/platform/natacare-pm-manifests
    targetRevision: HEAD
    path: environments/production
    helm:
      valueFiles:
      - values.yaml
      - values-production.yaml
      - secrets/production-secrets.yaml
      parameters:
      - name: image.tag
        value: "v2.1.0"
      - name: resources.requests.memory
        value: "2Gi"
      - name: resources.requests.cpu
        value: "1000m"
      - name: autoscaling.enabled
        value: "true"
      - name: autoscaling.minReplicas
        value: "3"
      - name: autoscaling.maxReplicas
        value: "50"
  destination:
    server: https://kubernetes.default.svc
    namespace: natacare-production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    - ApplyOutOfSyncOnly=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas
  - group: ""
    kind: Secret
    name: ssl-certificates
    jsonPointers:
    - /data
```

### 1.2 **Advanced Security Pipeline Tasks**

#### Comprehensive Security Scanning
```yaml
# .tekton/tasks/security-source-scan.yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: security-source-scan
  namespace: natacare-devops
  labels:
    app.kubernetes.io/name: security-scanner
    security.level: enterprise
spec:
  description: |
    Comprehensive security scanning for source code including SAST, secrets detection,
    vulnerability scanning, and policy validation
  params:
  - name: scan-type
    type: string
    description: Type of security scan to perform
    default: "comprehensive"
  - name: severity-threshold
    type: string
    description: Minimum severity level to report
    default: "MEDIUM"
  - name: exclude-paths
    type: string
    description: Paths to exclude from scanning
    default: "node_modules,dist,build,.git"

  workspaces:
  - name: source
    description: Source code workspace
  - name: security-config
    description: Security scanning configurations

  steps:
  # 1. SAST Scanning with SemGrep
  - name: sast-semgrep-scan
    image: returntocorp/semgrep:latest
    workingDir: $(workspaces.source.path)
    script: |
      #!/bin/bash
      set -e
      
      echo "🔍 Starting SAST scan with SemGrep..."
      
      # Configure SemGrep with enterprise rules
      semgrep --config=auto \
        --config=$(workspaces.security-config.path)/semgrep-rules \
        --json \
        --output=/tmp/semgrep-results.json \
        --exclude="$(params.exclude-paths)" \
        --severity=$(params.severity-threshold) \
        --timeout=300 \
        .
      
      # Process results
      python3 /scripts/process-semgrep-results.py \
        --input=/tmp/semgrep-results.json \
        --output=/tmp/sast-report.json \
        --threshold=$(params.severity-threshold)
      
      echo "✅ SAST scan completed"
    volumeMounts:
    - name: security-scripts
      mountPath: /scripts

  # 2. Secrets Detection with TruffleHog
  - name: secrets-detection
    image: trufflesecurity/trufflehog:latest
    workingDir: $(workspaces.source.path)
    script: |
      #!/bin/bash
      set -e
      
      echo "🔍 Starting secrets detection scan..."
      
      trufflehog filesystem . \
        --config=$(workspaces.security-config.path)/trufflehog-config.yaml \
        --json \
        --output=/tmp/secrets-results.json \
        --exclude-paths=$(workspaces.security-config.path)/secrets-exclude-patterns.txt \
        --max-depth=50 \
        --concurrency=4
      
      # Validate no high-severity secrets found
      python3 /scripts/validate-secrets-scan.py \
        --input=/tmp/secrets-results.json \
        --threshold=HIGH
      
      echo "✅ Secrets detection completed"

  # 3. Dependency Vulnerability Scanning
  - name: dependency-scan
    image: aquasec/trivy:latest
    workingDir: $(workspaces.source.path)
    script: |
      #!/bin/bash
      set -e
      
      echo "🔍 Starting dependency vulnerability scan..."
      
      # Scan package.json dependencies
      trivy fs . \
        --format json \
        --output /tmp/dependency-results.json \
        --severity HIGH,CRITICAL \
        --exit-code 0 \
        --cache-dir /tmp/trivy-cache \
        --timeout 10m
      
      # Generate compliance report
      python3 /scripts/generate-dependency-report.py \
        --input=/tmp/dependency-results.json \
        --output=/tmp/dependency-report.json \
        --format=compliance
      
      echo "✅ Dependency scan completed"

  # 4. Infrastructure as Code Security
  - name: iac-security-scan
    image: bridgecrew/checkov:latest
    workingDir: $(workspaces.source.path)
    script: |
      #!/bin/bash
      set -e
      
      echo "🔍 Starting Infrastructure as Code security scan..."
      
      checkov --directory . \
        --framework terraform,kubernetes,dockerfile \
        --output json \
        --output-file /tmp/iac-results.json \
        --config-file $(workspaces.security-config.path)/checkov-config.yaml \
        --skip-check CKV_K8S_15,CKV_K8S_16 \
        --compact \
        --quiet
      
      # Process IaC scan results
      python3 /scripts/process-iac-results.py \
        --input=/tmp/iac-results.json \
        --output=/tmp/iac-report.json \
        --severity=$(params.severity-threshold)
      
      echo "✅ IaC security scan completed"

  # 5. License Compliance Check
  - name: license-compliance
    image: fossa/fossa-cli:latest
    workingDir: $(workspaces.source.path)
    script: |
      #!/bin/bash
      set -e
      
      echo "🔍 Starting license compliance check..."
      
      # Initialize FOSSA project
      fossa init
      
      # Analyze dependencies for license compliance
      fossa analyze \
        --config $(workspaces.security-config.path)/fossa-config.yaml \
        --output /tmp/license-results.json
      
      # Check for license policy violations
      fossa test \
        --config $(workspaces.security-config.path)/fossa-config.yaml \
        --timeout 300
      
      echo "✅ License compliance check completed"

  # 6. Security Report Aggregation
  - name: aggregate-security-reports
    image: python:3.11-slim
    workingDir: $(workspaces.source.path)
    script: |
      #!/usr/bin/env python3
      import json
      import os
      from datetime import datetime
      
      print("📊 Aggregating security scan results...")
      
      # Load all scan results
      reports = {}
      report_files = [
          ('/tmp/sast-report.json', 'sast'),
          ('/tmp/secrets-results.json', 'secrets'),
          ('/tmp/dependency-report.json', 'dependencies'),
          ('/tmp/iac-report.json', 'infrastructure'),
          ('/tmp/license-results.json', 'licenses')
      ]
      
      for file_path, report_type in report_files:
          if os.path.exists(file_path):
              with open(file_path, 'r') as f:
                  reports[report_type] = json.load(f)
      
      # Create consolidated security report
      consolidated_report = {
          'scan_timestamp': datetime.utcnow().isoformat(),
          'scan_type': '$(params.scan-type)',
          'severity_threshold': '$(params.severity-threshold)',
          'reports': reports,
          'summary': {
              'total_issues': sum(len(report.get('findings', [])) for report in reports.values()),
              'critical_issues': 0,
              'high_issues': 0,
              'medium_issues': 0,
              'low_issues': 0
          }
      }
      
      # Count issues by severity
      for report in reports.values():
          for finding in report.get('findings', []):
              severity = finding.get('severity', 'UNKNOWN').upper()
              if severity == 'CRITICAL':
                  consolidated_report['summary']['critical_issues'] += 1
              elif severity == 'HIGH':
                  consolidated_report['summary']['high_issues'] += 1
              elif severity == 'MEDIUM':
                  consolidated_report['summary']['medium_issues'] += 1
              elif severity == 'LOW':
                  consolidated_report['summary']['low_issues'] += 1
      
      # Save consolidated report
      with open('/tmp/security-consolidated-report.json', 'w') as f:
          json.dump(consolidated_report, f, indent=2)
      
      # Determine pipeline status based on findings
      critical_threshold = 0
      high_threshold = 5
      
      if consolidated_report['summary']['critical_issues'] > critical_threshold:
          print(f"❌ PIPELINE BLOCKED: {consolidated_report['summary']['critical_issues']} critical security issues found")
          exit(1)
      elif consolidated_report['summary']['high_issues'] > high_threshold:
          print(f"⚠️  WARNING: {consolidated_report['summary']['high_issues']} high severity security issues found")
          # Continue but notify security team
      
      print("✅ Security scan aggregation completed")
      print(f"Summary: {consolidated_report['summary']}")

  # 7. Security Notification
  - name: security-notification
    image: curlimages/curl:latest
    script: |
      #!/bin/sh
      set -e
      
      echo "📬 Sending security scan notification..."
      
      # Send security report to monitoring system
      curl -X POST "https://monitoring.natacare.com/api/security-reports" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $MONITORING_API_TOKEN" \
        -d @/tmp/security-consolidated-report.json
      
      # Send Slack notification if critical issues found
      if [ -f "/tmp/critical-issues-detected" ]; then
        curl -X POST "https://hooks.slack.com/services/$SLACK_WEBHOOK_PATH" \
          -H "Content-Type: application/json" \
          -d '{
            "text": "🚨 CRITICAL SECURITY ISSUES DETECTED",
            "attachments": [{
              "color": "danger",
              "title": "Security Scan Results",
              "text": "Critical security vulnerabilities found in NataCarePM pipeline. Deployment blocked.",
              "fields": [{
                "title": "Pipeline",
                "value": "$(context.pipelineRun.name)",
                "short": true
              }, {
                "title": "Git Revision",
                "value": "$(params.git-revision)",
                "short": true
              }]
            }]
          }'
      fi
      
      echo "✅ Security notification sent"
    env:
    - name: MONITORING_API_TOKEN
      valueFrom:
        secretKeyRef:
          name: monitoring-credentials
          key: api-token
    - name: SLACK_WEBHOOK_PATH
      valueFrom:
        secretKeyRef:
          name: slack-credentials
          key: webhook-path

  volumes:
  - name: security-scripts
    configMap:
      name: security-scanning-scripts
      defaultMode: 0755

  results:
  - name: security-status
    description: Overall security scan status
  - name: critical-issues-count
    description: Number of critical security issues found
  - name: report-location
    description: Location of the consolidated security report
```

---

## 🔍 **2. Comprehensive Observability Stack**

### 2.1 **Prometheus & Grafana Enterprise**

#### Advanced Monitoring Configuration
```yaml
# monitoring/prometheus/prometheus-enterprise.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-enterprise-config
  namespace: natacare-monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      scrape_timeout: 10s
      evaluation_interval: 15s
      external_labels:
        cluster: 'natacare-production'
        environment: 'enterprise'
        region: 'us-east-1'
    
    rule_files:
    - "/etc/prometheus/rules/*.yml"
    
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          - alertmanager-cluster.natacare-monitoring.svc.cluster.local:9093
        scheme: https
        tls_config:
          ca_file: /etc/ssl/ca/ca.crt
          cert_file: /etc/ssl/certs/prometheus.crt
          key_file: /etc/ssl/private/prometheus.key
    
    scrape_configs:
    # Kubernetes API Server
    - job_name: 'kubernetes-apiservers'
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - default
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        insecure_skip_verify: false
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
      metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'apiserver_request_duration_seconds_.*'
        action: keep
    
    # Kubernetes Nodes
    - job_name: 'kubernetes-nodes'
      kubernetes_sd_configs:
      - role: node
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        insecure_skip_verify: false
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/$(1)/proxy/metrics
    
    # Kubernetes Pods
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name
      metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'go_.*'
        action: drop
    
    # NataCarePM Application Services
    - job_name: 'natacare-auth-service'
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - natacare-production
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_label_app]
        action: keep
        regex: auth-service
      - source_labels: [__meta_kubernetes_endpoint_port_name]
        action: keep
        regex: metrics
      metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'http_requests_total|http_request_duration_seconds|auth_tokens_issued_total|auth_failures_total'
        action: keep
    
    - job_name: 'natacare-project-service'
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - natacare-production
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_label_app]
        action: keep
        regex: project-service
      - source_labels: [__meta_kubernetes_endpoint_port_name]
        action: keep
        regex: metrics
      metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'project_.*|task_.*|milestone_.*|resource_.*'
        action: keep
    
    # Database Monitoring
    - job_name: 'postgresql-exporter'
      static_configs:
      - targets:
        - postgresql-exporter.natacare-production.svc.cluster.local:9187
      relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: postgresql-exporter.natacare-production.svc.cluster.local:9187
    
    # Redis Monitoring
    - job_name: 'redis-exporter'
      static_configs:
      - targets:
        - redis-exporter.natacare-production.svc.cluster.local:9121
    
    # Kong API Gateway
    - job_name: 'kong-enterprise'
      static_configs:
      - targets:
        - kong-enterprise.natacare-enterprise.svc.cluster.local:8001
      metrics_path: /metrics
      scheme: https
      tls_config:
        ca_file: /etc/ssl/ca/ca.crt
        cert_file: /etc/ssl/certs/prometheus.crt
        key_file: /etc/ssl/private/prometheus.key
    
    # External Service Monitoring
    - job_name: 'blackbox-probes'
      metrics_path: /probe
      params:
        module: [http_2xx]
      static_configs:
      - targets:
        - https://app.natacare.com
        - https://api.natacare.com/health
        - https://admin.natacare.com
      relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter.natacare-monitoring.svc.cluster.local:9115
    
    # Business Metrics
    - job_name: 'business-metrics'
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - natacare-production
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape_business]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'natacare_projects_.*|natacare_tasks_.*|natacare_users_.*|natacare_revenue_.*'
        action: keep

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: natacare-monitoring
data:
  alerts.yml: |
    groups:
    - name: natacare.application.alerts
      rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: |
          (
            rate(http_requests_total{status=~"5.."}[5m]) /
            rate(http_requests_total[5m])
          ) * 100 > 5
        for: 2m
        labels:
          severity: critical
          team: platform
          service: "{{ $labels.service }}"
        annotations:
          summary: "High error rate detected for {{ $labels.service }}"
          description: "Error rate is {{ $value }}% for service {{ $labels.service }} in namespace {{ $labels.namespace }}"
          runbook_url: "https://runbooks.natacare.com/high-error-rate"
          dashboard_url: "https://grafana.natacare.com/d/application-overview"
      
      # High Response Time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
          team: platform
          service: "{{ $labels.service }}"
        annotations:
          summary: "High response time for {{ $labels.service }}"
          description: "95th percentile response time is {{ $value }}s for {{ $labels.service }}"
      
      # Database Connection Issues
      - alert: DatabaseConnectionHigh
        expr: |
          postgresql_active_connections / postgresql_max_connections * 100 > 80
        for: 3m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High database connection usage"
          description: "Database connection usage is {{ $value }}%"
      
      # Memory Usage High
      - alert: HighMemoryUsage
        expr: |
          (
            container_memory_usage_bytes{container!="", container!="POD"} /
            container_spec_memory_limit_bytes
          ) * 100 > 90
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High memory usage for {{ $labels.container }}"
          description: "Memory usage is {{ $value }}% for container {{ $labels.container }} in pod {{ $labels.pod }}"
      
      # CPU Usage High
      - alert: HighCPUUsage
        expr: |
          rate(container_cpu_usage_seconds_total{container!="", container!="POD"}[5m]) * 100 > 80
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High CPU usage for {{ $labels.container }}"
          description: "CPU usage is {{ $value }}% for container {{ $labels.container }}"
      
      # Business Metrics Alerts
      - alert: ProjectCreationRateDropped
        expr: |
          rate(natacare_projects_created_total[1h]) < 0.1
        for: 30m
        labels:
          severity: warning
          team: business
        annotations:
          summary: "Project creation rate has dropped significantly"
          description: "Only {{ $value }} projects created per hour in the last hour"
      
      # Security Alerts
      - alert: AuthenticationFailureSpike
        expr: |
          rate(auth_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
          team: security
        annotations:
          summary: "High authentication failure rate detected"
          description: "{{ $value }} authentication failures per second"
      
      # Infrastructure Alerts
      - alert: KubernetesNodeNotReady
        expr: |
          kube_node_status_condition{condition="Ready",status="true"} == 0
        for: 5m
        labels:
          severity: critical
          team: infrastructure
        annotations:
          summary: "Kubernetes node {{ $labels.node }} is not ready"
          description: "Node {{ $labels.node }} has been not ready for more than 5 minutes"
      
      - alert: KubernetesPodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Pod {{ $labels.pod }} is crash looping"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is restarting frequently"

---
# Grafana Enterprise Dashboard Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards-config
  namespace: natacare-monitoring
data:
  natacare-overview.json: |
    {
      "dashboard": {
        "id": null,
        "title": "NataCarePM Enterprise Overview",
        "tags": ["natacare", "overview", "enterprise"],
        "timezone": "browser",
        "panels": [
          {
            "id": 1,
            "title": "System Health",
            "type": "stat",
            "targets": [
              {
                "expr": "up{job=~\"natacare-.*\"}",
                "legendFormat": "{{ job }}"
              }
            ],
            "fieldConfig": {
              "defaults": {
                "color": {
                  "mode": "thresholds"
                },
                "thresholds": {
                  "steps": [
                    {"color": "red", "value": 0},
                    {"color": "green", "value": 1}
                  ]
                }
              }
            },
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
          },
          {
            "id": 2,
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total[5m])) by (service)",
                "legendFormat": "{{ service }}"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
          },
          {
            "id": 3,
            "title": "Response Time P95",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
                "legendFormat": "{{ service }}"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
          },
          {
            "id": 4,
            "title": "Error Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100",
                "legendFormat": "{{ service }}"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
          },
          {
            "id": 5,
            "title": "Business Metrics",
            "type": "table",
            "targets": [
              {
                "expr": "increase(natacare_projects_created_total[1h])",
                "legendFormat": "Projects Created (1h)"
              },
              {
                "expr": "increase(natacare_tasks_completed_total[1h])",
                "legendFormat": "Tasks Completed (1h)"
              },
              {
                "expr": "natacare_active_users",
                "legendFormat": "Active Users"
              }
            ],
            "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16}
          }
        ],
        "time": {
          "from": "now-1h",
          "to": "now"
        },
        "refresh": "30s"
      }
    }
```

### 2.2 **Distributed Tracing dengan Jaeger**

#### Enterprise Jaeger Configuration
```yaml
# monitoring/jaeger/jaeger-enterprise.yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: natacare-jaeger-enterprise
  namespace: natacare-monitoring
spec:
  strategy: production
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      redundancyPolicy: MultipleRedundancy
      storage:
        storageClassName: fast-ssd
        size: 100Gi
      resources:
        requests:
          memory: "2Gi"
          cpu: "1"
        limits:
          memory: "4Gi"
          cpu: "2"
      esIndexCleaner:
        enabled: true
        numberOfDays: 30
        schedule: "55 23 * * *"
  collector:
    replicas: 3
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1"
    config: |
      receivers:
        otlp:
          protocols:
            grpc:
              endpoint: 0.0.0.0:14250
            http:
              endpoint: 0.0.0.0:14268
        jaeger:
          protocols:
            grpc:
              endpoint: 0.0.0.0:14250
            thrift_http:
              endpoint: 0.0.0.0:14268
            thrift_compact:
              endpoint: 0.0.0.0:6831
            thrift_binary:
              endpoint: 0.0.0.0:6832
      processors:
        batch:
          timeout: 1s
          send_batch_size: 1024
          send_batch_max_size: 2048
        memory_limiter:
          limit_mib: 1024
        resource:
          attributes:
          - key: service.namespace
            value: "natacare-production"
          - key: deployment.environment
            value: "production"
      exporters:
        jaeger:
          endpoint: jaeger-collector.natacare-monitoring.svc.cluster.local:14250
          tls:
            insecure: false
            ca_file: /etc/ssl/ca/ca.crt
            cert_file: /etc/ssl/certs/jaeger.crt
            key_file: /etc/ssl/private/jaeger.key
      service:
        pipelines:
          traces:
            receivers: [otlp, jaeger]
            processors: [memory_limiter, resource, batch]
            exporters: [jaeger]
  query:
    replicas: 2
    resources:
      requests:
        memory: "512Mi"
        cpu: "250m"
      limits:
        memory: "1Gi"
        cpu: "500m"
  agent:
    strategy: DaemonSet
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"
  ui:
    options:
      dependencies:
        menuEnabled: true
      tracking:
        gaID: "UA-XXXXXXXX-X"
      menu:
      - label: "Documentation"
        url: "https://docs.natacare.com/tracing"
      - label: "Support"
        url: "https://support.natacare.com"

---
# OpenTelemetry Collector Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: natacare-monitoring
data:
  otel-collector-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      prometheus:
        config:
          scrape_configs:
          - job_name: 'otel-collector'
            scrape_interval: 30s
            static_configs:
            - targets: ['0.0.0.0:8888']
    
    processors:
      batch:
        timeout: 1s
        send_batch_size: 1024
      memory_limiter:
        limit_mib: 2048
      resource:
        attributes:
        - key: environment
          value: "production"
        - key: cluster
          value: "natacare-production"
      probabilistic_sampler:
        sampling_percentage: 10
      span:
        name:
          from_attributes: ["http.method", "http.route"]
        include:
          match_type: strict
          span_names: ["GET /api/projects", "POST /api/projects"]
        exclude:
          match_type: regexp
          span_names: ["GET /health.*", "GET /metrics.*"]
    
    exporters:
      jaeger:
        endpoint: jaeger-collector.natacare-monitoring.svc.cluster.local:14250
        tls:
          insecure: false
          ca_file: /etc/ssl/ca/ca.crt
          cert_file: /etc/ssl/certs/otel-collector.crt
          key_file: /etc/ssl/private/otel-collector.key
      prometheus:
        endpoint: "0.0.0.0:8889"
        namespace: "natacare"
        const_labels:
          environment: "production"
      logging:
        loglevel: info
    
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, resource, probabilistic_sampler, span, batch]
          exporters: [jaeger, logging]
        metrics:
          receivers: [otlp, prometheus]
          processors: [memory_limiter, resource, batch]
          exporters: [prometheus, logging]
      extensions: [health_check, pprof]
      telemetry:
        logs:
          level: "info"
        metrics:
          address: 0.0.0.0:8888
```

Implementasi enterprise DevOps & monitoring ini memberikan:

✅ **Advanced CI/CD Pipeline** dengan security scanning komprehensif  
✅ **GitOps Deployment** dengan ArgoCD enterprise  
✅ **Comprehensive Security** scanning di setiap tahap  
✅ **Distributed Tracing** dengan Jaeger & OpenTelemetry  
✅ **Enterprise Monitoring** dengan Prometheus & Grafana  
✅ **Automated Compliance** validation  
✅ **Performance Testing** terintegrasi  
✅ **Multi-environment** deployment strategy

Ini adalah implementasi **DevOps & Monitoring level enterprise terbaik** yang mendukung observability penuh untuk infrastruktur production-ready!