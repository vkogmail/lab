// Lab Token Sync — main thread (Figma sandbox)
//
// Responsibilities:
//   - persist connection settings in figma.clientStorage (the "one-time auth")
//   - on a Pull, take the token JSON the UI fetched from Git Provider and write
//     the values onto the EXISTING Figma variables named in $themes.json's
//     $figmaVariableReferences (token path -> variable id).
//
// The UI iframe does all the network I/O (only it can fetch); this thread does
// all the figma.variables work. They talk over postMessage.

figma.showUI(__html__, { width: 440, height: 560, themeColors: true });

const SETTINGS_KEY = 'lab-token-sync-settings';
const SNAPSHOT_KEY = 'lab-token-sync-snapshot';
const SCHEMA_KEY = 'lab-token-sync-schema';
const STORAGE_SCHEMA = 2;

/** Old keys from earlier plugin builds builds — never read, always delete. */
const LEGACY_STORAGE_KEYS = [
  'legacy-token-sync-settings',
  'legacy-token-sync-snapshot',
  'universal-ds-token-sync-settings',
  'universal-ds-token-sync-snapshot',
];

const TEAM_DEFAULTS = {
  workspace: '',
  project: '',
  repo: '',
  branch: 'main',
  pat: '',
};

function mergeTeamDefaults(stored) {
  const s = stored && typeof stored === 'object' ? stored : {};
  const out = Object.assign({}, TEAM_DEFAULTS);
  Object.keys(out).forEach(function (k) {
    const v = s[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = String(v).trim();
  });
  return out;
}

async function purgeLegacyStorage() {
  for (var i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
    try { await figma.clientStorage.deleteAsync(LEGACY_STORAGE_KEYS[i]); } catch (e) { /* ignore */ }
  }
}

async function loadSettings() {
  await purgeLegacyStorage();
  var schema = await figma.clientStorage.getAsync(SCHEMA_KEY);
  if (schema !== STORAGE_SCHEMA) {
    try { await figma.clientStorage.deleteAsync(SETTINGS_KEY); } catch (e) { /* ignore */ }
    try { await figma.clientStorage.deleteAsync(SNAPSHOT_KEY); } catch (e) { /* ignore */ }
    await figma.clientStorage.setAsync(SCHEMA_KEY, STORAGE_SCHEMA);
    return Object.assign({}, TEAM_DEFAULTS);
  }
  var stored = await figma.clientStorage.getAsync(SETTINGS_KEY);
  return mergeTeamDefaults(stored);
}

// --- boot: load anonymized defaults; legacy client connection blobs are purged ----
(async () => {
  var settings = await loadSettings();
  figma.ui.postMessage({ type: 'settings', settings: settings });
})();

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'save-settings') {
      await figma.clientStorage.setAsync(SETTINGS_KEY, msg.settings);
      log('Settings saved.', 'ok');
    } else if (msg.type === 'pull') {
      await runPull(msg.payload, !!msg.dryRun);
    } else if (msg.type === 'push') {
      await runPush(msg.payload);
    }
  } catch (err) {
    log('Error: ' + (err && err.message ? err.message : String(err)), 'warn');
  }
};

function log(line, level, pane) {
  figma.ui.postMessage({ type: 'log', line: line, level: level || 'info', pane: pane || 'pull' });
}

// --- Pull: tokens -> variables ----------------------------------------------
// Creates (or updates, by name) collections, modes and variables from the
// token JSON. Works in a clean file (creates everything) and re-runs safely
// (reuses anything already present with the same name).
async function runPull(payload, dryRun) {
  const themes = payload.themes || [];
  const sets = payload.sets || {};

  // Group themes into collections by their `group`; each theme becomes a mode.
  //   Foundation → 1 mode · Mode → Light/Dark · Breakpoint → XS..XL
  // The variable set is driven by the ACTUAL token leaves (not the stale
  // $figmaVariableReferences, which both over- and under-lists what exists).
  const groups = [];
  const groupIndex = {};
  for (const th of themes) {
    const g = th.group || th.name;
    if (groupIndex[g] === undefined) { groupIndex[g] = groups.length; groups.push({ name: g, themes: [] }); }
    groups[groupIndex[g]].themes.push(th);
  }

  // Per-theme merged token tree (enabled sets), cached for both passes.
  const treeOf = new Map();
  function tree(th) {
    if (!treeOf.has(th)) {
      const enabled = Object.keys(th.selectedTokenSets || {}).filter((k) => th.selectedTokenSets[k] === 'enabled');
      const t = {};
      for (const s of enabled) deepMerge(t, sets[s] || {});
      treeOf.set(th, t);
    }
    return treeOf.get(th);
  }

  // The bindable leaf paths for a group = union over its themes of scalar leaves
  // (composite boxShadow/typography leaves have object $value and are excluded).
  function groupPaths(g) {
    const out = {};
    for (const th of g.themes) collectScalarLeaves(tree(th), out, '');
    return out; // path -> figma type
  }

  // Existing collections / variables, indexed by name for idempotent reuse.
  const existingColls = await figma.variables.getLocalVariableCollectionsAsync();
  const collByName = new Map();
  for (const c of existingColls) collByName.set(c.name, c);
  const existingVars = await figma.variables.getLocalVariablesAsync();
  const varByCollAndName = new Map(); // collId::name -> Variable
  for (const v of existingVars) varByCollAndName.set(v.variableCollectionId + '::' + v.name, v);
  const textByName = new Map();   // text-style name -> TextStyle
  const effectByName = new Map(); // effect-style name -> EffectStyle
  for (const s of await figma.getLocalTextStylesAsync()) textByName.set(s.name, s);
  for (const s of await figma.getLocalEffectStylesAsync()) effectByName.set(s.name, s);

  // Snapshot of pre-run state, for the new/changed/unchanged diff (read-only).
  const existingVarById = new Map(existingVars.map((v) => [v.id, v]));
  const collById = new Map(existingColls.map((c) => [c.id, c]));
  const snapValue = new Map();                       // collName::varName::mode -> current value
  for (const v of existingVars) {
    const c = collById.get(v.variableCollectionId);
    if (!c) continue;
    for (const m of c.modes) snapValue.set(c.name + '::' + v.name + '::' + m.name.toLowerCase(), v.valuesByMode[m.modeId]);
  }
  let diffNew = 0, diffChanged = 0, diffSame = 0;

  // Last-synced snapshot (clientStorage) → lets us tell WHO changed: repo (incoming),
  // Figma (outgoing), or both (conflict).
  const lastSync = (await figma.clientStorage.getAsync(SNAPSHOT_KEY)) || {};
  const hasBaseline = Object.keys(lastSync).length > 0;
  const snapMap = {};                              // all repo values → baseline after an apply
  const newBaseline = Object.assign({}, lastSync); // agreed values, persisted each check
  let incoming = 0, outgoing = 0, conflict = 0, unknown = 0;
  const pullPreview = []; // { mode, path, before, after } — repo values to apply in Figma

  const pathVar = new Map(); // token path (dotted) -> Variable  (for alias resolution)
  const modeOf = new Map();  // theme -> modeId
  let createdColls = 0, createdVars = 0, reusedVars = 0;

  // ---- PASS 1: ensure collections, modes, variables exist --------------------
  for (const g of groups) {
    g.pathType = groupPaths(g);
    const paths = Object.keys(g.pathType);
    if (!paths.length) { log('· ' + g.name + ' — no bindable variables, skipped'); continue; }

    let coll = collByName.get(g.name);
    if (!coll && !dryRun) { coll = figma.variables.createVariableCollection(g.name); collByName.set(g.name, coll); }
    log((coll ? '▸ ' : '+ ') + g.name + ' — ' + g.themes.length + ' mode(s), ' + paths.length + ' variables' + (coll ? '' : ' (new)'));
    if (!coll) createdColls++;

    const modeMap = coll ? ensureModes(coll, g.themes.map((t) => t.name), dryRun) : {};
    for (const th of g.themes) modeOf.set(th, modeMap[th.name]);

    for (const path of paths) {
      const type = g.pathType[path];
      const name = path.split('.').join('/');
      if (dryRun) { createdVars++; continue; }
      let v = varByCollAndName.get(coll.id + '::' + name);
      if (v && v.resolvedType !== type) log('  ⚠ type mismatch on ' + name + ' (' + v.resolvedType + '≠' + type + '), reusing');
      if (!v) { v = figma.variables.createVariable(name, coll, type); varByCollAndName.set(coll.id + '::' + name, v); createdVars++; }
      else reusedVars++;
      pathVar.set(path, v);
    }
  }

  // ---- PASS 2: set values per mode (aliases resolve to vars from pass 1) ------
  let values = 0, aliases = 0, skipped = 0;
  for (const g of groups) {
    const paths = Object.keys(g.pathType || {});
    if (!paths.length) continue;
    for (const th of g.themes) {
      const modeId = modeOf.get(th);
      const t = tree(th);
      for (const path of paths) {
        const leaf = getLeaf(t, path);
        if (!leaf || leaf.$value === undefined || typeof leaf.$value === 'object') continue; // not in this mode
        const raw = leaf.$value;
        const alias = typeof raw === 'string' && raw.match(/^\{([^}]+)\}$/);

        // classify vs current Figma state: new / changed / unchanged
        const key = g.name + '::' + path.split('.').join('/') + '::' + th.name.toLowerCase();
        const prev = snapValue.get(key);
        const targetN = tokenTargetNorm(raw, g.pathType[path]);   // the repo's value, normalised
        snapMap[key] = targetN;                                   // record repo value → new baseline on apply
        if (prev === undefined) diffNew++;
        else if (targetN === varValueNorm(prev, g.pathType[path], existingVarById)) diffSame++;
        else diffChanged++;

        // three-way (needs a baseline): who moved — repo, Figma, or both?
        if (prev !== undefined) {
          const currentN = varValueNorm(prev, g.pathType[path], existingVarById);
          if (targetN === currentN) {
            newBaseline[key] = currentN;              // agreed right now → (re)establish baseline
          } else {
            if (dryRun) pullPreview.push({ mode: th.name, path: path, before: currentN, after: raw });
            const snap = lastSync[key];
            if (snap === undefined) unknown++;        // no baseline → can't attribute
            else if (currentN === snap) incoming++;   // Figma still matches baseline → repo moved
            else if (targetN === snap) outgoing++;    // repo still matches baseline → Figma moved
            else conflict++;                          // both moved
          }
        } else if (dryRun && prev === undefined) {
          pullPreview.push({ mode: th.name, path: path, before: null, after: raw });
        }

        if (alias) {
          if (dryRun) { aliases++; continue; }
          const target = pathVar.get(alias[1]);
          const v = pathVar.get(path);
          if (target) { v.setValueForMode(modeId, figma.variables.createVariableAlias(target)); aliases++; continue; }
          // alias target isn't its own variable — inline the resolved concrete value
          const val = coerce(v.resolvedType, resolveAlias(raw, sets));
          if (val === null) { log('  ⚠ unresolved alias ' + path + ' → {' + alias[1] + '}'); skipped++; continue; }
          v.setValueForMode(modeId, val); values++;
        } else {
          const type = g.pathType[path];
          const val = coerce(type, raw);
          if (val === null) { log('  ⚠ unparseable ' + type + ': ' + path + ' = ' + JSON.stringify(raw)); skipped++; continue; }
          if (dryRun) { values++; continue; }
          pathVar.get(path).setValueForMode(modeId, val); values++;
        }
      }
    }
  }

  // Global merged tree (all sets) for resolving composite references to concrete values.
  const globalTree = {};
  for (const k in sets) deepMerge(globalTree, sets[k]);

  // ---- PASS 3: text styles from typography composites ------------------------
  let textNew = 0, textReused = 0, textSkipped = 0;
  let fontMap = null, fontWarned = false;
  if (!dryRun) {
    fontMap = new Map(); // family -> Set(styles)
    for (const f of await figma.listAvailableFontsAsync()) {
      if (!fontMap.has(f.fontName.family)) fontMap.set(f.fontName.family, new Set());
      fontMap.get(f.fontName.family).add(f.fontName.style);
    }
  }
  for (const sk in sets) {
    const comps = [];
    collectComposite(sets[sk], 'typography', comps, '');
    for (const c of comps) {
      const name = c.path.replace(/^typography\./, '').split('.').join('/');
      if (dryRun) { textByName.has(name) ? textReused++ : textNew++; continue; }
      try {
        const family = String(resolveRef(c.value.fontFamily, globalTree));
        let style = String(resolveRef(c.value.fontWeight, globalTree));
        if (!fontMap.has(family)) {
          if (!fontWarned) {
            log('  ⚠ Font "' + family + '" is not available in this file. Open it in the Figma DESKTOP app, then Apply again. Skipping text styles.');
            fontWarned = true;
          }
          textSkipped++; continue;
        }
        if (!fontMap.get(family).has(style)) {
          const fb = fontMap.get(family).has('Regular') ? 'Regular' : fontMap.get(family).values().next().value;
          log('  ⚠ "' + family + ' ' + style + '" missing — using "' + fb + '" for ' + name);
          style = fb;
        }
        await figma.loadFontAsync({ family: family, style: style });
        let st = textByName.get(name);
        if (!st) { st = figma.createTextStyle(); st.name = name; textByName.set(name, st); textNew++; } else textReused++;
        st.fontName = { family: family, style: style };
        const fs = toFloat(resolveRef(c.value.fontSize, globalTree));
        if (fs !== null) st.fontSize = fs;
        st.lineHeight = parseLineHeight(c.value.lineHeight, globalTree);
        st.letterSpacing = parsePercent(resolveRef(c.value.letterSpacing, globalTree));
        bindStyleField(st, 'fontFamily', pathVar.get(refPath(c.value.fontFamily)));
        bindStyleField(st, 'fontStyle', pathVar.get(refPath(c.value.fontWeight)));
        bindStyleField(st, 'fontSize', pathVar.get(refPath(c.value.fontSize)));
      } catch (e) { log('  ⚠ text "' + name + '": ' + (e && e.message ? e.message : e)); textSkipped++; }
    }
  }

  // ---- PASS 4: effect styles from boxShadow tokens ---------------------------
  let fxNew = 0, fxReused = 0, fxSkipped = 0;
  const shadowByName = new Map();
  for (const sk in sets) {
    const found = [];
    collectComposite(sets[sk], 'boxShadow', found, '');
    for (const s of found) {
      const name = s.path.split('.').join('/');
      const prev = shadowByName.get(name);
      if (!prev || (refPath(s.value.color) && !refPath(prev.value.color))) shadowByName.set(name, s);
    }
  }
  {
    for (const s of shadowByName.values()) {
      const name = s.path.split('.').join('/');
      if (dryRun) { effectByName.has(name) ? fxReused++ : fxNew++; continue; }
      try {
        const v = s.value;
        const color = parseColor(resolveRef(v.color, globalTree)) || { r: 0, g: 0, b: 0, a: 0 };
        const effect = {
          type: v.type === 'innerShadow' ? 'INNER_SHADOW' : 'DROP_SHADOW',
          color: color,
          offset: { x: toFloat(v.x) || 0, y: toFloat(v.y) || 0 },
          radius: toFloat(v.blur) || 0,
          spread: toFloat(v.spread) || 0,
          visible: true, blendMode: 'NORMAL'
        };
        const colorVar = pathVar.get(refPath(v.color));
        if (colorVar) effect.boundVariables = { color: figma.variables.createVariableAlias(colorVar) };
        let st = effectByName.get(name);
        if (!st) { st = figma.createEffectStyle(); st.name = name; effectByName.set(name, st); fxNew++; } else fxReused++;
        st.effects = [effect];
      } catch (e) { log('  ⚠ effect "' + name + '": ' + (e && e.message ? e.message : e)); fxSkipped++; }
    }
  }

  // ---- PASS 5: column grid styles from breakpoint columns/gutter/margin ------
  let gridNew = 0, gridReused = 0;
  const bpGroup = groups.find((g) => g.themes.some((t) => getLeaf(tree(t), 'breakpoint.columns')));
  if (bpGroup) {
    const gridByName = new Map();
    for (const gs of await figma.getLocalGridStylesAsync()) gridByName.set(gs.name, gs);
    for (const th of bpGroup.themes) {
      const t = tree(th);
      const count = toFloat(leafValue(t, 'breakpoint.columns'));
      if (count === null) continue;
      const name = 'grid/' + th.name.toLowerCase();
      if (dryRun) { gridByName.has(name) ? gridReused++ : gridNew++; continue; }
      const grid = {
        pattern: 'COLUMNS', visible: true, alignment: 'STRETCH',
        color: { r: 1, g: 0, b: 0, a: 0.1 },
        count: count,
        gutterSize: toFloat(leafValue(t, 'breakpoint.gutter')) || 0,
        offset: toFloat(leafValue(t, 'breakpoint.margin')) || 0
      };
      let gs = gridByName.get(name);
      if (!gs) { gs = figma.createGridStyle(); gs.name = name; gridByName.set(name, gs); gridNew++; } else gridReused++;
      gs.layoutGrids = [grid];
    }
  }

  const newStyles = textNew + fxNew + gridNew;
  const nothingToDo = diffNew === 0 && diffChanged === 0 && newStyles === 0;
  if (nothingToDo) {
    log('✓ ' + (dryRun ? 'Preview' : 'Done') + ' — no changes. The file already matches the repo (' + diffSame + ' values checked).', 'ok');
  } else {
    log('▸ Summary — new: ' + diffNew + ', differs: ' + diffChanged + ', unchanged: ' + diffSame);
    if (textNew + fxNew + gridNew) {
      log('▸ Styles — text +' + textNew + ', effect +' + fxNew + ', grid +' + gridNew +
          (textSkipped + fxSkipped ? ' (skipped ' + (textSkipped + fxSkipped) + ')' : ''));
    }
    if (dryRun && pullPreview.length) {
      log('▸ From repo (' + pullPreview.length + ' value' + (pullPreview.length === 1 ? '' : 's') + ')', 'dim');
      for (const c of pullPreview) {
        const from = c.before === null ? '(new)' : fmt(c.before);
        log('  ↓ [' + c.mode + '] ' + c.path + ': ' + from + ' → ' + fmt(c.after));
      }
    }
    log('✓ ' + (dryRun ? 'Ready — click Update to apply.'
                       : 'Applied — ' + (diffNew + diffChanged) + ' values written, ' + newStyles + ' styles created.'), 'ok');
  }
  const pullChanges = incoming + conflict + (hasBaseline ? 0 : unknown);
  const pullCount = diffNew + newStyles + pullChanges;
  const pushCount = outgoing;

  let state;
  if (conflict || (incoming && pushCount)) state = 'diverged';
  else if (pullCount === 0 && pushCount === 0) state = 'insync';
  else if (pushCount && !pullCount) state = 'outgoing';
  else state = 'incoming';

  const pullChips = [];
  if (diffNew) pullChips.push({ t: diffNew + ' new', k: 'new' });
  if (incoming + (hasBaseline ? 0 : unknown)) pullChips.push({ t: (incoming + (hasBaseline ? 0 : unknown)) + ' incoming', k: 'changed' });
  if (newStyles) pullChips.push({ t: newStyles + ' new styles', k: 'new' });
  if (conflict) pullChips.push({ t: conflict + ' conflict', k: 'changed' });
  const pushChips = [];
  if (pushCount) pushChips.push({ t: pushCount + ' changed', k: 'changed' });

  let pushChanges = [];
  if (dryRun && pushCount > 0) {
    const plan = await buildPushPlan(themes, sets);
    pushChanges = plan.changes;
    log('▸ From Figma (' + pushChanges.length + ' change' + (pushChanges.length === 1 ? '' : 's') + ')', 'dim', 'push');
    for (const c of pushChanges) log('  ↑ [' + c.mode + '] ' + c.path + ': ' + fmt(c.before) + ' → ' + fmt(c.after), 'info', 'push');
  }

  figma.ui.postMessage({
    type: 'status', state: state, incoming: pullCount, outgoing: pushCount, conflict: conflict,
    pull: { count: pullCount, nothingToDo: pullCount === 0, chips: pullChips },
    push: { count: pushCount, nothingToDo: pushCount === 0, chips: pushChips, changes: pushChanges }
  });

  await figma.clientStorage.setAsync(SNAPSHOT_KEY, dryRun ? newBaseline : snapMap);

  figma.ui.postMessage({ type: 'done', dryRun: dryRun, nothingToDo: pullCount === 0 });
  if (!dryRun) figma.notify('Pulled — ' + (diffNew + incoming) + ' variables updated');
}

function leafValue(tree, path) { const l = getLeaf(tree, path); return l ? l.$value : undefined; }

async function runPush(payload) {
  const themes = (payload && payload.themes) || [];
  const sets = (payload && payload.sets) || {};
  if (!themes.length) { log('⚠ Push needs the repo tokens — fetch failed?', 'warn', 'push'); return; }

  const plan = await buildPushPlan(themes, sets);
  log('▸ From Figma (' + plan.changes.length + ' change' + (plan.changes.length === 1 ? '' : 's') + ')', 'dim', 'push');
  for (const c of plan.changes) log('  ↑ [' + c.mode + '] ' + c.path + ': ' + fmt(c.before) + ' → ' + fmt(c.after), 'info', 'push');

  figma.ui.postMessage({
    type: 'push-plan',
    branch: plan.branch,
    changes: plan.changes,
    files: plan.patched,
    gist: plan.gist
  });
}

async function buildPushPlan(themes, sets) {
  const vars = await figma.variables.getLocalVariablesAsync();
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const varById = new Map(vars.map((v) => [v.id, v]));
  const lastSync = (await figma.clientStorage.getAsync(SNAPSHOT_KEY)) || {};

  const themeByCollMode = new Map();
  for (const th of themes) themeByCollMode.set((th.group || th.name) + '::' + th.name, th);
  function enabledSets(th) { return Object.keys(th.selectedTokenSets || {}).filter((k) => th.selectedTokenSets[k] === 'enabled'); }
  function sourceSetFor(th, path) {
    for (const s of enabledSets(th)) { const leaf = getLeaf(sets[s], path); if (leaf && leaf.$value !== undefined) return s; }
    return null;
  }

  const changes = [];
  const patched = {};

  for (const coll of colls) {
    const collVars = vars.filter((v) => v.variableCollectionId === coll.id);
    for (const mode of coll.modes) {
      const th = themeByCollMode.get(coll.name + '::' + mode.name);
      if (!th) continue;
      for (const v of collVars) {
        const path = v.name.split('/').join('.');
        const setName = sourceSetFor(th, path);
        if (!setName) continue;
        const repoLeaf = getLeaf(sets[setName], path);
        const type = v.resolvedType;
        const figmaVal = reverseValue(v.valuesByMode[mode.modeId], v, varById);

        const repoN = normForDiff(repoLeaf.$value, type);
        const figmaN = normForDiff(figmaVal, type);
        if (repoN === figmaN) continue;
        const snap = lastSync[coll.name + '::' + v.name + '::' + mode.name.toLowerCase()];
        if (snap === undefined || repoN !== snap) continue;

        const after = formatLikeSource(figmaVal, repoLeaf.$value, type);
        changes.push({ file: setName, path: path, mode: mode.name, before: repoLeaf.$value, after: after });
        if (!patched[setName]) patched[setName] = JSON.parse(JSON.stringify(sets[setName]));
        setDeep(patched[setName], path.split('.'), Object.assign({}, repoLeaf, { $value: after }));
      }
    }
  }

  let user = 'designer';
  try { if (figma.currentUser && figma.currentUser.name) user = figma.currentUser.name; } catch (e) { /* permission missing */ }
  const branch = 'tokens/figma-sync/' + slug(user);
  return { changes: changes, patched: patched, user: user, branch: branch, gist: buildGist(changes, user, branch) };
}

function fmt(v) { return typeof v === 'object' ? JSON.stringify(v) : String(v); }
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'designer'; }

function formatLikeSource(figmaVal, sourceVal, type) {
  if (typeof figmaVal === 'string' && /^\{[^}]+\}$/.test(figmaVal)) return figmaVal;
  if (type === 'COLOR') return typeof figmaVal === 'string' ? figmaVal.toUpperCase() : figmaVal;
  if (type === 'FLOAT') {
    const n = typeof figmaVal === 'number' ? figmaVal : toFloat(figmaVal);
    if (n === null) return figmaVal;
    const s = String(sourceVal || '');
    const r = (x) => Math.round(x * 10000) / 10000;
    if (/rem$/i.test(s)) return r(n / 16) + 'rem';
    if (/px$/i.test(s)) return r(n) + 'px';
    if (/%$/.test(s)) return r(n) + '%';
    return r(n);
  }
  return figmaVal;
}

function buildGist(changes, user, branch) {
  const byFile = {};
  for (const c of changes) (byFile[c.file] = byFile[c.file] || []).push(c);
  const fileNames = Object.keys(byFile);
  const title = fileNames.length === 1
    ? 'Update ' + changes.length + ' ' + fileNames[0] + ' token' + (changes.length === 1 ? '' : 's') + ' from Figma'
    : 'Sync ' + changes.length + ' token change' + (changes.length === 1 ? '' : 's') + ' from Figma';

  let body = 'Pushed from Figma via **Lab Token Sync** by ' + user + '.\n\n';
  body += '**' + changes.length + ' changed**\n';
  for (const f of fileNames) {
    body += '\n### `' + f + '`\n\n| Token | Before | After |\n|---|---|---|\n';
    for (const c of byFile[f]) body += '| `' + c.path + '` | `' + fmt(c.before) + '` | `' + fmt(c.after) + '` |\n';
  }
  body += '\n—\n🤖 Generated automatically · branch `' + branch + '` · do not hand-edit token files in this PR.\n';
  return { title: title, body: body };
}

function pushSetName(coll, mode) {
  const c = coll.name.toLowerCase();
  if (coll.modes.length === 1) return c;
  return c + '/' + mode.name.toLowerCase();
}

function pushType(resolvedType) {
  if (resolvedType === 'COLOR') return 'color';
  if (resolvedType === 'FLOAT') return 'dimension';
  if (resolvedType === 'BOOLEAN') return 'boolean';
  return 'string';
}

function reverseValue(raw, v, varById) {
  if (raw && raw.type === 'VARIABLE_ALIAS') {
    const target = varById.get(raw.id);
    return target ? '{' + target.name.split('/').join('.') + '}' : null;
  }
  if (v.resolvedType === 'COLOR' && raw && typeof raw === 'object') return rgbaToHex(raw);
  return raw;
}

function normForDiff(value, resolvedType) {
  if (typeof value === 'string' && /^\{[^}]+\}$/.test(value.trim())) return value.trim();
  if (resolvedType === 'COLOR') { const c = parseColor(value) || (typeof value === 'object' ? value : null); return c ? rgbaToHex(c) : String(value); }
  if (resolvedType === 'FLOAT') { const n = toFloat(value); return n === null ? String(value) : String(Math.round(n * 1000) / 1000); }
  return String(value);
}

function rgbaToHex(c) {
  const h = (n) => ('0' + Math.round(n * 255).toString(16)).slice(-2);
  const base = '#' + h(c.r) + h(c.g) + h(c.b);
  return c.a < 1 ? base + h(c.a) : base;
}

function tokenTargetNorm(raw, type) {
  if (typeof raw === 'string') { const m = raw.match(/^\{([^}]+)\}$/); if (m) return '{' + m[1] + '}'; }
  if (type === 'COLOR') { const c = parseColor(raw); return c ? rgbaToHex(c) : String(raw); }
  if (type === 'FLOAT') { const n = toFloat(raw); return n === null ? String(raw) : String(Math.round(n * 1000) / 1000); }
  return String(raw);
}

function varValueNorm(value, type, varById) {
  if (value && value.type === 'VARIABLE_ALIAS') { const t = varById.get(value.id); return t ? '{' + t.name.split('/').join('.') + '}' : '{?}'; }
  if (type === 'COLOR' && value && typeof value === 'object') return rgbaToHex(value);
  if (type === 'FLOAT') { const n = toFloat(value); return n === null ? String(value) : String(Math.round(n * 1000) / 1000); }
  return String(value);
}

function setDeep(tree, pathArr, leaf) {
  let n = tree;
  for (let i = 0; i < pathArr.length - 1; i++) { n[pathArr[i]] = n[pathArr[i]] || {}; n = n[pathArr[i]]; }
  n[pathArr[pathArr.length - 1]] = leaf;
}

function collectScalarLeaves(tree, out, pre) {
  for (const k in tree) {
    if (k[0] === '_') continue;
    const v = tree[k];
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const path = pre ? pre + '.' + k : k;
    if (v.$value !== undefined) {
      if (typeof v.$value === 'object' || v.$type === 'other') continue;
      if (/not exportable|code[ -]?use only|code[ -]?only/i.test(v.$description || '')) continue;
      out[path] = figmaType(v.$type, v.$value);
    } else {
      collectScalarLeaves(v, out, path);
    }
  }
}

function ensureModes(coll, names, dryRun) {
  const map = {};
  const existing = {};
  coll.modes.forEach((m) => { existing[m.name.toLowerCase()] = m.modeId; });
  let usedDefault = false;
  for (const name of names) {
    const lc = name.toLowerCase();
    if (existing[lc] !== undefined) { map[name] = existing[lc]; continue; }
    if (dryRun) { map[name] = 'dry:' + name; continue; }
    if (!usedDefault && coll.modes.length === 1) {
      coll.renameMode(coll.defaultModeId, name);
      map[name] = coll.defaultModeId; usedDefault = true;
    } else {
      map[name] = coll.addMode(name);
    }
    existing[lc] = map[name];
  }
  return map;
}

function resolveAlias(value, sets) {
  let v = value, guard = 0;
  while (typeof v === 'string' && /^\{[^}]+\}$/.test(v) && guard++ < 20) {
    const path = v.slice(1, -1);
    let leaf;
    for (const k in sets) { leaf = getLeaf(sets[k], path); if (leaf && leaf.$value !== undefined) break; leaf = undefined; }
    if (!leaf) return null;
    v = leaf.$value;
  }
  return v;
}

function collectComposite(tree, wantType, out, pre) {
  for (const k in tree) {
    if (k[0] === '_') continue;
    const v = tree[k];
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const path = pre ? pre + '.' + k : k;
    if (v.$value !== undefined) { if (v.$type === wantType) out.push({ path: path, value: v.$value }); }
    else collectComposite(v, wantType, out, path);
  }
}

function resolveRef(value, tree) {
  let v = value, guard = 0;
  while (typeof v === 'string' && /^\{[^}]+\}$/.test(v.trim()) && guard++ < 20) {
    const leaf = getLeaf(tree, v.trim().slice(1, -1));
    if (!leaf || leaf.$value === undefined) return null;
    v = leaf.$value;
  }
  return v;
}

function refPath(value) {
  const m = typeof value === 'string' && value.match(/^\{([^}]+)\}/);
  return m ? m[1] : null;
}

function parseLineHeight(raw, tree) {
  if (raw == null) return { unit: 'AUTO' };
  const m = String(raw).match(/\{([^}]+)\}/);
  let num = m ? toFloat(resolveRef('{' + m[1] + '}', tree)) : toFloat(raw);
  if (num === null) return { unit: 'AUTO' };
  if (/\*\s*100\s*%/.test(String(raw))) num = num * 100;
  return { unit: 'PERCENT', value: num };
}

function parsePercent(raw) {
  const n = toFloat(raw);
  return { unit: 'PERCENT', value: n === null ? 0 : n };
}

function bindStyleField(style, field, variable) {
  if (!variable) return;
  try { style.setBoundVariable(field, variable); } catch (e) { /* field not bindable */ }
}

function deepMerge(target, src) {
  for (const k in src) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && v.$value === undefined) {
      target[k] = target[k] || {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

function getLeaf(tree, path) {
  let n = tree;
  for (const part of path.split('.')) {
    if (n == null) return undefined;
    n = n[part];
  }
  return n;
}

function figmaType(tsType, value) {
  const t = String(tsType || '').toLowerCase();
  if (t === 'color') return 'COLOR';
  if (t === 'fontfamilies' || t === 'fontfamily' || t === 'text' || t === 'string') return 'STRING';
  if (t === 'boolean') return 'BOOLEAN';
  if (t === 'fontweights' || t === 'fontweight') return toFloat(value) !== null ? 'FLOAT' : 'STRING';
  if (['dimension', 'number', 'fontsizes', 'fontsize', 'borderradius', 'borderwidth',
       'letterspacing', 'lineheights', 'lineheight', 'sizing', 'spacing', 'opacity',
       'paragraphspacing'].indexOf(t) !== -1) return 'FLOAT';
  if (typeof value === 'string' && value.trim()[0] === '#') return 'COLOR';
  if (toFloat(value) !== null) return 'FLOAT';
  return 'STRING';
}

function coerce(type, raw) {
  if (type === 'COLOR') return parseColor(raw);
  if (type === 'FLOAT') return toFloat(raw);
  if (type === 'STRING') return raw == null ? null : String(raw);
  if (type === 'BOOLEAN') return !!raw;
  return null;
}

var REM_BASE = 16;
function toFloat(v) {
  if (typeof v === 'number') return v;
  if (v == null) return null;
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(-?[\d.]+)rem$/i))) return parseFloat(m[1]) * REM_BASE;
  if ((m = s.match(/^(-?[\d.]+)px$/i))) return parseFloat(m[1]);
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseColor(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s[0] === '#') {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) hex += 'ff';
    if (hex.length !== 8) return null;
    const n = (i) => parseInt(hex.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: n(6) };
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(',').map((x) => x.trim());
    if (p.length < 3) return null;
    return {
      r: parseFloat(p[0]) / 255,
      g: parseFloat(p[1]) / 255,
      b: parseFloat(p[2]) / 255,
      a: p[3] !== undefined ? parseFloat(p[3]) : 1,
    };
  }
  return null;
}

function rgbaStr(c) {
  return 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + c.a.toFixed(2) + ')';
}
