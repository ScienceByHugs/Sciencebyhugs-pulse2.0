import { SectionScreen } from '@/components/SectionScreen';

export default function ProtocolScreen() {
  return <SectionScreen eyebrow="YOUR ROUTINE" title="Protocol" body="Everything you take, organized as one living routine." cards={[
    { title: 'Active protocol', detail: '4 items · 7 scheduled administrations this week' },
    { title: 'Smart scheduling', detail: 'Daily, weekdays, intervals, cycles, pauses and temporary changes.' },
    { title: 'Supply engine', detail: 'Protocol usage will drive inventory forecasts automatically.' }
  ]} />;
}
