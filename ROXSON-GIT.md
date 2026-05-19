# GitHub — Roxson (`roxsonltd-droid`)

Официалният remote е **Roxson**, не `lukezester-ai`.

## Remote

```bash
git remote set-url origin https://github.com/roxsonltd-droid/agrinexus-mvp.git
git remote -v
```

Ако репото в GitHub се казва друго (напр. `agrinexus-law`), смени URL-а съответно.

## Първо качване (ако repo още няма)

1. GitHub → org **roxsonltd-droid** → **New repository**
2. Име: `agrinexus-mvp` (или както е вързано в Vercel)
3. Private, без README
4. В папката на проекта:

```powershell
cd "C:\Users\expre\OneDrive\Desktop\agrinexus-mvp"
git remote set-url origin https://github.com/roxsonltd-droid/agrinexus-mvp.git
git push -u origin fix/live-stats-cleanup-app
git push -u origin main
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
