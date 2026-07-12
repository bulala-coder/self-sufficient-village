export const SANITATION_STORAGE_KEY = 'fortress_sanitation_system_v1'

export const sanitationModes = {
  emergency: '緊急最低衛生',
  conservation: '節省耗材',
  normal: '接近日常衛生'
}

export const sanitationTypeLabels = {
  flushToilet: '一般沖水馬桶', bucketToilet: '桶式廁所', portableToilet: '便攜式馬桶', compostToilet: '堆肥廁所', emergencyBags: '緊急排泄袋', outdoorLatrine: '戶外臨時廁所',
  toiletPaper: '衛生紙', wetWipes: '濕紙巾', handSanitizer: '乾洗手', soap: '肥皂', menstrualProducts: '生理用品', diapers: '尿布', towels: '毛巾', gloves: '手套', masks: '口罩',
  trashBags: '垃圾袋', heavyDutyBags: '厚垃圾袋', zipBags: '夾鏈袋', absorbent: '吸附材料', lime: '石灰', deodorizer: '除臭用品', container: '密封容器',
  bleach: '漂白水', alcohol: '酒精', disinfectant: '消毒液', detergent: '清潔劑', dishSoap: '洗碗精', surfaceWipes: '消毒濕巾',
  litter: '貓砂', peePads: '尿布墊', poopBags: '拾便袋', cageLiners: '籠底墊材', bedding: '墊料', other: '其他'
}

export function createDefaultSanitationSystem() {
  return {
    version: '5.2',
    household: { adults: 1, children: 0, seniors: 0, specialNeeds: 0, pets: 0 },
    sanitationMode: 'emergency',
    toiletPlans: [], hygieneSupplies: [], wasteSupplies: [], cleaningSupplies: [], petWasteSupplies: [], sanitationPlans: [],
    settings: { toiletUsesPerPersonPerDay: 5, wasteBagsPerPersonPerDay: 1, wipesPerPersonPerDay: 4, handSanitizerMlPerPersonPerDay: 10, disinfectantMlPerDay: 30, petWasteBagsPerPetPerDay: 3 },
    updatedAt: ''
  }
}
