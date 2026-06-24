import { LegalScreen } from '@/components/forge/LegalScreen';

export default function Terms() {
  return (
    <LegalScreen
      title="Terms of Service"
      updated="Last updated June 2026"
      sections={[
        {
          heading: 'Beta agreement',
          body: 'These are placeholder terms for the Forge beta. By using Forge you agree to use it in good faith while we refine the product. Final terms will replace this before general availability.',
        },
        {
          heading: 'Your content',
          body: 'You own the ideas, projects, and content you create on Forge. You grant us permission to store and display it as needed to operate the product (for example, showing a published launch in the marketplace).',
        },
        {
          heading: 'Acceptable use',
          body: 'Be respectful to other builders. Do not post unlawful, harmful, or misleading content, and do not attempt to disrupt the service or access data you are not authorized to see.',
        },
        {
          heading: 'No warranty',
          body: 'Forge is provided “as is” during the beta. Features may change or break, and data may occasionally be reset as we iterate.',
        },
        {
          heading: 'Contact',
          body: 'Questions about these terms? Reach out at support@forge.build.',
        },
      ]}
    />
  );
}
