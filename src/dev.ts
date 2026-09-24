import { createMermaidVisualEditor } from './index';
import './styles/dev.css';

const samples = {
  class: `classDiagram
direction LR
namespace Shop {
  class Customer {
    <<entity>>
    +id: string
    +email: string
    +placeOrder(): Order
  }
  class Order {
    +number: string
    +total: number
    +submit(): boolean
  }
  class Admin
}
Customer "1" --> "0..*" Order : places
Admin ..> Order : reviews
style Customer fill:#e6f4ea,stroke:#18864b
`,
  sequence: `sequenceDiagram
  actor Customer
  participant Store
  participant Payment
  Customer->>Store: place order
  Store->>Payment: charge card
  Payment-->>Store: approved
  Store-->>Customer: order confirmed
`,
  flowchart: `flowchart LR
  Customer[Customer] --> Cart[Shopping cart]
  Cart --> Payment{Payment approved?}
  Payment -->|Yes| Order[Create order]
  Payment -->|No| Retry[Try another card]
  Retry --> Payment
`,
} as const;

const selectionValue = document.querySelector<HTMLElement>('#selection-value')!;
const sourceSize = document.querySelector<HTMLElement>('#source-size')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
let toastTimer: number | undefined;

const editor = createMermaidVisualEditor(document.querySelector<HTMLElement>('#editor')!, {
  value: samples.class,
  onChange(source) {
    sourceSize.textContent = `${source.length.toLocaleString()} chars`;
  },
  onSelectionChange(selection) {
    if (!selection) {
      selectionValue.textContent = 'Nothing selected';
    } else if (selection.kind === 'edge') {
      selectionValue.textContent = `Relationship · ${selection.source} → ${selection.target}`;
    } else if (selection.kind === 'subgraph') {
      selectionValue.textContent = `Group · ${selection.title || selection.id}`;
    } else {
      selectionValue.textContent = `Node · ${selection.id}`;
    }
  },
  onError(error) {
    toast.textContent = `${error.code}: ${error.message}`;
    toast.hidden = false;
    if (toastTimer !== undefined) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
  },
});
sourceSize.textContent = `${samples.class.length.toLocaleString()} chars`;

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-sample]')) {
  button.addEventListener('click', () => {
    const sample = button.dataset.sample as keyof typeof samples;
    editor.setValue(samples[sample]);
    document.querySelector('.sample-button.is-active')?.classList.remove('is-active');
    button.classList.add('is-active');
    selectionValue.textContent = 'Nothing selected';
    sourceSize.textContent = `${samples[sample].length.toLocaleString()} chars`;
  });
}

window.addEventListener('pagehide', () => editor.destroy(), { once: true });
