import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CoordinatorDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({
    studentIds: [],
    subject: '',
    message: '',
    type: 'placement_update',
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, appsRes, interviewsRes, cyclesRes] = await Promise.all([
          api.get('/coordinator/dashboard/stats'),
          api.get('/coordinator/applications/funnel?limit=10&page=1'),
          api.get('/coordinator/interviews/scheduled?limit=10&page=1'),
          api.get('/coordinator/cycles'),
        ]);

        setStats(statsRes.data?.data?.stats || null);
        setApplications(appsRes.data?.data?.applications || []);
        setInterviews(interviewsRes.data?.data?.interviews || []);
        setCycles(cyclesRes.data?.data?.cycles || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle bulk messaging
  const handleSendMessage = async () => {
    if (!messageForm.studentIds.length || !messageForm.subject || !messageForm.message) {
      alert('Please fill all fields');
      return;
    }

    try {
      await api.post('/coordinator/messages/bulk', {
        studentIds: messageForm.studentIds,
        subject: messageForm.subject,
        message: messageForm.message,
        type: messageForm.type,
      });

      alert('Message sent successfully');
      setShowMessageModal(false);
      setMessageForm({
        studentIds: [],
        subject: '',
        message: '',
        type: 'placement_update',
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--color-text-muted)]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-[var(--color-text-primary)] mb-2">
            Placement Coordinator Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Manage applications, interviews, and placements
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[var(--color-border)]">
          {['overview', 'applications', 'interviews', 'cycles', 'messaging'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === tab
                  ? 'border-cyan-500 text-primary-600'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Sections */}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
              <div className="card p-6">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Total Applications</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.totalApplications}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Offers Extended</p>
                <p className="text-3xl font-bold text-primary-600">{stats.totalOffers}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Rejections</p>
                <p className="text-3xl font-bold text-primary-600">{stats.totalRejections}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Conversion Rate</p>
                <p className="text-3xl font-bold text-primary-600">{stats.conversionRate}%</p>
              </div>
            </div>

            {/* Application Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
              {/* Funnel by Stage */}
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-4">Application Funnel</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Applied', key: 'applied' },
                    { label: 'Shortlisted', key: 'shortlisted' },
                    { label: 'Test Round', key: 'test' },
                    { label: 'Interview R1', key: 'interview_r1' },
                    { label: 'Interview R2', key: 'interview_r2' },
                    { label: 'Interview R3', key: 'interview_r3' },
                    { label: 'Offer', key: 'offer' },
                  ].map((stage) => (
                    <div key={stage.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">{stage.label}</span>
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {stats.applicationsByStage[stage.key] || 0}
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                          style={{
                            width: `${
                              stats.totalApplications > 0
                                ? ((stats.applicationsByStage[stage.key] || 0) / stats.totalApplications) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Companies */}
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-4">Top Companies</h2>
                <div className="space-y-3">
                  {stats.topCompanies.slice(0, 7).map((company, idx) => (
                    <div key={company.companyId} className="flex items-center justify-between">
                      <span className="text-[var(--color-text-secondary)]">{company.company}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 bg-[var(--color-border)] rounded-full w-24 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-500"
                            style={{
                              width: `${
                                Math.max(...stats.topCompanies.map(c => c.applicationCount)) > 0
                                  ? (company.applicationCount /
                                      Math.max(...stats.topCompanies.map(c => c.applicationCount))) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold text-[var(--color-text-primary)] w-8">
                          {company.applicationCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="card overflow-hidden p-0 reveal-up-sm">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Recent Applications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-rows-stagger">
                <thead className="bg-[var(--color-bg)]">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-[var(--color-text-primary)]">Student</th>
                    <th className="px-6 py-3 text-left font-semibold text-[var(--color-text-primary)]">Company</th>
                    <th className="px-6 py-3 text-left font-semibold text-[var(--color-text-primary)]">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-[var(--color-text-primary)]">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{app.student?.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{app.student?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{app.company?.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 border border-primary-500/20 text-primary-600">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="card overflow-hidden p-0 reveal-up-sm">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Scheduled Interviews</h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {interviews.length === 0 ? (
                <div className="p-6 text-center text-[var(--color-text-muted)]">
                  No interviews scheduled
                </div>
              ) : (
                interviews.map((interview) => (
                  <div key={interview._id} className="p-6 hover:bg-[var(--color-bg)] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">{interview.student?.name}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{interview.company?.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-primary-500/20 border border-primary-500/20 text-primary-600 text-xs font-semibold rounded">
                        {interview.status}
                      </span>
                    </div>
                    {interview.interviewSlot?.date && (
                      <div className="mt-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-secondary)]">
                        <p>
                          <span className="font-medium text-[var(--color-text-primary)]">Date:</span>{' '}
                          {new Date(interview.interviewSlot.date).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-text-primary)]">Time:</span> {interview.interviewSlot.time}
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-text-primary)]">Mode:</span> {interview.interviewSlot.mode}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Cycles Tab */}
        {activeTab === 'cycles' && (
          <div className="card p-6 reveal-up-sm">
            <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-6">Placement Cycles</h2>
            {cycles.length === 0 ? (
              <p className="text-[var(--color-text-muted)]">No placement cycles created</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cycles.map((cycle) => (
                  <div
                    key={cycle._id}
                    className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)]"
                  >
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-2">{cycle.name}</h3>
                    <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                      <p>
                        <span className="font-medium text-[var(--color-text-primary)]">Status:</span>{' '}
                        <span className="px-2 py-1 bg-primary-500/20 border border-primary-500/20 text-primary-600 rounded text-xs">
                          {cycle.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-[var(--color-text-primary)]">Start:</span> {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--color-text-primary)]">End:</span> {new Date(cycle.endDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--color-text-primary)]">Target Offers:</span> {cycle.targetOffers}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--color-text-primary)]">Offers Extended:</span> {cycle.offersExtended}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messaging Tab */}
        {activeTab === 'messaging' && (
          <div>
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-400 transition mb-6 shadow-[0_14px_34px_-24px_rgba(11,162,213,.95)]"
            >
              + Send Bulk Message
            </button>

            {showMessageModal && (
              <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="card max-w-2xl w-full p-8 animate-slide-up">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-6">Send Bulk Message</h2>

                  <div className="space-y-6">
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                        className="input"
                        placeholder="e.g., Important Announcement"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Message
                      </label>
                      <textarea
                        value={messageForm.message}
                        onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                        rows="6"
                        className="input"
                        placeholder="Enter your message..."
                      ></textarea>
                    </div>

                    {/* Message Type */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Message Type
                      </label>
                      <select
                        value={messageForm.type}
                        onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                        className="input"
                      >
                        <option value="placement_update">Placement Update</option>
                        <option value="announcement">Announcement</option>
                        <option value="reminder">Reminder</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setShowMessageModal(false)}
                        className="px-6 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg)] transition font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition font-medium flex-1"
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6 text-center text-[var(--color-text-muted)]">
              <p>Message history will be displayed here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboardPage;
