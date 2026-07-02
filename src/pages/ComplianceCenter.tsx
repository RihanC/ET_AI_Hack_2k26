import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, FileText, Download, ChevronRight, XCircle } from 'lucide-react';
import { complianceChecks, kpiData } from '../data/mockData';
import './ComplianceCenter.css';

const ComplianceCenter: React.FC = () => {
  const score = kpiData.complianceScore;
  const passed = complianceChecks.filter(c => c.status === 'pass').length;
  const failed = complianceChecks.filter(c => c.status === 'fail').length;
  const warning = complianceChecks.filter(c => c.status === 'warning').length;

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Center</h1>
          <p className="page-subtitle">Regulatory verification · Automated audits</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm"><Download size={13}/> Export Audit</button>
        </div>
      </div>

      <div className="grid grid-4 mb-4">
        <div className="card card-sm compliance-stat-card compliance-blue">
          <div className="label mb-2">Compliance Score</div>
          <div 
            className="compliance-metric-value" 
            style={{ color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--critical)' }}
          >
            {score}%
          </div>
        </div>
        <div className="card card-sm compliance-stat-card compliance-success">
          <div className="label mb-2">Checks Passed</div>
          <div className="compliance-metric-value" style={{ color: 'var(--success)' }}>{passed}</div>
        </div>
        <div className="card card-sm compliance-stat-card compliance-warning">
          <div className="label mb-2">Warnings</div>
          <div className="compliance-metric-value" style={{ color: 'var(--warning)' }}>{warning}</div>
        </div>
        <div className="card card-sm compliance-stat-card compliance-critical">
          <div className="label mb-2">Violations</div>
          <div className="compliance-metric-value" style={{ color: 'var(--critical)' }}>{failed}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Automated Safety Checklist</div>
        </div>
        <div className="compliance-checklist-container">
          {complianceChecks.map(check => (
            <div key={check.id} className="compliance-checklist-item">
              {check.status === 'pass' ? <CheckCircle size={18} color="var(--success)"/> :
               check.status === 'fail' ? <XCircle size={18} color="var(--critical)"/> :
               <AlertTriangle size={18} color="var(--warning)"/>}
              <div className="compliance-check-info">
                <div className="compliance-check-rule">{check.rule}</div>
                <div className="compliance-check-evidence">{check.evidence}</div>
              </div>
              <div className="compliance-check-right">
                <span className={`badge badge-${check.status==='pass'?'success':check.status==='fail'?'critical':'warning'}`}>
                  {check.status.toUpperCase()}
                </span>
                <div className="compliance-check-zone">{check.zone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCenter;

