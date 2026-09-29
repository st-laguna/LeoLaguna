const videos = Array.from(
  document.querySelectorAll<HTMLVideoElement>('[data-auto-video]')
);

const visibility = new Map<HTMLVideoElement, number>();

function updatePlayback() {
  const modal = document.querySelector<HTMLDialogElement>('dialog[open]');

  videos.forEach(video => {
    const visible = (visibility.get(video) ?? 0) > 0.5;
    const allowed = !modal || modal.contains(video);
    // Keep the gallery's existing pause in force throughout its exit animation.
    const closing = !!video.closest('[data-media-closing]');
    const shouldPlay = visible && allowed && !closing && !document.hidden;

    if (shouldPlay) {
      video.muted = true;

      if (video.paused) {
        void video.play().catch(() => {});
      }
    } else {
      video.pause();
    }
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    visibility.set(
      entry.target as HTMLVideoElement,
      entry.intersectionRatio
    );
  });

  updatePlayback();
}, {
  threshold: [0, 0.5, 1],
});

videos.forEach(video => observer.observe(video));

const dialogs = new MutationObserver(updatePlayback);

document.querySelectorAll('dialog').forEach(dialog => {
  dialogs.observe(dialog, {
    attributes: true,
    attributeFilter: ['open', 'data-media-closing'],
  });
});

document.addEventListener('visibilitychange', updatePlayback);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    observer.disconnect();
    dialogs.disconnect();
    document.removeEventListener('visibilitychange', updatePlayback);
    videos.forEach(video => video.pause());
  });
}