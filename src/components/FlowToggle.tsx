import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { FlowDefinition, FlowKey } from '../types/consultation';
import { FlowMarker } from './FlowMarker';

interface FlowToggleProps {
  flow: FlowDefinition;
  checked: boolean;
  onChange: (flow: FlowKey, checked: boolean) => void;
}

export function FlowToggle({ flow, checked, onChange }: FlowToggleProps) {
  return (
    <label
      className={`flow-toggle${checked ? ' is-checked' : ''}`}
      style={{ '--flow': flow.color } as CSSProperties}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(flow.key, event.target.checked)}
      />
      <span className="checkbox-mark" aria-hidden="true">
        <Check size={12} strokeWidth={3.2} />
      </span>
      <span className="flow-toggle-label">
        <span className="flow-toggle-hanja" aria-hidden="true">{flow.hanja}</span>
        {flow.label}
      </span>
      <FlowMarker color={checked ? flow.color : '#b9a988'} symbol={flow.symbol} />
    </label>
  );
}
