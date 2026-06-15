/** Auto queue / throughput pills driven by token flow. */

export class NodeStats {
  constructor(nodes) {
    this.queue = {};
    this.through = {};
    nodes.forEach((n) => {
      if (n.metrics?.queue) this.queue[n.id] = 0;
      if (n.metrics?.count) this.through[n.id] = 0;
    });
  }

  reset() {
    Object.keys(this.queue).forEach((id) => { this.queue[id] = 0; });
    Object.keys(this.through).forEach((id) => { this.through[id] = 0; });
  }

  onArrive(nodeId) {
    if (this.queue[nodeId] !== undefined) this.queue[nodeId] += 1;
    if (this.through[nodeId] !== undefined) this.through[nodeId] += 1;
  }

  onDepart(nodeId) {
    if (this.queue[nodeId] !== undefined) {
      this.queue[nodeId] = Math.max(0, this.queue[nodeId] - 1);
    }
  }

  pillsFor(nodeId, node) {
    if (!node?.metrics) return [];
    const pills = [];
    const q = this.queue[nodeId];
    if (q !== undefined) {
      const max = node.metrics.queue?.max;
      if (max) {
        const tone = q >= max ? 'danger' : q > max * 0.7 ? 'warning' : 'primary';
        pills.push({
          text: `${q}/${max}`,
          tone,
          progress: Math.min(1, q / max),
        });
      } else {
        pills.push({ text: `q ${q}`, tone: q > 0 ? 'warning' : 'primary' });
      }
    }
    const t = this.through[nodeId];
    if (t !== undefined) {
      pills.push({ text: `↳ ${t}`, tone: 'success' });
    }
    return pills;
  }

  hasAutoMetrics() {
    return Object.keys(this.queue).length > 0 || Object.keys(this.through).length > 0;
  }
}
