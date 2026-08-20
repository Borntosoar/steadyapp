/* Steady — storage and derived metrics.

   Everything lives in localStorage on this device. No account, no server, no network.

   The rule this file exists to enforce: every number that leaves here is one that
   should go DOWN — distress, urge intensity, checking time, avoidance. Nothing tracks
   appearance. A metric framed to go up (attractiveness, rating, rank) is the maintaining
   behaviour with a nicer chart on it. */

const Store = (() => {
  const KEY = 'steady.v2';

  const BLANK = {
    version: 2,
    createdAt: null,
    onboarded: false,
    model: null,        // the person's own maintaining cycle
    journal: [],
    urges: [],
    checkins: [],       // weekly severity + conviction
    erp: [],            // hierarchy items
    erpLogs: [],        // attempts
    mirrorLogs: [],
    reclaim: [],        // things BDD took, and getting them back
    practice: [],       // dated practice events, for the streak
    relapsePlan: null,
    readLearn: []
  };

  let state = null;

  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? { ...structuredClone(BLANK), ...JSON.parse(raw) } : structuredClone(BLANK);
    } catch {
      state = structuredClone(BLANK);
    }
    if (!state.createdAt) state.createdAt = new Date().toISOString();
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('save failed', e);
      return false;
    }
  }

  function get() { return load(); }

  function update(fn) {
    load();
    fn(state);
    save();
    return state;
  }

  function push(collection, item) {
    return update(s => {
      s[collection].unshift({ id: Date.now() + Math.random(), date: new Date().toISOString(), ...item });
    });
  }

  function remove(collection, id) {
    return update(s => { s[collection] = s[collection].filter(x => x.id !== id); });
  }

  /* ---------- dates ---------- */

  const dayKey = d => new Date(d).toISOString().slice(0, 10);
  const today = () => dayKey(new Date());

  function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  /* ---------- practice streak ----------
     Counts days on which the person did something therapeutic — resisted or delayed a
     compulsion, ran an exposure, did perceptual retraining, completed a thought record.

     Deliberately NOT a streak on opening the app. An app-open streak trains you to open
     the app; this trains response prevention, which is the thing that actually moves
     symptoms. Missing a day costs the streak but never produces a guilt message —
     shame drives concealment, which is the opposite of what we want. */

  function practiceDays() {
    return [...new Set(get().practice.map(p => dayKey(p.date)))].sort();
  }

  function streak() {
    const days = practiceDays();
    if (!days.length) return 0;
    const t = today();
    const last = days[days.length - 1];
    // A streak survives today being empty — it breaks only after a full day is missed.
    if (daysBetween(last, t) > 1) return 0;
    let n = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (daysBetween(days[i - 1], days[i]) === 1) n++;
      else break;
    }
    return n;
  }

  function practicedToday() {
    return get().practice.some(p => dayKey(p.date) === today());
  }

  function logPractice(kind, detail) {
    return push('practice', { kind, detail: detail || '' });
  }

  /* ---------- severity ---------- */

  function severityScore(checkin) {
    return CONTENT.SEVERITY_ITEMS.reduce((sum, item) => sum + (checkin.answers[item.id] ?? 0), 0);
  }

  function checkinsChrono() {
    return [...get().checkins].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function baseline() {
    const c = checkinsChrono();
    return c.length ? severityScore(c[0]) : null;
  }

  function latestSeverity() {
    const c = checkinsChrono();
    return c.length ? severityScore(c[c.length - 1]) : null;
  }

  /* Percent reduction from baseline. The >=30% threshold is what counts as treatment
     response in the BDD trial literature, and >=50% as "very much improved" — so the
     app can tell someone something true and specific rather than "great job!". */
  function severityChange() {
    const b = baseline(), l = latestSeverity();
    if (b === null || l === null || b === 0 || checkinsChrono().length < 2) return null;
    return Math.round(((b - l) / b) * 100);
  }

  function checkinDue() {
    const c = checkinsChrono();
    if (!c.length) return true;
    return daysBetween(c[c.length - 1].date, new Date()) >= 7;
  }

  function daysUntilCheckin() {
    const c = checkinsChrono();
    if (!c.length) return 0;
    return Math.max(0, 7 - daysBetween(c[c.length - 1].date, new Date()));
  }

  /* ---------- urges ---------- */

  function urgeStats() {
    const u = get().urges;
    const weekAgo = Date.now() - 7 * 86400000;
    const recent = u.filter(x => new Date(x.date).getTime() > weekAgo);
    const resisted = recent.filter(x => x.resisted).length;
    return {
      total: u.length,
      week: recent.length,
      resisted,
      resistRate: recent.length ? Math.round((resisted / recent.length) * 100) : null,
      avgIntensity: recent.length
        ? +(recent.reduce((s, x) => s + x.intensity, 0) / recent.length).toFixed(1) : null,
      // The experiential lesson: urges fall on their own. This is the number that proves it.
      avgDrop: (() => {
        const withAfter = u.filter(x => typeof x.intensityAfter === 'number');
        if (!withAfter.length) return null;
        return +(withAfter.reduce((s, x) => s + (x.intensity - x.intensityAfter), 0) / withAfter.length).toFixed(1);
      })()
    };
  }

  /* ---------- ERP ---------- */

  function erpProgress() {
    const items = get().erp;
    const done = items.filter(i => i.completedCount > 0).length;
    return { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }

  /* ---------- life reclaim ----------
     The outcome that actually matters. Symptom scores are a proxy; "went swimming again"
     is the thing itself. Also the most durable retention driver in the app — people stay
     for evidence their life is coming back, not for a chart. */

  function reclaimStats() {
    const r = get().reclaim;
    return { total: r.length, back: r.filter(x => x.reclaimed).length };
  }

  /* ---------- export ----------
     Bridges to real care. Only ~15% of people with BDD are ever diagnosed, and shame is
     the main barrier to disclosure — handing a clinician a written record is far easier
     than saying it out loud. */

  function exportSummary() {
    const s = get();
    const c = checkinsChrono();
    const lines = [];
    lines.push('STEADY — self-tracking summary');
    lines.push(`Generated ${new Date().toLocaleString()}`);
    lines.push(`Tracking since ${new Date(s.createdAt).toLocaleDateString()}`);
    lines.push('');
    lines.push('NOTE: This is self-reported tracking from a self-help app.');
    lines.push('It is not a diagnostic instrument and not a clinical assessment.');
    lines.push('');

    if (c.length) {
      lines.push(`WEEKLY SELF-REPORT SEVERITY (0–${CONTENT.SEVERITY_MAX}, higher = more severe)`);
      c.forEach(x => {
        lines.push(`  ${new Date(x.date).toLocaleDateString()}  score ${severityScore(x)}` +
          (typeof x.conviction === 'number' ? `  conviction ${x.conviction}/4` : '') +
          (x.risk === 'Yes' ? '  [risk item endorsed]' : ''));
      });
      const chg = severityChange();
      if (chg !== null) lines.push(`  Change from first check-in: ${chg > 0 ? '-' : '+'}${Math.abs(chg)}%`);
      lines.push('');
    }

    if (s.model) {
      lines.push('MAINTAINING CYCLE (self-described)');
      lines.push(`  Trigger:    ${s.model.trigger}`);
      lines.push(`  Thought:    ${s.model.thought}`);
      lines.push(`  Compulsion: ${s.model.compulsion}`);
      lines.push(`  Avoiding:   ${s.model.avoidance}`);
      lines.push('');
    }

    const u = urgeStats();
    lines.push('URGES');
    lines.push(`  Logged: ${u.total} total, ${u.week} in the last 7 days`);
    if (u.resistRate !== null) lines.push(`  Resisted or delayed: ${u.resistRate}% of the last 7 days' urges`);
    if (u.avgDrop !== null) lines.push(`  Mean intensity drop when not acted on: ${u.avgDrop} points /10`);
    lines.push('');

    const e = erpProgress();
    if (e.total) {
      lines.push(`EXPOSURE LADDER: ${e.done}/${e.total} steps attempted`);
      s.erp.slice().sort((a, b) => a.suds - b.suds).forEach(i => {
        lines.push(`  [${i.completedCount > 0 ? 'x' : ' '}] SUDS ${i.suds} — ${i.text}` +
          (i.completedCount ? ` (${i.completedCount}x)` : ''));
      });
      lines.push('');
    }

    const r = reclaimStats();
    if (r.total) {
      lines.push(`THINGS BDD TOOK: ${r.back}/${r.total} resumed`);
      s.reclaim.forEach(x => lines.push(`  [${x.reclaimed ? 'x' : ' '}] ${x.text}`));
      lines.push('');
    }

    lines.push(`Practice days logged: ${practiceDays().length}`);
    lines.push(`Thought records: ${s.journal.length}`);
    lines.push(`Perceptual retraining sessions: ${s.mirrorLogs.length}`);
    return lines.join('\n');
  }

  function wipe() {
    localStorage.removeItem(KEY);
    state = null;
  }

  return {
    get, update, push, remove, save,
    dayKey, today, daysBetween,
    streak, practicedToday, logPractice, practiceDays,
    severityScore, checkinsChrono, baseline, latestSeverity, severityChange,
    checkinDue, daysUntilCheckin,
    urgeStats, erpProgress, reclaimStats,
    exportSummary, wipe
  };
})();
