import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fonts } from '../../constants/typography';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure, type ConsoleJob, type ConsoleOverview, type ConsoleResult } from '../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../components/console/ConsoleGate';
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
  salary: string;
  department: string;
  description: string;
};

type JobsResult = { success: true; jobs: ConsoleJob[] };

function blankDraft(o: ConsoleOverview): Draft {
  return {
    title: '',
    type: 'Full-time',
    location: [o.profile.city, o.profile.state].filter(Boolean).join(', '),
    salary: '',
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
}: {
  job: ConsoleJob;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
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
  const max = o.limits.maxActiveJobs;

  const load = useCallback(async () => {
    const result = await run<JobsResult>('jobs');
    if (isFailure(result)) {
      setError(result.error);
      return;
    }
    setError('');
    setJobs(result.jobs);
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
    setSaving(true);
    const result = await run<JobsResult>('saveJob', { jobId: id || undefined, job: draft });
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
        Open jobs appear on your storefront and in FinderB Jobs. Applications arrive as leads. You can keep {max} open at a time.
      </Text>
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
                    salary: job.salary || '',
                    department: job.department || '',
                    description: job.description || '',
                  },
                })
              }
              onToggle={() => void toggle(job)}
              onDelete={() => remove(job)}
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
            <Field
              label="Salary (optional)"
              value={editing.draft.salary}
              onChangeText={(value) => setDraft('salary', value)}
              placeholder="e.g. ₹12,000 – ₹15,000 / month"
            />
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
}));
