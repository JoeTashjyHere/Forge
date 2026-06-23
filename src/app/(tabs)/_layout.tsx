import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';

export default function TabsLayout() {
  const theme = useTheme();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthed = useAuthStore(selectIsAuthenticated);
  const onboarded = useAuthStore((s) => s.profile?.onboardingCompleted ?? false);
  const profileId = useAuthStore((s) => s.profile?.id);

  const loadConversations = useMessagingStore((s) => s.loadConversations);
  const unread = useMessagingStore((s) =>
    s.conversations.reduce((n, c) => n + c.unreadCount, 0),
  );

  useEffect(() => {
    if (profileId) void loadConversations(profileId);
  }, [profileId, loadConversations]);

  if (initialized && !isAuthed) return <Redirect href="/auth/login" />;
  if (initialized && !onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          ...(Platform.OS === 'web' ? { height: 64, paddingTop: 8, paddingBottom: 8 } : {}),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
