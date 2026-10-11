import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export class JsonStore {
  constructor(path, seedPath) {
    this.path = path;
    this.seedPath = seedPath;
    this.writeChain = Promise.resolve();
  }

  async init() {
    await mkdir(dirname(this.path), { recursive: true });
    try {
      const current = JSON.parse(await readFile(this.path, 'utf8'));
      const seed = JSON.parse(await readFile(this.seedPath, 'utf8'));
      if (Number(current.meta?.schemaVersion || 0) < Number(seed.meta?.schemaVersion || 0)) {
        const merged = { ...seed, ...current, meta:{ ...seed.meta, ...current.meta, schemaVersion:seed.meta.schemaVersion } };
        for (const [key, value] of Object.entries(seed)) {
          if (!(key in current)) merged[key] = value;
        }
        for (const key of ['roles','departments','dashboards','tasks','channels','gates','principles']) {
          const currentById = new Map((current[key] || []).map(item => [item.id, item]));
          merged[key] = (seed[key] || []).map(item => currentById.has(item.id) && key !== 'roles' ? { ...item, ...currentById.get(item.id) } : item);
          for (const item of current[key] || []) if (!merged[key].some(existing => existing.id === item.id)) merged[key].push(item);
        }
        await this.persist(merged);
      }
    } catch {
      const seed = JSON.parse(await readFile(this.seedPath, 'utf8'));
      await this.persist(seed);
    }
  }

  async read() {
    return JSON.parse(await readFile(this.path, 'utf8'));
  }

  async persist(data) {
    const temporary = `${this.path}.next`;
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporary, this.path);
  }

  async mutate(actor, action, subject, change) {
    this.writeChain = this.writeChain.then(async () => {
      const data = await this.read();
      const result = await change(data);
      data.audit.push({
        id: `audit_${randomUUID()}`,
        at: new Date().toISOString(),
        actorId: actor.id,
        roleIds: actor.roleIds,
        action,
        subject,
        result: result?.auditResult || 'recorded'
      });
      await this.persist(data);
      return result;
    });
    return this.writeChain;
  }
}

export const makeId = prefix => `${prefix}_${randomUUID()}`;
