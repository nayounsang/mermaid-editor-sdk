import { useState } from 'react';
import { Button } from '@base-ui/react/button';
import { Input } from '@base-ui/react/input';
import { groupBy } from 'es-toolkit';
import { useDraggable } from '@dnd-kit/react';
import type { DiagramAction, RendererModel } from '@mermaid-editor-sdk/headless';
import { diagramTypes, paletteCatalog, type EditableDiagramType } from '@mermaid-editor-sdk/headless';
import { sequencePalette } from '../../diagrams/sequence-adapter';
import { ganttPalette } from '@mermaid-editor-sdk/headless';
import { graphPalettes } from '../diagrams/registry';
import { sourcePaletteItemId } from '../diagrams/source-palette-items';

export interface DiagramPaletteProps {
  readonly model: RendererModel;
  readonly dispatch: (action: DiagramAction) => string | undefined;
  readonly pendingConnection?: { readonly diagramType: EditableDiagramType; readonly source?: string };
  readonly onArmConnection: (options: EdgeConnectionOptions | null) => void;
}

export type EdgeConnectionOptions = Omit<Extract<DiagramAction, { type: 'create-edge' }>, 'type' | 'source' | 'target'>;

function DraggablePaletteButton({ id, label, icon, action, disabled, dragDisabled = false, active = false, toggle = false, title, onClick }: {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly action: DiagramAction;
  readonly disabled: boolean;
  readonly dragDisabled?: boolean;
  readonly active?: boolean;
  readonly toggle?: boolean;
  readonly title?: string;
  readonly onClick: () => void;
}) {
  const { ref, isDragging } = useDraggable({
    id,
    type: 'palette-item',
    data: { kind: 'diagram-action', action },
    disabled: disabled || dragDisabled,
  });
  return <Button ref={dragDisabled ? undefined : ref} type="button" className={`mve-palette-item${isDragging ? ' is-dragging' : ''}${active ? ' is-armed' : ''}`}
    {...(toggle ? { 'aria-pressed': active } : {})} title={title}
    disabled={disabled} onClick={onClick}>
    <span>{label}</span><span className="mve-palette-icon">{icon}</span>
  </Button>;
}

export function DiagramPalette({ model, dispatch, pendingConnection, onArmConnection }: DiagramPaletteProps) {
  const [edgeLabels, setEdgeLabels] = useState<Partial<Record<EditableDiagramType, string>>>({});
  const [identifying, setIdentifying] = useState(true);
  const [edgeOptions, setEdgeOptions] = useState<Partial<Record<EditableDiagramType, string>>>({});
  const [selectedStateId, setSelectedStateId] = useState('');
  const diagramType = model.diagramType as EditableDiagramType;
  const grouped = graphPalettes[diagramType];
  const groupedGraphEntries = groupBy(grouped ?? [], (item) => item.group);
  const sourcePalette = paletteCatalog[diagramType] ?? [];
  const canEdit = model.parseState === 'parsed';
  const stateIds = model.diagramType === 'state' ? model.elements
    .filter((element) => element.kind === 'node')
    .map((element) => {
      const encoded = element.id.slice('state:node:'.length);
      try { return decodeURIComponent(encoded); } catch { return encoded; }
    }) : [];
  const defaultStateId = selectedStateId && stateIds.includes(selectedStateId) ? selectedStateId : stateIds[0] ?? '';
  const relationOptions: Partial<Record<EditableDiagramType, readonly string[]>> = {
    flowchart: ['-->', '---', '-.->', '==>', '<--', '<-->'],
    class: ['<|--', '--|>', '*--', '--*', 'o--', '--o', '<--', '-->', '<..', '..>', '<|..', '..|>', '--', '..'],
    er: ['one-one', 'one-many', 'many-many', 'zero-one', 'one-or-many'],
  };
  const palette = diagramType === 'gantt'
    ? ganttPalette.flatMap((group) => group.items.map((item) => ({ group: group.title, label: item.label, icon: item.icon, snippet: item.snippet, paletteItem: item.id })))
    : diagramType === 'sequence'
      ? sequencePalette.flatMap((group) => group.items.map((item) => ({
          group: group.title, label: item.label, icon: item.icon, snippet: item.id, paletteItem: item.id,
        })))
      : sourcePalette.map((item) => ({ ...item, paletteItem: sourcePaletteItemId(diagramType, item.label) }));
  const groupedPalette = groupBy(palette, (item) => item.group);

  return (
    <aside className="mve-palette-panel" aria-label="Diagram tools">
      <h2>Tools</h2>
      {grouped?.length ? Object.entries(groupedGraphEntries).map(([group, entries]) => (
        <section className="mve-palette-group" key={group}>
          <h3>{group}</h3>
          {entries.map((entry) => {
            const edgeAction = entry.action.type === 'create-edge' ? entry.action : undefined;
            const statePaletteAction = entry.action.type === 'insert-state-palette-entry' ? entry.action : undefined;
            const action = statePaletteAction && (statePaletteAction.item === 'start-transition' || statePaletteAction.item === 'end-transition')
              ? { ...statePaletteAction, ...(defaultStateId ? { stateId: defaultStateId } : {}) }
              : entry.action;
            const actionDisabled = !canEdit
              || Boolean(statePaletteAction && ['start-transition', 'end-transition'].includes(statePaletteAction.item) && !defaultStateId);
            const operator = edgeOptions[diagramType] ?? (edgeAction?.type === 'create-edge' ? edgeAction.operator : undefined) ?? relationOptions[diagramType]?.[0] ?? '';
            const edgeLabel = edgeLabels[diagramType] ?? edgeAction?.label ?? '';
            const isArmed = pendingConnection?.diagramType === diagramType && Boolean(edgeAction);
            const chooseAction = (): void => {
              if (!edgeAction) { dispatch(action); return; }
              if (isArmed) { onArmConnection(null); return; }
              onArmConnection({
                ...(diagramType === 'state' ? {} : { operator }),
                ...((diagramType === 'flowchart' || diagramType === 'state' || diagramType === 'er') ? { label: edgeLabel } : {}),
                ...(diagramType === 'er' ? {
                  cardinality: operator as 'one-one' | 'one-many' | 'many-many' | 'zero-one' | 'one-or-many', identifying,
                } : {}),
              });
            };
            return <div className="mve-palette-action" key={entry.label}>
              <DraggablePaletteButton id={`graph:${diagramType}:${group}:${entry.label}`} label={entry.label} icon={entry.icon}
                action={action} disabled={actionDisabled} dragDisabled={Boolean(edgeAction)} active={isArmed} toggle={Boolean(edgeAction)} onClick={chooseAction} />
              {statePaletteAction && ['start-transition', 'end-transition'].includes(statePaletteAction.item) && <label>State
                <select aria-label={`${entry.label} state`} value={defaultStateId} onChange={(event) => setSelectedStateId(event.currentTarget.value)}>
                  {stateIds.map((id) => <option key={id} value={id}>{id}</option>)}
                </select>
              </label>}
              {edgeAction && <div className="mve-palette-edge-fields">
                {relationOptions[diagramType] && <label>{diagramType === 'er' ? 'Cardinality' : 'Relationship type'}
                  <select aria-label={diagramType === 'er' ? 'New relationship cardinality' : 'New relationship type'} value={operator} disabled={isArmed}
                    onChange={(event) => setEdgeOptions((current) => ({ ...current, [diagramType]: event.currentTarget.value }))}>
                    {relationOptions[diagramType]?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>}
                {(diagramType === 'flowchart' || diagramType === 'state' || diagramType === 'er') && <label>{diagramType === 'state' ? 'Transition label' : 'Relationship label'}<Input aria-label={diagramType === 'state' ? 'Transition label' : 'Relationship label'} value={edgeLabel} disabled={isArmed} onValueChange={(value) => setEdgeLabels((current) => ({ ...current, [diagramType]: value }))} /></label>}
                {diagramType === 'er' && <label>Relationship line
                  <select aria-label="New relationship line" value={identifying ? 'identifying' : 'non-identifying'} disabled={isArmed} onChange={(event) => setIdentifying(event.currentTarget.value === 'identifying')}>
                    <option value="identifying">Identifying</option><option value="non-identifying">Non-identifying</option>
                  </select>
                </label>}
                <p className="mve-palette-help" role="status">{isArmed
                  ? pendingConnection?.source ? `From ${pendingConnection.source}: select a target node.` : 'Select a source node, then a target node on the canvas.'
                  : 'Set relationship options, then select this tool and choose two nodes on the canvas.'}</p>
                {isArmed && <Button type="button" onClick={() => onArmConnection(null)}>Cancel relationship</Button>}
              </div>}
            </div>;
          })}
        </section>
      )) : palette.length ? Object.entries(groupedPalette).map(([group, entries]) => (
        <section className="mve-palette-group" key={group}>
          <h3>{group}</h3>
          {entries.map((entry) => <DraggablePaletteButton id={`snippet:${diagramType}:${group}:${entry.label}`} key={`${group}:${entry.label}`}
            label={entry.label} icon={entry.icon} title={entry.snippet} disabled={!canEdit}
            action={{ type: 'insert-palette-entry', snippet: entry.snippet, ...(entry.paletteItem ? { paletteItem: entry.paletteItem } : {}) }}
            onClick={() => dispatch({ type: 'insert-palette-entry', snippet: entry.snippet, ...(entry.paletteItem ? { paletteItem: entry.paletteItem } : {}) })} />)}
        </section>
      )) : (
        <p className="mve-palette-help">Edit this diagram in the Mermaid source panel.</p>
      )}
      {model.parseState === 'unsupported' && <p className="mve-palette-help">This diagram type is not supported by the visual tools.</p>}
      <p className="mve-palette-help">Current type: {diagramTypes.find((item) => item.id === diagramType)?.label ?? 'Unknown'}</p>
    </aside>
  );
}
