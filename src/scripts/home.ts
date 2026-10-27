// Focus the search box with "/". (Old /?q=…&type=…&tag=… links are sent on to /browse/ by an inline script.)
const input = document.querySelector<HTMLInputElement>('#search')!;
document.addEventListener('keydown', event => { if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable)) { event.preventDefault(); input.focus(); } });
