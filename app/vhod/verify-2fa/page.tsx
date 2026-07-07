"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Loader2, KeyRound, ArrowRight } from "lucide-react"
import { SitePageShell } from "@/components/site-page-shell"
import { createOptionalClient } from "@/lib/supabase/client"

export default function Verify2FAPage() {
  const router = useRouter()
  const supabase = useMemo(() => createOptionalClient(), [])
  const [code, setCode] = useState("")
  const [factorId, setFactorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      setError("Липсва Supabase конфигурация.")
      return
    }
    ;(async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!aal || aal.currentLevel === "aal2") {
        router.replace("/")
        return
      }
      const { data, error: listError } = await supabase.auth.mfa.listFactors()
      if (listError || !data) {
        setError(listError?.message ?? "Грешка при проверка на 2FA.")
        setIsLoading(false)
        return
      }
      const totpFactor = data.all?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      )
      if (!totpFactor) {
        router.replace("/")
        return
      }
      setFactorId(totpFactor.id)
      setIsLoading(false)
    })()
  }, [supabase, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !factorId || code.length !== 6) return
    setIsVerifying(true)
    setError(null)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })
    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Грешка при създаване на challenge.")
      setIsVerifying(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    if (verifyError) {
      setError(verifyError.message)
      setIsVerifying(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  if (isLoading) {
    return (
      <SitePageShell maxWidth="xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-teal-600" />
          <p className="mt-4 text-slate-500">Проверка на 2FA статус...</p>
        </div>
      </SitePageShell>
    )
  }

  return (
    <SitePageShell maxWidth="xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 mb-6 border border-teal-200 dark:border-teal-800">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white mb-2">
              Двуфакторна автентикация
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Въведете 6-цифрения код от вашето приложение за автентикация.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl text-sm bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isVerifying}
                className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={code.length !== 6 || isVerifying}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isVerifying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Потвърди
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </SitePageShell>
  )
}
