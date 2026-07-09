import React, { useState } from 'react'
import { routeLabels } from '../data/routes.js'
const answers = {
  balcony: '你現在不需要土地。先從蔥、豆芽、香草、三天備用食物和用水紀錄開始。重點不是產量，而是建立照顧生活的手感。',
  mountain: '山區生活要先看天氣、水源、坡度、道路與通訊。不要急著整地，先畫撤離路線、確認雨具保暖、記錄雨後積水與沖刷。',
  coastal: '海邊生活要優先處理強風、鹽害、淡水、防鏽與颱風。種植建議先用容器，放在避風、有日照且排水安全的位置。',
  health: '急救箱不是取代醫療，而是讓你在等待專業協助前能做基本準備。先準備生理食鹽水、紗布、繃帶、手套、體溫計、緊急聯絡資訊。',
  score: '想提升自足度，先補三件事：完成更多任務、寫下實作日誌、補齊健康急救與地形風險準備。每天一小步就夠。'
}
export default function VillageElder({state}){ const [msg,setMsg]=useState(''); const [reply,setReply]=useState(''); function ask(key){setMsg(key); setReply(answers[key])} return <div className="grid lg:grid-cols-3 gap-5"><section className="card p-6 lg:col-span-2"><span className="badge">AI 村長模擬版</span><h1 className="text-2xl font-black text-bark mt-3">先用預設回答，不花 API 費</h1><p className="text-soil/75 mt-2">你的目前路線：{routeLabels[state.routeType]}</p><div className="grid sm:grid-cols-2 gap-3 mt-6"><Q onClick={()=>ask('balcony')} text="我只有陽台，可以開始什麼？"/><Q onClick={()=>ask('mountain')} text="我住山區，要注意什麼？"/><Q onClick={()=>ask('coastal')} text="我住海邊，要注意什麼？"/><Q onClick={()=>ask('health')} text="我想建立家庭急救箱"/><Q onClick={()=>ask('score')} text="我想提升自足度"/></div>{reply&&<div className="mt-6 bg-cream rounded-3xl p-5"><p className="text-sm text-soil/60 mb-2">你問：{msg}</p><h2 className="font-black text-bark">村長回答</h2><p className="text-soil/85 leading-8 mt-2">{reply}</p><p className="text-sm text-red-800 bg-red-50 rounded-2xl p-3 mt-4">安全提醒：本 App 不提供醫療診斷、獸醫診斷、用藥指示、野外植物可食判斷或高風險操作。</p></div>}</section><aside className="card p-6"><h2 className="font-black text-bark text-xl">之後可升級</h2><p className="text-soil/80 leading-7 mt-3">未來可以接真正 AI API，讓村長根據你的日誌、任務、地形與目標產生個人化 90 天計畫。</p></aside></div>}
function Q({text,onClick}){return <button onClick={onClick} className="text-left bg-white/70 hover:bg-cream rounded-2xl p-4 border border-soil/10 font-semibold text-bark">{text}</button>}
