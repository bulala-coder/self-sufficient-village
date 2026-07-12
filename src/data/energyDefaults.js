export const ENERGY_STORAGE_KEY = 'fortress_energy_system_v1'

export const deviceCategories = ['lighting', 'communication', 'medical', 'refrigeration', 'cooking', 'information', 'comfort', 'other']
export const devicePriorities = ['critical', 'high', 'medium', 'low']
export const powerSourceTypes = ['powerBank', 'batteryStation', 'battery', 'ups', 'solarPanel', 'generator', 'vehicle', 'grid', 'other']
export const fuelSourceTypes = ['butane', 'propane', 'alcohol', 'charcoal', 'wood', 'solidFuel', 'other']

export const energyLabels = {
  lighting: '照明', communication: '通訊', medical: '醫療必要設備', refrigeration: '冷藏', cooking: '電力烹調', information: '資訊設備', comfort: '舒適設備', other: '其他',
  critical: '生存必要', high: '高優先', medium: '中優先', low: '低優先',
  powerBank: '行動電源', batteryStation: '戶外電源', battery: '電池', ups: 'UPS', solarPanel: '太陽能板', generator: '發電機', vehicle: '車用電源', grid: '市電',
  butane: '卡式瓦斯', propane: '瓦斯桶', alcohol: '酒精燃料', charcoal: '木炭', wood: '柴火', solidFuel: '固體燃料'
}

export const defaultEnergySystem = {
  version: '5.1',
  devices: [],
  powerSources: [],
  fuelSources: [],
  energyPlans: [],
  usageProfiles: {
    blackout: { name: '停電模式', description: '只保留照明、通訊與必要設備。', lightingHours: 6, communicationHours: 4, medicalHours: 0, cookingUsesPerDay: 1 },
    conservation: { name: '節能模式', description: '維持基本照明、通訊、少量烹調與必要設備。', lightingHours: 8, communicationHours: 6, medicalHours: 0, cookingUsesPerDay: 2 },
    normal: { name: '一般模式', description: '接近日常使用，但仍以災害節能為前提。', lightingHours: 12, communicationHours: 8, medicalHours: 0, cookingUsesPerDay: 3 }
  },
  currentProfile: 'blackout',
  updatedAt: ''
}

export function createDefaultEnergySystem() {
  return JSON.parse(JSON.stringify(defaultEnergySystem))
}
