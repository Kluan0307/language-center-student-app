import { SegmentedControl } from '../../components/ui';
export function Segments({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <SegmentedControl value={value} options={options} onChange={onChange} />;
}
