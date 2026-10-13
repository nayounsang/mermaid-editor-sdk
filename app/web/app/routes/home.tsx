import { MermaidEditor } from '@mermaid-editor-sdk/ui';
import { format } from 'date-fns';
import FileSaver from 'file-saver';
import type { MetaFunction } from 'react-router';
import { SITE_URL } from '../site-config';

const description = 'Create Mermaid diagrams in a free online editor with visual tools and code editing. Customize the React SDK to fit your own app and workflow.';

export const meta: MetaFunction = () => {
  const pageUrl = SITE_URL ? `${SITE_URL}/` : undefined;

  return [
    { title: 'Free Mermaid Diagram Editor Online' },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Free Mermaid Diagram Editor Online' },
    { property: 'og:description', content: description },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Free Mermaid Diagram Editor Online' },
    { name: 'twitter:description', content: description },
    ...(!SITE_URL ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ...(pageUrl
      ? [{ property: 'og:url', content: pageUrl }]
      : []),
  ];
};

export function links() {
  return [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ...(SITE_URL ? [{ rel: 'canonical', href: `${SITE_URL}/` }] : []),
  ];
}

const initialSource = `flowchart LR
  Start[Start] --> Edit[Edit with UI or code] --> Preview[Preview]`;

function downloadMermaidSource(source: string) {
  const file = new Blob([source], { type: 'text/plain;charset=utf-8' });
  const filename = `diagram-${format(new Date(), 'yyyy-MM-dd-HHmm')}.mmd`;
  FileSaver.saveAs(file, filename, { autoBom: true });
}

export default function Home() {
  return (
    <main>
      <header className="seo-hero">
        <p className="seo-kicker">Free online Mermaid editor</p>
        <h1 id="seo-title">Free Mermaid Diagram Editor Online</h1>
        <p className="seo-lead">Create diagrams with visual tools or Mermaid code, preview as you work, and download the source. React developers can customize the SDK to fit their app.</p>
      </header>
      <div className="editor-mount">
        <MermaidEditor value={initialSource} onSave={downloadMermaidSource} />
      </div>
      <article className="seo-content">
        <div className="seo-content-inner">
          <section className="seo-section" aria-labelledby="workflow-title">
            <h2 id="workflow-title">Go from a first draft to a saved Mermaid diagram</h2>
            <p>Choose a diagram type and add or adjust supported elements with the visual tools. Switch to Mermaid source whenever you want to edit the syntax directly, then check the rendered preview as you work. When the diagram is ready, Save downloads the current source as a <code>.mmd</code> file.</p>
          </section>

          <section className="seo-section" aria-labelledby="visual-code-title">
            <h2 id="visual-code-title">Edit Mermaid diagrams visually or in code</h2>
            <p>The editor combines a diagram canvas, visual controls, a Mermaid source editor, and a live preview in one workspace. Start with whichever editing style fits the task, then move between them while refining the same diagram.</p>
            <div className="seo-feature-grid">
              <section className="seo-feature">
                <h3>Use visual editing tools</h3>
                <p>Choose a diagram type, add elements from its tool palette, and select diagram parts on the canvas to make supported changes.</p>
              </section>
              <section className="seo-feature">
                <h3>Edit Mermaid code directly</h3>
                <p>Write or revise Mermaid syntax in the source editor and review the rendered diagram in the same workspace.</p>
              </section>
              <section className="seo-feature">
                <h3>Preview while you work</h3>
                <p>Review the rendered diagram as you switch between visual adjustments and source edits.</p>
              </section>
            </div>
          </section>

          <section className="seo-section" aria-labelledby="diagram-types-title">
            <h2 id="diagram-types-title">Create many kinds of Mermaid diagrams</h2>
            <p>Use Mermaid source to work with diagrams supported by Mermaid. Built-in visual tools cover flowcharts, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams, Gantt charts, pie charts, user journeys, mindmaps, Git graphs, timelines, and quadrant charts.</p>
          </section>

          <section className="seo-section" aria-labelledby="free-editor-title">
            <h2 id="free-editor-title">A free Mermaid editor in your browser</h2>
            <p>Open the editor without installing a desktop app. Create a diagram with visual tools, paste existing Mermaid code, or combine both approaches. Save exports the Mermaid source, so you can keep editing it in your own project.</p>
          </section>

          <section className="seo-section" aria-labelledby="react-sdk-title">
            <h2 id="react-sdk-title">Customize the Mermaid editor for your React app</h2>
            <p>Use <code>@mermaid-editor-sdk/ui</code> to add the editor to a React app, control its source with React state, and handle changes or saves in your own workflow. Keep the ready-made interface, replace selected components, or compose a custom layout from SDK parts. For a fully custom interface, the headless package exposes diagram editing logic without the bundled UI.</p>
          </section>

          <section className="seo-section seo-faq" aria-labelledby="faq-title">
            <h2 id="faq-title">Frequently asked questions</h2>
            <details>
              <summary>Is this Mermaid diagram editor free?</summary>
              <p>Yes. The online editor is free to use.</p>
            </details>
            <details>
              <summary>Can I edit diagrams without writing Mermaid code?</summary>
              <p>Yes. Use the visual controls and canvas to create and adjust supported diagram elements. You can also edit the Mermaid source directly at any time.</p>
            </details>
            <details>
              <summary>Which Mermaid diagram types can I use?</summary>
              <p>The source editor and preview work with Mermaid syntax. Visual tools are available for flowcharts, sequence, class, state, ER, Gantt, pie, user journey, mindmap, Git graph, timeline, and quadrant diagrams.</p>
            </details>
            <details>
              <summary>Can I customize the editor in my React app?</summary>
              <p>Yes. Use the React UI package as-is, replace selected components, compose a custom editor layout, or use the headless package to build your own interface around the diagram editing logic.</p>
            </details>
          </section>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Free Mermaid Diagram Editor Online',
            description,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            ...(SITE_URL ? { url: SITE_URL } : {}),
          }),
        }}
      />
    </main>
  );
}
