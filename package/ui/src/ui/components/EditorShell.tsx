import { Children, Fragment, isValidElement } from 'react';
import type { FunctionComponent, KeyboardEvent, ReactNode } from 'react';

const editorShellRegion = Symbol('editor-shell-region');

type EditorShellRegionName = 'sidebar' | 'canvas' | 'source' | 'selection' | 'status' | 'headerControls' | 'actions';

export interface EditorShellRegionProps {
  /** Content rendered in the named shell region. */
  readonly children?: ReactNode;
}

interface EditorShellRegionComponent extends FunctionComponent<EditorShellRegionProps> {
  readonly [editorShellRegion]: EditorShellRegionName;
}

export interface EditorShellProps {
  /** Shell heading.
   * @default `"Diagram"`
   */
  readonly title?: string;
  /** Keyboard handler attached to the shell root. */
  readonly onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** Additional class name on the root.
   * @default `""`
   */
  readonly className?: string;
  /** Compound region components to render inside the shell. */
  readonly children?: ReactNode;
}

/** `EditorShell` component with named compound regions for composing the editor layout. */
export interface EditorShellComponent extends FunctionComponent<EditorShellProps> {
  /** Region for sidebar content. */
  readonly Sidebar: FunctionComponent<EditorShellRegionProps>;
  /** Region for the diagram canvas. */
  readonly Canvas: FunctionComponent<EditorShellRegionProps>;
  /** Region for the Mermaid source editor. */
  readonly Source: FunctionComponent<EditorShellRegionProps>;
  /** Region for the selection editor. */
  readonly Selection: FunctionComponent<EditorShellRegionProps>;
  /** Region for the status message. */
  readonly Status: FunctionComponent<EditorShellRegionProps>;
  /** Region for diagram type and other header controls. */
  readonly HeaderControls: FunctionComponent<EditorShellRegionProps>;
  /** Region for header actions. */
  readonly Actions: FunctionComponent<EditorShellRegionProps>;
}

function createRegion(name: EditorShellRegionName): EditorShellRegionComponent {
  const Region: FunctionComponent<EditorShellRegionProps> = ({ children }) => <>{children}</>;
  return Object.assign(Region, { [editorShellRegion]: name });
}

function collectRegions(children: ReactNode, regions: Map<EditorShellRegionName, ReactNode[]>): void {
  Children.forEach(children, (child) => {
    if (!isValidElement<EditorShellRegionProps>(child)) return;
    if (child.type === Fragment) {
      collectRegions(child.props.children, regions);
      return;
    }
    if (typeof child.type !== 'function' || !(editorShellRegion in child.type)) return;
    const name = (child.type as EditorShellRegionComponent)[editorShellRegion];
    regions.set(name, [...(regions.get(name) ?? []), child.props.children]);
  });
}

function renderRegion(regions: Map<EditorShellRegionName, ReactNode[]>, name: EditorShellRegionName): ReactNode {
  return regions.get(name)?.map((child, index) => <Fragment key={`${name}-${index}`}>{child}</Fragment>);
}

const EditorShellRoot: FunctionComponent<EditorShellProps> = ({ title = 'Diagram', onKeyDown, className = '', children }) => {
  const regions = new Map<EditorShellRegionName, ReactNode[]>();
  collectRegions(children, regions);

  return (
    <div className={`mve-root ${className}`.trim()} onKeyDown={onKeyDown}>
      <header className="mve-header">
        <strong>{title}</strong>
        <div className="mve-header-controls">{renderRegion(regions, 'headerControls')}</div>
        <div className="mve-header-actions">{renderRegion(regions, 'actions')}</div>
      </header>
      {renderRegion(regions, 'status')}
      <main className="mve-workspace">
        {renderRegion(regions, 'sidebar')}
        <div className="mve-work-column">
          {renderRegion(regions, 'canvas')}
          {renderRegion(regions, 'selection')}
          {renderRegion(regions, 'source')}
        </div>
      </main>
    </div>
  );
};

/** Composable editor layout with named regions for its UI parts. */
export const EditorShell = Object.assign(EditorShellRoot, {
  Sidebar: createRegion('sidebar'),
  Canvas: createRegion('canvas'),
  Source: createRegion('source'),
  Selection: createRegion('selection'),
  Status: createRegion('status'),
  HeaderControls: createRegion('headerControls'),
  Actions: createRegion('actions'),
}) as EditorShellComponent;
