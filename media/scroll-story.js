/* Sync decorative stage labels to the story card currently being read.
   The droplet animation remains native CSS; this script only selects the
   matching caption and three-step progress. No analytics or network calls. */
(() => {
  const story = document.getElementById("water-story");
  if (!story || !("IntersectionObserver" in window)) return;

  const steps = Array.from(story.querySelectorAll(".water-story__step"));
  const captions = Array.from(story.querySelectorAll(".water-story__stage-caption"));
  if (steps.length !== 3 || captions.length !== 3) return;

  let current = -1;
  function showPhase(index) {
    if (index < 0 || index >= steps.length || index === current) return;
    current = index;
    story.dataset.storyPhase = String(index + 1);
    story.style.setProperty("--story-progress", String((index + 1) / steps.length));
    captions.forEach((caption, i) => caption.classList.toggle("is-active", i === index));
  }

  showPhase(0);
  story.classList.add("story-ready");
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (!visible.length) return;
    showPhase(steps.indexOf(visible[0].target));
  }, {
    rootMargin: "-35% 0px -43% 0px",
    threshold: 0
  });
  steps.forEach((step) => observer.observe(step));
})();
