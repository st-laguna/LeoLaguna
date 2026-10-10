import '../styles/label-interactions.css';

// Prepare glyphs once per label (and again only when its translation changes).
function prepareLabels() {
  document.querySelectorAll<HTMLElement>('[data-roll-label]').forEach(label => {
    const text=(label.querySelector('.roll-readable,.roll-native')?.textContent||label.textContent)?.trim()||'';
    if(label.dataset.rollText===text && label.querySelector('.roll-letter'))return;
    label.closest('a,button')?.setAttribute('data-roll-link','');
    label.dataset.rollText=text;
    const readable=document.createElement('span');readable.className='roll-readable';readable.textContent=text;
    const letters=document.createElement('span');letters.setAttribute('aria-hidden','true');
    Array.from(text).forEach((letter,index)=>{
      const clip=document.createElement('span');clip.className='roll-letter';
      clip.style.setProperty('--letter-index',String(index));
      const glyph=document.createElement('span');glyph.className='roll-glyph';glyph.dataset.letter=letter;glyph.textContent=letter;
      clip.append(glyph);letters.append(clip);
    });
    label.replaceChildren(readable,letters);
    if(label.hasAttribute('data-roll-preserve')) {
      readable.className='roll-native';
      letters.className='roll-overlay';
      labelObserver.observe(label);
      measureLabel(label);
    }
  });
}
// Native text reserves the exact width, kerning, baseline and line height. Only
// the decorative overlay is split; resize/font changes never write layout sizes.
function measureLabel(label: HTMLElement) {
  const native=label.querySelector<HTMLElement>('.roll-native');
  const text=native?.firstChild;
  if(!native || !text || !native.getBoundingClientRect().width)return;
  const origin=label.getBoundingClientRect();
  const range=document.createRange();
  let offset=0;
  label.querySelectorAll<HTMLElement>('.roll-letter').forEach(clip=>{
    const char=clip.textContent||'';
    range.setStart(text,offset);offset+=char.length;range.setEnd(text,offset);
    const rect=range.getBoundingClientRect();
    clip.style.left=(rect.left-origin.left)+'px';
    clip.style.top=(rect.top-origin.top)+'px';
    clip.style.height=rect.height+'px';
    clip.style.width=rect.width+'px';
    clip.style.lineHeight=rect.height+'px';
  });
  label.dataset.rollMeasured='';
}
const labelObserver=new ResizeObserver(entries=>entries.forEach(entry=>measureLabel(entry.target as HTMLElement)));
prepareLabels();
document.fonts.ready.then(()=>document.querySelectorAll<HTMLElement>('[data-roll-preserve]').forEach(measureLabel));
window.addEventListener('leo:language-change',prepareLabels);
window.addEventListener('leo:page-reveal',prepareLabels);
if(import.meta.hot)import.meta.hot.dispose(()=>{
  labelObserver.disconnect();
  window.removeEventListener('leo:language-change',prepareLabels);
  window.removeEventListener('leo:page-reveal',prepareLabels);
});
