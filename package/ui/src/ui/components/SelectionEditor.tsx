import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TinyColor } from '@ctrl/tinycolor';
import { z } from 'zod';
import { useEffect, useId, useMemo } from 'react';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { Input } from '@base-ui/react/input';
import type { Control } from 'react-hook-form';
import type { DiagramAction, DiagramSemanticElement, RendererModel } from '@mermaid-editor-sdk/headless';
import { getDiagramElementIdForSelection } from '@mermaid-editor-sdk/headless';
import type { EditorSelection } from '../../runtime/types';
import type { ERCardinality } from '@mermaid-editor-sdk/headless';

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
  members: z.array(z.object({ id: z.string(), originalStatement: z.string(), statement: z.string() })),
  attributes: z.array(z.object({ id: z.string(), sourceName: z.string(), occurrence: z.number(), type: z.string(), name: z.string(), key: z.string(), comment: z.string() })),
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

function colorPickerValue(value: string): string {
  const color = new TinyColor(value);
  return color.isValid ? color.toHexString() : '#000000';
}

interface TextFieldProps {
  readonly control: Control<EditorForm>;
  readonly name: TextFieldName;
  readonly label: string;
  readonly inputType?: 'text' | 'color';
  readonly multiline?: boolean;
  readonly emptyColor?: string;
}

function TextField({ control, name, label, inputType = 'text', multiline = false, emptyColor = '#000000' }: TextFieldProps) {
  return <label>{label}<Controller control={control} name={name} render={({ field }) => (
    multiline
      ? <textarea name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)} />
      : <Input className={inputType === 'color' ? 'mve-color-input' : undefined} type={inputType} name={field.name} ref={field.ref} value={inputType === 'color' ? colorPickerValue(field.value || emptyColor) : field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
  )} /></label>;
}

function BorderLineField({ control }: { readonly control: Control<EditorForm> }) {
  return <label>Border line<Controller control={control} name="borderType" render={({ field }) => (
    <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
      <option value="default">Default</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
    </select>
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
  readonly dispatchPreservingSelection?: (action: DiagramAction) => string | undefined;
  readonly onDelete?: (selection: EditorSelection, nextSource: string) => void | Promise<void>;
}

export function SelectionEditor({ open, onClose, selection, model, dispatch, dispatchPreservingSelection = dispatch, onDelete }: SelectionEditorProps) {
  const formId = useId();
  const { control, getValues, handleSubmit, reset, setValue, formState: { errors } } = useForm<EditorForm>({
    resolver: zodResolver(editorFormSchema),
    defaultValues: { kind: 'node', id: '', label: '', from: '', to: '', operator: '', shape: 'rect', fill: '', stroke: '', borderType: 'default', title: '', identifying: true, members: [], attributes: [] },
  });
  const { fields: memberFields } = useFieldArray({ control, name: 'members', keyName: 'fieldId' });
  const { fields: attributeFields } = useFieldArray({ control, name: 'attributes', keyName: 'fieldId' });
  const nodeId = selection?.kind === 'node' ? selection.id : '';
  const selectedElementId = selection ? getDiagramElementIdForSelection(model.elements, selection) : undefined;
  const selectedNode = selection?.kind === 'node' ? model.elements.find((item) => item.kind === 'node' && item.id === selectedElementId) : undefined;
  const selectedEdge = selection?.kind === 'edge' ? model.elements.find((item) => item.kind === 'edge' && item.id === selectedElementId) : undefined;
  const selectedSubgraph = selection?.kind === 'subgraph' ? model.elements.find((item) => item.kind === 'subgraph' && item.id === selectedElementId) : undefined;
  const classId = selection?.kind === 'node' && selection.diagramType === 'class' ? selection.id : undefined;
  const erEntityId = selection?.kind === 'node' && selection.diagramType === 'er' ? selection.id : undefined;
  const members = useMemo(() => classId
    ? model.elements.filter((item): item is DiagramSemanticElement => item.kind === 'semantic' && item.semanticType === 'member' && item.attributes.owner === classId)
    : [], [classId, model.elements]);
  const attributes = useMemo(() => erEntityId
    ? model.elements.filter((item): item is DiagramSemanticElement => item.kind === 'semantic' && item.semanticType === 'attribute' && item.attributes.entity === erEntityId)
    : [], [erEntityId, model.elements]);
  const nodeLabel = selectedNode?.kind === 'node' ? selectedNode.label : '';
  const nodeShape = selectedNode?.kind === 'node' ? selectedNode.shape ?? 'rect' : 'rect';
  const nodeFill = selectedNode?.kind === 'node' ? selectedNode.attributes.fill ?? '' : '';
  const nodeStroke = selectedNode?.kind === 'node' ? selectedNode.attributes.stroke ?? '' : '';
  const nodeBorderType = borderTypeValue(selectedNode?.kind === 'node' ? selectedNode.attributes.borderType : '');
  const edgeLabel = selectedEdge?.kind === 'edge' ? selectedEdge.label : '';
  const edgeOperator = selectedEdge?.kind === 'edge' ? selectedEdge.operator : '';
  const edgeStroke = selectedEdge?.kind === 'edge' ? selectedEdge.attributes.stroke ?? '' : '';
  const edgeIdentifying = selectedEdge?.attributes.identifying !== 'false';
  const subgraphLabel = selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.label : selection?.kind === 'subgraph' ? selection.title ?? selection.id : '';
  const subgraphFill = selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.fill ?? '' : '';
  const subgraphStroke = selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.stroke ?? '' : '';
  const subgraphBorderType = borderTypeValue(selectedSubgraph?.kind === 'subgraph' ? selectedSubgraph.attributes.borderType : '');
  const childDefaults = useMemo(() => ({
    members: members.map((member) => ({ id: member.id, originalStatement: member.statement, statement: member.statement })),
    attributes: attributes.map((attribute) => ({
      id: attribute.id,
      sourceName: attribute.attributes.name ?? '',
      occurrence: Number(attribute.attributes.occurrence ?? 0),
      type: attribute.attributes.type ?? 'string',
      name: attribute.attributes.name ?? '',
      key: attribute.attributes.key ?? '',
      comment: attribute.attributes.comment ?? '',
    })),
  }), [attributes, members]);

  useEffect(() => {
    if (selection?.kind === 'node') {
      reset({ kind: 'node', id: selection.id, label: nodeLabel, from: '', to: '', operator: '', shape: nodeShape, fill: nodeFill, stroke: nodeStroke, borderType: nodeBorderType, title: '', identifying: true, ...childDefaults });
    } else if (selection?.kind === 'edge') {
      reset({ kind: 'edge', id: '', label: edgeLabel, from: selection.source, to: selection.target, operator: edgeOperator, shape: 'rect', fill: '', stroke: edgeStroke, borderType: 'default', title: '', identifying: edgeIdentifying, ...childDefaults });
    } else if (selection?.kind === 'subgraph') {
      reset({ kind: 'subgraph', id: selection.id, label: '', from: '', to: '', operator: '', shape: 'rect', fill: subgraphFill, stroke: subgraphStroke, borderType: subgraphBorderType, title: subgraphLabel, identifying: true, ...childDefaults });
    } else {
      reset({ kind: 'node', id: '', label: '', from: '', to: '', operator: '', shape: 'rect', fill: '', stroke: '', borderType: 'default', title: '', identifying: true, ...childDefaults });
    }
  }, [open, selection, nodeLabel, nodeShape, nodeFill, nodeStroke, nodeBorderType, edgeLabel, edgeOperator, edgeStroke, edgeIdentifying, subgraphLabel, subgraphFill, subgraphStroke, subgraphBorderType, childDefaults, reset]);

  const remove = (): void => {
    if (!selection) return;
    const next = selection.kind === 'edge'
      ? selectedEdge?.kind === 'edge' ? dispatch({ type: 'delete-edge', id: selectedEdge.id }) : undefined
      : selection.kind === 'node' ? dispatch({ type: 'delete-node', id: `${selection.diagramType}:node:${encodeURIComponent(selection.id)}` })
      : dispatch({ type: 'delete-subgraph', id: `${selection.diagramType}:subgraph:${encodeURIComponent(selection.id)}` });
    if (next) {
      onClose();
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
      <div className="mve-dialog-body">
      {!selection ? <p>Select a supported node or relationship to edit its properties.</p> : selection.kind === 'node' ? (
        <form id={formId} className="mve-edit-fields" onSubmit={handleSubmit(apply)}>
          {selection.diagramType === 'flowchart' && <TextField control={control} name="label" label="Label" />}
          <TextField control={control} name="id" label="Identifier" />
          {selection.diagramType === 'flowchart' && <>
            <label>Shape<Controller control={control} name="shape" render={({ field }) => (
            <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
              <option value="bare">Bare</option><option value="rect">Rectangle</option><option value="round">Rounded</option><option value="diamond">Diamond</option><option value="circle">Circle</option><option value="stadium">Stadium</option><option value="subroutine">Subroutine</option><option value="database">Database</option><option value="hexagon">Hexagon</option>
            </select>
            )} /></label>
            <BorderLineField control={control} />
          </>}
          <TextField control={control} name="fill" label="Fill color" inputType="color" emptyColor="#ECECFF" />
          <TextField control={control} name="stroke" label="Border color" inputType="color" emptyColor="#9370DB" />
          {selection.diagramType !== 'flowchart' && <BorderLineField control={control} />}
          {errorMessage && <p role="alert">{errorMessage}</p>}
          {selection.diagramType === 'class' && <section className="mve-child-elements"><h3>Class members</h3>
            {memberFields.map((member, index) => <div className="mve-child-element mve-class-member" key={member.fieldId}>
              <label className="mve-child-field">Member<Controller control={control} name={`members.${index}.statement`} render={({ field }) => (
                <Input aria-label="Class member" value={field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
              )} /></label>
              <Button type="button" onClick={() => dispatchPreservingSelection({ type: 'update-class-member', classId: selection.id, oldMember: member.originalStatement, newMember: getValues(`members.${index}.statement`) })}>Apply member</Button>
              <Button type="button" aria-label={`Delete class member ${member.id}`} onClick={() => dispatchPreservingSelection({ type: 'delete-class-member', classId: selection.id, member: member.originalStatement })}>Delete</Button>
            </div>)}
            <Button type="button" onClick={() => dispatchPreservingSelection({ type: 'create-class-member', classId: selection.id })}>Add member</Button>
          </section>}
          {selection.diagramType === 'er' && <section className="mve-child-elements"><h3>Entity attributes</h3>
            {attributeFields.map((attribute, index) => {
              return <div className="mve-child-element mve-er-attribute" key={attribute.fieldId}>
                <label className="mve-child-field">Type<Controller control={control} name={`attributes.${index}.type`} render={({ field }) => (
                  <Input aria-label="Attribute type" value={field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
                )} /></label>
                <label className="mve-child-field">Name<Controller control={control} name={`attributes.${index}.name`} render={({ field }) => (
                  <Input aria-label="Attribute name" value={field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
                )} /></label>
                <label className="mve-child-field">Key<Controller control={control} name={`attributes.${index}.key`} render={({ field }) => (
                  <Input aria-label="Attribute key" value={field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
                )} /></label>
                <label className="mve-child-field">Comment<Controller control={control} name={`attributes.${index}.comment`} render={({ field }) => (
                  <Input aria-label="Attribute comment" value={field.value} onBlur={field.onBlur} onValueChange={field.onChange} />
                )} /></label>
                <div className="mve-child-actions">
                  <Button type="button" onClick={() => {
                    const currentAttribute = getValues(`attributes.${index}`);
                    const patch = {
                      type: currentAttribute.type,
                      name: currentAttribute.name,
                      key: currentAttribute.key,
                      comment: currentAttribute.comment,
                    };
                    dispatchPreservingSelection({ type: 'update-er-attribute', entity: selection.id, name: currentAttribute.sourceName, occurrence: currentAttribute.occurrence, patch });
                  }}>Apply attribute</Button>
                  <Button type="button" aria-label={`Delete ER attribute ${attribute.sourceName}`} onClick={() => dispatchPreservingSelection({ type: 'delete-er-attribute', entity: selection.id, name: attribute.sourceName, occurrence: attribute.occurrence })}>Delete</Button>
                </div>
              </div>;
            })}
            <Button type="button" onClick={() => dispatchPreservingSelection({ type: 'create-er-attribute', entity: selection.id })}>Add attribute</Button>
          </section>}
        </form>
      ) : selection.kind === 'edge' ? (
        <form id={formId} className="mve-edit-fields" onSubmit={handleSubmit(apply)}>
          <TextField control={control} name="from" label="From" />
          <TextField control={control} name="to" label="To" />
          {selection.diagramType !== 'class' && <TextField control={control} name="label" label="Label" />}
          {selection.diagramType === 'flowchart' && <div className="mve-clearable-color-field">
            <TextField control={control} name="stroke" label="Line color" inputType="color" emptyColor="#333333" />
            <Button type="button" aria-label="Clear edge line color" onClick={() => setValue('stroke', '', { shouldDirty: true })}>Clear</Button>
          </div>}
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
        </form>
      ) : (
        <form id={formId} className="mve-edit-fields" onSubmit={handleSubmit(apply)}>
          <TextField control={control} name="id" label="Identifier" />
          <TextField control={control} name="title" label="Title" multiline />
          <TextField control={control} name="fill" label="Fill color" inputType="color" emptyColor="#ECECFF" />
          <TextField control={control} name="stroke" label="Border color" inputType="color" emptyColor="#9370DB" />
          <label>Border line<Controller control={control} name="borderType" render={({ field }) => (
            <select name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(event.currentTarget.value)}>
              <option value="default">Default</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
            </select>
          )} /></label>
          {errorMessage && <p role="alert">{errorMessage}</p>}
        </form>
      )}
      </div>
      <footer className="mve-edit-dialog-actions">
        <div>{selection && <Button type="button" aria-label={selection.kind === 'edge'
          ? `Delete ${selection.diagramType} relationship from ${selection.source} to ${selection.target}`
          : selection.kind === 'node' ? `Delete ${selection.diagramType} node ${selection.id}`
            : `Delete flowchart subgraph ${selection.id}`} onClick={remove}>Delete</Button>}</div>
        <div>
          <Dialog.Close render={<Button type="button">Cancel</Button>} />
          {selection && <Button type="submit" form={formId}>Apply</Button>}
        </div>
      </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
