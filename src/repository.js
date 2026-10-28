const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function showValue(key, value, label) {
  const element = document.querySelector(`[data-repository="${key}"]`);
  element.querySelector('span').textContent = value;
  element.setAttribute('aria-label', label);
}

async function github(path) {
  const response = await fetch(`https://api.github.com/repos/nandorocker/ocp${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
    credentials: 'omit',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('GitHub metadata unavailable');
  return response.json();
}

// Keep the repository link and descriptive labels if GitHub is unavailable.
// Metadata is public, optional, and never blocks the rest of the handbook.
void Promise.allSettled([
  github('').then((repository) => {
    for (const [key, field, label] of [
      ['stars', 'stargazers_count', 'stars'],
      ['forks', 'forks_count', 'forks'],
    ]) {
      const count = repository[field];
      if (Number.isSafeInteger(count) && count >= 0) showValue(key, compact.format(count), `${count} ${label}`);
    }
  }),
  github('/releases/latest').then((release) => {
    if (typeof release.tag_name === 'string' && release.tag_name.length > 0 && release.tag_name.length <= 32) {
      showValue('release', release.tag_name, `Latest release ${release.tag_name}`);
    }
  }),
]);
