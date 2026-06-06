// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruitmentApi } from "../../api/hrm-api";
import { Card, CardBody, CardHeader, KpiCard } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, CheckCircle, FileText, Users, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/ui/toast";
import { RecruitmentAnalytics, JobPosting } from "../../api/types";
import { getErrorMessage } from "../../api/http";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function RecruitmentAnalyticsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({ 
    queryKey: ["analytics"], 
    queryFn: recruitmentApi.getAnalytics 
  });
  const analytics: RecruitmentAnalytics[] = analyticsRes?.data || [];

  const { data: jobs } = useQuery({ queryKey: ["jobs"], queryFn: recruitmentApi.listJobs });

  const generateMutation = useMutation({
    mutationFn: recruitmentApi.generateAnalytics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      notify("Analytics synced successfully", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const handleSyncAll = async () => {
    if (!jobs?.length) return;
    try {
      // Sync open jobs in parallel
      const openJobs = jobs.filter(j => j.status === "Open" || j.status === "Draft");
      await Promise.all(openJobs.map(j => generateMutation.mutateAsync(j._id)));
    } catch (e) {
      // errors handled in mutation
    }
  };

  // Aggregated stats
  const totalApplicants = analytics.reduce((acc, a) => acc + (a.totalApplicants || 0), 0);
  const totalOffers = analytics.reduce((acc, a) => acc + (a.totalOffers || 0), 0);
  const totalHires = analytics.reduce((acc, a) => acc + (a.totalHires || 0), 0);

  // Source breakdown aggregation
  const sourceMap: Record<string, number> = {
    LinkedIn: 0,
    Indeed: 0,
    Referral: 0,
    WalkIn: 0,
    Other: 0
  };

  analytics.forEach(a => {
    if (a.sourceBreakdown) {
      sourceMap.LinkedIn += a.sourceBreakdown.linkedIn || 0;
      sourceMap.Indeed += a.sourceBreakdown.indeed || 0;
      sourceMap.Referral += a.sourceBreakdown.referral || 0;
      sourceMap.WalkIn += a.sourceBreakdown.walkIn || 0;
      sourceMap.Other += a.sourceBreakdown.other || 0;
    }
  });

  const sourceData = Object.entries(sourceMap)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  const stageData = [
    { name: 'Applied', count: totalApplicants },
    { name: 'Interviewed', count: analytics.reduce((acc, a) => acc + (a.totalInterviews || 0), 0) },
    { name: 'Offered', count: totalOffers },
    { name: 'Hired', count: totalHires },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Recruitment Analytics</h1>
          <p>Gain insights into your hiring pipeline and conversion metrics.</p>
        </div>
        <div className="toolbar">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={handleSyncAll} loading={generateMutation.isPending}>
            Sync Analytics
          </Button>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<Briefcase size={20} />} iconColor="purple" label="Active Jobs" value={jobs?.filter(j => j.status === 'Open').length || 0} />
        <KpiCard icon={<Users size={20} />} iconColor="blue" label="Total Pipeline" value={totalApplicants} />
        <KpiCard icon={<FileText size={20} />} iconColor="amber" label="Total Offers" value={totalOffers} />
        <KpiCard icon={<CheckCircle size={20} />} iconColor="green" label="Hires" value={totalHires} />
      </section>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <Card>
          <CardHeader><h3>Global Candidate Pipeline</h3></CardHeader>
          <CardBody style={{ height: '320px', padding: '0 24px 24px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--surface-100)' }}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--surface)' }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3>Overall Source of Hire</h3></CardHeader>
          <CardBody style={{ height: '320px', padding: '0 24px 24px' }}>
            {sourceData.length === 0 ? (
              <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>
                <p>No source data available. Sync analytics to generate.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--surface)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
      
      <Card>
        <CardHeader><h3>Job Performance Reports</h3></CardHeader>
        <DataTable 
          columns={["Job Posting", "Total Applicants", "Interviews", "Offer Conv. Rate", "Hire Conv. Rate"]} 
          empty={!analytics?.length}
          loading={analyticsLoading}
        >
          {analytics?.map((report) => {
            const job = typeof report.jobPosting === 'object' ? report.jobPosting : null;
            return (
              <tr key={report._id}>
                <td>
                  <strong>{job?.title || "Unknown Job"}</strong>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{job?.location || ''}</div>
                </td>
                <td>{report.totalApplicants}</td>
                <td>{report.totalInterviews}</td>
                <td style={{ color: "var(--text-muted)" }}>
                  {report.offerConversionRate ? `${report.offerConversionRate.toFixed(1)}%` : '-'}
                </td>
                <td style={{ color: "var(--success)" }}>
                  {report.hireConversionRate ? `${report.hireConversionRate.toFixed(1)}%` : '-'}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
    </>
  );
}
