const fs = require('fs/promises');
const path = require('path');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'simulation-state.json');
const filePath = process.env.SIMULATION_DATA_FILE
    ? path.resolve(process.env.SIMULATION_DATA_FILE)
    : DEFAULT_FILE;

let cache = null;
let loadPromise = null;
let writePromise = Promise.resolve();

const loadStore = async () => {
    if (cache) return cache;
    if (!loadPromise) {
        loadPromise = fs.readFile(filePath, 'utf8')
            .then((contents) => {
                const parsed = JSON.parse(contents);
                cache = parsed && typeof parsed === 'object' ? parsed : {};
            })
            .catch((error) => {
                if (error.code !== 'ENOENT') {
                    console.warn(`⚠️ Could not read simulation state file: ${error.message}`);
                }
                cache = {};
            })
            .finally(() => {
                loadPromise = null;
            });
    }

    await loadPromise;
    return cache;
};

const persistStore = async () => {
    const directory = path.dirname(filePath);
    const temporaryPath = `${filePath}.tmp`;
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(temporaryPath, JSON.stringify(cache, null, 2), 'utf8');
    await fs.rename(temporaryPath, filePath);
};

const getSimulationState = async (userId) => {
    const store = await loadStore();
    const state = store[userId];
    return state ? { ...state, persisted: true } : null;
};

const saveSimulationState = async (userId, state) => {
    await loadStore();
    cache[userId] = { ...state };
    writePromise = writePromise.then(persistStore);
    await writePromise;
    return { ...cache[userId], persisted: true };
};

module.exports = {
    filePath,
    getSimulationState,
    saveSimulationState,
};
