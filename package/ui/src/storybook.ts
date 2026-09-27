import './styles/storybook.css';

const scrim = document.querySelector<HTMLElement>('#modal-scrim');
const openButton = document.querySelector<HTMLButtonElement>('#open-modal');

function closeModal(): void {
  if (scrim) scrim.hidden = true;
}

openButton?.addEventListener('click', () => {
  if (scrim) scrim.hidden = false;
});

scrim?.querySelectorAll<HTMLElement>('[data-close]').forEach((button) => {
  button.addEventListener('click', closeModal);
});

scrim?.addEventListener('click', (event) => {
  if (event.target === scrim) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});
