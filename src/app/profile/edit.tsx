import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  AVAILABILITY_LEVELS,
  BUILDER_ARCHETYPES,
  PERSONAL_BUILD_STAGES,
  type AvailabilityLevel,
  type BuilderArchetype,
  type PersonalBuildStage,
} from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

export default function EditProfile() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [buildStage, setBuildStage] = useState<PersonalBuildStage | null>(
    profile?.buildStage ?? null,
  );
  const [archetype, setArchetype] = useState<BuilderArchetype | null>(
    profile?.builderArchetype ?? null,
  );
  const [availability, setAvailability] = useState<AvailabilityLevel | null>(
    profile?.availability ?? null,
  );
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || null,
        occupation: occupation.trim() || null,
        company: company.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        buildStage,
        builderArchetype: archetype,
        availability,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      edges={['top']}
      footer={<Button title="Save changes" loading={saving} onPress={onSave} />}
    >
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">Edit profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.form}>
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Input label="Occupation" value={occupation} onChangeText={setOccupation} />
        <Input label="Company" value={company} onChangeText={setCompany} />
        <Input label="Location" value={location} onChangeText={setLocation} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline placeholder="What are you building toward?" />
      </View>

      <Field label="Build stage">
        {PERSONAL_BUILD_STAGES.map((s) => (
          <Chip
            key={s.key}
            label={s.key}
            selected={buildStage === s.key}
            onPress={() => setBuildStage(s.key)}
          />
        ))}
      </Field>

      <Field label="Archetype">
        {BUILDER_ARCHETYPES.map((a) => (
          <Chip
            key={a.key}
            label={a.key}
            selected={archetype === a.key}
            onPress={() => setArchetype(a.key)}
          />
        ))}
      </Field>

      <Field label="Availability">
        {AVAILABILITY_LEVELS.map((a) => (
          <Chip
            key={a.key}
            label={a.label}
            selected={availability === a.key}
            onPress={() => setAvailability(a.key)}
          />
        ))}
      </Field>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.two }}>
        {label}
      </Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  form: { gap: Spacing.four },
  field: { marginTop: Spacing.five },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
