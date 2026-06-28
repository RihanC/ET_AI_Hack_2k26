import React from 'react';
import { reportTypes } from '../data/mockData';
import { Download, FileText, ChevronRight } from 'lucide-react';

const ReportsAnalytics: React.FC = () => {
  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Enterprise reporting · Data export</p>
        </div>
      </div>

      <div className="grid grid-3">
        {reportTypes.map(report => (
          <div key={report.id} className="card card-sm" style={{cursor:'pointer'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${report.color}15`,color:report.color,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FileText size={16}/>
              </div>
              <span className="badge badge-muted text-xs">{report.frequency}</span>
            </div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{report.name}</div>
            <p style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.4,marginBottom:16,height:32}}>{report.description}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:12,borderTop:'1px solid var(--border-color)'}}>
              <span style={{fontSize:10,color:'var(--text-muted)'}}>Last: {report.lastGenerated}</span>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--text-primary)'}}><Download size={12}/> Export</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
