import type { Preview } from '@storybook/react-vite';
import 'mermaid-visual-editor-sdk/style.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'padded',
  },
};

export default preview;
