"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Leaf, Mail, Lock, Loader2 } from 'lucide-react'
import { SitePageShell } from '@/components/site-page-shell'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  const router = useRouter()
  const [nextPath, setNextPath] = useState('/')
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next')
    if (next?.startsWith('/')) setNextPath(next)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (view === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error) throw error
        router.push(nextPath.startsWith('/') ? nextPath : '/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
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
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 mb-6 border border-teal-200 dark:border-teal-800">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-white mb-3">
              {view === 'sign-in' ? 'Добре дошли отново' : 'Създайте профил'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {view === 'sign-in' 
                ? 'Влезте, за да получите достъп до вашите данни и персонализирани изчисления.' 
                : 'Присъединете се към бъдещето на земеделието с AgriNexus.'}
            </p>
          </div>

          <div className="surface-card p-6 sm:p-8 rounded-3xl border shadow-xl shadow-teal-900/5">
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Имейл адрес
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    placeholder="vasil@ferma.bg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Парола
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className={`p-3 rounded-xl text-sm ${error.includes('Успешна') ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {view === 'sign-in' ? 'Влез в профила' : 'Регистрация'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {view === 'sign-in' ? 'Нямате профил?' : 'Вече имате профил?'}
                <button
                  type="button"
                  onClick={() => setView(view === 'sign-in' ? 'sign-up' : 'sign-in')}
                  className="ml-2 font-medium text-teal-600 dark:text-teal-400 hover:underline focus:outline-none"
                >
                  {view === 'sign-in' ? 'Създайте тук' : 'Влезте тук'}
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
