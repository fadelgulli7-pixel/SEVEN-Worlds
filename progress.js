// Each browser tab writes only the worlds it changed. Read, compare and commit
// in one origin-wide critical section before adopting remote changes locally.
export function browserSaveLock() {
  if (globalThis.navigator?.locks) {
    return job => navigator.locks.request('seven-worlds-progress', job);
  }
  let database;
  return async job => {
    if (!globalThis.indexedDB) throw new Error('Persistent storage unavailable');
    database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('seven-worlds-coordination', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('mutex');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => { database = null; throw error; });
    const db = await database;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutex', 'readwrite');
      const request = tx.objectStore('mutex').get('save');
      let problem;
      request.onsuccess = () => {
        try { job(); } catch (error) { problem = error; tx.abort(); }
      };
      tx.oncomplete = resolve;
      tx.onabort = () => reject(problem || tx.error);
    });
  };
}

const worlds = ['farm', 'sniper'];
export function progressWriter({state, read, write, lock, onChange, onError}) {
  const baseline = Object.fromEntries(worlds.map(key => [key, JSON.stringify(state[key])]));
  let queued = false;
  function reconcile() {
    queued = false;
    const remote = read();
    const adopted = [];
    const conflicts = [];
    let changed = false;
    for (const key of worlds) {
      const local = JSON.stringify(state[key]);
      const stored = JSON.stringify(remote[key]);
      if (local === stored) continue;
      if (stored !== baseline[key]) {
        adopted.push(key);
        if (local !== baseline[key]) conflicts.push(key);
      } else {
        remote[key] = state[key];
        changed = true;
      }
    }
    if (changed) write(remote);
    for (const key of adopted) {
      const current = state[key];
      for (const name of Object.keys(current)) delete current[name];
      Object.assign(current, remote[key]);
    }
    for (const key of worlds) baseline[key] = JSON.stringify(state[key]);
    if (adopted.length) onChange(adopted, conflicts);
  }
  return () => {
    if (queued) return;
    queued = true;
    try {
      const task = lock(reconcile);
      task?.catch(error => { queued = false; onError(error); });
      return task;
    } catch (error) {
      queued = false;
      onError(error);
    }
  };
}
