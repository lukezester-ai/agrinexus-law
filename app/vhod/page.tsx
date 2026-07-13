"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Leaf, Mail, Lock, Loader2 } from 'lucide-react'
import { SitePageShell } from '@/components/site-page-shell'
import { createOptionalClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  const router = useRouter()
  const [nextPath, setNextPath] = useState('/')
  const supabase = useMemo(() => createOptionalClient(), [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next')
    if (next?.startsWith('/')) setNextPath(next)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!supabase) {
      setError('Входът не е конфигуриран (липсват Supabase настройки). Свържете NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY във Vercel.')
      setIsLoading(false)
      return
    }

    try {
      if (view === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error) throw error

        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal?.nextLevel === 'aal2') {
          router.push('/vhod/verify-2fa')
        } else {
          router.push(nextPath.startsWith('/') ? nextPath : '/')
        }
        router.refresh()
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }).catch(() => {})
        setView('sign-in')
        setError('Успешна регистрация! Моля, влезте в профила си (или потвърдете имейла си, ако се изисква).')
      }
    } catch (err: any) {
      console.error('[auth]', err)
      // Превод на най-честите грешки от Supabase
      let msg = err?.message || 'Възникна грешка.'
      if (msg.includes('Failed to fetch') || err?.name === 'TypeError') {
        msg = 'Не успяхме да се свържем със Supabase Auth. Проверете интернет връзката, production env настройките във Vercel и дали браузърът/разширение не блокира заявката.'
      } else if (msg.includes('rate limit')) msg = 'Твърде много опити. Моля, изчакайте малко и опитайте отново.'
      else if (msg.includes('User already registered')) msg = 'Този имейл вече е регистриран. Моля, влезте в профила си.'
      else if (msg.includes('Password should be at least')) msg = 'Паролата трябва да съдържа поне 6 символа.'
      else if (msg.includes('Invalid login credentials')) msg = 'Грешен имейл или парола.'
      else if (msg.includes('Email link is invalid or has expired')) msg = 'Линкът за потвърждение е невалиден или е изтекъл.'

      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SitePageShell maxWidth="xl">
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-white mb-6 shadow-lg shadow-emerald-500/25 animate-float">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600 mb-3">
              {view === 'sign-in' ? 'Добре дошли в AgriNexus' : 'Създайте агро профил'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-base leading-relaxed">
              {view === 'sign-in' 
                ? 'Влезте, за да получите достъп до вашите данни, стопанство и AI асистент.' 
                : 'Присъединете се към бъдещето на интелигентното земеделие с AgriNexus.'}
            </p>
          </div>

          <div className="glass-panel-pro p-8 sm:p-10 rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.2),0_10px_30px_-10px_rgba(217,70,239,0.15)] backdrop-blur-2xl transition-all">
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Имейл адрес
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    placeholder="vasil@ferma.bg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Парола
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className={`p-4 rounded-2xl text-sm font-medium ${error.includes('Успешна') ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200 border border-red-300 dark:border-red-800'}`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 hover:opacity-95 text-white rounded-2xl font-extrabold text-base transition-all shadow-lg shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>{view === 'sign-in' ? 'Влез в профила' : 'Създай профил'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {view === 'sign-in' ? 'Нямате профил в AgriNexus?' : 'Вече имате агро профил?'}
                <button
                  type="button"
                  onClick={() => setView(view === 'sign-in' ? 'sign-up' : 'sign-in')}
                  className="ml-2 font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline focus:outline-none transition-colors"
                >
                  {view === 'sign-in' ? 'Регистрирайте се тук' : 'Влезте от тук'}
                </button>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500">
            Продължавайки, вие се съгласявате с нашите{' '}
            <Link href="/terms" className="underline hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Общи условия</Link>{' '}
            и{' '}
            <Link href="/privacy" className="underline hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Политика за поверителност</Link>.
          </div>
        </div>
      </div>
    </SitePageShell>
  )
}
