import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, FileText, Download, ChevronRight, XCircle } from 'lucide-react';
import { complianceChecks, kpiData } from '../data/mockData';

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
        <div className="card card-sm" style={{borderTop:'2px solid var(--blue)'}}>
          <div className="label mb-2">Compliance Score</div>
          <div style={{fontSize:28,fontWeight:800,color:score>=80?'#22C55E':score>=60?'#F59E0B':'#EF4444'}}>{score}%</div>
        </div>
        <div className="card card-sm" style={{borderTop:'2px solid #22C55E'}}>
          <div className="label mb-2">Checks Passed</div>
          <div style={{fontSize:28,fontWeight:800,color:'#22C55E'}}>{passed}</div>
        </div>
        <div className="card card-sm" style={{borderTop:'2px solid #F59E0B'}}>
          <div className="label mb-2">Warnings</div>
          <div style={{fontSize:28,fontWeight:800,color:'#F59E0B'}}>{warning}</div>
        </div>
        <div className="card card-sm" style={{borderTop:'2px solid #EF4444'}}>
          <div className="label mb-2">Violations</div>
          <div style={{fontSize:28,fontWeight:800,color:'#EF4444'}}>{failed}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Automated Safety Checklist</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {complianceChecks.map(check => (
            <div key={check.id} style={{
              display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
              background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)'
            }}>
              {check.status === 'pass' ? <CheckCircle size={18} color="#22C55E"/> :
               check.status === 'fail' ? <XCircle size={18} color="#EF4444"/> :
               <AlertTriangle size={18} color="#F59E0B"/>}
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{check.rule}</div>
                <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>{check.evidence}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <span className={`badge badge-${check.status==='pass'?'success':check.status==='fail'?'critical':'warning'}`}>
                  {check.status.toUpperCase()}
                </span>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>{check.zone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCenter;
