"use client"

import { useCallback, useEffect, useState } from "react"
import { Shield, ShieldCheck, Smartphone, KeyRound, Loader2, QrCode, Check, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type MfaState =
  | { phase: "idle"; factors: { id: string; factor_type: string; status: string }[] }
  | { phase: "loading" }
  | { phase: "enrolling"; qrCode: string; secret: string; factorId: string }
  | { phase: "verifying"; factorId: string }
  | { phase: "error"; message: string }
  | { phase: "success"; message: string }

export default function TwoFactorSetup() {
  const [state, setState] = useState<MfaState>({ phase: "loading" })
  const [code, setCode] = useState("")

  const supabase = createClient()

  const refresh = useCallback(async () => {
    setState({ phase: "loading" })
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setState({ phase: "error", message: error.message })
      return
    }
    const verified = data.all?.filter((f) => f.status === "verified") ?? []
    setState({ phase: "idle", factors: verified })
  }, [supabase])

  useEffect(() => { refresh() }, [refresh])

  const handleEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "AgriNexus",
      friendlyName: "Authenticator App",
    })
    if (error || !data) {
      setState({ phase: "error", message: error?.message ?? "Неуспешно включване на 2FA." })
      return
    }
    setState({
      phase: "enrolling",
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    })
    setCode("")
  }

  const handleVerify = async () => {
    if (state.phase !== "enrolling") return
    const factorId = state.factorId
    setState({ phase: "verifying", factorId })
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })
    if (challengeError || !challenge) {
      setState({ phase: "error", message: challengeError?.message ?? "Грешка при създаване на challenge." })
      return
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    if (verifyError) {
      setState({ phase: "error", message: verifyError.message })
      return
    }
    setState({ phase: "success", message: "Двуфакторната автентикация е включена успешно!" })
    setTimeout(() => refresh(), 1500)
  }

  const handleDisable = async () => {
    if (state.phase !== "idle" || state.factors.length === 0) return
    for (const factor of state.factors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }
    setState({ phase: "success", message: "Двуфакторната автентикация е изключена." })
    setTimeout(() => refresh(), 1500)
  }

  const supabaseAvailable = typeof window !== "undefined" && !!supabase

  if (!supabaseAvailable) return null

  if (state.phase === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Зареждане на 2FA настройки...
      </div>
    )
  }

  if (state.phase === "enrolling") {
    return (
      <div className="space-y-4 p-6 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-medium">
          <Smartphone size={20} />
          Настройка на двуфакторна автентикация
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Сканирайте QR кода с вашето приложение за автентикация (Google Authenticator, Authy, 1Password и др.):
        </p>
        <div className="flex justify-center">
          <div
            className="w-48 h-48 rounded-xl border border-teal-200 dark:border-teal-700 bg-white dark:bg-slate-900 p-2"
            dangerouslySetInnerHTML={{ __html: state.qrCode }}
          />
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Или въведете ръчно този ключ:</p>
          <code className="inline-block px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono select-all">
            {state.secret}
          </code>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Въведете 6-цифрения код от приложението:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="flex-1 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="000000"
            />
            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <KeyRound size={18} />
              Потвърди
            </button>
          </div>
        </div>
        <button onClick={() => refresh()} className="text-xs text-slate-500 hover:underline">Отказ</button>
      </div>
    )
  }

  if (state.phase === "verifying") {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
        <Loader2 size={16} className="animate-spin" />
        Проверка на кода...
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl text-sm bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
          {state.message}
        </div>
        <button onClick={refresh} className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
          Опитайте отново
        </button>
      </div>
    )
  }

  if (state.phase === "success") {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl text-sm bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-2">
          <Check size={16} />
          {state.message}
        </div>
      </div>
    )
  }

  const hasMfa = state.factors.some(f => f.status === "verified")

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasMfa ? (
            <ShieldCheck size={20} className="text-teal-600 dark:text-teal-400" />
          ) : (
            <Shield size={20} className="text-slate-400" />
          )}
          <span className="font-medium text-slate-900 dark:text-white">Двуфакторна автентикация (TOTP)</span>
        </div>
        {hasMfa && (
          <button
            onClick={handleDisable}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
          >
            <Trash2 size={14} />
            Изключи
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {hasMfa
          ? "Двуфакторната автентикация е активна. При всяко влизане ще се изисква код от вашето приложение за автентикация."
          : "Добавете допълнително ниво на сигурност. Ще ви трябва приложение за автентикация (Google Authenticator, Authy, 1Password)."}
      </p>
      {!hasMfa && (
        <button onClick={handleEnroll} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
          <QrCode size={16} />
          Включване на 2FA
        </button>
      )}
    </div>
  )
}
