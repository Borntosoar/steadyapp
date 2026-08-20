/* Steady — UI layer. */

/* ---------- helpers ---------- */

const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtDateTime = iso => new Date(iso).toLocaleString(undefined,
  { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

let timers = [];
const clearTimers = () => { timers.forEach(clearInterval); timers = []; };

/* ---------- modal ---------- */

function openModal(title, html, wide) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modalBox').classList.toggle('modal-wide', !!wide);
  $('#modal').classList.add('active');
}
function closeModal() {
  $('#modal').classList.remove('active');
  $('#modalBody').innerHTML = '';
  clearTimers();
}
$('#modalClose').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- crisis ---------- */

function crisisHTML() {
  return `<p>If you're in immediate danger, contact your local emergency number.</p>
    <ul class="resource-list">
      ${CONTENT.CRISIS.map(c => `<li><b>${esc(c.region)}</b> — ${c.detail}</li>`).join('')}
    </ul>
    <p class="small">Asking for help about this is not an overreaction. BDD carries markedly elevated suicide risk — in a 4-year prospective study a mean of 57.8% of participants reported suicidal ideation per year. This is a recognised, treatable condition, not a cosmetic complaint.</p>`;
}
$('#openCrisis').addEventListener('click', () => openModal('If you need support right now', crisisHTML()));

/* ---------- routing ---------- */

const RENDER = {};
let currentTab = 'today';

function showTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $('#panel-' + name).classList.add('active');
  RENDER[name]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab-btn');
  if (b) showTab(b.dataset.tab);
});
function refresh() { RENDER[currentTab](); }

/* ---------- onboarding ----------
   Builds the person's own maintaining cycle before anything else. This is module 1 of
   CBT-BDD, and it's where most of the early therapeutic movement comes from — recognising
   you're inside a known mechanism rather than personally defective. It also means every
   later screen can refer back to something the person wrote themselves. */

function runOnboarding() {
  let step = 0;
  const answers = {};
  const steps = [
    { key: null, title: 'Before we start',
      html: `<p>Steady is built from what actually has evidence behind it for body dysmorphia — mostly the components of BDD-specific CBT.</p>
      <p>Three things it will never do, on purpose:</p>
      <ul class="tight">
        <li><b>It won't ask for a photo.</b> There's no camera in this app.</li>
        <li><b>It won't rate or score how you look</b> — and it won't tell you that you look fine either. Both are reassurance, and reassurance is what keeps this running.</li>
        <li><b>It won't ask you to track your appearance.</b> Every number here is one meant to go down: distress, urges, time lost.</li>
      </ul>
      <p>First we'll map your own version of the cycle. Four short questions.</p>` },
    { key: 'trigger', title: 'The trigger', label: 'What tends to set it off?',
      hint: 'A reflection, a photo, bright light, a certain person, a time of day.',
      placeholder: 'e.g. Catching my reflection in a shop window' },
    { key: 'thought', title: 'The thought', label: 'What goes through your mind?',
      hint: 'Use the words your mind actually uses, not the tidied-up version.',
      placeholder: 'e.g. Everyone can see it and they think I look disgusting' },
    { key: 'compulsion', title: 'The compulsion', label: 'What do you do to make the feeling stop?',
      hint: 'Checking, photographing, comparing, asking, covering, grooming, researching procedures.',
      placeholder: 'e.g. Check my side profile in my front camera' },
    { key: 'avoidance', title: 'The cost', label: 'What has this made you avoid or give up?',
      hint: 'This one matters most. It becomes what you get back.',
      placeholder: 'e.g. Swimming, having photos taken, seeing friends in daylight' }
  ];

  const draw = () => {
    const s = steps[step];
    const isFirst = step === 0;
    const body = `
      ${s.html || `
        <label class="field">${esc(s.label)}
          <span class="hint">${esc(s.hint)}</span>
          <textarea id="obInput" rows="3" placeholder="${esc(s.placeholder)}">${esc(answers[s.key] || '')}</textarea>
        </label>`}
      <div class="progress-dots">${steps.map((_, i) =>
        `<span class="dot ${i === step ? 'on' : ''}"></span>`).join('')}</div>
      <div class="form-actions">
        ${step > 0 ? '<button class="secondary-btn" id="obBack">Back</button>' : ''}
        <button class="primary-btn" id="obNext">${step === steps.length - 1 ? 'See my cycle' : (isFirst ? 'Start' : 'Next')}</button>
      </div>`;
    openModal(s.title, body, true);

    $('#obNext').addEventListener('click', () => {
      const s2 = steps[step];
      if (s2.key) {
        const v = $('#obInput').value.trim();
        if (!v) { $('#obInput').focus(); $('#obInput').classList.add('shake');
          setTimeout(() => $('#obInput').classList.remove('shake'), 400); return; }
        answers[s2.key] = v;
      }
      if (step === steps.length - 1) return finish();
      step++; draw();
    });
    const back = $('#obBack');
    if (back) back.addEventListener('click', () => { step--; draw(); });
  };

  const finish = () => {
    Store.update(s => { s.model = answers; s.onboarded = true; });
    // Seed the reclaim list from what they said they'd lost — the app should already
    // know what it's aiming at rather than asking twice.
    Store.push('reclaim', { text: answers.avoidance, reclaimed: false });
    openModal('This is your cycle', `
      ${cycleHTML(answers)}
      <p>Every loop like this has the same weak point, and it isn't the trigger or the thought — those arrive uninvited. It's the <b>compulsion</b>. That's the only link you can choose, and taking it out is what makes the rest fade.</p>
      <p>That's what the practice section is for.</p>
      <div class="form-actions"><button class="primary-btn" id="obDone">Start</button></div>`, true);
    $('#obDone').addEventListener('click', () => { closeModal(); refresh(); });
  };

  draw();
}

function cycleHTML(m) {
  const nodes = [
    ['Trigger', m.trigger], ['Thought', m.thought],
    ['Distress', 'It spikes'], ['Compulsion', m.compulsion],
    ['Brief relief', 'Minutes at most'], ['Stronger next time', 'The loop tightens']
  ];
  return `<div class="cycle">${nodes.map((n, i) => `
    <div class="cycle-node ${n[0] === 'Compulsion' ? 'key' : ''}">
      <span class="cycle-label">${esc(n[0])}</span>
      <span class="cycle-text">${esc(n[1])}</span>
    </div>${i < nodes.length - 1 ? '<div class="cycle-arrow">↓</div>' : ''}`).join('')}
    <div class="cycle-loop">back to the top, a little louder</div>
  </div>`;
}

/* ---------- TODAY ---------- */

RENDER.today = () => {
  const s = Store.get();
  if (!s.onboarded) {
    $('#panel-today').innerHTML = `
      <div class="hero">
        <h1>You're allowed to feel steady in your own body.</h1>
        <p class="lead">A private companion for body dysmorphia and appearance distress — built from the components of BDD-specific CBT, the treatment with the strongest evidence behind it.</p>
        <button class="primary-btn big" id="startOb">Set up — 2 minutes</button>
      </div>
      <div class="privacy-note"><b>No photos. No scoring. No account.</b> Everything you write stays in this browser. There is no server to send it to.</div>`;
    $('#startOb').addEventListener('click', runOnboarding);
    return;
  }

  const streak = Store.streak();
  const done = Store.practicedToday();
  const chg = Store.severityChange();
  const due = Store.checkinDue();
  const u = Store.urgeStats();

  const nudge = due
    ? `<div class="card accent">
        <h3>Weekly check-in is ready</h3>
        <p>Eight questions, about a minute. It's how the graph knows anything.</p>
        <button class="primary-btn" data-act="checkin">Do the check-in</button>
      </div>`
    : `<div class="card">
        <h3>${done ? 'You practised today' : 'One thing today'}</h3>
        <p>${done
          ? 'That\'s the day\'s work done. Anything else is a bonus, not a debt.'
          : 'Not a lot. Pick whichever is closest to hand right now.'}</p>
        <div class="btn-row">
          <button class="primary-btn" data-act="urge">Log an urge</button>
          <button class="secondary-btn" data-act="mirror">Perceptual retraining</button>
          <button class="secondary-btn" data-act="thought">Thought record</button>
        </div>
      </div>`;

  $('#panel-today').innerHTML = `
    <div class="today-head">
      <div>
        <h1>Today</h1>
        <p class="section-sub">${done ? 'Practice logged.' : 'Nothing logged yet today.'}</p>
      </div>
      <div class="streak-badge ${streak ? 'on' : ''}">
        <span class="streak-num">${streak}</span>
        <span class="streak-label">day${streak === 1 ? '' : 's'} of practice</span>
      </div>
    </div>

    ${nudge}

    <div class="stat-grid">
      ${chg !== null ? `<div class="stat-box">
        <div class="stat-num ${chg > 0 ? 'good' : ''}">${chg > 0 ? '−' : '+'}${Math.abs(chg)}%</div>
        <div class="stat-label">distress vs your first week${chg >= 30 ? '<br><b class="good">past the response threshold</b>' : ''}</div>
      </div>` : ''}
      ${u.resistRate !== null ? `<div class="stat-box">
        <div class="stat-num good">${u.resistRate}%</div>
        <div class="stat-label">of this week's urges resisted or delayed</div>
      </div>` : ''}
      ${u.avgDrop !== null ? `<div class="stat-box">
        <div class="stat-num good">−${u.avgDrop}</div>
        <div class="stat-label">average urge drop when you don't act on it</div>
      </div>` : ''}
      ${!due ? `<div class="stat-box">
        <div class="stat-num">${Store.daysUntilCheckin()}</div>
        <div class="stat-label">days to next check-in</div>
      </div>` : ''}
    </div>

    ${s.model ? `<div class="card soft">
      <h3>Your cycle</h3>
      <p class="small">You wrote this when you set up. The compulsion is the link you can choose.</p>
      <div class="mini-cycle">
        <span>${esc(s.model.trigger)}</span> <em>→</em>
        <span>${esc(s.model.thought)}</span> <em>→</em>
        <span class="key">${esc(s.model.compulsion)}</span> <em>→</em>
        <span>relief, briefly</span>
      </div>
      <button class="link-btn" data-act="editModel">Update this</button>
    </div>` : ''}

    <div class="disclaimer-box">
      <b>Steady is a self-help companion, not treatment.</b> BDD-specific CBT with a clinician has a large effect (d = −1.22 across 7 trials); this app carries some of the same components but isn't a substitute. If appearance concerns are taking an hour a day or more, or you're avoiding life, a proper assessment is worth it — iocdf.org lists specialists.
    </div>`;
};

/* ---------- PRACTICE ---------- */

RENDER.practice = () => {
  const erp = Store.get().erp;
  const prog = Store.erpProgress();
  $('#panel-practice').innerHTML = `
    <h1>Practice</h1>
    <p class="section-sub">These are the working parts of BDD-specific CBT. Repetition is what moves symptoms — not intensity, and not doing it perfectly.</p>

    <div class="exercise-grid">
      ${CONTENT.EXERCISES.map(ex => `
        <button class="exercise-card" data-ex="${ex.id}">
          <h4>${esc(ex.title)}</h4>
          <p>${esc(ex.desc)}</p>
          <span class="tag">${esc(ex.tag)}</span>
        </button>`).join('')}
    </div>

    <div class="section-break">
      <h2>Your exposure ladder</h2>
      <p class="section-sub">The situations BDD has taken, ordered by how hard they feel. You work up, not straight to the top. Each one is an experiment: predict what will happen, drop the compulsion, then write down what actually happened.</p>
      ${prog.total ? `<div class="ladder-progress">
        <div class="bar"><div class="fill" style="width:${prog.pct}%"></div></div>
        <span>${prog.done} of ${prog.total} attempted</span>
      </div>` : ''}
      <div class="ladder">
        ${erp.length
          ? erp.slice().sort((a, b) => a.suds - b.suds).map(i => `
            <div class="ladder-item ${i.completedCount > 0 ? 'done' : ''}">
              <span class="suds">${i.suds}</span>
              <span class="ladder-text">${esc(i.text)}
                ${i.completedCount ? `<em>done ${i.completedCount}×</em>` : ''}</span>
              <button class="primary-btn small" data-erp="${i.id}">Log attempt</button>
              <button class="entry-delete" data-delerp="${i.id}">✕</button>
            </div>`).join('')
          : `<div class="empty-state">Nothing on the ladder yet. Add the things you've been avoiding — start with one that feels moderately hard rather than the worst one.</div>`}
      </div>
      <button class="secondary-btn" id="addErp">+ Add a step</button>
    </div>`;

  document.querySelectorAll('[data-ex]').forEach(b =>
    b.addEventListener('click', () => runExercise(b.dataset.ex)));
  $('#addErp').addEventListener('click', addErpItem);
  document.querySelectorAll('[data-erp]').forEach(b =>
    b.addEventListener('click', () => logErpAttempt(b.dataset.erp)));
  document.querySelectorAll('[data-delerp]').forEach(b =>
    b.addEventListener('click', () => {
      if (confirm('Remove this step?')) { Store.remove('erp', Number(b.dataset.delerp)); refresh(); }
    }));
};

function addErpItem() {
  openModal('Add a ladder step', `
    <label class="field">What have you been avoiding?
      <span class="hint">Pick something specific enough to either do or not do.</span>
      <input type="text" id="erpText" placeholder="e.g. Walk to the shop with my hood down">
    </label>
    <div class="suggestions">
      ${CONTENT.ERP_SUGGESTIONS.map(s => `<button type="button" class="chip" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}
    </div>
    <label class="field">How hard does it feel right now? <b id="sudsVal">50</b>/100
      <input type="range" id="erpSuds" min="0" max="100" value="50">
      <span class="hint">This is distress, not appearance. It's expected to fall with repetition.</span>
    </label>
    <div class="form-actions">
      <button class="secondary-btn" data-close>Cancel</button>
      <button class="primary-btn" id="erpSave">Add to ladder</button>
    </div>`, true);

  $('#erpSuds').addEventListener('input', e => { $('#sudsVal').textContent = e.target.value; });
  document.querySelectorAll('[data-sug]').forEach(b =>
    b.addEventListener('click', () => { $('#erpText').value = b.dataset.sug; }));
  $('#erpSave').addEventListener('click', () => {
    const text = $('#erpText').value.trim();
    if (!text) return $('#erpText').focus();
    Store.push('erp', { text, suds: Number($('#erpSuds').value), completedCount: 0 });
    closeModal(); refresh();
  });
}

function logErpAttempt(id) {
  const item = Store.get().erp.find(i => i.id === Number(id));
  if (!item) return;
  openModal('Exposure — ' + item.text, `
    <div class="rules">
      <b>How this works</b>
      <ol>${CONTENT.ERP_RULES.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
    </div>
    <label class="field">What did you predict would happen?
      <textarea id="erpPred" rows="2" placeholder="e.g. People will stare and someone will comment"></textarea>
    </label>
    <label class="field">Distress at the start <b id="erpBeforeVal">${item.suds}</b>/100
      <input type="range" id="erpBefore" min="0" max="100" value="${item.suds}">
    </label>
    <label class="field">Distress by the end <b id="erpAfterVal">${item.suds}</b>/100
      <input type="range" id="erpAfter" min="0" max="100" value="${item.suds}">
    </label>
    <label class="field">What actually happened?
      <span class="hint">What you observed, not what it felt like. This is the data.</span>
      <textarea id="erpOutcome" rows="3" placeholder="e.g. Nobody looked up. One person said hello."></textarea>
    </label>
    <label class="check"><input type="checkbox" id="erpClean" checked>
      I got through it without the compulsion</label>
    <div class="form-actions">
      <button class="secondary-btn" data-close>Cancel</button>
      <button class="primary-btn" id="erpDone">Save</button>
    </div>`, true);

  $('#erpBefore').addEventListener('input', e => { $('#erpBeforeVal').textContent = e.target.value; });
  $('#erpAfter').addEventListener('input', e => { $('#erpAfterVal').textContent = e.target.value; });

  $('#erpDone').addEventListener('click', () => {
    const before = Number($('#erpBefore').value), after = Number($('#erpAfter').value);
    Store.push('erpLogs', {
      erpId: item.id, text: item.text,
      prediction: $('#erpPred').value.trim(),
      outcome: $('#erpOutcome').value.trim(),
      before, after, clean: $('#erpClean').checked
    });
    Store.update(s => {
      const it = s.erp.find(x => x.id === item.id);
      if (it) { it.completedCount = (it.completedCount || 0) + 1; it.suds = after; }
    });
    Store.logPractice('erp', item.text);
    closeModal();
    const drop = before - after;
    openModal('Logged', `
      ${drop > 0
        ? `<p class="big-stat good">−${drop}</p><p>Your distress fell ${drop} points while you stayed in it and didn't perform the compulsion. That's the mechanism working — not willpower, and not the situation turning out to be easy.</p>`
        : `<p>Distress didn't drop this time, and that's a normal single data point rather than a failure. Habituation shows up across repetitions, not reliably within one.</p>`}
      ${$('#erpPred') ? '' : ''}
      <p class="small">The ladder now shows ${after} for this step — it updates to your most recent rating so you can see it move.</p>
      <div class="form-actions"><button class="primary-btn" data-close>Close</button></div>`);
    bindClose();
    refresh();
  });
}

/* ---------- exercises ---------- */

function runExercise(id) {
  const ex = CONTENT.EXERCISES.find(e => e.id === id);
  if (!ex) return;
  clearTimers();
  ({
    urge: urgeExercise, mirror: mirrorExercise, delay: delayExercise,
    steps: () => stepsExercise(ex), senses: sensesExercise, breath: breathExercise
  })[ex.kind](ex);
}

/* Urge surfing. The point isn't the timer — it's the before/after pair, which produces
   the person's own evidence that urges fall without being obeyed. */
function urgeExercise() {
  openModal('Urge surfing', `
    <label class="field">What's the urge?
      <select id="urgeKind">${CONTENT.COMPULSIONS.map(c => `<option>${esc(c)}</option>`).join('')}</select>
    </label>
    <label class="field">How strong is it right now? <b id="urgeVal">5</b>/10
      <input type="range" id="urgeNow" min="0" max="10" value="5">
    </label>
    <div class="form-actions">
      <button class="secondary-btn" id="urgeJustLog">Just log it</button>
      <button class="primary-btn" id="urgeRide">Ride it out</button>
    </div>`);
  $('#urgeNow').addEventListener('input', e => { $('#urgeVal').textContent = e.target.value; });

  const record = (resisted, after) => {
    Store.push('urges', {
      trigger: $('#urgeKind') ? $('#urgeKind').value : 'Urge',
      intensity: Number(startIntensity), resisted,
      ...(typeof after === 'number' ? { intensityAfter: after } : {})
    });
    if (resisted) Store.logPractice('urge', 'rode out an urge');
    refresh();
  };
  let startIntensity = 5;

  $('#urgeJustLog').addEventListener('click', () => {
    startIntensity = $('#urgeNow').value;
    record(false); closeModal();
  });

  $('#urgeRide').addEventListener('click', () => {
    startIntensity = $('#urgeNow').value;
    let sec = 180;
    const steps = [
      'Name it. "There\'s the urge to check." Out loud if you can.',
      'Find where it sits — chest, stomach, hands. Just locate it.',
      'Don\'t try to lower it. You\'re measuring, not fighting.',
      'It\'s a wave, not an instruction. Waves rise, peak, and fall.',
      'Still here. Still not obeying it. This is the whole exercise.',
      'Nearly through.'
    ];
    const draw = () => {
      const m = Math.floor(sec / 60), s = String(sec % 60).padStart(2, '0');
      const idx = Math.min(steps.length - 1, Math.floor((180 - sec) / 30));
      $('#modalBody').innerHTML = `
        <div class="wave-wrap"><div class="wave" style="transform:scaleY(${0.4 + 0.6 * (sec / 180)})"></div></div>
        <p class="timer">${m}:${s}</p>
        <p class="exercise-step">${esc(steps[idx])}</p>
        <div class="form-actions"><button class="secondary-btn" id="urgeStop">Stop early</button></div>`;
      $('#urgeStop').addEventListener('click', finish);
      if (sec <= 0) { clearTimers(); finish(); }
      sec--;
    };
    const finish = () => {
      clearTimers();
      $('#modalBody').innerHTML = `
        <p>Where is it now?</p>
        <label class="field">Intensity <b id="afterVal">${startIntensity}</b>/10
          <input type="range" id="urgeAfter" min="0" max="10" value="${startIntensity}">
        </label>
        <div class="form-actions"><button class="primary-btn" id="urgeSave">Save</button></div>`;
      $('#urgeAfter').addEventListener('input', e => { $('#afterVal').textContent = e.target.value; });
      $('#urgeSave').addEventListener('click', () => {
        const after = Number($('#urgeAfter').value);
        record(true, after);
        const drop = Number(startIntensity) - after;
        openModal('Logged', `
          ${drop > 0
            ? `<p class="big-stat good">−${drop}</p><p>It dropped ${drop} points and you didn't do anything to it. That's the thing worth knowing: the urge was always going to fall on its own. Every time you sit one out, the next is a little quieter.</p>`
            : `<p>It held steady this time. That happens, and it isn't a failure — you still didn't act on it, which is the part that counts. The drop usually shows up across repetitions rather than every single time.</p>`}
          <div class="form-actions"><button class="primary-btn" data-close>Close</button></div>`);
        bindClose();
      });
    };
    draw();
    timers.push(setInterval(draw, 1000));
  });
}

/* Perceptual retraining. The distinctive BDD component, and the one non-specialists
   most often leave out. Whole-body coverage at fixed pace is the active ingredient —
   it directly opposes the local-detail processing bias. */
function mirrorExercise() {
  const P = CONTENT.MIRROR_PROTOCOL;
  openModal('Perceptual retraining', `
    <p class="small">This is the exercise that most directly targets the processing bias — practising the wide, neutral view instead of the zoomed-in evaluative one. It is normal for it to feel uncomfortable and pointless the first few times.</p>
    <div class="rules"><b>The rules</b><ol>${P.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>
    <div class="swaps"><b>Swap the word, keep going</b>
      <div class="swap-row">${P.neutralSwaps.map(([a, b]) =>
        `<span class="swap"><s>${esc(a)}</s> → ${esc(b)}</span>`).join('')}</div>
    </div>
    <div class="form-actions"><button class="primary-btn" id="mirrorStart">Start — 12 regions</button></div>`, true);

  $('#mirrorStart').addEventListener('click', () => {
    let i = 0, sec = 20;
    const draw = () => {
      const r = P.regions[i];
      $('#modalBody').innerHTML = `
        <div class="region-head"><span class="region-count">${i + 1}/${P.regions.length}</span>
          <h4>${esc(r.region)}</h4></div>
        <p class="exercise-step">${esc(r.prompt)}</p>
        <p class="timer small-timer">${sec}s</p>
        <div class="bar thin"><div class="fill" style="width:${((i + 1) / P.regions.length) * 100}%"></div></div>
        <div class="form-actions">
          <button class="secondary-btn" id="mirrorSkip">Next region</button>
          <button class="secondary-btn" id="mirrorEnd">End session</button>
        </div>`;
      $('#mirrorSkip').addEventListener('click', next);
      $('#mirrorEnd').addEventListener('click', finish);
      if (sec <= 0) return next();
      sec--;
    };
    const next = () => {
      i++; sec = 20;
      if (i >= P.regions.length) return finish();
      draw();
    };
    const finish = () => {
      clearTimers();
      $('#modalBody').innerHTML = `
        <p>Session done — ${i} of ${P.regions.length} regions.</p>
        <label class="field">How much did you slip into evaluating rather than describing? <b id="evalVal">50</b>/100
          <input type="range" id="mirrorEval" min="0" max="100" value="50">
          <span class="hint">Not a grade. It's the thing that gets easier, so it's worth watching.</span>
        </label>
        <div class="form-actions"><button class="primary-btn" id="mirrorSave">Save</button></div>`;
      $('#mirrorEval').addEventListener('input', e => { $('#evalVal').textContent = e.target.value; });
      $('#mirrorSave').addEventListener('click', () => {
        Store.push('mirrorLogs', { regions: i, evaluative: Number($('#mirrorEval').value) });
        Store.logPractice('mirror', `${i} regions`);
        closeModal(); refresh();
      });
    };
    draw();
    timers.push(setInterval(draw, 1000));
  });
}

function delayExercise() {
  openModal('Delay the check', `
    <p>Bans fail. Delays work. The urge doesn't have to disappear — you only need to outlast one to learn, from experience rather than argument, that it falls by itself.</p>
    <div class="btn-row">
      ${[2, 5, 10, 30].map(m => `<button class="secondary-btn delay-opt" data-min="${m}">${m} min</button>`).join('')}
    </div>
    <div id="delayBody"></div>`);
  document.querySelectorAll('.delay-opt').forEach(b => b.addEventListener('click', () => {
    clearTimers();
    let sec = Number(b.dataset.min) * 60;
    const draw = () => {
      const m = Math.floor(sec / 60), s = String(sec % 60).padStart(2, '0');
      $('#delayBody').innerHTML = sec > 0
        ? `<p class="timer">${m}:${s}</p><p class="small">Put your hands on something else until this finishes.</p>`
        : `<p class="timer good">Done</p><p>You waited it out. Notice whether the urge is quieter than it was — that's evidence you now own.</p>
           <div class="form-actions"><button class="primary-btn" id="delayLog">Log it</button></div>`;
      if (sec <= 0) {
        clearTimers();
        const btn = $('#delayLog');
        if (btn) btn.addEventListener('click', () => {
          Store.push('urges', { trigger: 'Delayed a check', intensity: 5, resisted: true });
          Store.logPractice('delay', `${b.dataset.min} min`);
          closeModal(); refresh();
        });
      }
      sec--;
    };
    draw();
    timers.push(setInterval(draw, 1000));
  }));
}

function stepsExercise(ex) {
  let i = 0;
  const draw = () => {
    const done = i >= ex.steps.length;
    openModal(ex.title, done
      ? `<p>Done. Doing it imperfectly still counts — repetition is what builds the skill.</p>
         <div class="form-actions"><button class="primary-btn" id="stepsDone">Finish</button></div>`
      : `<p class="exercise-step">${esc(ex.steps[i])}</p>
         <div class="exercise-progress">Step ${i + 1} of ${ex.steps.length}</div>
         <div class="form-actions">
           ${i > 0 ? '<button class="secondary-btn" id="stepsBack">Back</button>' : ''}
           <button class="primary-btn" id="stepsNext">Next</button>
         </div>`);
    if (done) {
      $('#stepsDone').addEventListener('click', () => {
        Store.logPractice(ex.id, ex.title); closeModal(); refresh();
      });
    } else {
      $('#stepsNext').addEventListener('click', () => { i++; draw(); });
      const b = $('#stepsBack');
      if (b) b.addEventListener('click', () => { i--; draw(); });
    }
  };
  draw();
}

function sensesExercise() {
  const prompts = [['5 things you can see', 5], ['4 things you can feel', 4],
    ['3 things you can hear', 3], ['2 things you can smell', 2], ['1 thing you can taste', 1]];
  let i = 0;
  const draw = () => {
    if (i >= prompts.length) {
      openModal('5-4-3-2-1', `<p>Your attention is pointed outward instead of inward. That shift is the whole exercise.</p>
        <div class="form-actions"><button class="primary-btn" id="sDone">Finish</button></div>`);
      return $('#sDone').addEventListener('click', () => {
        Store.logPractice('senses', 'grounding'); closeModal(); refresh();
      });
    }
    const [label, n] = prompts[i];
    openModal('5-4-3-2-1', `<p class="exercise-step">Name <b>${esc(label)}</b>. Out loud, or type them.</p>
      ${Array.from({ length: n }, (_, k) => `<input class="senses-input" placeholder="${k + 1}.">`).join('')}
      <div class="exercise-progress">Step ${i + 1} of ${prompts.length}</div>
      <div class="form-actions"><button class="primary-btn" id="sNext">Next</button></div>`);
    $('#sNext').addEventListener('click', () => { i++; draw(); });
  };
  draw();
}

function breathExercise() {
  openModal('Box breathing', `
    <div class="breath-circle" id="bc">Ready</div>
    <p class="exercise-progress" id="bcount">4 counts each phase · 4 rounds</p>
    <div class="form-actions"><button class="primary-btn" id="bStart">Start</button></div>`);
  $('#bStart').addEventListener('click', () => {
    const phases = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
    let step = 0;
    const tick = () => {
      const p = phases[step % 4], c = $('#bc');
      if (!c) return clearTimers();
      c.textContent = p;
      if (p === 'Breathe in') c.style.transform = 'scale(1.25)';
      if (p === 'Breathe out') c.style.transform = 'scale(0.8)';
      $('#bcount').textContent = `Round ${Math.floor(step / 4) + 1} of 4`;
      step++;
      if (step > 16) {
        clearTimers();
        c.textContent = 'Done'; c.style.transform = 'scale(1)';
        $('#bcount').textContent = 'Notice how your body feels compared to when you started.';
        Store.logPractice('breath', 'box breathing');
      }
    };
    tick();
    timers.push(setInterval(tick, 4000));
  });
}

/* ---------- JOURNAL ---------- */

RENDER.journal = () => {
  const entries = Store.get().journal;
  $('#panel-journal').innerHTML = `
    <div class="panel-header-row">
      <div><h1>Thought records</h1>
        <p class="section-sub">Cognitive restructuring. The target is never "my nose is fine" — it's that your nose isn't what decides whether you're acceptable.</p></div>
      <button class="primary-btn" id="newEntry">+ New record</button>
    </div>
    <div class="entry-list">
      ${entries.length ? entries.map(e => {
        const shift = e.intensityBefore - e.intensityAfter;
        return `<div class="entry-card">
          <div class="entry-top"><span class="entry-date">${fmtDateTime(e.date)}</span>
            <button class="entry-delete" data-del="${e.id}">Delete</button></div>
          <div class="entry-body">
            ${e.situation ? `<div class="entry-field"><b>Situation:</b> ${esc(e.situation)}</div>` : ''}
            ${e.thought ? `<div class="entry-field"><b>Thought:</b> ${esc(e.thought)}</div>` : ''}
            ${e.coreBelief ? `<div class="entry-field"><b>Underneath it:</b> ${esc(e.coreBelief)}</div>` : ''}
            ${e.emotion ? `<div class="entry-field"><b>Felt:</b> ${esc(e.emotion)} — ${e.intensityBefore} → ${e.intensityAfter}${shift > 0 ? ` <span class="good">(down ${shift})</span>` : ''}</div>` : ''}
            ${e.balanced ? `<div class="entry-field"><b>Balanced:</b> ${esc(e.balanced)}</div>` : ''}
            ${(e.tags || []).length ? `<div class="entry-tags">${e.tags.map(t => `<span class="entry-tag">${esc(t)}</span>`).join('')}</div>` : ''}
          </div></div>`;
      }).join('') : `<div class="empty-state">Nothing here yet. When a difficult thought turns up, walking it through the steps beats arguing with it in your head.</div>`}
    </div>`;

  $('#newEntry').addEventListener('click', newThoughtRecord);
  document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    if (confirm('Delete this record?')) { Store.remove('journal', Number(b.dataset.del)); refresh(); }
  }));
};

function newThoughtRecord() {
  openModal('Thought record', `
    <label class="field">What happened? <span class="hint">The trigger.</span>
      <textarea name="situation" rows="2" placeholder="e.g. Caught my reflection in a shop window"></textarea></label>
    <label class="field">What went through your mind? <span class="hint">Your mind's actual words.</span>
      <textarea name="thought" rows="2" placeholder="e.g. I look disgusting and everyone can tell"></textarea></label>
    <label class="field">If that were completely true, what would it mean about you?
      <span class="hint">${esc(CONTENT.CORE_BELIEF_PROMPTS[1])} This is the belief actually doing the damage.</span>
      <textarea name="coreBelief" rows="2" placeholder="e.g. That I'm not someone anyone could want"></textarea></label>
    <label class="field">What did you feel?
      <input type="text" name="emotion" placeholder="e.g. shame, anxiety, disgust"></label>
    <label class="field">Intensity before <b id="jBefore">50</b>
      <input type="range" name="intensityBefore" min="0" max="100" value="50"></label>
    <label class="field">Which patterns fit? <span class="hint">Tap any that apply.</span>
      <div class="distortion-picker">${CONTENT.DISTORTIONS.map(d =>
        `<button type="button" class="chip dist" title="${esc(d.hint)}">${esc(d.name)}</button>`).join('')}</div></label>
    <label class="field">Evidence for it
      <textarea name="evidenceFor" rows="2"></textarea></label>
    <label class="field">Evidence against — or what you'd say to a friend who said this
      <textarea name="evidenceAgainst" rows="2"></textarea></label>
    <label class="field">A more balanced version
      <textarea name="balanced" rows="2" placeholder="e.g. A reflection isn't a verdict on whether I'm worth knowing"></textarea></label>
    <label class="field">Intensity now <b id="jAfter">50</b>
      <input type="range" name="intensityAfter" min="0" max="100" value="50"></label>
    <div class="form-actions">
      <button class="secondary-btn" data-close>Cancel</button>
      <button class="primary-btn" id="jSave">Save</button>
    </div>`, true);

  const body = $('#modalBody');
  body.querySelector('[name=intensityBefore]').addEventListener('input',
    e => { $('#jBefore').textContent = e.target.value; });
  body.querySelector('[name=intensityAfter]').addEventListener('input',
    e => { $('#jAfter').textContent = e.target.value; });
  body.querySelectorAll('.dist').forEach(c =>
    c.addEventListener('click', () => c.classList.toggle('selected')));
  bindClose();

  $('#jSave').addEventListener('click', () => {
    const val = n => (body.querySelector(`[name=${n}]`).value || '').trim();
    Store.push('journal', {
      situation: val('situation'), thought: val('thought'), coreBelief: val('coreBelief'),
      emotion: val('emotion'),
      intensityBefore: Number(body.querySelector('[name=intensityBefore]').value),
      intensityAfter: Number(body.querySelector('[name=intensityAfter]').value),
      evidenceFor: val('evidenceFor'), evidenceAgainst: val('evidenceAgainst'),
      balanced: val('balanced'),
      tags: [...body.querySelectorAll('.dist.selected')].map(c => c.textContent)
    });
    Store.logPractice('journal', 'thought record');
    closeModal(); refresh();
  });
}

/* ---------- weekly check-in ---------- */

function runCheckin() {
  let i = 0;
  const answers = {};
  let conviction = 2, risk = 'No';
  const items = CONTENT.SEVERITY_ITEMS;

  const draw = () => {
    const it = items[i];
    openModal('Weekly check-in', `
      <p class="exercise-progress">${i + 1} of ${items.length + 2}</p>
      <p class="exercise-step">${esc(it.text)}</p>
      <div class="opt-list">${it.labels.map((l, v) =>
        `<button class="opt" data-v="${v}">${esc(l)}</button>`).join('')}</div>`, true);
    document.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      answers[it.id] = Number(b.dataset.v);
      i++;
      i < items.length ? draw() : drawConviction();
    }));
  };

  const drawConviction = () => {
    openModal('Weekly check-in', `
      <p class="exercise-progress">${items.length + 1} of ${items.length + 2}</p>
      <p class="exercise-step">${esc(CONTENT.CONVICTION_ITEM.text)}</p>
      <div class="opt-list">${CONTENT.CONVICTION_ITEM.labels.map((l, v) =>
        `<button class="opt" data-v="${v}">${esc(l)}</button>`).join('')}</div>
      <p class="small">Tracked separately from the rest. Conviction often loosens before distress does, so it's usually the first thing to move.</p>`, true);
    document.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      conviction = Number(b.dataset.v); drawRisk();
    }));
  };

  // Never scored, never trended, never gamified. Its only job is to open a door.
  const drawRisk = () => {
    openModal('Weekly check-in', `
      <p class="exercise-progress">${items.length + 2} of ${items.length + 2}</p>
      <p class="exercise-step">${esc(CONTENT.RISK_ITEM.text)}</p>
      <div class="opt-list">${CONTENT.RISK_ITEM.options.map(o =>
        `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <p class="small">Asked plainly, because it matters more than anything else here — and asking about it doesn't plant the idea.</p>`, true);
    document.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      risk = b.dataset.v; finish();
    }));
  };

  const finish = () => {
    Store.push('checkins', { answers, conviction, risk });
    Store.logPractice('checkin', 'weekly check-in');

    if (risk === 'Yes') {
      // This takes precedence over any progress message. Nothing else is shown first.
      openModal('Before anything else', `
        <p>You said you've had thoughts of hurting yourself or of not being here. Thank you for answering honestly — that's a hard thing to put down even privately.</p>
        <p>That's the thing to deal with first, ahead of anything to do with how you look.</p>
        ${crisisHTML()}
        <p>If you can, tell one person today. It doesn't have to be the whole story.</p>
        <div class="form-actions"><button class="primary-btn" data-close>Close</button></div>`, true);
      bindClose();
      refresh();
      return;
    }

    const chg = Store.severityChange();
    const n = Store.checkinsChrono().length;
    openModal('Check-in saved', `
      ${n === 1
        ? `<p>That's your baseline. From here the graph has something to compare against — and the number you're watching is one that's meant to fall.</p>`
        : chg === null ? '<p>Saved.</p>'
        : chg >= 30
          ? `<p class="big-stat good">−${chg}%</p>
             <p>You're <b>${chg}% down</b> from your first check-in. For scale: a <b>30% reduction</b> is what counts as treatment response in BDD trials${chg >= 50 ? ', and 50% is what maps onto "very much improved"' : ''}. That's a real threshold from the literature, not an encouraging noise.</p>`
          : chg > 0
            ? `<p class="big-stat good">−${chg}%</p><p>Down ${chg}% from baseline. The trial benchmark is a 30% reduction — you're moving toward it. In Wilhelm's study about half of people got there by week 12 and roughly 81% by week 22, so this is usually a matter of weeks rather than days.</p>`
            : `<p>Not down this week. That's ordinary — the course of this is bumpy rather than linear, and single weeks are noisy. What predicts improvement is continuing to practise, not any individual week's score.</p>`}
      <div class="form-actions"><button class="primary-btn" data-close>Close</button></div>`);
    bindClose();
    refresh();
  };

  draw();
}

/* ---------- PROGRESS ---------- */

RENDER.progress = () => {
  const s = Store.get();
  const c = Store.checkinsChrono();
  const u = Store.urgeStats();
  const rc = Store.reclaimStats();
  const chg = Store.severityChange();

  $('#panel-progress').innerHTML = `
    <h1>Progress</h1>
    <p class="section-sub">Everything here is meant to go <b>down</b> — distress, urges, avoidance, conviction. Nothing on this page measures how you look, and nothing ever will.</p>

    <div class="card">
      <div class="panel-header-row">
        <div><h3>Weekly severity</h3>
          <p class="small">Self-report tracker, 0–${CONTENT.SEVERITY_MAX}. Not a diagnostic score.</p></div>
        <button class="primary-btn" data-act="checkin">${Store.checkinDue() ? 'Check in now' : 'Check in early'}</button>
      </div>
      ${c.length >= 2 ? lineChart(c.map(x => ({ date: x.date, v: Store.severityScore(x) })), CONTENT.SEVERITY_MAX)
        : `<div class="empty-state">${c.length === 1
          ? 'One check-in recorded. The line appears after the second one.'
          : 'No check-ins yet.'}</div>`}
      ${chg !== null ? `<p class="chart-note">${chg > 0
        ? `Down <b class="good">${chg}%</b> from baseline. Trials count ≥30% as response, ≥50% as very much improved.`
        : `Up ${Math.abs(chg)}% from baseline. Weeks vary; the trend over months is what matters.`}</p>` : ''}
    </div>

    ${c.length >= 2 ? `<div class="card">
      <h3>Belief conviction</h3>
      <p class="small">How certain you are that the concern is accurate. CBT improves insight on its own — this often shifts before distress does.</p>
      ${lineChart(c.map(x => ({ date: x.date, v: x.conviction ?? 0 })), 4)}
    </div>` : ''}

    <div class="stat-grid">
      <div class="stat-box"><div class="stat-num">${Store.practiceDays().length}</div>
        <div class="stat-label">days practised</div></div>
      <div class="stat-box"><div class="stat-num">${Store.streak()}</div>
        <div class="stat-label">current streak</div></div>
      ${u.resistRate !== null ? `<div class="stat-box"><div class="stat-num good">${u.resistRate}%</div>
        <div class="stat-label">urges resisted this week</div></div>` : ''}
      ${u.avgDrop !== null ? `<div class="stat-box"><div class="stat-num good">−${u.avgDrop}</div>
        <div class="stat-label">mean urge drop, unacted on</div></div>` : ''}
      <div class="stat-box"><div class="stat-num">${s.mirrorLogs.length}</div>
        <div class="stat-label">retraining sessions</div></div>
      <div class="stat-box"><div class="stat-num">${s.erpLogs.length}</div>
        <div class="stat-label">exposures logged</div></div>
    </div>

    <div class="card">
      <div class="panel-header-row">
        <div><h3>What BDD took, and what you've got back</h3>
          <p class="small">The real outcome. Symptom scores are a proxy; this is the thing itself.</p></div>
        <button class="secondary-btn" id="addReclaim">+ Add</button>
      </div>
      <div class="reclaim-list">
        ${s.reclaim.length ? s.reclaim.map(r => `
          <label class="reclaim-item ${r.reclaimed ? 'back' : ''}">
            <input type="checkbox" data-reclaim="${r.id}" ${r.reclaimed ? 'checked' : ''}>
            <span>${esc(r.text)}</span>
            ${r.reclaimed ? '<em>back</em>' : ''}
          </label>`).join('')
          : '<div class="empty-state">Add the things this has cost you — then tick them off as they come back.</div>'}
      </div>
      ${rc.total ? `<p class="chart-note">${rc.back} of ${rc.total} back.</p>` : ''}
    </div>

    <div class="card">
      <h3>Take this to a clinician</h3>
      <p class="small">Only about 15% of people with BDD are ever diagnosed, and shame is the main reason it goes unsaid. Handing someone a written record is far easier than saying it out loud.</p>
      <div class="btn-row">
        <button class="secondary-btn" id="exportBtn">Copy summary</button>
        <button class="secondary-btn" id="downloadBtn">Download as text</button>
      </div>
      <details class="danger"><summary>Erase everything</summary>
        <p class="small">Permanently deletes all entries on this device. Cannot be undone.</p>
        <button class="secondary-btn danger-btn" id="wipeBtn">Erase all my data</button>
      </details>
    </div>`;

  $('#addReclaim').addEventListener('click', () => {
    openModal('What has this cost you?', `
      <label class="field">Something you've stopped doing
        <input type="text" id="rcText" placeholder="e.g. Swimming on Saturdays">
      </label>
      <div class="form-actions">
        <button class="secondary-btn" data-close>Cancel</button>
        <button class="primary-btn" id="rcSave">Add</button>
      </div>`);
    bindClose();
    $('#rcSave').addEventListener('click', () => {
      const t = $('#rcText').value.trim();
      if (!t) return $('#rcText').focus();
      Store.push('reclaim', { text: t, reclaimed: false });
      closeModal(); refresh();
    });
  });

  document.querySelectorAll('[data-reclaim]').forEach(cb =>
    cb.addEventListener('change', () => {
      const id = Number(cb.dataset.reclaim);
      Store.update(st => {
        const r = st.reclaim.find(x => x.id === id);
        if (r) r.reclaimed = cb.checked;
      });
      if (cb.checked) {
        Store.logPractice('reclaim', 'resumed something');
        const r = Store.get().reclaim.find(x => x.id === id);
        openModal('That counts for more than the graph', `
          <p><b>${esc(r.text)}</b> — back.</p>
          <p>This is the outcome that actually matters. Symptom scores are a proxy for it; getting your life back is the thing itself.</p>
          <div class="form-actions"><button class="primary-btn" data-close>Close</button></div>`);
        bindClose();
      }
      refresh();
    }));

  $('#exportBtn').addEventListener('click', async () => {
    const txt = Store.exportSummary();
    try {
      await navigator.clipboard.writeText(txt);
      $('#exportBtn').textContent = 'Copied ✓';
      setTimeout(() => { const b = $('#exportBtn'); if (b) b.textContent = 'Copy summary'; }, 2000);
    } catch {
      openModal('Your summary', `<textarea rows="18" class="export-area">${esc(txt)}</textarea>
        <p class="small">Select all and copy.</p>`, true);
    }
  });

  $('#downloadBtn').addEventListener('click', () => {
    const blob = new Blob([Store.exportSummary()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `steady-summary-${Store.today()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#wipeBtn').addEventListener('click', () => {
    if (confirm('Erase everything? This cannot be undone.') &&
        confirm('Really erase all entries on this device?')) {
      Store.wipe(); location.reload();
    }
  });
};

/* Inline SVG so the page stays self-contained and offline. */
function lineChart(points, max) {
  if (points.length < 2) return '';
  const W = 640, H = 160, P = 24;
  const xs = (i) => P + (i * (W - P * 2)) / (points.length - 1);
  const ys = (v) => H - P - (v / max) * (H - P * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(p.v).toFixed(1)}`).join(' ');
  const area = `${path} L${xs(points.length - 1).toFixed(1)},${H - P} L${xs(0).toFixed(1)},${H - P} Z`;
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="chart" role="img"
      aria-label="Trend over ${points.length} check-ins, most recent value ${points[points.length - 1].v} out of ${max}">
    <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" class="axis"/>
    <path d="${area}" class="chart-area"/>
    <path d="${path}" class="chart-line"/>
    ${points.map((p, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(p.v).toFixed(1)}" r="4" class="chart-dot"><title>${fmtDate(p.date)}: ${p.v}</title></circle>`).join('')}
  </svg><div class="chart-x"><span>${fmtDate(points[0].date)}</span><span>${fmtDate(points[points.length - 1].date)}</span></div></div>`;
}

/* ---------- LEARN ---------- */

RENDER.learn = () => {
  const read = Store.get().readLearn;
  $('#panel-learn').innerHTML = `
    <h1>Learn</h1>
    <p class="section-sub">Plain-language, and specific about the evidence. Where something isn't settled, it says so — overclaiming is how a tool like this loses the only thing it has, which is being believed.</p>
    <div class="accordion">
      ${CONTENT.LEARN.map(item => `
        <div class="accordion-item ${read.includes(item.id) ? 'read' : ''}" data-id="${item.id}">
          <button class="accordion-header">
            <span>${esc(item.title)}</span>
            <span class="acc-meta">${item.minutes} min ${read.includes(item.id) ? '· read' : ''}<span class="chev">›</span></span>
          </button>
          <div class="accordion-body">${item.body}</div>
        </div>`).join('')}
    </div>
    <div class="card soft">
      <h3>Where this comes from</h3>
      <p class="small">Figures here trace to the peer-reviewed literature — Phillips and Menard on suicidality and course; Veale and Riley on mirror gazing; Feusner on visual processing; Crerand, Menard and Phillips on cosmetic outcomes; Harrison and colleagues' meta-analysis of CBT trials; Wilhelm's randomized trials; NICE CG31. Nothing here is a substitute for assessment by someone qualified.</p>
    </div>`;

  document.querySelectorAll('.accordion-header').forEach(h =>
    h.addEventListener('click', () => {
      const item = h.parentElement;
      const body = item.querySelector('.accordion-body');
      const open = item.classList.toggle('open');
      body.style.maxHeight = open ? body.scrollHeight + 48 + 'px' : '0';
      if (open) {
        const id = item.dataset.id;
        if (!Store.get().readLearn.includes(id)) {
          Store.update(s => s.readLearn.push(id));
        }
      }
    }));
};

/* ---------- shared actions ---------- */

function bindClose() {
  document.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', closeModal));
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  ({
    checkin: runCheckin,
    urge: urgeExercise,
    mirror: mirrorExercise,
    thought: newThoughtRecord,
    editModel: runOnboarding
  })[el.dataset.act]?.();
});

/* ---------- boot ---------- */

RENDER.today();
if (!Store.get().onboarded) {
  // Don't ambush someone on first paint — let the landing card make the case first.
}
