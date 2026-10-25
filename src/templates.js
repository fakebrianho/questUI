// Each template declares its editable fields and a render() that returns HTML.
// All templates share the same class vocabulary (ui-header, ui-title, ui-list…)
// so every style in themes.css works with every layout.

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Tiny markup: **highlight** and *italic*, newlines become line breaks.
export const fmt = (s = '') =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br>');

const icon = (f, cls = 'ui-icon') => {
  if (f.image) return `<div class="${cls}"><img src="${f.image}" alt=""></div>`;
  if (f.emoji) return `<div class="${cls}"><span>${esc(f.emoji)}</span></div>`;
  return '';
};

const list = (items = [], { checkable = false, numbered = false, strike = false, tone = '' } = {}) => {
  if (!items.length) return '';
  const cls = ['ui-list'];
  if (checkable || tone === 'done') cls.push('checklist');
  if (numbered) cls.push('numbered');
  if (strike) cls.push('strike');
  if (tone) cls.push(`tone-${tone}`);
  return `<ul class="${cls.join(' ')}">${items
    .map((it, i) => {
      const state = checkable ? (it.done ? 'done' : 'todo') : tone;
      const mark =
        checkable || tone === 'done'
          ? '<span class="mark" aria-hidden="true"></span>'
          : tone === 'next'
            ? '<span class="arrow" aria-hidden="true"></span>'
            : numbered
              ? `<span class="num">${i + 1}.</span>`
              : '<span class="bullet" aria-hidden="true"></span>';
      return `<li class="${state}">${mark}<span class="txt">${fmt(it.text)}</span></li>`;
    })
    .join('')}</ul>`;
};

const section = (title, body) =>
  body ? `${title ? `<div class="ui-section"><span>${fmt(title)}</span></div>` : ''}${body}` : '';

export const RARITIES = {
  common: { label: 'Common', color: '#d9d9d9' },
  uncommon: { label: 'Uncommon', color: '#4fd16b' },
  rare: { label: 'Rare', color: '#4aa3ff' },
  epic: { label: 'Epic', color: '#b77bff' },
  legendary: { label: 'Legendary', color: '#ff9f2e' },
  mythic: { label: 'Mythic', color: '#ff4f6d' },
};

export const templates = {
  quest: {
    name: 'Quest journal',
    width: 460,
    fields: [
      { key: 'title', label: 'Quest title', type: 'text', default: 'Niku Udon' },
      { key: 'meta', label: 'Subtitle', type: 'text', default: 'Novice · Cooking quest' },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        default:
          'A weary noodle master by the harbour longs for a bowl of beef udon like his grandmother once made. Gather the ingredients and bring them to **Chef Hiroshi** before the broth goes cold.',
      },
      { key: 'reqTitle', label: 'Requirements heading', type: 'text', default: 'Ingredients required' },
      {
        key: 'requirements',
        label: 'Requirements (tick = done)',
        type: 'list',
        checkable: true,
        default: [
          { text: 'Udon noodles', done: true },
          { text: 'Thinly sliced beef', done: true },
          { text: 'Dashi stock', done: true },
          { text: 'Soy sauce', done: true },
          { text: 'Mirin', done: false },
          { text: 'Sugar', done: true },
          { text: 'Sake', done: false },
          { text: 'Green onions', done: false },
          { text: 'Kamaboko (fish cake)', done: false },
          { text: 'Shichimi togarashi', done: false },
        ],
      },
      { key: 'strike', label: 'Strike through done items', type: 'toggle', default: false },
      { key: 'showProgress', label: 'Show progress bar', type: 'toggle', default: true },
      { key: 'rewardsTitle', label: 'Rewards heading', type: 'text', default: 'Rewards' },
      {
        key: 'rewards',
        label: 'Rewards',
        type: 'list',
        default: [
          { text: '1 Quest point' },
          { text: '2,500 Cooking XP' },
          { text: 'Steaming bowl of niku udon' },
        ],
      },
      { key: 'status', label: 'Footer text', type: 'text', default: 'Status: In progress' },
    ],
    render(f) {
      const reqs = f.requirements || [];
      const done = reqs.filter((r) => r.done).length;
      const pct = reqs.length ? Math.round((done / reqs.length) * 100) : 0;
      return `
      <div class="ui ui-quest">
        <div class="ui-header">
          <div class="ui-title">${fmt(f.title)}</div>
          ${f.meta ? `<div class="ui-meta">${fmt(f.meta)}</div>` : ''}
        </div>
        <div class="ui-body">
          ${f.description ? `<p class="ui-text">${fmt(f.description)}</p>` : ''}
          ${section(f.reqTitle, list(reqs, { checkable: true, strike: f.strike }))}
          ${
            f.showProgress && reqs.length
              ? `<div class="ui-progress"><div class="ui-bar"><i style="width:${pct}%"></i></div><span>${done} / ${reqs.length}</span></div>`
              : ''
          }
          ${f.showRewards === false ? '' : section(f.rewardsTitle, list(f.rewards))}
        </div>
        ${f.status ? `<div class="ui-footer">${fmt(f.status)}</div>` : ''}
      </div>`;
    },
  },

  complete: {
    name: 'Quest complete',
    width: 420,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Quest complete!' },
      { key: 'title', label: 'Quest name', type: 'text', default: 'You have completed Niku Udon' },
      { key: 'emoji', label: 'Icon (emoji or symbol)', type: 'text', default: '🍜' },
      { key: 'image', label: 'Icon image (overrides emoji)', type: 'image', default: '' },
      { key: 'rewardsTitle', label: 'Rewards heading', type: 'text', default: 'You are awarded:' },
      {
        key: 'rewards',
        label: 'Rewards',
        type: 'list',
        default: [
          { text: '1 Quest point' },
          { text: '2,500 Cooking XP' },
          { text: 'Steaming bowl of niku udon' },
          { text: 'Access to the harbour noodle stall' },
        ],
      },
      { key: 'footer', label: 'Footer text', type: 'text', default: 'Quest points: 42' },
    ],
    render(f) {
      const rewards = f.showRewards === false ? '' : section(f.rewardsTitle, list(f.rewards));
      return `
      <div class="ui ui-complete">
        <div class="ui-header center">
          <div class="ui-kicker">${fmt(f.heading)}</div>
          <div class="ui-title">${fmt(f.title)}</div>
        </div>
        <div class="ui-body">
          ${
            rewards
              ? `<div class="ui-split">${icon(f, 'ui-icon big')}<div class="grow">${rewards}</div></div>`
              : `<div class="center">${icon(f, 'ui-icon big')}</div>`
          }
        </div>
        ${f.footer ? `<div class="ui-footer">${fmt(f.footer)}</div>` : ''}
      </div>`;
    },
  },

  progress: {
    name: 'Quest progression',
    width: 480,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Quest updated' },
      { key: 'title', label: 'Quest name', type: 'text', default: 'Niku Udon' },
      { key: 'meta', label: 'Step label', type: 'text', default: 'Step 2 of 3' },
      { key: 'doneTitle', label: 'Completed heading', type: 'text', default: 'Completed' },
      {
        key: 'done',
        label: 'What you just finished',
        type: 'list',
        default: [{ text: 'Gather the ingredients for niku udon' }],
      },
      { key: 'nextTitle', label: 'Next heading', type: 'text', default: 'Up next' },
      {
        key: 'next',
        label: 'Newly revealed objective',
        type: 'list',
        default: [{ text: 'Bring them to **Chef Hiroshi** at the harbour before the broth goes cold' }],
      },
      { key: 'footer', label: 'Footer text', type: 'text', default: '' },
    ],
    render(f) {
      const next = section(f.nextTitle, list(f.next, { tone: 'next' }));
      return `
      <div class="ui ui-progressed">
        <div class="ui-header">
          ${f.heading ? `<div class="ui-kicker">${fmt(f.heading)}</div>` : ''}
          <div class="ui-title">${fmt(f.title)}</div>
          ${f.meta ? `<div class="ui-meta">${fmt(f.meta)}</div>` : ''}
        </div>
        <div class="ui-body">
          ${section(f.doneTitle, list(f.done, { tone: 'done' }))}
          ${next ? `<div class="next-beat">${next}</div>` : ''}
        </div>
        ${f.footer ? `<div class="ui-footer">${fmt(f.footer)}</div>` : ''}
      </div>`;
    },
  },

  item: {
    name: 'Item tooltip',
    width: 340,
    fields: [
      { key: 'title', label: 'Item name', type: 'text', default: 'Bowl of Niku Udon' },
      {
        key: 'rarity',
        label: 'Rarity',
        type: 'select',
        options: Object.entries(RARITIES).map(([v, r]) => ({ value: v, label: r.label })),
        default: 'epic',
      },
      { key: 'emoji', label: 'Icon (emoji or symbol)', type: 'text', default: '🍜' },
      { key: 'image', label: 'Icon image (overrides emoji)', type: 'image', default: '' },
      { key: 'type', label: 'Type line', type: 'text', default: 'Food · Two-handed bowl' },
      {
        key: 'stats',
        label: 'Stats',
        type: 'list',
        default: [{ text: 'Heals 2,200 life points' }, { text: '+10% Cooking XP for 30 minutes' }, { text: 'Warmth: Immune to cold for 5 minutes' }],
      },
      { key: 'flavor', label: 'Flavour text', type: 'textarea', default: 'Grandmother would be proud.' },
      { key: 'value', label: 'Value line', type: 'text', default: 'Value: 1,250 coins' },
    ],
    render(f) {
      const r = RARITIES[f.rarity] || RARITIES.common;
      return `
      <div class="ui ui-item" style="--rarity:${r.color}">
        <div class="ui-header plain">
          <div class="ui-split tight">
            ${icon(f, 'ui-icon small')}
            <div class="grow">
              <div class="ui-title rarity">${fmt(f.title)}</div>
              <div class="ui-meta"><span class="rarity-tag">${r.label}</span>${f.type ? ` · ${fmt(f.type)}` : ''}</div>
            </div>
          </div>
        </div>
        <div class="ui-body">
          ${list(f.stats)}
          ${f.flavor ? `<p class="ui-text flavor">${fmt(f.flavor)}</p>` : ''}
        </div>
        ${f.value ? `<div class="ui-footer">${fmt(f.value)}</div>` : ''}
      </div>`;
    },
  },

  achievement: {
    name: 'Achievement toast',
    width: 440,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Achievement unlocked' },
      { key: 'title', label: 'Title', type: 'text', default: 'Slurp Master' },
      { key: 'text', label: 'Description', type: 'textarea', default: 'Cook a perfect bowl of niku udon.' },
      { key: 'emoji', label: 'Icon (emoji or symbol)', type: 'text', default: '🏆' },
      { key: 'image', label: 'Icon image (overrides emoji)', type: 'image', default: '' },
      { key: 'points', label: 'Points badge', type: 'text', default: '+25' },
    ],
    render(f) {
      return `
      <div class="ui ui-achievement">
        <div class="ui-split">
          ${icon(f, 'ui-icon')}
          <div class="grow">
            <div class="ui-kicker">${fmt(f.heading)}</div>
            <div class="ui-title">${fmt(f.title)}</div>
            ${f.text ? `<p class="ui-text">${fmt(f.text)}</p>` : ''}
          </div>
          ${f.points ? `<div class="ui-badge">${fmt(f.points)}</div>` : ''}
        </div>
      </div>`;
    },
  },

  levelup: {
    name: 'Level up',
    width: 420,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Congratulations!' },
      { key: 'emoji', label: 'Icon (emoji or symbol)', type: 'text', default: '🔥' },
      { key: 'image', label: 'Icon image (overrides emoji)', type: 'image', default: '' },
      { key: 'skill', label: 'Skill', type: 'text', default: 'Cooking' },
      { key: 'level', label: 'Level', type: 'text', default: '99' },
      { key: 'text', label: 'Message', type: 'textarea', default: 'You can now cook **legendary udon**.' },
    ],
    render(f) {
      return `
      <div class="ui ui-levelup">
        <div class="ui-body center">
          <div class="ui-kicker">${fmt(f.heading)}</div>
          ${icon(f, 'ui-icon big')}
          <div class="ui-big">${fmt(f.skill)} <span class="lvl">${fmt(f.level)}</span></div>
          ${f.text ? `<p class="ui-text">${fmt(f.text)}</p>` : ''}
        </div>
      </div>`;
    },
  },
};

export const themes = [
  { id: 'stone', name: 'Old wood', colors: ['#2b2118', '#f2c14e'] },
  { id: 'parchment', name: 'Parchment', colors: ['#efe0bb', '#7a1f12'] },
  { id: 'pixel', name: '8-bit', colors: ['#1d1b2e', '#ffd23f'] },
  { id: 'arcane', name: 'Arcane', colors: ['#1a1433', '#b9a6ff'] },
  { id: 'hud', name: 'Sci-fi HUD', colors: ['#06141d', '#3ff0ff'] },
  { id: 'glass', name: 'Clean', colors: ['#1c1c22', '#7aa2ff'] },
];
