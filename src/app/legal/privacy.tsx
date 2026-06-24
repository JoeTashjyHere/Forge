import { LegalScreen } from '@/components/forge/LegalScreen';

export default function Privacy() {
  return (
    <LegalScreen
      title="Privacy Policy"
      updated="Last updated June 2026"
      sections={[
        {
          heading: 'Overview',
          body: 'This is a placeholder privacy policy for the Forge beta. It describes, in plain language, how we intend to handle your information. A complete, legally reviewed policy will replace this before general availability.',
        },
        {
          heading: 'What we collect',
          body: 'Account details you provide (name, email), the projects and content you create, and basic product analytics (such as when you create a project or publish a launch) used to improve Forge.',
        },
        {
          heading: 'How we use it',
          body: 'To operate core features — matching, roadmaps, messaging, and launches — and to understand which parts of Forge help builders make progress. We do not sell your personal data.',
        },
        {
          heading: 'Your choices',
          body: 'You can edit your profile, control project visibility, and request deletion of your account and associated data at any time by contacting support.',
        },
        {
          heading: 'Contact',
          body: 'Questions about privacy during the beta? Reach out at privacy@forge.build.',
        },
      ]}
    />
  );
}
