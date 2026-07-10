'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface AttackType {
    id: string;
    timestamp: number;
    type: string;
    color: string;
    value: number;
    src: { lat: number; lng: number; country: string };
    dst: { lat: number; lng: number; country: string };
}

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface GlobeVizProps {
    attacks: AttackType[];
}

export default function GlobeViz({ attacks }: GlobeVizProps) {
    const globeEl = useRef<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.3; // Slower rotation for better visibility
        }
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 z-0 select-none bg-black">
            <Globe
                ref={globeEl}
                // Visuals - High contrast dark earth to make attacks pop
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                atmosphereColor="#3a228a"
                atmosphereAltitude={0.15} // Crisper edge

                // Hex Density Visualization (Kept as it's static and efficient)
                hexBinPointsData={attacks.map(a => a.src)}
                hexBinPointWeight={1}
                hexBinResolution={4}
                hexBinMerge={true}
                hexAltitude={0.1}
                hexTopColor={() => '#222'}
                hexSideColor={() => '#111'}

                // BEACONS (Cleaner Points)
                pointsData={attacks}
                pointLat={(d: any) => d.dst.lat}
                pointLng={(d: any) => d.dst.lng}
                pointColor={(d: any) => d.color}
                pointAltitude={0.01}
                pointRadius={0.5} // Sharper dot

                // Pulse effect via Rings (Meaningful impact)
                // Rings originate at destination. Only show rings for recent attacks (last 3 seconds) to create a meaningful "impact" effect instead of infinite pulsing
                ringsData={attacks.filter(a => Date.now() - a.timestamp < 3000)}
                ringLat={(d: any) => d.dst.lat}
                ringLng={(d: any) => d.dst.lng}
                ringColor={(d: any) => d.color}
                ringMaxRadius={(d: any) => d.value * 0.6} // Larger impact for higher intensity
                ringPropagationSpeed={(d: any) => (d.value > 5 ? 5 : 2)} // Faster ripple for heavy attacks
                ringRepeatPeriod={800}

                // ARCS (Tactical / Laser look)
                // Fading arcs show exactly where the attack comes from (transparent) and goes to (solid)
                arcsData={attacks}
                arcStartLat={(d: any) => d.src.lat}
                arcStartLng={(d: any) => d.src.lng}
                arcEndLat={(d: any) => d.dst.lat}
                arcEndLng={(d: any) => d.dst.lng}
                arcColor={(d: any) => ['rgba(255,255,255,0)', d.color]} // Fade in direction of travel
                arcDashLength={0.4} // Longer dashes show direction better
                arcDashGap={0.2} 
                arcDashAnimateTime={1200} // Smooth flow
                arcStroke={0.5} // Thicker lines for visibility
            />
        </div>
    );
}
