import { SectionScreen } from '@/components/SectionScreen';

export default function InsightsScreen() {
  return <SectionScreen eyebrow="WHAT CHANGED" title="Insights" body="Useful observations from your own records without turning Pulse into a prescriber." cards={[
    { title: 'Consistency · 93%', detail: '13 of 14 scheduled administrations logged in the last 7 days.' },
    { title: 'Supply', detail: 'Next projected low inventory: BPC-157 in approximately 11 days.' },
    { title: 'Site rotation', detail: '6 sites used in the current rotation window.' }
  ]} />;
}
