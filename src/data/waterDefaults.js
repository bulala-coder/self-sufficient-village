export const WATER_STORAGE_KEY = 'fortress_water_system_v1'

export const storageCategories = ['bottled', 'container', 'tank', 'dispenser', 'bathtub', 'rainwater', 'utility', 'recycled', 'other']
export const sourceTypes = ['tap', 'buildingTank', 'dispenser', 'store', 'relatives', 'publicStation', 'spring', 'stream', 'river', 'well', 'rain', 'dehumidifier', 'airConditioner', 'other']
export const treatmentTypes = ['boiling', 'householdFilter', 'portableFilter', 'gravityFilter', 'purificationTablets', 'chlorineDisinfection', 'ultraviolet', 'distillation', 'sedimentation', 'clothPrefilter', 'other']

export const waterLabels = {
  bottled: '瓶裝水', container: '儲水容器', tank: '水塔', dispenser: '飲水機', bathtub: '浴缸', rainwater: '雨水', utility: '自來水', recycled: '回收水', other: '其他',
  tap: '自來水', buildingTank: '大樓水塔', store: '商店', relatives: '親友', publicStation: '公共取水站', spring: '泉水', stream: '溪流', river: '河流', well: '井水', rain: '雨水', dehumidifier: '除濕機', airConditioner: '冷氣冷凝水',
  boiling: '煮沸', householdFilter: '家用濾水器', portableFilter: '攜帶式濾水器', gravityFilter: '重力濾水器', purificationTablets: '淨水錠', chlorineDisinfection: '氯消毒', ultraviolet: '紫外線', distillation: '蒸餾', sedimentation: '沉澱', clothPrefilter: '布料預濾'
}

export const defaultWaterSystem = {
  version: '4.6',
  updatedAt: '',
  household: {
    adults: 1, children: 0, seniors: 0, specialNeeds: 0, dogs: 0, cats: 0, otherAnimals: 0, otherAnimalName: '',
    needs: { adult: 3, child: 2, senior: 3, specialNeeds: 3.5, dog: 1, cat: 0.25, otherAnimal: 0 }
  },
  activeMode: 'survival',
  modes: {
    survival: { cooking: 2, cleaning: 2, toilet: 4 },
    conservation: { cooking: 3, cleaning: 5, toilet: 8 },
    normal: { cooking: 5, cleaning: 15, toilet: 24 }
  },
  storage: [],
  sources: [],
  treatments: [],
  usageLogs: [],
  rainwater: { enabled: false, collectionArea: 0, storageCapacity: 0, currentVolume: 0, intendedUses: '', firstFlush: false, meshFilter: false, covered: false, mosquitoProtected: false, notes: '' },
  plans: [
    { id: 'default-24h', name: '24 小時停水', durationDays: 1, drinking: 3, cooking: 2, cleaning: 2, toilet: 4, animals: 0, emergencyReserve: 3, notes: '' },
    { id: 'default-72h', name: '72 小時停水', durationDays: 3, drinking: 3, cooking: 2, cleaning: 2, toilet: 4, animals: 0, emergencyReserve: 6, notes: '' },
    { id: 'default-7d', name: '7 天停水', durationDays: 7, drinking: 3, cooking: 2, cleaning: 2, toilet: 4, animals: 0, emergencyReserve: 9, notes: '' }
  ]
}

export function createDefaultWaterSystem() {
  return JSON.parse(JSON.stringify(defaultWaterSystem))
}
