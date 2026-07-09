export const routeLabels = {
  balcony_beginner: '城市陽台路線',
  rural_beginner: '平地農村路線',
  mountain_living: '山區生活路線',
  coastal_living: '海邊生活路線',
  riverside_valley: '河邊／溪谷路線',
  island_resilience: '離島韌性路線',
  family_nature_education: '親子自然教育路線'
}

export const routeDescriptions = {
  balcony_beginner: '從窗邊、陽台、盆栽、豆芽與家庭備災開始，建立低門檻自足能力。',
  rural_beginner: '以菜園、工具、堆肥、食物保存與水源備援為核心，建立平地農村生活基礎。',
  mountain_living: '優先學習山區天氣、水源、坡地、低溫、交通中斷與土石流風險。',
  coastal_living: '優先學習潮汐、強風、鹽害、防鏽、淡水儲備、颱風與海邊安全。',
  riverside_valley: '優先學習溪水暴漲、淹水、排水、防蚊、防潮、水源污染與撤離路線。',
  island_resilience: '優先學習物資、淡水、能源、船班中斷、醫療距離、強風鹽害與社區互助。',
  family_nature_education: '以親子安全任務、自然觀察、食物來源、豆芽、香草與家庭急救為核心。'
}

export function decideRoute(profile) {
  if (profile.goal === '親子自然教育') return 'family_nature_education'
  if (profile.terrain === '山區') return 'mountain_living'
  if (profile.terrain === '海邊') return 'coastal_living'
  if (profile.terrain === '河邊／溪谷') return 'riverside_valley'
  if (profile.terrain === '離島') return 'island_resilience'
  if (profile.space === '庭院' || profile.space === '農地') return 'rural_beginner'
  return 'balcony_beginner'
}
