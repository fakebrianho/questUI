import { toPng, toBlob } from 'html-to-image';
import { templates, themes } from './templates.js';

// Fonts are bundled locally (not from a CDN) so the PNG exporter can embed them.
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/im-fell-english/latin-400.css';
import '@fontsource/im-fell-english/latin-400-italic.css';
import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/orbitron/latin-500.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import './app.css';
import './themes.css';

const STORE_KEY = 'quest-ui-generator:v1';
const $ = (s) => document.querySelector(s);

// ---------- state ----------
const clone = (v) => JSON.parse(JSON.stringify(v));
const defaultsFor = (tplKey) =>
  Object.fromEntries(templates[tplKey].fields.map((f) => [f.key, clone(f.default)]));
const defaultLook = (tplKey) => ({
  width: templates[tplKey].width,
  fontScale: 1,
  accent: '',
  opacity: 1,
  showRewards: true,
});
const hasRewards = (tplKey = state.template) => templates[tplKey].fields.some((f) => f.key === 'rewards');

let state = loadState() || { template: 'quest', theme: 'stone', bg: 'checker', data: {}, look: {} };
ensureTemplate(state.template);

function ensureTemplate(key) {
  if (!templates[key]) state.template = key = 'quest';
  state.data[key] = { ...defaultsFor(key), ...(state.data[key] || {}) };
  state.look[key] = { ...defaultLook(key), ...(state.look[key] || {}) };
}
const data = () => state.data[state.template];
const look = () => state.look[state.template];

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY));
  } catch {
    return null;
  }
}
let saveTimer;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* storage full (large images) — the session still works */
    }
  }, 250);
}

// ---------- preview ----------
const frame = $('#frame');
function renderPreview() {
  const tpl = templates[state.template];
  frame.innerHTML = tpl.render({ ...data(), showRewards: !hasRewards() || look().showRewards !== false });
  const ui = frame.firstElementChild;
  ui.classList.add(`theme-${state.theme}`);
  const l = look();
  ui.style.setProperty('--w', `${l.width}px`);
  ui.style.setProperty('--fs', l.fontScale);
  ui.style.setProperty('--op', l.opacity);
  if (l.accent) ui.style.setProperty('--accent', l.accent);
  saveState();
}

// ---------- pickers ----------
function renderPickers() {
  $('#templatePicker').innerHTML = Object.entries(templates)
    .map(([k, t]) => `<button type="button" data-tpl="${k}" class="${k === state.template ? 'on' : ''}">${t.name}</button>`)
    .join('');
  $('#themePicker').innerHTML = themes
    .map(
      (t) =>
        `<button type="button" data-theme="${t.id}" class="${t.id === state.theme ? 'on' : ''}"><span class="dot" style="background:linear-gradient(135deg,${t.colors[0]} 50%,${t.colors[1]} 50%)"></span>${t.name}</button>`
    )
    .join('');
  document.querySelectorAll('#bgPicker button').forEach((b) => b.classList.toggle('on', b.dataset.bg === state.bg));
  $('#stage').className = `stage bg-${state.bg}`;
}

$('#templatePicker').addEventListener('click', (e) => {
  const k = e.target.closest('button')?.dataset.tpl;
  if (!k || k === state.template) return;
  state.template = k;
  ensureTemplate(k);
  renderAll();
});
$('#themePicker').addEventListener('click', (e) => {
  const id = e.target.closest('button')?.dataset.theme;
  if (!id) return;
  state.theme = id;
  renderPickers();
  renderPreview();
  syncLook();
});
$('#bgPicker').addEventListener('click', (e) => {
  const bg = e.target.closest('button')?.dataset.bg;
  if (!bg) return;
  state.bg = bg;
  renderPickers();
  saveState();
});

// ---------- field editors ----------
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => k != null && n.append(k));
  return n;
};

function renderFields() {
  const box = $('#fields');
  box.innerHTML = '';
  const d = data();
  for (const f of templates[state.template].fields) {
    box.append(fieldEditor(f, d));
  }
  box.append(el('p', { className: 'hint', textContent: 'Tip: wrap words in **double stars** to highlight them, *single stars* for italics.' }));
}

function fieldEditor(f, d) {
  const set = (v) => {
    d[f.key] = v;
    renderPreview();
  };
  if (f.type === 'toggle') {
    const cb = el('input', { type: 'checkbox', checked: !!d[f.key] });
    cb.addEventListener('change', () => set(cb.checked));
    return el('div', { className: 'field' }, el('label', { className: 'toggle' }, cb, f.label));
  }

  let input;
  if (f.type === 'text') {
    input = el('input', { type: 'text', value: d[f.key] ?? '' });
    input.addEventListener('input', () => set(input.value));
  } else if (f.type === 'textarea') {
    input = el('textarea', { value: d[f.key] ?? '' });
    input.addEventListener('input', () => set(input.value));
  } else if (f.type === 'select') {
    input = el('select', {}, f.options.map((o) => el('option', { value: o.value, textContent: o.label })));
    input.value = d[f.key];
    input.addEventListener('change', () => set(input.value));
  } else if (f.type === 'list') {
    input = listEditor(f, d);
  } else if (f.type === 'image') {
    input = imageEditor(f, d);
  }
  return el('div', { className: 'field' }, el('span', { textContent: f.label }), input);
}

function listEditor(f, d) {
  const wrap = el('div', { className: 'list' });
  const items = () => d[f.key] || (d[f.key] = []);
  const draw = (focusIndex) => {
    wrap.innerHTML = '';
    items().forEach((it, i) => {
      const row = el('div', { className: 'list-row' });
      if (f.checkable) {
        const cb = el('input', { type: 'checkbox', checked: !!it.done, title: 'Done' });
        cb.addEventListener('change', () => {
          it.done = cb.checked;
          renderPreview();
        });
        row.append(cb);
      }
      const t = el('input', { type: 'text', value: it.text });
      t.addEventListener('input', () => {
        it.text = t.value;
        renderPreview();
      });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          items().splice(i + 1, 0, f.checkable ? { text: '', done: false } : { text: '' });
          draw(i + 1);
          renderPreview();
        }
      });
      const btn = (label, title, fn) => {
        const b = el('button', { type: 'button', className: 'icon-btn', textContent: label, title });
        b.addEventListener('click', () => {
          fn();
          draw();
          renderPreview();
        });
        return b;
      };
      row.append(
        t,
        btn('↑', 'Move up', () => i > 0 && items().splice(i - 1, 0, items().splice(i, 1)[0])),
        btn('↓', 'Move down', () => i < items().length - 1 && items().splice(i + 1, 0, items().splice(i, 1)[0])),
        btn('✕', 'Remove', () => items().splice(i, 1))
      );
      wrap.append(row);
      if (i === focusIndex) requestAnimationFrame(() => t.focus());
    });
    const add = el('button', { type: 'button', className: 'add-btn', textContent: '+ Add line' });
    add.addEventListener('click', () => {
      items().push(f.checkable ? { text: '', done: false } : { text: '' });
      draw(items().length - 1);
      renderPreview();
    });
    wrap.append(add);
  };
  draw();
  return wrap;
}

function imageEditor(f, d) {
  const wrap = el('div', { className: 'img-field' });
  const draw = () => {
    wrap.innerHTML = '';
    const file = el('input', { type: 'file', accept: 'image/*', hidden: true });
    const pick = el('label', { className: 'filebtn', textContent: d[f.key] ? 'Replace' : 'Upload image' }, file);
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      d[f.key] = await shrinkImage(file.files[0], 512);
      draw();
      renderPreview();
    });
    if (d[f.key]) {
      const clear = el('button', { type: 'button', className: 'mini', textContent: 'Remove' });
      clear.addEventListener('click', () => {
        d[f.key] = '';
        draw();
        renderPreview();
      });
      wrap.append(el('img', { src: d[f.key], alt: '' }), pick, clear);
    } else wrap.append(pick);
  };
  draw();
  return wrap;
}

// Keep uploaded images small so presets and autosave stay light.
function shrinkImage(file, max) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        if (s === 1 && file.size < 400_000) return resolve(reader.result);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- look controls ----------
function bindRange(id, key, fmtOut) {
  const input = $(`#${id}`);
  const out = $(`#${id}Out`);
  input.addEventListener('input', () => {
    look()[key] = Number(input.value);
    out.textContent = fmtOut(input.value);
    renderPreview();
  });
  return () => {
    input.value = look()[key];
    out.textContent = fmtOut(look()[key]);
  };
}
const syncers = [
  bindRange('width', 'width', (v) => `${v}`),
  bindRange('fontScale', 'fontScale', (v) => `${Math.round(v * 100)}%`),
  bindRange('opacity', 'opacity', (v) => `${Math.round(v * 100)}%`),
];
const accentInput = $('#accent');
accentInput.addEventListener('input', () => {
  look().accent = accentInput.value;
  renderPreview();
});
$('#accentReset').addEventListener('click', () => {
  look().accent = '';
  syncLook();
  renderPreview();
});
const rewardsGroup = $('#rewardsGroup');
const showRewardsInput = $('#showRewards');
showRewardsInput.addEventListener('change', () => {
  look().showRewards = showRewardsInput.checked;
  renderPreview();
});
function syncRewards() {
  const on = hasRewards();
  rewardsGroup.hidden = !on;
  showRewardsInput.checked = !on || look().showRewards !== false;
}
function syncLook() {
  syncers.forEach((s) => s());
  syncRewards();
  if (look().accent) accentInput.value = look().accent;
  else {
    const ui = frame.firstElementChild;
    const c = ui && getComputedStyle(ui).getPropertyValue('--accent').trim();
    accentInput.value = /^#[0-9a-f]{6}$/i.test(c) ? c : '#f2c14e';
  }
}

// ---------- export ----------
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

function exportOptions() {
  const bg = $('#exportBg').value;
  return {
    pixelRatio: Number($('#exportScale').value),
    backgroundColor: bg === 'transparent' ? undefined : bg,
    cacheBust: true,
  };
}

function fileName() {
  const d = data();
  const base = d.title || d.skill || d.heading || state.template;
  const slug = String(base).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ui';
  return `${slug}-${state.template}-${state.theme}@${$('#exportScale').value}x.png`;
}

async function capture(fn) {
  await document.fonts.ready;
  return fn(frame, exportOptions());
}

$('#exportBtn').addEventListener('click', async () => {
  try {
    const url = await capture(toPng);
    const a = el('a', { href: url, download: fileName() });
    document.body.append(a);
    a.click();
    a.remove();
    toast('PNG downloaded');
  } catch (err) {
    console.error(err);
    toast("Couldn't export. Check the console.");
  }
});

$('#copyBtn').addEventListener('click', async () => {
  try {
    const blob = await capture(toBlob);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('Copied to clipboard');
  } catch (err) {
    console.error(err);
    toast("Your browser blocked clipboard images. Use Download instead.");
  }
});

// ---------- presets ----------
$('#savePreset').addEventListener('click', () => {
  const preset = {
    app: 'quest-ui-generator',
    version: 1,
    template: state.template,
    theme: state.theme,
    data: data(),
    look: look(),
  };
  const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: fileName().replace(/@\dx\.png$/, '.json') });
  a.click();
  URL.revokeObjectURL(url);
  toast('Preset saved');
});

$('#loadPreset').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const p = JSON.parse(await file.text());
    if (!templates[p.template]) throw new Error('Unknown layout');
    state.template = p.template;
    if (themes.some((t) => t.id === p.theme)) state.theme = p.theme;
    state.data[p.template] = p.data || {};
    state.look[p.template] = p.look || {};
    ensureTemplate(p.template);
    renderAll();
    toast('Preset loaded');
  } catch {
    toast("That file isn't a preset from this app.");
  }
});

$('#resetTemplate').addEventListener('click', () => {
  state.data[state.template] = defaultsFor(state.template);
  state.look[state.template] = defaultLook(state.template);
  renderAll();
  toast('Layout reset to defaults');
});

// ---------- boot ----------
function renderAll() {
  renderPickers();
  renderFields();
  renderPreview();
  syncLook();
}
renderAll();
