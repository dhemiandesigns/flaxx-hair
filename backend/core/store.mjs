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
      await readFile(this.path, 'utf8');
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
