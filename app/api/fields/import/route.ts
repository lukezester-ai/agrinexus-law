import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { fields } from '@/lib/db/schema/fields';
import { resolveTenantId } from '@/lib/db/tenant-context';

function computeCentroid(coordinates: number[][][]): { lat: number; lng: number } {
  let lat = 0, lng = 0, count = 0;
  const ring = (coordinates[0] || coordinates) as number[][];
  for (const pt of ring) {
    lng += pt[0]; lat += pt[1]; count++;
  }
  return { lat: lat / count, lng: lng / count };
}

function geoArea(coords: number[][][]): number {
  const ring = coords[0];
  if (!ring || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += Number(ring[i][0]) * Number(ring[j][1]);
    area -= Number(ring[j][0]) * Number(ring[i][1]);
  }
  area = Math.abs(area) / 2;
  return area;
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { features } = await req.json();

    if (!features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json({ error: 'Няма данни за импорт' }, { status: 400 });
    }

    const { db } = getDb();
    let imported = 0;

    for (const feature of features) {
      const props = feature.properties || {};
      const geom = feature.geometry;

      if (!geom || geom.type !== 'Polygon') continue;

      const coords = geom.coordinates;
      const areaDeg = geoArea(coords);
      const areaDecares = areaDeg * 12396; // rough sq-degrees to decares
      const centroid = computeCentroid(coords);

      const name = props.NAME || props.name || props.ИМЕ || props.Name || `Парцел ${imported + 1}`;
      const crop = props.CROP || props.crop || props.КУЛТУРА || null;
      const cadastralId = props.CADASTRAL_ID || props.cadastral_id || null;

      await db.insert(fields).values({
        tenantId,
        name: String(name).slice(0, 255),
        areaDecares: String(Math.round(areaDecares * 100) / 100),
        cadastralId: cadastralId ? String(cadastralId) : null,
        crop: crop ? String(crop) : null,
        geometry: geom,
        centroid,
        ownershipType: 'own',
      });

      imported++;
    }

    return NextResponse.json({ imported, message: `Импортирани ${imported} парцела` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
