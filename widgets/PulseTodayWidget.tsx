import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

type PulseTodayWidgetProps = {
  dueCount: number;
  nextTime: string;
};

const PulseTodayWidget = (props: PulseTodayWidgetProps) => {
  'widget';

  return (
    <VStack
      spacing={6}
      modifiers={[
        padding({ all: 14 }),
        foregroundStyle('#f5f9fc')
      ]}
    >
      <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle('#58c7ff')]}>
        PULSE
      </Text>
      <Text modifiers={[font({ size: 28, weight: 'bold' })]}>
        {props.dueCount}
      </Text>
      <Text modifiers={[font({ size: 12 })]}>
        {props.dueCount === 1 ? 'item due today' : 'items due today'}
      </Text>
      <Text modifiers={[font({ size: 12 }), foregroundStyle('#89a0b4')]}>
        {props.nextTime || 'Open Pulse'}
      </Text>
    </VStack>
  );
};

export default createWidget<PulseTodayWidgetProps>(
  'PulseTodayWidget',
  PulseTodayWidget,
  { dueCount: 0, nextTime: 'Open Pulse' }
);
