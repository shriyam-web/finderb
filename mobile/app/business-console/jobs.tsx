import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from 'expo-router';
import { fonts } from '../../constants/typography';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure, type ConsoleJob, type ConsoleOverview, type ConsoleResult } from '../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../components/console/ConsoleGate';
import { parseSalaryRange, salaryFromInputs, type SalaryPeriod } from '../../lib/jobSalary';
import {
  Btn,
  Chip,
  ConsolePage,
  Empty,
  Field,
  Section,
  Sheet,
  Tag,
  createConsoleStyles,
  timeAgo,
} from '../../components/console/kit';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

type Draft = {
  title: string;
  type: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: SalaryPeriod;
  department: string;
  description: string;
};

type ApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  cv_name: string | null;
  cv_kind: string | null;
  status: string;
  created_at: string;
};

type JobsResult = { success: true; jobs: ConsoleJob[] };

function blankDraft(o: ConsoleOverview): Draft {
  return {
    title: '',
    type: 'Full-time',
    location: [o.profile.city, o.profile.state].filter(Boolean).join(', '),
    salaryMin: '',
    salaryMax: '',
    salaryPeriod: 'month',
    department: '',
    description: '',
  };
}

function JobCard({
  job,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onApplications,
}: {
  job: ConsoleJob;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onApplications: () => void;
}) {
  const styles = useStyles();
  const open = job.status === 'active';
  return (
    <View style={[styles.card, !open && styles.cardClosed]}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.meta}>
            {[job.type, job.location, job.salary].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Tag label={open ? 'Open' : 'Closed'} tone={open ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.body} numberOfLines={3}>
        {job.description}
      </Text>
      <Text style={styles.posted}>Posted {timeAgo(job.created_at)}</Text>
      <View style={styles.actions}>
        <Btn small tone="outline" icon="people-outline" label="Applications" onPress={onApplications} disabled={busy} style={styles.flex} />
        <Btn small tone="outline" icon="create-outline" label="Edit" onPress={onEdit} disabled={busy} style={styles.flex} />
        <Btn
          small
          tone="outline"
          icon={open ? 'pause-circle-outline' : 'play-circle-outline'}
          label={open ? 'Close' : 'Reopen'}
          onPress={onToggle}
          busy={busy}
          style={styles.flex}
        />
        <Btn small tone="text" icon="trash-outline" label="Delete" onPress={onDelete} disabled={busy} />
      </View>
    </View>
  );
}

function JobsBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const { run, notify, refresh } = useMerchantConsole();
  const [jobs, setJobs] = useState<ConsoleJob[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [hr, setHr] = useState({ email: '', mobile: '' });
  const [hrDraft, setHrDraft] = useState({ email: '', mobile: '' });
  const [hrOpen, setHrOpen] = useState(false);
  const [hrSaving, setHrSaving] = useState(false);
  const [applicationsJob, setApplicationsJob] = useState<ConsoleJob | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[] | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRow | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const max = o.limits.maxActiveJobs;

  const load = useCallback(async () => {
    const result = await run<JobsResult>('jobs');
    if (isFailure(result)) {
      setError(result.error);
      return;
    }
    setError('');
    setJobs(result.jobs);
    const contact = await run<{ success: true; hr: { email: string; mobile: string } }>('hrContact');
    if (!isFailure(contact)) {
      setHr(contact.hr);
      setHrDraft(contact.hr);
    }
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const activeCount = (jobs ?? []).filter((job) => job.status === 'active').length;

  const after = (result: ConsoleResult<JobsResult>, message: string) => {
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return false;
    }
    setJobs(result.jobs);
    notify(message);
    void refresh();
    return true;
  };

  const save = async () => {
    if (!editing) return;
    const { draft, id } = editing;
    if (!draft.title.trim() || !draft.location.trim() || !draft.description.trim()) {
      notify('Add a title, location and description.', 'bad');
      return;
    }
    if (!id && (!hr.email || !hr.mobile)) {
      notify('Set your HR email and mobile number before posting a job.', 'bad');
      setHrOpen(true);
      return;
    }
    const salary = salaryFromInputs(draft.salaryMin, draft.salaryMax, draft.salaryPeriod);
    setSaving(true);
    const result = await run<JobsResult>('saveJob', {
      jobId: id || undefined,
      job: {
        title: draft.title,
        type: draft.type,
        location: draft.location,
        salary,
        department: draft.department,
        description: draft.description,
      },
    });
    setSaving(false);
    if (after(result, id ? 'Job updated' : 'Job posted on your storefront')) setEditing(null);
  };

  const toggle = async (job: ConsoleJob) => {
    setBusyId(job.id);
    const result = await run<JobsResult>('setJobStatus', {
      jobId: job.id,
      status: job.status === 'active' ? 'closed' : 'active',
    });
    setBusyId('');
    after(result, job.status === 'active' ? 'Job closed' : 'Job reopened');
  };

  const remove = (job: ConsoleJob) =>
    Alert.alert('Delete this job?', `“${job.title}” and its listing will be removed for good.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(job.id);
          const result = await run<JobsResult>('deleteJob', { jobId: job.id });
          setBusyId('');
          after(result, 'Job deleted');
        },
      },
    ]);

  const setDraft = (key: keyof Draft, value: string) =>
    setEditing((current) => (current ? { ...current, draft: { ...current.draft, [key]: value } } : current));

  const canPost = activeCount < max;

  return (
    <ConsolePage
      title="Jobs"
      docked
      subtitle={jobs ? `${activeCount} of ${max} open` : 'Hiring'}
      footer={
        <Btn
          icon="add"
          label={canPost ? 'Post a job' : `${max} jobs already open`}
          disabled={!jobs || !canPost}
          onPress={() => setEditing({ id: null, draft: blankDraft(o) })}
        />
      }
    >
      <Text style={styles.lead}>
        Open jobs appear on your storefront and in FinderB Jobs. Open a job to read applications. You can keep {max} open at a time.
      </Text>
      <Pressable onPress={() => setHrOpen(true)} style={styles.hrCard}>
        <Text style={styles.hrTitle}>HR contact</Text>
        <Text style={styles.hrBody}>
          {hr.email && hr.mobile
            ? `${hr.email} · ${hr.mobile}`
            : 'Set an HR email and mobile number before you post a job. Shortlisted candidates receive both.'}
        </Text>
      </Pressable>
      {error && !jobs ? (
        <Empty icon="cloud-offline-outline" title="Couldn’t load jobs" body={error} />
      ) : !jobs ? (
        <ActivityIndicator style={styles.loading} />
      ) : !jobs.length ? (
        <Empty icon="briefcase-outline" title="No jobs posted" body="Need a helper, cook or sales person? Post it here in a minute." />
      ) : (
        <Section title="Your job posts">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              busy={busyId === job.id}
              onEdit={() =>
                setEditing({
                  id: job.id,
                  draft: {
                    title: job.title || '',
                    type: job.type || 'Full-time',
                    location: job.location || '',
                    salaryMin: parseSalaryRange(job.salary).min,
                    salaryMax: parseSalaryRange(job.salary).max,
                    salaryPeriod: parseSalaryRange(job.salary).period,
                    department: job.department || '',
                    description: job.description || '',
                  },
                })
              }
              onToggle={() => void toggle(job)}
              onDelete={() => remove(job)}
              onApplications={() => {
                setApplicationsJob(job);
                setApplications(null);
                setSelectedApplication(null);
                void (async () => {
                  const result = await run<{ success: true; applications: ApplicationRow[] }>('jobApplications', {
                    jobId: job.id,
                  });
                  if (isFailure(result)) {
                    notify(result.error, 'bad');
                    setApplications([]);
                    return;
                  }
                  setApplications(result.applications);
                })();
              }}
            />
          ))}
        </Section>
      )}

      <Sheet
        visible={Boolean(editing)}
        title={editing?.id ? 'Edit job' : 'Post a job'}
        onClose={() => setEditing(null)}
        action={{ label: editing?.id ? 'Save' : 'Post', busy: saving, onPress: () => void save() }}
      >
        {editing ? (
          <>
            <Field
              label="Job title"
              value={editing.draft.title}
              onChangeText={(value) => setDraft('title', value)}
              placeholder="e.g. Counter sales executive"
              maxLength={100}
            />
            <View style={styles.typeBlock}>
              <Text style={styles.label}>Job type</Text>
              <View style={styles.chips}>
                {JOB_TYPES.map((type) => (
                  <Chip key={type} label={type} active={editing.draft.type === type} onPress={() => setDraft('type', type)} />
                ))}
              </View>
            </View>
            <Field label="Location" value={editing.draft.location} onChangeText={(value) => setDraft('location', value)} />
            <Text style={styles.label}>Salary range</Text>
            <View style={styles.salaryRow}>
              <Field
                label="Minimum ₹"
                value={editing.draft.salaryMin}
                onChangeText={(value) => setDraft('salaryMin', value.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="12000"
              />
              <Field
                label="Maximum ₹"
                value={editing.draft.salaryMax}
                onChangeText={(value) => setDraft('salaryMax', value.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="18000"
              />
            </View>
            <View style={styles.chips}>
              {(['month', 'year'] as const).map((period) => (
                <Chip
                  key={period}
                  label={period === 'month' ? 'Per month' : 'Per year'}
                  active={editing.draft.salaryPeriod === period}
                  onPress={() => setDraft('salaryPeriod', period)}
                />
              ))}
            </View>
            <Text style={styles.salaryPreview}>
              {salaryFromInputs(editing.draft.salaryMin, editing.draft.salaryMax, editing.draft.salaryPeriod) ||
                'Leave blank if pay is not disclosed.'}
            </Text>
            <Field
              label="Department (optional)"
              value={editing.draft.department}
              onChangeText={(value) => setDraft('department', value)}
              placeholder="e.g. Kitchen"
            />
            <Field
              label="Description"
              multiline
              value={editing.draft.description}
              onChangeText={(value) => setDraft('description', value)}
              placeholder="Duties, timings, experience needed…"
              counter={`${editing.draft.description.length}/2000`}
              maxLength={2000}
            />
          </>
        ) : null}
      </Sheet>

      <Sheet
        visible={hrOpen}
        title="HR contact"
        onClose={() => setHrOpen(false)}
        action={{
          label: 'Save',
          busy: hrSaving,
          onPress: () => {
            void (async () => {
              setHrSaving(true);
              const result = await run<{ success: true; hr: { email: string; mobile: string } }>('saveHrContact', hrDraft);
              setHrSaving(false);
              if (isFailure(result)) {
                notify(result.error, 'bad');
                return;
              }
              setHr(result.hr);
              setHrOpen(false);
              notify('HR contact saved');
            })();
          },
        }}
      >
        <Field
          label="HR email"
          value={hrDraft.email}
          onChangeText={(value) => setHrDraft((current) => ({ ...current, email: value }))}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="hr@business.com"
        />
        <Field
          label="HR mobile"
          value={hrDraft.mobile}
          onChangeText={(value) => setHrDraft((current) => ({ ...current, mobile: value.replace(/[^\d]/g, '').slice(0, 10) }))}
          keyboardType="phone-pad"
          placeholder="10-digit mobile"
        />
        <Text style={styles.lead}>
          Shortlisted candidates get an email and a notification asking them to reach this HR contact.
        </Text>
      </Sheet>

      <Sheet
        visible={Boolean(applicationsJob) && !selectedApplication}
        title="Applications"
        onClose={() => setApplicationsJob(null)}
      >
        <Text style={styles.title}>{applicationsJob?.title}</Text>
        {!applications ? (
          <ActivityIndicator style={styles.loading} />
        ) : !applications.length ? (
          <Empty icon="people-outline" title="No applications yet" body="Candidates who apply on FinderB will show up here." />
        ) : (
          applications.map((item) => (
            <Pressable key={item.id} onPress={() => setSelectedApplication(item)} style={styles.card}>
              <Text style={styles.title}>{item.full_name}</Text>
              <Text style={styles.meta}>{[item.phone, item.email].filter(Boolean).join(' · ')}</Text>
              <Text style={styles.posted}>{item.status === 'shortlisted' ? 'Shortlisted' : 'Received'}</Text>
            </Pressable>
          ))
        )}
      </Sheet>

      <Sheet
        visible={Boolean(selectedApplication)}
        title="Application"
        onClose={() => {
          setSelectedApplication(null);
          setFileUrl('');
        }}
        action={
          selectedApplication && selectedApplication.status !== 'shortlisted'
            ? {
                label: 'Shortlist',
                onPress: () => {
                  void (async () => {
                    const current = selectedApplication;
                    if (!current) return;
                    const result = await run<{ success: true }>('shortlistApplication', { applicationId: current.id });
                    if (isFailure(result)) {
                      notify(result.error, 'bad');
                      return;
                    }
                    notify('Candidate shortlisted. Email and notification sent.');
                    setSelectedApplication({ ...current, status: 'shortlisted' });
                    setApplications((rows) =>
                      rows ? rows.map((row) => (row.id === current.id ? { ...row, status: 'shortlisted' } : row)) : rows,
                    );
                  })();
                },
              }
            : undefined
        }
      >
        {selectedApplication ? (
          <>
            <Text style={styles.title}>{selectedApplication.full_name}</Text>
            <Text style={styles.meta}>{selectedApplication.phone}</Text>
            <Text style={styles.meta}>{selectedApplication.email}</Text>
            {selectedApplication.message ? <Text style={styles.body}>{selectedApplication.message}</Text> : null}
            {selectedApplication.cv_name ? (
              <>
                <Btn
                  small
                  tone="outline"
                  icon="document-text-outline"
                  label={fileUrl ? 'Refresh CV' : 'Open CV'}
                  onPress={() => {
                    void (async () => {
                      const result = await run<{ success: true; url: string; name: string; kind: string }>(
                        'applicationFile',
                        { applicationId: selectedApplication.id },
                      );
                      if (isFailure(result)) {
                        notify(result.error, 'bad');
                        return;
                      }
                      setFileUrl(result.url);
                      if (result.kind !== 'pdf') void Linking.openURL(result.url);
                    })();
                  }}
                />
                {fileUrl && selectedApplication.cv_kind === 'pdf' ? (
                  <View style={styles.preview}>
                    <WebView source={{ uri: fileUrl }} style={styles.previewWeb} />
                  </View>
                ) : null}
                {fileUrl ? (
                  <Btn small tone="text" label="Download" onPress={() => void Linking.openURL(fileUrl)} />
                ) : null}
              </>
            ) : (
              <Text style={styles.lead}>No CV attached.</Text>
            )}
          </>
        ) : null}
      </Sheet>
    </ConsolePage>
  );
}

export default function JobsScreen() {
  return <ConsoleGate>{(overview) => <JobsBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  loading: { marginTop: 40 },
  lead: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: c.muted },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
    gap: 8,
  },
  cardClosed: { opacity: 0.7 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  meta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  body: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: c.body },
  posted: { fontFamily: fonts.regular, fontSize: 12, color: c.faint },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeBlock: { gap: 10 },
  label: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  salaryRow: { flexDirection: 'row', gap: 12 },
  salaryPreview: { fontFamily: fonts.regular, fontSize: 13, color: c.ink },
  hrCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
    gap: 4,
  },
  hrTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  hrBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  preview: { height: 360, borderRadius: 12, overflow: 'hidden', backgroundColor: c.sunken },
  previewWeb: { flex: 1, backgroundColor: 'transparent' },
}));
