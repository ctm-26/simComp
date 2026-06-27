/*
 * CyberSim - educational simulation engine (MVP)
 * ------------------------------------------------
 * This is a SANDBOX. Nothing here touches a real filesystem, network,
 * process, or device. "Nodes", "files", and "packets" are plain objects
 * living in memory. The point is to teach how infections spread and how
 * defenses stop them - not to produce anything runnable in the real world.
 *
 * No block performs real I/O. The most "dangerous" thing this file can do
 * is flip a boolean on a fake object.
 */

/* ---------------- The simulated world ---------------- */

// A Node is one fake machine on the fake network.
function makeNode(id, opts = {}) {
  return {
    id,
    infected: false,
    quarantined: false, // blue-team can isolate a node
    patched: !!opts.patched, // patched nodes resist infection
    files: (opts.files || ['readme.txt', 'photos/', 'budget.xlsx']).slice(),
    encrypted: false, // simulated "ransomware" effect
  };
}

// Build a small fake LAN: a star of `size` machines around "pc-0".
// `links` is an adjacency map describing who can reach whom.
function makeNetwork(size = 6, patchedRatio = 0.25) {
  const nodes = {};
  for (let i = 0; i < size; i++) {
    nodes['pc-' + i] = makeNode('pc-' + i, {
      // deterministic "patched" pattern so lessons are reproducible
      patched: (i % Math.max(1, Math.round(1 / patchedRatio))) === 0 && i !== 0,
    });
  }
  // Topology: pc-0 connects to everyone; everyone connects back to pc-0,
  // plus a couple of peer links so spread can chain.
  const links = {};
  Object.keys(nodes).forEach((id) => (links[id] = new Set()));
  for (let i = 1; i < size; i++) {
    links['pc-0'].add('pc-' + i);
    links['pc-' + i].add('pc-0');
  }
  if (size > 3) {
    links['pc-1'].add('pc-2');
    links['pc-2'].add('pc-1');
    links['pc-2'].add('pc-3');
    links['pc-3'].add('pc-2');
  }
  return { nodes, links };
}

/* ---------------- The block "instruction set" ---------------- */

// Each block is a pure-ish function (ctx, args) -> log lines.
// ctx carries the world, the "current" node the agent sits on, and config.
// Blocks are intentionally high-level and abstract.
const BLOCKS = {
  // Look at neighbours of the current node (recon).
  SCAN: (ctx) => {
    const neighbours = [...ctx.world.links[ctx.current]];
    return ['SCAN ' + ctx.current + ' -> found: ' + (neighbours.join(', ') || '(none)')];
  },

  // Attempt to infect every reachable neighbour of the current node.
  // Patched or quarantined nodes resist. This is the core "spread" lesson.
  SPREAD: (ctx) => {
    const out = [];
    const neighbours = [...ctx.world.links[ctx.current]];
    for (const id of neighbours) {
      const n = ctx.world.nodes[id];
      if (n.quarantined) {
        out.push('SPREAD -> ' + id + ' BLOCKED (quarantined by defender)');
      } else if (n.patched) {
        out.push('SPREAD -> ' + id + ' FAILED (node is patched)');
      } else if (n.infected) {
        out.push('SPREAD -> ' + id + ' already infected');
      } else {
        n.infected = true;
        ctx.infectedOrder.push(id);
        out.push('SPREAD -> ' + id + ' INFECTED');
      }
    }
    return out;
  },

  // Move the agent's "current" position to an infected neighbour so the
  // next SPREAD reaches deeper into the network (propagation chaining).
  HOP: (ctx) => {
    const neighbours = [...ctx.world.links[ctx.current]];
    const next = neighbours.find((id) => ctx.world.nodes[id].infected && !ctx.world.nodes[id].quarantined);
    if (next) {
      ctx.current = next;
      return ['HOP -> now operating from ' + next];
    }
    return ['HOP -> no infected neighbour to hop to (staying on ' + ctx.current + ')'];
  },

  // Simulated ransomware: "encrypt" the fake files on the current node.
  // Purely flips a flag and renames fake files - no cryptography happens.
  ENCRYPT: (ctx) => {
    const n = ctx.world.nodes[ctx.current];
    if (!n.infected) return ['ENCRYPT -> skipped (' + ctx.current + ' not infected)'];
    if (n.encrypted) return ['ENCRYPT -> ' + ctx.current + ' already encrypted'];
    n.encrypted = true;
    n.files = n.files.map((f) => f + '.locked');
    return ['ENCRYPT -> ' + ctx.current + ' files locked (simulated)'];
  },

  // Simulated botnet "check-in" to a command-and-control server. This just
  // counts how many infected nodes would report in - no real networking.
  PHONE_HOME: (ctx) => {
    const infected = Object.values(ctx.world.nodes).filter((n) => n.infected);
    return ['PHONE_HOME -> ' + infected.length + ' bot(s) checked in to (fake) C2'];
  },
};

/* ---------------- The runner ---------------- */

// Run a program (array of block names) against a fresh world.
// `entry` is the first node to infect (patient zero).
function runProgram(program, opts = {}) {
  const world = makeNetwork(opts.size || 6, opts.patchedRatio || 0.25);
  const entry = opts.entry || 'pc-0';

  // Defender setup: optionally quarantine some nodes before the run.
  (opts.quarantine || []).forEach((id) => {
    if (world.nodes[id]) world.nodes[id].quarantined = true;
  });

  // Patient zero.
  world.nodes[entry].infected = true;

  const ctx = {
    world,
    current: entry,
    infectedOrder: [entry],
  };

  const log = ['== run start: patient zero = ' + entry + ' =='];
  for (const step of program) {
    const block = BLOCKS[step];
    if (!block) {
      log.push('?? unknown block: ' + step);
      continue;
    }
    log.push(...block(ctx));
  }

  const infectedCount = Object.values(world.nodes).filter((n) => n.infected).length;
  const total = Object.keys(world.nodes).length;
  log.push('== run end: ' + infectedCount + '/' + total + ' nodes infected ==');

  return { world, log, infectedCount, total };
}

/* ---------------- Exports (browser + Node) ---------------- */

const CyberSim = { makeNode, makeNetwork, BLOCKS, runProgram };
if (typeof module !== 'undefined' && module.exports) module.exports = CyberSim;
if (typeof window !== 'undefined') window.CyberSim = CyberSim;