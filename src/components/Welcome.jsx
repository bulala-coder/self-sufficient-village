import React from 'react'
import { Sprout } from 'lucide-react'

export default function Welcome({onStart}){
  return <div className="min-h-screen ink-page flex items-center justify-center px-4 py-10">
    <div className="shanshui-hero card max-w-4xl w-full p-8 md:p-12">
      <div className="mountain-range" />
      <div className="river-wash" />
      <div className="ink-birds">⌁⌁⌁</div>
      <div className="ink-boat">𓊝</div>
      <div className="relative z-10 max-w-2xl">
        <div className="ink-logo w-16 h-16 rounded-3xl grid place-items-center"><Sprout size={34}/></div>
        <p className="brush-chip mt-8">Fortress OS</p>
        <h1 className="text-5xl md:text-7xl font-black text-[#171f1b] mt-6 leading-tight tracking-widest">自足堡壘</h1>
        <p className="text-xl md:text-2xl text-[#735d43] mt-4 font-semibold">家庭韌性、補給中斷與自給生存管理系統</p>
        <p className="text-2xl md:text-3xl text-[#251c16] mt-8 font-black leading-relaxed">建立家庭韌性、補給盤點與風險應對能力。</p>
        <p className="text-[#6f5b43] mt-5 leading-8 text-lg font-semibold">依你的生活地形，建立種植、食物保存、水與能源、健康急救、動物照護與風險應對能力。</p>
        <div className="flex items-center gap-5 mt-9">
          <button className="brush-button" onClick={onStart}>開始建立我的自足堡壘</button>
          <div className="red-seal text-[12px]">堡壘<br/>系統</div>
        </div>
      </div>
    </div>
  </div>
}
