/** Build Config tab form fields for port / process nodes. */
export function renderInspectorForm(node, config) {
  const fields = [];

  if (node.type === 'process') {
    fields.push(numField('duration', 'Duration (ms)', node.duration));

    const mode = node.admission?.mode || 'queue';
    fields.push(selectField('admissionMode', 'Admission', mode, [
      { value: 'queue', label: 'queue (FIFO)' },
      { value: 'slot', label: 'slot (semáforo)' },
      { value: 'batch', label: 'batch (micro-batch)' },
    ]));

    if (mode === 'queue') {
      fields.push(numField('queueMax', 'Queue max (vazio = ∞)', node.admission?.max ?? '', 1, 0));
    }
    if (mode === 'slot') {
      fields.push(numField('capacity', 'Capacity', node.admission?.max ?? 2));
    }
    if (mode === 'batch') {
      fields.push(numField('batchMax', 'Batch size', node.admission?.max ?? 10));
      fields.push(numField('batchStep', 'Step', node.admission?.step ?? 1));
    }

    if (mode === 'queue' || mode === 'slot') {
      fields.push(textField('rejectEdge', 'Reject edge id', node.admission?.rejectEdge ?? ''));
    }

    if (isJoinGate(node)) {
      const gateMode = node.gate?.from === 'all-edges' ? 'all' : 'count';
      fields.push(selectField('gateMode', 'Gate sync', gateMode, [
        { value: 'count', label: 'count' },
        { value: 'all', label: 'all edges' },
      ]));
      fields.push(numField('gateCount', 'Gate count', node.gate?.count ?? 1));
    }

    if (node.emit?.mode === 'weighted') {
      (config.outgoing[node.id] || []).forEach((edge) => {
        fields.push(numField(`weight_${edge.id}`, `Weight · ${edge.label?.text || edge.id}`, edge.weight ?? 1));
      });
    }

    if (node.retry) {
      fields.push(numField('maxRetries', 'Max retries', node.retry.maxRetries ?? 3));
    }

    if (node.circuit) {
      fields.push(numField('failureRate', 'Failure rate (0–1)', node.circuit.failureRate ?? 0.25, 0.01, 0, 1));
      fields.push(numField('failureThreshold', 'Trip threshold', node.circuit.failureThreshold ?? 5));
      fields.push(numField('recoveryMs', 'Recovery (ms)', node.circuit.recoveryMs ?? 8000));
    }
  }

  if (node.type === 'port') {
    fields.push(checkField('showReceived', 'Show received pill', node.showReceived));
  }

  if (!fields.length) {
    return '<p class="fg-muted fg-panel-placeholder">Nenhum parâmetro editável para este tipo.</p>';
  }

  return `
    <form class="fg-inspector-form">
      ${fields.join('')}
      <button type="submit" class="fg-inspector-apply">Aplicar</button>
    </form>`;
}

function isJoinGate(node) {
  const from = node.gate?.from;
  return from === 'all-edges' || Array.isArray(from);
}

function numField(name, label, value, step = 1, min = 0, max = null) {
  const maxAttr = max != null ? `max="${max}"` : '';
  return `
    <label class="fg-field">
      <span class="fg-field-label">${label}</span>
      <input class="fg-field-input" type="number" name="${name}" value="${value ?? ''}" step="${step}" min="${min}" ${maxAttr} />
    </label>`;
}

function textField(name, label, value) {
  return `
    <label class="fg-field">
      <span class="fg-field-label">${label}</span>
      <input class="fg-field-input" type="text" name="${name}" value="${value ?? ''}" />
    </label>`;
}

function selectField(name, label, value, options) {
  const opts = options.map((o) => `<option value="${o.value}"${o.value === value ? ' selected' : ''}>${o.label}</option>`).join('');
  return `
    <label class="fg-field">
      <span class="fg-field-label">${label}</span>
      <select class="fg-field-input" name="${name}">${opts}</select>
    </label>`;
}

function checkField(name, label, checked) {
  return `
    <label class="fg-field fg-field-check">
      <input type="checkbox" name="${name}"${checked ? ' checked' : ''} />
      <span class="fg-field-label">${label}</span>
    </label>`;
}

export function readInspectorPatch(form, node) {
  const fd = new FormData(form);
  const patch = {};

  if (fd.has('duration')) patch.duration = Number(fd.get('duration'));

  if (fd.has('admissionMode')) {
    const mode = fd.get('admissionMode');
    const admission = { mode, step: 1, rejectEdge: fd.get('rejectEdge') || null };
    if (mode === 'queue') {
      const raw = fd.get('queueMax');
      admission.max = raw === '' ? null : Number(raw);
    }
    if (mode === 'slot') admission.max = Number(fd.get('capacity') || 2);
    if (mode === 'batch') {
      admission.max = Number(fd.get('batchMax') || 10);
      admission.step = Number(fd.get('batchStep') || 1);
    }
    patch.admission = admission;
  }

  if (fd.has('gateMode') || fd.has('gateCount')) {
    patch.gate = {
      mode: fd.get('gateMode') || 'count',
      count: Number(fd.get('gateCount') || 1),
    };
  }

  if (fd.has('maxRetries')) {
    patch.retry = { ...node.retry, maxRetries: Number(fd.get('maxRetries')) };
  }

  if (fd.has('failureRate')) {
    patch.circuit = {
      failureRate: Number(fd.get('failureRate')),
      failureThreshold: Number(fd.get('failureThreshold')),
      recoveryMs: Number(fd.get('recoveryMs')),
    };
  }

  if (form.querySelector('[name="showReceived"]')) {
    patch.showReceived = fd.get('showReceived') === 'on';
  }

  const weights = {};
  fd.forEach((val, key) => {
    if (key.startsWith('weight_')) weights[key.slice(7)] = Number(val);
  });
  if (Object.keys(weights).length) patch.weights = weights;

  return patch;
}

export function bindInspectorForm(form, instance, nodeId, onApplied) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const node = instance.config.nodesById[nodeId];
    if (!node) return;
    instance.updateNode(nodeId, readInspectorPatch(form, node));
    if (onApplied) onApplied();
  });
}
