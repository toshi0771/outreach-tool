'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Globe, FileText, CheckSquare,
  Send, History, Settings, LogOut, Menu, SearchCheck
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/collect', label: 'サイト収集', icon: SearchCheck },
  { href: '/sites', label: 'サイト管理', icon: Globe },
  { href: '/templates', label: 'テンプレート', icon: FileText },
  { href: '/batch', label: 'バッチ承認', icon: CheckSquare },
  { href: '/queue', label: '送信キュー', icon: Send },
  { href: '/history', label: '送信履歴', icon: History },
  { href: '/settings', label: '設定', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-[#1F4E79] text-white flex flex-col transition-all duration-200 shrink-0`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        {!collapsed && (
          <span className="font-bold text-sm leading-tight">フォーム<br/>アプローチ</span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-blue-700">
          <Menu size={18} />
        </button>
      </div>

      {/* ナビ */}
      <nav className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors
                ${active ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* ユーザー情報 */}
      {session && (
        <div className="p-4 border-t border-blue-700">
          {!collapsed && (
            <p className="text-xs text-blue-200 mb-2 truncate">{session.user?.email}</p>
          )}
          <button onClick={() => signOut()}
            className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors">
            <LogOut size={16} />
            {!collapsed && 'ログアウト'}
          </button>
        </div>
      )}
    </aside>
  )
}
