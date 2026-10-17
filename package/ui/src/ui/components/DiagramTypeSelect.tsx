import { Select } from '@base-ui/react/select';
import type { DiagramType } from '@mermaid-editor-sdk/headless';
import type { RendererModel } from '@mermaid-editor-sdk/headless';
import { diagramTypes } from '@mermaid-editor-sdk/headless';
import { usePortalContainer } from '../context/portal-container-context';

export interface DiagramTypeSelectProps {
  /** Current diagram model and type. */
  readonly model: RendererModel;
  /** Requests a change to an editable diagram type. */
  readonly onChange: (type: Exclude<DiagramType, 'unknown' | 'unsupported'>) => void;
}

/** Selects a supported Mermaid diagram type. */
export function DiagramTypeSelect({ model, onChange }: DiagramTypeSelectProps) {
  const portalContainer = usePortalContainer();
  const value = model.diagramType === 'unknown' || model.diagramType === 'unsupported'
    ? null
    : model.diagramType;
  const placeholder = model.diagramType === 'unsupported'
    ? 'Unsupported diagram'
    : model.diagramType === 'unknown'
      ? 'Unknown diagram'
      : 'Choose diagram type';

  return (
    <section className="mve-diagram-picker" aria-label="Diagram type">
      <span className="mve-diagram-picker-label">Diagram type</span>
      <Select.Root value={value}
        onValueChange={(selected) => {
          const type = diagramTypes.find((item) => item.id === selected);
          if (type) onChange(type.id);
        }}>
        <Select.Trigger className="mve-diagram-select" aria-label="Diagram type">
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="mve-diagram-select-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal container={portalContainer}>
          <Select.Positioner className="mve-select-positioner">
            <Select.Popup className="mve-select-popup">
              <Select.List>
                {diagramTypes.map((type) => (
                  <Select.Item key={type.id} value={type.id} className="mve-select-item">
                    <Select.ItemText>{type.label}</Select.ItemText>
                    <Select.ItemIndicator className="mve-select-item-indicator" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none"><path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </section>
  );
}
