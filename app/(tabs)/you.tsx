import { SectionScreen } from '@/components/SectionScreen';

export default function YouScreen() {
  return <SectionScreen eyebrow="PRIVATE BY DESIGN" title="You" body="Your profile, privacy, health connections, exports and app settings." cards={[
    { title: 'Privacy lock', detail: 'Face ID / device authentication will be available before App Store release.' },
    { title: 'Apple Health', detail: 'Optional and permission-based. Health data will never be used for NEXUS marketing.' },
    { title: 'Export & delete', detail: 'Pulse will support full data export and account-data deletion workflows.' }
  ]} />;
}
