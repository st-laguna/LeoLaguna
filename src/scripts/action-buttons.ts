// Prepare glyphs once per label (and again only when its translation changes).
function prepareLabels() {
  document.querySelectorAll<HTMLElement>('[data-roll-label]').forEach(label => {
    const text=(label.querySelector('.roll-readable')?.textContent||label.textContent)?.trim()||'';
    if(label.dataset.rollText===text && label.querySelector('.roll-letter'))return;
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
  });
}
prepareLabels();
window.addEventListener('leo:language-change',prepareLabels);
window.addEventListener('leo:page-reveal',prepareLabels);
if(import.meta.hot)import.meta.hot.dispose(()=>{
  window.removeEventListener('leo:language-change',prepareLabels);
  window.removeEventListener('leo:page-reveal',prepareLabels);
});
