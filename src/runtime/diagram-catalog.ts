import type { DiagramType } from '../diagrams/capability';

export type EditableDiagramType = Exclude<DiagramType, 'unknown' | 'unsupported'>;

export interface PaletteEntry {
  group: string;
  label: string;
  icon: string;
  snippet: string;
}

export const diagramTypes: readonly { id: EditableDiagramType; label: string }[] = [
  { id: 'flowchart', label: 'Flowchart' }, { id: 'sequence', label: 'Sequence' },
  { id: 'class', label: 'Class' }, { id: 'state', label: 'State' },
  { id: 'er', label: 'Entity-Relationship' }, { id: 'gantt', label: 'Gantt' },
  { id: 'pie', label: 'Pie chart' }, { id: 'journey', label: 'User journey' },
  { id: 'mindmap', label: 'Mindmap' }, { id: 'gitgraph', label: 'Git graph' },
  { id: 'timeline', label: 'Timeline' }, { id: 'quadrant', label: 'Quadrant' },
];

export function diagramTypeFromSource(source: string): EditableDiagramType | undefined {
  const first = source.split(/\r\n|\r|\n/).map((line) => line.trim())
    .find((line) => line && !line.startsWith('%%')) ?? '';
  const directive = /^([\w-]+)/.exec(first)?.[1]?.toLowerCase();
  const types: Record<string, EditableDiagramType> = {
    graph: 'flowchart', flowchart: 'flowchart', sequencediagram: 'sequence',
    classdiagram: 'class', statediagram: 'state', 'statediagram-v2': 'state',
    erdiagram: 'er', gantt: 'gantt', pie: 'pie', journey: 'journey',
    mindmap: 'mindmap', gitgraph: 'gitgraph', timeline: 'timeline',
    quadrantchart: 'quadrant',
  };
  return directive ? types[directive] : undefined;
}

export const templates: Record<EditableDiagramType, string> = {
  flowchart: 'flowchart TD\n    A[Start] --> B{Is it working?}\n    B -->|Yes| C[Ship it]\n    B -->|No| D[Debug]\n    D --> B',
  sequence: 'sequenceDiagram\n    actor User\n    participant API\n    participant DB\n    User->>API: GET /items\n    API->>+DB: query\n    DB-->>-API: rows\n    API-->>User: 200 OK',
  class: 'classDiagram\n    class Animal {\n        +String name\n        +int age\n        +makeSound() void\n    }\n    class Dog {\n        +String breed\n        +bark() void\n    }\n    Animal <|-- Dog',
  state: 'stateDiagram-v2\n    [*] --> Idle\n    Idle --> Loading : fetch\n    Loading --> Success : ok\n    Loading --> Error : fail\n    Success --> [*]\n    Error --> Idle : retry',
  er: 'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE_ITEM : contains\n    CUSTOMER {\n        string name\n        string email\n    }\n    ORDER {\n        int orderId\n        date created\n    }',
  gantt: 'gantt\n    title Project plan\n    dateFormat YYYY-MM-DD\n    axisFormat %b %d\n\n    section Design\n    Wireframes        :a1, 2026-05-15, 5d\n    Visual design     :after a1, 7d\n\n    section Build\n    Backend           :b1, 2026-05-20, 14d\n    Frontend          :after b1, 10d\n    QA                :crit, 2026-06-10, 5d',
  pie: 'pie title Browser usage\n    "Chrome" : 65\n    "Safari" : 18\n    "Firefox" : 9\n    "Edge" : 5\n    "Other" : 3',
  journey: 'journey\n    title Booking a flight\n    section Search\n        Visit site: 5: User\n        Compare prices: 3: User\n    section Book\n        Enter details: 2: User, System\n        Pay: 4: User, Payment\n    section After\n        Receive ticket: 5: User, Email',
  mindmap: 'mindmap\n  root((Project))\n    Goals\n      Ship MVP\n      Get feedback\n    Risks\n      Scope creep\n      Tech debt\n    Team\n      Design\n      Engineering',
  gitgraph: 'gitGraph\n    commit id: "init"\n    branch feature\n    checkout feature\n    commit id: "wip"\n    commit id: "done"\n    checkout main\n    merge feature\n    commit id: "release"',
  timeline: 'timeline\n    title Company history\n    section 2020s\n        2020 : Founded\n             : First hire\n        2022 : Series A\n             : Launched product\n        2024 : 100 customers\n        2026 : Series B',
  quadrant: 'quadrantChart\n    title Reach vs engagement\n    x-axis Low reach --> High reach\n    y-axis Low engagement --> High engagement\n    quadrant-1 Stars\n    quadrant-2 Niche\n    quadrant-3 Avoid\n    quadrant-4 Mainstream\n    Campaign A: [0.3, 0.6]\n    Campaign B: [0.45, 0.23]\n    Campaign C: [0.57, 0.69]\n    Campaign D: [0.78, 0.34]',
};

export const paletteCatalog: Partial<Record<EditableDiagramType, readonly PaletteEntry[]>> = {
  pie: [{ group: 'Structure', label: 'Title', icon: 't', snippet: 'title Pie title' }, { group: 'Slices', label: 'Slice', icon: '◔', snippet: '    "Label" : 25' }],
  journey: [{ group: 'Structure', label: 'Title', icon: 't', snippet: 'title My journey' }, { group: 'Structure', label: 'Section', icon: '§', snippet: '    section Phase' }, { group: 'Tasks', label: 'Task', icon: '★', snippet: '        Task name: 5: Actor' }, { group: 'Tasks', label: 'Multi-actor', icon: '★★', snippet: '        Task name: 3: User, System' }],
  mindmap: [{ group: 'Nodes', label: 'Root (circle)', icon: '(( ))', snippet: '  root((Title))' }, { group: 'Nodes', label: 'Branch', icon: '·', snippet: '    Branch label' }, { group: 'Nodes', label: 'Square node', icon: '[ ]', snippet: '    [Square]' }, { group: 'Nodes', label: 'Rounded', icon: '( )', snippet: '    (Rounded)' }, { group: 'Nodes', label: 'Cloud', icon: ')(', snippet: '    )Cloud(' }],
  gitgraph: [{ group: 'Commits', label: 'Commit', icon: '●', snippet: '    commit' }, { group: 'Commits', label: 'Commit with id', icon: '●id', snippet: '    commit id: "msg"' }, { group: 'Commits', label: 'Tagged commit', icon: 'tag', snippet: '    commit tag: "v1.0"' }, { group: 'Branches', label: 'Branch', icon: '├', snippet: '    branch feature' }, { group: 'Branches', label: 'Checkout', icon: '⇄', snippet: '    checkout main' }, { group: 'Branches', label: 'Merge', icon: '⇆', snippet: '    merge feature' }],
  timeline: [{ group: 'Structure', label: 'Title', icon: 't', snippet: 'title Timeline title' }, { group: 'Structure', label: 'Section', icon: '§', snippet: '    section Era name' }, { group: 'Events', label: 'Event', icon: '|', snippet: '        2026 : Event description' }],
  quadrant: [{ group: 'Structure', label: 'Title', icon: 't', snippet: 'title Chart title' }, { group: 'Structure', label: 'X-axis', icon: 'x', snippet: '    x-axis Low --> High' }, { group: 'Structure', label: 'Y-axis', icon: 'y', snippet: '    y-axis Low --> High' }, { group: 'Quadrants', label: 'Quadrant label', icon: 'Q', snippet: '    quadrant-1 Top right' }, { group: 'Points', label: 'Data point', icon: '•', snippet: '    Label: [0.5, 0.5]' }],
};

export function appendPaletteEntry(source: string, type: EditableDiagramType, entry: PaletteEntry): string {
  const ending = /\r\n|\r|\n/.exec(source)?.[0] ?? '\n';
  const lines = source.replace(/\r\n|\r/g, '\n').split('\n');
  let line = entry.snippet;
  const replaceOrInsert = (pattern: RegExp, replacement: string): void => {
    const index = lines.findIndex((candidate) => pattern.test(candidate));
    if (index >= 0) lines[index] = replacement;
    else lines.splice(1, 0, replacement);
  };
  if (entry.label === 'Title' && type === 'pie') lines[0] = 'pie title Pie title';
  else if (entry.label === 'Title' && type === 'journey') replaceOrInsert(/^\s*title\s+/i, '    title My journey');
  else if (entry.label === 'Title' && type === 'timeline') replaceOrInsert(/^\s*title\s+/i, '    title Timeline title');
  else if (entry.label === 'Title' && type === 'quadrant') replaceOrInsert(/^\s*title\s+/i, '    title Chart title');
  else if (type === 'mindmap' && entry.label === 'Root (circle)') replaceOrInsert(/^\s*root\s*\(/i, '  root((Title))');
  else if (type === 'gitgraph' && entry.label === 'Branch') {
    let index = 1;
    while (lines.some((candidate) => new RegExp(`^\\s*branch\\s+feature${index === 1 ? '' : index}\\s*$`, 'i').test(candidate))) index++;
    line = `    branch feature${index === 1 ? '' : index}`;
    lines.push(line);
  }
  else if (type === 'gitgraph' && entry.label === 'Commit with id') {
    let index = 1;
    while (lines.some((candidate) => candidate.includes(`id: "c${index}"`))) index++;
    lines.push(`    commit id: "c${index}" msg: "New commit"`);
  }
  else if (type === 'quadrant' && entry.label === 'X-axis') replaceOrInsert(/^\s*x-axis\s+/i, line);
  else if (type === 'quadrant' && entry.label === 'Y-axis') replaceOrInsert(/^\s*y-axis\s+/i, line);
  else if (type === 'quadrant' && entry.label === 'Quadrant label') replaceOrInsert(/^\s*quadrant-1\s+/i, line);
  else lines.push(line);
  return lines.join(ending);
}
