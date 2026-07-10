export const taskSystems = [
  ['all', '全部'],
  ['water', '水系統'],
  ['food', '食物系統'],
  ['power', '電力通訊'],
  ['medical', '醫療急救'],
  ['animal', '動物照護'],
  ['terrain', '地形風險'],
  ['evacuation', '撤離規劃'],
  ['longterm', '長期自給']
]

export const taskSystemLabels = Object.fromEntries(taskSystems)

const missionTasks = [
  {
    id: 'water-72h-baseline',
    title: '建立 72 小時飲水基準',
    system: 'water',
    riskLevel: 5,
    estimatedMinutes: 25,
    purpose: '用家庭人數與動物數量建立最低飲水線，不靠臨時採買。',
    tools: ['紙本紀錄', '計算器', '現有飲水庫存'],
    steps: ['列出成人、兒童與動物數量。', '成人每日 3L、兒童每日 2L、動物依體型估算。', '乘以 3 天得到最低值。', '盤點現有可飲用水。', '寫下缺口與補足日期。'],
    completion: '完成一份 72 小時飲水需求、現有水量與缺口紀錄。',
    failureConditions: ['只估算人類，未納入動物。', '沒有實際盤點家中水量。', '使用來路不明或保存狀態不明的水。'],
    relatedDrills: ['water-24h', 'family-72h', 'earthquake-72h'],
    relatedGap: '飲水準備缺口',
    xp: 40
  },
  {
    id: 'water-ration-plan',
    title: '建立停水時的用水分配表',
    system: 'water',
    riskLevel: 4,
    estimatedMinutes: 30,
    purpose: '把飲用、洗手、清潔、沖廁與動物用水分級，避免停水後失控消耗。',
    tools: ['紙筆', '家庭用水清單', '儲水容器位置'],
    steps: ['列出所有用水項目。', '標記必需、可縮減、可暫停。', '設定每日飲水不可挪用量。', '規劃清潔與沖廁替代方式。', '把分配表貼在儲水區。'],
    completion: '完成一張停水 24 小時用水分配表。',
    failureConditions: ['沒有保留飲水優先權。', '未考慮衛生與動物需求。', '分配表沒有放在可見位置。'],
    relatedDrills: ['water-24h'],
    relatedGap: '停水分配缺口',
    xp: 35
  },
  {
    id: 'water-backup-purification',
    title: '建立備用取水與淨水方案',
    system: 'water',
    riskLevel: 5,
    estimatedMinutes: 35,
    purpose: '確認停水延長時的補水來源與安全處理方式，但不鼓勵冒險取水。',
    tools: ['地圖', '淨水器或煮沸設備清單', '乾淨容器'],
    steps: ['列出安全補水來源。', '標記不可冒險前往的位置。', '確認容器乾淨且可加蓋。', '列出淨水、煮沸或消毒流程。', '寫下停止取水條件。'],
    completion: '完成備用取水來源、處理流程與停止條件。',
    failureConditions: ['把溪流、海水或污染水源當作直接飲水。', '沒有容器清潔策略。', '未設定天候或夜間停止條件。'],
    relatedDrills: ['water-24h', 'mountain-rain', 'remote-7d'],
    relatedGap: '備用水源缺口',
    xp: 45
  },
  {
    id: 'food-72h-shelf-stable',
    title: '建立 72 小時免冷藏食物',
    system: 'food',
    riskLevel: 5,
    estimatedMinutes: 30,
    purpose: '建立斷電時仍可直接食用或簡單加熱的最低食物線。',
    tools: ['食物櫃', '保存期限標籤', '庫存頁'],
    steps: ['列出家中免冷藏食物。', '以成人每日 3 份、兒童每日 2 份估算。', '排除需要冷藏或複雜烹調的食物。', '標記保存期限。', '寫下缺口清單。'],
    completion: '完成 72 小時免冷藏食物份數與缺口紀錄。',
    failureConditions: ['把冷凍或冷藏食物算入核心 72 小時。', '未檢查保存期限。', '沒有開罐器或加熱備案。'],
    relatedDrills: ['family-72h', 'earthquake-72h'],
    relatedGap: '食物準備缺口',
    xp: 40
  },
  {
    id: 'food-7d-rotation',
    title: '建立 7 天食物輪替清單',
    system: 'food',
    riskLevel: 3,
    estimatedMinutes: 35,
    purpose: '把庫存變成會輪替的系統，避免過期、重複購買與假性安全感。',
    tools: ['食物庫存', '標籤', '行事曆'],
    steps: ['盤點 7 天可食用食物。', '依保存期限排序。', '標記本月需消耗品。', '設定補貨下限。', '把輪替日期寫入日曆。'],
    completion: '完成一份 7 天食物輪替表與補貨下限。',
    failureConditions: ['只列品名，沒有期限。', '沒有設定補貨下限。', '動物食物被混入人類食物份數。'],
    relatedDrills: ['remote-7d'],
    relatedGap: '食物輪替缺口',
    xp: 35
  },
  {
    id: 'food-fridge-priority',
    title: '建立停電後冰箱食物處理順序',
    system: 'food',
    riskLevel: 4,
    estimatedMinutes: 25,
    purpose: '停電後先處理高風險食材，降低食安風險與浪費。',
    tools: ['冰箱', '紙筆', '保冷袋或冰磚清單'],
    steps: ['列出冷藏與冷凍食物。', '標記最容易腐敗的食材。', '設定停電後不頻繁開冰箱。', '安排優先食用或丟棄順序。', '寫下不可食用判斷。'],
    completion: '完成冰箱停電處理順序與丟棄標準。',
    failureConditions: ['把異味、膨包或溫度失控食物勉強食用。', '停電後頻繁開冰箱。', '沒有考慮冷藏藥品。'],
    relatedDrills: ['power-12h', 'coastal-typhoon'],
    relatedGap: '停電食物處理缺口',
    xp: 35
  },
  {
    id: 'power-12h-lighting-test',
    title: '測試 12 小時照明能力',
    system: 'power',
    riskLevel: 4,
    estimatedMinutes: 30,
    purpose: '確認夜間停電時有安全照明與動線，不依賴手機手電筒。',
    tools: ['手電筒', '頭燈', '電池', '夜間動線'],
    steps: ['集中所有照明設備。', '逐一開機測試。', '確認備用電池或充電狀態。', '在夜間動線放置照明。', '記錄可用設備與缺口。'],
    completion: '完成 12 小時照明設備測試與放置點。',
    failureConditions: ['只靠手機照明。', '沒有備用電池。', '使用高火災風險照明。'],
    relatedDrills: ['power-12h', 'family-72h'],
    relatedGap: '電力照明缺口',
    xp: 40
  },
  {
    id: 'power-charging-strategy',
    title: '建立手機與行動電源充電策略',
    system: 'power',
    riskLevel: 3,
    estimatedMinutes: 25,
    purpose: '確保斷電時通訊設備有明確充電順序與省電規則。',
    tools: ['手機', '行動電源', '充電線', '硬核計算器'],
    steps: ['列出所有手機與通訊設備。', '盤點行動電源容量。', '設定每日充電次數上限。', '啟用省電模式策略。', '固定充電線位置。'],
    completion: '完成斷電 72 小時充電策略。',
    failureConditions: ['行動電源未充滿。', '充電線分散找不到。', '沒有省電規則。'],
    relatedDrills: ['power-12h', 'remote-7d'],
    relatedGap: '通訊充電缺口',
    xp: 35
  },
  {
    id: 'power-paper-data-pack',
    title: '建立無網路紙本資料包',
    system: 'power',
    riskLevel: 4,
    estimatedMinutes: 40,
    purpose: '在無電、無網路、手機故障時仍能取得關鍵資訊。',
    tools: ['紙本資料夾', '筆', '地圖', '重要電話'],
    steps: ['列印或手寫重要聯絡人。', '準備住家周邊地圖。', '加入醫療、動物、撤離資訊。', '放入重要文件影本。', '放在固定防潮位置。'],
    completion: '完成一份無網路紙本資料包。',
    failureConditions: ['只存在手機內。', '資料未更新。', '包含敏感資訊但未妥善收納。'],
    relatedDrills: ['earthquake-72h', 'family-72h'],
    relatedGap: '無網路資料缺口',
    xp: 45
  },
  {
    id: 'medical-first-aid-kit',
    title: '建立家庭急救箱',
    system: 'medical',
    riskLevel: 5,
    estimatedMinutes: 35,
    purpose: '讓小外傷與等待救援期間有基本處置物資，但不替代醫療判斷。',
    tools: ['急救箱', '手套', '紗布', '生理食鹽水', '醫療膠帶'],
    steps: ['盤點現有急救用品。', '排除過期或污染品。', '補齊手套、紗布、繃帶、清潔用品。', '固定收納位置。', '標記下次檢查日期。'],
    completion: '完成急救箱清單、缺口與固定位置。',
    failureConditions: ['使用過期耗材。', '把急救箱放在兒童或動物可翻找位置。', '把任務內容當作醫療診斷。'],
    relatedDrills: ['earthquake-72h', 'family-72h'],
    relatedGap: '醫療急救缺口',
    xp: 45
  },
  {
    id: 'medical-medication-list',
    title: '建立常備藥與慢性病用藥清單',
    system: 'medical',
    riskLevel: 5,
    estimatedMinutes: 30,
    purpose: '避免補給中斷時遺漏關鍵用藥、劑量、期限與就醫資訊。',
    tools: ['藥袋', '處方資訊', '紙本卡片'],
    steps: ['列出所有常備藥與慢性病用藥。', '記錄用途、劑量、期限與開立院所。', '標記需要冷藏的藥品。', '建立補藥提前量。', '放入紙本資料包。'],
    completion: '完成常備藥與慢性病用藥清單。',
    failureConditions: ['自行調整處方。', '沒有保存期限。', '未標記冷藏藥品。'],
    relatedDrills: ['power-12h', 'remote-7d'],
    relatedGap: '常備藥缺口',
    xp: 45
  },
  {
    id: 'medical-remote-transfer-plan',
    title: '建立偏遠地區就醫與轉送計畫',
    system: 'medical',
    riskLevel: 5,
    estimatedMinutes: 45,
    purpose: '在交通中斷、夜間或天候惡化時，提前知道就醫與轉送選項。',
    tools: ['地圖', '醫療院所資訊', '緊急聯絡人'],
    steps: ['列出最近診所、急診與藥局。', '估算平時與惡劣天候車程。', '列出無法自行移動時的聯絡方式。', '設定停止自行移動條件。', '把資料放進紙本包。'],
    completion: '完成醫療就醫、轉送與停止移動條件表。',
    failureConditions: ['夜間或豪雨仍計畫冒險移動。', '沒有替代聯絡人。', '未考慮動物或小孩照護安排。'],
    relatedDrills: ['mountain-rain', 'remote-7d'],
    relatedGap: '醫療轉送缺口',
    xp: 50
  },
  {
    id: 'animal-7d-supply',
    title: '建立動物 7 天補給',
    system: 'animal',
    riskLevel: 4,
    estimatedMinutes: 30,
    purpose: '把動物飼料、飲水、墊料與藥物納入家庭補給，不讓牠們變成臨場缺口。',
    tools: ['飼料', '飲水估算', '藥物紀錄', '庫存頁'],
    steps: ['列出家中動物種類與數量。', '估算 7 天飼料與飲水。', '檢查藥物與墊料。', '標記保存期限。', '寫下補貨下限。'],
    completion: '完成動物 7 天補給清單與補貨下限。',
    failureConditions: ['只準備人類物資。', '不同物種混用食物或藥物。', '未納入飲水。'],
    relatedDrills: ['family-72h', 'remote-7d'],
    relatedGap: '動物補給缺口',
    xp: 40
  },
  {
    id: 'animal-evac-carrier',
    title: '建立動物撤離籠與轉送方案',
    system: 'animal',
    riskLevel: 5,
    estimatedMinutes: 35,
    purpose: '確認撤離時能安全移動動物，且有不能同行時的轉送備案。',
    tools: ['外出籠', '牽繩', '運輸袋', '可信任照護者名單'],
    steps: ['檢查外出籠尺寸與狀態。', '固定撤離用品位置。', '列出可短期照護的人。', '寫下動物不可前往地點限制。', '建立轉送聯絡流程。'],
    completion: '完成動物撤離籠檢查與轉送方案。',
    failureConditions: ['撤離籠尺寸不合。', '未考慮動物壓力與逃脫風險。', '沒有備援照護者。'],
    relatedDrills: ['typhoon-24h', 'earthquake-72h'],
    relatedGap: '動物撤離缺口',
    xp: 45
  },
  {
    id: 'animal-medical-card',
    title: '建立動物緊急醫療資訊卡',
    system: 'animal',
    riskLevel: 3,
    estimatedMinutes: 25,
    purpose: '讓獸醫或代照護者能快速知道物種、病史、用藥與禁忌。',
    tools: ['紙本卡片', '疫苗紀錄', '獸醫資訊'],
    steps: ['記錄每隻動物名字、物種、年齡。', '列出疾病、過敏與用藥。', '加入獸醫院與急診電話。', '附上飲食與照護禁忌。', '放入外出籠資料袋。'],
    completion: '完成每隻動物的緊急醫療資訊卡。',
    failureConditions: ['沒有用藥劑量或禁忌。', '只存在手機內。', '獸醫資訊過期。'],
    relatedDrills: ['family-72h', 'remote-7d'],
    relatedGap: '動物醫療資訊缺口',
    xp: 35
  },
  {
    id: 'terrain-mountain-rain-table',
    title: '建立山區豪雨撤離判斷表',
    system: 'terrain',
    riskLevel: 5,
    estimatedMinutes: 45,
    purpose: '用明確條件決定提前撤離或停止移動，避免在豪雨中冒險。',
    tools: ['地圖', '氣象警戒資訊', '紙本判斷表'],
    steps: ['確認土石流、落石或道路中斷資訊來源。', '列出主要與替代路線。', '設定提前撤離條件。', '設定夜間或豪雨停止移動條件。', '告知家人判斷表位置。'],
    completion: '完成山區豪雨撤離與停止移動判斷表。',
    failureConditions: ['把任務當成外出勘查。', '沒有停止條件。', '未確認替代道路。'],
    relatedDrills: ['mountain-rain'],
    relatedGap: '山區豪雨風險缺口',
    xp: 50
  },
  {
    id: 'terrain-coastal-typhoon-check',
    title: '建立海邊颱風暴潮檢查表',
    system: 'terrain',
    riskLevel: 5,
    estimatedMinutes: 40,
    purpose: '針對強風、暴潮、鹽害與冷藏食物處理建立提前檢查清單。',
    tools: ['潮汐資訊', '固定工具', '撤離路線'],
    steps: ['確認潮汐與暴潮資訊來源。', '列出強風固定項目。', '標記不可靠近海岸的警戒線。', '規劃冷藏食物處理順序。', '確認撤離路線與集合點。'],
    completion: '完成海邊颱風暴潮檢查表。',
    failureConditions: ['風雨中外出固定物品。', '靠近海岸、消波塊或浪區觀察。', '未處理鹽害與防潮。'],
    relatedDrills: ['coastal-typhoon', 'typhoon-24h'],
    relatedGap: '海邊颱風風險缺口',
    xp: 50
  },
  {
    id: 'terrain-flood-risk-map',
    title: '建立河邊或低窪地淹水風險圖',
    system: 'terrain',
    riskLevel: 5,
    estimatedMinutes: 40,
    purpose: '把低窪、排水、河岸與撤離方向畫出來，降低豪雨誤判。',
    tools: ['地圖', '紙筆', '地方淹水資訊'],
    steps: ['標出住家、低窪點與排水不良處。', '標出河岸、地下道或易淹道路。', '查詢地方淹水警戒資訊來源。', '畫出避開低窪的路線。', '設定不涉水通行原則。'],
    completion: '完成住家周邊淹水風險圖與避開路線。',
    failureConditions: ['把涉水通行列為可接受方案。', '只靠記憶沒有圖。', '未設定撤離方向。'],
    relatedDrills: ['typhoon-24h'],
    relatedGap: '淹水風險缺口',
    xp: 50
  },
  {
    id: 'evac-family-rally-points',
    title: '建立家庭集合點',
    system: 'evacuation',
    riskLevel: 4,
    estimatedMinutes: 30,
    purpose: '在通訊失效或家人分散時，仍有固定集合與備援地點。',
    tools: ['地圖', '紙本聯絡卡', '家人共識'],
    steps: ['設定住家附近集合點。', '設定跨區備援集合點。', '寫下到達條件與等待時間。', '把地點寫進紙本卡。', '讓家人確認。'],
    completion: '完成家庭主要與備援集合點紀錄。',
    failureConditions: ['集合點在危險區。', '只有一個集合點。', '家人未確認。'],
    relatedDrills: ['earthquake-72h', 'family-72h'],
    relatedGap: '家庭集合缺口',
    xp: 40
  },
  {
    id: 'evac-bag-weight-check',
    title: '建立撤離包重量檢查',
    system: 'evacuation',
    riskLevel: 4,
    estimatedMinutes: 25,
    purpose: '確認撤離包重量不會讓移動能力崩潰，尤其有小孩或動物時。',
    tools: ['體重計', '撤離包', '硬核計算器'],
    steps: ['量測使用者體重。', '量測撤離包重量。', '計算負重比例。', '標記必需與可移除物品。', '重新打包並記錄重量。'],
    completion: '完成撤離包重量比例與調整紀錄。',
    failureConditions: ['超過 20% 仍當作可接受。', '未考慮抱小孩或動物。', '只看物品完整，不看機動性。'],
    relatedDrills: ['family-72h', 'mountain-rain'],
    relatedGap: '撤離機動性缺口',
    xp: 40
  },
  {
    id: 'evac-documents-cash-pack',
    title: '建立重要文件與現金包',
    system: 'evacuation',
    riskLevel: 4,
    estimatedMinutes: 35,
    purpose: '在斷電、無網路或撤離時保留身分、醫療、保險與基本支付能力。',
    tools: ['防水袋', '文件影本', '現金', '紙本清單'],
    steps: ['整理身分、保險、醫療與住家文件影本。', '準備小額現金。', '加入家人與動物資訊卡。', '放入防水袋。', '設定每季檢查。'],
    completion: '完成重要文件與現金包。',
    failureConditions: ['只存在雲端。', '沒有防水保護。', '放置位置無人知道。'],
    relatedDrills: ['typhoon-24h', 'earthquake-72h', 'remote-7d'],
    relatedGap: '文件與現金缺口',
    xp: 45
  },
  {
    id: 'longterm-food-production-log',
    title: '建立基礎食物生產紀錄',
    system: 'longterm',
    riskLevel: 2,
    estimatedMinutes: 30,
    purpose: '把種植從興趣變成可追蹤的食物生產能力。',
    tools: ['種植紀錄', '盆器或菜畦', '日期標籤'],
    steps: ['選擇蔥、九層塔、薄荷或地瓜葉等低門檻植物。', '記錄位置、日照與種植日期。', '設定澆水與觀察頻率。', '記錄第一次收成或失敗原因。', '決定下一個改善項。'],
    completion: '完成至少一筆可食植物生產紀錄。',
    failureConditions: ['採食不明植物。', '沒有日期與位置紀錄。', '把一次失敗當作系統失敗。'],
    relatedDrills: [],
    relatedGap: '食物生產缺口',
    xp: 30
  },
  {
    id: 'longterm-tools-repair-list',
    title: '建立工具與修繕清單',
    system: 'longterm',
    riskLevel: 3,
    estimatedMinutes: 35,
    purpose: '確認家庭有基礎修繕能力，但不碰高風險電力、瓦斯或結構作業。',
    tools: ['工具箱', '手套', '標籤', '修繕紀錄'],
    steps: ['盤點螺絲起子、鉗子、膠帶、束帶、手套。', '標記損壞、生鏽或缺電池工具。', '列出可自行處理的小修繕。', '列出必須找專業者的項目。', '設定工具固定位置。'],
    completion: '完成工具盤點、缺口與不可自行處理清單。',
    failureConditions: ['嘗試高風險電力、瓦斯或結構維修。', '尖銳工具未安全收納。', '沒有專業支援清單。'],
    relatedDrills: ['typhoon-24h'],
    relatedGap: '修繕工具缺口',
    xp: 35
  },
  {
    id: 'longterm-30d-improvement-plan',
    title: '建立 30 天補給改善計畫',
    system: 'longterm',
    riskLevel: 3,
    estimatedMinutes: 30,
    purpose: '把水、食物、電力、醫療與撤離缺口排成 30 天內可完成的改善序列。',
    tools: ['任務紀錄', '庫存摘要', '備災清單'],
    steps: ['列出目前三個最高缺口。', '每個缺口指定一個可驗證行動。', '安排每週檢查點。', '設定不購買也能完成的改善項。', '月底回顧結果。'],
    completion: '完成一份 30 天補給改善計畫。',
    failureConditions: ['同時開太多目標。', '只列購物清單沒有驗證行動。', '沒有回顧日期。'],
    relatedDrills: ['family-72h', 'remote-7d'],
    relatedGap: '長期改善缺口',
    xp: 35
  }
]

export function getCompletedMap(completed = {}) {
  if (Array.isArray(completed)) {
    return completed.reduce((map, item) => {
      if (typeof item === 'string') map[item] = true
      if (item?.id) map[item.id] = true
      if (item?.taskId) map[item.taskId] = true
      return map
    }, {})
  }

  if (completed && typeof completed === 'object') return completed
  return {}
}

export function isTaskCompleted(completed, taskId) {
  return Boolean(getCompletedMap(completed)[taskId])
}

export function getRecommendedTask(tasks = missionTasks, state = {}) {
  const completed = getCompletedMap(state.completed)
  const preparedness = state.preparedness || {}
  const unfinished = (task) => task && !completed[task.id]
  const firstUnfinished = (system) => tasks.find((task) => task.system === system && unfinished(task))

  const rules = [
    [!preparedness.water, 'water', '飲水準備缺口', '先建立最低飲水線，其他補給才有意義。'],
    [!preparedness.food, 'food', '食物準備缺口', '補給中斷時，免冷藏食物是 72 小時核心。'],
    [!(preparedness.light && preparedness.power), 'power', '電力照明缺口', '先確認夜間照明、通訊與充電能力。'],
    [!(preparedness.firstaid || preparedness.medicine), 'medical', '醫療急救缺口', '等待醫療協助前，家庭急救與用藥資料必須可用。'],
    [!preparedness.animals, 'animal', '動物照護缺口', '動物補給與撤離不能到最後一刻才處理。'],
    [!(preparedness.contacts && preparedness.documents), 'evacuation', '撤離規劃缺口', '無網路或撤離時，紙本聯絡與文件會直接影響決策。']
  ]

  for (const [condition, system, gap, reason] of rules) {
    if (condition) {
      const task = firstUnfinished(system)
      if (task) return { task, gap, reason }
    }
  }

  const task = [...tasks].filter(unfinished).sort((a, b) => b.riskLevel - a.riskLevel || b.xp - a.xp)[0]
  return task ? { task, gap: task.relatedGap, reason: '核心缺口已處理，轉入最高風險項目壓力測試。' } : null
}

export function getTasks() {
  return missionTasks
}
