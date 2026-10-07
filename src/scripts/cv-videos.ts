// Collapsed cards have no media request; playback follows actual visibility.
const videos = [...document.querySelectorAll<HTMLVideoElement>('[data-cv-video]')];
const visible = new Set<HTMLVideoElement>();
const pending = new Set<HTMLVideoElement>();
const events = new AbortController();
let suspended = false;
const eligible = (video: HTMLVideoElement) => !suspended && !document.hidden && visible.has(video) && !!video.closest('.animation-card.expanded');
function update() {
  for (const video of videos) {
    if (!eligible(video)) { video.pause(); continue; }
    if (!video.hasAttribute('src')) video.src = video.dataset.src!;
    if (video.paused && !pending.has(video)) {
      pending.add(video);
      void video.play().catch(() => {}).finally(() => {
        pending.delete(video);
        if (!eligible(video)) video.pause();
      });
    }
  }
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const video = entry.target as HTMLVideoElement;
    if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(video); else visible.delete(video);
  }
  update();
}, {threshold: [0, 0.01]});
const cards = new MutationObserver(update);
for (const video of videos) {
  observer.observe(video);
  const card = video.closest('.animation-card');
  if (card) cards.observe(card, {attributes:true, attributeFilter:['class']});
}
document.addEventListener('visibilitychange', update, {signal:events.signal});
window.addEventListener('pagehide', () => { suspended = true; update(); }, {signal:events.signal});
window.addEventListener('pageshow', () => { suspended = false; update(); }, {signal:events.signal});
if (import.meta.hot) import.meta.hot.dispose(() => {
  suspended = true; update(); observer.disconnect(); cards.disconnect(); events.abort();
});
