
let liveData = {
  animals: {},      // { [animalName]: { total, mutations: {}, traits: {} } }
  serverStats: {},  // { playerCount, totalAnimals }
  lastUpdate: null,
}

export function getLiveData() {
  return liveData
}

export function setLiveData(data) {
  liveData = { ...data, lastUpdate: Date.now() }
}
