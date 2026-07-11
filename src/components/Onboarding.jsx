import React, { useState } from 'react'
const questions = [
  ['living','你目前住在哪裡？',['都市公寓','郊區住宅','鄉下住宅','農地／農場','離島','其他']],
  ['terrain','你主要想學習的生活地形是哪一種？',['城市陽台','平地農村','山區','海邊','河邊／溪谷','離島','還不確定']],
  ['space','你有可種植空間嗎？',['沒有','窗邊','陽台','庭院','農地']],
  ['time','你每週可以投入多少時間？',['少於 1 小時','1–3 小時','3–7 小時','7 小時以上']],
  ['goal','你目前最想達成什麼？',['學會種菜','增加生活安全感','未來搬去鄉下','親子自然教育','學會食物保存','建立半自給生活','學會山區／海邊生活應對','建立家庭急救與備災能力']],
  ['animal','你對動物照護有興趣嗎？',['沒有','有一點','想學雞鴨兔等小型農村動物','未來想實際飼養']],
  ['health','你希望包含健康與急救學習嗎？',['不需要','只要基礎急救箱','想學家庭急救與就醫判斷','想學人與動物的基礎急救準備']],
  ['budget','你目前的預算？',['幾乎不花錢','1,000 元以內','1,000–5,000 元','5,000 元以上']],
  ['experience','你目前的經驗？',['完全新手','種過盆栽','種過菜','有農村生活經驗','已經在實踐半自足生活']],
  ['risk','你最擔心的風險是什麼？',['食物不足','停水','停電','颱風','山區災害','海邊風浪','動物生病','家人健康','不知道怎麼開始']]
]
export default function Onboarding({ onFinish }){
  const [answers,setAnswers]=useState({})
  const done=questions.every(([k])=>answers[k])
  return <div className="min-h-screen px-4 py-8"><div className="max-w-3xl mx-auto card p-6 md:p-8"><span className="badge">環境建檔</span><h1 className="text-3xl font-black text-bark mt-3">先了解你的生活情境</h1><p className="text-soil/75 mt-2">回答後，系統會分配你的自足學習路線。</p><div className="mt-6 space-y-6">{questions.map(([key,q,opts],idx)=><div key={key}><h2 className="font-bold text-bark mb-3">{idx+1}. {q}</h2><div className="grid sm:grid-cols-2 gap-2">{opts.map(opt=><button key={opt} onClick={()=>setAnswers({...answers,[key]:opt})} className={`text-left rounded-2xl px-4 py-3 border transition ${answers[key]===opt?'bg-moss text-white border-moss':'bg-white/70 border-soil/10 hover:bg-cream'}`}>{opt}</button>)}</div></div>)}</div><button disabled={!done} onClick={()=>onFinish(answers)} className={`mt-8 w-full ${done?'btn-primary':'px-5 py-3 rounded-2xl bg-soil/20 text-soil/50 cursor-not-allowed'}`}>完成建檔，進入自足堡壘</button></div></div>
}
