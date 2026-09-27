import { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import type { MermaidVisualEditorOptions, EditorError, EditorSelection } from '../runtime/types';
import { EditorController } from '@mermaid-editor/headless';
import type { DiagramAction } from '@mermaid-editor/headless';
import { SourceDocument } from '@mermaid-editor/headless';
import { getDiagramElementIdForSelection } from '@mermaid-editor/headless';
import { MermaidRendererError } from '../renderer/mermaid-renderer';
import { templates, type EditableDiagramType } from '@mermaid-editor/headless';
import { useDiagramSession } from './hooks/useDiagramSession';
import { EditorSessionProvider, useEditorController } from './context/editor-session-context';
import { EditorShell } from './components/EditorShell';
import { ToolSidebar } from './components/ToolSidebar';
import { MermaidCanvas } from './components/MermaidCanvas';
import { SourceEditor } from './components/SourceEditor';
import { SelectionEditor } from './components/SelectionEditor';
import { EditorStatus, type EditorStatusState } from './components/EditorStatus';
import { DiagramTypeSelect } from './components/DiagramTypeSelect';
import type { EdgeConnectionOptions } from './components/DiagramPalette';

interface PendingConnection {
  readonly diagramType: EditableDiagramType;
  readonly source?: string;
  readonly options: EdgeConnectionOptions;
}

export interface MermaidEditorProps extends Omit<MermaidVisualEditorOptions, 'value'> {
  readonly value: string;
  readonly className?: string;
  readonly title?: string;
}

export function MermaidEditor(props: MermaidEditorProps) {
  const [controller] = useState(() => new EditorController(props.value));
  return (
    <EditorSessionProvider controller={controller}>
      <MermaidEditorSession {...props} />
    </EditorSessionProvider>
  );
}

function MermaidEditorSession({ value, onChange, onSelectionChange, onError, onSave, onReset, onRemove, className, title }: MermaidEditorProps) {
  const controller = useEditorController();
  const session = controller.session;
  const { snapshot, dispatch, undo, redo, setSource } = useDiagramSession();
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [editingSelection, setEditingSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [status, setStatus] = useState<{ state: EditorStatusState; message: string }>({ state: 'loading', message: 'Preparing diagram…' });
  const callbacks = useRef({ onChange, onSelectionChange, onError, onSave, onReset, onRemove });
  callbacks.current = { onChange, onSelectionChange, onError, onSave, onReset, onRemove };
  const selectionRef = useRef<EditorSelection | null>(null);
  const pendingConnectionRef = useRef<PendingConnection | null>(null);
  const savingRef = useRef(false);
  const currentTemplate = snapshot.model.diagramType === 'unknown' || snapshot.model.diagramType === 'unsupported'
    ? undefined : templates[snapshot.model.diagramType];
  const wouldDiscardSource = Boolean(snapshot.codeBlock.source.trim()) && snapshot.codeBlock.source !== currentTemplate;

  const reportError = useCallback((error: EditorError) => {
    try { callbacks.current.onError?.(error); } catch { /* Host error handlers must not interrupt editor state updates. */ }
  }, []);

  const updateSelection = useCallback((next: EditorSelection | null) => {
    selectionRef.current = next;
    setSelection(next);
    try { callbacks.current.onSelectionChange?.(next); } catch (cause) {
      reportError({ code: 'mutation', message: cause instanceof Error ? `Selection callback failed: ${cause.message}` : 'Selection callback failed.', cause });
    }
  }, [reportError]);

  const clearSelection = useCallback(() => {
    if (selectionRef.current) updateSelection(null);
    setEditingSelection(false);
    pendingConnectionRef.current = null;
    setPendingConnection(null);
  }, [updateSelection]);

  useEffect(() => {
    controller.setOnChange((source) => {
      try { callbacks.current.onChange?.(source); } catch (cause) {
        reportError({ code: 'mutation', message: cause instanceof Error ? `Change callback failed: ${cause.message}` : 'Change callback failed.', cause });
      }
    });
    controller.start();
    return () => controller.stop();
  }, [controller, reportError]);

  useEffect(() => {
    if (value !== session.getSnapshot().codeBlock.source) {
      controller.setHostValue(value);
      clearSelection();
    }
  }, [value, controller, session, clearSelection]);

  const renderState = useCallback((nextState: EditorStatusState, message: string, cause?: unknown) => {
    setStatus((current) => current.state === nextState && current.message === message ? current : { state: nextState, message });
    if (nextState === 'error') {
      const error: EditorError = { code: cause instanceof MermaidRendererError && cause.stage === 'parse' ? 'parse' : 'render', message, ...(cause === undefined ? {} : { cause }) };
      reportError(error);
    }
  }, [reportError]);

  const applyParseResult = useCallback((sourceRevision: number, valid: boolean) => {
    session.setParseResult(sourceRevision, valid);
  }, [session]);

  const dispatchAction = useCallback((action: DiagramAction, preserveSelection = false): string | undefined => {
    try {
      const next = dispatch(action);
      if (next && !preserveSelection) clearSelection();
      return next;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The diagram edit could not be applied.';
      setStatus({ state: 'error', message });
      reportError({ code: 'mutation', message, cause });
      return undefined;
    }
  }, [clearSelection, dispatch, reportError]);

  const dispatchPreservingSelection = useCallback((action: DiagramAction): string | undefined => dispatchAction(action, true), [dispatchAction]);

  const armConnection = useCallback((options: EdgeConnectionOptions | null) => {
    const type = snapshot.model.diagramType;
    if (!options || type === 'unknown' || type === 'unsupported') {
      pendingConnectionRef.current = null;
      setPendingConnection(null);
      setStatus({ state: 'ready', message: 'Diagram ready.' });
      return;
    }
    if (snapshot.model.parseState !== 'parsed') return;
    const pending: PendingConnection = { diagramType: type, options };
    pendingConnectionRef.current = pending;
    setPendingConnection(pending);
    setStatus({ state: 'ready', message: 'Select a source node, then a target node on the canvas.' });
  }, [snapshot.model.diagramType, snapshot.model.parseState]);

  const handleCanvasSelection = useCallback((next: EditorSelection | null) => {
    updateSelection(next);
    const pending = pendingConnectionRef.current;
    if (!pending || next?.kind !== 'node' || next.diagramType !== pending.diagramType) return;
    if (!pending.source) {
      const armed = { ...pending, source: next.id };
      pendingConnectionRef.current = armed;
      setPendingConnection(armed);
      setStatus({ state: 'ready', message: `From ${next.id}: select a target node.` });
      return;
    }
    if (pending.source === next.id) {
      setStatus({ state: 'ready', message: `Choose a node other than ${next.id} as the target.` });
      return;
    }
    pendingConnectionRef.current = null;
    setPendingConnection(null);
    const nextSource = dispatchAction({ type: 'create-edge', source: pending.source, target: next.id, ...pending.options });
    if (nextSource) setStatus({ state: 'ready', message: 'Relationship added.' });
  }, [dispatchAction, updateSelection]);

  const applySourceMutation = useCallback((mutate: (source: SourceDocument) => string, remove = false): boolean => {
    const current = session.getSnapshot().codeBlock.source;
    const currentType = session.getSnapshot().model.diagramType;
    if (currentType === 'unknown' || currentType === 'unsupported') return false;
    try {
      const document = new SourceDocument(current, currentType);
      const next = document.serializeMutation(mutate(document));
      if (next !== current) {
        const removedSelection = remove ? selectionRef.current : null;
        setSource(next, 'diagram-action');
        clearSelection();
        if (removedSelection) {
          const result = callbacks.current.onRemove?.(removedSelection, next);
          if (result && typeof result.then === 'function') void result.catch((cause: unknown) => {
            reportError({ code: 'mutation', message: cause instanceof Error ? cause.message : 'Remove callback failed.', cause });
          });
        }
      }
      return true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The diagram edit could not be applied.';
      setStatus({ state: 'error', message });
      reportError({ code: 'mutation', message, cause });
      return false;
    }
  }, [clearSelection, reportError, session, setSource]);

  const resetDiagram = useCallback(() => {
    const type = snapshot.model.diagramType;
    if (type === 'unknown' || type === 'unsupported') return;
    if (wouldDiscardSource && !window.confirm('Replace the current source with the default diagram template? This change can be undone.')) return;
    const next = templates[type as EditableDiagramType];
    setSource(next, 'diagram-action');
    clearSelection();
    setStatus({ state: 'ready', message: `${type} diagram reset.` });
    void Promise.resolve().then(() => callbacks.current.onReset?.(next)).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : 'Reset callback failed.';
      setStatus({ state: 'error', message });
      reportError({ code: 'mutation', message, cause });
    });
  }, [clearSelection, reportError, setSource, snapshot.model.diagramType, wouldDiscardSource]);

  const changeDiagramType = useCallback((type: EditableDiagramType) => {
    if (type === snapshot.model.diagramType) return;
    if (wouldDiscardSource && !window.confirm('Changing diagram type replaces the current source. Continue?')) return;
    setSource(templates[type], 'diagram-action');
    clearSelection();
  }, [clearSelection, setSource, snapshot.model.diagramType, wouldDiscardSource]);

  const save = useCallback(() => {
    const callback = callbacks.current.onSave;
    if (!callback) {
      setStatus({ state: 'source-only', message: 'Save is unavailable until the host provides an onSave callback.' });
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setStatus({ state: 'loading', message: 'Saving diagram…' });
    void Promise.resolve().then(() => callback(snapshot.codeBlock.source)).then(() => setStatus({ state: 'ready', message: 'Save request completed.' })).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : 'Save failed.';
      setStatus({ state: 'error', message: `Save failed: ${message}` });
      reportError({ code: 'save', message, cause });
    }).finally(() => { savingRef.current = false; setIsSaving(false); });
  }, [reportError, snapshot.codeBlock.source]);

  const notifyRemove = useCallback((item: NonNullable<EditorSelection>, nextSource: string) => {
    void Promise.resolve().then(() => callbacks.current.onRemove?.(item, nextSource)).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : 'Remove callback failed.';
      setStatus({ state: 'error', message });
      reportError({ code: 'mutation', message, cause });
    });
  }, [reportError]);

  const handleEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    const editingText = target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    if (!editingText && !editingSelection && (event.key === 'Delete' || event.key === 'Backspace')) {
      const current = selectionRef.current;
      if (!current) return;
      const selectedId = getDiagramElementIdForSelection(snapshot.model.elements, current);
      const nextSource = current.kind === 'edge'
        ? selectedId ? dispatchAction({ type: 'delete-edge', id: selectedId }) : undefined
        : current.kind === 'node'
          ? dispatchAction({ type: 'delete-node', id: `${current.diagramType}:node:${encodeURIComponent(current.id)}` })
          : dispatchAction({ type: 'delete-subgraph', id: `${current.diagramType}:subgraph:${encodeURIComponent(current.id)}` });
      if (nextSource) {
        event.preventDefault();
        notifyRemove(current, nextSource);
      }
      return;
    }
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === 's') {
      event.preventDefault();
      save();
      return;
    }
    if (key !== 'z' && key !== 'y') return;
    if (editingText) return;
    event.preventDefault();
    clearSelection();
    if (key === 'y' || event.shiftKey) redo();
    else undo();
  }, [clearSelection, dispatchAction, editingSelection, notifyRemove, redo, save, snapshot.model.elements, undo]);

  return (
    <DragDropProvider onDragEnd={(event) => {
      if (event.canceled) return;
      const sourceData = event.operation.source?.data as { kind?: string; action?: DiagramAction } | undefined;
      const targetData = event.operation.target?.data as { kind?: string } | undefined;
      if (sourceData?.kind === 'diagram-action' && targetData?.kind === 'diagram-canvas' && sourceData.action) {
        let action = sourceData.action;
        const nativeEvent = event.nativeEvent;
        if (action.type === 'create-node' && snapshot.model.diagramType === 'flowchart'
          && nativeEvent && 'clientX' in nativeEvent && 'clientY' in nativeEvent) {
          const shape = action.shape;
          const dragSource = event.operation.source?.element;
          const editorRoot = dragSource?.closest('.mve-root');
          const hit = document.elementFromPoint(Number(nativeEvent.clientX), Number(nativeEvent.clientY));
          const preview = editorRoot?.querySelector('.mve-preview');
          const nodeHit = hit?.closest('svg g.node');
          if (preview && nodeHit && preview.contains(nodeHit)) {
            nodeHit.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              clientX: Number(nativeEvent.clientX),
              clientY: Number(nativeEvent.clientY),
            }));
            const anchor = selectionRef.current;
            if (anchor?.kind === 'node' && anchor.diagramType === 'flowchart') {
              action = { type: 'create-connected-node', source: anchor.id, ...(shape ? { shape } : {}) };
            }
          }
        }
        dispatchAction(action);
      }
    }}>
      <EditorShell title={title} className={className} onKeyDown={handleEditorKeyDown}
        sidebar={<ToolSidebar model={snapshot.model} dispatch={dispatchAction} {...(pendingConnection ? { pendingConnection } : {})} onArmConnection={armConnection} />}
        headerControls={<DiagramTypeSelect model={snapshot.model} onChange={changeDiagramType} />}
        canvas={<MermaidCanvas source={snapshot.codeBlock.source} sourceRevision={snapshot.codeBlock.revision} model={snapshot.model} onSelection={handleCanvasSelection} onRenderState={renderState} onSourceMutation={applySourceMutation} onParseResult={applyParseResult} {...(onSave ? { onSave: save } : {})} isSaving={isSaving} onReset={resetDiagram} onEditSelection={() => { if (selectionRef.current) setEditingSelection(true); }} {...(pendingConnection ? { pendingConnection } : {})} />}
        selection={<SelectionEditor open={editingSelection} onClose={() => setEditingSelection(false)} selection={selection} model={snapshot.model} dispatch={dispatchAction} dispatchPreservingSelection={dispatchPreservingSelection} onDelete={notifyRemove} />}
        source={<SourceEditor value={snapshot.codeBlock.source} onChange={(source) => { setSource(source, 'source-editor'); clearSelection(); }} />}
        status={<EditorStatus state={status.state} message={status.message} />}
        />
    </DragDropProvider>
  );
}
