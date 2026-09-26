import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { Input } from '@base-ui/react/input';
import type { Control } from 'react-hook-form';
import type { DiagramAction, DiagramSemanticElement, FlowchartNodeShape, RendererModel } from '../../core/diagram-model';
import { getDiagramElementIdForSelection } from '../../core/selection-mapping';
import type { EditorSelection } from '../../runtime/types';
import type { ERCardinality } from '../../source/er-mutations';

const editorFormSchema = z.object({
  kind: z.enum(['node', 'edge', 'subgraph']),
  id: z.string(),
  label: z.string(),
  from: z.string(),
  to: z.string(),
  operator: z.string(),
  shape: z.enum(['bare', 'rect', 'round', 'diamond', 'circle', 'stadium', 'subroutine', 'database', 'hexagon']),
  fill: z.string(),
  stroke: z.string(),
  borderType: z.enum(['default', 'solid', 'dashed', 'dotted']),
  title: z.string(),
  identifying: z.boolean(),
}).superRefine((value, context) => {
  if (value.kind === 'node' && !value.id.trim()) context.addIssue({ code: 'custom', path: ['id'], message: 'Identifier is required.' });
  if (value.kind === 'edge') {
    if (!value.from.trim()) context.addIssue({ code: 'custom', path: ['from'], message: 'Source is required.' });
    if (!value.to.trim()) context.addIssue({ code: 'custom', path: ['to'], message: 'Target is required.' });
  }
  if (value.kind === 'subgraph' && !value.id.trim()) context.addIssue({ code: 'custom', path: ['id'], message: 'Identifier is required.' });
});

type EditorForm = z.infer<typeof editorFormSchema>;
type TextFieldName = 'id' | 'label' | 'from' | 'to' | 'operator' | 'fill' | 'stroke' | 'title';

interface TextFieldProps {
  readonly control: Control<EditorForm>;
  readonly name: TextFieldName;
  readonly label: string;
}

function TextField({ control, name, label, multiline = false }: TextFieldProps & { readonly multiline?: boolean }) {
  return <label>{label}<Controller control={control} name={name} render={({ field }) => (
    multiline
      ? <textarea name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)} />
      : <Input name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
  )} /></label>;
}

const flowchartOperators = ['-->', '---', '-.->', '==>', '--o', '--x', '<--', '<-->'];
const classOperators = ['<|--', '--|>', '*--', '--*', 'o--', '--o', '<--', '-->', '<..', '..>', '<|..', '..|>', '--', '..'];
const erCardinalities = ['one-one', 'one-many', 'many-many', 'zero-one', 'one-or-many'];

function borderTypeValue(value?: string): EditorForm['borderType'] {
  if (value === '0' || value === 'solid') return 'solid';
  if (value === '6 4' || value === 'dashed') return 'dashed';
  if (value === '2 3' || value === 'dotted') return 'dotted';
  return 'default';
}

export interface SelectionEditorProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selection: EditorSelection | null;
  readonly model: RendererModel;
  readonly dispatch: (action: DiagramAction) => string | undefined;
  readonly onDelete?: (selection: EditorSelection, nextSource: string) => void | Promise<void>;
}

export function SelectionEditor({ open, onClose, selection, model, dispatch, onDelete }: SelectionEditorProps) {
  const [memberDrafts, setMemberDrafts] = useState<Record<string, string>>({});
  const [attributeDrafts, setAttributeDrafts] = useState<Record<string, { type: string; name: string; key: string; comment: string }>>({});
  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditorForm>({
    resolver: zodResolver(editorFormSchema),
    defaultValues: { kind: 'node', id: '', label: '', from: '', to: '', operator: '', shape: 'rect', fill: '', stroke: '', borderType: 'default', title: '', identifying: true },
  });
  const nodeId = selection?.kind === 'node' ? selection.id : '';
  const selectedElementId = selection ? getDiagramElementIdForSelection(model.elements, selection) : undefined;
  const selectedNode = selection?.kind === 'node' ? model.elements.find((item) => item.kind === 'node' && item.id === selectedElementId) : undefined;
  const selectedEdge = selection?.kind === 'edge' ? model.elements.find((item) => item.kind === 'edge' && item.id === selectedElementId) : undefined;
  const selectedSubgraph = selection?.kind === 'subgraph' ? model.elements.find((item) => item.kind === 'subgraph' && item.id === selectedElementId) : undefined;
  const members = selection?.kind === 'node' && selection.diagramType === 'class'
    ? model.elements.filter((item): item is DiagramSemanticElement => item.kind === 'semantic' && item.semanticType === 'member' && item.attributes.owner === selection.id)
    : [];
  const attributes = selection?.kind === 'node' && selection.diagramType === 'er'
    ? model.elements.filter((item): item is DiagramSemanticElement => item.kind === 'semantic' && item.semanticType === 'attribute' && item.attributes.entity === selection.id)
    : [];

  useEffect(() => {
    if (selection?.kind === 'node') {
      reset({ kind: 'node', id: selection.id, label: selectedNode?.kind === 'node' ? selectedNode.label : '', from: '', to: '', operator: '', shape: selectedNode?.kind === 'node' ? selectedNode.shape ?? 'rect' : 'rect', fill: selectedNode?.kind === 'node' ? selectedNode.attributes.fill ?? '' : '', stroke: selectedNode?.kind === 'node' ? selectedNode.attributes.stroke ?? '' : '', borderType: borderTypeValue(selectedNode?.kind === 'node' ? selectedNode.attributes.borderType : ''), title: '', identifying: true });
    } else if (selection?.kind === 'edge') {
      reset({ kind: 'edge', id: '', label: selectedEdge?.kind === 'edge' ? selectedEdge.label : '', from: selection.source, to: selection.target, operator: selectedEdge?.kind === 'edge' ? selectedEdge.operator : '', shape: 'rect', fill: '', stroke: selectedEdge?.kind === 'edge' ? selectedEdge.attributes.stroke ?? '' : '', borderType: 'default', title: '', identifying: selectedEdge?.attributes.identifying !== 'false' });
    } else if (selection?.kind === 'subgraph') {
      reset({ kind: 'subgraph', id: selection.id, label: '', from: '', to: '', operator: '', shape: 'rect', fill: selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.fill ?? '' : '', stroke: selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.stroke ?? '' : '', borderType: borderTypeValue(selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.borderType : ''), title: selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.label : selection.title ?? selection.id, identifying: true });
    } else {
      reset({ kind: 'node', id: '', label: '', from: '', to: '', operator: '', shape: 'rect', fill: '', stroke: '', borderType: 'default', title: '', identifying: true });
    }
    setMemberDrafts(Object.fromEntries(members.map((member) => [member.id, member.statement])));
    setAttributeDrafts(Object.fromEntries(attributes.map((attribute) => [attribute.id, {
      type: attribute.attributes.type ?? 'string', name: attribute.attributes.name ?? '',
      key: attribute.attributes.key ?? '', comment: attribute.attributes.comment ?? '',
    }])));
  }, [open, selection, selectedNode, selectedEdge, selectedSubgraph, model.elements, reset]);

  const remove = (): void => {
    if (!selection) return;
    const next = selection.kind === 'edge'
      ? selectedEdge?.kind === 'edge' ? dispatch({ type: 'delete-edge', id: selectedEdge.id }) : undefined
      : selection.kind === 'node' ? dispatch({ type: 'delete-node', id: `${selection.diagramType}:node:${encodeURIComponent(selection.id)}` })
      : dispatch({ type: 'delete-subgraph', id: `${selection.diagramType}:subgraph:${encodeURIComponent(selection.id)}` });
    if (next) {
      void onDelete?.(selection, next);
    }
  };

  const apply = (values: EditorForm): void => {
    if (selection?.kind === 'node' && values.kind === 'node') {
      const patch = {
        ...(values.id !== selection.id ? { id: values.id } : {}),
        ...(selection.diagramType === 'flowchart' && values.label !== (selectedNode?.kind === 'node' ? selectedNode.label : '') ? { label: values.label } : {}),
        ...(selection.diagramType === 'flowchart' && values.shape !== (selectedNode?.kind === 'node' ? selectedNode.shape ?? 'rect' : 'rect') ? { shape: values.shape } : {}),
        ...(values.fill !== (selectedNode?.kind === 'node' ? selectedNode.attributes.fill ?? '' : '') ? { fill: values.fill } : {}),
        ...(values.stroke !== (selectedNode?.kind === 'node' ? selectedNode.attributes.stroke ?? '' : '') ? { stroke: values.stroke } : {}),
        ...(values.borderType !== borderTypeValue(selectedNode?.kind === 'node' ? selectedNode.attributes.borderType : '') ? { borderType: values.borderType } : {}),
      };
      if (!Object.keys(patch).length) { onClose(); return; }
      const next = dispatch({ type: 'update-node', id: `${selection.diagramType}:node:${encodeURIComponent(nodeId)}`, patch });
      if (next) {
        onClose();
      }
    } else if (selection?.kind === 'edge' && selectedEdge?.kind === 'edge' && values.kind === 'edge') {
      const unchanged = values.from === selection.source && values.to === selection.target
        && (selection.diagramType === 'class' || values.label === selectedEdge.label)
        && (selection.diagramType === 'er'
          ? values.operator === selectedEdge.operator && values.identifying === (selectedEdge.attributes.identifying !== 'false')
          : selection.diagramType === 'state' || values.operator === selectedEdge.operator)
        && (selection.diagramType !== 'flowchart' || values.stroke === (selectedEdge.attributes.stroke ?? ''));
      if (unchanged) { onClose(); return; }
      const next = selection.diagramType === 'er' ? dispatch({ type: 'update-edge', id: selectedEdge.id, patch: {
        source: values.from, target: values.to, label: values.label,
        cardinality: values.operator as ERCardinality, identifying: values.identifying,
      } }) : dispatch({ type: 'update-edge', id: selectedEdge.id, patch: {
        source: values.from, target: values.to,
        ...(selection.diagramType !== 'class' ? { label: values.label } : {}),
        ...(selection.diagramType === 'state' ? {} : { operator: values.operator }),
        ...(selection.diagramType === 'flowchart' && values.stroke !== (selectedEdge.attributes.stroke ?? '') ? { stroke: values.stroke } : {}),
      } });
      if (next) onClose();
    } else if (selection?.kind === 'subgraph' && values.kind === 'subgraph') {
      const patch = {
        ...(values.id !== selection.id ? { id: values.id } : {}),
        ...(values.title !== (selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.label : selection.title ?? selection.id) ? { title: values.title } : {}),
        ...(values.fill !== (selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.fill ?? '' : '') ? { fill: values.fill } : {}),
        ...(values.stroke !== (selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.stroke ?? '' : '') ? { stroke: values.stroke } : {}),
        ...(values.borderType !== borderTypeValue(selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.borderType : '') ? { borderType: values.borderType } : {}),
      };
      if (!Object.keys(patch).length) { onClose(); return; }
      const next = dispatch({ type: 'update-subgraph', id: `${selection.diagramType}:subgraph:${encodeURIComponent(selection.id)}`, patch });
      if (next) {
        onClose();
      }
    }
  };

  const errorMessage = Object.values(errors).map((error) => error?.message).find((message) => typeof message === 'string');
  const dialogTitle = !selection ? 'Edit selection'
    : selection.kind === 'node' ? `Edit ${selection.diagramType} node ${selection.id}`
      : selection.kind === 'edge' ? `Edit ${selection.diagramType} relationship ${selection.source} → ${selection.target}`
        : `Edit flowchart subgraph ${selection.title ?? selection.id}`;

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="mve-edit-backdrop" />
        <Dialog.Popup className="mve-selection-editor mve-edit-dialog" aria-label="Selection editor" onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.querySelector('form')?.requestSubmit();
          }
        }}>
      <header><Dialog.Title>{dialogTitle}</Dialog.Title><Dialog.Close render={<Button type="button" aria-label="Close selection editor">×</Button>} /></header>
      {!selection ? <p>Select a supported node or relationship to edit its properties.</p> : selection.kind === 'node' ? (
        <form className="mve-edit-fields" onSubmit={handleSubmit(apply)}>
          {selection.diagramType === 'flowchart' && <TextField control={control} name="label" label="Label" multiline />}
          <TextField control={control} name="id" label="Identifier" />
          {selection.diagramType === 'flowchart' && <label>Shape<Controller control={control} name="shape" render={({ field }) => (
            <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
              <option value="bare">Bare</option><option value="rect">Rectangle</option><option value="round">Rounded</option><option value="diamond">Diamond</option><option value="circle">Circle</option><option value="stadium">Stadium</option><option value="subroutine">Subroutine</option><option value="database">Database</option><option value="hexagon">Hexagon</option>
            </select>
          )} /></label>}
          <TextField control={control} name="fill" label="Fill color" />
          <TextField control={control} name="stroke" label="Border color" />
          <label>Border line<Controller control={control} name="borderType" render={({ field }) => (
            <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
              <option value="default">Default</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
            </select>
          )} /></label>
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <div><Button type="submit">Apply</Button> <Button type="button" aria-label={`Delete ${selection.diagramType} node ${selection.id}`} onClick={remove}>Delete</Button></div>
          {selection.diagramType === 'class' && <section className="mve-child-elements"><h3>Class members</h3>
            {members.map((member) => <div className="mve-child-element" key={member.id}>
              <Input aria-label="Class member" value={memberDrafts[member.id] ?? member.statement} onValueChange={(value) => setMemberDrafts((current) => ({ ...current, [member.id]: value }))} />
              <Button type="button" onClick={() => dispatch({ type: 'update-class-member', classId: selection.id, oldMember: member.statement, newMember: memberDrafts[member.id] ?? member.statement })}>Apply member</Button>
              <Button type="button" aria-label={`Delete class member ${member.id}`} onClick={() => dispatch({ type: 'delete-class-member', classId: selection.id, member: member.statement })}>Delete</Button>
            </div>)}
            <Button type="button" onClick={() => dispatch({ type: 'create-class-member', classId: selection.id })}>Add member</Button>
          </section>}
          {selection.diagramType === 'er' && <section className="mve-child-elements"><h3>Entity attributes</h3>
            {attributes.map((attribute) => {
              const draft = attributeDrafts[attribute.id] ?? { type: 'string', name: '', key: '', comment: '' };
              const occurrence = Number(attribute.attributes.occurrence ?? 0);
              return <div className="mve-child-element" key={attribute.id}>
                <Input aria-label="Attribute type" value={draft.type} onValueChange={(type) => setAttributeDrafts((current) => ({ ...current, [attribute.id]: { ...draft, type } }))} />
                <Input aria-label="Attribute name" value={draft.name} onValueChange={(name) => setAttributeDrafts((current) => ({ ...current, [attribute.id]: { ...draft, name } }))} />
                <Input aria-label="Attribute key" value={draft.key} onValueChange={(key) => setAttributeDrafts((current) => ({ ...current, [attribute.id]: { ...draft, key } }))} />
                <Input aria-label="Attribute comment" value={draft.comment} onValueChange={(comment) => setAttributeDrafts((current) => ({ ...current, [attribute.id]: { ...draft, comment } }))} />
                <Button type="button" onClick={() => dispatch({ type: 'update-er-attribute', entity: selection.id, name: attribute.attributes.name ?? '', occurrence, patch: draft })}>Apply attribute</Button>
                <Button type="button" aria-label={`Delete ER attribute ${attribute.attributes.name ?? ''}`} onClick={() => dispatch({ type: 'delete-er-attribute', entity: selection.id, name: attribute.attributes.name ?? '', occurrence })}>Delete</Button>
              </div>;
            })}
            <Button type="button" onClick={() => dispatch({ type: 'create-er-attribute', entity: selection.id })}>Add attribute</Button>
          </section>}
        </form>
      ) : selection.kind === 'edge' ? (
        <form className="mve-edit-fields" onSubmit={handleSubmit(apply)}>
          <TextField control={control} name="from" label="From" />
          <TextField control={control} name="to" label="To" />
          {selection.diagramType !== 'class' && <TextField control={control} name="label" label="Label" multiline />}
          {selection.diagramType === 'flowchart' && <TextField control={control} name="stroke" label="Line color" />}
          {selection.diagramType === 'er' ? <>
            <label>Cardinality<Controller control={control} name="operator" render={({ field }) => (
              <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
                {erCardinalities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            )} /></label>
            <label>Relationship line<Controller control={control} name="identifying" render={({ field }) => (
              <select name={field.name} ref={field.ref} value={field.value ? 'identifying' : 'non-identifying'} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value === 'identifying')}>
                <option value="identifying">Identifying</option><option value="non-identifying">Non-identifying</option>
              </select>
            )} /></label>
          </> : selection.diagramType === 'flowchart' || selection.diagramType === 'class' ? <label>{selection.diagramType === 'class' ? 'Relationship type' : 'Line type'}<Controller control={control} name="operator" render={({ field }) => {
            const options = selection.diagramType === 'class' ? classOperators : flowchartOperators;
            return <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
              {options.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>;
          }} /></label> : null}
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <div><Button type="submit">Apply</Button> <Button type="button" aria-label={`Delete ${selection.diagramType} relationship from ${selection.source} to ${selection.target}`} onClick={remove}>Delete</Button></div>
        </form>
      ) : (
        <form className="mve-edit-fields" onSubmit={handleSubmit(apply)}>
          <TextField control={control} name="id" label="Identifier" />
          <TextField control={control} name="title" label="Title" multiline />
          <TextField control={control} name="fill" label="Fill color" />
          <TextField control={control} name="stroke" label="Border color" />
          <label>Border line<Controller control={control} name="borderType" render={({ field }) => (
            <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
              <option value="default">Default</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
            </select>
          )} /></label>
          {errorMessage && <p role="alert">{errorMessage}</p>}
          <div><Button type="submit">Apply</Button> <Button type="button" aria-label={`Delete flowchart subgraph ${selection.id}`} onClick={remove}>Delete</Button></div>
        </form>
      )}
      <footer className="mve-edit-dialog-actions"><Dialog.Close render={<Button type="button">Cancel</Button>} /></footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
