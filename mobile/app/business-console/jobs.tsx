import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Linking, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

function ApplicationsButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const styles = useStyles();
  const shift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shift, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shift]);
  const travel = shift.interpolate({ inputRange: [0, 1], outputRange: [-70, 140] });
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Applications"
      style={[styles.flex, styles.appsPress, disabled && { opacity: 0.5 }]}
    >
      <LinearGradient
        colors={['#7C3AED', '#DB2777', '#F97316', '#0891B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.appsFill}
      >
        <Animated.View style={[styles.appsGlint, { transform: [{ translateX: travel }] }]} />
        <Text style={styles.appsLabel}>Applications</Text>
      </LinearGradient>
    </Pressable>
  );
}

function OpenBadge() {
  const styles = useStyles();
  const slide = useRef(new Animated.Value(-28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, { toValue: 72, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(1100),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [slide]);
  return (
    <View style={styles.openWrap}>
      <Tag label="Open" tone="success" />
      <Animated.View pointerEvents="none" style={[styles.openGlint, { transform: [{ translateX: slide }, { rotate: '18deg' }] }]} />
    </View>
  );
}

function JobCard({
  job,
  busy,
  onOpen,
  onEdit,
  onToggle,
  onApplications,
}: {
  job: ConsoleJob;
  busy: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onApplications: () => void;
}) {
  const styles = useStyles();
  const open = job.status === 'active';
  const unseen = job.unseenCount || 0;
  return (
    <View style={[styles.card, !open && styles.cardClosed]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${job.title} details`}>
        <View style={styles.cardHead}>
          <View style={styles.flex}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.meta}>
              {[job.type, job.location, job.salary].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <View style={styles.badgeCol}>
            {open ? <OpenBadge /> : <Tag label="Closed" tone="neutral" />}
            {unseen > 0 ? (
              <View style={styles.unseen}>
                <Text style={styles.unseenText}>{unseen > 9 ? '9+' : unseen} new</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.body} numberOfLines={3}>
          {job.description}
        </Text>
        <Text style={styles.posted}>Posted {timeAgo(job.created_at)}</Text>
      </Pressable>
      <View style={styles.actions}>
        <ApplicationsButton onPress={onApplications} disabled={busy} />
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
      </View>
    </View>
  );
}

function JobsBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const { run, notify, refresh } = useMerchantConsole();
  const [jobs, setJobs] = useState<ConsoleJob[] | null>(null);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [hr, setHr] = useState({ email: '', mobile: '' });
  const [hrDraft, setHrDraft] = useState({ email: '', mobile: '' });
  const [hrOpen, setHrOpen] = useState(false);
  const [hrSaving, setHrSaving] = useState(false);
  const [detailJob, setDetailJob] = useState<ConsoleJob | null>(null);
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

  const remove = (job: ConsoleJob, onDone?: () => void) =>
    Alert.alert('Delete this job?', `“${job.title}” and its listing will be removed for good.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(job.id);
          const result = await run<JobsResult>('deleteJob', { jobId: job.id });
          setBusyId('');
          if (after(result, 'Job deleted')) onDone?.();
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
      refreshing={pulling}
      onRefresh={() => {
        setPulling(true);
        void Promise.all([refresh(), load()]).finally(() => setPulling(false));
      }}
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
              onOpen={() => setDetailJob(job)}
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
                  void load();
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
            {editing.id ? (
              <Btn
                tone="danger"
                icon="trash-outline"
                label="Delete this job"
                disabled={saving || busyId === editing.id}
                onPress={() => {
                  const current = jobs?.find((job) => job.id === editing.id);
                  if (current) remove(current, () => setEditing(null));
                }}
              />
            ) : null}
          </>
        ) : null}
      </Sheet>

      <Sheet visible={Boolean(detailJob)} title="Job" onClose={() => setDetailJob(null)}>
        {detailJob ? (
          <>
            <Text style={styles.title}>{detailJob.title}</Text>
            <Text style={styles.meta}>
              {[detailJob.type, detailJob.location, detailJob.salary].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.body}>{detailJob.description}</Text>
            <Text style={styles.posted}>Posted {timeAgo(detailJob.created_at)}</Text>
            <Btn
              tone="danger"
              icon="trash-outline"
              label="Delete this job"
              disabled={busyId === detailJob.id}
              onPress={() => remove(detailJob, () => setDetailJob(null))}
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
  badgeCol: { alignItems: 'flex-end', gap: 6 },
  unseen: { borderRadius: 999, backgroundColor: '#B91C1C', paddingHorizontal: 7, paddingVertical: 2 },
  unseenText: { fontFamily: fonts.semiBold, fontSize: 11, color: '#FFFFFF' },
  openWrap: { overflow: 'hidden', borderRadius: 999 },
  openGlint: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  appsPress: { borderRadius: 9, overflow: 'hidden' },
  appsFill: { minHeight: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  appsGlint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  appsLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: '#FFFFFF' },
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
