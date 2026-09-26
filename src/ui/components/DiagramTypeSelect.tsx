import { Select } from '@base-ui/react/select';
import type { DiagramType } from '../../diagrams/capability';
import type { RendererModel } from '../../core/diagram-model';
import { diagramTypes } from '../../runtime/diagram-catalog';

export interface DiagramTypeSelectProps {
  readonly model: RendererModel;
  readonly onChange: (type: Exclude<DiagramType, 'unknown' | 'unsupported'>) => void;
}

export function DiagramTypeSelect({ model, onChange }: DiagramTypeSelectProps) {
  return (
    <section className="mve-diagram-picker" aria-label="Diagram type">
      <Select.Root value={model.diagramType === 'unknown' || model.diagramType === 'unsupported' ? null : model.diagramType}
        onValueChange={(type) => { if (type) onChange(type as Exclude<DiagramType, 'unknown' | 'unsupported'>); }}>
        <Select.Trigger id="mve-diagram-select" className="mve-diagram-select" aria-label="Diagram type">
          <Select.Value placeholder="Choose diagram type" /> <Select.Icon aria-hidden="true">⌄</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="mve-select-positioner">
            <Select.Popup className="mve-select-popup">
              <Select.List>
                {diagramTypes.map((type) => <Select.Item key={type.id} value={type.id} className="mve-select-item"><Select.ItemText>{type.label}</Select.ItemText></Select.Item>)}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </section>
  );
}
