import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* "No AI runs inside Anneal."
 *
 * legal/ai-policy.md makes that claim in the first line, to people choosing a mental-health
 * app partly ON that basis, at a moment when most of this category is being rebuilt around
 * chatbots. A claim like that is worth exactly as much as the thing holding it up, and prose
 * holds nothing up — so this file is what the sentence rests on.
 *
 * It is deliberately separate from safety.test.mjs. That file asks "can anything leave the
 * device", which already covers a hosted model. This one also covers the case that file
 * cannot see: a model bundled INTO the app, running locally, sending nothing anywhere and
 * still making every sentence in §1 of the policy false. */

const DIRS = ['app', 'components', 'lib', 'store', 'content', 'types', 'constants', 'hooks'];

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(e)) out.push(full);
    }
  };
  for (const d of DIRS) walk(join(ROOT, d));
  return out;
}

/** Comments stripped, string literals preserved — see __tests__/safety.test.mjs, which
 *  documents why a regex will not do this job and how the regex version was a bypass. */
function withoutComments(src) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (quote) {
      if (ch === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
      if (ch === quote) quote = null;
      else if (ch === '\n' && quote !== '`') quote = null;
      out += ch; i += 1; continue;
    }
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      const skipped = end === -1 ? src.slice(i) : src.slice(i, end + 2);
      out += ' ' + skipped.replace(/[^\n]/g, '');
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (ch === '/' && next === '/' && src[i - 1] !== ':') {
      const end = src.indexOf('\n', i);
      i = end === -1 ? src.length : end;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') quote = ch;
    out += ch; i += 1;
  }
  return out;
}

const FILES = sourceFiles().map((f) => ({ path: f.replace(ROOT + '/', ''), src: readFileSync(f, 'utf8') }));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

describe('no AI ships inside the app', () => {
  test('there are source files to check', () => {
    assert.ok(FILES.length > 20, `only found ${FILES.length} source files`);
  });

  test('no AI or ML package is installed', () => {
    /* The manifest, not the imports. Installing the package is step one, and a test that only
       read source would go green through the commit that adds the dependency. */
    const BANNED = [
      /^openai$/i, /^@anthropic-ai\//i, /^@google\/gener/i, /^@mistralai\//i, /^cohere/i,
      /^replicate$/i, /^langchain/i, /^@langchain\//i, /^llamaindex/i, /^ollama/i,
      /^@huggingface\//i, /^@tensorflow/i, /^onnxruntime/i, /^@mlc-ai\//i,
      /^react-native-executorch/i, /^llama\.rn$/i, /^react-native-llama/i,
      /^@react-native-ml-kit\//i, /^react-native-mlkit/i, /^vercel\/ai$/i, /^ai$/i,
    ];
    for (const name of Object.keys(deps)) {
      for (const pattern of BANNED) {
        assert.ok(
          !pattern.test(name),
          `package.json installs "${name}". legal/ai-policy.md §1 tells people no AI runs in `
          + 'this app, and the App Store privacy label depends on it. If this is deliberate, '
          + 'that document and the label change in the SAME release — see §3 of the policy.',
        );
      }
    }
  });

  test('nothing in the source calls a model', () => {
    /* Covers the on-device case that the network guard in safety.test.mjs cannot see: a
       bundled model, running locally, sending nothing anywhere, and still making every
       sentence in §1 false. */
    const CALLS = /\bcreateChatCompletion\b|\bchat\.completions\b|\bgenerateText\b|\bstreamText\b|\bMLModel\b|\bCoreML\b|\btfjs\b|\bInferenceSession\b|\bloadLayersModel\b|\bllama\w*\(/;
    for (const f of FILES) {
      assert.doesNotMatch(withoutComments(f.src), CALLS,
        `${f.path} calls a model. legal/ai-policy.md §1 says none runs here.`);
    }
  });

  test('no model weights are bundled', () => {
    /* A model file in assets/ would ship inside the binary and never touch the network, so
       neither the import allowlist nor the manifest check above would notice it. */
    const WEIGHTS = /\.(gguf|onnx|tflite|mlmodel|mlmodelc|mlpackage|safetensors|pt|pth|ckpt|bin)$/i;
    const found = [];
    const walk = (dir) => {
      let entries;
      try { entries = readdirSync(dir); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (WEIGHTS.test(e)) found.push(full.replace(ROOT + '/', ''));
      }
    };
    for (const d of ['assets', 'app', 'components', 'content', 'lib']) walk(join(ROOT, d));
    assert.deepEqual(found, [], `model weights are bundled: ${found.join(', ')}`);
  });

  test('nothing the user writes is scored, classified or summarised', () => {
    /* The policy says the app does not interpret what you write — "What you type is stored,
       encrypted, and shown back to you." A sentiment score or a risk classifier would be AI
       by any reasonable reading, would need no network, and would be a much worse surprise in
       a body-image journal than a chatbot. */
    const INTERPRET = /\bsentiment\b|\btoxicity\b|\bclassif(y|ier|ication)\b|\bembedding\b|\brisk[Ss]core\b|\bsummari[sz]e\(/;
    for (const f of FILES) {
      assert.doesNotMatch(withoutComments(f.src), INTERPRET,
        `${f.path} appears to interpret user text. legal/ai-policy.md §1 says nothing does.`);
    }
  });
});

describe('the AI policy says what the code does', () => {
  const policy = readFileSync(join(ROOT, 'legal/ai-policy.md'), 'utf8');

  test('it exists and answers both halves of the question', () => {
    /* The two questions must both be answered, because answering only the first — "is there
       AI in the product" — is technically true and misleading, which is the failure mode this
       whole repository has spent its history removing. */
    assert.match(policy, /No artificial intelligence runs inside/i,
      'the policy no longer states that no AI runs in the product');

    /* The SUBSTANCE, not a phrase. The first version of this assertion accepted
       `/drafted with the assistance of/`, which is also the wording of a sub-heading further
       down that merely unpacks the sentence — so deleting the disclosure entirely left the
       heading behind and the guard went green. Proved by mutation. It now requires the thing
       being disclosed to be named. */
    const body = policy.replace(/<!--[\s\S]*?-->/g, '');
    assert.match(body, /large language model/i,
      'the policy no longer names what drafted the content');
    assert.match(body, /AI was used to write the app.s text/i,
      'the short version no longer discloses that the content was AI-drafted, so a reader who '
      + 'stops after the summary is left with only the reassuring half');
  });

  test('it does not claim a clinician wrote or approved the content', () => {
    /* The one sentence in this document that would be expensive to get wrong. Whether a
       clinician has reviewed it is answered by legal/entity.json → clinicalReview, and the
       body must not assert it independently. */
    const body = policy.replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(body, /written by (a )?(clinician|psychologist|therapist|doctor)/i,
      'the AI policy claims clinical authorship');
    assert.match(body, /It does not mean a clinician wrote it/i,
      'the policy no longer states plainly that a clinician did not write it');
  });

  test('the clinical-review paragraph comes from entity.json, not from prose', () => {
    assert.match(policy, /\{\{CLINICAL_REVIEW\}\}/,
      'the clinical-review answer has been hard-coded into the document instead of read from '
      + 'legal/entity.json, where the publisher answers it and the build checks it');
  });

  test('the build refuses to publish while the answer is unanswered', () => {
    /* Same discipline as the entity name and the address: a guess in this field is a claim
       about clinical oversight that may not exist. */
    assert.match(readFileSync(join(ROOT, 'site/entity.mjs'), 'utf8'),
      /REQUIRED = \[[^\]]*'clinicalReview'/,
      'clinicalReview is not required, so the site can publish with the question unanswered');
  });

  test('every AI claim it makes is one this suite actually holds', () => {
    /* The policy names the tests that hold it up. If it names one that does not exist, the
       reader is being pointed at a guarantee that is not there. */
    const named = [...policy.matchAll(/__tests__\/([\w.-]+\.mjs)/g)].map((m) => m[1]);
    assert.ok(named.length >= 2, 'the policy no longer cites the tests that hold its claims');
    const present = new Set(readdirSync(join(ROOT, '__tests__')));
    for (const f of new Set(named)) {
      assert.ok(present.has(f), `legal/ai-policy.md cites __tests__/${f}, which does not exist`);
    }
  });
});
