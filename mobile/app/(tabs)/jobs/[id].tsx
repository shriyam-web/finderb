import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { mobileInputDigits } from '../../../lib/phoneInput';
import { useAuth } from '../../../context/AuthContext';
import { useLoginPrompt } from '../../../context/LoginPromptContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import {
  fetchJobById,
  formatJobPosted,
  formatJobType,
  peekJob,
  submitJobApplication,
  type JobListing,
} from '../../../lib/jobs';
import {
  hasAppliedToJob,
  markJobApplied,
} from '../../../lib/jobApplications';
import { SITE_URL } from '../../../lib/supabase';
import { JOB_LISTING_DISCLAIMER } from '../../../lib/jobDisclaimer';

function param(value: string | string[] | undefined): string {
  return typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value[0] || ''
      : '';
}

export default function JobDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const { requestLogin: promptLogin } = useLoginPrompt();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = param(params.id);
  const bottomPad = useTabScrollPadding(28);

  const [job, setJob] = useState<JobListing | null>(() => peekJob(id));
  const [loading, setLoading] = useState(() => !peekJob(id));
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [cv, setCv] = useState<{ uri: string; name: string; mime: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNote, setReportNote] = useState('');
  const latestId = useRef(id);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing job id');
      setLoading(false);
      return;
    }
    latestId.current = id;
    const cached = peekJob(id);
    setJob(cached);
    setError('');
    setLoading(!cached);
    void hasAppliedToJob(id).then((applied) => {
      if (latestId.current === id) setAlreadyApplied(applied);
    });
    const result = await fetchJobById(id);
    if (latestId.current !== id) return;
    // Keep showing the listed job if only the refresh failed (for example, offline).
    if (result.job || !cached || result.error === 'Job not found') {
      setJob(result.job);
      setError(result.error || '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!applyOpen) return;
    if (alreadyApplied) {
      setFormSuccess(true);
      return;
    }
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setPhone('');
    setMessage('');
    setFormError('');
    setFormSuccess(false);
  }, [alreadyApplied, applyOpen, user?.email, user?.fullName]);

  const paragraphs = useMemo(() => {
    const raw = (job?.description || '').trim();
    if (!raw) return [];
    return raw
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [job?.description]);

  const company = job?.business?.businessName || 'Company';
  const place = job?.location || job?.business?.city || '';
  const posted = formatJobPosted(job?.created_at);

  const onShare = async () => {
    if (!job) return;
    const url = `${SITE_URL}/categories/job`;
    try {
      await Share.share({
        message: `${job.title} at ${company}\n\n${url}`,
        title: job.title,
      });
    } catch {
      /* cancelled */
    }
  };

  const openMerchant = () => {
    if (!job?.business) return;
    const slug = job.business.slug || job.business.id;
    router.push(`/merchant/${slug}` as Href);
  };

  const requestLogin = () => {
    const jobId = job?.id || id;
    promptLogin(`/(tabs)/jobs/${jobId}`);
  };

  const openApply = () => {
    if (alreadyApplied) return;
    if (!user) {
      requestLogin();
      return;
    }
    setApplyOpen(true);
  };

  const onSubmit = async () => {
    if (!user) {
      setApplyOpen(false);
      requestLogin();
      return;
    }
    if (!job?.business?.id) {
      setFormError('Employer details missing');
      return;
    }
    if (phone.length !== 10) {
      setFormError('Enter a 10-digit mobile number.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    const result = await submitJobApplication({
      jobId: job.id,
      businessId: job.business.id,
      jobTitle: job.title,
      fullName,
      email,
      phone: `+91${phone}`,
      message,
      cv,
    });
    setSubmitting(false);
    if (!result.success) {
      setFormError(result.error || 'Could not submit application');
      return;
    }
    await markJobApplied(job.id, email);
    setAlreadyApplied(true);
    setFormSuccess(true);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Job details"
          variant="bar"
          onBack={() => router.replace('/(tabs)/jobs')}
          right={
            job ? (
              <Pressable onPress={onShare} hitSlop={8} style={styles.shareBtn}>
                <Ionicons name="share-outline" size={18} color={colors.ink} />
              </Pressable>
            ) : null
          }
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : !job ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Job not found</Text>
            <Text style={styles.emptyText}>
              {error || 'This opening may have closed.'}
            </Text>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.replace('/(tabs)/jobs' as Href)}
            >
              <Text style={styles.secondaryBtnText}>Back to job board</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 72 }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.jobHead}>
                <View style={styles.logoWrap}>
                  {job.business?.profilePictureUrl ? (
                    <Image
                      source={{ uri: job.business.profilePictureUrl }}
                      style={styles.logo}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.logoFallback}>
                      <Text style={styles.logoInitial}>
                        {company.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroRole}>{job.title}</Text>
                <Pressable onPress={openMerchant} hitSlop={6} style={styles.companyBtn}>
                  <Text style={styles.heroCompany} numberOfLines={1}>
                    {company}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSoft} />
                </Pressable>

                <View style={styles.facts}>
                  {place ? (
                    <View style={styles.fact}>
                      <Ionicons name="location-outline" size={15} color={colors.textSoft} />
                      <Text style={styles.factText}>{place}</Text>
                    </View>
                  ) : null}
                  {job.type ? (
                    <View style={styles.fact}>
                      <Ionicons name="briefcase-outline" size={15} color={colors.textSoft} />
                      <Text style={styles.factText}>{formatJobType(job.type)}</Text>
                    </View>
                  ) : null}
                  {job.department ? (
                    <View style={styles.fact}>
                      <Ionicons name="layers-outline" size={15} color={colors.textSoft} />
                      <Text style={styles.factText}>{job.department}</Text>
                    </View>
                  ) : null}
                  {posted ? (
                    <View style={styles.fact}>
                      <Ionicons name="time-outline" size={15} color={colors.textSoft} />
                      <Text style={styles.factText}>Posted {posted}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.salaryValue}>
                  {job.salary || 'Salary as per industry standards'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Job description</Text>
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <Text key={`${i}-${p.slice(0, 12)}`} style={styles.body}>
                      {p}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.body}>
                    The employer has not added a long description yet. Apply to learn more
                    about responsibilities and requirements.
                  </Text>
                )}
                <Pressable onPress={() => setReportOpen(true)} style={styles.reportBtn}>
                  <Text style={styles.reportText}>Report this job</Text>
                </Pressable>
                <View style={styles.disclaimer}>
                  <View style={styles.disclaimerHead}>
                    <Ionicons name="warning-outline" size={14} color={colors.textSoft} />
                    <Text style={styles.disclaimerTitle}>{JOB_LISTING_DISCLAIMER.title}</Text>
                  </View>
                  {JOB_LISTING_DISCLAIMER.paragraphs.map((paragraph) => (
                    <Text key={paragraph} style={styles.disclaimerBody}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              </View>

            </ScrollView>

            <View style={[styles.ctaBar, { paddingBottom: Math.max(12, bottomPad - 56) }]}>
              <Pressable
                onPress={openApply}
                disabled={alreadyApplied}
                style={({ pressed }) => [
                  styles.applyBtn,
                  alreadyApplied && styles.applyBtnDone,
                  pressed && !alreadyApplied && styles.pressed,
                ]}
              >
                {alreadyApplied ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.applyBtnText}>Applied</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.applyBtnText}>
                      {user ? 'Apply now' : 'Sign in to apply'}
                    </Text>
                    <Ionicons
                      name={user ? 'arrow-forward' : 'log-in-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>

      <Modal
        visible={applyOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setApplyOpen(false)}
      >
        <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.modalFlex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply now</Text>
              <Pressable onPress={() => setApplyOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={styles.modalSub} numberOfLines={2}>
              {job?.title} · {company}
            </Text>

            {formSuccess ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={42} color={colors.success} />
                <Text style={styles.successTitle}>Application sent</Text>
                <Text style={styles.successText}>
                  The employer will reach out if you are shortlisted.
                </Text>
                <Pressable
                  style={styles.applyBtn}
                  onPress={() => setApplyOpen(false)}
                >
                  <Text style={styles.applyBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.form}
                keyboardShouldPersistTaps="handled"
              >
                {formError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                <Text style={styles.label}>Full name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSoft}
                  style={styles.input}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={colors.textSoft}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Text style={styles.label}>Phone</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.phonePrefix}>🇮🇳 +91</Text>
                  <TextInput
                    value={phone}
                    onChangeText={(value) => setPhone(mobileInputDigits(value, phone))}
                    placeholder="10-digit mobile"
                    placeholderTextColor={colors.textSoft}
                    keyboardType="number-pad"
                    style={styles.phoneInput}
                  />
                </View>

                <Text style={styles.label}>Message (optional)</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Why you're a great fit"
                  placeholderTextColor={colors.textSoft}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.textarea]}
                />

                <Text style={styles.label}>CV (PDF, DOC, or DOCX)</Text>
                <Pressable
                  onPress={() => {
                    void (async () => {
                      const DocumentPicker = await import('expo-document-picker');
                      const picked = await DocumentPicker.getDocumentAsync({
                        type: [
                          'application/pdf',
                          'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        ],
                        copyToCacheDirectory: true,
                      });
                      if (picked.canceled || !picked.assets?.[0]) return;
                      const asset = picked.assets[0];
                      const name = asset.name || 'cv.pdf';
                      if (!/\.(pdf|doc|docx)$/i.test(name)) {
                        setFormError('Upload a PDF, DOC, or DOCX only.');
                        return;
                      }
                      setFormError('');
                      setCv({ uri: asset.uri, name, mime: asset.mimeType || 'application/octet-stream' });
                    })();
                  }}
                  style={styles.input}
                >
                  <Text style={styles.body}>{cv ? cv.name : 'Attach your CV'}</Text>
                </Pressable>

                <Pressable
                  onPress={() => void onSubmit()}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    submitting && styles.applyDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.onDark} />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Submit Application</Text>
                      <Ionicons name="send" size={14} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={reportOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReportOpen(false)}>
        <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report this job</Text>
            <Pressable onPress={() => setReportOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Reason</Text>
            <TextInput
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="What is wrong with this posting?"
              placeholderTextColor={colors.textSoft}
              multiline
              style={[styles.input, styles.textarea]}
            />
            {reportNote ? <Text style={styles.successText}>{reportNote}</Text> : null}
            <Pressable
              style={styles.applyBtn}
              onPress={() => {
                void (async () => {
                  if (!job) return;
                  const res = await fetch(`${SITE_URL}/api/jobs/report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ jobId: job.id, reason: reportReason }),
                  });
                  const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
                  if (!data?.success) {
                    setReportNote(data?.error || 'Could not send this report.');
                    return;
                  }
                  setReportNote('Report sent. FinderB will review this posting.');
                  setReportReason('');
                })();
              }}
            >
              <Text style={styles.applyBtnText}>Submit report</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  shareBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  jobHead: {
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 14,
  },
  logo: { width: '100%', height: '100%' },
  logoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  logoInitial: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.white,
  },
  heroRole: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  companyBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  heroCompany: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.teal,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  factText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  salaryValue: {
    marginTop: 14,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.success,
  },
  section: { gap: 8 },
  disclaimer: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 4,
    backgroundColor: 'transparent',
  },
  disclaimerHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  disclaimerTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 11, color: colors.textSoft },
  disclaimerBody: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textSoft },
  reportBtn: { marginTop: 22, alignSelf: 'flex-start' },
  reportText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#b42318' },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.heading,
    marginBottom: 4,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  applyBtn: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  applyBtnDone: {
    backgroundColor: colors.success,
  },
  applyDisabled: { opacity: 0.7 },
  applyBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.92 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  secondaryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
  },
  secondaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  modalRoot: { flex: 1, backgroundColor: colors.canvas },
  modalFlex: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.heading,
  },
  modalSub: {
    marginTop: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  form: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  label: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  phonePrefix: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  textarea: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  submitBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.heading,
  },
  successText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
}));
