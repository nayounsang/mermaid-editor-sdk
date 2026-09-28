import { Children, Fragment, isValidElement } from 'react';
import type { FunctionComponent, KeyboardEvent, ReactNode } from 'react';

const editorShellRegion = Symbol('editor-shell-region');

type EditorShellRegionName = 'sidebar' | 'canvas' | 'source' | 'selection' | 'status' | 'headerControls' | 'actions';

interface EditorShellRegionProps {
  readonly children?: ReactNode;
}

interface EditorShellRegionComponent extends FunctionComponent<EditorShellRegionProps> {
  readonly [editorShellRegion]: EditorShellRegionName;
}

export interface EditorShellProps {
  readonly title?: string;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  readonly className?: string;
  readonly children?: ReactNode;
}

export interface EditorShellComponent extends FunctionComponent<EditorShellProps> {
  readonly Sidebar: EditorShellRegionComponent;
  readonly Canvas: EditorShellRegionComponent;
  readonly Source: EditorShellRegionComponent;
  readonly Selection: EditorShellRegionComponent;
  readonly Status: EditorShellRegionComponent;
  readonly HeaderControls: EditorShellRegionComponent;
  readonly Actions: EditorShellRegionComponent;
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

export const EditorShell = Object.assign(EditorShellRoot, {
  Sidebar: createRegion('sidebar'),
  Canvas: createRegion('canvas'),
  Source: createRegion('source'),
  Selection: createRegion('selection'),
  Status: createRegion('status'),
  HeaderControls: createRegion('headerControls'),
  Actions: createRegion('actions'),
}) as EditorShellComponent;
