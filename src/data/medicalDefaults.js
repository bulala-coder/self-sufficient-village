export const MEDICAL_STORAGE_KEY = 'fortress_medical_system_v1'

export const medicalModes = { emergency: '緊急急救', conservation: '節省耗材', normal: '日常照護' }

export const medicalTypeLabels = {
  bandage: '繃帶', gauze: '紗布', tape: '醫療膠帶', antiseptic: '消毒用品', saline: '生理食鹽水', gloves: '醫療手套', scissors: '剪刀', thermometer: '體溫計', splint: '固定夾板', burnCare: '燒燙傷用品', coldPack: '冰敷包',
  painFever: '止痛退燒', allergy: '過敏', gastrointestinal: '腸胃', coldFlu: '感冒', electrolyte: '電解質', chronic: '慢性病', topical: '外用藥', eyeEar: '眼耳',
  woundCare: '傷口照護', medication: '藥物', syringe: '針筒或餵藥器', digestive: '腸胃用品', restraint: '保定用品',
  hospital: '醫院', clinic: '診所', pharmacy: '藥局', vet: '獸醫', family: '家人', neighbor: '鄰居', emergency: '緊急服務', other: '其他'
}

export function createDefaultMedicalSystem() {
  return {
    version: '5.3', household: { adults: 1, children: 0, seniors: 0, specialNeeds: 0, pets: 0 }, medicalMode: 'emergency',
    firstAidItems: [], medicines: [], chronicNeeds: [], petMedicalItems: [], emergencyContacts: [], carePlans: [],
    settings: { woundCareUsesPerPersonPerDay: 1, medicationBufferDays: 7, petCareUsesPerPetPerDay: 1 }, updatedAt: ''
  }
}
