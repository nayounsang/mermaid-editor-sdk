import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@base-ui/react/button';
import { useDroppable } from '@dnd-kit/react';
import type { RendererModel } from '@mermaid-editor-sdk/headless';
import { getDiagramAdapter } from '../../diagrams/adapter';
import type { AdapterDiagramType } from '../../diagrams/adapter';
import { registerBuiltInAdapters } from '../../diagrams/register-built-in-adapters';
import { SourceDocument } from '@mermaid-editor-sdk/headless';
import type { EditorSelection } from '../../runtime/types';
import type { EditableDiagramType } from '@mermaid-editor-sdk/headless';
import { MermaidRendererError, renderMermaid } from '../../renderer/mermaid-renderer';
import type { EditorStatusState } from './EditorStatus';

export interface MermaidCanvasProps {
  readonly source: string;
  readonly model: RendererModel;
  readonly onSelection: (selection: EditorSelection | null) => void;
  readonly onRenderState: (state: EditorStatusState, message: string, cause?: unknown) => void;
  readonly onSourceMutation: (mutate: (source: SourceDocument) => string, remove?: boolean) => boolean;
  readonly sourceRevision: number;
  readonly onParseResult: (sourceRevision: number, valid: boolean) => void;
  readonly onSave?: () => void;
  readonly isSaving?: boolean;
  readonly onReset: () => void;
  readonly onEditSelection: () => void;
  readonly pendingConnection?: { readonly diagramType: EditableDiagramType; readonly source?: string };
}
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

export function MermaidCanvas({ source, model, onSelection, onRenderState, onSourceMutation, sourceRevision, onParseResult, onSave, isSaving = false, onReset, onEditSelection, pendingConnection }: MermaidCanvasProps) {
  const [svg, setSvg] = useState('');
  const [renderedSource, setRenderedSource] = useState('');
  const [binder, setBinder] = useState<((element: Element) => void) | undefined>();
  const [zoom, setZoom] = useState(1);
  const [errorBanner, setErrorBanner] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const adapterToolbarRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const spaceDownRef = useRef(false);
  const lastClickedNodeRef = useRef<Element | null>(null);
  const pendingConnectionRef = useRef(pendingConnection);
  pendingConnectionRef.current = pendingConnection;
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: 'mermaid-editor-canvas',
    data: { kind: 'diagram-canvas' },
    accept: 'palette-item',
  });

  const setAdapterSelection = useCallback((selection: EditorSelection | null) => {
    if (selection?.kind === 'node' && pendingConnectionRef.current?.source === selection.id) {
      lastClickedNodeRef.current?.classList.add('mve-connection-source');
    }
    onSelection(selection);
  }, [onSelection]);

  useEffect(() => {
    setZoom(1);
  }, [model.diagramType]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handleWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value * (event.deltaY < 0 ? 1.1 : 0.9))));
    };
    stage.addEventListener('wheel', handleWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    let current = true;
    const abortController = new AbortController();
    if (!source.trim()) {
      setSvg('');
      setBinder(undefined);
      setRenderedSource(source);
      onParseResult(sourceRevision, true);
      setErrorBanner('');
      onRenderState('empty', 'Enter Mermaid source to see a preview.');
      return () => { current = false; abortController.abort(); };
    }
    setErrorBanner('');
    onRenderState('loading', 'Rendering Mermaid preview…');
    void renderMermaid(source, abortController.signal).then((result) => {
      if (!current) return;
      onParseResult(sourceRevision, true);
      setSvg(result.svg);
      setRenderedSource(source);
      setBinder(() => result.bindFunctions);
      if (model.diagramType === 'unsupported') onRenderState('unsupported', 'This Mermaid diagram type is not visually editable. Source editing is available.');
      else if (model.diagramType === 'unknown') onRenderState('unknown', 'The diagram type could not be identified. Source editing is available.');
      else onRenderState('ready', 'Diagram ready.');
    }).catch((cause: unknown) => {
      if (!current || abortController.signal.aborted) return;
      if (cause instanceof MermaidRendererError && cause.stage === 'parse') onParseResult(sourceRevision, false);
      setErrorBanner(cause instanceof Error ? cause.message : 'Mermaid rendering failed.');
      const kind = cause instanceof MermaidRendererError && cause.stage === 'parse' ? 'source has a syntax error' : 'rendering failed';
      onRenderState('error', cause instanceof Error ? `Mermaid ${kind}: ${cause.message}` : `Mermaid ${kind}.`, cause);
    });
    return () => { current = false; abortController.abort(); };
  }, [source, sourceRevision, onParseResult, onRenderState]);

  useEffect(() => {
    if (renderedSource !== source || model.diagramType === 'unknown' || model.diagramType === 'unsupported') return;
    const diagramType = model.diagramType as AdapterDiagramType;
    registerBuiltInAdapters();
    const adapter = getDiagramAdapter(diagramType);
    const preview = previewRef.current;
    const svgElement = preview?.querySelector('svg');
    const toolbar = adapterToolbarRef.current;
    if (!adapter || !preview || !svgElement || !toolbar) return;
    const sourceDocument = new SourceDocument(source, diagramType);
    binder?.(preview);
    const unmount = adapter.mount({
      diagramType,
      toolbar,
      canvas: preview,
      svg: svgElement,
      sourceDocument,
      applySourceMutation: (mutate) => onSourceMutation(mutate),
      removeSourceMutation: (mutate) => onSourceMutation(mutate, true),
      setSelection: setAdapterSelection,
    });
    return () => {
      unmount();
      toolbar.replaceChildren();
    };
  }, [binder, model.diagramType, onSourceMutation, renderedSource, setAdapterSelection, source, svg]);

  useEffect(() => {
    const preview = previewRef.current;
    const svgElement = preview?.querySelector('svg');
    if (!svgElement || !pendingConnection) return;
    const choices = [...svgElement.querySelectorAll('g.node, g.classGroup, g.class, g.statediagram-state, g.stateGroup')];
    for (const choice of choices) choice.classList.add('mve-connection-choice');
    const sourceElement = pendingConnection.source ? lastClickedNodeRef.current : null;
    sourceElement?.classList.add('mve-connection-source');
    return () => {
      for (const choice of choices) choice.classList.remove('mve-connection-choice');
      sourceElement?.classList.remove('mve-connection-source');
    };
  }, [pendingConnection, renderedSource, svg]);

  const fitCanvas = (): void => {
    const stage = stageRef.current;
    const svgElement = previewRef.current?.querySelector('svg');
    const viewBox = svgElement?.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
    if (stage && viewBox?.length === 4 && viewBox[2]! > 0 && viewBox[3]! > 0 && stage.clientWidth > 0 && stage.clientHeight > 0) {
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min((stage.clientWidth - 32) / viewBox[2]!, (stage.clientHeight - 32) / viewBox[3]!))));
      stage.scrollTo({ top: 0, left: 0 });
      return;
    }
    setZoom(1);
  };

  const centerCanvas = (): void => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    stage.scrollTo({
      top: Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2),
      left: Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section ref={dropRef} className={`mve-gui${isDropTarget ? ' is-drop-target' : ''}`} aria-label="Diagram canvas">
      <header className="mve-canvas-heading">
        <span className="mve-canvas-label">Canvas</span>
        <div className="mve-canvas-toolbar">
          <Button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((value) => Math.min(value + 0.1, MAX_ZOOM))}>+</Button>
          <output className="mve-zoom-label" aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <Button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((value) => Math.max(value - 0.1, MIN_ZOOM))}>−</Button>
          <Button type="button" onClick={fitCanvas}>Fit</Button>
          <Button type="button" onClick={centerCanvas}>Center</Button>
          {onSave ? <Button type="button" disabled={isSaving} onClick={onSave}>{isSaving ? 'Saving…' : 'Save'}</Button> : null}
          <Button type="button" onClick={onReset}>Reset</Button>
        </div>
      </header>
      <div className="mve-preview-stage" ref={stageRef} onClickCapture={(event) => {
        lastClickedNodeRef.current = event.target instanceof Element
          ? event.target.closest('svg g.node, svg g.classGroup, svg g.class, svg g.statediagram-state, svg g.stateGroup')
          : null;
      }} onDoubleClick={(event) => {
        if (event.target instanceof Element && event.target.closest([
          'svg g.node', 'svg g.edgePath', 'svg g.edgeLabel', 'svg g.cluster', 'svg g.classGroup',
          'svg path.relation', 'svg path.relationshipLine', 'svg path.transition', 'svg .edgePaths path',
        ].join(', '))) onEditSelection();
      }} onKeyDown={(event) => {
        if (event.code === 'Space' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
          spaceDownRef.current = true;
          event.preventDefault();
        }
      }} onKeyUp={(event) => {
        if (event.code === 'Space') { spaceDownRef.current = false; panRef.current = null; }
      }} onPointerDown={(event) => {
        if (!spaceDownRef.current || event.button !== 0) {
          if (event.target === event.currentTarget) event.currentTarget.focus({ preventScroll: true });
          return;
        }
        panRef.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add('mve-panning');
      }} onPointerMove={(event) => {
        const start = panRef.current;
        if (!start) return;
        event.currentTarget.scrollLeft = start.left - (event.clientX - start.x);
        event.currentTarget.scrollTop = start.top - (event.clientY - start.y);
      }} onPointerUp={(event) => {
        panRef.current = null;
        event.currentTarget.classList.remove('mve-panning');
      }} onPointerCancel={(event) => {
        panRef.current = null;
        event.currentTarget.classList.remove('mve-panning');
      }} tabIndex={0} aria-label="Diagram canvas. Scroll to move around; hold Space and drag to pan. Use Control or Command plus scroll to zoom.">
        {errorBanner ? <div className="mve-preview-error" role="alert">{errorBanner}</div> : null}
        <div className="mve-preview" ref={previewRef} dangerouslySetInnerHTML={{ __html: svg }} style={{ zoom }} />
        <div className="mve-react-adapter-toolbar" ref={adapterToolbarRef} hidden aria-hidden="true" />
      </div>
    </section>
  );
}
