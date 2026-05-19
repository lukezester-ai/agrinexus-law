# GitHub и Vercel

| | |
|---|---|
| **Git repo** | [lukezester-ai/agrinexus-law](https://github.com/lukezester-ai/agrinexus-law) |
| **Vercel team** | `roxsonltd-droid` → проект `agrinexus-mvp` |
| **Production** | https://www.agrinexuslaw.com |

## Remote (Git)

```bash
git remote set-url origin https://github.com/lukezester-ai/agrinexus-law.git
git remote -v
```

Под `roxsonltd-droid` в GitHub **няма** `agrinexus-mvp` — deploy-ът в Vercel е свързан с repo-то по-горе.

## Първо качване (ако repo още няма)

В папката на проекта:

```powershell
cd "C:\Users\expre\OneDrive\Desktop\agrinexus-mvp"
git remote set-url origin https://github.com/lukezester-ai/agrinexus-law.git
git push -u origin fix/live-stats-cleanup-app
```

## Production (след merge)

```powershell
git checkout main
git merge fix/live-stats-cleanup-app
git push origin main
```

Vercel (**roxsonltd-droid** → проект `agrinexus-mvp`) deploy-ва от свързания branch.

## Проверка

- Vercel: `agrinexus-mvp` под team **roxsonltd-droid**
- Домейн: `www.agrinexuslaw.com`
- Локално: `npm run check:rag:local`, `npm run reindex:direct`
