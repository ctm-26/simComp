/* CyberSim UI - glue between the block palette and the simulation engine.
 * Pure DOM rendering; all "behaviour" lives in engine.js. */

(function () {
  const DESCRIPTIONS = {
    SCAN: 'Recon: list reachable neighbours of the current node.',
    SPREAD: 'Try to infect every reachable neighbour (patched/quarantined resist).',
    HOP: 'Move to an infected neighbour so the next SPREAD reaches deeper.',
    ENCRYPT: 'Simulated ransomware: lock the fake files on the current node.',
    PHONE_HOME: 'Botnet check-in: count bots reporting to the (fake) C2.',
  };

  const program = [];
  let quarantinePc2 = false;

  const $ = (id) => document.getElementById(id);

  function renderPalette() {
    const pal = $('palette');
    pal.innerHTML = '';
    Object.keys(CyberSim.BLOCKS).forEach((name) => {
      const b = document.createElement('button');
      b.innerHTML = name + '<small>' + (DESCRIPTIONS[name] || '') + '</small>';
      b.onclick = () => { program.push(name); renderProgram(); };
      pal.appendChild(b);
    });
  }

  function renderProgram() {
    const el = $('program');
    el.innerHTML = '';
    if (!program.length) {
      el.innerHTML = '<small style="color:#8b949e">No blocks yet - click blocks on the left.</small>';
      return;
    }
    program.forEach((name, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = (i + 1) + '. ' + name + ' <span title="remove">x</span>';
      chip.querySelector('span').onclick = () => { program.splice(i, 1); renderProgram(); };
      el.appendChild(chip);
    });
  }

  function renderNetwork(world) {
    const net = $('net');
    net.innerHTML = '';
    Object.values(world.nodes).forEach((n) => {
      const box = document.createElement('div');
      box.className = 'nodebox' +
        (n.infected ? ' infected' : '') +
        (n.patched ? ' patched' : '') +
        (n.quarantined ? ' quarantined' : '');
      let state = n.infected ? (n.encrypted ? 'locked' : 'infected')
        : n.patched ? 'patched' : 'clean';
      box.innerHTML = '<b>' + n.id + '</b><em>' + state + '</em>';
      net.appendChild(box);
    });
  }

  function run() {
    if (!program.length) { $('log').textContent = 'Add some blocks first.'; return; }
    const opts = { size: 6, entry: 'pc-0' };
    if (quarantinePc2) opts.quarantine = ['pc-2'];
    const result = CyberSim.runProgram(program, opts);
    $('log').textContent = result.log.join('\n');
    renderNetwork(result.world);
  }

  // initial empty network so the panel isn't blank
  function showEmptyNetwork() {
    const world = CyberSim.makeNetwork(6);
    if (quarantinePc2) world.nodes['pc-2'].quarantined = true;
    renderNetwork(world);
  }

  $('runBtn').onclick = run;
  $('clearBtn').onclick = () => { program.length = 0; renderProgram(); showEmptyNetwork();
    $('log').textContent = 'Cleared. Build a new program and run it.'; };
  $('quarBtn').onclick = () => { quarantinePc2 = !quarantinePc2; showEmptyNetwork(); };

  renderPalette();
  renderProgram();
  showEmptyNetwork();
})();
