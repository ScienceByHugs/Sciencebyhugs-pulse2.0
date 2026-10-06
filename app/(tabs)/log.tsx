import { SectionScreen } from '@/components/SectionScreen';

export default function LogScreen() {
  return <SectionScreen eyebrow="HISTORY" title="Timeline" body="A chronological record of doses, check-ins, measurements, notes and inventory events." cards={[
    { title: 'Today · 8:02 AM', detail: 'BPC-157 · 250 mcg · Lower-left abdomen' },
    { title: 'Yesterday · 8:11 PM', detail: 'Testosterone Cypionate · 100 mg · Right quadriceps' },
    { title: 'Yesterday · 7:42 AM', detail: 'Weight · 208.7 lb' }
  ]} />;
}
