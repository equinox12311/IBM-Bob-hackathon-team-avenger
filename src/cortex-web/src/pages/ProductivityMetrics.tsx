import { useEffect, useState } from 'react';
import { getProductivityMetrics } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface ProductivityMetrics {
  time_saved_minutes: number;
  entries_recalled_count: number;
  proactive_recalls_triggered: number;
  agentic_captures_accepted: number;
  avg_search_time_seconds: number;
  knowledge_retention_rate: number;
  roi_usd: number;
  productivity_gain_percent: number;
}

interface TimeComparison {
  task: string;
  without_cortex_minutes: number;
  with_cortex_seconds: number;
  time_saved_percent: number;
}

interface MetricsData {
  metrics: ProductivityMetrics;
  comparisons: TimeComparison[];
  monthly_roi: {
    monthly_time_saved_hours: number;
    monthly_roi_usd: number;
    annual_roi_usd: number;
  };
  period_days: number;
}

export default function ProductivityMetrics() {
  const { token } = useAuth();
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    getProductivityMetrics(token, days)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to load metrics:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, days]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '80vh',
        fontFamily: 'IBM Plex Sans, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>📊</div>
          <div style={{ fontSize: '18px', color: '#525252' }}>Loading productivity metrics...</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, comparisons, monthly_roi } = data;

  return (
    <div style={{ 
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'IBM Plex Sans, sans-serif',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '600', 
          color: '#161616',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '40px' }}>📊</span>
          Productivity Metrics Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: '#525252', marginBottom: '24px' }}>
          Quantifiable ROI and time savings powered by Cortex
        </p>

        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '8px 16px',
                border: days === d ? '2px solid #0f62fe' : '1px solid #e0e0e0',
                background: days === d ? '#0f62fe' : 'white',
                color: days === d ? 'white' : '#161616',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Time Saved Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
          transition: 'transform 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>⏱️ Time Saved</div>
          <div style={{ fontSize: '42px', fontWeight: '700', marginBottom: '4px' }}>
            {Math.floor(metrics.time_saved_minutes / 60)}h {metrics.time_saved_minutes % 60}m
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            This {days}-day period
          </div>
        </div>

        {/* ROI Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(245, 87, 108, 0.3)',
          transition: 'transform 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>💰 ROI</div>
          <div style={{ fontSize: '42px', fontWeight: '700', marginBottom: '4px' }}>
            ${metrics.roi_usd.toFixed(0)}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            ${monthly_roi.monthly_roi_usd.toFixed(0)}/month projected
          </div>
        </div>

        {/* Productivity Gain Card */}
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
          transition: 'transform 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>📈 Productivity Gain</div>
          <div style={{ fontSize: '42px', fontWeight: '700', marginBottom: '4px' }}>
            {metrics.productivity_gain_percent.toFixed(1)}%
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            Of total work time saved
          </div>
        </div>

        {/* Knowledge Retention Card */}
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '12px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(67, 233, 123, 0.3)',
          transition: 'transform 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>🧠 Knowledge Retention</div>
          <div style={{ fontSize: '42px', fontWeight: '700', marginBottom: '4px' }}>
            {metrics.knowledge_retention_rate.toFixed(0)}%
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            Entries recalled vs created
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#161616' }}>
          Activity Breakdown
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f62fe', marginBottom: '4px' }}>
              {metrics.proactive_recalls_triggered}
            </div>
            <div style={{ fontSize: '14px', color: '#525252' }}>Proactive Recalls</div>
            <div style={{ fontSize: '12px', color: '#8d8d8d', marginTop: '4px' }}>
              Auto-surfaced learnings
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🤖</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f62fe', marginBottom: '4px' }}>
              {metrics.agentic_captures_accepted}
            </div>
            <div style={{ fontSize: '14px', color: '#525252' }}>Agentic Captures</div>
            <div style={{ fontSize: '12px', color: '#8d8d8d', marginTop: '4px' }}>
              One-click saves
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f62fe', marginBottom: '4px' }}>
              {metrics.entries_recalled_count}
            </div>
            <div style={{ fontSize: '14px', color: '#525252' }}>Entries Recalled</div>
            <div style={{ fontSize: '12px', color: '#8d8d8d', marginTop: '4px' }}>
              Semantic searches
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f62fe', marginBottom: '4px' }}>
              {metrics.avg_search_time_seconds.toFixed(1)}s
            </div>
            <div style={{ fontSize: '14px', color: '#525252' }}>Avg Search Time</div>
            <div style={{ fontSize: '12px', color: '#8d8d8d', marginTop: '4px' }}>
              vs 15 min manual
            </div>
          </div>
        </div>
      </div>

      {/* Before/After Comparison */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#161616' }}>
          ⚖️ Before/After Comparison
        </h2>
        <p style={{ fontSize: '14px', color: '#525252', marginBottom: '24px' }}>
          Time savings for common developer tasks
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#161616' }}>Task</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#161616' }}>Without Cortex</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#161616' }}>With Cortex</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#161616' }}>Time Saved</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comp, idx) => (
                <tr key={idx} style={{ 
                  borderBottom: '1px solid #f4f4f4',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f4f4f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px', fontSize: '14px', color: '#161616' }}>{comp.task}</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#da1e28' }}>
                    {comp.without_cortex_minutes} min
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#24a148' }}>
                    {comp.with_cortex_seconds} sec
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {comp.time_saved_percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Projection */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '32px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>
          💎 Monthly ROI Projection
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Time Saved/Month</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>
              {monthly_roi.monthly_time_saved_hours.toFixed(1)} hours
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Monthly ROI</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>
              ${monthly_roi.monthly_roi_usd.toFixed(0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Annual ROI</div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>
              ${monthly_roi.annual_roi_usd.toFixed(0)}
            </div>
          </div>
        </div>
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <strong>💡 Impact:</strong> At $75/hour developer rate, Cortex saves your team{' '}
          <strong>${monthly_roi.monthly_roi_usd.toFixed(0)}</strong> per developer per month.{' '}
          For a team of 10 developers, that's <strong>${(monthly_roi.annual_roi_usd * 10).toLocaleString()}</strong> annually!
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Made with Bob
